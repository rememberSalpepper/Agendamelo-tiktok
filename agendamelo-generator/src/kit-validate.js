// Validación de un "kit de video" (modo TikTok/Reels, solo texto). Fuente única de las reglas duras
// de la sección 5 de GUIA_TIKTOK_SEO_FACELESS.md. La usan kit.js (al generar) y lint.js (estático).
// Devuelve un arreglo de problemas (strings); vacío = kit válido.
//
// No toca el modo IMAGEN: reutiliza NICHOS y el detector de voseo, pero define su propio vocabulario
// de ángulos (con el 7º "visibilidad") para no alterar la validación de imágenes.

import { NICHOS } from './prompt.js';
import { findVoseo } from './validate.js';
import { PRECIOS_AGENDAMELO, PRECIOS_MUERTOS } from './kit-config.js';

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

const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

// ---------------------------------------------------------------------------------------------
// Reglas de precio y oferta — SIEMPRE activas (antes dependían del switch Pricing 2.0, que ya no
// existe). Son lista BLANCA: en vez de prohibir términos sueltos, se define lo único que se puede
// decir. Así, prender el precio nuevo no deja al generador libre de inventar ofertas.
// ---------------------------------------------------------------------------------------------

// "gratis" vale en dos contextos reales: los 7 días iniciales y el nombre "Perfil Gratis".
const TRIAL_OK = /(?:gratis\s+(?:por\s+|durante\s+)?7\s*d[ií]as|7\s*d[ií]as\s+(?:de\s+)?gratis)/gi;
const PERFIL_GRATIS_OK = /perfil\s+gratis/gi;

// Colocaciones que son un regalo inventado aunque nombren "7 días" en otra parte de la frase.
const GRATIS_PROHIBIDO = [
  [/\bprimer\s+mes\s+gratis\b/i, '"primer mes gratis" (no existe: la única forma de gratis es el trial de 7 días)'],
  [/\bmes\s+gratis\b/i, '"mes gratis" (no existe: la única forma de gratis es el trial de 7 días)'],
  [/\bprueba\s+gratis\b/i, '"prueba gratis" (di "publica gratis 7 días, sin tarjeta")'],
  [/\bgratis\s+el\s+primer\s+mes\b/i, '"gratis el primer mes" (no existe)'],
  [/\btrial\b/i, '"trial" (anglicismo: en español es "prueba de 7 días" o "gratis 7 días")'],
];

// Lenguaje de oferta/descuento: Agendamelo no hace descuentos ni promociones en contenido público.
// Ojo: NO se prohíbe "%" a secas porque los datos de mercado del rubro lo usan de forma legítima
// ("la sesión online sale 10–15% más económica"). Lo que se prohíbe es el vocabulario de descuento.
const OFERTA_PROHIBIDA = ['descuento', 'oferta', 'promocion', 'promo', 'cupon', '2x1', 'rebaja'];

// Cifras con forma de precio CLP: "$12.990", "12.990", "$64.000", "$ 8.000".
// (los grupos de miles se piden explícitos para no tragarse el punto final de la frase: "$18.000.")
const PRECIO_RE = /\$\s?\d{1,3}(?:\.\d{3})*|\b\d{1,3}\.\d{3}\b/g;
// Contexto que convierte una cifra en un PRECIO DE AGENDAMELO (y no en un dato de mercado del rubro).
const CONTEXTO_SUSCRIPCION = /(\/\s*mes|al\s+mes|por\s+mes|mensual|cada\s+mes|al\s+a[nñ]o|anual|\bplan\b|suscripci[oó]n|publica|publicar|agendamelo)/i;
// Los datos de mercado del rubro (niches.js) son siempre miles redondos: $8.000, $12.000, $50.000.
const MERCADO_RE = /^\d{1,3}\.000$/;

const soloCifra = (s) => s.replace(/^\$\s?/, '').trim();

// Devuelve los problemas de precio/oferta de UN texto visible. Exportada para poder testearla sola.
export function findPriceIssues(txt) {
  const problemas = [];
  const raw = String(txt || '');
  if (!raw.trim()) return problemas;
  const n = norm(raw);

  for (const [re, motivo] of GRATIS_PROHIBIDO) if (re.test(raw)) problemas.push(motivo);

  // Todo "gratis" que no sea el trial o el Perfil Gratis sobra.
  if (/gratis/i.test(raw.replace(TRIAL_OK, '').replace(PERFIL_GRATIS_OK, ''))) {
    problemas.push('"gratis" suelto (solo vale en "7 días gratis" o "Perfil Gratis")');
  }

  for (const palabra of OFERTA_PROHIBIDA) {
    if (new RegExp(`(?<![\\p{L}])${palabra}(?![\\p{L}])`, 'u').test(n)) {
      problemas.push(`lenguaje de oferta prohibido "${palabra}" (Agendamelo no hace descuentos ni promociones)`);
    }
  }
  if (/(?<![\p{L}])off(?![\p{L}])/iu.test(n)) problemas.push('lenguaje de oferta prohibido "off"');

  for (const match of raw.match(PRECIO_RE) || []) {
    const cifra = soloCifra(match);
    if (PRECIOS_MUERTOS.includes(cifra)) {
      problemas.push(`precio muerto "${match}" (Agendamelo cobra ${PRECIOS_AGENDAMELO.map((p) => '$' + p).join(' / ')})`);
      continue;
    }
    if (PRECIOS_AGENDAMELO.includes(cifra)) continue;

    // Una cifra pegada a lenguaje de suscripción se lee como el precio de Agendamelo: solo valen
    // los oficiales. Fuera de ese contexto, se acepta un precio de MERCADO del rubro.
    const i = raw.indexOf(match);
    const ventana = raw.slice(Math.max(0, i - 30), i + match.length + 30);
    if (CONTEXTO_SUSCRIPCION.test(ventana)) {
      problemas.push(`"${match}" se presenta como precio de Agendamelo (solo valen ${PRECIOS_AGENDAMELO.map((p) => '$' + p).join(' / ')})`);
    } else if (!MERCADO_RE.test(cifra)) {
      problemas.push(`cifra de precio no permitida "${match}" (solo el precio de Agendamelo o un dato de mercado del rubro)`);
    }
  }
  return problemas;
}
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

  // TODO el texto que termina en pantalla o en el caption. Antes las reglas de precio solo miraban
  // hookText/captionSEO/ctaText y dejaban fuera scenes[] e imagePrompts[], que también son visibles.
  const campos = [['hookText', hook], ['ctaText', k.ctaText], ['captionSEO', cap],
    ...scenes.map((s, i) => [`scene[${i}]`, s]), ...imgs.map((s, i) => [`imagePrompt[${i}]`, s])];

  for (const [campo, txt] of campos) {
    // Idioma (regla dura de marca): cero voseo argentino en ningún texto visible.
    const hit = findVoseo(txt);
    if (hit) e.push(`voseo argentino en ${campo}: "${hit}"`);
    // Precio y oferta: lista blanca siempre activa (ver findPriceIssues).
    for (const p of findPriceIssues(txt)) e.push(`${campo}: ${p}`);
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
