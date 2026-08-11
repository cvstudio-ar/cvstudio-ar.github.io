-- CVStudio · Portal de Clientes · Catálogo comercial v5.2
-- Ejecutar una vez en Supabase SQL Editor antes de publicar el Worker actualizado.

alter table public.portfolio_proyectos
  add column if not exists item_type text not null default 'project',
  add column if not exists price numeric(12,2),
  add column if not exists price_mode text not null default 'consult',
  add column if not exists availability text not null default 'available',
  add column if not exists featured boolean not null default false;

alter table public.portfolio_proyectos
  drop constraint if exists portfolio_proyectos_item_type_check,
  add constraint portfolio_proyectos_item_type_check check (item_type in ('project','product')),
  drop constraint if exists portfolio_proyectos_price_mode_check,
  add constraint portfolio_proyectos_price_mode_check check (price_mode in ('consult','price')),
  drop constraint if exists portfolio_proyectos_availability_check,
  add constraint portfolio_proyectos_availability_check check (availability in ('available','last_units','coming_soon','sold_out')),
  drop constraint if exists portfolio_proyectos_price_valid_check,
  add constraint portfolio_proyectos_price_valid_check check (price is null or price >= 0);

alter table public.portfolio_clientes
  drop constraint if exists portfolio_clientes_template_key_check,
  add constraint portfolio_clientes_template_key_check check (template_key in ('lens','atelier','studio','beauty','barber','tech','local','creative','professional','business','minimal'));

create index if not exists portfolio_productos_publicos_idx
  on public.portfolio_proyectos(portfolio_id, item_type, is_visible, featured desc, sort_order);

alter table public.portfolio_clientes enable row level security;
alter table public.portfolio_proyectos enable row level security;

-- Compatibilidad con proyectos que exponen explícitamente estas tablas por Data API.
grant select, update on table public.portfolio_clientes to authenticated;
grant select, insert, update, delete on table public.portfolio_proyectos to authenticated;

-- Las fotografías del catálogo son públicas; las cargas continúan pasando por el Worker autenticado.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('portfolio-media','portfolio-media',true,10485760,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public=excluded.public,
  file_size_limit=excluded.file_size_limit,
  allowed_mime_types=excluded.allowed_mime_types;

-- Verificación rápida esperada: cinco columnas del catálogo disponibles.
select column_name, data_type
from information_schema.columns
where table_schema='public'
  and table_name='portfolio_proyectos'
  and column_name in ('item_type','price','price_mode','availability','featured')
order by column_name;
