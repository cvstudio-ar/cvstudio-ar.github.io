(() => {
  'use strict';

  const TABLE = 'evaluaciones_entrevista';
  const TEMPLATE_TABLE = 'plantillas_evaluacion';
  const BASE_URL = `${location.origin}/simulacro/`;
  let evaluations = [];
  let templates = [];
  let loading = false;
  let loaded = false;
  let loadError = '';

  const esc = value => String(value ?? '').replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
  const formatDate = value => value ? new Intl.DateTimeFormat('es-AR',{dateStyle:'short',timeStyle:'short'}).format(new Date(value)) : '—';
  const formatTime = seconds => {
    const total = Number(seconds || 0);
    return total ? `${Math.floor(total / 60)} min ${total % 60} s` : '—';
  };
  const statusColor = status => ({Pendiente:'#ffb800',Iniciada:'#3b82f6',Completada:'#35d07f',Revisada:'#9b5de5',Vencida:'#ff5d73'})[status] || '#28c2d8';
  const linkFor = row => `${BASE_URL}?token=${encodeURIComponent(row.token)}`;

  function stats() {
    return {
      total: evaluations.length,
      pending: evaluations.filter(item => item.estado === 'Pendiente').length,
      started: evaluations.filter(item => item.estado === 'Iniciada').length,
      completed: evaluations.filter(item => ['Completada','Revisada'].includes(item.estado)).length,
      reviewed: evaluations.filter(item => item.estado === 'Revisada').length
    };
  }

  function render() {
    const values = stats();
    return `<section class="grid kpi-grid evaluation-kpis">
      ${kpi('file','Simulacros',values.total,'en el historial','#9b5de5')}
      ${kpi('clock','Pendientes',values.pending,'enlaces sin comenzar','#ffb800')}
      ${kpi('zap','En curso',values.started,'cronómetro iniciado','#3b82f6')}
      ${kpi('check','Completados',values.completed,'listos para analizar','#35d07f')}
      ${kpi('eye','Revisados',values.reviewed,'con devolución','#28c2d8')}
    </section>
    <section class="panel evaluation-center">
      <div class="panel-head evaluation-head"><div><h2>Entrevistas y simulacros</h2><p>Elegí una plantilla, generá un enlace individual y revisá los resultados.</p></div><div class="evaluation-head-actions"><button class="button primary" data-evaluation-new>+ Generar enlace</button></div></div>
      <div class="evaluation-notice"><strong>Uso orientativo</strong><span>Este módulo prepara al cliente para una instancia laboral. No emite diagnósticos psicológicos ni reemplaza una evaluación profesional.</span></div>
      <div id="evaluationContent">${content()}</div>
    </section>`;
  }

  function content() {
    if (loading) return '<div class="empty-state"><strong>Cargando plantillas y simulacros…</strong><span>Consultando datos seguros en Supabase.</span></div>';
    if (loadError) return `<div class="empty-state evaluation-error"><strong>No pudimos leer las plantillas</strong><span>${esc(loadError)}</span><button class="button primary" data-evaluation-retry>Reintentar</button></div>`;
    const catalog = `<section class="evaluation-template-section"><div class="evaluation-section-title"><div><h3>Biblioteca de evaluaciones avanzadas</h3><p>Cada perfil combina razonamiento, precisión, casos situacionales y entrevista estructurada.</p></div><span>${templates.length} perfiles activos</span></div><div class="evaluation-catalog-tools"><input type="search" data-template-search placeholder="Buscar por sector, puesto o competencia…" aria-label="Buscar una evaluación"></div><div class="evaluation-template-grid">${templates.map(template => `<article class="evaluation-template-card" data-template-card data-search="${esc([template.sector,template.tipo,template.titulo,template.descripcion,...(template.competencias || [])].join(' ').toLowerCase())}"><div class="evaluation-template-top"><span>${esc(template.sector || template.tipo)}</span><b>${template.duracion_minutos} min</b></div><h3>${esc(template.titulo)}</h3><p>${esc(template.descripcion || 'Simulacro de preparación laboral.')}</p><small>${esc(template.nivel || 'Intermedio')} · banco ${Array.isArray(template.preguntas) ? template.preguntas.length : 0} · intento ${template.cantidad_preguntas || template.preguntas?.length || 0}</small><button class="button primary small" data-template-use="${template.id}">Generar evaluación</button></article>`).join('') || '<div class="empty-state"><strong>No hay plantillas disponibles</strong><span>Verificá los permisos o activá al menos una plantilla.</span></div>'}</div></section>`;
    const historyTitle = `<div class="evaluation-section-title evaluation-history-title"><div><h3>Simulacros generados</h3><p>Seguimiento de enlaces, intentos y devoluciones.</p></div></div>`;
    if (!evaluations.length) return `${catalog}${historyTitle}<div class="empty-state evaluation-empty-history"><strong>Todavía no generaste ningún enlace</strong><span>Elegí una plantilla y completá los datos del cliente para comenzar.</span></div>`;
    return `${catalog}${historyTitle}<div class="evaluation-table-wrap"><table class="data-table evaluation-table"><thead><tr><th>Cliente</th><th>Objetivo</th><th>Plantilla</th><th>Estado</th><th>Resultado</th><th>Tiempo</th><th>Vence</th><th></th></tr></thead><tbody>${evaluations.map(row => {
      const template = row.plantillas_evaluacion || {};
      const result = row.puntaje_total == null ? 'Cualitativo' : `${row.puntaje_total}/${row.puntaje_maximo || row.total_preguntas}`;
      return `<tr><td><b>${esc(row.cliente_nombre)}</b><small>${esc(row.cliente_whatsapp || row.cliente_email || '')}</small></td><td>${esc(row.puesto_objetivo || 'General')}</td><td>${esc(template.titulo || 'Personalizada')}<small>Intento ${row.numero_intento || 1}</small></td><td><span class="status" style="--c:${statusColor(row.estado)}">${esc(row.estado)}</span></td><td><b>${result}</b></td><td>${formatTime(row.tiempo_segundos)}</td><td>${formatDate(row.vence_en)}</td><td><div class="evaluation-actions"><button class="button secondary small" data-evaluation-copy="${row.id}">Copiar enlace</button><button class="button primary small" data-evaluation-view="${row.id}">Ver</button></div></td></tr>`;
    }).join('')}</tbody></table></div>`;
  }

  function refreshContent() {
    const host = document.getElementById('evaluationContent');
    if (host) host.innerHTML = content();
    bindRows();
  }

  async function load() {
    const db = window.cvstudioSupabase;
    if (!db || loading) return;
    loading = true;
    loadError = '';
    refreshContent();
    const [templateResult, evaluationResult] = await Promise.all([
      db.from(TEMPLATE_TABLE).select('id,slug,titulo,tipo,descripcion,sector,nivel,duracion_minutos,cantidad_preguntas,competencias,version_contenido,preguntas,activa').eq('activa',true).order('sector').order('titulo'),
      db.from(TABLE).select('*,plantillas_evaluacion(titulo,tipo,duracion_minutos,preguntas)').order('creado_en',{ascending:false})
    ]);
    loading = false;
    if (templateResult.error || evaluationResult.error) {
      const error = templateResult.error || evaluationResult.error;
      loadError = /does not exist|schema cache|PGRST/i.test(error.message || '')
        ? 'La base del módulo todavía no está disponible en Supabase.'
        : error.message;
      refreshContent();
      return;
    }
    templates = templateResult.data || [];
    evaluations = evaluationResult.data || [];
    loaded = true;
    if (window.openModule && document.getElementById('appMain')?.dataset.module === 'evaluaciones') window.openModule('evaluaciones');
  }

  function localDateTime(days = 1, hour = 15) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    date.setHours(hour,0,0,0);
    const offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60000).toISOString().slice(0,16);
  }

  function openCreate(prefill = {}) {
    if (!templates.length) {
      window.toast?.('No hay plantillas disponibles para generar el enlace.');
      return;
    }
    const selectedTemplate = prefill.template || templates[0]?.id;
    window.openModal(`<h2 id="modalTitle">Generar enlace de simulacro</h2><p style="color:var(--muted)">El enlace será único y el tiempo empezará cuando el cliente presione “Comenzar”.</p><form id="evaluationCreateForm" class="form-grid">
      <label>Nombre y apellido<input name="name" value="${esc(prefill.name || '')}" required autocomplete="off"></label>
      <label>Puesto objetivo<input name="role" value="${esc(prefill.role || '')}" required autocomplete="off"></label>
      <label>WhatsApp<input name="whatsapp" value="${esc(prefill.whatsapp || '')}" placeholder="+54 9 …" autocomplete="off"></label>
      <label>Correo<input name="email" type="email" value="${esc(prefill.email || '')}" autocomplete="off"></label>
      <label>Plantilla<select name="template">${templates.map(item => `<option value="${item.id}" ${item.id === selectedTemplate || item.slug === selectedTemplate ? 'selected' : ''}>${esc(item.titulo)} · ${item.duracion_minutos} min</option>`).join('')}</select></label>
      <label>Vencimiento<input name="expires" type="datetime-local" value="${localDateTime(1,15)}" required></label>
      <label class="span-2">Notas internas<textarea name="notes" rows="3" placeholder="Contexto de la entrevista, empresa o aspectos a observar…">${esc(prefill.notes || '')}</textarea></label>
      <div class="modal-actions span-2"><button type="button" class="button secondary" data-close-modal>Cancelar</button><button type="submit" class="button primary">Crear y obtener enlace</button></div>
    </form>`);
    const form = document.getElementById('evaluationCreateForm');
    form.onsubmit = async event => {
      event.preventDefault();
      const data = new FormData(form);
      const submit = form.querySelector('[type="submit"]');
      submit.disabled = true;
      submit.textContent = 'Creando…';
      const template = templates.find(item => item.id === data.get('template'));
      const payload = {
        cliente_nombre: String(data.get('name')).trim(),
        cliente_whatsapp: String(data.get('whatsapp')).trim() || null,
        cliente_email: String(data.get('email')).trim() || null,
        puesto_objetivo: String(data.get('role')).trim(),
        plantilla_id: data.get('template'),
        duracion_minutos: template?.duracion_minutos || 25,
        cantidad_preguntas: template?.cantidad_preguntas || template?.preguntas?.length || 15,
        vence_en: new Date(data.get('expires')).toISOString(),
        notas_internas: String(data.get('notes')).trim() || null
      };
      const result = await window.cvstudioSupabase.from(TABLE).insert(payload).select('*,plantillas_evaluacion(titulo,tipo,duracion_minutos,preguntas)').single();
      if (result.error) {
        submit.disabled = false;
        submit.textContent = 'Crear y obtener enlace';
        window.toast?.(result.error.message);
        return;
      }
      evaluations.unshift(result.data);
      window.closeModal();
      window.openModule?.('evaluaciones');
      showShare(result.data);
    };
  }

  function showShare(row) {
    const url = linkFor(row);
    const message = `Hola ${row.cliente_nombre.split(' ')[0]}, te compartimos tu simulacro de preparación para la entrevista. Cuando presiones “Comenzar”, el tiempo empezará a correr. Realizalo en un lugar tranquilo y sin interrupciones: ${url}`;
    window.openModal(`<h2 id="modalTitle">Enlace listo</h2><p style="color:var(--muted)">Compartilo únicamente con ${esc(row.cliente_nombre)}.</p><div class="evaluation-share"><label>Enlace individual<input id="evaluationShareUrl" readonly value="${esc(url)}"></label><label>Mensaje sugerido<textarea id="evaluationShareMessage" rows="5" readonly>${esc(message)}</textarea></label></div><div class="modal-actions"><button class="button secondary" data-share-copy-message>Copiar mensaje</button><button class="button primary" data-share-copy-url>Copiar enlace</button></div>`);
    document.querySelector('[data-share-copy-url]').onclick = () => copy(url,'Enlace copiado.');
    document.querySelector('[data-share-copy-message]').onclick = () => copy(message,'Mensaje copiado.');
  }

  async function copy(value, success) {
    try { await navigator.clipboard.writeText(value); window.toast?.(success); }
    catch { window.prompt('Copiá este texto:',value); }
  }

  function answerQuality(question, answer) {
    if (question.type === 'text') return answer && String(answer).trim() ? 'open' : 'empty';
    if (!answer) return 'empty';
    const options = question.options || [];
    const selected = options.find(item => item.value === answer);
    const gradual = options.some(item => item.score != null);
    if (!gradual) return answer === question.correct ? 'correct' : 'wrong';
    const max = Math.max(0,...options.map(item => Number(item.score || 0)));
    const score = Number(selected?.score || 0);
    return score === max ? 'correct' : score > 0 ? 'partial' : 'wrong';
  }

  function performanceLabel(percent) {
    if (percent >= 80) return 'desempeño sólido';
    if (percent >= 65) return 'desempeño adecuado, con aspectos puntuales por ajustar';
    if (percent >= 50) return 'desempeño intermedio e inconsistente';
    return 'desempeño que requiere refuerzo antes de la instancia real';
  }

  function dimensionExercise(name) {
    const key = name.toLowerCase();
    if (/dato|numér|cálculo|análisis|infer/.test(key)) return 'Resolver un caso con porcentajes, diferencias entre fuentes y una conclusión justificada por escrito.';
    if (/atención|precisión|instrucción|control/.test(key)) return 'Practicar consignas condicionales y realizar una segunda verificación de códigos, fechas y requisitos críticos.';
    if (/comunicación|cliente|servicio|conflicto/.test(key)) return 'Ensayar una respuesta que incluya escucha, síntesis del problema, límite de actuación, solución y plazo de seguimiento.';
    if (/seguridad|riesgo|prevención/.test(key)) return 'Analizar tres escenarios identificando peligro, contención inmediata, comunicación y condición segura de reinicio.';
    if (/calidad|trazabilidad|proceso|mejora/.test(key)) return 'Reconstruir un desvío con evidencia, contención, causa posible, acción correctiva y verificación de eficacia.';
    if (/entrevista|autoconocimiento|integridad/.test(key)) return 'Preparar dos ejemplos reales con estructura situación, tarea, acción propia, resultado y aprendizaje.';
    return `Practicar un caso específico de ${name}, explicando criterio, consecuencias y decisión final.`;
  }

  function interviewQuestion(name,role) {
    const key = name.toLowerCase();
    if (/seguridad|riesgo|prevención/.test(key)) return 'Contame una situación en la que detuviste o modificaste una tarea por detectar un riesgo. ¿Cómo lo comunicaste?';
    if (/calidad|trazabilidad|proceso/.test(key)) return 'Describí un desvío que hayas investigado. ¿Cómo contuviste el impacto y verificaste la solución?';
    if (/comunicación|cliente|conflicto/.test(key)) return 'Relatá un conflicto o reclamo difícil. ¿Cómo ordenaste la conversación y qué resultado obtuviste?';
    if (/dato|numér|análisis/.test(key)) return 'Dame un ejemplo de una decisión que hayas tomado a partir de datos incompletos o contradictorios.';
    return `¿Qué experiencia concreta demuestra tu capacidad en ${name} para desempeñarte como ${role || 'el puesto objetivo'}?`;
  }

  function openReviewStats(row,questions) {
    const open = questions.filter(question => question.type === 'text');
    const reviews = row.revision_abiertas || {};
    const scored = open.map(question => reviews[question.id]).filter(item => item && item.score !== '' && item.score != null);
    const total = scored.reduce((sum,item) => sum + Number(item.score || 0),0);
    return {total:open.length,reviewed:scored.length,score:total,max:scored.length*3,percent:scored.length ? Math.round(total/(scored.length*3)*100) : null};
  }

  function buildAnalysis(row,questions) {
    const answers = row.respuestas || {};
    const maxScore = Number(row.puntaje_maximo || row.total_preguntas || 0);
    const score = Number(row.puntaje_total || 0);
    const percent = Math.round((score / Math.max(maxScore,1)) * 100);
    const dimensions = Object.entries(row.puntaje_detalle || {}).map(([name,value]) => ({
      name,
      obtained:Number(value?.obtenido || 0),
      max:Number(value?.maximo || 0),
      percent:Math.round((Number(value?.obtenido || 0) / Math.max(Number(value?.maximo || 0),1)) * 100)
    })).filter(item => item.max > 0).sort((a,b) => b.percent-a.percent);
    const strengths = dimensions.filter(item => item.percent >= 70).slice(0,3);
    const reinforce = [...dimensions].sort((a,b) => a.percent-b.percent).filter(item => item.percent < 70).slice(0,3);
    const counts = questions.reduce((total,question) => {
      total[answerQuality(question,answers[question.id])]++;
      return total;
    },{correct:0,partial:0,wrong:0,empty:0,open:0});
    const openTotal = questions.filter(question => question.type === 'text').length;
    const openReview = openReviewStats(row,questions);
    const available = Number(row.duracion_minutos || row.plantillas_evaluacion?.duracion_minutos || 0) * 60;
    const elapsed = Number(row.tiempo_segundos || 0);
    const pace = available ? elapsed / available : 0;
    const paceText = pace && pace < .35
      ? `El intento se completó en ${formatTime(elapsed)}, utilizando solo el ${Math.round(pace*100)}% del tiempo disponible. El ritmo fue demasiado acelerado y puede haber reducido la lectura comparativa de alternativas.`
      : pace > .95
        ? `Se utilizó prácticamente todo el tiempo disponible (${formatTime(elapsed)}). Conviene practicar una distribución más equilibrada para conservar minutos de revisión.`
        : `El tiempo utilizado fue ${formatTime(elapsed)} y se mantuvo dentro de un ritmo razonable para la actividad.`;
    const strengthText = strengths.length
      ? strengths.map(item => `${item.name} (${item.percent}%)`).join(', ')
      : 'No aparece todavía una dimensión claramente consolidada; conviene reforzar el núcleo general antes de repetir la práctica.';
    const reinforceText = reinforce.length
      ? reinforce.map(item => `${item.name} (${item.percent}%)`).join(', ')
      : 'No se observan dimensiones objetivas por debajo del 70%; corresponde profundizar la calidad de las respuestas abiertas.';
    const openText = openTotal
      ? `Se respondieron ${counts.open} de ${openTotal} consignas abiertas. ${openReview.reviewed === openTotal ? `La revisión profesional asignó ${openReview.score} de ${openReview.max} puntos (${openReview.percent}%).` : `Hay ${openTotal-openReview.reviewed} respuesta(s) abierta(s) pendiente(s) de calificación profesional.`} Deben mostrar contexto, acción propia, resultado y aprendizaje, sin quedarse en generalidades.`
      : 'Este intento no incluyó consignas abiertas; la devolución debe complementarse con preguntas conductuales durante el encuentro.';
    const anxiety = row.ansiedad_percibida || 'No informada';
    const difficulty = row.dificultad_percibida || 'No informada';
    const focus = reinforce.length ? reinforce : dimensions.slice(-2);
    const exercises = focus.slice(0,3).map((item,index) => `${index+1}. ${dimensionExercise(item.name)}`).join('\n');
    const interview = focus.slice(0,3).map((item,index) => `${index+1}. ${interviewQuestion(item.name,row.puesto_objetivo)}`).join('\n');
    return `ANÁLISIS DEL SIMULACRO · CVSTUDIO\n\nCliente: ${row.cliente_nombre}\nObjetivo: ${row.puesto_objetivo || 'Preparación laboral'}\nEvaluación: ${row.plantillas_evaluacion?.titulo || 'Simulacro personalizado'}\nIntento: ${row.numero_intento || 1}\n\nRESULTADO ORIENTATIVO\nObtuvo ${score} de ${maxScore} puntos (${percent}%), correspondiente a un ${performanceLabel(percent)}. Este resultado es una práctica de preparación y no representa un diagnóstico ni una decisión de aptitud laboral.\n\nLECTURA DEL DESEMPEÑO\nRespuestas de máxima valoración: ${counts.correct}. Respuestas parcialmente adecuadas: ${counts.partial}. Respuestas incorrectas: ${counts.wrong}. Sin responder: ${counts.empty}.\n${paceText}\nDificultad percibida: ${difficulty}. Ansiedad informada: ${anxiety}.\n\nFORTALEZAS OBSERVADAS\n${strengthText}\n\nASPECTOS A REFORZAR\n${reinforceText}\n${openText}\n\nEJERCICIOS PERSONALIZADOS\n${exercises || '1. Practicar lectura comparativa, justificación de decisiones y respuestas conductuales con ejemplos reales.'}\n\nPREGUNTAS PARA ENTRENAR LA ENTREVISTA\n${interview || '1. ¿Qué experiencia concreta demuestra tu preparación para el puesto y qué aprendiste de ella?'}\n\nPLAN DE PREPARACIÓN RECOMENDADO\n1. Revisar las situaciones incorrectas y parciales, identificando riesgo, prioridad, procedimiento y comunicación necesaria.\n2. Leer cada alternativa completa antes de responder y descartar opciones por sus consecuencias, no por palabras que parezcan correctas.\n3. Practicar respuestas de entrevista con estructura: situación, tarea, acción propia, resultado y aprendizaje.\n4. Realizar un segundo intento luego de la devolución para comparar precisión, criterio y administración del tiempo.\n\nPRÓXIMO PASO\nRealizar una devolución guiada, trabajar los puntos de menor rendimiento y luego enviar un segundo simulacro orientado al mismo puesto.`;
  }

  function collectOpenReviews() {
    const reviews = {};
    document.querySelectorAll('[data-open-review]').forEach(card => {
      const score = card.querySelector('[data-open-score]')?.value ?? '';
      const note = card.querySelector('[data-open-note]')?.value.trim() || '';
      reviews[card.dataset.openReview] = {score:score === '' ? null : Number(score),note};
    });
    return reviews;
  }

  function reportHtml(row,feedback) {
    const max = Number(row.puntaje_maximo || row.total_preguntas || 0);
    const score = Number(row.puntaje_total || 0);
    const percent = Math.round(score/Math.max(max,1)*100);
    const dimensions = Object.entries(row.puntaje_detalle || {}).map(([name,value]) => {
      const dimPercent = Math.round(Number(value.obtenido||0)/Math.max(Number(value.maximo||0),1)*100);
      return `<div class="dimension"><span><b>${esc(name)}</b><strong>${dimPercent}%</strong></span><i><em style="width:${dimPercent}%"></em></i></div>`;
    }).join('');
    const body = esc(feedback).replace(/\n/g,'<br>');
    return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Informe · ${esc(row.cliente_nombre)}</title><style>@page{size:A4;margin:18mm}*{box-sizing:border-box}body{margin:0;color:#172033;font:12px/1.55 Arial,sans-serif}.head{display:flex;justify-content:space-between;align-items:center;padding-bottom:16px;border-bottom:3px solid #e5b928}.brand{font-size:25px;font-weight:900;color:#0b2345}.brand small{display:block;font-size:10px;color:#64748b;letter-spacing:.08em}.tag{padding:7px 10px;border-radius:999px;background:#fff6cc;font-weight:700}.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:18px 0}.summary div{padding:11px;border:1px solid #dce3ed;border-radius:9px}.summary small{display:block;color:#6b7890}.summary b{font-size:15px}.dimensions{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin:15px 0}.dimension{padding:9px;border:1px solid #dce3ed;border-radius:8px}.dimension span{display:flex;justify-content:space-between}.dimension i{display:block;height:6px;margin-top:7px;border-radius:9px;background:#e8edf4;overflow:hidden}.dimension em{display:block;height:100%;background:#16a085}.report{margin-top:18px;padding:16px;border:1px solid #dce3ed;border-radius:10px;white-space:normal}.legal{margin-top:18px;padding-top:11px;border-top:1px solid #dce3ed;color:#6b7890;font-size:9px}@media print{button{display:none}}</style></head><body><div class="head"><div class="brand">CVStudio<small>PREPARACIÓN PARA ENTREVISTAS Y EVALUACIONES</small></div><span class="tag">Informe orientativo</span></div><div class="summary"><div><small>Cliente</small><b>${esc(row.cliente_nombre)}</b></div><div><small>Objetivo</small><b>${esc(row.puesto_objetivo||'General')}</b></div><div><small>Resultado</small><b>${score}/${max} · ${percent}%</b></div><div><small>Tiempo</small><b>${formatTime(row.tiempo_segundos)}</b></div></div>${dimensions?`<h3>Resultados por competencia</h3><div class="dimensions">${dimensions}</div>`:''}<div class="report">${body}</div><p class="legal">Este informe corresponde a una práctica orientativa de preparación laboral. No constituye una evaluación psicométrica validada, diagnóstico psicológico ni decisión de aptitud para un puesto.</p><script>window.onload=()=>window.print()<\/script></body></html>`;
  }

  function printReport(row,feedback) {
    if (!feedback.trim()) return window.toast?.('Primero generá o escribí la devolución.');
    const popup = window.open('','_blank');
    if (!popup) return window.toast?.('El navegador bloqueó la ventana del informe.');
    popup.document.open();
    popup.document.write(reportHtml(row,feedback));
    popup.document.close();
    window.cvstudioSupabase.from(TABLE).update({informe_generado_en:new Date().toISOString()}).eq('id',row.id).then(()=>{});
  }

  function whatsappSummary(row,feedback) {
    const max = Number(row.puntaje_maximo || row.total_preguntas || 0);
    const score = Number(row.puntaje_total || 0);
    const percent = Math.round(score/Math.max(max,1)*100);
    const dimensions = Object.entries(row.puntaje_detalle || {}).map(([name,value]) => ({name,percent:Math.round(Number(value.obtenido||0)/Math.max(Number(value.maximo||0),1)*100)}));
    const best = [...dimensions].sort((a,b)=>b.percent-a.percent)[0];
    const focus = [...dimensions].sort((a,b)=>a.percent-b.percent)[0];
    return `Hola ${row.cliente_nombre.split(' ')[0]}, ya revisamos tu simulacro de preparación para ${row.puesto_objetivo || 'la instancia laboral'}. El resultado orientativo fue ${score}/${max} (${percent}%).${best?` Se destacó ${best.name}.`:''}${focus?` El principal punto a reforzar es ${focus.name}.`:''} Preparamos una devolución con ejercicios y preguntas para practicar. Recordá que es una herramienta de preparación y no un diagnóstico ni una decisión de aptitud.`;
  }

  function openWhatsApp(row,feedback) {
    const phone = String(row.cliente_whatsapp || '').replace(/\D/g,'');
    if (!phone) return window.toast?.('Este cliente no tiene WhatsApp registrado.');
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(whatsappSummary(row,feedback))}`;
    window.open(url,'_blank','noopener,noreferrer');
  }

  function comparisonHtml(row) {
    const root = row.intento_origen || row.id;
    const related = evaluations.filter(item => item.id === root || item.intento_origen === root).filter(item => ['Completada','Revisada'].includes(item.estado)).sort((a,b)=>(a.numero_intento||1)-(b.numero_intento||1));
    if (related.length < 2) return '';
    const currentIndex = related.findIndex(item => item.id === row.id);
    if (currentIndex < 1) return '';
    const previous = related[currentIndex-1];
    const percentage = item => Math.round(Number(item.puntaje_total||0)/Math.max(Number(item.puntaje_maximo||item.total_preguntas||0),1)*100);
    const delta = percentage(row)-percentage(previous);
    const timeDelta = Number(row.tiempo_segundos||0)-Number(previous.tiempo_segundos||0);
    return `<div class="evaluation-comparison"><strong>Evolución respecto del intento ${previous.numero_intento||1}</strong><div><span><small>Resultado anterior</small><b>${percentage(previous)}%</b></span><span><small>Resultado actual</small><b>${percentage(row)}%</b></span><span><small>Variación</small><b class="${delta>=0?'is-positive':'is-negative'}">${delta>=0?'+':''}${delta} puntos</b></span><span><small>Tiempo</small><b>${timeDelta===0?'Sin cambio':`${timeDelta>0?'+':''}${Math.round(timeDelta/60)} min`}</b></span></div></div>`;
  }

  async function createSecondAttempt(row) {
    const root = row.intento_origen || row.id;
    const related = evaluations.filter(item => item.id === root || item.intento_origen === root);
    const next = Math.max(1,...related.map(item => Number(item.numero_intento||1)))+1;
    const payload = {
      cliente_nombre:row.cliente_nombre,cliente_whatsapp:row.cliente_whatsapp,cliente_email:row.cliente_email,
      puesto_objetivo:row.puesto_objetivo,plantilla_id:row.plantilla_id,duracion_minutos:row.duracion_minutos,
      cantidad_preguntas:row.cantidad_preguntas || 18,vence_en:new Date(Date.now()+7*86400000).toISOString(),
      intento_origen:root,numero_intento:next,notas_internas:`Segundo intento generado desde el proceso ${root}.`
    };
    const result = await window.cvstudioSupabase.from(TABLE).insert(payload).select('*,plantillas_evaluacion(titulo,tipo,duracion_minutos,preguntas)').single();
    if (result.error) return window.toast?.(result.error.message);
    evaluations.unshift(result.data);
    window.closeModal();
    showShare(result.data);
  }

  function showDetail(row) {
    const template = row.plantillas_evaluacion || {};
    const questions = Array.isArray(row.preguntas_asignadas) && row.preguntas_asignadas.length ? row.preguntas_asignadas : (Array.isArray(template.preguntas) ? template.preguntas : []);
    const answers = row.respuestas || {};
    const details = questions.map((question,index) => {
      const answer = answers[question.id];
      if(question.type === 'text') {
        const review = row.revision_abiertas?.[question.id] || {};
        const rubric = Array.isArray(question.rubric) && question.rubric.length ? `<ul>${question.rubric.map(item=>`<li>${esc(item)}</li>`).join('')}</ul>` : '';
        return `<div class="evaluation-answer is-open" data-open-review="${esc(question.id)}"><span>${index + 1}</span><div><strong>${esc(question.text)}</strong><small class="evaluation-open-response">${answer ? esc(answer) : 'Sin responder'}</small>${rubric?`<div class="evaluation-rubric"><b>Criterios sugeridos</b>${rubric}</div>`:''}<div class="evaluation-open-review"><label>Valoración profesional<select data-open-score><option value="">Pendiente de revisar</option><option value="0" ${String(review.score)==='0'?'selected':''}>0 · Insuficiente</option><option value="1" ${String(review.score)==='1'?'selected':''}>1 · Básica</option><option value="2" ${String(review.score)==='2'?'selected':''}>2 · Adecuada</option><option value="3" ${String(review.score)==='3'?'selected':''}>3 · Sólida</option></select></label><label>Observación<textarea data-open-note rows="2" placeholder="Evidencia, omisiones y mejora sugerida…">${esc(review.note || '')}</textarea></label></div></div></div>`;
      }
      const option = (question.options || []).find(item => item.value === answer);
      const hasGradualScore = (question.options || []).some(item => item.score != null);
      const maxOptionScore = Math.max(0,...(question.options || []).map(item => Number(item.score || 0)));
      const selectedScore = Number(option?.score || 0);
      const correct = answer && (hasGradualScore ? selectedScore === maxOptionScore : answer === question.correct);
      const quality = !answer ? 'is-empty' : correct ? 'is-correct' : selectedScore > 0 ? 'is-partial' : 'is-wrong';
      const note = hasGradualScore ? `Valor de la respuesta: ${selectedScore}/${maxOptionScore}` : (answer && !correct ? `Correcta: ${(question.options || []).find(item => item.value === question.correct)?.label || question.correct}` : 'Respuesta objetiva correcta');
      return `<div class="evaluation-answer ${quality}"><span>${index + 1}</span><div><strong>${esc(question.text)}</strong><small>Respuesta: ${esc(option?.label || 'Sin responder')}</small>${answer ? `<small>${esc(note)}</small>` : ''}</div></div>`;
    }).join('');
    const maxScore = row.puntaje_maximo || row.total_preguntas || 0;
    const score = row.puntaje_total == null ? 'Revisión cualitativa' : `${row.puntaje_total} de ${maxScore} (${Math.round((row.puntaje_total / Math.max(maxScore,1))*100)}%)`;
    const dimensions = Object.entries(row.puntaje_detalle || {}).map(([name,value]) => {const percent=Math.round((Number(value.obtenido||0)/Math.max(Number(value.maximo||0),1))*100);return `<div class="evaluation-dimension"><span><b>${esc(name)}</b><strong>${percent}%</strong></span><i><em style="width:${percent}%"></em></i><small>${value.obtenido}/${value.maximo} puntos</small></div>`;}).join('');
    const suggestedFeedback = row.devolucion || buildAnalysis(row,questions);
    const comparison = comparisonHtml(row);
    window.openModal(`<h2 id="modalTitle">${esc(row.cliente_nombre)}</h2><div class="evaluation-detail-summary"><div><small>Estado</small><strong>${esc(row.estado)}</strong></div><div><small>Resultado</small><strong>${score}</strong></div><div><small>Tiempo</small><strong>${formatTime(row.tiempo_segundos)}</strong></div><div><small>Finalizado</small><strong>${formatDate(row.finalizado_en)}</strong></div></div>
      <div class="evaluation-self-report"><span><b>Dificultad</b>${esc(row.dificultad_percibida || '—')}</span><span><b>Ansiedad</b>${esc(row.ansiedad_percibida || '—')}</span><span><b>Comentario</b>${esc(row.comentario_participante || '—')}</span></div>
      ${comparison}
      ${dimensions ? `<div class="evaluation-dimensions">${dimensions}</div>` : ''}
      <div class="evaluation-answer-list">${details || '<p>Todavía no hay respuestas.</p>'}</div>
      <form id="evaluationReviewForm" class="form-grid evaluation-review-form"><div class="evaluation-analysis-head span-2"><div><strong>Devolución profesional sugerida</strong><small>Revisala y personalizala antes de enviarla. Calificá primero las respuestas abiertas y después regenerá el análisis.</small></div><button type="button" class="button secondary small" data-analysis-regenerate>Regenerar análisis</button></div><label class="span-2"><textarea name="feedback" rows="15" placeholder="Fortalezas, puntos a reforzar y recomendaciones…">${esc(suggestedFeedback)}</textarea></label><div class="evaluation-delivery-actions span-2"><button type="button" class="button secondary" data-analysis-copy>Copiar devolución</button><button type="button" class="button secondary" data-report-print>Imprimir / guardar PDF</button><button type="button" class="button secondary" data-report-whatsapp>Abrir WhatsApp</button>${row.estado==='Revisada'?'<button type="button" class="button secondary" data-second-attempt>Generar segundo intento</button>':'<button type="button" class="button secondary" disabled title="Primero guardá la devolución como revisada">Segundo intento · requiere revisión</button>'}</div><div class="modal-actions span-2"><button type="button" class="button secondary" data-evaluation-detail-copy>Copiar enlace actual</button><button type="submit" class="button primary">Guardar como revisado</button></div></form>`);
    const feedbackField = document.querySelector('#evaluationReviewForm [name="feedback"]');
    document.querySelector('[data-analysis-regenerate]').onclick = () => { row.revision_abiertas=collectOpenReviews(); feedbackField.value=buildAnalysis(row,questions); window.toast?.('Análisis actualizado con la revisión profesional.'); };
    document.querySelector('[data-analysis-copy]').onclick = () => copy(feedbackField.value.trim(),'Devolución copiada.');
    document.querySelector('[data-report-print]').onclick = () => printReport({...row,revision_abiertas:collectOpenReviews()},feedbackField.value);
    document.querySelector('[data-report-whatsapp]').onclick = () => openWhatsApp(row,feedbackField.value);
    const secondAttemptButton = document.querySelector('[data-second-attempt]');
    if (secondAttemptButton) secondAttemptButton.onclick = () => createSecondAttempt(row);
    document.querySelector('[data-evaluation-detail-copy]').onclick = () => copy(linkFor(row),'Enlace copiado.');
    document.getElementById('evaluationReviewForm').onsubmit = async event => {
      event.preventDefault();
      const feedback = new FormData(event.currentTarget).get('feedback');
      const revision = collectOpenReviews();
      const openCount = questions.filter(question=>question.type==='text').length;
      const reviewedCount = Object.values(revision).filter(item=>item.score!=null).length;
      if (openCount && reviewedCount < openCount && !window.confirm(`Quedan ${openCount-reviewedCount} respuesta(s) abierta(s) sin calificar. ¿Guardar igualmente como revisado?`)) return;
      const result = await window.cvstudioSupabase.from(TABLE).update({devolucion:String(feedback).trim() || null,revision_abiertas:revision,estado:'Revisada',revisado_en:new Date().toISOString()}).eq('id',row.id).select('*,plantillas_evaluacion(titulo,tipo,duracion_minutos,preguntas)').single();
      if (result.error) return window.toast?.(result.error.message);
      evaluations = evaluations.map(item => item.id === row.id ? result.data : item);
      window.closeModal();
      window.openModule?.('evaluaciones');
      window.toast?.('Análisis guardado como revisado.');
    };
  }

  function bindRows() {
    document.querySelector('[data-evaluation-retry]')?.addEventListener('click',load);
    document.querySelector('[data-template-search]')?.addEventListener('input',event => {
      const query = event.target.value.trim().toLowerCase();
      document.querySelectorAll('[data-template-card]').forEach(card => { card.hidden = query && !card.dataset.search.includes(query); });
    });
    document.querySelectorAll('[data-template-use]').forEach(button => button.onclick = () => openCreate({template:button.dataset.templateUse}));
    document.querySelectorAll('[data-evaluation-copy]').forEach(button => button.onclick = () => {
      const row = evaluations.find(item => item.id === button.dataset.evaluationCopy);
      if (row) copy(linkFor(row),'Enlace copiado.');
    });
    document.querySelectorAll('[data-evaluation-view]').forEach(button => button.onclick = () => {
      const row = evaluations.find(item => item.id === button.dataset.evaluationView);
      if (row) showDetail(row);
    });
  }

  function bind() {
    document.querySelector('[data-evaluation-new]')?.addEventListener('click',() => openCreate());
    bindRows();
    if (!loading && !loaded && !loadError) load();
  }

  window.CVStudioEvaluations = {render,bind,load};
})();
