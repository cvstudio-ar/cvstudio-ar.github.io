# Portal de clientes y catálogo comercial v5.2

## Orden de instalación

1. En Supabase SQL Editor, ejecutar `docs/migraciones/CATALOGO_COMERCIAL_CLIENTES_V5.2.sql`.
2. En Cloudflare Workers, reemplazar el código del Worker de portfolios con `config/cloudflare-worker-portfolio.js` y desplegar.
3. Publicar el contenido completo de la carpeta `cvstudio` en el repositorio del sitio.
4. Abrir el módulo de portfolios de Administración y crear el cliente.

## Alta recomendada para Casa Morita

- Marca: `Bazar Casa Morita`
- URL: `bazar-casa-morita`
- Actividad: `Bazar, hogar y regalos`
- Tipo de espacio: `Catálogo comercial`
- Plantilla: `LOCAL / Servicios y comercios`
- Estado inicial: `Activo`
- Instagram: `https://www.instagram.com/bazarcasamorita/`

El sistema generará el usuario y la contraseña. El cliente ingresará desde `https://cvstudio.com.ar/clientes/` o desde el botón Cliente de la portada.

## Comprobación

1. Iniciar sesión como Casa Morita.
2. Abrir `Mis productos`.
3. Crear un producto con foto principal.
4. Marcarlo como publicado.
5. Abrir `Vista previa` y confirmar que aparece en `https://cvstudio.com.ar/bazar-casa-morita/`.

Si todavía no hay productos publicados o la cuenta aún no fue creada, la página conserva automáticamente el catálogo demostrativo incluido en el proyecto.
