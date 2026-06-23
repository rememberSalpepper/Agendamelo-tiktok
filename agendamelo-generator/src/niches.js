// Identidad por rubro (nicho) de Agendamelo — v2 (6 nichos enfocados).
// FUENTE ÚNICA de la "capa de nicho": color de acento, ícono, etiqueta y voz/jerga.
// El render usa `accent`/`accent2`/`soft` para recolorear toda la imagen, e `icon` para el badge.
// El prompt usa `jerga`, `dolor` y `recurrente` para hablar el idioma real de cada rubro.
//
// 4 de los 6 rubros son de SESIONES RECURRENTES (psicología, psicopedagogía, kinesiología,
// clases): ahí las citas recurrentes y los recordatorios son el ángulo más fuerte.

export const NICHES = {
  barberias: {
    label: 'Barberías',
    accent: '#B45309', accent2: '#F97316', soft: '#FDF1E4',
    icon: 'scissors', badge: 'Para tu barbería',
    jerga: 'fade, degradado, corte clásico, afeitado a navaja, perfilado de barba, combo corte+barba',
    dolor: 'sillas vacías, clientes que no llegan, agendar cortes por WhatsApp/DM, horas muertas',
    recurrente: 'el cliente fiel que vuelve cada 2-3 semanas: deja su próxima hora agendada sola',
  },
  manicure: {
    label: 'Manicure',
    accent: '#DB2777', accent2: '#F472B6', soft: '#FCE9F2',
    icon: 'sparkle', badge: 'Para tu salón de uñas',
    jerga: 'esmaltado semipermanente, kapping, soft gel, acrílicas, nail art, diseños, retiro, mantención',
    dolor: 'clientas que no llegan, agendar por DM de Instagram, mostrar tus diseños, citas que chocan',
    recurrente: 'la mantención cada 3-4 semanas: agenda la serie de citas de una vez',
  },
  psicopedagogos: {
    label: 'Psicopedagogía',
    accent: '#0284C7', accent2: '#38BDF8', soft: '#E4F2FC',
    icon: 'lightbulb', badge: 'Para tu consulta',
    jerga: 'evaluación, sesiones de apoyo, reforzamiento, informe, estrategias, apoyo escolar, NEE',
    dolor: 'coordinar con apoderados, recordar sesiones semanales, agenda de varios niños, sesiones que se caen',
    recurrente: 'el plan de apoyo es semanal: deja agendadas todas las sesiones del mes con cada familia',
  },
  psicologos: {
    label: 'Psicología',
    accent: '#7C3AED', accent2: '#8B5CF6', soft: '#F0EAFD',
    icon: 'brain', badge: 'Para tu consulta',
    jerga: 'sesión, primera consulta, proceso terapéutico, online o presencial, ficha, encuadre',
    dolor: 'sesiones que se caen a última hora, coordinar horarios, recordatorios, pacientes recurrentes',
    recurrente: 'la terapia es semanal: agenda el mismo bloque por varias semanas y deja que el sistema recuerde',
  },
  kinesiologos: {
    label: 'Kinesiología',
    accent: '#0D9488', accent2: '#14B8A6', soft: '#E2F6F3',
    icon: 'activity', badge: 'Para tu consulta kine',
    jerga: 'sesión, evaluación, rehabilitación, plan de ejercicios, control, terapia manual',
    dolor: 'series de sesiones que se interrumpen, pacientes que abandonan, recordar la próxima hora',
    recurrente: 'la rehabilitación es una serie: agenda las 8-10 sesiones juntas para que el paciente no abandone',
  },
  profesores: {
    label: 'Clases particulares',
    accent: '#4338CA', accent2: '#6366F1', soft: '#E8E9FB',
    icon: 'book', badge: 'Para tus clases',
    jerga: 'clase particular, reforzamiento, cupos, prueba/PAES, online o presencial, materia',
    dolor: 'coordinar horarios con apoderados, clases que se cancelan, llenar cupos, cobrar a tiempo',
    recurrente: 'las clases son semanales: agenda el horario fijo del semestre y evita el caos del WhatsApp',
  },
};

export const NICHE_KEYS = Object.keys(NICHES);

// Devuelve la identidad del nicho; cae en una identidad de marca neutra (ámbar) si no calza.
export function getNiche(key) {
  return NICHES[key] || {
    label: 'Agendamelo', accent: '#EA580C', accent2: '#F59E0B', soft: '#FDF0E7',
    icon: 'sparkle', badge: 'Para tu negocio', jerga: '', dolor: '', recurrente: '',
  };
}
