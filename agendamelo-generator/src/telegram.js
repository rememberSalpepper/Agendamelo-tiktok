// Envía los posts a Telegram: por cada idea manda la IMAGEN y, debajo, el CAPTION completo
// (los 👇 + descripción + 5 hashtags) listo para copiar. Marca la idea como `enviado`.
//
// Uso:
//   node src/telegram.js            -> envía todas las 'renderizado'
//   node src/telegram.js 1          -> envía solo la primera 'renderizado' (prueba)
//   node src/telegram.js one <id>   -> envía una idea puntual
//
// Requiere variables de entorno:
//   TELEGRAM_BOT_TOKEN   token del bot (de @BotFather)
//   TELEGRAM_CHAT_ID     tu chat id (de @userinfobot)

import './env.js';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCaption } from './caption.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CSV = process.env.AGENDAMELO_CSV || join(ROOT, '..', 'agendamelo_ideas.csv');
const today = new Date().toISOString().slice(0, 10);

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT = process.env.TELEGRAM_CHAT_ID;
const API = `https://api.telegram.org/bot${TOKEN}`;

// Allowlist: el bot SOLO puede enviar a este chat (el tuyo). Evita fugas por mala config.
// Puedes sobrescribirlo con AGENDAMELO_ALLOWED_CHATS (ids separados por coma).
const ALLOWED = (process.env.AGENDAMELO_ALLOWED_CHATS || '').split(',').map((s) => s.trim()).filter(Boolean);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function tg(method, body, isForm = false) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(`${API}/${method}`, isForm
      ? { method: 'POST', body }
      : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (data.ok) return data.result;
    if (res.status === 429 && data.parameters?.retry_after) { // rate limit: esperar y reintentar
      await sleep((data.parameters.retry_after + 1) * 1000); continue;
    }
    throw new Error(`Telegram ${method} falló: ${res.status} ${data.description || ''}`);
  }
  throw new Error(`Telegram ${method}: reintentos agotados.`);
}

async function sendPost(row, idx, total) {
  const paths = (row.imagen_url || '').split(',').map((p) => p.trim()).filter(Boolean);
  if (paths.length > 1) {
    // Carrusel -> álbum (sendMediaGroup, 2-10 fotos). El caption del álbum es el índice.
    const form = new FormData();
    form.append('chat_id', CHAT);
    const media = paths.map((p, i) => {
      const name = p.split('/').pop();
      form.append(name, new Blob([readFileSync(join(ROOT, p))], { type: 'image/png' }), name);
      return { type: 'photo', media: `attach://${name}`, ...(i === 0 ? { caption: `📌 ${idx}/${total}` } : {}) };
    });
    form.append('media', JSON.stringify(media));
    await tg('sendMediaGroup', form, true);                            // 1) álbum de slides
  } else {
    const form = new FormData();
    form.append('chat_id', CHAT);
    form.append('caption', `📌 ${idx}/${total}`);                       // índice mínimo para mantener orden
    form.append('photo', new Blob([readFileSync(join(ROOT, paths[0]))], { type: 'image/png' }), `${row.id}.png`);
    await tg('sendPhoto', form, true);                                  // 1) imagen + número
  }
  await sleep(300);
  const titulo = (row.hook || row.titulo).replace(/\*(.+?)\*/g, '$1'); // 2) título catchy = hook
  await tg('sendMessage', { chat_id: CHAT, text: titulo });
  await sleep(300);
  await tg('sendMessage', { chat_id: CHAT, text: buildCaption(row), disable_web_page_preview: true }); // 3) descripción
}

async function main() {
  if (!TOKEN || !CHAT) {
    console.error('Falta TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID en el entorno.');
    process.exit(1);
  }
  if (!ALLOWED.includes(String(CHAT))) {
    console.error(`Bloqueado: el chat ${CHAT} no está en la allowlist (${ALLOWED.join(', ')}).`);
    process.exit(1);
  }
  const [a, b] = process.argv.slice(2);
  const rows = parse(readFileSync(CSV), { columns: true, skip_empty_lines: true, relax_quotes: true });

  // 'ver <id>' = previsualizar SIN cambiar estado (no consume). 'one <id>' = enviar y marcar enviado.
  const PEEK = a === 'ver';
  let targets;
  if (a === 'one' || a === 'ver') targets = rows.filter((r) => r.id === b);
  else {
    targets = rows.filter((r) => r.estado === 'renderizado');
    if (/^\d+$/.test(a || '')) targets = targets.slice(0, parseInt(a, 10));
  }

  if (targets.length === 0) { console.log('No hay posts para enviar.'); return; }
  console.log(`${PEEK ? 'Previsualizando' : 'Enviando'} ${targets.length} post(s)...`);

  let sent = 0;
  try {
    for (const row of targets) {
      await sendPost(row, sent + 1, targets.length);
      if (!PEEK) { row.estado = 'enviado'; row.fecha_realizado = today; }
      sent++;
      console.log(`  ✓ ${PEEK ? 'visto' : 'enviado'} ${row.id}  (${row.formato || 'imagen'})`);
      await sleep(1200); // suave con el rate limit por chat
    }
  } finally {
    if (!PEEK && sent > 0) writeFileSync(CSV, stringify(rows, { header: true, columns: Object.keys(rows[0]) }));
  }
  console.log(`Listo: ${sent}/${targets.length} ${PEEK ? 'visto(s)' : "enviado(s) y marcados 'enviado'"}.`);
}

main();
