'use strict';
const icons = {
 heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
 pin:'<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
 rooms:'<path d="M3 3h18v18H3zM12 3v8H3m9 0h9M12 11v10M3 15h5"/>',
 area:'<path d="M9 3H3v6m12-6h6v6M3 15v6h6m6 0h6v-6"/>',
 star:'<path d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z"/>',
 wa:'<path d="M21 11.5a9 9 0 0 1-13.6 7.7L3 21l1.8-4.3A9 9 0 1 1 21 11.5Z"/><path d="M8 7c.4-.4.7-.2 1 .4l1 2-1 1c.5 1.5 1.8 2.7 3.4 3.2l1-1 2 .9c.6.3.8.6.4 1-1 1.3-2 1.4-3.9.7C10.3 15.1 8 12.8 7.5 10.2 7.2 8.8 7.4 7.8 8 7Z"/>'
};
const svg = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
const esc = value => String(value ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let properties=[],favorites=new Set(),activeFilter='all',searchType='all',searchOperation='all',searchLocation='all';
try {const saved=JSON.parse(localStorage.getItem('cvstudio-inmobiliaria-demo-favorites')||'[]');if(Array.isArray(saved))favorites=new Set(saved);}catch{}
const grid=document.getElementById('property-grid');
const dialog=document.getElementById('property-dialog');
const lightbox=document.getElementById('gallery-dialog');
let gallery=[],galleryIndex=0;
function contact(name){return `https://wa.me/${window.CVSTUDIO_WHATSAPP??'5492964652318'}?text=${encodeURIComponent('Hola, quiero consultar por '+name+' que vi en la demo inmobiliaria de CVStudio.')}`;}
function render(){
 let items=properties.filter(p=>(activeFilter==='all'||p.type===activeFilter||p.operation===activeFilter)&&(searchType==='all'||p.type===searchType)&&(searchOperation==='all'||p.operation===searchOperation)&&(searchLocation==='all'||p.zone===searchLocation));
 const sort=document.getElementById('sort').value;
 if(sort==='name')items.sort((a,b)=>a.name.localeCompare(b.name,'es'));
 if(sort==='favorites')items.sort((a,b)=>Number(favorites.has(b.id))-Number(favorites.has(a.id)));
 grid.innerHTML=items.map(p=>`<article class="card"><div class="card-photo"><div class="card-slider" tabindex="0" data-slider="${esc(p.id)}" aria-label="Galería de ${esc(p.name)}. Usá las flechas o deslizá para recorrer las fotos."><img src="${esc(p.image)}" alt="${esc(p.name)} · Imagen 1 de 5" width="480" height="300" loading="lazy"><button class="slide-prev" data-slide="-1" aria-label="Foto anterior de ${esc(p.name)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14.5 5-7 7 7 7"/></svg></button><button class="slide-next" data-slide="1" aria-label="Foto siguiente de ${esc(p.name)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9.5 5 7 7-7 7"/></svg></button><span class="slide-count" aria-live="polite">1 / 5</span><div class="slide-dots">${[p.image,...p.gallery].map((_,i)=>`<button data-slide-to="${i}" aria-label="Ver foto ${i+1} de ${esc(p.name)}" aria-current="${i===0}"></button>`).join('')}</div></div><span class="property-tag">${p.operation==='pozo'?'En pozo':p.operation==='venta'?'Venta':'Alquiler'}</span><button class="favorite" data-favorite="${esc(p.id)}" aria-label="${favorites.has(p.id)?'Quitar de':'Agregar a'} favoritas: ${esc(p.name)}" aria-pressed="${favorites.has(p.id)}">${svg('heart')}</button></div><div class="card-body"><h3><button class="title-open" data-view="${esc(p.id)}">${esc(p.name)}</button></h3><p class="location">${svg('pin')}${esc(p.address||p.zone)}</p><div class="features"><span>${svg('rooms')}${esc(p.rooms||'Consultar')}</span><span>${svg('area')}${esc(p.area||'Consultar')}</span><span>${svg('star')}${esc(p.feature||'Ver detalles')}</span></div><div class="card-bottom"><span class="price">${esc(p.price||'Consultar precio')}</span><button class="view" data-view="${esc(p.id)}">Ver proyecto <span aria-hidden="true">⟶</span></button><a class="card-wa" href="${contact(p.name)}" target="_blank" rel="noopener" aria-label="Consultar por WhatsApp: ${esc(p.name)}">${svg('wa')}</a></div></div></article>`).join('');
 document.getElementById('empty').hidden=items.length>0;if(window.CVSTUDIO_WHATSAPP==='')grid.querySelectorAll('.card-wa').forEach(a=>a.hidden=true);
 document.querySelector('.section-heading .sample-label').textContent=`${items.length} de ${properties.length} ${items.length===1?'proyecto disponible':'proyectos disponibles'}`;
}
function applyFilters(){
 activeFilter='all';searchType=document.getElementById('type').value;searchOperation=document.getElementById('operation').value;searchLocation=document.getElementById('location').value;
 document.querySelectorAll('[data-filter]').forEach(b=>{const value=b.dataset.filter;const on=value==='all'?searchType==='all'&&searchOperation==='all':value==='pozo'?searchOperation==='pozo':searchType===value;b.classList.toggle('selected',on);b.setAttribute('aria-pressed',String(on));});
 document.getElementById('catalog-status').hidden=true;render();
}
function filter(value){
 document.getElementById('type').value=value==='all'||value==='pozo'?'all':value;
 document.getElementById('operation').value=value==='pozo'?'pozo':'all';
 document.getElementById('location').value='all';applyFilters();
}
document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>filter(b.dataset.filter)));
document.querySelectorAll('[data-nav-filter]').forEach(a=>a.addEventListener('click',()=>filter(a.dataset.navFilter)));
for(const id of ['type','operation','location'])document.getElementById(id).addEventListener('change',applyFilters);
document.getElementById('search-form').addEventListener('submit',e=>{e.preventDefault();applyFilters();document.getElementById('propiedades').scrollIntoView({behavior:'smooth'});});
document.getElementById('sort').addEventListener('change',render);
document.getElementById('reset').addEventListener('click',()=>{document.getElementById('search-form').reset();filter('all');});
function openProject(id){
 const p=properties.find(p=>p.id===id);if(!p)return;
 document.getElementById('dialog-title').textContent=p.name;
 document.getElementById('dialog-image').src=p.image;
 document.getElementById('dialog-image').alt=p.name;
 document.getElementById('dialog-contact').href=contact(p.name);document.getElementById('dialog-contact').hidden=window.CVSTUDIO_WHATSAPP==='';
 dialog.querySelector('.sample-label').textContent=p.operation==='pozo'?'Desarrollo en pozo':p.operation==='venta'?'Propiedad en venta':'Propiedad en alquiler';
 document.getElementById('dialog-location').textContent=p.address||p.zone;
 document.getElementById('dialog-facts').innerHTML=[p.rooms,p.area,p.feature,p.price].filter(Boolean).map(t=>`<span>${esc(t)}</span>`).join('');
 document.getElementById('dialog-description').innerHTML=p.description.split(/\n\s*\n/).map(block=>`<p>${esc(block).replaceAll('\n','<br>')}</p>`).join('');
 gallery=[p.image,...(p.gallery||[]).filter(u=>u!==p.image)];
 document.getElementById('dialog-gallery').innerHTML=gallery.map((url,i)=>`<button class="gallery-thumb" data-gallery="${i}" aria-label="Ampliar imagen ${i+1} de ${esc(p.name)}"><img src="${esc(url)}" alt="${esc(p.name)} · Imagen ${i+1}" loading="lazy"></button>`).join('');
 dialog.showModal();dialog.scrollTop=0;
}
grid.addEventListener('click',e=>{const slide=e.target.closest('[data-slide],[data-slide-to]');if(slide){const el=slide.closest('[data-slider]');changeSlide(el,slide.hasAttribute('data-slide-to')?Number(slide.dataset.slideTo):Number(el.dataset.index||0)+Number(slide.dataset.slide));return;}const f=e.target.closest('[data-favorite]');if(f){const id=f.dataset.favorite;favorites.has(id)?favorites.delete(id):favorites.add(id);try{localStorage.setItem('cvstudio-inmobiliaria-demo-favorites',JSON.stringify([...favorites]));}catch{}f.setAttribute('aria-pressed',String(favorites.has(id)));f.setAttribute('aria-label',`${favorites.has(id)?'Quitar de':'Agregar a'} favoritas: ${properties.find(p=>p.id===id).name}`);if(document.getElementById('sort').value==='favorites')render();return;}const view=e.target.closest('[data-view]');if(view)openProject(view.dataset.view);});
function showGallery(index){galleryIndex=(index+gallery.length)%gallery.length;document.getElementById('gallery-image').src=gallery[galleryIndex];document.getElementById('gallery-image').alt=`${document.getElementById('dialog-title').textContent} · Imagen ${galleryIndex+1}`;document.getElementById('gallery-counter').textContent=`${galleryIndex+1} / ${gallery.length}`;}
document.getElementById('dialog-gallery').addEventListener('click',e=>{const b=e.target.closest('[data-gallery]');if(b){showGallery(Number(b.dataset.gallery));lightbox.showModal();}});
document.getElementById('gallery-prev').onclick=()=>showGallery(galleryIndex-1);
document.getElementById('gallery-next').onclick=()=>showGallery(galleryIndex+1);
lightbox.addEventListener('keydown',e=>{if(e.key==='ArrowLeft')showGallery(galleryIndex-1);if(e.key==='ArrowRight')showGallery(galleryIndex+1);});
for(const d of [dialog,lightbox]){d.querySelector('.close').onclick=()=>d.close();d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}});}
document.getElementById('more-properties').onclick=()=>{filter('all');document.getElementById('catalog-status').hidden=false;};
function changeSlide(el,index){
 const p=properties.find(p=>p.id===el.dataset.slider);if(!p)return;
 const photos=[p.image,...p.gallery];index=(index+photos.length)%photos.length;el.dataset.index=index;
 const img=el.querySelector('img');img.src=photos[index];img.alt=p.name+' · Imagen '+(index+1)+' de '+photos.length;
 el.querySelector('.slide-count').textContent=(index+1)+' / '+photos.length;
 el.querySelectorAll('[data-slide-to]').forEach((b,i)=>b.setAttribute('aria-current',String(i===index)));
}
grid.addEventListener('keydown',e=>{const el=e.target.closest('[data-slider]');if(el && ['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();changeSlide(el,Number(el.dataset.index||0)+(e.key==='ArrowRight'?1:-1));}});
let swipeStart=null;
grid.addEventListener('touchstart',e=>{const el=e.target.closest('[data-slider]');swipeStart=el?{el,x:e.touches[0].clientX,y:e.touches[0].clientY}:null;},{passive:true});
grid.addEventListener('touchend',e=>{if(!swipeStart)return;const dx=e.changedTouches[0].clientX-swipeStart.x,dy=e.changedTouches[0].clientY-swipeStart.y;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy))changeSlide(swipeStart.el,Number(swipeStart.el.dataset.index||0)+(dx<0?1:-1));swipeStart=null;},{passive:true});
let loading=false;
async function load(){
 if(loading)return;loading=true;
 try{
  const response=await fetch(window.ENPOZO_API,{cache:'no-store',signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error('No se pudo cargar el catálogo.');const data=await response.json();
  if(!Array.isArray(data.projects))throw Error('Catálogo inválido.');properties=data.projects;window.applySiteSettings?.(data.settings);
  const location=document.getElementById('location'),selected=location.value;
  const zones=[...new Set(properties.map(p=>p.zone).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));
  location.innerHTML='<option value="all">Seleccionar zona</option>'+zones.map(zone=>`<option value="${esc(zone)}">${esc(zone)}</option>`).join('');
  location.value=zones.includes(selected)?selected:'all';
  document.getElementById('empty').innerHTML='No encontramos propiedades con esos filtros. <button id="reset">Ver todas</button>';
  document.getElementById('reset').onclick=()=>{document.getElementById('search-form').reset();filter('all');};applyFilters();
 }catch(error){if(!properties.length){document.getElementById('empty').hidden=false;document.getElementById('empty').textContent='No se pudo cargar el catálogo. Recargá la página para volver a intentar.';}}
 finally{loading=false;}
}
window.addEventListener('pageshow',load);window.addEventListener('focus',load);
load();
