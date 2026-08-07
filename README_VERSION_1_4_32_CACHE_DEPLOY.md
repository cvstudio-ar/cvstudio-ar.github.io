# CVStudio v1.4.32 — corrección de actualización

## Corrección aplicada
- Todos los recursos del Centro de Operaciones usan el mismo identificador de versión `v1.4.32`.
- Se eliminaron referencias de caché antiguas de `app.js`, `app.css`, `settings.js`, `collaborators.js`, `supabase-operational.js` y `access-session.js`.
- Se agregaron directivas HTML para evitar que el navegador conserve el documento principal anterior.
- La versión visible del panel y la versión interna ahora coinciden.

## Importante
El archivo `config/cloudflare-worker-contacto.js` se despliega por separado en Cloudflare Workers. Subir este ZIP al hosting/GitHub Pages no actualiza el Worker de WhatsApp. Para que `whatsapp-admin-send` funcione, el Worker publicado debe contener esa acción y sus variables `WHATSAPP_PHONE_NUMBER_ID` y `WHATSAPP_ACCESS_TOKEN`.
