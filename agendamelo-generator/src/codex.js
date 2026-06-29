// Helper compartido para invocar el Codex CLI con modelo y esfuerzo de razonamiento configurables.
// Lo usan generate.js, expand-descriptions.js y regen-hooks.js: todos arman sus args sobre esta base.
//
// Variables de entorno:
//   AGENDAMELO_CODEX_MODEL    modelo (-m). Si no se define, usa el default de la sesión de Codex.
//   AGENDAMELO_CODEX_EFFORT   esfuerzo de razonamiento: minimal|low|medium|high|xhigh (default: medium).
//
// El esfuerzo se pasa como `-c model_reasoning_effort="..."` (TOML: el valor va entre comillas).
// OJO: `high` NO garantiza mejor copy — para texto persuasivo el lever principal es el PROMPT, no el
// dial. Se deja seteable para correr tandas comparativas (ver docs/LINEA-EDITORIAL.md).

const EFFORTS = new Set(['minimal', 'low', 'medium', 'high', 'xhigh']);

// Args base de `codex exec` (sin --output-schema/--output-last-message ni el `-` final, que agrega
// cada script según su necesidad).
export function codexBaseArgs() {
  const args = ['exec', '--skip-git-repo-check', '-s', 'read-only'];
  const model = (process.env.AGENDAMELO_CODEX_MODEL || '').trim();
  if (model) args.push('-m', model);
  const effort = (process.env.AGENDAMELO_CODEX_EFFORT || 'medium').trim().toLowerCase();
  if (EFFORTS.has(effort)) args.push('-c', `model_reasoning_effort="${effort}"`);
  return args;
}

// Resumen legible (para logs / /estado).
export function codexConfigLabel() {
  const model = (process.env.AGENDAMELO_CODEX_MODEL || 'default').trim() || 'default';
  const effort = (process.env.AGENDAMELO_CODEX_EFFORT || 'medium').trim().toLowerCase();
  return `modelo=${model} · esfuerzo=${EFFORTS.has(effort) ? effort : 'medium'}`;
}
