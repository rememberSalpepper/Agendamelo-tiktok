#!/bin/sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
ENV_FILE="$ROOT_DIR/agendamelo-generator/.env"
ENABLE_YOUTUBE=false

if [ "${1:-}" = "--enable-youtube" ]; then
  ENABLE_YOUTUBE=true
elif [ "$#" -gt 0 ]; then
  echo "Uso: $0 [--enable-youtube]" >&2
  exit 2
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "Falta $ENV_FILE; no se puede desplegar sin la configuración existente." >&2
  exit 1
fi

set_env() {
  key=$1
  value=$2
  temporary=$(mktemp "${ENV_FILE}.tmp.XXXXXX")
  awk -v key="$key" -v value="$value" '
    BEGIN { found = 0 }
    index($0, key "=") == 1 {
      if (!found) print key "=" value
      found = 1
      next
    }
    { print }
    END { if (!found) print key "=" value }
  ' "$ENV_FILE" > "$temporary"
  chmod 600 "$temporary"
  mv "$temporary" "$ENV_FILE"
}

cd "$ROOT_DIR"

if [ "$ENABLE_YOUTUBE" = true ]; then
  # El primer arranque siempre queda seguro aunque falle cualquier preflight posterior.
  set_env YOUTUBE_AUTO_PUBLISH false
  set_env YOUTUBE_AUTO_RENDER true
  set_env YOUTUBE_PUBLISH_TIME 20:30
  set_env YOUTUBE_TIMEZONE America/Santiago
  set_env YOUTUBE_PRIVACY_STATUS public
  set_env YOUTUBE_NOTIFY_SUBSCRIBERS false
  set_env YOUTUBE_OAUTH_CLIENT_FILE /app/secrets/youtube-oauth-client.json
  set_env YOUTUBE_TOKEN_FILE /app/secrets/youtube-token.json
  set_env YOUTUBE_MUSIC_FILE /app/music/vibe-check-blue-deer-studio.mp3
  set_env YOUTUBE_MUSIC_TITLE "Vibe Check"
  set_env YOUTUBE_MUSIC_ARTIST "Blue Deer Studio"
  set_env YOUTUBE_MUSIC_LICENSE "YouTube Audio Library"
fi

docker compose up -d --build

if [ "$ENABLE_YOUTUBE" = true ]; then
  test -s "$ROOT_DIR/data/music/vibe-check-blue-deer-studio.mp3"
  test -s "$ROOT_DIR/secrets/youtube-oauth-client.json"
  test -s "$ROOT_DIR/secrets/youtube-token.json"
  docker compose exec -T app npm run youtube:check
  docker compose exec -T app npm run youtube:dry-run

  set_env YOUTUBE_AUTO_PUBLISH true
  docker compose up -d --force-recreate --no-deps app
fi

curl --fail --silent --show-error --retry 15 --retry-connrefused --retry-delay 2 \
  http://127.0.0.1:3011/health >/dev/null
docker compose ps
