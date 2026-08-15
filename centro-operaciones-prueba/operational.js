/* Centro de Operaciones CVStudio — capa funcional Clientes visual v1.4.52 recuperación de firmas heredadas
   Persistencia local con sincronización normalizada en Supabase staging.
   No modifica Mercado Pago, Meta ni el panel /admin actual. */
(() => {
  'use strict';

  const STORE_KEY = 'cvstudio_ops_operational_v2';
  const SERVICE_DEFAULTS = {
    'CV Profesional': 12000,
    'CV Freelance': 16000,
    'LinkedIn': 19000,
    'CV + LinkedIn': 25000,
    'Combo 2 CV Profesionales': 20000,
    'Portfolio': 35000,
    'Kit Emprendedor': 45000,
    'Kit + Web': 75000
  };

  const PERMISSION_MODULES = ['Inicio','Clientes','Administración','Marketing','Calendario','Plantillas','Archivos','Integraciones','Colaboradores','Espacios de clientes','Configuración'];
  const ROLE_PERMISSION_MAP = {
    Aprendiz: ['Inicio:ver','Plantillas:ver','Archivos:ver'],
    Operario: ['Inicio:ver','Clientes:ver','Clientes:editar','Plantillas:ver','Archivos:ver','Archivos:subir'],
    Líder: ['Inicio:ver','Clientes:ver','Clientes:editar','Calendario:ver','Calendario:editar','Plantillas:ver','Archivos:ver','Archivos:subir','Espacios de clientes:ver','Espacios de clientes:editar'],
    Supervisor: ['Inicio:ver','Clientes:ver','Clientes:editar','Administración:ver','Marketing:ver','Marketing:editar','Calendario:ver','Calendario:editar','Plantillas:ver','Plantillas:editar','Archivos:ver','Archivos:subir','Integraciones:ver','Espacios de clientes:ver','Espacios de clientes:editar'],
    Director: PERMISSION_MODULES.flatMap(module=>[`${module}:ver`,`${module}:editar`,`${module}:eliminar`])
  };
  const permissionsForRole = role => [...(ROLE_PERMISSION_MAP[role] || ROLE_PERMISSION_MAP.Aprendiz)];

  const seed = {
    version: 11,
    rules: { colab: 20, growth: 15, reserve: 5, company: 60 },
    prices: { ...SERVICE_DEFAULTS },
    clients: [], jobs: [], payments: [], executions: [], expenses: [], activities: [], calendarItems: [], urlSpaces: [], templates: [], hiddenClientRefs: [], collaborators: [{id:1,name:'pablexe',email:'pablexe@cvstudio.com.ar',role:'Director',commission:20,birthDate:'',startDate:'2026-08-01',status:'Activo',authStatus:'Activo',permissions:permissionsForRole('Director'),capabilities:['CV Profesional','LinkedIn','Cartas','Portfolio','Atención al cliente','Diseño gráfico','Marketing','Revisión'],training:{}}]
  };

  const clone = value => JSON.parse(JSON.stringify(value));
  function loadState() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORE_KEY));
      if (stored && [2,3,4,5,6,7,8,9,10,11].includes(stored.version)) {
        stored.version = 11;
        stored.executions = Array.isArray(stored.executions) ? stored.executions : [];
        stored.activities = Array.isArray(stored.activities) ? stored.activities : [];
        stored.calendarItems = Array.isArray(stored.calendarItems) ? stored.calendarItems : [];
        stored.urlSpaces = Array.isArray(stored.urlSpaces) ? stored.urlSpaces : [];
        stored.templates = Array.isArray(stored.templates) ? stored.templates : [];
        stored.hiddenClientRefs = Array.isArray(stored.hiddenClientRefs) ? stored.hiddenClientRefs : [];
        stored.collaborators = Array.isArray(stored.collaborators) && stored.collaborators.length ? stored.collaborators : clone(seed.collaborators);
        const roleMap={'Administrador':'Director','Coordinador':'Líder','Producción':'Operario','Diseñador':'Operario','Redactor':'Operario','Corrector':'Operario','Editor LinkedIn':'Operario','Portfolio':'Operario','Marketing':'Operario','Atención al cliente':'Operario'};
        stored.clients=(stored.clients||[]).map(c=>({...c,formData:c.formData&&typeof c.formData==='object'?c.formData:{}}));
        stored.collaborators.forEach(c=>{c.role=roleMap[c.role]||c.role||'Aprendiz';c.roleHistory=Array.isArray(c.roleHistory)?c.roleHistory:[];c.capabilities=Array.isArray(c.capabilities)?c.capabilities:[];c.permissions=Array.isArray(c.permissions)&&c.permissions.length?c.permissions:permissionsForRole(c.role);c.training=c.training&&typeof c.training==='object'?c.training:{};});
        const previousPrices=stored.prices||{};
        stored.prices={
          'CV Profesional':Number(previousPrices['CV Profesional']??12000),
          'CV Freelance':Number(previousPrices['CV Freelance']??16000),
          'LinkedIn':Number(previousPrices.LinkedIn??previousPrices['LinkedIn Profesional']??19000),
          'Combo 2 CV Profesionales':Number(previousPrices['Combo 2 CV Profesionales']??previousPrices['2 CV Profesionales']??20000),
          'CV + LinkedIn':Number(previousPrices['CV + LinkedIn']??previousPrices['Combo CV + LinkedIn']??25000),
          'Portfolio':Number(previousPrices.Portfolio??35000),
          'Kit Emprendedor':Number(previousPrices['Kit Emprendedor']??45000),
          'Kit + Web':Number(previousPrices['Kit + Web']??75000)
        };
        return stored;
      }
    } catch (_) {}
    localStorage.setItem(STORE_KEY, JSON.stringify(seed));
    return clone(seed);
  }
  let state = loadState();
  let clientFilter = 'Todos';
  let clientQuery = '';
  let clientSelectionMode = false;
  const selectedClientIds = new Set();
  let templateFilter = 'Todas';
  let selectedTemplateId = '';
  let filesCache = [];
  let filesLoading = false;
  let filesLoaded = false;
  let filesFilter = 'todos';
  let filesQuery = '';
  const selectedFileIds = new Set();
  let integrationHealth = null;
  function saveState(message) {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
    syncLegacyClients();
    if (message) toast(message);
  }
  function resetState() {
    state = clone(seed);
    saveState('Datos de prueba restablecidos.');
    openModule(currentModule);
  }
  function syncLegacyClients() {
    clients.splice(0, clients.length, ...state.clients.map(clone));
    const current = state.clients.find(c => selectedClient && c.id === selectedClient.id) || state.clients[0];
    selectedClient = current ? (clients.find(c => c.id === current.id) || clients[0]) : null;
  }
  syncLegacyClients();

  window.addEventListener('cvstudio:create-template',event=>{
    const item=event.detail||{};
    if(!item.name||!item.url)return;
    state.templates=[...(state.templates||[]),{id:`tpl-${Date.now()}`,name:item.name,category:item.category||'CV Profesional',url:item.url,active:true,createdAt:new Date().toISOString()}];
    addActivity('settings','Plantilla creada',`${item.name} · ${item.category||'CV Profesional'}`);
    saveState();
    closeModal();
    openModule('plantillas');
    toast('Plantilla guardada y enviada a Supabase.');
  });

  const confirmedPayments = () => state.payments.filter(p => p.status === 'Confirmado');
  const totalRevenue = () => confirmedPayments().reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const totalExpenses = () => state.expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const servicePrice = service => Number(state.prices[service] ?? SERVICE_DEFAULTS[service] ?? 0);
  const initials = name => String(name || '').trim().split(/\s+/).slice(0,2).map(x => x[0]?.toUpperCase()).join('') || 'CL';
  const nextId = list => Math.max(0, ...list.map(x => Number(x.id) || 0)) + 1;
  const formatDateTime = iso => new Intl.DateTimeFormat('es-AR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(iso));
  const todayKey = new Date().toISOString().slice(0,10);
  const isToday = iso => String(iso || '').slice(0,10) === todayKey;
  const esc = value => String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));

  function addActivity(type,title,detail,clientId=null) {
    state.activities.unshift({id:nextId(state.activities),type,title,detail,clientId,at:new Date().toISOString()});
    state.activities = state.activities.slice(0,50);
  }
  function typeIcon(type) {
    return ({payment:'dollar',client:'message',delivery:'check',job:'briefcase',settings:'settings'})[type] || 'clock';
  }
  function activityColor(type) {
    return ({payment:'#35d07f',client:'#9b5de5',delivery:'#3b82f6',job:'#ffb800',settings:'#28c2d8'})[type] || '#28c2d8';
  }
  function latestActivityHtml(limit=6) {
    return `<div class="activity-list">${state.activities.slice(0,limit).map(a=>`<div class="activity-item"><span class="activity-dot" style="background:${activityColor(a.type)}22;color:${activityColor(a.type)}">${icon(typeIcon(a.type))}</span><div><strong>${esc(a.title)}</strong><small>${esc(a.detail)}</small></div><time>${formatDateTime(a.at || a.createdAt)}</time></div>`).join('') || '<p class="empty-state">Todavía no hay actividad.</p>'}</div>`;
  }

  function dashboardRenderer() {
    const revenue = totalRevenue();
    const salesToday = confirmedPayments().filter(p=>isToday(p.createdAt)).length;
    const activeJobs = state.jobs.filter(j=>!['Entregado','Pausado'].includes(j.stage)).length;
    const deliveredToday = state.jobs.filter(j=>j.completedAt && isToday(j.completedAt)).length;
    const consultations = state.clients.length;
    const serviceTotals = {};
    confirmedPayments().forEach(p => serviceTotals[p.service] = (serviceTotals[p.service] || 0) + Number(p.amount));
    const sortedServices = Object.entries(serviceTotals).sort((a,b)=>b[1]-a[1]);
    const interested = state.clients.filter(c=>c.status!=='Entregado').length;
    const pending = state.payments.filter(p=>p.status==='Pendiente').length;
    return `<section class="grid kpi-grid">
      ${kpi('message','Clientes registrados',consultations,'registrados en el sistema','#9b5de5')}
      ${kpi('dollar','Ventas confirmadas',confirmedPayments().length,`${salesToday} registradas hoy`,'#35d07f')}
      ${kpi('file','Trabajos activos',activeJobs,'en curso actualmente','#3b82f6')}
      ${kpi('check','Entregados hoy',deliveredToday,'finalizados en la fecha','#ffb800')}
      ${kpi('wallet','Ingresos confirmados',money(revenue),'pagos confirmados','#28c2d8')}
    </section>
    <section class="grid dashboard-layout">
      <section class="panel span-2"><div class="panel-head"><div><h2>Resumen de actividad</h2><p>Movimientos registrados en los últimos días</p></div></div>${state.activities.length || state.payments.length || state.jobs.length ? lineSvg() : `<div class="empty-state empty-state-large"><strong>Sin actividad registrada</strong><span>Los movimientos aparecerán aquí cuando ingresen clientes, pagos o trabajos.</span></div>`}</section>
      ${panel('Actividad reciente', latestActivityHtml(4))}
      ${panel('Ingresos por servicio',`<div class="donut-wrap">${donutChart(money(revenue).replace('$ ','$'),'Confirmado')}<div class="legend">${sortedServices.map(([name,val],i)=>`<span style="--c:${['#35d07f','#3b82f6','#9b5de5','#ff8a1f'][i%4]}"><i></i>${esc(name)} · ${money(val)}</span>`).join('') || '<span>Sin pagos confirmados</span>'}</div></div>`)}
      ${panel('Embudo de ventas',`<div class="funnel"><div class="funnel-row" style="--c:#9b5de5"><span>Clientes</span><b>${consultations}</b></div><div class="funnel-row" style="--c:#3b82f6"><span>En seguimiento</span><b>${interested}</b></div><div class="funnel-row" style="--c:#ffb800"><span>Pagos pendientes</span><b>${pending}</b></div><div class="funnel-row" style="--c:#35d07f"><span>Ventas confirmadas</span><b>${confirmedPayments().length}</b></div></div>`)}
      ${panel('Estado operativo',`<div class="campaign-card"><div class="campaign-head"><span class="platform">${icon('database')} Base de datos</span><span class="status" style="--c:#35d07f">Operativa</span></div><p>Clientes, pagos, trabajos y movimientos se sincronizan con Supabase.</p></div><div class="campaign-card"><div class="campaign-head"><span class="platform">${icon('shield')} Panel anterior</span><span class="status" style="--c:#35d07f">Respaldo</span></div><p>El panel /admin permanece disponible durante la transición.</p></div>`)}
    </section>`;
  }

  function visibleClients(){
    return state.clients.filter(c=>{
      const matchesFilter=clientFilter==='Todos'||c.status===clientFilter;
      const haystack=`${c.name} ${c.service} ${c.status} ${c.phone||''}`.toLowerCase();
      return matchesFilter&&(!clientQuery||haystack.includes(clientQuery));
    });
  }
  function clientRowsOperational(list=visibleClients()) {
    return list.map(c=>`<div class="client-row ${selectedClient?.id===c.id?'is-selected':''} ${selectedClientIds.has(c.id)?'is-checked':''}" data-client-id="${c.id}">${clientSelectionMode?`<label class="client-check" title="Seleccionar chat"><input type="checkbox" data-client-check="${c.id}" ${selectedClientIds.has(c.id)?'checked':''}><span></span></label>`:''}<span class="client-avatar" style="background:${c.color}">${esc(c.initials)}</span><div><strong>${esc(c.name)}</strong><small>${esc(c.service)}</small></div><div class="client-row-status"><span class="status" style="--c:${statusColor(c.status)}">${esc(c.status)}</span><small>${esc(c.time||'')}</small></div></div>`).join('') || '<div class="empty-state">No se encontraron clientes.</div>';
  }

  function clientTimelineHtml(c, payment, job) {
    const entries = [];
    entries.push({at:null,who:c.name,text:`Consulta por ${c.service}.`,kind:'in'});
    state.activities.filter(a=>a.clientId===c.id).forEach(a=>entries.push({at:a.at,who:'CVStudio',text:`${a.title}: ${a.detail}`,kind:'out'}));
    if (payment && !entries.some(e=>e.text.includes('Pago'))) entries.push({at:payment.createdAt,who:'Administración',text:`Pago ${payment.status.toLowerCase()} · ${money(payment.amount)} · Mercado Pago (${payment.source||'canal no indicado'})`,kind:'out'});
    if (job && !entries.some(e=>e.text.includes('Trabajo'))) entries.push({at:job.completedAt||null,who:'Equipo CVStudio',text:`${job.stage} · ${job.progress}% · ${job.responsible}`,kind:'out'});
    return entries.sort((a,b)=>String(a.at||'').localeCompare(String(b.at||''))).map(e=>`<div class="message ${e.kind==='out'?'out':''}"><b>${esc(e.who)}</b><p>${esc(e.text)}</p><small>${e.at?formatDateTime(e.at):'Registro inicial'}</small></div>`).join('');
  }

  function scrollConversationToLatest() {
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      const messages=document.querySelector('.main-content[data-module="clientes"] .conversation .messages');
      if(messages) messages.scrollTop=messages.scrollHeight;
    }));
  }

  function formDataEntries(client){
    const data=client?.formData&&typeof client.formData==='object'?client.formData:{};
    return Object.entries(data).map(([key,item])=>{
      if(item&&typeof item==='object'&&!Array.isArray(item)) return {key,label:item.label||key,value:item.value||''};
      return {key,label:key,value:item||''};
    }).filter(item=>String(item.value||'').trim());
  }
  function clientFormSummaryHtml(client){
    const entries=formDataEntries(client);
    if(!entries.length) return `<div class="empty-state"><strong>Formulario todavía no recibido</strong><span>Cuando el cliente lo complete, sus datos aparecerán aquí y se habilitará la ficha para ChatGPT.</span></div>`;
    return `<div class="client-form-summary">${entries.map(item=>`<div class="fund-row"><span>${esc(item.label)}</span><b>${esc(item.value)}</b></div>`).join('')}</div>`;
  }
  function buildClientCopySheet(client){
    const entries=formDataEntries(client);
    const byKey=Object.fromEntries(entries.map(x=>[x.key,x.value]));
    const section=(title,keys)=>{const rows=keys.map(([key,label])=>[label,byKey[key]]).filter(([,v])=>String(v||'').trim());return rows.length?`\n${title}\n${rows.map(([l,v])=>`${l}: ${v}`).join('\n')}`:'';};
    return `FICHA DE CLIENTE CVSTUDIO\n\nSERVICIO CONTRATADO\n${client.service || 'Pendiente de definir'} — ${money(servicePrice(client.service))}\n\nDATOS PERSONALES\nNombre y apellido: ${client.name||''}\nNúmero de contacto: ${client.phone||''}\nCorreo: ${client.email||''}\nLocalidad: ${client.city||''}`+
      section('OBJETIVO LABORAL', [['puesto_objetivo','Puesto al que quiere postularse'],['linkedin','LinkedIn']])+
      section('EXPERIENCIA LABORAL', [['experiencia','Experiencias, puestos, períodos y tareas']])+
      section('FORMACIÓN Y ACREDITACIONES', [['educacion','Educación'],['cursos','Cursos'],['licencias','Licencias']])+
      section('INFORMACIÓN ADICIONAL', [['movilidad','Movilidad propia'],['observaciones','Observaciones']])+`

INSTRUCCIÓN PARA CHATGPT
Analizá integralmente el perfil del cliente. Redactá un CV profesional claro, convincente y compatible con ATS para el puesto objetivo. Priorizá las experiencias más relevantes, mejorá la redacción sin inventar información y entregá: Sobre mí, experiencias laborales optimizadas, formación, cursos, licencias, habilidades técnicas, competencias profesionales, palabras clave ATS y cierre.`;
  }
  function clientWorkspaceOperational() {
    const c = state.clients.find(x=>x.id===selectedClient?.id) || state.clients[0];
    if (!c) return '<section class="panel empty-client-workspace"><div class="empty-state empty-state-large"><strong>No hay clientes cargados</strong><span>Creá el primer cliente desde el botón “+ Nuevo cliente”.</span><button class="button primary" data-action="new-client">+ Nuevo cliente</button></div></section>';
    const price = servicePrice(c.service);
    const payment = state.payments.find(p=>p.clientId===c.id);
    const job = state.jobs.find(j=>j.clientId===c.id && j.stage!=='Entregado') || state.jobs.find(j=>j.clientId===c.id);
    const flowIndex = c.status==='Entregado'?5:payment?.status==='Confirmado'?(job?4:3):c.status==='Esperando pago'?3:2;
    const flow = ['Consulta','Formulario','Pago','Trabajo','Entrega'];
    return `<section class="panel client-summary clients-ui-compact-v1425"><div class="client-header"><span class="client-avatar" style="background:${c.color}">${esc(c.initials)}</span><div style="flex:1"><div class="client-name-line"><h2>${esc(c.name)}</h2><span class="status" style="--c:${statusColor(c.status)}">${esc(c.status)}</span></div><div class="meta"><span>${brand('whatsapp')} ${esc(c.phone)}</span><span>${icon('message')} ${esc(c.email)}</span><span>${icon('link')} ${esc(c.city||'Localidad no cargada')}</span><span>${icon('users')} Responsable: ${esc(c.responsible||'pablexe')}</span></div></div><button class="button secondary" data-action="edit-client">Editar datos</button></div><div class="flow">${flow.map((name,i)=>`<div class="flow-step ${i+1<flowIndex?'done':i+1===flowIndex?'active':''}">${i+1}. ${name}</div>`).join('')}</div></section>
    <section class="grid action-grid client-actions-single-row" aria-label="Acciones del cliente"><button class="action-card" data-action="open-whatsapp"><span>${brand('whatsapp')}</span>WhatsApp</button><button class="action-card" data-action="send-form"><span>${icon('file')}</span>Formulario</button><button class="action-card" data-action="signature-request"><span>${icon('file')}</span>Firma</button><button class="action-card" data-action="register-payment"><span>${icon('dollar')}</span>Pago</button><button class="action-card" data-action="change-status"><span>${icon('refresh')}</span>Estado</button><button class="action-card" data-action="deliver-work"><span>${icon('upload')}</span>Entregar</button><button class="action-card" data-action="copy-client-sheet"><span>${icon('file')}</span>Copiar ficha</button><button class="action-card" data-action="more-actions"><span>${icon('settings')}</span>Más</button></section>
    <section class="grid client-detail-grid"><section class="panel conversation"><div class="panel-head"><h2>Seguimiento</h2><span class="status" style="--c:${payment?.status==='Confirmado'?'#35d07f':'#ffb800'}">${payment?`Pago ${payment.status}`:'Sin pago'}</span></div><div class="messages">${clientTimelineHtml(c, payment, job)}</div><div class="composer"><input id="clientMessageInput" aria-label="Escribir nota" placeholder="Escribir mensaje de WhatsApp..."><button class="composer-send" data-action="send-message" aria-label="Guardar nota">${icon('upload')}</button></div></section>
    <section class="panel service-files"><div class="panel-head"><h2>Servicio y pago</h2></div><h3>${esc(c.service)}</h3><p class="muted-label">Precio configurado</p><h2>${money(price)}</h2><hr><div class="funds"><div class="fund-row"><span>Estado</span><b>${esc(payment?.status||'Sin registrar')}</b></div><div class="fund-row"><span>Importe</span><b>${payment?money(payment.amount):'—'}</b></div><div class="fund-row"><span>Origen</span><b>${esc(payment?.source||'—')}</b></div></div></section>
    <section class="panel client-form-panel client-form-third-column"><div class="panel-head"><div><h2>Formulario recibido</h2><p>Datos listos para revisar y copiar.</p></div><button class="button primary small" data-action="copy-client-sheet">Copiar ficha</button></div>${clientFormSummaryHtml(c)}</section></section>`;
  }

  function clientsRenderer() {
    const counts = status => state.clients.filter(c=>c.status===status).length;
    const bulk=clientSelectionMode?`<div class="client-bulk-bar"><label><input type="checkbox" data-client-select-all ${visibleClients().length&&visibleClients().every(c=>selectedClientIds.has(c.id))?'checked':''}> Todos</label><strong>${selectedClientIds.size} seleccionados</strong><button class="button secondary small" data-client-bulk="archive" ${selectedClientIds.size?'':'disabled'}>Archivar</button><button class="button danger small" data-client-bulk="delete" ${selectedClientIds.size?'':'disabled'}>Eliminar</button><button class="icon-action" data-client-selection-close title="Cerrar selección">×</button></div>`:'';
    return `<section class="grid clients-layout"><section class="panel client-list"><div class="client-list-head"><div class="panel-head"><h2>Clientes</h2><div class="client-head-actions"><button class="button secondary small" data-client-selection-toggle>${clientSelectionMode?'Cancelar':'Seleccionar'}</button><button class="button primary" data-action="new-client">+ Nuevo cliente</button></div></div>${bulk}<div class="search-box" style="width:100%"><span>${icon('search')}</span><input id="clientSearch" value="${esc(clientQuery)}" placeholder="Buscar cliente..."></div><div class="filters-row"><button class="filter-chip ${clientFilter==='Todos'?'is-active':''}" data-client-filter="Todos">Todos ${state.clients.length}</button><button class="filter-chip ${clientFilter==='En proceso'?'is-active':''}" data-client-filter="En proceso">En proceso ${counts('En proceso')}</button><button class="filter-chip ${clientFilter==='Esperando pago'?'is-active':''}" data-client-filter="Esperando pago">Esperando pago ${counts('Esperando pago')}</button><button class="filter-chip ${clientFilter==='Entregado'?'is-active':''}" data-client-filter="Entregado">Entregados ${counts('Entregado')}</button><button class="filter-chip ${clientFilter==='Archivado'?'is-active':''}" data-client-filter="Archivado">Archivados ${counts('Archivado')}</button></div></div><div class="client-rows" id="clientRows">${clientRowsOperational()}</div></section><section class="client-workspace" id="clientWorkspace">${clientWorkspaceOperational()}</section></section>`;
  }

  const baseTemplates=[['base-elegante','Elegante Minimalista','CV Profesional'],['base-azul','Moderno Azul','CV Profesional'],['base-beige','Profesional Beige','CV Profesional'],['base-claro','Creativo Claro','CV Profesional'],['base-dark','Premium Dark','CV Profesional'],['base-linkedin','LinkedIn Ejecutivo','LinkedIn'],['base-combo','Combo CV + LinkedIn','Combo'],['base-portfolio','Portfolio Fotografía','Portfolio']];
  const allTemplates=()=>[...baseTemplates.map(([id,name,category])=>({id,name,category,base:true,active:true})),...(state.templates||[])];
  function templateCardOperational(item,isCustom=false){
    return `<article class="panel template-card ${selectedTemplateId===item.id?'is-selected':''}" data-template-id="${esc(item.id)}" tabindex="0"><span class="template-select-mark">${selectedTemplateId===item.id?'✓':''}</span><div class="template-preview"><div class="cv-sheet"><div><div class="photo"></div><div class="cv-lines">${'<i></i>'.repeat(8)}</div></div><div><h4>${esc(item.name)}</h4><div class="cv-lines">${'<i></i>'.repeat(14)}</div></div></div></div><div class="template-meta"><strong>${esc(item.name)}</strong><small>${esc(item.category)}</small><div class="template-actions"><button class="button secondary small" data-template-preview="${esc(item.id)}">Ver</button>${isCustom?`<a class="button secondary small" href="${esc(item.url)}" target="_blank" rel="noopener">Canva</a>`:'<span class="template-base-label">Diseño base</span>'}</div></div></article>`;
  }
  function templatesRenderer(){
    const all=allTemplates();
    const count=category=>all.filter(item=>item.category===category).length;
    const visible=all.filter(item=>templateFilter==='Todas'||item.category===templateFilter);
    const selected=all.find(item=>item.id===selectedTemplateId);
    const actions=selected?`<div class="template-selection-bar"><span>${icon('check')} <b>${esc(selected.name)}</b></span><button class="button secondary small" data-template-preview="${esc(selected.id)}">Vista previa</button><button class="button primary small" data-template-assign="${esc(selected.id)}">Usar referencia</button>${selected.base?'':`<button class="button danger small" data-template-delete="${esc(selected.id)}">Eliminar</button>`}</div>`:'';
    return `<section class="grid kpi-grid">${kpi('layers','Total plantillas',all.length,'plantillas activas','#ffd23f')}${kpi('file','CV Profesionales',count('CV Profesional'),'diseños aprobados','#35d07f')}${kpi('link','LinkedIn',count('LinkedIn'),'plantillas','#3b82f6')}${kpi('layers','Combos',count('Combo'),'plantillas','#9b5de5')}${kpi('file','Portfolios',count('Portfolio'),'plantillas','#ff8a1f')}</section><section class="panel template-library-panel"><div class="panel-head"><div><h2>Biblioteca de plantillas</h2></div><button class="button primary" data-action="new-template">+ Nueva plantilla</button></div><div class="template-toolbar"><div class="filters-row">${[['Todas','Todas'],['CV Profesional','CV Profesionales'],['LinkedIn','LinkedIn'],['Combo','Combos'],['Portfolio','Portfolios']].map(([key,label])=>`<button class="filter-chip ${templateFilter===key?'is-active':''}" data-template-filter="${key}">${label} ${key==='Todas'?all.length:count(key)}</button>`).join('')}</div>${actions}</div><div class="grid template-grid">${visible.map(item=>templateCardOperational(item,!item.base)).join('')}</div></section>`;
  }

  const FILE_BUCKET='cvstudio-archivos';
  const FILE_TABLE='cvstudio_archivos_centro';
  const FILE_CATEGORIES={todos:'Todos',institucional:'Institucional',clientes:'Clientes',plantillas:'Plantillas',marketing:'Marketing',administracion:'Administración',otros:'Otros',papelera:'Papelera'};
  const fileSize=value=>{const n=Number(value||0);if(n<1024)return `${n} B`;if(n<1048576)return `${(n/1024).toFixed(1)} KB`;return `${(n/1048576).toFixed(1)} MB`;};
  const safeFileName=name=>String(name||'archivo').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9._-]+/g,'-').replace(/^-+|-+$/g,'').slice(-120)||'archivo';
  async function loadFiles(force=false){
    if(filesLoading||(!force&&filesLoaded))return;
    filesLoading=true;
    try{
      const db=window.cvstudioSupabase;
      if(!db)throw new Error('Supabase no está disponible.');
      const {data,error}=await db.from(FILE_TABLE).select('*').order('created_at',{ascending:false}).limit(500);
      if(error)throw error;
      filesCache=data||[];filesLoaded=true;
    }catch(error){filesLoaded=true;console.error('[CVStudio Archivos]',error);toast(`Archivos: ${error.message}`);}finally{
      filesLoading=false;
      if(currentModule==='archivos')openModule('archivos');
    }
  }
  function visibleFiles(){
    return filesCache.filter(file=>{
      const inTrash=Boolean(file.deleted_at);
      const categoryOk=filesFilter==='papelera'?inTrash:!inTrash&&(filesFilter==='todos'||file.categoria===filesFilter);
      return categoryOk&&(!filesQuery||`${file.nombre} ${file.categoria} ${file.uploaded_by_email||''}`.toLowerCase().includes(filesQuery));
    });
  }
  function filesRenderer(){
    if(!filesLoading&&!filesLoaded)setTimeout(()=>loadFiles(),0);
    const active=filesCache.filter(f=>!f.deleted_at),trash=filesCache.filter(f=>f.deleted_at),shown=visibleFiles();
    const bytes=active.reduce((sum,f)=>sum+Number(f.tamano||0),0),images=active.filter(f=>/^image\//.test(f.mime_type||'')).length,docs=active.length-images;
    const rows=shown.map(file=>`<tr class="${selectedFileIds.has(file.id)?'is-selected':''}"><td><input type="checkbox" data-file-check="${file.id}" ${selectedFileIds.has(file.id)?'checked':''}></td><td><b>${esc(file.nombre)}</b></td><td>${esc(FILE_CATEGORIES[file.categoria]||file.categoria)}</td><td><span class="status" style="--c:#3b82f6">${esc((file.nombre.split('.').pop()||'FILE').toUpperCase())}</span></td><td>${fileSize(file.tamano)}</td><td>${esc((file.uploaded_by_email||'equipo').split('@')[0])}</td><td>${new Intl.DateTimeFormat('es-AR',{day:'2-digit',month:'2-digit',year:'2-digit'}).format(new Date(file.created_at))}</td><td><div class="file-row-actions">${file.deleted_at?`<button class="icon-action" data-file-restore="${file.id}" title="Restaurar">${icon('refresh')}</button>`:`<button class="icon-action" data-file-open="${file.id}" title="Abrir o descargar">${icon('eye')}</button><button class="icon-action" data-file-edit="${file.id}" title="Renombrar o mover">${icon('settings')}</button><button class="icon-action" data-file-trash="${file.id}" title="Mover a papelera">×</button>`}</div></td></tr>`).join('');
    return `<section class="files-toolbar panel"><div class="files-kpis"><span><small>Archivos</small><b>${active.length}</b></span><span><small>Imágenes</small><b>${images}</b></span><span><small>Documentos</small><b>${docs}</b></span><span><small>Almacenado</small><b>${fileSize(bytes)}</b></span><span><small>Papelera</small><b>${trash.length}</b></span></div><div class="files-actions"><button class="button secondary" data-files-refresh>${icon('refresh')} Actualizar</button><button class="button primary" data-file-upload>+ Subir archivo</button></div></section><section class="panel files-center"><div class="files-filterbar"><div class="filters-row">${Object.entries(FILE_CATEGORIES).map(([key,label])=>`<button class="filter-chip ${filesFilter===key?'is-active':''}" data-files-filter="${key}">${label}${key==='papelera'?` ${trash.length}`:''}</button>`).join('')}</div><div class="search-box"><span>${icon('search')}</span><input id="filesSearch" value="${esc(filesQuery)}" placeholder="Buscar archivo..."></div>${selectedFileIds.size?`<div class="files-selection"><b>${selectedFileIds.size}</b><button class="button danger small" data-files-trash-selected>Enviar a papelera</button></div>`:''}</div><div class="files-table-wrap"><table class="data-table files-table"><thead><tr><th><input type="checkbox" data-files-check-all ${shown.length&&shown.every(f=>selectedFileIds.has(f.id))?'checked':''}></th><th>Nombre</th><th>Carpeta</th><th>Tipo</th><th>Tamaño</th><th>Subido por</th><th>Fecha</th><th></th></tr></thead><tbody>${rows||`<tr><td colspan="8"><div class="empty-state"><strong>${filesLoading?'Cargando archivos…':'Todavía no hay archivos en esta vista'}</strong><span>Usá “Subir archivo” para guardar el primer documento real.</span></div></td></tr>`}</tbody></table></div></section>`;
  }
  function openFileUploadModal(client=null){
    const clientOptions=state.clients.map(c=>`<option value="${c.id}" ${client?.id===c.id?'selected':''}>${esc(c.name)}</option>`).join('');
    openModal(`<h2 id="modalTitle">Subir archivos</h2><form id="fileUploadForm" class="form-grid"><label>Carpeta<select name="category"><option value="institucional">Institucional</option><option value="clientes" ${client?'selected':''}>Clientes</option><option value="plantillas">Plantillas</option><option value="marketing">Marketing</option><option value="administracion">Administración</option><option value="otros">Otros</option></select></label><label>Asociar a cliente<select name="clientId"><option value="">Sin asociación</option>${clientOptions}</select></label><label class="span-2 file-drop"><input type="file" name="files" multiple required accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.zip,.txt"><span>${icon('upload')}</span><b>Seleccionar documentos</b><small>PDF, Office, imágenes o ZIP · máximo 50 MB por archivo</small></label><div class="file-selection-preview span-2" id="fileSelectionPreview" hidden></div><div class="upload-progress span-2" id="fileUploadProgress" hidden><i></i><span>Preparando…</span></div><div class="modal-actions span-2"><button type="button" class="button secondary" data-close-modal>Cancelar</button><button class="button primary" type="submit">Guardar en CVStudio</button></div></form>`);
    const form=document.getElementById('fileUploadForm');
    const picker=form.elements.files,selection=document.getElementById('fileSelectionPreview');
    picker.onchange=()=>{const chosen=[...picker.files];selection.hidden=!chosen.length;selection.innerHTML=chosen.map((file,index)=>`<div><span>${icon('file')}<b>${esc(file.name)}</b><small>${fileSize(file.size)}</small></span>${/^(application\/pdf|image\/)/.test(file.type)?`<button class="button secondary small" type="button" data-local-file-preview="${index}">${icon('eye')} Previsualizar</button>`:''}</div>`).join('');selection.querySelectorAll('[data-local-file-preview]').forEach(button=>button.onclick=()=>{const file=chosen[Number(button.dataset.localFilePreview)],url=URL.createObjectURL(file);window.open(url,'_blank','noopener');setTimeout(()=>URL.revokeObjectURL(url),60000);});};
    form.onsubmit=async event=>{event.preventDefault();const data=new FormData(form),files=[...form.elements.files.files];if(!files.length)return toast('Seleccioná al menos un archivo.');const target=state.clients.find(c=>String(c.id)===String(data.get('clientId')))||client;await uploadFiles(files,String(data.get('category')),target,form);};
  }
  async function uploadFiles(files,category='otros',client=null,form=null){
    const db=window.cvstudioSupabase;if(!db)return toast('Supabase no está disponible.');
    const submit=form?.querySelector('[type="submit"]'),progress=form?.querySelector('#fileUploadProgress');if(submit)submit.disabled=true;if(progress)progress.hidden=false;
    let completed=0;
    try{
      for(const file of files){
        if(file.size>52428800)throw new Error(`${file.name} supera el límite de 50 MB.`);
        const id=crypto.randomUUID(),folder=category==='clientes'&&client?`clientes/${client.id}`:category,path=`${folder}/${id}-${safeFileName(file.name)}`;
        if(progress)progress.querySelector('span').textContent=`Subiendo ${file.name} (${completed+1}/${files.length})…`;
        const upload=await db.storage.from(FILE_BUCKET).upload(path,file,{cacheControl:'3600',upsert:false,contentType:file.type||'application/octet-stream'});if(upload.error)throw upload.error;
        const row={id,bucket_id:FILE_BUCKET,object_path:path,nombre:file.name,categoria:category,cliente_id:client?String(client.id):null,solicitud_id:client?.realRequestId||null,mime_type:file.type||'application/octet-stream',tamano:file.size};
        const meta=await db.from(FILE_TABLE).insert(row).select().single();
        if(meta.error){await db.storage.from(FILE_BUCKET).remove([path]);throw meta.error;}
        filesCache.unshift(meta.data);completed++;
      }
      if(client){client.files=client.files||[];filesCache.filter(f=>f.cliente_id===String(client.id)).forEach(f=>{if(!client.files.some(x=>x.storageId===f.id))client.files.push({storageId:f.id,name:f.nombre,size:f.tamano,type:f.mime_type,addedAt:f.created_at});});addActivity('client','Archivos respaldados',`${client.name} · ${completed} archivo(s)`,client.id);saveState();}
      closeModal();toast(`${completed} archivo(s) guardados en Supabase.`);openModule(currentModule);
    }catch(error){console.error('[CVStudio upload]',error);toast(`No se completó la carga: ${error.message}`);if(submit)submit.disabled=false;}
  }
  async function downloadFileRecord(file){
    const result=await window.cvstudioSupabase.storage.from(FILE_BUCKET).download(file.object_path);if(result.error)throw result.error;const url=URL.createObjectURL(result.data);window.open(url,'_blank','noopener');setTimeout(()=>URL.revokeObjectURL(url),60000);
  }
  async function trashFileRecord(file){
    const nextPath=`papelera/${file.id}/${safeFileName(file.nombre)}`;const storage=window.cvstudioSupabase.storage.from(FILE_BUCKET);const moved=await storage.move(file.object_path,nextPath);if(moved.error)throw moved.error;const updated=await window.cvstudioSupabase.from(FILE_TABLE).update({object_path:nextPath,categoria:'papelera',deleted_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',file.id).select().single();if(updated.error)throw updated.error;filesCache=filesCache.map(f=>f.id===file.id?updated.data:f);
  }
  async function restoreFileRecord(file){
    const category='otros',nextPath=`otros/${file.id}-${safeFileName(file.nombre)}`;const storage=window.cvstudioSupabase.storage.from(FILE_BUCKET);const moved=await storage.move(file.object_path,nextPath);if(moved.error)throw moved.error;const updated=await window.cvstudioSupabase.from(FILE_TABLE).update({object_path:nextPath,categoria:category,deleted_at:null,updated_at:new Date().toISOString()}).eq('id',file.id).select().single();if(updated.error)throw updated.error;filesCache=filesCache.map(f=>f.id===file.id?updated.data:f);
  }

  function integrationDefinitions(){
    const real=state._integrationStatus||{};
    return [
      {id:'supabase',name:'Supabase',type:'Base de datos y autenticación',detail:'Proyecto cvstudio-core',status:integrationHealth?.supabase||'checking',brand:'supabase'},
      {id:'storage',name:'Supabase Storage',type:'Archivos privados',detail:'Bucket cvstudio-archivos',status:integrationHealth?.storage||'checking',brand:'supabase'},
      {id:'mercadopago',name:'Mercado Pago',type:'Pagos y servicios',detail:real.paymentsDetail||'Verificación disponible',status:real.payments||'checking',brand:'mercadopago'},
      {id:'whatsapp',name:'WhatsApp Business',type:'Mensajería operativa',detail:'Envío mediante Worker',status:real.whatsapp||'configured',brand:'whatsapp'},
      {id:'resend',name:'Resend',type:'Correo transaccional',detail:'Historial de comunicaciones',status:real.resend||'configured',brand:'resend'},
      {id:'portfolio',name:'Cloudflare',type:'Espacios de clientes',detail:real.portfoliosDetail||'Verificación disponible',status:real.portfolios||'checking',brand:'cloudflare'},
      {id:'facebook',name:'Facebook',type:'Campañas y página',detail:'Meta Marketing API pendiente',status:real.facebook||'pending',brand:'facebook',setup:'https://business.facebook.com/settings/'},
      {id:'instagram',name:'Instagram',type:'Cuenta profesional',detail:'Meta Business pendiente',status:real.instagram||'pending',brand:'instagram',setup:'https://business.facebook.com/settings/'},
      {id:'canva',name:'Canva',type:'Diseño y plantillas',detail:real.canvaDetail||'OAuth pendiente de vinculación',status:real.canva||'pending',brand:'canva'},
      {id:'mercadolibre',name:'Mercado Libre',type:'Marketplace',detail:'OAuth pendiente',status:real.mercadolibre||'pending',brand:'mercadolibre',setup:'https://developers.mercadolibre.com.ar/'},
      {id:'analytics',name:'Google Analytics 4',type:'Analítica web',detail:'Configuración del sitio',status:real.analytics||'configured',brand:'googleanalytics'},
      {id:'chatgpt',name:'ChatGPT',type:'Redacción asistida',detail:'API de OpenAI pendiente',status:real.chatgpt||'pending',brand:'openai',setup:'https://platform.openai.com/api-keys'},
      {id:'linkedin',name:'LinkedIn',type:'Perfiles profesionales',detail:'OAuth pendiente',status:real.linkedin||'pending',brand:'linkedin',setup:'https://www.linkedin.com/developers/apps'}
    ];
  }
  const integrationMeta=status=>({connected:['Conectado','#35d07f'],configured:['Configurado','#3b82f6'],pending:['Pendiente','#ffd23f'],error:['Error','#ff5d73'],checking:['Verificando…','#28c2d8']})[status]||['Pendiente','#ffd23f'];
  function integrationsRenderer(){
    const items=integrationDefinitions(),connected=items.filter(x=>x.status==='connected').length,pending=items.filter(x=>x.status==='pending'||x.status==='configured'||x.status==='checking').length,errors=items.filter(x=>x.status==='error').length;
    return `<section class="panel integrations-compact"><div class="panel-head"><div><h2>Integraciones reales</h2></div><button class="button primary" data-integrations-test>${icon('refresh')} Verificar todas</button></div><div class="integration-summary"><span><b>${connected}</b> conectadas</span><span><b>${pending}</b> por verificar/configurar</span><span class="${errors?'has-errors':''}"><b>${errors}</b> errores</span><small>Última lectura: ${state._realSync?.at?formatDateTime(state._realSync.at):'sin registro'}</small></div><div class="integration-grid-real">${items.map(item=>{const [label,color]=integrationMeta(item.status),action=item.status==='pending'?'Vincular':item.status==='configured'?'Revisar':'Probar';return `<article class="integration-card-real"><span class="integration-brand">${brand(item.brand)}</span><div><strong>${esc(item.name)}</strong><small>${esc(item.type)}</small><p>${esc(item.detail)}</p></div><span class="status" style="--c:${color}">${label}</span><button class="button secondary small" data-integration-test="${item.id}">${action}</button></article>`;}).join('')}</div></section>`;
  }
  async function testIntegrations(){
    integrationHealth={supabase:'checking',storage:'checking'};openModule('integraciones');
    const db=window.cvstudioSupabase;
    if(!db){integrationHealth={supabase:'error',storage:'error'};openModule('integraciones');return;}
    const [database,storage]=await Promise.all([db.from('cvstudio_ops_stage_meta').select('id').limit(1),db.storage.from(FILE_BUCKET).list('',{limit:1})]);
    integrationHealth={supabase:database.error?'error':'connected',storage:storage.error?'error':'connected'};
    try{
      await window.CVStudioRealBridge?.loadReal?.();state=loadState();
      const canva=await window.CVStudioRealBridge?.canvaStatus?.();
      state._integrationStatus=state._integrationStatus||{};
      state._integrationStatus.canva=canva?.connected?'connected':canva?.configured?'pending':'configured';
      state._integrationStatus.canvaDetail=canva?.connected?'Cuenta y tokens verificados':canva?.configured?'Lista para autorizar':'Faltan credenciales en Cloudflare';
      saveState();
    }catch(error){console.error('[CVStudio integrations]',error);}
    openModule('integraciones');toast(database.error||storage.error?'La verificación detectó puntos pendientes.':'Integraciones principales verificadas.');
  }



  function adminRenderer() {
    const revenue = totalRevenue();
    const r = state.rules;
    const allocations = {
      company: revenue*r.company/100,
      colab: revenue*r.colab/100,
      growth: revenue*r.growth/100,
      reserve: revenue*r.reserve/100
    };
    const growthAvailable = Math.max(0, allocations.growth-totalExpenses());
    const collaboratorRows = {};
    (state.executions||[]).forEach(e=>{
      const key=e.responsible;
      if(!collaboratorRows[key]) collaboratorRows[key]={jobs:0,generated:0,commission:0};
      collaboratorRows[key].jobs++;
      collaboratorRows[key].generated+=Number(e.baseAmount||0);
      collaboratorRows[key].commission+=Number(e.commissionAmount||0);
    });
    return `<section class="grid kpi-grid">${kpi('dollar','Ingresos confirmados',money(revenue),'desde pagos registrados','#35d07f')}${kpi('wallet','Disponible empresa',money(allocations.company),`${r.company}% de ingresos`,'#3b82f6')}${kpi('briefcase','Trabajos entregados',state.jobs.filter(j=>j.stage==='Entregado').length,'ejecuciones registradas','#9b5de5')}${kpi('users','Clientes',state.clients.length,'registros actuales','#ff8a1f')}${kpi('chart','Caja publicidad',money(growthAvailable),'asignado menos gastos','#ffd23f')}</section><section class="grid admin-grid">
      ${panel('Distribución automática de ingresos',`<div class="donut-wrap">${donutChart(money(revenue).replace('$ ','$'),'Total',`background:conic-gradient(#35d07f 0 ${r.company}%,#3b82f6 ${r.company}% ${r.company+r.growth}%,#9b5de5 ${r.company+r.growth}% ${r.company+r.growth+r.colab}%,#ffd23f ${r.company+r.growth+r.colab}% 100%)`)}<div class="legend"><span style="--c:#35d07f"><i></i>Empresa ${r.company}% · ${money(allocations.company)}</span><span style="--c:#3b82f6"><i></i>Crecimiento ${r.growth}% · ${money(allocations.growth)}</span><span style="--c:#9b5de5"><i></i>Colaboradores ${r.colab}% · ${money(allocations.colab)}</span><span style="--c:#ffd23f"><i></i>Reserva ${r.reserve}% · ${money(allocations.reserve)}</span></div></div>`)}
      ${panel('Fondos y disponibilidad',`<div class="funds"><div class="fund-row"><span>Disponible Empresa</span><b>${money(allocations.company)}</b></div><div class="fund-row"><span>Fondo de Colaboradores</span><b>${money(allocations.colab)}</b></div><div class="fund-row"><span>Fondo de Crecimiento</span><b>${money(growthAvailable)}</b></div><div class="fund-row"><span>Reserva de Seguridad</span><b>${money(allocations.reserve)}</b></div></div>`)}
      ${panel('Configuración de distribución',`<div class="slider-row" style="--c:#9b5de5"><span>Colaboradores</span><input data-fund="colab" type="range" min="0" max="40" value="${r.colab}"><b id="colabValue">${r.colab}%</b></div><div class="slider-row" style="--c:#3b82f6"><span>Fondo de Crecimiento</span><input data-fund="growth" type="range" min="0" max="40" value="${r.growth}"><b id="growthValue">${r.growth}%</b></div><div class="slider-row" style="--c:#ffd23f"><span>Reserva</span><input data-fund="reserve" type="range" min="0" max="20" value="${r.reserve}"><b id="reserveValue">${r.reserve}%</b></div><div class="slider-row" style="--c:#35d07f"><span>Empresa</span><input data-fund="company" type="range" min="20" max="100" value="${r.company}"><b id="companyValue">${r.company}%</b></div><p class="rules-total">Total: <strong id="rulesTotal">100%</strong></p><button class="button primary" data-action="save-funds">Guardar cambios</button>`)}
      <section class="admin-lower-grid span-3">
        <section class="panel admin-chart-panel"><div class="panel-head"><div><h2>Ingresos y egresos</h2><p>${confirmedPayments().length} pagos confirmados · ${state.expenses.length} gastos</p></div><button class="button secondary small" data-action="register-expense">Registrar gasto</button></div>${lineSvg(['#35d07f','#ff5d73','#3b82f6'])}</section>
        <section class="panel admin-operations-panel">
          <div class="admin-compact-section"><div class="panel-head"><h2>Movimientos recientes</h2><button class="button secondary small" data-action="register-payment">Registrar pago</button></div><table class="data-table"><tr><th>Tipo</th><th>Detalle</th><th>Monto</th></tr>${[...confirmedPayments().map(p=>({type:'Ingreso',detail:`${p.client} · ${p.service} · ${p.paymentMethod||'Mercado Pago'}`,amount:p.amount})),...state.expenses.map(e=>({type:'Egreso',detail:e.description,amount:-e.amount}))].slice(-3).reverse().map(m=>`<tr><td>${m.type}</td><td>${esc(m.detail)}</td><td class="${m.amount<0?'negative':'positive'}">${m.amount<0?'-':''}${money(Math.abs(m.amount))}</td></tr>`).join('')||'<tr><td colspan="3">Sin movimientos registrados</td></tr>'}</table></div>
          <div class="admin-compact-section admin-services-section"><div class="panel-head"><h2>Servicios y precios</h2><button class="button primary small" data-action="edit-prices">Editar precios</button></div><div class="admin-price-grid">${Object.entries(state.prices).slice(0,7).map(([name,value])=>`<div><span>${esc(name)}</span><b>${money(value)}</b></div>`).join('')}</div></div>
          <div class="admin-compact-section"><div class="panel-head"><h2>Colaboradores y comisiones</h2></div><div class="admin-collab-grid">${Object.entries(collaboratorRows).map(([name,row])=>`<div><span>${esc(name)} · ${row.jobs} trabajos</span><b>${money(row.commission)}</b></div>`).join('') || '<div><span>Sin ejecuciones entregadas</span><b>—</b></div>'}</div></div>
        </section>
      </section>
    </section>`;
  }


  function marketingOperationalRenderer() {
    const confirmed = confirmedPayments(), revenue = totalRevenue();
    const byChannel = {}; confirmed.forEach(p=>{const k=p.source||'Sin identificar';byChannel[k]=(byChannel[k]||0)+Number(p.amount||0)});
    const channels=Object.entries(byChannel).sort((a,b)=>b[1]-a[1]);
    const budget=revenue*Number(state.rules.growth||0)/100, spent=totalExpenses(), available=Math.max(0,budget-spent);
    const today=localDateKey(new Date()),manualCampaigns=calendarItems().filter(item=>item.type==='campaign'&&item.startDate<=today&&(item.endDate||item.startDate)>=today&&!['Completada','Cancelada'].includes(item.status));
    const metaCampaigns=Array.isArray(state.metaCampaigns)?state.metaCampaigns:[],campaigns=[...metaCampaigns,...manualCampaigns.map(item=>({...item,source:'Calendario',budget:itemTotal(item)}))];
    const campaignCards=campaigns.map(item=>{const source=String(item.platform||item.channel||item.title||'').toLowerCase(),network=source.includes('instagram')?'instagram':'facebook';return `<article class="marketing-campaign-card"><span>${brand(network)}</span><div><strong>${esc(item.name||item.title)}</strong><small>${esc(item.source||'Meta Ads')} · ${dateLabel(item.startDate||item.start_time)}${item.endDate||item.stop_time?` → ${dateLabel(item.endDate||item.stop_time)}`:''}</small></div><b>${money(item.budget||item.totalBudget||item.spend||0)}</b><i>${esc(item.status||item.effective_status||'Activa')}</i></article>`;}).join('');
    return `<section class="grid kpi-grid">${kpi('chart','Inversión registrada',money(spent),`${state.expenses.length} movimientos`,'#3b82f6')}${kpi('megaphone','Campañas activas',campaigns.length,metaCampaigns.length?'Meta Ads + calendario':'registradas en calendario','#35d07f')}${kpi('file','Ventas generadas',confirmed.length,'pagos confirmados','#9b5de5')}${kpi('dollar','Ingreso promedio',confirmed.length?money(revenue/confirmed.length):money(0),'por venta confirmada','#ff8a1f')}${kpi('wallet','Fondo disponible',money(available),'crecimiento menos gastos','#28c2d8')}</section><section class="grid marketing-grid">${panel('Caja publicitaria · Fondo de Crecimiento',`<div class="donut-wrap">${donutChart(budget?Math.round(spent/budget*100)+'%':'0%','Ejecutado')}<div class="legend"><span><b>Asignado:</b> ${money(budget)}</span><span><b>Gastado:</b> ${money(spent)}</span><span><b>Disponible:</b> ${money(available)}</span></div></div>`)}<section class="panel span-2"><div class="panel-head"><div><h2>Inversión y resultados</h2><p>Movimientos reales de marketing y ventas.</p></div></div>${spent||confirmed.length?lineSvg():`<div class="empty-state empty-state-large"><strong>Sin datos suficientes</strong><span>Registrá gastos publicitarios y pagos confirmados.</span></div>`}</section>${panel('Rendimiento por canal',channels.length?`<div class="channel-grid">${channels.map(([name,val])=>`<div class="channel-card"><strong>${esc(name)}</strong><span>${confirmed.filter(p=>(p.source||'Sin identificar')===name).length} ventas</span><b>${money(val)}</b></div>`).join('')}</div>`:`<div class="empty-state empty-state-large"><strong>Sin canales medidos</strong><span>El origen aparecerá al confirmar pagos.</span></div>`)}${panel('Campañas activas',campaignCards||`<div class="empty-state empty-state-large"><strong>Sin campañas activas</strong><span>Creá una en Calendario o vinculá Meta Ads.</span></div>`)}${panel('Creatividades recientes',`<div class="empty-state empty-state-large"><strong>Sin creatividades registradas</strong><span>Podés asociarlas al cargar archivos de Marketing.</span></div>`)}</section>`;
  }
  const calendarTypeMeta={
    campaign:{label:'Campaña publicitaria',color:'#3b82f6',icon:'megaphone'},
    delivery:{label:'Entrega',color:'#35d07f',icon:'check'},
    task:{label:'Tarea interna',color:'#9b5de5',icon:'briefcase'},
    publication:{label:'Publicación en redes',color:'#e1306c',icon:'upload'},
    followup:{label:'Seguimiento de cliente',color:'#28c2d8',icon:'message'},
    reminder:{label:'Recordatorio',color:'#ffb800',icon:'clock'}
  };
  let calendarCursor=new Date(new Date().getFullYear(),new Date().getMonth(),1);
  const localDateKey=date=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  const parseLocalDate=value=>{const [year,month,day]=String(value||'').split('-').map(Number);return new Date(year,month-1,day);};
  const dateLabel=value=>value?new Intl.DateTimeFormat('es-AR',{day:'2-digit',month:'short',year:'numeric'}).format(parseLocalDate(String(value).slice(0,10))).replace('.',''):'—';
  const calendarItems=()=>Array.isArray(state.calendarItems)?state.calendarItems:[];
  const itemTotal=item=>item.type==='campaign'?(Number(item.totalBudget)||Number(item.dailyBudget||0)*Math.max(1,Math.round((parseLocalDate(item.endDate)-parseLocalDate(item.startDate))/86400000)+1)):Number(item.totalBudget||0);
  function calendarMonthEvents(year,month){
    const first=localDateKey(new Date(year,month,1)),last=localDateKey(new Date(year,month+1,0));
    const manual=calendarItems().filter(item=>item.startDate<=last&&(item.endDate||item.startDate)>=first).map(item=>({...item,source:'manual'}));
    const jobs=state.jobs.filter(job=>job.due&&job.due>=first&&job.due<=last).map(job=>({id:`job-${job.id}`,title:`${job.client} · ${job.service}`,type:'delivery',startDate:job.due,endDate:job.due,status:job.stage,notes:`Responsable: ${job.responsible}`,source:'job'}));
    return [...manual,...jobs].sort((a,b)=>String(a.startDate).localeCompare(String(b.startDate)));
  }
  function fullMonthCalendar(events,year,month){
    const first=new Date(year,month,1),days=new Date(year,month+1,0).getDate(),leading=(first.getDay()+6)%7,today=localDateKey(new Date());
    const cells=[];
    for(let i=0;i<leading;i++)cells.push('<div class="calendar-day is-outside"></div>');
    for(let day=1;day<=days;day++){
      const key=localDateKey(new Date(year,month,day));
      const dayEvents=events.filter(item=>item.startDate<=key&&(item.endDate||item.startDate)>=key);
      cells.push(`<div class="calendar-day ${key===today?'is-today':''}" data-calendar-day="${key}"><b>${day}</b>${dayEvents.slice(0,3).map(item=>{const meta=calendarTypeMeta[item.type]||calendarTypeMeta.reminder;return `<button class="cal-event" type="button" style="--c:${meta.color}" ${item.source==='manual'?`data-calendar-item="${item.id}"`:''} title="${esc(item.title)}">${esc(item.title)}</button>`}).join('')}${dayEvents.length>3?`<small class="calendar-more">+${dayEvents.length-3} más</small>`:''}</div>`);
    }
    while(cells.length<42)cells.push('<div class="calendar-day is-outside"></div>');
    return `<div class="calendar calendar-functional">${['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map(name=>`<div class="day-name">${name}</div>`).join('')}${cells.join('')}</div>`;
  }
  function calendarOperationalRenderer() {
    const year=calendarCursor.getFullYear(),month=calendarCursor.getMonth(),events=calendarMonthEvents(year,month),manual=events.filter(e=>e.source==='manual');
    const campaigns=manual.filter(e=>e.type==='campaign'&&e.status==='Activa'),pending=manual.filter(e=>!['Completada','Cancelada'].includes(e.status)),completed=manual.filter(e=>e.status==='Completada');
    const investment=manual.filter(e=>e.type==='campaign').reduce((sum,e)=>sum+itemTotal(e),0);
    const monthTitle=new Intl.DateTimeFormat('es-AR',{month:'long',year:'numeric'}).format(calendarCursor).replace(/^./,letter=>letter.toUpperCase());
    const today=localDateKey(new Date()),upcoming=events.filter(e=>(e.endDate||e.startDate)>=today).slice(0,8);
    return `<section class="grid kpi-grid">${kpi('calendar','Actividades del mes',manual.length,'carga manual y proyectos','#9b5de5')}${kpi('megaphone','Campañas activas',campaigns.length,'publicidad en ejecución','#35d07f')}${kpi('clock','Pendientes',pending.length,'requieren seguimiento','#ff8a1f')}${kpi('check','Completadas',completed.length,'durante el mes','#3b82f6')}${kpi('wallet','Inversión planificada',money(investment),'presupuesto de campañas','#ffd23f')}</section><section class="grid calendar-layout calendar-operational-layout"><section class="panel"><div class="panel-head calendar-main-head"><div><h2>${esc(monthTitle)}</h2><p>Campañas, entregas, tareas y recordatorios de CVStudio.</p></div><div class="calendar-head-actions"><button class="button secondary small" data-calendar-nav="prev" aria-label="Mes anterior">‹</button><button class="button secondary small" data-calendar-nav="today">Hoy</button><button class="button secondary small" data-calendar-nav="next" aria-label="Mes siguiente">›</button><button class="button primary" data-action="new-calendar-item">+ Nueva actividad</button></div></div><div class="calendar-wrap">${fullMonthCalendar(events,year,month)}</div></section><aside class="grid calendar-aside"><section class="panel"><div class="panel-head"><div><h2>Próximas actividades</h2><p>${upcoming.length} programadas</p></div></div>${upcoming.length?`<div class="calendar-upcoming">${upcoming.map(item=>{const meta=calendarTypeMeta[item.type]||calendarTypeMeta.reminder;return `<button type="button" class="calendar-upcoming-item" ${item.source==='manual'?`data-calendar-item="${item.id}"`:''}><i style="--c:${meta.color}"></i><span><strong>${esc(item.title)}</strong><small>${dateLabel(item.startDate)}${item.endDate&&item.endDate!==item.startDate?` → ${dateLabel(item.endDate)}`:''} · ${esc(item.status||meta.label)}</small></span></button>`}).join('')}</div>`:`<div class="empty-state"><strong>Sin actividades próximas</strong><span>Creá una desde el botón superior.</span></div>`}</section><section class="panel"><div class="panel-head"><h2>Tipos de actividad</h2></div><div class="calendar-legend">${Object.values(calendarTypeMeta).map(meta=>`<span><i style="--c:${meta.color}"></i>${meta.label}</span>`).join('')}</div></section></aside></section>`;
  }

  function collaboratorPresence(c) {
    const last = Date.parse(c.lastSeen || 0);
    const age = Number.isFinite(last) ? Date.now() - last : Infinity;
    if (c.presenceStatus === 'online' && age < 2 * 60 * 1000) return {key:'online',label:'En línea'};
    if ((c.presenceStatus === 'away' || age < 10 * 60 * 1000) && age < 10 * 60 * 1000) return {key:'away',label:'Ausente'};
    return {key:'offline',label:'Desconectado'};
  }
  function corporateEmailFromName(name) {
    const base=String(name||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      .replace(/[^a-z0-9]+/g,'.').replace(/^\.+|\.+$/g,'').replace(/\.{2,}/g,'.');
    if(!base) return '';
    let candidate=`${base}@cvstudio.com.ar`, n=2;
    const used=new Set((state.collaborators||[]).map(c=>String(c.email||'').toLowerCase()));
    while(used.has(candidate)) candidate=`${base}${n++}@cvstudio.com.ar`;
    return candidate;
  }
  function collaboratorsOperationalRenderer() {
    const collaborators = Array.isArray(state.collaborators) ? state.collaborators : [];
    const roleCount = new Set(collaborators.map(c=>c.role).filter(Boolean)).size;
    const active = collaborators.filter(c=>c.status==='Activo');
    const pending = collaborators.filter(c=>c.authStatus!=='Activo').length;
    const rows=collaborators.map(c=>{
      const jobs=state.jobs.filter(j=>j.responsible===c.name), ex=(state.executions||[]).filter(e=>e.responsible===c.name);
      const presence=collaboratorPresence(c);
      return `<div class="collab-row"><span class="collab-avatar-wrap" title="${presence.label}"><span class="client-avatar" style="background:#9b5de5">${initials(c.name)}</span><i class="presence-led ${presence.key}"></i></span><div class="collab-identity"><strong>${esc(c.name)}</strong><small>${esc(c.email)}</small></div><span class="status level-${String(c.role||'Aprendiz').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')}">${esc(c.role)} · Nivel ${window.CVSTUDIO_LEVELS?.[c.role]?.rank||1}</span><span class="status" style="--c:${c.status==='Activo'?'#35d07f':'#ffd23f'}">${esc(c.status)}</span><small>${jobs.length} trabajos · ${ex.length} entregas</small><button class="button secondary small" data-collaborator-id="${c.id}">Administrar</button></div>`;
    }).join('');
    return `<section class="grid kpi-grid">${kpi('users','Colaboradores activos',active.length,'usuarios habilitados','#9b5de5')}${kpi('message','Accesos pendientes',pending,'requieren activar usuario','#35d07f')}${kpi('shield','Roles definidos',roleCount,'perfiles configurados','#3b82f6')}${kpi('lock','Permisos asignados',collaborators.filter(c=>c.permissions?.length).length,'según rol','#ffd23f')}${kpi('chart','Actividad este mes',(state.executions||[]).length,'ejecuciones registradas','#28c2d8')}</section><section class="grid collaborators-layout"><section class="panel span-2"><div class="panel-head"><div><h2>Gestión de colaboradores</h2><p>Usuarios, roles, comisiones, fechas y estado de acceso.</p></div><button class="button primary" data-action="new-collaborator">+ Nuevo colaborador</button></div>${rows||`<div class="empty-state empty-state-large"><strong>Sin colaboradores registrados</strong><span>Creá el primer usuario para comenzar a asignar trabajos.</span></div>`}</section>${panel('Beneficios internos',`<div class="funds"><div class="fund-row"><span>Beneficio cumpleaños</span><b>+7%</b></div><div class="fund-row"><span>Día libre</span><b>Activo</b></div><div class="fund-row"><span>Liquidación mensual</span><b>Día 3</b></div><div class="fund-row"><span>Cobros de clientes</span><b>cvstudio.ar</b></div></div>`)}</section>`;
  }
  const BUILTIN_PORTFOLIOS = [
    {slug:'beauty-nails-by-eliana',name:'Beauty Nails by Eliana',menuLabel:'By Eliana',service:'Portfolio profesional · Estética',status:'Publicado',protected:false,password:'',downloads:true,primaryColor:'#9b5de5',secondaryColor:'#ffd23f',source:'Sistema',origin:'Sistema',builtin:true,publicPath:'/beauty-nails-by-eliana/'}
  ];
  let selectedUrlSpace = 'beauty-nails-by-eliana';
  const normalizeSlug=value=>String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  function storedUrlSpace(slug){ return (state.urlSpaces||[]).find(s=>s.slug===slug); }
  function upsertUrlSpace(space){
    state.urlSpaces=Array.isArray(state.urlSpaces)?state.urlSpaces:[];
    const index=state.urlSpaces.findIndex(s=>s.slug===space.slug || (space.originalSlug && s.slug===space.originalSlug));
    if(index>=0) state.urlSpaces[index]={...state.urlSpaces[index],...space}; else state.urlSpaces.push(space);
    saveState();
  }
  function getUrlSpaces() {
    const isRemovedSpace=item=>{
      const searchable=normalizeSlug(`${item?.slug||''} ${item?.name||''} ${item?.full_name||''} ${item?.brand_name||''} ${item?.username||''}`);
      return item?.deleted===true || item?.isDeleted===true || String(item?.status||'').toLowerCase()==='eliminado' || searchable.includes('julieta-ferrari') || searchable.includes('follow-digital');
    };
    const delivered=(state.clients||[]).filter(c=>c.status==='Entregado').map(c=>({
      slug:normalizeSlug(c.name),name:c.name,service:c.service,status:'Publicado',protected:false,password:'',downloads:true,primaryColor:'#9b5de5',secondaryColor:'#ffd23f',source:'operaciones'
    })).filter(item=>!isRemovedSpace(item));
    const migrated=(state.portfolios||[]).filter(p=>!isRemovedSpace(p)).map(p=>({
      id:p.id,portfolioId:p.id,authUserId:p.auth_user_id,username:p.username,slug:p.slug,name:p.full_name||p.brand_name||p.username,menuLabel:p.brand_name||p.full_name||p.username,service:p.business_type||'Portfolio',status:({active:'Publicado',draft:'Borrador',suspended:'Pausado'}[p.status]||'Borrador'),backendStatus:p.status||'draft',protected:false,password:'',downloads:true,primaryColor:p.settings?.colors?.[0]||'#9b5de5',secondaryColor:p.settings?.colors?.[2]||'#ffd23f',settings:p.settings||{},templateKey:p.template_key||'creative',portalMode:p.settings?.portalMode||'portfolio',contactEmail:p.contact_email||'',whatsapp:p.whatsapp||'',bio:p.bio||'',source:'Centro de Operaciones',origin:'Cuenta real',real:true,updatedAt:p.updated_at
    })).filter(p=>p.slug);
    const custom=(state.urlSpaces||[]).filter(s=>!isRemovedSpace(s) && !BUILTIN_PORTFOLIOS.some(b=>b.slug===s.slug));
    const merged=[...migrated,...BUILTIN_PORTFOLIOS.map(b=>({...b,...(storedUrlSpace(b.slug)||{})})),...delivered,...custom];
    const seen=new Set();
    return merged.filter(item=>item.slug&&!seen.has(item.slug)&&(seen.add(item.slug),true)).map(item=>({...item,origin:item.origin||(item.builtin?'Sistema':'Panel'),url:`https://cvstudio.com.ar${item.publicPath||`/${item.slug}`}`}));
  }
  function urlSpaceDetails(space) {
    if(!space) return `<div class="empty-state empty-state-large"><strong>Seleccioná un espacio</strong></div>`;
    return `<div class="url-config-inline">
      <section class="url-config-form-wrap">
        <div class="url-preview-toolbar"><div><span class="status" style="--c:${space.status==='Publicado'?'#35d07f':'#ffd23f'}">${esc(space.status||'Publicado')}</span><small>Origen: ${esc(space.origin||space.source||'Panel')}</small></div><div><button class="button secondary small" data-url-copy="${esc(space.url)}">${icon('copy')} Copiar URL</button><button class="button primary small" data-url-open="${esc(space.url)}">${icon('external')} Abrir</button></div></div>
        <form id="urlSpaceForm" class="form-grid url-space-form" data-original-slug="${esc(space.slug)}">
          <label>Cliente o marca<input name="name" value="${esc(space.name)}" required></label>
          <label>Nombre en menú<input name="menuLabel" value="${esc(space.menuLabel||space.name)}" required></label>
          <label>Tipo de espacio<input name="service" value="${esc(space.service)}" required></label>
          ${space.real?`<label>Usuario del cliente<input value="@${esc(space.username)}" readonly></label>`:''}
          <label class="span-2">URL pública<div class="url-slug-field"><span>cvstudio.com.ar/</span><input name="slug" value="${esc(space.slug)}" required pattern="[a-z0-9-]+" ${space.builtin?'readonly':''}></div></label>
          <label>Estado<select name="status"><option ${space.status==='Publicado'?'selected':''}>Publicado</option><option ${space.status==='Borrador'?'selected':''}>Borrador</option><option ${space.status==='Pausado'?'selected':''}>Pausado</option><option ${space.status==='Oculto'?'selected':''}>Oculto</option><option ${space.status==='Eliminado'?'selected':''}>Eliminado</option></select></label>
          <label>Modo<select name="portalMode"><option value="portfolio" ${space.portalMode!=='catalog'?'selected':''}>Portfolio profesional</option><option value="catalog" ${space.portalMode==='catalog'?'selected':''}>Catálogo de productos</option></select></label>
          ${space.real?`<div class="span-2 url-account-actions"><button type="button" class="button secondary" data-url-credentials="${esc(space.slug)}">Copiar acceso</button><button type="button" class="button secondary" data-url-password="${esc(space.slug)}">Nueva contraseña</button></div>`:`<label>Acceso<select name="protected"><option value="false">Público</option></select></label>`}
          <label>Permitir descargas<select name="downloads"><option value="true" ${space.downloads!==false?'selected':''}>Sí</option><option value="false" ${space.downloads===false?'selected':''}>No</option></select></label>
          <label>Color principal<input type="color" name="primaryColor" value="${esc(space.primaryColor||'#9b5de5')}"></label>
          <label>Color secundario<input type="color" name="secondaryColor" value="${esc(space.secondaryColor||'#ffd23f')}"></label>
          <label class="span-2">Nota interna<textarea name="note" rows="2" placeholder="Observaciones sobre este espacio">${esc(space.note||'')}</textarea></label>
          <div class="url-form-actions span-2"><div class="url-form-actions-left"><button type="button" class="button secondary" data-url-toggle="${esc(space.slug)}" data-next-status="${space.status==='Publicado'?'Oculto':'Publicado'}">${space.status==='Publicado'?'Ocultar / desactivar':'Activar y publicar'}</button><button type="button" class="button secondary" data-url-reset>Restablecer</button><button type="button" class="button danger" data-url-delete="${esc(space.slug)}">Eliminar proyecto</button></div><button type="submit" class="button primary">Guardar configuración</button></div>
        </form>
      </section>
    </div>`;
  }
  function urlOperationalRenderer() {
    const spaces=getUrlSpaces();
    if(!spaces.some(s=>s.slug===selectedUrlSpace)) selectedUrlSpace=spaces[0]?.slug||'';
    const selected=spaces.find(s=>s.slug===selectedUrlSpace);
    const cards=spaces.map(s=>`<article class="campaign-card url-space-card ${s.slug===selectedUrlSpace?'is-selected':''}" data-url-select="${esc(s.slug)}"><div class="campaign-head"><div><strong>${esc(s.name)}</strong><small>${esc(s.service)}</small></div><span class="status" style="--c:${s.status==='Publicado'?'#35d07f':'#ffd23f'}">${esc(s.status||'Publicado')}</span></div><p class="link-text">${esc(s.url)}</p><div class="url-card-actions"><button class="button secondary small" data-url-copy="${esc(s.url)}">${icon('copy')} Copiar</button><button class="button secondary small" data-url-open="${esc(s.url)}">${icon('external')} Ver</button><button class="button primary small" data-url-config="${esc(s.slug)}">${icon('settings')} Configurar</button></div></article>`).join('');
    return `<section class="url-compact-head panel"><div class="url-mini-kpis"><span><small>Espacios</small><b>${spaces.length}</b></span><span><small>Publicados</small><b>${spaces.filter(s=>s.status==='Publicado').length}</b></span><span><small>Catálogos</small><b>${spaces.filter(s=>s.portalMode==='catalog').length}</b></span><span><small>Borradores</small><b>${spaces.filter(s=>s.status==='Borrador').length}</b></span></div><div><button class="button secondary" data-action="refresh-url-spaces">${icon('refresh')} Actualizar</button><button class="button primary" data-action="new-url">+ Crear espacio</button></div></section><section class="url-workspace-inline"><section class="panel url-directory-compact"><div class="panel-head"><h2>Espacios</h2></div><div class="url-spaces-list">${cards||`<div class="empty-state"><strong>Sin espacios generados</strong></div>`}</div></section><section class="panel url-inline-editor"><div class="panel-head"><h2>Configuración</h2></div>${urlSpaceDetails(selected)}</section></section>`;
  }
  function openNewUrlModal(){
    showForm('Crear espacio de cliente','Generá la cuenta, el panel editable y la URL pública en una sola operación.',
      input('name','Nombre completo')+input('brandName','Marca o nombre profesional')+input('username','Usuario')+input('slug','URL pública')+input('contactEmail','Correo de contacto','email','',false)+input('whatsapp','WhatsApp','text','',false)+input('service','Actividad o rubro','text','Bazar')+select('portalMode','Tipo de espacio',[{value:'catalog',label:'Catálogo de productos'},{value:'portfolio',label:'Portfolio profesional'}],'catalog')+select('status','Estado inicial',[{value:'draft',label:'Borrador'},{value:'active',label:'Publicado'}],'draft')+passwordInput('password','Contraseña inicial',`CVs-${Math.random().toString(36).slice(2,10)}!`)+input('primaryColor','Color principal','color','#2f5440')+input('secondaryColor','Color secundario','color','#d5a879'),
      'Crear cuenta y espacio',async (data,form)=>{
        const name=String(data.get('name')).trim(); const slug=normalizeSlug(data.get('slug')||name);
        if(!slug){toast('Ingresá una URL válida.');return;}
        if(getUrlSpaces().some(s=>s.slug===slug)){toast('Esa URL ya existe. Elegí otra dirección.');return;}
        const submit=form.querySelector('button[type="submit"]');submit.disabled=true;submit.textContent='Creando cuenta…';
        try{const payload={fullName:name,brandName:String(data.get('brandName')||name).trim(),username:String(data.get('username')).trim().toLowerCase(),slug,contactEmail:String(data.get('contactEmail')||'').trim(),whatsapp:String(data.get('whatsapp')||'').trim(),businessType:String(data.get('service')).trim(),templateKey:String(data.get('portalMode'))==='catalog'?'local':'creative',status:String(data.get('status')),password:String(data.get('password')),bio:'',settings:{portalMode:String(data.get('portalMode')),colors:[String(data.get('primaryColor')),'#fffdf9',String(data.get('secondaryColor'))],palette:'custom',fontStyle:'elegante',showHeader:true,showSocials:true,showWhatsapp:true}};const result=await window.CVStudioRealBridge.createPortfolioClient(payload);state.portfolios=[result.client,...(state.portfolios||[])];saveState();selectedUrlSpace=slug;closeModal();openModule('generador-url');openModal(`<h2 id="modalTitle">Espacio creado</h2><p style="color:var(--muted)">Entregale estos datos al cliente.</p><div class="credentials-card"><div><span>Usuario</span><strong>@${esc(result.client.username)}</strong></div><div><span>Contraseña</span><strong>${esc(payload.password)}</strong></div><div><span>Panel editable</span><strong>cvstudio.com.ar/clientes/</strong></div><div><span>URL pública</span><strong>cvstudio.com.ar/${esc(slug)}</strong></div></div><div class="modal-actions"><button class="button primary" data-close-modal>Finalizar</button></div>`);}catch(error){toast(error.message);submit.disabled=false;submit.textContent='Crear cuenta y espacio';}
      });
    const nameInput=document.querySelector('#opsForm [name="name"]'), slugInput=document.querySelector('#opsForm [name="slug"]');
    const userInput=document.querySelector('#opsForm [name="username"]');if(nameInput&&slugInput) nameInput.addEventListener('input',()=>{if(!slugInput.dataset.manual)slugInput.value=normalizeSlug(nameInput.value);if(userInput&&!userInput.dataset.manual)userInput.value=normalizeSlug(nameInput.value).replace(/-/g,'.');});
    userInput?.addEventListener('input',()=>userInput.dataset.manual='1');
    if(slugInput) slugInput.addEventListener('input',()=>{slugInput.dataset.manual='1';slugInput.value=normalizeSlug(slugInput.value);});
  }
  renderers.inicio = dashboardRenderer;
  renderers.clientes = clientsRenderer;
  renderers.administracion = adminRenderer;
  renderers.marketing = marketingOperationalRenderer;
  renderers.calendario = calendarOperationalRenderer;
  renderers.plantillas = templatesRenderer;
  renderers.archivos = filesRenderer;
  renderers.integraciones = integrationsRenderer;
  renderers.colaboradores = collaboratorsOperationalRenderer;
  renderers['generador-url'] = urlOperationalRenderer;

  const originalBind = bindModuleActions;
  bindModuleActions = function(id) {
    originalBind(id);
    if(id==='colaboradores'){
      const btn=document.querySelector('[data-action="new-collaborator"]');
      if(btn) btn.onclick=modalCreateCollaboratorOperational;
      document.querySelectorAll('[data-collaborator-id]').forEach(button=>button.onclick=()=>{
        const c=state.collaborators.find(x=>x.id===Number(button.dataset.collaboratorId));
        if(!c)return;
        openCollaboratorManager(c);
      });
    }
    if (id === 'clientes') {
      const rerenderClients=()=>openModule('clientes');
      document.querySelectorAll('[data-client-id]').forEach(row => row.onclick = event => {
        if(event.target.closest('.client-check'))return;
        const found = state.clients.find(c=>c.id===Number(row.dataset.clientId));
        if(clientSelectionMode&&found){selectedClientIds.has(found.id)?selectedClientIds.delete(found.id):selectedClientIds.add(found.id);return rerenderClients();}
        if(found){ selectedClient = clients.find(c=>c.id===found.id) || found; document.getElementById('clientRows').innerHTML=clientRowsOperational(); document.getElementById('clientWorkspace').innerHTML=clientWorkspaceOperational(); bindModuleActions('clientes'); }
      });
      document.querySelectorAll('[data-client-check]').forEach(input=>input.onchange=()=>{const id=Number(input.dataset.clientCheck);input.checked?selectedClientIds.add(id):selectedClientIds.delete(id);rerenderClients();});
      document.querySelector('[data-client-selection-toggle]')?.addEventListener('click',()=>{clientSelectionMode=!clientSelectionMode;if(!clientSelectionMode)selectedClientIds.clear();rerenderClients();});
      document.querySelector('[data-client-selection-close]')?.addEventListener('click',()=>{clientSelectionMode=false;selectedClientIds.clear();rerenderClients();});
      document.querySelector('[data-client-select-all]')?.addEventListener('change',event=>{visibleClients().forEach(c=>event.target.checked?selectedClientIds.add(c.id):selectedClientIds.delete(c.id));rerenderClients();});
      document.querySelectorAll('[data-client-bulk]').forEach(button=>button.onclick=()=>{
        const ids=new Set(selectedClientIds),chosen=state.clients.filter(c=>ids.has(c.id));if(!chosen.length)return;
        if(button.dataset.clientBulk==='archive'){
          if(!confirm(`¿Archivar ${chosen.length} chats seleccionados?`))return;
          chosen.forEach(c=>{c.status='Archivado';c.time='Ahora';});addActivity('client','Chats archivados',`${chosen.length} clientes`);saveState();selectedClientIds.clear();clientSelectionMode=false;rerenderClients();toast('Chats archivados.');return;
        }
        if(!confirm(`¿Eliminar ${chosen.length} chats de la bandeja? Se quitarán también sus datos operativos asociados. Esta acción no se puede deshacer.`))return;
        const refs=chosen.map(c=>c.realRequestId||c.realOrderId).filter(Boolean).map(String);state.hiddenClientRefs=[...new Set([...(state.hiddenClientRefs||[]),...refs])];
        state.clients=state.clients.filter(c=>!ids.has(c.id));state.jobs=state.jobs.filter(j=>!ids.has(j.clientId));state.payments=state.payments.filter(p=>!ids.has(p.clientId));state.executions=state.executions.filter(x=>!ids.has(x.clientId));state.activities=state.activities.filter(a=>!ids.has(a.clientId));selectedClientIds.clear();clientSelectionMode=false;selectedClient=state.clients[0]||null;saveState();rerenderClients();toast('Chats eliminados de la bandeja.');
      });
      document.querySelectorAll('[data-client-filter]').forEach(btn => btn.onclick = () => {
        clientFilter=btn.dataset.clientFilter;rerenderClients();
      });
      const search=document.getElementById('clientSearch');
      if(search) search.oninput=()=>{
        clientQuery=search.value.toLowerCase().trim();document.getElementById('clientRows').innerHTML=clientRowsOperational();bindModuleActions('clientes');search.focus();search.setSelectionRange(search.value.length,search.value.length);
      };
      scrollConversationToLatest();
    }
    if(id==='plantillas'){
      document.querySelectorAll('[data-template-filter]').forEach(btn=>btn.onclick=()=>{templateFilter=btn.dataset.templateFilter;openModule('plantillas');});
      document.querySelectorAll('[data-template-id]').forEach(card=>card.onclick=event=>{if(event.target.closest('button,a'))return;selectedTemplateId=card.dataset.templateId;openModule('plantillas');});
      document.querySelectorAll('[data-template-preview]').forEach(btn=>btn.onclick=event=>{event.stopPropagation();const item=allTemplates().find(x=>x.id===btn.dataset.templatePreview);if(!item)return;openModal(`<h2 id="modalTitle">${esc(item.name)}</h2><div class="template-modal-preview">${templateCardOperational(item,!item.base)}</div><div class="modal-actions"><button class="button secondary" data-close-modal>Cerrar</button>${item.url?`<a class="button primary" href="${esc(item.url)}" target="_blank" rel="noopener">Abrir en Canva</a>`:''}</div>`);});
      document.querySelectorAll('[data-template-assign]').forEach(btn=>btn.onclick=()=>{const item=allTemplates().find(x=>x.id===btn.dataset.templateAssign),client=state.clients.find(c=>c.id===selectedClient?.id);if(!item)return;if(client){client.templateId=item.id;client.templateName=item.name;addActivity('job','Plantilla asignada',`${client.name} · ${item.name}`,client.id);saveState();toast(`Referencia asignada a ${client.name}.`);}else toast('Seleccioná primero un cliente.');});
      document.querySelectorAll('[data-template-delete]').forEach(btn=>btn.onclick=()=>{const item=state.templates.find(x=>x.id===btn.dataset.templateDelete);if(!item||!confirm(`¿Eliminar la plantilla “${item.name}”?`))return;state.templates=state.templates.filter(x=>x.id!==item.id);selectedTemplateId='';saveState();openModule('plantillas');toast('Plantilla eliminada.');});
    }
    if(id==='archivos'){
      document.querySelector('[data-file-upload]')?.addEventListener('click',()=>openFileUploadModal());
      document.querySelector('[data-files-refresh]')?.addEventListener('click',()=>{filesCache=[];filesLoaded=false;loadFiles(true);});
      document.querySelectorAll('[data-files-filter]').forEach(btn=>btn.onclick=()=>{filesFilter=btn.dataset.filesFilter;selectedFileIds.clear();openModule('archivos');});
      const search=document.getElementById('filesSearch');if(search)search.oninput=()=>{filesQuery=search.value.toLowerCase().trim();openModule('archivos');document.getElementById('filesSearch')?.focus();};
      document.querySelectorAll('[data-file-check]').forEach(input=>input.onchange=()=>{input.checked?selectedFileIds.add(input.dataset.fileCheck):selectedFileIds.delete(input.dataset.fileCheck);openModule('archivos');});
      document.querySelector('[data-files-check-all]')?.addEventListener('change',event=>{visibleFiles().forEach(f=>event.target.checked?selectedFileIds.add(f.id):selectedFileIds.delete(f.id));openModule('archivos');});
      document.querySelectorAll('[data-file-open]').forEach(btn=>btn.onclick=async()=>{const file=filesCache.find(f=>f.id===btn.dataset.fileOpen);try{await downloadFileRecord(file);}catch(error){toast(error.message);}});
      document.querySelectorAll('[data-file-trash]').forEach(btn=>btn.onclick=async()=>{const file=filesCache.find(f=>f.id===btn.dataset.fileTrash);if(!file||!confirm(`¿Mover “${file.nombre}” a la papelera?`))return;try{await trashFileRecord(file);openModule('archivos');toast('Archivo enviado a la papelera.');}catch(error){toast(error.message);}});
      document.querySelector('[data-files-trash-selected]')?.addEventListener('click',async()=>{const chosen=filesCache.filter(f=>selectedFileIds.has(f.id)&&!f.deleted_at);if(!chosen.length||!confirm(`¿Mover ${chosen.length} archivos a la papelera?`))return;for(const file of chosen)await trashFileRecord(file);selectedFileIds.clear();openModule('archivos');toast('Archivos enviados a la papelera.');});
      document.querySelectorAll('[data-file-restore]').forEach(btn=>btn.onclick=async()=>{const file=filesCache.find(f=>f.id===btn.dataset.fileRestore);try{await restoreFileRecord(file);openModule('archivos');toast('Archivo restaurado en Otros.');}catch(error){toast(error.message);}});
      document.querySelectorAll('[data-file-edit]').forEach(btn=>btn.onclick=()=>{const file=filesCache.find(f=>f.id===btn.dataset.fileEdit);if(!file)return;showForm('Renombrar o mover','Actualizá el nombre visible y la carpeta.',input('name','Nombre','text',file.nombre)+select('category','Carpeta',Object.entries(FILE_CATEGORIES).filter(([k])=>!['todos','papelera'].includes(k)).map(([value,label])=>({value,label})),file.categoria),'Guardar',async data=>{const name=String(data.get('name')||'').trim(),category=String(data.get('category'));if(!name)return toast('Ingresá un nombre.');try{const nextPath=`${category}/${file.id}-${safeFileName(name)}`;const move=await window.cvstudioSupabase.storage.from(FILE_BUCKET).move(file.object_path,nextPath);if(move.error)throw move.error;const update=await window.cvstudioSupabase.from(FILE_TABLE).update({nombre:name,categoria:category,object_path:nextPath,updated_at:new Date().toISOString()}).eq('id',file.id).select().single();if(update.error)throw update.error;filesCache=filesCache.map(f=>f.id===file.id?update.data:f);closeModal();openModule('archivos');toast('Archivo actualizado.');}catch(error){toast(error.message);}});});
    }
    if(id==='integraciones'){
      document.querySelector('[data-integrations-test]')?.addEventListener('click',testIntegrations);
      document.querySelectorAll('[data-integration-test]').forEach(btn=>btn.onclick=async()=>{
        const id=btn.dataset.integrationTest;
        if(['supabase','storage','mercadopago','portfolio'].includes(id))return testIntegrations();
        if(id==='canva'){
          btn.disabled=true;
          try{
            const status=await window.CVStudioRealBridge?.canvaStatus?.();
            if(status?.connected){toast('Canva está conectado correctamente.');return testIntegrations();}
            await window.CVStudioRealBridge?.connectCanva?.();
          }catch(error){toast(error.message);btn.disabled=false;}
          return;
        }
        const item=integrationDefinitions().find(x=>x.id===id),external=item.setup?`<a class="button primary" href="${esc(item.setup)}" target="_blank" rel="noopener">Abrir configuración oficial</a>`:'';
        openModal(`<div class="integration-modal-head"><span class="integration-brand">${brand(item.brand)}</span><div><h2 id="modalTitle">${esc(item.name)}</h2><small>${esc(item.type)}</small></div></div><div class="integration-test-note"><b>${integrationMeta(item.status)[0]}</b><span>${esc(item.detail)}</span></div><div class="modal-actions"><button class="button secondary" data-close-modal>Cerrar</button>${external}</div>`);
      });
    }
    if(id==='generador-url') {
      const refreshSelection=(slug)=>{selectedUrlSpace=slug;openModule('generador-url');};
      const openConfig=(slug)=>{selectedUrlSpace=slug;openModule('generador-url');};
      document.querySelectorAll('[data-url-select]').forEach(card=>card.onclick=e=>{if(e.target.closest('button'))return;refreshSelection(card.dataset.urlSelect);});
      document.querySelectorAll('[data-url-config]').forEach(btn=>btn.onclick=e=>{e.stopPropagation();openConfig(btn.dataset.urlConfig);});
      document.querySelectorAll('[data-url-copy]').forEach(btn=>btn.onclick=async e=>{e.stopPropagation();try{await navigator.clipboard.writeText(btn.dataset.urlCopy);toast('URL copiada al portapapeles.');}catch(_){toast('No se pudo copiar automáticamente.');}});
      document.querySelectorAll('[data-url-open]').forEach(btn=>btn.onclick=e=>{e.stopPropagation();window.open(btn.dataset.urlOpen,'_blank','noopener');});
      const form=document.getElementById('urlSpaceForm');
      if(form) form.onsubmit=async e=>{e.preventDefault();const data=new FormData(form),originalSlug=form.dataset.originalSlug,slug=normalizeSlug(data.get('slug'));if(!slug){toast('Ingresá una URL válida.');return;}if(getUrlSpaces().some(s=>s.slug===slug&&s.slug!==originalSlug)){toast('Esa URL ya está utilizada.');return;}const current=getUrlSpaces().find(s=>s.slug===originalSlug)||{};const updated={...current,slug:current.builtin?originalSlug:slug,name:String(data.get('name')).trim(),menuLabel:String(data.get('menuLabel')||data.get('name')).trim(),service:String(data.get('service')).trim(),status:String(data.get('status')),portalMode:String(data.get('portalMode')||current.portalMode||'portfolio'),downloads:String(data.get('downloads'))!=='false',protected:String(data.get('protected'))==='true',note:String(data.get('note')||''),primaryColor:String(data.get('primaryColor')||'#9b5de5'),secondaryColor:String(data.get('secondaryColor')||'#ffd23f')};try{if(current.real){const changes={full_name:updated.name,brand_name:updated.menuLabel,business_type:updated.service,slug:updated.slug,status:({Publicado:'active',Borrador:'draft',Pausado:'suspended',Oculto:'suspended'}[updated.status]||'draft'),settings:{...(current.settings||{}),portalMode:updated.portalMode,downloads:updated.downloads,note:updated.note,colors:[updated.primaryColor,'#fffdf9',updated.secondaryColor]}};const result=await window.CVStudioRealBridge.updatePortfolioClient(current.portfolioId,changes);state.portfolios=(state.portfolios||[]).map(p=>p.id===current.portfolioId?result.client:p);saveState();}else{upsertUrlSpace({...updated,origin:current.builtin?'Sistema':'Panel'});}selectedUrlSpace=updated.slug;closeModal();openModule('generador-url');toast('Cuenta y publicación actualizadas.');}catch(error){toast(error.message);}};
      const reset=document.querySelector('[data-url-reset]');if(reset)reset.onclick=()=>{if(confirm('¿Restablecer los cambios de este espacio?')){state.urlSpaces=state.urlSpaces.filter(s=>s.slug!==form.dataset.originalSlug);saveState();openModule('generador-url');toast('Configuración restablecida.');}};
      const toggleBtn=document.querySelector('[data-url-toggle]');if(toggleBtn)toggleBtn.onclick=async()=>{const slug=toggleBtn.dataset.urlToggle,space=getUrlSpaces().find(s=>s.slug===slug);if(!space)return;const next=toggleBtn.dataset.nextStatus||'Oculto';try{if(space.real){const result=await window.CVStudioRealBridge.updatePortfolioClient(space.portfolioId,{status:next==='Publicado'?'active':'suspended'});state.portfolios=state.portfolios.map(p=>p.id===space.portfolioId?result.client:p);saveState();}else upsertUrlSpace({...space,status:next});openModule('generador-url');toast(next==='Publicado'?'Espacio publicado.':'Espacio pausado.');}catch(error){toast(error.message);}};
      document.querySelector('[data-action="refresh-url-spaces"]')?.addEventListener('click',async()=>{toast('Actualizando espacios…');await window.CVStudioRealBridge.loadReal();state=loadState();openModule('generador-url');toast('Espacios sincronizados.');});
      document.querySelector('[data-url-credentials]')?.addEventListener('click',async e=>{const space=getUrlSpaces().find(s=>s.slug===e.currentTarget.dataset.urlCredentials);await navigator.clipboard.writeText(`Acceso CVStudio\nUsuario: ${space.username}\nPanel editable: https://cvstudio.com.ar/clientes/\nEspacio público: ${space.url}`);toast('Acceso copiado.');});
      document.querySelector('[data-url-password]')?.addEventListener('click',async e=>{const space=getUrlSpaces().find(s=>s.slug===e.currentTarget.dataset.urlPassword),password=`CVs-${Math.random().toString(36).slice(2,10)}!`;if(!confirm(`¿Generar una nueva contraseña para @${space.username}?`))return;try{await window.CVStudioRealBridge.resetPortfolioPassword(space.portfolioId,password);await navigator.clipboard.writeText(`Usuario: ${space.username}\nContraseña: ${password}\nIngreso: https://cvstudio.com.ar/clientes/`);toast('Nueva contraseña copiada.');}catch(error){toast(error.message);}});
      const deleteBtn=document.querySelector('[data-url-delete]');if(deleteBtn)deleteBtn.onclick=async()=>{const slug=deleteBtn.dataset.urlDelete,space=getUrlSpaces().find(s=>s.slug===slug);if(!space||!confirm(`¿Eliminar definitivamente la cuenta y el espacio /${slug}?`))return;try{if(space.real){await window.CVStudioRealBridge.deletePortfolioClient(space.portfolioId);state.portfolios=state.portfolios.filter(p=>p.id!==space.portfolioId);saveState();selectedUrlSpace='';}else upsertUrlSpace({...space,status:'Eliminado',deleted:true});openModule('generador-url');toast('Cuenta y espacio eliminados.');}catch(error){toast(error.message);}};
      const slugField=form?.querySelector('[name="slug"]');if(slugField)slugField.addEventListener('input',()=>slugField.value=normalizeSlug(slugField.value));
      const newBtn=document.querySelector('[data-action="new-url"]');
      if(newBtn)newBtn.onclick=openNewUrlModal;
    }
    if(id==='administracion') {
      const updateTotal=()=>{
        const values=[...document.querySelectorAll('input[data-fund]')].reduce((sum,input)=>sum+Number(input.value),0);
        const out=document.getElementById('rulesTotal');
        if(out){out.textContent=`${values}%`;out.style.color=values===100?'#35d07f':'#ff5d73';}
      };
      document.querySelectorAll('input[data-fund]').forEach(input=>input.addEventListener('input',updateTotal));
      updateTotal();
    }
    if(id==='calendario') {
      document.querySelectorAll('[data-calendar-nav]').forEach(button=>button.onclick=()=>{
        const action=button.dataset.calendarNav;
        if(action==='today')calendarCursor=new Date(new Date().getFullYear(),new Date().getMonth(),1);
        else calendarCursor=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()+(action==='next'?1:-1),1);
        openModule('calendario');
      });
      document.querySelectorAll('[data-calendar-day]').forEach(day=>day.ondblclick=()=>modalCalendarItem(null,day.dataset.calendarDay));
      document.querySelectorAll('[data-calendar-item]').forEach(button=>button.onclick=event=>{event.stopPropagation();modalCalendarItem(Number(button.dataset.calendarItem));});
    }
  };

  function showForm(title,desc,body,submitText,onSubmit) {
    openModal(`<h2 id="modalTitle">${title}</h2><p style="color:var(--muted)">${desc}</p><form id="opsForm" class="form-grid">${body}<div class="modal-actions" style="grid-column:1/-1"><button type="button" class="button secondary" data-close-modal>Cancelar</button><button type="submit" class="button primary">${submitText}</button></div></form>`);
    const form=document.getElementById('opsForm');
    form.addEventListener('submit',event=>{event.preventDefault();onSubmit(new FormData(form),form);});
  }
  const input = (name,label,type='text',value='',required=true) => `<label>${label}<input name="${name}" type="${type}" value="${esc(value)}" ${required?'required':''}></label>`;
  const passwordInput = (name,label,value='',required=true) => `<label>${label}<div class="password-field"><input name="${name}" type="text" value="${esc(value)}" autocomplete="new-password" spellcheck="false" ${required?'required':''}><button type="button" class="password-toggle" aria-label="Ocultar contraseña" title="Mostrar u ocultar contraseña" data-password-toggle><span data-eye-open>Ocultar</span><span data-eye-closed hidden>Mostrar</span></button></div><small class="field-help">Visible durante el alta para poder verificarla antes de crear el acceso.</small></label>`;
  const select = (name,label,options,value='') => `<label>${label}<select name="${name}">${options.map(item=>{const o=typeof item==='object'?item:{value:item,label:item};return `<option value="${esc(o.value)}" ${String(o.value)===String(value)?'selected':''}>${esc(o.label)}</option>`}).join('')}</select></label>`;

  function modalCalendarItem(id=null,presetDate='') {
    const existing=id?calendarItems().find(item=>item.id===Number(id)):null;
    const today=presetDate||localDateKey(new Date()),item=existing||{title:'',type:'campaign',startDate:today,endDate:today,startTime:'09:00',status:'Planificada',platform:'Facebook / Instagram',objective:'Mensajes por WhatsApp',dailyBudget:'',totalBudget:'',reminder:'1 día antes',notes:''};
    const body=input('title','Título de la actividad','text',item.title)+
      select('type','Tipo de actividad',Object.entries(calendarTypeMeta).map(([value,meta])=>({value,label:meta.label})),item.type)+
      input('startDate','Fecha de inicio','date',item.startDate)+input('endDate','Fecha de finalización','date',item.endDate||item.startDate)+
      input('startTime','Hora','time',item.startTime||'09:00',false)+select('status','Estado',['Planificada','Activa','Pausada','Completada','Cancelada'],item.status||'Planificada')+
      `<div class="calendar-campaign-fields span-2"><div class="form-grid">${select('platform','Plataforma',['Facebook / Instagram','Facebook','Instagram','Google','WhatsApp','Otra'],item.platform||'Facebook / Instagram')}${input('objective','Objetivo','text',item.objective||'',false)}${input('dailyBudget','Presupuesto diario','number',item.dailyBudget||'',false)}${input('totalBudget','Presupuesto total estimado','number',item.totalBudget||'',false)}</div><div class="calendar-budget-preview"><span>Duración: <b id="calendarDuration">1 día</b></span><span>Total calculado: <b id="calendarCalculatedTotal">$ 0</b></span></div></div>`+
      select('reminder','Recordatorio',['Sin recordatorio','El mismo día','1 día antes','2 días antes','Mitad de campaña y último día'],item.reminder||'1 día antes')+
      `<label class="span-2">Notas<textarea name="notes" rows="3" placeholder="Detalles, público, pieza utilizada u observaciones">${esc(item.notes||'')}</textarea></label>`;
    showForm(existing?'Editar actividad':'Nueva actividad',existing?'Actualizá los datos o eliminá esta actividad.':'Registrá campañas, entregas, tareas, publicaciones y recordatorios.',body,existing?'Guardar cambios':'Crear actividad',data=>{
      const startDate=String(data.get('startDate')),endDate=String(data.get('endDate')||startDate);
      if(endDate<startDate){toast('La fecha de finalización no puede ser anterior al inicio.');return;}
      const record={id:existing?.id||nextId(calendarItems()),title:String(data.get('title')).trim(),type:String(data.get('type')),startDate,endDate,startTime:String(data.get('startTime')||''),status:String(data.get('status')),platform:String(data.get('platform')||''),objective:String(data.get('objective')||''),dailyBudget:Number(data.get('dailyBudget')||0),totalBudget:Number(data.get('totalBudget')||0),reminder:String(data.get('reminder')),notes:String(data.get('notes')||''),createdAt:existing?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()};
      state.calendarItems=calendarItems();
      const index=state.calendarItems.findIndex(x=>x.id===record.id);
      if(index>=0)state.calendarItems[index]=record;else state.calendarItems.push(record);
      addActivity('settings',existing?'Actividad actualizada':'Actividad programada',`${record.title} · ${dateLabel(record.startDate)}`);saveState();closeModal();calendarCursor=parseLocalDate(record.startDate);calendarCursor.setDate(1);openModule('calendario');toast(existing?'Actividad actualizada.':'Actividad creada en el calendario.');
    });
    const form=document.getElementById('opsForm'),typeField=form?.querySelector('[name="type"]'),campaignFields=form?.querySelector('.calendar-campaign-fields');
    const refreshCampaign=()=>{
      if(campaignFields)campaignFields.hidden=typeField?.value!=='campaign';
      const start=form?.querySelector('[name="startDate"]')?.value,end=form?.querySelector('[name="endDate"]')?.value,daily=Number(form?.querySelector('[name="dailyBudget"]')?.value||0);
      let days=1;if(start&&end&&end>=start)days=Math.max(1,Math.round((parseLocalDate(end)-parseLocalDate(start))/86400000)+1);
      const duration=document.getElementById('calendarDuration'),total=document.getElementById('calendarCalculatedTotal');if(duration)duration.textContent=`${days} día${days===1?'':'s'}`;if(total)total.textContent=money(days*daily);
      const totalInput=form?.querySelector('[name="totalBudget"]');if(totalInput&&document.activeElement!==totalInput)totalInput.value=daily?days*daily:(existing?.totalBudget||'');
    };
    form?.querySelectorAll('[name="type"],[name="startDate"],[name="endDate"],[name="dailyBudget"]').forEach(field=>field.addEventListener('input',refreshCampaign));refreshCampaign();
    if(existing){const actions=form?.querySelector('.modal-actions');actions?.insertAdjacentHTML('afterbegin','<button type="button" class="button danger" id="deleteCalendarItem">Eliminar</button>');document.getElementById('deleteCalendarItem').onclick=()=>{if(!confirm(`¿Eliminar “${existing.title}” del calendario?`))return;state.calendarItems=calendarItems().filter(x=>x.id!==existing.id);addActivity('settings','Actividad eliminada',existing.title);saveState();closeModal();openModule('calendario');toast('Actividad eliminada.');};}
  }


  const LEVELS=['Aprendiz','Operario','Líder','Supervisor','Director'];
  const CAPABILITIES=['CV Profesional','LinkedIn','Cartas','Portfolio','Atención al cliente','Diseño gráfico','Marketing','Revisión'];
  const PERMISSION_ACTIONS=['ver','editar','asignar','subir','eliminar'];
  const permissionLabel={ver:'Ver',editar:'Editar',asignar:'Asignar',subir:'Subir',eliminar:'Eliminar'};
  function collaboratorStats(c){
    const jobs=state.jobs.filter(j=>j.responsible===c.name);
    const executions=(state.executions||[]).filter(e=>e.responsible===c.name);
    const completed=jobs.filter(j=>j.stage==='Entregado'||j.completedAt).length;
    const commission=executions.reduce((sum,e)=>sum+Number(e.commissionAmount||e.commission||0),0);
    return {jobs:jobs.length,completed,executions:executions.length,commission};
  }
  function permissionsHtml(c){
    const selected=new Set(c.permissions||permissionsForRole(c.role));
    return `<div class="permission-matrix">${PERMISSION_MODULES.map(module=>`<div class="permission-module"><strong>${esc(module)}</strong><div>${PERMISSION_ACTIONS.map(action=>{const key=`${module}:${action}`;return `<label class="permission-check"><input type="checkbox" name="permission" value="${esc(key)}" ${selected.has(key)?'checked':''}>${permissionLabel[action]}</label>`}).join('')}</div></div>`).join('')}</div>`;
  }
  function openCollaboratorManager(c){
    const canManage=window.CVStudioAccess?.level==='Director';
    const stats=collaboratorStats(c);
    const history=(c.roleHistory||[]).slice().reverse().map(h=>`<div class="history-row"><span>${esc(h.from||'Ingreso')} → <b>${esc(h.to)}</b></span><small>${esc((h.at||'').slice(0,10))} · ${esc(h.by||'Director')} · ${Number(h.commission||0)}%</small></div>`).join('')||'<p class="auth-note">Sin cambios de nivel registrados.</p>';
    const training=CAPABILITIES.map(cap=>{const status=c.training?.[cap]||((c.capabilities||[]).includes(cap)?'Habilitado':'Pendiente');return `<div class="training-row"><span>${esc(cap)}</span><b class="training-${status.toLowerCase()}">${esc(status)}</b></div>`}).join('');
    const granted=(c.permissions||permissionsForRole(c.role));
    openModal(`<h2 id="modalTitle">${esc(c.name)}</h2><p style="color:var(--muted)">${esc(c.email)}</p><div class="career-track">${LEVELS.map(l=>`<span class="${l===c.role?'current':''} ${window.CVSTUDIO_LEVELS[l].rank<window.CVSTUDIO_LEVELS[c.role]?.rank?'done':''}">${esc(l)}</span>`).join('')}</div>
      <div class="collab-manager-tabs"><button class="is-active" data-collab-tab="resumen">Resumen</button><button data-collab-tab="permisos">Permisos</button><button data-collab-tab="formacion">Capacitación</button><button data-collab-tab="trayectoria">Trayectoria</button></div>
      <section data-collab-pane="resumen"><div class="funds"><div class="fund-row"><span>Nivel</span><b>${esc(c.role)}</b></div><div class="fund-row"><span>Comisión</span><b>${c.commission}%</b></div><div class="fund-row"><span>Ingreso</span><b>${esc(c.startDate||'—')}</b></div><div class="fund-row"><span>Cumpleaños</span><b>${esc(c.birthDate||'—')}</b></div><div class="fund-row"><span>Acceso</span><b>${esc(c.authStatus||'Pendiente')}</b></div></div><div class="collab-stat-grid"><div><span>Trabajos asignados</span><b>${stats.jobs}</b></div><div><span>Entregados</span><b>${stats.completed}</b></div><div><span>Ejecuciones</span><b>${stats.executions}</b></div><div><span>Comisiones</span><b>${money(stats.commission)}</b></div></div></section>
      <section data-collab-pane="permisos" hidden><p class="auth-note">${granted.length} permisos asignados. Se aplican al guardar la edición del colaborador.</p><div class="permission-summary">${PERMISSION_MODULES.map(module=>{const count=granted.filter(p=>p.startsWith(module+':')).length;return `<span><b>${esc(module)}</b><small>${count?count+' acciones':'Sin acceso'}</small></span>`}).join('')}</div></section>
      <section data-collab-pane="formacion" hidden><div class="training-list">${training}</div></section>
      <section data-collab-pane="trayectoria" hidden><div class="role-history">${history}</div></section>
      <div class="modal-actions">${canManage?`<button class="button primary" id="editCollaborator">Editar</button><button class="button secondary" id="toggleCollaborator">${c.status==='Activo'?'Suspender':'Reactivar'} acceso</button><button class="button danger" id="archiveCollaborator">Archivar</button><button class="button danger ghost" id="deleteCollaborator">Eliminar definitivamente</button>`:''}<button class="button secondary" data-close-modal>Cerrar</button></div>`);
    document.querySelectorAll('[data-collab-tab]').forEach(btn=>btn.onclick=()=>{document.querySelectorAll('[data-collab-tab]').forEach(x=>x.classList.toggle('is-active',x===btn));document.querySelectorAll('[data-collab-pane]').forEach(p=>p.hidden=p.dataset.collabPane!==btn.dataset.collabTab)});
    if(!canManage)return;
    document.getElementById('editCollaborator').onclick=()=>modalEditCollaborator(c);
    document.getElementById('toggleCollaborator').onclick=async()=>{c.status=c.status==='Activo'?'Suspendido':'Activo';c.authStatus=c.status;saveState();await window.CVStudioRealBridge?.updateCollaboratorAuth?.(c).catch(console.error);closeModal();openModule('colaboradores');};
    document.getElementById('archiveCollaborator').onclick=()=>{if(confirm(`¿Archivar a ${c.name}? Se conserva todo su historial.`)){c.status='Archivado';c.authStatus='Inactivo';c.archivedAt=new Date().toISOString();saveState();window.CVStudioRealBridge?.updateCollaboratorAuth?.(c).catch(console.error);closeModal();openModule('colaboradores');}};
    document.getElementById('deleteCollaborator').onclick=async()=>{if(!confirm(`ELIMINACIÓN DEFINITIVA: ¿eliminar el acceso de ${c.name}? El historial de trabajos y comisiones se conservará.`))return;await window.CVStudioRealBridge?.deleteCollaboratorAuth?.(c).catch(e=>{throw e});state.collaborators=state.collaborators.filter(x=>x.id!==c.id);saveState();closeModal();openModule('colaboradores');toast('Colaborador eliminado; historial operativo conservado.');};
  }
  function modalEditCollaborator(c){
    showForm('Editar colaborador','Actualizá identidad, nivel, comisión, permisos y plan de capacitación.',input('name','Nombre y apellido','text',c.name)+input('email','Correo corporativo','email',c.email)+select('role','Nivel',LEVELS,c.role)+input('commission','Comisión (%)','number',c.commission)+input('birthDate','Fecha de nacimiento','date',c.birthDate||'',false)+input('startDate','Fecha de ingreso','date',c.startDate||'')+select('status','Estado',['Activo','Ausente','Suspendido','Archivado'],c.status||'Activo')+`<fieldset class="capability-field"><legend>Capacidades habilitadas</legend>${CAPABILITIES.map(cap=>`<label class="check-line"><input type="checkbox" name="capability" value="${esc(cap)}" ${(c.capabilities||[]).includes(cap)?'checked':''}> ${esc(cap)}</label>`).join('')}</fieldset><fieldset class="capability-field"><legend>Estado de capacitación</legend>${CAPABILITIES.map(cap=>`<label class="training-select"><span>${esc(cap)}</span><select name="training:${esc(cap)}"><option ${c.training?.[cap]==='Pendiente'?'selected':''}>Pendiente</option><option ${c.training?.[cap]==='En progreso'?'selected':''}>En progreso</option><option ${c.training?.[cap]==='Habilitado'?'selected':''}>Habilitado</option></select></label>`).join('')}</fieldset><fieldset class="capability-field permission-field"><legend>Permisos por módulo y acción</legend>${permissionsHtml(c)}</fieldset>`,'Guardar cambios',async data=>{
      const previous=c.role; const next=String(data.get('role'));c.name=String(data.get('name')).trim();c.email=String(data.get('email')).trim().toLowerCase();c.role=next;c.commission=Number(data.get('commission'));c.birthDate=String(data.get('birthDate')||'');c.startDate=String(data.get('startDate')||'');c.status=String(data.get('status'));c.capabilities=data.getAll('capability').map(String);c.permissions=data.getAll('permission').map(String);c.training=Object.fromEntries(CAPABILITIES.map(cap=>[cap,String(data.get(`training:${cap}`)||'Pendiente')]));if(previous!==next)c.roleHistory=[...(c.roleHistory||[]),{from:previous,to:next,commission:c.commission,at:new Date().toISOString(),by:'Director'}];saveState();await window.CVStudioRealBridge?.updateCollaboratorAuth?.(c).catch(e=>toast(e.message));closeModal();openModule('colaboradores');toast('Colaborador, permisos y capacitación actualizados.');
    });
    const role=document.querySelector('#opsForm [name="role"]'),commission=document.querySelector('#opsForm [name="commission"]');role?.addEventListener('change',()=>{commission.value=window.CVSTUDIO_LEVELS[role.value]?.commission||commission.value;const defaults=new Set(permissionsForRole(role.value));document.querySelectorAll('#opsForm input[name="permission"]').forEach(input=>input.checked=defaults.has(input.value));});
  }
  function modalCreateCollaboratorOperational() {
    const roles=['Aprendiz','Operario','Líder','Supervisor','Director'];
    showForm('Nuevo colaborador','El correo se genera desde el nombre. La contraseña será temporal y deberá cambiarse en el primer ingreso.',
      input('name','Nombre y apellido')+
      input('email','Correo corporativo','email','')+
      select('role','Nivel',roles,'Aprendiz')+
      input('commission','Comisión base (%)','number','10')+
      input('birthDate','Fecha de nacimiento','date','',false)+
      input('startDate','Fecha de ingreso','date',new Date().toISOString().slice(0,10))+
      select('status','Estado',['Activo','Inactivo'],'Activo')+
      passwordInput('temporaryPassword','Contraseña temporal',''),
      'Crear colaborador', async (data,form)=>{
        const name=String(data.get('name')||'').trim();
        const email=String(data.get('email')||'').trim().toLowerCase();
        const password=String(data.get('temporaryPassword')||'');
        if(name.split(/\s+/).length<2){ toast('Ingresá nombre y apellido.'); return; }
        if(!email.endsWith('@cvstudio.com.ar')) { toast('El correo debe terminar en @cvstudio.com.ar'); return; }
        if(password.length<10){ toast('La contraseña temporal debe tener al menos 10 caracteres.'); return; }
        if(state.collaborators.some(c=>String(c.email).toLowerCase()===email)){ toast('Ya existe un colaborador con ese correo.'); return; }
        const submit=form.querySelector('button[type="submit"]'); submit.disabled=true; submit.textContent='Creando acceso…';
        try{
          if(!window.CVStudioRealBridge?.createCollaboratorAuth) throw new Error('El servicio de autenticación todavía no está disponible.');
          const auth=await window.CVStudioRealBridge.createCollaboratorAuth({fullName:name,email,password,role:String(data.get('role')),commission:Number(data.get('commission')||20),status:String(data.get('status')||'Activo')});
          const collaborator={id:nextId(state.collaborators),authUserId:auth.user.id,name,email,role:String(data.get('role')),commission:Number(data.get('commission')||20),birthDate:String(data.get('birthDate')||''),startDate:String(data.get('startDate')||''),status:String(data.get('status')||'Activo'),authStatus:'Activo',mustChangePassword:true,presenceStatus:'offline',lastSeen:null,permissions:permissionsForRole(String(data.get('role'))),capabilities:[],training:{},roleHistory:[{from:null,to:String(data.get('role')),commission:Number(data.get('commission')||10),at:new Date().toISOString(),by:'Director'}],createdAt:new Date().toISOString()};
          state.collaborators.push(collaborator);
          addActivity('settings','Colaborador y acceso creados',`${name} · ${collaborator.role}`);
          saveState();
          openModal(`<h2 id="modalTitle">Colaborador creado</h2><p style="color:var(--muted)">Entregale estas credenciales de forma privada. La contraseña deberá cambiarse en el primer ingreso.</p><div class="credentials-card"><div><span>Usuario</span><strong>${esc(email)}</strong></div><div><span>Contraseña temporal</span><strong>${esc(password)}</strong></div><div><span>Rol</span><strong>${esc(collaborator.role)}</strong></div></div><div class="modal-actions"><button class="button secondary" id="copyCredentials">Copiar credenciales</button><button class="button primary" data-close-modal>Finalizar</button></div>`);
          document.getElementById('copyCredentials')?.addEventListener('click',async()=>{await navigator.clipboard.writeText(`CVStudio Argentina\nUsuario: ${email}\nContraseña temporal: ${password}\nAcceso: https://cvstudio.com.ar`);toast('Credenciales copiadas.');});
          openModule('colaboradores');
        }catch(error){
          console.error(error);
          const message = error instanceof TypeError && /fetch/i.test(error.message||'')
            ? 'No se pudo conectar con el Worker de CVStudio. Publicá config/cloudflare-worker-contacto.js y verificá el secret SUPABASE_SERVICE_ROLE_KEY.'
            : (error.message||'No se pudo crear el colaborador.');
          toast(message);
          submit.disabled=false; submit.textContent='Crear colaborador';
        }
      });
    const nameInput=document.querySelector('#opsForm [name="name"]');
    const emailInput=document.querySelector('#opsForm [name="email"]');
    if(nameInput&&emailInput){
      const sync=()=>{emailInput.value=corporateEmailFromName(nameInput.value);};
      nameInput.addEventListener('input',sync); nameInput.addEventListener('blur',sync);
    }
    document.querySelectorAll('#opsForm [data-password-toggle]').forEach(button=>button.addEventListener('click',()=>{
      const field=button.closest('.password-field');
      const input=field?.querySelector('input');
      if(!input)return;
      const visible=input.type==='text';
      input.type=visible?'password':'text';
      button.querySelector('[data-eye-open]')?.toggleAttribute('hidden',!visible);
      button.querySelector('[data-eye-closed]')?.toggleAttribute('hidden',visible);
      button.setAttribute('aria-label',visible?'Mostrar contraseña':'Ocultar contraseña');
    }));
  }

  async function ensureRealClient(client) {
    if (client?.realClientId) return client;
    const bridge=window.CVStudioRealBridge;
    if(!bridge?.createRealClient) throw new Error('Supabase todavía no está disponible. Esperá unos segundos y volvé a intentar.');
    const persisted=await bridge.createRealClient({
      name:client.name,
      phone:client.phone||'',
      email:client.email||'',
      city:client.city||'',
      service:client.service||'Pendiente de definir',
      responsible:client.responsible||'pablexe',
      source:client.source||'WhatsApp'
    });
    if(!persisted?.clientId||!persisted?.requestId) throw new Error('Supabase no confirmó el alta del cliente.');
    client.realClientId=persisted.clientId;
    client.realRequestId=persisted.requestId;
    client.code=persisted.code||client.code||'';
    client.imported=true;
    saveState();
    return client;
  }

  function modalCreateClient() {
    showForm(
      'Nuevo cliente',
      'Ingresá únicamente los datos iniciales. El cliente completará el resto de la información desde su formulario.',
      input('name','Nombre y apellido') + input('phone','WhatsApp'),
      'Crear cliente',
      async (data,form)=>{
        const name=String(data.get('name')||'').trim();
        const phone=String(data.get('phone')||'').trim();
        if(name.length<3){toast('Ingresá el nombre y apellido del cliente.');return;}
        if(!phone){toast('Ingresá el número de WhatsApp del cliente.');return;}
        const normalizedPhone=normalizeWhatsApp(phone);
        if(state.clients.some(client=>normalizeWhatsApp(client.phone)===normalizedPhone&&client.name.toLowerCase()===name.toLowerCase())){
          toast('Ese cliente ya está cargado.');
          return;
        }
        const submit=form.querySelector('button[type="submit"]');
        submit.disabled=true;
        submit.textContent='Guardando en Supabase…';
        const client={
          id:nextId(state.clients),
          name,
          initials:initials(name),
          service:'Pendiente de definir',
          status:'En proceso',
          color:['#9b5de5','#3b82f6','#35d07f','#ff8a1f'][state.clients.length%4],
          time:'Ahora',
          phone,
          email:'',
          city:'',
          responsible:'pablexe',
          createdAt:new Date().toISOString(),
          source:'WhatsApp'
        };
        try{
          await ensureRealClient(client);
          state.clients.unshift(client);
          addActivity('client','Nuevo cliente registrado',`${name} · confirmado en Supabase`,client.id);
          saveState();
          selectedClient=client;
          closeModal();
          toast('Cliente guardado en Supabase. Ya podés enviarle el formulario o solicitar la firma.');
          openModule('clientes');
        }catch(error){
          console.error('[CVStudio] No se pudo crear el cliente:',error);
          toast(error.message||'No se pudo guardar el cliente en Supabase. No se creó un registro local incompleto.');
          submit.disabled=false;
          submit.textContent='Crear cliente';
        }
      }
    );
  }

  function currentClientOperational(){
    return state.clients.find(c=>c.id===selectedClient?.id) || state.clients[0] || null;
  }
  function normalizeWhatsApp(value){
    let digits=String(value||'').replace(/\D/g,'');
    if(!digits)return '';
    if(digits.startsWith('0'))digits=digits.slice(1);
    if(digits.length===10)digits='54'+digits;
    if(digits.startsWith('15')&&digits.length===12)digits='54'+digits.slice(2);
    return digits;
  }
  function modalEditClientOperational(){
    const client=currentClientOperational(); if(!client){toast('No hay un cliente seleccionado.');return;}
    showForm('Editar cliente','Actualizá únicamente los datos necesarios.',input('name','Nombre y apellido','text',client.name)+input('phone','WhatsApp','text',client.phone||'')+input('email','Correo','email',client.email||'')+input('city','Localidad','text',client.city||'',false)+select('service','Servicio',Object.keys(state.prices),client.service)+select('responsible','Responsable',(state.collaborators||[]).filter(c=>c.status==='Activo').map(c=>c.name),client.responsible||'pablexe'),'Guardar cambios',data=>{
      const name=String(data.get('name')||'').trim(); const email=String(data.get('email')||'').trim().toLowerCase();
      if(name.length<3){toast('Ingresá un nombre válido.');return;}
      if(email && !/^\S+@\S+\.\S+$/.test(email)){toast('Ingresá un correo válido.');return;}
      client.name=name; client.initials=initials(name); client.phone=String(data.get('phone')||'').trim(); client.email=email; client.city=String(data.get('city')||'').trim(); client.service=String(data.get('service')); client.responsible=String(data.get('responsible')); client.time='Ahora';
      state.jobs.filter(j=>j.clientId===client.id).forEach(j=>{j.client=client.name;});
      state.payments.filter(p=>p.clientId===client.id).forEach(p=>{p.client=client.name;});
      addActivity('client','Datos del cliente actualizados',`${client.name} · ${client.service}`,client.id); saveState(); closeModal(); toast('Datos guardados.'); openModule('clientes');
    });
  }
  function openClientWhatsApp(){
    const client=currentClientOperational(); if(!client){toast('No hay un cliente seleccionado.');return;}
    const number=normalizeWhatsApp(client.phone); if(!number){toast('Este cliente no tiene un número de WhatsApp válido.');return;}
    const message=encodeURIComponent(`Hola ${client.name.split(' ')[0]}, te contactamos desde CVStudio por tu servicio de ${client.service}.`);
    window.open(`https://wa.me/${number}?text=${message}`,'_blank','noopener');
  }
  function modalSendFormOperational(){
    const client=currentClientOperational(); if(!client){toast('No hay un cliente seleccionado.');return;}
    const services=Object.keys(state.prices).filter(name=>servicePrice(name)>0);
    const initial=services.includes(client.service)?client.service:services[0];
    const formTypeFor=service=>{
      const name=String(service||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
      if(name.includes('linkedin')&&!name.includes('cv')) return 'linkedin';
      if(name.includes('logo')) return 'logo';
      if(name.includes('banner')) return 'banner';
      if(name.includes('flyer')) return 'flyer';
      if(name.includes('web')) return 'diseno-web';
      return 'cv-profesional';
    };
    const generate=service=>{
      const formUrl=new URL('https://cvstudio.com.ar/');
      formUrl.searchParams.set('solicitud','1');
      formUrl.searchParams.set('servicio',formTypeFor(service));
      formUrl.searchParams.set('servicio_nombre',service);
      formUrl.searchParams.set('precio',String(servicePrice(service)));
      formUrl.searchParams.set('cliente',client.name||'');
      if(client.realClientId) formUrl.searchParams.set('cliente_id',client.realClientId);
      if(client.realRequestId) formUrl.searchParams.set('solicitud_id',client.realRequestId);
      if(client.phone) formUrl.searchParams.set('whatsapp',client.phone);
      if(client.email) formUrl.searchParams.set('email',client.email);
      if(client.city) formUrl.searchParams.set('localidad',client.city);
      const link=formUrl.toString();
      const text=`¡Hola ${client.name.split(' ')[0]}! Gracias por elegir CVStudio. Para comenzar con tu servicio de ${service} (${money(servicePrice(service))}), completá tus datos desde este enlace: ${link}`;
      return {link,text};
    };
    const first=generate(initial);
    openModal(`<h2 id="modalTitle">Enviar formulario</h2><p style="color:var(--muted)">Seleccioná el servicio contratado. El enlace se actualiza automáticamente con su formulario y precio.</p><div class="form-grid"><label>Cliente<input value="${esc(client.name)}" readonly></label><label>Servicio<select id="clientFormService">${services.map(name=>`<option value="${esc(name)}" ${name===initial?'selected':''}>${esc(name)} — ${money(servicePrice(name))}</option>`).join('')}</select></label><label class="span-2">Enlace<input id="generatedClientFormLink" value="${esc(first.link)}" readonly></label><label class="span-2">Mensaje<textarea id="generatedClientFormMessage" rows="6" readonly>${esc(first.text)}</textarea></label></div><div class="modal-actions"><button class="button secondary" data-close-modal>Cerrar</button><button class="button secondary" id="copyClientForm">Copiar enlace</button><button class="button primary" id="sendClientFormWhatsapp">Abrir WhatsApp</button></div>`);
    const serviceSelect=document.getElementById('clientFormService');
    const linkInput=document.getElementById('generatedClientFormLink');
    const messageInput=document.getElementById('generatedClientFormMessage');
    let current=first;
    const refresh=()=>{current=generate(serviceSelect.value);linkInput.value=current.link;messageInput.value=current.text;client.service=serviceSelect.value;client.time='Ahora';saveState();};
    serviceSelect.addEventListener('change',refresh);
    document.getElementById('copyClientForm')?.addEventListener('click',async()=>{await navigator.clipboard.writeText(current.link);toast('Enlace copiado.');});
    document.getElementById('sendClientFormWhatsapp')?.addEventListener('click',()=>{const number=normalizeWhatsApp(client.phone);if(!number){toast('Cargá un WhatsApp válido en el cliente.');return;}addActivity('client','Formulario enviado',`${client.name} · ${client.service}`,client.id);saveState();window.open(`https://wa.me/${number}?text=${encodeURIComponent(current.text)}`,'_blank','noopener');});
  }
  function uploadClientFile(){
    const client=currentClientOperational(); if(!client){toast('No hay un cliente seleccionado.');return;}
    openFileUploadModal(client);
  }
  function modalClientMoreActions(){
    const client=currentClientOperational(); if(!client){toast('No hay un cliente seleccionado.');return;}
    openModal(`<h2 id="modalTitle">Más acciones</h2><p style="color:var(--muted)">Acciones simples sobre la ficha seleccionada.</p><div class="grid quick-functional" style="grid-template-columns:1fr 1fr"><button class="action-card" data-client-extra="note">Agregar nota</button><button class="action-card" data-client-extra="reassign">Reasignar responsable</button><button class="action-card" data-client-extra="archive">Archivar cliente</button><button class="action-card danger" data-client-extra="delete">Eliminar cliente</button></div><div class="modal-actions"><button class="button secondary" data-close-modal>Cerrar</button></div>`);
    document.querySelector('[data-client-extra="note"]')?.addEventListener('click',()=>{closeModal();showForm('Agregar nota',`Seguimiento interno de ${client.name}.`,textarea('note','Nota interna',3),'Guardar nota',data=>{const note=String(data.get('note')||'').trim();if(!note){toast('Escribí una nota.');return;}addActivity('client','Nota de seguimiento',`${client.name}: ${note}`,client.id);saveState();closeModal();openModule('clientes');toast('Nota guardada.');});});
    document.querySelector('[data-client-extra="reassign"]')?.addEventListener('click',()=>{closeModal();showForm('Reasignar responsable',`Cliente: ${client.name}`,select('responsible','Responsable',(state.collaborators||[]).filter(c=>c.status==='Activo').map(c=>c.name),client.responsible||'pablexe'),'Guardar',data=>{client.responsible=String(data.get('responsible'));state.jobs.filter(j=>j.clientId===client.id&&j.stage!=='Entregado').forEach(j=>j.responsible=client.responsible);addActivity('client','Responsable actualizado',`${client.name} · ${client.responsible}`,client.id);saveState();closeModal();openModule('clientes');toast('Responsable actualizado.');});});
    document.querySelector('[data-client-extra="archive"]')?.addEventListener('click',()=>{if(!confirm(`¿Archivar a ${client.name}?`))return;client.status='Archivado';client.time='Ahora';addActivity('client','Cliente archivado',client.name,client.id);saveState();closeModal();openModule('clientes');toast('Cliente archivado.');});
    document.querySelector('[data-client-extra="delete"]')?.addEventListener('click',()=>{if(!confirm(`¿Eliminar definitivamente a ${client.name}? Esta acción no se puede deshacer.`))return;const ref=client.realRequestId||client.realOrderId;if(ref)state.hiddenClientRefs=[...new Set([...(state.hiddenClientRefs||[]),String(ref)])];state.clients=state.clients.filter(c=>c.id!==client.id);state.jobs=state.jobs.filter(j=>j.clientId!==client.id);state.payments=state.payments.filter(p=>p.clientId!==client.id);state.executions=state.executions.filter(x=>x.clientId!==client.id);state.activities=state.activities.filter(a=>a.clientId!==client.id);selectedClient=state.clients[0]||null;saveState();closeModal();openModule('clientes');toast('Cliente eliminado de la bandeja.');});
  }

  function modalPayment() {
    const defaultClient=state.clients.find(c=>c.id===selectedClient?.id) || state.clients[0];
    if(!defaultClient){toast('Primero creá un cliente.');return;}
    const clientOptions=state.clients.map(c=>({value:String(c.id),label:c.name}));
    showForm('Registrar pago','Simula el ingreso centralizado a Mercado Pago alias cvstudio.ar.',select('clientId','Cliente',clientOptions,String(defaultClient.id))+select('service','Servicio',Object.keys(state.prices),defaultClient.service)+input('amount','Importe calculado','number',servicePrice(defaultClient.service))+select('status','Estado',['Confirmado','Pendiente'],'Confirmado')+select('source','Canal de origen',['WhatsApp','Web','Facebook','Instagram','Mercado Libre','Referido','Otro'],'WhatsApp'),'Registrar pago',data=>{
      const client=state.clients.find(c=>c.id===Number(data.get('clientId')));
      const service=data.get('service'), amount=servicePrice(service), status=data.get('status');
      if(!client){toast('No se encontró el cliente seleccionado.');return;}
      if(amount<=0){toast('El servicio seleccionado no tiene un precio válido.');return;}
      if(status==='Confirmado' && state.payments.some(p=>p.clientId===client.id&&p.status==='Confirmado')){toast('Este cliente ya tiene un pago confirmado.');return;}
      const payment={id:nextId(state.payments),clientId:client.id,client:client.name,service,amount,status,source:data.get('source'),paymentMethod:'Mercado Pago',alias:'cvstudio.ar',priceSnapshot:amount,createdAt:new Date().toISOString()};
      state.payments.push(payment); client.service=payment.service; client.status=payment.status==='Confirmado'?'En proceso':'Esperando pago'; client.time='Ahora'; addActivity('payment',payment.status==='Confirmado'?'Pago confirmado':'Pago pendiente',`${client.name} · ${payment.service} · ${money(payment.amount)} · Mercado Pago · canal ${payment.source}`,client.id); saveState(); closeModal(); toast('Pago registrado; fondos y estadísticas recalculados.'); openModule(currentModule);
    });
    const form=document.getElementById('opsForm');
    const clientSelect=form.elements.clientId, serviceSelect=form.elements.service, amountInput=form.elements.amount;
    amountInput.readOnly=true;
    amountInput.title='El importe se calcula desde Servicios y precios';
    const syncFromClient=()=>{const client=state.clients.find(c=>c.id===Number(clientSelect.value));if(!client)return;serviceSelect.value=client.service;amountInput.value=servicePrice(client.service);};
    const syncFromService=()=>{amountInput.value=servicePrice(serviceSelect.value);};
    clientSelect.addEventListener('change',syncFromClient);
    serviceSelect.addEventListener('change',syncFromService);
  }
  function modalCreateJob() {
    const defaultClient=state.clients.find(c=>c.id===selectedClient?.id) || state.clients[0];
    if(!defaultClient){toast('Primero creá un cliente.');return;}
    showForm('Nuevo trabajo','El proyecto quedará asociado directamente a la ficha del cliente y a su calendario.',select('clientId','Cliente',state.clients.map(c=>({value:String(c.id),label:c.name})),String(defaultClient.id))+select('service','Servicio',Object.keys(state.prices),defaultClient.service)+select('responsible','Responsable',(state.collaborators||[]).filter(c=>c.status==='Activo').map(c=>c.name),defaultClient.responsible||'pablexe')+input('due','Entrega estimada','date','2026-08-08')+select('stage','Etapa',['En producción','En revisión','Pausado'],'En producción'),'Crear trabajo',data=>{
      const client=state.clients.find(c=>c.id===Number(data.get('clientId')));
      if(!client){toast('No se encontró el cliente seleccionado.');return;}
      const job={id:nextId(state.jobs),clientId:client.id,client:client.name,service:data.get('service'),stage:data.get('stage'),progress:data.get('stage')==='En revisión'?70:10,responsible:data.get('responsible'),due:data.get('due'),completedAt:null};
      state.jobs.unshift(job); client.service=job.service; client.status='En proceso'; client.responsible=job.responsible; addActivity('job','Nuevo trabajo creado',`${client.name} · ${job.service}`,client.id); saveState(); closeModal(); toast('Proyecto creado y asociado al cliente.'); openModule('clientes'); if(client.realRequestId)window.CVStudioRealBridge?.updateRequestStatus(client.realRequestId,'En producción',{asignado:job.responsible}).catch(console.error);
    });
    const form=document.getElementById('opsForm');
    const clientSelect=form.elements.clientId, serviceSelect=form.elements.service, responsibleSelect=form.elements.responsible;
    clientSelect.addEventListener('change',()=>{const client=state.clients.find(c=>c.id===Number(clientSelect.value));if(!client)return;serviceSelect.value=client.service;responsibleSelect.value=client.responsible||'pablexe';});
  }
  function registerExecution(job, client) {
    if (!Array.isArray(state.executions)) state.executions=[];
    if (state.executions.some(e=>e.jobId===job.id)) return;
    const rate=Number(state.rules.colab||0), base=servicePrice(job.service);
    state.executions.push({id:nextId(state.executions),jobId:job.id,clientId:client?.id||job.clientId,client:client?.name||job.client,service:job.service,responsible:job.responsible,baseAmount:base,commissionRate:rate,commissionAmount:base*rate/100,completedAt:job.completedAt||new Date().toISOString(),status:'Pendiente'});
  }

  function modalEditJob(jobId) {
    const job=state.jobs.find(j=>j.id===Number(jobId)); if(!job)return;
    showForm('Actualizar trabajo','El progreso y la etapa impactarán en el cliente y las comisiones.',input('client','Cliente','text',job.client,false)+input('progress','Progreso (%)','number',job.progress)+select('stage','Etapa',['En producción','En revisión','Entregado','Pausado'],job.stage)+select('responsible','Responsable',(state.collaborators||[]).filter(c=>c.status==='Activo').map(c=>c.name),job.responsible)+input('due','Entrega estimada','date',job.due),'Guardar cambios',data=>{
      const requestedStage=data.get('stage');
      const client=state.clients.find(c=>c.id===job.clientId);
      if(requestedStage==='Entregado' && !state.payments.some(p=>p.clientId===job.clientId&&p.status==='Confirmado')){toast('No se puede entregar: el cliente todavía no tiene un pago confirmado.');return;}
      job.progress=Math.max(0,Math.min(100,Number(data.get('progress')))); job.stage=requestedStage; job.responsible=data.get('responsible'); job.due=data.get('due');
      if(job.stage==='Entregado'){job.progress=100;job.completedAt=job.completedAt||new Date().toISOString();if(client)client.status='Esperando confirmación';registerExecution(job, client);addActivity('delivery','Trabajo entregado',`${job.client} · ${job.service}`,job.clientId);} else {job.completedAt=null;if(client)client.status='En proceso';addActivity('job','Trabajo actualizado',`${job.client} · ${job.stage} ${job.progress}%`,job.clientId);}
      saveState();closeModal();toast('Avance del proyecto actualizado.');openModule('clientes'); if(client?.realRequestId)window.CVStudioRealBridge?.updateRequestStatus(client.realRequestId,job.stage==='Entregado'?'Entregado':job.stage,{asignado:job.responsible}).catch(console.error);
    });
  }
  function modalStatus() {
    const client=state.clients.find(c=>c.id===selectedClient?.id); if(!client)return;
    showForm('Cambiar estado','Actualiza el estado visible del cliente.',select('status','Estado',['Nuevo contacto','Servicio seleccionado','Formulario enviado','Formulario recibido','Datos verificados','En redacción','En diseño','Esperando pago','Pago confirmado','Entregado','Esperando confirmación','Corrección solicitada','Terminado','Pausado','Archivado'],client.status),'Guardar estado',data=>{client.status=data.get('status');client.time='Ahora';addActivity('client','Estado de cliente actualizado',`${client.name} · ${client.status}`,client.id);saveState();closeModal();openModule('clientes');if(client.realRequestId)window.CVStudioRealBridge?.updateRequestStatus(client.realRequestId,client.status).catch(console.error);});
  }
  function downloadDataUrl(dataUrl,fileName){const a=document.createElement('a');a.href=dataUrl;a.download=fileName||'firma-cliente.png';document.body.appendChild(a);a.click();a.remove();}
  async function modalSignatureRequest(){
    const client=currentClientOperational();if(!client)return toast('No hay un cliente seleccionado.');
    const bridge=window.CVStudioRealBridge;if(!bridge?.listSignatureRequests)return toast('El módulo de firmas todavía no está conectado.');
    openModal(`<h2>Firma de carta de presentación</h2><p style="color:var(--muted)">Consultando solicitudes de ${esc(client.name)}…</p>`);
    try{
      let clientId=client.realClientId||client.legacySignatureClientId||String(client.id);
      let data=await bridge.listSignatureRequests(clientId);
      if(!data.requests?.length&&!client.realClientId){
        await ensureRealClient(client);
        clientId=client.realClientId;
        data=await bridge.listSignatureRequests(clientId);
      }
      const latest=data.requests?.[0];
      const received=latest?.estado==='recibida',pending=latest?.estado==='pendiente';
      openModal(`<h2>Firma de carta de presentación</h2><p style="color:var(--muted)">Generá un enlace exclusivo para ${esc(client.name)}. La firma recibida estará disponible durante 30 minutos.</p><div class="signature-panel-status"><strong>${latest?`Última solicitud: ${esc(latest.estado)}`:'Todavía no hay solicitudes'}</strong>${latest?.firmado?`<span>Recibida: ${new Date(latest.firmado).toLocaleString('es-AR')}</span>`:''}${received?`<span>Vence: ${new Date(latest.firma_expira).toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'})}</span>`:''}</div><div id="signatureLinkResult"></div><div class="modal-actions"><button class="button secondary" data-close-modal>Cerrar</button>${received?`<button class="button primary" id="downloadSignaturePng">Descargar PNG</button>`:`<button class="button primary" id="createSignatureLink">${pending?'Generar nuevo enlace':'Solicitar firma'}</button>`}</div>`);
      document.getElementById('downloadSignaturePng')?.addEventListener('click',async()=>{try{const file=await bridge.downloadSignature(latest.id);downloadDataUrl(file.dataUrl,file.fileName);toast('Firma descargada. Recordá incorporarla antes del vencimiento.');}catch(err){toast(err.message)}});
      document.getElementById('createSignatureLink')?.addEventListener('click',async e=>{
        const button=e.currentTarget,defaultLabel=button.textContent;
        button.disabled=true;button.textContent='Generando…';
        try{
          if(!client.realClientId)await ensureRealClient(client);
          const requestClientId=client.realClientId;
          const result=await bridge.createSignatureRequest({clientId:requestClientId,clientName:client.name,phone:client.phone||'',documentName:'Carta de presentación'}),url=result.signingUrl,number=normalizeWhatsApp(client.phone),message=`Hola ${client.name.split(' ')[0]}, ya podés firmar tu carta de presentación desde este enlace exclusivo de CVStudio:\n\n${url}\n\nLa firma será utilizada únicamente en tu documento y se eliminará automáticamente 30 minutos después de enviarla.`;
          document.getElementById('signatureLinkResult').innerHTML=`<div class="signature-link-box"><strong>Enlace exclusivo generado</strong><input id="signatureGeneratedUrl" value="${esc(url)}" readonly><div><button class="button secondary small" id="copySignatureUrl">Copiar enlace</button>${number?`<a class="button primary small" href="https://wa.me/${number}?text=${encodeURIComponent(message)}" target="_blank" rel="noopener">Enviar por WhatsApp</a>`:''}</div></div>`;
          document.querySelector('.signature-panel-status').innerHTML='<strong>Enlace generado · pendiente de firma</strong><span>La recepción se verá directamente en este panel.</span>';
          document.getElementById('copySignatureUrl').onclick=()=>navigator.clipboard.writeText(url).then(()=>toast('Enlace copiado.'));
          button.hidden=true;
          addActivity('client','Firma solicitada',`${client.name} · Carta de presentación`,client.id);saveState();
        }catch(err){toast(err.message);button.disabled=false;button.textContent=defaultLabel;}
      });
    }catch(err){openModal(`<h2>No se pudo abrir Firmas</h2><p style="color:var(--muted)">${esc(err.message)}</p><div class="modal-actions"><button class="button secondary" data-close-modal>Cerrar</button></div>`);}
  }
  function modalPricesOperational() {
    showForm('Editar precios','Estos valores se usan para pagos, comisiones y distribución de fondos.',Object.entries(state.prices).map(([name,value])=>input(`price_${encodeURIComponent(name)}`,name,'number',value)).join(''),'Guardar precios',data=>{
      Object.keys(state.prices).forEach(name=>state.prices[name]=Number(data.get(`price_${encodeURIComponent(name)}`))||0);
      addActivity('settings','Precios actualizados','La tabla económica fue recalculada');saveState();closeModal();toast('Precios guardados y cálculos recalculados.');openModule('administracion');window.CVStudioRealBridge?.updatePrices(state.prices).then(()=>toast('Precios sincronizados con la web y Mercado Pago.')).catch(err=>{console.error(err);toast(`No se sincronizó la web: ${err.message}`);});
    });
  }
  function modalExpense() {
    showForm('Registrar gasto publicitario','Se descontará de la Caja Publicidad / Fondo de Crecimiento.',input('description','Descripción')+input('amount','Importe','number','5000')+select('category','Fondo',['Fondo de Crecimiento'],'Fondo de Crecimiento'),'Registrar gasto',data=>{state.expenses.push({id:nextId(state.expenses),category:data.get('category'),description:data.get('description'),amount:Number(data.get('amount')),createdAt:new Date().toISOString()});addActivity('settings','Gasto publicitario registrado',`${data.get('description')} · ${money(Number(data.get('amount')))}`);saveState();closeModal();openModule('administracion');});
  }

  const oldHandleAction = handleAction;
  handleAction = function(action,el) {
    if(window.CVStudioAccess?.ready&&!window.CVStudioAccess.canAction(action)){toast('Tu nivel no permite realizar esta acción.');return;}
    if(action==='new-client') return modalCreateClient();
    if(action==='edit-client') return modalEditClientOperational();
    if(action==='open-whatsapp') return openClientWhatsApp();
    if(action==='send-form') return modalSendFormOperational();
    if(action==='signature-request') return modalSignatureRequest();
    if(action==='upload-file') return uploadClientFile();
    if(action==='register-payment') return modalPayment();
    if(action==='new-job') return modalCreateJob();
    if(action==='copy-client-sheet'){const client=currentClientOperational();if(!client)return;const sheet=buildClientCopySheet(client);navigator.clipboard.writeText(sheet).then(()=>toast('Ficha copiada y lista para pegar en ChatGPT.')).catch(()=>toast('No se pudo copiar la ficha.'));return;}
    if(action==='more-actions') return modalClientMoreActions();
    if(action==='job-detail') return modalEditJob(el.closest('[data-job-id]')?.dataset.jobId);
    if(action==='change-status') return modalStatus();
    if(action==='edit-prices') return modalPricesOperational();
    if(action==='register-expense') return modalExpense();
    if(action==='new-calendar-item') return modalCalendarItem();
    if(action==='save-funds') {
      const values={}; document.querySelectorAll('input[data-fund]').forEach(i=>values[i.dataset.fund]=Number(i.value));
      const total=Object.values(values).reduce((a,b)=>a+b,0);
      if(total!==100){toast(`Los porcentajes deben sumar 100%. Actualmente suman ${total}%.`);return;}
      state.rules=values;addActivity('settings','Reglas administrativas actualizadas',`Colab. ${values.colab}% · Crecimiento ${values.growth}% · Reserva ${values.reserve}% · Empresa ${values.company}%`);saveState();openModule('administracion');return;
    }
    if(action==='deliver-work') {
      const client=state.clients.find(c=>c.id===selectedClient?.id); const job=state.jobs.find(j=>j.clientId===client?.id && j.stage!=='Entregado');
      if(!job){toast('Este cliente no tiene un trabajo activo.');return;}
      const paid=state.payments.some(p=>p.clientId===client.id&&p.status==='Confirmado');
      if(!paid){toast('Entrega bloqueada: todavía no hay pago confirmado.');return;}
      job.stage='Entregado';job.progress=100;job.completedAt=new Date().toISOString();client.status='Esperando confirmación';registerExecution(job,client);addActivity('delivery','Trabajo entregado',`${client.name} · ${job.service}`,client.id);saveState();toast('Trabajo entregado y comisión registrada.');openModule('clientes');if(client.realRequestId)window.CVStudioRealBridge?.updateRequestStatus(client.realRequestId,'Entregado').catch(console.error);const rp=state.payments.find(p=>p.clientId===client.id&&p.realOrderId);if(rp)window.CVStudioRealBridge?.updateOrderStatus(rp.realOrderId,'Entregado').catch(console.error);return;
    }
    if(action==='send-message') {
      const field=document.getElementById('clientMessageInput');
      const sendButton=document.querySelector('[data-action="send-message"]');
      const message=field?.value.trim()||'';
      if(!message){toast('Escribí un mensaje antes de enviarlo.');return;}
      if(!selectedClient?.phone){toast('Este cliente no tiene un número de WhatsApp cargado.');return;}
      if(!window.CVStudioRealBridge?.sendWhatsApp){toast('La conexión de WhatsApp todavía no está disponible.');return;}

      field.disabled=true;
      if(sendButton)sendButton.disabled=true;
      toast('Enviando mensaje por WhatsApp...');

      window.CVStudioRealBridge.sendWhatsApp({
        to:selectedClient.phone,
        message,
        requestId:selectedClient.realRequestId||''
      }).then(result=>{
        addActivity('client','WhatsApp enviado',message,selectedClient.id);
        saveState();
        field.value='';
        openModule('clientes');
        toast(result?.id?'Mensaje enviado por WhatsApp.':'Mensaje aceptado por WhatsApp.');
      }).catch(error=>{
        console.error('[CVStudio WhatsApp] Error de envío:',error);
        toast(error?.message||'No se pudo enviar el mensaje por WhatsApp.');
      }).finally(()=>{
        const currentField=document.getElementById('clientMessageInput');
        if(currentField)currentField.disabled=false;
        const currentButton=document.querySelector('[data-action="send-message"]');
        if(currentButton)currentButton.disabled=false;
      });
      return;
    }
    if(action==='reset-demo') return resetState();
    return oldHandleAction(action,el);
  };

  // Reemplaza acciones rápidas genéricas por acciones funcionales.
  const quick=document.getElementById('quickActions');
  quick.onclick=()=>openModal(`<h2 id="modalTitle">Acciones rápidas</h2><p style="color:var(--muted)">Accesos directos a las operaciones más utilizadas.</p><div class="grid quick-functional" style="grid-template-columns:1fr 1fr"><button class="action-card" data-quick="client">+ Nuevo cliente</button><button class="action-card" data-quick="payment">+ Registrar pago</button><button class="action-card" data-quick="job">+ Nuevo trabajo</button><button class="action-card" data-quick="sync">Sincronizar datos</button></div>`);
  // Envío inmediato desde Seguimiento: Enter envía; Shift+Enter conserva salto de línea.
  // Se ejecuta en captura para evitar que otros listeners del panel intercepten la tecla.
  document.addEventListener('keydown',event=>{
    if(event.key!=='Enter' || event.shiftKey || event.isComposing)return;
    const input=event.target?.closest?.('#clientMessageInput');
    if(!input)return;
    event.preventDefault();
    event.stopPropagation();
    handleAction('send-message', document.querySelector('[data-action="send-message"]'));
  }, true);

  document.addEventListener('click',event=>{
    const btn=event.target.closest('[data-quick]');if(!btn)return;
    closeModal();
    if(btn.dataset.quick==='client')modalCreateClient();
    if(btn.dataset.quick==='payment')modalPayment();
    if(btn.dataset.quick==='job')modalCreateJob();
    if(btn.dataset.quick==='reset')resetState();
  });

  const notificationButton=document.getElementById('notificationButton');
  const notificationCount=document.getElementById('notificationCount');
  if(notificationButton) notificationButton.onclick=()=>{
    const items=(state.activities||[]).slice(0,3);
    const content=items.length?items.map(item=>`<div class="header-notification-item"><span style="--c:${activityColor(item.type)}">${icon(typeIcon(item.type))}</span><div><strong>${esc(item.title)}</strong><small>${esc(item.detail)}</small></div><time>${formatDateTime(item.at||item.createdAt)}</time></div>`).join(''):`<div class="header-notification-item"><span style="--c:#3b82f6">${icon('calendar')}</span><div><strong>Agenda disponible</strong><small>Revisá campañas, fechas y actividades programadas.</small></div></div><div class="header-notification-item"><span style="--c:#35d07f">${icon('database')}</span><div><strong>Sistema operativo</strong><small>Supabase se encuentra conectado.</small></div></div><div class="header-notification-item"><span style="--c:#ffd23f">${icon('shield')}</span><div><strong>Sin alertas críticas</strong><small>No hay incidencias pendientes.</small></div></div>`;
    openModal(`<div class="header-modal-title"><div><span class="header-modal-icon">${icon('bell')}</span><h2 id="modalTitle">Notificaciones</h2></div><small>Últimos movimientos del Centro de Operaciones</small></div><div class="header-notification-list">${content}</div>`);
    notificationButton.classList.add('is-read');
    if(notificationCount){notificationCount.textContent='0';notificationCount.hidden=true;}
  };

  const miniCalendarHtml=()=>{
    const now=new Date(),year=now.getFullYear(),month=now.getMonth(),events=calendarMonthEvents(year,month),byDay={};
    events.forEach(event=>{const day=parseLocalDate(event.startDate).getDate();if(!byDay[day])byDay[day]=event;});
    const days=['L','M','M','J','V','S','D'].map(day=>`<span class="mini-calendar-name">${day}</span>`).join('');
    const blanks='<span class="mini-calendar-day is-empty"></span>'.repeat((new Date(year,month,1).getDay()+6)%7),monthDays=new Date(year,month+1,0).getDate();
    const dates=Array.from({length:monthDays},(_,index)=>{const day=index+1,event=byDay[day],meta=event?(calendarTypeMeta[event.type]||calendarTypeMeta.reminder):null;return `<button class="mini-calendar-day ${event?'has-event':''} ${day===now.getDate()?'is-today':''}" type="button" ${event?`style="--event:${meta.color}" title="${esc(event.title)}"`:''}><b>${day}</b>${event?'<i></i>':''}</button>`}).join('');
    const monthName=new Intl.DateTimeFormat('es-AR',{month:'long',year:'numeric'}).format(now).replace(/^./,l=>l.toUpperCase());
    return `<div class="mini-calendar"><div class="mini-calendar-head"><div><strong>${esc(monthName)}</strong><small>Agenda CVStudio</small></div><span class="status" style="--c:#35d07f">${events.length} eventos</span></div><div class="mini-calendar-grid">${days}${blanks}${dates}</div><div class="mini-calendar-events">${events.slice(0,6).map(event=>{const meta=calendarTypeMeta[event.type]||calendarTypeMeta.reminder;return `<div><i style="--c:${meta.color}"></i><span><b>${parseLocalDate(event.startDate).getDate()}</b>${esc(event.title)}</span><small>${esc(event.status||meta.label)}</small></div>`}).join('')||'<p class="empty-state">Sin actividades este mes.</p>'}</div></div>`;
  };
  const dateChip=document.getElementById('dateChip');
  if(dateChip)dateChip.innerHTML=`<span class="date-glyph"></span>${new Intl.DateTimeFormat('es-AR',{day:'numeric',month:'long',year:'numeric'}).format(new Date())}`;
  if(dateChip) dateChip.onclick=()=>openModal(`<div class="header-modal-title"><div><span class="header-modal-icon">${icon('calendar')}</span><h2 id="modalTitle">Calendario</h2></div><small>Campañas, cumpleaños, feriados y tareas</small></div>${miniCalendarHtml()}<div class="modal-actions"><button class="button secondary" data-close-modal>Cerrar</button><button class="button primary" id="openFullCalendar">Abrir calendario completo</button></div>`);
  document.addEventListener('click',event=>{if(event.target.closest('#openFullCalendar')){closeModal();openModule('calendario');}});

  // Actualiza la interfaz en la misma página cuando Supabase o el puente real cambian el estado.
  // Evita recargas completas y bucles de sincronización.
  let refreshQueued = false;
  window.addEventListener('cvstudio:state-updated', () => {
    if (refreshQueued) return;
    refreshQueued = true;
    setTimeout(() => {
      refreshQueued = false;
      state = loadState();
      syncLegacyClients();
      openModule(currentModule);
    }, 80);
  });

  // Render inicial con datos funcionales.
  openModule(currentModule);
})();
