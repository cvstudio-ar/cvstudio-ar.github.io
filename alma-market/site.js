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
    else if(atlasReady){el.style.backgroundImage='url("assets/catalogo-alma.svg")';el.style.backgroundSize='400% 300%';el.style.backgroundPosition='100% 100%';}
    else{el.style.backgroundImage='linear-gradient(130deg,#f4ecd5,#a9c8ab 63%,#559278)';}
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
    const hero=$('hero-image');if(hero)hero.src=data.heroImage||'assets/portada-natural.svg';
    document.querySelectorAll('[data-alma-logo]').forEach(img=>{
      img.onerror=()=>{img.onerror=null;img.src='assets/logo.svg';};
      img.src=data.logoImage||'assets/logo.svg';
    });
    setLinks();
    const frame=$('maps-frame');
    const address=(data.address||'San Isidro, Buenos Aires')+', Argentina';
    if(frame)frame.src='https://www.google.com/maps?q='+encodeURIComponent(address)+'&output=embed';
    const link=$('maps-link');
    if(link)link.href='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(address);
    renderStory();renderFilters();renderProducts();
    document.title=data.name+' · Tienda natural en San Isidro';
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
      if(item.image){const img=document.createElement('img');img.src=item.image;img.loading='lazy';img.alt='Imagen ilustrativa de '+item.name;
       img.onerror=()=>{img.remove();visual.append(art(item));};visual.append(img);
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
