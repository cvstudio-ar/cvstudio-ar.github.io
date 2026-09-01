(() => {
  'use strict';
  const advancedStyles = document.createElement('link');
  advancedStyles.rel = 'stylesheet';
  advancedStyles.href = '/css/simulacro-advanced.css?v=1.7.0';
  document.head.appendChild(advancedStyles);
  const app = document.getElementById('testApp');
  const token = new URLSearchParams(location.search).get('token');
  const storageKey = `cvstudio_simulacro_${token || 'invalid'}`;
  let evaluation = null;
  let answers = {};
  let current = 0;
  let timer = null;
  let deadline = null;
  let submitting = false;

  const esc = value => String(value ?? '').replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
  const db = () => window.cvstudioSupabase;
  const errorState = (title,message) => { app.innerHTML = `<div class="test-state"><div class="test-state-icon">!</div><h1>${esc(title)}</h1><p>${esc(message)}</p></div>`; };

  function saveLocal() {
    try { localStorage.setItem(storageKey,JSON.stringify({answers,current})); } catch (_) {}
  }
  function restoreLocal() {
    try { const saved = JSON.parse(localStorage.getItem(storageKey) || '{}'); answers = saved.answers || {}; current = Number(saved.current || 0); } catch (_) {}
  }
  function clearLocal() { try { localStorage.removeItem(storageKey); } catch (_) {} }

  async function load() {
    if (!token || !/^[0-9a-f-]{36}$/i.test(token)) return errorState('Enlace inválido','Solicitá a CVStudio un nuevo enlace individual.');
    if (!db()) return errorState('No pudimos conectar','Revisá tu conexión e intentá nuevamente.');
    const {data,error} = await db().rpc('obtener_simulacro_publico',{p_token:token});
    if (error || !data?.ok) return errorState('Simulacro no disponible',data?.message || 'El enlace no existe, venció o fue desactivado.');
    evaluation = data;
    if (data.status === 'Completada' || data.status === 'Revisada') return completedState();
    if (data.status === 'Iniciada') {
      restoreLocal();
      deadline = new Date(data.deadline);
      renderQuestion();
      startClock();
      return;
    }
    renderIntro();
  }

  function renderIntro() {
    const count = evaluation.question_count || evaluation.questions?.length || 0;
    app.innerHTML = `<div class="test-state"><div class="test-state-icon">✓</div><span class="question-label">Preparación personalizada</span><h1>${esc(evaluation.title)}</h1><p>Hola ${esc(evaluation.first_name)}. Leé cada situación con atención. Algunas consignas tienen una respuesta objetiva; otras evalúan criterio entre alternativas plausibles. El cronómetro comenzará únicamente cuando presiones el botón.</p><div class="test-meta"><div><small>Duración</small><strong>${evaluation.duration_minutes} minutos</strong></div><div><small>Preguntas</small><strong>${count}</strong></div><div><small>Modalidad</small><strong>Un intento</strong></div></div><button class="test-button" id="startTest">Comenzar simulacro</button><p class="test-legal">No cierres esta ventana durante la actividad. Tus respuestas se enviarán automáticamente al finalizar el tiempo.</p></div>`;
    document.getElementById('startTest').onclick = start;
  }

  async function start() {
    const button = document.getElementById('startTest');
    button.disabled = true;
    button.textContent = 'Iniciando…';
    const {data,error} = await db().rpc('iniciar_simulacro',{p_token:token});
    if (error || !data?.ok) {
      button.disabled = false;
      button.textContent = 'Comenzar simulacro';
      return errorState('No se pudo iniciar',data?.message || error?.message || 'Intentá nuevamente.');
    }
    evaluation = {...evaluation,...data};
    deadline = new Date(data.deadline);
    restoreLocal();
    renderQuestion();
    startClock();
  }

  function remainingSeconds() { return Math.max(0,Math.ceil((deadline.getTime() - Date.now()) / 1000)); }
  function formatClock(seconds) { return `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`; }
  function startClock() {
    clearInterval(timer);
    updateClock();
    timer = setInterval(updateClock,1000);
  }
  function updateClock() {
    const seconds = remainingSeconds();
    const el = document.getElementById('testTimer');
    if (el) { el.textContent = formatClock(seconds); el.classList.toggle('is-warning',seconds <= 120); }
    if (!seconds && !submitting) { clearInterval(timer); submit(true); }
  }

  function renderQuestion() {
    const questions = evaluation.questions || [];
    current = Math.min(Math.max(current,0),questions.length - 1);
    const question = questions[current];
    const selected = answers[question.id];
    const progress = Math.round(((current + 1) / questions.length) * 100);
    const options = orderedOptions(question);
    const response = question.type === 'text'
      ? `<label class="question-text-response"><span>Desarrollá tu respuesta</span><textarea id="textAnswer" rows="8" maxlength="1800" placeholder="Respondé como lo harías durante la entrevista…">${esc(selected || '')}</textarea><small>Buscá ser concreto: situación, acción y resultado cuando corresponda.</small></label>`
      : `<div class="question-options">${options.map((option,index) => `<button class="question-option ${selected === option.value ? 'is-selected' : ''}" data-answer="${esc(option.value)}"><b>${String.fromCharCode(65+index)}</b><span>${esc(option.label)}</span></button>`).join('')}</div>`;
    app.innerHTML = `<div class="test-top"><div><h1>${esc(evaluation.title)}</h1><p>Pregunta ${current + 1} de ${questions.length}</p></div><div class="test-timer" id="testTimer">${formatClock(remainingSeconds())}</div></div><div class="test-progress"><i style="width:${progress}%"></i></div><section class="question-card"><span class="question-label">${esc(question.dimension || question.category || 'Pregunta')} · ${esc(question.difficulty || 'intermedia')}</span>${question.context ? `<div class="question-context">${esc(question.context)}</div>` : ''}<h2>${esc(question.text)}</h2>${response}</section><div class="question-nav"><button class="test-button secondary" id="previousQuestion" ${current === 0 ? 'disabled' : ''}>Anterior</button><div class="question-dots">${questions.map((item,index) => `<button class="question-dot ${index === current ? 'is-active' : ''} ${hasAnswer(item.id) ? 'is-answered' : ''}" data-question="${index}" aria-label="Pregunta ${index+1}">${index+1}</button>`).join('')}</div>${current === questions.length - 1 ? '<button class="test-button" id="finishTest">Finalizar</button>' : '<button class="test-button" id="nextQuestion">Siguiente</button>'}</div>`;
    document.querySelectorAll('[data-answer]').forEach(button => button.onclick = () => { answers[question.id] = button.dataset.answer; saveLocal(); renderQuestion(); });
    document.getElementById('textAnswer')?.addEventListener('input',event => { answers[question.id] = event.target.value; saveLocal(); });
    document.querySelectorAll('[data-question]').forEach(button => button.onclick = () => { current = Number(button.dataset.question); saveLocal(); renderQuestion(); });
    document.getElementById('previousQuestion')?.addEventListener('click',() => { current--; saveLocal(); renderQuestion(); });
    document.getElementById('nextQuestion')?.addEventListener('click',() => { current++; saveLocal(); renderQuestion(); });
    document.getElementById('finishTest')?.addEventListener('click',reviewBeforeSubmit);
    updateClock();
  }

  function reviewBeforeSubmit() {
    const total = evaluation.questions.length;
    const answered = evaluation.questions.filter(question => hasAnswer(question.id)).length;
    app.innerHTML = `<div class="test-state"><div class="test-state-icon">${answered === total ? '✓' : '?'}</div><h1>Antes de enviar</h1><p>Respondidas: <strong>${answered} de ${total}</strong>. ${answered < total ? 'Podés volver y completar las que faltan, o enviar el intento así.' : 'Completaste todas las preguntas.'}</p>${answered < total ? `<div class="test-alert">Quedan ${total-answered} pregunta(s) sin responder.</div>` : ''}<div class="test-report"><label>Dificultad percibida<select id="difficulty"><option value="Baja">Baja</option><option value="Media" selected>Media</option><option value="Alta">Alta</option></select></label><label>Nivel de ansiedad durante la práctica<select id="anxiety"><option value="Bajo">Bajo</option><option value="Medio" selected>Medio</option><option value="Alto">Alto</option></select></label><label>Comentario opcional<textarea id="participantComment" rows="3" maxlength="800" placeholder="¿Qué parte te resultó más difícil?"></textarea></label></div><div class="test-actions"><button class="test-button secondary" id="backToTest">Volver</button><button class="test-button" id="confirmSubmit">Enviar respuestas</button></div></div>`;
    document.getElementById('backToTest').onclick = renderQuestion;
    document.getElementById('confirmSubmit').onclick = () => submit(false);
  }

  function hasAnswer(id) {
    const value = answers[id];
    return typeof value === 'string' ? Boolean(value.trim()) : value != null;
  }

  function orderedOptions(question) {
    const options = [...(question.options || [])];
    const seed = `${token}:${question.id}`;
    const hash = value => [...`${seed}:${value}`].reduce((total,char) => ((total * 31) + char.charCodeAt(0)) >>> 0,2166136261);
    return options.sort((a,b) => hash(a.value) - hash(b.value));
  }

  async function submit(automatic) {
    if (submitting) return;
    submitting = true;
    clearInterval(timer);
    const difficulty = document.getElementById('difficulty')?.value || 'No informado';
    const anxiety = document.getElementById('anxiety')?.value || 'No informado';
    const comment = document.getElementById('participantComment')?.value.trim() || '';
    app.innerHTML = '<div class="test-state"><div class="test-state-icon">⌛</div><h1>Enviando respuestas…</h1><p>No cierres esta ventana.</p></div>';
    const {data,error} = await db().rpc('entregar_simulacro',{p_token:token,p_respuestas:answers,p_dificultad:difficulty,p_ansiedad:anxiety,p_comentario:comment});
    if (error || !data?.ok) {
      submitting = false;
      if (automatic) return errorState('El tiempo finalizó','No pudimos enviar automáticamente. Revisá tu conexión y recargá la página para reintentar.');
      errorState('No se pudo enviar',data?.message || error?.message || 'Revisá tu conexión e intentá nuevamente.');
      return;
    }
    clearLocal();
    completedState();
  }

  function completedState() {
    clearInterval(timer);
    app.innerHTML = `<div class="test-state"><div class="test-state-icon">✓</div><h1>Respuestas enviadas</h1><p>Tu simulacro quedó registrado correctamente. CVStudio analizará las respuestas, el tiempo utilizado y los aspectos a reforzar antes de tu entrevista.</p><div class="test-meta"><div><small>Estado</small><strong>Completado</strong></div><div><small>Próximo paso</small><strong>Análisis</strong></div><div><small>Resultado</small><strong>Privado</strong></div></div><p class="test-legal">No mostramos respuestas correctas en esta pantalla para preservar la utilidad de la práctica.</p></div>`;
  }

  window.addEventListener('beforeunload',saveLocal);
  load();
})();
