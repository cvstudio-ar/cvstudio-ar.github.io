# Centro de Operaciones CVStudio · RC8 v2.8

## Incluye
- Alta automática de usuario Supabase Auth desde Nuevo colaborador.
- Correo corporativo generado desde nombre y apellido.
- Contraseña temporal definida por administrador.
- Cambio obligatorio de contraseña en primer ingreso.
- Cierre de sesión por 10 minutos de inactividad, con aviso a los 9 minutos.
- LED de presencia: verde en línea, amarillo ausente, rojo desconectado.
- Nombre y correo separados correctamente.

## Paso servidor obligatorio
Publicar `config/cloudflare-worker-contacto.js` en el Worker `cvstudio-contacto`. No requiere SQL nuevo.
