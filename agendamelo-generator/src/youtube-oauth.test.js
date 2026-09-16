import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  chmodSync, mkdtempSync, readFileSync, statSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  buildYoutubeAuthUrl, exchangeAuthorizationCode, readOauthClientFile, readRefreshTokenFile,
  writeRefreshTokenFile, YOUTUBE_UPLOAD_SCOPE,
} from './youtube-oauth.js';

describe('OAuth de YouTube con PKCE', () => {
  test('solicita solo youtube.upload, acceso offline y PKCE', () => {
    const url = new URL(buildYoutubeAuthUrl({
      clientId: 'cliente-prueba',
      redirectUri: 'http://127.0.0.1:53682/oauth2/callback',
      state: 'estado-prueba',
      codeChallenge: 'reto-prueba',
      loginHint: 'canal@example.com',
    }));
    assert.equal(url.searchParams.get('scope'), YOUTUBE_UPLOAD_SCOPE);
    assert.equal(url.searchParams.get('access_type'), 'offline');
    assert.equal(url.searchParams.get('prompt'), 'consent');
    assert.equal(url.searchParams.get('code_challenge_method'), 'S256');
    assert.equal(url.searchParams.get('login_hint'), 'canal@example.com');
  });

  test('intercambia el código enviando el client_secret requerido por Google', async () => {
    let request;
    const fetchImpl = async (url, options) => {
      request = { url, options };
      return new Response(JSON.stringify({ refresh_token: 'refresh-falso', access_token: 'access-falso' }), { status: 200 });
    };
    const result = await exchangeAuthorizationCode({
      clientId: 'cliente-prueba', clientSecret: 'secreto-prueba', code: 'codigo-prueba',
      redirectUri: 'http://127.0.0.1:53682/oauth2/callback',
      codeVerifier: 'verificador-prueba', fetchImpl,
    });
    assert.equal(result.refresh_token, 'refresh-falso');
    assert.equal(request.url, 'https://oauth2.googleapis.com/token');
    assert.equal(request.options.body.get('client_secret'), 'secreto-prueba');
    assert.equal(request.options.body.get('code_verifier'), 'verificador-prueba');
  });

  test('lee el cliente OAuth únicamente desde un archivo protegido', () => {
    const dir = mkdtempSync(join(tmpdir(), 'agendamelo-youtube-client-'));
    const file = join(dir, 'client.json');
    writeFileSync(file, JSON.stringify({
      installed: { client_id: 'cliente-prueba', client_secret: 'secreto-prueba' },
    }), { mode: 0o600 });
    chmodSync(file, 0o600);
    assert.deepEqual(readOauthClientFile(file), {
      clientId: 'cliente-prueba', clientSecret: 'secreto-prueba',
    });
  });

  test('guarda únicamente el refresh token con permisos 0600', () => {
    const dir = mkdtempSync(join(tmpdir(), 'agendamelo-youtube-'));
    const file = join(dir, 'youtube-token.json');
    writeRefreshTokenFile(file, { refresh_token: 'refresh-falso', access_token: 'no-guardar' });
    const saved = JSON.parse(readFileSync(file, 'utf8'));
    assert.deepEqual(saved, { refresh_token: 'refresh-falso' });
    assert.equal(statSync(file).mode & 0o777, 0o600);
    assert.equal(readRefreshTokenFile(file), 'refresh-falso');
  });
});
