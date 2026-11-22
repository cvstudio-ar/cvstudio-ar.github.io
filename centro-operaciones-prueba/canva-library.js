/* CVStudio · biblioteca real de páginas del pack Canva. Sin modelos inventados. */
(()=>{
'use strict';
let phase='idle',models=[],error='',packName='',hasPreviews=false,lastChecked='',lastLoadedAt=0;
const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const validImage=value=>{try{const u=new URL(value);return u.protocol==='https:'&&(u.hostname==='canva.com'||u.hostname.endsWith('.canva.com'))?u.toString():'';}catch{return ''}};
const validEdit=value=>{try{const u=new URL(value);return u.protocol==='https:'&&['www.canva.com','canva.com'].includes(u.hostname)?u.toString():'';}catch{return ''}};
function card(model){
 const number=Number(model.pageNumber)||0,thumb=validImage(model.thumbnailUrl),name=escapeHTML(model.name||('Modelo '+String(number).padStart(2,'0'))),editUrl=validEdit(model.editUrl);
 return '<article class="panel canva-real-card">'+
  '<div class="canva-real-image">'+(thumb?'<img src="'+escapeHTML(thumb)+'" loading="lazy" referrerpolicy="no-referrer" alt="Vista previa de '+name+'">':'<div class="canva-real-no-image">Vista previa no disponible</div>')+
  '<span class="canva-real-number">Página '+number+'</span></div>'+
  '<div class="canva-real-card-body"><strong>'+name+'</strong><small>CV profesional · Canva oficial</small>'+
  '<div class="canva-real-card-actions"><button type="button" class="button secondary small" data-canva-preview="'+number+'">Vista previa</button>'+
  (editUrl?'<a class="button primary small canva-direct-link" href="'+escapeHTML(editUrl)+'" target="_blank" rel="noopener noreferrer" aria-label="Abrir página '+number+' en Canva">Abrir en Canva</a>':'<button type="button" class="button primary small" data-canva-no-link="'+number+'">Abrir en Canva</button>')+'</div></div></article>';
}
function render(){
 const badge=phase==='ready'?'Sincronizado con Canva':phase==='loading'?'Consultando Canva…':phase==='error'?'Sin sincronizar':'Pendiente de consulta';
 const msg=phase==='error'?'<div class="canva-real-warning" role="alert">'+escapeHTML(error)+'</div>':phase==='loading'?'<p class="muted">Consultando los modelos reales del equipo CVStudio…</p>':'';
 const cards=phase==='ready'?models.map(card).join(''):'';
 return '<section class="panel canva-real-hub">'+
   '<div class="canva-real-head"><div><h2>Plantillas oficiales de CVStudio</h2><p>'+escapeHTML(packName||'PACK CVStudio - 16 Plantillas CV - Maestra')+'</p></div>'+
   '<div class="canva-real-status"><span>'+escapeHTML(badge)+'</span><button type="button" class="button secondary small" data-canva-reload>Actualizar Canva</button></div></div>'+
   '<div class="canva-real-summary"><div><b>'+(phase==='ready'?models.length:'—')+'</b><span>Modelos disponibles</span></div><div><b>1</b><span>Archivo maestro en Canva</span></div><div><b>'+(hasPreviews&&phase==='ready'?'Sí':'—')+'</b><span>Vistas previas por página</span></div></div>'+
   '<div class="canva-real-guidance"><strong>Modelos oficiales de CVStudio.</strong> El botón amarillo abre directamente el diseño en Canva en una pestaña nueva. Para trabajar, creá una copia antes de editar el archivo maestro.</div>'+
   msg+
   (phase==='ready'&&!models.length?'<div class="canva-real-warning">La biblioteca no devolvió páginas.</div>':'')+
   '<div class="canva-real-grid">'+cards+'</div>'+
   (lastChecked?'<small class="canva-real-foot">Consulta: '+escapeHTML(lastChecked)+' · Los enlaces y miniaturas de Canva caducan y se renuevan al actualizar.</small>':'')+
   '</section>';
}
function repaint(){
 const view=document.querySelector('#appMain[data-module="plantillas"]');
 if(view&&typeof window.openModule==='function')window.openModule('plantillas');
}
async function refresh(){
 if(phase==='loading')return;
 phase='loading';error='';repaint();
 try{
   let bridge=window.CVStudioRealBridge;
   if(!bridge?.canvaTemplates){
     await new Promise(resolve=>setTimeout(resolve,100));
     bridge=window.CVStudioRealBridge;
   }
   if(!bridge?.canvaTemplates)throw new Error('El módulo de conexión Canva todavía no está disponible. Recargá el Centro de Operaciones.');
   const data=await bridge.canvaTemplates();
   if(!data?.ok||!Array.isArray(data.models))throw new Error(data?.message||'No se pudo obtener la biblioteca oficial.');
   models=data.models.filter(m=>Number.isInteger(Number(m.pageNumber))&&m.pageNumber>=1&&m.pageNumber<=100).sort((a,b)=>a.pageNumber-b.pageNumber);
   if(Number(data.pageCount)!==models.length)throw new Error('Canva devolvió un listado incompleto de páginas.');
   hasPreviews=Boolean(data.previewAvailable);
   packName=String(data.designTitle||'PACK CVStudio - 16 Plantillas CV - Maestra');
   lastChecked=new Intl.DateTimeFormat('es-AR',{dateStyle:'short',timeStyle:'short'}).format(new Date());
   phase='ready';lastLoadedAt=Date.now();
 }catch(e){models=[];phase='error';error=e?.message||'No se pudo consultar Canva.';}
 repaint();
}
function getModel(pageNumber){return models.find(m=>Number(m.pageNumber)===Number(pageNumber))}
function openPage(model){
 const url=validEdit(model?.editUrl);
 if(!url){window.toast?.('Canva no devolvió un enlace de edición válido. Actualizá la biblioteca.');return;}
 // Llamada directa desde un clic: nunca usar confirmaciones que el navegador
 // pueda interpretar como ventanas emergentes y bloquear después.
 const link=document.createElement('a');
 link.href=url; link.target='_blank'; link.rel='noopener noreferrer';
 document.body.appendChild(link); link.click(); link.remove();
}
function preview(model){
 if(!model)return;
 const thumb=validImage(model.thumbnailUrl);
 const content='<h2 id="modalTitle">'+escapeHTML(model.name)+'</h2>'+
   (thumb?'<div class="canva-real-modal-preview"><img src="'+escapeHTML(thumb)+'" alt="Vista previa del modelo seleccionado"></div>':'<p>Canva no entregó una vista previa de esta página. Podés abrirla en Canva.</p>')+
   '<p class="canva-real-modal-note">Página '+model.pageNumber+' del pack maestro. Creá una copia en Canva antes de editar y conservá solo el modelo elegido.</p>'+
   '<div class="modal-actions"><button type="button" class="button secondary" data-close-modal>Cerrar</button>'+(validEdit(model.editUrl)?'<a class="button primary" href="'+escapeHTML(validEdit(model.editUrl))+'" target="_blank" rel="noopener noreferrer">Abrir en Canva</a>':'<button type="button" class="button primary" id="canvaOpenFromPreview">Abrir en Canva</button>')+'</div>';
 window.openModal?.(content);
 document.getElementById('canvaOpenFromPreview')?.addEventListener('click',()=>openPage(model));
}
function bind(){
 const main=document.querySelector('#appMain[data-module="plantillas"]');if(!main)return;
 main.querySelector('[data-canva-reload]')?.addEventListener('click',refresh);
 main.querySelectorAll('[data-canva-preview]').forEach(btn=>btn.addEventListener('click',()=>preview(getModel(btn.dataset.canvaPreview))));
 main.querySelectorAll('[data-canva-no-link]').forEach(btn=>btn.addEventListener('click',()=>window.toast?.('Este modelo no tiene enlace de edición. Presioná Actualizar Canva.')));
 if(phase==='idle'||(phase==='ready'&&Date.now()-lastLoadedAt>10*60*1000))setTimeout(refresh,0);
}
window.CVStudioCanvaLibrary={render,bind,refresh};
})();