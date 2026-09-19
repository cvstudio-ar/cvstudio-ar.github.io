# Centro de Operaciones CVStudio RC9.1

Versión consolidada con autenticación Supabase, jerarquía Aprendiz/Operario/Líder/Supervisor/Director, permisos por módulo y acción, gestión administrativa de colaboradores, presencia, caducidad por inactividad e identidad visual actualizada.

## Seguridad
- Las rutas requieren sesión válida.
- Los módulos y acciones se validan por nivel.
- El propietario `pablexe@cvstudio.com.ar` conserva nivel Director incluso ante fichas heredadas.
- Los usuarios autenticados sin ficha corporativa son desconectados.
- La sesión caduca luego de 10 minutos de inactividad.

## Cloudflare
Para altas, edición, suspensión y eliminación de usuarios, publicar `config/cloudflare-worker-contacto.js` y conservar configurado el secret `SUPABASE_SERVICE_ROLE_KEY`.
