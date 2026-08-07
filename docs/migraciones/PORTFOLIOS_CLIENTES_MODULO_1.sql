-- CVStudio · Portal de portfolios · Módulo 1
-- Ejecutar una sola vez en Supabase SQL Editor.

create extension if not exists citext;

create table if not exists public.portfolio_clientes (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  username citext not null unique,
  slug citext not null unique,
  full_name text not null,
  brand_name text,
  contact_email text,
  whatsapp text,
  business_type text,
  bio text,
  template_key text not null default 'creative' check (template_key in ('creative','professional','business','minimal')),
  status text not null default 'draft' check (status in ('draft','active','suspended')),
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists portfolio_clientes_status_idx on public.portfolio_clientes(status);
create index if not exists portfolio_clientes_updated_idx on public.portfolio_clientes(updated_at desc);

create table if not exists public.portfolio_proyectos (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolio_clientes(id) on delete cascade,
  title text not null,
  description text,
  category text,
  cover_url text,
  media jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists portfolio_proyectos_portfolio_idx on public.portfolio_proyectos(portfolio_id, sort_order);

alter table public.portfolio_clientes enable row level security;
alter table public.portfolio_proyectos enable row level security;

-- Cada cliente autenticado puede leer y actualizar únicamente su propio perfil.
drop policy if exists portfolio_cliente_lee_propio on public.portfolio_clientes;
create policy portfolio_cliente_lee_propio on public.portfolio_clientes
for select to authenticated
using (auth.uid() = auth_user_id);

drop policy if exists portfolio_cliente_actualiza_propio on public.portfolio_clientes;
create policy portfolio_cliente_actualiza_propio on public.portfolio_clientes
for update to authenticated
using (auth.uid() = auth_user_id)
with check (auth.uid() = auth_user_id);

-- Los proyectos pertenecen al portfolio asociado al usuario autenticado.
drop policy if exists portfolio_proyectos_lee_propios on public.portfolio_proyectos;
create policy portfolio_proyectos_lee_propios on public.portfolio_proyectos
for select to authenticated
using (exists (
  select 1 from public.portfolio_clientes pc
  where pc.id = portfolio_id and pc.auth_user_id = auth.uid()
));

drop policy if exists portfolio_proyectos_inserta_propios on public.portfolio_proyectos;
create policy portfolio_proyectos_inserta_propios on public.portfolio_proyectos
for insert to authenticated
with check (exists (
  select 1 from public.portfolio_clientes pc
  where pc.id = portfolio_id and pc.auth_user_id = auth.uid()
));

drop policy if exists portfolio_proyectos_actualiza_propios on public.portfolio_proyectos;
create policy portfolio_proyectos_actualiza_propios on public.portfolio_proyectos
for update to authenticated
using (exists (
  select 1 from public.portfolio_clientes pc
  where pc.id = portfolio_id and pc.auth_user_id = auth.uid()
))
with check (exists (
  select 1 from public.portfolio_clientes pc
  where pc.id = portfolio_id and pc.auth_user_id = auth.uid()
));

drop policy if exists portfolio_proyectos_elimina_propios on public.portfolio_proyectos;
create policy portfolio_proyectos_elimina_propios on public.portfolio_proyectos
for delete to authenticated
using (exists (
  select 1 from public.portfolio_clientes pc
  where pc.id = portfolio_id and pc.auth_user_id = auth.uid()
));

-- La lectura pública se habilitará en el módulo de portfolio público, con una vista segura.

-- Bucket preparado para imágenes de portfolios. La carga desde el cliente se completa en el módulo 2.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('portfolio-media','portfolio-media',true,10485760,array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
