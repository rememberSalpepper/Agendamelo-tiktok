// PUNTO ÚNICO DE CAMBIO — Pricing 2.0 para el modo "kit de video" (TikTok/Reels).
//
// HOY (Pricing 2.0 NO deployado en agendamelo.cl): PRICING_20_LIVE = false.
//   → Ningún kit se centra en el precio ni en "no es prueba gratis" (ambas cosas están por cambiar
//     en el sitio). El generador NO menciona cifras de precio, ni "gratis", ni "prueba/trial", y la
//     validación (kit-validate.js) rechaza esos términos. El CTA es de DESCUBRIMIENTO
//     ("Búscalo: agendamelo.cl"), no de oferta.
//
// CUANDO Pricing 2.0 esté en PRODUCCIÓN en agendamelo.cl:
//   1) Cambia PRICING_20_LIVE a true (única línea que hay que tocar aquí).
//   2) La verdad de precio pasa a PRICING.nuevo y se habilita "publica gratis 7 días sin tarjeta".
//   3) Actualiza también src/prompt.js y el CLAUDE.md raíz (el precio del modo IMAGEN es aparte).
// Contexto: PLAN-CANALES-2026-07.md §1 y la nota de CLAUDE.md (2026-07-02).

export const PRICING_20_LIVE = false;

// Verdades de precio (referencia; hoy NO se inyectan en los kits porque no se centran en precio).
export const PRICING = {
  // Verdad canónica del sitio HASTA que Pricing 2.0 fase 1 esté en producción.
  actual: '$4.990 el primer mes, luego $7.990/mes, sin contrato ni comisión (configurar sin costo; publicar cuesta desde el día 1; no es prueba gratis)',
  // Verdad DESDE el deploy de Pricing 2.0 fase 1 (repo reservaHoras).
  nuevo: '$12.990/mes · plan anual $64.000 · publica gratis 7 días sin tarjeta',
};
