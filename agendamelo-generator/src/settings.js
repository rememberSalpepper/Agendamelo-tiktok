// Ajustes de operación persistidos FUERA de git (igual que el CSV vivo): nicho activo y estilo de
// caption. Los maneja el operador desde Telegram (/nicho, /estilo) y los leen generate.js y caption.js.
//
// Archivo: agendamelo_settings.json junto al CSV (override con AGENDAMELO_SETTINGS).

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NICHE_KEYS } from './niches.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FILE = process.env.AGENDAMELO_SETTINGS || join(ROOT, '..', 'agendamelo_settings.json');

// Sprint en curso: foco 100% en manicuristas y caption largo por defecto.
const DEFAULTS = { nicho: 'manicuristas', estilo_caption: 'largo' };

export const ESTILOS = ['corto', 'largo'];

export function getSettings() {
  let saved = {};
  if (existsSync(FILE)) {
    try { saved = JSON.parse(readFileSync(FILE, 'utf8')) || {}; }
    catch { saved = {}; } // archivo corrupto: caemos a defaults, no rompemos la operación
  }
  const s = { ...DEFAULTS, ...saved };
  // Saneo: valores fuera de rango vuelven al default.
  if (!NICHE_KEYS.includes(s.nicho)) s.nicho = DEFAULTS.nicho;
  if (!ESTILOS.includes(s.estilo_caption)) s.estilo_caption = DEFAULTS.estilo_caption;
  return s;
}

// Cambia el nicho activo. Devuelve {ok, value|error}.
export function setNicho(slug) {
  const v = String(slug || '').trim();
  if (!NICHE_KEYS.includes(v)) {
    return { ok: false, error: `Nicho inválido "${v}". Opciones: ${NICHE_KEYS.join(', ')}.` };
  }
  return save({ nicho: v });
}

// Cambia el estilo de caption (corto|largo). Devuelve {ok, value|error}.
export function setEstilo(estilo) {
  const v = String(estilo || '').trim().toLowerCase();
  if (!ESTILOS.includes(v)) {
    return { ok: false, error: `Estilo inválido "${v}". Usa: ${ESTILOS.join(' | ')}.` };
  }
  return save({ estilo_caption: v });
}

function save(patch) {
  const next = { ...getSettings(), ...patch };
  writeFileSync(FILE, JSON.stringify(next, null, 2) + '\n');
  return { ok: true, value: next };
}
