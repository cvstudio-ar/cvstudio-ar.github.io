(() => {
  'use strict';

  const TABLE = 'evaluaciones_entrevista';
  const TEMPLATE_TABLE = 'plantillas_evaluacion';
  const BASE_URL = `${location.origin}/simulacro/`;
  let evaluations = [];
  let templates = [];
  let loading = false;
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
      <div class="panel-head evaluation-head"><div><h2>Entrevistas y simulacros</h2><p>Generá un enlace individual, controlá el tiempo y revisá cada respuesta.</p></div><div class="evaluation-head-actions"><button class="button secondary" data-evaluation-federico>+ Federico · lógico</button><button class="button primary" data-evaluation-new>+ Nuevo simulacro</button></div></div>
      <div class="evaluation-notice"><strong>Uso orientativo</strong><span>Este módulo prepara al cliente para una instancia laboral. No emite diagnósticos psicológicos ni reemplaza una evaluación profesional.</span></div>
      <div id="evaluationContent">${content()}</div>
    </section>`;
  }

  function content() {
    if (loading) return '<div class="empty-state"><strong>Cargando simulacros…</strong><span>Consultando datos seguros en Supabase.</span></div>';
    if (loadError) return `<div class="empty-state evaluation-error"><strong>Falta activar la base de simulacros</strong><span>${esc(loadError)}</span><button class="button primary" data-evaluation-retry>Reintentar</button></div>`;
    if (!evaluations.length) return '<div class="empty-state"><strong>Todavía no hay simulacros</strong><span>Creá el primero o usá el acceso rápido preparado para Federico.</span></div>';
    return `<div class="evaluation-table-wrap"><table class="data-table evaluation-table"><thead><tr><th>Cliente</th><th>Objetivo</th><th>Plantilla</th><th>Estado</th><th>Resultado</th><th>Tiempo</th><th>Vence</th><th></th></tr></thead><tbody>${evaluations.map(row => {
      const template = row.plantillas_evaluacion || {};
      const result = row.puntaje_total == null ? '—' : `${row.puntaje_total}/${row.total_preguntas}`;
      return `<tr><td><b>${esc(row.cliente_nombre)}</b><small>${esc(row.cliente_whatsapp || row.cliente_email || '')}</small></td><td>${esc(row.puesto_objetivo || 'General')}</td><td>${esc(template.titulo || 'Personalizada')}</td><td><span class="status" style="--c:${statusColor(row.estado)}">${esc(row.estado)}</span></td><td><b>${result}</b></td><td>${formatTime(row.tiempo_segundos)}</td><td>${formatDate(row.vence_en)}</td><td><div class="evaluation-actions"><button class="button secondary small" data-evaluation-copy="${row.id}">Copiar enlace</button><button class="button primary small" data-evaluation-view="${row.id}">Ver</button></div></td></tr>`;
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
      db.from(TEMPLATE_TABLE).select('id,slug,titulo,tipo,duracion_minutos,preguntas,activa').eq('activa',true).order('titulo'),
      db.from(TABLE).select('*,plantillas_evaluacion(titulo,tipo,duracion_minutos,preguntas)').order('creado_en',{ascending:false})
    ]);
    loading = false;
    if (templateResult.error || evaluationResult.error) {
      const error = templateResult.error || evaluationResult.error;
      loadError = /does not exist|schema cache|PGRST/i.test(error.message || '')
        ? 'Ejecutá primero docs/migraciones/SUPABASE_ENTREVISTAS_SIMULACROS.sql en el editor SQL de Supabase.'
        : error.message;
      refreshContent();
      return;
    }
    templates = templateResult.data || [];
    evaluations = evaluationResult.data || [];
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
      window.toast?.('Primero activá la migración y volvé a cargar el módulo.');
      return;
    }
    const selectedSlug = prefill.template || 'logica-atencion-calidad-20';
    window.openModal(`<h2 id="modalTitle">Nuevo simulacro</h2><p style="color:var(--muted)">El enlace será único y el tiempo empezará cuando el cliente presione “Comenzar”.</p><form id="evaluationCreateForm" class="form-grid">
      <label>Nombre y apellido<input name="name" value="${esc(prefill.name || '')}" required autocomplete="off"></label>
      <label>Puesto objetivo<input name="role" value="${esc(prefill.role || '')}" required autocomplete="off"></label>
      <label>WhatsApp<input name="whatsapp" value="${esc(prefill.whatsapp || '')}" placeholder="+54 9 …" autocomplete="off"></label>
      <label>Correo<input name="email" type="email" value="${esc(prefill.email || '')}" autocomplete="off"></label>
      <label>Plantilla<select name="template">${templates.map(item => `<option value="${item.id}" ${item.slug === selectedSlug ? 'selected' : ''}>${esc(item.titulo)} · ${item.duracion_minutos} min</option>`).join('')}</select></label>
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

  function showDetail(row) {
    const template = row.plantillas_evaluacion || {};
    const questions = Array.isArray(template.preguntas) ? template.preguntas : [];
    const answers = row.respuestas || {};
    const details = questions.map((question,index) => {
      const answer = answers[question.id];
      const option = (question.options || []).find(item => item.value === answer);
      const correct = answer && answer === question.correct;
      return `<div class="evaluation-answer ${answer ? (correct ? 'is-correct' : 'is-wrong') : 'is-empty'}"><span>${index + 1}</span><div><strong>${esc(question.text)}</strong><small>Respuesta: ${esc(option?.label || 'Sin responder')}</small>${answer && !correct ? `<small>Correcta: ${esc((question.options || []).find(item => item.value === question.correct)?.label || question.correct)}</small>` : ''}</div></div>`;
    }).join('');
    const score = row.puntaje_total == null ? 'Aún no disponible' : `${row.puntaje_total} de ${row.total_preguntas} (${Math.round((row.puntaje_total / Math.max(row.total_preguntas,1))*100)}%)`;
    window.openModal(`<h2 id="modalTitle">${esc(row.cliente_nombre)}</h2><div class="evaluation-detail-summary"><div><small>Estado</small><strong>${esc(row.estado)}</strong></div><div><small>Resultado</small><strong>${score}</strong></div><div><small>Tiempo</small><strong>${formatTime(row.tiempo_segundos)}</strong></div><div><small>Finalizado</small><strong>${formatDate(row.finalizado_en)}</strong></div></div>
      <div class="evaluation-self-report"><span><b>Dificultad</b>${esc(row.dificultad_percibida || '—')}</span><span><b>Ansiedad</b>${esc(row.ansiedad_percibida || '—')}</span><span><b>Comentario</b>${esc(row.comentario_participante || '—')}</span></div>
      <div class="evaluation-answer-list">${details || '<p>Todavía no hay respuestas.</p>'}</div>
      <form id="evaluationReviewForm" class="form-grid"><label class="span-2">Devolución interna<textarea name="feedback" rows="4" placeholder="Fortalezas, puntos a reforzar y recomendaciones…">${esc(row.devolucion || '')}</textarea></label><div class="modal-actions span-2"><button type="button" class="button secondary" data-evaluation-detail-copy>Copiar enlace</button><button type="submit" class="button primary">Guardar como revisado</button></div></form>`);
    document.querySelector('[data-evaluation-detail-copy]').onclick = () => copy(linkFor(row),'Enlace copiado.');
    document.getElementById('evaluationReviewForm').onsubmit = async event => {
      event.preventDefault();
      const feedback = new FormData(event.currentTarget).get('feedback');
      const result = await window.cvstudioSupabase.from(TABLE).update({devolucion:String(feedback).trim() || null,estado:'Revisada',revisado_en:new Date().toISOString()}).eq('id',row.id).select('*,plantillas_evaluacion(titulo,tipo,duracion_minutos,preguntas)').single();
      if (result.error) return window.toast?.(result.error.message);
      evaluations = evaluations.map(item => item.id === row.id ? result.data : item);
      window.closeModal();
      window.openModule?.('evaluaciones');
      window.toast?.('Análisis guardado como revisado.');
    };
  }

  function bindRows() {
    document.querySelector('[data-evaluation-retry]')?.addEventListener('click',load);
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
    document.querySelector('[data-evaluation-federico]')?.addEventListener('click',() => openCreate({
      name:'Federico Aguirre',
      role:'Calidad y producción',
      template:'logica-atencion-calidad-20',
      notes:'Práctica previa a evaluación psicotécnica. Trabajar lógica, atención, concentración, velocidad y precisión.'
    }));
    bindRows();
    if (!loading && !evaluations.length && !loadError) load();
  }

  window.CVStudioEvaluations = {render,bind,load};
})();
