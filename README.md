# CVStudio

Sitio público y Centro de Operaciones de CVStudio Argentina.

## Arquitectura operativa

- GitHub Pages publica la web y el Centro de Operaciones.
- Supabase guarda clientes, solicitudes, archivos privados, pagos y estado operativo.
- Cloudflare Workers procesa notificaciones, WhatsApp, Mercado Pago y portfolios.
- Mercado Pago toma los importes desde `servicios_precios`; la web no habilita el checkout si no puede validar ese catálogo remoto.

## Fuentes oficiales

- Worker de contacto, pagos y WhatsApp: `config/cloudflare-worker-contacto.js`
- Worker de portfolios: `config/cloudflare-worker-portfolio.js`
- Formulario público: `js/siac.js`
- Centro de Operaciones: `centro-operaciones-prueba/`
- Despliegue web: `.github/workflows/pages.yml`

Los archivos de `config/`, `docs/`, variables de entorno y fuentes internas de Workers no se publican en GitHub Pages.

## Variables requeridas en Cloudflare

El Worker de contacto requiere las variables y secretos documentados al comienzo de `config/cloudflare-worker-contacto.js`. Para validar mensajes entrantes de WhatsApp debe existir `WHATSAPP_APP_SECRET`.

El Worker de portfolios requiere `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` y `ADMIN_EMAILS`. Los secretos se configuran en Cloudflare; nunca se incorporan al repositorio.

## Despliegue seguro

1. Ejecutar las comprobaciones de sintaxis de la rama.
2. Revisar la comparación contra `main`.
3. Fusionar la rama aprobada.
4. Confirmar que GitHub Pages finalizó correctamente.
5. Desplegar manualmente los Workers desde sus fuentes oficiales y comprobar sus endpoints de salud.
6. Realizar una solicitud de prueba con un archivo y verificar que aparezca en Clientes, Notificaciones y Archivos.
7. Realizar un pago de prueba únicamente con el modo de prueba habilitado.

## Acceso

El Centro de Operaciones exige sesión válida y autorización como Director o colaborador activo registrado. Los adjuntos de clientes permanecen en buckets privados y se descargan mediante una sesión autorizada.
