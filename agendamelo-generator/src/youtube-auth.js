// Autorización interactiva de un único canal de YouTube mediante OAuth 2.0 + PKCE.
//
// Este comando se ejecuta una sola vez en una máquina con navegador. Guarda únicamente el
// refresh token en un archivo 0600; nunca lo imprime. El publicador del VPS usará ese archivo
// para renovar access tokens sin intervención humana.

import './env.js';
import { createServer } from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildYoutubeAuthUrl, createOauthState, createPkce, exchangeAuthorizationCode,
  readOauthClientFile, writeRefreshTokenFile,
} from './youtube-oauth.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CLIENT_FILE = process.env.YOUTUBE_OAUTH_CLIENT_FILE
  || join(ROOT, '.secrets', 'youtube-oauth-client.json');
const TOKEN_FILE = process.env.YOUTUBE_TOKEN_FILE || join(ROOT, '.secrets', 'youtube-token.json');
const LOGIN_HINT = (process.env.YOUTUBE_CHANNEL_ACCOUNT || 'agendamelo.cl@gmail.com').trim();
const PORT = Number(process.env.YOUTUBE_OAUTH_PORT || 53682);
const HOST = '127.0.0.1';

function html(message, ok) {
  const colour = ok ? '#147d64' : '#a33b3b';
  return `<!doctype html><meta charset="utf-8"><title>Agendamelo YouTube</title>
    <body style="font:18px system-ui;max-width:620px;margin:80px auto;padding:24px">
    <h1 style="color:${colour}">${ok ? 'Autorización guardada' : 'No se pudo autorizar'}</h1>
    <p>${message}</p></body>`;
}

async function main() {
  const { clientId, clientSecret } = readOauthClientFile(CLIENT_FILE);
  const configuredClientId = (process.env.YOUTUBE_CLIENT_ID || '').trim();
  if (configuredClientId && configuredClientId !== clientId) {
    throw new Error('YOUTUBE_CLIENT_ID no coincide con el archivo OAuth protegido.');
  }
  if (!Number.isInteger(PORT) || PORT < 1024 || PORT > 65535) {
    throw new Error('YOUTUBE_OAUTH_PORT debe ser un puerto entre 1024 y 65535.');
  }

  const { verifier, challenge } = createPkce();
  const state = createOauthState();
  const redirectUri = `http://${HOST}:${PORT}/oauth2/callback`;
  let completed = false;

  const server = createServer(async (request, response) => {
    const url = new URL(request.url || '/', redirectUri);
    if (url.pathname !== '/oauth2/callback') {
      response.writeHead(404).end('No encontrado');
      return;
    }
    try {
      if (completed) throw new Error('Este intento de autorización ya terminó.');
      if (url.searchParams.get('state') !== state) throw new Error('El estado OAuth no coincide.');
      if (url.searchParams.get('error')) throw new Error(`Google respondió: ${url.searchParams.get('error')}`);
      const code = url.searchParams.get('code');
      if (!code) throw new Error('Google no devolvió un código de autorización.');
      const tokens = await exchangeAuthorizationCode({
        clientId, clientSecret, code, redirectUri, codeVerifier: verifier,
      });
      writeRefreshTokenFile(TOKEN_FILE, tokens);
      completed = true;
      response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      response.end(html('El refresh token quedó guardado localmente. Puedes cerrar esta pestaña.', true));
      console.log(`✓ Autorización guardada en ${TOKEN_FILE} (contenido oculto).`);
    } catch (error) {
      response.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
      response.end(html(error.message, false));
      console.error(`OAuth: ${error.message}`);
    } finally {
      setImmediate(() => server.close());
    }
  });

  server.listen(PORT, HOST, () => {
    const authUrl = buildYoutubeAuthUrl({
      clientId, redirectUri, state, codeChallenge: challenge, loginHint: LOGIN_HINT,
    });
    console.log('Abre esta URL en tu navegador y autoriza con la cuenta del canal:');
    console.log(authUrl);
    console.log(`El callback local esperará en ${redirectUri}.`);
  });

  const timeout = setTimeout(() => {
    if (!completed) console.error('OAuth: tiempo agotado sin recibir autorización.');
    server.close();
  }, 10 * 60 * 1000);
  timeout.unref();
}

main().catch((error) => { console.error(error.message); process.exit(1); });
