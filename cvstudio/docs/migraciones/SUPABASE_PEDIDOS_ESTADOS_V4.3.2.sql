-- CVStudio v4.3.2 · Normalización de estados de pago
-- Ejecutar una sola vez en Supabase > SQL Editor.

update public.pedidos_mercadopago
set estado_pago = 'pending',
    medio_pago = coalesce(nullif(medio_pago, ''), 'Mercado Pago · Checkout Pro'),
    updated_at = now()
where lower(coalesce(estado_pago, '')) in ('pendiente', 'pending', '')
  and mercadopago_payment_id is null;

-- Valor predeterminado consistente con los estados oficiales de Mercado Pago.
alter table public.pedidos_mercadopago
  alter column estado_pago set default 'pending';

-- Asegura que los registros nuevos indiquen el canal aun antes de aprobarse.
alter table public.pedidos_mercadopago
  alter column medio_pago set default 'Mercado Pago · Checkout Pro';
