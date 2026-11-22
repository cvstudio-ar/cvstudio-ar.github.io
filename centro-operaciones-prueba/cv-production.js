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
  const person=(s,r)=>(s.collaborators||[]).find(c=>String(c.id)===String(r.collaboratorId));
  const rate=(s,r)=>Math.max(0,Math.min(100,Number(r.reviewedAt?r.commissionRate:person(s,r)?.commission)||0));
  const pay=(s,r)=>(s.payments||[]).find(p=>p.status==='Confirmado'&&String(p.clientId)===String(r.clientId)&&normalize(p.service)===normalize(r.service));
  const due=(s,r)=>r.status==='Aprobado'&&pay(s,r)?Number(pay(s,r).amount||0)*rate(s,r)/100:0;
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
    const currentMonth=new Date().toLocaleDateString('sv-SE',{timeZone:'America/Argentina/Buenos_Aires'}).slice(0,7);
    const monthly=active.filter(r=>String(r.completedAt||'').slice(0,7)===currentMonth);
    const pending=active.filter(r=>r.status==='Pendiente de revisión');
    const approved=active.filter(r=>r.status==='Aprobado');
    let html=header('Mis CV realizados','Registrá tus trabajos terminados y consultá el estado de revisión.');
    html+='<button type="button" class="button primary" data-cv-action="report">+ Registrar CV realizado</button></div>';
    html+='<div class="cv-production-stats"><div><small>CV registrados</small><b>'+units(active)+'</b></div><div><small>Este mes</small><b>'+units(monthly)+'</b></div><div><small>Por validar</small><b>'+units(pending)+'</b></div><div><small>Aprobados</small><b>'+units(approved)+'</b></div></div>';
    html+='<div class="cv-production-history">'+all.slice().reverse().slice(0,10).map(r=>'<div><strong>'+esc(r.client)+' · '+esc(r.service)+'</strong><small>'+qty(r)+' CV · '+esc(String(r.completedAt||'').slice(0,10))+'</small><span class="status">'+esc(r.status)+'</span></div>').join('')+'</div>';
    return html+(all.length?'':'<p class="empty-state">Todavía no registraste CV terminados.</p>')+'</section>';
  }
  function renderAdmin(s){
    const all=reports(s).slice().reverse(),active=all.filter(r=>r.status!=='Rechazado');
    const pending=active.filter(r=>r.status==='Pendiente de revisión'),approved=active.filter(r=>r.status==='Aprobado');
    let html=header('Contador de CV · colaboradores','Registro verificado por Dirección y comisiones calculadas según el porcentaje de cada colaborador.')+'</div>';
    html+='<div class="cv-production-stats"><div><small>CV registrados</small><b>'+units(active)+'</b></div><div><small>Por validar</small><b>'+units(pending)+'</b></div><div><small>Aprobados</small><b>'+units(approved)+'</b></div><div><small>Comisiones habilitadas</small><b>'+money(approved.reduce((n,r)=>n+due(s,r),0))+'</b></div></div>';
    html+='<div class="cv-production-history">'+all.slice(0,30).map(r=>{
      let entry='<div><strong>'+esc(r.responsible)+' · '+esc(r.client)+'</strong><small>'+esc(r.service)+' · '+qty(r)+' CV · '+rate(s,r)+'% · '+(pay(s,r)?'Cobrado':'Pago pendiente')+'</small><span class="status">'+esc(r.status)+(r.status==='Aprobado'?' · '+money(due(s,r)):'')+'</span>';
      if(r.status==='Pendiente de revisión')entry+='<button type="button" class="button primary small" data-cv-action="review" data-id="'+Number(r.id)+'" data-decision="Aprobado">Aprobar</button><button type="button" class="button secondary small" data-cv-action="review" data-id="'+Number(r.id)+'" data-decision="Rechazado">Rechazar</button>';
      return entry+'</div>';
    }).join('')+'</div><p class="auth-note">Sólo los registros aprobados con pago confirmado generan una comisión calculada. No se realizan transferencias automáticas.</p>';
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
  function report(){
    const c=actor();if(!c||director())return;
    const s=state(),customers=(s.clients||[]).filter(x=>cvService(x.service)&&x.status!=='Archivado');
    if(!customers.length){alert('Todavía no hay clientes con servicio de CV. Solicitá que registren el trabajo.');return;}
    const options=customers.map(x=>'<option value="'+esc(x.id)+'">'+esc(x.name)+' · '+esc(x.service)+'</option>').join('');
    if(typeof window.openModal!=='function')return alert('El formulario no está disponible.');
    window.openModal('<h2 id="modalTitle">Registrar CV realizado</h2><p>El trabajo quedará pendiente de revisión por Dirección.</p><form id="cvProductionForm" class="form-grid"><label>Cliente<select name="clientId" required>'+options+'</select></label><label>Cantidad de CV<input name="quantity" type="number" min="1" max="2" value="1" required></label><p class="auth-note span-2">Sólo los combos de dos CV permiten registrar dos unidades. El registro no marca el pedido como entregado.</p><div class="modal-actions span-2"><button class="button secondary" type="button" data-close-modal>Cancelar</button><button class="button primary" type="submit">Guardar registro</button></div></form>');
    document.getElementById('cvProductionForm').onsubmit=ev=>{
      ev.preventDefault();
      const form=ev.currentTarget,live=state(),client=(live.clients||[]).find(x=>String(x.id)===String(form.elements.clientId.value));
      const amount=Number(form.elements.quantity.value);
      if(!client||!cvService(client.service))return alert('Seleccioná un servicio de CV válido.');
      const max=normalize(client.service).includes('2 cv')?2:1;
      if(!Number.isInteger(amount)||amount<1||amount>max)return alert('Cantidad inválida para el servicio seleccionado.');
      if(reports(live).some(r=>r.status!=='Rechazado'&&String(r.clientId)===String(client.id)&&String(r.collaboratorId)===String(c.id)))return alert('Ese cliente ya tiene un registro de CV a tu nombre.');
      const job=(live.jobs||[]).find(j=>String(j.clientId)===String(client.id));
      const id=Math.max(0,...(live.executions||[]).map(r=>Number(r.id)||0))+1;
      live.executions=live.executions||[];
      live.executions.push({id,type:'cv-production',clientId:client.id,client:client.name,service:client.service,jobId:job?.id||null,responsible:c.name,collaboratorId:c.id,
        quantity:amount,completedAt:new Date().toISOString(),createdAt:new Date().toISOString(),status:'Pendiente de revisión',commissionRate:null,commissionAmount:0,baseAmount:0});
      save(live);close();alert('CV registrado. Dirección lo verá pendiente de revisión.');
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
