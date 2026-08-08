-- CVStudio v1.4.46 · Solicitudes privadas de firma manuscrita digitalizada
create table if not exists public.firmas_solicitudes (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  cliente_id text,
  cliente_nombre text not null,
  cliente_whatsapp text,
  documento text not null default 'Carta de presentación',
  estado text not null default 'pendiente' check (estado in ('pendiente','recibida','vencida','eliminada')),
  object_path text,
  creado timestamptz not null default now(),
  enlace_expira timestamptz not null,
  firmado timestamptz,
  firma_expira timestamptz,
  consentimiento timestamptz,
  creado_por uuid
);

create index if not exists firmas_solicitudes_cliente_idx on public.firmas_solicitudes(cliente_id, creado desc);
create index if not exists firmas_solicitudes_expira_idx on public.firmas_solicitudes(estado, firma_expira);

alter table public.firmas_solicitudes enable row level security;

grant usage on schema public to service_role;
grant all privileges on table public.firmas_solicitudes to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('firmas-clientes', 'firmas-clientes', false, 1500000, array['image/png'])
on conflict (id) do update set public=false, file_size_limit=1500000, allowed_mime_types=array['image/png'];

-- La tabla y el bucket son privados. El Worker opera exclusivamente con service role.
