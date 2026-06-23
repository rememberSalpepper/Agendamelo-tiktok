// Muestras para revisar: 3 imágenes distintas (otras plantillas, foco educativo/valor).
import { renderToPng, openBrowser } from './render.js';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const samples = [
  // 1) BARBERÍAS — educativo — checklist (tips accionables)
  { niche: 'barberias', orientacion: 'educativo', tipo: 'checklist', bg: 1,
    hook: '5 formas de llenar tus *horas muertas*',
    subtitle: 'Lo que hacen las barberías que siempre están llenas.',
    items: [
      'Reserva online abierta 24/7',
      'Recordatorio el día antes',
      'Promos en tus horarios bajos',
      'Pide reseña tras cada corte',
      'Aparece en Google por tu comuna',
    ],
    note: 'Constancia y orden: así se llena una agenda.',
    cta: { title: 'Guarda este tip', sub: 'Para tu barbería' } },

  // 2) MANICURE — educativo — mito_realidad (rompe un mito, enseña)
  { niche: 'manicure', orientacion: 'educativo', tipo: 'mito_realidad', bg: 3,
    hook: 'El *mito* que te llena de plantones',
    subtitle: 'Por esto tus clientas no llegan (y cómo evitarlo).',
    mito: 'Pedir confirmación o seña espanta a las clientas.',
    realidad: 'Confirmar la cita baja los no-shows casi a la mitad.',
    cierre: 'Confirmar no molesta: ordena tu día.',
    cta: { title: 'Sígueme para más', sub: 'Tips para tu salón' } },

  // 3) PROFESORES — plataforma — proceso (cómo funciona, citas recurrentes)
  { niche: 'profesores', orientacion: 'plataforma', tipo: 'proceso', bg: 2,
    hook: 'Deja de *perseguir apoderados* por WhatsApp',
    subtitle: 'Arma el horario del semestre una sola vez.',
    steps: [
      'Crea tus clases y cupos',
      'Define tu horario fijo',
      'Comparte tu link',
      'Se reserva y se repite solo',
    ],
    cierre: 'Citas recurrentes para todo el semestre.',
    cta: { title: 'Míralo en agendamelo.cl', sub: 'Link en bio' } },
];

const browser = await openBrowser();
try {
  let i = 0;
  for (const s of samples) {
    i++;
    const file = `_rev-${String(i).padStart(2, '0')}-${s.niche}-${s.tipo}.png`;
    await renderToPng(s, join(ROOT, 'dist', file), browser);
    console.log('  ✓', file);
  }
} finally {
  await browser.close();
}
console.log('Listo: 3 muestras en dist/');
