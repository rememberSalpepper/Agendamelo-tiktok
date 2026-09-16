// Render determinista de kits a Shorts verticales: HTML/Playwright -> PNG -> MP4 H.264/AAC.
// El copy proviene literalmente del CSV. Las escenas temporales se eliminan; el MP4, poster y
// manifiesto quedan en dist/shorts para revisión antes de cualquier carga a YouTube.

import './env.js';
import { chromium } from 'playwright';
import ffmpegStatic from 'ffmpeg-static';
import { spawn } from 'node:child_process';
import {
  copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { fontFace, hookToHeadline, logomarkSvg } from './brand.js';
import { getNiche } from './niches.js';
import { esc } from './templates.js';
import { kitFromRow, validateKit } from './kit-validate.js';
import { YOUTUBE_COLUMNS } from './youtube.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_CSV = join(ROOT, '..', 'agendamelo_kits.csv');
const WIDTH = 1080;
const HEIGHT = 1920;
const DEFAULT_SCENE_SECONDS = 3.4;
const DEFAULT_TRANSITION_SECONDS = 0.22;
const DEFAULT_TRANSITION_HOLD_SECONDS = 0.02;
const DEFAULT_TRANSITION_SHIFT_PIXELS = 18;
const DEFAULT_INTRO_SFX_SECONDS = 0.62;
const DEFAULT_TRANSITION_SFX_SECONDS = 0.2;
const DEFAULT_OUTRO_SFX_SECONDS = 0.72;
const DEFAULT_DUCKING_LEVEL = 0.65;
const DEFAULT_INTRO_DUCKING_LEVEL = 0.5;
const DEFAULT_LOUDNESS_TARGET = -16;
const DEFAULT_TRUE_PEAK = -1.5;

function safeId(value) {
  return String(value || 'short').replace(/[^a-zA-Z0-9_-]+/g, '-');
}

function numberOption(value, fallback) {
  return value === undefined || value === null || value === '' ? fallback : Number(value);
}

function booleanOption(value, fallback = true) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  return !['0', 'false', 'no', 'off'].includes(String(value).trim().toLowerCase());
}

function assertRange(value, name, minimum, maximum) {
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new Error(`${name} debe estar entre ${minimum} y ${maximum}.`);
  }
}

export function validateTransitionTiming(transitionSeconds, transitionHoldSeconds) {
  const visualFadeSeconds = (transitionSeconds - transitionHoldSeconds) / 2;
  if (transitionSeconds > 0 && visualFadeSeconds + Number.EPSILON < 0.08) {
    throw new Error('YOUTUBE_TRANSITION_HOLD_SECONDS deja menos de 0.08 s para cada fundido.');
  }
  return visualFadeSeconds;
}

function seconds(value) {
  return Number(value).toFixed(3);
}

function roundedSeconds(value) {
  return Number(seconds(value));
}

export function buildShortScenes(row) {
  const kit = kitFromRow(row);
  return [
    { role: 'hook', label: 'DETÉN EL SCROLL', text: kit.hookText },
    ...kit.scenes.map((text, index) => ({
      role: 'scene', label: `IDEA ${index + 1}`, text,
    })),
    { role: 'cta', label: 'TU PRÓXIMO PASO', text: kit.ctaText },
  ];
}

function textSize(text, role) {
  const length = String(text || '').replace(/\*/g, '').length;
  const base = role === 'hook' ? 102 : role === 'cta' ? 92 : 82;
  if (length > 130) return Math.min(base, 60);
  if (length > 100) return Math.min(base, 66);
  if (length > 72) return Math.min(base, 74);
  return base;
}

