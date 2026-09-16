// Reloj diario independiente para YouTube Shorts. A la hora configurada renderiza como máximo un
// kit pendiente (si no existe uno listo) y sube exactamente un MP4. El CSV conserva el estado y el
// video_id, de modo que los reinicios no duplican cargas.

import {
  getYoutubeConfig, isYoutubeCandidate, latestYoutubePublishedAt, publishNextYoutube,
  readYoutubeRows, youtubeConfigSummary,
} from './youtube.js';
import { isShortRenderCandidate, renderShortQueue } from './youtube-render.js';
import {
  duePublishSlot, localDateTime, publicationSlotKey, validPublishTime,
} from './meta-scheduler.js';

export async function runYoutubePublicationCycle({
  config = getYoutubeConfig(),
  file = config.kitsCsv,
  autoRender = true,
  readRows = readYoutubeRows,
  renderQueue = renderShortQueue,
  publish = publishNextYoutube,
} = {}) {
  let rows = readRows(file);
  let ready = rows.find(isYoutubeCandidate);
  let renderedId = '';

  if (!ready && autoRender) {
    const pending = rows.find(isShortRenderCandidate);
    if (pending) {
      const rendered = await renderQueue({ file, mode: 'one', id: pending.id });
      renderedId = rendered[0]?.id || '';
      rows = readRows(file);
      ready = rows.find(isYoutubeCandidate);
    }
  }

  if (!ready && !renderedId) return null;
  const published = await publish({ config, file });
  return published ? { ...published, renderedNow: Boolean(renderedId) } : null;
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
  let busy = false;
  let retryAfter = 0;

  const tick = async () => {
    const now = new Date();
    const dueSlot = duePublishSlot({
      now, publishTimes: [publishTime], timeZone, lastSuccessSlot,
    });
    if (busy || Date.now() < retryAfter || !dueSlot) return;
    busy = true;
    try {
      const result = await runYoutubePublicationCycle({
        config,
        autoRender,
        ...(dependencies.readRows ? { readRows: dependencies.readRows } : {}),
        ...(dependencies.renderQueue ? { renderQueue: dependencies.renderQueue } : {}),
        ...(dependencies.publish ? { publish: dependencies.publish } : {}),
      });
      const local = localDateTime(now, timeZone);
      if (result) {
        lastSuccessSlot = dueSlot;
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
    + `${summary.privacyStatus} · auto-render ${autoRender ? 'sí' : 'no'}.`,
  );
  return { stop() { clearInterval(timer); }, tick };
}
