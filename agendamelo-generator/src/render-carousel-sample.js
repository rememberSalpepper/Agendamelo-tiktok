// Muestra de carrusel (3 slides: portada -> punto -> cierre) para revisar el formato nuevo.
import { renderCarousel, openBrowser } from './render.js';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const data = {
  niche: 'kinesiologos', bg: 4,
  slides: [
    { tipo: 'portada',
      hook: 'Por esto tus pacientes *no terminan* la terapia',
      subtitle: 'Y cómo lograr que completen su recuperación.' },
    { tipo: 'punto', icon: 'repeat',
      title: 'El problema no es la primera sesión',
      text: 'Es la 4ª, la 6ª, la que se olvida. Sin un sistema, la serie se corta y la rehabilitación no funciona.' },
    { tipo: 'punto', icon: 'bell',
      title: 'Agéndalas todas de una vez',
      text: 'Con citas recurrentes dejas las 8 sesiones reservadas y el paciente recibe un recordatorio antes de cada hora.' },
    { tipo: 'cierre',
      title: 'Menos ausencias, *más altas*',
      text: 'Tu agenda kine ordenada en un solo lugar, con recordatorios automáticos.',
      cta: { title: 'Crea tu agenda online', sub: 'Link en bio · agendamelo.cl' } },
  ],
};

const browser = await openBrowser();
try {
  const paths = await renderCarousel(data, join(ROOT, 'dist', '_carrusel'), browser);
  paths.forEach((p) => console.log('  ✓', p.split('/').pop()));
} finally {
  await browser.close();
}
console.log('Listo: carrusel en dist/_carrusel-*.png');
