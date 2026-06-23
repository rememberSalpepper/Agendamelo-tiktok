// QA visual: renderiza una muestra de CADA plantilla (8) + un carrusel, cubriendo nichos,
// orientaciones y formatos. Sirve para revisar el diseño y confirmar que todo renderiza.
// Uso: npm run preview   ->  dist/_preview-*.png
import { renderToPng, renderCarousel, openBrowser } from './render.js';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const venta = (t) => ({ title: t, sub: 'Link en bio · agendamelo.cl' });
const edu = (t, s) => ({ title: t, sub: s });

const imgs = [
  { niche: 'barberias', orientacion: 'educativo', tipo: 'checklist', bg: 1,
    hook: '5 formas de llenar tus *horas muertas*',
    subtitle: 'Lo que hacen las barberías que siempre están llenas.',
    items: ['Reserva online 24/7', 'Recordatorio el día antes', 'Promos en horarios bajos', 'Pide reseña tras cada corte', 'Aparece en Google'],
    note: 'Constancia y orden: así se llena una agenda.', cta: edu('Guarda este tip', 'Para tu barbería') },

  { niche: 'manicure', orientacion: 'plataforma', tipo: 'base_3_cards', bg: 2,
    hook: 'Deja de agendar por *DM*', subtitle: 'Tus clientas reservan solas, tú pintas tranquila.',
    cards: [
      { icon: 'calendar', title: 'Reserva sola', text: 'Eligen servicio, día y hora.' },
      { icon: 'bell', title: 'Menos plantones', text: 'Recordatorio antes de la cita.' },
      { icon: 'star', title: 'Luce tu trabajo', text: 'Galería de tus diseños.' },
    ], note: 'Tu salón ordenado en 5 minutos.', cta: edu('Míralo en agendamelo.cl', 'Link en bio') },

  { niche: 'psicologos', orientacion: 'educativo', tipo: 'mito_realidad', bg: 3,
    hook: '¿Las *sesiones* se te caen?', subtitle: 'La diferencia entre una agenda llena y una con huecos.',
    mito: 'Mis pacientes se acuerdan solos de su hora.', realidad: 'Sin recordatorio, 1 de cada 5 se cae.',
    cierre: 'Recordatorio automático = agenda que se respeta.', cta: edu('Sígueme para más', 'Para tu consulta') },

  { niche: 'profesores', orientacion: 'venta', tipo: 'piramide', bg: 4,
    hook: 'Llena tus *cupos* sin enredos', subtitle: 'Lo que sostiene clases que no se cancelan.',
    pyramid: { top: 'Apoderados felices', mid: 'Recordatorios y horarios', base: 'Reserva de cupos online' },
    cierre: 'Coordina sin cadenas de WhatsApp.', cta: venta('Crea tu mini-web') },

  { niche: 'kinesiologos', orientacion: 'plataforma', tipo: 'proceso', bg: 2,
    hook: 'Agenda la *serie completa* en un clic', subtitle: 'Citas recurrentes hechas para rehabilitación.',
    steps: ['Crea la sesión', 'Define la frecuencia', 'Repite por 8 semanas', 'Recordatorio automático'],
    cierre: 'El paciente no abandona la terapia.', cta: edu('Míralo en agendamelo.cl', 'Link en bio') },

  { niche: 'psicopedagogos', orientacion: 'educativo', tipo: 'stat', bg: 3,
    hook: 'Te googlean antes de *confiarte a su hijo*', subtitle: 'Sin presencia online, el apoderado elige a otro.',
    figure: '80%', figure_caption: 'de los apoderados busca apoyo escolar por internet',
    points: ['Una mini-web te da presencia', 'Apareces en Google por tu comuna', 'Reservan la evaluación sin llamar'],
    note: 'Estar online ya no es opcional.', cta: edu('Sígueme para más', 'Tips para tu consulta') },

  { niche: 'manicure', orientacion: 'plataforma', tipo: 'feature', bg: 2,
    hook: 'Tus clientas reservan a las *11 PM*', subtitle: 'Mientras duermes, tu agenda se llena sola.',
    screen_slug: 'unas-belen', screen_title: 'Nails by Belén',
    rows: ['Semipermanente · $15.000', 'Soft gel · $22.000', 'Hoy 16:30'], button: 'Reservar hora',
    note: 'Mini-web con servicios, precios y reserva online.', cta: edu('Míralo en agendamelo.cl', 'Link en bio') },

  { niche: 'barberias', orientacion: 'venta', tipo: 'comparacion', bg: 1,
    hook: '2 sillas vacías al día = *$400 mil al mes*', subtitle: 'La plata que se va por no tener agenda online.',
    antes: ['Respondes a cada rato', 'Clientes que no llegan', 'Horas muertas', 'Nadie te halla en Google'],
    despues: ['Reservan solos 24/7', 'Recordatorio automático', 'Agenda llena', 'Apareces en Google'],
    cierre: 'Mini-web + agenda en un solo lugar.', cta: venta('Crea tu mini-web') },
];

const carousel = {
  niche: 'kinesiologos', bg: 4,
  slides: [
    { tipo: 'portada', hook: 'Por esto tus pacientes *no terminan* la terapia', subtitle: 'Y cómo lograr que completen su recuperación.' },
    { tipo: 'punto', icon: 'repeat', title: 'El problema no es la 1ª sesión', text: 'Es la 4ª, la 6ª, la que se olvida. Sin sistema, la serie se corta.' },
    { tipo: 'punto', icon: 'bell', title: 'Agéndalas todas de una vez', text: 'Con citas recurrentes dejas las 8 sesiones y el paciente recibe recordatorio.' },
    { tipo: 'cierre', title: 'Menos ausencias, *más altas*', text: 'Tu agenda kine ordenada en un solo lugar.', cta: venta('Crea tu agenda online') },
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
