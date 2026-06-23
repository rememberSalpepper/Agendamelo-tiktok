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
  '',
  '*Crear*',
  '/generar [N] — genera N ideas nuevas con Codex (default 14) y las renderiza',
  '',
  '*Revisar*',
  '/revisar — revisión integral (sistema, CSV, ideas, imágenes)',
  '/estado — resumen (pendientes/listas/enviadas/publicadas)',
  '/cola — lista de posts listos por publicar',
  '/reporte — variedad por nicho/orientación/formato',
  '/textos [N] — solo el texto (sin imagen), para copiar',
  '/ver <id> — reenvía un post para revisarlo (no lo consume)',
  '',
  '*Publicar (te los entrega)*',
  '/dia — el set del día: 3 posts variados',
  '/siguiente — el próximo post',
  '/enviar [N] — N posts listos',
  '',
  '*Gestionar*',
  '/rehacer <id> — vuelve a renderizar un post',
  '/publicado <id> — márcalo como publicado en TikTok',
  '/borrar <id> — elimina una idea',
  '/ayuda — esta lista',
].join('\n');

// Selecciona 3 posts listos (renderizado) maximizando variedad de nicho/orientación/formato.
function pickDaily(rows, n = 3) {
  const ready = rows.filter((r) => r.estado === 'renderizado');
  const picks = [];
  const usedNiche = new Set(), usedOri = new Set();
  for (const r of ready) { // 1) nicho Y orientación distintos
    if (picks.length >= n) break;
    if (usedNiche.has(r.niche) || usedOri.has(r.orientacion)) continue;
    picks.push(r); usedNiche.add(r.niche); usedOri.add(r.orientacion);
  }
  for (const r of ready) { // 2) al menos nicho distinto
    if (picks.length >= n) break;
    if (picks.includes(r) || usedNiche.has(r.niche)) continue;
    picks.push(r); usedNiche.add(r.niche);
  }
  for (const r of ready) { // 3) rellenar con lo que haya
    if (picks.length >= n) break;
    if (!picks.includes(r)) picks.push(r);
  }
  return picks;
}

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
// Texto plano (sin Markdown): para listas con contenido dinámico que podría romper el parseo.
async function replyText(chat, text) {
  if (TEST) { console.log(`[BOT→${chat}]\n${text}\n`); return; }
  await api('sendMessage', { chat_id: chat, text, disable_web_page_preview: true });
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
  const c = { pendiente: 0, renderizado: 0, enviado: 0, publicado: 0, otro: 0 };
  for (const r of rows) (c[r.estado] !== undefined ? c[r.estado]++ : c.otro++);
  return `📊 *Estado Agendamelo*\nTotal: ${rows.length}\n• Pendientes (sin imagen): ${c.pendiente}`
    + `\n• Listas: ${c.renderizado}\n• Enviadas (por subir): ${c.enviado}\n• Publicadas: ${c.publicado}`;
}

const strip = (s) => (s || '').replace(/\*(.+?)\*/g, '$1');

// Cola de publicación: lo que está listo o entregado pero aún no publicado.
function cola() {
  const rows = readRows().filter((r) => r.estado === 'renderizado' || r.estado === 'enviado');
  if (!rows.length) return 'No hay posts en cola. Usa /generar para crear más.';
  const lines = rows.slice(0, 25).map((r) => {
    const mark = r.estado === 'enviado' ? '📤' : '🟢';
    return `${mark} ${r.id} · ${r.niche}/${r.orientacion}/${r.formato}\n   ${strip(r.hook || r.titulo)}`;
  });
  return `🗂️ Cola de publicación (${rows.length})  🟢 lista · 📤 enviada\n\n${lines.join('\n')}`;
}

// Reporte de variedad sobre lo que aún no se publica (para asegurar cobertura por nicho/orientación/formato).
function reporte() {
  const active = readRows().filter((r) => r.estado !== 'publicado');
  if (!active.length) return 'Nada en preparación. Usa /generar.';
  const by = (k) => Object.entries(active.reduce((m, r) => ((m[r[k]] = (m[r[k]] || 0) + 1), m), {}))
    .sort((a, b) => b[1] - a[1]).map(([v, n]) => `${v}: ${n}`).join(' · ');
  return `📈 Reporte (sin publicar: ${active.length})\nNicho — ${by('niche')}\nOrientación — ${by('orientacion')}\nFormato — ${by('formato')}`;
}

// Marca un post como publicado en TikTok (registro de lo que está en vivo).
function publicado(id) {
  const rows = readRows();
  const r = rows.find((x) => x.id === id);
  if (!r) return `No encontré ${id}.`;
  r.estado = 'publicado';
  writeFileSync(CSV, stringify(rows, { header: true, columns: Object.keys(rows[0]) }));
  return `✅ ${id} marcado como publicado en TikTok.`;
}

