// Publicación segura en Facebook Pages e Instagram Professional mediante Meta Graph API.
//
// Uso:
//   node src/meta.js dry-run        valida configuración y muestra la próxima pieza
//   node src/meta.js next           publica la siguiente pieza renderizada
//   node src/meta.js one <id>       publica una pieza concreta
//
// La API de Instagram obtiene los JPEG desde PUBLIC_MEDIA_BASE_URL, que debe apuntar al endpoint
// HTTPS /media del bot en el VPS. Se guarda cada id remoto apenas se crea para poder reintentar una
// publicación parcial sin duplicarla en el canal que ya funcionó.

import './env.js';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildMetaCaption } from './caption.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_CSV = join(ROOT, '..', 'agendamelo_ideas.csv');
const META_COLUMNS = ['facebook_post_id', 'instagram_media_id', 'meta_published_at', 'meta_error'];

export function getMetaConfig(env = process.env) {
  return {
    version: env.META_GRAPH_VERSION || 'v26.0',
    token: (env.META_PAGE_ACCESS_TOKEN || '').trim(),
    pageId: (env.META_PAGE_ID || '').trim(),
    igUserId: (env.META_IG_USER_ID || '').trim(),
    publicBase: (env.PUBLIC_MEDIA_BASE_URL || '').replace(/\/$/, ''),
    trackingUrl: (env.META_TRACKING_URL || '').trim(),
  };
}

export function metaConfigSummary(config = getMetaConfig()) {
  const channels = [config.pageId && 'Facebook', config.igUserId && 'Instagram'].filter(Boolean);
  const missing = [];
  if (!config.token) missing.push('META_PAGE_ACCESS_TOKEN');
  if (!config.pageId && !config.igUserId) missing.push('META_PAGE_ID o META_IG_USER_ID');
  if (!config.publicBase) missing.push('PUBLIC_MEDIA_BASE_URL');
  return { ready: missing.length === 0, channels, missing };
}

export function publicMediaUrls(row, publicBase) {
  if (!/^https:\/\//i.test(publicBase || '')) {
    throw new Error('PUBLIC_MEDIA_BASE_URL debe ser una URL HTTPS pública.');
  }
  const paths = String(row.imagen_url || '').split(',').map((p) => p.trim()).filter(Boolean);
  if (!paths.length) throw new Error(`${row.id}: no tiene imagen_url.`);
  return paths.map((p) => `${publicBase}/${encodeURIComponent(basename(p))}`);
}

export function isMetaCandidate(row, config = getMetaConfig()) {
  if (!['renderizado', 'enviado'].includes(row.estado)) return false;
  return Boolean(
    (config.pageId && !row.facebook_post_id)
    || (config.igUserId && !row.instagram_media_id),
  );
}

function csvPath(env = process.env) {
  return env.AGENDAMELO_CSV || DEFAULT_CSV;
}

function readRows(file = csvPath()) {
  return parse(readFileSync(file), { columns: true, skip_empty_lines: true, relax_quotes: true });
}

export function latestMetaPublishedAt(file = csvPath()) {
  try {
    return readRows(file)
      .map((row) => String(row.meta_published_at || '').trim())
      .filter((value) => value && !Number.isNaN(Date.parse(value)))
      .sort((a, b) => Date.parse(b) - Date.parse(a))[0] || '';
  } catch { return ''; }
}

function saveRows(rows, file = csvPath()) {
  if (!rows.length) return;
  const existing = Object.keys(rows[0]);
  const columns = [...existing, ...META_COLUMNS.filter((c) => !existing.includes(c))];
  writeFileSync(file, stringify(rows, { header: true, columns }));
}

function formBody(data) {
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null || value === '') continue;
    body.set(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
  }
  return body;
}

async function graphRequest(path, { method = 'POST', data = {}, token, fetchImpl = fetch, version = 'v26.0' }) {
  const url = new URL(`https://graph.facebook.com/${version}/${path.replace(/^\//, '')}`);
  const options = { method, headers: { Authorization: `Bearer ${token}` } };
  if (method === 'GET') {
    for (const [k, v] of Object.entries(data)) url.searchParams.set(k, String(v));
  } else {
    options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    options.body = formBody(data);
  }
  const res = await fetchImpl(url, options);
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) {
    const detail = json.error?.message || json.message || `${res.status} ${res.statusText}`;
    throw new Error(`Meta ${method} /${path}: ${detail}`);
  }
  return json;
}

