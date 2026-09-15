# Línea editorial — Agendamelo

Guía vigente para el contenido orgánico de Facebook e Instagram. El generador la implementa en
`src/prompt.js`; TikTok/Reels usa el flujo manual de `src/kit-prompt.js`.

## Objetivo

El objetivo primario no es vender una suscripción en el primer contacto. Es conseguir que una
manicurista complete su **Perfil Gratis** y publique su página. El segundo paso es que pruebe la
agenda completa durante 7 días y, cuando ya vio valor, elija un plan pagado.

```text
contenido útil → visita → Perfil Gratis publicado → prueba de agenda → plan pagado
```

Una vista o un “me gusta” solo importa si ayuda a mover ese embudo.

## Audiencia del sprint

Durante 30 días, el contenido habla exclusivamente a **manicuristas independientes en Chile**. No se
mezclan psicopedagogas, profesores ni fonoaudiólogas en esta etapa. La misma arquitectura permite
reactivarlos después, pero cada sprint debe tener una sola promesa y un solo lenguaje.

Dolores principales:

- depender de Instagram como si fuera una página web;
- responder precios, horarios y ubicación una y otra vez;
- perder reservas mientras está atendiendo;
- agenda desordenada en WhatsApp;
- clientas que no vuelven a reservar su mantención;
- poca presencia cuando alguien busca manicure en su comuna.

## Verdad del producto

Agendamelo es “tu sitio + agenda” para profesionales de servicios en Chile.

- Perfil Gratis: **$0**, público sin fecha de término, hasta 2 servicios y 2 fotos, botón de WhatsApp
  y presencia en directorios/Google. No incluye la agenda activa.
- Estándar: **$12.990/mes** o **$64.000/año**.
- Web Pro: **$19.990/mes**.
- Agenda completa: **7 días gratis, sin tarjeta**.
- Recordatorios automáticos: correo y WhatsApp; WhatsApp limitado en Estándar e ilimitado en Web Pro.
- Reservas 24/7, galería, servicios/precios, reseñas, preguntas frecuentes, horarios y ubicación.

No inventar testimonios, resultados, integraciones, descuentos ni precios. No decir que procesa pagos,
que integra Fonasa/Isapre ni que es una ficha clínica o un CRM avanzado.

## Promesa editorial

Cada pieza sigue esta secuencia:

1. escena reconocible del día a día de una manicurista;
2. prueba, ejemplo o consejo aplicable;
3. próximo paso pequeño y coherente.

El contenido se reparte así:

- 40% educativo: precios, agenda, no-shows, retorno y organización;
- 30% demostración: página, reservas, galería, WhatsApp, Google y recordatorios;
- 30% conversión: Perfil Gratis, objeciones y comparación con depender solo de Instagram.

## Sistema visual

- Formato Meta: 1080×1350 (4:5), exportado a JPEG 2160×2700.
- Una idea por lámina, titular corto y alineación editorial a la izquierda.
- Base crema, tipografía Bricolage Grotesque/DM Sans y acento rosado del nicho.
- Logo pequeño; el mensaje manda.
- CTA negro con sombra rosada; no usar bloques enormes de marca.
- Carrusel de 3–4 láminas: escena → explicación → solución → CTA.

Plantillas: `stat`, `mito_realidad`, `checklist`, `antes_despues`, `feature` y `carrusel`.

## Hooks

El hook es el titular visible. Máximo 12 palabras, keyword del nicho incluida, una sola tensión y
nada de lenguaje de gurú.

- Débil: “Mejora la gestión de tu agenda”.
- Fuerte: “Te escribieron por hora mientras hacías este set”.
- Débil: “Conoce Agendamelo”.
- Fuerte: “Tu Instagram muestra uñas. ¿Pero explica cómo reservar?”

Cada idea propone 3–5 ángulos y una persona elige el hook antes de renderizar. Evita publicar el mismo
ángulo dos días seguidos.

## CTA freemium

CTA principal: **“Crea tu Perfil Gratis en agendamelo.cl”**.

- educativo: guardar el consejo + mención ligera del Perfil Gratis;
- demostración: crear el Perfil Gratis, sin tarjeta ni vencimiento;
- conversión: Perfil Gratis primero; luego explicar la prueba de agenda de 7 días.

Los planes pagados aparecen solo para responder “¿cuánto cuesta si quiero la agenda activa?”. No
llenar cada pieza con precios. En Instagram, reforzar “link en la bio”; en Facebook puede usarse el
enlace directo con UTM cuando esté configurado.

## Cadencia y serie inicial

Una publicación diaria durante 30 días. Mantener una cola mínima de siete piezas renderizadas.

Secuencia semanal sugerida:

1. dolor reconocible;
2. consejo guardable;
3. antes/después del flujo de reserva;
4. función demostrada con contexto;
5. mito/realidad;
6. Perfil Gratis y objeción;
7. checklist o mini auditoría de perfil.

TikTok no reutiliza automáticamente estas láminas. Allí se convierte la misma idea en video corto con
escena, voz o texto en movimiento, demostración y audio elegido manualmente.

## Métricas

Métrica principal: **Perfiles Gratis publicados desde tráfico orgánico de Meta**.

Métricas de diagnóstico: alcance, guardados, compartidos, visitas al perfil, clics, registros iniciados,
registros completados, pruebas de agenda activadas y conversión a plan pagado. Revisar semanalmente
por tema, formato y hook; no cambiar de nicho antes de completar el sprint salvo evidencia clara.
