# Sistema de generación de contenido para TikTok — Documentación y guía de replicación

Documento base para entender cómo funciona y cómo se construyó este sistema (caso **PGAS**),
y para **replicarlo en otra cuenta de TikTok** con otra estética y temática.

---

## 1. Qué hace y qué problema resuelve

Genera, de forma casi automática, **posts para TikTok**: una imagen vertical (1080×1920) por
idea + un **caption** optimizado para SEO (búsqueda en TikTok y Google). El usuario solo
revisa y sube a borradores. Todo se controla desde un **bot de Telegram**.

**Decisión central — por qué HTML→PNG y no otra cosa:**
- ❌ *Generadores de imágenes por IA* (DALL·E, etc.): no respetan márgenes/tipografía, requieren
  muchos intentos, y pueden gatillar el "label de IA" en TikTok.
- ❌ *SVG programático*: se ve de baja calidad, difícil de pulir.
- ✅ *HTML + CSS renderizado a PNG con Chromium headless (Playwright)*: control pixel-perfect de
  márgenes, tipografía real, marca consistente, gratis, sin marca de IA. Es el corazón del sistema.

La generación de **texto** (ideas, hooks, descripciones) sí usa un LLM: **Codex CLI**.

---

## 2. Arquitectura y flujo

```
                      pgas_ideas.csv  (FUENTE DE VERDAD)
                              │
   /generar  ──► generate.js (Codex CLI + output-schema) ──► agrega filas estado=pendiente
                              │
   /enviar   ──► pipeline.js (Playwright: HTML→PNG) ──────► imágenes en dist/, estado=renderizado
                              │
              telegram.js / bot.js (Telegram Bot API) ────► envía imagen + texto, estado=enviado
```

**Máquina de estados de cada idea:**
```
pendiente ──(render)──► renderizado ──(telegram)──► enviado
```
- El generador NO repite temas: arma una "lista de evitar" con los `titulo` de TODAS las filas.

---

## 3. Stack técnico

- **Node.js (ESM)** — sin framework, scripts simples.
- **Playwright + Chromium headless** — render HTML→PNG.
- **Codex CLI** (`codex exec --output-schema`) — generación de ideas con salida JSON garantizada.
- **csv-parse / csv-stringify** — el CSV como base de datos simple.
- **Telegram Bot API** (fetch nativo) — envío y panel de comandos.
- **Docker + docker-compose** — despliegue en el VPS.
- **GitHub Actions** — auto-deploy en cada `git push`.

---

## 4. Decisiones de diseño (y por qué) — clave para replicar bien

| Decisión | Por qué |
|---|---|
| **CSV como fuente de verdad** | Simple, editable, fácil de versionar/migrar. Cada fila = un post. |
| Columna **`hook`** (con `*énfasis*`) | El titular punchy va aparte del `titulo` descriptivo; el `*texto*` se resalta en azul en la imagen. |
| Columna **`imagen_json`** | Contenido estructurado de la imagen por plantilla; el render lo lee directo. |
| **Fuentes self-hosted en base64** | Reproducibilidad total (mismo render en Mac y en el VPS Linux), sin depender de CDN. |
| **Márgenes seguros 230px arriba / 430px abajo** | El HUD de TikTok (botones) y la descripción tapan esas zonas; el contenido vive al centro. Validado en TikTok real. |
| **Render a 2x** (deviceScaleFactor 2) | Sale 2160×3840 y se ve nítido. |
| **Caption parte con 👇 ×4** (saltos de línea) | Empuja el texto hacia abajo para que la vista colapsada del caption no tape la imagen. |
| **5 hashtags exactos** | Límite real de TikTok; mezcla alcance + relevancia + venta (ver `docs/estrategia-hashtags.md`). |
| **Español neutro/chileno (sin voseo)** | Regla dura de marca; se fuerza en el prompt y en el contenido. |
| **Codex `--output-schema`** | Obliga la forma del JSON → nunca llega un dato roto al render. |
| **Código en git, datos (CSV/imágenes) fuera** | El VPS modifica el CSV; si estuviera en git, `git pull` chocaría. Así el push/pull de código es limpio. |
| **Allowlist del bot** | El bot solo responde/atiende al chat del dueño. |
| **Escape de HTML en todo el contenido** | El texto viene del LLM; evita romper el render con `<`, `>`, `&`. |
| **Íconos SVG (no emojis/símbolos)** | En Linux faltan glifos (✓, ✕, ≠) → se usarían cuadritos; los SVG son seguros. + fallback de fuentes Noto. |

---

## 5. Mapa de archivos (`pgas-generator/`)

