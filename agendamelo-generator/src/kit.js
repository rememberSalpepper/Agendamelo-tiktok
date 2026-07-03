// Generador de KITS de video (modo TikTok/Reels, solo texto). Pide a Codex N kits de UN nicho y los
// agrega al CSV hermano `agendamelo_kits.csv` como `pendiente`. El bot los entrega como texto
// (bot.js /kit) y los marca `entregado`. NO renderiza imágenes ni toca el modo imagen.
//
// Uso:  node src/kit.js [N] [nicho]        (N por defecto 5, máx 7; nicho: rota solo si no se pasa)
// Requiere: codex CLI autenticado.
//
// Variables de entorno opcionales:
//   AGENDAMELO_KITS_CSV      ruta del CSV de kits (default: ../agendamelo_kits.csv)
//   AGENDAMELO_CODEX_MODEL / AGENDAMELO_CODEX_EFFORT   modelo/esfuerzo de Codex (ver src/codex.js)

import './env.js';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { readFileSync, writeFileSync, existsSync, openSync, closeSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { NICHOS } from './prompt.js';
import { codexBaseArgs, codexConfigLabel } from './codex.js';
import { buildKitPrompt } from './kit-prompt.js';
import { KIT_ANGULOS, KIT_MAX, KIT_DEFAULT, validateKit, validateKitBatch } from './kit-validate.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CSV = process.env.AGENDAMELO_KITS_CSV || join(ROOT, '..', 'agendamelo_kits.csv');
const today = new Date().toISOString().slice(0, 10);

// N: 1..KIT_MAX (default KIT_DEFAULT). El bot ya avisa si pediste más; aquí sólo capamos.
const N = Math.min(Math.max(parseInt(process.argv[2], 10) || KIT_DEFAULT, 1), KIT_MAX);
const ARG_NICHE = (process.argv[3] || '').trim();

// Reparto objetivo por nicho (mismo que niches.js): 30/25/25/20. Rota entre TANDAS.
const WEIGHTS = { manicuristas: 30, psicopedagogas: 25, 'profesores-paes': 25, fonoaudiologas: 20 };

// Columnas del CSV de kits (define el orden cuando el archivo está vacío).
const HEADER = ['id', 'estado', 'niche', 'tanda', 'angulo', 'tema', 'keyword', 'hook', 'scenes_json',
  'cta', 'caption_seo', 'hashtags', 'image_prompts_json', 'fecha_creacion', 'fecha_entregado'];

// ---------- Schema de salida (structured outputs) ----------
const schema = {
  type: 'object', additionalProperties: false, required: ['kits'],
  properties: {
    kits: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        required: ['niche', 'keyword', 'hookText', 'scenes', 'ctaText', 'captionSEO', 'hashtags', 'imagePrompts', 'angulo', 'tema'],
        properties: {
          niche: { type: 'string', enum: NICHOS },
          keyword: { type: 'string' },
          hookText: { type: 'string' },
          scenes: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 3 },
          ctaText: { type: 'string' },
          captionSEO: { type: 'string' },
          hashtags: { type: 'array', items: { type: 'string' }, minItems: 3, maxItems: 5 },
          imagePrompts: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 4 },
          angulo: { type: 'string', enum: KIT_ANGULOS },
          tema: { type: 'string' },
        },
      },
    },
  },
};

// ---------- Codex ----------
function callCodex(prompt) {
  const schemaFile = join(tmpdir(), 'agendamelo-kit-schema.json');
  const outFile = join(tmpdir(), 'agendamelo-kit-out.json');
  const logFile = join(tmpdir(), 'agendamelo-kit-codex.log');
  writeFileSync(schemaFile, JSON.stringify(schema));
  const args = [...codexBaseArgs(), '--output-schema', schemaFile, '--output-last-message', outFile, '-'];
  console.log(`Llamando a Codex (${codexConfigLabel()}) para ${N} kit(s)... (puede tardar 1-3 min)`);
  const fd = openSync(logFile, 'w'); // sesión de Codex -> archivo, consola limpia
  try {
    execFileSync('codex', args, { input: prompt, stdio: ['pipe', fd, fd], timeout: 480000 });
  } catch (e) {
    console.error(`Codex falló. Revisa el log: ${logFile}`);
    throw e;
  } finally { closeSync(fd); }
  return JSON.parse(readFileSync(outFile, 'utf8'));
}

// ---------- Rotación de nicho por tanda (según el reparto 30/25/25/20 y la historia del CSV) ----------
function pickNiche(rows) {
  const count = Object.fromEntries(NICHOS.map((k) => [k, 0]));
  for (const r of rows) if (count[r.niche] !== undefined) count[r.niche]++;
  // Elige el nicho con menor (conteo / peso): así converge al reparto objetivo. Empate -> mayor peso.
  let best = NICHOS[0], bestRatio = Infinity;
  for (const k of NICHOS) {
    const ratio = count[k] / (WEIGHTS[k] || 1);
    if (ratio < bestRatio - 1e-9 || (Math.abs(ratio - bestRatio) < 1e-9 && (WEIGHTS[k] || 1) > (WEIGHTS[best] || 1))) {
      best = k; bestRatio = ratio;
    }
  }
  return best;
}

