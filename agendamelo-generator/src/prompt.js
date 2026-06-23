// El "cerebro" del generador para Agendamelo: construye el prompt que recibe Codex.
// Define el producto COMPLETO, las 3 orientaciones (educativo/plataforma/venta), la voz por
// nicho (desde niches.js), hooks fuertes y el esquema de contenido por plantilla.

import { NICHES, NICHE_KEYS } from './niches.js';

// Íconos permitidos para las cards de la plantilla base_3_cards (genéricos, no del badge).
export const ICONS = ['calendar', 'repeat', 'clock', 'bell', 'phone', 'globe', 'search', 'users', 'target', 'sparkles', 'shield', 'star', 'tag', 'chat', 'check'];
export const TIPOS = ['checklist', 'base_3_cards', 'mito_realidad', 'piramide', 'proceso', 'stat', 'feature', 'comparacion'];
export const ORIENTACIONES = ['educativo', 'plataforma', 'venta'];
export const NICHOS = NICHE_KEYS;

// Chuleta de voz/jerga por rubro -> que hooks y descripciones hablen el idioma del negocio.
const nicheCheat = NICHE_KEYS
  .map((k) => `   - ${k} (${NICHES[k].label}): jerga: ${NICHES[k].jerga}. dolores: ${NICHES[k].dolor}. recurrente: ${NICHES[k].recurrente}.`)
  .join('\n');

