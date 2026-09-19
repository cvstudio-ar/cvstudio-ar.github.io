-- CVStudio · Canva OAuth
-- Ejecutar una sola vez desde Supabase SQL Editor.

create table if not exists public.canva_oauth_sessions (
  state text primary key,
  code_verifier text not null,
  user_id uuid not null,
  redirect_uri text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists canva_oauth_sessions_expires_at_idx
  on public.canva_oauth_sessions (expires_at);

create table if not exists public.canva_integraciones (
  user_id uuid primary key,
  access_token text not null,
  refresh_token text not null,
  token_type text not null default 'Bearer',
  scopes text,
  expires_at timestamptz not null,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.canva_oauth_sessions enable row level security;
alter table public.canva_integraciones enable row level security;

revoke all on table public.canva_oauth_sessions from anon, authenticated;
revoke all on table public.canva_integraciones from anon, authenticated;
grant select, insert, update, delete on table public.canva_oauth_sessions to service_role;
grant select, insert, update, delete on table public.canva_integraciones to service_role;

comment on table public.canva_oauth_sessions is
  'Sesiones PKCE efímeras de Canva. Acceso exclusivo del Worker mediante service_role.';
comment on table public.canva_integraciones is
  'Tokens OAuth de Canva. Acceso exclusivo del Worker mediante service_role.';
