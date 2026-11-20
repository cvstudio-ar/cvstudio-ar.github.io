(() => {
  'use strict';
  const {read,url}=window.ALMA;
  const $=id=>document.getElementById(id);
  let data=read(),activeCategory='Todos',search='';
  const atlas=new Image();
  let atlasReady=false;
  atlas.onload=()=>{atlasReady=true;renderProducts();renderStory();};
  atlas.onerror=()=>{atlasReady=false;renderProducts();renderStory();};
  atlas.src='assets/catalogo-alma.svg';
  const colors=['art-peach','art-mint','art-blue','art-sand','art-lilac','art-yellow'];
  const emoji={'Yerbas e infusiones':'☘','Snacks saludables':'✦','Cuidado personal':'❀','Regalos y bienestar':'♡'};
  function photoTile(tile){
    const t=Math.max(0,Math.min(11,Number(tile)||0));
    const el=document.createElement('div');el.className='tile-photo';
    el.style.cssText='width:100%;height:100%;background-image:url("assets/catalogo-alma.svg");background-size:400% 300%;background-position:'+(t%4*100/3)+'% '+(Math.floor(t/4)*50)+'%;background-repeat:no-repeat;';
    return el;
  }
  function art(item){
    const outer=document.createElement('div');
    outer.className='product-art '+(['accent-bag','accent-cylinder','','accent-cylinder'][item.tile%4]||'');
    const symbol=document.createElement('span');symbol.className='product-art-symbol';
    symbol.textContent=emoji[item.category]||'✳';
    const line=document.createElement('span');line.className='product-art-line';
    outer.append(symbol,line);return outer;
  }
  function safe(value){return typeof value==='string'?value:'';}
  function setLinks(){
    document.querySelectorAll('[data-link]').forEach(a=>{
      const target=a.dataset.link==='instagram'?data.instagram:data.whatsapp;
      const original=a.dataset.link==='instagram'?'https://www.instagram.com/almamarket.ar/':'https://wa.me/message/ODU247JWJPHWN1';
      a.href=url(target,original);
    });
    const label=document.querySelector('.social-head [data-link="instagram"]');
    if(label)try{label.textContent='@'+new URL(data.instagram).pathname.split('/').filter(Boolean)[0]+' ↗';}catch{label.textContent='Instagram ↗';}
  }
  function renderStory(){
    const el=$('about-image');if(!el)return;
    if(data.aboutImage){el.style.backgroundImage='url("'+data.aboutImage+'")';el.style.backgroundSize='cover';el.style.backgroundPosition='center';}
    else{
      el.style.backgroundImage='url("assets/local-alma.svg")';
      el.style.backgroundSize='cover';
      el.style.backgroundPosition='center';
    }
  }
  function setData(){
    data=read();
    for(const key of ['forest','coral','cream']){/* CSS variables managed below */}
    document.documentElement.style.setProperty('--forest',data.forest);
    document.documentElement.style.setProperty('--coral',data.accent);
    document.documentElement.style.setProperty('--cream',data.cream);
    document.querySelectorAll('[data-text]').forEach(el=>{
      const value=safe(data[el.dataset.text]);
      if(value)el.textContent=value;
    });
    const primary=document.querySelector('[data-text-button="heroButton"]');
    if(primary){primary.replaceChildren(document.createTextNode((data.heroButton||'Explorar productos')+' '));
      const arrow=document.createElement('span');arrow.textContent='↗';arrow.setAttribute('aria-hidden','true');primary.append(arrow);
    }
    const hero=$('hero-image');if(hero)hero.src=data.heroImage||'assets/portada-panoramica-alma.webp';
    document.querySelectorAll('[data-alma-logo]').forEach(img=>{
      img.onerror=()=>{img.onerror=null;img.src='assets/logo.svg';};
      img.src=data.logoImage||'assets/logo.svg';
    });
    setLinks();
    const phoneRow=$('phone-row');
    if(phoneRow){phoneRow.hidden=!data.phone;const phoneText=$('phone-text');if(phoneText)phoneText.textContent=data.phone||'';}
    const frame=$('maps-frame');
    const address=(data.address||'San Isidro, Buenos Aires')+', Argentina';
    if(frame)frame.src='https://www.google.com/maps?q='+encodeURIComponent(address)+'&output=embed';
    const link=$('maps-link');
    if(link)link.href='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(address);
    renderStory();renderWeeklyHours();renderFilters();renderProducts();
    document.title=data.name+' · Tienda natural en San Isidro';
  }

  function renderWeeklyHours(){
    const root=$('weekly-hours-list');if(!root)return;
    root.replaceChildren();
    const schedule=data.weeklyHours||{};
    const days=[["lunes","Lunes"],["martes","Martes"],["miercoles","Miércoles"],["jueves","Jueves"],["viernes","Viernes"],["sabado","Sábado"],["domingo","Domingo"]];
    for(const [key,label] of days){
      const value=typeof schedule[key]==='string'?schedule[key]:'';
      const row=document.createElement('div');row.className='weekly-hour-row';
      const day=document.createElement('span');day.textContent=label;
      const time=document.createElement('strong');time.textContent=value||'Consultar';
      if(value.trim().toLowerCase()==='cerrado')time.classList.add('closed');
      row.append(day,time);root.append(row);
    }
    const maps=$('footer-hours-maps');
    if(maps)maps.href='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent((data.address||'Alsina 132, San Isidro')+', Argentina');
  }
  function renderFilters(){
    const root=$('filters');root.replaceChildren();
    const categories=['Todos',...new Set(data.products.filter(p=>p.visible).map(p=>p.category).filter(Boolean))];
    if(!categories.includes(activeCategory))activeCategory='Todos';
    for(const cat of categories){
      const btn=document.createElement('button');btn.type='button';btn.className='filter'+(cat===activeCategory?' active':'');
      btn.textContent=cat;btn.setAttribute('aria-pressed',String(cat===activeCategory));
      btn.addEventListener('click',()=>{activeCategory=cat;renderFilters();renderProducts();});
      root.append(btn);
    }
  }

  // Las imágenes anexadas a la primera ficha se presentan como galería de variedades.
  const kbarGallery=[
    'assets/productos/p01.webp',
    'assets/productos/p01-galeria-1.webp',
    'assets/productos/p01-galeria-2.webp',
    'assets/productos/p01-galeria-3.webp'
  ];
  function productPhotos(item){
    if(item.image)return [item.image];
    if(item.id==='p01')return kbarGallery;
    return /^p(?:0[1-9]|1[0-2])$/.test(item.id)?['assets/productos/'+item.id+'.webp']:[];
  }
  function galleryButton(symbol,label,className){
    const b=document.createElement('button');b.type='button';b.className=className;b.textContent=symbol;
    b.setAttribute('aria-label',label);return b;
  }
  let lightbox=null,lightboxState=null;
  function closeLightbox(){
    if(!lightbox)return;
    lightbox.remove();lightbox=null;document.body.classList.remove('lightbox-open');
    lightboxState?.lastFocus?.focus?.();lightboxState=null;
  }
  function openLightbox(item,photos,start=0){
    closeLightbox();
    const lastFocus=document.activeElement;
    let index=start;
    const overlay=document.createElement('div');overlay.className='alma-lightbox';
    overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');
    overlay.setAttribute('aria-label','Galería ampliada: '+item.name);
    const panel=document.createElement('div');panel.className='alma-lightbox-panel';
    const image=document.createElement('img');image.className='alma-lightbox-image';image.alt='Imagen ampliada de '+item.name;
    const close=galleryButton('×','Cerrar imagen ampliada','lightbox-close');
    const heading=document.createElement('div');heading.className='alma-lightbox-heading';
    const name=document.createElement('strong');name.textContent=item.name;
    const number=document.createElement('span');heading.append(name,number);
    const prev=galleryButton('‹','Imagen anterior','lightbox-prev');
    const next=galleryButton('›','Imagen siguiente','lightbox-next');
    function show(step=0){
      index=(index+step+photos.length)%photos.length;image.src=photos[index];
      number.textContent=photos.length>1?(index+1)+' / '+photos.length:'Imagen de producto';
    }
    close.addEventListener('click',closeLightbox);
    prev.addEventListener('click',()=>show(-1));next.addEventListener('click',()=>show(1));
    overlay.addEventListener('click',e=>{if(e.target===overlay)closeLightbox();});
    if(photos.length===1){prev.hidden=true;next.hidden=true;}
    panel.append(close,image,heading,prev,next);overlay.append(panel);
    document.body.append(overlay);lightbox=overlay;lightboxState={show,lastFocus};show();
    document.body.classList.add('lightbox-open');close.focus();
  }
  document.addEventListener('keydown',e=>{
    if(!lightbox)return;
    if(e.key==='Escape'){e.preventDefault();closeLightbox();}
    if(e.key==='ArrowRight'){e.preventDefault();lightboxState?.show(1);}
    if(e.key==='ArrowLeft'){e.preventDefault();lightboxState?.show(-1);}
    if(e.key==='Tab'){
      const focusable=[...lightbox.querySelectorAll('button:not([hidden])')];
      if(!focusable.length)return;
      const idx=focusable.indexOf(document.activeElement);
      if(e.shiftKey&&idx<=0){e.preventDefault();focusable[focusable.length-1].focus();}
      else if(!e.shiftKey&&idx===focusable.length-1){e.preventDefault();focusable[0].focus();}
    }
  });

  function renderProducts(){
    const root=$('products');if(!root)return;
    root.replaceChildren();
    let items=data.products.filter(p=>p.visible&&p.name.trim());
    if(activeCategory!=='Todos')items=items.filter(p=>p.category===activeCategory);
    if(search.trim())items=items.filter(p=>(p.name+' '+p.description+' '+p.category).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(search.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()));
    if(!items.length){const empty=document.createElement('p');empty.className='empty-products';empty.textContent='No encontramos productos para esa búsqueda. Escribinos y te ayudamos.';root.append(empty);return;}
    for(const item of items){
      const article=document.createElement('article');article.className='product-card';
      const visual=document.createElement('div');visual.className='product-visual '+colors[item.tile%colors.length];
      const label=document.createElement('span');label.className='product-badge';label.textContent=item.badge||'Elegidos Alma';
      const photos=productPhotos(item);
      if(photos.length){
        const frame=document.createElement('div');frame.className='gallery-frame';
        const img=document.createElement('img');img.src=photos[0];img.loading='lazy';img.alt='Fotografía de '+item.name;
        img.onerror=()=>{img.remove();frame.append(art(item));};
        frame.append(img);visual.append(frame);
        if(photos.length>1){
          let current=0;
          const counter=document.createElement('span');counter.className='gallery-count';
          const previous=galleryButton('‹','Anterior imagen de '+item.name,'gallery-prev');
          const next=galleryButton('›','Siguiente imagen de '+item.name,'gallery-next');
          const change=step=>{current=(current+step+photos.length)%photos.length;img.src=photos[current];counter.textContent=(current+1)+' / '+photos.length;};
          previous.addEventListener('click',()=>change(-1));
          next.addEventListener('click',()=>change(1));
          change(0);
          visual.append(previous,next,counter);
        }
        const expand=galleryButton('⤢','Ampliar imagen de '+item.name,'gallery-expand');
        expand.addEventListener('click',()=>openLightbox(item,photos,Math.max(0,photos.indexOf(img.getAttribute('src')))));
        visual.append(expand);
        frame.addEventListener('click',()=>openLightbox(item,photos,Math.max(0,photos.indexOf(img.getAttribute('src')))));
        frame.setAttribute('role','button');frame.setAttribute('tabindex','0');frame.setAttribute('aria-label','Ampliar fotografía de '+item.name);
        frame.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openLightbox(item,photos,Math.max(0,photos.indexOf(img.getAttribute('src'))));}});
      }else if(atlasReady){visual.append(photoTile(item.tile));}
      else{visual.append(art(item));}
      visual.append(label);
      const content=document.createElement('div');content.className='product-text';
      const cat=document.createElement('div');cat.className='product-category';cat.textContent=item.category;
      const title=document.createElement('h3');title.textContent=item.name;
      const desc=document.createElement('p');desc.textContent=item.description;
      const foot=document.createElement('div');foot.className='product-foot';
      const price=document.createElement('strong');price.textContent=item.price||'Consultar';
      const button=document.createElement('button');button.type='button';button.textContent='↗';
      button.setAttribute('aria-label','Consultar por '+item.name+' en WhatsApp');
      button.addEventListener('click',()=>window.open(url(data.whatsapp,'https://wa.me/message/ODU247JWJPHWN1'),'_blank','noopener,noreferrer'));
      foot.append(price,button);content.append(cat,title,desc,foot);article.append(visual,content);root.append(article);
    }
  }
  const searchEl=$('product-search');
  searchEl?.addEventListener('input',e=>{search=e.target.value||'';renderProducts();});
  const toggle=$('menu-toggle'),menu=$('menu');
  function closeMenu(){menu.classList.remove('open');toggle.setAttribute('aria-expanded','false');}
  toggle?.addEventListener('click',()=>{
    const open=menu.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));
  });
  menu?.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});
  document.querySelectorAll('[data-category-jump]').forEach(link=>link.addEventListener('click',()=>{
    activeCategory=link.dataset.categoryJump;search='';if(searchEl)searchEl.value='';
    renderFilters();renderProducts();
  }));
  window.addEventListener('storage',e=>{if(e.key===window.ALMA.KEY)setData();});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)setData();});
  setData();
})();
