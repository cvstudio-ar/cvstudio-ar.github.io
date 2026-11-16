(() => {
 'use strict';
 const api=window.GESFIPDemo;
 if(!api)return;
 let config=api.read();
 const $=q=>document.querySelector(q), $$=q=>Array.from(document.querySelectorAll(q));
 const status=message=>{$('#status').textContent=message};
 const validColor=value=>/^#[0-9a-f]{6}$/i.test(String(value||''));
 const validUrl=value=>value==='/api/media/hero' || /^https:\/\/[^"'<>\s]+$/i.test(String(value||'')) || value==='./hero-aprobada.svg';
 const previewUrl=value=>value==='./hero-aprobada.svg'?'../hero-aprobada.svg':value;
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
   $('#operationEditor').value=(config.operations||[]).join('\n');
   $('#operationEditor').addEventListener('input',()=>{
     config.operations=$('#operationEditor').value.split('\n').map(x=>x.trim()).filter(Boolean).slice(0,12);
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
   $('#operationEditor').value=(config.operations||[]).join('\n');
   renderServices();renderColors();renderImage();
 }
 $$('[data-tab]').forEach(btn=>btn.addEventListener('click',()=>{
   $$('[data-tab]').forEach(el=>el.classList.toggle('active',el===btn));
   $$('[data-panel]').forEach(el=>el.classList.toggle('hidden',el.dataset.panel!==btn.dataset.tab));
   if(window.innerWidth<820)window.scrollTo({top:0,behavior:'smooth'});
 }));
 $('#saveConfig').addEventListener('click',async()=>{
   const next={...config};
   $$('[data-field]').forEach(input=>next[input.dataset.field]=safeField(input.dataset.field,input.value));
   next.operations=$('#operationEditor').value.split('\n').map(x=>x.trim()).filter(Boolean).slice(0,12);
   next.services=(config.services||[]).map(s=>({
     title:String(s.title||'').slice(0,80),glyph:String(s.glyph||'◇').slice(0,5),
     short:String(s.short||'').slice(0,240),detail:String(s.detail||'').slice(0,1300)
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
 bindFields();renderServices();renderColors();renderImage();
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