-- CVStudio SIAC · Centro de conversaciones v1.3
-- Ejecutar después de SIAC_MODULO_RESPUESTAS.sql.
-- Idempotente: no elimina solicitudes ni comunicaciones existentes.

create extension if not exists pgcrypto;

alter table public.comunicaciones
  add column if not exists direccion text not null default 'saliente',
  add column if not exists remitente text,
  add column if not exists html text,
  add column if not exists message_id text,
  add column if not exists email_externo_id text,
  add column if not exists no_leido boolean not null default false,
  add column if not exists adjuntos jsonb not null default '[]'::jsonb,
  add column if not exists fecha_lectura timestamptz;

alter table public.comunicaciones
  drop constraint if exists comunicaciones_direccion_check;
alter table public.comunicaciones
  add constraint comunicaciones_direccion_check
  check (direccion in ('entrante','saliente','sistema'));

create index if not exists comunicaciones_no_leido_idx
  on public.comunicaciones (no_leido, fecha_creacion desc)
  where no_leido = true;

create unique index if not exists comunicaciones_email_externo_uidx
  on public.comunicaciones (email_externo_id)
  where email_externo_id is not null;

-- Asegura que los registros existentes queden identificados como salientes.
update public.comunicaciones
set direccion = 'saliente', no_leido = false
where direccion is null or direccion = '';

comment on column public.comunicaciones.direccion is 'entrante, saliente o sistema';
comment on column public.comunicaciones.adjuntos is 'Metadatos y enlaces temporales de archivos recibidos';
comment on column public.comunicaciones.email_externo_id is 'ID de Resend para deduplicar webhooks entrantes';
