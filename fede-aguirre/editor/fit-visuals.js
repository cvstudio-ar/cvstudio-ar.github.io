(function fitVisuals(){
  'use strict';
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const models={masculino:'Masculino',femenino:'Femenino',neutro:'Neutro'};
  const photoMap={'bench-press':'bench_bar','dumbbell-chest-press':'bench_db','incline-dumbbell-press':'incline_db','dips':'dips','squat':'quads','lateral-raises':'shoulders','lat-pulldown':'back','crunches':'core'};
  const sampleMap={'cable-crossover':'barpath_cable_crossover','cable-fly-high-to-low':'barpath_cable_fly_high_to_low','archer-push-up':'barpath_archer_push_up','bench-press':'barpath_barbell_bench_press','shrugs':'barpath_barbell_shrug','arnold-press':'barpath_arnold_press','hang-clean':'barpath_hang_clean','kettlebell-snatch':'barpath_kettlebell_snatch','bicycle-crunch':'barpath_bicycle_crunch','ab-wheel-rollout':'barpath_ab_wheel_rollout','ninety-ninety-hip-stretch':'barpath_90_90_hip_stretch','band-bicep-curl':'barpath_banded_curl','band-tricep-pushdown':'barpath_banded_triceps_pushdown','band-pallof-press':'barpath_banded_anti_rotation_press'};
  const published=window.FIT_CATALOG_IMAGES||{};
  const publishedCount=Object.values(published).reduce((n,e)=>n+['masculino','femenino'].filter(sex=>e[sex]?.file).length,0);
  const publishedPairs=Object.values(published).filter(e=>e.masculino?.file&&e.femenino?.file).length;
  const provisionalCount=Object.values(published).reduce((n,e)=>n+['masculino','femenino'].filter(sex=>e[sex]?.provisional).length,0);
  const cache=new Map();let db;
  const validImage=s=>typeof s==='string'&&/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=\s]+$/.test(s);
  const model=()=>Object.hasOwn(models,routine.modelSex)?routine.modelSex:'masculino';
  function key(it){return remoteId(it)||'custom:'+String(it?.name||'').trim().toLowerCase();}
  function media(it,sex=model()){
    const id=remoteId(it),saved=cache.get(key(it)+'|'+sex);
    if(validImage(it.customImage))return {kind:'custom',note:'Foto personalizada de esta ficha',frames:[{url:it.customImage,label:'PERSONALIZADA'}]};
    if(validImage(saved?.data))return {kind:'photo',note:'Foto propia · '+models[sex],frames:[{url:saved.data,label:models[sex].toUpperCase()}]};
    const official=id&&published[id]?.[sex];
    if(official?.file)return {kind:'published',note:(official.provisional?'Referencia FIT provisional':'Fotografía FIT')+' · '+models[sex],frames:[{url:'./exercise-assets/'+encodeURIComponent(official.file),label:official.label||'REFERENCIA'}]};
    if(sex==='masculino'){
      const n=String(it.name||'').toUpperCase().trim(),p=n==='CRUCE DE POLEAS + FLEXIONES'?'cable_fly':n==='CARDIO'?'cardio':photoMap[id];
      if(p&&validImage(PHOTO_FALLBACKS[p]))return {kind:'photo',note:'Fotografía masculina de referencia',frames:[{url:PHOTO_FALLBACKS[p],label:'REFERENCIA'}]};
    }
    if(sex!=='neutro'&&sampleMap[id]){
      const path='images/'+sampleMap[id]+'_'+(sex==='masculino'?'male':'female')+'.webp';
      return {kind:'sample',note:'Muestra anatómica · '+models[sex]+' · evaluación',frames:[{url:'https://cdn.jsdelivr.net/gh/jaysan0330/musclemap-sample@main/'+path,alt:'https://raw.githubusercontent.com/jaysan0330/musclemap-sample/main/'+path,label:models[sex].toUpperCase()}]};
    }
    const base=id?CATALOG_IMAGES[id]:null,labels={start:'INICIO',mid:'MOVIMIENTO',end:'FINAL',hold:'POSTURA'};
    return {kind:'neutral',note:sex==='neutro'?'Ilustración neutra':models[sex]+' pendiente · referencia neutra',frames:(base||[]).map(f=>({url:'https://cdn.jsdelivr.net/gh/MarvinNazari/exercise-images@main/'+f.path,alt:IMG_BASE+f.path,label:labels[f.label]||f.label}))};
  }
  const oldRetry=retryExerciseImage;
  retryExerciseImage=function(img){if(!img.dataset.altSrc){img.onerror=null;img.style.display='none';if(img.nextElementSibling)img.nextElementSibling.hidden=false;}else oldRetry(img);};
  scene=function(it){const m=media(it);if(!m.frames.length)return '<div class="missing-exercise-image"><b>ILUSTRACIÓN PENDIENTE</b><span>Cargá una imagen exacta de este ejercicio.</span></div>';const frames=m.frames.map(f=>`<div class="pose-frame"><img src="${esc(f.url)}" data-alt-src="${esc(f.alt||'')}" alt="${esc(it.name+' · '+f.label)}" loading="eager" onerror="retryExerciseImage(this)"><span class="image-error" hidden><b>IMAGEN NO DISPONIBLE</b><small>Revisá la conexión o cargá una imagen propia.</small></span><small>${esc(f.label)}</small></div>`).join('');return `<div class="pose-pair ${m.kind==='published'?'fit-published':m.kind==='photo'?'fit-real':m.kind==='sample'?'fit-sample':m.kind==='custom'?'custom':''} ${m.frames.length===1?'pose-single':''}">${frames}<span class="fit-visual-note">${esc(m.note)}</span></div>`;};
  pdfFramesForExercise=async function(it){const m=media(it);return Promise.all(m.frames.map(async f=>({label:(m.kind==='neutral'&&model()!=='neutro'?'NEUTRA · ':'')+f.label,image:await pdfLoadImage(f.url)||(f.alt?await pdfLoadImage(f.alt,5000):null)})));};
  routine.modelSex=model();
  const origUpdate=updatePoster,origRefresh=refreshEditors;
  function status(){if($('fitModel'))$('fitModel').value=model();if($('fitVisualStatus'))$('fitVisualStatus').textContent=media(routine.items[active]||{}).note;}
  updatePoster=function(){origUpdate();const b=$('pBrand'),s=$('pSubbrand');if(b&&s){if(/^FEDE AGUIRRE$/i.test(routine.brand||'')){b.innerHTML='<img class="fit-brand-poster" src="./brand.svg" alt="Fede Aguirre FIT">';s.hidden=true;}else s.hidden=false;}status();};
  refreshEditors=function(){origRefresh();status();};
  function refresh(){updatePoster();refreshEditors();}
  function convert(file){return new Promise((resolve,reject)=>{if(!file||!/^image\/(jpeg|png|webp)$/.test(file.type)||file.size>14*1024*1024){reject(Error('Elegí un JPG, PNG o WebP de hasta 14 MB.'));return;}const u=URL.createObjectURL(file),im=new Image();im.onload=()=>{try{const c=document.createElement('canvas'),scale=Math.min(1,1000/Math.max(im.width,im.height));c.width=Math.max(1,Math.round(im.width*scale));c.height=Math.max(1,Math.round(im.height*scale));c.getContext('2d').drawImage(im,0,0,c.width,c.height);resolve(c.toDataURL('image/jpeg',.85));}catch(e){reject(e);}finally{URL.revokeObjectURL(u);}};im.onerror=()=>{URL.revokeObjectURL(u);reject(Error('No se pudo leer la imagen.'));};im.src=u;});}
  function put(rec){return new Promise((resolve,reject)=>{if(!db){reject(Error('El almacenamiento de imágenes no está disponible.'));return;}const tx=db.transaction('images','readwrite');tx.objectStore('images').put(rec);tx.oncomplete=()=>{cache.set(rec.key,rec);resolve();};tx.onerror=()=>reject(Error('No se pudo guardar la imagen.'));});}
  function remove(k){return new Promise((resolve,reject)=>{if(!db){reject(Error('No hay almacenamiento disponible.'));return;}const tx=db.transaction('images','readwrite');tx.objectStore('images').delete(k);tx.oncomplete=()=>{cache.delete(k);resolve();};tx.onerror=()=>reject(Error('No se pudo retirar la imagen.'));});}
  if('indexedDB'in window){const req=indexedDB.open('fede-fit-media-v1',1);req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('images'))req.result.createObjectStore('images',{keyPath:'key'});};req.onsuccess=()=>{db=req.result;const read=db.transaction('images').objectStore('images').getAll();read.onsuccess=()=>{for(const rec of read.result||[])cache.set(rec.key,rec);refresh();window.dispatchEvent(new Event('fit-media-ready'));};};}
  const anchor=$('visualMode')?.closest('label');
  if(anchor){const el=document.createElement('div');el.innerHTML='<label class="field"><span>Modelo de ilustración</span><select id="fitModel"><option value="masculino">Masculino</option><option value="femenino">Femenino</option><option value="neutro">Neutro</option></select></label><p id="fitVisualStatus" class="fit-visual-status"></p><label class="field"><span>Guardar imagen del ejercicio para este modelo</span><input id="fitModelFile" type="file" accept="image/jpeg,image/png,image/webp"></label><button type="button" class="btn full" id="fitModelRemove">Quitar imagen guardada del modelo</button><p class="minihint">Si falta una versión, se indica y se muestra la referencia neutra. La imagen propia se reutiliza en otras rutinas.</p>';anchor.before(el);anchor.hidden=true;
    const header=document.querySelector('.edit-top');
    if(header){const strip=document.createElement('div');strip.className='fit-model-strip';strip.append(el.querySelector('label'),$('fitVisualStatus'));const progress=document.createElement('small');progress.className='fit-model-progress';progress.textContent=publishedCount+' / '+(EXERCISES.length*2)+' fotografías FIT incorporadas';strip.append(progress);header.after(strip);}
    $('fitModel').value=model();$('fitModel').addEventListener('change',e=>{routine.modelSex=e.target.value;save();refresh();});
    $('fitModelFile').addEventListener('change',async e=>{const file=e.target.files[0],it={...routine.items[active]},sex=model(),k=key(it)+'|'+sex;e.target.value='';if(!file)return;try{await put({key:k,data:await convert(file),name:it.name,sex});refresh();toast('Imagen guardada en la biblioteca del modelo.');}catch(err){toast(err.message);}});
    $('fitModelRemove').addEventListener('click',async()=>{const k=key(routine.items[active])+'|'+model();if(!cache.has(k))return toast('No hay una imagen propia guardada para este modelo.');if(confirm('¿Quitar esta imagen de la biblioteca?'))try{await remove(k);refresh();toast('Imagen retirada.');}catch(e){toast(e.message);}});
  }
  const top=document.querySelector('.edit-top');if(top)top.innerHTML='<img src="./brand.svg" alt="Fede Aguirre FIT" style="width:76px;height:62px;object-fit:contain"><div><strong>EDITOR DE RUTINAS</strong><small>415 ejercicios · fichas A4</small></div>';
  const footer=document.querySelector('.poster-footer span');if(footer)footer.textContent='FEDE AGUIRRE FIT · ILUSTRACIONES DE REFERENCIA';
  window.FitVisual={models,cache,validImage,convert,put,remove,refresh,photoCount:Object.keys(photoMap).length,sampleCount:Object.keys(sampleMap).length,published,publishedCount,publishedPairs,provisionalCount,targetCount:EXERCISES.length*2};
  save();refresh();
})();
