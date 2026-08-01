// PUNTO ÚNICO DE CAMBIO — la verdad de precio de Agendamelo para TODO el bot de contenido.
// La usan el modo KIT (kit-prompt.js) y el modo IMAGEN (prompt.js), y la hace cumplir kit-validate.js.
//
// Pricing 2.0 está EN PRODUCCIÓN en agendamelo.cl desde el 2026-07-14, así que aquí hay UNA sola
// verdad y ya no un switch: el switch PRICING_20_LIVE existía para un evento que ya ocurrió y dejarlo
// puesto era el riesgo de que alguien lo volviera a false y el bot mintiera otra vez.
// Fuente en el producto: lib/pricing-rules.ts del repo reservaHoras.

export const PRICING_CANONICO = '$12.990/mes · plan anual $64.000 · publica gratis 7 días, sin tarjeta';

// CTA canónico de venta (el que preferimos que use el modelo en ambos modos).
export const CTA_CANONICO = 'Publica gratis 7 días, sin tarjeta -> agendamelo.cl';

// Las ÚNICAS cifras que el bot puede presentar como PRECIO DE AGENDAMELO.
// El plan fundador ($49.990/año) NO entra aquí a propósito: es palanca de outreach por DM, nunca
// contenido público.
export const PRECIOS_AGENDAMELO = ['12.990', '64.000'];

// Precios que Agendamelo YA NO cobra. Se prohíben en cualquier parte del texto para que una
// regresión (o un modelo con memoria vieja) no los reviva.
export const PRECIOS_MUERTOS = ['4.990', '7.990'];
