# Centro de Operaciones CVStudio — RC1 v2.1

Versión funcional local para auditoría previa a Supabase.

## Ajustes incluidos
- Desplegables legibles en modo oscuro.
- Clientes mostrados sin identificadores internos.
- Importe automático y bloqueado según Servicios y precios.
- Cambio de cliente sincroniza servicio e importe.
- Cambio de servicio recalcula el importe.
- Canal de origen separado del medio de cobro, que permanece Mercado Pago / alias cvstudio.ar.
- Bloqueo de pagos confirmados duplicados por cliente.
- Bloqueo de entrega tanto desde Clientes como desde Producción si falta pago confirmado.
- Comisión congelada al momento de la ejecución mediante snapshot de precio y porcentaje.
- Historial cronológico por cliente enriquecido.
- Creación de trabajos sincronizada con servicio y responsable del cliente.

Los datos siguen almacenados únicamente en localStorage.
