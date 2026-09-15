# Agendamelo — contenido orgánico para Meta

Genera piezas 4:5 para Facebook e Instagram, permite curarlas desde Telegram y puede publicar una
por día mediante Meta Graph API. La estrategia actual concentra el contenido en **manicuristas** y
usa el **Perfil Gratis** como entrada: página pública a $0, sin tarjeta ni vencimiento; la agenda
completa se prueba gratis durante 7 días.

TikTok y Reels quedan como un flujo separado de kits de video faceless. El sistema genera el guion y
el caption, pero el montaje, audio y publicación se hacen manualmente.

## Propuesta y precios canónicos

- Perfil Gratis: **$0**, página pública sin agenda, hasta 2 servicios y 2 fotos.
- Estándar: **$12.990/mes** o **$64.000/año**.
- Web Pro: **$19.990/mes**.
- Agenda completa: **7 días gratis, sin tarjeta**.
- Recordatorios: correo y WhatsApp; WhatsApp limitado en Estándar e ilimitado en Web Pro.

No cambies estos datos solo en el copy: la fuente de verdad está en `src/kit-config.js` y los
validadores rechazan cifras o afirmaciones incompatibles.

## Flujo editorial

```text
agendamelo_ideas.csv
  → npm run generate       crea ideas de un nicho, con variantes de hook
  → /revisar               una persona elige el hook
  → npm run render         crea JPEG 4:5 en dist/ (2160×2700)
  → /enviar                entrega una vista previa por Telegram
  → /publicar o scheduler  publica en Facebook + Instagram
```

Estados: `pendiente → renderizado → enviado → publicado`. El CSV conserva los identificadores de
Facebook e Instagram, por lo que un reintento parcial no duplica el canal que ya terminó.

La mezcla editorial sigue siendo 40% educación, 30% producto y 30% conversión. El Perfil Gratis es
el CTA principal; el precio pagado aparece solo cuando resuelve una objeción concreta.

## Comandos locales

```bash
npm install
npx playwright install chromium
npm test
npm run preview          # nueve muestras en dist/_preview-*.jpg
npm run generate -- 12 manicuristas
npm run lint
npm run render
npm run meta:dry-run     # valida configuración sin publicar
npm run meta:check       # comprueba token y cuentas; no publica
npm run meta:publish     # publica la próxima pieza renderizada
npm run kit -- 5 manicuristas
npm run bot
```

Los comandos leen `.env`; parte copiando `.env.example`. `AGENDAMELO_CODEX_MODEL` y
`AGENDAMELO_CODEX_EFFORT` permiten ajustar el modelo utilizado para generar texto.

## Telegram

- `/generar [N] [nicho]`: crea ideas con variantes de hook.
- `/revisar [N]`: presenta las opciones para curación humana.
- `/render`: renderiza solo las ideas curadas.
- `/enviar [N]`: entrega las piezas por Telegram.
- `/meta`: prueba la configuración Meta sin publicar.
- `/publicar [id]`: publica una pieza concreta o la siguiente de la cola.
- `/kit [N] [nicho]`: crea kits manuales para Reels/TikTok.
- `/nicho`, `/estilo`, `/estado`, `/ver`, `/rehacer`, `/borrar`, `/diagnostico`: operación y ajustes.

## Publicación Meta

Variables necesarias:

```dotenv
META_GRAPH_VERSION=v26.0
META_PAGE_ID=
META_IG_USER_ID=
META_PAGE_ACCESS_TOKEN=
PUBLIC_MEDIA_BASE_URL=https://contenido.agendamelo.cl/media
META_TRACKING_URL=https://agendamelo.cl/?utm_source=facebook&utm_medium=organic&utm_campaign=perfil-gratis-manicuristas
META_AUTO_PUBLISH=false
META_PUBLISH_TIME=20:30
META_TIMEZONE=America/Santiago
```

`PUBLIC_MEDIA_BASE_URL` debe ser HTTPS y exponer los JPEG de `dist/`. Antes de activar el reloj:

1. deja `META_AUTO_PUBLISH=false`;
2. verifica `npm run meta:dry-run`;
3. comprueba permisos y cuentas con `npm run meta:check`;
4. prueba una pieza con `/publicar <id>`;
5. confirma el resultado en ambas cuentas;
6. cambia a `META_AUTO_PUBLISH=true` y reinicia el contenedor.

Instagram requiere una cuenta profesional conectada a la página y el token debe tener los permisos
de publicación de Instagram y administración de posts de página. Nunca guardes el token en git.

## Archivos principales

- `src/prompt.js`: estrategia de imágenes y reglas de contenido.
- `src/theme.js`, `src/templates.js`, `src/slides.js`: sistema visual 4:5.
- `src/caption.js`: captions orientados al embudo freemium.
- `src/meta.js`: publicación idempotente en Facebook e Instagram.
- `src/meta-scheduler.js`: reloj diario en zona horaria de Santiago.
- `src/kit-prompt.js`: kits manuales para Reels/TikTok.
- `src/niches.js`: acento, lenguaje y dolores por nicho.
- `docs/LINEA-EDITORIAL.md`: estrategia editorial vigente.
- `docs/AUDITORIA-Y-PLAN-META-2026-09.md`: diagnóstico, métricas y plan de 30 días.
- `docs/META-SETUP.md`: obtención segura de IDs/token y prueba de ambas cuentas.

## CSV de publicaciones

Además del contenido y estado editorial, el CSV incluye:

- `imagen_url`: uno o más JPEG separados por coma.
- `facebook_post_id` e `instagram_media_id`: resultado remoto de cada canal.
- `meta_published_at`: fecha ISO de publicación completa.
- `meta_error`: último error recuperable.

Las piezas simples y cada lámina de carrusel usan 1080×1350 CSS y se exportan a 2160×2700 JPEG.
