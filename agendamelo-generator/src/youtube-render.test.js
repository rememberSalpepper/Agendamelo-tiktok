import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import ffmpegStatic from 'ffmpeg-static';
import {
  buildShortFfmpegArgs, buildShortScenes, isShortRenderCandidate, renderShortHtml, renderShortQueue,
  renderShortVideo,
} from './youtube-render.js';

function row(extra = {}) {
  return {
    id: 'AGENDA-KIT-001', estado: 'pendiente', niche: 'manicuristas', tanda: '1', angulo: 'tiempo',
    tema: 'agenda-whatsapp', keyword: 'agenda para manicuristas',
    hook: 'Tu *agenda para manicuristas* vive en WhatsApp.',
    scenes_json: JSON.stringify(['Cada semana cuadras las horas de cero.', 'Tu información merece orden.']),
    cta: 'Crea tu Perfil Gratis, sin tarjeta -> agendamelo.cl',
    caption_seo: 'Agenda para manicuristas en Chile 💅 ordena tus horas sin WhatsApp',
    hashtags: '#manicurista #unaschile #semipermanente',
    image_prompts_json: JSON.stringify(['primer plano de uñas semipermanentes recién hechas']),
    fecha_creacion: '2026-09-16', fecha_entregado: '', youtube_video_path: '', youtube_video_id: '',
    youtube_status: 'pendiente', youtube_published_at: '', youtube_error: '', ...extra,
  };
}

