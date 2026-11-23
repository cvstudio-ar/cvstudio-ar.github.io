/* CVStudio · Registro de CV realizados por colaboradores.
 * Usa el estado operativo ya sincronizado con Supabase: no duplica tablas.
 * La carga del empleado es una declaración, no una liquidación ni una entrega.
 */
(() => {
  'use strict';
  window.CVStudioCvProductionBuild='1.9.6';
  const KEY='cvstudio_ops_operational_v2';
  const money=n=>new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(n);
  const esc=x=>String(x??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const state=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}};
  const access=()=>window.CVStudioAccess;
  const director=()=>access()?.ready&&access().level==='Director';
  const actor=()=>access()?.collaborator||null;
  const reports=s=>(s.executions||[]).filter(e=>e.type==='cv-production');
  const qty=r=>Math.max(1,Math.min(2,Number(r.quantity)||1));
  const normalize=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const cvService=x=>/(^|[^a-z])cv([^a-z]|$)|curriculum/.test(normalize(x));
  // Conservar los ceros iniciales: las referencias bancarias se tratan como texto.
  const transferKey=x=>normalize(x).replace(/[^a-z0-9]/g,'');
  const arDateTime=iso=>{try{return new Intl.DateTimeFormat('es-AR',{timeZone:'America/Argentina/Buenos_Aires',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(iso));}catch{return 'Fecha no disponible';}};
  const arMonth=iso=>{try{return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Argentina/Buenos_Aires',year:'numeric',month:'2-digit'}).format(new Date(iso));}catch{return '';}};

  const transferRefs=p=>[p?.transferNumber,p?.operationNumber,p?.bankReference,p?.receiptNumber,p?.transactionId].filter(Boolean);
  const bankMatched=(s,reference,amount,clientId,service)=>{
    const p=(s.payments||[]).find(x=>x.status==='Confirmado'&&String(x.clientId)===String(clientId)&&normalize(x.service)===normalize(service)&&Number(x.amount)===Number(amount));
    return Boolean(p&&transferRefs(p).some(ref=>transferKey(ref)===transferKey(reference)));
  };
  const person=(s,r)=>(s.collaborators||[]).find(c=>String(c.id)===String(r.collaboratorId));
  const rate=(s,r)=>Math.max(0,Math.min(100,Number(r.reviewedAt?r.commissionRate:person(s,r)?.commission)||0));
  const pay=(s,r)=>(s.payments||[]).find(p=>p.status==='Confirmado'&&String(p.clientId)===String(r.clientId)&&normalize(p.service)===normalize(r.service));
  const due=(s,r)=>r.status==='Aprobado'&&pay(s,r)&&(!r.transferAmount||Number(pay(s,r).amount)===Number(r.transferAmount))?Number(pay(s,r).amount||0)*rate(s,r)/100:0;
  const estimated=(s,r)=>Math.max(0,Number(r.transferAmount||0))*rate(s,r)/100;
  function save(s){
    localStorage.setItem(KEY,JSON.stringify(s));
    window.dispatchEvent(new CustomEvent('cvstudio:state-updated',{detail:{source:'cv-production'}}));
  }
  const units=arr=>arr.reduce((n,r)=>n+qty(r),0);
  function header(title,description){return '<section class="panel cv-production-panel" data-cv-panel><div class="panel-head"><div><h2>'+title+'</h2><p>'+description+'</p></div>';}
  function renderPersonal(s){
    const c=actor();if(!c)return '';
    const all=reports(s).filter(r=>String(r.collaboratorId)===String(c.id));
    const active=all.filter(r=>r.status!=='Rechazado');
    const currentMonth=arMonth(new Date());
    const monthly=active.filter(r=>arMonth(r.completedAt)===currentMonth);
    const pending=active.filter(r=>r.status==='Pendiente de revisión');
    const approved=active.filter(r=>r.status==='Aprobado');
    let html=header('Mis CV realizados','Seleccioná el servicio, verificá el precio automático de Administración y cargá el número de transferencia. Cada referencia se registra una sola vez.');
    html+='<button type="button" class="button primary" data-cv-action="report">+ Registrar CV realizado</button></div>';
    html+='<div class="cv-production-stats"><div><small>CV registrados</small><b>'+units(active)+'</b></div><div><small>Este mes</small><b>'+units(monthly)+'</b></div><div><small>Por validar</small><b>'+units(pending)+'</b></div><div><small>Aprobados</small><b>'+units(approved)+'</b></div></div>';
    html+='<div class="cv-production-history">'+all.slice().reverse().slice(0,10).map(r=>'<div><strong>'+esc(r.client)+' · '+esc(r.service)+'</strong><small>'+qty(r)+' CV · '+esc(arDateTime(r.completedAt))+(r.transferNumber?' · Operación '+esc(r.transferNumber)+' · '+money(Number(r.transferAmount||0)):' · Sin comprobante registrado')+'</small><span class="status">'+esc(r.status)+'</span></div>').join('')+'</div>';
    return html+(all.length?'':'<p class="empty-state">Todavía no registraste CV terminados.</p>')+'</section>';
  }
  function renderAdmin(s){
    const all=reports(s).slice().reverse(),active=all.filter(r=>r.status!=='Rechazado');
    const pending=active.filter(r=>r.status==='Pendiente de revisión'),approved=active.filter(r=>r.status==='Aprobado');
    let html=header('Contador de CV · colaboradores','Cada CV se vincula a su número de transferencia e importe. Comisiones según el porcentaje configurado por colaborador.')+'</div>';
    html+='<div class="cv-production-stats"><div><small>CV registrados</small><b>'+units(active)+'</b></div><div><small>Por validar</small><b>'+units(pending)+'</b></div><div><small>Aprobados</small><b>'+units(approved)+'</b></div><div><small>Comisiones habilitadas</small><b>'+money(approved.reduce((n,r)=>n+due(s,r),0))+'</b></div></div>';
    html+='<p class="auth-note">Comisiones estimadas sobre los importes registrados: <strong>'+money(active.reduce((n,r)=>n+estimated(s,r),0))+'</strong>. Este total es informativo y no constituye un pago confirmado.</p>';
    html+='<div class="cv-production-history">'+all.slice(0,30).map(r=>{
      let entry='<div><strong>'+esc(r.responsible)+' · '+esc(r.client)+'</strong><small>'+esc(arDateTime(r.completedAt))+' · '+esc(r.service)+' · '+qty(r)+' CV · '+rate(s,r)+'% · Operación: '+esc(r.transferNumber||'Sin registrar')+' · '+(r.priceSource==='admin-catalog'?'Precio del servicio':'Importe informado')+': '+(r.transferAmount?money(r.transferAmount):'—')+' · Comisión estimada: '+money(estimated(s,r))+' · '+(pay(s,r)?'Pago registrado':'Pago sin confirmar')+'</small><span class="status">'+esc(r.status)+(r.status==='Aprobado'?' · '+money(due(s,r)):'')+'</span>';
      if(r.status==='Pendiente de revisión')entry+='<button type="button" class="button primary small" data-cv-action="review" data-id="'+Number(r.id)+'" data-decision="Aprobado">Aprobar</button><button type="button" class="button secondary small" data-cv-action="review" data-id="'+Number(r.id)+'" data-decision="Rechazado">Rechazar</button>';
      return entry+'</div>';
    }).join('')+'</div><p class="auth-note">El número de transferencia evita registros repetidos, pero no demuestra por sí solo que el dinero ingresó. Los CV se cuentan como declarados hasta que el pago quede confirmado por CVStudio. No se realizan transferencias automáticas.</p>';
    return html+(all.length?'':'<p class="empty-state">Sin trabajos registrados por colaboradores.</p>')+'</section>';
  }
  function render(){
    const root=document.getElementById('appMain');
    if(!root||!access()?.ready||root.querySelector('[data-cv-panel]'))return;
    const module=root.dataset.module;
    if(module==='clientes'&&!director()&&actor())root.insertAdjacentHTML('afterbegin',renderPersonal(state()));
    if(module==='administracion'&&director())root.insertAdjacentHTML('afterbegin',renderAdmin(state()));
  }
  const close=()=>{if(typeof window.closeModal==='function')window.closeModal();else{const m=document.getElementById('appModal');if(m)m.hidden=true;}};
  async function loadCvCatalog(){
  const client=window.cvstudioSupabase;
  if(!client)throw new Error('No se pudo consultar Administración. Verificá la conexión con Supabase.');
  const {data,error}=await client.from('cvstudio_ops_stage_services')
    .select('name,price,active').eq('workspace_id','centro-operaciones-prueba').eq('active',true).order('name');
  if(error)throw new Error('No se pudo obtener el catálogo de Administración: '+error.message);
  const services=(data||[]).filter(item=>cvService(item.name)&&Number.isFinite(Number(item.price))&&Number(item.price)>0)
    .map(item=>({name:String(item.name),price:Number(item.price)}));
  if(!services.length)throw new Error('No hay servicios de CV activos con precio válido en Administración.');
  return services;
}
  const cvCount=service=>/(^|\s)2\s*cv(\s|$)/.test(normalize(service))?2:1;
  function findMatchingClient(state,fullName,service){
  const matches=(state.clients||[]).filter(x=>cvService(x.service)&&x.status!=='Archivado'
    &&normalize(x.name).replace(/\s+/g,' ').trim()===normalize(fullName).replace(/\s+/g,' ').trim()
    &&normalize(x.service)===normalize(service));
  return matches.length===1?matches[0]:null;
}
  async function report(){
    const collaborator=actor();
    if(!collaborator||director())return;
    if(typeof window.openModal!=='function')return alert('El formulario de CV no está disponible.');

    // La identidad del cliente siempre se escribe libremente. El catálogo se
    // consulta al servidor; ningún precio antiguo se utiliza para guardar.
    const local=state();
    const suggested=Object.entries(local.prices||{})
      .filter(([name,price])=>cvService(name)&&Number(price)>0)
      .map(([name])=>name)
      .sort((a,b)=>a.localeCompare(b,'es'));
    const placeholders=suggested.length
      ? suggested.map(name=>'<option value="'+esc(name)+'">'+esc(name)+'</option>').join('')
      : '<option value="">Consultando servicios de CV…</option>';

    window.openModal('<h2 id="modalTitle">Registrar CV realizado</h2>'+
      '<p>Escribí el nombre completo del cliente y seleccioná el servicio. El precio se obtiene de Administración.</p>'+
      '<form id="cvProductionForm" class="form-grid" autocomplete="off" data-version="20261123-matias-v195">'+
      '<label>Nombre y apellido del cliente<input id="cvClientFullName" name="clientFullName" type="text" minlength="3" maxlength="120" autocomplete="name" placeholder="Escribí nombre y apellido" required></label>'+
      '<label>Servicio contratado<select id="cvServiceSelect" name="service" required aria-label="Servicio de CV">'+placeholders+'</select></label>'+
      '<label>Precio actual del servicio (ARS)<input id="cvServiceAmount" name="serviceAmount" type="text" value="Verificando precio…" readonly aria-readonly="true" tabindex="-1"></label>'+
      '<label>Número de transferencia u operación<input name="transferNumber" type="text" minlength="4" maxlength="80" spellcheck="false" placeholder="Número del comprobante" required></label>'+
      '<div class="span-2"><p id="cvPriceStatus" class="auth-note" aria-live="polite">Verificando catálogo vigente de Administración…</p>'+
      '<button id="cvReloadPrices" class="button secondary small" type="button" hidden>Reintentar consulta de precios</button></div>'+
      '<p class="auth-note span-2">El nombre es libre y el precio es automático. Si Administración cambia el importe, se comprueba antes de guardar. No se aceptan números de transferencia repetidos.</p>'+
      '<div class="modal-actions span-2"><button class="button secondary" type="button" data-close-modal>Cancelar</button>'+
      '<button class="button primary" type="submit" disabled>Registrar CV</button></div>'+
      '<small class="span-2" style="color:var(--muted)">Formulario CVStudio · versión 1.9.6</small></form>');

    const form=document.getElementById('cvProductionForm');
    if(!form)return;
    const nameInput=form.querySelector('[name="clientFullName"]');
    const serviceSelect=form.querySelector('[name="service"]');
    const priceField=form.querySelector('[name="serviceAmount"]');
    const submit=form.querySelector('button[type="submit"]');
    const status=form.querySelector('#cvPriceStatus');
    const retry=form.querySelector('#cvReloadPrices');
    if(!nameInput||!serviceSelect||!priceField||!submit||!status||!retry){
      alert('No se pudieron cargar los campos del formulario. Recargá el Centro de Operaciones.');
      return;
    }
    nameInput.disabled=false;
    nameInput.readOnly=false;
    nameInput.focus();

    let prices=new Map();
    let ready=false;
    const isCurrent=()=>document.getElementById('cvProductionForm')===form;
    const setStatus=(message)=>{status.textContent=message;};
    const updatePrice=()=>{
      const selected=prices.get(serviceSelect.value);
      priceField.value=selected?money(selected.price):'Precio no disponible';
      submit.disabled=!ready||!selected;
      if(selected&&ready)setStatus('Precio vigente: '+money(selected.price)+' · Administración CVStudio');
    };
    const load=async()=>{
      ready=false;
      submit.disabled=true;
      retry.hidden=true;
      setStatus('Consultando los precios actuales de Administración…');
      try{
        const catalog=await loadCvCatalog();
        if(!isCurrent())return;
        const previousChoice=serviceSelect.value;
        prices=new Map(catalog.map(row=>[row.name,row]));
        serviceSelect.innerHTML=catalog.map(row=>
          '<option value="'+esc(row.name)+'">'+esc(row.name)+'</option>').join('');
        serviceSelect.value=prices.has(previousChoice)?previousChoice:catalog[0].name;
        serviceSelect.disabled=false;
        ready=true;
        updatePrice();
      }catch(error){
        if(!isCurrent())return;
        priceField.value='No disponible';
        serviceSelect.disabled=false;
        ready=false;
        submit.disabled=true;
        retry.hidden=false;
        setStatus('No se pudieron validar los precios: '+(error?.message||'Error de conexión')+
          '. Revisá la conexión y presioná Reintentar.');
      }
    };
    serviceSelect.addEventListener('change',updatePrice);
    retry.addEventListener('click',load);

    form.onsubmit=async event=>{
      event.preventDefault();
      if(!ready||submit.disabled)return;
      const fullName=String(nameInput.value||'').replace(/\s+/g,' ').trim();
      const service=String(serviceSelect.value||'');
      const transferNumber=String(form.querySelector('[name="transferNumber"]')?.value||'').trim();
      const transferId=transferKey(transferNumber);
      if(fullName.length<3||fullName.length>120||fullName.split(' ').length<2){
        nameInput.focus();
        return alert('Ingresá el nombre y apellido del cliente.');
      }
      if(!prices.has(service))return alert('Seleccioná un servicio válido.');
      if(transferId.length<4||transferNumber.length>80)return alert('Ingresá el número de transferencia completo.');
      submit.disabled=true;
      try{
        // Confirmación desde Supabase al guardar: no se permite persistir un
        // importe obsoleto o alterado desde el navegador.
        const updated=await loadCvCatalog();
        if(!isCurrent())return;
        const latest=updated.find(item=>item.name===service);
        const displayed=prices.get(service);
        if(!latest){setStatus('El servicio ya no está activo. Actualizá el catálogo.');retry.hidden=false;return;}
        if(!displayed||Number(latest.price)!==Number(displayed.price)){
          prices=new Map(updated.map(item=>[item.name,item]));
          ready=true;
          updatePrice();
          setStatus('Administración actualizó el precio a '+money(latest.price)+
            '. Revisalo y presioná Registrar CV nuevamente.');
          return;
        }
        const live=state();
        if(reports(live).some(item=>item.transferNumber&&transferKey(item.transferNumber)===transferId)){
          return alert('Ese número de transferencia ya está registrado.');
        }
        const client=findMatchingClient(live,fullName,service);
        const job=client?(live.jobs||[]).find(j=>String(j.clientId)===String(client.id)):null;
        const id=Math.max(0,...(live.executions||[]).map(record=>Number(record.id)||0))+1;
        const amount=latest.price;
        const verified=Boolean(client&&bankMatched(live,transferNumber,amount,client.id,service));
        const commissionRate=Number(person(live,{collaboratorId:collaborator.id})?.commission||0);
        const now=new Date().toISOString();
        const record={id,type:'cv-production',clientId:client?.id??null,client:fullName,
          service,jobId:job?.id||null,responsible:collaborator.name,collaboratorId:collaborator.id,
          transferNumber,transferAmount:amount,priceSnapshot:amount,priceSource:'admin-catalog',
          quantity:cvCount(service),completedAt:now,createdAt:now,
          status:verified?'Aprobado':'Pendiente de revisión',
          reviewedAt:verified?now:null,reviewedBy:verified?'Coincidencia con pago confirmado':null,
          commissionRate:verified?commissionRate:null,commissionAmount:0,baseAmount:0};
        if(verified){record.baseAmount=amount;record.commissionAmount=due(live,record);}
        live.executions=live.executions||[];
        live.executions.push(record);
        save(live);close();
        alert(verified
          ? 'CV registrado con precio vigente y pago confirmado.'
          : 'CV registrado a nombre de '+fullName+' por '+money(amount)+
            '. El comprobante queda pendiente de verificación.');
      }catch(error){
        if(isCurrent()){
          setStatus('No se pudo validar el precio. No se guardó el registro: '+(error?.message||''));
          retry.hidden=false;
        }
      }finally{
        if(isCurrent())submit.disabled=!ready||!prices.has(serviceSelect.value);
      }
    };
    await load();
  }
      function review(button){
    if(!director())return;
    const s=state(),r=reports(s).find(x=>String(x.id)===String(button.dataset.id)),decision=button.dataset.decision;
    if(!r||r.status!=='Pendiente de revisión'||!['Aprobado','Rechazado'].includes(decision))return;
    if(!confirm((decision==='Aprobado'?'¿Aprobar ':'¿Rechazar ')+qty(r)+' CV de '+r.responsible+'?'))return;
    r.status=decision;r.reviewedAt=new Date().toISOString();r.reviewedBy=actor()?.name||'Dirección';
    r.commissionRate=Number(person(s,r)?.commission||0);
    r.baseAmount=Number(pay(s,r)?.amount||0);r.commissionAmount=due(s,r);
    save(s);
  }
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-cv-action]');if(!button)return;
    event.preventDefault();event.stopImmediatePropagation();
    if(button.dataset.cvAction==='report')report();
    if(button.dataset.cvAction==='review')review(button);
  },true);
  function boot(){
    const root=document.getElementById('appMain');if(!root)return;
    new MutationObserver(render).observe(root,{childList:true});
    document.addEventListener('cvstudio:access-ready',render);
    window.addEventListener('cvstudio:state-updated',render);
    render();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
