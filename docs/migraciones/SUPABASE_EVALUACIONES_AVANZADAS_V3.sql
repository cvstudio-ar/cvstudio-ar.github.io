-- CVStudio · Motor de evaluaciones avanzadas v3
-- Selección variable, snapshot del intento, crédito parcial y resultados por dimensión.

alter table public.plantillas_evaluacion
  add column if not exists sector text not null default 'General',
  add column if not exists nivel text not null default 'Intermedio',
  add column if not exists cantidad_preguntas integer not null default 18,
  add column if not exists version_contenido text not null default '1.0',
  add column if not exists competencias jsonb not null default '[]'::jsonb,
  add column if not exists fuentes jsonb not null default '[]'::jsonb;

alter table public.plantillas_evaluacion drop constraint if exists plantillas_evaluacion_cantidad_preguntas_check;
alter table public.plantillas_evaluacion add constraint plantillas_evaluacion_cantidad_preguntas_check
  check (cantidad_preguntas between 5 and 60);

alter table public.evaluaciones_entrevista
  add column if not exists cantidad_preguntas integer,
  add column if not exists preguntas_asignadas jsonb not null default '[]'::jsonb,
  add column if not exists puntaje_maximo integer,
  add column if not exists puntaje_detalle jsonb not null default '{}'::jsonb,
  add column if not exists version_plantilla text;

alter table public.evaluaciones_entrevista drop constraint if exists evaluaciones_entrevista_preguntas_asignadas_check;
alter table public.evaluaciones_entrevista add constraint evaluaciones_entrevista_preguntas_asignadas_check
  check (jsonb_typeof(preguntas_asignadas) = 'array');

update public.plantillas_evaluacion
set cantidad_preguntas = least(greatest(jsonb_array_length(preguntas), 5), 60)
where cantidad_preguntas is null or cantidad_preguntas > jsonb_array_length(preguntas);

update public.evaluaciones_entrevista e
set cantidad_preguntas = coalesce(e.cantidad_preguntas, p.cantidad_preguntas, jsonb_array_length(p.preguntas)),
    version_plantilla = coalesce(e.version_plantilla, p.version_contenido)
from public.plantillas_evaluacion p
where p.id = e.plantilla_id
  and (e.cantidad_preguntas is null or e.version_plantilla is null);

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.sanitizar_preguntas(p_preguntas jsonb)
returns jsonb
language sql
immutable
set search_path = ''
as $function$
  select coalesce(jsonb_agg(
    case
      when jsonb_typeof(q.item -> 'options') = 'array' then
        jsonb_set(
          q.item - 'correct' - 'explanation' - 'weight' - 'max_score' - 'rubric',
          '{options}',
          coalesce((select jsonb_agg(o.option - 'score' - 'feedback') from jsonb_array_elements(q.item -> 'options') o(option)), '[]'::jsonb),
          true
        )
      else q.item - 'correct' - 'explanation' - 'weight' - 'max_score' - 'rubric'
    end
  ), '[]'::jsonb)
  from jsonb_array_elements(coalesce(p_preguntas, '[]'::jsonb)) q(item);
$function$;

revoke all on function private.sanitizar_preguntas(jsonb) from public, anon, authenticated;

