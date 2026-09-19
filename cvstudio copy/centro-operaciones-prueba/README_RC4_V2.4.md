# Centro de Operaciones CVStudio — RC4 v2.4

Versión integral conectada al esquema normalizado de Supabase staging.

## Instalación
1. Ejecutar `docs/supabase/RC4_FULL_STAGING_PATCH.sql` una sola vez.
2. Publicar el proyecto completo.
3. Recargar con Ctrl+F5.
4. Verificar el indicador **Supabase operativo**.

## Alcance
- Clientes, trabajos, pagos, ejecuciones, gastos, actividades, servicios, precios y reglas administrativas sincronizados.
- Detección detallada de tablas/permisos.
- Reconexión y aviso offline.
- Escucha en tiempo real del registro de control.
- `/admin/` y tablas productivas sin modificaciones.

Las integraciones externas (webhooks de Mercado Pago, Meta, WhatsApp, Resend y OpenAI) permanecen desactivadas hasta su validación específica.
