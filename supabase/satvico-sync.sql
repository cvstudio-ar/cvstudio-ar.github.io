create table public.satvico_sync_settings (
 id integer primary key check(id=1),
 settings jsonb not null check(jsonb_typeof(settings)='object'),
 revision integer not null default 1,
 updated_at timestamptz not null default now()
);
create table public.satvico_sync_credentials (username text primary key,password_hash text not null);
create table public.satvico_sync_sessions (token_hash text primary key,expires_at timestamptz not null);
create index satvico_sync_sessions_expiry on public.satvico_sync_sessions(expires_at);
create table public.satvico_sync_login_limits (client_key text primary key,window_start timestamptz not null default now(),attempts integer not null default 1);
alter table public.satvico_sync_settings enable row level security;
alter table public.satvico_sync_credentials enable row level security;
alter table public.satvico_sync_sessions enable row level security;
alter table public.satvico_sync_login_limits enable row level security;
revoke all on public.satvico_sync_settings, public.satvico_sync_credentials, public.satvico_sync_sessions, public.satvico_sync_login_limits from public, anon, authenticated;
grant all on public.satvico_sync_settings, public.satvico_sync_credentials, public.satvico_sync_sessions, public.satvico_sync_login_limits to service_role;
create function public.satvico_sync_allow_login(client_key text) returns boolean
language plpgsql security invoker set search_path='' as $fn$
declare n integer;
begin
 insert into public.satvico_sync_login_limits as l(client_key) values(satvico_sync_allow_login.client_key)
 on conflict on constraint satvico_sync_login_limits_pkey do update set
 attempts=case when l.window_start < now()-interval '15 minutes' then 1 else l.attempts+1 end,
 window_start=case when l.window_start < now()-interval '15 minutes' then now() else l.window_start end
 returning attempts into n;
 delete from public.satvico_sync_login_limits where window_start < now()-interval '1 day';
 return n <= 8;
end $fn$;
revoke all on function public.satvico_sync_allow_login(text) from public,anon,authenticated;
grant execute on function public.satvico_sync_allow_login(text) to service_role;
insert into public.satvico_sync_settings(id,settings) values (1,$settings${"name":"Por Un Mundo Satvico","tagline":"YOGA · MEDITACIÓN · BIENESTAR","heroTitle":"Un espacio para\nvolver a vos.","heroText":"Practicá yoga, escuchá meditaciones y encontrá tu pausa, a tu ritmo.","heroImage":"assets/portada-yoga.mp4","logo":"assets/logo-transparente.png","primary":"#773c96","background":"#faf7f2","libraryTitle":"Elegí tu momento de bienestar","aboutTitle":"Un espacio para practicar, sentir y conectar.","aboutText":"Movimiento, respiración y momentos de calma. Un lugar para encontrarte con la práctica desde casa, respetando tu propio ritmo.","membershipTitle":"Membresía del estudio","membershipText":"Clases, meditaciones y reflexiones reunidas en tu biblioteca personal.","price":"","instagram":"https://www.instagram.com/porunmundosatvico_estudio/","whatsapp":"","email":"","showMeditation":true,"showReflections":true,"showMembership":true,"showAbout":true,"showAmbient":true,"heroMediaType":"video","heroAspectRatio":1}$settings$::jsonb);
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('satvico-public-media','satvico-public-media',true,50000000,array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm']);

-- Configurar la credencial administrativa de la nueva cuenta por un canal privado.
-- No se exportan sesiones ni credenciales de CVStudio.
