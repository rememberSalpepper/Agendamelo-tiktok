// Validación de un "kit de video" (modo TikTok/Reels, solo texto). Fuente única de las reglas duras
// de la sección 5 de GUIA_TIKTOK_SEO_FACELESS.md. La usan kit.js (al generar) y lint.js (estático).
// Devuelve un arreglo de problemas (strings); vacío = kit válido.
//
// No toca el modo IMAGEN: reutiliza NICHOS y el detector de voseo, pero define su propio vocabulario
// de ángulos (con el 7º "visibilidad") para no alterar la validación de imágenes.

import { NICHOS } from './prompt.js';
import { findVoseo } from './validate.js';
import { PRICING_20_LIVE } from './kit-config.js';

// 7 ángulos: los 6 del modo imagen + "visibilidad" (que te encuentren en Google/directorios).
// Con 7 ángulos, una tanda de hasta 7 kits puede tener todos los ángulos distintos.
export const KIT_ANGULOS = ['plata', 'tiempo', 'no-show', 'repetir-info', 'comparacion-ig', 'curiosidad', 'visibilidad'];
export const KIT_MAX = 7;           // tope de kits por tanda (regla de Jorge)
export const KIT_DEFAULT = 5;       // default de /kit

// Hashtags genéricos prohibidos (matan el SEO de nicho): #fyp #viral #parati y su familia.
const BANNED_TAGS = new Set([
  '#fyp', '#fypシ', '#fypage', '#foryou', '#foryoupage', '#parati', '#paratii', '#paratipage',
  '#viral', '#viralvideo', '#viraltiktok', '#tiktok', '#trending', '#trend',
]);

// Términos de precio/oferta prohibidos MIENTRAS Pricing 2.0 no esté deployado (ver kit-config.js).
const PRICE_TOKENS = [/gratis/i, /prueba\s+gratis/i, /\btrial\b/i, /\$\s?\d/];

const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const stripEmphasis = (s) => String(s || '').replace(/\*(.+?)\*/g, '$1');
const wordCount = (s) => stripEmphasis(s).trim().split(/\s+/).filter(Boolean).length;
const cleanTagLower = (t) => norm(t).trim();

