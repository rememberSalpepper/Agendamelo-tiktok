# Línea editorial y publicitaria — Agendamelo TikTok

Guía maestra de contenido. La obedece el generador (`src/prompt.js`) y sirve de referencia para el
usuario y para futuros agentes. **Objetivo único de negocio: conseguir USUARIOS DE PAGO** (dueños de
negocio que activan su suscripción), no vistas vanidosas. Cada pieza debe acercar a un profesional a
"armar y publicar su sitio en Agendamelo". Cadencia objetivo: **3 publicaciones al día**.

## Principio rector (no negociable)
Cada post: **ataca un dolor real → entrega valor (enseña algo aplicable hoy) → recién ahí posiciona
Agendamelo**. Regla de oro: si borras la marca y el post igual le sirve a un dueño de negocio, está
bien hecho. Nada de publicidad pura.

## Posicionamiento del producto (verdad canónica)
Es la **"mini-web profesional + agenda online"** para profesionales en Chile. **NUNCA** "software de
reservas" ni "plataforma de gestión". En una URL propia `agendamelo.cl/tu-nombre`:
- Sitio web profesional: portada, servicios con precios (CLP), galería/portafolio, reseñas, FAQ,
  promociones, horario, contacto, ubicación.
- Agenda online 24/7 (los clientes reservan solos desde el link).
- **Sesiones recurrentes** (diferenciador estrella): bloquea semanas/tratamiento completo en un paso, o
  deja agendada la próxima mantención al terminar.
- **Recordatorios automáticos POR CORREO** (confirmación, día antes, 1 h antes). No por WhatsApp/SMS.
- Aparición en Google y en directorios por rubro y comuna.
- Listo en 5 minutos, sin código.

Precio: **$4.990 primer mes / $7.990 mes**. Sin contrato, sin permanencia, cancela con un clic. **Cero
comisión**. Modelo: CONFIGURAR es sin costo; PUBLICAR cuesta desde el día 1 (**no es prueba gratis**).
**No es:** ficha clínica, CRM avanzado, LMS; no procesa pagos del cliente final; no se integra con
Isapres/Fonasa; no cobra comisión.

## Audiencia y nichos (4 activos)
Spine que los une: **"agenda lo que se repite — clientes que vuelven"**. Cada nicho tiene color, ícono
y voz/jerga propios (`src/niches.js`); se habla con su jerga VERBATIM.

| Nicho (clave) | Acento | Voz | Doble dolor / ángulo |
|---|---|---|---|
| **manicuristas** | rosado | la más jugada y chilena (po, cachái), emojis 💅✨ | Instagram poco profesional + perder clientas por WhatsApp; "deja agendada la próxima mantención". |
| **psicopedagogas** | ámbar | cálida y sobria, slang mínimo | contestar a apoderados a cualquier hora + coordinar de cero; "bloquea la hora 3 meses". |
| **profesores-paes** | azul | cercano y motivador | horario en libreta + alumnos que preguntan otras materias; usa el peak PAES como urgencia. |
| **fonoaudiologas** | verde/teal | cálida y profesional | apoderados que se confunden + WhatsApps de noche; "una hora cada lunes" + derivaciones desde Google. |

**Reparto por lote:** ~30% manicuristas, ~25% psicopedagogas, ~25% profesores-paes, ~20%
fonoaudiologas. (Manicure aporta reach; las otras tres, conversión de alto LTV.)

## Orientaciones de contenido (campo `orientacion`, mezcla 40/30/30)
- **educativo (~40%)**: ayuda al profesional sin vender directo (cuánto cobrar, organizar, evitar
  inasistencias). Construye autoridad y guardados. CTA suave.
- **plataforma (~30%)**: muestra una capacidad concreta (mini-web, reserva 24/7, sesiones recurrentes,
  recordatorios por correo, aparecer en Google). Demuestra, no solo afirma.
- **venta (~30%)**: CTA directo, precio, objeción, diferenciación, oferta. Siempre CTA compliant.

## Plantillas (5) y a qué orientación sirven
| Plantilla | Orientación | Qué hace |
|---|---|---|
| `stat` | educativo/venta | UN dato de MERCADO (precio o tiempo) grande, **con su `source`**. Nunca resultados de clientes. |
| `mito_realidad` | educativo | "Mito: X. Realidad: Y." Rompe una creencia del rubro. |
| `checklist` | educativo/plataforma | 3–5 ítems accionables y guardables. |
| `antes_despues` | venta/plataforma | Caos (WhatsApp/libreta/Instagram) → orden (sitio + reserva). La más persuasiva. |
| `feature` | plataforma/venta | Mock de una función real (agenda, mantención recurrente, recordatorio, galería). |

