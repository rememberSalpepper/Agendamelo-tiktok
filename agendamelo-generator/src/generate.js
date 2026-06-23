// Generador de ideas Agendamelo: pide a Codex N ideas nuevas y las agrega al CSV como `pendiente`.
//
// Uso:  node src/generate.js [N]        (por defecto 14)
// Requiere: codex CLI autenticado.  Luego: npm run lint && npm run render
//
// Variables de entorno opcionales:
//   AGENDAMELO_CODEX_MODEL   modelo a usar en codex (-m)
//   AGENDAMELO_CSV           ruta del CSV

import './env.js';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { readFileSync, writeFileSync, openSync, closeSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { buildPrompt, TIPOS, ICONS, NICHOS, ORIENTACIONES, FORMATOS } from './prompt.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CSV = process.env.AGENDAMELO_CSV || join(ROOT, '..', 'agendamelo_ideas.csv');
const today = new Date().toISOString().slice(0, 10);
const N = parseInt(process.argv[2], 10) || 7;

// ---------- Repartos balanceados (orientación y plantilla) ----------
// Orientaciones: ~40% educativo, ~30% plataforma, ~30% venta.
function distributeOrientacion(n) {
  const plataforma = Math.round(n * 0.3);
  const venta = Math.round(n * 0.3);
  const educativo = Math.max(0, n - plataforma - venta);
  return { educativo, plataforma, venta };
}
// Plantillas: round-robin sobre los 8 tipos para que haya variedad (solo aplica a formato imagen).
function distributeTemplates(n) {
  const order = ['feature', 'stat', 'comparacion', 'checklist', 'base_3_cards', 'proceso', 'mito_realidad', 'piramide'];
  const d = Object.fromEntries(order.map((t) => [t, 0]));
  for (let i = 0; i < n; i++) d[order[i % order.length]]++;
  return d;
}
// Formato: ~60% imagen simple, ~40% carrusel (temas más densos).
function distributeFormato(n) {
  const carrusel = Math.round(n * 0.4);
  return { imagen: Math.max(0, n - carrusel), carrusel };
}

// ---------- Schema de salida (compatible con structured outputs) ----------
const S = (extra) => ({ type: ['string', 'null'], ...extra });
const arr = (items) => ({ type: ['array', 'null'], items });
const schema = {
  type: 'object', additionalProperties: false, required: ['ideas'],
  properties: {
    ideas: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        required: ['niche', 'orientacion', 'formato', 'tipo_plantilla', 'titulo', 'tema', 'hook', 'descripcion', 'hashtags', 'imagen_json'],
        properties: {
          niche: { type: 'string', enum: NICHOS },
          orientacion: { type: 'string', enum: ORIENTACIONES },
          formato: { type: 'string', enum: FORMATOS },
          tipo_plantilla: { type: 'string', enum: [...TIPOS, 'carrusel'] },
          titulo: { type: 'string' },
          tema: { type: 'string' },
          hook: { type: 'string' },
          descripcion: { type: 'string' },
          hashtags: { type: 'array', items: { type: 'string' }, minItems: 5, maxItems: 5 },
          imagen_json: {
            type: 'object', additionalProperties: false,
            required: ['badge', 'subtitle', 'items', 'cards', 'mito', 'realidad', 'pyramid', 'steps',
              'figure', 'figure_caption', 'points', 'screen_slug', 'screen_title', 'rows', 'button',
              'antes', 'despues', 'slides', 'note', 'cierre', 'cta'],
            properties: {
              badge: { type: 'string' },
              subtitle: { type: 'string' },
              items: arr({ type: 'string' }),
              cards: arr({
                type: 'object', additionalProperties: false, required: ['icon', 'title', 'text'],
                properties: { icon: { type: 'string', enum: ICONS }, title: { type: 'string' }, text: { type: 'string' } },
              }),
              mito: S(), realidad: S(), note: S(), cierre: S(),
              pyramid: {
                type: ['object', 'null'], additionalProperties: false, required: ['top', 'mid', 'base'],
                properties: { top: { type: 'string' }, mid: { type: 'string' }, base: { type: 'string' } },
              },
              steps: arr({ type: 'string' }),
              // stat
              figure: S(), figure_caption: S(), points: arr({ type: 'string' }),
              // feature (mockup del sitio)
              screen_slug: S(), screen_title: S(), rows: arr({ type: 'string' }), button: S(),
              // comparacion
              antes: arr({ type: 'string' }), despues: arr({ type: 'string' }),
              // carrusel (3-4 slides: portada -> punto -> cierre)
              slides: arr({
                type: 'object', additionalProperties: false,
                required: ['tipo', 'title', 'text', 'bullets', 'highlight', 'hook', 'subtitle', 'icon', 'badge', 'cta'],
                properties: {
                  tipo: { type: 'string', enum: ['portada', 'punto', 'cierre'] },
                  title: S(), text: S(), bullets: arr({ type: 'string' }), highlight: S(),
                  hook: S(), subtitle: S(), icon: S(), badge: S(),
                  cta: {
                    type: ['object', 'null'], additionalProperties: false, required: ['title', 'sub'],
                    properties: { title: { type: 'string' }, sub: { type: 'string' } },
                  },
                },
              }),
              cta: {
                type: 'object', additionalProperties: false, required: ['title', 'sub'],
                properties: { title: { type: 'string' }, sub: { type: 'string' } },
              },
            },
          },
        },
      },
    },
  },
};

