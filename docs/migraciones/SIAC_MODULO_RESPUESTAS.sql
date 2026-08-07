-- CVStudio SIAC · Módulo de respuestas e historial v1.2.1
-- Ejecutar una sola vez en Supabase > SQL Editor.
-- Es idempotente: puede volver a ejecutarse sin borrar comunicaciones existentes.

create extension if not exists pgcrypto;

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
  fecha_creacion timestamptz not null default now(),
  constraint comunicaciones_destinatario_no_vacio check (length(trim(destinatario)) > 3),
  constraint comunicaciones_asunto_no_vacio check (length(trim(asunto)) > 3),
  constraint comunicaciones_mensaje_no_vacio check (length(trim(mensaje)) > 9)
);

create index if not exists comunicaciones_solicitud_fecha_idx
  on public.comunicaciones (solicitud_id, fecha_creacion desc);

create unique index if not exists comunicaciones_resend_id_uidx
  on public.comunicaciones (resend_id)
  where resend_id is not null;

alter table public.comunicaciones enable row level security;

-- Mismo usuario administrador que ya utiliza el SIAC actual.
drop policy if exists "cvstudio_admin_comunicaciones" on public.comunicaciones;
create policy "cvstudio_admin_comunicaciones"
  on public.comunicaciones
  for all
  to authenticated
  using (auth.uid() = '3a8b4d50-305a-4da5-9fde-64bd2c8ed68d'::uuid)
  with check (auth.uid() = '3a8b4d50-305a-4da5-9fde-64bd2c8ed68d'::uuid);

grant select, insert, update, delete on table public.comunicaciones to authenticated;

comment on table public.comunicaciones is
  'Historial de correos enviados desde el panel SIAC mediante Cloudflare Worker y Resend.';