## Formatos (campo `formato`)
- **imagen (~60%)**: 1 lámina, una de las 5 plantillas. Idea concentrada, hook potente.
- **carrusel (~40%)**: 3-4 láminas. **portada (gancho) → 1-2 punto (una idea por lámina) → cierre
  (recap + CTA)**. Máx 4, ideal 3. Siempre termina en CTA.

## Ritmo diario (3 posts) — comando `/dia` arma el set
| Franja | Rol | Orientación | Formato sugerido |
|---|---|---|---|
| Mañana | Aporta valor, capta | educativo | imagen o carrusel |
| Mediodía | Muestra el producto | plataforma | carrusel o feature |
| Tarde/noche | Convierte | venta | imagen (antes_despues / mito_realidad) |
Reglas: **nunca el mismo nicho ni la misma plantilla dos veces el mismo día**.

## Rotación
- **Nichos:** los 4 a lo largo de la semana, respetando el reparto 30/25/25/20.
- **Plantillas:** las 5 (imagen) + carrusel; varía, no repitas seguido.
- **Anti-repetición de temas:** cada post lleva un `tema` (kebab-case, ej. `no-shows`,
  `aparecer-en-google`, `sesiones-recurrentes`). El generador NO repite ángulos.

## Hooks (la regla más importante)
4-7 palabras, sobre el espectador (su plata/tiempo/clientes), concreto y con tensión. Auto-test:
golpea en <1s, es específico, no es sobre la app, da curiosidad/urgencia. Prohibidos: avisos, CTA
disfrazado, genéricos sin tensión, cualquiera que empiece con "Agendamelo…". Banco: ver `src/prompt.js`.

## Idioma (regla dura)
Español neutro/chileno **sin voseo argentino** (nada de "tenés/hacé/mirá/dale"). El **voseo chileno**
("tenís/podís/cachái") es aceptable SOLO en hooks informales (sobre todo manicure), con moderación.
Acentos y signos siempre correctos. Descripciones de comunas: neutro estricto, sin juicios.

## Integridad de datos (no mentir)
Agendamelo es nuevo: **NUNCA** presentes números como resultados reales de clientes. En `stat` el dato
es (a) precio de mercado del nicho (con `source` = "precios de mercado en Chile") o (b) un cálculo de
tiempo claramente hipotético. Beneficios futuros en condicional ("podrías", "deja de").

## Estrategia de CTA (sin "gratis")
CTA canónico: **"Configura tu sitio sin costo y publícalo desde $4.990/mes → link en bio"**.
Variantes: "Tu sitio + agenda en 5 minutos → agendamelo.cl" · "Aparece en Google y recibe reservas
solas → link en bio" · "Desde $4.990 al mes, sin comisión ni contrato → link en bio".
- educativo → "Sígueme para más" / "Guarda este tip".
- plataforma → "Míralo en agendamelo.cl · Link en bio".
- venta → "Configura tu sitio sin costo" / "Arma tu agenda en 5 minutos · Publica desde $4.990/mes".
**PROHIBIDO:** "gratis", "prueba gratis", "primer mes gratis", "trial", "sin compromiso".

## Caption (lo que va en TikTok) y hashtags
- Caption parte con 👇×4 + descripción larga (230-350 palabras, con valor + preguntas reales de
  búsqueda) + 5 hashtags.
- 5 hashtags exactos, **siempre `#agendamelo`** + 2-3 de rubro/tema (el sistema garantiza el del nicho).

## Cómo publicar (operación diaria)
TikTok no tiene API de subida en este stack → publicación **manual**. Flujo:
1. **Semanal:** `/generar 21` (≈ una semana). Quedan `renderizado`.
2. **Diario:** `/dia` → 3 posts variados en Telegram + título y caption listos.
3. **Sube a TikTok**: foto única o carrusel (láminas en orden), pega el caption, **agrega audio en
   tendencia** y publica. Reparte los 3 en el día.

Estados: `pendiente → renderizado → enviado`.

## KPIs a mirar
Retención/watch time, **guardados** y **compartidos**, comentarios, visitas al perfil y **clics al
link en bio**. Si un nicho/plantilla rinde, súbele el peso en el reparto.
