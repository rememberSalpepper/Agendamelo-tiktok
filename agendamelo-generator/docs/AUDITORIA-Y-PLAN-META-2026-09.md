# Auditoría y plan Meta — septiembre 2026

## Resumen ejecutivo

La estrategia anterior probablemente tuvo un problema de encaje entre canal y formato: piezas
estáticas 9:16, captions largos pensados para SEO, una audiencia que cambiaba entre cuatro nichos y
un CTA que pedía pasar casi directo al pago. Sin la analítica de la cuenta no se puede atribuir una
causa única, pero el repositorio sí mostraba esas cuatro fricciones estructurales.

La nueva hipótesis es más simple: **una manicurista, un problema cotidiano, una acción de $0**.
Facebook e Instagram reciben creatividades 4:5 y TikTok queda reservado para video nativo.

## Cambios realizados

- CTA principal cambiado de prueba/pago a **Perfil Gratis permanente**.
- Foco temporal restringido a manicuristas.
- Formato cambiado de 9:16 a 4:5 para feed de Facebook e Instagram.
- Copy reducido y reordenado: escena → prueba/consejo → próximo paso.
- Precios actualizados: Perfil Gratis $0, Estándar $12.990 mensual o $64.000 anual y Web Pro $19.990.
- Producto corregido: recordatorios por correo y WhatsApp, con límites según plan.
- Publicador Meta con control de duplicados, errores por fila y reloj diario.
- TikTok separado como kit de video manual en vez de reutilizar automáticamente una lámina estática.

## Hipótesis de contenido

Tres familias para probar durante 30 días:

1. **Reconocimiento:** escenas que hacen decir “esto me pasa”, como responder mensajes mientras atiende.
2. **Utilidad:** checklists de precios, políticas, confirmación y próxima mantención.
3. **Demostración:** cómo se ve una página propia y qué puede resolver aun antes de pagar la agenda.

Cada familia debe contener varios hooks, pero una sola promesa. Se considera ganador un contenido que
genera Perfiles Gratis publicados; alcance y guardados explican el porqué, no sustituyen la conversión.

## Plan de 30 días

- Días 1–7: dolores y objeciones; establecer línea base de alcance, guardados, clics y registros.
- Días 8–14: más demostraciones del Perfil Gratis y páginas de manicuristas.
- Días 15–21: repetir temas ganadores con hooks y formatos distintos.
- Días 22–30: convertir los dos mejores conceptos en Reels/TikTok nativos y comparar.

Una publicación diaria. No multiplicar el volumen hasta que haya una semana completa con tracking.

## Medición mínima

Usar enlaces UTM separados para Facebook, Instagram y TikTok cuando corresponda. Registrar por post:

- fecha, canal, tema, hook y plantilla;
- alcance, guardados, compartidos y visitas al perfil;
- clics al sitio;
- inicio y finalización del Perfil Gratis;
- activación de la prueba de agenda;
- conversión posterior a Estándar o Web Pro.

Revisión cada siete días. Cambiar una variable a la vez: primero hook, luego formato y después tema.

## Condiciones para activar la automatización

- dominio HTTPS de medios operativo;
- token y permisos Meta validados;
- primera publicación manual correcta en ambos canales;
- mínimo siete JPEG renderizados en cola;
- analytics/UTM listo;
- `META_AUTO_PUBLISH=true` solo en una instancia.

## Riesgos pendientes

- No se recibieron exportaciones de TikTok Analytics; el diagnóstico de rendimiento es inferencial.
- Meta puede revocar tokens o permisos; revisar errores y renovación del token.
- El scheduler publica, pero no produce una reserva infinita de contenido: necesita una cola curada.
- Instagram requiere que Meta pueda descargar cada JPEG desde una URL pública.
- Automatizar contenido diario no reemplaza responder comentarios ni crear video nativo.
