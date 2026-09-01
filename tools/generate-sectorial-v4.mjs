import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const sectors = [
  ['avanzado-administracion','sector-administracion','adm','Administración','trámites administrativos','validar un expediente','legajo de proveedor','autorización y documentación vigentes','un pago con vencimiento inmediato que requiere aprobación','un informe interno con cierre en el día','un cliente que no puede continuar sin una constancia','un archivo sin vencimiento que demanda pocos minutos','conciliar pagos','preparar documentación para una reunión','emitir un reporte de vencimientos','porcentaje de trámites observados','dos reportes administrativos del mismo período','responsable administrativo','exposición de datos o aprobación indebida','sistema de gestión documental','seguimiento de expedientes, responsables y vencimientos'],
  ['avanzado-atencion-cliente','sector-atencion','ate','Atención al cliente','casos de atención','resolver un reclamo','caso de cliente','identidad, motivo, evidencia y alcance de resolución','un reclamo con riesgo económico inmediato','una actualización interna pendiente','un cliente bloqueado por una respuesta contradictoria','una consulta informativa sin vencimiento','verificar un cobro duplicado','contactar a un cliente con seguimiento vencido','documentar la resolución de un caso','porcentaje de reclamos reabiertos','dos reportes de atención del mismo período','supervisor de atención','promesa incorrecta o pérdida de trazabilidad','sistema de tickets y canales de contacto','clasificación, seguimiento y cierre de reclamos'],
  ['avanzado-ventas','sector-ventas','ven','Comercial','oportunidades comerciales','calificar una oportunidad','ficha de prospecto','necesidad, alcance, margen y autorización comercial','una propuesta que vence hoy y requiere validación','un reporte comercial con cierre diario','un cliente que espera una aclaración para decidir','un contacto sin prioridad ni vencimiento','revisar una propuesta compleja','realizar un seguimiento comprometido','actualizar el pronóstico de ventas','tasa de conversión con margen sostenible','dos reportes comerciales del mismo período','responsable comercial','venta inadecuada o compromiso inviable','CRM y documentación de propuestas','seguimiento de oportunidades, compromisos y conversión'],
  ['avanzado-produccion','sector-produccion','ind','Industria','órdenes de producción','liberar un lote','registro de producción','medición, trazabilidad y liberación autorizada','un desvío de seguridad o calidad activo','un reporte de turno pendiente','una línea detenida por falta de validación','una mejora sin vencimiento inmediato','contener producto no conforme','verificar parámetros del proceso','cerrar el reporte de producción','porcentaje de unidades no conformes','dos reportes de producción del mismo turno','supervisor de producción','liberación indebida o pérdida de trazabilidad','línea, instrumentos y registros de proceso','control de desvíos, lotes y acciones correctivas'],
  ['avanzado-logistica','sector-logistica','log','Logística','movimientos de inventario','preparar un pedido','registro de inventario','cantidad, lote, ubicación y documentación','una diferencia de inventario que bloquea despachos','un reporte interno de movimientos','un pedido urgente detenido por una discrepancia','una ubicación de baja rotación sin vencimiento','reconciliar una diferencia de stock','organizar una recepción prioritaria','cerrar un control de picking','porcentaje de pedidos con error','dos reportes de inventario del mismo corte','responsable de depósito','despacho incorrecto o movimiento inseguro','sistema de inventario y equipos de movimiento','recepción, almacenamiento, picking y despacho'],
  ['avanzado-maestranza','sector-maestranza','mae','Maestranza','sectores de limpieza','acondicionar un área','planilla de limpieza','producto, dilución, EPP y señalización','un derrame o riesgo de exposición activo','una rutina programada del turno','un área de uso público que no puede habilitarse','una tarea estética sin urgencia','aislar y limpiar un derrame','higienizar un baño de alto tránsito','registrar la finalización de un sector','porcentaje de sectores con observaciones','dos planillas de limpieza del mismo turno','supervisor de maestranza','exposición química o contaminación cruzada','carro, productos, EPP y señalización','secuencia de limpieza y prevención de contaminación cruzada'],
  ['avanzado-gastronomia','sector-gastronomia','gas','Gastronomía','preparaciones alimentarias','elaborar una preparación','registro de elaboración','temperatura, tiempo, alérgenos y trazabilidad','un alimento fuera de temperatura segura','un control interno de producción','un pedido detenido por posible alérgeno','una tarea de orden sin impacto inmediato','contener una preparación dudosa','organizar la producción previa al servicio','completar el registro de elaboración','porcentaje de preparaciones rechazadas','dos registros de cocina del mismo servicio','responsable de cocina','enfermedad alimentaria o contaminación cruzada','equipos de cocción, frío y utensilios','recepción, conservación, elaboración y servicio seguro'],
  ['avanzado-salud','sector-salud','sal','Salud','atenciones asistenciales','preparar una práctica','registro del paciente','identidad, indicación, alergias y autorización','una discrepancia de identificación del paciente','un registro interno pendiente','una atención detenida por una indicación incompleta','una tarea administrativa sin urgencia','verificar una orden asistencial','comunicar un cambio clínico observado','completar un registro de atención','porcentaje de identificaciones observadas','dos registros asistenciales del mismo turno','profesional responsable','daño al paciente o vulneración de confidencialidad','sistema de registro y elementos asistenciales','identificación, comunicación, registro y escalamiento'],
  ['avanzado-seguridad','sector-seguridad','seg','Seguridad','eventos de vigilancia','verificar un ingreso','registro de acceso','identidad, autorización, horario y destino','un incidente activo con riesgo para personas','un parte interno con vencimiento diario','un ingreso bloqueado por falta de autorización','una consulta rutinaria sin urgencia','controlar un acceso excepcional','responder a una alarma','redactar un parte de novedades','porcentaje de accesos observados','dos partes de seguridad del mismo turno','supervisor de seguridad','ingreso no autorizado o escalamiento incorrecto','sistema de accesos, comunicaciones y CCTV','control de accesos, rondas, incidentes y partes'],
  ['avanzado-mantenimiento','sector-mantenimiento','man','Mantenimiento','órdenes de mantenimiento','intervenir un equipo','orden de trabajo','aislamiento de energías, diagnóstico y autorización','una condición insegura en un equipo','un cierre documental pendiente','una máquina detenida que bloquea producción','una mejora no crítica sin vencimiento','aislar una fuente de energía','diagnosticar una falla intermitente','documentar una intervención','porcentaje de fallas repetitivas','dos órdenes técnicas del mismo equipo','responsable de mantenimiento','lesión, daño de equipo o falla recurrente','instrumentos, herramientas y bloqueos','diagnóstico, intervención, prueba y liberación segura'],
  ['avanzado-construccion','sector-construccion','con','Construcción','tareas de obra','habilitar un trabajo','permiso de trabajo','riesgo, EPP, interferencias y autorización','una condición crítica de seguridad en obra','un avance diario pendiente','una cuadrilla detenida por permiso incompleto','una tarea de terminación sin urgencia','asegurar una excavación','coordinar una tarea simultánea','cerrar un permiso de trabajo','porcentaje de observaciones de seguridad','dos partes de obra del mismo frente','jefe de obra','accidente o interferencia entre tareas','herramientas, equipos y protecciones colectivas','planificación, permisos, interferencias y reinicio seguro'],
  ['avanzado-retail','sector-retail','ret','Retail','operaciones de caja y reposición','cerrar una operación de caja','registro de venta','precio, medio de pago, autorización y comprobante','una diferencia de caja o alerta de fraude','un reporte interno del turno','una fila detenida por discrepancia de precio','una reposición sin urgencia','conciliar una diferencia de caja','resolver una diferencia de precio','cerrar el inventario del turno','porcentaje de diferencias de caja','dos reportes de ventas del mismo turno','encargado del local','pérdida económica o acusación sin evidencia','sistema de caja, POS e inventario','caja, devoluciones, reposición y prevención de pérdidas'],
  ['avanzado-hoteleria','sector-hoteleria','hot','Hotelería','reservas y servicios a huéspedes','confirmar una reserva','ficha de huésped','identidad, reserva, tarifa y autorización','un incidente que afecta la seguridad de un huésped','un reporte interno del turno','un huésped sin habitación disponible pese a su comprobante','una consulta general sin urgencia','resolver una sobreventa','coordinar una solicitud urgente del huésped','cerrar el registro de novedades','porcentaje de reservas con discrepancias','dos reportes de ocupación del mismo día','responsable de recepción','afectación al huésped o exposición de datos','sistema de reservas y canales de recepción','reservas, privacidad, incidentes y continuidad del servicio'],
  ['avanzado-transporte','sector-transporte','tra','Transporte','servicios de transporte','habilitar un recorrido','hoja de ruta','vehículo, conductor, carga y documentación','una condición de fatiga o seguridad vial','un reporte interno de recorrido','una entrega detenida por carga insegura','una gestión administrativa sin urgencia','verificar la sujeción de una carga','replanificar una entrega','cerrar el parte de recorrido','porcentaje de entregas con incidentes','dos hojas de ruta del mismo servicio','responsable de tráfico','siniestro, pérdida de carga o incumplimiento de descanso','vehículo, elementos de sujeción y documentación','planificación, descanso, carga y reporte de incidentes'],
  ['avanzado-rrhh','sector-rrhh','rrh','Recursos Humanos','procesos de personas','gestionar una postulación','legajo de personal','identidad, autorización, pertinencia y confidencialidad','una denuncia o riesgo para una persona','un reporte interno con cierre diario','una incorporación detenida por documentación crítica','una consulta general sin vencimiento','verificar documentación de ingreso','abordar un conflicto informado','actualizar un legajo','porcentaje de legajos incompletos','dos reportes de dotación del mismo período','responsable de Recursos Humanos','discriminación, exposición de datos o decisión sin evidencia','sistema de RR. HH. y legajos','selección, confidencialidad, conflictos y trazabilidad'],
  ['avanzado-liderazgo','sector-liderazgo','lid','Liderazgo','decisiones de supervisión','delegar una tarea crítica','registro de desempeño','objetivo, capacidad, riesgo y seguimiento','una condición de seguridad que exige decisión inmediata','un reporte de gestión con cierre diario','un integrante bloqueado por prioridades contradictorias','una mejora sin vencimiento inmediato','redistribuir una carga crítica','dar seguimiento a una delegación','documentar una decisión de desempeño','porcentaje de compromisos incumplidos','dos reportes de desempeño del mismo equipo','responsable de área','daño al equipo, ocultamiento o decisión insegura','tablero de gestión y canales del equipo','delegación, desempeño, riesgo y aprendizaje del equipo'],
  ['avanzado-it','sector-it','it','Tecnología','incidentes y solicitudes técnicas','resolver un incidente','ticket de soporte','identidad, alcance, evidencia y autorización','un incidente de seguridad activo','un reporte técnico con cierre diario','un usuario crítico bloqueado por permisos','una mejora cosmética sin urgencia','contener una cuenta comprometida','diagnosticar una falla intermitente','cerrar un ticket técnico','porcentaje de incidentes reabiertos','dos reportes técnicos del mismo período','responsable de tecnología','pérdida de datos, acceso indebido o interrupción','sistemas, registros y herramientas de diagnóstico','diagnóstico, acceso, contención y comunicación técnica'],
  ['avanzado-finanzas','sector-finanzas','fin','Finanzas','operaciones financieras','autorizar un pago','registro contable','importe, beneficiario, respaldo y aprobación','un posible fraude o pago duplicado','un reporte financiero con cierre diario','un proveedor bloqueado por discrepancia de pago','una clasificación sin vencimiento','conciliar una transferencia','investigar un pago duplicado','cerrar una conciliación','porcentaje de partidas sin conciliar','dos reportes financieros del mismo período','responsable financiero','pérdida económica o alteración de registros','sistema contable y documentación bancaria','conciliación, segregación, evidencia y autorización']
];

