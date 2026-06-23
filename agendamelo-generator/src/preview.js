// QA visual: renderiza una muestra de CADA plantilla (5) + un carrusel, cubriendo los 4 nichos,
// orientaciones y formatos. Sirve para revisar el diseño y confirmar que todo renderiza.
// Uso: npm run preview   ->  dist/_preview-*.png
import { renderToPng, renderCarousel, openBrowser } from './render.js';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const venta = (t) => ({ title: t, sub: 'Publica desde $4.990/mes · link en bio' });
const edu = (t, s) => ({ title: t, sub: s });

const imgs = [
  { niche: 'manicuristas', orientacion: 'educativo', tipo: 'stat', bg: 1,
    hook: 'Cuánto cobrar tu *semipermanente*', subtitle: 'El rango de mercado para que no regales tu trabajo.',
    figure: '$12.000–$18.000', figure_caption: 'es lo que cobra hoy una manicurista por semipermanente',
    source: 'precios de mercado en Chile',
    points: ['Define tu precio sin culpa', 'Muéstralo en tu sitio para no explicar por DM', 'Sube según tu nivel y zona'],
    note: 'Tu precio claro = clientas que llegan decididas.', cta: edu('Guarda este tip', 'Para tu salón de uñas') },

  { niche: 'psicopedagogas', orientacion: 'educativo', tipo: 'mito_realidad', bg: 3,
    hook: '¿Los apoderados *se acuerdan* solos?', subtitle: 'La diferencia entre una agenda firme y una con huecos.',
    mito: 'Los apoderados recuerdan solos la sesión del jueves.', realidad: 'Sin recordatorio por correo, varias se caen.',
    cierre: 'Recordatorio automático = sesión que se respeta.', cta: edu('Sígueme para más', 'Para tu consulta') },

  { niche: 'fonoaudiologas', orientacion: 'educativo', tipo: 'checklist', bg: 2,
    hook: 'Recupera *una hora cada lunes*', subtitle: 'Lo que hacen las fonoaudiólogas que dejan de coordinar de cero.',
    items: ['Bloquea el tratamiento semanal en bloque', 'Deja agendada la próxima sesión al terminar', 'Recordatorio por correo, no WhatsApp a las 11 PM', 'Muestra tu sitio para recibir derivaciones desde Google'],
    note: 'Menos coordinación, más terapia.', cta: edu('Guarda este tip', 'Para tu consulta') },

  { niche: 'profesores-paes', orientacion: 'venta', tipo: 'antes_despues', bg: 4,
    hook: 'Tus 20 alumnos en una *libreta*', subtitle: 'Lo que cambia cuando ordenas antes del peak PAES.',
    antes: ['Armas el horario a mano', '"¿También haces física?" por WhatsApp', 'Coordinas de cero cada semana', 'Clases perdidas por olvido'],
    despues: ['Cada alumno con su hora fija', 'Tus materias y precios en tu sitio', 'Clases recurrentes agendadas', 'Recordatorio por correo'],
    cierre: 'Tu mini-web + agenda en un solo lugar.', cta: venta('Arma tu agenda en 5 minutos') },

  { niche: 'manicuristas', orientacion: 'plataforma', tipo: 'feature', bg: 2,
    hook: 'Tus clientas reservan a las *11 PM*', subtitle: 'Mientras duermes, tu agenda se llena sola.',
    screen_slug: 'unas-belen', screen_title: 'Nails by Belén',
    rows: ['Semipermanente · $15.000', 'Soft gel · $22.000', 'Hoy 16:30'], button: 'Reservar hora',
    note: 'Mini-web con servicios, precios y reserva 24/7.', cta: edu('Míralo en agendamelo.cl', 'Link en bio') },
];

const carousel = {
  niche: 'fonoaudiologas', bg: 4,
  slides: [
    { tipo: 'portada', hook: 'Por esto pierdes *una hora cada lunes*', subtitle: 'Y cómo recuperarla sin contestar WhatsApp a las 11 PM.' },
    { tipo: 'punto', icon: 'repeat', title: 'El caos no es la 1ª sesión', text: 'Es coordinar de cero cada semana.',
      bullets: ['Apoderados que se confunden con el horario', 'WhatsApps de noche para reagendar', 'Cada hueco es un box vacío', 'El tratamiento semanal se interrumpe'] },
    { tipo: 'punto', icon: 'bell', title: 'Bloquea el tratamiento completo', text: 'Las sesiones recurrentes hacen el trabajo por ti.',
      bullets: ['Dejas las semanas reservadas en un paso', 'Recordatorio por correo antes de cada hora', 'El paciente no se pierde ninguna', 'Tu agenda ordenada sin esfuerzo'] },
    { tipo: 'cierre', title: 'Menos coordinación, *más terapia*', text: 'Tu mini-web + agenda en un solo lugar.',
      bullets: ['Tratamientos semanales protegidos', 'Recordatorios por correo', 'Derivaciones desde Google'], cta: venta('Configura tu sitio sin costo') },
  ],
};

const browser = await openBrowser();
try {
  let i = 0;
  for (const s of imgs) {
    i++;
    await renderToPng(s, join(ROOT, 'dist', `_preview-${String(i).padStart(2, '0')}-${s.tipo}.png`), browser);
    console.log('  ✓', `_preview-${String(i).padStart(2, '0')}-${s.tipo}.png`);
  }
  const paths = await renderCarousel(carousel, join(ROOT, 'dist', '_preview-09-carrusel'), browser);
  console.log(`  ✓ carrusel (${paths.length} láminas)`);
} finally {
  await browser.close();
}
console.log('Listo: muestras en dist/_preview-*.png');