function borrar(id) {
  const rows = readRows();
  const idx = rows.findIndex((r) => r.id === id);
  if (idx === -1) return `No encontré ${id}.`;
  const [removed] = rows.splice(idx, 1);
  writeFileSync(CSV, stringify(rows, { header: true, columns: Object.keys(rows[0] || removed) }));
  // Borra los PNG (imagen simple o todas las láminas del carrusel).
  const files = (removed.imagen_url || `dist/${id}.png`).split(',').map((p) => p.trim()).filter(Boolean);
  for (const f of files) { const fp = join(ROOT, f); if (existsSync(fp)) unlinkSync(fp); }
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
    case '/dia': {
      if (busy) return reply(chat, '⏳ Ya hay una tarea en curso, espera.');
      const picks = pickDaily(readRows(), 3);
      if (picks.length === 0) return reply(chat, 'No hay posts listos (estado renderizado). Usa /generar.');
      busy = true;
      await reply(chat, `📅 *Set del día* (${picks.length})\n${picks.map((p) => `• ${p.niche} · ${p.orientacion} · ${p.formato}`).join('\n')}`);
      try {
        for (const p of picks) {
          const e = await runScript(['src/telegram.js', 'one', p.id], { TELEGRAM_CHAT_ID: String(chat) });
          if (e.code !== 0) { await reply(chat, `❌ ${tail(e.err || e.out)}`); break; }
        }
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
    case '/cola':
      return replyText(chat, cola());
    case '/reporte':
      return replyText(chat, reporte());
    case '/revisar': {
      if (busy) return reply(chat, '⏳ Ocupado, espera.');
      busy = true;
      await reply(chat, '🔎 Revisando proyecto...');
      try {
        const e = await runScript(['src/review.js']);
        await reply(chat, (e.out || e.err || 'Sin salida.').slice(-3800));
      } finally { busy = false; }
      return;
    }
    case '/ver': {
      if (!arg) return reply(chat, 'Uso: /ver AGENDA-IDEA-024');
      if (busy) return reply(chat, '⏳ Ocupado, espera.');
      busy = true;
      try {
        const e = await runScript(['src/telegram.js', 'ver', arg], { TELEGRAM_CHAT_ID: String(chat) });
        if (e.code !== 0) return reply(chat, `❌ ${tail(e.err || e.out)}`);
      } finally { busy = false; }
      return;
    }
    case '/rehacer': {
      if (!arg) return reply(chat, 'Uso: /rehacer AGENDA-IDEA-024');
      if (busy) return reply(chat, '⏳ Ocupado, espera.');
      busy = true;
      await reply(chat, `🎨 Re-renderizando ${arg}...`);
      try {
        const e = await runScript(['src/pipeline.js', 'one', arg]);
        if (e.code !== 0) return reply(chat, `❌ ${tail(e.err || e.out)}`);
        await reply(chat, `✅ ${arg} re-renderizado. Usa /ver ${arg} para revisarlo.`);
      } finally { busy = false; }
      return;
    }
    case '/publicado':
      if (!arg) return reply(chat, 'Uso: /publicado AGENDA-IDEA-024');
      return reply(chat, publicado(arg));
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
    { command: 'generar', description: 'Genera N ideas nuevas con Codex (default 14)' },
    { command: 'revisar', description: 'Revision integral (sistema, CSV, ideas, imagenes)' },
    { command: 'dia', description: 'El set del dia: 3 posts variados' },
    { command: 'cola', description: 'Lista de posts listos por publicar' },
    { command: 'reporte', description: 'Variedad por nicho/orientacion/formato' },
    { command: 'estado', description: 'Resumen (pendientes/listas/enviadas/publicadas)' },
    { command: 'ver', description: 'Reenvia un post para revisarlo (no lo consume)' },
    { command: 'textos', description: 'Envia solo el texto (sin imagen)' },
    { command: 'siguiente', description: 'Envia el proximo post' },
    { command: 'enviar', description: 'Envia N posts listos' },
    { command: 'rehacer', description: 'Vuelve a renderizar un post' },
    { command: 'publicado', description: 'Marca un post como publicado en TikTok' },
    { command: 'borrar', description: 'Elimina una idea por id' },
    { command: 'ayuda', description: 'Lista de comandos' },
  ] }).catch(() => {});

  // Servidor de salud (para el healthcheck del VPS: curl http://127.0.0.1:PUERTO).
  const PORT = process.env.PORT || 3000;
  createServer((req, res) => {
    const rows = (() => { try { return readRows(); } catch { return []; } })();
    const c = { total: rows.length, pendiente: 0, renderizado: 0, enviado: 0, publicado: 0 };
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
