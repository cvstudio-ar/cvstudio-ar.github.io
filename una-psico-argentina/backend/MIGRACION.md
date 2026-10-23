# Una Psico Argentina configuración de la beta y entrega

La beta usa la carpeta `una-psico-argentina` del repositorio de CVStudio y el proyecto Supabase de CVStudio. La migración a las cuentas del cliente sigue pendiente hasta contar con el dominio y los accesos de destino. No eliminar recursos de CVStudio durante el desarrollo.

## Configuración separada

- `config.js` contiene únicamente la URL pública de la API. La web y el panel leen ese mismo archivo. Al migrar, cambiar allí el destino de Supabase. Los scripts conservan un valor de respaldo de la beta para páginas antiguas en caché; al entregar, actualizar o retirar también ese respaldo.
- `backend/psico-api.ts` conserva la función desplegada. Utiliza los secretos del proyecto de destino `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`, y la variable `PSICO_ALLOWED_ORIGINS` con los dominios autorizados separados por comas. Sin esa variable usa los orígenes de la beta de CVStudio.
- Ninguna contraseña ni credencial de PayPal o del banco debe incluirse en el código del navegador. Los secretos de pago se configurarán únicamente en el backend de la cuenta que corresponda.
- La URL pública actual del proyecto Supabase se utiliza durante la beta; no es la configuración definitiva del cliente.

## Datos y recursos propios del proyecto

Copiar únicamente las tablas `psico_site_content`, `psico_admin_accounts`, `psico_admin_sessions`, `psico_login_attempts` y `psico_admissions`, sus índices y reglas de acceso. No exportar toda la base de CVStudio porque contiene otros proyectos. Las sesiones y los intentos de acceso son temporales: iniciar sesiones nuevas en destino.

Migrar los contenidos y registros de cuentas conservando los hashes, sales e iteraciones de contraseña. Nunca exportar contraseñas en texto plano. Revisar las políticas y permisos de las tablas antes de habilitar el destino.

Copiar los archivos de los buckets `psico-audios` (privado) y `psico-season-covers` (público). Conservar los nombres de los archivos de audio y actualizar las URL absolutas de portadas o logos guardadas en los contenidos. Los límites actuales son 40 MB por audio y 5 MB por portada.

## Registro y suscripción

El alta autónoma guarda usuario, correo normalizado, hash de contraseña, fecha y origen del registro. Siempre crea una cuenta de tipo suscriptor sin vigencia de suscripción. Iniciar sesión no concede acceso a los audios privados.

En esta etapa no hay cobros ni activación automática por PayPal o banco. Cuando el cliente confirme proveedor, importe, moneda, duración y credenciales, integrar la confirmación de pago con autenticación del proveedor y control de eventos duplicados. La vigencia debe activarse únicamente tras verificar el pago en servidor. Volver a una URL de éxito desde el navegador no acredita un pago.

Cloudflare publica o dirige la web; la cuenta y su vigencia se consultan en Supabase. La integración de pagos deberá usar los dominios y cuentas de destino. Si se prueba antes de la entrega, usar entorno de pruebas del proveedor y cambiar los callbacks/webhooks al migrar.

## Secuencia de entrega

1. Preparar dominio, repositorio, Cloudflare, Supabase y cuenta de cobro del cliente.
2. Respaldar exclusivamente el proyecto y sus datos; copiar código, esquema, contenidos y archivos a destino.
3. Configurar API, dominios autorizados, secretos y URL de pago, retornos y webhooks.
4. Verificar registro, acceso administrativo, usuarios, caducidad de suscripción, carga y reproducción privada de audios, portadas y confirmación de pago. Probar el bloqueo sin pago y los eventos duplicados.
5. Coordinar el cambio definitivo y evitar nuevas escrituras en la beta durante la copia final.
6. Verificar el dominio definitivo y entregar accesos al cliente.
7. Solo después de validar la entrega, retirar la carpeta y los recursos exclusivos de Una Psico Argentina de CVStudio. No borrar ni modificar recursos compartidos por otros proyectos.



## Admisiones digitales y biblioteca de recursos

Aplicar también `admision-digital.sql` al preparar un destino nuevo que ya tenga las tablas base. Incluir la función `psico_register_with_admission`, sus permisos exclusivos de service_role y el acceso cerrado de `psico_admissions`. Las cuentas y admisiones nuevas se crean en una sola transacción. No exportar respuestas a archivos de código ni a repositorios; migrar los registros confidenciales por un canal privado.

Los formularios conservan la versión `2026-10-v1` y la autorización de recepción de las respuestas. El panel muestra un aviso sin respuestas clínicas; solo administradores autenticados pueden abrir los formularios. Ninguna respuesta provoca una decisión clínica automática. Los usuarios no pueden consultar las respuestas de otros usuarios.

Los audios de Recursos se conservan en la misma biblioteca privada de episodios con `kind: resource`. Se administran en Podcast y recursos y se muestran en la tarjeta Recursos dentro de Podcast. Se mantienen los nombres de archivos al trasladar el bucket privado.

El dominio de CVStudio continúa siendo la beta. Los pagos reales, sus credenciales y webhooks siguen pendientes de confirmación; completar la admisión no realiza un cobro ni activa el acceso.