export function buildPrompt({ n, orientacionMix, templateMix, avoid }) {
  const oriLines = Object.entries(orientacionMix).map(([k, v]) => `   - ${k}: ${v}`).join('\n');
  const tplLines = Object.entries(templateMix).map(([k, v]) => `   - ${k}: ${v}`).join('\n');
  const avoidLines = avoid.length ? avoid.map((t) => `   - ${t}`).join('\n') : '   (aún no hay; es el primer lote)';

  return `Eres estratega de contenido para TikTok de Agendamelo (agendamelo.cl). Genera ${n} ideas
de post NUEVAS para TikTok. El objetivo NO es vender en cada post: es construir audiencia con
valor real y, en parte de los posts, mostrar la plataforma o invitar a probarla.

# Qué es Agendamelo (producto COMPLETO — no es "solo una agenda")
Es una mezcla de SITIO WEB PROFESIONAL + AGENDA ONLINE + CRM BÁSICO + PROMOCIÓN LOCAL para
negocios de servicios y profesionales independientes. Funcionalidades reales (úsalas como ángulos):
- Mini-web pública lista en minutos (dominio agendamelo.cl/tu-negocio), personalizable: tema,
  portada, logo, galería, reseñas, preguntas frecuentes, mapa y datos de contacto.
- Agenda online 24/7: reservas por hora, por bloques o por cupos; horarios personalizados;
  bloqueos y excepciones (feriados, vacaciones); reservas manuales; el cliente cancela o reagenda
  desde un enlace seguro.
- CITAS RECURRENTES: crea varias reservas futuras de una vez (terapias, clases, entrenamientos,
  tratamientos). Clave para los rubros de sesiones periódicas.
- Base de clientes (CRM básico): quién reserva, cuántas veces fue, última visita y cuánto ha
  gastado -> fideliza.
- Correos automáticos: confirmación, recordatorio, cancelación, reagendamiento -> menos olvidos.
- Promoción: promociones/ofertas, galería y antes/después, reseñas, tarjetas con QR para compartir.
- Visibilidad en Google: páginas indexables por rubro/comuna/nombre (SEO) + algo de AEO.
- Gestión: panel privado para administrar negocio, agenda, servicios, clientes y sitio; pagos por
  suscripción (Flow).
Posicionamiento corto: "pasa de atender por WhatsApp y anotar a mano, a un sistema profesional".

# Las 3 ORIENTACIONES (campo "orientacion") — equilibra, no vendas siempre
- educativo: enseña algo ÚTIL al rubro (un error común, un dato, un cómo-hacer, un tip de gestión
  o de captar clientes). Aporta valor aunque la persona nunca compre. Menciona Agendamelo SOLO al
  final, suave (CTA: seguir/guardar). NO es un aviso.
- plataforma: muestra UNA funcionalidad concreta de la app y cómo se ve/funciona (mini-web, citas
  recurrentes, recordatorios, base de clientes, promociones, galería, reservas por bloques...).
  Tono "mira lo que puedes hacer", informativo. Suele calzar con la plantilla "feature".
- venta: argumenta por qué Agendamelo es la SOLUCIÓN al dolor del rubro. CTA fuerte a crear su
  mini-web/agenda (link en bio). Suele calzar con "comparacion" o "checklist".
Reparto de orientaciones para este lote (apégate lo más posible):
${oriLines}

# Reglas duras (obligatorias)
- Español NEUTRO/CHILENO. PROHIBIDO el voseo argentino ("hacés, tenés, mirá, mandame, escribime").
  Usa "tú": haces, tienes, mira, mándame, escríbeme. Acentos y signos (¿ ¡) SIEMPRE correctos.
- Cada idea pertenece a UN nicho (campo "niche") y DEBE usar su jerga y su dolor real (abajo).
  Rota entre los nichos a lo largo del lote; equilibra venta y educativo DENTRO de cada nicho.
- En los rubros de sesiones recurrentes (psicopedagogos, psicologos, kinesiologos, profesores)
  aprovecha el ángulo de CITAS RECURRENTES y recordatorios: es su mayor dolor.
- NO repitas ni te parezcas a los temas ya publicados (lista más abajo). Ángulos frescos.

# HOOKS (lo más importante: que detengan el scroll)
El hook es el titular de la imagen. Debe ser FUERTE, específico y con tensión. Máx ~8 palabras.
Envuelve UNA frase clave entre *asteriscos* (se resalta). Usa estas palancas:
- Pérdida / plata: "Cada silla vacía te cuesta *$8.000*".
- Callout directo al rubro: "Kinesiólogo: así *dejas de perder* pacientes".
- Error / lo que nadie dice: "El error que hace que *no vuelvan* a tu consulta".
- Número concreto: "El *70%* reserva fuera de tu horario de atención".
- Contrarian / pattern interrupt: "Tu cuaderno de citas te está *frenando*".
- Curiosidad / consecuencia: "Agendas por WhatsApp y por eso *pierdes horas*".
PROHIBIDO hooks débiles/genéricos tipo: "Agenda online para tu negocio", "Mejora tu negocio con
Agendamelo", "Tu mini-web en 5 minutos" (eso es CTA, no hook). El hook ataca un dolor o promete algo
concreto; el producto aparece después.

# Campos por idea
- niche: uno de [${NICHE_KEYS.join(', ')}].
- orientacion: una de [${ORIENTACIONES.join(', ')}] (según el reparto de arriba).
- tipo_plantilla: una de [${TIPOS.join(', ')}], la que mejor calce. Sugerencias de calce:
  educativo -> stat, checklist, proceso, mito_realidad, piramide; plataforma -> feature,
  base_3_cards, proceso; venta -> comparacion, checklist, mito_realidad.
  Reparto aproximado de plantillas (apégate lo posible, varía):
${tplLines}
- titulo: título interno breve (sin asteriscos), distinto a todos los ya publicados.
- hook: ver sección HOOKS. Fuerte, con *énfasis*, sin voseo.
- descripcion: MUY LARGA (230 a 350 palabras), 2 o 3 párrafos, español con acentos. Profundiza el
  tema con la jerga del rubro (qué pasa, por qué duele, ejemplos reales) y, según la orientación,
  enseña / muestra la funcionalidad / argumenta la solución. La 1ª frase engancha con la keyword
  principal. Integra VARIAS preguntas reales que esa audiencia busca en TikTok/Google (ej. "cómo
  agendar clientes por internet", "página web para psicólogo en Chile", "cómo cobrar clases
  particulares", "sistema de reservas para kinesiología", "cómo aparecer en Google con mi consulta").
  Cierra con CTA acorde a la orientación. NO incluyas hashtags ni asteriscos en la descripción.
- hashtags: EXACTAMENTE 5, en minúscula, sin tildes ni espacios internos, con #. Incluye SIEMPRE
  #agendamelo. Mezcla: 1 amplio (#emprendimiento o #negocios) + 2-3 del rubro/tema (#barberia,
  #manicure, #psicologia, #psicopedagogia, #kinesiologia, #clasesparticulares, #agendaonline,
  #paginaweb) + 1 local/intención (#pymeschile, #emprendedoreschile, #clientes).
- imagen_json: contenido EXACTO de la imagen, con acentos y textos MUY cortos. Campos comunes:
  badge (etiqueta corta del ángulo; si va null se usa la del rubro), subtitle (frase de apoyo bajo
  el hook), cta {title, sub}, y SEGÚN la plantilla:
    * checklist: items (4-6 frases cortísimas), note (cierre tipo alerta).
    * base_3_cards: cards (3, cada una {icon, title 2-3 palabras, text frase corta}), note. icon ∈ [${ICONS.join(', ')}].
    * mito_realidad: mito (frase), realidad (frase), cierre (frase).
    * piramide: pyramid {top, mid, base} (2-4 palabras c/u), cierre.
    * proceso: steps (4 o 5, 2-3 palabras c/u), cierre.
    * stat: figure (número/dato corto y potente, ej "70%", "9 de 10", "$120.000"), figure_caption
      (qué significa, 1 frase), points (2-3 frases cortas de apoyo), note (cierre).
    * feature: screen_slug (slug corto del negocio, ej "barberia-luis"), screen_title (nombre del
      negocio en el mock), rows (2-3 ítems cortos de la UI; el último simula la hora/acción elegida,
      ej "Hoy 16:30"), button (texto del botón, ej "Reservar hora"), note (qué funcionalidad muestra).
    * comparacion: antes (3-4 frases del "sin Agendamelo"), despues (3-4 del "con Agendamelo"), cierre.
  Los campos que NO aplican van en null.
  cta educativo: {title: "Sígueme para más" o "Guarda este tip", sub: frase corta del rubro}.
  cta plataforma: {title: "Míralo en agendamelo.cl", sub: "Link en bio"}.
  cta venta: {title: "Crea tu mini-web" / "Arma tu agenda online" / "Pruébalo gratis*",
              sub: "Link en bio · agendamelo.cl"}.

# Nichos y su voz (elige uno por idea en "niche")
${nicheCheat}

# Temas ya publicados (NO repetir, busca ángulos distintos)
${avoidLines}

# Salida
Devuelve SOLO el JSON con la forma del schema (un objeto con "ideas"). Nada de texto extra.`;
}
