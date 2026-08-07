# Portal de Clientes CVStudio · Instalación

## Estado de Supabase

Si ya ejecutaste `PORTFOLIOS_CLIENTES_MODULO_1.sql` y existe el bucket `portfolio-media`, no necesitás crear políticas manuales en Storage.

El archivo `PORTFOLIOS_CLIENTES_MODULO_2.sql` es seguro para reejecutar y no modifica `storage.objects`.

## Worker independiente

1. Cloudflare → Workers & Pages → Create → Start with Hello World.
2. Nombre: `cvstudio-portfolios`.
3. Reemplazar el código por `config/cloudflare-worker-portfolio.js`.
4. Agregar variables:
   - `SUPABASE_URL`: URL del proyecto.
   - `SUPABASE_ANON_KEY`: Publishable/anon key.
   - `SUPABASE_SERVICE_ROLE_KEY`: Secret key, guardada como Secret.
   - `ADMIN_EMAILS`: correo del administrador SIAC. Se pueden separar varios con comas.
   - `MAX_UPLOAD_BYTES` (opcional): `10485760`.
5. Deploy.
6. Abrir `/health` en la URL del Worker. Debe responder `{"ok":true,"service":"cvstudio-portfolios"}`.
7. Si la URL del Worker es distinta, actualizar `js/portfolio-config.js`.

## Seguridad

- Las contraseñas se gestionan con Supabase Auth.
- El navegador nunca recibe la Service Role.
- El cliente inicia sesión con Supabase Auth, pero perfil, proyectos y cargas pasan por el Worker.
- El Worker verifica el token y que el usuario sea dueño del portfolio.
- El SIAC administrativo se limita a los correos definidos en `ADMIN_EMAILS`.
