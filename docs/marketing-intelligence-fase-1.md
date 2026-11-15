# CVStudio Marketing Intelligence — Fase 1
Fecha: 2026-11-15. **Rama de desarrollo:** `feature/marketing-intelligence`. **No publicar directamente a main.**

## Alcance realizado
- Web principal y /otros-servicios/: GA4 existente (`G-BJW9DQGWXV`) pasa a cargarse **solo con aceptación de estadísticas**, sin segundo tag duplicado.
- Preferencias: aceptar o rechazar la medición; enlace persistente para cambiarlas. Al retirar el consentimiento se recarga para detener scripts ya cargados.
- UTMs opcionales (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`), limitadas y validadas; sin nombres, email ni teléfono en parámetros analíticos.
- SIAC: almacena `atribucion` dentro de `solicitudes.datos` solo cuando existen UTMs permitidas.
- CV principal: agrega `attribution` en el cuerpo del checkout de Mercado Pago. No cambia importes, productos ni estado de pago.
- Worker de contacto: valida los campos UTM, guarda atribución en pedidos y solicitudes del flujo público sin enviarla a Mercado Pago.
- Centro de Operaciones: real-bridge conserva la atribución del pedido y la solicitud. Marketing muestra ventas confirmadas con UTM, fuentes de contacto y un gráfico de pagos por 7 días derivado de registros en lugar de barras ilustrativas.
- Se ajustaron los parámetros de caché de los scripts de SIAC, web principal y Centro de Operaciones.

## Base de datos CVStudio (única base modificada)
- Supabase `cvstudio-core`, proyecto `eqepkoegzyqklpxkrkhm`.
- Se agregó `public.pedidos_mercadopago.atribucion jsonb not null default '{}'::jsonb`.
- La tabla mantiene RLS habilitada. Los 8 pedidos existentes se conservaron, sin atribución fabricada.
- `solicitudes.datos` ya era jsonb; no fue necesario cambiar esa tabla.
- No se modificó Supabase ni GitHub de Las Morillas.

## Importante antes de publicar
1. **El código del Worker no está desplegado en Cloudflare.** Publicar una rama GitHub por sí sola no actualiza Workers. Se necesita despliegue separado desde `config/cloudflare-worker-contacto.js` tras revisión técnica.
2. Probar una consulta SIAC de extremo a extremo en un entorno de prueba y verificar `solicitudes.datos.atribucion` (sin utilizar clientes reales ficticios).
3. Probar un checkout de Mercado Pago en modalidad test: verificar que `pedidos_mercadopago.atribucion` persista y que el precio confirmado provenga del catálogo remoto; no hacer cargos reales.
4. Abrir ambos sitios con consentimiento aceptado/rechazado: GA4 solo debe cargarse al aceptar, sin etiquetas duplicadas; comprobar clic a WhatsApp.
5. Comprobar fuente y campaña en Clientes y Marketing; verificar el conteo con pagos acreditados y el filtrado de sesiones.
6. El configurador independiente de `/otros-servicios/` ya tiene eventos de embudo y UTM. También está preparada en el Worker la acción `web-commerce-intake` (anteriormente ausente), que valida datos, logo y referencia de preparación. Se enlaza con el checkout y los pedidos de Webs Personalizadas.
   - Se creó `cvstudio_web_intakes` (RLS, solo service_role) y el bucket privado `cvstudio-web-intakes` (2 MB por archivo).
   - En `web_commerce_projects` se agregó `atribucion jsonb not null default '{}'`, separada de `options`, para no reenviar UTM a terceros mediante la descripción del servicio.
   - El Centro de Operaciones puede recuperar métricas agregadas de preparaciones desde el Worker, sin incluir datos personales en la respuesta de estadísticas.
   - Se agregó un límite inicial en el Worker de 10 preparaciones nuevas por origen en 15 minutos, usando una huella seudonimizada y rotativa por día (sin guardar IP en claro). Esto **no reemplaza** Turnstile ni las reglas WAF, que deben verificarse antes de habilitar el endpoint públicamente.
   - Estas funciones no están desplegadas. Faltan prueba E2E con logo, prueba de pagos y validación de protección antispam/WAF.
7. Meta Pixel/Conversions API: **pendientes**. No hay ID ni token configurado en esta fase, ni debe guardarse una credencial de Meta en el navegador.
8. Publicar política de privacidad y controles adecuados para marketing y medición. No enviar PII a plataformas analíticas.
9. No atribuir todos los pagos de origen genérico “Web” a campañas: solo los que tienen UTMs correctamente recibidas.

## Verificación automática
- Sintaxis JS revisada en 10 archivos clave, incluido el Worker (parseando su módulo): sin errores detectados.
- Se confirmó que los dos sitios dejan de incluir el tag GA4 cargado automáticamente.
- Se confirmó separación entre Supabase CVStudio y Las Morillas.
- La comparación GitHub de la rama permite revisar exactamente qué archivos cambiarían en producción.

**Este documento no certifica pruebas E2E con una sesión real ni el despliegue del Worker.**
## Pruebas adicionales sobre Webs Personalizadas
- Esquema: permisos `anon` y `authenticated` sin SELECT en `cvstudio_web_intakes`; `service_role` autorizado. Bucket de logos privado, límite de 2 MB.
- Test transaccional de inserción: 1 fila visible durante la transacción y 0 registros ficticios persistidos tras `ROLLBACK`.
- Registros existentes verificados sin borrado: 3 proyectos web y 3 pagos web.
- Prueba aislada de Worker con base de datos simulada: registro correcto de referencia y UTM; moneda/proveedor incompatible rechazado; firma PNG válida aceptada por verificación de cabecera.
- El Worker todavía debe pasar una prueba real por HTTPS desde el navegador con sesión y entorno de pruebas para verificar CORS, uploads y errores de pasarela.

- Seguridad adicional: columna `visitor_hash` privada y índice por fecha. Prueba aislada: la décima solicitud previa produce HTTP 429 al intentar registrar una undécima. **Sin pruebas reales de Cloudflare**.
