// Validación de una fila del CSV (fuente única para lint.js y review.js).
// Devuelve un arreglo de problemas (strings); vacío = fila válida.

import { TIPOS, NICHOS, ORIENTACIONES, FORMATOS, ANGULOS } from './prompt.js';

// Marcadores INEQUÍVOCOS de español argentino (voseo acentuado + slang). Conservador a propósito:
// se excluyen formas ambiguas que también son español neutro correcto ("haces", "salí" pretérito).
const VOSEO = /(?<![\p{L}])(vos|tenés|querés|podés|sabés|decís|hacés|andás|vení|andá|mirá|fij[aá]te|elegí|prob[aá](?:lo)?|contame|decime|mandame|sumá|che|guita|boludo|pibe|laburar|laburo|posta|copado|chau)(?![\p{L}])/iu;

// Devuelve el primer término argentino encontrado, o null.
export function findVoseo(text) {
  const m = VOSEO.exec(String(text || ''));
  return m ? m[1] : null;
}

const stripEmphasis = (s) => String(s || '').replace(/\*(.+?)\*/g, '$1');
const wordCount = (s) => stripEmphasis(s).trim().split(/\s+/).filter(Boolean).length;

export function validateRow(r) {
  const e = [];
  const tags = (r.hashtags || '').trim().split(/\s+/).filter(Boolean);
  if (tags.length !== 5) e.push(`debe tener 5 hashtags (tiene ${tags.length})`);
  if (!tags.includes('#agendamelo')) e.push('falta #agendamelo');
  if (!NICHOS.includes(r.niche)) e.push(`niche inválido "${r.niche}"`);
  if (!ORIENTACIONES.includes(r.orientacion)) e.push(`orientacion inválida "${r.orientacion}"`);
  if (!FORMATOS.includes(r.formato)) e.push(`formato inválido "${r.formato}"`);
  if (!r.tema) e.push('falta tema');

  // Hook efectivo (lo que usa el render): obligatorio, ≤12 palabras, con su ángulo.
  if (!r.hook) e.push('falta hook');
  else if (wordCount(r.hook) > 12) e.push(`hook >12 palabras (${wordCount(r.hook)})`);
  if (!r.angulo) e.push('falta angulo');
  else if (!ANGULOS.includes(r.angulo)) e.push(`angulo inválido "${r.angulo}"`);

  // Variantes de hook (si existen — filas nuevas): 3-5, cada una con texto y ángulo conocido.
  if (r.hook_variantes) {
    try {
      const v = JSON.parse(r.hook_variantes);
      if (!Array.isArray(v) || v.length < 3 || v.length > 5) e.push('hook_variantes debe tener 3-5');
      else for (const it of v) {
        if (!it || !it.texto || !ANGULOS.includes(it.angulo)) { e.push('hook_variantes con item inválido'); break; }
      }
    } catch { e.push('hook_variantes JSON inválido'); }
  }

  if ((r.descripcion || '').length < 1200) e.push(`descripción corta (${(r.descripcion || '').length} car.)`);
  if (r.descripcion_corta && r.descripcion_corta.length > 200) e.push(`descripcion_corta muy larga (${r.descripcion_corta.length} car., máx 200)`);

  // Idioma (regla dura de marca): cero voseo argentino en hook, descripción y variante corta.
  for (const [campo, txt] of [['hook', r.hook], ['descripcion', r.descripcion], ['descripcion_corta', r.descripcion_corta]]) {
    const hit = findVoseo(txt);
    if (hit) e.push(`voseo argentino en ${campo}: "${hit}"`);
  }

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
