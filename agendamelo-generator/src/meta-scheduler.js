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

export function validPublishTime(value) {
  return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(String(value || ''));
}

export function parsePublishTimes(value = '20:30') {
  const times = String(value || '').split(',').map((time) => time.trim()).filter(Boolean);
  if (times.length === 0 || times.some((time) => !validPublishTime(time))) return [];
  return [...new Set(times)].sort();
}

export function duePublishSlot({
  now = new Date(), publishTimes = ['20:30'], timeZone = 'America/Santiago', lastSuccessSlot = '',
} = {}) {
  const local = localDateTime(now, timeZone);
  // Si el proceso estuvo detenido, recupera solo la franja vencida más reciente. Así no publica
  // tres piezas juntas al volver a arrancar por la noche.
  const dueTime = publishTimes.filter((time) => time <= local.time).at(-1);
  if (!dueTime) return '';
  const slot = `${local.date}|${dueTime}`;
  return slot === lastSuccessSlot ? '' : slot;
}

export function publicationSlotKey(publishedAt, publishTimes = ['20:30'], timeZone = 'America/Santiago') {
  if (!publishedAt) return '';
  const local = localDateTime(new Date(publishedAt), timeZone);
  const slotTime = publishTimes.filter((time) => time <= local.time).at(-1);
  return slotTime ? `${local.date}|${slotTime}` : '';
}

// Compatibilidad para integraciones y pruebas que aún usan una sola hora/fecha.
export function shouldPublishNow({
  now = new Date(), publishTime = '20:30', publishTimes,
  timeZone = 'America/Santiago', lastSuccessDate = '', lastSuccessSlot = '',
} = {}) {
  const times = publishTimes || [publishTime];
  const local = localDateTime(now, timeZone);
  if (lastSuccessDate && lastSuccessDate === local.date) return false;
  return Boolean(duePublishSlot({ now, publishTimes: times, timeZone, lastSuccessSlot }));
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

  const rawPublishTimes = env.META_PUBLISH_TIMES || env.META_PUBLISH_TIME || '20:30';
  const publishTimes = parsePublishTimes(rawPublishTimes);
  const timeZone = env.META_TIMEZONE || 'America/Santiago';
  if (publishTimes.length === 0) {
    console.error(`Meta auto-publicación: horario inválido "${rawPublishTimes}" (usa HH:MM separado por comas).`);
    return { stop() {} };
  }
  try { localDateTime(new Date(), timeZone); }
  catch {
    console.error(`Meta auto-publicación: META_TIMEZONE inválida "${timeZone}".`);
    return { stop() {} };
  }
  const previousPublish = latestMetaPublishedAt();
  let lastSuccessSlot = publicationSlotKey(previousPublish, publishTimes, timeZone);
  let busy = false;
  let retryAfter = 0;

  const tick = async () => {
    const now = new Date();
    const dueSlot = duePublishSlot({ now, publishTimes, timeZone, lastSuccessSlot });
    if (busy || Date.now() < retryAfter || !dueSlot) return;
    busy = true;
    try {
      const result = await publishNext({ config });
      const local = localDateTime(now, timeZone);
      if (result?.completed) {
        lastSuccessSlot = dueSlot;
        console.log(`Meta auto-publicación: ${result.id} publicado (${local.date}, franja ${dueSlot.split('|')[1]}).`);
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
  console.log(`Meta auto-publicación: activa a las ${publishTimes.join(', ')} (${timeZone}) · ${summary.channels.join(' + ')}.`);
  return { stop() { clearInterval(timer); } };
}