const sqlQuote = value => `'${String(value).replaceAll("'", "''")}'`;
const rows = sectors.map(row => `(${row.map(sqlQuote).join(',')})`).join(',\n');

const migration = `-- CVStudio · Bancos sectoriales completos v4
-- Generado por tools/generate-sectorial-v4.mjs. No editar manualmente.
-- 18 plantillas × 22 consignas propias del sector; intento balanceado de 18.

begin;

create temporary table tmp_cvstudio_sector_config(
  template_slug text primary key, module_slug text not null, code text not null, sector text not null,
  units text not null, process_action text not null, record_name text not null, critical_control text not null,
  urgent_a text not null, urgent_b text not null, blocker_c text not null, low_d text not null,
  task_p text not null, task_q text not null, task_r text not null, indicator text not null,
  report_pair text not null, stakeholder text not null, risk text not null, equipment text not null,
  improvement_process text not null
) on commit drop;

insert into tmp_cvstudio_sector_config values
${rows};

with generated as (
  select c.template_slug,c.module_slug,c.sector,
    jsonb_build_array(
      jsonb_build_object('id',c.code||'-a1','module',c.module_slug,'sector',c.sector,'kind','analysis','dimension','Análisis aplicado','difficulty','alta','context','En '||c.sector||' se procesaron 420 '||c.units||': 168 en el turno A, 147 en el B y el resto en el C. Se detectaron 4, 3 y 5 incidencias respectivamente.','text','¿Qué turno tuvo la mayor tasa de incidencias?','options',jsonb_build_array(jsonb_build_object('value','A','label','Turno A'),jsonb_build_object('value','B','label','Turno B'),jsonb_build_object('value','C','label','Turno C'),jsonb_build_object('value','D','label','A y C empatan')),'correct','C','explanation','El turno C procesó 105 casos y registró la mayor tasa: 5 sobre 105.'),
      jsonb_build_object('id',c.code||'-a2','module',c.module_slug,'sector',c.sector,'kind','analysis','dimension','Eficiencia operativa','difficulty','alta','context','La tarea de '||c.process_action||' demanda 12 minutos. Una mejora reduce el tiempo 15%, pero agrega un control final de 90 segundos.','text','¿Cuál es el nuevo tiempo total por tarea?','options',jsonb_build_array(jsonb_build_object('value','A','label','9 min 42 s'),jsonb_build_object('value','B','label','10 min 12 s'),jsonb_build_object('value','C','label','11 min 42 s'),jsonb_build_object('value','D','label','12 min 30 s')),'correct','C'),
      jsonb_build_object('id',c.code||'-a3','module',c.module_slug,'sector',c.sector,'kind','analysis','dimension','Planificación sectorial','difficulty','alta','context','Hay 7 horas útiles. Las tareas de '||c.task_p||', '||c.task_q||' y '||c.task_r||' duran 110, 85 y 70 minutos. La primera debe hacerse antes que la tercera. Además hay dos controles de 35 minutos y una reserva de 40 minutos.','text','¿Qué afirmación es correcta?','options',jsonb_build_array(jsonb_build_object('value','A','label','No entran todas las tareas'),jsonb_build_object('value','B','label','Entran y quedan 35 minutos'),jsonb_build_object('value','C','label','Entran y quedan 45 minutos'),jsonb_build_object('value','D','label','Solo entran invirtiendo la precedencia')),'correct','C'),
      jsonb_build_object('id',c.code||'-a4','module',c.module_slug,'sector',c.sector,'kind','analysis','dimension','Inferencia sectorial','difficulty','alta','context','En el proceso de '||c.process_action||', todo '||c.record_name||' validado posee '||c.critical_control||'. Algunos registros que poseen ese control todavía no fueron auditados. El registro K fue validado.','text','¿Qué conclusión es necesariamente válida?','options',jsonb_build_array(jsonb_build_object('value','A','label','K ya fue auditado'),jsonb_build_object('value','B','label','K posee '||c.critical_control),jsonb_build_object('value','C','label','K no presenta ningún error'),jsonb_build_object('value','D','label','K es uno de los registros no auditados')),'correct','B'),
      jsonb_build_object('id',c.code||'-a5','module',c.module_slug,'sector',c.sector,'kind','analysis','dimension','Indicadores del sector','difficulty','media-alta','context','El '||c.indicator||' pasa de 8% a 6% con volumen estable.','text','¿Cómo debe describirse correctamente el cambio?','options',jsonb_build_array(jsonb_build_object('value','A','label','Bajó 2%'),jsonb_build_object('value','B','label','Bajó 2 puntos porcentuales y 25% en términos relativos'),jsonb_build_object('value','C','label','Bajó 25 puntos porcentuales'),jsonb_build_object('value','D','label','Mejoró 75%')),'correct','B'),
      jsonb_build_object('id',c.code||'-a6','module',c.module_slug,'sector',c.sector,'kind','analysis','dimension','Consistencia de información','difficulty','alta','context','Existen '||c.report_pair||' con totales diferentes. Uno se exportó a las 10:00 y otro a las 15:00; el sistema admite actualizaciones retroactivas.','text','¿Cuál es el primer paso más sólido?','options',jsonb_build_array(jsonb_build_object('value','A','label','Usar el total mayor'),jsonb_build_object('value','B','label','Promediar ambos'),jsonb_build_object('value','C','label','Verificar corte, filtros, versión y movimientos incorporados'),jsonb_build_object('value','D','label','Descartar ambos reportes')),'correct','C'),
      jsonb_build_object('id',c.code||'-t1','module',c.module_slug,'sector',c.sector,'kind','attention','dimension','Seguimiento de instrucciones','difficulty','alta','context','Regla para '||c.record_name||': si el código comienza con R y termina en número par va a Revisión; si contiene X va a Excepción, aun cuando cumpla la primera regla.','text','¿Dónde se clasifica R-31X-8?','options',jsonb_build_array(jsonb_build_object('value','A','label','Revisión'),jsonb_build_object('value','B','label','Excepción'),jsonb_build_object('value','C','label','Archivo'),jsonb_build_object('value','D','label','No puede determinarse')),'correct','B'),
      jsonb_build_object('id',c.code||'-t2','module',c.module_slug,'sector',c.sector,'kind','attention','dimension','Precisión documental','difficulty','alta','context','Durante el control de '||c.record_name||' debés comparar identificadores sin alterar caracteres.','text','Seleccioná la única cadena idéntica a AR7-09I1-BQ5; la tercera posición es 7 y la sexta es la letra I.','options',jsonb_build_array(jsonb_build_object('value','A','label','AR7-09I1-BQ5'),jsonb_build_object('value','B','label','AR7-0911-BQ5'),jsonb_build_object('value','C','label','A7R-09I1-BQ5'),jsonb_build_object('value','D','label','AR7-09I1-8Q5')),'correct','A'),
      jsonb_build_object('id',c.code||'-t3','module',c.module_slug,'sector',c.sector,'kind','attention','dimension','Control crítico','difficulty','alta','context','Antes de '||c.process_action||' se exige comprobar '||c.critical_control||'. El registro cumple todos los requisitos salvo uno, que está vencido o sin verificar.','text','¿Qué estado corresponde?','options',jsonb_build_array(jsonb_build_object('value','A','label','Aprobado porque la mayoría coincide'),jsonb_build_object('value','B','label','Pendiente; no se continúa hasta regularizar el control'),jsonb_build_object('value','C','label','Aprobado con una nota informal'),jsonb_build_object('value','D','label','Eliminado sin dejar trazabilidad')),'correct','B'),
      jsonb_build_object('id',c.code||'-t4','module',c.module_slug,'sector',c.sector,'kind','attention','dimension','Priorización operativa','difficulty','alta','context','A: '||c.urgent_a||'. B: '||c.urgent_b||'. C: '||c.blocker_c||'. D: '||c.low_d||'.','text','Sin otra información, ¿qué orden inicial es más defendible?','options',jsonb_build_array(jsonb_build_object('value','A','label','D, B, C, A'),jsonb_build_object('value','B','label','A, C, B, D'),jsonb_build_object('value','C','label','B, D, A, C'),jsonb_build_object('value','D','label','C, A, D, B')),'correct','B'),
      jsonb_build_object('id',c.code||'-t5','module',c.module_slug,'sector',c.sector,'kind','attention','dimension','Trazabilidad','difficulty','media-alta','context','Detectás un dato incorrecto en '||c.record_name||' que ya fue utilizado por otra persona durante '||c.process_action||'.','text','¿Cuál es la respuesta más completa?','options',jsonb_build_array(jsonb_build_object('value','A','label','Sobrescribirlo y no informar'),jsonb_build_object('value','B','label','Crear otro registro sin relacionarlos'),jsonb_build_object('value','C','label','Corregir según procedimiento, conservar trazabilidad y avisar a quienes pudieron verse afectados'),jsonb_build_object('value','D','label','Esperar a que alguien más lo encuentre')),'correct','C'),
      jsonb_build_object('id',c.code||'-t6','module',c.module_slug,'sector',c.sector,'kind','attention','dimension','Frecuencia de control','difficulty','alta','context','Durante '||c.process_action||' se toma un control inicial y luego uno cada 45 minutos mientras el proceso está activo. La actividad se desarrolló de 08:10 a 11:20 sin interrupciones.','text','¿Cuántos controles correspondían?','options',jsonb_build_array(jsonb_build_object('value','A','label','4'),jsonb_build_object('value','B','label','5'),jsonb_build_object('value','C','label','6'),jsonb_build_object('value','D','label','7')),'correct','B'),
      jsonb_build_object('id',c.code||'-s1','module',c.module_slug,'sector',c.sector,'kind','situational','dimension','Criterio profesional','difficulty','alta','context',c.stakeholder||' solicita acelerar la tarea de '||c.process_action||'. Detectás que falta '||c.critical_control||' y omitirlo puede causar '||c.risk||'.','text','¿Qué respuesta muestra mejor criterio?','options',jsonb_build_array(jsonb_build_object('value','A','label','Continuar para cumplir el horario','score',0),jsonb_build_object('value','B','label','Negarse sin explicar ni proponer alternativas','score',1),jsonb_build_object('value','C','label','Explicar el riesgo, contener la tarea y acordar una alternativa segura y trazable','score',3),jsonb_build_object('value','D','label','Completar la tarea y avisar únicamente si ocurre un problema','score',0))),
      jsonb_build_object('id',c.code||'-s2','module',c.module_slug,'sector',c.sector,'kind','situational','dimension','Trabajo en equipo','difficulty','alta','context','Un compañero experimentado propone un atajo habitual para '||c.process_action||' que contradice el procedimiento vigente. Hasta ahora no hubo incidentes.','text','¿Cómo actuás?','options',jsonb_build_array(jsonb_build_object('value','A','label','Aceptar por su experiencia','score',0),jsonb_build_object('value','B','label','Revisar el procedimiento con él y resolver la diferencia antes de continuar','score',3),jsonb_build_object('value','C','label','Denunciarlo sin conversar','score',1),jsonb_build_object('value','D','label','Aplicarlo una vez y documentarlo después','score',1))),
      jsonb_build_object('id',c.code||'-s3','module',c.module_slug,'sector',c.sector,'kind','situational','dimension','Comunicación sectorial','difficulty','alta','context','Recibís instrucciones incompatibles de dos referentes sobre '||c.process_action||'. El plazo es corto y la decisión puede afectar '||c.risk||'.','text','¿Cuál es la intervención más profesional?','options',jsonb_build_array(jsonb_build_object('value','A','label','Elegir una instrucción sin informar','score',0),jsonb_build_object('value','B','label','Intentar cumplir parcialmente ambas','score',1),jsonb_build_object('value','C','label','Exponer la contradicción, el impacto y solicitar una prioridad explícita dejando registro','score',3),jsonb_build_object('value','D','label','Esperar hasta que el plazo venza','score',0))),
      jsonb_build_object('id',c.code||'-o1','module',c.module_slug,'sector',c.sector,'kind','open','dimension','Entrevista sectorial','difficulty','alta','type','text','text','Relatá una situación real en '||c.sector||' en la que tuviste que priorizar tareas bajo presión. Explicá contexto, criterio, acciones, resultado y aprendizaje.','rubric',jsonb_build_array('Contexto sectorial','Criterio de prioridad','Acciones propias','Resultado','Aprendizaje')),
      jsonb_build_object('id',c.code||'-o2','module',c.module_slug,'sector',c.sector,'kind','open','dimension','Responsabilidad profesional','difficulty','alta','type','text','text','Describí un error o desvío relacionado con '||c.process_action||'. ¿Cómo lo detectaste, comunicaste, corregiste y qué prevención aplicaste?','rubric',jsonb_build_array('Responsabilidad','Comunicación','Corrección','Prevención')),
      jsonb_build_object('id',c.code||'-o3','module',c.module_slug,'sector',c.sector,'kind','open','dimension','Mejora del proceso','difficulty','alta','type','text','text','Diseñá una mejora para '||c.improvement_process||' utilizando '||c.equipment||'. Incluí diagnóstico, pasos, responsables, control y una métrica de resultado.','rubric',jsonb_build_array('Diagnóstico','Aplicación sectorial','Controles','Responsables','Métrica'))
    ) as generated_questions
  from tmp_cvstudio_sector_config c
), existing_sector as (
  select c.template_slug,
    coalesce(jsonb_agg(
      case when q.item->>'type'='text' then
        jsonb_set(jsonb_set(jsonb_set(q.item,'{kind}',to_jsonb('open'::text),true),'{sector}',to_jsonb(c.sector),true),'{rubric}',coalesce(q.item->'rubric',jsonb_build_array('Comprensión del caso','Procedimiento','Comunicación','Prevención')),true)
      else jsonb_set(jsonb_set(q.item,'{kind}',to_jsonb('situational'::text),true),'{sector}',to_jsonb(c.sector),true)
      end order by q.ord
    ),'[]'::jsonb) as sector_questions
  from tmp_cvstudio_sector_config c
  join public.modulos_evaluacion m on m.slug=c.module_slug and m.activo=true
  cross join lateral jsonb_array_elements(m.preguntas) with ordinality q(item,ord)
  group by c.template_slug
), banks as (
  select g.template_slug,g.generated_questions||e.sector_questions as questions
  from generated g join existing_sector e using(template_slug)
)
update public.plantillas_evaluacion p
set preguntas=b.questions,cantidad_preguntas=18,version_contenido='4.0',nivel='Avanzado sectorial',actualizado_en=now()
from banks b where p.slug=b.template_slug;

create or replace function private.seleccionar_preguntas_sectoriales(
  p_preguntas jsonb,p_token uuid,p_cantidad integer,p_previas jsonb default '[]'::jsonb
) returns jsonb language sql immutable set search_path='' as \$function\$
  with items as (
    select q.item,
      coalesce(q.item->>'kind','other') kind,
      exists(select 1 from jsonb_array_elements(coalesce(p_previas,'[]'::jsonb)) x where x->>'id'=q.item->>'id') used,
      md5(p_token::text||':'||coalesce(q.item->>'id','')) rank
    from jsonb_array_elements(coalesce(p_preguntas,'[]'::jsonb)) q(item)
  ), quotas(kind,amount) as (values ('analysis',5),('attention',5),('situational',5),('open',3)),
  selected as (
    select i.item,i.rank from quotas q cross join lateral (
      select * from items where items.kind=q.kind order by used,rank limit q.amount
    ) i
  ), fallback as (
    select i.item,i.rank from items i
    where not exists(select 1 from selected s where s.item->>'id'=i.item->>'id')
    order by i.used,i.rank limit greatest(p_cantidad-(select count(*) from selected),0)
  ), final as (select * from selected union all select * from fallback)
  select coalesce(jsonb_agg(item order by md5(p_token::text||':order:'||coalesce(item->>'id',''))),'[]'::jsonb)
  from (select * from final limit p_cantidad) x;
\$function\$;

revoke all on function private.seleccionar_preguntas_sectoriales(jsonb,uuid,integer,jsonb) from public,anon,authenticated;

create or replace function public.iniciar_simulacro(p_token uuid)
returns jsonb language plpgsql security definer set search_path='' as \$function\$
declare
  v_eval public.evaluaciones_entrevista%rowtype;
  v_template public.plantillas_evaluacion%rowtype;
  v_assigned jsonb;
  v_previous jsonb := '[]'::jsonb;
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
  v_assigned:=v_eval.preguntas_asignadas;
  if jsonb_array_length(v_assigned)=0 then
    v_limit:=least(coalesce(v_eval.cantidad_preguntas,v_template.cantidad_preguntas),jsonb_array_length(v_template.preguntas));
    if coalesce(v_eval.numero_intento,1)>1 and v_eval.intento_origen is not null then
      select e.preguntas_asignadas into v_previous from public.evaluaciones_entrevista e
      where (e.id=v_eval.intento_origen or e.intento_origen=v_eval.intento_origen)
        and e.numero_intento<v_eval.numero_intento and jsonb_array_length(e.preguntas_asignadas)>0
      order by e.numero_intento desc limit 1;
      v_previous:=coalesce(v_previous,'[]'::jsonb);
    end if;
    if v_template.version_contenido='4.0' then
      v_assigned:=private.seleccionar_preguntas_sectoriales(v_template.preguntas,v_eval.token,v_limit,v_previous);
    else
      select coalesce(jsonb_agg(s.question order by s.rank),'[]'::jsonb) into v_assigned from (
        select q.item question,md5(v_eval.token::text||':'||coalesce(q.item->>'id','')) rank
        from jsonb_array_elements(v_template.preguntas) q(item) order by rank limit v_limit
      ) s;
    end if;
  end if;
  update public.evaluaciones_entrevista set iniciado_en=coalesce(iniciado_en,now()),estado='Iniciada',
    preguntas_asignadas=v_assigned,cantidad_preguntas=jsonb_array_length(v_assigned),
    version_plantilla=coalesce(version_plantilla,v_template.version_contenido),actualizado_en=now()
  where id=v_eval.id returning * into v_eval;
  return jsonb_build_object('ok',true,'status','Iniciada','deadline',v_eval.iniciado_en+make_interval(mins=>v_eval.duracion_minutos),
    'question_count',jsonb_array_length(v_assigned),'questions',private.sanitizar_preguntas(v_assigned));
end; \$function\$;

revoke all on function public.iniciar_simulacro(uuid) from public,anon,authenticated;
grant execute on function public.iniciar_simulacro(uuid) to anon,authenticated;

do \$validation\$
declare bad integer;
begin
  select count(*) into bad from public.plantillas_evaluacion p
  where p.slug like 'avanzado-%' and p.activa and (
    p.version_contenido<>'4.0' or jsonb_array_length(p.preguntas)<>22 or p.cantidad_preguntas<>18
    or (select count(distinct q->>'id') from jsonb_array_elements(p.preguntas) q)<>22
    or (select count(*) from jsonb_array_elements(p.preguntas) q where q->>'kind'='analysis')<>6
    or (select count(*) from jsonb_array_elements(p.preguntas) q where q->>'kind'='attention')<>6
    or (select count(*) from jsonb_array_elements(p.preguntas) q where q->>'kind'='situational')<>6
    or (select count(*) from jsonb_array_elements(p.preguntas) q where q->>'kind'='open')<>4
    or exists(select 1 from jsonb_array_elements(p.preguntas) q where q->>'sector'<>p.sector or q->>'module' in ('razonamiento-datos','atencion-instrucciones','criterio-entrevista'))
  );
  if bad<>0 then raise exception 'Validación sectorial fallida en % plantilla(s)',bad; end if;
  if (select count(*) from public.plantillas_evaluacion where activa and slug like 'avanzado-%' and version_contenido='4.0')<>18 then
    raise exception 'No se actualizaron las 18 plantillas avanzadas';
  end if;
end \$validation\$;

comment on function private.seleccionar_preguntas_sectoriales(jsonb,uuid,integer,jsonb) is 'Selección balanceada 5 análisis, 5 atención, 5 situacionales y 3 abiertas; prioriza preguntas no vistas.';

commit;
`;

const output = resolve('docs/migraciones/SUPABASE_BANCOS_SECTORIALES_V4.sql');
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, migration, 'utf8');
console.log(output);
