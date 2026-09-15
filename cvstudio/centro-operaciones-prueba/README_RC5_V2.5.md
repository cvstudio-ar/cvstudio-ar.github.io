# Centro de Operaciones CVStudio · RC5 v2.5

Esta versión conecta el panel de prueba con la operación real existente, sin reemplazar todavía `/admin/`.

## Datos reales conectados
- Solicitudes, clientes, archivos y comunicaciones de Supabase.
- Pedidos y pagos de Mercado Pago mediante el Worker administrativo.
- Servicios y precios comerciales del catálogo real.
- Estados y notas de solicitudes con escritura en la base real.
- Entregas sincronizadas con solicitudes y pedidos asociados.

## Seguridad
Para leer tablas productivas se requiere una sesión administrativa válida. Iniciá sesión primero en `/admin/` y luego abrí `/centro-operaciones-prueba/` en el mismo navegador.

## Modo híbrido de transición
Las entidades operativas nuevas continúan guardándose en tablas `cvstudio_ops_stage_*` durante la auditoría. Los datos productivos se importan y determinadas acciones autorizadas se escriben también en las tablas reales. Esto permite volver al panel anterior sin perder continuidad.
