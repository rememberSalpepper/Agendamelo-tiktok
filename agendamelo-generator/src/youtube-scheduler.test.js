import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { dueYoutubePublishSlot, runYoutubePublicationCycle } from './youtube-scheduler.js';

const ready = {
  id: 'SHORT-READY', youtube_status: 'renderizado', youtube_video_path: 'dist/short.mp4',
  youtube_video_id: '',
};
const pending = {
  id: 'SHORT-PENDING', youtube_status: 'pendiente', youtube_video_path: '', youtube_video_id: '',
};

describe('programador de YouTube Shorts', () => {
  test('bloquea una segunda publicación en la misma fecha local', () => {
    assert.equal(dueYoutubePublishSlot({
      now: new Date('2026-09-16T23:30:00.000Z'),
      publishTime: '20:30',
      timeZone: 'America/Santiago',
      lastSuccessDate: '2026-09-16',
    }), '');
    assert.equal(dueYoutubePublishSlot({
      now: new Date('2026-09-17T23:30:00.000Z'),
      publishTime: '20:30',
      timeZone: 'America/Santiago',
      lastSuccessDate: '2026-09-16',
    }), '2026-09-17|20:30');
  });

  test('publica un Short ya renderizado sin volver a renderizar', async () => {
    let renders = 0;
    let publishes = 0;
    const result = await runYoutubePublicationCycle({
      config: { kitsCsv: 'kits.csv' },
      readRows: () => [ready],
      renderQueue: async () => { renders++; return []; },
      publish: async () => {
        publishes++;
        return { id: ready.id, videoId: 'yt-1', privacyStatus: 'private' };
      },
    });
    assert.equal(renders, 0);
    assert.equal(publishes, 1);
    assert.equal(result.generatedNow, false);
    assert.equal(result.renderedNow, false);
  });

  test('renderiza como máximo un kit pendiente antes de publicarlo', async () => {
    let rows = [pending];
    const renderedIds = [];
    const result = await runYoutubePublicationCycle({
      config: { kitsCsv: 'kits.csv' },
      readRows: () => rows,
      renderQueue: async ({ id }) => {
        renderedIds.push(id);
        rows = [{ ...pending, youtube_status: 'renderizado', youtube_video_path: 'dist/short.mp4' }];
        return [{ id }];
      },
      publish: async () => ({ id: pending.id, videoId: 'yt-2', privacyStatus: 'private' }),
    });
    assert.deepEqual(renderedIds, [pending.id]);
    assert.equal(result.generatedNow, false);
    assert.equal(result.renderedNow, true);
  });

  test('genera un kit cuando la cola está vacía, luego lo renderiza y publica', async () => {
    let rows = [];
    const calls = [];
    const result = await runYoutubePublicationCycle({
      config: { kitsCsv: 'kits.csv' },
      generateNiche: 'manicuristas',
      readRows: () => rows,
      generate: async ({ niche }) => {
        calls.push(`generate:${niche}`);
        rows = [pending];
      },
      renderQueue: async ({ id }) => {
        calls.push(`render:${id}`);
        rows = [{ ...pending, youtube_status: 'renderizado', youtube_video_path: 'dist/short.mp4' }];
        return [{ id }];
      },
      publish: async () => {
        calls.push('publish');
        return { id: pending.id, videoId: 'yt-3', privacyStatus: 'public' };
      },
    });
    assert.deepEqual(calls, ['generate:manicuristas', 'render:SHORT-PENDING', 'publish']);
    assert.equal(result.generatedNow, true);
    assert.equal(result.renderedNow, true);
  });

  test('no hace nada sin cola cuando la generación automática está desactivada', async () => {
    let publishes = 0;
    const result = await runYoutubePublicationCycle({
      config: { kitsCsv: 'kits.csv' },
      autoGenerate: false,
      readRows: () => [],
      publish: async () => { publishes++; return null; },
    });
    assert.equal(result, null);
    assert.equal(publishes, 0);
  });
});
