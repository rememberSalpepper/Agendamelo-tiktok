# Imagen del bot/generador Agendamelo para TikTok.
FROM node:22-bookworm-slim

# Fuentes (cobertura de glifos), git y utilidades del sistema.
RUN apt-get update && apt-get install -y --no-install-recommends \
      fonts-noto fonts-noto-color-emoji ca-certificates git curl \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app/agendamelo-generator

# Dependencias de Node (capa cacheable).
COPY agendamelo-generator/package*.json ./
RUN npm install --omit=dev

# Chromium + sus dependencias de sistema (para Playwright).
RUN npx playwright install --with-deps chromium

# Codex CLI (generador de ideas). La sesión se monta como volumen (~/.codex).
RUN npm install -g @openai/codex || echo "OJO: revisar instalacion de codex"

# Código de la app.
COPY . /app

ENV PORT=3000
EXPOSE 3000
CMD ["node", "src/bot.js"]
