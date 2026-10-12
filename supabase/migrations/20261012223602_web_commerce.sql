-- Aplicar una sola vez en SQL Editor antes de desplegar el Worker.
begin;
create table if not exists public.web_commerce_settings (
 id text primary key check(id='main'), enabled boolean not null default false,
 product_map jsonb not null default '{}'::jsonb, updated_at timestamptz not null default now()
);
create table if not exists public.web_commerce_projects (
 id uuid primary key default gen_random_uuid(), code text not null unique,
 access_token uuid not null unique, product_id text not null, product_title text not null,
 total numeric(12,2) not null check(total>0), payment_plan text not null check(payment_plan in ('deposit','full')),
 customer_name text not null, customer_email text not null, customer_phone text not null,
 options jsonb not null default '{}'::jsonb,
 publication_enabled boolean not null default false, balance_enabled boolean not null default false,
 created_at timestamptz not null default now()
);
create table if not exists public.web_commerce_charges (
 id uuid primary key default gen_random_uuid(), project_id uuid not null references public.web_commerce_projects(id),
 access_token uuid not null unique,
 stage text not null check(stage in ('deposit','publication','balance','full')),
 provider text not null check(provider in ('mercadopago','tiendanube')),
 amount numeric(12,2) not null check(amount>0), status text not null default 'created',
 checkout_url text, preference_id text, payment_id text,
 tiendanube_draft_id text, tiendanube_product_id text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(project_id,stage)
);
create index if not exists web_commerce_project_date on public.web_commerce_projects(created_at desc);
create index if not exists web_commerce_charge_project on public.web_commerce_charges(project_id);
alter table public.web_commerce_settings enable row level security;
alter table public.web_commerce_projects enable row level security;
alter table public.web_commerce_charges enable row level security;
revoke all on public.web_commerce_settings,public.web_commerce_projects,public.web_commerce_charges from anon,authenticated;
grant select,insert,update,delete on public.web_commerce_settings,public.web_commerce_projects,public.web_commerce_charges to service_role;
insert into public.web_commerce_settings(id) values('main') on conflict do nothing;
insert into public.servicios_precios(product_id,title,unit_price,active,test_mode,test_price,sort_order) values
 ('web-basica','Web de presentación — Pantalla única',65000,true,false,null,130),
 ('web-panel','Web de presentación + Panel administrativo básico',85000,true,false,null,140),
 ('web-catalogo','Web avanzada con catálogo y panel administrativo',120000,true,false,null,150),
 ('web-tienda','Web completa con Tiendanube',180000,true,false,null,160)
on conflict(product_id) do nothing;
commit;
