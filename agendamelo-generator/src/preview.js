// QA visual: renderiza una muestra de CADA plantilla (5) + un carrusel del sprint de manicuristas.
// Uso: npm run preview   ->  dist/_preview-*.jpg
import { renderToPng, renderCarousel, openBrowser } from './render.js';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const venta = (t) => ({ title: t, sub: 'Página visible · sin tarjeta · agendamelo.cl' });
const edu = (t, s) => ({ title: t, sub: s });

const imgs = [
  { niche: 'manicuristas', orientacion: 'educativo', tipo: 'stat', bg: 1,
    hook: 'Cuánto cobrar tu *semipermanente*', subtitle: 'El rango de mercado para que no regales tu trabajo.',
    figure: '$12.000–$18.000', figure_caption: 'es lo que cobra hoy una manicurista por semipermanente',
    source: 'precios de mercado en Chile',
    points: ['Define tu precio sin culpa', 'Muéstralo en tu sitio para no explicar por DM', 'Sube según tu nivel y zona'],
    note: 'Tu precio claro = clientas que llegan decididas.', cta: edu('Guarda este tip', 'Para tu salón de uñas') },

  { niche: 'manicuristas', orientacion: 'educativo', tipo: 'mito_realidad', bg: 3,
    hook: 'Instagram *no confirma* tus horas', subtitle: 'Una foto bonita atrae. Un sistema claro convierte.',
    mito: 'Con subir diseños a Instagram basta para llenar la agenda.', realidad: 'La clienta necesita ver precio, hora y reservar sin esperar tu respuesta.',
    cierre: 'Instagram muestra tu trabajo. Tu página toma la reserva.', cta: edu('Guarda esta idea', 'Para tu estudio de uñas') },

  { niche: 'manicuristas', orientacion: 'educativo', tipo: 'checklist', bg: 2,
    hook: 'La mantención *no vive en el DM*', subtitle: 'Tres ajustes para que la clienta vuelva sin perseguirla.',
    items: ['Deja la próxima mantención reservada', 'Muestra servicios y precios en un solo link', 'Activa recordatorios por correo o WhatsApp'],
    note: 'Menos mensajes. Más horas confirmadas.', cta: edu('Guarda este sistema', 'Para tu estudio de uñas') },

  { niche: 'manicuristas', orientacion: 'venta', tipo: 'antes_despues', bg: 4,
    hook: 'Tu agenda *no cabe en WhatsApp*', subtitle: 'El cambio que nota primero tu clienta.',
    antes: ['Pregunta precio por DM', 'Cruzan cinco mensajes', 'La hora queda “por confirmar”'],
    despues: ['Ve servicios y valores', 'Elige una hora disponible', 'Recibe confirmación automática'],
    cierre: 'Tu página gratis ordena la primera impresión.', cta: venta('Crea tu Perfil Gratis') },

  { niche: 'manicuristas', orientacion: 'plataforma', tipo: 'feature', bg: 2,
    hook: 'Tus clientas reservan a las *11 PM*', subtitle: 'Mientras duermes, tu agenda se llena sola.',
    screen_slug: 'unas-belen', screen_title: 'Nails by Belén',
    rows: ['Semipermanente · $15.000', 'Soft gel · $22.000', 'Hoy 16:30'], button: 'Reservar hora',
    note: 'Mini-web con servicios, precios y reserva 24/7.', cta: venta('Crea tu Perfil Gratis') },
];

const carousel = {
  niche: 'manicuristas', bg: 4,
  slides: [
    { tipo: 'portada', hook: 'La clienta preguntó precio y *desapareció*', subtitle: 'No siempre fue caro. A veces fue demasiado difícil reservar.' },
    { tipo: 'punto', icon: 'chat', title: 'La fricción está en el chat', text: 'Cada respuesta pendiente enfría la intención.',
      bullets: ['Pregunta por valor y duración', 'Espera tu respuesta', 'Vuelve a preguntar por horarios'] },
    { tipo: 'punto', icon: 'phone', title: 'Un link responde por ti', text: 'Tu página muestra lo necesario antes de reservar.',
      bullets: ['Servicios y precios claros', 'Fotos de tus diseños', 'Horas disponibles en tiempo real'], highlight: 'Menos vueltas antes del “confirmado”.' },
    { tipo: 'cierre', title: 'Haz fácil decirte que *sí*', text: 'Tu mini-web + agenda en un solo lugar.',
      bullets: ['Página visible', 'Botón a WhatsApp', 'Agenda online al activarla'], cta: venta('Crea tu Perfil Gratis') },
  ],
};

const browser = await openBrowser();
try {
  let i = 0;
  for (const s of imgs) {
    i++;
    await renderToPng(s, join(ROOT, 'dist', `_preview-${String(i).padStart(2, '0')}-${s.tipo}.jpg`), browser);
    console.log('  ✓', `_preview-${String(i).padStart(2, '0')}-${s.tipo}.jpg`);
  }
  const paths = await renderCarousel(carousel, join(ROOT, 'dist', '_preview-09-carrusel'), browser);
  console.log(`  ✓ carrusel (${paths.length} láminas)`);
} finally {
  await browser.close();
}
console.log('Listo: muestras en dist/_preview-*.jpg');
