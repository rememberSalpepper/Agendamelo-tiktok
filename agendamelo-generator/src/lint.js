// Valida los CSV antes de renderizar/publicar. Falla (exit 1) si algo no cumple las reglas.
// Cubre DOS modos: imágenes (Facebook, validate.js) y kits de video (TikTok/Reels, kit-validate.js).
// La lógica vive en validate.js / kit-validate.js (compartida con review.js y kit.js).

import { parse } from 'csv-parse/sync';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateRow } from './validate.js';
import { validateKit, validateKitBatch, kitFromRow } from './kit-validate.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CSV = process.env.AGENDAMELO_CSV || join(ROOT, '..', 'agendamelo_ideas.csv');
const KITS_CSV = process.env.AGENDAMELO_KITS_CSV || join(ROOT, '..', 'agendamelo_kits.csv');

const errors = [];

// ---------- Imágenes (Facebook) ----------
// Solo se valida lo que aún se va a publicar. Lo 'enviado' es historia inmutable (puede venir de
// versiones viejas del esquema) y NO se revalida.
const rows = parse(readFileSync(CSV), { columns: true, skip_empty_lines: true, relax_quotes: true });
const porPublicar = rows.filter((r) => r.estado !== 'enviado');
const enviadas = rows.length - porPublicar.length;
for (const r of porPublicar) for (const issue of validateRow(r)) errors.push(`[img] ${r.id}: ${issue}`);

// ---------- Kits de video (TikTok/Reels) ----------
// CSV hermano; puede no existir aún. Se valida cada fila + ÁNGULOS ÚNICOS por tanda.
let kitCount = 0;
if (existsSync(KITS_CSV)) {
  const kitRows = parse(readFileSync(KITS_CSV), { columns: true, skip_empty_lines: true, relax_quotes: true });
  kitCount = kitRows.length;
  const porTanda = new Map();
  for (const r of kitRows) {
    const k = kitFromRow(r);
    for (const issue of validateKit(k)) errors.push(`[kit] ${r.id}: ${issue}`);
    const t = r.tanda || '?';
    if (!porTanda.has(t)) porTanda.set(t, []);
    porTanda.get(t).push(k);
  }
  for (const [t, kits] of porTanda) for (const issue of validateKitBatch(kits)) errors.push(`[kit] tanda ${t}: ${issue}`);
}

if (errors.length) {
  console.error(`✗ ${errors.length} problema(s):`);
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}
console.log(`✓ OK: ${porPublicar.length} imagen(es) por publicar válida(s)`
  + `${enviadas ? ` (+${enviadas} enviadas, no se revalidan)` : ''}`
  + `${kitCount ? ` · ${kitCount} kit(s) válido(s)` : ''}.`);
