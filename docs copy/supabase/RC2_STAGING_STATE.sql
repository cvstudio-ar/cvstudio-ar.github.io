-- CVStudio · Centro de Operaciones RC2 · Persistencia de staging
-- Ejecutar UNA sola vez en Supabase > SQL Editor.
-- Esta tabla guarda el estado funcional de prueba como JSONB para validar
-- Clientes → Producción → Administración antes de migrar a tablas normalizadas.

create table if not exists public.cvstudio_ops_staging_state (
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by text null
);

alter table public.cvstudio_ops_staging_state enable row level security;

-- Entorno temporal de auditoría. Estas políticas permiten que la publishable key
-- lea y actualice EXCLUSIVAMENTE esta tabla de staging.
drop policy if exists "ops staging select" on public.cvstudio_ops_staging_state;
create policy "ops staging select"
on public.cvstudio_ops_staging_state
for select
to anon, authenticated
using (true);

drop policy if exists "ops staging insert" on public.cvstudio_ops_staging_state;
create policy "ops staging insert"
on public.cvstudio_ops_staging_state
for insert
to anon, authenticated
with check (id = 'centro-operaciones-prueba');

drop policy if exists "ops staging update" on public.cvstudio_ops_staging_state;
create policy "ops staging update"
on public.cvstudio_ops_staging_state
for update
to anon, authenticated
using (id = 'centro-operaciones-prueba')
with check (id = 'centro-operaciones-prueba');

insert into public.cvstudio_ops_staging_state (id, payload, updated_by)
values ('centro-operaciones-prueba', '{}'::jsonb, 'setup')
on conflict (id) do nothing;
