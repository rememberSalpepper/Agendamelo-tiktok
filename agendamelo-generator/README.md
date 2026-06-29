# Agendamelo — generador de posts para TikTok

Genera imágenes verticales (1080×1920) y captions optimizados para TikTok/SEO a partir de un CSV.
Render con HTML/CSS + Playwright (Chromium headless): control pixel-perfect, sin marca de "IA".
Las ideas (texto) las crea Codex CLI con salida JSON garantizada.

**Identidad por nicho:** misma marca Agendamelo en todos los posts (logo, fuentes, layout, crema),
pero cada rubro trae su **color de acento**, su **ícono** y su **voz/dolor** propios. Todo eso vive
en `src/niches.js` (4 nichos: manicuristas, psicopedagogas, profesores-paes, fonoaudiologas) y se
inyecta solo en el render.

**3 orientaciones de contenido** (campo `orientacion`): `educativo` (enseña, suave), `plataforma`
(muestra una funcionalidad de la app) y `venta` (por qué Agendamelo es la solución). El lote se
reparte ~40/30/30 para no ser solo comercial.

**2 formatos** (campo `formato`): `imagen` (1 lámina, una de las 5 plantillas) y `carrusel` (3-4
láminas: portada → punto → cierre con CTA), ~60/40. Estrategia completa en
[`docs/LINEA-EDITORIAL.md`](docs/LINEA-EDITORIAL.md); pendientes en [`docs/ROADMAP.md`](docs/ROADMAP.md).

## Flujo (human-in-the-loop)

```
agendamelo_ideas.csv  (fuente de verdad; vive fuera de git, en la raíz del repo)
   → src/generate.js   Codex crea ideas de UN nicho, cada una con 3-5 HOOKS → estado=pendiente
   → /revisar          el operador ELIGE el hook de cada idea (botones) → hook_elegido
   → src/pipeline.js   renderiza solo las curadas → PNG en dist/ → renderizado
   → src/telegram.js   envía imagen + título + caption (hook+keyword, 👇, descripción, hashtags) → enviado
```
Máquina de estados: `pendiente (sin/ con hook elegido) → renderizado → enviado`. La automatización da
VOLUMEN, no alcance: el bot produce OPCIONES; el humano cura el hook y elige el sonido al subir.

## Comandos

```bash
npm install && npx playwright install chromium   # primera vez
npm run generate      # Codex crea ideas del nicho activo (necesita Codex autenticado)
npm run lint          # valida el CSV (5 hashtags, #agendamelo, hook ≤12 palabras, angulo, voseo…)
npm run render        # renderiza solo las pendientes CON hook elegido
npm run render:all    # renderiza todas
npm run render:one AGENDA-IDEA-008   # una sola
npm run telegram      # envía las 'renderizado' por Telegram
npm run bot           # bot de comandos + salud en :3000
```

Codex: `AGENDAMELO_CODEX_MODEL` fija el modelo y `AGENDAMELO_CODEX_EFFORT`
(`minimal|low|medium|high|xhigh`, default `medium`) el esfuerzo de razonamiento. `high` no garantiza
mejor copy: el lever principal es el prompt. Ver `.env.example`.

**Tanda comparativa (default vs high):** genera dos lotes del mismo nicho cambiando solo el esfuerzo y
compara la tasa de descarte/lint de hooks (cuántas ideas pasan `npm run lint` y cuántos hooks no hubo
que rehacer en `/revisar`):

```bash
AGENDAMELO_CSV=/tmp/medium.csv AGENDAMELO_CODEX_EFFORT=medium npm run generate -- 12 manicuristas
AGENDAMELO_CSV=/tmp/medium.csv npm run lint
AGENDAMELO_CSV=/tmp/high.csv   AGENDAMELO_CODEX_EFFORT=high   npm run generate -- 12 manicuristas
AGENDAMELO_CSV=/tmp/high.csv   npm run lint
```
Si `high` no baja el descarte ni mejora los hooks de forma clara, quédate en `medium` (más barato/rápido).

### Comandos del bot (Telegram)
- **Flujo:** `/generar [N] [nicho]` (genera con 3-5 hooks, no renderiza) → `/revisar [N]` (elige el hook
  con botones) → `/render` (solo las curadas) → `/enviar [N]` (o `/dia` para 3 variados).
- **Ajustes:** `/nicho <slug>` (nicho activo) · `/estilo corto|largo` (A/B del caption) · `/estado`
  (conteos + posts listos).
- **Gestionar:** `/ver <id>` · `/rehacer <id> [hook|desc]` · `/borrar <id>` · `/diagnostico` (revisión
  integral). Lo `enviado` es historia y no se revalida en lint/diagnóstico.

Los carruseles se envían como álbum. Flujo de publicación: ver `docs/LINEA-EDITORIAL.md`.

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
- **Español neutro/chileno** (sin voseo argentino; `lint.js` lo detecta).
- **5 hashtags** exactos, `#agendamelo` siempre.
- **Caption**: línea 1 = hook con la keyword (lo que TikTok indexa); recién después van los 👇 y la
  descripción. Estilo `corto` (gancho) o `largo` (SEO) según `/estilo`.

## Plantillas (`tipo_plantilla`)

`stat` (dato de mercado, con fuente) · `mito_realidad` · `checklist` · `antes_despues` (caos → orden)
· `feature` (mockup del sitio/app). En carrusel: `carrusel`.

## Nichos (`niche`)

`manicuristas` · `psicopedagogas` · `profesores-paes` · `fonoaudiologas`

## Columnas del CSV

`id, estado, niche, orientacion, formato, tipo_plantilla, titulo, tema, angulo, hook, hook_variantes,
hook_elegido, descripcion, descripcion_corta, hashtags, estilo_caption, fecha_creacion,
fecha_realizado, imagen_url, imagen_json, notas_plantilla`

- `hook`: titular EFECTIVO de la imagen (provisional = 1ª variante hasta que el operador elija); el
  `*texto*` entre asteriscos se resalta en el acento del nicho. Máx 12 palabras, keyword adentro.
- `hook_variantes`: JSON `[{texto, angulo}]` con 3-5 opciones de ángulos distintos.
- `hook_elegido`: el hook que el humano eligió en `/revisar` (vacío = sin curar, no se renderiza).
- `angulo`: palanca del hook (`plata` | `tiempo` | `no-show` | `repetir-info` | `comparacion-ig` | `curiosidad`).
- `descripcion` / `descripcion_corta`: cuerpo SEO largo (≥1200 car.) y gancho corto (≤150 car.) para A/B.
- `estilo_caption`: override por fila (`corto|largo`); vacío = sigue el global (`/estilo`).
- `imagen_json`: contenido estructurado (imagen simple, o `slides` para carrusel).
- `niche`: color, ícono y voz del post. Una tanda = un solo nicho (el activo).
- `orientacion`: `educativo` | `plataforma` | `venta`.
- `formato`: `imagen` | `carrusel` (carrusel → `tipo_plantilla = carrusel`, `imagen_url` = lista de PNGs).
- `tema`: etiqueta corta del ángulo (anti-repetición).
