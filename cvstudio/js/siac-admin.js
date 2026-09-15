(() => {
  'use strict';

  const WORKER_URL = 'https://cvstudio-contacto.cvpro-duccionesar.workers.dev';
  const STATUSES = ['Pendiente de revisión','Falta información','Presupuesto enviado','Confirmado','En producción','Pendiente de pago','Entregado','Finalizado','Cancelado'];
  const db = window.cvstudioSupabase;
  const $ = id => document.getElementById(id);
  const loginPanel = $('loginPanel'), dashboard = $('dashboard'), loginForm = $('loginForm'), loginMessage = $('loginMessage');
  const panelMessage = $('panelMessage'), logout = $('logout'), box = $('requests'), stats = $('stats');
  const search = $('search'), status = $('status'), conversationFilter = $('conversationFilter'), sortOrder = $('sortOrder'), refresh = $('refresh');
  const drawer = $('conversationDrawer'), timeline = $('conversationTimeline'), conversationForm = $('conversationForm');
  const conversationTitle = $('conversationTitle'), conversationContext = $('conversationContext'), conversationClient = $('conversationClient');
  const conversationRequestId = $('conversationRequestId'), conversationTemplate = $('conversationTemplate');
  const conversationSubject = $('conversationSubject'), conversationMessage = $('conversationMessage');
  const conversationFiles = $('conversationFiles'), selectedAttachments = $('selectedAttachments');
  const conversationCopy = $('conversationCopy'), conversationSendStatus = $('conversationSendStatus'), sendConversation = $('sendConversation');
  const conversationStatus = $('conversationStatus'), conversationNotes = $('conversationNotes'), saveConversationMeta = $('saveConversationMeta');
  const registerIncoming = $('registerIncoming'), addSystemEvent = $('addSystemEvent');
  const timelineSummary = $('timelineSummary'), jumpToLatest = $('jumpToLatest'), conversationReminder = $('conversationReminder'), toastRegion = $('toastRegion');
  const quickModal = $('quickEntryModal'), quickEntryForm = $('quickEntryForm'), quickEntryTitle = $('quickEntryTitle');
  const quickEntrySubject = $('quickEntrySubject'), quickEntryMessage = $('quickEntryMessage');

  let rows = [];
  let communicationsEnabled = true;
  let currentRow = null;
  let selectedFiles = [];
  let quickMode = 'incoming';

  const reminderKey = id => `cvstudio:reminder:${id}`;
  const getReminder = id => localStorage.getItem(reminderKey(id)) || '';
  const setReminder = (id,value) => value ? localStorage.setItem(reminderKey(id),value) : localStorage.removeItem(reminderKey(id));
  function toast(title,message='',type='success'){ if(!toastRegion)return; const el=document.createElement('div'); el.className=`toast ${type}`; el.innerHTML=`<strong>${esc(title)}</strong>${message?`<span>${esc(message)}</span>`:''}`; toastRegion.appendChild(el); setTimeout(()=>el.remove(),3600); }

  const esc = (value = '') => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const compact = value => Array.isArray(value) ? value.join(', ') : (typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value ?? ''));
  const formatDate = value => value ? new Date(value).toLocaleString('es-AR') : 'Sin fecha';
  const dateKey = value => new Date(value).toLocaleDateString('es-AR', {day:'2-digit',month:'2-digit',year:'numeric'});
  const lastMessage = row => [...(row.comunicaciones || [])].sort((a,b) => new Date(b.fecha_creacion)-new Date(a.fecha_creacion))[0] || null;
  const unreadCount = row => (row.comunicaciones || []).filter(m => m.direccion === 'entrante' && m.no_leido).length;
  const conversationState = row => {
    const last = lastMessage(row);
    if (!last) return 'Sin conversación';
    if (unreadCount(row)) return 'Nuevo mensaje';
    if (last.direccion === 'entrante') return 'Esperando CVStudio';
    if (last.direccion === 'saliente') return 'Esperando cliente';
    return 'Actividad interna';
  };
  const inactiveDays = row => {
    const last = lastMessage(row);
    const value = last?.fecha_creacion || row.fecha_actualizacion || row.fecha_creacion;
    return (Date.now() - new Date(value).getTime()) / 86400000;
  };

  const TEMPLATES = {
    custom: () => '',
    missing_cv: ({name}) => `Hola ${name},\n\nPara avanzar necesitamos que nos adjuntes tu currículum actual, aunque esté desactualizado. Podés responder este correo con el archivo en PDF, Word o una fotografía legible.\n\nQuedamos atentos.`,
    missing_photo: ({name}) => `Hola ${name},\n\nPara continuar necesitamos una fotografía de perfil reciente, con buena iluminación y preferentemente con fondo neutro. Podés responder este correo adjuntando la imagen en su calidad original.\n\nGracias.`,
    missing_experience: ({name}) => `Hola ${name},\n\nPara completar correctamente tu perfil necesitamos ampliar tu experiencia laboral. Indicá empresa, puesto, fechas aproximadas y principales tareas de cada trabajo.\n\nPodés responder directamente este correo con la información.`,
    missing_documents: ({name}) => `Hola ${name},\n\nPara continuar necesitamos la documentación, certificados o títulos relacionados con tu solicitud. Podés responder este correo adjuntando PDF o fotografías legibles.`,
    clarify_objective: ({name}) => `Hola ${name},\n\nNecesitamos confirmar tu objetivo principal: ¿a qué puesto, profesión, sector o tipo de empresa querés postularte? También podés indicarnos disponibilidad horaria o geográfica.`,
    brand_material: ({name}) => `Hola ${name},\n\nPara avanzar con el diseño necesitamos el material disponible de tu marca: logo anterior, colores, redes sociales, fotografías, referencias y ejemplos de estilo.`,
    schedule: ({name}) => `Hola ${name},\n\nQueremos coordinar una breve comunicación para revisar algunos detalles. Indicános qué día y horario te resulta conveniente.`,
    budget: ({name,service}) => `Hola ${name},\n\nAnalizamos tu solicitud de ${service || 'servicio'} y estamos preparando el presupuesto. En breve te enviaremos alcance, plazo y valor.\n\nGracias por elegir CVStudio Argentina.`,
    delivery: ({name}) => `Hola ${name},\n\nTu trabajo está listo para revisión. Te enviamos el material correspondiente y quedamos atentos a cualquier ajuste final.\n\nGracias por confiar en CVStudio Argentina.`
  };

  function showLogin(message=''){ loginPanel.hidden=false; dashboard.hidden=true; logout.hidden=true; loginMessage.textContent=message; }
  function showDashboard(){ loginPanel.hidden=true; dashboard.hidden=false; logout.hidden=false; }

  async function loadRequests() {
    if (!db) return showLogin('Falta configurar la Publishable key en js/supabase-config.js.');
    panelMessage.textContent = 'Actualizando conversaciones…';
    const {data,error} = await db.from('solicitudes').select('*, clientes(*), archivos(*)').order('fecha_creacion',{ascending:false});
    if (error) { panelMessage.textContent=`No se pudieron cargar las solicitudes: ${error.message}`; return; }
    rows=(data||[]).map(r=>({...r,comunicaciones:[]}));
    await loadCommunications();
    panelMessage.textContent = communicationsEnabled ? '' : 'El historial no está disponible. Revisá el SQL del Centro de Conversaciones.';
    render();
    if (currentRow) {
      currentRow = rows.find(r=>r.id===currentRow.id) || null;
      if (currentRow && !drawer.hidden) renderConversation();
    }
  }

  async function loadCommunications(){
    communicationsEnabled=true;
    if(!rows.length)return;
    const {data,error}=await db.from('comunicaciones').select('*').in('solicitud_id',rows.map(r=>r.id)).order('fecha_creacion',{ascending:true});
    if(error){ communicationsEnabled=false; console.warn(error); return; }
    const grouped=(data||[]).reduce((a,m)=>{(a[m.solicitud_id] ||= []).push(m);return a;},{});
    rows.forEach(r=>r.comunicaciones=grouped[r.id]||[]);
  }

  function renderStats(filtered){
    const unread=filtered.reduce((s,r)=>s+unreadCount(r),0);
    const attention=filtered.filter(r=>['Pendiente de revisión','Falta información'].includes(r.estado)||conversationState(r)==='Esperando CVStudio').length;
    const production=filtered.filter(r=>['Confirmado','En producción'].includes(r.estado)).length;
    const finished=filtered.filter(r=>['Entregado','Finalizado'].includes(r.estado)).length;
    stats.innerHTML=[['Solicitudes',filtered.length,''],['Requieren atención',attention,'yellow'],['En proceso',production,''],['Completadas',finished,'green'],['Mensajes nuevos',unread,unread?'yellow':'']].map(([l,v,k])=>`<article class="stat ${k}"><span>${l}</span><strong>${v}</strong></article>`).join('');
  }

  function detailsText(row){const c=row.clientes||{},d=row.datos||{};return `${row.codigo}\nCliente: ${c.nombre||''}\nTeléfono: ${c.telefono||''}\nCorreo: ${c.email||''}\nUbicación: ${c.ciudad||''}\nServicio: ${row.servicio||''}\nEstado: ${row.estado||''}\n\n${Object.entries(d).map(([k,v])=>`${k}: ${compact(v)}`).join('\n')}\n\nNotas: ${row.notas||''}`;}
  function detailMarkup(data){const e=Object.entries(data||{}).filter(([,v])=>v!==''&&v!=null);return e.length?`<dl class="detail-list">${e.map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(compact(v))}</dd></div>`).join('')}</dl>`:'<p class="meta">Sin datos adicionales.</p>';}

  function filteredRows(){
    const q=search.value.trim().toLowerCase();
    const filtered=rows.filter(row=>{
      if(status.value&&row.estado!==status.value)return false;
      if(q&&!JSON.stringify(row).toLowerCase().includes(q))return false;
      const state=conversationState(row);
      if(conversationFilter.value==='unread'&&!unreadCount(row))return false;
      if(conversationFilter.value==='waiting-studio'&&state!=='Esperando CVStudio')return false;
      if(conversationFilter.value==='waiting-client'&&state!=='Esperando cliente')return false;
      if(conversationFilter.value==='inactive'&&inactiveDays(row)<3)return false;
      return true;
    });
    const activity=r=>new Date(lastMessage(r)?.fecha_creacion||r.fecha_actualizacion||r.fecha_creacion||0).getTime();
    return filtered.sort((a,b)=>{
      if(sortOrder?.value==='newest')return new Date(b.fecha_creacion)-new Date(a.fecha_creacion);
      if(sortOrder?.value==='oldest')return new Date(a.fecha_creacion)-new Date(b.fecha_creacion);
      if(sortOrder?.value==='name')return String(a.clientes?.nombre||'').localeCompare(String(b.clientes?.nombre||''),'es');
      return activity(b)-activity(a);
    });
  }

  function render(){
    const filtered=filteredRows(); renderStats(filtered);
    box.innerHTML=filtered.length?filtered.map(row=>{
      const c=row.clientes||{}, files=row.archivos||[], last=lastMessage(row), unread=unreadCount(row), state=conversationState(row);
      return `<article class="request" data-id="${esc(row.id)}">
        <div class="request-main">
          <div class="request-head"><div><h2>${esc(c.nombre||'Sin nombre')}</h2><div class="code">${esc(row.codigo||'')}</div><div class="meta">${formatDate(row.fecha_creacion)} · ${esc(row.servicio||'')}</div><span class="status-pill" data-status="${esc(row.estado||'Sin estado')}">${esc(row.estado||'Sin estado')}</span></div><select data-status>${STATUSES.map(s=>`<option ${s===row.estado?'selected':''}>${s}</option>`).join('')}</select></div>
          <div class="grid">${[['Teléfono',c.telefono],['Correo',c.email],['Ubicación',c.ciudad],['Tipo',row.subtipo],['Objetivo',row.datos?.objective],['Archivos',files.map(f=>f.nombre).join(', ')||'Sin archivos']].map(([a,b])=>`<div class="item"><span>${a}</span><p>${esc(b||'')}</p></div>`).join('')}</div>
          <button class="detail-toggle" type="button" data-toggle-details>Ver ficha completa ▾</button><div class="detail-panel" data-details hidden>${detailMarkup(row.datos)}</div>
          <textarea data-notes placeholder="Notas internas no visibles para el cliente">${esc(row.notas||'')}</textarea>
          <div class="actions"><button class="conversation-button" data-conversation>💬 Abrir conversación (${(row.comunicaciones||[]).length})</button>${unread?`<span class="new-message-badge">${unread} nuevo${unread>1?'s':''}</span>`:''}<button data-save>Guardar cambios</button><button class="secondary" data-copy>Copiar ficha</button>${files.map(f=>`<button class="secondary" data-file-path="${esc(f.url)}">Abrir ${esc(f.nombre)}</button>`).join('')}<button class="secondary danger" data-delete>Eliminar</button></div>
        </div>
        <aside class="communication-preview"><h3>Conversación</h3><span class="conversation-state">${esc(state)}</span><p>${(row.comunicaciones||[]).length} mensaje(s) · ${inactiveDays(row)>=3?'Sin actividad reciente':'Actividad reciente'}</p><div class="last-message"><strong>${last?esc(last.direccion==='entrante'?'Cliente':last.direccion==='saliente'?'CVStudio':'Sistema'):'Sin mensajes'}</strong><span>${last?esc((last.mensaje||'').slice(0,150)):'Abrí la conversación para comenzar el seguimiento.'}</span></div></aside>
      </article>`;
    }).join(''):'<div class="empty">No hay solicitudes para mostrar.</div>';
    bindCards();
  }

  function bindCards(){
    box.querySelectorAll('.request').forEach(card=>{
      const id=card.dataset.id, getRow=()=>rows.find(r=>r.id===id);
      card.querySelector('[data-toggle-details]').onclick=()=>{const p=card.querySelector('[data-details]');p.hidden=!p.hidden;card.querySelector('[data-toggle-details]').textContent=p.hidden?'Ver ficha completa ▾':'Ocultar ficha completa ▴';};
      card.querySelector('[data-conversation]').onclick=()=>openConversation(getRow());
      card.querySelector('[data-save]').onclick=async()=>{const estado=card.querySelector('[data-status]').value,notas=card.querySelector('[data-notes]').value;const btn=card.querySelector('[data-save]');btn.disabled=true;const {error}=await db.from('solicitudes').update({estado,notas,fecha_actualizacion:new Date().toISOString()}).eq('id',id);btn.disabled=false;if(error){toast('No se pudo guardar',error.message,'error');return;}const r=getRow();const old=r.estado;r.estado=estado;r.notas=notas;if(old!==estado)await addSystemCommunication(r,`Estado actualizado de “${old}” a “${estado}”.`);toast('Cambios guardados',r.codigo);render();};
      card.querySelector('[data-copy]').onclick=async()=>{try{await navigator.clipboard.writeText(detailsText(getRow()));toast('Ficha copiada','Lista para pegar');}catch{prompt('Copiá la ficha:',detailsText(getRow()));}};
      card.querySelectorAll('[data-file-path]').forEach(btn=>btn.onclick=async()=>{const {data,error}=await db.storage.from('siac-archivos').createSignedUrl(btn.dataset.filePath,60);if(error){toast('Ocurrió un error',error.message,'error');return};window.open(data.signedUrl,'_blank','noopener');});
      card.querySelector('[data-delete]').onclick=async()=>{if(!confirm('¿Eliminar definitivamente esta solicitud y sus datos?'))return;const {error}=await db.from('solicitudes').delete().eq('id',id);if(error){toast('Ocurrió un error',error.message,'error');return};rows=rows.filter(r=>r.id!==id);render();};
    });
  }

  async function markIncomingRead(row){const ids=(row.comunicaciones||[]).filter(m=>m.direccion==='entrante'&&m.no_leido).map(m=>m.id);if(!ids.length)return;const {error}=await db.from('comunicaciones').update({no_leido:false,fecha_lectura:new Date().toISOString()}).in('id',ids);if(!error)row.comunicaciones.forEach(m=>{if(ids.includes(m.id))m.no_leido=false;});}

  function cleanIncomingMessage(value){
    let text=String(value||'').replace(/\r\n?/g,'\n');
    text=text.replace(/<style[\s\S]*?<\/style>/gi,'').replace(/<script[\s\S]*?<\/script>/gi,'');
    text=text.replace(/<br\s*\/?\s*>/gi,'\n').replace(/<\/?(?:div|p|blockquote|li|tr|table)[^>]*>/gi,'\n');
    text=text.replace(/<[^>]+>/g,'').replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/&lt;/gi,'<').replace(/&gt;/gi,'>');
    const cutPatterns=[/^El .+ escribió:\s*$/mi,/^On .+ wrote:\s*$/mi,/^De:\s.+$/mi,/^From:\s.+$/mi,/^-{2,}\s*(?:Mensaje original|Original Message)\s*-{2,}$/mi,/^_{5,}$/mi,/^Enviado desde (?:mi|Mail)/mi];
    let cut=text.length; for(const pattern of cutPatterns){const match=pattern.exec(text);if(match&&match.index<cut)cut=match.index;}
    text=text.slice(0,cut).replace(/^>+\s?/gm,'').replace(/\[image:[^\]]*\]/gi,'').replace(/cid:[^\s]+/gi,'').replace(/\n{3,}/g,'\n\n').trim();
    const lines=text.split('\n');
    const signature=lines.findIndex((line,i)=>i>0&&/^(--|saludos[,.:]?|atentamente[,.:]?|gracias[,.:]?)$/i.test(line.trim()));
    if(signature>0&&lines.length-signature>2)text=lines.slice(0,signature).join('\n').trim();
    return text||String(value||'').trim();
  }

  const formatBytes=value=>{const n=Number(value||0);if(!n)return '';if(n<1024)return `${n} B`;if(n<1048576)return `${Math.round(n/1024)} KB`;return `${(n/1048576).toFixed(1)} MB`;};
  function attachmentMarkup(a){const name=a.filename||a.name||'Adjunto',url=a.download_url||a.url||a.signed_url||'',meta=[a.content_type||a.type||'',formatBytes(a.size||a.size_bytes)].filter(Boolean).join(' · ');const content=`<span>📎</span><span><strong>${esc(name)}</strong><small>${esc(meta||'Archivo adjunto')}</small></span>`;return url?`<a class="attachment-card" href="${esc(url)}" target="_blank" rel="noopener">${content}</a>`:`<div class="attachment-card">${content}</div>`;}

  function renderConversation(){
    if(!currentRow)return;
    const c=currentRow.clientes||{};
    conversationTitle.textContent=c.nombre||'Cliente';
    conversationContext.textContent=`${currentRow.codigo} · ${currentRow.servicio||'Solicitud'} · ${conversationState(currentRow)}`;
    conversationClient.innerHTML=[['Correo',c.email],['Teléfono',c.telefono],['Ubicación',c.ciudad],['Servicio',currentRow.servicio],['Código',currentRow.codigo],['Mensajes',(currentRow.comunicaciones||[]).length]].map(([k,v])=>`<dt>${k}</dt><dd>${esc(v||'—')}</dd>`).join('');
    conversationStatus.innerHTML=STATUSES.map(s=>`<option ${s===currentRow.estado?'selected':''}>${s}</option>`).join('');
    conversationNotes.value=currentRow.notas||'';
    conversationReminder.value=getReminder(currentRow.id);
    const items=[...(currentRow.comunicaciones||[])].sort((a,b)=>new Date(a.fecha_creacion)-new Date(b.fecha_creacion));
    timelineSummary.textContent=`${items.length} mensaje${items.length===1?'':'s'} · ${conversationState(currentRow)}`;
    if(!items.length) timeline.innerHTML='<div class="timeline-empty"><h3>Conversación lista</h3><p>Enviá el primer mensaje o registrá una respuesta recibida.</p></div>';
    else {
      let previousDay='';
      timeline.innerHTML=items.map(item=>{
        const day=dateKey(item.fecha_creacion), marker=day!==previousDay?`<div class="chat-day"><span>${day}</span></div>`:'';previousDay=day;
        const direction=item.direccion||'saliente', who=direction==='entrante'?'Cliente':direction==='saliente'?'CVStudio':'Sistema';
        const attachments=Array.isArray(item.adjuntos)?item.adjuntos:[];
        const original=String(item.mensaje||''),cleaned=direction==='entrante'?cleanIncomingMessage(original):original,showOriginal=direction==='entrante'&&cleaned!==original.trim();
        return `${marker}<div class="chat-row ${direction==='entrante'?'incoming':direction==='saliente'?'outgoing':'system'}"><article class="chat-bubble"><div class="chat-meta"><strong>${who}</strong><span>${formatDate(item.fecha_creacion)}</span>${item.no_leido?'<b>Nuevo</b>':''}</div>${item.asunto?`<div class="chat-subject">${esc(item.asunto)}</div>`:''}<p class="chat-message">${esc(cleaned)}</p>${showOriginal?`<details class="chat-original"><summary>Ver correo original completo</summary><pre>${esc(original)}</pre></details>`:''}${attachments.length?`<div class="chat-attachments">${attachments.map(attachmentMarkup).join('')}</div>`:''}</article></div>`;
      }).join('');
    }
    requestAnimationFrame(()=>timeline.scrollTop=timeline.scrollHeight);
  }

  async function openConversation(row){
    if(!row)return; currentRow=row; await markIncomingRead(row);
    conversationRequestId.value=row.id; conversationTemplate.value='custom'; selectedFiles=[]; renderSelectedFiles();
    conversationSubject.value=`Información sobre tu solicitud ${row.codigo} | CVStudio`;
    conversationMessage.value=''; conversationSendStatus.textContent='';
    conversationReminder.value=getReminder(row.id);
    drawer.hidden=false; document.body.classList.add('siac-dialog-open'); renderConversation();
    setTimeout(()=>conversationMessage.focus(),60); render();
  }
  function closeConversation(){drawer.hidden=true;document.body.classList.remove('siac-dialog-open');currentRow=null;selectedFiles=[];}

  function applyTemplate(){if(!currentRow)return;const c=currentRow.clientes||{},f=TEMPLATES[conversationTemplate.value]||TEMPLATES.custom,t=f({name:c.nombre||'cliente',service:currentRow.servicio||''});if(t)conversationMessage.value=t;}
  function renderSelectedFiles(){selectedAttachments.innerHTML=selectedFiles.map((f,i)=>`<span class="selected-file">${esc(f.name)} (${Math.ceil(f.size/1024)} KB)<button type="button" data-remove-file="${i}">×</button></span>`).join('');selectedAttachments.querySelectorAll('[data-remove-file]').forEach(b=>b.onclick=()=>{selectedFiles.splice(Number(b.dataset.removeFile),1);renderSelectedFiles();});}
  function fileToBase64(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result).split(',')[1]);r.onerror=reject;r.readAsDataURL(file);});}

  async function saveCommunication(row,payload,result){
    if(!communicationsEnabled)return;
    const {data:auth}=await db.auth.getUser();
    const record={solicitud_id:row.id,destinatario:payload.to,asunto:payload.subject,mensaje:payload.message,plantilla:payload.template,estado:'Enviado',direccion:'saliente',remitente:'contacto@cvstudio.com.ar',no_leido:false,adjuntos:result.attachments||[],resend_id:result.id||null,usuario_id:auth?.user?.id||null,fecha_creacion:new Date().toISOString()};
    const {data,error}=await db.from('comunicaciones').insert(record).select().single();
    if(error)throw new Error(`El correo salió, pero no se pudo registrar el historial: ${error.message}`);
    row.comunicaciones.push(data);
  }

  async function addSystemCommunication(row,message){if(!communicationsEnabled)return false;const record={solicitud_id:row.id,destinatario:'sistema@cvstudio.local',asunto:'Evento de seguimiento',mensaje:message,plantilla:'system',estado:'Registrado',direccion:'sistema',remitente:'SIAC',no_leido:false,adjuntos:[],fecha_creacion:new Date().toISOString()};const {data,error}=await db.from('comunicaciones').insert(record).select().single();if(error){console.error('No se pudo registrar el evento interno de SIAC:',error);return false;}row.comunicaciones.push(data);return true;}

  conversationForm.addEventListener('submit',async e=>{
    e.preventDefault(); if(!currentRow)return;
    const message=conversationMessage.value.trim(), subject=conversationSubject.value.trim(), to=currentRow.clientes?.email||'';
    if(message.length<10)return conversationSendStatus.textContent='Escribí un mensaje más completo.';
    if(selectedFiles.some(f=>f.size>4*1024*1024))return conversationSendStatus.textContent='Cada archivo debe pesar menos de 4 MB.';
    if(selectedFiles.length>3)return conversationSendStatus.textContent='Podés enviar hasta 3 archivos por mensaje.';
    sendConversation.disabled=true; conversationSendStatus.textContent='Preparando envío…';
    try{
      const {data:{session}}=await db.auth.getSession(); if(!session?.access_token)throw new Error('La sesión venció.');
      const attachments=[];for(const f of selectedFiles)attachments.push({filename:f.name,content:await fileToBase64(f),content_type:f.type||'application/octet-stream'});
      const payload={action:'admin-reply',requestId:currentRow.id,requestCode:currentRow.codigo,clientName:currentRow.clientes?.nombre||'Cliente',service:currentRow.servicio||'Solicitud',to,subject,message,template:conversationTemplate.value,copyToSelf:conversationCopy.checked,attachments};
      const response=await fetch(WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.access_token}`},body:JSON.stringify(payload)});
      const result=await response.json().catch(()=>({}));if(!response.ok||!result.ok)throw new Error(result.message||'No se pudo enviar.');
      await saveCommunication(currentRow,payload,result);
      if(currentRow.estado==='Pendiente de revisión')currentRow.estado='Falta información';
      await db.from('solicitudes').update({estado:currentRow.estado,fecha_actualizacion:new Date().toISOString()}).eq('id',currentRow.id);
      conversationMessage.value='';selectedFiles=[];renderSelectedFiles();conversationSendStatus.textContent='';toast('Mensaje enviado',`Correo enviado a ${to}`);renderConversation();render();
    }catch(err){conversationSendStatus.textContent=err.message||'No se pudo enviar.';}finally{sendConversation.disabled=false;}
  });

  conversationFiles.addEventListener('change',()=>{selectedFiles=[...selectedFiles,...conversationFiles.files].slice(0,3);conversationFiles.value='';renderSelectedFiles();});
  conversationTemplate.addEventListener('change',applyTemplate);

  saveConversationMeta.addEventListener('click',async()=>{if(!currentRow)return;const newStatus=conversationStatus.value,notes=conversationNotes.value;const old=currentRow.estado;const {error}=await db.from('solicitudes').update({estado:newStatus,notas:notes,fecha_actualizacion:new Date().toISOString()}).eq('id',currentRow.id);if(error){toast('Ocurrió un error',error.message,'error');return};currentRow.estado=newStatus;currentRow.notas=notes;if(old!==newStatus)await addSystemCommunication(currentRow,`Estado actualizado de “${old}” a “${newStatus}”.`);renderConversation();render();});

  function openQuick(mode){if(!currentRow)return;quickMode=mode;quickEntryTitle.textContent=mode==='incoming'?'Registrar mensaje recibido':'Agregar evento interno';quickEntrySubject.value=mode==='incoming'?`RE: ${conversationSubject.value}`:'Evento de seguimiento';quickEntryMessage.value='';quickModal.hidden=false;setTimeout(()=>quickEntryMessage.focus(),50);}
  function closeQuick(){quickModal.hidden=true;}
  registerIncoming.addEventListener('click',()=>openQuick('incoming')); addSystemEvent.addEventListener('click',()=>openQuick('system'));
  quickEntryForm.addEventListener('submit',async e=>{e.preventDefault();if(!currentRow)return;const inbound=quickMode==='incoming';const record={solicitud_id:currentRow.id,destinatario:inbound?'contacto@cvstudio.com.ar':'',asunto:quickEntrySubject.value.trim(),mensaje:quickEntryMessage.value.trim(),plantilla:inbound?'manual-inbound':'system',estado:inbound?'Recibido':'Registrado',direccion:inbound?'entrante':'sistema',remitente:inbound?(currentRow.clientes?.email||'Cliente'):'SIAC',no_leido:false,adjuntos:[],fecha_creacion:new Date().toISOString()};const {data,error}=await db.from('comunicaciones').insert(record).select().single();if(error){toast('Ocurrió un error',error.message,'error');return};currentRow.comunicaciones.push(data);if(inbound&&currentRow.estado!=='Finalizado')currentRow.estado='Falta información';await db.from('solicitudes').update({estado:currentRow.estado,fecha_actualizacion:new Date().toISOString()}).eq('id',currentRow.id);closeQuick();renderConversation();render();});

  document.querySelectorAll('[data-close-conversation]').forEach(el=>el.addEventListener('click',closeConversation));
  document.querySelectorAll('[data-close-quick]').forEach(el=>el.addEventListener('click',closeQuick));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!quickModal.hidden)closeQuick();else if(!drawer.hidden)closeConversation();}});

  loginForm.addEventListener('submit',async e=>{e.preventDefault();if(!db)return showLogin('Falta configurar Supabase.');loginMessage.textContent='Ingresando…';const {error}=await db.auth.signInWithPassword({email:$('loginEmail').value.trim(),password:$('loginPassword').value});if(error)return loginMessage.textContent='Correo o contraseña incorrectos.';showDashboard();loadRequests();});
  logout.addEventListener('click',async()=>{await db?.auth.signOut();showLogin('Sesión cerrada.');});
  refresh.addEventListener('click',loadRequests); search.addEventListener('input',render); status.addEventListener('change',render); conversationFilter.addEventListener('change',render); sortOrder?.addEventListener('change',render); jumpToLatest?.addEventListener('click',()=>timeline.scrollTo({top:timeline.scrollHeight,behavior:'smooth'}));
  setInterval(()=>{if(!dashboard.hidden&&document.visibilityState==='visible')loadRequests();},45000);

  (async()=>{if(!db)return showLogin('Pegá la Publishable key en js/supabase-config.js.');const {data:{session}}=await db.auth.getSession();if(session){showDashboard();loadRequests();}else showLogin();})();
})();
