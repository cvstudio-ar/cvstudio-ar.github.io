/* CVStudio · Registro de CV realizados por colaboradores.
 * Usa el estado operativo ya sincronizado con Supabase: no duplica tablas.
 * La carga del empleado es una declaración, no una liquidación ni una entrega.
 */
(() => {
  'use strict';
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
    let html=header('Mis CV realizados','Cargá el número de transferencia y el importe del comprobante del cliente. Cada referencia se registra una sola vez.');
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
    html+='<p class="auth-note">Comisiones estimadas sobre importes declarados: <strong>'+money(active.reduce((n,r)=>n+estimated(s,r),0))+'</strong>. Este total es informativo y no constituye un pago confirmado.</p>';
    html+='<div class="cv-production-history">'+all.slice(0,30).map(r=>{
      let entry='<div><strong>'+esc(r.responsible)+' · '+esc(r.client)+'</strong><small>'+esc(arDateTime(r.completedAt))+' · '+esc(r.service)+' · '+qty(r)+' CV · '+rate(s,r)+'% · Operación: '+esc(r.transferNumber||'Sin registrar')+' · Importe informado: '+(r.transferAmount?money(r.transferAmount):'—')+' · Comisión estimada: '+money(estimated(s,r))+' · '+(pay(s,r)?'Pago registrado':'Pago sin confirmar')+'</small><span class="status">'+esc(r.status)+(r.status==='Aprobado'?' · '+money(due(s,r)):'')+'</span>';
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
  if(typeof window.openModal!=='function')return alert('El formulario no está disponible.');
  window.openModal('<h2 id="modalTitle">Registrar CV realizado</h2><p>Ingresá el nombre del cliente, seleccioná el servicio y copiá el número de transferencia del comprobante. El precio se completa desde Administración.</p><form id="cvProductionForm" class="form-grid"><label>Nombre y apellido del cliente<input name="clientFullName" type="text" minlength="3" maxlength="120" autocomplete="off" placeholder="Ej.: Juan Pérez" required></label><label>Servicio contratado<select name="service" required disabled><option value="">Cargando catálogo…</option></select></label><label>Importe del servicio (ARS)<input name="serviceAmount" type="text" value="Consultando…" readonly aria-readonly="true"></label><label>Número de transferencia u operación<input name="transferNumber" type="text" minlength="4" maxlength="80" autocomplete="off" spellcheck="false" placeholder="Ej.: 000123456789" required></label><p id="cvPriceStatus" class="auth-note span-2" aria-live="polite">Consultando los precios actuales de Administración…</p><p class="auth-note span-2">El importe no se edita aquí. Si Administración cambia el precio, se utilizará el vigente al registrar. Un comprobante sólo se puede usar una vez.</p><div class="modal-actions span-2"><button class="button secondary" type="button" data-close-modal>Cancelar</button><button class="button primary" type="submit" disabled>Registrar CV</button></div></form>');
  const form=document.getElementById('cvProductionForm');
  if(!form)return;
  const serviceSelect=form.elements.service;
  const priceField=form.elements.serviceAmount;
  const submit=form.querySelector('button[type="submit"]');
  const status=form.querySelector('#cvPriceStatus');
  const setStatus=value=>{if(status)status.textContent=value;};
  let prices=new Map();
  const updatePrice=()=>{
    const entry=prices.get(serviceSelect.value);
    priceField.value=entry?money(entry.price):'Sin precio disponible';
    submit.disabled=!entry;
    if(entry)setStatus('Precio vigente en Administración: '+money(entry.price)+'.');
  };
  serviceSelect.addEventListener('change',updatePrice);
  try{
    const list=await loadCvCatalog();
    if(document.getElementById('cvProductionForm')!==form)return;
    prices=new Map(list.map(item=>[item.name,item]));
    serviceSelect.innerHTML=list.map(item=>'<option value="'+esc(item.name)+'">'+esc(item.name)+'</option>').join('');
    serviceSelect.disabled=false;
    serviceSelect.value=list[0].name;
    updatePrice();
  }catch(error){
    if(document.getElementById('cvProductionForm')!==form)return;
    priceField.value='No disponible';submit.disabled=true;setStatus(error.message||'No se pudo leer el catálogo.');
    return;
  }
  form.onsubmit=async event=>{
    event.preventDefault();
    if(submit.disabled)return;
    const fullName=String(form.elements.clientFullName.value||'').replace(/\s+/g,' ').trim();
    const service=String(serviceSelect.value||'');
    const transferNumber=String(form.elements.transferNumber.value||'').trim();
    const key=transferKey(transferNumber);
    if(fullName.length<3||fullName.length>120||fullName.split(' ').length<2)return alert('Ingresá el nombre y apellido completos del cliente.');
    if(!service||!prices.has(service))return alert('Seleccioná un servicio del catálogo.');
    if(key.length<4||transferNumber.length>80)return alert('Ingresá el número completo de transferencia (mínimo 4 caracteres).');
    submit.disabled=true;
    try{
      // Consulta nuevamente la base: nunca se acepta un precio guardado en el navegador.
      const latest=await loadCvCatalog();
      if(document.getElementById('cvProductionForm')!==form)return;
      const valid=latest.find(item=>item.name===service);
      if(!valid){setStatus('El servicio seleccionado ya no está disponible en Administración. Cerrá y abrí el formulario.');return;}
      const previous=prices.get(service);
      if(!previous||Number(previous.price)!==Number(valid.price)){
        prices=new Map(latest.map(item=>[item.name,item]));
        updatePrice();
        setStatus('El precio fue actualizado en Administración a '+money(valid.price)+'. Revisá el nuevo importe y presioná Registrar CV otra vez.');
        return;
      }
      const live=state();
      if(reports(live).some(record=>record.transferNumber&&transferKey(record.transferNumber)===key))return alert('Ese número de transferencia ya fue registrado. Revisá el historial.');
      const existing=findMatchingClient(live,fullName,service);
      const job=existing?(live.jobs||[]).find(j=>String(j.clientId)===String(existing.id)):null;
      const id=Math.max(0,...(live.executions||[]).map(r=>Number(r.id)||0))+1;
      const amount=valid.price;
      const verified=Boolean(existing&&bankMatched(live,transferNumber,amount,existing.id,service));
      const commissionRate=Number(person(live,{collaboratorId:collaborator.id})?.commission||0);
      const createdAt=new Date().toISOString();
      const record={
        id,type:'cv-production',clientId:existing?.id??null,client:fullName,service,jobId:job?.id||null,
        responsible:collaborator.name,collaboratorId:collaborator.id,
        transferNumber,transferAmount:amount,priceSnapshot:amount,priceSource:'admin-catalog',quantity:cvCount(service),
        completedAt:createdAt,createdAt,
        status:verified?'Aprobado':'Pendiente de revisión',reviewedAt:verified?createdAt:null,
        reviewedBy:verified?'Coincidencia con pago confirmado':null,commissionRate:verified?commissionRate:null,
        commissionAmount:0,baseAmount:0
      };
      if(verified){record.baseAmount=amount;record.commissionAmount=due(live,record);}
      live.executions=live.executions||[];
      live.executions.push(record);
      save(live);close();
      alert(verified?'CV registrado con el precio vigente y pago verificado.':'CV registrado a nombre de '+fullName+' con el precio vigente de '+money(amount)+'. La transferencia queda pendiente de confirmar.');
    }catch(error){
      if(document.getElementById('cvProductionForm')===form)setStatus('No se pudo validar el precio vigente. No se guardó el trabajo. '+(error?.message||''));
    }finally{
      if(document.getElementById('cvProductionForm')===form)submit.disabled=!prices.has(serviceSelect.value);
    }
  };
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