```
src/
  env.js          Carga el .env (token, chat). Se importa primero en los scripts de entrada.
  theme.js        TOKENS DE MARCA: paleta, tipografía, fondo, márgenes, 4 variantes de fondo.
  templates.js    Las 5 plantillas (HTML/CSS) + set de íconos SVG + función esc() (escape).
  render.js       Motor: data → HTML → PNG (inyecta fuentes y logo en base64).
  pipeline.js     Lee el CSV, renderiza por plantilla, marca estados. (npm run render)
  prompt.js       EL "CEREBRO": el prompt con todas las reglas de marca para Codex.
  generate.js     Llama a Codex (output-schema), valida y agrega ideas al CSV. (npm run generate)
  expand-descriptions.js  Reescribe descripciones a versión larga SEO. (npm run expand)
  caption.js      Arma el caption final (👇 + descripción + hashtags).
  telegram.js     Envía posts (imagen + título + descripción) y marca enviado. (npm run telegram)
  bot.js          Bot de comandos + servidor de salud (:3000). (npm run bot)
  lint.js         Valida el CSV (5 hashtags, #pgas, plantilla, hook, descripción larga). (npm run lint)
  test-008.js     Prueba de render de una idea.
  migrate-*.js / update-*.js   Scripts de migración de una sola vez (ya ejecutados).
assets/
  fonts/          Poppins (400/600/700/800) + Inter (400/500/600) en .woff2
  logos/          bird.webp (logomark transparente) + wordmark
docs/
  estrategia-hashtags.md   Fórmula de hashtags
  SISTEMA.md               Este documento
dist/             PNGs generados (no se versionan)
```

Raíz del repo: `Dockerfile`, `docker-compose.yml`, `.github/workflows/deploy.yml`,
`pgas_ideas.csv` (datos, fuera de git), `pgas_ideas.seed.csv` (semilla versionada),
`DEPLOY.md`, `README.md`.

---

## 6. Esquema del CSV

`id, estado, tipo_plantilla, titulo, hook, descripcion, hashtags, fecha_creacion,
fecha_realizado, imagen_url, plantilla_referencia, idea_imagen, texto_imagen,
imagen_json, notas_plantilla`

- **estado**: `pendiente` → `renderizado` → `enviado`.
- **tipo_plantilla**: `checklist | base_3_cards | mito_realidad | piramide | proceso`.
- **hook**: titular de la imagen; `*frase*` entre asteriscos se resalta en azul.
- **imagen_json**: contenido estructurado de la imagen (campos según plantilla: `badge`,
  `subtitle`, `cta{title,sub}`, y `items` / `cards` / `mito`+`realidad` / `pyramid` / `steps`,
  más `note`/`cierre`).
- (Columnas `plantilla_referencia`, `idea_imagen`, `texto_imagen` son legado del CSV original.)

---

## 7. Despliegue (Docker + VPS + auto-deploy)

- **Imagen** (`Dockerfile`): `node:22-bookworm-slim` + fuentes Noto + Chromium
  (`npx playwright install --with-deps chromium`) + Codex CLI (`@openai/codex`).
- **docker-compose.yml**: puerto `3010:3000` (salud), `env_file` con el `.env`, volúmenes:
  `./data/pgas_ideas.csv`, `./data/dist`, y `~/.codex` (sesión de Codex montada).
- **Auto-deploy** (`.github/workflows/deploy.yml`): en cada `push` a `main`, GitHub Actions entra
  por SSH al VPS y corre `git pull && docker compose up -d --build`.
  Secretos en GitHub: `VPS_SSH_KEY`, `VPS_HOST`, `VPS_USER`, `VPS_PORT`.
- **Convención del VPS**: proyectos en `/home/srv/apps/<nombre>`, manejados con docker compose.
- Detalles paso a paso en `DEPLOY.md`.

---

## 8. CÓMO REPLICAR PARA OTRA CUENTA (estética y temática distintas)

La clave: **la infraestructura se reutiliza casi entera; solo cambias la "capa de marca y nicho".**

### 8.1 Qué REUTILIZAR tal cual (motor)
`render.js`, `pipeline.js`, `generate.js` (lógica), `caption.js`, `telegram.js`, `bot.js`,
`lint.js`, `env.js`, `Dockerfile`, `docker-compose.yml`, el workflow de Actions, el esquema del CSV
y la máquina de estados. **No tocar.**

