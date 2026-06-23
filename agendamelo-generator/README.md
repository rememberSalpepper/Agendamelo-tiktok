# Agendamelo — generador de posts para TikTok

Genera imágenes verticales (1080×1920) y captions optimizados para TikTok/SEO a partir de un CSV.
Render con HTML/CSS + Playwright (Chromium headless): control pixel-perfect, sin marca de "IA".
Las ideas (texto) las crea Codex CLI con salida JSON garantizada.

**Identidad por nicho:** misma marca Agendamelo en todos los posts (logo, fuentes, layout, crema),
pero cada rubro trae su **color de acento**, su **ícono** y su **voz/dolor** propios. Todo eso vive
en `src/niches.js` (6 rubros) y se inyecta solo en el render.

**3 orientaciones de contenido** (campo `orientacion`): `educativo` (enseña, suave), `plataforma`
(muestra una funcionalidad de la app) y `venta` (por qué Agendamelo es la solución). El lote se
reparte ~40/30/30 para no ser solo comercial.

## Flujo

```
agendamelo_ideas.csv  (fuente de verdad; vive fuera de git, en la raíz del repo)
   → src/generate.js   Codex crea ideas (rota nichos) → agrega filas estado=pendiente
   → src/pipeline.js   lee filas → render por plantilla y nicho → PNG en dist/ → renderizado
   → src/telegram.js   envía imagen + título + caption (👇×4 + descripción + 5 hashtags) → enviado
```
Máquina de estados: `pendiente → renderizado → enviado`.

## Comandos

```bash
npm install && npx playwright install chromium   # primera vez
npm run generate      # Codex crea ideas nuevas (necesita Codex autenticado)
npm run lint          # valida el CSV (5 hashtags, #agendamelo, niche, plantilla, hook, imagen_json)
npm run render        # renderiza solo las pendientes
npm run render:all    # renderiza todas
npm run render:one AGENDA-IDEA-008   # una sola
npm run telegram      # envía las 'renderizado' por Telegram
npm run bot           # bot de comandos + salud en :3000
```

## Capa de marca / nicho (lo único editable por estética)

- `src/niches.js` — color, ícono, etiqueta y jerga/dolor de cada rubro.
- `src/theme.js` — base de marca (crema + ámbar) y variables de acento; 4 fondos.
- `src/templates.js` — las 5 plantillas (se recolorean solas con el acento).
- `src/prompt.js` — el "cerebro": producto completo + reglas + voz por nicho.
- `assets/logos/logomark.svg` — logo vector oficial (inline).
- `assets/fonts/` — Bricolage Grotesque (títulos) + DM Sans (cuerpo), self-hosted.

## Reglas de marca (fijas)

- **Márgenes seguros**: 230px arriba / 430px abajo (HUD + descripción de TikTok).
- **Render 2x** (2160×3840), **íconos SVG** (no emojis), fuentes self-hosted en base64.
- **Español neutro/chileno** (sin voseo).
- **5 hashtags** exactos, `#agendamelo` siempre.
- **Caption** parte con el emoji 👇 cuatro veces (cada uno con salto de línea).

## Plantillas (`tipo_plantilla`)

`checklist` · `base_3_cards` · `mito_realidad` · `piramide` · `proceso` · `stat` (número
impactante) · `feature` (mockup del sitio/app) · `comparacion` (sin/con Agendamelo)

## Nichos (`niche`)

`barberias` · `manicure` · `psicopedagogos` · `psicologos` · `kinesiologos` · `profesores`

## Columnas del CSV

`id, estado, niche, orientacion, tipo_plantilla, titulo, hook, descripcion, hashtags,
fecha_creacion, fecha_realizado, imagen_url, imagen_json, notas_plantilla`

- `hook`: titular de la imagen; el `*texto*` entre asteriscos se resalta en el acento del nicho.
- `imagen_json`: contenido estructurado de la imagen (lo lee el render).
- `niche`: define el color, ícono y voz del post.
- `orientacion`: `educativo` | `plataforma` | `venta`.
