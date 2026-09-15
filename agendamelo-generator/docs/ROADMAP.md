# Roadmap — contenido Agendamelo

## Implementado

- Sprint 100% manicuristas y embudo centrado en Perfil Gratis.
- Precios y capacidades actuales en una fuente canónica validada por tests.
- Imágenes y carruseles Meta 4:5 en JPEG.
- Curación de hooks y operación desde Telegram.
- Publicación idempotente en Facebook Pages e Instagram Professional.
- Scheduler de una publicación diaria con zona horaria de Santiago.
- Endpoint HTTPS-friendly para que Meta lea los medios.
- Kits de guion para Reels/TikTok, con montaje y publicación manuales.

## Para salir a producción

1. Crear el VPS y apuntar el subdominio HTTPS.
2. Cargar los secretos de Telegram y Meta en `.env`.
3. Confirmar que Instagram sea profesional y esté conectada a la página.
4. Ejecutar `npm run meta:dry-run`.
5. Publicar una pieza manualmente en ambas cuentas y revisar recorte/caption.
6. Preparar siete piezas y activar `META_AUTO_PUBLISH=true`.
7. Añadir UTM y medir Perfil Gratis publicado como conversión principal.

## Después del primer sprint de 30 días

- Comparar hooks, temas y formatos por registros completados, no solo alcance.
- Rehacer las piezas ganadoras como Reels/TikTok nativos.
- Agregar captura de métricas al CSV o a un panel sencillo.
- Probar un segundo nicho solo después de documentar la línea base de manicuristas.
- Evaluar un pipeline de video cuando haya evidencia de qué guiones convierten.

## No automatizar todavía

- Respuestas a comentarios o DMs.
- Audio de tendencia y montaje de video.
- Cambio automático de nicho.
- Publicación con testimonios o cifras sin fuente verificable.
