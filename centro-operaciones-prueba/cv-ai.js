/* CVStudio · Asistente CV integrado. Los textos permanecen en esta pestaña hasta cerrarla. */
(()=>{
  'use strict';
  let source='',targetJob='',note='',task='evaluar',output='',clientName='',busy=false,approval=false;
  let connection={checked:false,configured:false,model:'',used:0,limit:60,remaining:0,error:''};
  const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const options=[
    ['evaluar','Evaluación y recomendaciones'],
    ['perfil','Perfil profesional / Sobre mí'],
    ['experiencia','Experiencia laboral optimizada'],
    ['formacion','Formación y cursos'],
    ['habilidades','Habilidades y palabras clave ATS'],
    ['linkedin','Perfil de LinkedIn'],
    ['carta','Carta de presentación'],
    ['freelance','Perfil freelance'],
    ['personalizado','Redacción personalizada']
  ];
  const forbidden=/dni|cuil|cuit|documento|tel[eé]fono|phone|whatsapp|correo|email|mail|direcci[oó]n|domicilio|localidad|ciudad|nacimiento|fecha.nac|fot[oó]|imagen|archivo|contrase[nñ]a|password|link|url|c[oó]digo|pago|precio/i;
  function setClient(client){
    if(!client)return;
    clientName=String(client.name||'Cliente');
    const data=client.formData&&typeof client.formData==='object'?client.formData:{};
    const lines=[client.service?'Servicio solicitado: '+client.service:''];
    for(const [key,val] of Object.entries(data)){
      if(forbidden.test(key)||!val)continue;
      const readable=key.replace(/[_-]/g,' ').replace(/([a-z])([A-Z])/g,'$1 $2');
      const value=typeof val==='string'?val:Array.isArray(val)?val.join(', '):typeof val==='object'?JSON.stringify(val):String(val);
      const clean=value.trim().slice(0,2400);
      if(clean&&clean!=='false'&&clean!=='null')lines.push(readable+': '+clean);
    }
    source=lines.filter(Boolean).join('\n').slice(0,16000);
    targetJob=typeof data.puesto_objetivo==='string'?data.puesto_objetivo.slice(0,220):'';
    note='';output='';approval=false;
  }
  function statusLabel(){
    if(!connection.checked)return 'Comprobando la conexión…';
    if(connection.error)return 'Conexión pendiente';
    return connection.configured?'API conectada':'Falta habilitar la API';
  }
  function render(){
    const ready=connection.checked&&connection.configured&&!connection.error;
    return '<section class="cv-ai-shell">'+
      '<div class="cv-ai-hero"><div><span class="cv-ai-eyebrow">CVSTUDIO · REDACCIÓN PROFESIONAL</span><h2>Asistente de CV con IA</h2><p>Evaluá CVs, redactá secciones, cartas, perfiles freelance y LinkedIn. Copiá cada resultado directamente a Canva.</p></div><div class="cv-ai-connection"><strong>'+esc(statusLabel())+'</strong><small>'+esc(connection.model||'OpenAI · API privada')+'</small><small>'+(connection.checked?esc(String(connection.used)+' / '+String(connection.limit)+' consultas en 24 h'):'Cuenta CVStudio')+'</small><button class="button secondary small" type="button" data-cv-ai-recheck>Comprobar conexión</button></div></div>'+
      '<div class="cv-ai-navigation"><span>'+esc(clientName?'Cliente seleccionado: '+clientName:'Trabajo sin cliente seleccionado')+'</span><button class="button secondary small" data-cv-ai-clients type="button">Volver a Clientes</button><button class="button secondary small" data-cv-ai-templates type="button">Abrir las 16 plantillas</button></div>'+
      (connection.error?'<div class="cv-ai-error" role="alert">'+esc(connection.error)+'</div>':'')+
      (!ready&&connection.checked&&!connection.error?'<div class="cv-ai-error" role="status">La pantalla está lista, pero administración debe configurar <code>OPENAI_API_KEY</code> en los secretos del proyecto Supabase para habilitar las respuestas reales.</div>':'')+
      '<div class="cv-ai-workspace"><form class="panel cv-ai-editor" id="cvAiForm">'+
      '<div class="cv-ai-section-head"><h3>1. Información profesional</h3><p>Usá los datos del formulario o pegá el CV del cliente. Revisalos antes de enviarlos.</p></div>'+
      '<label>Tipo de trabajo<select name="task" id="cvAiTask">'+options.map(([id,name])=>'<option value="'+id+'"'+(id===task?' selected':'')+'>'+esc(name)+'</option>').join('')+'</select></label>'+
      '<label>Puesto objetivo <span class="cv-ai-optional">(opcional)</span><input name="targetJob" id="cvAiTarget" maxlength="220" placeholder="Ej.: administrativo, seguridad, ventas…" value="'+esc(targetJob)+'"></label>'+
      '<label>CV o información de la ficha<textarea name="source" id="cvAiSource" rows="15" maxlength="16000" placeholder="Pegá aquí el texto del CV o elegí un cliente desde el módulo Clientes.">'+esc(source)+'</textarea></label>'+
      '<div class="cv-ai-counter"><small>No incluyas DNI, CUIL, teléfonos, direcciones ni datos que no sean necesarios.</small><span id="cvAiLength">'+source.length+' / 16000</span></div>'+
      '<label>Pedido adicional <span class="cv-ai-optional">(opcional)</span><textarea id="cvAiNote" name="note" rows="3" maxlength="1600" placeholder="Ej.: perfil orientado a atención al cliente, tono más formal…">'+esc(note)+'</textarea></label>'+
      '<label class="cv-ai-consent"><input type="checkbox" id="cvAiApproval" '+(approval?'checked':'')+'><span>Revisé el contenido y confirmo que los datos profesionales seleccionados pueden enviarse a la API de OpenAI para elaborar esta redacción.</span></label>'+
      '<div class="cv-ai-toolbar"><button class="button primary" id="cvAiSubmit" type="submit" '+(busy||!ready?'disabled':'')+'>'+(busy?'Redactando…':'Generar con IA')+'</button><button class="button secondary" type="button" data-cv-ai-clear>Limpiar texto</button></div>'+
      '</form><section class="panel cv-ai-output-panel"><div class="cv-ai-section-head"><h3>2. Resultado listo para Canva</h3><p>Leé, corregí y copiá lo que necesites. El texto no se guarda automáticamente en la ficha del cliente.</p></div>'+
      '<textarea aria-label="Texto generado por IA" id="cvAiResult" rows="23" placeholder="La evaluación o redacción generada aparecerá aquí. Podés corregirla antes de copiar." spellcheck="true">'+esc(output)+'</textarea>'+
      '<div class="cv-ai-toolbar"><button class="button primary" type="button" data-cv-ai-copy '+(!output?'disabled':'')+'>Copiar redacción</button><button class="button secondary" type="button" data-cv-ai-repeat '+(!output||busy?'disabled':'')+'>Reformular</button></div>'+
      '<p class="cv-ai-footnote">Revisá fechas, datos, estudios y experiencias antes de entregar. No se deben inventar antecedentes laborales.</p></section></div></section>';
  }
  function redraw(){if(document.querySelector('#appMain[data-module="asistente-ia"]'))window.openModule?.('asistente-ia')}
  function updateFields(){const a=document.getElementById('cvAiSource'),t=document.getElementById('cvAiTarget'),n=document.getElementById('cvAiNote'),k=document.getElementById('cvAiTask'),ok=document.getElementById('cvAiApproval'),o=document.getElementById('cvAiResult');if(a)source=a.value;if(t)targetJob=t.value;if(n)note=n.value;if(k)task=k.value;if(ok)approval=ok.checked;if(o)output=o.value;}
  async function request(payload){
    const client=window.cvstudioSupabase;
    if(!client)throw Error('La sesión de CVStudio no está disponible. Actualizá e ingresá nuevamente.');
    const {data,error}=await client.functions.invoke('cvstudio-cv-ai',{body:payload});
    if(error){
      let message='No se pudo conectar con el asistente.';
      try{const details=await error.context?.json?.();message=details?.message||message;}catch{}
      throw Error(message);
    }
    if(!data?.ok)throw Error(data?.message||'El servidor no confirmó la operación.');
    return data;
  }
  async function checkConnection(){
    if(connection.checking)return;
    connection.checking=true;
    try{
      const data=await request({action:'status'});
      connection={checked:true,configured:Boolean(data.configured),model:data.model||'',used:Number(data.used||0),remaining:Number(data.remaining||0),limit:Number(data.limit||60),error:'',checking:false};
    }catch(err){connection={...connection,checked:true,error:err.message,checking:false};}
    redraw();
  }
  async function generate(){
    updateFields();
    if(busy)return;
    if(source.trim().length<30){window.toast?.('Agregá información del CV: al menos 30 caracteres.');return}
    if(!approval){window.toast?.('Revisá los datos y marcá la confirmación antes de enviarlos.');return}
    if(!connection.configured){window.toast?.('Administración debe configurar OpenAI API.');return}
    busy=true;redraw();
    try{
      const data=await request({action:'generate',task,source,targetJob,note});
      output=data.output||'';
      connection.used+=1;connection.remaining=Number(data.remaining??connection.remaining);
      window.toast?.('Redacción lista para copiar. Revisá el contenido antes de entregarlo.');
    }catch(err){window.toast?.(err.message);connection.error=err.message;}
    finally{busy=false;redraw();}
  }
  async function copy(){
    updateFields();
    if(!output.trim()){window.toast?.('Todavía no hay texto para copiar.');return}
    try{await navigator.clipboard.writeText(output);window.toast?.('Texto copiado. Ya podés pegarlo en Canva.');}
    catch{const el=document.getElementById('cvAiResult');if(el){el.select();document.execCommand('copy');window.toast?.('Texto seleccionado para copiar.');}}
  }
  function bind(main){
    if(!main)return;
    main.querySelectorAll('#cvAiSource,#cvAiTarget,#cvAiNote,#cvAiTask,#cvAiApproval,#cvAiResult').forEach(el=>el.addEventListener('input',()=>{updateFields();const length=document.getElementById('cvAiLength');if(length)length.textContent=source.length+' / 16000';}));
    main.querySelector('#cvAiForm')?.addEventListener('submit',e=>{e.preventDefault();generate();});
    main.querySelector('[data-cv-ai-copy]')?.addEventListener('click',copy);
    main.querySelector('[data-cv-ai-repeat]')?.addEventListener('click',generate);
    main.querySelector('[data-cv-ai-clear]')?.addEventListener('click',()=>{source='';note='';targetJob='';output='';approval=false;clientName='';redraw()});
    main.querySelector('[data-cv-ai-clients]')?.addEventListener('click',()=>{updateFields();window.openModule?.('clientes')});
    main.querySelector('[data-cv-ai-templates]')?.addEventListener('click',()=>{updateFields();window.openModule?.('plantillas')});
    main.querySelector('[data-cv-ai-recheck]')?.addEventListener('click',()=>{updateFields();checkConnection()});
    if(!connection.checked&&!connection.checking)setTimeout(checkConnection,0);
  }
  window.CVStudioCVAI={render,bind,setClient,checkConnection};
})();