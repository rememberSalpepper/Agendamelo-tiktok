// Plantillas de SLIDE para carruseles. Cada slide es full-bleed 1080×1350 con la misma marca
// (logo, acento por nicho, crema y ritmo editorial 4:5). Tres tipos: portada / punto / cierre.
// El carrusel: portada (gancho) -> 1-2 punto (contenido DENSO: título + texto + viñetas) ->
// cierre (recap + CTA). Las láminas deben venir bien cargadas de información.

import { buildCss } from './theme.js';
import { getNiche } from './niches.js';
import { svg, esc, icons } from './templates.js';
import { fontFace, globeIcon, hookToHeadline, brandHeaderHtml, bgHtml } from './brand.js';

const SLIDE_CSS = `
.content.slide { justify-content: space-between; padding-top: 0; padding-bottom: 0; }
.brand.compact { margin-bottom: 0; gap: 12px; }
.brand.compact .mark { width: 50px; height: 50px; }
.brand.compact .wm { font-size: 38px; }
.brand.compact .tag { font-size: 11px; letter-spacing: 3.5px; margin-top: 2px; }

/* indicador de páginas */
.dots-nav { display: flex; gap: 10px; justify-content: center; margin-top: 10px; }
.dots-nav i { width: 11px; height: 11px; border-radius: 50%; background: #D9D0C2; display: block; }
.dots-nav i.on { background: var(--accent); width: 34px; border-radius: 999px; }

/* lista de viñetas (compartida punto/cierre) */
.s-list { display: flex; flex-direction: column; gap: 15px; }
.s-li { display: flex; align-items: flex-start; gap: 14px; font-size: 28px; line-height: 1.22;
  font-weight: 500; color: var(--ink); }
.s-li-ic { flex: 0 0 auto; width: 38px; height: 38px; border-radius: 11px; color: #fff;
  background: var(--grad-accent); display: grid; place-items: center; margin-top: 1px; }

/* PORTADA */
.sp-main { flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: flex-start;
  text-align: left; gap: 22px; padding: 0; }
.sp-hook { font-family: 'Bricolage Grotesque',sans-serif; font-weight: 800; font-size: 78px;
  line-height: 0.96; letter-spacing: -2.7px; color: var(--ink); max-width: 94%; }
.sp-hook .hl { color: var(--accent); -webkit-text-fill-color: var(--accent); }
.sp-sub { font-size: 31px; line-height: 1.28; color: var(--body); font-weight: 500; max-width: 82%; }
.sp-swipe { display: inline-flex; align-items: center; gap: 14px; font-family: 'Bricolage Grotesque',sans-serif;
  font-weight: 700; font-size: 24px; color: #fff; background: var(--ink);
  padding: 13px 28px; border-radius: 999px; box-shadow: 6px 6px 0 var(--accent); }

/* PUNTO (denso: encabezado + texto + viñetas + dato clave), llena la lámina de arriba a abajo */
.pt-main { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 19px; }
.pt-top { display: flex; align-items: center; gap: 18px; }
.pt-index { font-family: 'Bricolage Grotesque',sans-serif; font-weight: 800; font-size: 74px; line-height: 0.8;
  letter-spacing: -4px; background: var(--grad-accent); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
.pt-icon { flex: 0 0 auto; width: 68px; height: 68px; border-radius: 19px; background: var(--grad-accent);
  color: #fff; display: grid; place-items: center; box-shadow: 0 10px 22px var(--accent-soft); }
.pt-title { font-family: 'Bricolage Grotesque',sans-serif; font-weight: 800; font-size: 47px; line-height: 1.02;
  letter-spacing: -1.4px; color: var(--ink); }
.pt-text { font-size: 29px; line-height: 1.3; color: var(--body); font-weight: 500; }
.pt-list { margin-top: 4px; }
.pt-hl { display: flex; align-items: center; gap: 14px; background: var(--accent-soft);
  border: 1px solid var(--line); border-radius: 16px; padding: 17px 21px; margin-top: 4px; }
.pt-hl .ic { flex: 0 0 auto; width: 42px; height: 42px; border-radius: 12px; color: #fff;
  background: var(--grad-accent); display: grid; place-items: center; }
.pt-hl span { font-size: 26px; font-weight: 700; color: var(--ink); line-height: 1.2; }

/* CIERRE (recap + CTA) */
.cl-main { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 20px; }
.cl-title { font-family: 'Bricolage Grotesque',sans-serif; font-weight: 800; font-size: 54px; line-height: 1.02;
  letter-spacing: -1.6px; color: var(--ink); text-align: center; }
.cl-title .hl { color: var(--accent); -webkit-text-fill-color: var(--accent); }
.cl-text { font-size: 29px; line-height: 1.3; color: var(--body); text-align: center; }
.cl-list { background: var(--card); border: 1px solid var(--line); border-radius: 26px; box-shadow: var(--shadow-sm);
  padding: 20px 24px; }
.cl-cta { display: flex; align-items: center; gap: 18px; background: var(--ink); border-radius: 20px;
  padding: 23px 28px; box-shadow: 7px 7px 0 var(--accent); margin-top: 4px; }
.cl-cta .ic { flex: 0 0 auto; width: 54px; height: 54px; display: grid; place-items: center;
  background: var(--accent); border-radius: 15px; }
.cl-cta .tx { color: #fff; }
.cl-cta .tx b { font-family: 'Bricolage Grotesque',sans-serif; font-weight: 700; font-size: 33px; display: block; line-height: 1.08; }
.cl-cta .tx span { font-size: 22px; opacity: 0.92; display: block; margin-top: 4px; }
`;

function dotsNav(index, total) {
  return `<div class="dots-nav">${Array.from({ length: total })
    .map((_, i) => `<i class="${i === index ? 'on' : ''}"></i>`).join('')}</div>`;
}

const bulletList = (arr, max) => (arr || []).slice(0, max)
  .map((b) => `<div class="s-li"><span class="s-li-ic">${svg('check', 24)}</span><span>${esc(b)}</span></div>`).join('');

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
  const bullets = bulletList(slide.bullets, 5);
  const highlight = slide.highlight
    ? `<div class="pt-hl"><span class="ic">${svg('target', 30)}</span><span>${esc(slide.highlight)}</span></div>` : '';
  return `${brandHeaderHtml(true)}
    <div class="pt-main">
      <div class="pt-top">
        ${n ? `<div class="pt-index">${n}</div>` : ''}
        <div class="pt-icon">${svg(slide.icon || niche.icon, 54)}</div>
      </div>
      ${slide.title ? `<h2 class="pt-title">${esc(slide.title)}</h2>` : ''}
      ${slide.text ? `<p class="pt-text">${esc(slide.text)}</p>` : ''}
      ${bullets ? `<div class="pt-list s-list">${bullets}</div>` : ''}
      ${highlight}
    </div>`;
}

function cierre(slide, niche) {
  const cta = slide.cta || { title: 'Crea tu Perfil Gratis', sub: 'Sin tarjeta · agendamelo.cl' };
  const recap = bulletList(slide.bullets, 3);
  return `${brandHeaderHtml(true)}
    <div class="cl-main">
      ${slide.title ? `<h2 class="cl-title">${hookToHeadline(slide.title)}</h2>` : ''}
      ${slide.text ? `<p class="cl-text">${esc(slide.text)}</p>` : ''}
      ${recap ? `<div class="cl-list s-list">${recap}</div>` : ''}
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
