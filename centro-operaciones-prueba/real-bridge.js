/* CVStudio Centro de Operaciones · v1.4.51 WhatsApp bridge
   Puente con las tablas productivas existentes. Requiere sesión administrativa.
   Importa solicitudes/clientes/comunicaciones/archivos y pedidos/precios reales,
   manteniendo la operación diaria en las tablas stage hasta aprobar la migración final. */
(() => {
  'use strict';
  const STORE_KEY = 'cvstudio_ops_operational_v2';
  const WORKER_URL = 'https://cvstudio-contacto.cvpro-duccionesar.workers.dev';
  const PORTFOLIO_WORKER_URL = 'https://cvstudio-portfolios.cvpro-duccionesar.workers.dev';
  const STATUS_ID = 'opsSyncStatus';
  const SYNC_KEY = 'cvstudio_ops_real_sync_v25';
  const db = () => window.cvstudioSupabase;

  const esc = value => String(value ?? '').trim();
  const digits = value => String(value || '').replace(/\D/g, '');
  const hashId = value => {
    let h = 2166136261;
    for (const c of String(value || '')) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
    return Math.abs(h >>> 0) || 1;
  };
  const initials = name => esc(name).split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase() || 'CV';
  const statusMap = value => {
    const x = esc(value).toLowerCase();
    if (/entregado|finalizado/.test(x)) return 'Entregado';
    if (/pago/.test(x) && /pendiente|esperando/.test(x)) return 'Esperando pago';
    if (/cancelado/.test(x)) return 'Pausado';
    return 'En proceso';
  };
  const stageMap = value => {
    const x = esc(value).toLowerCase();
    if (/entregado|finalizado/.test(x)) return 'Entregado';
    if (/revisi/.test(x)) return 'En revisión';
    if (/pausado|cancelado|falta/.test(x)) return 'Pausado';
    return 'En producción';
  };
  const progressMap = value => {
    const x = esc(value).toLowerCase();
    if (/finalizado|entregado/.test(x)) return 100;
    if (/revisi/.test(x)) return 80;
    if (/producci/.test(x)) return 40;
    if (/confirmado|pago recibido/.test(x)) return 20;
    return 10;
  };
  function status(text, mode='connected') {
    const el = document.getElementById(STATUS_ID);
    if (!el) return;
    el.dataset.mode = mode;
    el.innerHTML = `<span></span>${text}`;
  }
  function getState() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || '{}'); }
    catch { return {}; }
  }
  function setState(state) { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
  async function currentSession(forceRefresh=false) {
    const client=db();
    if (!client) throw new Error('Supabase no está disponible.');
    let session=(await client.auth.getSession()).data.session;
    if (forceRefresh || (session?.expires_at && session.expires_at * 1000 < Date.now() + 60000)) {
      const refreshed=await client.auth.refreshSession();
      session=refreshed.data.session || session;
    }
    return session;
  }
  async function api(action, payload={}) {
    let session=await currentSession(false);
    if (!session?.access_token) throw new Error('La sesión del panel no está activa. Cerrá sesión e ingresá nuevamente.');
    const call=token=>fetch(WORKER_URL, {
      method: 'POST',
      cache: 'no-store',
      headers: {'Content-Type':'application/json', Authorization:`Bearer ${token}`},
      body: JSON.stringify({action, ...payload})
    });
    let response=await call(session.access_token);
    if (response.status===401) {
      session=await currentSession(true);
      if (session?.access_token) response=await call(session.access_token);
    }
    const data=await response.json().catch(()=>({}));
    if (!response.ok || !data.ok) throw new Error(data.message || 'No se pudo completar la operación.');
    return data;
  }
  async function portfolioApi(action, payload={}) {
    let session=await currentSession(false);
    if (!session?.access_token) throw new Error('La sesión del panel no está activa.');
    const call=token=>fetch(`${PORTFOLIO_WORKER_URL}/api/admin`,{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({action,...payload})});
    let response=await call(session.access_token);
    if(response.status===401){session=await currentSession(true);if(session?.access_token)response=await call(session.access_token);}
    const data=await response.json().catch(()=>({}));
    if(!response.ok||!data.ok)throw new Error(data.message||'No se pudo administrar el espacio.');
    return data;
  }
  const canvaStatus=()=>api('canva-status');
  const metaStatus=()=>api('meta-status');
  const metaCampaigns=()=>api('meta-campaigns');
  const connectCanva=async()=>{
    const result=await api('canva-oauth-start');
    if(!result.authorizationUrl)throw new Error('Canva no devolvió una dirección de autorización.');
    window.location.assign(result.authorizationUrl);
    return result;
  };
  function mergeByKey(existing, incoming, keyFn) {
    const map = new Map((existing || []).map(item => [keyFn(item), item]));
    for (const item of incoming || []) {
      const key = keyFn(item);
      map.set(key, {...(map.get(key)||{}), ...item});
    }
    return [...map.values()];
  }
  async function loadReal() {
    const client = db();
    if (!client) throw new Error('Supabase no está disponible.');
    const { data: { session } } = await client.auth.getSession();
    if (!session) {
      status('Iniciar sesión en /admin', 'warning');
      return false;
    }
    status('Sincronizando datos reales…', 'syncing');

    const [requestsResult, commsResult, storageResult, paymentsData, productsData, portfoliosData, canvaData, metaData] = await Promise.all([
      client.from('solicitudes').select('*, clientes(*), archivos(*)').order('fecha_creacion', {ascending:false}).limit(1000),
      client.from('comunicaciones').select('*').order('fecha_creacion', {ascending:false}).limit(3000),
      client.storage.from('cvstudio-archivos').list('',{limit:1}).catch(error=>({data:null,error})),
      api('payments-admin-list').catch(error => ({orders:[], _error:error.message})),
      api('payments-admin-products').catch(error => ({products:[], _error:error.message})),
      portfolioApi('portfolio-admin-list').catch(error => ({clients:[], _error:error.message})),
      api('canva-status').catch(error => ({configured:true,connected:false,_error:error.message})),
      api('meta-campaigns').catch(error => ({connected:false,campaigns:[],_error:error.message}))
    ]);
    if (requestsResult.error) throw requestsResult.error;
    if (commsResult.error) throw commsResult.error;

    const state = getState();
    state.version = 11;
    state.rules ||= {colab:20,growth:15,reserve:5,company:60};
    state.clients ||= []; state.jobs ||= []; state.payments ||= []; state.executions ||= [];
    state.expenses ||= []; state.activities ||= []; state.prices ||= {};

    state.hiddenClientRefs=Array.isArray(state.hiddenClientRefs)?state.hiddenClientRefs:[];
    const hiddenRefs=new Set(state.hiddenClientRefs.map(String));
    state.clients=state.clients.filter(c=>!hiddenRefs.has(String(c.realRequestId||c.realOrderId||'')));
    const retainedClientIds=new Set(state.clients.map(c=>String(c.id)));
    state.jobs=state.jobs.filter(item=>retainedClientIds.has(String(item.clientId))&&!hiddenRefs.has(String(item.realRequestId||'')));
    state.payments=state.payments.filter(item=>retainedClientIds.has(String(item.clientId))&&!hiddenRefs.has(String(item.realOrderId||'')));
    state.executions=state.executions.filter(item=>retainedClientIds.has(String(item.clientId)));
    state.activities=state.activities.filter(item=>item.clientId==null||retainedClientIds.has(String(item.clientId)));
    const requests = (requestsResult.data || []).filter(r=>!hiddenRefs.has(String(r.id)));
    const communications = commsResult.data || [];
    const commByRequest = new Map();
    communications.forEach(c => {
      const list = commByRequest.get(c.solicitud_id) || [];
      list.push(c); commByRequest.set(c.solicitud_id, list);
    });

    const realClients = requests.map((r, index) => {
      const c = r.clientes || {};
      const id = hashId(`solicitud:${r.id}`);
      return {
        id, name:c.nombre || r.codigo || 'Cliente', initials:initials(c.nombre),
        service:r.servicio || r.subtipo || 'Solicitud', status:statusMap(r.estado),
        color:['#9b5de5','#3b82f6','#35d07f','#ff8a1f'][index%4],
        time:r.fecha_actualizacion || r.fecha_creacion || 'Ahora', phone:c.telefono || '', email:c.email || '',
        city:c.ciudad || '', responsible:(r.responsable && r.responsable !== 'Exequiel') ? r.responsable : 'pablexe',
        source:r.canal || 'Web', realRequestId:r.id, realClientId:r.cliente_id, code:r.codigo,
        notes:r.notas || '', files:r.archivos || [], formData:r.datos?.formulario || r.datos?.formData || r.datos || {}, imported:true
      };
    });
    state.clients = mergeByKey(state.clients, realClients, x => x.realRequestId ? `real:${x.realRequestId}` : `local:${x.id}`);

    const jobs = requests.filter(r => /confirmado|producci|revisi|entregado|finalizado|pausado/i.test(r.estado || '')).map(r => {
      const clientId = hashId(`solicitud:${r.id}`);
      return {
        id:hashId(`job:${r.id}`), clientId, client:r.clientes?.nombre || r.codigo,
        service:r.servicio || 'Solicitud', stage:stageMap(r.estado), progress:progressMap(r.estado),
        responsible:(r.responsable && r.responsable !== 'Exequiel') ? r.responsable : 'pablexe',
        due:(r.datos?.fecha_entrega || r.datos?.fechaEntrega || '').slice?.(0,10) || '',
        completedAt:/entregado|finalizado/i.test(r.estado || '') ? (r.fecha_actualizacion || null) : null,
        realRequestId:r.id, imported:true
      };
    });
    state.jobs = mergeByKey(state.jobs, jobs, x => x.realRequestId ? `real:${x.realRequestId}` : `local:${x.id}`);

    const activities = [];
    requests.forEach(r => {
      const clientId = hashId(`solicitud:${r.id}`);
      activities.push({id:hashId(`request:${r.id}`),type:'client',title:'Solicitud recibida',detail:`${r.clientes?.nombre || r.codigo} · ${r.servicio || 'Solicitud'} · ${r.estado}`,clientId,createdAt:r.fecha_creacion,realRef:r.id});
      (commByRequest.get(r.id)||[]).forEach(c => activities.push({
        id:hashId(`comm:${c.id}`), type:c.direccion==='entrante'?'message':'client',
        title:c.direccion==='entrante'?'Mensaje recibido':'Comunicación registrada',
        detail:`${r.clientes?.nombre || r.codigo}: ${c.asunto || c.mensaje || ''}`.slice(0,500), clientId,
        createdAt:c.fecha_creacion, realRef:c.id
      }));
    });

    const orders = (paymentsData.orders || []).filter(order=>!hiddenRefs.has(String(order.id)));
    const byEmail = new Map(state.clients.filter(c=>c.email).map(c=>[c.email.toLowerCase(),c]));
    const byPhone = new Map(state.clients.filter(c=>c.phone).map(c=>[digits(c.phone),c]));
    const realPayments = [];
    orders.forEach((order,index) => {
      let c = byEmail.get(esc(order.cliente_email).toLowerCase()) || byPhone.get(digits(order.cliente_whatsapp));
      if (!c) {
        const id = hashId(`mpclient:${order.cliente_email || order.cliente_whatsapp || order.id}`);
        c = {id,name:order.cliente_nombre || 'Cliente Mercado Pago',initials:initials(order.cliente_nombre),service:order.producto_nombre,status:order.estado_pago==='approved'?'En proceso':'Esperando pago',color:['#35d07f','#3b82f6','#ff8a1f'][index%3],time:order.updated_at||order.created_at,phone:order.cliente_whatsapp||'',email:order.cliente_email||'',responsible:'pablexe',source:'Web',realOrderId:order.id,imported:true};
        state.clients.push(c);
      }
      realPayments.push({
        id:hashId(`payment:${order.id}`),clientId:c.id,client:c.name,service:order.producto_nombre,
        amount:Number(order.importe||0),status:order.estado_pago==='approved'?'Confirmado':'Pendiente',
        source:'Web',paymentMethod:'Mercado Pago',alias:'cvstudio.ar',priceSnapshot:Number(order.importe||0),
        createdAt:order.fecha_aprobacion||order.created_at,realOrderId:order.id,externalReference:order.external_reference,
        orderStatus:order.estado_pedido,imported:true
      });
      activities.push({id:hashId(`pactivity:${order.id}`),type:'payment',title:order.estado_pago==='approved'?'Pago aprobado':'Pedido registrado',detail:`${order.cliente_nombre} · ${order.producto_nombre} · $${Number(order.importe||0).toLocaleString('es-AR')}`,clientId:c.id,createdAt:order.fecha_aprobacion||order.created_at,realRef:order.id});
    });
    state.payments = mergeByKey(state.payments, realPayments, x => x.realOrderId ? `real:${x.realOrderId}` : `local:${x.id}`);
    state.activities = mergeByKey(state.activities, activities, x => x.realRef ? `real:${x.realRef}` : `local:${x.id}`)
      .sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0)).slice(0,3000);

    const products = productsData.products || [];
    if (products.length) {
      const mapped = {};
      products.forEach(p => mapped[p.title] = Number(p.test_mode && p.test_price ? p.test_price : p.unit_price));
      state.prices = {...state.prices, ...mapped};
      state._realProducts = products;
    }
    state.portfolios=Array.isArray(portfoliosData.clients)?portfoliosData.clients:state.portfolios||[];
    state.metaCampaigns=Array.isArray(metaData.campaigns)?metaData.campaigns:state.metaCampaigns||[];
    state.metaSummary=metaData.summary||state.metaSummary||{spend:0,results:0,impressions:0};
    state._integrationStatus={
      ...(state._integrationStatus||{}),
      supabase:'connected',
      supabaseDetail:`Base operativa · ${requests.length} solicitudes leídas`,
      storage:storageResult?.error?'error':'connected',
      storageDetail:storageResult?.error?storageResult.error.message:'Bucket privado verificado',
      payments:paymentsData._error?'error':'connected',
      paymentsDetail:paymentsData._error?paymentsData._error:`${orders.length} pedidos leídos`,
      portfolios:portfoliosData._error?'error':'connected',
      portfoliosDetail:portfoliosData._error?portfoliosData._error:`${state.portfolios.length} espacios leídos`,
      whatsapp:'configured',
      resend:'configured',
      analytics:'configured',
      canva:canvaData.connected?'connected':canvaData.configured?'pending':'configured',
      canvaDetail:canvaData.connected?'Cuenta y tokens verificados':(canvaData._error||(canvaData.configured?'Lista para autorizar':'Faltan credenciales en Cloudflare')),
      facebook:metaData.connected?'connected':metaData._error?'error':'pending',
      facebookDetail:metaData.connected?`${state.metaCampaigns.length} campañas sincronizadas`:(metaData._error||'Meta Marketing pendiente')
    };
    state._realSync = {at:new Date().toISOString(),requests:requests.length,orders:orders.length,communications:communications.length,portfolios:state.portfolios.length,source:'production-read'};
    setState(state);
    status(`Datos reales · ${requests.length} clientes`, 'connected');
    return true;
  }

  async function updateRequestStatus(realRequestId, statusValue, extra={}) {
    if (!realRequestId) return;
    const {error} = await db().from('solicitudes').update({estado:statusValue,fecha_actualizacion:new Date().toISOString(),...extra}).eq('id',realRequestId);
    if (error) throw error;
  }
  async function createRealClient(clientData) {
    const clientId = crypto.randomUUID(), requestId = crypto.randomUUID(), now = new Date().toISOString();
    const code = `CVS-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.random().toString(36).slice(2,7).toUpperCase()}`;
    let result = await db().from('clientes').insert({id:clientId,nombre:clientData.name,telefono:clientData.phone||'',email:clientData.email||'',ciudad:clientData.city||'',creado:now});
    if (result.error) throw result.error;
    result = await db().from('solicitudes').insert({id:requestId,cliente_id:clientId,codigo:code,servicio:clientData.service,subtipo:'',descripcion:'Alta manual desde Centro de Operaciones',datos:{},estado:'Pendiente de revisión',prioridad:'Normal',responsable:'Exequiel',asignado:clientData.responsible||'Sin definir',notas:'',canal:clientData.source||'WhatsApp',fecha_creacion:now,fecha_actualizacion:now});
    if (result.error) {
      try { await db().from('clientes').delete().eq('id',clientId); }
      catch (_) { /* limpieza de cortesía; se conserva el error original */ }
      throw result.error;
    }
    return {clientId,requestId,code};
  }
  async function addNote(realRequestId, text) {
    if (!realRequestId || !text) return;
    const request = await db().from('solicitudes').select('notas').eq('id',realRequestId).maybeSingle();
    if (request.error) throw request.error;
    const current = request.data?.notas || '';
    const stamp = new Intl.DateTimeFormat('es-AR',{dateStyle:'short',timeStyle:'short'}).format(new Date());
    const {error} = await db().from('solicitudes').update({notas:`${current}${current?'\n':''}[${stamp}] ${text}`,fecha_actualizacion:new Date().toISOString()}).eq('id',realRequestId);
    if (error) throw error;
  }
  async function sendWhatsApp(payload) { return api('whatsapp-admin-send', payload); }
  async function createSignatureRequest(payload) { return api('signature-admin-create', payload); }
  async function listSignatureRequests(clientId) { return api('signature-admin-list', {clientId}); }
  async function downloadSignature(id) { return api('signature-admin-download', {id}); }

  async function updateOrderStatus(realOrderId, statusValue) {
    if (!realOrderId) return;
    return api('payments-admin-update',{id:realOrderId,estadoPedido:statusValue});
  }

  async function createCollaboratorAuth(payload) { return api('collaborator-admin-create', payload); }
  async function updateCollaboratorAuth(payload) { return api('collaborator-admin-update', {collaborator:payload}); }
  async function deleteCollaboratorAuth(payload) { return api('collaborator-admin-delete', {authUserId:payload.authUserId,email:payload.email}); }
  async function createPortfolioClient(payload) { return portfolioApi('portfolio-admin-create', payload); }
  async function updatePortfolioClient(portfolioId, changes) { return portfolioApi('portfolio-admin-update', {portfolioId, changes}); }
  async function resetPortfolioPassword(portfolioId, password) { return portfolioApi('portfolio-admin-reset-password', {portfolioId, password}); }
  async function deletePortfolioClient(portfolioId) { return portfolioApi('portfolio-admin-delete', {portfolioId}); }
  async function updatePrices(prices) {
    const priceKeyByProductId = {
      'cv-profesional':'CV Profesional',
      'cv-freelance':'CV Freelance',
      'linkedin':'LinkedIn',
      'combo-2-cv':'Combo 2 CV Profesionales',
      'combo-cv-linkedin':'CV + LinkedIn'
    };
    const products=Object.fromEntries(Object.entries(priceKeyByProductId).map(([productId,key])=>[productId,Number(prices[key])]));
    return api('payments-admin-products-update',{products});
  }

  window.CVStudioRealBridge = {loadReal, updateRequestStatus, createRealClient, addNote, sendWhatsApp, createSignatureRequest, listSignatureRequests, downloadSignature, updateOrderStatus, updatePrices, createCollaboratorAuth, updateCollaboratorAuth, deleteCollaboratorAuth, createPortfolioClient, updatePortfolioClient, resetPortfolioPassword, deletePortfolioClient, canvaStatus, connectCanva, metaStatus, metaCampaigns};

  function waitForStageReady(timeout = 8000) {
    if (window.CVStudioStageReady) return Promise.resolve();
    return Promise.race([
      new Promise(resolve => window.addEventListener('cvstudio:stage-ready', resolve, {once:true})),
      new Promise(resolve => setTimeout(resolve, timeout))
    ]);
  }

  window.addEventListener('DOMContentLoaded', async () => {
    try {
      await waitForStageReady();
      const ok = await loadReal();
      if (!ok) return;
      const state = getState();
      const current = state._realSync?.at || '';
      sessionStorage.setItem(SYNC_KEY, current);
      window.dispatchEvent(new CustomEvent('cvstudio:state-updated', { detail: { source: 'real-bridge' } }));
    } catch (error) {
      console.error('[CVStudio RC6] Error al conectar datos reales:', error);
      status(`Datos reales: ${error.message}`, 'warning');
    }
  }, {once:true});
})();
