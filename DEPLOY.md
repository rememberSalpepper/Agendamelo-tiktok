# Deploy en el VPS (Docker)

Proyecto: bot de Telegram + generador de posts de **Agendamelo**. Corre como un contenedor
(`docker compose`). El bot escucha comandos y expone un endpoint de salud en :3000
(mapeado a **:3011** en el host).

## 0) Requisitos en el VPS
- Docker + docker compose.
- **Codex CLI instalado y autenticado** como el usuario `srv`:
  ```bash
  codex login          # deja la sesión en /home/srv/.codex
  ls /home/srv/.codex  # debe existir (auth.json, etc.)
  ```
  El contenedor monta esa carpeta para usar tu sesión de Codex.

## 1) Subir el proyecto
Ubicación: `/home/srv/apps/agendamelo`

```bash
cd /home/srv/apps
git clone <tu-repo-de-agendamelo>.git agendamelo
cd agendamelo
```

## 2) Crear el .env (token + chat, NO está en el repo)
```bash
cp agendamelo-generator/.env.example agendamelo-generator/.env
nano agendamelo-generator/.env   # TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, AGENDAMELO_ALLOWED_CHATS
```

## 3) Datos iniciales (CSV vivo + carpeta de imágenes)
```bash
mkdir -p data/dist
cp agendamelo_ideas.seed.csv data/agendamelo_ideas.csv   # arranca vacío (solo header)
```

## 4) (Si tu Codex no está en /home/srv/.codex)
Ajusta esa ruta en `docker-compose.yml` (volumen `/home/srv/.codex:/root/.codex`).

## 5) Levantar
```bash
docker compose up -d --build
```

## 6) Verificar
```bash
docker ps
docker logs --tail 100 agendamelo-tiktok   # "Salud en :3000" y "Bot Agendamelo escuchando"
curl http://127.0.0.1:3011                  # {"ok":true,"servicio":"agendamelo-bot",...}
```
Y en Telegram, escríbele `/estado` al bot.

## 7) Generar el primer lote
Como el CSV arranca vacío, genera ideas desde Telegram con `/generar 14` (Codex las crea y
renderiza). Luego `/textos` para revisar y `/enviar 5` para recibir los posts.

## Uso diario (desde Telegram)
- `/generar 14` → Codex crea 14 ideas nuevas (rotando nichos) y las renderiza.
- `/enviar [N]` → te manda N posts listos (imagen + título + descripción).
- `/estado`, `/textos`, `/siguiente`, `/borrar <id>`, `/ayuda`.

## Actualizar el VPS cuando cambies algo en tu PC
```bash
# en tu PC:
git push
# en el VPS (o automático por GitHub Actions):
cd /home/srv/apps/agendamelo && git pull && docker compose up -d --build
```
El CSV y las imágenes viven en `./data` y NO se tocan al actualizar.

## Notas
- El contenedor se reinicia solo (`restart: unless-stopped`).
- Puerto host: **3011** (distinto al de PGAS, que usa 3010).
- **Un solo bot por token**: no corras el bot a la vez en tu PC y en el VPS (conflicto de
  getUpdates). En producción corre solo en el VPS.
- Si `npm install -g @openai/codex` fallara en el build, el bot igual arranca; solo `/generar`
  necesita Codex.
