// Render de muestra (temporal): 3 nichos distintos para aprobar la estética por rubro.
// Uso: node src/render-samples.js   -> genera PNGs en dist/_sample-*.png
import { renderToPng, openBrowser } from './render.js';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const samples = [
  {
    file: '_sample-barberia.png',
    niche: 'barberias', tipo: 'checklist', bg: 1,
    hook: 'Tu *silla vacía* es plata que se va',
    subtitle: 'Cada hora sin reserva es un corte que no cobraste.',
    items: [
      'Agenda online abierta 24/7',
      'Recordatorio automático al cliente',
      'Menos cortes que no llegan',
      'Combo corte + barba reservable',
      'Tu barbería aparece en Google',
    ],
    note: 'Sin no-shows: el sistema confirma y recuerda solo.',
    cta: { title: 'Crea tu agenda online', sub: 'Link en bio · agendamelo.cl' },
  },
  {
    file: '_sample-manicure.png',
    niche: 'manicure', tipo: 'base_3_cards', bg: 2,
    hook: 'Deja de agendar por *DM*',
    subtitle: 'Tus clientas reservan solas, tú pintas tranquila.',
    cards: [
      { icon: 'calendar', title: 'Reserva sola', text: 'Eligen servicio, día y hora sin escribirte.' },
      { icon: 'bell', title: 'Menos plantones', text: 'Recordatorio automático antes de la cita.' },
      { icon: 'sparkles', title: 'Luce tu trabajo', text: 'Galería de tus diseños en tu mini-web.' },
    ],
    note: 'Tu salón de uñas, ordenado en 5 minutos.',
    cta: { title: 'Arma tu mini-web', sub: 'Link en bio · agendamelo.cl' },
  },
  {
    file: '_sample-psicologo.png',
    niche: 'psicologos', tipo: 'mito_realidad', bg: 3,
    hook: '¿Las *sesiones* se te caen?',
    subtitle: 'La diferencia entre una agenda llena y una con huecos.',
    mito: 'Mis pacientes se acuerdan solos de su próxima hora.',
    realidad: 'Sin recordatorio, 1 de cada 5 sesiones se olvida o se cae.',
    cierre: 'Recordatorio automático = agenda que se respeta.',
    cta: { title: 'Ordena tu consulta', sub: 'Link en bio · agendamelo.cl' },
  },
];

const browser = await openBrowser();
try {
  for (const s of samples) {
    const out = join(ROOT, 'dist', s.file);
    await renderToPng(s, out, browser);
    console.log('  ✓', s.file);
  }
} finally {
  await browser.close();
}
console.log('Listo: muestras en dist/');
