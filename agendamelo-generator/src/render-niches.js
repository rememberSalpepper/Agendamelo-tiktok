// Showcase local: 6 nichos × 3 orientaciones × plantillas nuevas (stat/feature/comparacion).
// Uso: node src/render-niches.js   -> genera dist/_show-NN-<niche>-<orient>.png
import { renderToPng, openBrowser } from './render.js';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const samples = [
  // 1) BARBERÍAS — venta — comparacion
  { niche: 'barberias', orientacion: 'venta', tipo: 'comparacion', bg: 1,
    hook: '2 sillas vacías al día = *$400 mil al mes*',
    subtitle: 'La plata que se va por no tener agenda online.',
    antes: ['Respondes el celular a cada rato', 'Clientes que no llegan', 'Horas muertas entre citas', 'Nadie te encuentra en Google'],
    despues: ['Reservan solos, 24/7', 'Recordatorio automático', 'Agenda llena y ordenada', 'Apareces en Google'],
    cierre: 'Mini-web + agenda en un solo lugar.',
    cta: { title: 'Crea tu mini-web', sub: 'Link en bio · agendamelo.cl' } },

  // 2) MANICURE — plataforma — feature (mockup del sitio)
  { niche: 'manicure', orientacion: 'plataforma', tipo: 'feature', bg: 2,
    hook: 'Tus clientas reservan a las *11 PM*',
    subtitle: 'Mientras duermes, tu agenda se llena sola.',
    screen_slug: 'unas-belen', screen_title: 'Nails by Belén',
    rows: ['Semipermanente · $15.000', 'Soft gel · $22.000', 'Hoy 16:30'],
    button: 'Reservar hora',
    note: 'Tu mini-web con servicios, precios y reserva online.',
    cta: { title: 'Míralo en agendamelo.cl', sub: 'Link en bio' } },

  // 3) PSICOPEDAGOGÍA — educativo — stat
  { niche: 'psicopedagogos', orientacion: 'educativo', tipo: 'stat', bg: 3,
    hook: 'Te googlean antes de *confiarte a su hijo*',
    subtitle: 'Sin presencia online, el apoderado elige a otro.',
    figure: '80%',
    figure_caption: 'de los apoderados busca apoyo escolar por internet',
    points: ['Una mini-web te da presencia profesional', 'Apareces en Google por tu comuna', 'Reservan la evaluación sin llamar'],
    note: 'Estar online ya no es opcional.',
    cta: { title: 'Sígueme para más', sub: 'Tips para tu consulta' } },

  // 4) PSICOLOGÍA — plataforma — feature (citas recurrentes)
  { niche: 'psicologos', orientacion: 'plataforma', tipo: 'feature', bg: 1,
    hook: '¿Reagendas la sesión *cada semana*?',
    subtitle: 'Las citas recurrentes lo hacen una sola vez.',
    screen_slug: 'psi-rojas', screen_title: 'Consulta J. Rojas',
    rows: ['Sesión semanal · Lun 10:00', 'Repetir por 8 semanas', 'Confirmado'],
    button: 'Agendar serie',
    note: 'Citas recurrentes + recordatorio cada semana.',
    cta: { title: 'Míralo en agendamelo.cl', sub: 'Link en bio' } },

  // 5) KINESIOLOGÍA — educativo — stat
  { niche: 'kinesiologos', orientacion: 'educativo', tipo: 'stat', bg: 4,
    hook: 'Kinesiólogo: 1 de cada 3 *no termina*',
    subtitle: 'La terapia que se corta no rehabilita.',
    figure: '1 de 3',
    figure_caption: 'pacientes deja la rehabilitación antes de tiempo',
    points: ['Agenda toda la serie de sesiones junta', 'Recordatorio antes de cada hora', 'Menos ausencias, más altas'],
    note: 'La constancia también se agenda.',
    cta: { title: 'Guarda este tip', sub: 'Para tu consulta kine' } },

  // 6) PROFESORES — venta — comparacion
  { niche: 'profesores', orientacion: 'venta', tipo: 'comparacion', bg: 2,
    hook: 'Cada cambio por WhatsApp te *cuesta un alumno*',
    subtitle: 'Ordena tus clases particulares de una vez.',
    antes: ['Cadenas de mensajes con apoderados', 'Clases que se cancelan', 'Cupos que quedan vacíos', 'Cobrar a la suerte'],
    despues: ['Reservan el horario fijo online', 'Recordatorio automático', 'Cupos llenos y visibles', 'Todo en tu panel'],
    cierre: 'Tu horario del semestre, agendado solo.',
    cta: { title: 'Arma tu agenda', sub: 'Link en bio · agendamelo.cl' } },
];

const browser = await openBrowser();
try {
  let i = 0;
  for (const s of samples) {
    i++;
    const file = `_show-${String(i).padStart(2, '0')}-${s.niche}-${s.orientacion}.png`;
    await renderToPng(s, join(ROOT, 'dist', file), browser);
    console.log('  ✓', file, `(${s.tipo})`);
  }
} finally {
  await browser.close();
}
console.log(`Listo: ${samples.length} muestras en dist/`);
