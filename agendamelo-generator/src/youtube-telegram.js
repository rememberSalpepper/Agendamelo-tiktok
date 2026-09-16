// Envía por Telegram un Short ya renderizado para revisión. No cambia el estado del CSV.

import './env.js';
import { existsSync, readFileSync } from 'node:fs';
import { basename, dirname, isAbsolute, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readYoutubeRows } from './youtube.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CSV = process.env.AGENDAMELO_KITS_CSV || join(ROOT, '..', 'agendamelo_kits.csv');
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT = process.env.TELEGRAM_CHAT_ID;
const ALLOWED = (process.env.AGENDAMELO_ALLOWED_CHATS || '').split(',').map((s) => s.trim()).filter(Boolean);

export function pickShortPreview(rows, id = '') {
  return id
    ? rows.find((row) => row.id === id && row.youtube_status === 'renderizado')
    : rows.find((row) => row.youtube_status === 'renderizado');
}

async function main() {
  if (!TOKEN || !CHAT) throw new Error('Falta TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID.');
  if (!ALLOWED.includes(String(CHAT))) throw new Error(`Chat ${CHAT} fuera de la allowlist.`);
  const [id = ''] = process.argv.slice(2);
  const row = pickShortPreview(readYoutubeRows(CSV), id);
  if (!row) throw new Error(id ? `No encontré el Short renderizado ${id}.` : 'No hay Shorts renderizados.');
  const file = isAbsolute(row.youtube_video_path)
    ? row.youtube_video_path
    : join(ROOT, row.youtube_video_path);
  if (!existsSync(file)) throw new Error(`No existe el MP4 de ${row.id}.`);

  const form = new FormData();
  form.append('chat_id', CHAT);
  form.append('supports_streaming', 'true');
  form.append('caption', `${row.id}\n${String(row.hook || '').replace(/\*/g, '')}`.trim());
  form.append('video', new Blob([readFileSync(file)], { type: 'video/mp4' }), basename(file));
  const response = await fetch(`https://api.telegram.org/bot${TOKEN}/sendVideo`, { method: 'POST', body: form });
  const data = await response.json().catch(() => ({}));
  if (!data.ok) throw new Error(`Telegram sendVideo falló: ${data.description || response.status}.`);
  console.log(`✓ ${row.id} enviado a Telegram para revisión.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(error.message); process.exit(1); });
}