export async function checkMetaConnection({ config = getMetaConfig(), fetchImpl = fetch } = {}) {
  const missing = [];
  if (!config.token) missing.push('META_PAGE_ACCESS_TOKEN');
  if (!config.pageId && !config.igUserId) missing.push('META_PAGE_ID o META_IG_USER_ID');
  if (missing.length) throw new Error(`Configuración Meta incompleta: ${missing.join(', ')}.`);

  let page = null;
  let instagram = null;
  let detectedIgUserId = '';
  const warnings = [];

  if (config.pageId) {
    const out = await graphRequest(config.pageId, {
      method: 'GET', data: { fields: 'id,name,instagram_business_account' }, token: config.token,
      version: config.version, fetchImpl,
    });
    detectedIgUserId = out.instagram_business_account?.id || '';
    page = { id: out.id || config.pageId, name: out.name || '' };
    if (!detectedIgUserId) warnings.push('La página no informa una cuenta profesional de Instagram conectada.');
  }

  const igUserId = config.igUserId || detectedIgUserId;
  if (config.igUserId && detectedIgUserId && config.igUserId !== detectedIgUserId) {
    warnings.push(`META_IG_USER_ID no coincide con el Instagram conectado a la página (${detectedIgUserId}).`);
  }
  if (igUserId) {
    const out = await graphRequest(igUserId, {
      method: 'GET', data: { fields: 'id,username' }, token: config.token,
      version: config.version, fetchImpl,
    });
    instagram = { id: out.id || igUserId, username: out.username || '' };
  }

  if (!config.publicBase) warnings.push('Falta PUBLIC_MEDIA_BASE_URL; todavía no se pueden publicar imágenes.');
  return { page, instagram, detectedIgUserId, publicMediaReady: /^https:\/\//i.test(config.publicBase), warnings };
}

async function waitForContainer(containerId, config, fetchImpl) {
  // Las imágenes suelen quedar listas de inmediato. Este polling corto evita publicar mientras
  // Meta todavía procesa el contenedor, sin mantener el job bloqueado varios minutos.
  for (let attempt = 0; attempt < 12; attempt++) {
    const state = await graphRequest(containerId, {
      method: 'GET', data: { fields: 'status_code' }, token: config.token,
      version: config.version, fetchImpl,
    });
    if (state.status_code === 'FINISHED' || state.status_code === 'PUBLISHED') return;
    if (state.status_code === 'ERROR' || state.status_code === 'EXPIRED') {
      throw new Error(`Instagram: contenedor ${containerId} quedó ${state.status_code}.`);
    }
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  throw new Error(`Instagram: el contenedor ${containerId} no quedó listo en 60 segundos.`);
}

export async function publishFacebook({ urls, caption, config, fetchImpl = fetch }) {
  if (urls.length === 1) {
    const out = await graphRequest(`${config.pageId}/photos`, {
      data: { url: urls[0], message: caption }, token: config.token,
      version: config.version, fetchImpl,
    });
    return out.post_id || out.id;
  }

  const mediaIds = [];
  for (const url of urls) {
    const out = await graphRequest(`${config.pageId}/photos`, {
      data: { url, published: false }, token: config.token,
      version: config.version, fetchImpl,
    });
    mediaIds.push(out.id);
  }
  const out = await graphRequest(`${config.pageId}/feed`, {
    data: { message: caption, attached_media: mediaIds.map((id) => ({ media_fbid: id })) },
    token: config.token, version: config.version, fetchImpl,
  });
  return out.id;
}

export async function publishInstagram({ urls, caption, altText, config, fetchImpl = fetch }) {
  if (urls.some((url) => !/\.jpe?g(?:$|\?)/i.test(url))) {
    throw new Error('Instagram Content Publishing admite JPEG: vuelve a renderizar esta pieza.');
  }

  let creationId;
  if (urls.length === 1) {
    const out = await graphRequest(`${config.igUserId}/media`, {
      data: { image_url: urls[0], caption, alt_text: altText }, token: config.token,
      version: config.version, fetchImpl,
    });
    creationId = out.id;
  } else {
    const children = [];
    for (const imageUrl of urls.slice(0, 10)) {
      const child = await graphRequest(`${config.igUserId}/media`, {
        data: { image_url: imageUrl, is_carousel_item: true }, token: config.token,
        version: config.version, fetchImpl,
      });
      await waitForContainer(child.id, config, fetchImpl);
      children.push(child.id);
    }
    const parent = await graphRequest(`${config.igUserId}/media`, {
      data: { media_type: 'CAROUSEL', children: children.join(','), caption },
      token: config.token, version: config.version, fetchImpl,
    });
    creationId = parent.id;
  }

  await waitForContainer(creationId, config, fetchImpl);
  const published = await graphRequest(`${config.igUserId}/media_publish`, {
    data: { creation_id: creationId }, token: config.token,
    version: config.version, fetchImpl,
  });
  return published.id;
}

export async function publishNext({ id = '', config = getMetaConfig(), fetchImpl = fetch, file = csvPath() } = {}) {
  const summary = metaConfigSummary(config);
  if (!summary.ready) throw new Error(`Configuración Meta incompleta: ${summary.missing.join(', ')}.`);

  const rows = readRows(file);
  const row = id
    ? rows.find((r) => r.id === id)
    : rows.find((r) => isMetaCandidate(r, config));
  if (!row) return null;
  if (!['renderizado', 'enviado', 'publicado'].includes(row.estado)) {
    throw new Error(`${row.id}: estado ${row.estado}; primero debe quedar renderizado.`);
  }

  const urls = publicMediaUrls(row, config.publicBase);
  const caption = buildMetaCaption(row).slice(0, 2200);
  const facebookCaption = [caption, config.trackingUrl].filter(Boolean).join('\n\n').slice(0, 63206);
  const altText = String(row.hook_elegido || row.hook || row.titulo || 'Contenido de Agendamelo').replace(/\*/g, '');
  let completed = false;

  try {
    if (config.pageId && !row.facebook_post_id) {
      row.facebook_post_id = await publishFacebook({ urls, caption: facebookCaption, config, fetchImpl });
      row.meta_error = '';
      saveRows(rows, file);
    }
    if (config.igUserId && !row.instagram_media_id) {
      row.instagram_media_id = await publishInstagram({ urls, caption, altText, config, fetchImpl });
      row.meta_error = '';
      saveRows(rows, file);
    }

    const facebookDone = !config.pageId || !!row.facebook_post_id;
    const instagramDone = !config.igUserId || !!row.instagram_media_id;
    completed = facebookDone && instagramDone;
    if (completed) {
      row.estado = 'publicado';
      row.meta_published_at = new Date().toISOString();
      row.meta_error = '';
      saveRows(rows, file);
    }
    return { id: row.id, completed, facebookPostId: row.facebook_post_id || '', instagramMediaId: row.instagram_media_id || '' };
  } catch (error) {
    row.meta_error = String(error.message || error).slice(0, 500);
    saveRows(rows, file);
    throw error;
  }
}

async function main() {
  const [mode = 'dry-run', id] = process.argv.slice(2);
  const config = getMetaConfig();
  const summary = metaConfigSummary(config);

  if (mode === 'dry-run') {
    const rows = readRows();
    const next = id ? rows.find((r) => r.id === id) : rows.find((r) => isMetaCandidate(r, config));
    console.log(JSON.stringify({ ...summary, graphVersion: config.version, publicBase: config.publicBase || null,
      trackingUrl: config.trackingUrl || null,
      next: next ? { id: next.id, formato: next.formato, imagen_url: next.imagen_url } : null }, null, 2));
    if (!summary.ready) process.exitCode = 1;
    return;
  }
  if (mode === 'check') {
    console.log(JSON.stringify(await checkMetaConnection({ config }), null, 2));
    return;
  }
  if (mode !== 'next' && mode !== 'one') throw new Error('Uso: meta.js dry-run | check | next | one <id>');
  const result = await publishNext({ id: mode === 'one' ? id : '' });
  console.log(result ? `✓ ${result.id} publicado en ${summary.channels.join(' + ')}` : 'No hay piezas renderizadas por publicar.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(error.message); process.exit(1); });
}