// ---------- Normalización de un kit de Codex ----------
function normalizeKit(k) {
  return {
    niche: k.niche,
    keyword: String(k.keyword || '').trim(),
    hookText: String(k.hookText || '').trim(),
    scenes: (Array.isArray(k.scenes) ? k.scenes : []).map((s) => String(s || '').trim()).filter(Boolean),
    ctaText: String(k.ctaText || '').trim(),
    captionSEO: String(k.captionSEO || '').trim(),
    hashtags: (Array.isArray(k.hashtags) ? k.hashtags : []).map((t) => String(t || '').trim()).filter(Boolean),
    imagePrompts: (Array.isArray(k.imagePrompts) ? k.imagePrompts : []).map((s) => String(s || '').trim()).filter(Boolean),
    angulo: k.angulo,
    tema: String(k.tema || '').trim(),
  };
}

// ---------- Main ----------
function main() {
  const rows = existsSync(CSV)
    ? parse(readFileSync(CSV), { columns: true, skip_empty_lines: true, relax_quotes: true })
    : [];
  const header = rows.length ? [...Object.keys(rows[0]), ...HEADER.filter((k) => !Object.keys(rows[0]).includes(k))] : HEADER;

  // Nicho de la tanda: arg explícito válido, o rotación por reparto.
  const niche = NICHOS.includes(ARG_NICHE) ? ARG_NICHE : pickNiche(rows);
  if (ARG_NICHE && !NICHOS.includes(ARG_NICHE)) {
    console.error(`Nicho inválido "${ARG_NICHE}". Opciones: ${NICHOS.join(', ')}.`); process.exit(1);
  }

  // Anti-repetición: evita por "tema — hook" de TODOS los kits previos.
  const avoid = rows.map((r) => [r.tema, r.hook].filter(Boolean).join(' — ')).filter(Boolean);
  const maxNum = rows.length ? Math.max(0, ...rows.map((r) => parseInt(String(r.id).replace(/\D/g, ''), 10) || 0)) : 0;
  const maxTanda = rows.length ? Math.max(0, ...rows.map((r) => parseInt(r.tanda, 10) || 0)) : 0;
  const tanda = maxTanda + 1;

  console.log(`Tanda #${tanda} · nicho: ${niche}${ARG_NICHE ? ' (explícito)' : ' (rotación)'} · ${N} kit(s).`);
  const result = callCodex(buildKitPrompt({ n: N, niche, avoid }));
  const kits = (result.kits || []).map(normalizeKit);
  console.log(`Codex devolvió ${kits.length} kit(s). Validando...`);

  // Valida cada kit; conserva solo válidos y de ángulo NO repetido dentro de la tanda.
  const accepted = [];
  const usedAngles = new Set();
  for (const k of kits) {
    if (k.niche !== niche) k.niche = niche; // forzamos el nicho de la tanda
    const problems = validateKit(k);
    if (problems.length) { console.warn(`  ✗ descartado (${k.tema || 'sin-tema'}): ${problems[0]}`); continue; }
    if (usedAngles.has(k.angulo)) { console.warn(`  ✗ descartado (${k.tema}): ángulo repetido "${k.angulo}"`); continue; }
    usedAngles.add(k.angulo);
    accepted.push(k);
  }

  const batchIssues = validateKitBatch(accepted);
  if (batchIssues.length) { console.error(`Tanda inválida: ${batchIssues.join('; ')}`); process.exit(1); }
  if (accepted.length === 0) { console.error('No se agregó ningún kit válido.'); process.exit(1); }

  let num = maxNum;
  const newRows = accepted.map((k) => {
    num++;
    const id = `AGENDA-KIT-${String(num).padStart(3, '0')}`;
    const row = Object.fromEntries(header.map((h) => [h, '']));
    Object.assign(row, {
      id, estado: 'pendiente', niche: k.niche, tanda: String(tanda), angulo: k.angulo, tema: k.tema,
      keyword: k.keyword, hook: k.hookText, scenes_json: JSON.stringify(k.scenes), cta: k.ctaText,
      caption_seo: k.captionSEO, hashtags: k.hashtags.join(' '),
      image_prompts_json: JSON.stringify(k.imagePrompts), fecha_creacion: today,
    });
    console.log(`  ✓ ${id}  [${k.angulo}]  ${k.hookText}`);
    return row;
  });

  writeFileSync(CSV, stringify([...rows, ...newRows], { header: true, columns: header }));
  console.log(`\nOK: ${newRows.length} kit(s) nuevos como 'pendiente' en ${CSV}.`);
  console.log('Siguiente: el bot los entrega con /kit (o revisa con npm run lint).');
}

main();
