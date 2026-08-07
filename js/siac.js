(() => {
  'use strict';

  const STORAGE_KEY = 'cvstudio_siac_session_v2';
  const REQUESTS_KEY = 'cvstudio_siac_requests_v1';
  const CONTACT_WORKER_URL = 'https://cvstudio-contacto.cvpro-duccionesar.workers.dev';
  const CONTACT_TIMEOUT_MS = 15000;
  const shell = document.querySelector('[data-siac-shell]');
  if (!shell) return;

  const content = shell.querySelector('[data-siac-content]');
  const backBtn = shell.querySelector('[data-siac-back]');
  const progressLabel = shell.querySelector('[data-siac-progress-label]');
  const progressStep = shell.querySelector('[data-siac-progress-step]');
  const progressBar = shell.querySelector('[data-siac-progress-bar]');
  const openButtons = [...document.querySelectorAll('[data-siac-open]')];
  const pendingFiles = [];

  const state = loadSession() || {
    screen: 'welcome',
    history: [],
    answers: {},
    files: [],
    startedAt: new Date().toISOString()
  };

  const serviceMeta = {
    cv: { label: 'CV profesional', total: 7 },
    linkedin: { label: 'Perfil de LinkedIn', total: 7 },
    social: { label: 'Redes sociales', total: 7 },
    brand: { label: 'Logos e identidad visual', total: 7 },
    website: { label: 'Sitio web', total: 7 }
  };

  function saveSession() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function loadSession() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    } catch {
      return null;
    }
  }

  function setScreen(screen, push = true) {
    if (push && state.screen !== screen) state.history.push(state.screen);
    state.screen = screen;
    saveSession();
    render();
  }

  function goBack() {
    const previous = state.history.pop();
    if (!previous) return;
    state.screen = previous;
    saveSession();
    render();
  }

  function escapeHTML(value = '') {
    return String(value).replace(/[&<>'"]/g, character => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    })[character]);
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  }

  function createCode() {
    const date = new Date();
    return `CVS-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  }

  function buildNotificationMessage(request) {
    const ignoredKeys = new Set(['serviceKey', 'fullName', 'phone', 'email', 'city', 'service']);
    const lines = [
      `Código de solicitud: ${request.code}`,
      `Fecha: ${new Date(request.createdAt).toLocaleString('es-AR')}`,
      `Estado: ${request.status}`,
      '',
      `Cliente: ${request.client.name || 'No informado'}`,
      `Ubicación: ${request.client.city || 'No informada'}`,
      `Teléfono: ${request.client.phone || 'No informado'}`,
      `Correo: ${request.client.email || 'No informado'}`,
      '',
      `Servicio: ${request.service}`,
      `Subtipo: ${request.subtype || 'No especificado'}`,
      '',
      'Detalle de la solicitud:'
    ];

    Object.entries(request.answers)
      .filter(([key, value]) => value && !ignoredKeys.has(key))
      .forEach(([key, value]) => {
        const normalized = Array.isArray(value) ? value.join(', ') : String(value);
        lines.push(`- ${key}: ${normalized}`);
      });

    lines.push('', `Archivos: ${request.files.map(file => file.name).join(', ') || 'Sin archivos'}`);
    return lines.join('\n');
  }

  async function notifyContactWorker(request) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONTACT_TIMEOUT_MS);

    try {
      const response = await fetch(CONTACT_WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'siac-form-notification',
          requestCode: request.code,
          name: request.client.name,
          email: request.client.email,
          phone: request.client.phone,
          city: request.client.city,
          service: request.service,
          message: buildNotificationMessage(request),
          website: ''
        }),
        signal: controller.signal
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) {
        throw new Error(data.message || `El servicio de correo respondió ${response.status}.`);
      }

      return data;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  function open() {
    shell.hidden = false;
    document.body.style.overflow = 'hidden';
    render();
    setTimeout(() => shell.querySelector('button,input,textarea,select')?.focus(), 40);
  }

  function close() {
    shell.hidden = true;
    document.body.style.overflow = '';
    saveSession();
  }

  function setProgress(label, current, total) {
    progressLabel.textContent = label;
    progressStep.textContent = total ? `Paso ${current} de ${total}` : '';
    progressBar.style.width = total ? `${Math.round((current / total) * 100)}%` : '0%';
  }

  function currentServiceMeta() {
    return serviceMeta[state.answers.serviceKey] || { label: state.answers.service || 'Solicitud', total: 7 };
  }

  function options(items) {
    return `<div class="siac-options">${items.map(item => `
      <button class="siac-option" type="button" data-next="${item.next}" data-value="${escapeHTML(item.value || item.label)}"${item.key ? ` data-key="${item.key}"` : ''}>
        ${item.icon || ''}${escapeHTML(item.label)}${item.help ? `<small>${escapeHTML(item.help)}</small>` : ''}
      </button>`).join('')}</div>`;
  }

  function formScreen({ title, text = '', fields, next, label = 'Continuar', progress }) {
    setProgress(...progress);
    content.innerHTML = `<div class="siac-message">
      <h2>${title}</h2>
      ${text ? `<p>${text}</p>` : ''}
      <form class="siac-form" data-form>
        ${fields.map(field => fieldHTML(field)).join('')}
        <div class="siac-actions"><button class="siac-primary" type="submit">${label}</button></div>
      </form>
    </div>`;

    const form = content.querySelector('[data-form]');
    form.addEventListener('submit', event => {
      event.preventDefault();
      fields.forEach(field => {
        if (field.type === 'file') return;
        if (field.type === 'checkboxes') {
          state.answers[field.name] = [...form.querySelectorAll(`input[name="${field.name}"]:checked`)].map(input => input.value).join(', ');
        } else {
          state.answers[field.name] = form.elements[field.name]?.value?.trim() || '';
        }
      });
      saveSession();
      setScreen(next);
    });
    bindFiles(form);
  }

  function fieldHTML(field) {
    const value = escapeHTML(state.answers[field.name] || '');
    const help = field.help ? `<span class="siac-help">${escapeHTML(field.help)}</span>` : '';

    if (field.type === 'textarea') {
      return `<div class="siac-field"><label for="${field.name}">${field.label}</label><textarea id="${field.name}" name="${field.name}" ${field.required ? 'required' : ''} placeholder="${escapeHTML(field.placeholder || '')}">${value}</textarea>${help}</div>`;
    }

    if (field.type === 'select') {
      return `<div class="siac-field"><label for="${field.name}">${field.label}</label><select id="${field.name}" name="${field.name}" ${field.required ? 'required' : ''}><option value="">Seleccionar</option>${field.options.map(option => `<option value="${escapeHTML(option)}" ${value === escapeHTML(option) ? 'selected' : ''}>${escapeHTML(option)}</option>`).join('')}</select>${help}</div>`;
    }

    if (field.type === 'checkboxes') {
      const selected = String(state.answers[field.name] || '').split(', ').filter(Boolean);
      return `<div class="siac-field"><label>${field.label}</label><div class="siac-options siac-check-options">${field.options.map(option => `<label class="siac-option"><input type="checkbox" name="${field.name}" value="${escapeHTML(option)}" ${selected.includes(option) ? 'checked' : ''}> ${escapeHTML(option)}</label>`).join('')}</div>${help}</div>`;
    }

    if (field.type === 'file') {
      return `<div class="siac-field"><label>${field.label}</label><div class="siac-upload"><input type="file" name="${field.name}" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" multiple><span class="siac-help">PDF, DOC, DOCX, JPG, JPEG o PNG. Máximo 10 MB por archivo.</span><div class="siac-files" data-file-list>${state.files.map((file, index) => `<div class="siac-file"><span>${escapeHTML(file.name)} · ${formatBytes(file.size)}</span><button type="button" class="siac-text-button" data-remove-file="${index}">Quitar</button></div>`).join('')}</div></div></div>`;
    }

    return `<div class="siac-field"><label for="${field.name}">${field.label}</label><input id="${field.name}" name="${field.name}" type="${field.type || 'text'}" value="${value}" ${field.required ? 'required' : ''} placeholder="${escapeHTML(field.placeholder || '')}" />${help}</div>`;
  }

  function bindFiles(form) {
    const input = form.querySelector('input[type=file]');
    if (!input) return;

    input.addEventListener('change', () => {
      for (const file of input.files) {
        if (file.size > 10 * 1024 * 1024) {
          alert(`${file.name} supera 10 MB.`);
          continue;
        }
        if (!/\.(pdf|docx?|jpe?g|png)$/i.test(file.name)) {
          alert(`${file.name} no tiene un formato permitido.`);
          continue;
        }
        pendingFiles.push(file);
        state.files.push({ name: file.name, type: file.type, size: file.size, lastModified: file.lastModified });
      }
      saveSession();
      render();
    });

    form.addEventListener('click', event => {
      const button = event.target.closest('[data-remove-file]');
      if (!button) return;
      const index = Number(button.dataset.removeFile);
      state.files.splice(index, 1);
      pendingFiles.splice(index, 1);
      saveSession();
      render();
    });
  }

  function render() {
    backBtn.hidden = !state.history.length;
    content.scrollTop = 0;
    const meta = currentServiceMeta();

    if (state.screen === 'welcome') {
      setProgress('Bienvenida', 0, 0);
      content.innerHTML = `<div class="siac-message"><h2>👋 ¡Hola! Te damos la bienvenida a CVStudio Argentina.</h2><p>Soy el asistente virtual de CVStudio. Voy a hacerte unas preguntas breves para conocer tu necesidad y agilizar la atención.</p><p>Podés solicitar atención personal en cualquier momento.</p><h2>¿En qué podemos ayudarte?</h2>${options([
        { label: 'CV profesional', icon: '📄 ', next: 'cv-start', value: 'CV profesional', key: 'service' },
        { label: 'Perfil de LinkedIn', icon: '💼 ', next: 'linkedin-start', value: 'Perfil de LinkedIn', key: 'service' },
        { label: 'Redes sociales', icon: '📱 ', next: 'social-start', value: 'Redes sociales', key: 'service' },
        { label: 'Logos e identidad visual', icon: '🎨 ', next: 'brand-start', value: 'Logos e identidad visual', key: 'service' },
        { label: 'Sitio web', icon: '🌐 ', next: 'website-start', value: 'Sitio web', key: 'service' },
        { label: 'Hablar con un asesor', icon: '👤 ', next: 'advisor' }
      ])}</div>`;
    }

    // CV PROFESIONAL
    else if (state.screen === 'cv-start') {
      state.answers.serviceKey = 'cv';
      setProgress('CV profesional', 1, 7);
      content.innerHTML = `<div class="siac-message"><h2>📄 Perfecto. ¿Contás con un currículum anterior que podamos utilizar como referencia?</h2>${options([
        { label: 'Sí, tengo un CV', next: 'cv-have-upload', value: 'Sí', key: 'hasCV' },
        { label: 'No, necesito crearlo desde cero', next: 'cv-new-objective', value: 'No', key: 'hasCV' },
        { label: 'Prefiero hablar con un asesor', next: 'advisor' }
      ])}</div>`;
    } else if (state.screen === 'cv-have-upload') {
      formScreen({ title: 'Adjuntá tu currículum anterior', text: 'Podés cargarlo en formato PDF, Word o imagen.', fields: [{ type: 'file', name: 'cvFile', label: 'Archivo del CV' }], next: 'cv-have-type', progress: ['CV profesional', 2, 7] });
    } else if (state.screen === 'cv-have-type') {
      setProgress('CV profesional', 3, 7);
      content.innerHTML = `<div class="siac-message"><h2>¿Qué necesitás realizar?</h2>${options([
        { label: 'Diseño completamente nuevo', next: 'cv-have-details', value: 'Diseño completamente nuevo', key: 'workType' },
        { label: 'Transformar el CV actual', next: 'cv-have-details', value: 'Transformar el CV actual', key: 'workType' },
        { label: 'Crear dos CV con enfoques diferentes', next: 'cv-have-details', value: 'Crear dos CV con enfoques diferentes', key: 'workType' },
        { label: 'No estoy seguro/a', next: 'cv-have-details', value: 'No estoy seguro/a', key: 'workType' }
      ])}</div>`;
    } else if (state.screen === 'cv-have-details') {
      formScreen({ title: 'Contanos el objetivo del nuevo CV', fields: [
        { name: 'objective', label: '¿A qué puesto, profesión o sector querés orientarlo?', required: true, placeholder: 'Ej.: Administración, Oil & Gas, Seguridad…' },
        { type: 'textarea', name: 'newInfo', label: 'Experiencias, estudios, cursos o datos nuevos', placeholder: 'Indicá lo que no figure en el CV anterior.' },
        { type: 'file', name: 'extraFiles', label: 'Foto, certificados, cursos o referencias' },
        { type: 'textarea', name: 'preferences', label: 'Estilo, colores, cantidad de páginas u observaciones', placeholder: 'También podés escribir “Prefiero completarlo después”.' }
      ], next: 'client-data', progress: ['CV profesional', 4, 7] });
    } else if (state.screen === 'cv-new-objective') {
      formScreen({ title: 'Vamos a crear tu CV desde cero', fields: [{ name: 'objective', label: '¿A qué puesto, profesión o sector querés postularte?', required: true }], next: 'cv-new-experience', progress: ['CV profesional', 2, 7] });
    } else if (state.screen === 'cv-new-experience') {
      setProgress('CV profesional', 3, 7);
      content.innerHTML = `<div class="siac-message"><h2>¿Contás con experiencia laboral?</h2>${options([
        { label: 'Sí', next: 'cv-new-details', value: 'Sí', key: 'experienceType' },
        { label: 'No, busco mi primer empleo', next: 'cv-new-details', value: 'Primer empleo', key: 'experienceType' },
        { label: 'Tengo trabajos informales o independientes', next: 'cv-new-details', value: 'Trabajos informales o independientes', key: 'experienceType' }
      ])}</div>`;
    } else if (state.screen === 'cv-new-details') {
      formScreen({ title: 'Información para construir tu perfil', fields: [
        { type: 'textarea', name: 'experience', label: 'Experiencias: empresa o actividad, puesto, fechas y tareas', placeholder: 'No sé / Prefiero completarlo después' },
        { type: 'textarea', name: 'education', label: 'Estudios, cursos, certificaciones y licencias' },
        { type: 'file', name: 'extraFiles', label: 'Foto, certificados, constancias o capturas' },
        { type: 'textarea', name: 'preferences', label: 'Estilo, colores, cantidad de páginas u observaciones' }
      ], next: 'client-data', progress: ['CV profesional', 4, 7] });
    }

    // LINKEDIN
    else if (state.screen === 'linkedin-start') {
      state.answers.serviceKey = 'linkedin';
      setProgress('Perfil de LinkedIn', 1, 7);
      content.innerHTML = `<div class="siac-message"><h2>💼 ¿Cuál es la situación actual de tu perfil?</h2>${options([
        { label: 'Ya tengo LinkedIn y quiero optimizarlo', next: 'linkedin-current', value: 'Optimización de perfil existente', key: 'linkedinType' },
        { label: 'Necesito crear el perfil desde cero', next: 'linkedin-objective', value: 'Creación desde cero', key: 'linkedinType' },
        { label: 'Solo necesito portada o imagen de perfil', next: 'linkedin-visual', value: 'Diseño visual de LinkedIn', key: 'linkedinType' }
      ])}</div>`;
    } else if (state.screen === 'linkedin-current') {
      formScreen({ title: 'Información del perfil actual', fields: [
        { name: 'linkedinUrl', label: 'Enlace de tu perfil de LinkedIn', required: true, placeholder: 'https://www.linkedin.com/in/...' },
        { type: 'textarea', name: 'linkedinIssues', label: '¿Qué querés mejorar o qué problema tiene actualmente?', placeholder: 'Título, acerca de, experiencias, visibilidad, búsqueda laboral…' }
      ], next: 'linkedin-objective', progress: ['Perfil de LinkedIn', 2, 7] });
    } else if (state.screen === 'linkedin-visual') {
      formScreen({ title: 'Diseño visual para LinkedIn', fields: [
        { type: 'checkboxes', name: 'linkedinVisualNeeds', label: '¿Qué piezas necesitás?', options: ['Foto de perfil optimizada', 'Portada / banner', 'Ambas piezas'], required: true },
        { type: 'textarea', name: 'visualPreferences', label: 'Estilo, rubro, colores o referencias' },
        { type: 'file', name: 'linkedinVisualFiles', label: 'Foto actual, logo o referencias visuales' }
      ], next: 'linkedin-objective', progress: ['Perfil de LinkedIn', 2, 7] });
    } else if (state.screen === 'linkedin-objective') {
      formScreen({ title: 'Objetivo profesional', fields: [
        { name: 'objective', label: '¿Qué puesto, profesión o sector querés posicionar?', required: true },
        { type: 'select', name: 'linkedinGoal', label: 'Objetivo principal del perfil', required: true, options: ['Conseguir empleo', 'Mejorar posicionamiento profesional', 'Conseguir clientes', 'Mostrar servicios o proyectos', 'Networking', 'Otro'] },
        { type: 'textarea', name: 'targetCompanies', label: 'Empresas, sectores o tipos de oportunidades que te interesan' }
      ], next: 'linkedin-content', progress: ['Perfil de LinkedIn', 3, 7] });
    } else if (state.screen === 'linkedin-content') {
      formScreen({ title: 'Contenido y documentación', fields: [
        { type: 'checkboxes', name: 'linkedinScope', label: '¿Qué querés trabajar?', options: ['Título profesional', 'Sección Acerca de', 'Experiencias', 'Educación y cursos', 'Aptitudes y palabras clave', 'Datos de contacto y URL', 'Optimización completa'] },
        { type: 'file', name: 'linkedinFiles', label: 'CV, certificados, foto o documentación de referencia' },
        { type: 'textarea', name: 'linkedinExtra', label: 'Experiencias, logros, idiomas, licencias o información adicional' }
      ], next: 'linkedin-access', progress: ['Perfil de LinkedIn', 4, 7] });
    } else if (state.screen === 'linkedin-access') {
      formScreen({ title: 'Modalidad de trabajo', text: 'Por seguridad, no escribas contraseñas en este formulario.', fields: [
        { type: 'select', name: 'linkedinAccess', label: '¿Cómo preferís realizar la personalización?', required: true, options: ['Recibir textos e instrucciones para cargarlos', 'Coordinar acceso temporal con un asesor', 'Todavía no lo decidí'] },
        { type: 'textarea', name: 'preferences', label: 'Observaciones, estilo o referencias profesionales' }
      ], next: 'client-data', progress: ['Perfil de LinkedIn', 5, 7] });
    }

    // REDES SOCIALES
    else if (state.screen === 'social-start') {
      state.answers.serviceKey = 'social';
      setProgress('Redes sociales', 1, 7);
      formScreen({ title: '📱 Contanos sobre tu proyecto o negocio', fields: [
        { name: 'brandName', label: 'Nombre de la marca, negocio o emprendimiento', required: true },
        { name: 'businessCategory', label: 'Rubro o actividad', required: true },
        { type: 'textarea', name: 'businessDescription', label: '¿Qué ofrecés y a qué público te dirigís?', required: true }
      ], next: 'social-platforms', progress: ['Redes sociales', 1, 7] });
    } else if (state.screen === 'social-platforms') {
      formScreen({ title: 'Plataformas y estado actual', fields: [
        { type: 'checkboxes', name: 'socialPlatforms', label: '¿En qué redes necesitás trabajar?', options: ['Instagram', 'Facebook', 'TikTok', 'LinkedIn empresa', 'WhatsApp Business', 'Otra'] },
        { type: 'textarea', name: 'socialLinks', label: 'Enlaces o nombres de usuario actuales', placeholder: '@usuario o URL' },
        { type: 'select', name: 'socialCurrentState', label: 'Situación actual', required: true, options: ['Crear desde cero', 'Rediseñar perfiles existentes', 'Mejorar contenido y estética', 'Campaña o promoción puntual'] }
      ], next: 'social-needs', progress: ['Redes sociales', 2, 7] });
    } else if (state.screen === 'social-needs') {
      formScreen({ title: '¿Qué piezas o servicios necesitás?', fields: [
        { type: 'checkboxes', name: 'socialNeeds', label: 'Seleccioná todo lo necesario', options: ['Personalización del perfil', 'Biografía y textos', 'Feed de publicaciones', 'Historias', 'Portadas de destacadas', 'Flyers', 'Banners', 'Reels', 'Plantillas editables', 'Calendario de contenidos', 'Catálogo de WhatsApp'] },
        { type: 'textarea', name: 'campaignObjective', label: 'Objetivo principal', placeholder: 'Vender, conseguir consultas, presentar la marca, anunciar una promoción…' }
      ], next: 'social-content', progress: ['Redes sociales', 3, 7] });
    } else if (state.screen === 'social-content') {
      formScreen({ title: 'Contenido y estilo', fields: [
        { type: 'textarea', name: 'socialMessage', label: 'Productos, servicios, promociones o mensaje que querés comunicar', required: true },
        { type: 'textarea', name: 'socialStyle', label: 'Estilo visual, colores, tono y referencias' },
        { type: 'select', name: 'contentAvailability', label: '¿Contás con fotos, videos y textos?', required: true, options: ['Sí, tengo todo', 'Tengo una parte', 'Necesito crear el contenido desde cero'] }
      ], next: 'social-files', progress: ['Redes sociales', 4, 7] });
    } else if (state.screen === 'social-files') {
      formScreen({ title: 'Archivos y datos adicionales', fields: [
        { type: 'file', name: 'socialFiles', label: 'Logo, fotos, videos, productos o referencias' },
        { type: 'textarea', name: 'socialContactData', label: 'Datos que deben aparecer en las piezas', placeholder: 'WhatsApp, dirección, horarios, precios, web…' },
        { type: 'textarea', name: 'preferences', label: 'Fecha de publicación, urgencia u observaciones' }
      ], next: 'client-data', progress: ['Redes sociales', 5, 7] });
    }

    // LOGO E IDENTIDAD
    else if (state.screen === 'brand-start') {
      state.answers.serviceKey = 'brand';
      setProgress('Logos e identidad visual', 1, 7);
      formScreen({ title: '🎨 Información de la marca', fields: [
        { name: 'brandName', label: 'Nombre exacto de la marca o proyecto', required: true },
        { name: 'businessCategory', label: 'Rubro o actividad', required: true },
        { type: 'textarea', name: 'brandDescription', label: '¿Qué ofrece la marca y qué la diferencia?', required: true }
      ], next: 'brand-scope', progress: ['Logos e identidad visual', 1, 7] });
    } else if (state.screen === 'brand-scope') {
      formScreen({ title: 'Alcance del trabajo', fields: [
        { type: 'select', name: 'brandCurrentState', label: 'Situación actual', required: true, options: ['Marca nueva sin logo', 'Tengo un logo y quiero rediseñarlo', 'Necesito completar una identidad existente'] },
        { type: 'checkboxes', name: 'brandNeeds', label: '¿Qué necesitás?', options: ['Logo principal', 'Isotipo / símbolo', 'Versiones horizontal y vertical', 'Paleta de colores', 'Tipografías', 'Manual básico de marca', 'Foto de perfil', 'Portadas para redes', 'Papelería o aplicaciones'] }
      ], next: 'brand-audience', progress: ['Logos e identidad visual', 2, 7] });
    } else if (state.screen === 'brand-audience') {
      formScreen({ title: 'Público y personalidad', fields: [
        { type: 'textarea', name: 'targetAudience', label: '¿A qué público se dirige la marca?', required: true },
        { type: 'checkboxes', name: 'brandPersonality', label: '¿Cómo querés que se perciba?', options: ['Profesional', 'Moderna', 'Elegante', 'Minimalista', 'Cercana', 'Juvenil', 'Premium', 'Tecnológica', 'Artesanal', 'Enérgica'] },
        { type: 'textarea', name: 'competitors', label: 'Competidores o marcas del rubro que quieras mencionar' }
      ], next: 'brand-style', progress: ['Logos e identidad visual', 3, 7] });
    } else if (state.screen === 'brand-style') {
      formScreen({ title: 'Preferencias visuales', fields: [
        { type: 'textarea', name: 'preferredColors', label: 'Colores preferidos y colores que querés evitar' },
        { type: 'select', name: 'logoStyle', label: 'Estilo principal', required: true, options: ['Minimalista', 'Moderno', 'Elegante', 'Premium', 'Urbano', 'Tecnológico', 'Artesanal', 'No estoy seguro/a'] },
        { type: 'textarea', name: 'symbolsIdeas', label: 'Símbolos, iniciales, elementos o ideas que te gustaría incluir o evitar' },
        { type: 'textarea', name: 'slogan', label: 'Eslogan o frase de marca, si existe' }
      ], next: 'brand-files', progress: ['Logos e identidad visual', 4, 7] });
    } else if (state.screen === 'brand-files') {
      formScreen({ title: 'Referencias y usos', fields: [
        { type: 'file', name: 'brandFiles', label: 'Logo actual, bocetos, referencias o imágenes' },
        { type: 'checkboxes', name: 'brandUses', label: '¿Dónde se utilizará principalmente?', options: ['Instagram y Facebook', 'WhatsApp', 'Sitio web', 'Impresión', 'Indumentaria', 'Cartelería', 'Packaging', 'Otra aplicación'] },
        { type: 'textarea', name: 'preferences', label: 'Observaciones o requisitos especiales' }
      ], next: 'client-data', progress: ['Logos e identidad visual', 5, 7] });
    }

    // SITIO WEB
    else if (state.screen === 'website-start') {
      state.answers.serviceKey = 'website';
      setProgress('Sitio web', 1, 7);
      formScreen({ title: '🌐 Información inicial del proyecto web', fields: [
        { name: 'brandName', label: 'Nombre del negocio, marca o proyecto', required: true },
        { name: 'businessCategory', label: 'Rubro o actividad', required: true },
        { type: 'textarea', name: 'businessDescription', label: '¿Qué ofrecés y a quién?', required: true }
      ], next: 'website-type', progress: ['Sitio web', 1, 7] });
    } else if (state.screen === 'website-type') {
      formScreen({ title: 'Tipo y situación del sitio', fields: [
        { type: 'select', name: 'websiteCurrentState', label: 'Situación actual', required: true, options: ['Necesito una web desde cero', 'Ya tengo una web y quiero rediseñarla', 'Necesito corregir o ampliar una web existente'] },
        { type: 'select', name: 'websiteType', label: 'Tipo de sitio', required: true, options: ['Landing page de una sola página', 'Sitio institucional', 'Portfolio profesional', 'Catálogo de productos o servicios', 'Tienda online', 'Blog o sitio de contenidos', 'No estoy seguro/a'] },
        { name: 'currentWebsiteUrl', label: 'Enlace del sitio actual, si existe', placeholder: 'https://...' }
      ], next: 'website-objective', progress: ['Sitio web', 2, 7] });
    } else if (state.screen === 'website-objective') {
      formScreen({ title: 'Objetivo y funciones', fields: [
        { type: 'textarea', name: 'websiteObjective', label: '¿Qué debería lograr principalmente la web?', required: true, placeholder: 'Conseguir consultas, vender, mostrar trabajos, presentar servicios…' },
        { type: 'checkboxes', name: 'websiteFeatures', label: 'Funciones necesarias', options: ['Botón de WhatsApp', 'Formulario de contacto', 'Galería o portfolio', 'Catálogo', 'Pagos online', 'Reservas o turnos', 'Mapa', 'Redes sociales', 'Blog', 'Panel de administración', 'Otra'] },
        { type: 'textarea', name: 'websitePages', label: 'Secciones o páginas que imaginás', placeholder: 'Inicio, servicios, nosotros, portfolio, preguntas, contacto…' }
      ], next: 'website-content', progress: ['Sitio web', 3, 7] });
    } else if (state.screen === 'website-content') {
      formScreen({ title: 'Contenido e identidad', fields: [
        { type: 'select', name: 'websiteContentStatus', label: '¿Contás con textos e imágenes?', required: true, options: ['Sí, tengo todo', 'Tengo una parte', 'Necesito ayuda para crear el contenido'] },
        { type: 'select', name: 'websiteBrandStatus', label: '¿Contás con logo e identidad visual?', required: true, options: ['Sí', 'Parcialmente', 'No, también necesito identidad visual'] },
        { type: 'textarea', name: 'websiteStyle', label: 'Estilo, colores y sitios de referencia' }
      ], next: 'website-technical', progress: ['Sitio web', 4, 7] });
    } else if (state.screen === 'website-technical') {
      formScreen({ title: 'Dominio, archivos y requisitos', fields: [
        { type: 'select', name: 'domainStatus', label: '¿Ya tenés dominio y alojamiento?', required: true, options: ['Sí, tengo ambos', 'Tengo dominio pero no alojamiento', 'No tengo ninguno', 'No sé'] },
        { type: 'file', name: 'websiteFiles', label: 'Logo, textos, fotos, catálogo o referencias' },
        { type: 'textarea', name: 'websiteDeadline', label: 'Fecha deseada, urgencia o lanzamiento previsto' },
        { type: 'textarea', name: 'preferences', label: 'Observaciones o funciones especiales' }
      ], next: 'client-data', progress: ['Sitio web', 5, 7] });
    }

    // DATOS, RESUMEN Y CIERRE COMPARTIDOS
    else if (state.screen === 'client-data') {
      formScreen({ title: 'Datos de contacto', text: 'Los utilizaremos únicamente para evaluar y desarrollar el servicio solicitado.', fields: [
        { name: 'fullName', label: 'Nombre y apellido', required: true },
        { name: 'city', label: 'Ciudad y provincia', required: true },
        { name: 'phone', label: 'Teléfono', type: 'tel', required: true },
        { name: 'email', label: 'Correo electrónico', type: 'email', required: true }
      ], next: 'summary', progress: [meta.label, 6, meta.total] });
    } else if (state.screen === 'summary') {
      renderSummary();
    } else if (state.screen === 'success') {
      setProgress('Solicitud registrada', 7, 7);
      const request = state.request;
      const deliveryNote = request.emailNotified
        ? '<p><strong>Envío:</strong> La información fue enviada por correo a CVStudio.</p>'
        : `<p><strong>Envío:</strong> No pudimos confirmar el correo. Conservá este código y comunicate por WhatsApp. ${escapeHTML(request.emailError || '')}</p>`;
      const storageNote = request.saved === 'supabase'
        ? '<p><strong>Registro:</strong> Guardado en el sistema de gestión.</p>'
        : '<p><strong>Registro:</strong> Guardado temporalmente en este dispositivo. Te recomendamos conservar el código de solicitud.</p>';
      content.innerHTML = `<div class="siac-message"><div class="siac-success"><h2>✅ ¡Muchas gracias!</h2><p>Recibimos correctamente la información inicial de tu solicitud.</p><p>Tu consulta fue registrada y ya quedó preparada para la revisión de un asesor de CVStudio Argentina.</p><p>En breve, un integrante del equipo se pondrá en contacto con vos para continuar la atención, confirmar los detalles del trabajo, el presupuesto y el plazo de entrega.</p><p>Mientras tanto, podés enviar cualquier archivo o información adicional que consideres importante.</p><span class="siac-code">${escapeHTML(request.code)}</span><p><strong>Estado:</strong> Pendiente de revisión.</p>${storageNote}${deliveryNote}</div><button class="siac-secondary" type="button" data-new-request>Nueva solicitud</button></div>`;
      content.querySelector('[data-new-request]').addEventListener('click', reset);
    } else if (state.screen === 'advisor') {
      setProgress('Atención personal', 0, 0);
      content.innerHTML = `<div class="siac-message"><h2>Hablar con un asesor</h2><p>Podés continuar la atención personalizada por WhatsApp. Ninguna ficha será enviada automáticamente a colaboradores.</p><div class="siac-actions"><a class="siac-primary" href="https://wa.me/5492964652318?text=Hola%20CVStudio,%20quiero%20hablar%20con%20un%20asesor." target="_blank" rel="noopener">Abrir WhatsApp</a></div></div>`;
    }

    bindOptions();
  }

  function renderSummary() {
    const meta = currentServiceMeta();
    setProgress('Revisión', 7, meta.total);
    const labels = {
      service: 'Servicio', linkedinType: 'Modalidad LinkedIn', linkedinUrl: 'Perfil actual', linkedinIssues: 'Mejoras solicitadas', linkedinVisualNeeds: 'Diseño para LinkedIn', visualPreferences: 'Preferencias visuales', objective: 'Objetivo', linkedinGoal: 'Objetivo del perfil', targetCompanies: 'Empresas o sectores', linkedinScope: 'Secciones a trabajar', linkedinExtra: 'Información profesional', linkedinAccess: 'Modalidad de trabajo',
      brandName: 'Marca o proyecto', businessCategory: 'Rubro', businessDescription: 'Descripción', socialPlatforms: 'Redes', socialLinks: 'Perfiles actuales', socialCurrentState: 'Situación actual', socialNeeds: 'Servicios para redes', campaignObjective: 'Objetivo de comunicación', socialMessage: 'Contenido a comunicar', socialStyle: 'Estilo para redes', contentAvailability: 'Material disponible', socialContactData: 'Datos para las piezas',
      brandDescription: 'Descripción de marca', brandCurrentState: 'Situación de marca', brandNeeds: 'Piezas de identidad', targetAudience: 'Público objetivo', brandPersonality: 'Personalidad', competitors: 'Competidores', preferredColors: 'Colores', logoStyle: 'Estilo de logo', symbolsIdeas: 'Símbolos e ideas', slogan: 'Eslogan', brandUses: 'Usos principales',
      websiteCurrentState: 'Situación del sitio', websiteType: 'Tipo de sitio', currentWebsiteUrl: 'Sitio actual', websiteObjective: 'Objetivo web', websiteFeatures: 'Funciones', websitePages: 'Secciones', websiteContentStatus: 'Contenido disponible', websiteBrandStatus: 'Identidad visual', websiteStyle: 'Estilo web', domainStatus: 'Dominio y alojamiento', websiteDeadline: 'Fecha deseada',
      hasCV: 'CV anterior', workType: 'Tipo de trabajo', experienceType: 'Experiencia', experience: 'Experiencias', education: 'Formación', newInfo: 'Información nueva', preferences: 'Preferencias y observaciones', fullName: 'Cliente', city: 'Ubicación', phone: 'Teléfono', email: 'Correo'
    };

    const rows = Object.entries(state.answers)
      .filter(([key, value]) => value && !['serviceKey'].includes(key))
      .map(([key, value]) => [labels[key] || key, value]);
    rows.push(['Archivos', state.files.map(file => file.name).join(', ') || 'Sin archivos']);

    content.innerHTML = `<div class="siac-message"><h2>Revisá el resumen antes de confirmar</h2><p>Podés volver para corregir cualquier dato. La ficha todavía no fue creada.</p><div class="siac-summary">${rows.map(row => `<div class="siac-summary-item"><span>${escapeHTML(row[0])}</span><p>${escapeHTML(row[1])}</p></div>`).join('')}</div><div class="siac-actions"><button class="siac-primary" type="button" data-confirm>Confirmar solicitud</button></div><p class="siac-note">La solicitud quedará con estado “Pendiente de revisión”, responsable inicial Exequiel y asignación “Sin definir”.</p></div>`;
    content.querySelector('[data-confirm]').addEventListener('click', confirmRequest);
  }

  function bindOptions() {
    content.querySelectorAll('[data-next]').forEach(button => button.addEventListener('click', () => {
      if (button.dataset.key) state.answers[button.dataset.key] = button.dataset.value;
      if (button.dataset.key === 'service') {
        const keyMap = {
          'CV profesional': 'cv',
          'Perfil de LinkedIn': 'linkedin',
          'Redes sociales': 'social',
          'Logos e identidad visual': 'brand',
          'Sitio web': 'website'
        };
        state.answers.serviceKey = keyMap[button.dataset.value];
      }
      saveSession();
      setScreen(button.dataset.next);
    }));
  }

  async function confirmRequest() {
    const confirmButton = content.querySelector('[data-confirm]');
    if (confirmButton) {
      confirmButton.disabled = true;
      confirmButton.textContent = 'Registrando…';
    }

    const request = {
      code: createCode(),
      createdAt: new Date().toISOString(),
      channel: 'Web',
      client: {
        name: state.answers.fullName,
        phone: state.answers.phone,
        email: state.answers.email,
        city: state.answers.city
      },
      service: state.answers.service || 'Solicitud',
      subtype: state.answers.workType || state.answers.linkedinType || state.answers.socialCurrentState || state.answers.brandCurrentState || state.answers.websiteType || state.answers.experienceType || '',
      answers: { ...state.answers },
      files: [...state.files],
      status: 'Pendiente de revisión',
      responsible: 'Exequiel',
      assignment: 'Sin definir',
      notes: '',
      audit: [{ date: new Date().toISOString(), user: 'SIAC', action: 'Ficha creada' }]
    };

    try {
      if (!window.cvstudioSupabaseReady || !window.cvstudioSupabase) {
        throw new Error('Supabase todavía no está configurado.');
      }

      const clientId = crypto.randomUUID();
      const requestId = crypto.randomUUID();
      const db = window.cvstudioSupabase;

      const { error: clientError } = await db.from('clientes').insert({
        id: clientId,
        nombre: request.client.name,
        telefono: request.client.phone,
        email: request.client.email,
        ciudad: request.client.city,
        creado: request.createdAt
      });
      if (clientError) throw clientError;

      const { error: requestError } = await db.from('solicitudes').insert({
        id: requestId,
        cliente_id: clientId,
        codigo: request.code,
        servicio: request.service,
        subtipo: request.subtype,
        descripcion: 'Solicitud generada desde SIAC web',
        datos: request.answers,
        estado: request.status,
        prioridad: 'Normal',
        responsable: request.responsible,
        asignado: request.assignment,
        notas: '',
        canal: request.channel,
        fecha_creacion: request.createdAt,
        fecha_actualizacion: request.createdAt
      });
      if (requestError) throw requestError;

      for (let index = 0; index < pendingFiles.length; index += 1) {
        const file = pendingFiles[index];
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '-');
        const path = `${requestId}/${Date.now()}-${index}-${safeName}`;
        const { error: uploadError } = await db.storage.from('siac-archivos').upload(path, file, { upsert: false, contentType: file.type || undefined });
        if (uploadError) throw uploadError;
        const { error: fileError } = await db.from('archivos').insert({
          solicitud_id: requestId,
          nombre: file.name,
          url: path,
          tipo: file.type || '',
          fecha: new Date().toISOString()
        });
        if (fileError) throw fileError;
      }

      request.id = requestId;
      request.saved = 'supabase';
    } catch (error) {
      console.error('SIAC Supabase:', error);
      const list = JSON.parse(localStorage.getItem(REQUESTS_KEY) || '[]');
      list.unshift(request);
      localStorage.setItem(REQUESTS_KEY, JSON.stringify(list));
      request.saved = 'local';
      request.syncError = error?.message || 'No se pudo conectar con la base de datos.';
    }

    try {
      await notifyContactWorker(request);
      request.emailNotified = true;
    } catch (error) {
      console.error('SIAC Email:', error);
      request.emailNotified = false;
      request.emailError = error?.name === 'AbortError'
        ? 'El aviso por correo superó el tiempo de espera.'
        : (error?.message || 'No se pudo enviar el aviso por correo.');
    }

    state.request = request;
    state.history = [];
    state.screen = 'success';
    saveSession();
    render();
  }

  function reset() {
    localStorage.removeItem(STORAGE_KEY);
    pendingFiles.length = 0;
    Object.assign(state, { screen: 'welcome', history: [], answers: {}, files: [], startedAt: new Date().toISOString() });
    saveSession();
    render();
  }


  function applyRequestQuery() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('solicitud') !== '1') return;

    const service = (params.get('servicio') || '').toLowerCase();
    const client = (params.get('cliente') || '').trim();
    const serviceMap = {
      'cv-profesional': { key: 'cv', label: 'CV profesional', screen: 'cv-start' },
      'cv profesional': { key: 'cv', label: 'CV profesional', screen: 'cv-start' },
      'linkedin': { key: 'linkedin', label: 'Perfil de LinkedIn', screen: 'linkedin-start' },
      'perfil-de-linkedin': { key: 'linkedin', label: 'Perfil de LinkedIn', screen: 'linkedin-start' },
      'portfolio': { key: 'website', label: 'Sitio web', screen: 'website-start' },
      'sitio-web': { key: 'website', label: 'Sitio web', screen: 'website-start' }
    };
    const selected = serviceMap[service] || serviceMap['cv-profesional'];

    state.history = [];
    state.screen = selected.screen;
    state.answers.serviceKey = selected.key;
    state.answers.service = selected.label;
    if (client) state.answers.fullName = client;
    saveSession();
    open();

    try {
      const cleanUrl = `${window.location.origin}${window.location.pathname}${window.location.hash || ''}`;
      window.history.replaceState({}, document.title, cleanUrl);
    } catch (_) {}
  }

  openButtons.forEach(button => button.addEventListener('click', open));
  shell.querySelectorAll('[data-siac-close]').forEach(element => element.addEventListener('click', close));
  backBtn.addEventListener('click', goBack);
  shell.querySelector('[data-siac-advisor]')?.addEventListener('click', () => setScreen('advisor'));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !shell.hidden) close();
  });

  render();
  applyRequestQuery();
})();
