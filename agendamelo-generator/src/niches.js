// Identidad por rubro (nicho) de Agendamelo — v3 (4 nichos activos de la línea editorial).
// FUENTE ÚNICA de la "capa de nicho": color de acento, ícono, etiqueta y voz/jerga.
// El render usa `accent`/`accent2`/`soft` para recolorear toda la imagen, e `icon` para el badge.
// El prompt usa `jerga`, `dolor`, `recurrente`, `voz` y `datos` para hablar el idioma real del rubro.
//
// Spine que une los 4: "agenda lo que se repite — clientes que vuelven".
// Reparto objetivo por lote: ~30% manicuristas, ~25% psicopedagogas, ~25% profesores-paes,
// ~20% fonoaudiologas. (Manicure aporta reach; las otras tres, conversión de alto LTV.)

export const NICHES = {
  manicuristas: {
    label: 'Manicuristas',
    accent: '#DB2777', accent2: '#F472B6', soft: '#FCE9F2',
    icon: 'sparkle', badge: 'Para tu salón de uñas',
    jerga: 'clienta, esmaltado, semipermanente, soft gel, kapping, acrílico, diseño, set de uñas, manicure/pedicure, retoque/mantención, nail art',
    dolor: 'tu Instagram se ve poco profesional + pierdes clientas coordinando por WhatsApp + explicar precios por DM una y otra vez',
    recurrente: 'deja agendada la próxima mantención al terminar: tu clienta vuelve sola cada 3-4 semanas',
    voz: 'la más jugada y chilena de las cuatro (po, cachái, te juro, bacán, brígido); voseo chileno (tenís/podís/cachái) ok en hooks; emojis liberales 💅 ✨ 🌸',
    datos: 'manicure clásica $8.000–$12.000; semipermanente $12.000–$18.000; pedicure $12.000–$16.000 (fuente: precios de mercado en Chile)',
    hashtags: ['#manicurechile', '#nailtechchile', '#unaschile', '#semipermanente', '#manicurista', '#emprendedoraschile'],
  },
  psicopedagogas: {
    label: 'Psicopedagogas',
    accent: '#D97706', accent2: '#F59E0B', soft: '#FDF3E2',
    icon: 'lightbulb', badge: 'Para tu consulta',
    jerga: 'apoderado, sesión, evaluación/diagnóstico psicopedagógico, plan de tratamiento, dificultades de aprendizaje, derivación, entrevista',
    dolor: 'contestar mensajes de apoderados a cualquier hora para cuadrar la sesión del jueves + coordinar de cero cada semana + precios escondidos',
    recurrente: 'bloquea la hora del paciente por 3 meses y deja de coordinar de cero cada semana',
    voz: 'cálida, respetuosa, de colega; slang mínimo; sobria en temas de niños',
    datos: 'sesión semanal de 45 min $20.000–$50.000; evaluación inicial $40.000–$90.000; online 10–15% más económica (fuente: precios de mercado en Chile)',
    hashtags: ['#psicopedagogia', '#psicopedagogachile', '#educacionchile', '#apoderados', '#dificultadesdeaprendizaje', '#emprendimientochile'],
  },
  'profesores-paes': {
    label: 'Profes particulares',
    accent: '#2563EB', accent2: '#3B82F6', soft: '#E6EEFD',
    icon: 'book', badge: 'Para tus clases',
    jerga: 'alumno, materia/asignatura, PAES, preuniversitario, refuerzo, online/presencial, clase recurrente',
    dolor: 'armar el horario en una libreta + alumnos que preguntan "¿también haces física?" + coordinar de cero cada semana + clases perdidas por olvido',
    recurrente: 'tus alumnos fijos quedan con su hora del lunes y dejas de coordinar todo de cero cada semana',
    voz: 'cercano y motivador; slang con moderación; usa el peak PAES como gatillo de urgencia',
    datos: 'clase particular $10.000–$35.000/60 min; matemáticas y PAES $15.000–$30.000; online 10–15% más económica (fuente: precios de mercado en Chile)',
    hashtags: ['#paes', '#clasesparticulares', '#profeparticular', '#preuniversitario', '#educacionchile', '#emprendimientochile'],
  },
  fonoaudiologas: {
    label: 'Fonoaudiólogas',
    accent: '#0D9488', accent2: '#14B8A6', soft: '#E2F6F3',
    icon: 'activity', badge: 'Para tu consulta',
    jerga: 'paciente, tratamiento, terapia de lenguaje, evaluación fonoaudiológica, derivación, apoderado, sesión semanal',
    dolor: 'apoderados que piden la hora por WhatsApp y se confunden con el horario + WhatsApps a las 11 de la noche para reagendar',
    recurrente: 'tus pacientes con tratamiento semanal protegidos en bloque te devuelven una hora cada lunes — 4 horas al mes',
    voz: 'cálida y profesional; slang mínimo; suma las derivaciones que llegan desde Google',
    datos: 'tratamiento de 45 min $20.000–$40.000; evaluación inicial $30.000–$60.000; online 10–15% más económica (fuente: precios de mercado en Chile)',
    hashtags: ['#fonoaudiologia', '#fonoaudiologachile', '#terapiadelenguaje', '#saludchile', '#emprendimientochile', '#sesionesrecurrentes'],
  },
};

export const NICHE_KEYS = Object.keys(NICHES);

// Devuelve la identidad del nicho; cae en una identidad de marca neutra (ámbar) si no calza.
export function getNiche(key) {
  return NICHES[key] || {
    label: 'Agendamelo', accent: '#EA580C', accent2: '#F59E0B', soft: '#FDF0E7',
    icon: 'sparkle', badge: 'Para tu negocio', jerga: '', dolor: '', recurrente: '', voz: '', datos: '',
    hashtags: ['#agendaonline', '#reservasonline', '#paginaweb', '#emprendimientochile'],
  };
}
