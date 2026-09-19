# Portal de clientes · instalación del Worker independiente

Supabase ya fue preparado con `PORTFOLIOS_CLIENTES_MODULO_1.sql`.

## 1. Crear el Worker

En Cloudflare: **Workers & Pages → Create → Worker**.

Nombre recomendado:

`cvstudio-portfolios`

Pegá el contenido completo de:

`config/cloudflare-worker-portfolio.js`

Luego presioná **Deploy**.

## 2. Agregar el secreto

En el Worker nuevo:

**Settings → Variables and Secrets → Add**

Nombre:

`SUPABASE_SERVICE_ROLE_KEY`

Valor: la misma clave secreta `sb_secret_...` que utiliza el Worker del SIAC.

Debe guardarse como **Secret**.

## 3. Confirmar la URL

La configuración incluida espera:

`https://cvstudio-portfolios.cvpro-duccionesar.workers.dev`

Si Cloudflare genera otra dirección, cambiá solamente esta línea en:

`js/portfolio-config.js`

## 4. Publicar la web

Subí el proyecto a GitHub Pages y recargá el panel con `Ctrl + Shift + R`.

Ingresá al SIAC, abrí **Portfolios de clientes** y probá crear un cliente en estado **Borrador**.

## Seguridad

- El Worker de contacto y correos no se reemplaza.
- El Worker nuevo solo acepta peticiones desde CVStudio y localhost.
- Todas las operaciones administrativas validan la sesión del administrador.
- Las contraseñas se guardan únicamente en Supabase Auth.
