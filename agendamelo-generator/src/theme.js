// Tema visual de Agendamelo.
// Base de marca cálida CONSTANTE (crema + ámbar + Bricolage Grotesque/DM Sans) y un
// sistema de ACENTO POR NICHO: el render inyecta --accent/--accent-2/--accent-soft según
// el rubro, y todo (gradientes, números, CTA, fondos) se recolorea solo. Así cada post se ve
// Agendamelo, pero con la identidad del nicho.
//
// Recibe fuentes (fontFace) ya en base64 y el acento del nicho (accent, accent2, soft).
// Zonas seguras de TikTok: 230px arriba / 430px abajo. Lienzo 1080×1920 (render a 2x = 2160×3840).

export function buildCss({ fontFace, accent, accent2, soft }) {
  return `
${fontFace}

:root {
  /* Acento del NICHO (lo inyecta el render por rubro) */
  --accent:   ${accent};
  --accent-2: ${accent2};
  --accent-soft: ${soft};

  /* Base de marca Agendamelo (constante en todos los rubros) */
  --amber:  #F59E0B;
  --orange: #F97316;
  --orange-d: #EA580C;
  --ink:    #1C1917;   /* titulares */
  --body:   #44403C;   /* texto cuerpo */
  --body-2: #78716C;   /* texto secundario */
  --cream:  #FAFAF5;   /* fondo base */
  --cream-2:#F3F1E9;
  --card:   #FFFFFF;
  --line:   #ECE7DD;   /* bordes suaves cálidos */
  --red:    #DC2626;
  --red-bg: #FDECEC;

  --grad-brand: linear-gradient(135deg, var(--amber) 0%, var(--orange-d) 100%);
  --grad-accent: linear-gradient(135deg, var(--accent-2) 0%, var(--accent) 100%);

  --safe-top: 230px;    /* margen calmo superior (HUD de TikTok) */
  --safe-bottom: 430px; /* margen calmo inferior (ahí va la descripción de TikTok) */
  --pad-x: 84px;        /* margen lateral del contenido */
  --shadow: 0 24px 60px rgba(60, 47, 30, 0.12);
  --shadow-sm: 0 10px 30px rgba(60, 47, 30, 0.08);
}

* { margin: 0; padding: 0; box-sizing: border-box; }

html, body { width: 1080px; height: 1920px; }

body {
  /* Fallbacks anchos (Noto/DejaVu) para glifos fuera del subset latino en el VPS Linux */
  font-family: 'DM Sans', 'Noto Sans', 'DejaVu Sans', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  text-rendering: geometricPrecision;
}

/* ---------- Lienzo ---------- */
.canvas {
  position: relative;
  width: 1080px;
  height: 1920px;
  overflow: hidden;
  background: var(--cream);
}

/* ---------- Fondo a sangre completa (cubre el 100%, márgenes incluidos) ----------
   4 variantes cálidas. La base es crema; los glows se tiñen con el ACENTO del nicho,
   así cada rubro tiene su atmósfera de color sin perder la marca. */
.bg { position: absolute; inset: 0; z-index: 0; overflow: hidden; }
.bg-base { position: absolute; inset: 0; }
.blob { position: absolute; border-radius: 50%; filter: blur(2px); }
.dots {
  position: absolute; width: 150px; height: 150px;
  background-image: radial-gradient(var(--accent) 2px, transparent 2px);
  background-size: 26px 26px; opacity: 0.10;
}

/* Variante 1 — glow del acento arriba + ámbar abajo */
.v1 .bg-base { background:
  radial-gradient(1200px 900px at 82% -8%, var(--accent-soft) 0%, rgba(255,255,255,0) 60%),
  radial-gradient(1100px 1000px at 0% 108%, #FDF3E7 0%, rgba(253,243,231,0) 55%),
  linear-gradient(180deg, #FCFBF6 0%, #F4F1E8 100%); }
.v1 .blob.a { width: 360px; height: 360px; top: -120px; left: -110px; background: var(--grad-accent); opacity: 0.18; }
.v1 .blob.b { width: 300px; height: 300px; bottom: -110px; right: -90px; background: var(--grad-brand); opacity: 0.14; }
.v1 .dots.d1 { top: 120px; right: 70px; }
.v1 .dots.d2 { bottom: 120px; left: 70px; }

/* Variante 2 — glows cruzados del acento */
.v2 .bg-base { background:
  radial-gradient(1100px 900px at 0% -6%, var(--accent-soft) 0%, rgba(255,255,255,0) 58%),
  radial-gradient(1200px 1000px at 100% 106%, #FDF3E7 0%, rgba(253,243,231,0) 55%),
  linear-gradient(160deg, #FCFBF6 0%, #F3F0E7 100%); }
.v2 .blob.a { width: 340px; height: 340px; top: -110px; right: -100px; background: var(--grad-accent); opacity: 0.16; }
.v2 .blob.b { width: 300px; height: 300px; bottom: -110px; left: -90px; background: var(--grad-brand); opacity: 0.13; }
.v2 .dots.d1 { top: 120px; left: 70px; }
.v2 .dots.d2 { bottom: 120px; right: 70px; }

/* Variante 3 — muy limpia, un solo glow del acento central-inferior */
.v3 .bg-base { background:
  radial-gradient(1000px 820px at 50% 38%, var(--accent-soft) 0%, rgba(255,255,255,0) 62%),
  linear-gradient(180deg, #FCFBF7 0%, #F4F1E9 100%); }
.v3 .blob.a { width: 440px; height: 440px; bottom: -170px; left: 50%; transform: translateX(-50%); background: var(--grad-accent); opacity: 0.12; }
.v3 .blob.b { display: none; }
.v3 .dots.d1 { top: 120px; right: 70px; }
.v3 .dots.d2 { display: none; }

/* Variante 4 — dos glows superiores (acento + ámbar) */
.v4 .bg-base { background:
  radial-gradient(900px 820px at 10% -8%, var(--accent-soft) 0%, rgba(255,255,255,0) 55%),
  radial-gradient(900px 820px at 100% -6%, #FDF3E7 0%, rgba(253,243,231,0) 55%),
  linear-gradient(200deg, #FCFBF6 0%, #F3F0E7 100%); }
.v4 .blob.a { width: 300px; height: 300px; top: -120px; left: -90px; background: var(--grad-accent); opacity: 0.15; }
.v4 .blob.b { width: 300px; height: 300px; top: -120px; right: -90px; background: var(--grad-brand); opacity: 0.12; }
.v4 .dots.d1 { bottom: 120px; left: 70px; }
.v4 .dots.d2 { display: none; }

/* ---------- Zona de contenido (entre las zonas seguras) ---------- */
.content {
  position: absolute;
  top: var(--safe-top);
  bottom: var(--safe-bottom);
  left: 0; right: 0;
  z-index: 2;
  padding: 0 var(--pad-x);
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

/* ---------- Encabezado de marca ---------- */
.brand {
  display: flex; align-items: center; justify-content: center;
  gap: 22px; margin-bottom: 26px;
}
.brand .mark { width: 120px; height: 120px; display: block;
  filter: drop-shadow(0 12px 26px rgba(234,88,12,0.28)); }
.brand .mark svg { width: 100%; height: 100%; display: block; }
.brand .wm-wrap { display: flex; flex-direction: column; justify-content: center; }
.brand .wm {
  font-family: 'Bricolage Grotesque', sans-serif; font-weight: 800; font-size: 96px;
  letter-spacing: -2.5px; line-height: 0.98; color: var(--ink);
}
.brand .tag {
  font-family: 'DM Sans', sans-serif; font-weight: 600; font-size: 24px;
  letter-spacing: 7px; color: var(--body-2); text-transform: uppercase; margin-top: 6px;
}

.badge {
  align-self: center;
  display: inline-flex; align-items: center; gap: 12px;
  font-family: 'DM Sans', sans-serif; font-weight: 600; font-size: 26px;
  color: #fff; letter-spacing: 0.2px;
  padding: 12px 28px 12px 20px; border-radius: 999px;
  background: var(--grad-accent);
  box-shadow: 0 12px 26px var(--accent-soft);
  margin-bottom: 30px;
}
.badge svg { width: 30px; height: 30px; }

/* ---------- Titular ---------- */
.headline {
  font-family: 'Bricolage Grotesque', sans-serif; font-weight: 800;
  font-size: 78px; line-height: 1.02; letter-spacing: -2px;
  color: var(--ink); text-align: center;
}
.headline .hl {
  background: var(--grad-accent);
  -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
}
.subtitle {
  font-size: 31px; line-height: 1.4; color: var(--body);
  text-align: center; margin-top: 22px; font-weight: 400;
  padding: 0 12px;
}

/* ---------- Bloque central flexible ---------- */
.body { flex: 0 1 auto; display: flex; flex-direction: column; justify-content: flex-start; gap: 22px; margin: 36px 0 44px; }

/* ---------- CTA inferior ---------- */
.cta {
  display: flex; align-items: center; gap: 22px;
  background: var(--grad-accent); border-radius: 28px;
  padding: 28px 34px; box-shadow: 0 18px 40px var(--accent-soft);
}
.cta .ic { flex: 0 0 auto; width: 64px; height: 64px; display: grid; place-items: center;
  background: rgba(255,255,255,0.18); border-radius: 18px; }
.cta .tx { color: #fff; }
.cta .tx b { font-family: 'Bricolage Grotesque', sans-serif; font-weight: 700; font-size: 36px; display: block; line-height: 1.1; }
.cta .tx span { font-size: 25px; opacity: 0.94; display: block; margin-top: 4px; }
.footer {
  display: flex; align-items: center; justify-content: center; gap: 12px;
  margin-top: 22px; color: var(--orange-d); font-weight: 700; font-size: 27px;
  font-family: 'Bricolage Grotesque', sans-serif;
}
.footer svg { opacity: 0.9; }

/* ---------- Franja de cierre (compartida: mito, pirámide, proceso, cards) ---------- */
.closer {
  display: flex; align-items: center; gap: 18px;
  background: var(--accent-soft); border: 1px solid var(--line); border-radius: 22px;
  padding: 22px 28px;
}
.closer .ic { flex: 0 0 auto; width: 50px; height: 50px; border-radius: 14px;
  background: var(--grad-accent); display: grid; place-items: center; color: #fff; }
.closer span { font-size: 30px; font-weight: 600; color: var(--ink); line-height: 1.25; }
`;
}
