// El "cerebro" del modo KIT (videos faceless TikTok/Reels). Construye el prompt para Codex.
// Codifica la sección 5 de GUIA_TIKTOK_SEO_FACELESS.md: por cada video, un objeto
// { niche, keyword, hookText, scenes[], ctaText, captionSEO, hashtags[], imagePrompts[] } (+ angulo, tema).
//
// A diferencia del modo imagen, el bot NO publica ni renderiza: entrega TEXTO listo para que Jorge
// arme el video a mano (fotos/B-roll + sonido en tendencia + este texto). Ver PLAN-CANALES §1 y §4.

import { NICHES } from './niches.js';
import { KIT_ANGULOS } from './kit-validate.js';
import { PRICING_20_LIVE, PRICING } from './kit-config.js';

const ANGULO_DESC = {
  plata: 'plata que pierde o deja de ganar (clientas/pacientes/alumnos que se van, precio que regala)',
  tiempo: 'horas que se van coordinando por WhatsApp o cuadrando de cero cada semana',
  'no-show': 'inasistencias y cancelaciones de último minuto que dejan la hora vacía',
  'repetir-info': 'cansancio de contestar lo mismo (precio, horario, ubicación) una y otra vez por DM',
  'comparacion-ig': 'verse poco profesional o perder clientes en Instagram/WhatsApp vs tener un sitio propio',
  curiosidad: 'un dato o afirmación que sorprende o incomoda y obliga a seguir mirando',
  visibilidad: 'no aparecer cuando te buscan en Google o en directorios por rubro y comuna',
};

