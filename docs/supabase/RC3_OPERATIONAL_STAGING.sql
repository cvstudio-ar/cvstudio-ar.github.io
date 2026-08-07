-- CVStudio · Centro de Operaciones RC3 v2.3
-- Persistencia normalizada para auditoría operativa.
-- No modifica tablas existentes del SIAC ni del panel /admin.

create table if not exists public.cvstudio_ops_stage_meta (
  id text primary key,
  rules jsonb not null default '{"colab":20,"growth":15,"reserve":5,"company":60}'::jsonb,
  version integer not null default 4,
  updated_at timestamptz not null default now(),
  updated_by text null
);

create table if not exists public.cvstudio_ops_stage_clients (
  id bigint not null,
  workspace_id text not null,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (workspace_id, id)
);
create table if not exists public.cvstudio_ops_stage_jobs (
  id bigint not null,
  workspace_id text not null,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (workspace_id, id)
);
create table if not exists public.cvstudio_ops_stage_payments (
  id bigint not null,
  workspace_id text not null,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (workspace_id, id)
);
create table if not exists public.cvstudio_ops_stage_executions (
  id bigint not null,
  workspace_id text not null,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (workspace_id, id)
);
create table if not exists public.cvstudio_ops_stage_expenses (
  id bigint not null,
  workspace_id text not null,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (workspace_id, id)
);
create table if not exists public.cvstudio_ops_stage_activities (
  id bigint not null,
  workspace_id text not null,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (workspace_id, id)
);
create table if not exists public.cvstudio_ops_stage_services (
  id bigint not null,
  workspace_id text not null,
  name text not null,
  price numeric(14,2) not null default 0,
  active boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (workspace_id, id),
  unique (workspace_id, name)
);

alter table public.cvstudio_ops_stage_meta enable row level security;
alter table public.cvstudio_ops_stage_clients enable row level security;
alter table public.cvstudio_ops_stage_jobs enable row level security;
alter table public.cvstudio_ops_stage_payments enable row level security;
alter table public.cvstudio_ops_stage_executions enable row level security;
alter table public.cvstudio_ops_stage_expenses enable row level security;
alter table public.cvstudio_ops_stage_activities enable row level security;
alter table public.cvstudio_ops_stage_services enable row level security;

-- Políticas temporales limitadas al workspace de prueba.
do $$
declare
  t text;
begin
  foreach t in array array[
    'cvstudio_ops_stage_clients','cvstudio_ops_stage_jobs','cvstudio_ops_stage_payments',
    'cvstudio_ops_stage_executions','cvstudio_ops_stage_expenses','cvstudio_ops_stage_activities',
    'cvstudio_ops_stage_services'
  ] loop
    execute format('drop policy if exists %I on public.%I', t || '_select', t);
    execute format('create policy %I on public.%I for select to anon, authenticated using (workspace_id = %L)', t || '_select', t, 'centro-operaciones-prueba');
    execute format('drop policy if exists %I on public.%I', t || '_insert', t);
    execute format('create policy %I on public.%I for insert to anon, authenticated with check (workspace_id = %L)', t || '_insert', t, 'centro-operaciones-prueba');
    execute format('drop policy if exists %I on public.%I', t || '_update', t);
    execute format('create policy %I on public.%I for update to anon, authenticated using (workspace_id = %L) with check (workspace_id = %L)', t || '_update', t, 'centro-operaciones-prueba', 'centro-operaciones-prueba');
    execute format('drop policy if exists %I on public.%I', t || '_delete', t);
    execute format('create policy %I on public.%I for delete to anon, authenticated using (workspace_id = %L)', t || '_delete', t, 'centro-operaciones-prueba');
  end loop;
end $$;

drop policy if exists "cvstudio_ops_stage_meta_select" on public.cvstudio_ops_stage_meta;
create policy "cvstudio_ops_stage_meta_select" on public.cvstudio_ops_stage_meta
for select to anon, authenticated using (id = 'centro-operaciones-prueba');
drop policy if exists "cvstudio_ops_stage_meta_insert" on public.cvstudio_ops_stage_meta;
create policy "cvstudio_ops_stage_meta_insert" on public.cvstudio_ops_stage_meta
for insert to anon, authenticated with check (id = 'centro-operaciones-prueba');
drop policy if exists "cvstudio_ops_stage_meta_update" on public.cvstudio_ops_stage_meta;
create policy "cvstudio_ops_stage_meta_update" on public.cvstudio_ops_stage_meta
for update to anon, authenticated using (id = 'centro-operaciones-prueba') with check (id = 'centro-operaciones-prueba');

insert into public.cvstudio_ops_stage_meta (id, updated_by)
values ('centro-operaciones-prueba', 'setup-rc3')
on conflict (id) do nothing;
