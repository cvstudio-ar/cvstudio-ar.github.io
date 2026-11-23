/* CVStudio Argentina · Administración financiera / producción / egresos / liquidaciones.
   Sólo Dirección. La declaración de un CV no es un cobro. Nunca se ejecutan transferencias.
*/
(() => {
  'use strict';
  const KEY='cvstudio_ops_operational_v2', WORKSPACE='centro-operaciones-prueba';
  const money=n=>new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(Number(n)||0);
  const esc=x=>String(x??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const state=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}};
  const owner=()=>window.CVStudioAccess?.ready&&window.CVStudioAccess?.owner===true;
  const ref=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
  const dateKey=v=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Argentina/Buenos_Aires',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(v));
  const today=()=>dateKey(new Date());
  const dateTime=v=>{try{return new Intl.DateTimeFormat('es-AR',{timeZone:'America/Argentina/Buenos_Aires',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(v))}catch{return '—'}};
  const dateLabel=v=>{try{return new Intl.DateTimeFormat('es-AR',{timeZone:'America/Argentina/Buenos_Aires',day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(v+'T12:00:00-03:00'))}catch{return '—'}};
  const amount=x=>Number(x?.priceSnapshot??x?.transferAmount??0)||0;
  const works=s=>(s.executions||[]).filter(r=>r.type==='cv-production'&&r.status!=='Rechazado');
  const confirmed=s=>(s.payments||[]).filter(p=>p.status==='Confirmado');
  const expenses=s=>(s.expenses||[]).filter(e=>Number(e.amount)>0);
  const collaborator=(s,r)=>(s.collaborators||[]).find(c=>String(c.id)===String(r.collaboratorId));
  const rate=(s,r)=>Math.max(0,Math.min(100,Number(r.reviewedAt&&r.commissionRate!=null?r.commissionRate:collaborator(s,r)?.commission)||0));
  const verifiedPayment=(s,r)=>{
    const linked=confirmed(s).find(p=>String(p.sourceExecutionId||'')===String(r.id));
    if(linked)return linked;
    // Compatibilidad con pagos antiguos, únicamente si ambos tenían cliente
    // identificado y referencia bancaría comprobable (nunca comparar null=null).
    if(r.clientId==null||!ref(r.transferNumber))return null;
    return confirmed(s).find(p=>p.sourceExecutionId==null
      &&p.clientId!=null&&String(p.clientId)===String(r.clientId)
      &&String(p.service||'')===String(r.service||'')
      &&Number(p.amount)===amount(r)
      &&[p.transferNumber,p.operationNumber,p.bankReference,p.receiptNumber,p.transactionId].some(n=>ref(n)===ref(r.transferNumber)))||null;
  };
  const eligible=(s,r)=>r.status==='Aprobado'&&Boolean(verifiedPayment(s,r));
  const commission=(s,r)=>eligible(s,r)?amount(r)*rate(s,r)/100:0;
  const settledIds=s=>new Set(expenses(s).filter(e=>e.category==='Pago colaborador').flatMap(e=>Array.isArray(e.executionIds)?e.executionIds.map(String):[]));
  const total=(list,fn=x=>Number(x.amount||0))=>list.reduce((v,x)=>v+(Number(fn(x))||0),0);
  const uniqPaid=s=>{
    const used=new Set();
    return confirmed(s).filter(p=>{
      const key=p.sourceExecutionId!=null?'cv:'+p.sourceExecutionId:
        ref(p.transferNumber||p.bankReference||p.operationNumber)?'ref:'+ref(p.transferNumber||p.bankReference||p.operationNumber):
        'id:'+String(p.realOrderId||p.id);
      if(used.has(key))return false;
      used.add(key);return true;
    });
  };
  function Sunday(todayKey,offset){
    const d=new Date(todayKey+'T12:00:00-03:00');
    const weekday=d.getUTCDay();
    d.setUTCDate(d.getUTCDate()+offset(weekday));
    return dateKey(d);
  }
  const lastSunday=()=>Sunday(today(),d=>-d);
  const nextSunday=()=>Sunday(today(),d=>(7-d)%7);
  const timestamp=day=>day+'T12:00:00-03:00';
  const positive=n=>Number.isFinite(n)&&n>0&&n<=1000000000;
  const recordId=(items)=>{
    const used=new Set((items||[]).map(r=>String(r.id)));
    let id=Date.now()*1000+crypto.getRandomValues(new Uint32Array(1))[0]%1000;
    while(used.has(String(id)))id++;
    return id;
  };
  const isDuplicateReference=(s,value,exceptId=null)=>Boolean(ref(value)&&
    (s.payments||[]).some(p=>String(p.id)!==String(exceptId)&&[p.transferNumber,p.bankReference,p.operationNumber,p.receiptNumber,p.transactionId].some(n=>ref(n)===ref(value))));
  const section=(title,subtitle,body,extra='')=>
    '<section class="finance-section"><header class="finance-section-head"><div><h3>'+title+'</h3><p>'+subtitle+'</p></div>'+extra+'</header>'+body+'</section>';
  function ledger(s){
    const p=uniqPaid(s),e=expenses(s),records=works(s);
    const collected=total(p),spent=total(e),declared=records.filter(r=>!verifiedPayment(s,r));
    const confirmedCV=records.filter(r=>Boolean(verifiedPayment(s,r)));
    const available=records.filter(r=>eligible(s,r)&&!settledIds(s).has(String(r.id)));
    const webCollected=total(p.filter(x=>x.source==='manual-income'&&x.incomeType==='Web'||x.source==='Web'&&x.status==='Confirmado'));
    return {payments:p,expenses:e,records,collected,spent,declared,confirmedCV,available,webCollected,
      pendingValue:total(declared,amount),availableCommission:total(available,r=>commission(s,r)),
      pendingCommissions:total(declared,r=>amount(r)*rate(s,r)/100)};
  }
  function render(){
    if(!owner())return '<section class="panel"><h2>Acceso restringido</h2></section>';
    const s=state(),d=ledger(s),paidIds=settledIds(s);
    const eligibleWeek=d.available.filter(r=>dateKey(r.completedAt||r.createdAt)<=lastSunday());
    const dueWeek=total(eligibleWeek,r=>commission(s,r));
    const upcoming=nextSunday(),period=lastSunday();
    const mats=d.records.slice().sort((a,b)=>String(b.completedAt||b.createdAt||'').localeCompare(String(a.completedAt||a.createdAt||''))).slice(0,45);
    const matRows=mats.map(r=>{
      const received=verifiedPayment(s,r);
      const status=received?'Cobro confirmado':'Sin confirmar';
      const pendingButton=received?'':'<button type="button" class="button primary small" data-fin-action="confirm-cv" data-record-id="'+esc(r.id)+'">Confirmar ingreso</button>';
      const review=r.status==='Pendiente de revisión'
        ?'<button type="button" class="button secondary small" data-cv-action="review" data-id="'+esc(r.id)+'" data-decision="Aprobado">Aprobar CV</button>':'<span class="finance-state '+(r.status==='Aprobado'?'is-ok':'')+'">'+esc(r.status)+'</span>';
      return '<tr><td>'+esc(dateTime(r.completedAt||r.createdAt))+'</td><td><b>'+esc(r.responsible||'—')+'</b><small>'+esc(r.client||'—')+'</small></td><td>'+esc(r.service)+'</td><td class="finance-mono">'+esc(r.transferNumber||'—')+'</td><td class="finance-num">'+money(amount(r))+'</td><td><span class="finance-state '+(received?'is-ok':'is-wait')+'">'+status+'</span></td><td class="finance-actions-cell">'+pendingButton+review+'</td></tr>';
    }).join('');
    const incomes=d.payments.filter(p=>p.source==='manual-income'||p.sourceExecutionId!=null).slice()
      .sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||''))).slice(0,15);
    const incomeRows=incomes.map(p=>
      '<tr><td>'+esc(dateTime(p.createdAt))+'</td><td>'+esc(p.client||'—')+'<small>'+esc(p.service||'—')+'</small></td><td>'+esc(p.incomeType||'CV')+'</td><td class="finance-num">'+money(p.amount)+'</td><td>'+esc(p.status)+'</td><td>'+(p.status==='Pendiente'?'<button class="button primary small" data-fin-action="confirm-income" data-id="'+esc(p.id)+'">Confirmar</button>':'<span class="finance-state is-ok">Registrado</span>')+'</td></tr>').join('');
    const expenseRows=d.expenses.slice().sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||''))).slice(0,18).map(e=>
      '<tr><td>'+esc(dateTime(e.createdAt))+'</td><td><b>'+esc(e.description||'—')+'</b><small>'+esc(e.category||'—')+'</small></td><td class="finance-num finance-out">−'+money(e.amount)+'</td><td class="finance-mono">'+esc(e.transferNumber||'—')+'</td></tr>').join('');
    const allocation=s.rules||{}, allocationSum=Number(allocation.company||0)+Number(allocation.growth||0)+Number(allocation.colab||0)+Number(allocation.reserve||0);
    const ranges=[['Empresa','company',60],['Colaboradores','colab',20],['Crecimiento','growth',15],['Reserva','reserve',5]]
      .map(([name,key,defaultValue])=>'<label class="finance-rule"><span>'+name+'</span><input type="range" min="0" max="100" step="1" data-fund="'+key+'" value="'+Number(allocation[key]??defaultValue)+'"><b id="'+key+'Value">'+Number(allocation[key]??defaultValue)+'%</b></label>').join('');
    const movement=[
      ...d.payments.map(p=>({date:p.createdAt,label:(p.client||'Ingreso')+' · '+(p.service||''),kind:'Ingreso',value:Number(p.amount)})),
      ...d.expenses.map(e=>({date:e.createdAt,label:e.description||e.category||'Gasto',kind:'Egreso',value:-Number(e.amount)}))
    ].sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))).slice(0,18);
    const movementRows=movement.map(m=>'<tr><td>'+esc(dateTime(m.date))+'</td><td>'+esc(m.label)+'</td><td>'+esc(m.kind)+'</td><td class="finance-num '+(m.value<0?'finance-out':'finance-in')+'">'+(m.value<0?'−':'+')+money(Math.abs(m.value))+'</td></tr>').join('');
    return '<div class="finance-v2">'+
      '<header class="finance-header"><div><small>CVSTUDIO · ADMINISTRACIÓN</small><h2>Control financiero</h2><p>Producción CV, trabajos web, gastos y liquidaciones. Sólo los cobros confirmados integran la caja real.</p></div>'+
      '<div class="finance-head-actions"><button class="button primary" data-fin-action="income"><span>+</span> Registrar ingreso</button><button class="button secondary" data-fin-action="expense"><span>−</span> Registrar gasto</button><button class="button secondary" data-fin-action="settle">Liquidar colaborador</button></div></header>'+
      '<div class="finance-kpis">'+[
        ['Cobros confirmados',money(d.collected),'Dinero ingresado a CVStudio'],
        ['CV informados sin cobro',money(d.pendingValue),d.declared.length+' trabajos declarados'],
        ['Egresos registrados',money(d.spent),'Campañas, colaboradores y otros'],
        ['Saldo de caja',money(d.collected-d.spent),'Cobros confirmados menos egresos'],
        ['Comisiones habilitadas',money(d.availableCommission),'Aprobadas, cobradas y no liquidadas'],
        ['Ingresos web registrados',money(d.webCollected),'Webs y otros cobros identificados']
      ].map(([label,value,hint])=>'<article class="finance-kpi"><small>'+label+'</small><strong>'+value+'</strong><span>'+hint+'</span></article>').join('')+'</div>'+
      section('Producción CV de colaboradores','Los CV que informe Matías aparecen aquí automáticamente. Confirmá el cobro sólo si verificaste el ingreso bancario.',
        '<div class="finance-table-wrap"><table class="finance-table"><thead><tr><th>Fecha</th><th>Colaborador / cliente</th><th>Servicio</th><th>N.º transferencia</th><th>Importe</th><th>Cobro</th><th>Control</th></tr></thead><tbody>'+(matRows||'<tr><td colspan="7" class="finance-empty">Todavía no hay CV informados por colaboradores.</td></tr>')+'</tbody></table></div>')+
      '<div class="finance-split">'+
      section('Ingresos de webs y otros','Cargá los trabajos web cobrados o pendientes. Los ingresos por CV confirmados también quedan identificados.',
        '<div class="finance-table-wrap"><table class="finance-table"><thead><tr><th>Fecha</th><th>Cliente / servicio</th><th>Origen</th><th>Importe</th><th>Estado</th><th></th></tr></thead><tbody>'+(incomeRows||'<tr><td colspan="6" class="finance-empty">Sin registros manuales de ingresos.</td></tr>')+'</tbody></table></div>',
        '<button class="button secondary small" data-fin-action="income">+ Agregar ingreso</button>')+
      section('Egresos y gastos adicionales','Incluye las campañas ya registradas, nuevos gastos y pagos semanales a colaboradores.',
        '<div class="finance-table-wrap"><table class="finance-table"><thead><tr><th>Fecha</th><th>Concepto</th><th>Importe</th><th>Comprobante</th></tr></thead><tbody>'+(expenseRows||'<tr><td colspan="4" class="finance-empty">Sin egresos registrados.</td></tr>')+'</tbody></table></div>',
        '<button class="button secondary small" data-fin-action="expense">+ Agregar gasto</button>')+
      '</div><div class="finance-split">'+
      section('Liquidación semanal · domingos','El pago a Matías se registra como egreso sólo después de hacer la transferencia. No se envía dinero automáticamente.',
        '<div class="finance-settlement"><div><small>Próximo domingo</small><strong>'+dateLabel(upcoming)+'</strong></div><div><small>Disponible hasta domingo '+dateLabel(period)+'</small><strong>'+money(dueWeek)+'</strong></div><div><small>Comisiones habilitadas, pendientes</small><strong>'+money(d.availableCommission)+'</strong></div></div>'+
        '<p class="finance-note">Trabajos aprobados y cobros confirmados; se excluyen automáticamente los CV ya liquidados. Los CV de esta semana se incorporan en el próximo cierre dominical.</p>'+
        '<button class="button primary" data-fin-action="settle" '+(!eligibleWeek.length||dueWeek<=0?'disabled':'')+'>Registrar transferencia semanal</button>')+
      section('Distribución de fondos','Ajustá los porcentajes generales. Las comisiones reales de cada colaborador se calculan por separado.',
        '<div class="finance-rules">'+ranges+'</div><div class="finance-rule-footer"><span>Total: <strong id="rulesTotal">'+allocationSum+'%</strong></span><button class="button primary" data-fin-action="save-rules">Guardar porcentajes</button></div>'+
        '<p class="finance-note">Esta distribución es una referencia de asignación de fondos, no un descuento automático de la comisión del 40% de Matías.</p>')+
      '</div>'+
      section('Movimientos de caja','Historial de cobros confirmados y egresos registrados; no incluye los CV todavía sin verificar.',
        '<div class="finance-table-wrap"><table class="finance-table"><thead><tr><th>Fecha</th><th>Movimiento</th><th>Tipo</th><th>Importe</th></tr></thead><tbody>'+(movementRows||'<tr><td colspan="4" class="finance-empty">No hay movimientos de caja.</td></tr>')+'</tbody></table></div>')+
      section('Catálogo de servicios y precios','Los precios se editan desde Dirección y continúan sincronizados con los registros nuevos de Matías.',
        '<div class="finance-service-bottom"><span>'+Object.keys(s.prices||{}).length+' servicios registrados</span><button class="button secondary" data-fin-action="prices">Editar precios oficiales</button></div>')+
      '</div>';
  }
  const show=(title,help,fields,cb)=>{
    window.openModal('<h2 id="modalTitle">'+title+'</h2><p>'+help+'</p><form id="financeEntryForm" class="form-grid finance-modal">'+fields+
      '<div class="modal-actions span-2"><button type="button" class="button secondary" data-close-modal>Cancelar</button><button type="submit" class="button primary">Guardar movimiento</button></div></form>');
    const form=document.getElementById('financeEntryForm');
    form.onsubmit=async ev=>{
      ev.preventDefault();
      if(!owner())return alert('Acceso restringido.');
      const btn=form.querySelector('button[type=submit]');
      btn.disabled=true;btn.textContent='Guardando en Supabase…';
      try{await cb(new FormData(form));window.closeModal?.();window.openModule?.('administracion')}
      catch(error){alert(error.message||'No se pudo guardar.');btn.disabled=false;btn.textContent='Guardar movimiento'}
    };
  };
  const field=(name,label,value='',type='text',required=true)=>
    '<label>'+label+'<input name="'+name+'" type="'+type+'" value="'+esc(value)+'" '+(required?'required':'')+'></label>';
  const options=(name,label,items)=>
    '<label>'+label+'<select name="'+name+'">'+items.map(v=>'<option value="'+esc(v)+'">'+esc(v)+'</option>').join('')+'</select></label>';
  async function persist(table,record){
    const db=window.cvstudioSupabase;
    if(!db)throw Error('Supabase no está conectado.');
    const row={id:record.id,workspace_id:WORKSPACE,payload:record,updated_at:new Date().toISOString()};
    const {error}=await db.from(table).insert(row);
    if(error)throw Error('No se confirmó el guardado: '+error.message);
  }
  async function persistUpdate(table,record){
    const db=window.cvstudioSupabase;
    if(!db)throw Error('Supabase no está conectado.');
    const {error}=await db.from(table).update({payload:record,updated_at:new Date().toISOString()}).eq('workspace_id',WORKSPACE).eq('id',record.id);
    if(error)throw Error('No se confirmó la actualización: '+error.message);
  }
  function commit(s){
    localStorage.setItem(KEY,JSON.stringify(s));
    window.dispatchEvent(new CustomEvent('cvstudio:state-updated',{detail:{source:'finanzas-cvstudio'}}));
  }
  function incomeForm(){
    show('Registrar ingreso','Ingresos por trabajos web o servicios cargados por Dirección. Podés dejarlos pendientes hasta verificar el cobro.',
      field('client','Cliente / empresa')+field('service','Trabajo realizado o servicio')+
      options('incomeType','Tipo de ingreso',['Web','CV Dirección','Otro ingreso'])+
      field('amount','Importe en ARS','','number')+
      options('status','Estado',['Confirmado','Pendiente'])+
      options('paymentMethod','Medio de pago',['Transferencia','Efectivo','Mercado Pago','Otro'])+
      field('transferNumber','N.º de transferencia o comprobante (si corresponde)','','text',false)+
      field('date','Fecha del movimiento',today(),'date'),
      async d=>{
        const s=state(),name=String(d.get('client')||'').trim(),service=String(d.get('service')||'').trim();
        const amt=Number(d.get('amount')),status=String(d.get('status')),method=String(d.get('paymentMethod'));
        const bank=String(d.get('transferNumber')||'').trim(),date=String(d.get('date'));
        if(name.length<3||service.length<3||!positive(amt))throw Error('Completá cliente, servicio e importe válido.');
        if(date>today()||!date.match(/^\d{4}-\d{2}-\d{2}$/))throw Error('Ingresá una fecha válida, que no sea futura.');
        if(status==='Confirmado'&&method==='Transferencia'&&ref(bank).length<4)throw Error('Para confirmar una transferencia ingresá su número de comprobante.');
        if(ref(bank)&&isDuplicateReference(s,bank))throw Error('La referencia de pago ya está registrada.');
        const rec={id:recordId(s.payments),client:name,service,amount:amt,status,source:'manual-income',
          incomeType:String(d.get('incomeType')),paymentMethod:method,transferNumber:bank,
          clientId:null,createdAt:timestamp(date),registeredAt:new Date().toISOString()};
        await persist('cvstudio_ops_stage_payments',rec);
        s.payments=s.payments||[];s.payments.push(rec);commit(s);
      });
  }
  function expenseForm(){
    show('Registrar egreso o gasto','Incluye campañas, herramientas, hosting y gastos adicionales. El pago a Matías se registra desde Liquidación semanal.',
      field('description','Concepto del gasto')+field('amount','Importe en ARS','','number')+
      options('category','Categoría',['Campañas publicitarias','Herramientas y suscripciones','Hosting y dominios','Otros gastos'])+
      options('paymentMethod','Medio de pago',['Transferencia','Efectivo','Mercado Pago','Otro'])+
      field('transferNumber','Comprobante / referencia','','text',false)+field('date','Fecha del gasto',today(),'date'),
      async d=>{
        const s=state(),description=String(d.get('description')||'').trim(),amt=Number(d.get('amount')),date=String(d.get('date'));
        if(description.length<3||!positive(amt))throw Error('Ingresá concepto e importe válido.');
        if(date>today()||!date.match(/^\d{4}-\d{2}-\d{2}$/))throw Error('Ingresá una fecha válida no futura.');
        const rec={id:recordId(s.expenses),description,amount:amt,category:String(d.get('category')),
          paymentMethod:String(d.get('paymentMethod')),transferNumber:String(d.get('transferNumber')||'').trim(),
          source:'manual-expense',createdAt:timestamp(date),registeredAt:new Date().toISOString()};
        await persist('cvstudio_ops_stage_expenses',rec);
        s.expenses=s.expenses||[];s.expenses.push(rec);commit(s);
      });
  }
  function confirmCv(button){
    const s=state(),r=works(s).find(e=>String(e.id)===String(button.dataset.recordId));
    if(!r)return alert('No se encuentra el CV.');
    if(verifiedPayment(s,r))return alert('Este trabajo ya tiene un cobro confirmado.');
    const amt=amount(r);
    show('Confirmar cobro de CV','Confirmá únicamente cuando hayas comprobado que el dinero ingresó efectivamente a CVStudio. No se realizan movimientos bancarios.',
      '<p class="finance-check-summary span-2"><strong>'+esc(r.client)+'</strong> · '+esc(r.service)+' · '+money(amt)+'<br>Transferencia informada: '+esc(r.transferNumber||'—')+'</p>'+
      field('transferNumber','Número que figura en el comprobante',r.transferNumber||'')+
      options('paymentMethod','Medio de cobro',['Transferencia','Efectivo','Mercado Pago'])+
      field('date','Fecha real del cobro',today(),'date'),
      async d=>{
        const live=state(),work=works(live).find(x=>String(x.id)===String(r.id));
        if(!work||verifiedPayment(live,work))throw Error('El ingreso ya fue confirmado.');
        const bank=String(d.get('transferNumber')||'').trim(),method=String(d.get('paymentMethod')),date=String(d.get('date'));
        if(date>today()||!date.match(/^\d{4}-\d{2}-\d{2}$/))throw Error('Fecha inválida o futura.');
        if(ref(bank).length<4)throw Error('Necesitamos el número de transferencia o comprobante.');
        if(ref(bank)!==ref(work.transferNumber))throw Error('El número no coincide con el informado por Matías. Revisalo antes de confirmar.');
        if(isDuplicateReference(live,bank))throw Error('Ese comprobante ya existe en los pagos registrados.');
        const rec={id:recordId(live.payments),client:work.client,service:work.service,clientId:work.clientId,
          source:'cv-production',sourceExecutionId:work.id,amount:amount(work),status:'Confirmado',
          paymentMethod:method,transferNumber:bank,createdAt:timestamp(date),registeredAt:new Date().toISOString()};
        await persist('cvstudio_ops_stage_payments',rec);
        live.payments=live.payments||[];live.payments.push(rec);commit(live);
      });
  }
  function confirmIncome(button){
    const s=state(),p=(s.payments||[]).find(p=>String(p.id)===String(button.dataset.id));
    if(!p||p.status!=='Pendiente'||p.source!=='manual-income')return alert('No hay un ingreso pendiente válido.');
    show('Confirmar ingreso pendiente','Marcá cobrado sólo si verificaste el ingreso real en la cuenta.',
      '<p class="finance-check-summary span-2">'+esc(p.client)+' · '+esc(p.service)+' · <b>'+money(p.amount)+'</b></p>'+
      field('transferNumber','Número de comprobante',p.transferNumber||'','text',false)+
      field('date','Fecha efectiva del cobro',today(),'date'),
      async d=>{
        const live=state(),payment=(live.payments||[]).find(x=>String(x.id)===String(p.id));
        if(!payment||payment.status!=='Pendiente')throw Error('Ya no está pendiente.');
        const bank=String(d.get('transferNumber')||'').trim(),date=String(d.get('date'));
        if(date>today()||!date.match(/^\d{4}-\d{2}-\d{2}$/))throw Error('Fecha inválida.');
        if(payment.paymentMethod==='Transferencia'&&ref(bank).length<4)throw Error('Indicá el número de transferencia.');
        if(ref(bank)&&isDuplicateReference(live,bank,p.id))throw Error('Comprobante duplicado.');
        const updated={...payment,status:'Confirmado',transferNumber:bank,createdAt:timestamp(date),confirmedAt:new Date().toISOString()};
        await persistUpdate('cvstudio_ops_stage_payments',updated);
        live.payments=live.payments.map(x=>String(x.id)===String(p.id)?updated:x);commit(live);
      });
  }
  function settleForm(){
    const s=state(),target=lastSunday(),used=settledIds(s);
    const eligibleRecords=works(s).filter(r=>eligible(s,r)&&!used.has(String(r.id))&&dateKey(r.completedAt||r.createdAt)<=target);
    const byId=new Map();
    eligibleRecords.forEach(r=>{const id=String(r.collaboratorId);const items=byId.get(id)||[];items.push(r);byId.set(id,items);});
    const groups=[...byId].map(([id,items])=>({
      id,items,name:collaborator(s,items[0])?.name||items[0].responsible||'Colaborador',amount:total(items,r=>commission(s,r))
    })).filter(g=>g.amount>0);
    if(!groups.length)return alert('No hay comisiones aprobadas y cobradas pendientes de liquidar hasta el domingo '+dateLabel(target)+'.');
    const opt='<label>Colaborador<select name="collaboratorId">'+groups.map(g=>'<option value="'+esc(g.id)+'">'+esc(g.name)+' · '+money(g.amount)+'</option>').join('')+'</select></label>';
    show('Registrar liquidación semanal','Se registra el pago de comisiones hasta el domingo '+dateLabel(target)+'. Esta acción NO transfiere dinero: sólo asienta un pago que ya realizaste.',
      opt+field('transferNumber','Referencia de la transferencia realizada')+
      field('date','Fecha de la transferencia',today(),'date')+
      '<p class="finance-note span-2">Al registrar la transferencia, estos CV quedarán liquidados y no volverán a sumarse en pagos posteriores.</p>',
      async d=>{
        const live=state(),id=String(d.get('collaboratorId')),bank=String(d.get('transferNumber')||'').trim(),day=String(d.get('date'));
        if(ref(bank).length<4)throw Error('Ingresá una referencia de transferencia real.');
        if(day>today()||!day.match(/^\d{4}-\d{2}-\d{2}$/))throw Error('Fecha inválida.');
        const paid=settledIds(live);
        const items=works(live).filter(r=>String(r.collaboratorId)===id&&eligible(live,r)&&!paid.has(String(r.id))&&dateKey(r.completedAt||r.createdAt)<=target);
        const amt=total(items,r=>commission(live,r));
        if(!positive(amt)||!items.length)throw Error('No hay comisiones pendientes para este colaborador.');
        if(expenses(live).some(e=>e.category==='Pago colaborador'&&String(e.collaboratorId)===id&&e.settlementSunday===target))
          throw Error('Este domingo ya tiene una liquidación registrada. Revisá los pagos.');
        const name=collaborator(live,items[0])?.name||items[0].responsible||'Colaborador';
        const rec={id:recordId(live.expenses),category:'Pago colaborador',description:'Liquidación semanal · '+name,
          amount:amt,paymentMethod:'Transferencia',transferNumber:bank,collaboratorId:id,
          executionIds:items.map(r=>r.id),settlementSunday:target,source:'weekly-commission',
          createdAt:timestamp(day),registeredAt:new Date().toISOString()};
        if(!confirm('¿Confirmás que ya transferiste '+money(amt)+' a '+name+'? Se registrará como egreso.'))throw Error('No se registró el pago.');
        await persist('cvstudio_ops_stage_expenses',rec);
        live.expenses=live.expenses||[];live.expenses.push(rec);commit(live);
      });
  }
  function saveRules(){
    const s=state(),inputs=[...document.querySelectorAll('.finance-v2 [data-fund]')];
    const vals=Object.fromEntries(inputs.map(input=>[input.dataset.fund,Number(input.value)]));
    if(Object.values(vals).some(x=>!Number.isInteger(x)||x<0||x>100))return alert('Porcentajes inválidos.');
    const sum=Object.values(vals).reduce((a,b)=>a+b,0);
    if(sum!==100)return alert('Los porcentajes deben sumar 100%. Ahora suman '+sum+'%.');
    s.rules={...(s.rules||{}),...vals};commit(s);window.openModule?.('administracion');
  }
  document.addEventListener('click',event=>{
    const node=event.target.closest('[data-fin-action]');
    if(!node)return;
    event.preventDefault();event.stopImmediatePropagation();
    if(!owner())return alert('Sólo Dirección puede realizar esta operación.');
    const act=node.dataset.finAction;
    if(act==='income')incomeForm();
    if(act==='expense')expenseForm();
    if(act==='confirm-cv')confirmCv(node);
    if(act==='confirm-income')confirmIncome(node);
    if(act==='settle')settleForm();
    if(act==='save-rules')saveRules();
    if(act==='prices')window.CVStudioFinancePrices?.();
  },true);
  document.addEventListener('input',event=>{
    if(!event.target.matches('.finance-v2 [data-fund]'))return;
    const inputs=[...document.querySelectorAll('.finance-v2 [data-fund]')];
    const sum=inputs.reduce((n,input)=>n+Number(input.value||0),0);
    inputs.forEach(el=>{const target=document.getElementById(el.dataset.fund+'Value');if(target)target.textContent=el.value+'%';});
    const result=document.getElementById('rulesTotal');if(result){result.textContent=sum+'%';result.style.color=sum===100?'#74e2ac':'#ff9a9d';}
  },true);
  window.CVStudioFinanceAdmin={render,ledger,verifiedPayment,commission,settledIds};
  if(document.getElementById('appMain')?.dataset.module==='administracion'&&owner())
    queueMicrotask(()=>window.openModule?.('administracion'));
})();
