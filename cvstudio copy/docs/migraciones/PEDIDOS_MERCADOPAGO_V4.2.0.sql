-- CVStudio v4.2.0 · Pedidos y pagos de Mercado Pago
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
create index if not exists pedidos_mp_created_idx on public.pedidos_mercadopago(created_at desc);
create index if not exists pedidos_mp_estado_idx on public.pedidos_mercadopago(estado_pago);
alter table public.pedidos_mercadopago enable row level security;
-- No se crean políticas públicas: el acceso se realiza exclusivamente desde el Worker con Service Role.

-- Permisos explícitos para el backend seguro de Cloudflare Worker.
-- El Worker utiliza SUPABASE_SERVICE_ROLE_KEY y no expone esta clave en la web.
grant usage on schema public to service_role;
grant select, insert, update, delete on table public.pedidos_mercadopago to service_role;
grant usage, select on all sequences in schema public to service_role;
