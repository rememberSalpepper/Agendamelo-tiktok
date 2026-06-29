// Regenera SOLO los hooks de una idea (3-5 variantes nuevas con su ángulo), sin tocar imagen,
// descripción ni demás campos. Deja hook_elegido vacío para forzar una nueva elección en /revisar.
//
// Uso:  node src/regen-hooks.js <id>

import './env.js';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { ANGULOS } from './prompt.js';
import { getNiche } from './niches.js';
import { codexBaseArgs } from './codex.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CSV = process.env.AGENDAMELO_CSV || join(ROOT, '..', 'agendamelo_ideas.csv');
const strip = (s) => String(s || '').replace(/\*(.+?)\*/g, '$1');

const schema = {
  type: 'object', additionalProperties: false, required: ['variantes'],
  properties: {
    variantes: {
      type: 'array', minItems: 3, maxItems: 5,
      items: {
        type: 'object', additionalProperties: false, required: ['texto', 'angulo'],
        properties: { texto: { type: 'string' }, angulo: { type: 'string', enum: ANGULOS } },
      },
    },
  },
};

function promptFor(row) {
  const n = getNiche(row.niche);
  let shows = '';
  try {
    const c = JSON.parse(row.imagen_json);
    shows = [c.subtitle, c.figure, c.mito, c.realidad, c.note, ...(c.items || []), ...(c.antes || [])]
      .filter(Boolean).slice(0, 4).join(' | ');
  } catch { /* ignora */ }
  let previos = '';
  try { previos = (JSON.parse(row.hook_variantes) || []).map((v) => `· ${v.texto}`).join('\n'); } catch { /* ignora */ }

  return `Eres el mejor estratega de hooks de TikTok para Agendamelo (mini-web profesional + agenda
online para profesionales en Chile). Regenera los HOOKS de UN post de ${n.label}.

Contexto del post:
- Nicho: ${row.niche}. Jerga (úsala VERBATIM): ${n.jerga}
- Dolor real del rubro: ${n.dolor}
- Orientación: ${row.orientacion} · plantilla: ${row.tipo_plantilla} · tema: ${row.tema}
- Lo que muestra la imagen: ${shows || '(no disponible)'}

Hooks anteriores (NO los repitas, busca ángulos y frases distintas):
${previos || '(ninguno)'}

Entrega 3 a 5 hooks NUEVOS, cada uno {texto, angulo}. Reglas de cada hook:
- MÁXIMO 12 palabras (ideal 6-10). Es un DOLOR concreto o una CURIOSIDAD, NUNCA un tema.
- La KEYWORD del nicho va DENTRO del hook (uñas/semipermanente/clientas, etc.).
- Sobre el espectador (su plata/tiempo/clientes), no sobre Agendamelo. Concreto: números, plata, tiempo.
- Envuelve UNA frase clave entre *asteriscos*. Español neutro/chileno, PROHIBIDO el voseo argentino
  (vos/tenés/querés/mirá/dale...). El voseo chileno (tenís/podís/cachái) ok solo en manicure, moderado.
- Ángulos disponibles (campo "angulo"), uno por variante y DISTINTOS entre sí: ${ANGULOS.join(', ')}.

Devuelve SOLO el JSON {variantes:[{texto, angulo}]}.`;
}

function callCodex(prompt) {
  const sf = join(tmpdir(), 'agendamelo-hooks-schema.json');
  const of = join(tmpdir(), 'agendamelo-hooks-out.json');
  writeFileSync(sf, JSON.stringify(schema));
  execFileSync('codex', [...codexBaseArgs(), '--output-schema', sf, '--output-last-message', of, '-'],
    { input: prompt, stdio: ['pipe', 'ignore', 'inherit'], timeout: 300000 });
  return JSON.parse(readFileSync(of, 'utf8')).variantes || [];
}

function clean(variants) {
  return (Array.isArray(variants) ? variants : [])
    .filter((v) => v && typeof v.texto === 'string' && v.texto.trim() && ANGULOS.includes(v.angulo))
    .map((v) => ({ texto: v.texto.trim(), angulo: v.angulo }))
    .slice(0, 5);
}

function main() {
  const id = process.argv[2];
  if (!id) { console.error('Uso: node src/regen-hooks.js <id>'); process.exit(1); }
  const rows = parse(readFileSync(CSV), { columns: true, skip_empty_lines: true, relax_quotes: true });
  const row = rows.find((r) => r.id === id);
  if (!row) { console.error(`No encontré ${id}.`); process.exit(1); }

  console.log(`Regenerando hooks de ${id} (${row.niche})...`);
  const variants = clean(callCodex(promptFor(row)));
  if (variants.length < 3) { console.error(`Codex devolvió ${variants.length} variantes válidas (<3).`); process.exit(1); }

  row.hook_variantes = JSON.stringify(variants);
  row.hook = variants[0].texto;       // provisional hasta nueva elección
  row.angulo = variants[0].angulo;
  row.hook_elegido = '';              // fuerza re-elegir en /revisar
  writeFileSync(CSV, stringify(rows, { header: true, columns: Object.keys(rows[0]) }));
  console.log(`OK: ${variants.length} hooks nuevos. Usa /revisar para elegir.`);
  for (const v of variants) console.log(`  · [${v.angulo}] ${strip(v.texto)}`);
}

main();
