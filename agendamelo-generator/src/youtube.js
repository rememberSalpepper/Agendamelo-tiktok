// Publicador idempotente de YouTube Shorts. El dry run nunca llama a Google ni modifica el CSV.
// Solo se consideran filas cuyo MP4 ya está marcado como `renderizado`; guardar el id remoto evita
// volver a subirlas y el estado `subiendo` bloquea reintentos ciegos después de una interrupción.

import './env.js';
import { google } from 'googleapis';
import { createReadStream, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { readOauthClientFile, readRefreshTokenFile } from './youtube-oauth.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_KITS_CSV = join(ROOT, '..', 'agendamelo_kits.csv');
export const YOUTUBE_COLUMNS = [
  'youtube_video_path', 'youtube_video_id', 'youtube_status', 'youtube_published_at', 'youtube_error',
  'youtube_music_title', 'youtube_music_artist', 'youtube_music_license', 'youtube_music_attribution',
];
const PRIVACY_VALUES = new Set(['private', 'unlisted', 'public']);

export function getYoutubeConfig(env = process.env) {
  return {
    clientFile: env.YOUTUBE_OAUTH_CLIENT_FILE || join(ROOT, '.secrets', 'youtube-oauth-client.json'),
    tokenFile: env.YOUTUBE_TOKEN_FILE || join(ROOT, '.secrets', 'youtube-token.json'),
    kitsCsv: env.AGENDAMELO_KITS_CSV || DEFAULT_KITS_CSV,
    privacyStatus: String(env.YOUTUBE_PRIVACY_STATUS || 'private').trim().toLowerCase(),
    categoryId: String(env.YOUTUBE_CATEGORY_ID || '22').trim(),
    notifySubscribers: String(env.YOUTUBE_NOTIFY_SUBSCRIBERS || '').toLowerCase() === 'true',
  };
}

export function youtubeConfigSummary(config = getYoutubeConfig()) {
  const missing = [];
  try { readOauthClientFile(config.clientFile); }
  catch { missing.push('YOUTUBE_OAUTH_CLIENT_FILE'); }
  try { readRefreshTokenFile(config.tokenFile); }
  catch { missing.push('YOUTUBE_TOKEN_FILE'); }
  if (!PRIVACY_VALUES.has(config.privacyStatus)) missing.push('YOUTUBE_PRIVACY_STATUS');
  return {
    ready: missing.length === 0,
    missing,
    privacyStatus: config.privacyStatus,
    notifySubscribers: config.notifySubscribers,
  };
}

export function readYoutubeRows(file = getYoutubeConfig().kitsCsv) {
  if (!existsSync(file)) return [];
  return parse(readFileSync(file), { columns: true, skip_empty_lines: true, relax_quotes: true });
}

export function latestYoutubePublishedAt(file = getYoutubeConfig().kitsCsv) {
  return readYoutubeRows(file)
    .map((row) => String(row.youtube_published_at || '').trim())
    .filter((value) => value && Number.isFinite(new Date(value).getTime()))
    .sort()
    .at(-1) || '';
}

function saveYoutubeRows(rows, file) {
  if (!rows.length) return;
  const existing = Object.keys(rows[0]);
  const columns = [...existing, ...YOUTUBE_COLUMNS.filter((column) => !existing.includes(column))];
  writeFileSync(file, stringify(rows, { header: true, columns }));
}

export function youtubeVideoPath(row, root = ROOT) {
  const configured = String(row.youtube_video_path || '').trim();
  if (!configured) return '';
  return isAbsolute(configured) ? configured : resolve(root, configured);
}

export function isYoutubeCandidate(row) {
  return row.youtube_status === 'renderizado'
    && !String(row.youtube_video_id || '').trim()
    && /\.mp4$/i.test(String(row.youtube_video_path || '').trim());
}

function stripMarkup(value) {
  return String(value || '').replace(/\*(.+?)\*/g, '$1').replace(/\s+/g, ' ').trim();
}

function youtubeSafeText(value) {
  return stripMarkup(value)
    .replace(/-\s*>/g, '→')
    .replace(/[<>]/g, '');
}

function limit(value, max) {
  const text = String(value || '').trim();
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

export function buildYoutubeMetadata(row, config = getYoutubeConfig()) {
  const title = limit(youtubeSafeText(row.hook || row.tema || row.id || 'Agendamelo'), 100);
  const hashtags = String(row.hashtags || '').trim();
  const description = limit([
    youtubeSafeText(row.caption_seo), youtubeSafeText(row.cta), youtubeSafeText(hashtags),
    youtubeSafeText(row.youtube_music_attribution), youtubeSafeText(`Contenido: ${row.id}`),
  ].filter(Boolean).join('\n\n'), 5000);
  const tags = [...new Set([
    ...hashtags.split(/\s+/).map((tag) => tag.replace(/^#/, '')).filter(Boolean),
    'Agendamelo', 'Shorts',
  ])].slice(0, 25);
  return {
    snippet: { title, description, tags, categoryId: config.categoryId },
    status: { privacyStatus: config.privacyStatus, selfDeclaredMadeForKids: false },
  };
}

export function buildYoutubeDryRun({ config = getYoutubeConfig(), file = config.kitsCsv } = {}) {
  const summary = youtubeConfigSummary(config);
  const rows = readYoutubeRows(file);
  const queue = rows.filter(isYoutubeCandidate);
  const next = queue[0];
  if (!next) return { ...summary, csvExists: existsSync(file), queued: 0, next: null };
  const videoPath = youtubeVideoPath(next);
  const metadata = buildYoutubeMetadata(next, config);
  return {
    ...summary,
    csvExists: true,
    queued: queue.length,
    next: {
      id: next.id,
      videoPath,
      videoExists: existsSync(videoPath),
      title: metadata.snippet.title,
      privacyStatus: metadata.status.privacyStatus,
    },
  };
}

export function createYoutubeAuth(config = getYoutubeConfig()) {
  const { clientId, clientSecret } = readOauthClientFile(config.clientFile);
  const refreshToken = readRefreshTokenFile(config.tokenFile);
  const auth = new google.auth.OAuth2(clientId, clientSecret);
  auth.setCredentials({ refresh_token: refreshToken });
  return auth;
}

export function createYoutubeClient(config = getYoutubeConfig()) {
  return google.youtube({ version: 'v3', auth: createYoutubeAuth(config) });
}

export async function checkYoutubeConnection({ config = getYoutubeConfig(), authClient } = {}) {
  const summary = youtubeConfigSummary(config);
  if (!summary.ready) throw new Error(`Configuración YouTube incompleta: ${summary.missing.join(', ')}.`);
  const auth = authClient || createYoutubeAuth(config);
  const access = await auth.getAccessToken();
  if (!access?.token) throw new Error('Google no pudo renovar el acceso de YouTube.');
  return { authenticated: true, scope: 'youtube.upload', privacyStatus: config.privacyStatus };
}

export async function publishNextYoutube({
  id = '', config = getYoutubeConfig(), file = config.kitsCsv, youtubeClient, now = () => new Date(),
} = {}) {
  const summary = youtubeConfigSummary(config);
  if (!summary.ready) throw new Error(`Configuración YouTube incompleta: ${summary.missing.join(', ')}.`);
  const rows = readYoutubeRows(file);
  const row = id ? rows.find((item) => item.id === id) : rows.find(isYoutubeCandidate);
  if (!row) return null;
  if (!isYoutubeCandidate(row)) {
    throw new Error(`${row.id}: requiere youtube_status=renderizado, MP4 y ningún youtube_video_id.`);
  }
  const videoPath = youtubeVideoPath(row);
  if (!existsSync(videoPath)) throw new Error(`${row.id}: no existe el MP4 ${videoPath}.`);

  row.youtube_status = 'subiendo';
  row.youtube_error = '';
  saveYoutubeRows(rows, file);
  try {
    const client = youtubeClient || createYoutubeClient(config);
    const response = await client.videos.insert({
      part: ['id', 'snippet', 'status'],
      notifySubscribers: config.notifySubscribers,
      requestBody: buildYoutubeMetadata(row, config),
      media: { mimeType: 'video/mp4', body: createReadStream(videoPath) },
    });
    const videoId = String(response.data.id || '').trim();
    if (!videoId) throw new Error('YouTube no devolvió el ID del video.');
    row.youtube_video_id = videoId;
    row.youtube_status = 'publicado';
    row.youtube_published_at = now().toISOString();
    row.youtube_error = '';
    saveYoutubeRows(rows, file);
    return { id: row.id, videoId, privacyStatus: config.privacyStatus };
  } catch (error) {
    row.youtube_status = 'error';
    row.youtube_error = String(error.message || error).slice(0, 500);
    saveYoutubeRows(rows, file);
    throw error;
  }
}

async function main() {
  const [mode = 'dry-run', id] = process.argv.slice(2);
  const config = getYoutubeConfig();
  if (mode === 'dry-run') {
    const result = buildYoutubeDryRun({ config });
    console.log(JSON.stringify(result, null, 2));
    if (!result.ready || (result.next && !result.next.videoExists)) process.exitCode = 1;
    return;
  }
  if (mode === 'check') {
    console.log(JSON.stringify(await checkYoutubeConnection({ config }), null, 2));
    return;
  }
  if (mode !== 'next' && mode !== 'one') {
    throw new Error('Uso: youtube.js dry-run | check | next | one <id>');
  }
  const result = await publishNextYoutube({ id: mode === 'one' ? id : '', config });
  console.log(result
    ? `✓ ${result.id} subido como ${result.privacyStatus} (video ${result.videoId}).`
    : 'No hay Shorts renderizados por publicar.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(error.message); process.exit(1); });
}
