// Reescribe las descripciones del CSV a versión LARGA y SEO (dentro y fuera de TikTok),
// profundizando el tema de cada imagen y terminando con CTA. No toca imágenes ni otros campos.
//
// Uso:  node src/expand-descriptions.js [all|short|<id> ...]   (por defecto: all)

import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { codexBaseArgs } from './codex.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CSV = process.env.AGENDAMELO_CSV || join(ROOT, '..', 'agendamelo_ideas.csv');
const BATCH = 6;
const strip = (s) => (s || '').replace(/\*(.+?)\*/g, '$1');

const schema = {
  type: 'object', additionalProperties: false, required: ['items'],
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false, required: ['id', 'descripcion'],
        properties: { id: { type: 'string' }, descripcion: { type: 'string' } },
      },
    },
  },
};

function callCodex(prompt) {
  const sf = join(tmpdir(), 'agendamelo-exp-schema.json');
  const of = join(tmpdir(), 'agendamelo-exp-out.json');
  writeFileSync(sf, JSON.stringify(schema));
  execFileSync('codex', [...codexBaseArgs(), '--output-schema', sf, '--output-last-message', of, '-'],
    { input: prompt, stdio: ['pipe', 'ignore', 'inherit'], timeout: 480000 });
  return JSON.parse(readFileSync(of, 'utf8')).items || [];
}

function promptFor(batch) {
  const blocks = batch.map((r) => {
    const c = JSON.parse(r.imagen_json);
    const puntos = [c.subtitle, ...(c.items || []),
      c.figure && `Dato: ${c.figure}${c.figure_caption ? ` (${c.figure_caption})` : ''}${c.source ? ` — fuente: ${c.source}` : ''}`,
      c.mito && `Mito: ${c.mito}`, c.realidad && `Realidad: ${c.realidad}`,
      ...(c.antes || []).map((x) => `Antes: ${x}`), ...(c.despues || []).map((x) => `Después: ${x}`),
      c.note, c.cierre].filter(Boolean).join(' | ');
    return `ID: ${r.id}\nTipo: ${r.tipo_plantilla} | Orientación: ${/venta|auditor|dm|pack/i.test(r.imagen_json) ? 'mixta' : 'educativa'}\nHook: ${strip(r.hook)}\nTítulo: ${r.titulo}\nLo que muestra la imagen: ${puntos}`;
  }).join('\n\n---\n\n');

  return `Eres redactor SEO de Agendamelo (agendamelo.cl): "mini-web profesional + agenda online"
para profesionales en Chile (manicuristas, psicopedagogas, profesores particulares/PAES,
fonoaudiólogas), con sitio web propio, reservas 24/7, SESIONES RECURRENTES, recordatorios POR CORREO,
galería/reseñas y aparición en Google. NUNCA lo llames "software de reservas" ni "plataforma de
gestión". Reescribe la DESCRIPCIÓN de cada post para TikTok. Devuelve {id, descripcion}.

Reglas de cada descripción:
- MUY LARGA: entre 230 y 350 palabras, en 2 o 3 párrafos. Con mucho contenido de valor.
- Profundiza el tema de la imagen (usa lo que muestra) con la jerga y el dolor del rubro del post:
  explica qué pasa, por qué duele y cómo lo resuelve Agendamelo (mini-web, reservas 24/7, sesiones
  recurrentes, recordatorios por correo, aparecer en Google, galería/reseñas). Aporta más que la imagen.
- Español neutro/chileno, acentos correctos, PROHIBIDO el voseo argentino ("hacés/mandame/mirá").
- SEO dentro y fuera de TikTok: integra keywords y sinónimos de forma natural e incluye VARIAS
  preguntas reales que la gente escribe (ej. "cuánto cobra una manicure chile 2026", "agenda online
  psicopedagoga", "cómo organizar alumnos paes", "página web para fonoaudióloga en Chile").
- Primera frase enganchadora con la keyword principal.
- Termina SIEMPRE con un CTA al final: si es educativo invita a guardar/seguir; si es de venta invita
  a configurar su sitio sin costo y publicarlo desde $4.990/mes en agendamelo.cl (link en bio).
- PROHIBIDO: "gratis/prueba gratis/trial", "seña/anticipo/cobro online", "comisión", "Flow",
  "Isapres/Fonasa", recordatorios por WhatsApp/SMS (son por correo). NO incluyas hashtags ni asteriscos.

Posts:

${blocks}`;
}

function main() {
  const args = process.argv.slice(2);
  const rows = parse(readFileSync(CSV), { columns: true, skip_empty_lines: true, relax_quotes: true });
  const header = Object.keys(rows[0]);

  let targets;
  if (args.length === 0 || args[0] === 'all') targets = rows;
  else if (args[0] === 'short') targets = rows.filter((r) => (r.descripcion || '').length < 1200);
  else targets = rows.filter((r) => args.includes(r.id));

  if (targets.length === 0) { console.log('Nada que reescribir.'); return; }
  console.log(`Reescribiendo ${targets.length} descripción(es) en tandas de ${BATCH}...`);

  const byId = Object.fromEntries(rows.map((r) => [r.id, r]));
  for (let i = 0; i < targets.length; i += BATCH) {
    const batch = targets.slice(i, i + BATCH);
    console.log(`  Tanda ${Math.floor(i / BATCH) + 1}: ${batch.map((r) => r.id).join(', ')}`);
    const items = callCodex(promptFor(batch));
    for (const it of items) {
      if (byId[it.id] && it.descripcion) {
        byId[it.id].descripcion = it.descripcion.trim();
        console.log(`    ✓ ${it.id}  (${it.descripcion.trim().length} car.)`);
      }
    }
    writeFileSync(CSV, stringify(rows, { header: true, columns: header })); // guarda progreso por tanda
  }
  console.log('\nListo. Ejecuta: npm run lint');
}

main();