export function buildKitPrompt({ n, niche, avoid }) {
  const info = NICHES[niche] || {};
  const angulosCheat = KIT_ANGULOS.map((a) => `   - ${a}: ${ANGULO_DESC[a]}`).join('\n');
  const avoidLines = avoid.length ? avoid.map((t) => `   - ${t}`).join('\n') : '   (aún no hay historia de kits; es la primera tanda)';

  // Bloque de precio: hoy NO se centra en precio; cuando Pricing 2.0 esté en producción se abre.
  const precioBloque = PRICING_20_LIVE
    ? `REGLA DE PRECIO (Pricing 2.0 VIGENTE): la verdad es "${PRICING.nuevo}". Puedes usar como CTA
"Publica gratis 7 días, sin tarjeta -> agendamelo.cl" cuando calce. No exageres cifras ni inventes descuentos.`
    : `REGLA DE PRECIO (CRÍTICA — Pricing 2.0 NO deployado todavía): NINGÚN kit puede centrarse en el
precio ni en "no es prueba gratis" (ambas cosas están por cambiar en el sitio). PROHIBIDO mencionar
cifras de precio, "$", "gratis", "prueba", "trial" o "sin compromiso" en hookText, scenes, ctaText o
captionSEO. El CTA es de DESCUBRIMIENTO (que te encuentren / que vean el sitio), no una oferta.`;

  return `Eres el mejor estratega de TikTok-SEO faceless de Chile y el motor de contenido de Agendamelo.
Genera ${n} KITS DE VIDEO nuevos para TikTok/Reels, TODOS del nicho "${niche}" (${info.label || niche}).
Cada kit es SOLO TEXTO: Jorge arma el video a mano (fotos/B-roll + sonido en tendencia) con lo que tú
entregas. El ÚNICO objetivo de negocio es conseguir USUARIOS DE PAGO (dueños de negocio que activan su
suscripción), no vistas vanidosas. Vara ALTA: cada hook tiene que doler o intrigar de verdad.

# 1. QUÉ ES AGENDAMELO (verdad canónica — NO inventes nada fuera de esto)
Agendamelo es la "mini-web profesional + agenda online" para profesionales en Chile (URL propia
agendamelo.cl/tu-nombre). NUNCA lo llames "software de reservas" ni "plataforma de gestión". Incluye:
- Sitio web profesional: servicios con precios (CLP), galería/portafolio, reseñas, FAQ, horario, contacto.
- Agenda online 24/7: los clientes reservan solos desde el link, sin que muevas un dedo.
- SESIONES RECURRENTES (diferenciador estrella): deja agendada la próxima mantención/sesión al terminar,
  o bloquea semanas de un tratamiento en un paso.
- Recordatorios automáticos POR CORREO (confirmación, día antes, 1 h antes). NO por WhatsApp/SMS.
- Aparición en Google y en directorios por rubro y comuna.
- Listo en 5 minutos, sin código. Sin comisión por reserva. El cliente reserva SIN pagar por adelantado.
Lo que NO es: no es ficha clínica, ni CRM avanzado, ni LMS; no procesa pagos del cliente final; no se
integra con Isapres/Fonasa; no cobra comisión; no manda recordatorios por WhatsApp.

# 2. EL FORMATO FACELESS (estructura de CADA video: 7-12 s, sin cámara, sin cara)
- HOOK (0-2 s): tu campo "hookText". Texto grande en pantalla, un DOLOR concreto o CURIOSIDAD, con la
  keyword adentro. Es lo que detiene el scroll: si no duele o intriga en 1 segundo, el video muere.
- DESARROLLO (2-6 s): tu campo "scenes" (1-2 líneas). Nombra el problema real del rubro, una sola idea
  por línea, con la jerga de ${niche}. La PRIMERA scene debe reforzar el hook y (si no está en el hook)
  llevar la keyword.
- CIERRE (6-10 s): tu campo "ctaText". El producto en acción -> "Búscalo: agendamelo.cl" (o variante de
  descubrimiento). Mostrar, no explicar.

# 3. NICHO DE ESTA TANDA: ${niche} (${info.label || niche}) — háblale SOLO a esta persona
- Jerga (úsala VERBATIM): ${info.jerga || '(genérica)'}.
- Dolor real del rubro: ${info.dolor || '(genérico)'}.
- Ángulo recurrente (diferenciador): ${info.recurrente || '(sesiones recurrentes)'}.
- Voz: ${info.voz || 'cercana, de colega'}.
- Datos de mercado citables (solo si haces un dato, con la fuente "precios de mercado en Chile"):
  ${info.datos || '(no aplicar)'}.

# 4. LAS 6 REGLAS DURAS (si fallas una, el kit se descarta)
1. hookText: MÁXIMO 12 palabras. Un DOLOR concreto o una CURIOSIDAD, NUNCA un tema descriptivo.
   Envuelve UNA frase clave entre *asteriscos*. Sobre el espectador (su plata/tiempo/clientes), no la app.
   ❌ "Agenda para manicuristas: gestión de horas."   (es un tema, no duele)
   ✅ "3 clientas pidieron la misma hora. *Perdiste a 2*."   (dolor concreto, número, keyword)
2. keyword: una frase de búsqueda real del rubro (ej. "agenda para manicuristas", "página web para
   fonoaudióloga", "clases particulares PAES"). DEBE aparecer, literal, en hookText o en la 1ª scene.
3. captionSEO: MÁXIMO 150 caracteres, con la keyword en las PRIMERAS palabras, en lenguaje HUMANO.
   PROHIBIDO el listado de keywords separadas por comas. Puedes cerrar con un emoji del rubro.
   ✅ "Agenda para manicuristas en Chile 💅 ordena tus mantenciones sin WhatsApp"
   ❌ "manicurista, agenda uñas, reservas chile, no shows, precios manicure"   (lista de keywords)
4. hashtags: 3 a 5, TODOS del nicho (mezcla 1 amplio del rubro + 2-3 específicos). PROHIBIDO
   #fyp, #viral, #parati y genéricos. En minúscula, sin tildes ni espacios, con #.
5. angulo: cada kit trae UN ángulo (campo "angulo") y en esta tanda los ${n} ángulos son DISTINTOS
   entre sí (no repitas ninguno). Elige de esta lista:
${angulosCheat}
6. Español neutro/chileno. PROHIBIDO el voseo argentino (vos, tenés, querés, podés, mirá, fijate, dale,
   armá, hacé, elegí, probá, contame, che, guita, boludo, chau...). Usa "tú tienes/puedes", "haz",
   "mira", "arma", "prueba", "chao". El voseo CHILENO (tenís/podís/cachái) es aceptable SOLO en hooks
   informales de manicure, con moderación. Acentos y signos (¿ ¡) siempre correctos.

# 5. CTA Y PRECIO
${precioBloque}
CTAs válidos (de descubrimiento): "Búscalo: agendamelo.cl", "Encuéntralo en agendamelo.cl",
"Tu sitio + agenda en agendamelo.cl", "Link en la descripción -> agendamelo.cl".

# 6. INTEGRIDAD DE DATOS (no mientas)
Agendamelo es nuevo: NUNCA presentes números como resultados reales de clientes ("nuestras usuarias
lograron +40%"). Beneficios futuros en condicional ("podrías", "deja de", "imagina"). Si citas un dato,
que sea de MERCADO del rubro (precio) con su fuente, o un cálculo de tiempo claramente hipotético.

# 7. imagePrompts (ideas de imagen IA / B-roll faceless para armar el video)
2 a 3 ideas CONCRETAS y del rubro, en español, para generar con IA o grabar (nada con tu cara). Ej.:
"primer plano de uñas semipermanentes recién hechas", "celular mostrando una reserva entrando",
"manos sobre un calendario ordenado". Sin texto dentro de la imagen (el texto lo pone Jorge en la app).

# 8. TEMAS YA USADOS (NO repitas ángulo ni tema; busca uno nuevo)
${avoidLines}

# 9. Campos por kit
- niche: "${niche}" (fijo, todos igual).
- keyword: frase de búsqueda real (ver regla 2).
- hookText: el HOOK (ver regla 1).
- scenes: arreglo de 1-2 líneas de DESARROLLO (ver sección 2). Cortas, una idea cada una.
- ctaText: el CIERRE / CTA de descubrimiento (ver sección 5).
- captionSEO: el caption de TikTok (ver regla 3).
- hashtags: 3-5 del nicho (ver regla 4).
- imagePrompts: 2-3 ideas de imagen (ver sección 7).
- angulo: uno de [${KIT_ANGULOS.join(', ')}]; DISTINTO en cada kit de la tanda (ver regla 5).
- tema: etiqueta corta en kebab-case (ej. "no-shows", "aparecer-en-google", "sesiones-recurrentes"),
  ÚNICA en la tanda y distinta a las ya usadas.

# 10. AUTO-CHEQUEO antes de emitir CADA kit (si algo falla, reescribe)
1. ¿hookText ≤12 palabras, duele/intriga, con keyword y *énfasis*? 2. ¿La keyword está literal en el
hook o en la 1ª scene? 3. ¿captionSEO ≤150 car., keyword al inicio, humano, sin lista de comas?
4. ¿3-5 hashtags del nicho, sin #fyp/#viral/#parati? 5. ¿Ángulos DISTINTOS entre los ${n} kits?
6. ¿Cero voseo argentino? 7. ¿Cero precio/"gratis" (mientras no cambie el pricing)? 8. ¿Usa la jerga
verbatim de ${niche}? Emite solo si TODO pasa.

# Salida
Devuelve SOLO el JSON con la forma del schema (un objeto con "kits"). Nada de texto extra.`;
}
