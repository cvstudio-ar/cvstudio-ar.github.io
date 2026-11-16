(() => {
 'use strict';
 const api=window.GESFIPDemo;
 if(!api)return;
 let config=api.read();
 const $=q=>document.querySelector(q), $$=q=>Array.from(document.querySelectorAll(q));
 const status=message=>{$('#status').textContent=message};
 const validColor=value=>/^#[0-9a-f]{6}$/i.test(String(value||''));
 const validUrl=value=>/^https:\/\/[^"'<>\s]+$/i.test(String(value||'')) || value==='./hero-aprobada.svg';
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
 $('#saveConfig').addEventListener('click',()=>{
   const next={...config};
   $$('[data-field]').forEach(input=>next[input.dataset.field]=safeField(input.dataset.field,input.value));
   next.operations=$('#operationEditor').value.split('\n').map(x=>x.trim()).filter(Boolean).slice(0,12);
   next.services=(config.services||[]).map(s=>({
     title:String(s.title||'').slice(0,80),glyph:String(s.glyph||'◇').slice(0,5),
     short:String(s.short||'').slice(0,240),detail:String(s.detail||'').slice(0,1300)
   }));
   try{api.save(next);config=next;status('Guardado localmente. Abrí la vista pública desde este navegador para ver los cambios.');}
   catch{status('No se pudo guardar. Comprobá el almacenamiento disponible del navegador.')}
 });
 $('#resetConfig').addEventListener('click',()=>{
   if(!confirm('¿Restablecer la vista de demostración en este navegador?'))return;
   api.reset();config=api.read();fill();status('Se restableció la versión original de la demostración.');
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
})();