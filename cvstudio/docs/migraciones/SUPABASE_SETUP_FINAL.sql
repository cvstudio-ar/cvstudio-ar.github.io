-- CVStudio SIAC · Configuración final de Supabase
-- Ejecutar una sola vez en SQL Editor.

alter table public.solicitudes add column if not exists subtipo text;
alter table public.solicitudes add column if not exists datos jsonb not null default '{}'::jsonb;
alter table public.solicitudes add column if not exists responsable text not null default 'Exequiel';
alter table public.solicitudes add column if not exists notas text not null default '';
alter table public.solicitudes add column if not exists canal text not null default 'Web';

alter table public.clientes enable row level security;
alter table public.solicitudes enable row level security;
alter table public.archivos enable row level security;
alter table public.historial enable row level security;

-- Eliminar políticas anteriores para que el script pueda repetirse sin errores.
drop policy if exists "siac_clientes_insert" on public.clientes;
drop policy if exists "siac_solicitudes_insert" on public.solicitudes;
drop policy if exists "siac_archivos_insert" on public.archivos;
drop policy if exists "cvstudio_admin_clientes" on public.clientes;
drop policy if exists "cvstudio_admin_solicitudes" on public.solicitudes;
drop policy if exists "cvstudio_admin_archivos" on public.archivos;
drop policy if exists "cvstudio_admin_historial" on public.historial;

-- Envío público: solo INSERT, nunca lectura.
create policy "siac_clientes_insert" on public.clientes for insert to anon with check (id is not null and nombre is not null and length(nombre) between 2 and 120);
create policy "siac_solicitudes_insert" on public.solicitudes for insert to anon with check (cliente_id is not null and codigo is not null and estado = 'Pendiente de revisión' and responsable = 'Exequiel');
create policy "siac_archivos_insert" on public.archivos for insert to anon with check (solicitud_id is not null and nombre is not null);

-- Acceso exclusivo del administrador creado en Authentication.
create policy "cvstudio_admin_clientes" on public.clientes for all to authenticated using (auth.uid() = '3a8b4d50-305a-4da5-9fde-64bd2c8ed68d'::uuid) with check (auth.uid() = '3a8b4d50-305a-4da5-9fde-64bd2c8ed68d'::uuid);
create policy "cvstudio_admin_solicitudes" on public.solicitudes for all to authenticated using (auth.uid() = '3a8b4d50-305a-4da5-9fde-64bd2c8ed68d'::uuid) with check (auth.uid() = '3a8b4d50-305a-4da5-9fde-64bd2c8ed68d'::uuid);
create policy "cvstudio_admin_archivos" on public.archivos for all to authenticated using (auth.uid() = '3a8b4d50-305a-4da5-9fde-64bd2c8ed68d'::uuid) with check (auth.uid() = '3a8b4d50-305a-4da5-9fde-64bd2c8ed68d'::uuid);
create policy "cvstudio_admin_historial" on public.historial for all to authenticated using (auth.uid() = '3a8b4d50-305a-4da5-9fde-64bd2c8ed68d'::uuid) with check (auth.uid() = '3a8b4d50-305a-4da5-9fde-64bd2c8ed68d'::uuid);

-- Bucket privado para adjuntos (10 MB, formatos aprobados).
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('siac-archivos','siac-archivos',false,10485760,array['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','image/jpeg','image/png'])
on conflict (id) do update set public=false,file_size_limit=10485760,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "siac_storage_insert" on storage.objects;
drop policy if exists "cvstudio_admin_storage_select" on storage.objects;
drop policy if exists "cvstudio_admin_storage_delete" on storage.objects;

create policy "siac_storage_insert" on storage.objects for insert to anon with check (bucket_id='siac-archivos');
create policy "cvstudio_admin_storage_select" on storage.objects for select to authenticated using (bucket_id='siac-archivos' and auth.uid()='3a8b4d50-305a-4da5-9fde-64bd2c8ed68d'::uuid);
create policy "cvstudio_admin_storage_delete" on storage.objects for delete to authenticated using (bucket_id='siac-archivos' and auth.uid()='3a8b4d50-305a-4da5-9fde-64bd2c8ed68d'::uuid);

-- Módulo de respuestas SIAC
create table if not exists public.comunicaciones (
  id uuid primary key default gen_random_uuid(),
  solicitud_id uuid not null references public.solicitudes(id) on delete cascade,
  destinatario text not null,
  asunto text not null,
  mensaje text not null,
  plantilla text not null default 'custom',
  estado text not null default 'Enviado',
  resend_id text,
  usuario_id uuid,
  fecha_creacion timestamptz not null default now()
);
create index if not exists comunicaciones_solicitud_fecha_idx on public.comunicaciones (solicitud_id, fecha_creacion desc);
alter table public.comunicaciones enable row level security;
drop policy if exists "cvstudio_admin_comunicaciones" on public.comunicaciones;
create policy "cvstudio_admin_comunicaciones" on public.comunicaciones for all to authenticated
using (auth.uid() = '3a8b4d50-305a-4da5-9fde-64bd2c8ed68d'::uuid)
with check (auth.uid() = '3a8b4d50-305a-4da5-9fde-64bd2c8ed68d'::uuid);
