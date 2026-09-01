-- CVStudio · Catálogo genérico de simulacros v2
-- Habilita las dos cuentas de Dirección y agrega plantillas por perfil.

drop policy if exists "Dirección administra plantillas de evaluación" on public.plantillas_evaluacion;
create policy "Dirección administra plantillas de evaluación"
on public.plantillas_evaluacion for all to authenticated
using ((select auth.uid()) in (
  '3a8b4d50-305a-4da5-9fde-64bd2c8ed68d'::uuid,
  '6a608be9-da9f-4fb6-941c-4a14ac62a865'::uuid
))
with check ((select auth.uid()) in (
  '3a8b4d50-305a-4da5-9fde-64bd2c8ed68d'::uuid,
  '6a608be9-da9f-4fb6-941c-4a14ac62a865'::uuid
));

drop policy if exists "Dirección administra evaluaciones" on public.evaluaciones_entrevista;
create policy "Dirección administra evaluaciones"
on public.evaluaciones_entrevista for all to authenticated
using ((select auth.uid()) in (
  '3a8b4d50-305a-4da5-9fde-64bd2c8ed68d'::uuid,
  '6a608be9-da9f-4fb6-941c-4a14ac62a865'::uuid
))
with check ((select auth.uid()) in (
  '3a8b4d50-305a-4da5-9fde-64bd2c8ed68d'::uuid,
  '6a608be9-da9f-4fb6-941c-4a14ac62a865'::uuid
));

update public.plantillas_evaluacion set
  titulo='Aptitud lógica, atención y precisión',
  tipo='Aptitud general',
  descripcion='Series, cálculo, comprensión, atención y criterio laboral.',
  actualizado_en=now()
where slug='logica-atencion-calidad-20';

