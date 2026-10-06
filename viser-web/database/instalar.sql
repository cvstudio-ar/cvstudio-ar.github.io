-- Ejecutar una vez en un proyecto Supabase dedicado a VISER.
begin;
create table public.viser_admins (user_id uuid primary key references auth.users(id) on delete cascade);
alter table public.viser_admins enable row level security;
revoke all on public.viser_admins from anon,authenticated;
grant select on public.viser_admins to authenticated;
create policy "Leer permiso propio" on public.viser_admins for select to authenticated using (user_id = (select auth.uid()));
create table public.viser_products (
 id uuid primary key default gen_random_uuid(), title text not null check(length(title) between 1 and 180),
 description text not null check(length(description)<=3000), image text not null,
 price numeric(14,2) check(price>=0), currency text not null default 'ARS' check(currency in ('ARS','USD')),
 stock integer check(stock>=0), category text not null default 'Grupos electrógenos' check(category in ('Grupos electrógenos','Herramientas','Accesorios')),
 published boolean not null default true, sort_order integer not null default 0 check(sort_order>=0)
);
alter table public.viser_products enable row level security;
grant select on public.viser_products to anon,authenticated;
grant insert,update,delete on public.viser_products to authenticated;
create policy "Leer productos públicos" on public.viser_products for select to anon,authenticated using (published);
create policy "Administrar productos" on public.viser_products for all to authenticated using (exists(select 1 from public.viser_admins where user_id=(select auth.uid()))) with check (exists(select 1 from public.viser_admins where user_id=(select auth.uid())));
create table public.viser_settings (id integer primary key check(id=1), whatsapp text not null default '', email text not null default '', instagram text not null default '', facebook text not null default '', hero_image text not null default 'assets/hero.webp');
alter table public.viser_settings enable row level security;
grant select on public.viser_settings to anon,authenticated;
grant update on public.viser_settings to authenticated;
create policy "Leer contacto público" on public.viser_settings for select to anon,authenticated using(true);
create policy "Editar contacto" on public.viser_settings for update to authenticated using (exists(select 1 from public.viser_admins where user_id=(select auth.uid()))) with check (exists(select 1 from public.viser_admins where user_id=(select auth.uid())));
insert into public.viser_settings(id,whatsapp,email) values(1,'5493816355637','info@viserint.com');
insert into public.viser_products(id,title,description,image,sort_order) values
 ('11000000-0000-4000-8000-000000000001','Grupo electrógeno Deutz · 110 kVA','Equipo diésel con motor Deutz y generador Stamford. Súper insonorizado.','assets/deutz-110.webp',1),
 ('16900000-0000-4000-8000-000000000002','Grupo electrógeno LOGUS · 169 kVA','Equipo diésel con motor Ricardo, generador Stamford y transferencia automática incorporada. Insonorizado.','assets/logus-169.webp',2),
 ('25000000-0000-4000-8000-000000000003','Grupo electrógeno Cummins · 250 kVA','Equipo diésel, súper insonorizado y con transferencia automática incorporada.','assets/cummins-250.webp',3);
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('viser-media','viser-media',true,5242880,array['image/jpeg','image/png','image/webp']);
create policy "Cargar imágenes VISER" on storage.objects for insert to authenticated with check(bucket_id='viser-media' and exists(select 1 from public.viser_admins where user_id=(select auth.uid())));
create policy "Ver archivos para administrar" on storage.objects for select to authenticated using(bucket_id='viser-media' and exists(select 1 from public.viser_admins where user_id=(select auth.uid())));
create policy "Eliminar imágenes VISER" on storage.objects for delete to authenticated using(bucket_id='viser-media' and exists(select 1 from public.viser_admins where user_id=(select auth.uid())));
commit;
