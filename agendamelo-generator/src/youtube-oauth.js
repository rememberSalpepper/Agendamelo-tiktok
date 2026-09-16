import { createHash, randomBytes } from 'node:crypto';
import {
  chmodSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync,
} from 'node:fs';
import { dirname } from 'node:path';

export const YOUTUBE_UPLOAD_SCOPE = 'https://www.googleapis.com/auth/youtube.upload';
export const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
export const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

function base64url(value) {
  return Buffer.from(value).toString('base64url');
}

export function createPkce() {
  const verifier = base64url(randomBytes(48));
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  return { verifier, challenge };
}

export function createOauthState() {
  return base64url(randomBytes(32));
}

export function readOauthClientFile(file) {
  let document;
  try {
    const mode = statSync(file).mode & 0o777;
    if ((mode & 0o077) !== 0) {
      throw new Error('permisos inseguros');
    }
    document = JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    throw new Error(`No se pudo leer el cliente OAuth protegido en ${file}.`);
  }

  const config = document?.installed || document?.web;
  const clientId = String(config?.client_id || '').trim();
  const clientSecret = String(config?.client_secret || '').trim();
  if (!clientId || !clientSecret) {
    throw new Error(`El archivo OAuth ${file} no contiene client_id y client_secret.`);
  }
  return { clientId, clientSecret };
}

export function buildYoutubeAuthUrl({ clientId, redirectUri, state, codeChallenge, loginHint = '' }) {
  if (!clientId) throw new Error('Falta YOUTUBE_CLIENT_ID.');
  const url = new URL(GOOGLE_AUTH_URL);
  url.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: YOUTUBE_UPLOAD_SCOPE,
    access_type: 'offline',
    prompt: 'consent',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    ...(loginHint ? { login_hint: loginHint } : {}),
  });
  return url.toString();
}

export async function exchangeAuthorizationCode({
  clientId, clientSecret, code, redirectUri, codeVerifier, fetchImpl = fetch,
}) {
  if (!clientSecret) throw new Error('Falta el client_secret del cliente OAuth.');
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
    code_verifier: codeVerifier,
  });
  const response = await fetchImpl(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.error) {
    const detail = result.error_description || result.error || `${response.status} ${response.statusText}`;
    throw new Error(`Google OAuth rechazó el código: ${detail}`);
  }
  if (!result.refresh_token) {
    throw new Error('Google no devolvió refresh_token; revoca el permiso anterior y vuelve a autorizar.');
  }
  return result;
}

export function writeRefreshTokenFile(file, tokenResponse) {
  if (!tokenResponse?.refresh_token) throw new Error('No hay refresh_token para guardar.');
  mkdirSync(dirname(file), { recursive: true, mode: 0o700 });
  const temporary = `${file}.tmp-${process.pid}`;
  writeFileSync(temporary, `${JSON.stringify({ refresh_token: tokenResponse.refresh_token })}\n`, {
    encoding: 'utf8', mode: 0o600,
  });
  renameSync(temporary, file);
  chmodSync(file, 0o600);
}

export function readRefreshTokenFile(file) {
  let document;
  try {
    const mode = statSync(file).mode & 0o777;
    if ((mode & 0o077) !== 0) throw new Error('permisos inseguros');
    document = JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    throw new Error(`No se pudo leer el refresh token protegido en ${file}.`);
  }
  const refreshToken = String(document?.refresh_token || '').trim();
  if (!refreshToken) throw new Error(`El archivo OAuth ${file} no contiene refresh_token.`);
  return refreshToken;
}
