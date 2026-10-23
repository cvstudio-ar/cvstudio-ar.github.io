alter table public.psico_admin_accounts
  add column if not exists email text,
  add column if not exists registered_at timestamptz not null default now(),
  add column if not exists registration_source text not null default 'admin';
alter table public.psico_admin_accounts
  add constraint psico_accounts_email_normalized check (email is null or (email=lower(trim(email)) and length(email)<=254)),
  add constraint psico_accounts_registration_source check (registration_source in ('admin','self_service'));
create unique index if not exists psico_accounts_email_unique on public.psico_admin_accounts (email) where email is not null;
comment on column public.psico_admin_accounts.email is 'Correo de la cuenta; no implica verificación del correo ni confirmación del pago.';
comment on column public.psico_admin_accounts.registration_source is 'Origen del alta. El registro autónomo nunca otorga vigencia de suscripción.';
