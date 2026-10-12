-- Nicky Ritmo only. All access passes through the authenticated Edge API.
create table public.nicky_products(id text primary key, body jsonb not null, updated_at timestamptz not null default now(), archived boolean not null default false);
create table public.nicky_settings(id int primary key check(id=1), body jsonb not null, revision int not null default 1);
create table public.nicky_admin_credentials(username text primary key, password_hash text not null);
create table public.nicky_admin_sessions(token_hash text primary key, expires_at timestamptz not null);
create table public.nicky_login_limits(client_hash text primary key, started_at timestamptz not null, attempts int not null);
alter table public.nicky_products enable row level security;
alter table public.nicky_settings enable row level security;
alter table public.nicky_admin_credentials enable row level security;
alter table public.nicky_admin_sessions enable row level security;
alter table public.nicky_login_limits enable row level security;
revoke all on public.nicky_products,public.nicky_settings,public.nicky_admin_credentials,public.nicky_admin_sessions,public.nicky_login_limits from public,anon,authenticated;
grant all on public.nicky_products,public.nicky_settings,public.nicky_admin_credentials,public.nicky_admin_sessions,public.nicky_login_limits to service_role;
create function public.nicky_admin_login(p_user text,p_password text,p_client text) returns jsonb language plpgsql security invoker set search_path='' as $$
declare c public.nicky_login_limits; h text; t text;
begin
 insert into public.nicky_login_limits values(p_client,now(),1) on conflict(client_hash) do update set attempts=case when nicky_login_limits.started_at < now()-interval '15 minutes' then 1 else nicky_login_limits.attempts+1 end,started_at=case when nicky_login_limits.started_at < now()-interval '15 minutes' then now() else nicky_login_limits.started_at end returning * into c;
 if c.attempts>10 then return jsonb_build_object('error','limit'); end if;
 select password_hash into h from public.nicky_admin_credentials where username=lower(p_user);
 if h is null or h <> extensions.crypt(p_password,h) then return jsonb_build_object('error','credentials'); end if;
 delete from public.nicky_admin_sessions where expires_at<now();
 delete from public.nicky_login_limits where started_at<now()-interval '1 day';
 t:=encode(extensions.gen_random_bytes(32),'hex');
 insert into public.nicky_admin_sessions values(encode(extensions.digest(t,'sha256'),'hex'),now()+interval '2 hours');
 return jsonb_build_object('token',t,'expires',now()+interval '2 hours');
end $$;
revoke all on function public.nicky_admin_login(text,text,text) from public,anon,authenticated;
grant execute on function public.nicky_admin_login(text,text,text) to service_role;
insert into public.nicky_settings values(1,'{"headline":"Dale una nueva","accent":"identidad a tu teclado.","subtitle":"Ritmos y sonidos para tu modelo. Comprá online y descargá después del pago.","catalogTitle":"Encontrá el pack para tu teclado"}',1);
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('nicky-covers','nicky-covers',true,1048576,array['image/jpeg','image/png','image/webp']);
-- Bucket has no client write policies; only the authenticated server uploads.
