import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { runYoutubePublicationCycle } from './youtube-scheduler.js';

const ready = {
  id: 'SHORT-READY', youtube_status: 'renderizado', youtube_video_path: 'dist/short.mp4',
  youtube_video_id: '',
};
const pending = {
  id: 'SHORT-PENDING', youtube_status: 'pendiente', youtube_video_path: '', youtube_video_id: '',
};

describe('programador de YouTube Shorts', () => {
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
    assert.equal(result.renderedNow, true);
  });

  test('no hace nada cuando no existe cola', async () => {
    let publishes = 0;
    const result = await runYoutubePublicationCycle({
      config: { kitsCsv: 'kits.csv' },
      readRows: () => [],
      publish: async () => { publishes++; return null; },
    });
    assert.equal(result, null);
    assert.equal(publishes, 0);
  });
});