insert into public.plantillas_evaluacion (slug,titulo,tipo,descripcion,duracion_minutos,preguntas)
values
('calidad-produccion-15','Calidad y producción','Perfil técnico','Control de procesos, seguridad, calidad, prioridades y resolución de desvíos.',20,$q$[
{"id":"cp1","category":"Calidad","text":"Una medición queda fuera de tolerancia. ¿Cuál es la primera acción adecuada?","options":[{"value":"A","label":"Modificar el registro"},{"value":"B","label":"Aislar el producto y verificar el método de medición"},{"value":"C","label":"Continuar la producción"},{"value":"D","label":"Descartar todo el lote"}],"correct":"B"},
{"id":"cp2","category":"Seguridad","text":"Detectás una condición insegura durante una tarea. ¿Qué hacés?","options":[{"value":"A","label":"La ignorás si falta poco para terminar"},{"value":"B","label":"Esperás al cambio de turno"},{"value":"C","label":"Detenés la tarea, señalizás y comunicás según el procedimiento"},{"value":"D","label":"La corregís sin informar"}],"correct":"C"},
{"id":"cp3","category":"Cálculo","text":"Una línea produce 480 unidades en 8 horas. ¿Cuál es el promedio por hora?","options":[{"value":"A","label":"50"},{"value":"B","label":"55"},{"value":"C","label":"60"},{"value":"D","label":"65"}],"correct":"C"},
{"id":"cp4","category":"Cálculo","text":"De 250 piezas, 10 resultan defectuosas. ¿Cuál es el porcentaje de defecto?","options":[{"value":"A","label":"2%"},{"value":"B","label":"4%"},{"value":"C","label":"5%"},{"value":"D","label":"10%"}],"correct":"B"},
{"id":"cp5","category":"Procesos","text":"¿Qué secuencia es más adecuada ante un desvío?","options":[{"value":"A","label":"Registrar, contener, analizar y corregir"},{"value":"B","label":"Corregir, ocultar y continuar"},{"value":"C","label":"Descartar y cerrar"},{"value":"D","label":"Esperar, registrar y olvidar"}],"correct":"A"},
{"id":"cp6","category":"Atención","text":"Seleccioná el código exactamente igual a LT-3908-QA.","options":[{"value":"A","label":"LT-3980-QA"},{"value":"B","label":"LT-3908-OA"},{"value":"C","label":"LT-3908-QA"},{"value":"D","label":"LT-390B-QA"}],"correct":"C"},
{"id":"cp7","category":"Prioridades","text":"Recibís dos tareas urgentes y no podés completarlas al mismo tiempo. ¿Cómo actuás?","options":[{"value":"A","label":"Elegís la más fácil"},{"value":"B","label":"Priorizás por riesgo e impacto y comunicás la capacidad"},{"value":"C","label":"Hacés ambas más rápido aunque haya errores"},{"value":"D","label":"Esperás sin informar"}],"correct":"B"},
{"id":"cp8","category":"Trazabilidad","text":"¿Por qué es importante registrar lote, fecha y resultado de inspección?","options":[{"value":"A","label":"Para completar espacio en la planilla"},{"value":"B","label":"Para asegurar trazabilidad y facilitar el análisis"},{"value":"C","label":"Solo para calcular horas"},{"value":"D","label":"No es necesario si el producto está bien"}],"correct":"B"},
{"id":"cp9","category":"Trabajo en equipo","text":"Un operario cuestiona una observación de calidad. ¿Cuál es la mejor respuesta?","options":[{"value":"A","label":"Imponer la decisión"},{"value":"B","label":"Escuchar, revisar evidencia y explicar el criterio"},{"value":"C","label":"Evitar el tema"},{"value":"D","label":"Sancionarlo inmediatamente"}],"correct":"B"},
{"id":"cp10","category":"Mejora continua","text":"Un mismo defecto se repite varias veces. ¿Qué corresponde?","options":[{"value":"A","label":"Seguir corrigiendo cada pieza sin investigar"},{"value":"B","label":"Analizar la causa raíz y definir una acción preventiva"},{"value":"C","label":"Cambiar el nombre del defecto"},{"value":"D","label":"Aumentar la tolerancia"}],"correct":"B"},
{"id":"cp11","category":"Comprensión","text":"Una instrucción indica verificar cada 30 minutos. En un turno de 6 horas, ¿cuántas verificaciones corresponden si se incluye la inicial?","options":[{"value":"A","label":"6"},{"value":"B","label":"10"},{"value":"C","label":"12"},{"value":"D","label":"13"}],"correct":"D"},
{"id":"cp12","category":"Criterio","text":"Falta una firma en un registro ya completado. ¿Qué hacés?","options":[{"value":"A","label":"Firmás por otra persona"},{"value":"B","label":"Lo descartás"},{"value":"C","label":"Solicitás la validación correspondiente sin alterar la trazabilidad"},{"value":"D","label":"Lo archivás igual"}],"correct":"C"},
{"id":"cp13","category":"Series","text":"¿Qué número continúa: 6, 12, 24, 48…?","options":[{"value":"A","label":"72"},{"value":"B","label":"84"},{"value":"C","label":"96"},{"value":"D","label":"108"}],"correct":"C"},
{"id":"cp14","category":"Comunicación","text":"Al informar un desvío, ¿qué información es más útil?","options":[{"value":"A","label":"Solo una opinión personal"},{"value":"B","label":"Hechos, evidencia, alcance y acción de contención"},{"value":"C","label":"El nombre de un posible responsable"},{"value":"D","label":"Únicamente la hora"}],"correct":"B"},
{"id":"cp15","category":"Responsabilidad","text":"Advertís que cometiste un error de registro. ¿Qué hacés?","options":[{"value":"A","label":"Lo ocultás"},{"value":"B","label":"Lo corregís según el procedimiento y comunicás el cambio"},{"value":"C","label":"Eliminás toda la planilla"},{"value":"D","label":"Esperás que alguien lo note"}],"correct":"B"}
]$q$::jsonb),
('administracion-atencion-15','Administración y atención al cliente','Perfil administrativo','Organización, datos, comunicación, cálculos y resolución de situaciones con clientes.',20,$q$[
{"id":"aa1","category":"Organización","text":"Recibís un correo urgente, un cliente esperando y una tarea con vencimiento próximo. ¿Qué hacés primero?","options":[{"value":"A","label":"Respondés según urgencia e impacto y comunicás los tiempos"},{"value":"B","label":"Elegís lo más sencillo"},{"value":"C","label":"Ignorás al cliente"},{"value":"D","label":"Esperás nuevas instrucciones"}],"correct":"A"},
{"id":"aa2","category":"Cálculo","text":"Una factura de $80.000 tiene un descuento del 10%. ¿Cuál es el total?","options":[{"value":"A","label":"$70.000"},{"value":"B","label":"$72.000"},{"value":"C","label":"$74.000"},{"value":"D","label":"$78.000"}],"correct":"B"},
{"id":"aa3","category":"Atención","text":"Seleccioná el número de comprobante exactamente igual a 0048-739152.","options":[{"value":"A","label":"0048-739125"},{"value":"B","label":"004B-739152"},{"value":"C","label":"0048-739152"},{"value":"D","label":"0048-793152"}],"correct":"C"},
{"id":"aa4","category":"Cliente","text":"Un cliente reclama por una demora. ¿Cuál es la respuesta más adecuada?","options":[{"value":"A","label":"Interrumpirlo para explicar"},{"value":"B","label":"Escuchar, verificar el caso, reconocer la situación y ofrecer un próximo paso"},{"value":"C","label":"Derivarlo sin explicación"},{"value":"D","label":"Decirle que espere"}],"correct":"B"},
{"id":"aa5","category":"Datos","text":"Detectás dos fichas del mismo cliente con teléfonos diferentes. ¿Qué hacés?","options":[{"value":"A","label":"Elegís uno al azar"},{"value":"B","label":"Eliminás ambas"},{"value":"C","label":"Verificás la fuente y actualizás conservando trazabilidad"},{"value":"D","label":"No modificás nada"}],"correct":"C"},
{"id":"aa6","category":"Redacción","text":"¿Cuál es el asunto de correo más claro?","options":[{"value":"A","label":"Hola"},{"value":"B","label":"Importante"},{"value":"C","label":"Documentación pendiente · Solicitud 1842"},{"value":"D","label":"Consulta"}],"correct":"C"},
{"id":"aa7","category":"Cálculo","text":"Se registraron 36 solicitudes el lunes y 44 el martes. ¿Cuántas se registraron en total?","options":[{"value":"A","label":"70"},{"value":"B","label":"78"},{"value":"C","label":"80"},{"value":"D","label":"82"}],"correct":"C"},
{"id":"aa8","category":"Confidencialidad","text":"Una persona solicita datos de un cliente sin autorización. ¿Qué corresponde?","options":[{"value":"A","label":"Compartirlos si parece confiable"},{"value":"B","label":"Verificar identidad y permisos antes de brindar información"},{"value":"C","label":"Enviar solo una parte"},{"value":"D","label":"Publicarlos en un grupo interno"}],"correct":"B"},
{"id":"aa9","category":"Agenda","text":"Dos reuniones fueron programadas a la misma hora. ¿Cómo lo resolvés?","options":[{"value":"A","label":"No asistís a ninguna"},{"value":"B","label":"Verificás prioridades y coordinás una reprogramación con anticipación"},{"value":"C","label":"Esperás hasta el horario"},{"value":"D","label":"Cancelás ambas sin avisar"}],"correct":"B"},
{"id":"aa10","category":"Planillas","text":"¿Qué práctica reduce errores al cargar información?","options":[{"value":"A","label":"Copiar sin revisar"},{"value":"B","label":"Validar campos críticos y controlar totales"},{"value":"C","label":"Usar abreviaturas propias"},{"value":"D","label":"Evitar filtros"}],"correct":"B"},
{"id":"aa11","category":"Comunicación","text":"No conocés la respuesta a una consulta. ¿Qué hacés?","options":[{"value":"A","label":"Inventás una respuesta"},{"value":"B","label":"Indicás que lo verificarás y confirmás el canal y plazo de respuesta"},{"value":"C","label":"Cortás la conversación"},{"value":"D","label":"Cambiás de tema"}],"correct":"B"},
{"id":"aa12","category":"Series","text":"¿Qué número continúa: 3, 6, 12, 24…?","options":[{"value":"A","label":"36"},{"value":"B","label":"42"},{"value":"C","label":"48"},{"value":"D","label":"54"}],"correct":"C"},
{"id":"aa13","category":"Archivo","text":"¿Cuál es el nombre de archivo más ordenado?","options":[{"value":"A","label":"documento nuevo final final.pdf"},{"value":"B","label":"Factura_Cliente_2026-09-01.pdf"},{"value":"C","label":"archivo1.pdf"},{"value":"D","label":"sin nombre.pdf"}],"correct":"B"},
{"id":"aa14","category":"Prioridad","text":"Una fecha de vencimiento fue cargada incorrectamente. ¿Qué hacés?","options":[{"value":"A","label":"La corregís, verificás el impacto y avisás a quienes corresponda"},{"value":"B","label":"Esperás al vencimiento"},{"value":"C","label":"Ocultás el registro"},{"value":"D","label":"Creás otro cliente"}],"correct":"A"},
{"id":"aa15","category":"Trabajo en equipo","text":"Recibís instrucciones contradictorias de dos responsables. ¿Qué hacés?","options":[{"value":"A","label":"Elegís una sin consultar"},{"value":"B","label":"Pedís confirmación de prioridad y dejás registro del acuerdo"},{"value":"C","label":"No hacés ninguna tarea"},{"value":"D","label":"Completás ambas de forma parcial"}],"correct":"B"}
]$q$::jsonb),
('comercial-ventas-15','Comercial y ventas','Perfil comercial','Escucha, negociación, seguimiento, objetivos, cálculos y atención posventa.',20,$q$[
{"id":"cv1","category":"Necesidades","text":"Antes de ofrecer un servicio, ¿qué conviene hacer?","options":[{"value":"A","label":"Presentar el producto más caro"},{"value":"B","label":"Hacer preguntas y comprender la necesidad del cliente"},{"value":"C","label":"Hablar sin interrupciones"},{"value":"D","label":"Enviar una lista genérica"}],"correct":"B"},
{"id":"cv2","category":"Objeciones","text":"El cliente dice que el precio es alto. ¿Cuál es la mejor respuesta?","options":[{"value":"A","label":"Discutir con el cliente"},{"value":"B","label":"Explorar su objeción y explicar el valor relacionado con su necesidad"},{"value":"C","label":"Finalizar la conversación"},{"value":"D","label":"Ofrecer cualquier descuento inmediatamente"}],"correct":"B"},
{"id":"cv3","category":"Cálculo","text":"Una comisión del 5% sobre una venta de $120.000 equivale a:","options":[{"value":"A","label":"$5.000"},{"value":"B","label":"$6.000"},{"value":"C","label":"$8.000"},{"value":"D","label":"$12.000"}],"correct":"B"},
{"id":"cv4","category":"Seguimiento","text":"Un prospecto pidió información y no respondió. ¿Qué corresponde?","options":[{"value":"A","label":"Enviar mensajes cada hora"},{"value":"B","label":"Realizar un seguimiento breve, útil y respetuoso"},{"value":"C","label":"Eliminarlo de inmediato"},{"value":"D","label":"Reclamarle una respuesta"}],"correct":"B"},
{"id":"cv5","category":"Posventa","text":"Después de concretar una venta, ¿qué acción aporta valor?","options":[{"value":"A","label":"No volver a contactar"},{"value":"B","label":"Confirmar entrega, satisfacción y próximos pasos"},{"value":"C","label":"Ofrecer otro producto antes de entregar"},{"value":"D","label":"Cerrar el registro"}],"correct":"B"},
{"id":"cv6","category":"Metas","text":"La meta mensual es 40 ventas y se concretaron 30. ¿Qué porcentaje se alcanzó?","options":[{"value":"A","label":"60%"},{"value":"B","label":"70%"},{"value":"C","label":"75%"},{"value":"D","label":"80%"}],"correct":"C"},
{"id":"cv7","category":"Comunicación","text":"¿Cuál es una pregunta abierta?","options":[{"value":"A","label":"¿Lo quiere en azul?"},{"value":"B","label":"¿Paga con tarjeta?"},{"value":"C","label":"¿Qué resultado espera obtener con este servicio?"},{"value":"D","label":"¿Lo compra hoy?"}],"correct":"C"},
{"id":"cv8","category":"CRM","text":"¿Qué dato es más útil registrar después de una conversación?","options":[{"value":"A","label":"Solo el nombre"},{"value":"B","label":"Necesidad, objeciones, acuerdo y próxima acción"},{"value":"C","label":"Una opinión personal"},{"value":"D","label":"Nada si no compró"}],"correct":"B"},
{"id":"cv9","category":"Conflictos","text":"Un cliente está molesto por un error. ¿Cómo actuás?","options":[{"value":"A","label":"Lo culpás por no revisar"},{"value":"B","label":"Escuchás, reconocés el inconveniente y proponés una solución concreta"},{"value":"C","label":"Evitás responder"},{"value":"D","label":"Prometés algo imposible"}],"correct":"B"},
{"id":"cv10","category":"Prioridades","text":"Tenés un cliente listo para comprar y tres consultas nuevas. ¿Qué hacés?","options":[{"value":"A","label":"Ignorás las consultas"},{"value":"B","label":"Cerrás la operación avanzada y confirmás recepción y plazo a las nuevas consultas"},{"value":"C","label":"Atendés al último que escribió"},{"value":"D","label":"Respondés todo de forma automática"}],"correct":"B"},
{"id":"cv11","category":"Ética","text":"El producto no cumple una necesidad clave del cliente. ¿Qué corresponde?","options":[{"value":"A","label":"Venderlo igualmente"},{"value":"B","label":"Explicar el límite y ofrecer una alternativa adecuada si existe"},{"value":"C","label":"Ocultar la información"},{"value":"D","label":"Asegurar resultados no comprobables"}],"correct":"B"},
{"id":"cv12","category":"Atención","text":"Seleccioná el código exactamente igual a VTA-5729-AR.","options":[{"value":"A","label":"VTA-5792-AR"},{"value":"B","label":"VTA-5729-AK"},{"value":"C","label":"VTA-5729-AR"},{"value":"D","label":"VTA-572B-AR"}],"correct":"C"},
{"id":"cv13","category":"Conversión","text":"De 50 consultas se concretan 10 ventas. ¿Cuál es la conversión?","options":[{"value":"A","label":"10%"},{"value":"B","label":"20%"},{"value":"C","label":"25%"},{"value":"D","label":"50%"}],"correct":"B"},
{"id":"cv14","category":"Negociación","text":"¿Qué caracteriza una negociación saludable?","options":[{"value":"A","label":"Presionar hasta obtener un sí"},{"value":"B","label":"Buscar un acuerdo claro y sostenible para ambas partes"},{"value":"C","label":"Evitar hablar de condiciones"},{"value":"D","label":"Cambiar el precio sin explicación"}],"correct":"B"},
{"id":"cv15","category":"Resultados","text":"Una campaña genera muchas consultas pero pocas ventas. ¿Qué analizás primero?","options":[{"value":"A","label":"Solo la cantidad de seguidores"},{"value":"B","label":"Calidad de los contactos, propuesta, seguimiento y objeciones"},{"value":"C","label":"El color del logo únicamente"},{"value":"D","label":"La hora de cierre del negocio"}],"correct":"B"}
]$q$::jsonb)
on conflict (slug) do update set
titulo=excluded.titulo,tipo=excluded.tipo,descripcion=excluded.descripcion,
duracion_minutos=excluded.duracion_minutos,preguntas=excluded.preguntas,
activa=true,actualizado_en=now();
