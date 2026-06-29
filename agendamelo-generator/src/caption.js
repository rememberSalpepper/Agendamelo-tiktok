// Arma el caption final de TikTok a partir de una fila del CSV.
//
// Regla TikTok-SEO: la PRIMERA LÍNEA es lo que TikTok muestra colapsado e indexa más fuerte, así que
// va el HOOK con la keyword dentro (no enterrada bajo el pliegue). Recién DESPUÉS van los 👇 que
// empujan el resto del texto hacia abajo para no tapar la imagen, la descripción y los hashtags.
//
// A/B de largo (campo estilo_caption o settings global): "corto" usa descripcion_corta (gancho de
// ≤150 car.); "largo" usa la descripción larga SEO. Sirve para medir retención sin asumir cuál gana.

import { getSettings } from './settings.js';

const TEASE = '👇\n👇\n👇';

// Quita los *asteriscos* de énfasis (sirven solo para resaltar en la imagen, no en el caption).
const stripEmphasis = (s) => String(s || '').replace(/\*(.+?)\*/g, '$1');

// Resuelve el estilo efectivo: override por fila > setting global > 'largo'.
function resolveEstilo(row) {
  const perRow = (row.estilo_caption || '').trim().toLowerCase();
  if (perRow === 'corto' || perRow === 'largo') return perRow;
  return getSettings().estilo_caption || 'largo';
}

export function buildCaption(row) {
  const hook = stripEmphasis((row.hook_elegido || row.hook || '').trim());
  const estilo = resolveEstilo(row);
  const corta = stripEmphasis((row.descripcion_corta || '').trim());
  const larga = stripEmphasis((row.descripcion || '').trim());
  // "corto" usa la frase gancho; si no existe, cae a la larga para no quedar sin cuerpo.
  const body = estilo === 'corto' && corta ? corta : larga;
  const tags = (row.hashtags || '').trim();

  // Línea 1 = hook+keyword. Si por alguna razón no hay hook, abrimos con el cuerpo (que también
  // empieza con la keyword) para nunca dejar la primera línea con los 👇.
  const head = hook || body;
  const rest = hook ? body : '';
  return [head, TEASE, rest, '', tags].filter((p) => p !== null).join('\n').replace(/\n{3,}/g, '\n\n').trim();
}
