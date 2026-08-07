-- CVStudio · Portal de clientes · Módulo 2 (Worker separado)
-- Este script NO modifica storage.objects ni crea políticas de Storage.
-- El Worker de portfolios carga archivos con la Service Role.

-- Garantiza columnas y restricciones necesarias para el MVP.
alter table public.portfolio_clientes
  add column if not exists settings jsonb not null default '{}'::jsonb;

alter table public.portfolio_proyectos
  add column if not exists media jsonb not null default '[]'::jsonb,
  add column if not exists sort_order integer not null default 0,
  add column if not exists is_visible boolean not null default true,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists portfolio_proyectos_portfolio_idx
  on public.portfolio_proyectos(portfolio_id, sort_order);

-- Mantiene el bucket público. Las escrituras se realizan exclusivamente desde el Worker.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio-media',
  'portfolio-media',
  true,
  10485760,
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