### 8.2 Qué CAMBIAR (capa de marca/nicho)
| Archivo | Qué cambiar |
|---|---|
| `assets/logos/` | Logo de la nueva marca (PNG transparente / webp). |
| `assets/fonts/` | Otra tipografía si la estética lo pide (descargar .woff2 del subset latino). |
| `src/theme.js` | **Paleta** (variables `--navy/--blue/--teal/...`), tipografía, gradientes, las **4 variantes de fondo**. Aquí vive el 80% de la estética. |
| `src/templates.js` | Ajustar/crear plantillas según el nicho (estilos, íconos). Mantener `esc()` y márgenes. |
| `src/prompt.js` | **El cerebro**: nicho/temas, reglas de marca, tono, idioma, fórmulas de hook, instrucciones de descripción y de hashtags. |
| `docs/estrategia-hashtags.md` | La fórmula de hashtags del nuevo nicho. |
| Caption (`caption.js`) | Si quieres otro prefijo en vez de 👇. |

### 8.3 Pasos concretos para una cuenta nueva
1. **Copiar el repo** como base (nuevo repo en GitHub, ej. `Marca2-TikTok`).
2. **Marca visual**: poner logo en `assets/logos/`, ajustar paleta/tipografía en `theme.js`,
   adaptar las plantillas y los 4 fondos. Renderizar 1 idea de prueba (`test-008.js`) hasta que
   la estética convenza.
3. **Nicho y voz**: reescribir `src/prompt.js` con la nueva temática, tono y reglas (hooks,
   descripción larga SEO, idioma). Actualizar la estrategia de hashtags.
4. **Datos**: empezar con un `pgas_ideas.csv` vacío (solo el header) o una semilla propia. El
   generador irá llenando.
5. **Bot de Telegram nuevo**: crear otro bot con @BotFather → token; obtener tu chat id
   (@userinfobot); crear `pgas-generator/.env` con `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`,
   `PGAS_ALLOWED_CHATS`.
6. **VPS**: nuevo proyecto en `/home/srv/apps/marca2`, **puerto distinto** (ej. `3011:3000`),
   `git clone`, crear `.env`, `mkdir -p data/dist`, `docker compose up -d --build`. Codex ya está
   autenticado en el host (`~/.codex` montado).
7. **Auto-deploy**: configurar los 4 secretos (`VPS_SSH_KEY` etc.) en el nuevo repo y empujar el
   workflow. (La misma clave de deploy del VPS sirve.)

### 8.4 Checklist rápida de replicación
- [ ] Logo + paleta + tipografía nuevos (`assets/`, `theme.js`)
- [ ] Plantillas y fondos ajustados a la estética
- [ ] `prompt.js` reescrito para el nuevo nicho/voz/idioma
- [ ] Estrategia de hashtags del nicho
- [ ] Bot de Telegram nuevo + `.env`
- [ ] Proyecto en el VPS con puerto libre distinto
- [ ] Secretos + workflow de auto-deploy en el repo nuevo
- [ ] Render de prueba aprobado antes de generar en lote

---

## 9. Operación diaria (desde Telegram)

- `/generar [N]` — Codex crea N ideas nuevas (sin repetir) y las renderiza.
- `/textos [N]` — envía solo el texto (sin imagen), para revisar/copiar.
- `/enviar [N]` — envía los posts completos (imagen + título + descripción).
- `/siguiente` — el próximo post.
- `/estado` — cuántas pendientes/listas/enviadas.
- `/borrar <id>` — elimina una idea.
- `/ayuda` — lista de comandos.

Actualizar el sistema: cambias código en local → `git push` → se despliega solo al VPS.

---

## 10. Gotchas / notas para el próximo agente

- **Glifos en Linux**: usar SVG para símbolos; mantener el fallback de fuentes (`Noto`, `DejaVu`)
  en `theme.js`. Evitar depender de emojis dentro de la imagen.
- **Codex auth**: debe existir `~/.codex` autenticado en el host del VPS (se monta al contenedor).
  El paquete npm es `@openai/codex`. El bot arranca aunque Codex falle; solo `/generar` lo necesita.
- **Telegram**: el caption del *photo* tiene tope de 1024 caracteres → por eso la imagen y el texto
  van en mensajes separados.
- **No repetir temas**: depende de que el CSV con el historial viva en el VPS (no se borra).
- **Acentos / voseo**: regla dura; el prompt y `lint.js` ayudan, pero revisar el output del LLM.
- **Un solo bot por token**: no correr el bot en dos lugares con el mismo token (conflicto de
  getUpdates). En producción corre solo en el VPS.
- **Márgenes**: si cambian el HUD de TikTok, ajustar `--safe-top` / `--safe-bottom` en `theme.js`.
