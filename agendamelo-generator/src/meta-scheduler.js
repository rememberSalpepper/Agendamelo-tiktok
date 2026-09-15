// Reloj diario del publicador Meta. Vive dentro del proceso del bot; el CSV evita duplicados y
// meta.js guarda ids por canal para reanudar publicaciones parciales.

import { publishNext, getMetaConfig, latestMetaPublishedAt, metaConfigSummary } from './meta.js';

export function localDateTime(date = new Date(), timeZone = 'America/Santiago') {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const pick = (type) => parts.find((p) => p.type === type)?.value || '';
  return { date: `${pick('year')}-${pick('month')}-${pick('day')}`, time: `${pick('hour')}:${pick('minute')}` };
}

export function shouldPublishNow({ now = new Date(), publishTime = '20:30', timeZone = 'America/Santiago', lastSuccessDate = '' } = {}) {
  const local = localDateTime(now, timeZone);
  return local.date !== lastSuccessDate && local.time >= publishTime;
}

export function validPublishTime(value) {
  return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(String(value || ''));
}

export function startMetaScheduler(env = process.env) {
  if (String(env.META_AUTO_PUBLISH || '').toLowerCase() !== 'true') {
    console.log('Meta auto-publicación: desactivada.');
    return { stop() {} };
  }
  const config = getMetaConfig(env);
  const summary = metaConfigSummary(config);
  if (!summary.ready) {
    console.error(`Meta auto-publicación: configuración incompleta (${summary.missing.join(', ')}).`);
    return { stop() {} };
  }

  const publishTime = env.META_PUBLISH_TIME || '20:30';
  const timeZone = env.META_TIMEZONE || 'America/Santiago';
  if (!validPublishTime(publishTime)) {
    console.error(`Meta auto-publicación: META_PUBLISH_TIME inválida "${publishTime}" (usa HH:MM).`);
    return { stop() {} };
  }
  try { localDateTime(new Date(), timeZone); }
  catch {
    console.error(`Meta auto-publicación: META_TIMEZONE inválida "${timeZone}".`);
    return { stop() {} };
  }
  const previousPublish = latestMetaPublishedAt();
  let lastSuccessDate = previousPublish ? localDateTime(new Date(previousPublish), timeZone).date : '';
  let busy = false;
  let retryAfter = 0;

  const tick = async () => {
    const now = new Date();
    if (busy || Date.now() < retryAfter || !shouldPublishNow({ now, publishTime, timeZone, lastSuccessDate })) return;
    busy = true;
    try {
      const result = await publishNext({ config });
      const local = localDateTime(now, timeZone);
      if (result?.completed) {
        lastSuccessDate = local.date;
        console.log(`Meta auto-publicación: ${result.id} publicado (${local.date}).`);
      } else if (!result) {
        // No hay cola: no revises cada minuto; vuelve a mirar en una hora.
        retryAfter = Date.now() + 60 * 60 * 1000;
        console.log('Meta auto-publicación: no hay piezas renderizadas en cola.');
      }
    } catch (error) {
      retryAfter = Date.now() + 30 * 60 * 1000;
      console.error(`Meta auto-publicación: ${error.message}. Reintento en 30 min.`);
    } finally { busy = false; }
  };

  const timer = setInterval(tick, 60 * 1000);
  timer.unref?.();
  tick();
  console.log(`Meta auto-publicación: activa a las ${publishTime} (${timeZone}) · ${summary.channels.join(' + ')}.`);
  return { stop() { clearInterval(timer); } };
}
