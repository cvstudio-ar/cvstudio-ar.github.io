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

-- Las políticas activas restringen tabla y bucket a cuentas autenticadas
-- del dominio corporativo @cvstudio.com.ar.
