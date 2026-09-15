import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { checkMetaConnection, getMetaConfig, isMetaCandidate, latestMetaPublishedAt, metaConfigSummary, publicMediaUrls, publishFacebook, publishInstagram } from './meta.js';
import { localDateTime, shouldPublishNow, validPublishTime } from './meta-scheduler.js';
import { buildMetaCaption } from './caption.js';

const config = {
  version: 'v26.0', token: 'token-prueba', pageId: '123', igUserId: '456',
  publicBase: 'https://contenido.example.com/media',
};

describe('configuración Meta', () => {
  test('exige token, cuenta y URL pública', () => {
    const s = metaConfigSummary(getMetaConfig({}));
    assert.equal(s.ready, false);
    assert.ok(s.missing.includes('META_PAGE_ACCESS_TOKEN'));
    assert.ok(s.missing.includes('PUBLIC_MEDIA_BASE_URL'));
  });

  test('acepta una configuración completa para ambos canales', () => {
    const s = metaConfigSummary(config);
    assert.deepEqual(s, { ready: true, channels: ['Facebook', 'Instagram'], missing: [] });
  });

  test('convierte rutas locales en URLs públicas sin filtrar directorios', () => {
    const urls = publicMediaUrls({ id: 'A-1', imagen_url: 'dist/A-1.jpg,dist/A-1-2.jpg' }, config.publicBase);
    assert.deepEqual(urls, [
      'https://contenido.example.com/media/A-1.jpg',
      'https://contenido.example.com/media/A-1-2.jpg',
    ]);
  });

  test('rechaza una base sin HTTPS', () => {
    assert.throws(() => publicMediaUrls({ id: 'A-1', imagen_url: 'dist/A-1.jpg' }, 'http://localhost:3000/media'), /HTTPS/);
  });

  test('acepta como cola Meta una pieza renderizada o enviada, pero no una ya publicada', () => {
    assert.equal(isMetaCandidate({ estado: 'renderizado' }, config), true);
    assert.equal(isMetaCandidate({ estado: 'enviado' }, config), true);
    assert.equal(isMetaCandidate({ estado: 'publicado' }, config), false);
    assert.equal(isMetaCandidate({ estado: 'enviado', facebook_post_id: 'fb', instagram_media_id: 'ig' }, config), false);
  });
});

describe('publicadores Graph API', () => {
  test('el chequeo descubre la cuenta profesional conectada sin exponer el token', async () => {
    const fetchImpl = async (url) => {
      const path = new URL(url).pathname;
      if (path.endsWith('/123')) return new Response(JSON.stringify({ id: '123', name: 'Agendamelo', instagram_business_account: { id: '456' } }), { status: 200 });
      if (path.endsWith('/456')) return new Response(JSON.stringify({ id: '456', username: 'agendamelo' }), { status: 200 });
      return new Response('{}', { status: 404 });
    };
    const out = await checkMetaConnection({ config, fetchImpl });
    assert.deepEqual(out.page, { id: '123', name: 'Agendamelo' });
    assert.deepEqual(out.instagram, { id: '456', username: 'agendamelo' });
    assert.equal(JSON.stringify(out).includes(config.token), false);
  });

  test('Facebook publica una foto con caption', async () => {
    const calls = [];
    const fetchImpl = async (url, options) => {
      calls.push({ url: String(url), options });
      return new Response(JSON.stringify({ id: 'foto-1', post_id: 'post-1' }), { status: 200 });
    };
    const id = await publishFacebook({ urls: ['https://contenido.example.com/media/a.jpg'], caption: 'Hola', config, fetchImpl });
    assert.equal(id, 'post-1');
    assert.match(calls[0].url, /v26\.0\/123\/photos$/);
    assert.match(String(calls[0].options.body), /message=Hola/);
  });

  test('Instagram crea, espera y publica el contenedor', async () => {
    const calls = [];
    const fetchImpl = async (url, options) => {
      const path = new URL(url).pathname;
      calls.push({ path, method: options.method });
      if (path.endsWith('/456/media')) return new Response(JSON.stringify({ id: 'container-1' }), { status: 200 });
      if (path.endsWith('/container-1')) return new Response(JSON.stringify({ status_code: 'FINISHED' }), { status: 200 });
      if (path.endsWith('/456/media_publish')) return new Response(JSON.stringify({ id: 'ig-media-1' }), { status: 200 });
      return new Response(JSON.stringify({ error: { message: 'ruta inesperada' } }), { status: 400 });
    };
    const id = await publishInstagram({
      urls: ['https://contenido.example.com/media/a.jpg'], caption: 'Hola', altText: 'Uñas', config, fetchImpl,
    });
    assert.equal(id, 'ig-media-1');
    assert.deepEqual(calls.map((c) => c.path), [
      '/v26.0/456/media', '/v26.0/container-1', '/v26.0/456/media_publish',
    ]);
  });

  test('Instagram rechaza PNG antes de llamar a Meta', async () => {
    await assert.rejects(() => publishInstagram({
      urls: ['https://contenido.example.com/media/a.png'], caption: '', altText: '', config,
    }), /JPEG/);
  });
});

describe('programación diaria', () => {
  test('calcula la hora de Santiago', () => {
    assert.deepEqual(localDateTime(new Date('2026-09-15T00:00:00Z'), 'America/Santiago'), {
      date: '2026-09-14', time: '21:00',
    });
  });

  test('corre después de la hora solo una vez por fecha local', () => {
    const now = new Date('2026-09-15T00:00:00Z');
    assert.equal(shouldPublishNow({ now, publishTime: '20:30', timeZone: 'America/Santiago' }), true);
    assert.equal(shouldPublishNow({ now, publishTime: '20:30', timeZone: 'America/Santiago', lastSuccessDate: '2026-09-14' }), false);
  });

  test('valida el formato de la hora configurada', () => {
    assert.equal(validPublishTime('20:30'), true);
    assert.equal(validPublishTime('25:00'), false);
    assert.equal(validPublishTime('8:30'), false);
  });

  test('recupera del CSV la última publicación después de reiniciar', () => {
    const file = join(tmpdir(), `agendamelo-meta-${process.pid}-${Date.now()}.csv`);
    writeFileSync(file, 'id,meta_published_at\nA,2026-09-13T23:00:00.000Z\nB,2026-09-15T00:00:00.000Z\n');
    try { assert.equal(latestMetaPublishedAt(file), '2026-09-15T00:00:00.000Z'); }
    finally { unlinkSync(file); }
  });
});

test('el caption empuja Perfil Gratis sin flechas de TikTok', () => {
  const caption = buildMetaCaption({
    orientacion: 'venta', descripcion: 'Ordena tus reservas.', hashtags: '#agendamelo #manicurechile',
  });
  assert.match(caption, /Perfil Gratis/);
  assert.doesNotMatch(caption, /👇/);
});
