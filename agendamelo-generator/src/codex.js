// Helper compartido para invocar el Codex CLI con modelo y esfuerzo de razonamiento configurables.
// Lo usan generate.js, expand-descriptions.js y regen-hooks.js: todos arman sus args sobre esta base.
//
// Por defecto se usa SIEMPRE el modelo y el esfuerzo más altos (lo pidió el operador). Se puede bajar
// por entorno para correr tandas comparativas (más barato/rápido):
//   AGENDAMELO_CODEX_MODEL    modelo (-m). Default: gpt-5.5 (el más alto disponible).
//   AGENDAMELO_CODEX_EFFORT   esfuerzo: minimal|low|medium|high|xhigh. Default: xhigh (el más alto).
//
// El esfuerzo se pasa como `-c model_reasoning_effort="..."` (TOML: el valor va entre comillas).
// OJO: `xhigh` NO garantiza mejor copy — para texto persuasivo el lever principal es el PROMPT, no el
// dial. Si una tanda en xhigh no mejora los hooks, baja a medium (ver docs/LINEA-EDITORIAL.md).

const EFFORTS = new Set(['minimal', 'low', 'medium', 'high', 'xhigh']);
const DEFAULT_MODEL = 'gpt-5.5';   // el modelo más alto
const DEFAULT_EFFORT = 'xhigh';    // el esfuerzo más alto

function resolvedModel() {
  return (process.env.AGENDAMELO_CODEX_MODEL || DEFAULT_MODEL).trim() || DEFAULT_MODEL;
}
function resolvedEffort() {
  const e = (process.env.AGENDAMELO_CODEX_EFFORT || DEFAULT_EFFORT).trim().toLowerCase();
  return EFFORTS.has(e) ? e : DEFAULT_EFFORT;
}

// Args base de `codex exec` (sin --output-schema/--output-last-message ni el `-` final, que agrega
// cada script según su necesidad).
export function codexBaseArgs() {
  return ['exec', '--skip-git-repo-check', '-s', 'read-only',
    '-m', resolvedModel(),
    '-c', `model_reasoning_effort="${resolvedEffort()}"`];
}

// Resumen legible (para logs / /estado).
export function codexConfigLabel() {
  return `modelo=${resolvedModel()} · esfuerzo=${resolvedEffort()}`;
}