// ---------- Llamar a Codex ----------
function callCodex(prompt) {
  const schemaFile = join(tmpdir(), 'agendamelo-schema.json');
  const outFile = join(tmpdir(), 'agendamelo-out.json');
  const logFile = join(tmpdir(), 'agendamelo-codex.log');
  writeFileSync(schemaFile, JSON.stringify(schema));
  const args = ['exec', '--skip-git-repo-check', '-s', 'read-only',
    '--output-schema', schemaFile, '--output-last-message', outFile];
  if (process.env.AGENDAMELO_CODEX_MODEL) args.push('-m', process.env.AGENDAMELO_CODEX_MODEL);
  args.push('-');
  console.log('Llamando a Codex (puede tardar 1-3 min)...');
  const fd = openSync(logFile, 'w'); // sesión de Codex -> archivo, consola limpia
  try {
    execFileSync('codex', args, { input: prompt, stdio: ['pipe', fd, fd], timeout: 480000 });
  } catch (e) {
    console.error(`Codex falló. Revisa el log: ${logFile}`);
    throw e;
  } finally { closeSync(fd); }
  return JSON.parse(readFileSync(outFile, 'utf8'));
}

// ---------- Validación / normalización ----------
const REQ = {
  checklist: (c) => Array.isArray(c.items) && c.items.length >= 3,
  base_3_cards: (c) => Array.isArray(c.cards) && c.cards.length === 3,
  mito_realidad: (c) => c.mito && c.realidad,
  piramide: (c) => c.pyramid && c.pyramid.top && c.pyramid.base,
  proceso: (c) => Array.isArray(c.steps) && c.steps.length >= 3,
  stat: (c) => c.figure && c.figure_caption,
  feature: (c) => c.screen_title && Array.isArray(c.rows) && c.rows.length >= 2 && c.button,
  comparacion: (c) => Array.isArray(c.antes) && c.antes.length >= 2 && Array.isArray(c.despues) && c.despues.length >= 2,
  carrusel: (c) => Array.isArray(c.slides) && c.slides.length >= 3 && c.slides.length <= 4
    && c.slides[0].tipo === 'portada' && c.slides.at(-1).tipo === 'cierre' && c.slides.at(-1).cta,
};
function cleanContent(c) { // quita los null para que el render reciba solo lo que aplica
  const o = {};
  for (const [k, v] of Object.entries(c)) if (v !== null && v !== undefined) o[k] = v;
  return o;
}
function fixHashtags(tags) {
  let t = tags.map((x) => x.toLowerCase().replace(/\s+/g, '')).filter(Boolean);
  if (!t.includes('#agendamelo')) t = ['#agendamelo', ...t];
  t = [...new Set(t)].slice(0, 5);
  // Relleno sin duplicar, por si vinieron menos de 5 únicos.
  for (const f of ['#agendaonline', '#paginaweb', '#pymeschile', '#emprendimiento']) {
    if (t.length >= 5) break;
    if (!t.includes(f)) t.push(f);
  }
  return t.join(' ');
}