export function renderShortHtml(scene, { row, index, total }) {
  const niche = getNiche(row.niche);
  const bg = (index % 4) + 1;
  const title = hookToHeadline(scene.text || '').replace(/-&gt;/g, '<span class="nowrap">-&gt;</span>');
  const size = textSize(scene.text, scene.role);
  const progress = Array.from({ length: total }, (_, i) => (
    `<span class="progress-segment${i === index ? ' active' : ''}"></span>`
  )).join('');
  const sceneNumber = String(index + 1).padStart(2, '0');
  const keyword = esc(row.keyword || niche.label || row.niche || 'Agendamelo');
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><style>
    ${fontFace}
    :root { --accent:${niche.accent}; --accent2:${niche.accent2}; --soft:${niche.soft};
      --ink:#171717; --cream:#fbf8f0; --orange:#ea580c; }
    * { box-sizing:border-box; margin:0; padding:0; }
    html,body { width:${WIDTH}px; height:${HEIGHT}px; overflow:hidden; }
    body { font-family:'DM Sans','Noto Sans',sans-serif; color:var(--ink); }
    .short { width:${WIDTH}px; height:${HEIGHT}px; position:relative; overflow:hidden;
      background:linear-gradient(155deg,#fffdf7 0%,#f5f0e5 58%,var(--soft) 100%); }
    .wash { position:absolute; inset:0; background:
      radial-gradient(800px 700px at ${bg % 2 ? '92% 8%' : '8% 12%'},var(--soft),transparent 68%),
      radial-gradient(760px 760px at ${bg < 3 ? '4% 96%' : '96% 92%'},#fde5cf,transparent 64%); }
    .orb { position:absolute; border-radius:999px; filter:blur(1px); opacity:.14; }
    .orb.a { width:520px;height:520px;right:-230px;top:-170px;background:var(--accent); }
    .orb.b { width:430px;height:430px;left:-230px;bottom:120px;background:var(--orange); }
    .grid { position:absolute; inset:0; opacity:.07; background-image:
      radial-gradient(var(--accent) 2px,transparent 2px); background-size:34px 34px;
      mask-image:linear-gradient(to bottom,transparent 0%,black 28%,black 75%,transparent 100%); }
    .ghost { position:absolute; right:110px; top:450px; font:800 390px/.8 'Bricolage Grotesque';
      color:var(--accent); opacity:.045; letter-spacing:-30px; }
    .safe { position:absolute; inset:104px 142px 238px 82px; display:flex; flex-direction:column; z-index:2; }
    .brand { display:flex; align-items:center; gap:18px; }
    .brand svg { width:68px; height:68px; filter:drop-shadow(0 10px 18px rgba(234,88,12,.18)); }
    .wordmark { font:800 42px/.95 'Bricolage Grotesque'; letter-spacing:-1.5px; }
    .tagline { display:block; margin-top:5px; color:#6b665e; font-size:14px; font-weight:800;
      letter-spacing:4px; text-transform:uppercase; }
    .pill { align-self:flex-start; margin-top:78px; padding:13px 24px; border-radius:999px;
      background:var(--soft); border:2px solid var(--accent); box-shadow:6px 6px 0 var(--accent);
      font:800 20px/1 'DM Sans'; letter-spacing:2px; }
    .copy-wrap { flex:1; display:flex; flex-direction:column; justify-content:center; padding-bottom:42px; }
    .copy { font:800 ${size}px/.98 'Bricolage Grotesque'; letter-spacing:-3px; max-width:820px;
      text-wrap:balance; }
    .nowrap { white-space:nowrap; }
    .copy .hl { color:var(--accent); -webkit-text-fill-color:var(--accent); }
    .rule { width:138px; height:12px; border-radius:99px; background:linear-gradient(90deg,var(--accent),var(--accent2));
      margin-top:42px; box-shadow:0 9px 24px color-mix(in srgb,var(--accent) 30%,transparent); }
    .keyword { margin-top:30px; font-size:25px; line-height:1.28; font-weight:650; color:#5d5952; }
    .cta .copy-wrap { background:var(--ink); margin:62px -28px 42px -32px; padding:74px 54px;
      border-radius:44px; box-shadow:18px 18px 0 var(--accent); flex:0 1 auto; }
    .cta .copy { color:white; font-size:${Math.min(size, 86)}px; }
    .cta .keyword { color:#ddd7ca; }
    .footer { display:flex; flex-direction:column; gap:22px; }
    .domain { display:flex; align-items:center; justify-content:space-between; gap:20px;
      font:800 27px/1 'Bricolage Grotesque'; color:#3e3b36; }
    .counter { color:var(--accent); letter-spacing:1px; }
    .progress { height:10px; display:flex; gap:10px; }
    .progress-segment { flex:1; border-radius:99px; background:#ded8cc; }
    .progress-segment.active { background:linear-gradient(90deg,var(--accent),var(--accent2)); }
  </style></head><body><main class="short ${scene.role}">
    <div class="wash"></div><div class="orb a"></div><div class="orb b"></div><div class="grid"></div>
    <div class="ghost">${sceneNumber}</div>
    <section class="safe">
      <header class="brand"><span>${logomarkSvg}</span><span><b class="wordmark">Agendamelo</b>
        <small class="tagline">Tu sitio + agenda</small></span></header>
      <div class="pill">${esc(scene.label)}</div>
      <div class="copy-wrap"><h1 class="copy">${title}</h1><div class="rule"></div>
        <p class="keyword">${keyword}</p></div>
      <footer class="footer"><div class="domain"><span>agendamelo.cl</span><span class="counter">${sceneNumber}/${String(total).padStart(2, '0')}</span></div>
        <div class="progress">${progress}</div></footer>
    </section>
  </main></body></html>`;
}

async function renderFrames(row, directory, browser) {
  const scenes = buildShortScenes(row);
  const paths = [];
  for (let index = 0; index < scenes.length; index++) {
    const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 });
    const path = join(directory, `scene-${String(index + 1).padStart(2, '0')}.png`);
    try {
      await page.setContent(renderShortHtml(scenes[index], { row, index, total: scenes.length }), {
        waitUntil: 'networkidle',
      });
      await page.evaluate(() => document.fonts.ready.then(() => true));
      await page.locator('.short').screenshot({ path, type: 'png' });
      paths.push(path);
    } finally { await page.close(); }
  }
  return { scenes, paths };
}

function runFfmpeg(binary, args) {
  return new Promise((resolvePromise, reject) => {
    const process = spawn(binary, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    process.stderr.on('data', (chunk) => { stderr = `${stderr}${chunk}`.slice(-8000); });
    process.on('error', reject);
    process.on('close', (code) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`FFmpeg terminó con código ${code}: ${stderr.trim().slice(-1200)}`));
    });
  });
}

export function buildShortFfmpegArgs(paths, outPath, {
  sceneSeconds = DEFAULT_SCENE_SECONDS,
  transitionSeconds = DEFAULT_TRANSITION_SECONDS,
  transitionHoldSeconds = DEFAULT_TRANSITION_HOLD_SECONDS,
  transitionShiftPixels = DEFAULT_TRANSITION_SHIFT_PIXELS,
  musicFile = '',
  musicVolume = 0.22,
  sfxEnabled = true,
  introSfxSeconds = DEFAULT_INTRO_SFX_SECONDS,
  introSfxVolume = 0.72,
  transitionSfxSeconds = DEFAULT_TRANSITION_SFX_SECONDS,
  transitionSfxVolume = 0.055,
  outroSfxSeconds = DEFAULT_OUTRO_SFX_SECONDS,
  outroSfxVolume = 0.17,
  duckingLevel = DEFAULT_DUCKING_LEVEL,
  introDuckingLevel = DEFAULT_INTRO_DUCKING_LEVEL,
  loudnessTarget = DEFAULT_LOUDNESS_TARGET,
  truePeak = DEFAULT_TRUE_PEAK,
}) {
  if (!paths.length) throw new Error('No hay escenas para codificar.');
  const duration = paths.length * sceneSeconds;
  const args = ['-y', '-loglevel', 'error'];
  for (const path of paths) {
    args.push('-loop', '1', '-framerate', '30', '-t', sceneSeconds.toFixed(3), '-i', path);
  }
  const audioIndex = paths.length;
  if (musicFile) args.push('-stream_loop', '-1', '-i', musicFile);
  else args.push('-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000');

  const creamHoldSeconds = transitionSeconds > 0 ? transitionHoldSeconds : 0;
  const visualFadeSeconds = transitionSeconds > 0
    ? (transitionSeconds - creamHoldSeconds) / 2
    : 0;
  const fadeInStart = creamHoldSeconds / 2;
  const fadeOutStart = sceneSeconds - fadeInStart - visualFadeSeconds;
  const filters = paths.map((_, index) => {
    const steps = [
      `scale=${WIDTH}:${HEIGHT}:flags=lanczos`,
      'fps=30',
      `trim=duration=${sceneSeconds.toFixed(3)}`,
      'setpts=PTS-STARTPTS',
      'setsar=1',
      'format=yuv420p',
    ];
    if (transitionSeconds > 0 && transitionShiftPixels > 0) {
      const shift = transitionShiftPixels;
      const easeIn = `${shift}*(0.5-0.5*cos(PI*clip((t-${seconds(fadeInStart)})/${seconds(visualFadeSeconds)},0,1)))`;
      const easeOut = `${shift}+${shift}*(0.5-0.5*cos(PI*clip((t-${seconds(fadeOutStart)})/${seconds(visualFadeSeconds)},0,1)))`;
      const cropX = index === 0
        ? `if(lt(t,${seconds(fadeOutStart)}),${shift},${easeOut})`
        : index === paths.length - 1
          ? easeIn
          : `if(lt(t,${seconds(fadeOutStart)}),${easeIn},${easeOut})`;
      steps.push(
        `pad=${WIDTH + (shift * 2)}:${HEIGHT}:${shift}:0:color=0xfbf8f0`,
        `crop=${WIDTH}:${HEIGHT}:x='${cropX}':y=0`,
      );
    }
    if (transitionSeconds > 0 && index > 0) {
      steps.push(
        `fade=t=in:st=${seconds(fadeInStart)}:d=${seconds(visualFadeSeconds)}:color=0xfbf8f0`,
      );
    }
    if (transitionSeconds > 0 && index < paths.length - 1) {
      steps.push(
        `fade=t=out:st=${seconds(fadeOutStart)}:`
        + `d=${seconds(visualFadeSeconds)}:color=0xfbf8f0`,
      );
    }
    return `[${index}:v]${steps.join(',')}[v${index}]`;
  });
  let videoLabel = 'v0';
  if (paths.length > 1) {
    filters.push(`${paths.map((_, index) => `[v${index}]`).join('')}concat=n=${paths.length}:v=1:a=0[vjoined]`);
    videoLabel = 'vjoined';
  }
  filters.push(`[${videoLabel}]format=yuv420p[vout]`);

  const fadeOutAt = Math.max(0, duration - 0.8);
  const transitionMidpoints = paths.slice(1).map(
    (_, index) => roundedSeconds((index + 1) * sceneSeconds),
  );
  const introDuckEnd = Math.min(duration, introSfxSeconds + 0.1);
  const duckRegions = [{
    type: 'intro', start: 0, end: roundedSeconds(introDuckEnd), multiplier: introDuckingLevel,
  }, ...transitionMidpoints.map((midpoint, index) => {
    const start = Math.max(0, midpoint - (transitionSeconds / 2) - 0.04);
    const regularEnd = midpoint + (transitionSeconds / 2) + 0.1;
    const outroEnd = index === transitionMidpoints.length - 1
      ? midpoint + 0.04 + outroSfxSeconds + 0.08
      : regularEnd;
    return {
      type: index === transitionMidpoints.length - 1 ? 'transition-and-outro' : 'transition',
      start: roundedSeconds(start),
      end: roundedSeconds(Math.min(duration, Math.max(regularEnd, outroEnd))),
      multiplier: duckingLevel,
    };
  })];
  const duckWindows = duckRegions.map(({ start, end }) => [start, end]);
  const duckExpression = duckRegions.reduceRight(
    (otherwise, { start, end, multiplier }) => (
      `if(between(t,${seconds(start)},${seconds(end)}),${multiplier.toFixed(3)},${otherwise})`
    ),
    '1',
  );
  filters.push(
    `[${audioIndex}:a]atrim=duration=${seconds(duration)},asetpts=PTS-STARTPTS,`
    + 'aformat=sample_rates=48000:channel_layouts=stereo,'
    + `volume='${musicVolume.toFixed(3)}*${duckExpression}':eval=frame,`
    + 'afade=t=in:st=0:d=0.6,'
    + `afade=t=out:st=${seconds(fadeOutAt)}:d=0.8[music]`,
  );

  const mixInputs = ['[music]'];
  if (sfxEnabled) {
    const introFadeOutAt = Math.max(0.08, introSfxSeconds * 0.18);
    const introFadeOutSeconds = Math.max(0.05, introSfxSeconds - introFadeOutAt);
    const introFifthSeconds = Math.max(0.2, introSfxSeconds - 0.045);
    const introOctaveSeconds = Math.max(0.2, introSfxSeconds - 0.085);
    filters.push(
      'sine=frequency=146.83:sample_rate=48000:duration=0.220,'
      + 'volume=1.50,lowpass=f=420,afade=t=in:st=0:d=0.008,'
      + 'afade=t=out:st=0.018:d=0.202[intro_impact]',
      `sine=frequency=293.66:sample_rate=48000:duration=${seconds(introSfxSeconds)},`
      + `volume=0.72,afade=t=in:st=0:d=0.030,afade=t=out:st=${seconds(introFadeOutAt)}:d=${seconds(introFadeOutSeconds)}[intro_root]`,
      `sine=frequency=440:sample_rate=48000:duration=${seconds(introFifthSeconds)},`
      + `volume=0.48,afade=t=in:st=0:d=0.040,afade=t=out:st=${seconds(introFadeOutAt)}:d=${seconds(Math.max(0.05, introFifthSeconds - introFadeOutAt))},`
      + 'adelay=45[intro_fifth]',
      `sine=frequency=587.33:sample_rate=48000:duration=${seconds(introOctaveSeconds)},`
      + `volume=0.24,afade=t=in:st=0:d=0.050,afade=t=out:st=${seconds(introFadeOutAt)}:d=${seconds(Math.max(0.05, introOctaveSeconds - introFadeOutAt))},`
      + 'adelay=85[intro_octave]',
      '[intro_impact][intro_root][intro_fifth][intro_octave]amix=inputs=4:duration=longest:normalize=0,'
      + 'lowpass=f=3200,aecho=0.75:0.42:38|82:0.14|0.05,'
      + `atrim=duration=${seconds(introSfxSeconds)},pan=stereo|c0=c0|c1=c0,`
      + 'adelay=0|12[intro_tone]',
      `anoisesrc=color=pink:amplitude=0.16:sample_rate=48000:duration=${seconds(introSfxSeconds)}:seed=3301,`
      + 'highpass=f=1800,lowpass=f=6500,afade=t=in:st=0:d=0.120,'
      + `afade=t=out:st=${seconds(introSfxSeconds * 0.38)}:d=${seconds(introSfxSeconds * 0.62)},`
      + 'volume=0.14,pan=stereo|c0=0.85*c0|c1=c0,adelay=10|0[intro_air]',
      '[intro_tone][intro_air]amix=inputs=2:duration=longest:normalize=0,'
      + `volume=${introSfxVolume.toFixed(3)},adelay=25|25[intro_sfx]`,
    );
    mixInputs.push('[intro_sfx]');

    transitionMidpoints.forEach((midpoint, index) => {
      const delayMs = Math.max(0, Math.round((midpoint - transitionSfxSeconds / 2) * 1000));
      const fadeIn = transitionSfxSeconds * 0.46;
      const fadeOut = transitionSfxSeconds - fadeIn;
      const highpass = 780 + (index * 95);
      const lowpass = 4700 + ((index % 2) * 450);
      const variation = [1, 0.92, 1.04, 0.96][index % 4];
      const volume = transitionSfxVolume * variation;
      const label = `transition_sfx_${index + 1}`;
      filters.push(
        `anoisesrc=color=pink:amplitude=0.22:sample_rate=48000:duration=${seconds(transitionSfxSeconds)}:seed=${4101 + index},`
        + `highpass=f=${highpass},lowpass=f=${lowpass},`
        + `afade=t=in:st=0:d=${seconds(fadeIn)},`
        + `afade=t=out:st=${seconds(fadeIn)}:d=${seconds(fadeOut)},`
        + `pan=stereo|c0=c0|c1=c0,volume=${volume.toFixed(4)},`
        + `adelay=${delayMs}|${delayMs}[${label}]`,
      );
      mixInputs.push(`[${label}]`);
    });

    const ctaMidpoint = transitionMidpoints.at(-1) ?? Math.max(0, duration - sceneSeconds);
    const outroDelayMs = Math.max(0, Math.round((ctaMidpoint + 0.04) * 1000));
    const outroFadeOutAt = Math.max(0.1, outroSfxSeconds * 0.16);
    const outroFadeOutSeconds = Math.max(0.05, outroSfxSeconds - outroFadeOutAt);
    const outroFifthSeconds = Math.max(0.2, outroSfxSeconds - 0.04);
    const outroOctaveSeconds = Math.max(0.2, outroSfxSeconds - 0.09);
    filters.push(
      `sine=frequency=392:sample_rate=48000:duration=${seconds(outroSfxSeconds)},`
      + `volume=0.72,afade=t=in:st=0:d=0.025,afade=t=out:st=${seconds(outroFadeOutAt)}:d=${seconds(outroFadeOutSeconds)}[outro_root]`,
      `sine=frequency=587.33:sample_rate=48000:duration=${seconds(outroFifthSeconds)},`
      + `volume=0.44,afade=t=in:st=0:d=0.035,afade=t=out:st=${seconds(outroFadeOutAt)}:d=${seconds(Math.max(0.05, outroFifthSeconds - outroFadeOutAt))},adelay=40[outro_fifth]`,
      `sine=frequency=784:sample_rate=48000:duration=${seconds(outroOctaveSeconds)},`
      + `volume=0.18,afade=t=in:st=0:d=0.045,afade=t=out:st=${seconds(outroFadeOutAt)}:d=${seconds(Math.max(0.05, outroOctaveSeconds - outroFadeOutAt))},adelay=90[outro_octave]`,
      '[outro_root][outro_fifth][outro_octave]amix=inputs=3:duration=longest:normalize=0,'
      + 'lowpass=f=3000,aecho=0.75:0.4:45|95:0.13|0.045,'
      + `atrim=duration=${seconds(outroSfxSeconds)},pan=stereo|c0=c0|c1=c0,`
      + `volume=${outroSfxVolume.toFixed(3)},adelay=${outroDelayMs}|${outroDelayMs + 13}[outro_sfx]`,
    );
    mixInputs.push('[outro_sfx]');
  }

  filters.push(
    `${mixInputs.join('')}amix=inputs=${mixInputs.length}:duration=first:normalize=0,`
    + `loudnorm=I=${loudnessTarget.toFixed(1)}:TP=${truePeak.toFixed(1)}:LRA=7:linear=true,`
    + `alimiter=limit=0.92:attack=5:release=50,atrim=duration=${seconds(duration)}[aout]`,
  );

  args.push(
    '-filter_complex', filters.join(';'), '-t', duration.toFixed(3),
    '-map', '[vout]', '-map', '[aout]', '-r', '30',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level:v', '4.1',
    '-preset', 'medium', '-crf', '20',
    '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', '-movflags', '+faststart', '-shortest', outPath,
  );
  return {
    args,
    duration,
    audioTiming: {
      transitionMidpoints,
      visualFadeSeconds: roundedSeconds(visualFadeSeconds),
      creamHoldSeconds: roundedSeconds(creamHoldSeconds),
      duckRegions,
      introAt: 0.025,
      outroAt: roundedSeconds(
        (transitionMidpoints.at(-1) ?? Math.max(0, duration - sceneSeconds)) + 0.04,
      ),
      duckWindows,
    },
  };
}

async function encodeFrames(paths, outPath, options) {
  const { args, duration, audioTiming } = buildShortFfmpegArgs(paths, outPath, options);
  await runFfmpeg(options.ffmpegPath, args);
  return { duration, audioTiming };
}

export async function renderShortVideo(row, outPath, options = {}) {
  const sceneSeconds = numberOption(
    options.sceneSeconds ?? process.env.YOUTUBE_SCENE_SECONDS,
    DEFAULT_SCENE_SECONDS,
  );
  assertRange(sceneSeconds, 'YOUTUBE_SCENE_SECONDS', 2, 6);
  const transitionSeconds = numberOption(
    options.transitionSeconds ?? process.env.YOUTUBE_TRANSITION_SECONDS,
    DEFAULT_TRANSITION_SECONDS,
  );
  if (transitionSeconds !== 0) assertRange(transitionSeconds, 'YOUTUBE_TRANSITION_SECONDS', 0.18, 0.3);
  const transitionHoldSeconds = numberOption(
    options.transitionHoldSeconds ?? process.env.YOUTUBE_TRANSITION_HOLD_SECONDS,
    DEFAULT_TRANSITION_HOLD_SECONDS,
  );
  assertRange(transitionHoldSeconds, 'YOUTUBE_TRANSITION_HOLD_SECONDS', 0, 0.08);
  validateTransitionTiming(transitionSeconds, transitionHoldSeconds);
  const transitionShiftPixels = numberOption(
    options.transitionShiftPixels ?? process.env.YOUTUBE_TRANSITION_SHIFT_PIXELS,
    DEFAULT_TRANSITION_SHIFT_PIXELS,
  );
  assertRange(transitionShiftPixels, 'YOUTUBE_TRANSITION_SHIFT_PIXELS', 0, 24);
  if (!Number.isInteger(transitionShiftPixels)) {
    throw new Error('YOUTUBE_TRANSITION_SHIFT_PIXELS debe ser un entero.');
  }
  const musicFile = String(options.musicFile ?? process.env.YOUTUBE_MUSIC_FILE ?? '').trim();
  const musicVolume = numberOption(options.musicVolume ?? process.env.YOUTUBE_MUSIC_VOLUME, 0.22);
  assertRange(musicVolume, 'YOUTUBE_MUSIC_VOLUME', 0, 1);
  const sfxEnabled = booleanOption(options.sfxEnabled ?? process.env.YOUTUBE_SFX_ENABLED, true);
  const introSfxSeconds = numberOption(
    options.introSfxSeconds ?? process.env.YOUTUBE_INTRO_SFX_SECONDS,
    DEFAULT_INTRO_SFX_SECONDS,
  );
  assertRange(introSfxSeconds, 'YOUTUBE_INTRO_SFX_SECONDS', 0.3, 0.7);
  const introSfxVolume = numberOption(
    options.introSfxVolume ?? process.env.YOUTUBE_INTRO_SFX_VOLUME,
    0.72,
  );
  assertRange(introSfxVolume, 'YOUTUBE_INTRO_SFX_VOLUME', 0, 1);
  const transitionSfxSeconds = numberOption(
    options.transitionSfxSeconds ?? process.env.YOUTUBE_TRANSITION_SFX_SECONDS,
    DEFAULT_TRANSITION_SFX_SECONDS,
  );
  assertRange(transitionSfxSeconds, 'YOUTUBE_TRANSITION_SFX_SECONDS', 0.18, 0.3);
  const transitionSfxVolume = numberOption(
    options.transitionSfxVolume ?? process.env.YOUTUBE_TRANSITION_SFX_VOLUME,
    0.055,
  );
  assertRange(transitionSfxVolume, 'YOUTUBE_TRANSITION_SFX_VOLUME', 0, 1);
  const outroSfxSeconds = numberOption(
    options.outroSfxSeconds ?? process.env.YOUTUBE_OUTRO_SFX_SECONDS,
    DEFAULT_OUTRO_SFX_SECONDS,
  );
  assertRange(outroSfxSeconds, 'YOUTUBE_OUTRO_SFX_SECONDS', 0.4, 0.8);
  const outroSfxVolume = numberOption(
    options.outroSfxVolume ?? process.env.YOUTUBE_OUTRO_SFX_VOLUME,
    0.17,
  );
  assertRange(outroSfxVolume, 'YOUTUBE_OUTRO_SFX_VOLUME', 0, 1);
  const duckingLevel = numberOption(
    options.duckingLevel ?? process.env.YOUTUBE_DUCKING_LEVEL,
    DEFAULT_DUCKING_LEVEL,
  );
  assertRange(duckingLevel, 'YOUTUBE_DUCKING_LEVEL', 0.1, 1);
  const introDuckingLevel = numberOption(
    options.introDuckingLevel ?? process.env.YOUTUBE_INTRO_DUCKING_LEVEL,
    DEFAULT_INTRO_DUCKING_LEVEL,
  );
  assertRange(introDuckingLevel, 'YOUTUBE_INTRO_DUCKING_LEVEL', 0.1, 1);
  const loudnessTarget = numberOption(
    options.loudnessTarget ?? process.env.YOUTUBE_LOUDNESS_TARGET,
    DEFAULT_LOUDNESS_TARGET,
  );
  assertRange(loudnessTarget, 'YOUTUBE_LOUDNESS_TARGET', -24, -12);
  const truePeak = numberOption(
    options.truePeak ?? process.env.YOUTUBE_TRUE_PEAK,
    DEFAULT_TRUE_PEAK,
  );
  assertRange(truePeak, 'YOUTUBE_TRUE_PEAK', -3, -0.5);
  if (musicFile && !existsSync(musicFile)) throw new Error(`No existe YOUTUBE_MUSIC_FILE: ${musicFile}.`);
  const music = musicFile ? {
    enabled: true,
    file: basename(musicFile),
    title: String(options.musicTitle ?? process.env.YOUTUBE_MUSIC_TITLE ?? basename(musicFile)).trim(),
    artist: String(options.musicArtist ?? process.env.YOUTUBE_MUSIC_ARTIST ?? '').trim(),
    license: String(options.musicLicense ?? process.env.YOUTUBE_MUSIC_LICENSE ?? '').trim(),
    attribution: String(options.musicAttribution ?? process.env.YOUTUBE_MUSIC_ATTRIBUTION ?? '').trim(),
    volume: musicVolume,
  } : { enabled: false, mode: 'silencio' };
  if (music.enabled && !music.license) {
    throw new Error('YOUTUBE_MUSIC_LICENSE es obligatorio cuando se usa música.');
  }
  if (music.enabled && /creative commons|cc[ -]?by/i.test(music.license) && !music.attribution) {
    throw new Error('YOUTUBE_MUSIC_ATTRIBUTION es obligatorio para música Creative Commons.');
  }
  const ffmpegPath = options.ffmpegPath || process.env.FFMPEG_PATH || ffmpegStatic || 'ffmpeg';
  mkdirSync(dirname(outPath), { recursive: true });
  const temporary = mkdtempSync(join(tmpdir(), `${safeId(row.id)}-short-`));
  const ownBrowser = !options.browser;
  const browser = options.browser || await chromium.launch();
  try {
    const { scenes, paths } = await renderFrames(row, temporary, browser);
    const { duration: durationSeconds, audioTiming } = await encodeFrames(paths, outPath, {
      sceneSeconds,
      transitionSeconds,
      transitionHoldSeconds,
      transitionShiftPixels,
      ffmpegPath,
      musicFile,
      musicVolume,
      sfxEnabled,
      introSfxSeconds,
      introSfxVolume,
      transitionSfxSeconds,
      transitionSfxVolume,
      outroSfxSeconds,
      outroSfxVolume,
      duckingLevel,
      introDuckingLevel,
      loudnessTarget,
      truePeak,
    });
    if (!existsSync(outPath) || statSync(outPath).size < 10_000) {
      throw new Error('FFmpeg no produjo un MP4 válido.');
    }
    const posterPath = outPath.replace(/\.mp4$/i, '.poster.png');
    const manifestPath = outPath.replace(/\.mp4$/i, '.manifest.json');
    copyFileSync(paths[0], posterPath);
    writeFileSync(manifestPath, `${JSON.stringify({
      sourceId: row.id,
      source: row._source || 'agendamelo_kits.csv',
      width: WIDTH,
      height: HEIGHT,
      durationSeconds,
      sceneSeconds,
      transition: transitionSeconds > 0
        ? {
          type: 'cream-veil-eased-shift',
          seconds: transitionSeconds,
          fadeSeconds: audioTiming.visualFadeSeconds,
          creamHoldSeconds: audioTiming.creamHoldSeconds,
          shiftPixels: transitionShiftPixels,
          easing: 'cosine-in-out',
          midpointSeconds: audioTiming.transitionMidpoints,
          textOverlap: false,
        }
        : { type: 'cut', seconds: 0 },
      motion: transitionSeconds > 0 && transitionShiftPixels > 0
        ? { type: 'transition-only', zoom: false, continuous: false, stableDuringReading: true }
        : { type: 'none', zoom: false },
      sceneCount: scenes.length,
      videoCodec: 'H.264',
      audioCodec: music.enabled ? 'AAC (música + efectos)' : 'AAC (efectos)',
      music,
      audioMix: {
        sampleRateHz: 48000,
        bitrateKbps: 160,
        fadeInSeconds: 0.6,
        fadeOutSeconds: 0.8,
        ducking: {
          musicMultiplier: duckingLevel,
          introMusicMultiplier: introDuckingLevel,
          windowsSeconds: audioTiming.duckWindows,
          regions: audioTiming.duckRegions,
        },
        normalization: { integratedLufs: loudnessTarget, truePeakDbtp: truePeak, lra: 7 },
        effects: {
          enabled: sfxEnabled,
          profile: 'studio-signature-v3',
          provenance: 'Generados proceduralmente con filtros FFmpeg/Lavfi; sin archivos externos.',
          intro: {
            type: 'soft-impact-open-fifth-air-bloom', atSeconds: audioTiming.introAt,
            durationSeconds: introSfxSeconds, volume: introSfxVolume,
          },
          transitions: {
            type: 'filtered-pink-noise-whoosh', count: audioTiming.transitionMidpoints.length,
            midpointSeconds: audioTiming.transitionMidpoints,
            durationSeconds: transitionSfxSeconds, volume: transitionSfxVolume,
          },
          outro: {
            type: 'resolved-open-fifth-chime', atSeconds: audioTiming.outroAt,
            durationSeconds: outroSfxSeconds, volume: outroSfxVolume,
          },
        },
      },
      scenes: scenes.map(({ role, label, text }) => ({ role, label, text })),
      renderedAt: new Date().toISOString(),
    }, null, 2)}\n`);
    return { outPath, posterPath, manifestPath, durationSeconds, sceneCount: scenes.length, music };
  } finally {
    if (ownBrowser) await browser.close();
    rmSync(temporary, { recursive: true, force: true });
  }
}

function readRows(file) {
  if (!existsSync(file)) return [];
  return parse(readFileSync(file), { columns: true, skip_empty_lines: true, relax_quotes: true });
}

function saveRows(rows, file) {
  if (!rows.length) return;
  const existing = Object.keys(rows[0]);
  const columns = [...existing, ...YOUTUBE_COLUMNS.filter((column) => !existing.includes(column))];
  writeFileSync(file, stringify(rows, { header: true, columns }));
}

export function isShortRenderCandidate(row) {
  return !String(row.youtube_video_id || '').trim()
    && ['', 'pendiente'].includes(String(row.youtube_status || '').trim());
}

export async function renderShortQueue({
  file = process.env.AGENDAMELO_KITS_CSV || DEFAULT_CSV,
  mode = 'pending', id = '', renderImpl = renderShortVideo,
} = {}) {
  const rows = readRows(file);
  if (!rows.length) return [];
  const targets = mode === 'one'
    ? rows.filter((row) => row.id === id)
    : rows.filter(isShortRenderCandidate);
  if (mode === 'one' && !targets.length) throw new Error(`No encontré el kit ${id}.`);
  const results = [];
  for (const row of targets) {
    if (row.youtube_video_id) throw new Error(`${row.id}: ya tiene youtube_video_id; no se vuelve a renderizar.`);
    if (row.youtube_status === 'subiendo' || row.youtube_status === 'publicado') {
      throw new Error(`${row.id}: estado YouTube ${row.youtube_status}; render bloqueado.`);
    }
    const issues = validateKit(kitFromRow(row));
    if (issues.length) {
      row.youtube_status = 'error';
      row.youtube_error = `Kit inválido: ${issues[0]}`;
      saveRows(rows, file);
      throw new Error(`${row.id}: ${row.youtube_error}`);
    }
    const outPath = join(ROOT, 'dist', 'shorts', `${safeId(row.id)}.mp4`);
    try {
      const result = await renderImpl(row, outPath);
      row.youtube_video_path = relative(ROOT, outPath);
      row.youtube_status = 'renderizado';
      row.youtube_error = '';
      row.youtube_music_title = result.music?.enabled ? result.music.title : '';
      row.youtube_music_artist = result.music?.enabled ? result.music.artist : '';
      row.youtube_music_license = result.music?.enabled ? result.music.license : '';
      row.youtube_music_attribution = result.music?.enabled ? result.music.attribution : '';
      saveRows(rows, file);
      results.push({ id: row.id, ...result });
    } catch (error) {
      row.youtube_status = 'error';
      row.youtube_error = String(error.message || error).slice(0, 500);
      saveRows(rows, file);
      throw error;
    }
  }
  return results;
}

async function main() {
  const [mode = 'pending', id = ''] = process.argv.slice(2);
  if (mode !== 'pending' && mode !== 'one') throw new Error('Uso: youtube-render.js pending | one <id>');
  const results = await renderShortQueue({ mode, id });
  if (!results.length) console.log('No hay kits pendientes para renderizar.');
  for (const result of results) {
    console.log(`✓ ${result.id}: ${relative(ROOT, result.outPath)} · ${result.durationSeconds.toFixed(1)} s`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(error.message); process.exit(1); });
}
