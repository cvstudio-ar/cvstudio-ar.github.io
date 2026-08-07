# CVStudio v1.4.33

Build: `20260806-1140`

## Cambios
- Build ID único para CSS y JavaScript del Centro de Operaciones.
- `version.json` y comprobación automática de nueva publicación.
- Reintento automático de sesión Supabase antes de enviar por WhatsApp.
- El endpoint `whatsapp-admin-send` acepta una sesión Supabase válida del panel y ya no depende exclusivamente de un UUID administrativo fijo.
- Worker release: `v2.9.1-whatsapp-auth-fix`.

## Importante
Para que el envío funcione, además de subir este ZIP a GitHub, hay que copiar y desplegar `config/cloudflare-worker-contacto.js` en el Worker `cvstudio-contacto`. El ZIP del sitio no despliega el Worker automáticamente.
