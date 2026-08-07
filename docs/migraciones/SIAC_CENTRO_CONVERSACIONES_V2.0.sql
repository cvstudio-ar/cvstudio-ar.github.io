-- CVStudio SIAC v2.0 · Centro de Conversaciones
-- Ejecutar después de SIAC_MODULO_RESPUESTAS.sql y SIAC_CENTRO_CONVERSACIONES_V1.3.sql.
-- Idempotente: no borra solicitudes ni comunicaciones existentes.

alter table public.comunicaciones
  add column if not exists canal text not null default 'email',
  add column if not exists origen_registro text not null default 'automatico',
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.comunicaciones drop constraint if exists comunicaciones_canal_check;
alter table public.comunicaciones add constraint comunicaciones_canal_check
  check (canal in ('email','siac','sistema'));

create index if not exists comunicaciones_conversacion_idx
  on public.comunicaciones (solicitud_id, fecha_creacion asc);

create index if not exists comunicaciones_direccion_fecha_idx
  on public.comunicaciones (direccion, fecha_creacion desc);

comment on column public.comunicaciones.canal is 'email, siac o sistema';
comment on column public.comunicaciones.origen_registro is 'automatico, manual o webhook';
comment on column public.comunicaciones.metadata is 'Información técnica adicional del mensaje o evento';
