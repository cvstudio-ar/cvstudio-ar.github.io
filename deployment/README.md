# Despliegues CVStudio: pruebas y producción

Preparado en `feature/marketing-intelligence`. No se fusionó a `main`, no se desplegó ningún Worker y solo se aprovisionó la nueva base aislada de pruebas. Producción y los recursos de Javier no se modificaron. Actualizado: 2026-11-16 UTC.

## Qué está automatizado

`worker-staging.yml` ejecuta tests, compila una variante aislada del Worker, valida con Wrangler `--dry-run`, ejecuta health/acceso denegado en workerd local y conserva un bundle de validación. Pushes a la rama de desarrollo y PRs disparan estos controles. El bundle de validación usa destinos ficticios y no debe desplegarse.

El job `deploy` vuelve a compilar con las variables del entorno `cvstudio-staging`, publica exclusivamente `cvstudio-contacto-pruebas` y verifica por HTTPS la revisión exacta y el rechazo de peticiones anónimas. Solo se habilita cuando la variable **del repositorio** `CVSTUDIO_STAGING_DEPLOY_ENABLED` vale `true`. No se ejecuta en PRs ni en otra rama. Por ahora no se habilitó.

Wrangler 4.162.0 está fijado con lockfile y las acciones de checkout, Node y artefactos están fijadas por SHA. Los secretos viajan en un archivo temporal JSON con modo 0600, se cargan junto a la versión mediante `--secrets-file` y se eliminan al terminar. Ningún artefacto incluye secretos. El flujo no crea pedidos ni pagos automáticamente.

## Separación de recursos

| Recurso | Pruebas | Producción |
|---|---|---|
| Worker | `cvstudio-contacto-pruebas` | `cvstudio-contacto`, sin cambios |
| GitHub Environment | `cvstudio-staging`, pendiente de configurar | `cvstudio-production`, pendiente de configurar |
| Supabase | `cvstudio-marketing-pruebas`, creado y verificado | `cvstudio-core`, solo lectura durante esta tarea |
| Origen frontend | Nombre `cvstudio-marketing-pruebas.*` o `cvstudio-contacto-pruebas.*` | `cvstudio.com.ar`, rechazado en staging |
| Credenciales | Secretos de staging, independientes | No se leyeron ni copiaron |
| Correos/WhatsApp | Correo simulado explícitamente; WhatsApp bloqueado | Sin cambios |
| Pagos | Solo credenciales `TEST-`, checkout sandbox y pagos con `live_mode=false` | Sin cambios |
| Cron/rutas de dominios | Vacíos | Configuración actual no inspeccionada ni alterada |

La compilación transforma exclusivamente la copia generada: no modifica `config/cloudflare-worker-contacto.js`. Reemplaza las conexiones fijas de Supabase y los callbacks. El runtime restringe tablas y destinos de red, bloquea redirecciones, funciones administrativas, Tiendanube, Canva y Meta, e ignora bindings con nombres de producción. Se bloquean expresamente los proyectos Supabase de producción y Javier.

El Worker requiere `X-CVStudio-Test-Key` en las llamadas de prueba. No incrustar esta clave en un frontend público. `/health` es público y no expone credenciales. El webhook de Mercado Pago consulta al proveedor con la credencial TEST y rechaza pagos con `live_mode` distinto de false; no toma el estado de pago del cuerpo recibido. Sin credencial TEST se pueden probar formularios, pero no pagos. El filtro de formato de credencial es conservador: otros formatos requieren verificar el modo de la aplicación antes de revisar este filtro.

## Configuración indispensable para activar staging

La conexión GitHub disponible permite commits y PRs, pero no administra Environments, secretos o variables. No hay sesión `gh` autenticada. Por ello los siguientes ajustes todavía no fueron aplicados:

1. Crear `cvstudio-staging`, restringido a `feature/marketing-intelligence`. Configurar los valores siguientes. Mantener `CVSTUDIO_STAGING_DEPLOY_ENABLED` ausente hasta completar backend, revisión de token y variables.
2. Crear `cvstudio-production` restringido a `main`, con revisor obligatorio y sin autoaprobación. No cargar ni habilitar credenciales de producción en esta etapa.
3. Cloudflare: aportar por canal seguro un token para Workers Scripts/Edit limitado a la cuenta CVStudio y el ID de esa cuenta. El permiso de Cloudflare puede abarcar otros Workers de la cuenta: el workflow fija el destino por nombre y no acepta un destino arbitrario. No se solicitó acceso a recursos de Javier.

