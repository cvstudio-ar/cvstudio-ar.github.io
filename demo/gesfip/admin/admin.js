(() => {
 'use strict';
 const api=window.GESFIPDemo;
 if(!api)return;
 let config=api.read();
 const $=q=>document.querySelector(q), $$=q=>Array.from(document.querySelectorAll(q));
 const status=message=>{$('#status').textContent=message};
 const validColor=value=>/^#[0-9a-f]{6}$/i.test(String(value||''));
 const validUrl=value=>{
   const v=String(value||'');
   return v==='./hero-aprobada.svg'
    || /^\.\/assets\/[a-z0-9-]+\.(?:svg|webp|png|jpe?g)$/i.test(v)
    || /^\/api\/media\/(?:hero|about|team|(?:service-0[1-8]|operation-0[1-5]))$/.test(v)
    || /^https:\/\/[a-z0-9.-]+\/[a-z0-9_./?=&%+-]*$/i.test(v);
 };
 const previewUrl=value=>{
   const v=String(value||'');
   return v.startsWith('./')?'../'+v.slice(2):v;
 };
 const safeField=(key,value)=>{
   if(['gold','dark'].includes(key))return validColor(value)?value:api.defaults[key];
   if(key==='heroImage')return validUrl(value)?value:api.defaults.heroImage;
   return String(value??'').slice(0,1500);
 };
 function bindFields(){
   $$('[data-field]').forEach(input=>{
     input.value=config[input.dataset.field]??'';
     input.addEventListener('input',()=>{
       config[input.dataset.field]=input.value;
       if(input.dataset.field==='heroImage')renderImage();
       if(['gold','dark'].includes(input.dataset.field))renderColors();
     });
   });
 }

 const images=[
   {slot:'hero',title:'01 · Portada principal',desc:'Imagen panorámica del inicio. Dejá espacio para el título a la izquierda.',field:'heroImage',minWidth:1280,minHeight:650},
   {slot:'about',title:'02 · Sobre nosotros',desc:'Imagen institucional del equipo, prevención o vigilancia.',field:'aboutImage',minWidth:1100,minHeight:620},
   {slot:'team',title:'03 · Nuestro equipo',desc:'Fotografía complementaria para la presentación del personal.',field:'teamImage',minWidth:1100,minHeight:520},
   ...Array.from({length:8},(_,index)=>({
     slot:'service-'+String(index+1).padStart(2,'0'),
     title:String(index+4).padStart(2,'0')+' · '+(config.services?.[index]?.title||'Servicio '+(index+1)),
     desc:'Fotografía de fondo de la tarjeta '+(index+1)+'.',
     index,minWidth:720,minHeight:400
   })),
   ...Array.from({length:5},(_,index)=>({
     slot:'operation-'+String(index+1).padStart(2,'0'),
     title:String(index+12).padStart(2,'0')+' · '+(config.operations?.[index]||'Operación '+(index+1)),
     desc:'Imagen para la operación de seguridad '+(index+1)+'.',
     operationIndex:index,minWidth:720,minHeight:400
   }))
 ];
 const initialImage=entry=>entry.operationIndex!=null ?
   (config.operationImages?.[entry.operationIndex]||api.defaults.operationImages?.[entry.operationIndex]||'') :
   entry.index==null ? (config[entry.field]||api.defaults[entry.field]||'') :
   (config.services?.[entry.index]?.image||api.defaults.services?.[entry.index]?.image||'');
 const defaultImage=entry=>entry.operationIndex!=null ?
   (api.defaults.operationImages?.[entry.operationIndex]||'') :
   entry.index==null ? (api.defaults[entry.field]||'') :
   (api.defaults.services?.[entry.index]?.image||'');
 const changeImage=(entry,url)=>{
   if(entry.operationIndex!=null)config.operationImages[entry.operationIndex]=url;
   else if(entry.index==null)config[entry.field]=url;
   else if(config.services?.[entry.index])config.services[entry.index].image=url;
   if(entry.field==='heroImage'){
     const el=$('[data-field="heroImage"]');
     if(el)el.value=url;
     renderImage();
   }
 };
 function renderImageSlots(){
   const wrapper=$('#imageSlots');if(!wrapper)return;
   wrapper.replaceChildren();
   for(const entry of images){
     if(entry.index!=null)entry.title=String(entry.index+4).padStart(2,'0')+' · '+(config.services?.[entry.index]?.title||'Servicio '+(entry.index+1));
   if(entry.operationIndex!=null)entry.title=String(entry.operationIndex+12).padStart(2,'0')+' · '+(config.operations?.[entry.operationIndex]||'Operación '+(entry.operationIndex+1));
     const card=document.createElement('article');card.className='image-slot';
     const title=document.createElement('h3');title.textContent=entry.title;
     const desc=document.createElement('p');desc.textContent=entry.desc;
     const frame=document.createElement('div');frame.className='image-slot-preview';
     const preview=document.createElement('img');preview.alt='Vista de '+entry.title;preview.loading='lazy';
     if(validUrl(initialImage(entry)))preview.src=previewUrl(initialImage(entry));
     frame.append(preview);
     const field=document.createElement('input');field.type='file';field.accept='image/jpeg,image/png,image/webp';field.setAttribute('aria-label','Reemplazar '+entry.title);
     const hint=document.createElement('small');
     hint.textContent='Recomendado: '+entry.minWidth+' × '+entry.minHeight+' px o superior. JPG/PNG/WebP, máximo 3 MB.';
     const feedback=document.createElement('small');feedback.className='image-slot-status';
     const reset=document.createElement('button');reset.type='button';reset.className='btn alt';reset.textContent='Restaurar imagen original';
     reset.addEventListener('click',()=>{
       const original=defaultImage(entry);
       changeImage(entry,original);
       preview.src=previewUrl(original);
       feedback.textContent='Imagen original seleccionada. Pulsá Guardar cambios.';
     });
     field.addEventListener('change',async()=>{
       const file=field.files?.[0];if(!file)return;
       if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>3_000_000){
         feedback.textContent='Elegí JPG, PNG o WebP de hasta 3 MB.';field.value='';return;
       }
       let bitmap;
       try{bitmap=await createImageBitmap(file)}catch{feedback.textContent='No se pudo leer esta imagen.';return}
       const w=bitmap.width,h=bitmap.height;bitmap.close();
       if(w<entry.minWidth||h<entry.minHeight){
         feedback.textContent='Imagen pequeña ('+w+' × '+h+' px). Usá una versión de al menos '+entry.minWidth+' × '+entry.minHeight+' para evitar pixelado.';
         return;
       }
       if(api.localMode()){
         const local=URL.createObjectURL(file);
         preview.onload=()=>URL.revokeObjectURL(local);
         preview.src=local;
         feedback.textContent='Vista previa local: la carga real estará habilitada en el dominio definitivo.';
         return;
       }
       field.disabled=true;feedback.textContent='Subiendo imagen…';
       try{
         const response=await fetch('../api/admin/media/'+entry.slot,{
           method:'POST',headers:{'Content-Type':file.type},body:file
         });
         const result=await response.json().catch(()=>({error:'No se pudo interpretar la respuesta del servidor.'}));
         if(!response.ok||!result.ok)throw Error(result.error||'No se pudo subir la imagen.');
         changeImage(entry,result.url);
         preview.src=result.url+'?v='+Date.now();
         feedback.textContent='Imagen subida. Pulsá Guardar cambios para aplicarla.';
       }catch(error){feedback.textContent=error?.message||'No se pudo subir.'}
       finally{field.disabled=false;field.value=''}
     });
     card.append(title,desc,frame,field,hint,feedback,reset);wrapper.append(card);
   }
 }
 function renderOperations(){
   const wrapper=$('#operationFields');if(!wrapper)return;
   wrapper.replaceChildren();
   if(!Array.isArray(config.operationDetails))config.operationDetails=[...api.defaults.operationDetails];
   (config.operations||[]).slice(0,5).forEach((name,index)=>{
     const card=document.createElement('article');card.className='card';
     const heading=document.createElement('h3');heading.textContent='Operación '+String(index+1).padStart(2,'0');
     const label=document.createElement('label');label.className='form-field';
     const headingText=document.createElement('span');headingText.textContent='Título de la operación';
     const input=document.createElement('input');input.maxLength=120;input.value=name;
     input.addEventListener('input',()=>{config.operations[index]=input.value;});
     label.append(headingText,input);
     const details=document.createElement('label');details.className='form-field';
     const desc=document.createElement('span');desc.textContent='Descripción y procedimiento';
     const textarea=document.createElement('textarea');textarea.maxLength=900;
     textarea.value=config.operationDetails[index]||'';
     textarea.addEventListener('input',()=>{config.operationDetails[index]=textarea.value;});
     details.append(desc,textarea);
     card.append(heading,label,details);wrapper.append(card);
   });
 }
 function renderServices(){
   const wrapper=$('#serviceFields');wrapper.replaceChildren();
   (config.services||[]).forEach((item,index)=>{
     const card=document.createElement('article');card.className='card';
     const title=document.createElement('h3');title.textContent='Tarjeta '+(index+1);
     card.append(title);
     const fields=[['title','Nombre de servicio','input'],['glyph','Símbolo / ícono','input'],['short','Descripción breve','textarea'],['detail','Contenido de la ventana emergente','textarea']];
     for(const [key,label,type] of fields){
       const container=document.createElement('label');container.className='form-field';
       const heading=document.createElement('span');heading.textContent=label;
       const input=document.createElement(type);input.value=item[key]||'';input.maxLength=key==='detail'?1300:220;
       input.addEventListener('input',()=>item[key]=input.value);
       container.append(heading,input);card.append(container);
     }
     wrapper.append(card);
   });
 }
 function renderImage(){
   const img=$('#imagePreview');img.replaceChildren();
   if(!validUrl(config.heroImage)){const note=document.createElement('span');note.textContent='Ingresá una URL HTTPS o utilizá la portada aprobada.';img.append(note);return}
   const el=document.createElement('img');el.src=previewUrl(config.heroImage);el.alt='Imagen de portada elegida';el.loading='lazy';
   el.onerror=()=>{img.textContent='No se pudo cargar esta imagen. Verificá la dirección indicada.'};
   img.append(el);
 }
 function renderColors(){
   $('#colorPreview').style.background='linear-gradient(110deg,'+(validColor(config.dark)?config.dark:'#070d13')+' 65%,'+(validColor(config.gold)?config.gold:'#eeb24c')+')';
 }
 function fill(){
   $$('[data-field]').forEach(input=>input.value=config[input.dataset.field]??'');
   renderOperations();renderServices();renderColors();renderImage();renderImageSlots();
 }
 $$('[data-tab]').forEach(btn=>btn.addEventListener('click',()=>{
   $$('[data-tab]').forEach(el=>el.classList.toggle('active',el===btn));
   $$('[data-panel]').forEach(el=>el.classList.toggle('hidden',el.dataset.panel!==btn.dataset.tab));
   if(window.innerWidth<820)window.scrollTo({top:0,behavior:'smooth'});
 }));
 $('#saveConfig').addEventListener('click',async()=>{
   const next={...config};
   $$('[data-field]').forEach(input=>next[input.dataset.field]=safeField(input.dataset.field,input.value));
   next.operations=(config.operations||[]).slice(0,5);
   next.operationDetails=(config.operationDetails||[]).slice(0,5);
   next.services=(config.services||[]).map((s,index)=>({
     title:String(s.title||'').slice(0,80),glyph:String(s.glyph||'◇').slice(0,5),
     short:String(s.short||'').slice(0,240),detail:String(s.detail||'').slice(0,1300),
     image:validUrl(s.image)?s.image:(api.defaults.services?.[index]?.image||'')
   }));
   try{await api.persist(next);config=next;status(api.localMode()?'Guardado solo para esta demostración.':'Cambios guardados. Ya están disponibles para los visitantes.');}
   catch(err){status(err?.message || 'No se pudo guardar. Revisá el acceso administrativo.')}
 });
 $('#resetConfig').addEventListener('click',async()=>{
   if(!confirm('¿Restablecer la vista de demostración en este navegador?'))return;
   try{if(api.localMode()){api.reset();config=api.read()}else{await api.persist(api.defaults);config=api.defaults};fill();status('Se restauró el contenido inicial.')}catch(err){status(err?.message||'No se pudo restaurar.');}
 });
 $('#exportConfig').addEventListener('click',()=>{
   const text=JSON.stringify(config,null,2),blob=new Blob([text],{type:'application/json'});
   const url=URL.createObjectURL(blob),a=document.createElement('a');
   a.href=url;a.download='gesfip-configuracion-demo.json';a.click();
   setTimeout(()=>URL.revokeObjectURL(url),2000);
   status('Se descargó la configuración.');
 });
 $('#importConfig').addEventListener('change',async event=>{
   const file=event.target.files?.[0];if(!file)return;
   if(file.size>100000){status('El archivo supera el tamaño permitido (100 KB).');return}
   try{
     const obj=JSON.parse(await file.text());
     if(!obj||!Array.isArray(obj.services)||obj.services.length>24)throw Error('Formato inválido');
     config={...api.defaults,...obj};
     fill();status('Configuración cargada. Pulsá Guardar para conservarla en este navegador.');
   }catch{status('No se pudo importar este JSON. Comprobá el archivo.')}
 });
 bindFields();renderOperations();renderServices();renderColors();renderImage();renderImageSlots();
 if(!api.localMode()){
   $('#status').textContent='Verificando acceso al panel…';
   $('#saveConfig').disabled=true;
   api.loadAdmin().then(data=>{
     config=data;fill();$('#saveConfig').disabled=false;
     status('Panel conectado. Los cambios se guardarán en el sitio publicado.');
   }).catch(err=>status('Panel no habilitado: '+(err?.message||'Configuración pendiente')));
 }
 const upload=$('#uploadHeroImage');
 upload?.addEventListener('change',async()=>{
   const file=upload.files?.[0];if(!file)return;
   if(api.localMode()){status('La carga de imágenes funciona cuando se configure el panel definitivo en Cloudflare.');return}
   if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>3000000){status('Usá JPG, PNG o WebP de hasta 3 MB.');return}
   try{
     status('Subiendo portada…');
     const response=await fetch('../api/admin/hero',{method:'POST',headers:{'Content-Type':file.type},body:file});
     const result=await response.json();
     if(!response.ok||!result.ok)throw Error(result.error||'No se pudo subir la imagen.');
     config.heroImage=result.url;
     $('[data-field="heroImage"]').value=result.url;
     renderImage();status('Imagen subida. Ahora pulsá Guardar cambios para aplicarla a la portada.');
   }catch(error){status(error?.message||'No se pudo subir la imagen.');}
 });
})();