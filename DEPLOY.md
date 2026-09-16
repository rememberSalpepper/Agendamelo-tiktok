# Deploy en un VPS nuevo

El contenedor ejecuta el bot de Telegram, genera los JPEG y publica en Facebook, Instagram y YouTube
Shorts. Expone `/health` y `/media/<archivo>` en el puerto interno 3000; Docker lo mapea a 3011.

## 1. Requisitos

- VPS Linux con Docker y `docker compose`.
- Dominio o subdominio con HTTPS, por ejemplo `contenido.agendamelo.cl`.
- Codex CLI autenticado como el usuario que ejecuta Docker, si se generarán ideas en el VPS.
- Página de Facebook y cuenta profesional de Instagram conectadas.
- App de Meta con permisos aprobados para publicar en ambas cuentas.

## 2. Instalar el proyecto

```bash
mkdir -p /home/debian/apps
cd /home/debian/apps
git clone <URL_DEL_REPO> agendamelo
cd agendamelo
mkdir -p data/dist
cp agendamelo_ideas.seed.csv data/agendamelo_ideas.csv
cp agendamelo_kits.seed.csv data/agendamelo_kits.csv
printf '{}\n' > data/agendamelo_settings.json
cp agendamelo-generator/.env.example agendamelo-generator/.env
```

Si Codex se usará dentro del contenedor, autentícalo en el host y confirma que el volumen de
`docker-compose.yml` apunte a la carpeta correcta:

```bash
codex login
ls /home/debian/.codex
```

## 3. Configurar secretos

Edita `agendamelo-generator/.env` en el VPS. No lo copies a chats ni lo subas a git.

```dotenv
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
AGENDAMELO_ALLOWED_CHATS=

META_GRAPH_VERSION=v26.0
META_PAGE_ID=
META_IG_USER_ID=
META_PAGE_ACCESS_TOKEN=
PUBLIC_MEDIA_BASE_URL=https://contenido.agendamelo.cl/media
META_TRACKING_URL=https://agendamelo.cl/?utm_source=facebook&utm_medium=organic&utm_campaign=perfil-gratis-manicuristas
META_AUTO_PUBLISH=false
META_PUBLISH_TIMES=10:00,15:30,20:30
META_TIMEZONE=America/Santiago

YOUTUBE_OAUTH_CLIENT_FILE=/app/secrets/youtube-oauth-client.json
YOUTUBE_TOKEN_FILE=/app/secrets/youtube-token.json
YOUTUBE_PRIVACY_STATUS=public
YOUTUBE_NOTIFY_SUBSCRIBERS=false
YOUTUBE_AUTO_PUBLISH=false
YOUTUBE_AUTO_RENDER=true
YOUTUBE_AUTO_GENERATE=true
YOUTUBE_AUTO_GENERATE_NICHE=manicuristas
YOUTUBE_PUBLISH_TIME=20:30
YOUTUBE_TIMEZONE=America/Santiago
YOUTUBE_MUSIC_FILE=/app/music/vibe-check-blue-deer-studio.mp3
YOUTUBE_MUSIC_LICENSE=YouTube Audio Library
```

Mantén la publicación automática apagada hasta terminar la prueba manual.

## 4. Levantar y exponer HTTPS

```bash
docker compose up -d --build
docker ps
docker logs --tail 100 agendamelo-tiktok
curl http://127.0.0.1:3011/health
```

El servicio `caddy` incluido en `docker-compose.yml` publica únicamente `/media/*` y obtiene HTTPS
automáticamente cuando el DNS de `contenido.agendamelo.cl` apunta al VPS. Verifica una imagen real
antes de conectar Meta:

```bash
curl -I https://contenido.agendamelo.cl/media/<archivo.jpg>
```

Debe responder `200`, `Content-Type: image/jpeg` y ser accesible sin autenticación. Solo el directorio
de imágenes queda público; los tokens permanecen en `.env`.

## 5. Conectar Meta

La app de Meta debe disponer, como mínimo, de:

- Facebook Pages: `pages_show_list` para descubrir la página, `pages_manage_posts` para publicar y
  `pages_read_engagement` para acceder a la página.
- Instagram: `instagram_basic`, `instagram_content_publish` y `pages_read_engagement` para el flujo
  de Facebook Login.

Después de cargar IDs y token:

```bash
docker compose restart app
docker compose exec app npm run meta:dry-run
docker compose exec app npm run meta:check
```

Desde Telegram, renderiza una pieza y prueba `/publicar <id>`. Revisa que aparezca correctamente en
Facebook e Instagram. Solo entonces cambia `META_AUTO_PUBLISH=true` y reinicia:

```bash
docker compose restart app
docker logs --tail 100 agendamelo-tiktok
```

El scheduler publica una sola pieza por cada franja configurada en `META_PUBLISH_TIMES`, incluso si el
contenedor se reinicia: recupera las franjas ya publicadas desde el CSV y no duplica contenido. Si se
reinicia después de varias horas, recupera solo la franja vencida más reciente para no publicar varias
piezas juntas. Si falla, conserva el error y reintenta 30 minutos después; si no hay cola, vuelve a mirar
una hora después.

## 6. Operación diaria

1. `/generar 21 manicuristas` crea aproximadamente una semana de ideas a tres publicaciones diarias.
2. `/revisar 21` permite escoger los hooks.
3. `/render` deja los JPEG en la cola.
4. El scheduler publica a las 10:00, 15:30 y 20:30 (zona `America/Santiago`).
5. `/estado` muestra pendientes, renderizados, enviados y publicados.

Mantén al menos 21 piezas renderizadas. El audio y montaje de Reels/TikTok siguen siendo manuales
con `/kit`, porque este publicador automático cubre Facebook e Instagram estático/carrusel.

## 7. Actualizaciones y respaldo

```bash
cd /home/debian/apps/agendamelo
git pull --ff-only
docker compose up -d --build
```

Respalda periódicamente `data/agendamelo_ideas.csv`, `data/agendamelo_kits.csv` y `data/dist/`. Esos
datos viven fuera de la imagen Docker y sobreviven a los rebuilds.

## 8. Activar un YouTube Short diario

Guarda `youtube-oauth-client.json` y `youtube-token.json` con permisos `0600` en `./secrets/`, y la
pista autorizada en `./data/music/`. Después ejecuta el despliegue seguro:

```bash
./scripts/deploy-vps.sh --enable-youtube
```

El script apaga primero la autopublicación, reconstruye el contenedor, comprueba OAuth, música y el
dry-run, y solo entonces recrea la app con `YOUTUBE_AUTO_PUBLISH=true`. El horario inicial es 20:30
en `America/Santiago`, una pieza por día. Si no hay cola, genera un único kit de manicuristas antes
de renderizarlo. Si una comprobación falla, el contenedor queda operativo pero el scheduler de
YouTube permanece apagado.

Nunca ejecutes simultáneamente dos instancias con el mismo token de Telegram ni dos schedulers Meta
o YouTube sobre el mismo CSV.
