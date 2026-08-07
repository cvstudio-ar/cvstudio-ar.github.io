# Centro de Operaciones CVStudio · RC3 v2.3

Esta versión reemplaza el almacenamiento monolítico de staging por tablas separadas de Supabase para Clientes, Producción, Pagos, Ejecuciones, Gastos, Actividades, Servicios y Reglas.

## Activación
1. Ejecutar `docs/supabase/RC3_OPERATIONAL_STAGING.sql` en Supabase > SQL Editor.
2. Subir el proyecto completo.
3. Hacer `Ctrl + F5`.
4. Confirmar que el indicador inferior muestre `Supabase operativo`.

## Prueba recomendada
- Crear un cliente.
- Crear un trabajo.
- Registrar un pago.
- Entregar el trabajo.
- Abrir el panel en otro navegador o modo incógnito.
- Confirmar que aparecen los mismos datos.

Esta versión sigue usando únicamente tablas con prefijo `cvstudio_ops_stage_` y no toca el panel `/admin/` ni las tablas productivas existentes.
