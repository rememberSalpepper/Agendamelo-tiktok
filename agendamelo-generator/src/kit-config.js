// PUNTO ÚNICO DE CAMBIO — la verdad de precio de Agendamelo para TODO el bot de contenido.
// La usan el modo KIT (kit-prompt.js) y el modo IMAGEN (prompt.js), y la hace cumplir kit-validate.js.
//
// Verificado contra la oferta pública de agendamelo.cl el 2026-09-14. Esta es la única fuente de
// precios para prompts, validadores y piezas. Si cambia el sitio, se cambia aquí y se corren tests.

export const PLANES_PUBLICOS = Object.freeze({
  perfil: Object.freeze({ nombre: 'Perfil Gratis', precio: '$0', detalle: 'sitio público sin reservas online' }),
  estandar: Object.freeze({ nombre: 'Estándar', mensual: '$12.990', anual: '$64.000' }),
  pro: Object.freeze({ nombre: 'Web Pro', mensual: '$19.990' }),
});

export const PRICING_CANONICO = 'Perfil Gratis $0 (sitio público sin agenda) · Estándar $12.990/mes o $64.000/año · Web Pro $19.990/mes · publica 7 días gratis, sin tarjeta';

// CTA canónico de venta (el que preferimos que use el modelo en ambos modos).
export const CTA_CANONICO = 'Crea tu Perfil Gratis, sin tarjeta -> agendamelo.cl';

// Las ÚNICAS cifras que el bot puede presentar como precio de Agendamelo.
export const PRECIOS_AGENDAMELO = ['0', '12.990', '64.000', '19.990'];

// Precios que Agendamelo YA NO cobra. Se prohíben en cualquier parte del texto para que una
// regresión (o un modelo con memoria vieja) no los reviva.
export const PRECIOS_MUERTOS = ['4.990', '7.990'];