create or replace function public.obtener_simulacro_publico(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_eval public.evaluaciones_entrevista%rowtype;
  v_template public.plantillas_evaluacion%rowtype;
  v_deadline timestamptz;
  v_count integer;
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
  v_deadline := case when v_eval.iniciado_en is null then null else v_eval.iniciado_en + make_interval(mins => v_eval.duracion_minutos) end;
  v_count := least(coalesce(v_eval.cantidad_preguntas,v_template.cantidad_preguntas),jsonb_array_length(v_template.preguntas));
  return jsonb_build_object(
    'ok',true,
    'status',v_eval.estado,
    'title',v_template.titulo,
    'type',v_template.tipo,
    'sector',v_template.sector,
    'level',v_template.nivel,
    'first_name',split_part(trim(v_eval.cliente_nombre),' ',1),
    'role',v_eval.puesto_objetivo,
    'duration_minutes',v_eval.duracion_minutos,
    'question_count',v_count,
    'deadline',v_deadline,
    'questions',case
      when v_eval.estado in ('Completada','Revisada','Pendiente') then '[]'::jsonb
      else private.sanitizar_preguntas(v_eval.preguntas_asignadas)
    end
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
  v_template public.plantillas_evaluacion%rowtype;
  v_assigned jsonb;
  v_limit integer;
begin
  select * into v_eval from public.evaluaciones_entrevista where token=p_token for update;
  if not found then return jsonb_build_object('ok',false,'message','El enlace no existe.'); end if;
  if v_eval.estado in ('Completada','Revisada') then return jsonb_build_object('ok',false,'message','El simulacro ya fue enviado.'); end if;
  if v_eval.estado not in ('Pendiente','Iniciada') then return jsonb_build_object('ok',false,'message','El simulacro no está disponible.'); end if;
  if v_eval.estado='Pendiente' and now()>v_eval.vence_en then
    update public.evaluaciones_entrevista set estado='Vencida',actualizado_en=now() where id=v_eval.id;
    return jsonb_build_object('ok',false,'message','El enlace venció.');
  end if;
  select * into v_template from public.plantillas_evaluacion where id=v_eval.plantilla_id and activa=true;
  if not found then return jsonb_build_object('ok',false,'message','La plantilla ya no está disponible.'); end if;

  v_assigned := v_eval.preguntas_asignadas;
  if jsonb_array_length(v_assigned)=0 then
    v_limit := least(coalesce(v_eval.cantidad_preguntas,v_template.cantidad_preguntas),jsonb_array_length(v_template.preguntas));
    select coalesce(jsonb_agg(s.question order by s.rank),'[]'::jsonb) into v_assigned
    from (
      select q.item as question, md5(v_eval.token::text || ':' || coalesce(q.item->>'id','')) as rank
      from jsonb_array_elements(v_template.preguntas) q(item)
      order by rank
      limit v_limit
    ) s;
  end if;

  update public.evaluaciones_entrevista
  set iniciado_en=coalesce(iniciado_en,now()),
      estado='Iniciada',
      preguntas_asignadas=v_assigned,
      cantidad_preguntas=jsonb_array_length(v_assigned),
      version_plantilla=coalesce(version_plantilla,v_template.version_contenido),
      actualizado_en=now()
  where id=v_eval.id returning * into v_eval;

  return jsonb_build_object(
    'ok',true,
    'status','Iniciada',
    'deadline',v_eval.iniciado_en + make_interval(mins=>v_eval.duracion_minutos),
    'question_count',jsonb_array_length(v_assigned),
    'questions',private.sanitizar_preguntas(v_assigned)
  );
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
  v_option jsonb;
  v_answer text;
  v_dimension text;
  v_score integer := 0;
  v_max integer := 0;
  v_item_score integer;
  v_item_max integer;
  v_weight integer;
  v_elapsed integer;
  v_detail jsonb := '{}'::jsonb;
  v_dim_score integer;
  v_dim_max integer;
begin
  if jsonb_typeof(p_respuestas) <> 'object' or pg_column_size(p_respuestas) > 65536 then
    return jsonb_build_object('ok',false,'message','Formato o tamaño de respuestas inválido.');
  end if;
  select * into v_eval from public.evaluaciones_entrevista where token=p_token for update;
  if not found then return jsonb_build_object('ok',false,'message','El enlace no existe.'); end if;
  if v_eval.estado in ('Completada','Revisada') then return jsonb_build_object('ok',false,'message','Las respuestas ya fueron enviadas.'); end if;
  if v_eval.estado <> 'Iniciada' or v_eval.iniciado_en is null then return jsonb_build_object('ok',false,'message','El simulacro todavía no fue iniciado.'); end if;

  v_questions := v_eval.preguntas_asignadas;
  if jsonb_array_length(v_questions)=0 then
    select preguntas into v_questions from public.plantillas_evaluacion where id=v_eval.plantilla_id;
  end if;

  for v_question in select value from jsonb_array_elements(v_questions) loop
    v_answer := p_respuestas ->> (v_question ->> 'id');
    v_dimension := coalesce(v_question->>'dimension',v_question->>'category','General');
    v_weight := greatest(coalesce((v_question->>'weight')::integer,1),1);
    v_item_score := 0;
    v_item_max := 0;

    if coalesce(v_question->>'type','choice') <> 'text' then
      if exists(select 1 from jsonb_array_elements(coalesce(v_question->'options','[]'::jsonb)) o(option) where o.option ? 'score') then
        select coalesce(max((o.option->>'score')::integer),0) * v_weight into v_item_max
        from jsonb_array_elements(v_question->'options') o(option);
        select coalesce((o.option->>'score')::integer,0) * v_weight into v_item_score
        from jsonb_array_elements(v_question->'options') o(option) where o.option->>'value'=v_answer limit 1;
        v_item_score := coalesce(v_item_score,0);
      else
        v_item_max := v_weight;
        if v_answer is not null and v_answer=(v_question->>'correct') then v_item_score:=v_weight; end if;
      end if;
      v_score := v_score + v_item_score;
      v_max := v_max + v_item_max;
      v_dim_score := coalesce((v_detail->v_dimension->>'obtenido')::integer,0) + v_item_score;
      v_dim_max := coalesce((v_detail->v_dimension->>'maximo')::integer,0) + v_item_max;
      v_detail := jsonb_set(v_detail,array[v_dimension],jsonb_build_object('obtenido',v_dim_score,'maximo',v_dim_max),true);
    end if;
  end loop;

  v_elapsed := greatest(0,least(extract(epoch from (now()-v_eval.iniciado_en))::integer,v_eval.duracion_minutos*60+60));
  update public.evaluaciones_entrevista set
    respuestas=p_respuestas,
    puntaje_total=v_score,
    puntaje_maximo=v_max,
    puntaje_detalle=v_detail,
    total_preguntas=jsonb_array_length(v_questions),
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

comment on function public.obtener_simulacro_publico(uuid) is 'API limitada por token UUID. No expone claves, puntajes, rúbricas ni bancos antes de iniciar.';
