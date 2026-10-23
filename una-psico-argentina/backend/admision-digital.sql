create table public.psico_admissions (
 id uuid primary key default gen_random_uuid(),
 username text not null unique references public.psico_admin_accounts(username) on delete cascade,
 full_name text not null check (length(full_name) between 2 and 200),
 form_type text not null check (form_type in ('argentina','migrantes')),
 form_version text not null default '2026-10-v1',
 payload jsonb not null check (jsonb_typeof(payload)='object' and octet_length(payload::text)<=50000),
 consent_version text not null,
 consented_at timestamptz not null default now(),
 submitted_at timestamptz not null default now(),
 status text not null default 'new' check (status in ('new','read')),
 read_at timestamptz
);
alter table public.psico_admissions enable row level security;
revoke all on table public.psico_admissions from public, anon, authenticated;
grant select,insert,update,delete on table public.psico_admissions to service_role;
create index psico_admissions_submitted_idx on public.psico_admissions (submitted_at desc);
comment on table public.psico_admissions is 'Admisiones confidenciales; acceso exclusivamente mediante API administrativa autenticada. Sin evaluación clínica automática.';
create function public.psico_register_with_admission(p_username text,p_email text,p_password_salt text,p_password_hash text,p_form_type text,p_payload jsonb,p_consent_version text)
returns uuid language plpgsql security invoker set search_path='' as $$
declare admission_id uuid;
begin
 insert into public.psico_admin_accounts(username,email,password_salt,password_hash,iterations,role,active,subscription_expires_at,registration_source)
 values(p_username,p_email,p_password_salt,p_password_hash,210000,'subscriber',true,null,'self_service');
 insert into public.psico_admissions(username,full_name,form_type,payload,consent_version)
 values(p_username,p_payload->>'fullName',p_form_type,p_payload,p_consent_version) returning id into admission_id;
 return admission_id;
end;
$$;
revoke all on function public.psico_register_with_admission(text,text,text,text,text,jsonb,text) from public,anon,authenticated;
grant execute on function public.psico_register_with_admission(text,text,text,text,text,jsonb,text) to service_role;
