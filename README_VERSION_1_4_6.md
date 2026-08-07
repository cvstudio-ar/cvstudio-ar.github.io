# CVStudio v1.4.6 — Alta automática desde formularios

- Localidad obligatoria en formularios guiados.
- Alta automática de cliente en Supabase con nombre, correo, WhatsApp y localidad.
- Detección de clientes existentes por correo o WhatsApp para evitar duplicados.
- Creación automática de una solicitud con estado `Nuevo formulario recibido`.
- Aparición en Clientes/Producción mediante la sincronización real del Centro de Operaciones.
- El correo continúa como respaldo.

Para activar la persistencia hay que publicar `config/cloudflare-worker-contacto.js` en el Worker de contacto.
