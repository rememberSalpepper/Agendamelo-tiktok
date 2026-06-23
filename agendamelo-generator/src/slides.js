// Plantillas de SLIDE para carruseles. Cada slide es full-bleed 1080×1920 con la misma marca
// (logo, acento por nicho, crema, márgenes 230/430). Tres tipos: portada / punto / cierre.
// El carrusel: portada (gancho) -> 1-2 punto (contenido denso) -> cierre (siempre CTA).

import { buildCss } from './theme.js';
import { getNiche } from './niches.js';
import { svg, esc, icons } from './templates.js';
import { fontFace, globeIcon, hookToHeadline, brandHeaderHtml, bgHtml } from './brand.js';

const SLIDE_CSS = `
.content.slide { justify-content: space-between; padding-top: 34px; padding-bottom: 16px; }
.brand.compact { margin-bottom: 0; gap: 16px; }
.brand.compact .mark { width: 84px; height: 84px; }
.brand.compact .wm { font-size: 64px; }
.brand.compact .tag { font-size: 17px; letter-spacing: 5px; margin-top: 3px; }

/* indicador de páginas */
.dots-nav { display: flex; gap: 14px; justify-content: center; margin-top: 14px; }
.dots-nav i { width: 16px; height: 16px; border-radius: 50%; background: var(--line); display: block; }
.dots-nav i.on { background: var(--accent); width: 46px; border-radius: 999px; }

/* PORTADA */
.sp-main { flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center;
  text-align: center; gap: 28px; padding: 0 6px; }
.sp-hook { font-family: 'Bricolage Grotesque',sans-serif; font-weight: 800; font-size: 110px;
  line-height: 0.98; letter-spacing: -3px; color: var(--ink); }
.sp-hook .hl { background: var(--grad-accent); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
.sp-sub { font-size: 39px; line-height: 1.35; color: var(--body); font-weight: 500; max-width: 92%; }
.sp-bottom { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.sp-swipe { display: inline-flex; align-items: center; gap: 14px; font-family: 'Bricolage Grotesque',sans-serif;
  font-weight: 700; font-size: 31px; color: #fff; background: var(--grad-accent);
  padding: 16px 36px; border-radius: 999px; box-shadow: 0 12px 26px var(--accent-soft); }

/* PUNTO */
.pt-main { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 34px; }
.pt-top { display: flex; align-items: center; gap: 28px; }
.pt-index { font-family: 'Bricolage Grotesque',sans-serif; font-weight: 800; font-size: 150px; line-height: 0.8;
  letter-spacing: -5px; background: var(--grad-accent); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
.pt-icon { flex: 0 0 auto; width: 120px; height: 120px; border-radius: 30px; background: var(--grad-accent);
  color: #fff; display: grid; place-items: center; box-shadow: 0 14px 30px var(--accent-soft); }
.pt-title { font-family: 'Bricolage Grotesque',sans-serif; font-weight: 800; font-size: 66px; line-height: 1.04;
  letter-spacing: -1.6px; color: var(--ink); }
.pt-text { font-size: 42px; line-height: 1.4; color: var(--body); font-weight: 400; }

/* CIERRE */
.cl-main { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 30px; }
.cl-title { font-family: 'Bricolage Grotesque',sans-serif; font-weight: 800; font-size: 74px; line-height: 1.04;
  letter-spacing: -1.8px; color: var(--ink); text-align: center; }
.cl-title .hl { background: var(--grad-accent); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
.cl-text { font-size: 39px; line-height: 1.4; color: var(--body); text-align: center; }
.cl-cta { display: flex; align-items: center; gap: 22px; background: var(--grad-accent); border-radius: 28px;
  padding: 34px 38px; box-shadow: 0 18px 40px var(--accent-soft); margin-top: 12px; }
.cl-cta .ic { flex: 0 0 auto; width: 72px; height: 72px; display: grid; place-items: center;
  background: rgba(255,255,255,0.18); border-radius: 20px; }
.cl-cta .tx { color: #fff; }
.cl-cta .tx b { font-family: 'Bricolage Grotesque',sans-serif; font-weight: 700; font-size: 46px; display: block; line-height: 1.1; }
.cl-cta .tx span { font-size: 31px; opacity: 0.94; display: block; margin-top: 6px; }
`;

function dotsNav(index, total) {
  return `<div class="dots-nav">${Array.from({ length: total })
    .map((_, i) => `<i class="${i === index ? 'on' : ''}"></i>`).join('')}</div>`;
}

function portada(slide, niche) {
  const badge = slide.badge || niche.badge;
  return `${brandHeaderHtml()}
    ${badge ? `<div class="badge">${svg(niche.icon, 30)}<span>${esc(badge)}</span></div>` : ''}
    <div class="sp-main">
      <h1 class="sp-hook">${hookToHeadline(slide.hook || '')}</h1>
      ${slide.subtitle ? `<p class="sp-sub">${esc(slide.subtitle)}</p>` : ''}
    </div>
    <div class="sp-bottom"><span class="sp-swipe">Desliza →</span></div>`;
}

function punto(slide, niche, n) {
  return `${brandHeaderHtml(true)}
    <div class="pt-main">
      <div class="pt-top">
        ${n ? `<div class="pt-index">${n}</div>` : ''}
        <div class="pt-icon">${svg(slide.icon || niche.icon, 64)}</div>
      </div>
      ${slide.title ? `<h2 class="pt-title">${esc(slide.title)}</h2>` : ''}
      ${slide.text ? `<p class="pt-text">${esc(slide.text)}</p>` : ''}
    </div>`;
}

function cierre(slide, niche) {
  const cta = slide.cta || { title: 'Crea tu mini-web', sub: 'Link en bio · agendamelo.cl' };
  return `${brandHeaderHtml(true)}
    <div class="cl-main">
      ${slide.title ? `<h2 class="cl-title">${hookToHeadline(slide.title)}</h2>` : ''}
      ${slide.text ? `<p class="cl-text">${esc(slide.text)}</p>` : ''}
      <div class="cl-cta">
        <div class="ic">${icons.chatIcon}</div>
        <div class="tx"><b>${esc(cta.title)}</b><span>${esc(cta.sub)}</span></div>
      </div>
    </div>
    <div class="footer">${globeIcon}<span>agendamelo.cl</span></div>`;
}

const SLIDE = { portada, punto, cierre };

// Renderiza el HTML de UN slide. `index` (0-based) y `total` son para el indicador de páginas.
export function renderSlideHtml(slide, { niche: nicheKey, bg = 1, index = 0, total = 1 }) {
  const niche = getNiche(nicheKey);
  const css = buildCss({ fontFace, accent: niche.accent, accent2: niche.accent2, soft: niche.soft });
  const tipo = SLIDE[slide.tipo] ? slide.tipo : 'punto';
  const inner = SLIDE[tipo](slide, niche, index); // en punto, index = nº del paso (portada es 0)

  return `<!doctype html><html lang="es"><head><meta charset="utf-8">
  <style>${css}${SLIDE_CSS}</style></head>
  <body><div class="canvas">
    ${bgHtml(bg)}
    <div class="content slide slide-${tipo}">
      ${inner}
      ${dotsNav(index, total)}
    </div>
  </div></body></html>`;
}
