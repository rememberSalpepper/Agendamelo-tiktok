# Cuenta nueva: Agendamelo (agendamelo.cl)

Brief para replicar el sistema (ver `SISTEMA.md` §8) en la cuenta de TikTok de **Agendamelo**.
El "cerebro" listo está en `src/prompt.agendamelo.example.js` (cópialo como `src/prompt.js`).

## Qué es
SaaS chileno: **mini-web profesional + agenda online 24/7** para negocios de servicios.
- Precio: **$4.990** primer mes / **$7.990** mes. Sin contratos ni comisión por reserva.
- Setup en 5 minutos, sin código. Dominio `agendamelo.cl/tu-negocio`.

## Nichos (audiencia)
Barberías, peluquerías, manicure, estética, tatuadores, dentistas, veterinarias, spas, y
profesionales recurrentes: psicólogos, fonoaudiólogos, nutricionistas, psicopedagogos,
kinesiólogos, profesores particulares.

## Problemas que resuelve (= temas del contenido educativo)
- Inasistencias / no-shows → recordatorios automáticos.
- Agendar por WhatsApp es un caos → agenda online que reserva sola.
- No aparecer en Google / depender de pagar publicidad → presencia web + SEO + directorios.
- Verse poco profesional / no tener web → mini-web en 5 min.
- Perder reservas fuera de horario → agenda 24/7.
- Tiempo perdido coordinando/confirmando horas → automatización.

## Estética (definir desde el sitio real)
- Saca **logo, paleta y tipografía** de https://agendamelo.cl (logo + CSS del sitio).
- Vibra sugerida: **cercana, amigable y confiable**, más cálida/vibrante que PGAS (azul "tech").
  Limpia, profesional, mobile-first.
- Aplícalo en `theme.js` (tokens) + adapta las 5 plantillas y los 4 fondos. Mantén márgenes 230/430,
  render 2x e íconos SVG.

## Links a revisar
- https://agendamelo.cl/#funciones · /#como-funciona · /#precio
- https://agendamelo.cl/profesionales-recurrentes
- https://agendamelo.cl/para/psicopedagogos · /para/fonoaudiologos · /para/clases-particulares
- https://agendamelo.cl/barberias · /peluquerias · /manicure · /estetica (directorios por rubro)
- https://agendamelo.cl/blog · /comparar · /sobre

## Hashtags (pools, elegir 5 por post, incluir #agendamelo)
- Amplios: `#emprendimiento #negocios #marketingparanegocios`
- Rubro: `#barberia #peluqueria #manicure #estetica #tatuajes #veterinaria #nutricion #psicologia`
- Tema: `#agendaonline #reservas #recordatorios #paginaweb`
- Local/intención: `#pymeschile #emprendedoreschile #clientes`
- Marca: `#agendamelo`

## Arranque rápido
1. Nuevo repo + nuevo bot de Telegram + `.env` propio.
2. `src/prompt.js` = copia de `prompt.agendamelo.example.js`.
3. Marca visual en `theme.js` + plantillas (desde el sitio).
4. CSV vacío (solo header) → el generador lo llena con `/generar`.
5. VPS: proyecto en `/home/srv/apps/agendamelo`, puerto libre (ej. `3011:3000`), secrets + auto-deploy.
