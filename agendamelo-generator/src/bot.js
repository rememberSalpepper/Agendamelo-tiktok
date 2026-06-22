// Bot de control Agendamelo: escucha comandos (solo de tu chat) y maneja todo el pipeline.
// Comandos: /ayuda /estado /generar [N] /enviar [N] /siguiente /borrar <id>
//
// Requiere: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID (tu chat).  Opcional: AGENDAMELO_ALLOWED_CHATS.
// Modo test (sin Telegram):  node src/bot.js test /estado

import './env.js';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCaption } from './caption.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CSV = process.env.AGENDAMELO_CSV || join(ROOT, '..', 'agendamelo_ideas.csv');
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API = `https://api.telegram.org/bot${TOKEN}`;
const ALLOWED = (process.env.AGENDAMELO_ALLOWED_CHATS || '').split(',').map((s) => s.trim()).filter(Boolean);
const TEST = process.argv[2] === 'test';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const readRows = () => parse(readFileSync(CSV), { columns: true, skip_empty_lines: true, relax_quotes: true });

const AYUDA = [
  '🤖 *Comandos Agendamelo*',
  '/estado — resumen de ideas (pendientes/listas/enviadas)',
  '/generar [N] — genera N ideas nuevas con Codex (default 14)',
  '/enviar [N] — envía N posts listos (imagen + texto)',
  '/textos [N] — envía solo el texto (sin imagen), para revisar',
  '/siguiente — envía el próximo post',
  '/borrar <id> — elimina una idea (ej. /borrar AGENDA-IDEA-024)',
  '/ayuda — esta lista',
].join('\n');