describe('render de YouTube Shorts', () => {
  test('conserva exactamente hook, escenas y CTA', () => {
    const source = row();
    const scenes = buildShortScenes(source);
    assert.deepEqual(scenes.map((scene) => scene.text), [
      source.hook, ...JSON.parse(source.scenes_json), source.cta,
    ]);
    assert.equal(scenes.length, 4);
  });

  test('produce HTML vertical con marca, safe area y texto escapado', () => {
    const source = row({ hook: 'Agenda <script>alert(1)</script> *segura*' });
    const [scene] = buildShortScenes(source);
    const html = renderShortHtml(scene, { row: source, index: 0, total: 4 });
    assert.match(html, /width:1080px; height:1920px/);
    assert.match(html, /Agendamelo/);
    assert.match(html, /inset:104px 142px 238px 82px/);
    assert.match(html, /Agenda &lt;script&gt;alert\(1\)&lt;\/script&gt;/);
    assert.doesNotMatch(html, /<script>alert\(1\)<\/script>/);
  });

  test('solo toma filas pendientes sin video remoto', () => {
    assert.equal(isShortRenderCandidate(row()), true);
    assert.equal(isShortRenderCandidate(row({ youtube_status: 'renderizado' })), false);
    assert.equal(isShortRenderCandidate(row({ youtube_video_id: 'video-1' })), false);
  });

  test('genera escenas estáticas y una mezcla musical con ducking y efectos procedurales', () => {
    const { args, duration, audioTiming } = buildShortFfmpegArgs(
      ['01.png', '02.png', '03.png', '04.png'],
      'salida.mp4',
      {
        sceneSeconds: 3.4,
        transitionSeconds: 0,
        musicFile: 'musica.mp3',
        musicVolume: 0.22,
      },
    );
    const filters = args[args.indexOf('-filter_complex') + 1];
    assert.equal(duration, 13.6);
    assert.doesNotMatch(filters, /zoompan=/);
    assert.doesNotMatch(filters, /xfade=/);
    assert.match(filters, /concat=n=4:v=1:a=0/);
    assert.match(filters, /volume='0\.220\*if\(between\(t,0\.000,0\.720\),0\.500/);
    assert.match(filters, /\[intro_sfx\]/);
    assert.match(filters, /\[intro_impact\]/);
    assert.match(filters, /\[intro_air\]/);
    assert.match(filters, /\[intro_octave\]/);
    assert.match(filters, /volume=0\.720,adelay=25\|25\[intro_sfx\]/);
    assert.match(filters, /\[transition_sfx_1\]/);
    assert.match(filters, /\[transition_sfx_2\]/);
    assert.match(filters, /\[transition_sfx_3\]/);
    assert.match(filters, /\[outro_sfx\]/);
    assert.match(filters, /\[outro_octave\]/);
    assert.match(filters, /loudnorm=I=-16\.0:TP=-1\.5:LRA=7/);
    assert.deepEqual(audioTiming.transitionMidpoints, [3.4, 6.8, 10.2]);
    assert.equal(audioTiming.outroAt, 10.24);
    assert.deepEqual(args.slice(0, 8), [
      '-y', '-loglevel', 'error', '-loop', '1', '-framerate', '30', '-t',
    ]);
    assert.ok(args.includes('musica.mp3'));
  });

  test('hace un velo crema con pausa y desplazamiento eased sin superponer escenas', () => {
    const { args, duration, audioTiming } = buildShortFfmpegArgs(
      ['01.png', '02.png'],
      'salida.mp4',
      { sceneSeconds: 3.4, transitionSeconds: 0.25 },
    );
    const filters = args[args.indexOf('-filter_complex') + 1];
    assert.equal(duration, 6.8);
    assert.match(filters, /pad=1116:1920:18:0:color=0xfbf8f0/);
    assert.match(filters, /crop=1080:1920:x='/);
    assert.match(filters, /cos\(PI\*clip/);
    assert.match(filters, /fade=t=out:st=3\.275:d=0\.115:color=0xfbf8f0/);
    assert.match(filters, /fade=t=in:st=0\.010:d=0\.115:color=0xfbf8f0/);
    assert.doesNotMatch(filters, /xfade=/);
    assert.doesNotMatch(filters, /zoompan=/);
    assert.deepEqual(audioTiming.transitionMidpoints, [3.4]);
    assert.equal(audioTiming.visualFadeSeconds, 0.115);
    assert.equal(audioTiming.creamHoldSeconds, 0.02);
    assert.match(filters, /adelay=3300\|3300\[transition_sfx_1\]/);
  });

  test('permite desactivar todos los efectos sin quitar normalización ni música', () => {
    const { args } = buildShortFfmpegArgs(['01.png', '02.png'], 'salida.mp4', {
      sceneSeconds: 3.4,
      transitionSeconds: 0.24,
      musicFile: 'musica.mp3',
      sfxEnabled: false,
    });
    const filters = args[args.indexOf('-filter_complex') + 1];
    assert.doesNotMatch(filters, /intro_sfx|transition_sfx|outro_sfx/);
    assert.match(filters, /\[music\]amix=inputs=1/);
    assert.match(filters, /loudnorm=I=-16\.0:TP=-1\.5/);
  });

  test('exige licencia y atribución cuando corresponda', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'agendamelo-short-license-'));
    const musicFile = join(dir, 'musica.mp3');
    writeFileSync(musicFile, 'audio-simulado');
    await assert.rejects(
      renderShortVideo(row(), join(dir, 'sin-licencia.mp4'), { musicFile, musicLicense: '' }),
      /YOUTUBE_MUSIC_LICENSE es obligatorio/,
    );
    await assert.rejects(
      renderShortVideo(row(), join(dir, 'sin-atribucion.mp4'), {
        musicFile, musicLicense: 'Creative Commons CC BY', musicAttribution: '',
      }),
      /YOUTUBE_MUSIC_ATTRIBUTION es obligatorio/,
    );
  });

  test('actualiza ruta y estado solo después de crear el MP4', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'agendamelo-short-queue-'));
    const file = join(dir, 'kits.csv');
    writeFileSync(file, stringify([row()], { header: true }));
    const renderImpl = async (source, outPath) => {
      mkdirSync(dirname(outPath), { recursive: true });
      writeFileSync(outPath, 'mp4-simulado');
      return {
        outPath,
        durationSeconds: 12.85,
        sceneCount: 4,
        music: {
          enabled: true,
          title: 'Pista segura',
          artist: 'Artista',
          license: 'YouTube Audio Library',
          attribution: 'Music: Pista segura — Artista',
        },
      };
    };
    const result = await renderShortQueue({ file, renderImpl });
    assert.equal(result.length, 1);
    const [saved] = parse(readFileSync(file), { columns: true, skip_empty_lines: true });
    assert.equal(saved.youtube_status, 'renderizado');
    assert.match(saved.youtube_video_path, /^dist\/shorts\/AGENDA-KIT-001\.mp4$/);
    assert.equal(saved.youtube_video_id, '');
    assert.equal(saved.youtube_music_title, 'Pista segura');
    assert.equal(saved.youtube_music_artist, 'Artista');
    assert.equal(saved.youtube_music_license, 'YouTube Audio Library');
    assert.equal(saved.youtube_music_attribution, 'Music: Pista segura — Artista');
  });

  test('codifica un MP4 real H.264/AAC 1080x1920 a 30 fps con la cadena portable', () => {
    const dir = mkdtempSync(join(tmpdir(), 'agendamelo-short-smoke-'));
    try {
      const pixel = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
        'base64',
      );
      const first = join(dir, '01.png');
      const second = join(dir, '02.png');
      const musicFile = join(dir, 'music.wav');
      const outPath = join(dir, 'smoke.mp4');
      writeFileSync(first, pixel);
      writeFileSync(second, pixel);
      const musicResult = spawnSync(ffmpegStatic, [
        '-y', '-loglevel', 'error', '-f', 'lavfi', '-i',
        'sine=frequency=180:sample_rate=48000:duration=1.2', '-ac', '2', musicFile,
      ], { encoding: 'utf8' });
      assert.equal(musicResult.status, 0, musicResult.stderr);
      const { args, duration } = buildShortFfmpegArgs([first, second], outPath, {
        sceneSeconds: 0.6,
        transitionSeconds: 0.24,
        musicFile,
        introSfxSeconds: 0.4,
        transitionSfxSeconds: 0.2,
        outroSfxSeconds: 0.4,
      });
      const encodeResult = spawnSync(ffmpegStatic, args, {
        encoding: 'utf8', maxBuffer: 4 * 1024 * 1024,
      });
      assert.equal(encodeResult.status, 0, encodeResult.stderr);
      assert.equal(duration, 1.2);
      assert.ok(existsSync(outPath));
      assert.ok(statSync(outPath).size > 10_000);

      const probe = spawnSync(ffmpegStatic, [
        '-hide_banner', '-i', outPath, '-f', 'null', '-',
      ], { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
      assert.equal(probe.status, 0, probe.stderr);
      assert.match(probe.stderr, /Video: h264 \(High\).*1080x1920.*30 fps/);
      assert.match(probe.stderr, /Audio: aac \(LC\).*48000 Hz, stereo/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('mantiene una ruta FFmpeg portable para el VPS Linux', () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const dockerfile = readFileSync(join(here, '..', '..', 'Dockerfile'), 'utf8');
    assert.match(dockerfile, /apt-get install[\s\S]*ffmpeg/);
    assert.match(dockerfile, /ENV FFMPEG_PATH=\/usr\/bin\/ffmpeg/);
    assert.ok(ffmpegStatic);
  });
});
