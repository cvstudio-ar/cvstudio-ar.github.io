-- CVStudio · Centro de Operaciones RC4 v2.4
-- Parche seguro para habilitar la conexión integral del entorno de prueba.
-- No elimina ni modifica tablas productivas existentes.

begin;

-- Asegura permisos de PostgREST para los roles públicos usados por el panel de prueba.
grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on table public.cvstudio_ops_stage_meta to anon, authenticated;
grant select, insert, update, delete on table public.cvstudio_ops_stage_clients to anon, authenticated;
grant select, insert, update, delete on table public.cvstudio_ops_stage_jobs to anon, authenticated;
grant select, insert, update, delete on table public.cvstudio_ops_stage_payments to anon, authenticated;
grant select, insert, update, delete on table public.cvstudio_ops_stage_executions to anon, authenticated;
grant select, insert, update, delete on table public.cvstudio_ops_stage_expenses to anon, authenticated;
grant select, insert, update, delete on table public.cvstudio_ops_stage_activities to anon, authenticated;
grant select, insert, update, delete on table public.cvstudio_ops_stage_services to anon, authenticated;

-- Política de borrado de meta para mantenimiento controlado del entorno de prueba.
drop policy if exists "cvstudio_ops_stage_meta_delete" on public.cvstudio_ops_stage_meta;
create policy "cvstudio_ops_stage_meta_delete" on public.cvstudio_ops_stage_meta
for delete to anon, authenticated using (id = 'centro-operaciones-prueba');

-- Confirma el registro raíz que usa el frontend para detectar la instalación.
insert into public.cvstudio_ops_stage_meta (id, updated_by, updated_at)
values ('centro-operaciones-prueba', 'setup-rc4', now())
on conflict (id) do update
set updated_by = excluded.updated_by,
    updated_at = excluded.updated_at;

commit;
