# CVStudio 1.4.47 · Firmas seguras e interfaz final

## Actualización desde v1.4.46

1. Reemplazar los archivos del repositorio local por los de este paquete y publicar el cambio desde GitHub Desktop.
2. En Cloudflare Workers, abrir únicamente el Worker activo **`cvstudio-contacto`**, reemplazar su código por `config/cloudflare-worker-contacto.js` y desplegarlo.
3. No modificar Supabase ni el Cron Trigger si la prueba de v1.4.46 ya funcionó: la tabla, el bucket privado y el cron `*/5 * * * *` quedan vigentes.

## Qué corrige esta versión

- Mantiene las ocho acciones del cliente en una sola fila en escritorio.
- Reduce el ícono de WhatsApp dentro de la barra de acciones.
- Integra el modal de firmas al modo oscuro y vuelve legibles todos sus controles.
- Corrige el botón que quedaba mostrando **Generando…** después de crear el enlace.
- Centraliza la recepción de la firma únicamente en el panel, sin correos ni mensajes automáticos adicionales.

## Uso

En **Centro de Operaciones → Clientes**, abrir el cliente y presionar **Firma**. Generar el enlace y enviarlo por WhatsApp. Cuando el cliente firme, volver a abrir **Firma** para descargar el PNG transparente, disponible durante 30 minutos.

La solicitud vence a las 24 horas si no fue utilizada y cada enlace admite una sola firma.
