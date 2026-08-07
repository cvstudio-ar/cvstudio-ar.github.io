# CVStudio v1.4.28 · WhatsApp Cloud API (entorno de prueba)

## Incluye
- Verificación GET y recepción POST en `/webhooks/whatsapp`.
- Alta automática de cliente y solicitud desde mensajes entrantes.
- Registro del historial en `comunicaciones`.
- Envío de mensajes desde la ficha del cliente mediante `whatsapp-admin-send`.
- Estados de entrega leídos desde los webhooks de Meta.

## Secrets del Cloudflare Worker
- `WHATSAPP_VERIFY_TOKEN`: token privado elegido por CVStudio.
- `WHATSAPP_ACCESS_TOKEN`: token nuevo generado en Meta (no incluir en GitHub).
- `WHATSAPP_PHONE_NUMBER_ID`: Phone Number ID del número de prueba.
- `WHATSAPP_WABA_ID`: identificador de la cuenta de WhatsApp Business.

## Meta
URL de devolución: `https://cvstudio-contacto.cvpro-duccionesar.workers.dev/webhooks/whatsapp`
Token de verificación: exactamente el mismo valor guardado como `WHATSAPP_VERIFY_TOKEN`.

Después de verificar, suscribir el campo `messages`.
