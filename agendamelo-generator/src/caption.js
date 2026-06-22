// Arma el caption final de TikTok a partir de una fila del CSV.
// Regla fija: la descripción parte con el emoji 👇 cuatro veces, cada uno con salto de
// línea, para empujar el texto hacia abajo y que NO tape la imagen en TikTok.

const POINT_PREFIX = '👇\n👇\n👇\n👇\n';

// Quita los *asteriscos* de énfasis (sirven solo para resaltar en la imagen, no en el caption).
const stripEmphasis = (s) => s.replace(/\*(.+?)\*/g, '$1');

export function buildCaption(row) {
  const desc = stripEmphasis((row.descripcion || '').trim());
  const tags = (row.hashtags || '').trim();
  return `${POINT_PREFIX}${desc}\n\n${tags}`;
}
