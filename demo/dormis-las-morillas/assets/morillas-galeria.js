(()=>{'use strict';
const items=[
['Paisaje','drone-08.webp','Vista aérea del predio y pileta'],
['Paisaje','drone-11.webp','Instalaciones desde el aire'],
['Paisaje','drone-01.webp','Paisaje de montaña'],
['Paisaje','drone-07.webp','Panorámica del valle'],
['Paisaje','predio-02.webp','Predio del alojamiento'],
['Dormis','dormis-01.webp','Interior de dormi'],
['Dormis','dormis-03.webp','Habitación con vista al exterior'],
['Dormis','dormis-06.webp','Interior de alojamiento'],
['Dormis','dormis-05.webp','Detalle de dormi'],
['Dormis','dormis-02.webp','Baño del dormi'],
['Cabaña','cabana-02.webp','Ambiente principal de cabaña'],
['Cabaña','cabana-04.webp','Dormitorio de cabaña'],
['Cabaña','cabana-07.webp','Comedor de cabaña'],
['Cabaña','cabana-09.webp','Cocina de cabaña'],
['Pileta y río','pileta-rio-03.webp','Pileta y entorno'],
['Pileta y río','pileta-rio-01.webp','Espacios junto al agua'],
['Pileta y río','pileta-rio-02.webp','Río de montaña'],
['Pileta y río','pileta-rio-04.webp','Entorno natural'],
['Quincho','quincho-01.webp','Quincho del predio'],
['Quincho','quincho-02.webp','Espacio de quincho'],
['Predio','predio-01.webp','Espacios exteriores'],
['Predio','predio-03.webp','Sector del predio'],
['Predio','predio-06.webp','Instalaciones'],
['Predio','predio-08.webp','Vista del predio']
];
const tabs=document.getElementById('lmPhotoTabs'),grid=document.getElementById('lmGallery');if(!tabs||!grid)return;
const base='assets/fotos/';let current='Todas';
function render(){
 grid.replaceChildren();
 for(const [cat,file,label] of items.filter(x=>current==='Todas'||x[0]===current)){
 const btn=document.createElement('button');btn.type='button';btn.className='lm-photo-item';btn.setAttribute('aria-label','Ver '+label);
 const img=document.createElement('img');img.loading='lazy';img.decoding='async';img.src=base+file;img.alt=label;
 const caption=document.createElement('span');caption.textContent=label;btn.append(img,caption);btn.addEventListener('click',()=>open(base+file,label));grid.append(btn);
 }
}
const cats=['Todas',...new Set(items.map(x=>x[0]))];for(const cat of cats){
 const b=document.createElement('button');b.type='button';b.textContent=cat;b.setAttribute('aria-pressed',String(cat===current));b.addEventListener('click',()=>{current=cat;[...tabs.children].forEach(e=>e.setAttribute('aria-pressed',String(e===b)));render()});tabs.append(b);
}
const layer=document.createElement('div');layer.className='lm-photo-modal';layer.hidden=true;layer.innerHTML='<div class="lm-photo-modal-top"><button type="button" aria-label="Cerrar imagen">Cerrar ×</button></div><figure><img alt=""></figure><figcaption></figcaption>';document.body.append(layer);
function close(){layer.hidden=true;document.body.style.overflow=''}
function open(src,label){layer.querySelector('img').src=src;layer.querySelector('img').alt=label;layer.querySelector('figcaption').textContent=label;layer.hidden=false;document.body.style.overflow='hidden';layer.querySelector('button').focus()}
layer.querySelector('button').addEventListener('click',close);layer.addEventListener('click',e=>{if(e.target===layer)close()});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!layer.hidden)close()});
render();
})();