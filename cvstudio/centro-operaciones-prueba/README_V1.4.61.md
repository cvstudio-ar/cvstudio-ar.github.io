# CVStudio Centro de Operaciones · v1.4.61

## Canva OAuth

1. Ejecutar `docs/supabase/CANVA_OAUTH_V1.4.61.sql` en Supabase SQL Editor.
2. Publicar `config/cloudflare-worker-contacto.js` en el Worker de contacto.
3. Agregar en Cloudflare los Secrets `CANVA_CLIENT_ID` y `CANVA_CLIENT_SECRET`.
4. Registrar en Canva la URL:
   `https://cvstudio-contacto.cvpro-duccionesar.workers.dev/oauth/canva/callback`
5. Publicar el sitio y pulsar **Vincular** en la tarjeta Canva.

Los tokens de Canva no se exponen al navegador ni al repositorio. Las tablas OAuth
solo son accesibles mediante `service_role` desde el Worker.
