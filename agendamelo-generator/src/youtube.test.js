import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  chmodSync, mkdtempSync, readFileSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import {
  buildYoutubeDryRun, buildYoutubeMetadata, checkYoutubeConnection, isYoutubeCandidate,
  latestYoutubePublishedAt, publishNextYoutube,
} from './youtube.js';

function fixture() {
  const dir = mkdtempSync(join(tmpdir(), 'agendamelo-youtube-publish-'));
  const clientFile = join(dir, 'client.json');
  const tokenFile = join(dir, 'token.json');
  const kitsCsv = join(dir, 'kits.csv');
  const video = join(dir, 'short.mp4');
  writeFileSync(clientFile, JSON.stringify({ installed: {
    client_id: 'cliente-prueba', client_secret: 'secreto-prueba',
  } }), { mode: 0o600 });
  writeFileSync(tokenFile, JSON.stringify({ refresh_token: 'refresh-token-prueba-largo' }), { mode: 0o600 });
  chmodSync(clientFile, 0o600);
  chmodSync(tokenFile, 0o600);
  writeFileSync(video, 'mp4-prueba');
  const rows = [{
    id: 'AGENDA-KIT-001', estado: 'entregado', hook: 'Tu agenda puede verse *profesional*',
    tema: 'Perfil Gratis', caption_seo: 'Ordena tu presencia digital.',
    cta: 'Crea tu Perfil Gratis en agendamelo.cl', hashtags: '#manicuristas #agendaonline',
    youtube_video_path: video, youtube_video_id: '', youtube_status: 'renderizado',
    youtube_published_at: '', youtube_error: '',
  }];
  writeFileSync(kitsCsv, stringify(rows, { header: true }));
  const config = {
    clientFile, tokenFile, kitsCsv, privacyStatus: 'private', categoryId: '22',
    notifySubscribers: false,
  };
  return { config, kitsCsv, video };
}

describe('publicador de YouTube Shorts', () => {
  test('solo acepta MP4 renderizado y sin id remoto', () => {
    const base = { youtube_status: 'renderizado', youtube_video_path: 'short.mp4', youtube_video_id: '' };
    assert.equal(isYoutubeCandidate(base), true);
    assert.equal(isYoutubeCandidate({ ...base, youtube_status: 'pendiente' }), false);
    assert.equal(isYoutubeCandidate({ ...base, youtube_video_id: 'video-1' }), false);
    assert.equal(isYoutubeCandidate({ ...base, youtube_video_path: 'imagen.jpg' }), false);
  });

  test('arma metadatos privados y trazables', () => {
    const metadata = buildYoutubeMetadata({
      id: 'AGENDA-KIT-001', hook: 'Hook *limpio*', caption_seo: 'Descripción',
      cta: 'Perfil Gratis', hashtags: '#manicuristas #agendaonline',
      youtube_music_attribution: 'Música: Artista — Pista',
    }, { privacyStatus: 'private', categoryId: '22' });
    assert.equal(metadata.snippet.title, 'Hook limpio');
    assert.match(metadata.snippet.description, /Contenido: AGENDA-KIT-001/);
    assert.match(metadata.snippet.description, /Música: Artista — Pista/);
    assert.deepEqual(metadata.status, { privacyStatus: 'private', selfDeclaredMadeForKids: false });
  });

  test('elimina caracteres que YouTube rechaza en título y descripción', () => {
    const metadata = buildYoutubeMetadata({
      id: 'AGENDA-KIT-001', hook: 'Agenda <rápida>', caption_seo: 'Ordena <tu agenda>',
      cta: 'Crea tu Perfil Gratis -> agendamelo.cl', hashtags: '#agenda',
    }, { privacyStatus: 'public', categoryId: '22' });
    assert.equal(metadata.snippet.title, 'Agenda rápida');
    assert.match(metadata.snippet.description, /Perfil Gratis → agendamelo\.cl/);
    assert.equal(/[<>]/.test(metadata.snippet.description), false);
  });

  test('dry run valida archivos sin llamar a Google ni modificar el CSV', () => {
    const { config, kitsCsv } = fixture();
    const before = readFileSync(kitsCsv, 'utf8');
    const result = buildYoutubeDryRun({ config });
    assert.equal(result.ready, true);
    assert.equal(result.queued, 1);
    assert.equal(result.next.videoExists, true);
    assert.equal(result.next.privacyStatus, 'private');
    assert.equal(readFileSync(kitsCsv, 'utf8'), before);
  });

  test('check solo renueva OAuth y nunca devuelve el access token', async () => {
    const { config } = fixture();
    const result = await checkYoutubeConnection({
      config, authClient: { getAccessToken: async () => ({ token: 'access-token-secreto' }) },
    });
    assert.deepEqual(result, {
      authenticated: true, scope: 'youtube.upload', privacyStatus: 'private',
    });
    assert.equal(JSON.stringify(result).includes('access-token-secreto'), false);
  });

  test('guarda el id remoto y no vuelve a seleccionar el mismo Short', async () => {
    const { config, kitsCsv } = fixture();
    let uploads = 0;
    const youtubeClient = { videos: { insert: async (request) => {
      uploads++;
      assert.equal(request.requestBody.status.privacyStatus, 'private');
      assert.equal(request.notifySubscribers, false);
      assert.equal(typeof request.media.body.pipe, 'function');
      request.media.body.destroy();
      return { data: { id: 'youtube-video-1' } };
    } } };
    const now = () => new Date('2026-09-16T22:00:00.000Z');
    const result = await publishNextYoutube({ config, youtubeClient, now });
    assert.deepEqual(result, {
      id: 'AGENDA-KIT-001', videoId: 'youtube-video-1', privacyStatus: 'private',
    });
    const [saved] = parse(readFileSync(kitsCsv), { columns: true, skip_empty_lines: true });
    assert.equal(saved.youtube_status, 'publicado');
    assert.equal(saved.youtube_video_id, 'youtube-video-1');
    assert.equal(saved.youtube_published_at, '2026-09-16T22:00:00.000Z');
    assert.equal(await publishNextYoutube({ config, youtubeClient, now }), null);
    assert.equal(uploads, 1);
    assert.equal(latestYoutubePublishedAt(kitsCsv), '2026-09-16T22:00:00.000Z');
  });
});
