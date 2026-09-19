-- CVStudio · Ciclo integral de preparación v4
-- Revisión de respuestas abiertas, reintentos y comparación de evolución.

alter table public.evaluaciones_entrevista
  add column if not exists revision_abiertas jsonb not null default '{}'::jsonb,
  add column if not exists intento_origen uuid references public.evaluaciones_entrevista(id) on delete set null,
  add column if not exists numero_intento integer not null default 1,
  add column if not exists informe_generado_en timestamptz;

alter table public.evaluaciones_entrevista drop constraint if exists evaluaciones_revision_abiertas_check;
alter table public.evaluaciones_entrevista add constraint evaluaciones_revision_abiertas_check
  check (jsonb_typeof(revision_abiertas)='object');

alter table public.evaluaciones_entrevista drop constraint if exists evaluaciones_numero_intento_check;
alter table public.evaluaciones_entrevista add constraint evaluaciones_numero_intento_check
  check (numero_intento between 1 and 20);

create index if not exists evaluaciones_entrevista_intento_origen_idx
  on public.evaluaciones_entrevista(intento_origen,numero_intento);

comment on column public.evaluaciones_entrevista.revision_abiertas is 'Puntuación 0-3 y observación profesional por respuesta abierta.';
comment on column public.evaluaciones_entrevista.intento_origen is 'Primer intento del proceso utilizado para comparar evolución.';
comment on column public.evaluaciones_entrevista.numero_intento is 'Número secuencial dentro del proceso de preparación.';
