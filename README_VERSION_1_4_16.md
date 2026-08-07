# CVStudio v1.4.16

## Corrección de formularios

- Los formularios completados notifican a **cvstudioargentina@gmail.com**.
- Se agregó una acción específica del Worker para notificar formularios sin duplicar clientes ni solicitudes.
- Se corrigió el envío de localidad al Worker.
- La ficha continúa guardándose en Supabase/Centro de Operaciones.
- El correo incluye cliente, WhatsApp, correo, localidad, servicio, código y todas las respuestas.

## Despliegue necesario

Además de publicar los archivos de la web, hay que copiar el contenido actualizado de `WORKER_CVSTUDIO_CONTACTO_ESTABLE.js` al Cloudflare Worker y desplegarlo. El Worker debe conservar el secreto `RESEND_API_KEY`.
