// Formatea un kit (fila del CSV) como TEXTO listo para copiar en Telegram. NO es imagen: Jorge arma
// el video a mano con estas piezas. Se envía como texto plano (no Markdown) porque el contenido del
// LLM puede traer *, _ y otros caracteres que romperían el parseo de Telegram.
//
// En el HOOK se CONSERVAN los *asteriscos*: son la pista de qué frase resaltar en pantalla. En el
// CAPTION se quitan (va limpio para pegar tal cual en TikTok).

import { kitFromRow } from './kit-validate.js';

const stripEmphasis = (s) => String(s || '').replace(/\*(.+?)\*/g, '$1');

export function formatKit(row) {
  const k = kitFromRow(row);
  const scenes = k.scenes.map((s, i) => `${i + 1}. ${s}`).join('\n') || '—';
  const imgs = k.imagePrompts.map((s) => `• ${s}`).join('\n') || '—';
  return [
    `🎬 ${row.id} · ${k.niche} · ángulo: ${row.angulo}`,
    `🔑 keyword: ${k.keyword}`,
    '',
    '📱 HOOK (texto en pantalla · 0-2 s)',
    k.hookText,
    '',
    '🎞️ ESCENAS (desarrollo · 2-6 s)',
    scenes,
    '',
    '🎯 CIERRE / CTA (6-10 s)',
    k.ctaText,
    '',
    '📝 CAPTION (cópialo tal cual)',
    stripEmphasis(k.captionSEO),
    '',
    '#️⃣ HASHTAGS',
    k.hashtags.join(' '),
    '',
    '🖼️ IDEAS DE IMAGEN IA / B-ROLL (faceless)',
    imgs,
    '',
    '🎵 Elige un sonido en tendencia y responde comentarios la 1ª hora (eso no lo hace el bot).',
    '   * = frase para resaltar en pantalla.',
  ].join('\n');
}
