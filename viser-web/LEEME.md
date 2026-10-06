# VISER · Entrega inicial

Web responsive basada en la propuesta aprobada: logo circular, portada industrial azul, título “Energía que no se corta”, botones azules y verdes, servicios, filtros y tarjetas. Las imágenes de producto están separadas de título, descripción y precio. Incluye los tres equipos confirmados, sin precios ni stock inventados. La portada es ilustrativa; las fotos de catálogo corresponden al material entregado. La foto LOGUS fue limpiada mediante edición generativa.

## Estado

El catálogo funciona con los archivos incluidos. El panel contiene ingreso real, alta, edición y eliminación de productos, imágenes, precio ARS/USD, stock, categoría, visibilidad, orden, portada y contacto. No permite guardar hasta conectar Supabase. No usa una contraseña embebida ni simula sincronización con localStorage. No se publicaron archivos ni se modificó Donweb.

Confirmados: WhatsApp +54 9 381 635-5637, info@viserint.com y Av. Francisco de Aguirre 1598, San Miguel de Tucumán, Tucumán. Pendientes: enlaces de las redes que creará CVStudio, precios y stock, horarios y zonas de envío.

## Revisar en tu computadora

Extraer ZIP. En la carpeta viser-web ejecutar `python -m http.server 8080` y abrir http://localhost:8080. Los módulos requieren servidor HTTP; no abrir index.html mediante doble clic. No requiere npm para visualizar ni para subir los archivos.

## Activar administración

1. Elegir un proyecto Supabase exclusivo para VISER, evitando mezclarlo con CVStudio o cabañas. La creación del proyecto y los costos dependen de la cuenta y deben definirse antes de contratar.
2. Ejecutar `database/instalar.sql` una vez mediante SQL Editor. El script crea tablas, permisos y bucket de imágenes. No contiene credenciales. Si falla, la transacción de tablas se revierte; revisar antes de repetir.
3. En Authentication > Users crear la cuenta administradora con correo confirmado y contraseña privada. Copiar su UUID.
4. En SQL Editor ejecutar `insert into public.viser_admins(user_id) values ('UUID_REAL_DEL_USUARIO');` reemplazando el marcador. Este permiso se otorga desde el servidor; otros usuarios autenticados no pueden editar VISER.
5. Completar config.js con URL del proyecto y clave PUBLICABLE. Nunca usar service_role ni clave secreta. Completar whatsapp con código país, por ejemplo 549..., sin 0 ni 15, y los demás contactos.
6. Inicializar también la fila viser_settings con el contacto definitivo mediante SQL Editor. El panel lo puede modificar después. Cuando hay conexión, esta fila es la fuente del contacto.
7. Ingresar a admin.html, editar un producto y comprobar desde otro dispositivo sin sesión. Confirmar carga de imágenes, precio, stock, portada y cierre de sesión. El público consulta los cambios al cargar, al regresar a la pestaña y cada 30 segundos.
8. Validar que sin sesión no se pueda escribir; revisar advisors de Supabase. No se probó la conexión real en esta entrega porque el proyecto de VISER aún no está seleccionado.

## Publicar

Usar alojamiento estático HTTPS con soporte de dominio propio, por ejemplo Cloudflare Pages o el hosting contratado. No mezclar la carpeta con los otros proyectos. Subir a la raíz index.html, admin.html, styles.css, app.js, admin.js, shared.js, config.js, products.js, robots.txt y assets/. No publicar node_modules, database ni documentos de instalación. Para Cloudflare Pages, directorio de salida de estos archivos y sin comando de compilación (los JS ya están preparados).

Primero probar en URL temporal. Después configurar viserint.com según los registros que indique el alojamiento elegido. Antes exportar toda la zona DNS Donweb. Conservar MX, DKIM, SPF, DMARC y registros del correo; verificar cualquier A/AAAA que cambie y su dependencia en el correo antes de editar. No cambiar nameservers ni eliminar la zona. No indicar A/AAAA genéricos: dependen del proveedor que se elija.

## Buscadores

Título y descripción preparados, administración con noindex. Agregar canonical, URL absoluta de imagen social y sitemap cuando se confirme el dominio HTTPS final. Solicitar indexación en Search Console después de publicar y comprobar. No se garantizan posiciones.

## Desarrollo

SDK Supabase 2.117.2 empaquetado localmente, licencia MIT incluida; package-lock fija dependencias. Para reconstruir: npm ci y npm run build:sdk. Archivos de código separados y editables. Fotos optimizadas en WebP, object-fit contain en catálogo para no recortar equipos.