// Valida UN kit ya normalizado a objeto { niche, keyword, hookText, scenes[], ctaText, captionSEO,
// hashtags[], imagePrompts[], angulo, tema }. Devuelve arreglo de problemas.
export function validateKit(k) {
  const e = [];
  if (!k || typeof k !== 'object') return ['kit vacío o no es objeto'];

  if (!NICHOS.includes(k.niche)) e.push(`niche inválido "${k.niche}"`);
  if (!KIT_ANGULOS.includes(k.angulo)) e.push(`angulo inválido "${k.angulo}" (usa: ${KIT_ANGULOS.join(', ')})`);
  if (!k.tema || !String(k.tema).trim()) e.push('falta tema');

  const keyword = String(k.keyword || '').trim();
  if (!keyword) e.push('falta keyword');

  // hookText: ≤12 palabras, dolor/curiosidad (no un tema descriptivo).
  const hook = String(k.hookText || '').trim();
  if (!hook) e.push('falta hookText');
  else if (wordCount(hook) > 12) e.push(`hookText >12 palabras (${wordCount(hook)})`);

  // scenes: al menos 1 (la primera es la que carga la keyword si no está en el hook).
  const scenes = Array.isArray(k.scenes) ? k.scenes.filter((s) => String(s || '').trim()) : [];
  if (scenes.length < 1) e.push('scenes debe tener al menos 1 línea');

  // La keyword debe aparecer en hookText O en la primera scene (para que vaya en pantalla/audio).
  const kw = norm(keyword);
  const enPantalla = norm(stripEmphasis(hook) + ' ' + stripEmphasis(scenes[0] || ''));
  if (kw && !enPantalla.includes(kw)) e.push('la keyword no aparece en hookText ni en la primera scene');

  if (!String(k.ctaText || '').trim()) e.push('falta ctaText');

  // captionSEO: ≤150 caracteres, keyword en las primeras palabras, lenguaje humano (no lista de keywords).
  const cap = String(k.captionSEO || '').trim();
  if (!cap) e.push('falta captionSEO');
  else {
    if (cap.length > 150) e.push(`captionSEO >150 caracteres (${cap.length})`);
    if (kw) {
      const head = norm(cap).slice(0, kw.length + 15); // "primeras palabras"
      if (!head.includes(kw)) e.push('la keyword no está en las primeras palabras del captionSEO');
    }
    const commas = (cap.match(/,/g) || []).length;
    if (commas >= 3) e.push(`captionSEO parece un listado de keywords separadas por comas (${commas} comas)`);
  }

  // hashtags: 3-5, del nicho, sin #fyp/#viral/#parati.
  const tags = Array.isArray(k.hashtags) ? k.hashtags.filter((t) => String(t || '').trim()) : [];
  if (tags.length < 3 || tags.length > 5) e.push(`hashtags debe tener 3-5 (tiene ${tags.length})`);
  for (const t of tags) if (BANNED_TAGS.has(cleanTagLower(t))) e.push(`hashtag genérico prohibido "${t}" (usa hashtags del nicho)`);

  // imagePrompts: al menos 1 idea de imagen IA / B-roll.
  const imgs = Array.isArray(k.imagePrompts) ? k.imagePrompts.filter((s) => String(s || '').trim()) : [];
  if (imgs.length < 1) e.push('imagePrompts debe tener al menos 1 idea');

  // Idioma (regla dura de marca): cero voseo argentino en ningún texto visible.
  const campos = [['hookText', hook], ['ctaText', k.ctaText], ['captionSEO', cap],
    ...scenes.map((s, i) => [`scene[${i}]`, s]), ...imgs.map((s, i) => [`imagePrompt[${i}]`, s])];
  for (const [campo, txt] of campos) {
    const hit = findVoseo(txt);
    if (hit) e.push(`voseo argentino en ${campo}: "${hit}"`);
  }

  // Restricción Pricing 2.0: mientras no esté deployado, ningún kit se centra en precio/"gratis".
  if (!PRICING_20_LIVE) {
    for (const [campo, txt] of [['hookText', hook], ['captionSEO', cap], ['ctaText', k.ctaText]]) {
      if (PRICE_TOKENS.some((re) => re.test(String(txt || '')))) {
        e.push(`${campo} menciona precio/"gratis" (prohibido hasta que Pricing 2.0 esté en producción)`);
      }
    }
  }
  return e;
}

// Valida una TANDA completa: además de cada kit, exige ÁNGULOS ÚNICOS entre los kits de la tanda.
// (Regla de Jorge: si dos kits repiten ángulo, la validación falla.)
export function validateKitBatch(kits) {
  const e = [];
  const vistos = new Map();
  kits.forEach((k, i) => {
    const a = k && k.angulo;
    if (a && vistos.has(a)) e.push(`ángulo repetido en la tanda: "${a}" (kits ${vistos.get(a) + 1} y ${i + 1})`);
    else if (a) vistos.set(a, i);
  });
  return e;
}

// Reconstruye el objeto kit { niche, keyword, hookText, scenes[], ctaText, captionSEO, hashtags[],
// imagePrompts[], angulo, tema } desde una fila del CSV de kits. Lo usan kit-format.js y lint.js.
export function kitFromRow(r) {
  const parseJson = (s, d) => { try { return JSON.parse(s); } catch { return d; } };
  return {
    niche: r.niche,
    keyword: r.keyword,
    hookText: r.hook,
    scenes: parseJson(r.scenes_json, []),
    ctaText: r.cta,
    captionSEO: r.caption_seo,
    hashtags: (r.hashtags || '').trim().split(/\s+/).filter(Boolean),
    imagePrompts: parseJson(r.image_prompts_json, []),
    angulo: r.angulo,
    tema: r.tema,
  };
}
