(() => {
  'use strict';
  const {read,save,normalize,clone,defaults,photo}=window.ALMA;
  const $=id=>document.getElementById(id);
  const titles={general:'Identidad & textos',hero:'Portada & fotos',products:'Catálogo',contact:'Contacto & redes',style:'Colores & estilo',backup:'Respaldo & opciones'};
  let model=read(),activeTab='general',statusTimeout;
  function toast(message,error=false){
    const el=$('status');
    el.textContent=message;el.className='toast show'+(error?' error':'');
    clearTimeout(statusTimeout);statusTimeout=setTimeout(()=>el.classList.remove('show'),5000);
  }
  function setTab(id){
    if(!titles[id])return;
    activeTab=id;$('section-title').textContent=titles[id];
    document.querySelectorAll('.tab-view').forEach(p=>p.hidden=p.id!=='view-'+id);
    document.querySelectorAll('#tabs [data-tab]').forEach(btn=>{
      const active=btn.dataset.tab===id;
      btn.classList.toggle('active',active);btn.setAttribute('aria-pressed',String(active));
    });
    window.scrollTo({top:0,behavior:'smooth'});
  }
  function updateTheme(){
    const s=$('theme-sample');
    s.style.background=model.forest;s.style.color=model.cream;s.style.borderColor=model.accent;
  }
  function updatePhotos(){
    const logo=$('logo-preview');logo.replaceChildren();
    const logoImg=document.createElement('img');logoImg.alt='Vista previa del logo';
    logoImg.src=model.logoImage||'../assets/logo.svg';logo.append(logoImg);
    const hero=$('hero-preview');hero.replaceChildren();
    const hi=document.createElement('img');hi.alt='Vista previa de portada';hi.src=model.heroImage||'../assets/portada-natural.svg';hero.append(hi);
    const about=$('about-preview');about.replaceChildren();
    if(model.aboutImage){
      const img=document.createElement('img');img.alt='Vista previa del local o productos';img.src=model.aboutImage;about.append(img);
    }else{
      const span=document.createElement('span');span.textContent='✷';about.append(span);
    }
  }
  function populate(){
    document.querySelectorAll('[data-field]').forEach(input=>input.value=typeof model[input.dataset.field]==='string'?model[input.dataset.field]:'');
    updatePhotos();updateTheme();renderProducts();setTab(activeTab);
  }
  function fieldSync(){
    document.querySelectorAll('[data-field]').forEach(input=>{
      model[input.dataset.field]=input.value.trim();
    });
  }
  function control(labelText,value,onInput,opts={}){
    const label=document.createElement('label');label.textContent=labelText;
    const element=document.createElement(opts.multi?'textarea':opts.select?'select':'input');
    if(opts.multi)element.rows=opts.rows||3;
    else if(!opts.select)element.type=opts.type||'text';
    if(opts.select){
      for(const v of opts.select)element.append(new Option(v,v));
    }
    if(opts.max)element.maxLength=opts.max;
    element.value=value??'';
    element.addEventListener(opts.select?'change':'input',()=>onInput(element.value));
    label.append(element);return label;
  }
  function renderProducts(){
    const root=$('product-editor');root.replaceChildren();
    $('product-counter').textContent=model.products.length+' productos en la demo · Máximo 24';
    $('add-product').disabled=model.products.length>=24;
    if(!model.products.length){const p=document.createElement('p');p.textContent='Todavía no hay productos. Agregá uno para comenzar.';root.append(p);}
    const symbols=['☘','❀','♡','✳'];
    model.products.forEach((prod,i)=>{
      const card=document.createElement('article');card.className='editor-product';
      const top=document.createElement('div');top.className='editor-prod-head';
      const title=document.createElement('strong');title.textContent='Producto '+(i+1);
      const del=document.createElement('button');del.type='button';del.className='delete-product';del.textContent='Eliminar';
      del.addEventListener('click',()=>{
        if(!confirm('¿Eliminar "'+prod.name+'"? Se aplicará cuando guardes.'))return;
        model.products.splice(i,1);renderProducts();
      });
      top.append(title,del);card.append(top);
      const imgBox=document.createElement('div');imgBox.className='editor-photo';
      if(prod.image){const img=document.createElement('img');img.src=prod.image;img.alt='Vista previa de '+prod.name;imgBox.append(img);}
      else{const fallback=document.createElement('span');fallback.textContent=symbols[i%symbols.length];imgBox.append(fallback);}
      card.append(imgBox);
      const upload=document.createElement('div');upload.className='editor-file-row';
      const file=document.createElement('input');file.type='file';file.accept='image/png,image/jpeg,image/webp';
      file.setAttribute('aria-label','Subir foto de '+prod.name);
      file.addEventListener('change',async()=>{
        if(!file.files?.[0])return;
        file.disabled=true;
        try{prod.image=await photo(file.files[0],450);renderProducts();toast('Foto cargada. Guardá los cambios para verla en la web.');}
        catch(error){toast(error.message,true);}
        finally{file.disabled=false;file.value='';}
      });
      upload.append(file);
      if(prod.image){const remove=document.createElement('button');remove.type='button';remove.textContent='Quitar fotografía';remove.addEventListener('click',()=>{prod.image='';renderProducts();});upload.append(remove);}
      card.append(upload);
      card.append(control('Nombre del producto',prod.name,v=>prod.name=v,{max:95}));
      card.append(control('Categoría',prod.category,v=>prod.category=v,{max:60,select:['Yerbas e infusiones','Snacks saludables','Cuidado personal','Regalos y bienestar']}));
      card.append(control('Descripción',prod.description,v=>prod.description=v,{max:220,multi:true,rows:3}));
      const row=document.createElement('div');row.className='editor-row';
      row.append(control('Etiqueta',prod.badge,v=>prod.badge=v,{max:55}),control('Precio / Texto',prod.price,v=>prod.price=v,{max:50}));
      card.append(row);
      const visible=document.createElement('label');visible.className='editor-visible';
      const checked=document.createElement('input');checked.type='checkbox';checked.checked=prod.visible!==false;
      checked.addEventListener('change',()=>prod.visible=checked.checked);
      visible.append(checked,document.createTextNode(' Mostrar en el catálogo'));
      card.append(visible);
      root.append(card);
    });
  }
  $('tabs').addEventListener('click',e=>{const btn=e.target.closest('[data-tab]');if(btn)setTab(btn.dataset.tab);});
  document.querySelectorAll('[data-field]').forEach(input=>input.addEventListener('input',()=>{
    model[input.dataset.field]=input.value.trim();
    if(['accent','forest','cream'].includes(input.dataset.field))updateTheme();
  }));
  $('save').addEventListener('click',()=>{
    fieldSync();
    if(!model.name||!model.heroTitle)return toast('Completá el nombre del negocio y el título de portada.',true);
    try{
      model=save(model);
      toast('✓ Cambios guardados en este navegador. Abrí Vista previa para verlos.');
    }catch(error){toast(error.message||'No se pudo guardar.',true);}
  });
  async function upload(fileInput,field,max){
    const file=fileInput.files?.[0];if(!file)return;
    fileInput.disabled=true;
    try{
      model[field]=await photo(file,max);
      updatePhotos();toast('✓ Imagen preparada. Presioná Guardar cambios.');
    }catch(error){toast(error.message||'No se pudo cargar la imagen.',true);}
    finally{fileInput.disabled=false;fileInput.value='';}
  }
  $('logo-input').addEventListener('change',()=>upload($('logo-input'),'logoImage',420));
  $('logo-reset').addEventListener('click',()=>{model.logoImage='';updatePhotos();toast('Logo de muestra restaurado. Guardá los cambios.');});
  $('hero-input').addEventListener('change',()=>upload($('hero-input'),'heroImage',1200));
  $('about-input').addEventListener('change',()=>upload($('about-input'),'aboutImage',900));
  $('hero-reset').addEventListener('click',()=>{model.heroImage='';updatePhotos();toast('Portada original seleccionada. Guardá los cambios.');});
  $('about-reset').addEventListener('click',()=>{model.aboutImage='';updatePhotos();toast('Imagen quitada. Guardá para aplicar.');});
  $('add-product').addEventListener('click',()=>{
    if(model.products.length>=24)return toast('Máximo 24 productos de muestra.',true);
    model.products.push({id:'alma-'+Date.now(),name:'Nuevo producto',category:'Snacks saludables',
      description:'Completá la descripción de este producto.',badge:'Novedad',price:'Consultar',tile:model.products.length%12,image:'',visible:true});
    renderProducts();toast('Nuevo producto agregado. Podés editarlo antes de guardar.');
  });
  const palettes={
    alma:{forest:'#285044',accent:'#E96D50',cream:'#FFF9F1'},
    sunset:{forest:'#754A38',accent:'#E99555',cream:'#FFF5E6'},
    sage:{forest:'#355B4E',accent:'#C67B65',cream:'#F6FAF0'}
  };
  document.querySelectorAll('[data-palette]').forEach(btn=>btn.addEventListener('click',()=>{
    const obj=palettes[btn.dataset.palette];if(!obj)return;
    Object.assign(model,obj);
    for(const key of ['forest','accent','cream'])document.querySelector('[data-field="'+key+'"]').value=model[key];
    updateTheme();toast('Paleta seleccionada. Guardá para aplicarla a la vista previa.');
  }));
  $('reset-demo').addEventListener('click',()=>{
    if(!confirm('¿Restaurar la demo original? Se borrarán los cambios de este navegador.'))return;
    try{localStorage.removeItem(window.ALMA.KEY);model=clone(defaults);populate();toast('Demo original restaurada.');}
    catch{toast('No se pudieron restaurar los datos.',true);}
  });
  $('export-json').addEventListener('click',()=>{
    fieldSync();const blob=new Blob([JSON.stringify(normalize(model),null,2)],{type:'application/json'});
    const objectUrl=URL.createObjectURL(blob);const link=document.createElement('a');
    link.href=objectUrl;link.download='alma-market-demo-configuracion.json';
    link.click();setTimeout(()=>URL.revokeObjectURL(objectUrl),3000);
  });
  $('import-json').addEventListener('change',async e=>{
    const file=e.target.files?.[0];if(!file)return;
    try{
      if(file.size>5_000_000)throw Error('El archivo pesa demasiado.');
      const parsed=JSON.parse(await file.text());
      if(!parsed||!Array.isArray(parsed.products))throw Error('No es una configuración de Alma Market.');
      model=normalize(parsed);populate();toast('Configuración importada. Presioná Guardar cambios.');
    }catch(error){toast(error.message||'No se pudo leer el archivo.',true);}
    finally{e.target.value='';}
  });
  populate();
})();
