# Portada compartida de Por Un Mundo Satvico

La activación del cliente requiere desplegar y comprobar primero el servidor.

## Activación

1. Aprobar y aplicar `supabase/satvico-sync.sql` en cvstudio-core. Crea tablas exclusivas de este sitio, sin acceso directo desde los roles anon/authenticated, y un bucket público solo para material de portada. Conserva la comprobación de la contraseña administrativa actual y agrega sesiones de cuatro horas con límites de intentos. No modifica usuarios ni tablas de otros sitios.
2. Desplegar `index.ts` como Edge Function `satvico-sync`, con `verify_jwt: false`. La lectura pública es intencional; las operaciones de escritura validan su propia sesión en el servidor. La función usa las variables estándar del entorno Supabase; no colocar service_role en el cliente.
3. Verificar lectura pública, rechazo de escritura sin sesión, inicio de sesión real, subida firmada y conflicto de versiones. Comprobar que el archivo publicado abre desde otro navegador. Ejecutar los asesores de seguridad del proyecto.
4. Publicar los cuatro archivos del directorio web: `index.html`, `app.js`, `sync.js` y `sync-config.js`.
5. En la PC que conserva el video nuevo, ingresar a Administración → Configuración → Recuperar configuración anterior de este dispositivo. Revisar y pulsar Publicar portada. El respaldo local no se elimina.

## Alcance

Sincroniza portada, logo, textos, colores, contacto, ubicación e imágenes de los espacios. La biblioteca de prácticas y los perfiles de demostración continúan locales y no se envían al endpoint público.

Cada archivo recibe un nombre nuevo para evitar versiones viejas en caché. Imágenes hasta 4 MB; videos hasta 50 MB. Los visitantes consultan cambios al volver a la pestaña y cada 30 segundos mientras la página está visible. Si otro administrador publicó mientras se editaba, se requiere revisar la versión nueva antes de sobrescribirla.

Validación local: `node --test tests/satvico-sync.test.cjs` y `node --check` para ambos archivos JavaScript. Las pruebas usan un servidor simulado; no sustituyen la comprobación de subida y lectura en producción.

## Traslado a las cuentas de Romina

El sitio no depende de una cuenta propietaria en el código. El navegador usa solo la dirección pública de `sync-config.js`; las claves privadas se obtienen del entorno del proyecto destino.

1. Copiar el directorio estático `web/por-un-mundo-satvico` a su repositorio/hosting.
2. Crear el proyecto de Supabase del cliente y aplicar `supabase/satvico-sync.sql` (plantilla sin contraseñas de CVStudio).
3. Ejecutar `transfer.py export --endpoint URL_ACTUAL_DE_LA_FUNCION --out satvico-backup`. Guarda configuración, archivos subidos y verificaciones SHA-256. Los recursos estáticos viajan con el repositorio.
4. En un entorno privado configurar `TARGET_SUPABASE_URL`, `TARGET_SUPABASE_SERVICE_KEY` y una contraseña nueva `SATVICO_ADMIN_PASSWORD`. Ejecutar `transfer.py import --bundle satvico-backup` solo en el proyecto nuevo. Este comando reemplaza la configuración del destino y establece la nueva credencial; no se ejecuta sobre el proyecto actual.
5. Desplegar `index.ts` en el proyecto destino y configurar `SATVICO_ALLOWED_ORIGINS` con el dominio final. Actualizar `sync-config.js` con el endpoint nuevo y cambiar su parámetro de versión en `index.html`.
6. Probar el acceso, una nueva subida, apertura desde celular/PC y los enlaces de medios. Mantener la cuenta original hasta comprobar la transferencia.

La exportación no incluye sesiones, credenciales, datos de alumnos ni tablas de otros clientes. La biblioteca y perfiles de demostración son locales y requieren un trabajo separado si se convierten en servicios reales.
