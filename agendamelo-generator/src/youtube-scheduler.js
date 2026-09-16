// Reloj diario independiente para YouTube Shorts. A la hora configurada renderiza como máximo un
// kit pendiente (si no existe uno listo) y sube exactamente un MP4. El CSV conserva el estado y el
// video_id, de modo que los reinicios no duplican cargas.

import {
  getYoutubeConfig, isYoutubeCandidate, latestYoutubePublishedAt, publishNextYoutube,
  readYoutubeRows, youtubeConfigSummary,
} from './youtube.js';
import { isShortRenderCandidate, renderShortQueue } from './youtube-render.js';
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  duePublishSlot, localDateTime, publicationSlotKey, validPublishTime,
} from './meta-scheduler.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

export function dueYoutubePublishSlot({
  now = new Date(), publishTime = '20:30', timeZone = 'America/Santiago',
  lastSuccessDate = '', lastSuccessSlot = '',
} = {}) {
  const local = localDateTime(now, timeZone);
  if (lastSuccessDate === local.date) return '';
  return duePublishSlot({ now, publishTimes: [publishTime], timeZone, lastSuccessSlot });
}

export function generateYoutubeKit({ niche = 'manicuristas' } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['src/kit.js', '1', niche], {
      cwd: ROOT,
      env: process.env,
      timeout: 8 * 60 * 1000,
    });
    let output = '';
    let errors = '';
    child.stdout.on('data', (chunk) => { output = `${output}${chunk}`.slice(-8000); });
    child.stderr.on('data', (chunk) => { errors = `${errors}${chunk}`.slice(-8000); });
    child.on('error', reject);
    child.on('close', (code, signal) => {
      if (code === 0) resolve({ output });
      else {
        const detail = (errors || output).trim().split('\n').slice(-3).join(' · ');
        reject(new Error(`generación de kit falló${signal ? ` (${signal})` : ''}: ${detail || `código ${code}`}`));
      }
    });
  });
}

export async function runYoutubePublicationCycle({
  config = getYoutubeConfig(),
  file = config.kitsCsv,
  autoRender = true,
  autoGenerate = true,
  generateNiche = 'manicuristas',
  readRows = readYoutubeRows,
  generate = generateYoutubeKit,
  renderQueue = renderShortQueue,
  publish = publishNextYoutube,
} = {}) {
  let rows = readRows(file);
  let ready = rows.find(isYoutubeCandidate);
  let renderedId = '';
  let generatedId = '';

  if (!ready && autoRender) {
    let pending = rows.find(isShortRenderCandidate);
    if (!pending && autoGenerate) {
      const previousIds = new Set(rows.map((row) => row.id));
      await generate({ niche: generateNiche });
      rows = readRows(file);
      pending = rows.find((row) => !previousIds.has(row.id) && isShortRenderCandidate(row));
      if (!pending) throw new Error('la generación automática no dejó un kit pendiente nuevo');
      generatedId = pending.id;
    }
    if (pending) {
      const rendered = await renderQueue({ file, mode: 'one', id: pending.id });
      renderedId = rendered[0]?.id || '';
      rows = readRows(file);
      ready = rows.find(isYoutubeCandidate);
    }
  }

  if (!ready) return null;
  const published = await publish({ config, file });
  return published ? {
    ...published,
    generatedNow: Boolean(generatedId),
    renderedNow: Boolean(renderedId),
  } : null;
}

export function startYoutubeScheduler(env = process.env, dependencies = {}) {
  if (String(env.YOUTUBE_AUTO_PUBLISH || '').toLowerCase() !== 'true') {
    console.log('YouTube auto-publicación: desactivada.');
    return { stop() {}, tick: async () => {} };
  }

  const config = dependencies.config || getYoutubeConfig(env);
  const summary = youtubeConfigSummary(config);
  if (!summary.ready) {
    console.error(`YouTube auto-publicación: configuración incompleta (${summary.missing.join(', ')}).`);
    return { stop() {}, tick: async () => {} };
  }

  const publishTime = String(env.YOUTUBE_PUBLISH_TIME || '20:30').trim();
  const timeZone = env.YOUTUBE_TIMEZONE || 'America/Santiago';
  const autoRender = String(env.YOUTUBE_AUTO_RENDER || 'true').toLowerCase() !== 'false';
  const autoGenerate = String(env.YOUTUBE_AUTO_GENERATE || 'true').toLowerCase() !== 'false';
  const generateNiche = String(env.YOUTUBE_AUTO_GENERATE_NICHE || 'manicuristas').trim();
  if (!validPublishTime(publishTime)) {
    console.error(`YouTube auto-publicación: horario inválido "${publishTime}" (usa HH:MM).`);
    return { stop() {}, tick: async () => {} };
  }
  try { localDateTime(new Date(), timeZone); }
  catch {
    console.error(`YouTube auto-publicación: YOUTUBE_TIMEZONE inválida "${timeZone}".`);
    return { stop() {}, tick: async () => {} };
  }

  const previousPublish = latestYoutubePublishedAt(config.kitsCsv);
  let lastSuccessSlot = publicationSlotKey(previousPublish, [publishTime], timeZone);
  let lastSuccessDate = previousPublish
    ? localDateTime(new Date(previousPublish), timeZone).date
    : '';
  let busy = false;
  let retryAfter = 0;

  const tick = async () => {
    const now = new Date();
    const dueSlot = dueYoutubePublishSlot({
      now, publishTime, timeZone, lastSuccessDate, lastSuccessSlot,
    });
    if (busy || Date.now() < retryAfter || !dueSlot) return;
    busy = true;
    try {
      const result = await runYoutubePublicationCycle({
        config,
        autoRender,
        autoGenerate,
        generateNiche,
        ...(dependencies.readRows ? { readRows: dependencies.readRows } : {}),
        ...(dependencies.generate ? { generate: dependencies.generate } : {}),
        ...(dependencies.renderQueue ? { renderQueue: dependencies.renderQueue } : {}),
        ...(dependencies.publish ? { publish: dependencies.publish } : {}),
      });
      const local = localDateTime(now, timeZone);
      if (result) {
        lastSuccessSlot = dueSlot;
        lastSuccessDate = local.date;
        console.log(
          `YouTube auto-publicación: ${result.id} subido como ${result.privacyStatus} `
          + `(${local.date}, ${publishTime}).`,
        );
      } else {
        retryAfter = Date.now() + 60 * 60 * 1000;
        console.log('YouTube auto-publicación: no hay kits pendientes ni Shorts renderizados.');
      }
    } catch (error) {
      retryAfter = Date.now() + 30 * 60 * 1000;
      console.error(`YouTube auto-publicación: ${error.message}. Reintento en 30 min.`);
    } finally { busy = false; }
  };

  const timer = setInterval(tick, 60 * 1000);
  timer.unref?.();
  tick();
  console.log(
    `YouTube auto-publicación: activa a las ${publishTime} (${timeZone}) · `
    + `${summary.privacyStatus} · auto-render ${autoRender ? 'sí' : 'no'} · `
    + `auto-generación ${autoGenerate ? generateNiche : 'no'}.`,
  );
  return { stop() { clearInterval(timer); }, tick };
}
