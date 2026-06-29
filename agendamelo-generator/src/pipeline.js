// Pipeline Agendamelo: lee el CSV, renderiza por plantilla y nicho, y marca cada idea.
//
// Uso:
//   node src/pipeline.js pending      -> renderiza solo las que están pendientes
//   node src/pipeline.js all          -> renderiza las 20 (estandarizar)
//   node src/pipeline.js one <id>     -> renderiza una sola
//
// Al terminar cada idea: estado=realizado, fecha_realizado, imagen_url.

import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderToPng, renderCarousel, openBrowser } from './render.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CSV = process.env.AGENDAMELO_CSV || join(ROOT, '..', 'agendamelo_ideas.csv');
const today = new Date().toISOString().slice(0, 10);

function rowToData(row) {
  const content = JSON.parse(row.imagen_json);
  // Fondo: usa el del contenido si existe, si no rota 1-4 por número de idea.
  const num = parseInt(String(row.id).replace(/\D/g, ''), 10) || 1;
  const bg = content.bg || ((num - 1) % 4) + 1;
  return { tipo: row.tipo_plantilla, niche: row.niche, hook: row.hook, ...content, bg };
}

// Renderiza una fila (imagen o carrusel) y devuelve imagen_url (ruta o lista separada por comas).
async function renderRow(row, browser) {
  const data = rowToData(row);
  if (row.formato === 'carrusel') {
    const paths = await renderCarousel(data, join(ROOT, 'dist', row.id), browser);
    return paths.map((p) => `dist/${p.split('/').pop()}`).join(',');
  }
  const rel = `dist/${row.id}.png`;
  await renderToPng(data, join(ROOT, rel), browser);
  return rel;
}

async function main() {
  const [mode = 'pending', arg] = process.argv.slice(2);
  const rows = parse(readFileSync(CSV), { columns: true, skip_empty_lines: true, relax_quotes: true });

  let targets;
  if (mode === 'all') targets = rows;
  else if (mode === 'one') targets = rows.filter((r) => r.id === arg);
  // pending: solo lo CURADO por el humano (hook elegido). Las filas viejas sin hook_variantes
  // se consideran curadas (compat). Así /render nunca saca una idea con el hook sin elegir.
  else targets = rows.filter((r) => r.estado !== 'renderizado' && r.estado !== 'enviado'
    && r.hook && (r.hook_elegido || !r.hook_variantes));

  if (targets.length === 0) { console.log('No hay ideas que renderizar para el modo:', mode); return; }
  console.log(`Renderizando ${targets.length} imagen(es) [modo: ${mode}]...`);

  const browser = await openBrowser();
  let done = 0;
  try {
    for (const row of targets) {
      const url = await renderRow(row, browser);
      if (row.estado !== 'enviado') row.estado = 'renderizado'; // no degradar lo ya enviado
      row.imagen_url = url;
      done++;
      const tag = row.formato === 'carrusel' ? `carrusel x${url.split(',').length}` : row.tipo_plantilla;
      console.log(`  ✓ ${row.id}  (${row.formato || 'imagen'}/${tag})`);
    }
  } finally {
    await browser.close();
    // Guarda el progreso aunque algo falle a mitad de camino.
    if (done > 0) writeFileSync(CSV, stringify(rows, { header: true, columns: Object.keys(rows[0]) }));
  }
  console.log(`CSV actualizado (${done}/${targets.length}): estado, fecha_realizado, imagen_url.`);
}

main();