| Tipo en `cvstudio-staging` | Nombre | Uso |
|---|---|---|
| Secret | `CLOUDFLARE_STAGING_API_TOKEN` | Despliegue desde GitHub, nunca por el navegador de Work |
| Variable | `CLOUDFLARE_ACCOUNT_ID` | Cuenta CVStudio verificada |
| Variable | `STAGING_SUPABASE_URL` | URL del nuevo proyecto aislado |
| Variable | `STAGING_SUPABASE_PUBLISHABLE_KEY` | Clave pública del nuevo proyecto |
| Variable | `STAGING_SITE_ORIGIN` | Origen HTTPS de pruebas, sin barra final |
| Variable | `STAGING_WORKER_URL` | URL real de `cvstudio-contacto-pruebas`, sin barra final |
| Secret | `STAGING_SUPABASE_SERVICE_ROLE_KEY` | Solo la clave del nuevo proyecto, nunca la de producción |
| Secret | `STAGING_ACCESS_KEY` | Clave aleatoria de al menos 32 caracteres para pruebas autorizadas |
| Secret opcional | `MERCADOPAGO_TEST_ACCESS_TOKEN` | Credencial TEST del vendedor de pruebas |
| Secret opcional | `MERCADOPAGO_TEST_PUBLIC_KEY` | Clave pública TEST para pruebas del checkout |

## Supabase: aprovisionado y verificado

Proyecto **cvstudio-marketing-pruebas**, referencia `csnfuhpbciybckabhqqp`, organización **CVStudio SIAC** (`pfmlorhbvmnngwyyuqid`), región `ca-central-1`, estado ACTIVE_HEALTHY. Creado con autorización del usuario condicionada a costo adicional cero. El proveedor completó la creación sin solicitar confirmación de costo; no se autorizó ningún cargo ni ampliación de plan.

URL para `STAGING_SUPABASE_URL`: `https://csnfuhpbciybckabhqqp.supabase.co`. La clave publishable del proyecto fue obtenida; la clave service_role no fue extraída ni cargada en GitHub.

Se aplicaron las migraciones `cvstudio_staging_bootstrap` y `cvstudio_staging_private_logos` exclusivamente en este proyecto nuevo. `staging-schema.sql` contiene estructura de 10 tablas relacionadas con formularios y pagos y un catálogo ficticio; no copia registros ni usuarios de producción. Las 10 tablas tienen RLS; anon/authenticated no tienen permisos sobre las tablas y service_role sí. El bucket `cvstudio-web-intakes` es privado, con límite de 2 MB y MIME PNG/JPEG/WebP/PDF.

Se verificó una inserción de formulario con datos ficticios bajo service_role y se revirtió la transacción. Quedaron cero clientes, pedidos e intakes. El asesor de seguridad devolvió únicamente 10 avisos informativos de RLS sin políticas: es deliberado para estas tablas accesibles solo por el backend service_role; no abrir políticas públicas.

El pipeline no aplica SQL automáticamente y no usa las migraciones generales del repositorio, que incluyen otros proyectos. Las políticas anónimas de SIAC no se copiaron. Aún falta configurar los secretos y variables del Environment de GitHub y desplegar el Worker para verificar el recorrido HTTPS completo.

## Producción: plantilla inactiva

`worker-production.yml.disabled` está fuera de `.github/workflows` y GitHub no lo ejecuta. Usa un Environment, token, variable de habilitación, confirmación y concurrencia distintos. `production-release.json` tiene `approved=false`; el preflight bloquea producción incluso si alguien define variables de habilitación.

Para una futura publicación autorizada: revisar la configuración remota real (bindings, rutas y crons), completar `wrangler.production.json` desde el ejemplo sin perder esa configuración, autorizar la entrega, actualizar el bloqueo en una revisión, mover la plantilla a workflows y guardar en el Environment protegido `CVSTUDIO_PRODUCTION_APPROVED_SHA` con el commit exacto aprobado. Solo `workflow_dispatch` sobre `main` y la confirmación `cvstudio-contacto` podrán publicar. No activar como parte de la configuración actual. `--keep-vars` conserva variables existentes; no sustituye la revisión de rutas, bindings y crons. Los secretos de producción nunca se toman de staging.

Los archivos de despliegue quedan excluidos del paquete de Pages de esta rama. El workflow Pages activo en `main` no se modificó.

## Evidencia y límites

- 24 tests Node aprobados, con controles de aislamiento y de bloqueo de producción.
- Wrangler dry-run aprobado; no hubo upload.
- Runtime workerd local: health 200, entorno staging, acceso sin clave 401.
- Bootstrap local: 10 tablas con RLS; roles públicos sin permisos; service_role habilitado; repetición rechazada.
- Pendientes: entornos/secretos de GitHub, token Cloudflare y credencial service_role del proyecto de pruebas; después, despliegue HTTPS y pruebas integrales con proveedores sandbox. No se certifican pagos ni medición remota real.

Referencias: [Cloudflare GitHub Actions](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/), [Wrangler](https://developers.cloudflare.com/workers/wrangler/configuration/), [GitHub Environments](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments), [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).
