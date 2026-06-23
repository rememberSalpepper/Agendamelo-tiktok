# Roadmap — Agendamelo TikTok

Estado y próximos pasos del sistema de contenido. Guía para el usuario y futuros agentes.

## Hecho
- **Motor de marca por nicho**: base Agendamelo (logo vector, Bricolage Grotesque + DM Sans, crema)
  + acento/ícono/voz por rubro (`src/niches.js`, 6 nichos).
- **8 plantillas de imagen** + **carruseles** (3-4 slides: portada → punto → cierre con CTA).
- **3 orientaciones** (educativo/plataforma/venta) con reparto ~40/30/30.
- **Cerebro** (`src/prompt.js`) con producto completo, hooks de máxima exigencia y filosofía
  valor-primero. **Anti-repetición** por `tema`.
- **CSV impecable** (fuente de verdad) con `formato`/`orientacion`/`tema`; `lint.js` valida todo.
- **Bot de Telegram**: `/generar`, `/dia` (set de 3 variados), `/enviar`, `/textos`, etc. Carruseles
  se envían como **álbum** (sendMediaGroup).
- **Línea editorial** documentada (`docs/LINEA-EDITORIAL.md`).
- Infra: Docker + docker-compose (puerto 3011) + auto-deploy (GitHub Actions).

## Siguiente (operativo)
1. **Conectar Telegram + Codex**: crear bot (token) y `codex login`; generar el primer lote real y
   validar consistencia contra la línea editorial. Ajustar el prompt si algo no llega a la vara.
2. **Deploy al VPS**: repo en GitHub + `/home/srv/apps/agendamelo` (puerto 3011) + secretos `VPS_*`.

## Futuro (a evaluar)
- **Scheduler automático**: enviar el set del día a 3 horas fijas (cron en el VPS o `setMyCommands`
  + job). Hoy es manual con `/dia`.
- **Auto-posting a TikTok**: hoy no hay API de subida en este stack; se publica manual. Evaluar
  TikTok Content Posting API o herramientas de terceros.
- **Video / guion**: TikTok premia el video. Generar guion + estructura (o video desde las láminas).
- **Más nichos**: reactivar peluquerías, estética, dentistas, nutrición, tatuadores, veterinarias,
  clases grupales, etc. (la arquitectura ya lo soporta; solo agregar a `src/niches.js`).
- **Analítica**: registrar qué pilar/nicho/plantilla rinde (guardados, clics) y ajustar repartos.
- **Variantes A/B de hook** para un mismo tema.

## Principios que NO se tocan
Español neutro sin voseo; valor-primero (atacar dolor + enseñar + recién vender); diseño impecable
y consistente; márgenes 230/430; 5 hashtags con `#agendamelo`; carruseles máx 4 / cierre en CTA.
