// Caption para Facebook/Instagram. El generador visual ya no usa el formato SEO artificial de
// TikTok (flechas y bloques largos): abre con valor, respira y cierra con el embudo freemium.

import { getSettings } from './settings.js';

const stripEmphasis = (s) => String(s || '').replace(/\*(.+?)\*/g, '$1');

// Resuelve el estilo efectivo: override por fila > setting global > 'largo'.
function resolveEstilo(row) {
  const perRow = (row.estilo_caption || '').trim().toLowerCase();
  if (perRow === 'corto' || perRow === 'largo') return perRow;
  return getSettings().estilo_caption || 'largo';
}

const CTA = {
  educativo: 'Guárdalo para ordenar tu agenda. Tu página gratis está en agendamelo.cl.',
  plataforma: 'Crea tu Perfil Gratis en agendamelo.cl. Sin tarjeta y sin fecha de término.',
  venta: 'Crea tu Perfil Gratis en agendamelo.cl. La agenda completa se prueba 7 días gratis, sin tarjeta.',
};

export function buildMetaCaption(row) {
  const estilo = resolveEstilo(row);
  const corta = stripEmphasis((row.descripcion_corta || '').trim());
  const larga = stripEmphasis((row.descripcion || '').trim());
  const body = estilo === 'corto' && corta ? corta : (larga || corta);
  const cta = CTA[row.orientacion] || CTA.plataforma;
  const tags = (row.hashtags || '').trim();
  return [body, cta, tags].filter(Boolean).join('\n\n').trim();
}

// Compatibilidad con telegram.js y cualquier integración previa.
export const buildCaption = buildMetaCaption;
