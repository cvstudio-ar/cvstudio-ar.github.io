# Centro de Operaciones CVStudio — Prueba funcional v2.0

Esta versión agrega una capa operativa local sobre la maqueta v1.6. Está diseñada para probar flujos, cálculos y botones sin modificar servicios reales.

## Funciones activas

- Crear clientes.
- Buscar y filtrar clientes.
- Registrar pagos confirmados o pendientes.
- Crear trabajos y asignarlos a responsables.
- Actualizar progreso y etapa de producción.
- Bloquear la entrega si no existe pago confirmado.
- Registrar una entrega y generar la ejecución del colaborador.
- Editar precios de servicios.
- Configurar distribución de ingresos, validando que sume 100%.
- Calcular fondos de Empresa, Colaboradores, Crecimiento y Reserva.
- Registrar gastos publicitarios y descontarlos del Fondo de Crecimiento.
- Calcular comisiones a partir de trabajos entregados.
- Actualizar KPIs y tablas automáticamente.
- Guardar todos los cambios en `localStorage` del navegador.
- Restablecer los datos de demostración desde Inicio.

## Seguridad de esta etapa

No se conecta todavía con Supabase, Mercado Pago, Meta, WhatsApp, Resend ni OpenAI. No modifica `/admin/` ni datos reales. Cada navegador mantiene su propia copia de prueba.

## Prueba sugerida

1. Crear un cliente.
2. Registrar un pago pendiente y verificar su estado.
3. Registrar el mismo pago como confirmado.
4. Crear un trabajo para ese cliente.
5. Cambiar el progreso y la etapa.
6. Entregarlo y revisar Administración.
7. Modificar precios.
8. Cambiar porcentajes asegurando que sumen 100%.
9. Registrar un gasto publicitario.
10. Recargar la página y comprobar que los datos permanezcan.

## Ruta

`/centro-operaciones-prueba/`
