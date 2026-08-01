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
- **Modo kit de video (TikTok/Reels) — solo texto** (2026-07-03): comando **`/kit [N]`** (default 5,
  máx 7) que genera kits faceless de UN nicho con Codex y los entrega listos para copiar (hook /
  escenas / CTA / captionSEO / hashtags / ideas de imagen IA), esquema §5 de la guía TikTok-SEO. El
  bot **NO** renderiza ni publica en TikTok (Jorge arma el video a mano). CSV hermano
  `agendamelo_kits.csv` (`pendiente → entregado`), **7 ángulos** (los 6 de imagen + `visibilidad`),
  **ángulos únicos por tanda**, nicho **rotando 30/25/25/20** (override `/kit N <nicho>`). Reglas
  duras en `src/kit-validate.js` (hook ≤12 palabras, caption ≤150 keyword-first, 3-5 hashtags de
  nicho sin #fyp/#viral, anti-voseo, lista blanca de precio/oferta) enganchadas a `npm run lint` y
  cubiertas por `npm test`. Verdad de precio: `PRICING_CANONICO` en `src/kit-config.js`.
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
- **Video / guion**: el GUION de texto ya lo cubre `/kit` (kit faceless HOOK→escenas→CIERRE). Pendiente
  a evaluar: armar el video mismo desde las láminas/imágenes (hoy el montaje es manual, por decisión).
- **Más nichos**: reactivar peluquerías, estética, dentistas, nutrición, tatuadores, veterinarias,
  clases grupales, etc. (la arquitectura ya lo soporta; solo agregar a `src/niches.js`).
- **Analítica**: registrar qué pilar/nicho/plantilla rinde (guardados, clics) y ajustar repartos.
- **Variantes A/B de hook** para un mismo tema.

## Principios que NO se tocan
Español neutro sin voseo; valor-primero (atacar dolor + enseñar + recién vender); diseño impecable
y consistente; márgenes 230/430; 5 hashtags con `#agendamelo` (modo imagen); carruseles máx 4 /
cierre en CTA. En el **modo kit**: hooks ≤12 palabras, un solo nicho por tanda, ángulos únicos, 3-5
hashtags de nicho (sin #fyp/#viral), el bot NO publica ni renderiza para TikTok.

## Pricing 2.0 — CERRADO (2026-07-31)
Pricing 2.0 está en producción en agendamelo.cl desde el 2026-07-14 y el bot ya lo refleja: la verdad
única es **$12.990/mes · plan anual $64.000 · publica gratis 7 días sin tarjeta**, y vive en
`src/kit-config.js` (`PRICING_CANONICO`), que consumen los dos modos (kit e imagen).

El switch `PRICING_20_LIVE` se **eliminó**: existía para un evento que ya ocurrió y dejarlo puesto era
el riesgo de que alguien lo volviera a `false` y el bot mintiera de nuevo. En su lugar, la regla de
precio se hace cumplir con una **lista blanca siempre activa** (`findPriceIssues` en
`src/kit-validate.js`), que además cubre `scenes[]` e `imagePrompts[]` —antes quedaban fuera— y
distingue el precio de Agendamelo de los precios de mercado del rubro. Cubierto por `npm test`.
