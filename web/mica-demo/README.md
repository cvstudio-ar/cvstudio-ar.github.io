# MICA · demo CVStudio

Ruta: `/web/mica-demo/` en el repositorio cvstudio-ar/cvstudio-ar.github.io.

Portada editorial responsive, catálogo con búsqueda y filtros, ficha con opciones, selección persistente en el dispositivo y consultas por WhatsApp. Los seis productos y precios iniciales son ilustrativos, señalados como demostración.

## Administración

Tocar el logo MICA. Acceso con la cuenta administradora existente de CVStudio y su contraseña habitual. No se creó ni cambió ninguna contraseña. El acceso se autoriza exclusivamente mediante `mica_managers`; no se permite registro público ni escrituras anónimas.

Permite agregar, editar y eliminar productos, subir una imagen JPEG/PNG/WebP de hasta 5 MB o usar un enlace HTTPS, cambiar precios, categoría, descripción, opciones, orden, disponibilidad, visibilidad y destacados. Permite cambiar WhatsApp, Instagram y textos de portada. Los cambios se guardan en Supabase y se consultan al abrir el catálogo. Las actualizaciones usan comparación de `updated_at` para evitar sobrescribir cambios de otra sesión.

Datos aislados en `mica_products`, `mica_settings`, `mica_managers` y bucket `mica-products`. La clave publicada en el cliente es de tipo publishable y las escrituras están protegidas con RLS. La librería supabase-js 2.57.4 está incluida localmente. No hay dependencias externas de tipografía o de imágenes.

El WhatsApp inicial corresponde al contacto comercial público de CVStudio. Cambiarlo desde Mi boutique cuando exista un contacto propio. La selección no confirma una venta ni procesa pagos.

## Publicación

Archivos estáticos sin build. Conservar las rutas relativas dentro de esta carpeta. Las migraciones `mica_demo_catalogue` y `mica_demo_public_read_policy` ya fueron aplicadas al proyecto cvstudio-core; no volver a aplicarlas. No modificar otros negocios para publicar esta demo.
