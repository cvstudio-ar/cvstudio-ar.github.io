begin;
-- Recepción privada y precheckout del configurador de Webs Personalizadas.
-- Las operaciones públicas solo pasan por el Worker autorizado de CVStudio.
create table if not exists public.cvstudio_web_intakes (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique check (reference ~ '^CVS-[A-Z0-9-]{8,80}$'),
  product_id text not null check (product_id in ('web-basica','web-panel','web-catalogo','web-tienda')),
  currency text not null check (currency in ('ARS','USD','EUR')),
  stage text not null check (stage in ('deposit','full')),
  provider text not null check (provider in ('mercadopago','tiendanube','paypal','transferencia')),
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  options jsonb not null default '{}'::jsonb,
  attribution jsonb not null default '{}'::jsonb,
  logo_path text,
  logo_filename text,
  created_at timestamptz not null default now()
);
alter table public.cvstudio_web_intakes enable row level security;
revoke all on public.cvstudio_web_intakes from anon, authenticated;
grant select,insert,update,delete on public.cvstudio_web_intakes to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('cvstudio-web-intakes','cvstudio-web-intakes',false,2097152,ARRAY['image/png','image/jpeg','image/webp','application/pdf'])
on conflict (id) do nothing;
commit;