// Valida el CSV antes de renderizar/publicar. Falla si algo no cumple las reglas de Agendamelo.

import { parse } from 'csv-parse/sync';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TIPOS, NICHOS, ORIENTACIONES } from './prompt.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CSV = process.env.AGENDAMELO_CSV || join(ROOT, '..', 'agendamelo_ideas.csv');

const rows = parse(readFileSync(CSV), { columns: true, skip_empty_lines: true, relax_quotes: true });
const errors = [];

for (const r of rows) {
  const tags = (r.hashtags || '').trim().split(/\s+/).filter(Boolean);
  if (tags.length !== 5) errors.push(`${r.id}: debe tener EXACTAMENTE 5 hashtags (tiene ${tags.length}).`);
  if (!tags.includes('#agendamelo')) errors.push(`${r.id}: falta #agendamelo.`);
  if (!NICHOS.includes(r.niche)) errors.push(`${r.id}: niche desconocido "${r.niche}".`);
  if (!ORIENTACIONES.includes(r.orientacion)) errors.push(`${r.id}: orientacion desconocida "${r.orientacion}".`);
  if (!TIPOS.includes(r.tipo_plantilla)) errors.push(`${r.id}: tipo_plantilla desconocido "${r.tipo_plantilla}".`);
  if (!r.hook) errors.push(`${r.id}: falta hook.`);
  if ((r.descripcion || '').length < 1200) errors.push(`${r.id}: descripción muy corta (${(r.descripcion || '').length} car., mínimo 1200).`);
  try { JSON.parse(r.imagen_json); } catch { errors.push(`${r.id}: imagen_json inválido o vacío.`); }
}

if (errors.length) {
  console.error(`✗ ${errors.length} problema(s):`);
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}
console.log(`✓ OK: ${rows.length} filas válidas (5 hashtags, #agendamelo, niche, orientacion, plantilla, hook, imagen_json).`);
