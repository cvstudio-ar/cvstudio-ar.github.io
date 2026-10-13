-- Isolated additive upgrade. Existing products and administrator credentials are preserved.
alter table public.nicky_admin_credentials add column if not exists email text not null default '';
alter table public.nicky_admin_sessions add column if not exists username text references public.nicky_admin_credentials(username) on delete cascade;
create table if not exists public.nicky_customers(id uuid primary key default gen_random_uuid(),name text not null,email text not null unique,password_hash text not null,created_at timestamptz not null default now());
create table if not exists public.nicky_customer_sessions(token_hash text primary key,customer_id uuid not null references public.nicky_customers(id) on delete cascade,expires_at timestamptz not null);
create index if not exists nicky_customer_sessions_customer on public.nicky_customer_sessions(customer_id);
create table if not exists public.nicky_orders(id uuid primary key default gen_random_uuid(),customer_id uuid not null references public.nicky_customers(id),items jsonb not null,total numeric(12,2) not null check(total>0),status text not null default 'pending' check(status in ('pending','approved','cancelled','refunded','demo')),provider text not null check(provider in ('transfer','mercadopago','demo')),payment_id text unique,checkout_url text,created_at timestamptz not null default now(),approved_at timestamptz);
create index if not exists nicky_orders_customer on public.nicky_orders(customer_id,created_at desc);
create table if not exists public.nicky_product_files(product_id text primary key references public.nicky_products(id) on delete cascade,path text not null,filename text not null,sample_url text not null default '',updated_at timestamptz not null default now());
alter table public.nicky_customers enable row level security;
alter table public.nicky_customer_sessions enable row level security;
alter table public.nicky_orders enable row level security;
alter table public.nicky_product_files enable row level security;
revoke all on public.nicky_customers,public.nicky_customer_sessions,public.nicky_orders,public.nicky_product_files from public,anon,authenticated;
grant all on public.nicky_customers,public.nicky_customer_sessions,public.nicky_orders,public.nicky_product_files to service_role;
insert into storage.buckets(id,name,public,file_size_limit) values('nicky-downloads','nicky-downloads',false,52428800) on conflict(id) do nothing;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('nicky-samples','nicky-samples',true,20971520,array['audio/mpeg','audio/wav','audio/x-wav','audio/ogg','audio/mp4','audio/aac','audio/flac','application/octet-stream']) on conflict(id) do nothing;

create or replace function public.nicky_admin_login(p_user text,p_password text,p_client text) returns jsonb language plpgsql security invoker set search_path='' as $$
declare c public.nicky_login_limits; h text; t text;
begin
 insert into public.nicky_login_limits values(p_client,now(),1) on conflict(client_hash) do update set attempts=case when nicky_login_limits.started_at < now()-interval '15 minutes' then 1 else nicky_login_limits.attempts+1 end,started_at=case when nicky_login_limits.started_at < now()-interval '15 minutes' then now() else nicky_login_limits.started_at end returning * into c;
 if c.attempts>10 then return jsonb_build_object('error','limit'); end if;
 select password_hash into h from public.nicky_admin_credentials where username=lower(p_user);
 if h is null or h<>extensions.crypt(p_password,h) then return jsonb_build_object('error','credentials'); end if;
 delete from public.nicky_admin_sessions where expires_at<now();
 t:=encode(extensions.gen_random_bytes(32),'hex');
 insert into public.nicky_admin_sessions(token_hash,expires_at,username) values(encode(extensions.digest(t,'sha256'),'hex'),now()+interval '2 hours',lower(p_user));
 return jsonb_build_object('token',t,'expires',now()+interval '2 hours');
end $$;

create or replace function public.nicky_customer_auth(p_action text,p_name text,p_email text,p_password text,p_client text) returns jsonb language plpgsql security invoker set search_path='' as $$
declare c public.nicky_login_limits; u public.nicky_customers; t text;
begin
 insert into public.nicky_login_limits values(p_client,now(),1) on conflict(client_hash) do update set attempts=case when nicky_login_limits.started_at < now()-interval '15 minutes' then 1 else nicky_login_limits.attempts+1 end,started_at=case when nicky_login_limits.started_at < now()-interval '15 minutes' then now() else nicky_login_limits.started_at end returning * into c;
 if c.attempts>10 then return jsonb_build_object('error','Demasiados intentos. Esperá 15 minutos.');end if;
 if length(p_password)<12 or length(p_password)>72 or length(p_email)>160 or p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then return jsonb_build_object('error','Revisá el correo y la contraseña (12 a 72 caracteres).');end if;
 if p_action='register' then
  if length(trim(p_name))<2 or length(p_name)>100 then return jsonb_build_object('error','Ingresá tu nombre.');end if;
  insert into public.nicky_customers(name,email,password_hash) values(trim(p_name),lower(trim(p_email)),extensions.crypt(p_password,extensions.gen_salt('bf',10))) returning * into u;
 else
  select * into u from public.nicky_customers where email=lower(trim(p_email));
  if u.id is null or u.password_hash<>extensions.crypt(p_password,u.password_hash) then return jsonb_build_object('error','Correo o contraseña incorrectos.');end if;
 end if;
 t:=encode(extensions.gen_random_bytes(32),'hex');
 delete from public.nicky_customer_sessions where expires_at<now();
 insert into public.nicky_customer_sessions values(encode(extensions.digest(t,'sha256'),'hex'),u.id,now()+interval '24 hours');
 return jsonb_build_object('token',t,'customer',jsonb_build_object('id',u.id,'name',u.name,'email',u.email));