// Columnas del CSV (define el orden; se usa cuando el CSV está vacío = solo header).
const HEADER = ['id', 'estado', 'niche', 'orientacion', 'formato', 'tipo_plantilla', 'titulo', 'tema', 'hook',
  'descripcion', 'hashtags', 'fecha_creacion', 'fecha_realizado', 'imagen_url', 'imagen_json', 'notas_plantilla'];

// ---------- Main ----------
function main() {
  const rows = parse(readFileSync(CSV), { columns: true, skip_empty_lines: true, relax_quotes: true });
  const header = rows.length ? Object.keys(rows[0]) : HEADER;
  // Anti-repetición: evita por "titulo — tema" de TODAS las filas (semántico, no solo el título).
  const avoid = rows.map((r) => [r.titulo, r.tema].filter(Boolean).join(' — ')).filter(Boolean);
  const maxNum = rows.length ? Math.max(...rows.map((r) => parseInt(String(r.id).replace(/\D/g, ''), 10) || 0)) : 0;

  const prompt = buildPrompt({
    n: N,
    orientacionMix: distributeOrientacion(N),
    formatoMix: distributeFormato(N),
    templateMix: distributeTemplates(N),
    avoid,
  });
  const result = callCodex(prompt);
  const ideas = result.ideas || [];
  console.log(`Codex devolvió ${ideas.length} ideas. Validando...`);

  const newRows = [];
  let num = maxNum;
  for (const idea of ideas) {
    const c = idea.imagen_json || {};
    const formato = FORMATOS.includes(idea.formato) ? idea.formato : 'imagen';
    const tipo = formato === 'carrusel' ? 'carrusel' : idea.tipo_plantilla;
    if (!REQ[tipo] || !REQ[tipo](c)) {
      console.warn(`  ✗ descartada (${formato}/${tipo}): contenido incompleto -> ${idea.titulo}`);
      continue;
    }
    if (!NICHOS.includes(idea.niche)) {
      console.warn(`  ✗ descartada: niche inválido "${idea.niche}" -> ${idea.titulo}`);
      continue;
    }
    const orientacion = ORIENTACIONES.includes(idea.orientacion) ? idea.orientacion : 'educativo';
    num++;
    const id = `AGENDA-IDEA-${String(num).padStart(3, '0')}`;
    const row = Object.fromEntries(header.map((k) => [k, '']));
    Object.assign(row, {
      id, estado: 'pendiente', niche: idea.niche, orientacion, formato, tipo_plantilla: tipo,
      titulo: idea.titulo, tema: idea.tema || '', hook: idea.hook, descripcion: idea.descripcion,
      hashtags: fixHashtags(idea.hashtags), fecha_creacion: today, imagen_json: JSON.stringify(cleanContent(c)),
    });
    newRows.push(row);
    console.log(`  ✓ ${id}  (${idea.niche}/${orientacion}/${formato}/${tipo})  ${idea.hook}`);
  }

  if (newRows.length === 0) { console.error('No se agregó ninguna idea válida.'); process.exit(1); }
  writeFileSync(CSV, stringify([...rows, ...newRows], { header: true, columns: header }));
  console.log(`\nOK: ${newRows.length} ideas nuevas agregadas como 'pendiente'.`);
  console.log('Siguiente: npm run lint && npm run render');
}

main();
