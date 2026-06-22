// Identidad por rubro (nicho) de Agendamelo.
// FUENTE ÚNICA de la "capa de nicho": color de acento, ícono, etiqueta y jerga/voz.
// El render usa `accent`/`accent2`/`soft` para recolorear toda la imagen, e `icon` para el badge.
// El prompt usa `jerga` y `dolor` para que hooks y descripciones hablen el idioma del rubro.
//
// Los acentos espejan el sistema de temas por rubro del propio sitio agendamelo.cl,
// sobre la misma base cálida de marca (crema + ámbar). Así cada post es Agendamelo,
// pero con identidad propia del nicho.

export const NICHES = {
  barberias: {
    label: 'Barberías',
    accent: '#B45309', accent2: '#F97316', soft: '#FDF1E4',
    icon: 'scissors', badge: 'Para tu barbería',
    jerga: 'fade, degradado, corte clásico, afeitado a navaja, perfilado de barba, combo corte+barba',
    dolor: 'sillas vacías, clientes que no llegan, agendar cortes por WhatsApp/DM, horas muertas entre cita y cita',
  },
  peluquerias: {
    label: 'Peluquerías',
    accent: '#EA580C', accent2: '#F59E0B', soft: '#FDF0E7',
    icon: 'scissors', badge: 'Para tu peluquería',
    jerga: 'color, mechas, balayage, keratina, alisado, peinado, corte y brushing',
    dolor: 'clientas que no confirman, horas largas de color mal coordinadas, depender del teléfono, no-shows',
  },
  manicure: {
    label: 'Manicure',
    accent: '#DB2777', accent2: '#F472B6', soft: '#FCE9F2',
    icon: 'sparkle', badge: 'Para tu salón de uñas',
    jerga: 'esmaltado semipermanente, kapping, soft gel, acrílicas, nail art, diseños, retiro',
    dolor: 'clientas que no llegan, mostrar tus diseños, agendar por DM de Instagram, citas que chocan',
  },
  estetica: {
    label: 'Estética',
    accent: '#BE185D', accent2: '#DB2777', soft: '#FBE7F0',
    icon: 'heart', badge: 'Para tu centro estético',
    jerga: 'limpieza facial, depilación, lifting de pestañas, tratamientos, sesiones, cabina',
    dolor: 'agenda de cabina desordenada, sesiones que se caen, recordar tratamientos en serie, no-shows',
  },
  dentistas: {
    label: 'Dentistas',
    accent: '#0891B2', accent2: '#06B6D4', soft: '#E3F6FB',
    icon: 'tooth', badge: 'Para tu clínica dental',
    jerga: 'control, limpieza, box, hora odontológica, urgencia, tratamiento, presupuesto',
    dolor: 'horas perdidas por inasistencia, box vacío, recordar controles, coordinar por secretaria',
  },
  psicologos: {
    label: 'Psicólogos',
    accent: '#7C3AED', accent2: '#8B5CF6', soft: '#F0EAFD',
    icon: 'brain', badge: 'Para tu consulta',
    jerga: 'sesión, primera consulta, online o presencial, ficha, proceso terapéutico',
    dolor: 'sesiones que se caen a última hora, coordinar horarios, recordatorios, agenda de pacientes recurrentes',
  },
  nutricionistas: {
    label: 'Nutricionistas',
    accent: '#10B981', accent2: '#059669', soft: '#E4F7EF',
    icon: 'leaf', badge: 'Para tu consulta',
    jerga: 'evaluación, control, plan de alimentación, adherencia, antropometría, seguimiento',
    dolor: 'pacientes que abandonan el control, agendar seguimientos, recordatorios, horas que se pierden',
  },
  kinesiologos: {
    label: 'Kinesiólogos',
    accent: '#0D9488', accent2: '#14B8A6', soft: '#E2F6F3',
    icon: 'activity', badge: 'Para tu consulta kine',
    jerga: 'sesión, evaluación, rehabilitación, plan de ejercicios, control, terapia',
    dolor: 'series de sesiones que se interrumpen, recordar la próxima hora, agenda de box, no-shows',
  },
  tatuadores: {
    label: 'Tatuadores',
    accent: '#6D28D9', accent2: '#4338CA', soft: '#ECE8FB',
    icon: 'pen', badge: 'Para tu estudio',
    jerga: 'diseño, sesión, seña/abono, cover up, línea fina, agenda de estudio, presupuesto',
    dolor: 'agendar por DM, citas sin seña que no llegan, coordinar sesiones largas, mostrar el portfolio',
  },
  veterinarias: {
    label: 'Veterinarias',
    accent: '#0284C7', accent2: '#38BDF8', soft: '#E4F2FC',
    icon: 'paw', badge: 'Para tu veterinaria',
    jerga: 'control, vacunas, consulta, urgencia, peluquería canina, hora con el veterinario',
    dolor: 'recordar vacunas y controles, horas perdidas, agendar por teléfono, urgencias mal coordinadas',
  },
  clases: {
    label: 'Clases particulares',
    accent: '#4338CA', accent2: '#6366F1', soft: '#E8E9FB',
    icon: 'book', badge: 'Para tus clases',
    jerga: 'clase particular, cupos, horario, online o presencial, reforzamiento, prueba',
    dolor: 'coordinar horarios con apoderados, clases que se cancelan, recordar, llenar cupos libres',
  },
  mecanicos: {
    label: 'Talleres',
    accent: '#475569', accent2: '#F59E0B', soft: '#EEF1F5',
    icon: 'wrench', badge: 'Para tu taller',
    jerga: 'mantención, revisión, hora para el auto, presupuesto, diagnóstico, cambio de aceite',
    dolor: 'autos que llegan sin hora, agenda del taller desordenada, recordar mantenciones, coordinar por teléfono',
  },
};

export const NICHE_KEYS = Object.keys(NICHES);

// Devuelve la identidad del nicho; cae en una identidad de marca neutra (ámbar) si no calza.
export function getNiche(key) {
  return NICHES[key] || {
    label: 'Agendamelo', accent: '#EA580C', accent2: '#F59E0B', soft: '#FDF0E7',
    icon: 'sparkle', badge: 'Para tu negocio', jerga: '', dolor: '',
  };
}
