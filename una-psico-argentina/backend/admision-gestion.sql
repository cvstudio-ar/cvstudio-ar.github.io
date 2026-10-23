alter table public.psico_admissions
 add column modified_at timestamptz,
 add column modified_by text,
 add column archived_at timestamptz,
 add column archived_by text,
 add column is_demo boolean not null default false;
create index psico_admissions_active_idx on public.psico_admissions(submitted_at desc,id desc) where archived_at is null;
create index psico_admissions_unread_idx on public.psico_admissions(id) where archived_at is null and status='new';
create function public.psico_manage_admission(p_id uuid,p_actor text,p_operation text,p_form_type text default null,p_payload jsonb default null)
returns boolean language plpgsql security invoker set search_path='' as $$
declare target_username text; target_archived timestamptz;
begin
 if not exists(select 1 from public.psico_admin_accounts where username=p_actor and role in ('owner','admin') and active) then raise exception 'Acceso administrativo requerido'; end if;
 select username,archived_at into target_username,target_archived from public.psico_admissions where id=p_id for update;
 if not found then return false; end if;
 if not exists(select 1 from public.psico_admin_accounts where username=target_username and role='subscriber') then raise exception 'Solo se administran admisiones de suscriptores'; end if;
 if p_operation='archive' then
  update public.psico_admissions set archived_at=now(),archived_by=p_actor where id=p_id and archived_at is null;
  update public.psico_admin_accounts set active=false where username=target_username;
  delete from public.psico_admin_sessions where username=target_username;
 elsif p_operation='restore' then
  update public.psico_admissions set archived_at=null,archived_by=null where id=p_id;
 elsif p_operation='update' then
  if target_archived is not null then raise exception 'Restaurá la admisión antes de modificarla'; end if;
  if p_form_type not in ('argentina','migrantes') or jsonb_typeof(p_payload) is distinct from 'object' or length(p_payload->>'fullName') not between 2 and 200 or coalesce(p_payload->>'email','')='' then raise exception 'Datos de admisión inválidos'; end if;
  update public.psico_admin_accounts set email=lower(trim(p_payload->>'email')) where username=target_username;
  update public.psico_admissions set full_name=p_payload->>'fullName',form_type=p_form_type,payload=p_payload,modified_at=now(),modified_by=p_actor where id=p_id;
 else raise exception 'Operación inválida'; end if;
 return true;
end;
$$;
revoke all on function public.psico_manage_admission(uuid,text,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.psico_manage_admission(uuid,text,text,text,jsonb) to service_role;
