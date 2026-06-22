// Carga el archivo .env (si existe) en process.env. Importar PRIMERO en los scripts de entrada.
// Así no hay que pasar el token ni el chat id en cada comando.

import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ENV = join(dirname(fileURLToPath(import.meta.url)), '..', '.env');
if (existsSync(ENV)) {
  try { process.loadEnvFile(ENV); }
  catch (e) { console.error('No pude cargar .env:', e.message); }
}
