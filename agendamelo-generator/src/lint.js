// Valida el CSV antes de renderizar/publicar. Falla si algo no cumple las reglas de Agendamelo.

import { parse } from 'csv-parse/sync';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TIPOS, NICHOS, ORIENTACIONES, FORMATOS } from './prompt.js';

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
  if (!FORMATOS.includes(r.formato)) errors.push(`${r.id}: formato desconocido "${r.formato}".`);
  if (!r.tema) errors.push(`${r.id}: falta tema (etiqueta del ángulo).`);
  if (!r.hook) errors.push(`${r.id}: falta hook.`);
  if ((r.descripcion || '').length < 1200) errors.push(`${r.id}: descripción muy corta (${(r.descripcion || '').length} car., mínimo 1200).`);

  let content = null;
  try { content = JSON.parse(r.imagen_json); } catch { errors.push(`${r.id}: imagen_json inválido o vacío.`); }

  if (r.formato === 'carrusel') {
    if (r.tipo_plantilla !== 'carrusel') errors.push(`${r.id}: carrusel debe tener tipo_plantilla "carrusel".`);
    const s = content && content.slides;
    if (!Array.isArray(s) || s.length < 3 || s.length > 4) {
      errors.push(`${r.id}: carrusel debe tener 3-4 slides.`);
    } else if (s[0].tipo !== 'portada' || s.at(-1).tipo !== 'cierre' || !s.at(-1).cta) {
      errors.push(`${r.id}: carrusel debe iniciar en portada y cerrar en cierre con CTA.`);
    }
  } else if (!TIPOS.includes(r.tipo_plantilla)) {
    errors.push(`${r.id}: tipo_plantilla desconocido "${r.tipo_plantilla}".`);
  }
}

if (errors.length) {
  console.error(`✗ ${errors.length} problema(s):`);
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}
console.log(`✓ OK: ${rows.length} filas válidas (5 hashtags #agendamelo, niche, orientacion, formato, tema, plantilla/slides, hook).`);
