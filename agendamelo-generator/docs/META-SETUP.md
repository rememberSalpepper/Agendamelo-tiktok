# Conectar Facebook e Instagram a la automatización

El publicador usa Meta Graph API v26.0 con **inicio de sesión con Facebook**. Una sola credencial de
página permite publicar en la página de Facebook y en la cuenta profesional de Instagram conectada.

## 1. Preparar las cuentas

1. La cuenta de Instagram debe ser Profesional (Empresa o Creador).
2. Debe estar conectada a la página de Facebook de Agendamelo.
3. La persona que autoriza debe tener la tarea `CREATE_CONTENT` o control suficiente sobre la página.
4. Completa Page Publishing Authorization si Meta la solicita.

## 2. Crear o elegir la app de Meta

En Meta for Developers crea una app empresarial o usa una app propia existente. Para cuentas que tú
administras puede bastar el acceso estándar mientras las personas sean roles de la app. Si en el futuro
publicarás para cuentas de terceros, necesitarás revisión y acceso avanzado.

Permisos usados por este flujo:

- `pages_show_list` para descubrir las páginas administradas;
- `pages_manage_posts` para publicar en Facebook;
- `pages_read_engagement` para trabajar con la página;
- `instagram_basic` para identificar la cuenta profesional conectada;
- `instagram_content_publish` para publicar en Instagram.

No se solicitan permisos de mensajes, anuncios ni datos de clientes.

## 3. Obtener IDs y token de prueba

En el Graph API Explorer selecciona tu app y genera un token de usuario con los permisos anteriores.
Ejecuta:

```text
GET /me/accounts?fields=id,name,access_token,instagram_business_account
```

En la respuesta de Agendamelo:

- `id` → `META_PAGE_ID`;
- `access_token` → `META_PAGE_ACCESS_TOKEN`;
- `instagram_business_account.id` → `META_IG_USER_ID`.

Si Instagram no aparece, prueba:

```text
GET /META_PAGE_ID?fields=id,name,instagram_business_account
```

Si sigue vacío, la cuenta profesional no está conectada a esa página o la autorización no tiene acceso.
No pegues el token en documentación, commits, capturas ni chats.

El token del Explorer sirve para la primera prueba. Para el VPS usa un token de página duradero o un
token de usuario del sistema administrado en Meta Business, con los mismos permisos y la página asignada.
La aplicación no intenta renovar tokens automáticamente.

## 4. Configurar el VPS

En `agendamelo-generator/.env`:

```dotenv
META_GRAPH_VERSION=v26.0
META_PAGE_ID=ID_DE_LA_PAGINA
META_IG_USER_ID=ID_PROFESIONAL_DE_INSTAGRAM
META_PAGE_ACCESS_TOKEN=TOKEN_DE_PAGINA
PUBLIC_MEDIA_BASE_URL=https://contenido.agendamelo.cl/media
META_TRACKING_URL=https://agendamelo.cl/?utm_source=facebook&utm_medium=organic&utm_campaign=perfil-gratis-manicuristas
META_AUTO_PUBLISH=false
META_PUBLISH_TIME=20:30
META_TIMEZONE=America/Santiago
```

`PUBLIC_MEDIA_BASE_URL` debe responder sin login y entregar `Content-Type: image/jpeg`.

## 5. Secuencia de prueba

```bash
docker compose exec app npm run meta:dry-run
docker compose exec app npm run meta:check
```

`meta:check` es de solo lectura: devuelve nombre/ID de la página, usuario/ID de Instagram, detecta si
ambas cuentas no coinciden y nunca imprime el token.

Después genera, cura y renderiza una pieza. Desde Telegram:

```text
/publicar AGENDA-IDEA-001
```

Confirma manualmente el recorte, caption y enlace en ambas redes. Luego activa:

```dotenv
META_AUTO_PUBLISH=true
```

y reinicia el contenedor. El reloj publica una pieza `renderizado` o `enviado` por fecha de Santiago,
guarda los IDs de ambos canales y no repite lo que ya terminó.

## 6. Qué sucede cada día

```text
20:30 Santiago
  → toma la primera pieza de la cola
  → Facebook: POST /PAGE_ID/photos
  → Instagram: POST /IG_ID/media
  → espera FINISHED
  → Instagram: POST /IG_ID/media_publish
  → guarda IDs y marca estado=publicado
```

Si un canal termina y el otro falla, el siguiente intento continúa solo con el canal pendiente. Los
errores quedan en `meta_error`; el scheduler reintenta después de 30 minutos.

## Referencias oficiales

- https://developers.facebook.com/documentation/pages-api/getting-started
- https://developers.facebook.com/documentation/pages-api/posts
- https://developers.facebook.com/documentation/instagram-platform/content-publishing
- https://developers.facebook.com/tools/explorer
