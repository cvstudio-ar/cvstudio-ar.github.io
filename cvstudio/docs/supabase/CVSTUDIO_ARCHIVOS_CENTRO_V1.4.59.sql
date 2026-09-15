-- CVStudio v1.4.59 · Centro de archivos privado
-- La migración fue aplicada al proyecto cvstudio-core el 15/08/2026.

create table if not exists public.cvstudio_archivos_centro (
  id uuid primary key default gen_random_uuid(),
  bucket_id text not null default 'cvstudio-archivos',
  object_path text not null unique,
  nombre text not null,
  categoria text not null check (
    categoria in ('institucional','clientes','plantillas','marketing','administracion','otros','papelera')
  ),
  cliente_id text,
  solicitud_id uuid references public.solicitudes(id) on delete set null,
  mime_type text,
  tamano bigint not null default 0 check (tamano >= 0),
  uploaded_by uuid not null default auth.uid(),
  uploaded_by_email text not null default coalesce(auth.jwt()->>'email','equipo'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.cvstudio_archivos_centro enable row level security;

-- RLS no reemplaza los privilegios de PostgreSQL/Data API.
-- Este GRANT corrige el error "permission denied for table cvstudio_archivos_centro".
grant select, insert, update, delete on table public.cvstudio_archivos_centro to authenticated;

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values (
  'cvstudio-archivos','cvstudio-archivos',false,52428800,
  array[
    'application/pdf','application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg','image/png','image/webp',
    'application/zip','application/x-zip-compressed','text/plain'
  ]::text[]
)
on conflict (id) do update set
  public=excluded.public,
  file_size_limit=excluded.file_size_limit,
  allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "cvstudio_archivos_select" on public.cvstudio_archivos_centro;
create policy "cvstudio_archivos_select" on public.cvstudio_archivos_centro
for select to authenticated using ((auth.jwt()->>'email') like '%@cvstudio.com.ar');
drop policy if exists "cvstudio_archivos_insert" on public.cvstudio_archivos_centro;
create policy "cvstudio_archivos_insert" on public.cvstudio_archivos_centro
for insert to authenticated with check ((auth.jwt()->>'email') like '%@cvstudio.com.ar');
drop policy if exists "cvstudio_archivos_update" on public.cvstudio_archivos_centro;
create policy "cvstudio_archivos_update" on public.cvstudio_archivos_centro
for update to authenticated using ((auth.jwt()->>'email') like '%@cvstudio.com.ar')
with check ((auth.jwt()->>'email') like '%@cvstudio.com.ar');
drop policy if exists "cvstudio_archivos_delete" on public.cvstudio_archivos_centro;
create policy "cvstudio_archivos_delete" on public.cvstudio_archivos_centro
for delete to authenticated using ((auth.jwt()->>'email') like '%@cvstudio.com.ar');

drop policy if exists "cvstudio_storage_select" on storage.objects;
create policy "cvstudio_storage_select" on storage.objects for select to authenticated
using (bucket_id='cvstudio-archivos' and (auth.jwt()->>'email') like '%@cvstudio.com.ar');
drop policy if exists "cvstudio_storage_insert" on storage.objects;
create policy "cvstudio_storage_insert" on storage.objects for insert to authenticated
with check (bucket_id='cvstudio-archivos' and (auth.jwt()->>'email') like '%@cvstudio.com.ar');
drop policy if exists "cvstudio_storage_update" on storage.objects;
create policy "cvstudio_storage_update" on storage.objects for update to authenticated
using (bucket_id='cvstudio-archivos' and (auth.jwt()->>'email') like '%@cvstudio.com.ar')
with check (bucket_id='cvstudio-archivos' and (auth.jwt()->>'email') like '%@cvstudio.com.ar');
drop policy if exists "cvstudio_storage_delete" on storage.objects;
create policy "cvstudio_storage_delete" on storage.objects for delete to authenticated
using (bucket_id='cvstudio-archivos' and (auth.jwt()->>'email') like '%@cvstudio.com.ar');
