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
import { getSettings, setNicho, setEstilo } from './settings.js';
import { codexConfigLabel } from './codex.js';
import { NICHE_KEYS } from './niches.js';

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
  '*Flujo (humano elige el hook)*',
  '/generar [N] [nicho] — N ideas con 3-5 hooks c/u (default 7, nicho activo)',
  '/revisar [N] — elige el hook de cada idea con botones',
  '/render [N] — renderiza las ideas con hook ya elegido',
  '/enviar [N] — te entrega N posts listos',
  '',
  '*Operación*',
  '/nicho <slug> — fija el nicho activo (manicuristas, psicopedagogas…)',
  '/estilo corto|largo — variante A/B del caption',
  '/estado — nicho activo, conteos y ángulos de las pendientes',
  '/cola — lista de posts listos por publicar',
  '/reporte — variedad por nicho/orientación/formato',
  '/dia — el set del día: 3 posts variados',
  '/siguiente — el próximo post',
  '/textos [N] — solo el texto (sin imagen), para copiar',
  '/ver <id> — reenvía un post para revisarlo (no lo consume)',
  '',
  '*Gestionar*',
  '/rehacer <id> [hook|desc|caption] — regenera hooks/descripción o re-renderiza',
  '/borrar <id> — elimina una idea',
  '/diagnostico — revisión integral (sistema, CSV, imágenes)',
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
  const json = await res.json();
  if (!json.ok) console.error(`[telegram] ${method} falló: ${json.error_code} ${json.description}`);
  return json;
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
// Mensaje con teclado inline (botones de un toque).
async function replyButtons(chat, text, keyboard) {
  if (TEST) { console.log(`[BOT→${chat}]\n${text}\n[botones] ${JSON.stringify(keyboard)}\n`); return; }
  await api('sendMessage', { chat_id: chat, text, reply_markup: { inline_keyboard: keyboard } });
}
// Cierra el "reloj" del botón con un aviso corto (toast).
async function answerCb(id, text) {
  if (TEST) { console.log(`[answerCb] ${text}`); return; }
  await api('answerCallbackQuery', { callback_query_id: id, text });
}
// Reemplaza el texto del mensaje (y quita el teclado al no mandar reply_markup).
async function editText(chat, messageId, text) {
  if (TEST) { console.log(`[editText ${messageId}]\n${text}\n`); return; }
  await api('editMessageText', { chat_id: chat, message_id: messageId, text });
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

const strip = (s) => (s || '').replace(/\*(.+?)\*/g, '$1');

// Una pendiente está "sin curar" si tiene variantes pero el operador aún no elige hook.
const sinCurar = (r) => r.estado === 'pendiente' && r.hook_variantes && !r.hook_elegido;

function estado() {
  const rows = readRows();
  const s = getSettings();
  const c = { pendiente: 0, renderizado: 0, enviado: 0, otro: 0 };
  for (const r of rows) (c[r.estado] !== undefined ? c[r.estado]++ : c.otro++);
  const porCurar = rows.filter(sinCurar);
  const listasRender = rows.filter((r) => r.estado === 'pendiente' && !sinCurar(r)).length;
  // Ángulos de las pendientes (hook provisional o elegido).
  const ang = {};
  for (const r of rows.filter((r) => r.estado === 'pendiente')) if (r.angulo) ang[r.angulo] = (ang[r.angulo] || 0) + 1;
  const angStr = Object.entries(ang).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}:${v}`).join(' · ') || '—';
  return `📊 *Estado Agendamelo*\n`
    + `Nicho activo: *${s.nicho}* · caption: *${s.estilo_caption}* · Codex: ${codexConfigLabel()}\n`
    + `Total: ${rows.length}\n`
    + `• Pendientes por elegir hook: ${porCurar.length}  (usa /revisar)\n`
    + `• Pendientes con hook listo: ${listasRender}  (usa /render)\n`
    + `• Renderizadas (listas): ${c.renderizado}\n`
    + `• Enviadas: ${c.enviado}\n`
    + `Ángulos en pendientes — ${angStr}`;
}

// Cola: lo que está listo (renderizado) o ya entregado (enviado).
function cola() {
  const rows = readRows().filter((r) => r.estado === 'renderizado' || r.estado === 'enviado');
  if (!rows.length) return 'No hay posts en cola. Usa /generar para crear más.';
  const lines = rows.slice(0, 25).map((r) => {
    const mark = r.estado === 'enviado' ? '📤' : '🟢';
    return `${mark} ${r.id} · ${r.niche}/${r.orientacion}/${r.formato}\n   ${strip(r.hook || r.titulo)}`;
  });
  return `🗂️ Cola de publicación (${rows.length})  🟢 lista · 📤 enviada\n\n${lines.join('\n')}`;
}

// Reporte de variedad (para asegurar cobertura por nicho/orientación/formato).
function reporte() {
  const active = readRows();
  if (!active.length) return 'Nada en preparación. Usa /generar.';
  const by = (k) => Object.entries(active.reduce((m, r) => ((m[r[k]] = (m[r[k]] || 0) + 1), m), {}))
    .sort((a, b) => b[1] - a[1]).map(([v, n]) => `${v}: ${n}`).join(' · ');
  return `📈 Reporte (sin publicar: ${active.length})\nNicho — ${by('niche')}\nOrientación — ${by('orientacion')}\nFormato — ${by('formato')}`;
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
  const [cmd, arg, arg2] = text.trim().split(/\s+/);
  switch ((cmd || '').toLowerCase()) {
    case '/start': case '/ayuda': case '/help':
      return reply(chat, AYUDA);
    case '/estado':
      return reply(chat, estado());
    case '/generar': {
      if (busy) return reply(chat, '⏳ Ya hay una tarea en curso, espera a que termine.');
      const n = parseInt(arg, 10) || 7;
      // Nicho opcional: /generar 7 psicopedagogas. Si no, usa el nicho activo.
      const nicho = arg2 && NICHE_KEYS.includes(arg2) ? arg2 : '';
      if (arg2 && !nicho) return reply(chat, `Nicho inválido "${arg2}". Opciones: ${NICHE_KEYS.join(', ')}.`);
      const nichoUsado = nicho || getSettings().nicho;
      busy = true;
      await reply(chat, `🧠 Generando ${n} ideas de *${nichoUsado}* con Codex (${codexConfigLabel()})... (1-3 min)`);
      try {
        const g = await runScript(['src/generate.js', String(n), nicho]);
        if (g.code !== 0) return replyText(chat, `❌ Error al generar:\n${tail(g.err || g.out)}`);
        const l = await runScript(['src/lint.js']);
        if (l.code !== 0) await replyText(chat, `⚠️ Aviso de lint:\n${tail(l.err || l.out)}`);
        await reply(chat, `✅ Ideas generadas con 3-5 hooks cada una. Usa /revisar para elegir los hooks.`);
      } finally { busy = false; }
      return;
    }
    case '/render': {
      if (busy) return reply(chat, '⏳ Ya hay una tarea en curso, espera.');
      const pend = readRows().filter((r) => r.estado === 'pendiente' && !sinCurar(r));
      if (pend.length === 0) return reply(chat, 'No hay ideas con hook elegido para renderizar. Usa /revisar primero.');
      busy = true;
      await reply(chat, `🎨 Renderizando ${pend.length} idea(s) con hook elegido... (puede tardar)`);
      try {
        const r = await runScript(['src/pipeline.js', 'pending']);
        if (r.code !== 0) return replyText(chat, `❌ Error al renderizar:\n${tail(r.err || r.out)}`);
        const listas = readRows().filter((x) => x.estado === 'renderizado').length;
        await reply(chat, `✅ Render listo. ${listas} post(s) en cola. Usa /enviar para recibirlos.`);
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
          if (e.code !== 0) { await replyText(chat, `❌ ${tail(e.err || e.out)}`); break; }
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
        if (e.code !== 0) return replyText(chat, `❌ Error al enviar:\n${tail(e.err || e.out)}`);
      } finally { busy = false; }
      return;
    }
    case '/siguiente': {
      if (busy) return reply(chat, '⏳ Ocupado, espera.');
      busy = true;
      try {
        const e = await runScript(['src/telegram.js', '1'], { TELEGRAM_CHAT_ID: String(chat) });
        if (e.code !== 0) return replyText(chat, `❌ ${tail(e.err || e.out)}`);
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
      // Human-in-the-loop: por cada idea sin curar, manda sus variantes como botones para elegir hook.
      const rows = readRows();
      let targets = rows.filter(sinCurar);
      const n = parseInt(arg, 10);
      if (n) targets = targets.slice(0, n);
      if (targets.length === 0) return reply(chat, 'No hay ideas por curar. Genera con /generar (o ya elegiste todos los hooks).');
      await reply(chat, `🎯 ${targets.length} idea(s) por elegir hook. Toca el botón del ángulo que quieras en cada una:`);
      for (const r of targets) {
        let variants = [];
        try { variants = JSON.parse(r.hook_variantes) || []; } catch { /* ignora */ }
        if (!variants.length) continue;
        const plantilla = r.formato === 'carrusel' ? 'carrusel' : r.tipo_plantilla;
        const lines = variants.map((v, i) => `${i + 1}. ${strip(v.texto)}  ·  [${v.angulo}]`);
        const head = `🆔 ${r.id} · ${r.niche}/${r.orientacion}/${plantilla}\n📌 tema: ${r.tema}\n\n${lines.join('\n')}`;
        const buttons = variants.map((v, i) => [{ text: `${i + 1}. ${v.angulo}`, callback_data: `h:${r.id}:${i}` }]);
        buttons.push([{ text: '🔁 Otros hooks', callback_data: `g:${r.id}` }]);
        await replyButtons(chat, head, buttons);
        await sleep(250);
      }
      return;
    }
    case '/diagnostico': {
      if (busy) return reply(chat, '⏳ Ocupado, espera.');
      busy = true;
      await reply(chat, '🔎 Revisando proyecto...');
      try {
        const e = await runScript(['src/review.js']);
        // Texto plano: el reporte trae contenido del CSV (hooks/temas/ids) que rompe el parseo Markdown de Telegram.
        await replyText(chat, (e.out || e.err || 'Sin salida.').slice(-3800));
      } finally { busy = false; }
      return;
    }
    case '/nicho': {
      if (!arg) { const s = getSettings(); return reply(chat, `Nicho activo: *${s.nicho}*.\nUso: /nicho <slug> — ${NICHE_KEYS.join(', ')}.`); }
      const res = setNicho(arg);
      if (!res.ok) return reply(chat, `❌ ${res.error}`);
      return reply(chat, `✅ Nicho activo: *${res.value.nicho}*. Las próximas /generar usarán este rubro.`);
    }
    case '/estilo': {
      if (!arg) { const s = getSettings(); return reply(chat, `Estilo de caption: *${s.estilo_caption}*.\nUso: /estilo corto|largo (A/B de retención).`); }
      const res = setEstilo(arg);
      if (!res.ok) return reply(chat, `❌ ${res.error}`);
      return reply(chat, `✅ Caption en modo *${res.value.estilo_caption}*. Aplica a los próximos envíos.`);
    }
    case '/ver': {
      if (!arg) return reply(chat, 'Uso: /ver AGENDA-IDEA-024');
      if (busy) return reply(chat, '⏳ Ocupado, espera.');
      busy = true;
      try {
        const e = await runScript(['src/telegram.js', 'ver', arg], { TELEGRAM_CHAT_ID: String(chat) });
        if (e.code !== 0) return replyText(chat, `❌ ${tail(e.err || e.out)}`);
      } finally { busy = false; }
      return;
    }
    case '/rehacer': {
      if (!arg) return reply(chat, 'Uso: /rehacer <id> [hook|desc|caption]');
      if (busy) return reply(chat, '⏳ Ocupado, espera.');
      const field = (arg2 || '').toLowerCase();
      busy = true;
      try {
        if (field === 'hook' || field === 'hooks') {
          await reply(chat, `🔁 Regenerando hooks de ${arg} con Codex...`);
          const e = await runScript(['src/regen-hooks.js', arg]);
          if (e.code !== 0) return replyText(chat, `❌ ${tail(e.err || e.out)}`);
          await reply(chat, `✅ ${arg}: hooks nuevos. Usa /revisar para elegir.`);
        } else if (field === 'desc' || field === 'descripcion') {
          await reply(chat, `✍️ Reescribiendo la descripción de ${arg} con Codex...`);
          const e = await runScript(['src/expand-descriptions.js', arg]);
          if (e.code !== 0) return replyText(chat, `❌ ${tail(e.err || e.out)}`);
          await runScript(['src/lint.js']);
          await reply(chat, `✅ ${arg}: descripción reescrita. El caption se rearma al enviar.`);
        } else { // sin campo, "caption" o "imagen": re-renderiza la imagen
          await reply(chat, `🎨 Re-renderizando ${arg}...`);
          const e = await runScript(['src/pipeline.js', 'one', arg]);
          if (e.code !== 0) return replyText(chat, `❌ ${tail(e.err || e.out)}`);
          const extra = field === 'caption' ? ' (el caption se rearma solo al enviar)' : '';
          await reply(chat, `✅ ${arg} re-renderizado${extra}. Usa /ver ${arg} para revisarlo.`);
        }
      } finally { busy = false; }
      return;
    }
    case '/borrar':
      if (!arg) return reply(chat, 'Uso: /borrar AGENDA-IDEA-024');
      return reply(chat, borrar(arg));
    default:
      return reply(chat, 'No entendí. Escribe /ayuda para ver los comandos.');
  }
}

// Botones inline: elegir hook (h:id:idx) o regenerar hooks (g:id).
async function onCallback(cq) {
  const chat = cq.message && cq.message.chat && cq.message.chat.id;
  if (!ALLOWED.includes(String(chat))) { await answerCb(cq.id, ''); return; }
  const parts = (cq.data || '').split(':');
  const kind = parts[0];

  if (kind === 'h') {
    const id = parts[1];
    const idx = parseInt(parts[2], 10);
    const rows = readRows();
    const row = rows.find((r) => r.id === id);
    if (!row) { await answerCb(cq.id, 'No encontré la idea.'); return; }
    let variants = [];
    try { variants = JSON.parse(row.hook_variantes) || []; } catch { /* ignora */ }
    const v = variants[idx];
    if (!v) { await answerCb(cq.id, 'Hook inválido.'); return; }
    row.hook = v.texto; row.angulo = v.angulo; row.hook_elegido = v.texto;
    writeFileSync(CSV, stringify(rows, { header: true, columns: Object.keys(rows[0]) }));
    await answerCb(cq.id, '✓ Hook elegido');
    await editText(chat, cq.message.message_id,
      `✅ ${id} — hook elegido [${v.angulo}]:\n${strip(v.texto)}\n\nCuando tengas todos, usa /render.`);
    return;
  }

  if (kind === 'g') {
    const id = parts[1];
    if (busy) { await answerCb(cq.id, 'Ocupado, intenta en un momento.'); return; }
    busy = true;
    await answerCb(cq.id, '🔁 Regenerando hooks...');
    try {
      const e = await runScript(['src/regen-hooks.js', id]);
      if (e.code !== 0) { await replyText(chat, `❌ ${tail(e.err || e.out)}`); return; }
      await reply(chat, `🔁 ${id}: hooks regenerados. Usa /revisar para verlos y elegir.`);
    } finally { busy = false; }
    return;
  }
  await answerCb(cq.id, '');
}

async function main() {
  if (TEST) { await handle(ALLOWED[0], process.argv.slice(3).join(' ')); return; }
  if (!TOKEN) { console.error('Falta TELEGRAM_BOT_TOKEN.'); process.exit(1); }

  // Registra el menú de comandos (lo que aparece al teclear "/") al arrancar.
  await api('setMyCommands', { commands: [
    { command: 'generar', description: 'Genera N ideas con 3-5 hooks (default 7, nicho activo)' },
    { command: 'revisar', description: 'Elige el hook de cada idea con botones' },
    { command: 'render', description: 'Renderiza las ideas con hook ya elegido' },
    { command: 'enviar', description: 'Te entrega N posts listos' },
    { command: 'nicho', description: 'Fija el nicho activo' },
    { command: 'estilo', description: 'Variante A/B del caption (corto|largo)' },
    { command: 'estado', description: 'Nicho activo, conteos y angulos de pendientes' },
    { command: 'dia', description: 'El set del dia: 3 posts variados' },
    { command: 'cola', description: 'Lista de posts listos por publicar' },
    { command: 'reporte', description: 'Variedad por nicho/orientacion/formato' },
    { command: 'ver', description: 'Reenvia un post para revisarlo (no lo consume)' },
    { command: 'textos', description: 'Envia solo el texto (sin imagen)' },
    { command: 'siguiente', description: 'Envia el proximo post' },
    { command: 'rehacer', description: 'Regenera hooks/desc o re-renderiza un post' },
    { command: 'borrar', description: 'Elimina una idea por id' },
    { command: 'diagnostico', description: 'Revision integral (sistema, CSV, imagenes)' },
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
        if (u.callback_query) { // toque de botón inline (elegir/regenerar hook)
          await onCallback(u.callback_query).catch((e) => answerCb(u.callback_query.id, `Error: ${e.message}`));
          continue;
        }
        const m = u.message;
        if (!m || !m.text) continue;
        if (!ALLOWED.includes(String(m.chat.id))) continue; // ignora a cualquiera que no seas tú
        await handle(m.chat.id, m.text).catch((e) => reply(m.chat.id, `❌ Error: ${e.message}`));
      }
    } catch (e) { console.error('poll:', e.message); await sleep(3000); }
  }
}

main();
