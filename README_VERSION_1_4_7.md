# CVStudio v1.4.8 — Formularios inteligentes

## Cambios
- LinkedIn: permite indicar si ya existe un perfil o si debe crearse desde cero.
- El enlace de LinkedIn solo se solicita y valida cuando el cliente indica que ya tiene perfil.
- CV Profesional: permite indicar si existe un CV actual o si debe crearse desde cero.
- Logo: permite indicar si existe un logo actual o si se solicita uno nuevo.
- Diseño Web: consulta de forma simple si el cliente ya dispone de dominio, hosting, logo, textos e imágenes.
- Los campos condicionales se guardan dentro de la solicitud enviada al Worker.
- Se mantiene el alta automática de clientes y el correo como respaldo.

No requiere cambios nuevos en el Worker: el Worker v1.4.6 ya acepta y guarda los campos dinámicos dentro de formData.
