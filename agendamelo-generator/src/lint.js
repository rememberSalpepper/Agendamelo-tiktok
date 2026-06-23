// Valida el CSV antes de renderizar/publicar. Falla (exit 1) si algo no cumple las reglas.
// La lógica de validación vive en validate.js (compartida con review.js).

import { parse } from 'csv-parse/sync';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateRow } from './validate.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CSV = process.env.AGENDAMELO_CSV || join(ROOT, '..', 'agendamelo_ideas.csv');

const rows = parse(readFileSync(CSV), { columns: true, skip_empty_lines: true, relax_quotes: true });
const errors = [];
for (const r of rows) for (const issue of validateRow(r)) errors.push(`${r.id}: ${issue}`);

if (errors.length) {
  console.error(`✗ ${errors.length} problema(s):`);
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}
console.log(`✓ OK: ${rows.length} filas válidas (5 hashtags #agendamelo, niche, orientacion, formato, tema, plantilla/slides, hook).`);
