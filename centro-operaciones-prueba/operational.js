/* Centro de Operaciones CVStudio — capa funcional Clientes visual v1.4.30 WhatsApp + Enter FINAL
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

  const PERMISSION_MODULES = ['Inicio','Clientes','Administración','Marketing','Calendario','Plantillas','Archivos','Integraciones','Colaboradores','Generador URL','Configuración'];
  const ROLE_PERMISSION_MAP = {
    Aprendiz: ['Inicio:ver','Plantillas:ver','Archivos:ver'],
    Operario: ['Inicio:ver','Clientes:ver','Clientes:editar','Plantillas:ver','Archivos:ver','Archivos:subir'],
    Líder: ['Inicio:ver','Clientes:ver','Clientes:editar','Calendario:ver','Calendario:editar','Plantillas:ver','Archivos:ver','Archivos:subir','Generador URL:ver','Generador URL:editar'],
    Supervisor: ['Inicio:ver','Clientes:ver','Clientes:editar','Administración:ver','Marketing:ver','Marketing:editar','Calendario:ver','Calendario:editar','Plantillas:ver','Plantillas:editar','Archivos:ver','Archivos:subir','Integraciones:ver','Generador URL:ver','Generador URL:editar'],
    Director: PERMISSION_MODULES.flatMap(module=>[`${module}:ver`,`${module}:editar`,`${module}:eliminar`])
  };
  const permissionsForRole = role => [...(ROLE_PERMISSION_MAP[role] || ROLE_PERMISSION_MAP.Aprendiz)];

  const seed = {
    version: 9,
    rules: { colab: 20, growth: 15, reserve: 5, company: 60 },
    prices: { ...SERVICE_DEFAULTS },
    clients: [], jobs: [], payments: [], executions: [], expenses: [], activities: [], urlSpaces: [], collaborators: [{id:1,name:'pablexe',email:'pablexe@cvstudio.com.ar',role:'Director',commission:20,birthDate:'',startDate:'2026-08-01',status:'Activo',authStatus:'Activo',permissions:permissionsForRole('Director'),capabilities:['CV Profesional','LinkedIn','Cartas','Portfolio','Atención al cliente','Diseño gráfico','Marketing','Revisión'],training:{}}]
  };

  const clone = value => JSON.parse(JSON.stringify(value));
  function loadState() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORE_KEY));
      if (stored && [2,3,4,5,6,7,8,9].includes(stored.version)) {
        stored.version = 9;
        stored.executions = Array.isArray(stored.executions) ? stored.executions : [];
        stored.activities = Array.isArray(stored.activities) ? stored.activities : [];
        stored.urlSpaces = Array.isArray(stored.urlSpaces) ? stored.urlSpaces : [];
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
    selectedClient = clients.find(c => c.id === current.id) || clients[0];
  }
  syncLegacyClients();

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

  function clientRowsOperational(list=state.clients) {
    return list.map(c=>`<div class="client-row ${selectedClient?.id===c.id?'is-selected':''}" data-client-id="${c.id}"><span class="client-avatar" style="background:${c.color}">${esc(c.initials)}</span><div><strong>${esc(c.name)}</strong><small>${esc(c.service)}</small></div><div class="client-row-status"><span class="status" style="--c:${statusColor(c.status)}">${esc(c.status)}</span><small>${esc(c.time||'')}</small></div></div>`).join('') || '<div class="empty-state">No se encontraron clientes.</div>';
  }

  function clientTimelineHtml(c, payment, job) {
    const entries = [];
    entries.push({at:null,who:c.name,text:`Consulta por ${c.service}.`,kind:'in'});
    state.activities.filter(a=>a.clientId===c.id).forEach(a=>entries.push({at:a.at,who:'CVStudio',text:`${a.title}: ${a.detail}`,kind:'out'}));
    if (payment && !entries.some(e=>e.text.includes('Pago'))) entries.push({at:payment.createdAt,who:'Administración',text:`Pago ${payment.status.toLowerCase()} · ${money(payment.amount)} · Mercado Pago (${payment.source||'canal no indicado'})`,kind:'out'});
    if (job && !entries.some(e=>e.text.includes('Trabajo'))) entries.push({at:job.completedAt||null,who:'Equipo CVStudio',text:`${job.stage} · ${job.progress}% · ${job.responsible}`,kind:'out'});
    return entries.sort((a,b)=>String(a.at||'').localeCompare(String(b.at||''))).map(e=>`<div class="message ${e.kind==='out'?'out':''}"><b>${esc(e.who)}</b><p>${esc(e.text)}</p><small>${e.at?formatDateTime(e.at):'Registro inicial'}</small></div>`).join('');
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
    return `<section class="grid clients-layout"><section class="panel client-list"><div class="client-list-head"><div class="panel-head"><h2>Clientes</h2><button class="button primary" data-action="new-client">+ Nuevo cliente</button></div><div class="search-box" style="width:100%"><span>${icon('search')}</span><input id="clientSearch" placeholder="Buscar cliente..."></div><div class="filters-row"><button class="filter-chip is-active" data-client-filter="Todos">Todos ${state.clients.length}</button><button class="filter-chip" data-client-filter="En proceso">En proceso ${counts('En proceso')}</button><button class="filter-chip" data-client-filter="Esperando pago">Esperando pago ${counts('Esperando pago')}</button><button class="filter-chip" data-client-filter="Entregado">Entregados ${counts('Entregado')}</button><button class="filter-chip" data-client-filter="Archivado">Archivados ${counts('Archivado')}</button></div></div><div class="client-rows" id="clientRows">${clientRowsOperational()}</div></section><section class="client-workspace" id="clientWorkspace">${clientWorkspaceOperational()}</section></section>`;
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
    return `<section class="grid kpi-grid">${kpi('chart','Inversión registrada',money(spent),`${state.expenses.length} movimientos`,'#3b82f6')}${kpi('message','Canales con ventas',channels.length,'origen de pagos confirmados','#35d07f')}${kpi('file','Ventas generadas',confirmed.length,'pagos confirmados','#9b5de5')}${kpi('dollar','Ingreso promedio',confirmed.length?money(revenue/confirmed.length):money(0),'por venta confirmada','#ff8a1f')}${kpi('wallet','Fondo disponible',money(available),'crecimiento menos gastos','#28c2d8')}</section><section class="grid marketing-grid">${panel('Caja publicitaria · Fondo de Crecimiento',`<div class="donut-wrap">${donutChart(budget?Math.round(spent/budget*100)+'%':'0%','Ejecutado')}<div class="legend"><span><b>Asignado:</b> ${money(budget)}</span><span><b>Gastado:</b> ${money(spent)}</span><span><b>Disponible:</b> ${money(available)}</span></div></div>`)}<section class="panel span-2"><div class="panel-head"><div><h2>Inversión y resultados</h2><p>Se construye con movimientos reales de marketing y ventas.</p></div></div>${spent||confirmed.length?lineSvg():`<div class="empty-state empty-state-large"><strong>Sin datos suficientes</strong><span>Registrá gastos publicitarios y pagos confirmados para construir esta estadística.</span></div>`}</section>${panel('Rendimiento por canal',channels.length?`<div class="channel-grid">${channels.map(([name,val])=>`<div class="channel-card"><strong>${esc(name)}</strong><span>${confirmed.filter(p=>(p.source||'Sin identificar')===name).length} ventas</span><b>${money(val)}</b></div>`).join('')}</div>`:`<div class="empty-state empty-state-large"><strong>Sin canales medidos</strong><span>El origen de cada pago aparecerá aquí automáticamente.</span></div>`)}${panel('Campañas activas',`<div class="empty-state empty-state-large"><strong>Sin campañas sincronizadas</strong><span>Meta Ads y otras plataformas aparecerán cuando se conecten sus APIs.</span></div>`)}${panel('Creatividades recientes',`<div class="empty-state empty-state-large"><strong>Sin creatividades registradas</strong><span>Podrás cargar piezas y asociarlas a campañas desde este módulo.</span></div>`)}</section>`;
  }
  function calendarOperationalRenderer() {
    const jobs=state.jobs.filter(j=>j.due).sort((a,b)=>String(a.due).localeCompare(String(b.due)));
    const active=jobs.filter(j=>!['Entregado','Pausado'].includes(j.stage));
    const paused=jobs.filter(j=>j.stage==='Pausado');
    const delivered=jobs.filter(j=>j.stage==='Entregado');
    const statusColorMap={Entregado:'#35d07f',Pausado:'#ff8a1f','En revisión':'#3b82f6','En producción':'#9b5de5'};
    return `<section class="grid kpi-grid">${kpi('calendar','Proyectos con fecha',jobs.length,'agenda del mes','#9b5de5')}${kpi('briefcase','En ejecución',active.length,'proyectos activos','#35d07f')}${kpi('clock','En pausa',paused.length,'esperando continuidad','#ff8a1f')}${kpi('check','Entregados',delivered.length,'proyectos finalizados','#3b82f6')}${kpi('users','Cumpleaños próximos',0,'sin colaboradores cargados','#ffd23f')}</section><section class="grid calendar-layout"><section class="panel span-2"><div class="panel-head"><div><h2>Calendario general</h2><p>Proyectos, entregas, publicidad, cumpleaños y actividades del equipo.</p></div></div>${jobs.length?`<div class="schedule-list">${jobs.map(j=>`<div class="activity-item" data-client-calendar="${j.clientId||''}"><span class="activity-dot" style="color:${statusColorMap[j.stage]||'#9b5de5'}">${icon('calendar')}</span><div><strong>${esc(j.client)} · ${esc(j.service)}</strong><small>${esc(j.stage)} · Responsable: ${esc(j.responsible)}</small></div><time>${esc(j.due)}</time></div>`).join('')}</div>`:`<div class="empty-state empty-state-large"><strong>Calendario vacío</strong><span>Los proyectos aparecerán acá cuando se les asigne una fecha desde la ficha del cliente.</span></div>`}</section>${panel('Resumen de proyectos',jobs.length?`<div class="simple-list"><div class="list-item">En ejecución <b style="margin-left:auto">${active.length}</b></div><div class="list-item">En pausa <b style="margin-left:auto">${paused.length}</b></div><div class="list-item">Entregados <b style="margin-left:auto">${delivered.length}</b></div></div>`:`<div class="empty-state"><strong>Sin proyectos programados</strong></div>`)}</section>`;
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
    {slug:'beauty-nails-by-eliana',name:'Beauty Nails by Eliana',menuLabel:'By Eliana',service:'Portfolio profesional · Estética',status:'Publicado',protected:false,password:'',downloads:true,primaryColor:'#9b5de5',secondaryColor:'#ffd23f',source:'Sistema',origin:'Sistema',builtin:true,publicPath:'/beauty-nails-by-eliana/'},
    {slug:'julieta-ferrari',name:'Julieta Ferrari · Follow Digital',menuLabel:'Follow Digital',service:'Portfolio profesional · Fotografía',status:'Publicado',protected:false,password:'',downloads:true,primaryColor:'#3b82f6',secondaryColor:'#35d07f',source:'Sistema',origin:'Sistema',builtin:true,publicPath:'/julieta-ferrari/'}
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
    const delivered=(state.clients||[]).filter(c=>c.status==='Entregado').map(c=>({
      slug:normalizeSlug(c.name),name:c.name,service:c.service,status:'Publicado',protected:false,password:'',downloads:true,primaryColor:'#9b5de5',secondaryColor:'#ffd23f',source:'operaciones'
    }));
    const migrated=(state.portfolios||[]).map(p=>({
      slug:p.slug,name:p.full_name||p.brand_name||p.username,service:p.business_type||'Portfolio',status:'Publicado',protected:Boolean(p.password_enabled),password:'',downloads:true,primaryColor:'#9b5de5',secondaryColor:'#ffd23f',source:'portfolio existente'
    })).filter(p=>p.slug);
    const custom=(state.urlSpaces||[]).filter(s=>!BUILTIN_PORTFOLIOS.some(b=>b.slug===s.slug));
    const merged=[...BUILTIN_PORTFOLIOS.map(b=>({...b,...(storedUrlSpace(b.slug)||{})})),...migrated,...delivered,...custom];
    const seen=new Set();
    return merged.filter(item=>item.slug&&!seen.has(item.slug)&&(seen.add(item.slug),true)).map(item=>({...item,origin:item.origin||(item.builtin?'Sistema':'Panel'),url:`https://cvstudio.com.ar${item.publicPath||`/${item.slug}`}`}));
  }
  function urlSpaceDetails(space) {
    if(!space) return `<div class="empty-state empty-state-large"><strong>Seleccioná un espacio</strong><span>La vista previa y sus opciones aparecerán aquí.</span></div>`;
    return `<div class="url-config-grid">
      <section class="url-config-form-wrap">
        <div class="url-preview-toolbar"><div><span class="status" style="--c:${space.status==='Publicado'?'#35d07f':'#ffd23f'}">${esc(space.status||'Publicado')}</span><small>Origen: ${esc(space.origin||space.source||'Panel')}</small></div><div><button class="button secondary small" data-url-copy="${esc(space.url)}">${icon('copy')} Copiar URL</button><button class="button primary small" data-url-open="${esc(space.url)}">${icon('external')} Abrir</button></div></div>
        <form id="urlSpaceForm" class="form-grid url-space-form" data-original-slug="${esc(space.slug)}">
          <label>Cliente o marca<input name="name" value="${esc(space.name)}" required></label>
          <label>Nombre en menú<input name="menuLabel" value="${esc(space.menuLabel||space.name)}" required><small class="field-help">Es el nombre que aparecerá automáticamente en “Mis clientes”.</small></label>
          <label>Tipo de espacio<input name="service" value="${esc(space.service)}" required></label>
          <label class="span-2">URL pública<div class="url-slug-field"><span>cvstudio.com.ar/</span><input name="slug" value="${esc(space.slug)}" required pattern="[a-z0-9-]+" ${space.builtin?'readonly':''}></div><small class="field-help">${space.builtin?'Esta dirección corresponde a un portfolio publicado y se mantiene protegida.':'Usá letras minúsculas, números y guiones.'}</small></label>
          <label>Estado<select name="status"><option ${space.status==='Publicado'?'selected':''}>Publicado</option><option ${space.status==='Borrador'?'selected':''}>Borrador</option><option ${space.status==='Pausado'?'selected':''}>Pausado</option><option ${space.status==='Oculto'?'selected':''}>Oculto</option><option ${space.status==='Eliminado'?'selected':''}>Eliminado</option></select></label>
          <label>Acceso<select name="protected"><option value="false" ${!space.protected?'selected':''}>Público</option><option value="true" ${space.protected?'selected':''}>Con contraseña</option></select></label>
          <label>Contraseña<input name="password" value="${esc(space.password||'')}" placeholder="Opcional"></label>
          <label>Permitir descargas<select name="downloads"><option value="true" ${space.downloads!==false?'selected':''}>Sí</option><option value="false" ${space.downloads===false?'selected':''}>No</option></select></label>
          <label>Color principal<input type="color" name="primaryColor" value="${esc(space.primaryColor||'#9b5de5')}"></label>
          <label>Color secundario<input type="color" name="secondaryColor" value="${esc(space.secondaryColor||'#ffd23f')}"></label>
          <label class="span-2">Nota interna<textarea name="note" rows="3" placeholder="Observaciones sobre este espacio">${esc(space.note||'')}</textarea></label>
          <div class="url-form-actions span-2"><div class="url-form-actions-left"><button type="button" class="button secondary" data-url-toggle="${esc(space.slug)}" data-next-status="${space.status==='Publicado'?'Oculto':'Publicado'}">${space.status==='Publicado'?'Ocultar / desactivar':'Activar y publicar'}</button><button type="button" class="button secondary" data-url-reset>Restablecer</button><button type="button" class="button danger" data-url-delete="${esc(space.slug)}">Eliminar proyecto</button></div><button type="submit" class="button primary">Guardar configuración</button></div>
        </form>
      </section>
      <section class="url-preview-side"><div class="url-preview-frame"><iframe src="${esc(space.url)}?preview=1&v=1.4.0" title="Vista previa de ${esc(space.name)}" loading="lazy"></iframe></div><div class="url-space-info"><div><span>Dirección pública</span><strong class="link-text">/${esc(space.slug)}</strong></div><div><span>Protección</span><strong>${space.protected?'Con contraseña':'Acceso público'}</strong></div></div></section>
    </div>`;
  }
  function urlOperationalRenderer() {
    const spaces=getUrlSpaces();
    if(!spaces.some(s=>s.slug===selectedUrlSpace)) selectedUrlSpace=spaces[0]?.slug||'';
    const selected=spaces.find(s=>s.slug===selectedUrlSpace);
    const cards=spaces.map(s=>`<article class="campaign-card url-space-card ${s.slug===selectedUrlSpace?'is-selected':''}" data-url-select="${esc(s.slug)}"><div class="campaign-head"><div><strong>${esc(s.name)}</strong><small>${esc(s.service)}</small></div><span class="status" style="--c:${s.status==='Publicado'?'#35d07f':'#ffd23f'}">${esc(s.status||'Publicado')}</span></div><p class="link-text">${esc(s.url)}</p><div class="url-card-actions"><button class="button secondary small" data-url-copy="${esc(s.url)}">${icon('copy')} Copiar</button><button class="button secondary small" data-url-open="${esc(s.url)}">${icon('external')} Ver</button><button class="button primary small" data-url-config="${esc(s.slug)}">${icon('settings')} Configurar</button></div></article>`).join('');
    return `<section class="grid kpi-grid">${kpi('file','URLs activas',spaces.filter(s=>s.status==='Publicado').length,'espacios publicados','#9b5de5')}${kpi('eye','Visitas este mes',0,'analytics pendiente','#3b82f6')}${kpi('upload','Descargas',0,'sin registros','#35d07f')}${kpi('lock','Espacios protegidos',spaces.filter(s=>s.protected).length,'contraseñas configuradas','#ffd23f')}${kpi('zap','Disponibilidad','100%','módulo operativo','#28c2d8')}</section><section class="grid url-layout"><section class="panel"><div class="panel-head"><div><h2>Espacios de clientes</h2><p>Portfolios publicados y listos para revisar.</p></div><button class="button primary" data-action="new-url">+ Generar nueva URL</button></div><div class="url-spaces-list">${cards||`<div class="empty-state empty-state-large"><strong>Sin espacios generados</strong><span>Creá el primer espacio personalizado para un cliente.</span></div>`}</div></section><section class="panel url-config-panel"><div class="panel-head"><div><h2>Configuración del espacio</h2><p>Editá los datos, el acceso y la presentación del portfolio seleccionado.</p></div></div><div id="urlSpaceDetails">${urlSpaceDetails(selected)}</div></section></section>`;
  }
  function openNewUrlModal(){
    showForm('Generar nueva URL','Creá un nuevo espacio personalizado. La dirección se guardará en este navegador.',
      input('name','Cliente o marca')+input('service','Tipo de espacio','text','Portfolio profesional')+input('slug','URL pública')+select('status','Estado',['Borrador','Publicado'],'Borrador')+select('protected','Acceso',[{value:'false',label:'Público'},{value:'true',label:'Con contraseña'}],'false')+input('password','Contraseña','text','',false)+select('downloads','Permitir descargas',[{value:'true',label:'Sí'},{value:'false',label:'No'}],'true')+input('primaryColor','Color principal','color','#9b5de5')+input('secondaryColor','Color secundario','color','#ffd23f'),
      'Crear espacio',data=>{
        const name=String(data.get('name')).trim(); const slug=normalizeSlug(data.get('slug')||name);
        if(!slug){toast('Ingresá una URL válida.');return;}
        if(getUrlSpaces().some(s=>s.slug===slug)){toast('Esa URL ya existe. Elegí otra dirección.');return;}
        const space={id:Date.now(),slug,name,service:String(data.get('service')).trim(),status:String(data.get('status')),protected:String(data.get('protected'))==='true',password:String(data.get('password')||''),downloads:String(data.get('downloads'))==='true',primaryColor:String(data.get('primaryColor')||'#9b5de5'),secondaryColor:String(data.get('secondaryColor')||'#ffd23f'),source:'Panel',origin:'Panel',createdAt:new Date().toISOString()};
        upsertUrlSpace(space); selectedUrlSpace=slug; closeModal(); openModule('generador-url'); toast('Nueva URL creada y lista para configurar.');
      });
    const nameInput=document.querySelector('#opsForm [name="name"]'), slugInput=document.querySelector('#opsForm [name="slug"]');
    if(nameInput&&slugInput) nameInput.addEventListener('input',()=>{if(!slugInput.dataset.manual)slugInput.value=normalizeSlug(nameInput.value);});
    if(slugInput) slugInput.addEventListener('input',()=>{slugInput.dataset.manual='1';slugInput.value=normalizeSlug(slugInput.value);});
  }
  renderers.inicio = dashboardRenderer;
  renderers.clientes = clientsRenderer;
  renderers.administracion = adminRenderer;
  renderers.marketing = marketingOperationalRenderer;
  renderers.calendario = calendarOperationalRenderer;
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
      document.querySelectorAll('[data-client-id]').forEach(row => row.onclick = () => {
        const found = state.clients.find(c=>c.id===Number(row.dataset.clientId));
        if(found){ selectedClient = clients.find(c=>c.id===found.id) || found; document.getElementById('clientRows').innerHTML=clientRowsOperational(); document.getElementById('clientWorkspace').innerHTML=clientWorkspaceOperational(); bindModuleActions('clientes'); }
      });
      document.querySelectorAll('[data-client-filter]').forEach(btn => btn.onclick = () => {
        document.querySelectorAll('[data-client-filter]').forEach(x=>x.classList.toggle('is-active',x===btn));
        const filter=btn.dataset.clientFilter;
        const list=filter==='Todos'?state.clients:state.clients.filter(c=>c.status===filter);
        document.getElementById('clientRows').innerHTML=clientRowsOperational(list);
        bindModuleActions('clientes');
      });
      const search=document.getElementById('clientSearch');
      if(search) search.oninput=()=>{
        const q=search.value.toLowerCase().trim();
        document.getElementById('clientRows').innerHTML=clientRowsOperational(state.clients.filter(c=>(c.name+c.service+c.status+c.phone).toLowerCase().includes(q)));
        bindModuleActions('clientes');
      };
    }
    if(id==='generador-url') {
      const refreshSelection=(slug)=>{selectedUrlSpace=slug;openModule('generador-url');setTimeout(()=>document.querySelector('.url-config-panel')?.scrollIntoView({behavior:'smooth',block:'start'}),80);};
      document.querySelectorAll('[data-url-select]').forEach(card=>card.onclick=e=>{if(e.target.closest('button'))return;refreshSelection(card.dataset.urlSelect);});
      document.querySelectorAll('[data-url-config]').forEach(btn=>btn.onclick=e=>{e.stopPropagation();refreshSelection(btn.dataset.urlConfig);});
      document.querySelectorAll('[data-url-copy]').forEach(btn=>btn.onclick=async e=>{e.stopPropagation();try{await navigator.clipboard.writeText(btn.dataset.urlCopy);toast('URL copiada al portapapeles.');}catch(_){toast('No se pudo copiar automáticamente.');}});
      document.querySelectorAll('[data-url-open]').forEach(btn=>btn.onclick=e=>{e.stopPropagation();window.open(btn.dataset.urlOpen,'_blank','noopener');});
      const form=document.getElementById('urlSpaceForm');
      if(form) form.onsubmit=e=>{e.preventDefault();const data=new FormData(form),originalSlug=form.dataset.originalSlug,slug=normalizeSlug(data.get('slug'));if(!slug){toast('Ingresá una URL válida.');return;}if(getUrlSpaces().some(s=>s.slug===slug&&s.slug!==originalSlug)){toast('Esa URL ya está utilizada.');return;}const current=getUrlSpaces().find(s=>s.slug===originalSlug)||{};const builtin=Boolean(current.builtin);const updated={...current,originalSlug,slug:builtin?originalSlug:slug,name:String(data.get('name')).trim(),menuLabel:String(data.get('menuLabel')||data.get('name')).trim(),service:String(data.get('service')).trim(),status:String(data.get('status')),protected:String(data.get('protected'))==='true',password:String(data.get('password')||''),downloads:String(data.get('downloads'))==='true',primaryColor:String(data.get('primaryColor')||'#9b5de5'),secondaryColor:String(data.get('secondaryColor')||'#ffd23f'),origin:builtin?'Sistema':'Panel',source:builtin?'Sistema':'Panel',updatedAt:new Date().toISOString()};if(!builtin&&originalSlug!==slug)state.urlSpaces=state.urlSpaces.filter(s=>s.slug!==originalSlug);upsertUrlSpace(updated);selectedUrlSpace=updated.slug;openModule('generador-url');toast('Configuración guardada correctamente.');};
      const reset=document.querySelector('[data-url-reset]');if(reset)reset.onclick=()=>{if(confirm('¿Restablecer los cambios de este espacio?')){state.urlSpaces=state.urlSpaces.filter(s=>s.slug!==form.dataset.originalSlug);saveState();openModule('generador-url');toast('Configuración restablecida.');}};
      const toggleBtn=document.querySelector('[data-url-toggle]');if(toggleBtn)toggleBtn.onclick=()=>{const slug=toggleBtn.dataset.urlToggle;const space=getUrlSpaces().find(s=>s.slug===slug);if(!space)return;const next=toggleBtn.dataset.nextStatus||'Oculto';upsertUrlSpace({...space,status:next,deleted:false,updatedAt:new Date().toISOString()});selectedUrlSpace=slug;openModule('generador-url');toast(next==='Publicado'?'Proyecto activado y publicado.':'Proyecto ocultado y acceso público desactivado.');};
      const deleteBtn=document.querySelector('[data-url-delete]');if(deleteBtn)deleteBtn.onclick=()=>{const slug=deleteBtn.dataset.urlDelete;const space=getUrlSpaces().find(s=>s.slug===slug);if(!space)return;if(confirm(`¿Eliminar el proyecto /${slug}/? La URL pública quedará bloqueada y dejará de mostrar el portfolio.`)){const deleted={...space,status:'Eliminado',deleted:true,deletedAt:new Date().toISOString(),origin:space.builtin?'Sistema':'Panel',source:space.builtin?'Sistema':'Panel'};upsertUrlSpace(deleted);selectedUrlSpace=slug;openModule('generador-url');toast('Proyecto eliminado y acceso público bloqueado.');}};
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
  };

  function showForm(title,desc,body,submitText,onSubmit) {
    openModal(`<h2 id="modalTitle">${title}</h2><p style="color:var(--muted)">${desc}</p><form id="opsForm" class="form-grid">${body}<div class="modal-actions" style="grid-column:1/-1"><button type="button" class="button secondary" data-close-modal>Cancelar</button><button type="submit" class="button primary">${submitText}</button></div></form>`);
    const form=document.getElementById('opsForm');
    form.addEventListener('submit',event=>{event.preventDefault();onSubmit(new FormData(form),form);});
  }
  const input = (name,label,type='text',value='',required=true) => `<label>${label}<input name="${name}" type="${type}" value="${esc(value)}" ${required?'required':''}></label>`;
  const passwordInput = (name,label,value='',required=true) => `<label>${label}<div class="password-field"><input name="${name}" type="text" value="${esc(value)}" autocomplete="new-password" spellcheck="false" ${required?'required':''}><button type="button" class="password-toggle" aria-label="Ocultar contraseña" title="Mostrar u ocultar contraseña" data-password-toggle><span data-eye-open>Ocultar</span><span data-eye-closed hidden>Mostrar</span></button></div><small class="field-help">Visible durante el alta para poder verificarla antes de crear el acceso.</small></label>`;
  const select = (name,label,options,value='') => `<label>${label}<select name="${name}">${options.map(item=>{const o=typeof item==='object'?item:{value:item,label:item};return `<option value="${esc(o.value)}" ${String(o.value)===String(value)?'selected':''}>${esc(o.label)}</option>`}).join('')}</select></label>`;


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

  function modalCreateClient() {
    showForm(
      'Nuevo cliente',
      'Ingresá únicamente los datos iniciales. El cliente completará el resto de la información desde su formulario.',
      input('name','Nombre y apellido') + input('phone','WhatsApp'),
      'Crear cliente',
      data=>{
        const name=String(data.get('name')||'').trim();
        const phone=String(data.get('phone')||'').trim();
        if(name.length<3){toast('Ingresá el nombre y apellido del cliente.');return;}
        if(!phone){toast('Ingresá el número de WhatsApp del cliente.');return;}
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
          createdAt:new Date().toISOString()
        };
        state.clients.unshift(client);
        addActivity('client','Nuevo cliente registrado',`${name} · información pendiente del cliente`,client.id);
        saveState();
        selectedClient=client;
        closeModal();
        toast('Cliente creado. Ahora podés enviarle el formulario para que complete sus datos.');
        openModule('clientes');
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
    const picker=document.createElement('input'); picker.type='file'; picker.multiple=true; picker.accept='.pdf,.doc,.docx,.jpg,.jpeg,.png,.webp';
    picker.onchange=()=>{const files=[...picker.files]; if(!files.length)return; client.files=client.files||[]; files.forEach(f=>client.files.push({id:Date.now()+Math.random(),name:f.name,size:f.size,type:f.type||'archivo',addedAt:new Date().toISOString()})); addActivity('client','Archivos asociados',`${client.name} · ${files.length} archivo(s)`,client.id); saveState(); toast(`${files.length} archivo(s) registrados en la ficha.`); openModule('clientes');};
    picker.click();
  }
  function modalClientMoreActions(){
    const client=currentClientOperational(); if(!client){toast('No hay un cliente seleccionado.');return;}
    openModal(`<h2 id="modalTitle">Más acciones</h2><p style="color:var(--muted)">Acciones simples sobre la ficha seleccionada.</p><div class="grid quick-functional" style="grid-template-columns:1fr 1fr"><button class="action-card" data-client-extra="note">Agregar nota</button><button class="action-card" data-client-extra="reassign">Reasignar responsable</button><button class="action-card" data-client-extra="archive">Archivar cliente</button><button class="action-card danger" data-client-extra="delete">Eliminar cliente</button></div><div class="modal-actions"><button class="button secondary" data-close-modal>Cerrar</button></div>`);
    document.querySelector('[data-client-extra="note"]')?.addEventListener('click',()=>{closeModal();showForm('Agregar nota',`Seguimiento interno de ${client.name}.`,textarea('note','Nota interna',3),'Guardar nota',data=>{const note=String(data.get('note')||'').trim();if(!note){toast('Escribí una nota.');return;}addActivity('client','Nota de seguimiento',`${client.name}: ${note}`,client.id);saveState();closeModal();openModule('clientes');toast('Nota guardada.');});});
    document.querySelector('[data-client-extra="reassign"]')?.addEventListener('click',()=>{closeModal();showForm('Reasignar responsable',`Cliente: ${client.name}`,select('responsible','Responsable',(state.collaborators||[]).filter(c=>c.status==='Activo').map(c=>c.name),client.responsible||'pablexe'),'Guardar',data=>{client.responsible=String(data.get('responsible'));state.jobs.filter(j=>j.clientId===client.id&&j.stage!=='Entregado').forEach(j=>j.responsible=client.responsible);addActivity('client','Responsable actualizado',`${client.name} · ${client.responsible}`,client.id);saveState();closeModal();openModule('clientes');toast('Responsable actualizado.');});});
    document.querySelector('[data-client-extra="archive"]')?.addEventListener('click',()=>{if(!confirm(`¿Archivar a ${client.name}?`))return;client.status='Archivado';client.time='Ahora';addActivity('client','Cliente archivado',client.name,client.id);saveState();closeModal();openModule('clientes');toast('Cliente archivado.');});
    document.querySelector('[data-client-extra="delete"]')?.addEventListener('click',()=>{if(!confirm(`¿Eliminar definitivamente a ${client.name}? Esta acción no se puede deshacer.`))return;state.clients=state.clients.filter(c=>c.id!==client.id);state.jobs=state.jobs.filter(j=>j.clientId!==client.id);state.payments=state.payments.filter(p=>p.clientId!==client.id);state.activities=state.activities.filter(a=>a.clientId!==client.id);selectedClient=state.clients[0]||null;saveState();closeModal();openModule('clientes');toast('Cliente eliminado.');});
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
      const clientId=client.realClientId||String(client.id),data=await bridge.listSignatureRequests(clientId),latest=data.requests?.[0];
      const received=latest?.estado==='recibida',pending=latest?.estado==='pendiente';
      openModal(`<h2>Firma de carta de presentación</h2><p style="color:var(--muted)">Generá un enlace exclusivo para ${esc(client.name)}. La firma recibida estará disponible durante 30 minutos.</p><div class="signature-panel-status"><strong>${latest?`Última solicitud: ${esc(latest.estado)}`:'Todavía no hay solicitudes'}</strong>${latest?.firmado?`<span>Recibida: ${new Date(latest.firmado).toLocaleString('es-AR')}</span>`:''}${received?`<span>Vence: ${new Date(latest.firma_expira).toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'})}</span>`:''}</div><div id="signatureLinkResult"></div><div class="modal-actions"><button class="button secondary" data-close-modal>Cerrar</button>${received?`<button class="button primary" id="downloadSignaturePng">Descargar PNG</button>`:`<button class="button primary" id="createSignatureLink">${pending?'Generar nuevo enlace':'Solicitar firma'}</button>`}</div>`);
      document.getElementById('downloadSignaturePng')?.addEventListener('click',async()=>{try{const file=await bridge.downloadSignature(latest.id);downloadDataUrl(file.dataUrl,file.fileName);toast('Firma descargada. Recordá incorporarla antes del vencimiento.');}catch(err){toast(err.message)}});
      document.getElementById('createSignatureLink')?.addEventListener('click',async e=>{
        const button=e.currentTarget,defaultLabel=button.textContent;
        button.disabled=true;button.textContent='Generando…';
        try{
          const result=await bridge.createSignatureRequest({clientId,clientName:client.name,phone:client.phone||'',documentName:'Carta de presentación'}),url=result.signingUrl,number=normalizeWhatsApp(client.phone),message=`Hola ${client.name.split(' ')[0]}, ya podés firmar tu carta de presentación desde este enlace exclusivo de CVStudio:\n\n${url}\n\nLa firma será utilizada únicamente en tu documento y se eliminará automáticamente 30 minutos después de enviarla.`;
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

  const calendarEvents={
    3:{label:'Liquidaciones y revisión mensual',color:'#9b5de5',type:'Administración'},
    7:{label:'Campaña de CV Profesional',color:'#3b82f6',type:'Marketing'},
    14:{label:'Cumpleaños del equipo',color:'#ffd23f',type:'Equipo'},
    17:{label:'Feriado: General San Martín',color:'#35d07f',type:'Argentina'},
    21:{label:'Publicación y seguimiento',color:'#e1306c',type:'Redes'},
    31:{label:'Cierre mensual',color:'#ff8a1f',type:'Administración'}
  };
  const miniCalendarHtml=()=>{
    const days=['L','M','M','J','V','S','D'].map(day=>`<span class="mini-calendar-name">${day}</span>`).join('');
    const blanks='<span class="mini-calendar-day is-empty"></span>'.repeat(5);
    const dates=Array.from({length:31},(_,index)=>{const day=index+1,event=calendarEvents[day];return `<button class="mini-calendar-day ${event?'has-event':''} ${day===3?'is-today':''}" type="button" ${event?`style="--event:${event.color}" title="${esc(event.label)}"`:''}><b>${day}</b>${event?'<i></i>':''}</button>`}).join('');
    return `<div class="mini-calendar"><div class="mini-calendar-head"><div><strong>Agosto 2026</strong><small>Agenda CVStudio</small></div><span class="status" style="--c:#35d07f">6 eventos</span></div><div class="mini-calendar-grid">${days}${blanks}${dates}</div><div class="mini-calendar-events">${Object.entries(calendarEvents).map(([day,event])=>`<div><i style="--c:${event.color}"></i><span><b>${day} Ago</b>${esc(event.label)}</span><small>${event.type}</small></div>`).join('')}</div></div>`;
  };
  const dateChip=document.getElementById('dateChip');
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
