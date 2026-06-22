// Motor de render Agendamelo: data -> HTML -> PNG (Playwright/Chromium headless).
// Fuentes en base64 y logo (SVG) inline -> reproducibilidad total (mismo render en Mac y VPS).
// El ACENTO POR NICHO se resuelve aquí (niches.js) y se inyecta en el CSS: toda la imagen se
// recolorea según el rubro, manteniendo la base de marca (crema, ámbar, fuentes, layout).

import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildCss } from './theme.js';
import { templates, icons, svg, esc } from './templates.js';
import { getNiche } from './niches.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const b64 = (p) => readFileSync(join(ROOT, p)).toString('base64');
const readText = (p) => readFileSync(join(ROOT, p), 'utf8');

// ---- Fuentes self-hosted (variables) -> @font-face en base64 ----
// Ambas son variable fonts: un solo archivo cubre todo el rango de pesos.
const FONTS = [
  ['Bricolage Grotesque', '200 800', 'assets/fonts/bricolage-latin.woff2'],
  ['DM Sans', '100 1000', 'assets/fonts/dmsans-latin.woff2'],
];
const fontFace = FONTS.map(([fam, w, p]) =>
  `@font-face{font-family:'${fam}';font-style:normal;font-weight:${w};font-display:block;`
  + `src:url(data:font/woff2;base64,${b64(p)}) format('woff2');}`).join('\n');

// Logomark oficial (SVG vector) embebido inline -> nitidez infinita en el render 2x.
const logomarkSvg = readText('assets/logos/logomark.svg');

// Globo del footer, teñido al ámbar de marca.
const globeIcon = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#EA580C" stroke-width="2.2"
  stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.6 2.6 2.6 15.4 0 18M12 3c-2.6 2.6-2.6 15.4 0 18"/></svg>`;

// Convierte un hook "texto con *énfasis*" en el titular HTML con resaltado en el acento.
function hookToHeadline(hook) {
  const e = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return e(hook).replace(/\*(.+?)\*/g, '<span class="hl">$1</span>');
}

export function renderHtml(data) {
  const niche = getNiche(data.niche);
  const css = buildCss({ fontFace, accent: niche.accent, accent2: niche.accent2, soft: niche.soft });
  const body = templates[data.tipo](data);
  const headline = data.headline ?? hookToHeadline(data.hook);
  const cta = data.cta || { title: 'Crea tu agenda online', sub: 'Link en bio · agendamelo.cl' };
  const bg = data.bg || 1; // variante de fondo (1-4)
  // Badge: el del contenido, o la etiqueta por defecto del nicho. Lleva el ícono del rubro.
  const badgeText = data.badge || niche.badge;

  return `<!doctype html><html lang="es"><head><meta charset="utf-8">
  <style>${css}</style></head>
  <body><div class="canvas">
    <div class="bg v${bg}">
      <div class="bg-base"></div>
      <div class="blob a"></div><div class="blob b"></div>
      <div class="dots d1"></div><div class="dots d2"></div>
    </div>
    <div class="content">
      <div class="brand">
        <span class="mark">${logomarkSvg}</span>
        <span class="wm-wrap">
          <span class="wm">Agendamelo</span>
          <span class="tag">Reservas online</span>
        </span>
      </div>
      ${badgeText ? `<div class="badge">${svg(niche.icon, 30)}<span>${esc(badgeText)}</span></div>` : ''}
      <h1 class="headline">${headline}</h1>
      ${data.subtitle ? `<p class="subtitle">${esc(data.subtitle)}</p>` : ''}
      <div class="body">${body}</div>
      <div class="cta">
        <div class="ic">${icons.chatIcon}</div>
        <div class="tx"><b>${esc(cta.title)}</b><span>${esc(cta.sub)}</span></div>
      </div>
      <div class="footer">${globeIcon}<span>${esc(data.footer || 'agendamelo.cl')}</span></div>
    </div>
  </div></body></html>`;
}

export async function renderToPng(data, outPath, existingBrowser = null) {
  const html = renderHtml(data);
  const browser = existingBrowser ?? await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1080, height: 1920 },
    deviceScaleFactor: 2, // salida 2160x3840 -> máxima nitidez
  });
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready.then(() => true));
  await page.locator('.canvas').screenshot({ path: outPath });
  await page.close();
  if (!existingBrowser) await browser.close();
  return outPath;
}

export async function openBrowser() { return chromium.launch(); }
