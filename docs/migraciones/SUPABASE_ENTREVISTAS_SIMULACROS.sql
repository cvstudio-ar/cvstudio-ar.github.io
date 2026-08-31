-- CVStudio · Entrevistas y simulacros v1.0
-- Ejecutar una sola vez en Supabase > SQL Editor.
-- Los participantes no tienen acceso directo a las tablas: usan tres RPC
-- limitadas por un token UUID individual. Las respuestas correctas nunca se
-- envían al navegador público.

create table if not exists public.plantillas_evaluacion (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  titulo text not null,
  tipo text not null default 'Lógica y atención',
  descripcion text,
  duracion_minutos integer not null default 25 check (duracion_minutos between 5 and 180),
  preguntas jsonb not null default '[]'::jsonb check (jsonb_typeof(preguntas) = 'array'),
  activa boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create table if not exists public.evaluaciones_entrevista (
  id uuid primary key default gen_random_uuid(),
  token uuid not null unique default gen_random_uuid(),
  cliente_nombre text not null check (char_length(cliente_nombre) between 2 and 120),
  cliente_email text,
  cliente_whatsapp text,
  puesto_objetivo text not null check (char_length(puesto_objetivo) between 2 and 160),
  plantilla_id uuid not null references public.plantillas_evaluacion(id),
  duracion_minutos integer not null default 25 check (duracion_minutos between 5 and 180),
  estado text not null default 'Pendiente' check (estado in ('Pendiente','Iniciada','Completada','Revisada','Vencida','Cancelada')),
  creado_en timestamptz not null default now(),
  vence_en timestamptz not null default (now() + interval '7 days'),
  iniciado_en timestamptz,
  finalizado_en timestamptz,
  revisado_en timestamptz,
  respuestas jsonb not null default '{}'::jsonb check (jsonb_typeof(respuestas) = 'object'),
  puntaje_total integer,
  total_preguntas integer,
  tiempo_segundos integer,
  dificultad_percibida text,
  ansiedad_percibida text,
  comentario_participante text,
  notas_internas text,
  devolucion text,
  creado_por uuid default auth.uid(),
  actualizado_en timestamptz not null default now()
);

create index if not exists evaluaciones_entrevista_token_idx on public.evaluaciones_entrevista(token);
create index if not exists evaluaciones_entrevista_estado_idx on public.evaluaciones_entrevista(estado, creado_en desc);
create index if not exists evaluaciones_entrevista_plantilla_idx on public.evaluaciones_entrevista(plantilla_id);

alter table public.plantillas_evaluacion enable row level security;
alter table public.evaluaciones_entrevista enable row level security;

drop policy if exists "Dirección administra plantillas de evaluación" on public.plantillas_evaluacion;
create policy "Dirección administra plantillas de evaluación"
on public.plantillas_evaluacion for all to authenticated
using ((select auth.uid()) = '3a8b4d50-305a-4da5-9fde-64bd2c8ed68d'::uuid)
with check ((select auth.uid()) = '3a8b4d50-305a-4da5-9fde-64bd2c8ed68d'::uuid);

drop policy if exists "Dirección administra evaluaciones" on public.evaluaciones_entrevista;
create policy "Dirección administra evaluaciones"
on public.evaluaciones_entrevista for all to authenticated
using ((select auth.uid()) = '3a8b4d50-305a-4da5-9fde-64bd2c8ed68d'::uuid)
with check ((select auth.uid()) = '3a8b4d50-305a-4da5-9fde-64bd2c8ed68d'::uuid);

revoke all on table public.plantillas_evaluacion from anon;
revoke all on table public.evaluaciones_entrevista from anon;
grant select, insert, update, delete on table public.plantillas_evaluacion to authenticated;
grant select, insert, update, delete on table public.evaluaciones_entrevista to authenticated;

insert into public.plantillas_evaluacion (slug,titulo,tipo,descripcion,duracion_minutos,preguntas)
values (
  'logica-atencion-calidad-20',
  'Lógica, atención y criterio laboral · Calidad',
  'Psicotécnico orientativo',
  'Práctica de 20 preguntas para puestos de calidad, producción y supervisión.',
  25,
  $questions$[
    {"id":"q1","category":"Series numéricas","text":"¿Qué número continúa la secuencia 2, 6, 12, 20, 30…?","options":[{"value":"A","label":"38"},{"value":"B","label":"40"},{"value":"C","label":"42"},{"value":"D","label":"44"}],"correct":"C"},
    {"id":"q2","category":"Series numéricas","text":"¿Qué número continúa la secuencia 81, 27, 9, 3…?","options":[{"value":"A","label":"0"},{"value":"B","label":"1"},{"value":"C","label":"2"},{"value":"D","label":"6"}],"correct":"B"},
    {"id":"q3","category":"Series numéricas","text":"¿Qué número continúa la secuencia 5, 10, 20, 40…?","options":[{"value":"A","label":"60"},{"value":"B","label":"70"},{"value":"C","label":"80"},{"value":"D","label":"90"}],"correct":"C"},
    {"id":"q4","category":"Series numéricas","text":"¿Qué número continúa la secuencia 4, 7, 13, 25, 49…?","options":[{"value":"A","label":"72"},{"value":"B","label":"97"},{"value":"C","label":"98"},{"value":"D","label":"101"}],"correct":"B"},
    {"id":"q5","category":"Secuencias","text":"¿Qué letra continúa la secuencia A, C, E, G…?","options":[{"value":"A","label":"H"},{"value":"B","label":"I"},{"value":"C","label":"J"},{"value":"D","label":"K"}],"correct":"B"},
    {"id":"q6","category":"Atención","text":"¿Qué número no respeta el patrón: 14, 28, 42, 55, 70?","options":[{"value":"A","label":"28"},{"value":"B","label":"42"},{"value":"C","label":"55"},{"value":"D","label":"70"}],"correct":"C"},
    {"id":"q7","category":"Orden de procesos","text":"¿Cuál es el orden más lógico al recibir un lote de materiales?","options":[{"value":"A","label":"Almacenar, registrar, inspeccionar, recibir"},{"value":"B","label":"Recibir, inspeccionar, registrar, almacenar"},{"value":"C","label":"Registrar, almacenar, recibir, inspeccionar"},{"value":"D","label":"Inspeccionar, recibir, almacenar, registrar"}],"correct":"B"},
    {"id":"q8","category":"Atención","text":"¿Cuántas veces aparece la letra A en “CALIDAD ASEGURADA”?","options":[{"value":"A","label":"3"},{"value":"B","label":"4"},{"value":"C","label":"5"},{"value":"D","label":"6"}],"correct":"C"},
    {"id":"q9","category":"Precisión visual","text":"Seleccioná el código exactamente igual a QC-4827-B.","options":[{"value":"A","label":"QC-4872-B"},{"value":"B","label":"QC-4827-B"},{"value":"C","label":"OC-4827-B"},{"value":"D","label":"QC-4827-8"}],"correct":"B"},
    {"id":"q10","category":"Cálculo","text":"El 15% de 240 unidades presenta una observación. ¿Cuántas unidades son?","options":[{"value":"A","label":"24"},{"value":"B","label":"30"},{"value":"C","label":"36"},{"value":"D","label":"40"}],"correct":"C"},
    {"id":"q11","category":"Cálculo","text":"Tres operarios producen 180 piezas en 2 horas. Al mismo ritmo, ¿cuántas producirán cinco operarios en 3 horas?","options":[{"value":"A","label":"360"},{"value":"B","label":"400"},{"value":"C","label":"450"},{"value":"D","label":"540"}],"correct":"C"},
    {"id":"q12","category":"Cálculo","text":"En una muestra de 200 piezas se detectan 8 defectuosas. ¿Cuál es el porcentaje de defecto?","options":[{"value":"A","label":"2%"},{"value":"B","label":"4%"},{"value":"C","label":"6%"},{"value":"D","label":"8%"}],"correct":"B"},
    {"id":"q13","category":"Razonamiento verbal","text":"Todos los productos inspeccionados quedan registrados. El lote X fue inspeccionado. ¿Qué conclusión corresponde?","options":[{"value":"A","label":"El lote X fue rechazado"},{"value":"B","label":"El lote X quedó registrado"},{"value":"C","label":"El lote X no tiene defectos"},{"value":"D","label":"No puede concluirse nada"}],"correct":"B"},
    {"id":"q14","category":"Comprensión verbal","text":"En un procedimiento de calidad, la palabra “preciso” se aproxima más a:","options":[{"value":"A","label":"Rápido"},{"value":"B","label":"Exacto"},{"value":"C","label":"Flexible"},{"value":"D","label":"Extenso"}],"correct":"B"},
    {"id":"q15","category":"Seguimiento de instrucciones","text":"Observá: cuadrado, triángulo, círculo, estrella. ¿Qué figura está dos posiciones después del triángulo?","options":[{"value":"A","label":"Cuadrado"},{"value":"B","label":"Círculo"},{"value":"C","label":"Estrella"},{"value":"D","label":"Triángulo"}],"correct":"C"},
    {"id":"q16","category":"Matriz lógica","text":"Completá la matriz: fila 1 = 2, 4, 6; fila 2 = 3, 6, 9; fila 3 = 4, 8, __.","options":[{"value":"A","label":"10"},{"value":"B","label":"11"},{"value":"C","label":"12"},{"value":"D","label":"14"}],"correct":"C"},
    {"id":"q17","category":"Criterio laboral","text":"Durante una inspección detectás un riesgo que podría afectar la calidad del lote. ¿Qué hacés primero?","options":[{"value":"A","label":"Continuar para no demorar la producción"},{"value":"B","label":"Separar el material afectado y comunicar el hallazgo según el procedimiento"},{"value":"C","label":"Corregirlo sin registrar nada"},{"value":"D","label":"Esperar a que otra persona lo detecte"}],"correct":"B"},
    {"id":"q18","category":"Criterio laboral","text":"Un operario no está de acuerdo con una observación de calidad. ¿Cuál es la respuesta más adecuada?","options":[{"value":"A","label":"Imponer la decisión sin escucharlo"},{"value":"B","label":"Evitar el tema para no generar conflicto"},{"value":"C","label":"Escuchar, revisar evidencia y explicar el criterio con respeto"},{"value":"D","label":"Elevar una sanción de inmediato"}],"correct":"C"},
    {"id":"q19","category":"Priorización","text":"Tenés varias tareas urgentes y no llegás a completar todas dentro del turno. ¿Qué hacés?","options":[{"value":"A","label":"Elegir las más sencillas y omitir el resto"},{"value":"B","label":"Priorizar por riesgo e impacto y avisar a tiempo sobre la capacidad disponible"},{"value":"C","label":"Trabajar más rápido aunque aumenten los errores"},{"value":"D","label":"No informar hasta finalizar el turno"}],"correct":"B"},
    {"id":"q20","category":"Criterio laboral","text":"Una medición queda fuera de tolerancia. ¿Cuál es la acción más completa?","options":[{"value":"A","label":"Modificar el dato para que coincida"},{"value":"B","label":"Repetir hasta obtener un valor aceptable"},{"value":"C","label":"Registrar, aislar, verificar el método y comunicar para analizar la causa"},{"value":"D","label":"Descartar la pieza sin dejar registro"}],"correct":"C"}
  ]$questions$::jsonb
)
on conflict (slug) do update set
  titulo = excluded.titulo,
  tipo = excluded.tipo,
  descripcion = excluded.descripcion,
  duracion_minutos = excluded.duracion_minutos,
  preguntas = excluded.preguntas,
  activa = true,
  actualizado_en = now();

create or replace function public.obtener_simulacro_publico(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_eval public.evaluaciones_entrevista%rowtype;
  v_template public.plantillas_evaluacion%rowtype;
  v_questions jsonb;
  v_deadline timestamptz;
begin
  select * into v_eval from public.evaluaciones_entrevista where token = p_token;
  if not found then return jsonb_build_object('ok',false,'message','El enlace no existe.'); end if;
  if v_eval.estado = 'Cancelada' then return jsonb_build_object('ok',false,'message','El simulacro fue cancelado.'); end if;
  if v_eval.estado = 'Pendiente' and now() > v_eval.vence_en then
    update public.evaluaciones_entrevista set estado='Vencida',actualizado_en=now() where id=v_eval.id;
    return jsonb_build_object('ok',false,'message','El enlace venció. Solicitá uno nuevo a CVStudio.');
  end if;
  select * into v_template from public.plantillas_evaluacion where id = v_eval.plantilla_id and activa = true;
  if not found then return jsonb_build_object('ok',false,'message','La plantilla ya no está disponible.'); end if;
  select coalesce(jsonb_agg(item - 'correct' - 'explanation'),'[]'::jsonb)
    into v_questions from jsonb_array_elements(v_template.preguntas) item;
  v_deadline := case when v_eval.iniciado_en is null then null else v_eval.iniciado_en + make_interval(mins => v_eval.duracion_minutos) end;
  return jsonb_build_object(
    'ok',true,
    'status',v_eval.estado,
    'title',v_template.titulo,
    'type',v_template.tipo,
    'first_name',split_part(trim(v_eval.cliente_nombre),' ',1),
    'role',v_eval.puesto_objetivo,
    'duration_minutes',v_eval.duracion_minutos,
    'deadline',v_deadline,
    'questions',case when v_eval.estado in ('Completada','Revisada') then '[]'::jsonb else v_questions end
  );
end;
$function$;

create or replace function public.iniciar_simulacro(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_eval public.evaluaciones_entrevista%rowtype;
begin
  select * into v_eval from public.evaluaciones_entrevista where token=p_token for update;
  if not found then return jsonb_build_object('ok',false,'message','El enlace no existe.'); end if;
  if v_eval.estado in ('Completada','Revisada') then return jsonb_build_object('ok',false,'message','El simulacro ya fue enviado.'); end if;
  if v_eval.estado not in ('Pendiente','Iniciada') then return jsonb_build_object('ok',false,'message','El simulacro no está disponible.'); end if;
  if v_eval.estado='Pendiente' and now()>v_eval.vence_en then
    update public.evaluaciones_entrevista set estado='Vencida',actualizado_en=now() where id=v_eval.id;
    return jsonb_build_object('ok',false,'message','El enlace venció.');
  end if;
  update public.evaluaciones_entrevista
    set iniciado_en=coalesce(iniciado_en,now()),estado='Iniciada',actualizado_en=now()
    where id=v_eval.id returning * into v_eval;
  return jsonb_build_object('ok',true,'status','Iniciada','deadline',v_eval.iniciado_en + make_interval(mins=>v_eval.duracion_minutos));
end;
$function$;

create or replace function public.entregar_simulacro(
  p_token uuid,
  p_respuestas jsonb,
  p_dificultad text,
  p_ansiedad text,
  p_comentario text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_eval public.evaluaciones_entrevista%rowtype;
  v_questions jsonb;
  v_question jsonb;
  v_answer text;
  v_score integer := 0;
  v_total integer := 0;
  v_elapsed integer;
begin
  if jsonb_typeof(p_respuestas) <> 'object' then return jsonb_build_object('ok',false,'message','Formato de respuestas inválido.'); end if;
  select * into v_eval from public.evaluaciones_entrevista where token=p_token for update;
  if not found then return jsonb_build_object('ok',false,'message','El enlace no existe.'); end if;
  if v_eval.estado in ('Completada','Revisada') then return jsonb_build_object('ok',false,'message','Las respuestas ya fueron enviadas.'); end if;
  if v_eval.estado <> 'Iniciada' or v_eval.iniciado_en is null then return jsonb_build_object('ok',false,'message','El simulacro todavía no fue iniciado.'); end if;
  select preguntas into v_questions from public.plantillas_evaluacion where id=v_eval.plantilla_id;
  for v_question in select value from jsonb_array_elements(v_questions) loop
    v_total := v_total + 1;
    v_answer := p_respuestas ->> (v_question ->> 'id');
    if v_answer is not null and v_answer = (v_question ->> 'correct') then v_score := v_score + 1; end if;
  end loop;
  v_elapsed := greatest(0,least(extract(epoch from (now()-v_eval.iniciado_en))::integer,v_eval.duracion_minutos*60+60));
  update public.evaluaciones_entrevista set
    respuestas=p_respuestas,
    puntaje_total=v_score,
    total_preguntas=v_total,
    tiempo_segundos=v_elapsed,
    dificultad_percibida=left(coalesce(p_dificultad,'No informado'),40),
    ansiedad_percibida=left(coalesce(p_ansiedad,'No informado'),40),
    comentario_participante=left(coalesce(p_comentario,''),800),
    finalizado_en=now(),
    estado='Completada',
    actualizado_en=now()
  where id=v_eval.id;
  return jsonb_build_object('ok',true,'status','Completada');
end;
$function$;

revoke all on function public.obtener_simulacro_publico(uuid) from public, anon, authenticated;
revoke all on function public.iniciar_simulacro(uuid) from public, anon, authenticated;
revoke all on function public.entregar_simulacro(uuid,jsonb,text,text,text) from public, anon, authenticated;
grant execute on function public.obtener_simulacro_publico(uuid) to anon, authenticated;
grant execute on function public.iniciar_simulacro(uuid) to anon, authenticated;
grant execute on function public.entregar_simulacro(uuid,jsonb,text,text,text) to anon, authenticated;

comment on table public.evaluaciones_entrevista is 'Invitaciones y resultados privados de simulacros de preparación laboral.';
comment on function public.obtener_simulacro_publico(uuid) is 'API pública intencional limitada por token UUID; nunca devuelve las claves correctas.';
