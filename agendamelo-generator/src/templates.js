// Constructores de plantillas Agendamelo.
// Cada función recibe `data` y devuelve el HTML del bloque central (.body).
// Marca, titular (hook), badge, CTA y footer son compartidos (ver render.js).
// Los colores salen de las variables de ACENTO del nicho (--accent/--accent-2), así las
// plantillas se recolorean solas por rubro sin tocar este archivo.

// ---------- Íconos (SVG inline, trazo en currentColor) ----------
const P = {
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.6 2.6 2.6 15.4 0 18M12 3c-2.6 2.6-2.6 15.4 0 18"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.2 9.3a3 3 0 0 1 5.6 1.4c0 2-3 2.3-3 3.6"/><path d="M12 17.5h.01"/>',
  chat: '<path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5z"/>',
  quote: '<path d="M7 7H5a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2v2.5a3 3 0 0 1-3 3"/><path d="M19 7h-2a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2v2.5a3 3 0 0 1-3 3"/>',
  users: '<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="M16 5.3a3.2 3.2 0 0 1 0 6.4"/><path d="M20.5 19a5.5 5.5 0 0 0-4-5.3"/>',
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><path d="M12 12h.01"/>',
  sparkles: '<path d="M12 3l1.8 4.9L18.7 9l-4.9 1.8L12 16l-1.8-5.2L5.3 9l4.9-1.1z"/><path d="M18.5 14l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/>',
  shield: '<path d="M12 3l7 3v5c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6z"/><path d="M9 12l2.2 2.2L15 10.4"/>',
  calendar: '<rect x="4" y="5" width="16" height="16" rx="3"/><path d="M4 9h16"/><path d="M8 3v4M16 3v4"/>',
  repeat: '<path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 2"/>',
  bell: '<path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  phone: '<rect x="6" y="2.5" width="12" height="19" rx="3"/><path d="M11 18.5h2"/>',
  star: '<path d="M12 3l2.7 5.5 6 .9-4.3 4.2 1 6L12 17.8 6.6 19.6l1-6L3.3 9.4l6-.9z"/>',
  tag: '<path d="M3 12l8.5-8.5a2 2 0 0 1 1.4-.6H20a1 1 0 0 1 1 1v6.7a2 2 0 0 1-.6 1.4L12 21z"/><circle cx="16.5" cy="7.5" r="1.3"/>',
  check: '<path d="M5 12.5l4.2 4.2L19 7"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  // íconos de NICHO (para el badge por rubro)
  scissors: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4L8.5 15.5"/><path d="M14.5 14.5L20 20"/><path d="M8.5 8.5L12 12"/>',
  sparkle: '<path d="M12 3l1.9 5.3L19 10l-5.1 1.7L12 17l-1.9-5.3L5 10l5.1-1.7z"/>',
  brain: '<path d="M9.5 4A3 3 0 0 0 6.6 7 3 3 0 0 0 5 12.5 3 3 0 0 0 8 17a2.4 2.4 0 0 0 4-.5V5.6A2.4 2.4 0 0 0 9.5 4z"/><path d="M14.5 4A3 3 0 0 1 17.4 7 3 3 0 0 1 19 12.5 3 3 0 0 1 16 17a2.4 2.4 0 0 1-4-.5"/>',
  lightbulb: '<path d="M9 18h6"/><path d="M10 21h4"/><path d="M12 3a6 6 0 0 0-4 10.5c.8.8 1.3 1.5 1.5 2.5h5c.2-1 .7-1.7 1.5-2.5A6 6 0 0 0 12 3z"/>',
  activity: '<path d="M3 12h4l3 8 4-16 3 8h4"/>',
  book: '<path d="M12 6C10 4.6 7 4.1 4 4.6V19c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V4.6C17 4.1 14 4.6 12 6z"/><path d="M12 6v14.5"/>',
};
export function svg(name, size = 44) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${P[name] || P.check}</svg>`;
}

// Escapa texto dinámico para no romper el HTML (contenido viene del CSV/Codex).
export const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const chatIcon = `<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"
  stroke-linecap="round" stroke-linejoin="round">${P.calendar}</svg>`;
const closer = (txt) => `<div class="closer"><div class="ic">${svg('check', 28)}</div><span>${esc(txt)}</span></div>`;

// ---------- CHECKLIST ----------
export function checklist(data) {
  const rows = data.items.slice(0, 6).map((it, i) => `
    <div class="ck-row">
      <div class="ck-num">${i + 1}</div>
      <div class="ck-tx">${esc(it)}</div>
      <div class="ck-ck">${svg('check', 30)}</div>
    </div>`).join('');
  const note = data.note ? `<div class="ck-note"><span class="ck-note-ic">!</span><span>${esc(data.note)}</span></div>` : '';
  return `<style>
    .ck-card { background: var(--card); border-radius: 32px; box-shadow: var(--shadow);
      padding: 26px 32px; display: flex; flex-direction: column; border: 1px solid var(--line); }
    .ck-row { display: flex; align-items: center; gap: 22px; padding: 15px 4px; }
    .ck-row + .ck-row { border-top: 1px solid var(--line); }
    .ck-num { flex: 0 0 auto; width: 58px; height: 58px; border-radius: 16px; background: var(--grad-accent);
      color: #fff; font-family: 'Bricolage Grotesque',sans-serif; font-weight: 700; font-size: 30px; display: grid;
      place-items: center; box-shadow: 0 8px 18px var(--accent-soft); }
    .ck-tx { flex: 1; font-size: 36px; font-weight: 600; color: var(--ink); letter-spacing: -0.3px; }
    .ck-ck { flex: 0 0 auto; width: 50px; height: 50px; border-radius: 50%; color: #fff;
      background: var(--grad-accent); display: grid; place-items: center;
      box-shadow: 0 6px 14px var(--accent-soft); }
    .ck-note { display: flex; align-items: center; gap: 16px; margin-top: 18px; background: var(--red-bg);
      border-radius: 20px; padding: 20px 26px; }
    .ck-note-ic { flex: 0 0 auto; width: 40px; height: 40px; border-radius: 50%; background: var(--red);
      color: #fff; font-family: 'Bricolage Grotesque',sans-serif; font-weight: 800; font-size: 26px; display: grid; place-items: center; }
    .ck-note span:last-child { font-size: 28px; font-weight: 600; color: #B91C1C; }
  </style>
  <div class="ck-card">${rows}</div>${note}`;
}

// ---------- BASE 3 CARDS ----------
export function base_3_cards(data) {
  const grads = ['g1', 'g2', 'g1'];
  const cards = data.cards.slice(0, 3).map((c, i) => `
    <div class="card"><div class="ic ${grads[i % 3]}">${svg(c.icon, 50)}</div>
      <div class="tx"><h3>${esc(c.title)}</h3><p>${esc(c.text)}</p></div></div>`).join('');
  return `<style>
    .cards { display: flex; flex-direction: column; gap: 18px; }
    .card { display: flex; align-items: center; gap: 26px; background: var(--card); border: 1px solid var(--line);
      border-radius: 28px; box-shadow: var(--shadow-sm); padding: 24px 30px; }
    .card .ic { flex: 0 0 auto; width: 104px; height: 104px; border-radius: 26px; display: grid; place-items: center; color: #fff; }
    .card .ic.g1 { background: var(--grad-accent); }
    .card .ic.g2 { background: var(--grad-brand); }
    .card .tx h3 { font-family: 'Bricolage Grotesque',sans-serif; font-weight: 700; font-size: 38px; color: var(--ink); margin-bottom: 4px; }
    .card .tx p { font-size: 30px; color: var(--body); line-height: 1.3; }
  </style>
  <div class="cards">${cards}</div>${data.note ? closer(data.note) : ''}`;
}

// ---------- MITO / REALIDAD ----------
export function mito_realidad(data) {
  return `<style>
    .mr { display: flex; gap: 22px; }
    .mr .col { flex: 1; border-radius: 28px; padding: 28px; border: 1px solid; }
    .mr .mito { background: #FEF1F1; border-color: #FAD4D4; }
    .mr .real { background: var(--accent-soft); border-color: var(--line); }
    .mr .lbl { display: inline-flex; align-items: center; gap: 10px; font-family: 'Bricolage Grotesque',sans-serif;
      font-weight: 700; font-size: 27px; padding: 8px 20px; border-radius: 999px; margin-bottom: 18px; color: #fff; }
    .mr .mito .lbl { background: var(--red); }
    .mr .real .lbl { background: var(--grad-accent); }
    .mr .col p { font-size: 33px; line-height: 1.32; color: var(--ink); font-weight: 500; }
  </style>
  <div class="mr">
    <div class="col mito"><span class="lbl">${svg('x', 22)} Mito</span><p>${esc(data.mito)}</p></div>
    <div class="col real"><span class="lbl">${svg('check', 22)} Realidad</span><p>${esc(data.realidad)}</p></div>
  </div>${data.cierre ? closer(data.cierre) : ''}`;
}

// ---------- PIRÁMIDE ----------
export function piramide(data) {
  const p = data.pyramid;
  return `<style>
    .pyr { display: flex; flex-direction: column; align-items: center; gap: 16px; }
    .pyr .lvl { display: grid; place-items: center; color: #fff; border-radius: 18px; padding: 30px 22px;
      text-align: center; font-family: 'Bricolage Grotesque',sans-serif; font-weight: 700; font-size: 35px;
      box-shadow: var(--shadow-sm); letter-spacing: -0.3px; }
    .pyr .l1 { width: 60%; background: linear-gradient(135deg, var(--accent-2), var(--accent)); opacity: 0.82; }
    .pyr .l2 { width: 80%; background: linear-gradient(135deg, var(--accent-2), var(--accent)); opacity: 0.92; }
    .pyr .l3 { width: 100%; background: linear-gradient(135deg, var(--accent), var(--accent)); }
  </style>
  <div class="pyr">
    <div class="lvl l1">${esc(p.top)}</div>
    <div class="lvl l2">${esc(p.mid)}</div>
    <div class="lvl l3">${esc(p.base)}</div>
  </div>${data.cierre ? closer(data.cierre) : ''}`;
}

// ---------- PROCESO ----------
export function proceso(data) {
  const steps = data.steps.slice(0, 6).map((s, i) => `
    <div class="step"><div class="node">${i + 1}</div><div class="line"></div>
      <div class="lbl">${esc(s)}</div></div>`).join('');
  return `<style>
    .proc { display: flex; flex-direction: column; }
    .step { display: flex; align-items: flex-start; gap: 24px; position: relative; padding-bottom: 22px; }
    .step:last-child { padding-bottom: 0; }
    .step .node { flex: 0 0 auto; width: 70px; height: 70px; border-radius: 50%; background: var(--grad-accent);
      color: #fff; font-family: 'Bricolage Grotesque',sans-serif; font-weight: 700; font-size: 34px; display: grid;
      place-items: center; z-index: 1; box-shadow: 0 8px 18px var(--accent-soft); }
    .step .line { position: absolute; left: 34px; top: 70px; bottom: 0; width: 3px;
      background: var(--accent); opacity: 0.35; }
    .step:last-child .line { display: none; }
    .step .lbl { flex: 1; background: var(--card); border: 1px solid var(--line); border-radius: 22px;
      box-shadow: var(--shadow-sm); padding: 20px 28px; font-size: 34px; font-weight: 600; color: var(--ink);
      min-height: 70px; display: flex; align-items: center; }
  </style>
  <div class="proc">${steps}</div>${data.cierre ? `<div style="margin-top:18px">${closer(data.cierre)}</div>` : ''}`;
}

// ---------- STAT (número impactante; ideal para hooks/educativo) ----------
export function stat(data) {
  const points = (data.points || []).slice(0, 3).map((p) => `
    <div class="st-row"><span class="st-dot">${svg('check', 24)}</span><span>${esc(p)}</span></div>`).join('');
  return `<style>
    .st { display: flex; flex-direction: column; align-items: center; }
    .st-fig { font-family: 'Bricolage Grotesque',sans-serif; font-weight: 800; font-size: 220px; line-height: 0.92;
      letter-spacing: -6px; background: var(--grad-accent); -webkit-background-clip: text; background-clip: text;
      -webkit-text-fill-color: transparent; }
    .st-cap { font-size: 36px; font-weight: 600; color: var(--ink); text-align: center; margin-top: 8px;
      line-height: 1.18; max-width: 80%; }
    .st-card { width: 100%; margin-top: 30px; background: var(--card); border: 1px solid var(--line);
      border-radius: 26px; box-shadow: var(--shadow-sm); padding: 14px 28px; }
    .st-row { display: flex; align-items: center; gap: 18px; padding: 16px 2px; font-size: 31px;
      font-weight: 500; color: var(--ink); }
    .st-row + .st-row { border-top: 1px solid var(--line); }
    .st-dot { flex: 0 0 auto; width: 44px; height: 44px; border-radius: 50%; color: #fff;
      background: var(--grad-accent); display: grid; place-items: center; }
  </style>
  <div class="st">
    <div class="st-fig">${esc(data.figure)}</div>
    ${data.figure_caption ? `<div class="st-cap">${esc(data.figure_caption)}</div>` : ''}
    ${points ? `<div class="st-card">${points}</div>` : ''}
  </div>${data.note ? `<div style="margin-top:18px">${closer(data.note)}</div>` : ''}`;
}

// ---------- FEATURE (mockup del sitio/app; muestra la plataforma) ----------
export function feature(data) {
  const rows = (data.rows || []).slice(0, 3);
  const list = rows.map((r, i) => {
    const hot = i === rows.length - 1; // el último simula el horario/acción elegida
    return `<div class="fe-row${hot ? ' hot' : ''}">
      <span class="fe-rtx">${esc(r)}</span>
      <span class="fe-chip">${hot ? svg('check', 22) : svg('clock', 22)}</span>
    </div>`;
  }).join('');
  return `<style>
    .fe { display: flex; flex-direction: column; gap: 22px; }
    .fe-card { background: var(--card); border: 1px solid var(--line); border-radius: 30px;
      box-shadow: var(--shadow); overflow: hidden; }
    .fe-bar { display: flex; align-items: center; gap: 10px; padding: 18px 24px; background: var(--cream-2);
      border-bottom: 1px solid var(--line); }
    .fe-dot { width: 14px; height: 14px; border-radius: 50%; background: #D8D2C6; }
    .fe-url { margin-left: 14px; flex: 1; background: #fff; border: 1px solid var(--line); border-radius: 999px;
      padding: 8px 20px; font-size: 23px; color: var(--body-2); font-weight: 500; }
    .fe-body { padding: 26px 28px; }
    .fe-head { display: flex; align-items: center; gap: 18px; margin-bottom: 22px; }
    .fe-logo { width: 64px; height: 64px; border-radius: 18px; background: var(--grad-accent); flex: 0 0 auto; }
    .fe-name { font-family: 'Bricolage Grotesque',sans-serif; font-weight: 700; font-size: 38px; color: var(--ink); }
    .fe-row { display: flex; align-items: center; justify-content: space-between; gap: 16px;
      border: 1px solid var(--line); border-radius: 18px; padding: 20px 24px; margin-bottom: 14px; }
    .fe-row.hot { border-color: var(--accent); background: var(--accent-soft); }
    .fe-rtx { font-size: 31px; font-weight: 600; color: var(--ink); }
    .fe-chip { flex: 0 0 auto; width: 48px; height: 48px; border-radius: 14px; display: grid; place-items: center;
      color: var(--accent); background: #fff; border: 1px solid var(--line); }
    .fe-row.hot .fe-chip { color: #fff; background: var(--grad-accent); border: none; }
    .fe-btn { margin-top: 8px; background: var(--grad-accent); color: #fff; text-align: center;
      font-family: 'Bricolage Grotesque',sans-serif; font-weight: 700; font-size: 34px;
      border-radius: 18px; padding: 22px; box-shadow: 0 12px 26px var(--accent-soft); }
  </style>
  <div class="fe">
    <div class="fe-card">
      <div class="fe-bar"><span class="fe-dot"></span><span class="fe-dot"></span><span class="fe-dot"></span>
        <span class="fe-url">agendamelo.cl/${esc(data.screen_slug || 'tu-negocio')}</span></div>
      <div class="fe-body">
        <div class="fe-head"><div class="fe-logo"></div><div class="fe-name">${esc(data.screen_title)}</div></div>
        ${list}
        <div class="fe-btn">${esc(data.button || 'Reservar hora')}</div>
      </div>
    </div>
  </div>${data.note ? closer(data.note) : ''}`;
}

// ---------- COMPARACIÓN (Sin vs Con Agendamelo; ideal para venta) ----------
export function comparacion(data) {
  const antes = (data.antes || []).slice(0, 4).map((t) => `
    <div class="cp-row"><span class="cp-ic bad">${svg('x', 20)}</span><span>${esc(t)}</span></div>`).join('');
  const despues = (data.despues || []).slice(0, 4).map((t) => `
    <div class="cp-row"><span class="cp-ic good">${svg('check', 20)}</span><span>${esc(t)}</span></div>`).join('');
  return `<style>
    .cp { display: flex; gap: 20px; }
    .cp .col { flex: 1; border-radius: 26px; padding: 22px 20px; border: 1px solid; }
    .cp .sin { background: #FBF1F1; border-color: #F4D6D6; }
    .cp .con { background: var(--accent-soft); border-color: var(--line); }
    .cp .hd { display: inline-flex; align-items: center; gap: 8px; font-family: 'Bricolage Grotesque',sans-serif;
      font-weight: 700; font-size: 25px; padding: 8px 18px; border-radius: 999px; margin-bottom: 16px; color: #fff; }
    .cp .sin .hd { background: #B91C1C; }
    .cp .con .hd { background: var(--grad-accent); }
    .cp-row { display: flex; align-items: flex-start; gap: 12px; padding: 12px 2px; font-size: 28px;
      font-weight: 500; color: var(--ink); line-height: 1.2; }
    .cp-ic { flex: 0 0 auto; width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center; color: #fff; margin-top: 1px; }
    .cp-ic.bad { background: #DC2626; }
    .cp-ic.good { background: var(--accent); }
  </style>
  <div class="cp">
    <div class="col sin"><span class="hd">${svg('x', 18)} Sin Agendamelo</span>${antes}</div>
    <div class="col con"><span class="hd">${svg('check', 18)} Con Agendamelo</span>${despues}</div>
  </div>${data.cierre ? closer(data.cierre) : ''}`;
}

export const icons = { chatIcon };
export const templates = { checklist, base_3_cards, mito_realidad, piramide, proceso, stat, feature, comparacion };