exception when unique_violation then return jsonb_build_object('error','No pudimos crear esta cuenta. Si ya tenés una, iniciá sesión.');
end $$;

create or replace function public.nicky_account_update(p_digest text,p_kind text,p_current text,p_password text,p_email text) returns jsonb language plpgsql security invoker set search_path='' as $$
declare h text; u text; c uuid;
begin
 if length(p_password)>0 and (length(p_password)<12 or length(p_password)>72) then return jsonb_build_object('error','La nueva contraseña debe tener entre 12 y 72 caracteres.');end if;
 if p_kind='admin' then
  select username into u from public.nicky_admin_sessions where token_hash=p_digest and expires_at>now();
  if u is null then return jsonb_build_object('error','Volvé a iniciar sesión para modificar tu cuenta.');end if;
  select password_hash into h from public.nicky_admin_credentials where username=u;
  if h<>extensions.crypt(p_current,h) then return jsonb_build_object('error','La contraseña actual no es correcta.');end if;
  if length(p_email)>160 or p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then return jsonb_build_object('error','Revisá el correo.');end if;
  update public.nicky_admin_credentials set email=lower(trim(p_email)),password_hash=case when p_password='' then password_hash else extensions.crypt(p_password,extensions.gen_salt('bf',10)) end where username=u;
  if p_password<>'' then delete from public.nicky_admin_sessions where username=u;end if;
 else
  select customer_id into c from public.nicky_customer_sessions where token_hash=p_digest and expires_at>now();
  select password_hash into h from public.nicky_customers where id=c;
  if c is null or h<>extensions.crypt(p_current,h) then return jsonb_build_object('error','La contraseña actual no es correcta.');end if;
  if p_password='' then return jsonb_build_object('error','Ingresá la nueva contraseña.');end if;
  update public.nicky_customers set password_hash=extensions.crypt(p_password,extensions.gen_salt('bf',10)) where id=c;
  delete from public.nicky_customer_sessions where customer_id=c;
 end if;
 return jsonb_build_object('ok',true,'reauthenticate',p_password<>'');
end $$;

create or replace function public.nicky_create_order(p_customer uuid,p_ids jsonb,p_provider text,p_key uuid) returns jsonb language plpgsql security invoker set search_path='' as $$
declare items jsonb; n int; amount numeric; result public.nicky_orders;
begin
 select * into result from public.nicky_orders where id=p_key and customer_id=p_customer;
 if result.id is not null then return to_jsonb(result);end if;
 if p_provider not in ('transfer','mercadopago','demo') or jsonb_typeof(p_ids)<>'array' or jsonb_array_length(p_ids) not between 1 and 40 then raise exception 'invalid order';end if;
 if (select count(distinct value) from jsonb_array_elements_text(p_ids))<>jsonb_array_length(p_ids) then raise exception 'duplicate products';end if;
 select count(*),jsonb_agg(jsonb_build_object('id',p.id,'name',p.body->>'name','price',(p.body->>'price')::numeric,'filename',f.filename,'file',f.path)),sum((p.body->>'price')::numeric) into n,items,amount
 from public.nicky_products p left join public.nicky_product_files f on f.product_id=p.id
 where p.id in (select value from jsonb_array_elements_text(p_ids)) and (p_provider='demo' or coalesce(f.path,'')<>'') and not p.archived and coalesce((p.body->>'published')::boolean,true);
 if n<>jsonb_array_length(p_ids) or amount<=0 then raise exception 'products unavailable';end if;
 insert into public.nicky_orders(id,customer_id,items,total,provider,status) values(p_key,p_customer,items,amount,p_provider,case when p_provider='demo' then 'demo' else 'pending' end) returning * into result;
 return to_jsonb(result);
end $$;
revoke all on function public.nicky_admin_login(text,text,text),public.nicky_customer_auth(text,text,text,text,text),public.nicky_account_update(text,text,text,text,text),public.nicky_create_order(uuid,jsonb,text,uuid) from public,anon,authenticated;
grant execute on function public.nicky_admin_login(text,text,text),public.nicky_customer_auth(text,text,text,text,text),public.nicky_account_update(text,text,text,text,text),public.nicky_create_order(uuid,jsonb,text,uuid) to service_role;
-- Add display defaults without replacing the currently saved hero text.
update public.nicky_settings set body=body || '{"storeName":"CVStudio","email":"cvstudioargentina@gmail.com","whatsapp":"5492964652318","instagram":"https://www.instagram.com/cvstudioargentina/","facebook":"https://web.facebook.com/profile.php?id=61591787648939","tiktok":"https://www.tiktok.com/@cvstudioargentina","style":"classic","color":"#0864f5","heroImage":"","logo":"","footerText":"CVStudio · Tienda digital","demoMode":true}'::jsonb,revision=revision+1 where id=1;

update public.nicky_products set body=jsonb_set(body,'{description}',to_jsonb(replace(replace(coalesce(body->>'description',''),'Nicky Ritmo','CVStudio'),'NICKY RITMO','CVSTUDIO'))),updated_at=now() where body->>'description' like '%Nicky Ritmo%';
