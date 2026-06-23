// Validación de una fila del CSV (fuente única para lint.js y review.js).
// Devuelve un arreglo de problemas (strings); vacío = fila válida.

import { TIPOS, NICHOS, ORIENTACIONES, FORMATOS } from './prompt.js';

export function validateRow(r) {
  const e = [];
  const tags = (r.hashtags || '').trim().split(/\s+/).filter(Boolean);
  if (tags.length !== 5) e.push(`debe tener 5 hashtags (tiene ${tags.length})`);
  if (!tags.includes('#agendamelo')) e.push('falta #agendamelo');
  if (!NICHOS.includes(r.niche)) e.push(`niche inválido "${r.niche}"`);
  if (!ORIENTACIONES.includes(r.orientacion)) e.push(`orientacion inválida "${r.orientacion}"`);
  if (!FORMATOS.includes(r.formato)) e.push(`formato inválido "${r.formato}"`);
  if (!r.tema) e.push('falta tema');
  if (!r.hook) e.push('falta hook');
  if ((r.descripcion || '').length < 1200) e.push(`descripción corta (${(r.descripcion || '').length} car.)`);

  let content = null;
  try { content = JSON.parse(r.imagen_json); } catch { e.push('imagen_json inválido o vacío'); }

  if (r.formato === 'carrusel') {
    if (r.tipo_plantilla !== 'carrusel') e.push('carrusel debe tener tipo_plantilla "carrusel"');
    const s = content && content.slides;
    if (!Array.isArray(s) || s.length < 3 || s.length > 4) e.push('carrusel debe tener 3-4 slides');
    else if (s[0].tipo !== 'portada' || s.at(-1).tipo !== 'cierre' || !s.at(-1).cta) {
      e.push('carrusel debe iniciar en portada y cerrar en cierre con CTA');
    }
  } else if (!TIPOS.includes(r.tipo_plantilla)) {
    e.push(`tipo_plantilla desconocido "${r.tipo_plantilla}"`);
  }
  return e;
}
