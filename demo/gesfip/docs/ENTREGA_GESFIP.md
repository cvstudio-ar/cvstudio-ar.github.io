# GESFIP — implementación aislada y preparación del dominio

## Proyecto aprobado
- Demo de referencia: https://cvstudio.com.ar/demo/gesfip/
- Dominio comprado por el cliente (confirmación recibida): **gesfipsamsbert.com**. El registro puede tardar en pasar a activo; antes de modificar DNS confirmar que responde y está habilitado.
- No se modifica la demo ni las webs existentes de CVStudio hasta revisar el PR y trasladar este proyecto a un repositorio privado propio.

## Estilo aprobado
- Negro profundo #070d13 y dorado #eeb24c.
- Se preservan logo, textos, 8 servicios, 5 operaciones y ventanas descriptivas.
- Cada imagen tiene un espacio específico y se puede reemplazar sin cambiar las demás.

## Mapa de las imágenes (16 posiciones)
1. Portada general: patrulla y personal de GESFIP.
2. Sobre nosotros: equipo profesional / custodia.
3. Nuestro equipo: personal GESFIP en acceso.
4. Seguridad física.
5. Monitoreo.
6. Gestión de riesgos.
7. Custodia de personas.
8. Seguridad para empresas.
9. Country y barrios.
10. Silos y campos.
11. Hoteles y eventos.
12. Recorridos perimetrales.
13. Patrulla por límites.
14. Control con QR.
15. Control de ingresos.
16. Control de mercadería.

Los archivos originales aportados por el cliente incluyen textos publicitarios en bordes. Para uso web se optimizan las fotografías conservando las personas, prendas y escenarios de las piezas compartidas. No afirmar que son originales en 4K.

## Panel de contenidos
- Página estática /admin/.
- Cloudflare Access valida JWT y correo autorizado.
- Guardado remoto con binding KV `GESFIP_CONFIG`.
- Subida de JPG / PNG / WebP hasta 3 MB, con control de formato y recomendación de resolución mínima.
- Reemplazo individual para 16 posiciones, manteniendo fallback a imágenes existentes.
- Edición de textos, servicios, operaciones, WhatsApp, email, portada y colores.
- Almacenamiento de versión anterior de configuración por 90 días.

## Importante
Las imágenes entregadas por el cliente se procesaron por separado en un paquete llamado `GESFIP_fotografias_optimizadas.zip`, con nombres que corresponden a la lista de 16 posiciones. **Aún no están cargadas en Cloudflare KV ni embebidas en esta rama Git**. No describirlas como publicadas hasta subirlas por el panel ya configurado.

## Conexión final a Cloudflare Pages
1. Crear un **repositorio privado independiente** `cvstudio-ar/gesfip-web` para el cliente, partiendo de este subproyecto. No usar `cvstudio-plantilla-web` como sustituto visual ni editar `cvstudio-ar.github.io` producción.
2. En el Cloudflare existente de CVStudio, Pages → Connect Git al repositorio GESFIP. Construir con Node 22+, `npm run build`, salida `dist`.
3. Crear namespace de Workers KV exclusivo `gesfip-config`. En el proyecto Pages vincular nombre de variable `GESFIP_CONFIG` a ese namespace. Cloudflare exige un nuevo deployment tras configurar bindings.
4. Crear aplicación de Cloudflare Zero Trust Access para las rutas administrativas; configurar la política de email autorizado con el responsable del cliente (confirmar dirección previamente). Configurar variables `CF_ACCESS_DOMAIN` (URL HTTPS), `CF_ACCESS_AUD` (audiencia Access) y `GESFIP_ADMIN_EMAIL` (correo permitido).
5. Probar lectura pública, edición, subida de fotos, cierre de sesión, bloqueo de usuario no autorizado y visualización mobile. Si las pruebas fallan, no conectar el dominio.
6. Vincular **gesfipsamsbert.com** y si corresponde `www.gesfipsamsbert.com`. Configurar DNS en la cuenta del registrador exclusivamente cuando el dominio esté activo y los datos de Cloudflare se hayan verificado.
7. Establecer variable build `GESFIP_PUBLIC_URL=https://gesfipsamsbert.com` para habilitar canonical, sitemap e indexación en el despliegue definitivo.
8. Comprobar SSL, redirección HTTPS y www, Search Console, sitemap, respuestas 200 y accesos administrativos.
9. Nunca publicar el panel sin Access o sin KV funcional.

## Pruebas
GitHub Actions valida código y compilación en rama `feature/gesfip-entrega-dominio`; PR antes de incorporar cambios en la demo. No se han realizado todavía pruebas end-to-end sobre dominio final.
