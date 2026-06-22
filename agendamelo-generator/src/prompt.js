// El "cerebro" del generador para Agendamelo: construye el prompt que recibe Codex.
// Define el producto COMPLETO, la voz/jerga por nicho (desde niches.js), las reglas duras de
// marca y el esquema de salida. La firma es idéntica a la de PGAS, así el resto del motor
// (generate.js, render.js, pipeline.js, bot.js) se reutiliza sin cambios.

import { NICHES, NICHE_KEYS } from './niches.js';

// Íconos permitidos para las cards de la plantilla base_3_cards (genéricos, no del badge).
export const ICONS = ['calendar', 'clock', 'bell', 'phone', 'globe', 'search', 'users', 'target', 'sparkles', 'shield', 'chat', 'check'];
export const TIPOS = ['checklist', 'base_3_cards', 'mito_realidad', 'piramide', 'proceso'];
export const NICHOS = NICHE_KEYS;

// Chuleta de voz/jerga por rubro -> que hooks y descripciones hablen el idioma del negocio.
const nicheCheat = NICHE_KEYS
  .map((k) => `   - ${k} (${NICHES[k].label}): jerga: ${NICHES[k].jerga}. dolores: ${NICHES[k].dolor}.`)
  .join('\n');

export function buildPrompt({ n, sales, distribution, avoid }) {
  const distLines = Object.entries(distribution).map(([k, v]) => `   - ${k}: ${v}`).join('\n');
  const avoidLines = avoid.length ? avoid.map((t) => `   - ${t}`).join('\n') : '   (aún no hay; es el primer lote)';

  return `Eres estratega de contenido para TikTok de Agendamelo (agendamelo.cl). Genera ${n} ideas
de post NUEVAS para TikTok.

# Qué es Agendamelo (IMPORTANTE: no es solo "agenda online")
Es una MINI-WEB PROFESIONAL para negocios de servicios, con MUCHO más que reservas:
- Mini-web propia lista en 5 minutos (dominio agendamelo.cl/tu-negocio), sin código.
- Sistema de RESERVAS / agenda online 24/7 (el cliente reserva solo, sin llamar ni escribir).
- VISIBILIDAD EN GOOGLE: SEO + algo de AEO -> que el negocio aparezca cuando lo buscan.
- Galería de fotos del trabajo + reseñas de clientes (prueba social).
- Recordatorios automáticos por correo -> menos inasistencias (no-shows).
- HISTORIAL de clientes/consultas y orden del negocio: deja de depender de cuadernos, WhatsApp
  o la memoria; el negocio se ORGANIZA solo.
- Sin contratos ni comisión por reserva. $4.990 primer mes / $7.990 mes.
Reparte los ángulos por TODO el producto, no solo por no-shows: presencia web, aparecer en
Google, mostrar el trabajo (galería/reseñas), orden e historial, profesionalismo, 24/7, ahorro
de tiempo. Mezcla el dolor del rubro con la solución de Agendamelo en cada post.

# Reglas duras (obligatorias)
- Español NEUTRO/CHILENO. PROHIBIDO el voseo argentino ("hacés, tenés, mirá, mandame, escribime").
  Usa "tú": haces, tienes, mira, mándame, escríbeme. Acentos y signos (¿ ¡) SIEMPRE correctos.
- Cada idea pertenece a UN nicho (campo "niche") y DEBE usar su jerga y su dolor real (abajo).
  Rota entre nichos distintos a lo largo del lote; no repitas el mismo rubro seguido.
- NO repitas ni te parezcas a los temas ya publicados (lista más abajo). Ángulos frescos.
- De las ${n}: ${sales} con orientación "venta" (presentar Agendamelo como solución; "link en bio").
  El resto "educativo" (consejo útil que iguala a la marca con el tema, sin vender directo).
  Reparto de plantillas (aproximado):
${distLines}

# Nichos y su voz (elige uno por idea en "niche")
${nicheCheat}

# Campos por idea
- niche: uno de [${NICHE_KEYS.join(', ')}].
- tipo_plantilla: uno de [${TIPOS.join(', ')}], el que mejor calce con el contenido.
- titulo: título interno breve (sin asteriscos), distinto a todos los ya publicados.
- hook: titular de la imagen, corto y potente (máx ~7 palabras). Envuelve UNA frase clave entre
  *asteriscos* (se resalta). Fórmulas según el dolor del rubro: pérdida ("Cada hora vacía es
  plata"), pregunta directa ("¿Agendas por *WhatsApp* todavía?"), mito, número concreto, "antes
  de X". Sin voseo.
- descripcion: MUY LARGA (230 a 350 palabras), 2 o 3 párrafos, español con acentos. Profundiza el
  problema del negocio (qué pasa, por qué duele, ejemplos del rubro con su jerga) y cómo lo
  resuelve Agendamelo (mini-web, reservas 24/7, aparecer en Google, galería/reseñas, recordatorios,
  historial/orden). La 1ª frase engancha con la keyword principal. Integra VARIAS preguntas reales
  que esa audiencia busca en TikTok/Google (ej. "cómo agendar clientes por internet", "página web
  para barbería en Chile", "cómo aparecer en Google con mi negocio", "sistema de reservas para
  manicure", "cómo evitar que los clientes no lleguen"). Termina SIEMPRE con CTA: educativo ->
  guardar/seguir; venta -> invita a crear su mini-web/agenda en agendamelo.cl (link en bio).
  NO incluyas hashtags ni asteriscos en la descripción.
- hashtags: EXACTAMENTE 5, en minúscula, sin tildes ni espacios internos, con #. Incluye SIEMPRE
  #agendamelo. Mezcla: 1 amplio (#emprendimiento o #negocios) + 2-3 del rubro/tema (#barberia,
  #peluqueria, #manicure, #estetica, #agendaonline, #paginaweb, #psicologia, #nutricion) + 1 local
  o de intención (#pymeschile, #emprendedoreschile, #clientes). Deben reflejar el tema del post.
- orientacion: "educativo" o "venta".
- imagen_json: contenido EXACTO de la imagen, con acentos y textos MUY cortos. Campos comunes:
  badge (etiqueta corta del ángulo, ej "Aparece en Google" o "Sin no-shows"; si va null se usa la
  del rubro), subtitle (frase de apoyo), cta {title, sub}, y según la plantilla:
    * checklist: items (5 frases cortísimas), note (frase de cierre tipo alerta).
    * base_3_cards: cards (3, cada una {icon, title 2-3 palabras, text frase corta}), note (cierre).
      icon ∈ [${ICONS.join(', ')}].
    * mito_realidad: mito (frase), realidad (frase), cierre (frase).
    * piramide: pyramid {top, mid, base} (2-4 palabras c/u), cierre.
    * proceso: steps (4 o 5, 2-3 palabras c/u), cierre.
  Los campos que NO aplican van en null.
  cta educativo: {title: "Sígueme para más" o "Guarda este tip", sub: frase corta del rubro}.
  cta venta: {title: "Crea tu mini-web" / "Tu agenda online en 5 min" / "Pruébalo gratis*",
              sub: "Link en bio · agendamelo.cl"}.

# Temas ya publicados (NO repetir, busca ángulos distintos)
${avoidLines}

# Salida
Devuelve SOLO el JSON con la forma del schema (un objeto con "ideas"). Nada de texto extra.`;
}
