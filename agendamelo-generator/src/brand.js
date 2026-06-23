// Assets de marca compartidos por imágenes simples y carruseles.
// Fuentes en base64 y logo (SVG) inline -> render idéntico en Mac y VPS, sin CDN.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const b64 = (p) => readFileSync(join(ROOT, p)).toString('base64');
const readText = (p) => readFileSync(join(ROOT, p), 'utf8');

// ---- Fuentes self-hosted (variables): un solo archivo cubre todo el rango de pesos ----
const FONTS = [
  ['Bricolage Grotesque', '200 800', 'assets/fonts/bricolage-latin.woff2'],
  ['DM Sans', '100 1000', 'assets/fonts/dmsans-latin.woff2'],
];
export const fontFace = FONTS.map(([fam, w, p]) =>
  `@font-face{font-family:'${fam}';font-style:normal;font-weight:${w};font-display:block;`
  + `src:url(data:font/woff2;base64,${b64(p)}) format('woff2');}`).join('\n');

// Logomark oficial (SVG vector) embebido inline -> nitidez infinita en el render 2x.
export const logomarkSvg = readText('assets/logos/logomark.svg');

// Globo del footer, teñido al ámbar de marca.
export const globeIcon = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#EA580C" stroke-width="2.2"
  stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.6 2.6 2.6 15.4 0 18M12 3c-2.6 2.6-2.6 15.4 0 18"/></svg>`;

// Convierte un hook "texto con *énfasis*" en titular HTML con resaltado en el acento.
export function hookToHeadline(hook) {
  const e = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return e(hook).replace(/\*(.+?)\*/g, '<span class="hl">$1</span>');
}

// Cabecera de marca (logo + wordmark + tagline). `compact` reduce el tamaño para slides de contenido.
export function brandHeaderHtml(compact = false) {
  return `<div class="brand${compact ? ' compact' : ''}">
    <span class="mark">${logomarkSvg}</span>
    <span class="wm-wrap">
      <span class="wm">Agendamelo</span>
      <span class="tag">Reservas online</span>
    </span>
  </div>`;
}

// Fondo a sangre completa (4 variantes, teñidas por el acento del nicho).
export function bgHtml(bg = 1) {
  return `<div class="bg v${bg}">
    <div class="bg-base"></div>
    <div class="blob a"></div><div class="blob b"></div>
    <div class="dots d1"></div><div class="dots d2"></div>
  </div>`;
}
