# CVStudio v1.4.9 — Formulario vinculado al cliente existente

- Los enlaces generados desde Clientes incluyen el identificador real del cliente y de su solicitud.
- El formulario precarga nombre, WhatsApp, correo y localidad disponibles.
- Al enviarse desde el panel, actualiza la ficha y la solicitud existentes: no duplica clientes.
- La solicitud cambia a `Formulario recibido` y guarda todas las respuestas en Supabase.
- Los formularios iniciados directamente desde la web continúan creando una consulta nueva.
- Requiere desplegar `config/cloudflare-worker-contacto.js` en el Worker `cvstudio-contacto`.
