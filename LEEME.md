# Estudio Jurídico Marcos A. Pousa

Sitio web para entrega al titular. Abrir **index.html** para revisar y subir todos los archivos de esta carpeta a la raíz del repositorio del cliente. Conservar el directorio **assets** tal cual.

## Publicación

- En GitHub: subir **index.html** y la carpeta **assets/** a la raíz del repositorio.
- Conectar ese repositorio a Cloudflare Pages y configurar como directorio de salida la raíz.
- Asociar el dominio en Cloudflare después de revisar los registros DNS existentes, especialmente si usa correo.
- Revisar fotografía, enlaces de contacto, responsive y HTTPS.

## Administración y seguridad

La administración incluida guarda los cambios **solamente en el navegador** y **no tiene autenticación segura de servidor**. No usarla como mecanismo de seguridad para datos de clientes. Antes de entregar un panel de gestión real, conectarlo a Supabase Auth y almacenamiento persistente con permisos adecuados. La contraseña incrustada en HTML no protege datos sensibles.

La imagen ambiental de la portada utiliza una fotografía externa de Unsplash; requiere conexión a Internet.
