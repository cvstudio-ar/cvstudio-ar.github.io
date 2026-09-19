-- CVStudio · RC7 Colaboradores y acceso
-- Ejecutar una sola vez. No modifica tablas productivas.
begin;
create table if not exists public.cvstudio_ops_stage_collaborators (
  id bigint not null, workspace_id text not null, payload jsonb not null,
  updated_at timestamptz not null default now(), primary key (workspace_id,id)
);
alter table public.cvstudio_ops_stage_collaborators enable row level security;
grant select,insert,update,delete on table public.cvstudio_ops_stage_collaborators to anon,authenticated;
drop policy if exists "cvstudio_ops_stage_collaborators_select" on public.cvstudio_ops_stage_collaborators;
create policy "cvstudio_ops_stage_collaborators_select" on public.cvstudio_ops_stage_collaborators for select to anon,authenticated using (workspace_id='centro-operaciones-prueba');
drop policy if exists "cvstudio_ops_stage_collaborators_insert" on public.cvstudio_ops_stage_collaborators;
create policy "cvstudio_ops_stage_collaborators_insert" on public.cvstudio_ops_stage_collaborators for insert to anon,authenticated with check (workspace_id='centro-operaciones-prueba');
drop policy if exists "cvstudio_ops_stage_collaborators_update" on public.cvstudio_ops_stage_collaborators;
create policy "cvstudio_ops_stage_collaborators_update" on public.cvstudio_ops_stage_collaborators for update to anon,authenticated using (workspace_id='centro-operaciones-prueba') with check (workspace_id='centro-operaciones-prueba');
drop policy if exists "cvstudio_ops_stage_collaborators_delete" on public.cvstudio_ops_stage_collaborators;
create policy "cvstudio_ops_stage_collaborators_delete" on public.cvstudio_ops_stage_collaborators for delete to anon,authenticated using (workspace_id='centro-operaciones-prueba');
commit;
