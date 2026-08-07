-- CVStudio v4.3.1 · Reparación de permisos para Pedidos y pagos
-- Ejecutar una sola vez en Supabase: SQL Editor → New query → Run.

begin;

-- Asegura que la tabla exista incluso si no se ejecutó el instalador anterior.
create table if not exists public.pedidos_mercadopago (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  external_reference text not null unique,
  preferencia_id text,
  mercadopago_payment_id text unique,
  producto_id text not null,
  producto_nombre text not null,
  importe numeric(12,2) not null,
  moneda text not null default 'ARS',
  cliente_nombre text not null,
  cliente_email text not null,
  cliente_whatsapp text not null,
  estado_pago text not null default 'pendiente',
  detalle_estado text,
  estado_pedido text not null default 'Pendiente de pago',
  medio_pago text,
  fecha_aprobacion timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pedidos_mp_created_idx
  on public.pedidos_mercadopago(created_at desc);
create index if not exists pedidos_mp_estado_idx
  on public.pedidos_mercadopago(estado_pago);

alter table public.pedidos_mercadopago enable row level security;

-- El panel no consulta esta tabla directamente desde el navegador.
-- Las operaciones pasan por el Worker autenticado, que usa service_role.
grant usage on schema public to service_role;
grant select, insert, update, delete
  on table public.pedidos_mercadopago to service_role;
grant usage, select on all sequences in schema public to service_role;

-- Revoca el acceso público para evitar exponer datos de clientes o pagos.
revoke all on table public.pedidos_mercadopago from anon;
revoke all on table public.pedidos_mercadopago from authenticated;

commit;

-- Verificación opcional: debe mostrar privilegios para service_role.
select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'pedidos_mercadopago'
order by grantee, privilege_type;
