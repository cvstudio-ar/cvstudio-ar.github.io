# CVStudio 1.4.46 · Firmas seguras

## Instalación

1. En Supabase, abrir **SQL Editor** y ejecutar `docs/migraciones/SUPABASE_FIRMAS_V1.4.46.sql`.
2. En Cloudflare Workers, reemplazar el código del Worker de contacto por `config/cloudflare-worker-contacto.js` y desplegarlo.
3. En el Worker, conservar las variables actuales (`SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, etc.).
4. Crear un **Cron Trigger** para el Worker con la expresión `*/5 * * * *`. Así, las firmas vencidas se eliminan físicamente como máximo cinco minutos después de cumplirse los 30 minutos. Aunque el cron todavía no haya corrido, el panel bloquea su descarga desde el momento del vencimiento.
5. Publicar el contenido del sitio en GitHub Pages.

## Notificaciones

- **Panel:** funciona automáticamente y es la fuente principal para descargar el PNG.
- **Correo:** se envía al correo configurado en `FORM_NOTIFICATION_EMAIL` mediante Resend.
- **WhatsApp de respaldo (opcional):** definir `SIGNATURE_NOTIFY_WHATSAPP` con el número internacional de CVStudio. Reutiliza `WHATSAPP_PHONE_NUMBER_ID` y `WHATSAPP_ACCESS_TOKEN`.

## Uso

En **Centro de Operaciones → Clientes**, abrir el cliente y presionar **Firma**. Generar la solicitud y enviarla por WhatsApp. El cliente firma sin iniciar sesión; al enviarla, el panel mostrará el estado **recibida** y permitirá descargar un PNG transparente durante 30 minutos.

La solicitud de firma vence a las 24 horas si el cliente no la utiliza. Cada enlace puede usarse una sola vez.
