// Revisión INTEGRAL del proyecto: sistema (Codex/Chromium/assets), CSV (integridad),
// ideas (variedad/repetición) e imágenes (render completo, carruseles, huérfanos).
// Uso: npm run revisar   ó   node src/review.js
// Reporta y no falla (exit 0); lista problemas accionables al final.

import { parse } from 'csv-parse/sync';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TIPOS, NICHOS, ORIENTACIONES, FORMATOS } from './prompt.js';
import { validateRow } from './validate.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CSV = process.env.AGENDAMELO_CSV || join(ROOT, '..', 'agendamelo_ideas.csv');
const DIST = join(ROOT, 'dist');

const out = [];
const log = (s = '') => out.push(s);
const tally = (rows, key) => rows.reduce((m, r) => ((m[r[key]] = (m[r[key]] || 0) + 1), m), {});
const fmt = (obj) => Object.entries(obj).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}:${v}`).join(' · ') || '—';
const pct = (n, t) => (t ? Math.round((n / t) * 100) : 0);
const problems = [];

// ---------- 1) SISTEMA ----------
log('🔎 *REVISIÓN AGENDAMELO*');
log('\n*1) Sistema*');
let codexOk = false;
try { execSync('command -v codex', { stdio: 'pipe' }); codexOk = true; } catch { codexOk = false; }
log(`${codexOk ? '✓' : '✗'} Codex CLI ${codexOk ? 'disponible' : 'no encontrado (necesario para /generar)'}`);
if (!codexOk) problems.push('Codex no está instalado/autenticado: /generar no funcionará.');

let chromeOk = false;
try { const { chromium } = await import('playwright'); chromeOk = existsSync(chromium.executablePath()); } catch { chromeOk = false; }
log(`${chromeOk ? '✓' : '✗'} Chromium (Playwright) ${chromeOk ? 'instalado' : 'falta (npx playwright install chromium)'}`);
if (!chromeOk) problems.push('Chromium no está: el render de imágenes no funcionará.');

const assets = ['assets/logos/logomark.svg', 'assets/fonts/bricolage-latin.woff2', 'assets/fonts/dmsans-latin.woff2'];
const assetsOk = assets.every((a) => existsSync(join(ROOT, a)));
log(`${assetsOk ? '✓' : '✗'} Assets de marca (logo + fuentes) ${assetsOk ? 'presentes' : 'faltan'}`);
if (!assetsOk) problems.push('Faltan assets de marca (logo/fuentes).');

// Las credenciales pueden venir de .env (local) o inyectadas por docker-compose (VPS):
// validamos las variables reales, no solo el archivo.
const envVarsOk = !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
const envFileOk = existsSync(join(ROOT, '.env'));
const credOk = envVarsOk || envFileOk;
log(`${credOk ? '✓' : '⚠️'} Credenciales Telegram ${envVarsOk ? 'cargadas en el entorno' : envFileOk ? 'en .env (sin cargar aún)' : 'faltan (crea .env o pásalas por docker-compose)'}`);
if (!credOk) problems.push('Faltan TELEGRAM_BOT_TOKEN/CHAT_ID: el bot no podrá enviar.');

// ---------- 2) CSV ----------
log('\n*2) CSV (integridad)*');
let rows = [];
try {
  rows = parse(readFileSync(CSV), { columns: true, skip_empty_lines: true, relax_quotes: true });
} catch (e) {
  log(`✗ No se pudo leer el CSV: ${e.message}`);
  problems.push('CSV ilegible.');
}
log(`• Filas: ${rows.length}`);

let invalidas = 0;
for (const r of rows) {
  const issues = validateRow(r);
  if (issues.length) { invalidas++; if (invalidas <= 8) log(`  ✗ ${r.id}: ${issues.join('; ')}`); }
}
log(invalidas ? `✗ ${invalidas} fila(s) con problemas de validación.` : '✓ Todas las filas pasan la validación.');
if (invalidas) problems.push(`${invalidas} fila(s) inválidas (corre npm run lint para el detalle).`);

// Duplicados (tema / hook)
const dup = (key, label) => {
  const seen = {}, reps = [];
  for (const r of rows) { const k = (r[key] || '').trim().toLowerCase(); if (!k) continue; seen[k] = (seen[k] || 0) + 1; }
  for (const [k, n] of Object.entries(seen)) if (n > 1) reps.push(`${label}="${k}" ×${n}`);
  return reps;
};
const dupTemas = dup('tema', 'tema');
const dupHooks = dup('hook', 'hook');
log(`${dupTemas.length || dupHooks.length ? '⚠️' : '✓'} Repetidos: ${[...dupTemas, ...dupHooks].slice(0, 6).join(' · ') || 'ninguno'}`);
if (dupTemas.length) problems.push(`Temas repetidos: ${dupTemas.length} (revisa anti-repetición).`);

// ---------- 3) IDEAS (variedad) ----------
log('\n*3) Ideas (variedad)*');
const activos = rows;
log(`• Estado — ${fmt(tally(rows, 'estado'))}`);
log(`• Nicho — ${fmt(tally(activos, 'niche'))}`);
log(`• Orientación — ${fmt(tally(activos, 'orientacion'))}`);
log(`• Formato — ${fmt(tally(activos, 'formato'))}`);

const faltanNichos = NICHOS.filter((n) => !activos.some((r) => r.niche === n));
if (activos.length) {
  log(`${faltanNichos.length ? '⚠️' : '✓'} Cobertura de nichos: ${faltanNichos.length ? 'faltan ' + faltanNichos.join(', ') : 'los 6 presentes'}`);
  const o = tally(activos, 'orientacion'); const t = activos.length;
  log(`• Mezcla orientación: educativo ${pct(o.educativo || 0, t)}% · plataforma ${pct(o.plataforma || 0, t)}% · venta ${pct(o.venta || 0, t)}% (objetivo 40/30/30)`);
  const f = tally(activos, 'formato');
  log(`• Mezcla formato: imagen ${pct(f.imagen || 0, t)}% · carrusel ${pct(f.carrusel || 0, t)}% (objetivo 60/40)`);
  const temasUnicos = new Set(activos.map((r) => (r.tema || '').toLowerCase()).filter(Boolean)).size;
  log(`• Temas únicos: ${temasUnicos}/${activos.length}`);
}

// ---------- 4) IMÁGENES (render) ----------
log('\n*4) Imágenes (render)*');
const referenced = new Set();
let sinRender = 0, incompletos = 0;
for (const r of rows) {
  const files = (r.imagen_url || '').split(',').map((p) => p.trim()).filter(Boolean);
  files.forEach((f) => referenced.add(f.split('/').pop()));
  const debeTener = r.estado === 'renderizado' || r.estado === 'enviado';
  if (debeTener) {
    if (!files.length) { sinRender++; if (sinRender <= 5) log(`  ✗ ${r.id}: estado ${r.estado} pero sin imagen_url`); continue; }
    const faltan = files.filter((f) => !existsSync(join(ROOT, f)));
    if (faltan.length) { incompletos++; if (incompletos <= 5) log(`  ✗ ${r.id}: faltan ${faltan.length}/${files.length} PNG en disco`); }
  }
}
log(sinRender ? `✗ ${sinRender} fila(s) marcadas como listas SIN imagen_url.` : '✓ Toda fila lista tiene su imagen_url.');
log(incompletos ? `✗ ${incompletos} fila(s) con PNG faltantes en disco.` : '✓ Todos los PNG referenciados existen en disco.');
if (sinRender) problems.push(`${sinRender} fila(s) sin render (corre npm run render:all).`);
if (incompletos) problems.push(`${incompletos} fila(s) con láminas faltantes (re-renderiza con /rehacer <id>).`);

// Huérfanos en dist (PNG de ideas no referenciados; ignora muestras _preview/_*).
let orphans = [];
try {
  orphans = readdirSync(DIST).filter((f) => f.endsWith('.png') && !f.startsWith('_') && !referenced.has(f));
} catch { /* dist vacío */ }
log(`${orphans.length ? '⚠️' : '✓'} PNG huérfanos en dist/: ${orphans.length || 'ninguno'}${orphans.length ? ' (' + orphans.slice(0, 4).join(', ') + '…)' : ''}`);

// ---------- RESUMEN ----------
log('\n*Resumen*');
if (problems.length === 0) log('✅ Todo en orden. Listo para generar/publicar.');
else { log(`⚠️ ${problems.length} punto(s) a revisar:`); problems.forEach((p) => log(`  • ${p}`)); }

console.log(out.join('\n'));
