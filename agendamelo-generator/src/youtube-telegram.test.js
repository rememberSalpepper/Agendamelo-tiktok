import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickShortPreview } from './youtube-telegram.js';

const rows = [
  { id: 'PENDIENTE', youtube_status: 'pendiente' },
  { id: 'LISTO-1', youtube_status: 'renderizado' },
  { id: 'LISTO-2', youtube_status: 'renderizado' },
];

test('elige solo Shorts renderizados para Telegram', () => {
  assert.equal(pickShortPreview(rows).id, 'LISTO-1');
  assert.equal(pickShortPreview(rows, 'LISTO-2').id, 'LISTO-2');
  assert.equal(pickShortPreview(rows, 'PENDIENTE'), undefined);
});
