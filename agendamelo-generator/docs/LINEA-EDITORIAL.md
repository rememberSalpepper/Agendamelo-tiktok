# Línea editorial y publicitaria — Agendamelo TikTok

Guía maestra de contenido. La obedece el generador (`src/prompt.js`) y sirve de referencia para el
usuario y para futuros agentes. Objetivo de negocio: **atraer dueños de negocios de servicios y
profesionales independientes en Chile**, construir audiencia con valor real y convertir a Agendamelo
(mini-web + agenda + CRM + promoción local). Cadencia objetivo: **3 publicaciones al día**.

## Principio rector (no negociable)
Cada post: **ataca un dolor real → entrega valor (enseña algo aplicable hoy) → recién ahí posiciona
Agendamelo**. Regla de oro: si borras la marca y el post igual le sirve a un dueño de negocio, está
bien hecho. Nada de publicidad pura.

## Posicionamiento del producto
No es "solo una agenda". Es **sitio web profesional + agenda online + CRM básico + promoción local**:
mini-web pública, reservas 24/7 (por hora/bloques/cupos), **citas recurrentes**, recordatorios y
correos automáticos, base de clientes, promociones, galería y antes/después, reseñas, visibilidad en
Google (SEO + algo de AEO), QR, panel privado y pagos (Flow). Sin contratos ni comisión. $4.990 primer
mes / $7.990 mes. Setup en 5 minutos.

## Audiencia y nichos (6, v1)
Barberías, Manicure, Psicopedagogía, Psicología, Kinesiología, Profesores particulares.
4 de 6 son de **sesiones recurrentes** (psico, psicopedago, kine, profes) → ahí las **citas
recurrentes** y los recordatorios son el ángulo más fuerte. Cada nicho tiene color, ícono y voz
propios (`src/niches.js`); se habla con su jerga real.

## Los 6 flancos (pilares) — atacar en paralelo
| Pilar | De qué habla | Orientación típica |
|---|---|---|
| 1. Dolor / agitación | No-shows, caos de WhatsApp, horas muertas, cuaderno, doble reserva | educativo / venta |
| 2. Gestión & fidelización | Ordenar la agenda, base de clientes/CRM, recordatorios, cobrar a tiempo | educativo |
| 3. Captación / ser encontrado | Aparecer en Google, mini-web, reseñas, galería, QR | educativo / plataforma |
| 4. Producto en acción | Citas recurrentes, reservas por bloque, promociones, panel | plataforma |
| 5. Prueba & contraste | Antes/después, sin/con Agendamelo, casos | venta |
| 6. Oferta | 5 minutos, sin comisión, $4.990, prueba | venta |

## Orientaciones de contenido (campo `orientacion`)
- **educativo (~40%)**: enseña; la marca aparece suave al final. CTA: seguir / guardar.
- **plataforma (~30%)**: muestra una funcionalidad concreta y cómo se ve. CTA: "míralo en agendamelo.cl".
- **venta (~30%)**: argumenta por qué Agendamelo resuelve el dolor. CTA fuerte: crear mini-web / probar.

## Formatos (campo `formato`)
- **imagen (~60%)**: 1 lámina, una de las 8 plantillas. Idea concentrada, hook potente.
- **carrusel (~40%)**: 3-4 láminas para temas densos. Estructura: **portada (gancho) → 1-2 punto
  (una idea por lámina) → cierre (recap + CTA)**. Máx 4, ideal 3. Siempre termina en CTA.

## Ritmo diario (3 posts) — comando `/dia` arma el set
| Franja | Rol | Orientación | Formato sugerido |
|---|---|---|---|
| Mañana | Aporta valor, capta | educativo | imagen o carrusel |
| Mediodía | Muestra el producto | plataforma | carrusel o feature |
| Tarde/noche | Convierte | venta | imagen (comparacion / mito_realidad) |
Reglas: **nunca el mismo nicho ni la misma plantilla dos veces el mismo día**. `/dia` selecciona 3
posts `renderizado` maximizando variedad de nicho/orientación/formato.

## Rotación
- **Nichos:** los 6 a lo largo de la semana (~3-4 posts/nicho/semana, repartidos).
- **Plantillas:** las 8 (imagen) + carrusel; varía, no repitas seguido.
- **Anti-repetición de temas:** cada post lleva un `tema` (kebab-case, ej. `no-shows`,
  `aparecer-en-google`, `citas-recurrentes`). El generador recibe la lista de `titulo — tema`
  publicados y NO repite ángulos.

## Hooks (la regla más importante)
4-9 palabras, sobre el espectador (su plata/tiempo/clientes), concreto y con tensión. Debe pasar el
auto-test: golpea en <1s, es específico, no es sobre la app, da curiosidad/urgencia.
Palancas: pérdida en plata/tiempo · callout al rubro · "el error que…" · dato que sorprende ·
consecuencia de un mal hábito · contrarian · pregunta con tensión · open loop.
Prohibidos: avisos ("Agenda online para tu negocio"), CTA disfrazado ("Tu mini-web en 5 minutos"),
genéricos sin tensión, cualquiera que empiece con "Agendamelo…".
Banco de ejemplos: ver `src/prompt.js` (sección HOOKS).

## Estrategia de CTA
- educativo → "Sígueme para más" / "Guarda este tip".
- plataforma → "Míralo en agendamelo.cl · Link en bio".
- venta → "Crea tu mini-web" / "Arma tu agenda online" / "Pruébalo gratis" · Link en bio · agendamelo.cl.

## Caption (lo que va en TikTok) y hashtags
- Caption parte con 👇×4 (empuja el texto para no tapar la imagen) + descripción larga (230-350
  palabras, con valor + preguntas reales de búsqueda) + 5 hashtags.
- 5 hashtags exactos, **siempre `#agendamelo`**: 1 amplio + 2-3 de rubro/tema + 1 local/intención.

## Reglas de marca (fijas)
Español neutro/chileno **sin voseo**; márgenes seguros 230/430; render 2x; íconos SVG; acento por
nicho; logo y fuentes self-hosted. Diseño impecable y consistente en TODO post.

## KPIs a mirar (para iterar la línea)
Retención/watch time, **guardados** y **compartidos** (señal de valor), comentarios, visitas al
perfil y **clics al link en bio**. Si un pilar/nicho/plantilla rinde, súbele el peso en el reparto.
