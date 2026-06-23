// Motor de render Agendamelo: data -> HTML -> PNG (Playwright/Chromium headless).
// Fuentes en base64 y logo (SVG) inline -> reproducibilidad total (mismo render en Mac y VPS).
// El ACENTO POR NICHO se resuelve aquí (niches.js) y se inyecta en el CSS: toda la imagen se
// recolorea según el rubro, manteniendo la base de marca (crema, ámbar, fuentes, layout).

import { chromium } from 'playwright';
import { buildCss } from './theme.js';
import { templates, icons, svg, esc } from './templates.js';
import { getNiche } from './niches.js';
import { fontFace, globeIcon, hookToHeadline, brandHeaderHtml, bgHtml } from './brand.js';
import { renderSlideHtml } from './slides.js';

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
    ${bgHtml(bg)}
    <div class="content">
      ${brandHeaderHtml()}
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

async function shotHtml(html, outPath, browser) {
  const page = await browser.newPage({
    viewport: { width: 1080, height: 1920 },
    deviceScaleFactor: 2, // salida 2160x3840 -> máxima nitidez
  });
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready.then(() => true));
  await page.locator('.canvas').screenshot({ path: outPath });
  await page.close();
}

export async function renderToPng(data, outPath, existingBrowser = null) {
  const browser = existingBrowser ?? await chromium.launch();
  try {
    await shotHtml(renderHtml(data), outPath, browser);
  } finally {
    if (!existingBrowser) await browser.close();
  }
  return outPath;
}

// Carrusel: una imagen por slide. `basePath` = ".../dist/<id>" -> genera <id>-1.png, <id>-2.png, ...
export async function renderCarousel(data, basePath, existingBrowser = null) {
  const slides = data.slides || [];
  const browser = existingBrowser ?? await chromium.launch();
  const outPaths = [];
  try {
    for (let i = 0; i < slides.length; i++) {
      const out = `${basePath}-${i + 1}.png`;
      const html = renderSlideHtml(slides[i], { niche: data.niche, bg: data.bg || (i % 4) + 1, index: i, total: slides.length });
      await shotHtml(html, out, browser);
      outPaths.push(out);
    }
  } finally {
    if (!existingBrowser) await browser.close();
  }
  return outPaths;
}

export async function openBrowser() { return chromium.launch(); }