async function api(method, body) {
  const res = await fetch(`${API}/${method}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  return res.json();
}
async function reply(chat, text) {
  if (TEST) { console.log(`[BOT→${chat}]\n${text}\n`); return; }
  await api('sendMessage', { chat_id: chat, text, parse_mode: 'Markdown', disable_web_page_preview: true });
}

// Corre uno de nuestros scripts como proceso hijo y devuelve {code, out, err}.
function runScript(args, extraEnv = {}) {
  return new Promise((resolve) => {
    const p = spawn('node', args, { cwd: ROOT, env: { ...process.env, ...extraEnv } });
    let out = '', err = '';
    p.stdout.on('data', (d) => (out += d));
    p.stderr.on('data', (d) => (err += d));
    p.on('close', (code) => resolve({ code, out, err }));
  });
}
const tail = (s, n = 300) => (s || '').trim().split('\n').slice(-3).join('\n').slice(-n);

function estado() {
  const rows = readRows();
  const c = { pendiente: 0, renderizado: 0, enviado: 0, otro: 0 };
  for (const r of rows) (c[r.estado] !== undefined ? c[r.estado]++ : c.otro++);
  return `📊 *Estado Agendamelo*\nTotal: ${rows.length}\n• Pendientes: ${c.pendiente}\n• Listas para enviar: ${c.renderizado}\n• Enviadas: ${c.enviado}`;
}

function borrar(id) {
  const rows = readRows();
  const idx = rows.findIndex((r) => r.id === id);
  if (idx === -1) return `No encontré ${id}.`;
  const [removed] = rows.splice(idx, 1);
  writeFileSync(CSV, stringify(rows, { header: true, columns: Object.keys(rows[0] || removed) }));
  const img = join(ROOT, 'dist', `${id}.png`);
  if (existsSync(img)) unlinkSync(img);
  return `🗑️ Borrada ${id} (“${removed.hook || removed.titulo}”).`;
}

let busy = false;
async function handle(chat, text) {
  const [cmd, arg] = text.trim().split(/\s+/);
  switch ((cmd || '').toLowerCase()) {
    case '/start': case '/ayuda': case '/help':
      return reply(chat, AYUDA);
    case '/estado':
      return reply(chat, estado());
    case '/generar': {
      if (busy) return reply(chat, '⏳ Ya hay una tarea en curso, espera a que termine.');
      const n = parseInt(arg, 10) || 14;
      busy = true;
      await reply(chat, `🧠 Generando ${n} ideas con Codex... (1-3 min)`);
      try {
        const g = await runScript(['src/generate.js', String(n)]);
        if (g.code !== 0) return reply(chat, `❌ Error al generar:\n${tail(g.err || g.out)}`);
        await runScript(['src/lint.js']);
        const r = await runScript(['src/pipeline.js', 'pending']);
        if (r.code !== 0) return reply(chat, `❌ Error al renderizar:\n${tail(r.err || r.out)}`);
        await reply(chat, `✅ Listas ${n} ideas nuevas. Usa /enviar para recibirlas.`);
      } finally { busy = false; }
      return;
    }
    case '/enviar': {
      if (busy) return reply(chat, '⏳ Ya hay una tarea en curso, espera.');
      busy = true;
      await reply(chat, '📤 Enviando...');
      try {
        const e = await runScript(['src/telegram.js', arg || ''], { TELEGRAM_CHAT_ID: String(chat) });
        if (e.code !== 0) return reply(chat, `❌ Error al enviar:\n${tail(e.err || e.out)}`);
      } finally { busy = false; }
      return;
    }
    case '/siguiente': {
      if (busy) return reply(chat, '⏳ Ocupado, espera.');
      busy = true;
      try {
        const e = await runScript(['src/telegram.js', '1'], { TELEGRAM_CHAT_ID: String(chat) });
        if (e.code !== 0) return reply(chat, `❌ ${tail(e.err || e.out)}`);
      } finally { busy = false; }
      return;
    }
    case '/textos': {
      // Solo texto (título + descripción), sin imagen. No cambia el estado (es para revisar/copiar).
      let targets = readRows().filter((r) => r.estado === 'renderizado');
      const n = parseInt(arg, 10);
      if (n) targets = targets.slice(0, n);
      if (targets.length === 0) return reply(chat, 'No hay ideas listas (estado renderizado) para mostrar.');
      await reply(chat, `📝 ${targets.length} idea(s) en texto (sin imagen):`);
      for (const r of targets) {
        const titulo = (r.hook || r.titulo).replace(/\*(.+?)\*/g, '$1');
        await api('sendMessage', { chat_id: chat, text: titulo });
        await api('sendMessage', { chat_id: chat, text: buildCaption(r), disable_web_page_preview: true });
        await sleep(500);
      }
      return;
    }
    case '/borrar':
      if (!arg) return reply(chat, 'Uso: /borrar AGENDA-IDEA-024');
      return reply(chat, borrar(arg));
    default:
      return reply(chat, 'No entendí. Escribe /ayuda para ver los comandos.');
  }
}

async function main() {
  if (TEST) { await handle(ALLOWED[0], process.argv.slice(3).join(' ')); return; }
  if (!TOKEN) { console.error('Falta TELEGRAM_BOT_TOKEN.'); process.exit(1); }

  // Registra el menú de comandos (lo que aparece al teclear "/") al arrancar.
  await api('setMyCommands', { commands: [
    { command: 'estado', description: 'Resumen de ideas (pendientes/listas/enviadas)' },
    { command: 'generar', description: 'Genera N ideas nuevas con Codex (default 14)' },
    { command: 'enviar', description: 'Envia N posts listos (imagen + texto)' },
    { command: 'textos', description: 'Envia solo el texto (sin imagen), para revisar' },
    { command: 'siguiente', description: 'Envia el proximo post' },
    { command: 'borrar', description: 'Elimina una idea por id' },
    { command: 'ayuda', description: 'Lista de comandos' },
  ] }).catch(() => {});

  // Servidor de salud (para el healthcheck del VPS: curl http://127.0.0.1:PUERTO).
  const PORT = process.env.PORT || 3000;
  createServer((req, res) => {
    const rows = (() => { try { return readRows(); } catch { return []; } })();
    const c = { total: rows.length, pendiente: 0, renderizado: 0, enviado: 0 };
    for (const r of rows) if (c[r.estado] !== undefined) c[r.estado]++;
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true, servicio: 'agendamelo-bot', ...c }));
  }).listen(PORT, () => console.log(`Salud en :${PORT}`));

  // Descarta mensajes viejos: arranca desde el último update.
  let offset = 0;
  const init = await api('getUpdates', { timeout: 0 });
  if (init.ok && init.result.length) offset = init.result.at(-1).update_id + 1;
  console.log('Bot Agendamelo escuchando. Allowlist:', ALLOWED.join(', '));

  while (true) {
    try {
      const r = await api('getUpdates', { offset, timeout: 30 });
      if (!r.ok) { await sleep(2000); continue; }
      for (const u of r.result) {
        offset = u.update_id + 1;
        const m = u.message;
        if (!m || !m.text) continue;
        if (!ALLOWED.includes(String(m.chat.id))) continue; // ignora a cualquiera que no seas tú
        await handle(m.chat.id, m.text).catch((e) => reply(m.chat.id, `❌ Error: ${e.message}`));
      }
    } catch (e) { console.error('poll:', e.message); await sleep(3000); }
  }
}

main();
