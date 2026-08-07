# Centro de Operaciones CVStudio — RC2 v2.2

## Objetivo
Conectar la versión funcional de prueba a Supabase sin modificar el panel `/admin/` ni las tablas productivas actuales.

## Activación
1. Abrir Supabase → SQL Editor.
2. Ejecutar `docs/supabase/RC2_STAGING_STATE.sql`.
3. Subir el proyecto y abrir `/centro-operaciones-prueba/`.
4. Hacer `Ctrl + F5`.
5. El pie lateral debe indicar **Supabase conectado**.

## Qué sincroniza
- Clientes.
- Producción y avances.
- Pagos.
- Distribución administrativa.
- Precios y porcentajes.
- Gastos, ejecuciones, comisiones e historial.

## Prueba cruzada
Crear o modificar un cliente en una computadora, esperar 1 segundo y abrir el panel en otro navegador. El estado debe recuperarse desde Supabase.

## Seguridad
Esta tabla y sus políticas son exclusivamente de staging. Antes de pasar a producción se reemplazará por autenticación, roles y tablas normalizadas con RLS restrictivo.
