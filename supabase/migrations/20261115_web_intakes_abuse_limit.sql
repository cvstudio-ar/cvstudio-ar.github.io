begin;
-- Identificador seudonimizado por día y solo para limitar abuso; nunca se guarda la dirección IP sin procesar.
alter table public.cvstudio_web_intakes add column if not exists visitor_hash text;
create index if not exists cvstudio_web_intakes_limit_idx
  on public.cvstudio_web_intakes(visitor_hash, created_at desc)
  where visitor_hash is not null;
commit;