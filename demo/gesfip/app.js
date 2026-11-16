(async () => {
  'use strict';
  const data=await window.GESFIPDemo?.load?.();
  if(!data)return;
  document.documentElement.style.setProperty('--gold',data.gold||'#eeb24c');
  document.documentElement.style.setProperty('--ink',data.dark||'#070d13');
  const $=q=>document.querySelector(q);
  const text=(q,value)=>{const el=$(q);if(el)el.textContent=value||''};
  text('#heroEyebrow',data.eyebrow);
  text('#heroTop',data.heroLine1);
  text('#heroAccent',data.heroLine2);
  text('#heroDescription',data.heroDescription);
  text('#aboutTitle',data.aboutTitle);
  text('#aboutDescription',data.about);
  text('#missionDescription',data.mission);
  text('#contactPhone',data.phone);
  text('#footerPhone',data.phone);
  text('#contactEmail',data.email);
  text('#contactAddress',data.address);
  const validImage=url=>{
    const v=String(url||'');
    return v==='./hero-aprobada.svg'
      || /^\.\/assets\/[a-z0-9-]+\.(?:svg|webp|png|jpe?g)$/i.test(v)
      || /^\/api\/media\/(?:hero|about|team|(?:service-0[1-8]|operation-0[1-5]))$/.test(v)
      || /^https:\/\/[a-z0-9.-]+\/[a-z0-9_./?=&%+-]*$/i.test(v);
  };
  for(const [selector,url] of [['#aboutImage',data.aboutImage],['#teamImage',data.teamImage]]){
    const image=$(selector);
    if(image && validImage(url))image.src=url;
  }
  if(validImage(data.heroImage)){
    const style=document.createElement('style');
    style.textContent='.hero::before{background-image:linear-gradient(90deg,#080e15 2%,rgba(8,14,21,.96) 34%,rgba(8,14,21,.45) 75%),url("'+data.heroImage+'")}';
    style.textContent+='@media(max-width:800px){.hero-mobile-photo{background-image:linear-gradient(180deg,#080f16 0%,rgba(8,15,22,.03) 34%,rgba(8,15,22,.1) 70%,#080f16 100%),url("'+data.heroImage+'")!important}}';
    document.head.append(style);
  }
  const cleanPhone=String(data.phone||'').replace(/\D/g,'');
  const wa=cleanPhone?('https://wa.me/'+(cleanPhone.startsWith('54')?cleanPhone:'549'+cleanPhone)):'#contacto';
  document.querySelectorAll('[data-whatsapp]').forEach(a=>a.href=wa);
  document.querySelectorAll('[data-email]').forEach(a=>a.href='mailto:'+encodeURIComponent(data.email||'').replace('%40','@'));
  // Draw consistent outline icons instead of emoji placeholders.
  const iconPaths=[
    ['Seguridad Física','M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z M9 12l2 2 4-4'],
    ['Monitoreo','M4 3h16a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z M8 21h8 M12 18v3 M7 8h2l1-1h4l1 1h2v6H7z M12 9.5a1.5 1.5 0 1 0 0 3a1.5 1.5 0 1 0 0-3z'],
    ['Gestión de Riesgos','M4 20V12 M10 20V8 M16 20V4 M22 20H2'],
    ['Custodia de Personas','M12 3a4 4 0 1 0 0 8a4 4 0 0 0 0-8z M4 21c0-5 3-8 8-8s8 3 8 8 M2 12l3-2 M22 12l-3-2'],
    ['Seguridad para Empresas','M4 21V7l8-4 8 4v14 M2 21h20 M8 10h1 M15 10h1 M8 14h1 M15 14h1 M11 21v-4h2'],
    ['Country y Barrios','M2 12l10-9 10 9 M5 10v11h14V10 M10 21v-7h4v7'],
    ['Silos y Campos','M4 21V8l4-4 4 4v13 M14 21V7l3-3 3 3v14 M2 21h20 M4 10h8 M14 10h6'],
    ['Hoteles y Eventos','M5 21V5h14v16 M2 21h20 M9 9h2 M15 9h2 M9 13h2 M15 13h2 M11 21v-4h2']
  ];
  function serviceIcon(title){
    const ns='http://www.w3.org/2000/svg';
    const svg=document.createElementNS(ns,'svg');
    svg.setAttribute('viewBox','0 0 24 24'); svg.setAttribute('fill','none');
    svg.setAttribute('stroke','currentColor'); svg.setAttribute('stroke-width','1.65');
    svg.setAttribute('stroke-linecap','round');svg.setAttribute('stroke-linejoin','round');
    svg.setAttribute('aria-hidden','true');svg.classList.add('service-svg');
    const path=document.createElementNS(ns,'path');
    path.setAttribute('d',(iconPaths.find(x=>x[0]===title)||iconPaths[0])[1]);
    svg.append(path);return svg;
  }
  const services=data.services||[];
  const track=$('#serviceTrack');
  const modal=$('#serviceModal');
  const title=$('#modalTitle');
  const detail=$('#modalDetails');
  const glyph=$('#modalGlyph');
  let offset=0, lastActivator=null;
  const shown=()=>window.matchMedia('(max-width:800px)').matches?1:window.matchMedia('(max-width:1100px)').matches?2:3;
  function openItem(index,activator){
    const item=services[index];if(!item)return;
    lastActivator=activator;
    title.textContent=item.title;
    detail.textContent=item.detail||item.short||'';
    glyph.replaceChildren(serviceIcon(item.title));
    modal.showModal();
  }
  function renderCarousel(){
    if(!track)return;
    track.replaceChildren();
    const count=Math.min(shown(),services.length);
    if (!services.length) { text('#carouselPosition',''); return; }
    for(let n=0;n<count;n++){
      const index=(offset+n)%services.length, item=services[index];
      const button=document.createElement('button');
      button.className='service';button.type='button';
      // Only local, client-provided photos are used; no URLs from editable content.
      const photo=item.image;
      if(validImage(photo))button.style.setProperty('--service-photo','url("'+photo+'")');
      const icon=document.createElement('span');icon.className='glyph';icon.append(serviceIcon(item.title));
      const heading=document.createElement('strong');heading.textContent=item.title||'Servicio';
      const desc=document.createElement('span');desc.className='desc';desc.textContent=item.short||'';
      const more=document.createElement('span');more.className='more';more.textContent='Ver detalles  ↗';
      button.append(icon,heading,desc,more);
      button.addEventListener('click',()=>openItem(index,button));
      track.append(button);
    }
    text('#carouselPosition',services.length?((offset+1)+' / '+services.length):'');
  }
  $('#nextService')?.addEventListener('click',()=>{if(!services.length)return;offset=(offset+1)%services.length;renderCarousel()});
  $('#prevService')?.addEventListener('click',()=>{if(!services.length)return;offset=(offset-1+services.length)%services.length;renderCarousel()});
  let viewportWidth=window.innerWidth;
  window.addEventListener('resize',()=>{const w=window.innerWidth;if(Math.abs(w-viewportWidth)>25){viewportWidth=w;renderCarousel()}});
  modal?.addEventListener('close',()=>lastActivator?.focus?.());
  modal?.addEventListener('click',e=>{if(e.target===modal)modal.close()});
  $('#modalClose')?.addEventListener('click',()=>modal.close());
  renderCarousel();
  const operations=$('#operationList');
  if(operations){
    operations.replaceChildren();
    (data.operations||[]).forEach((name,index)=>{
      const el=document.createElement('button');el.className='op';el.type='button';
      el.setAttribute('aria-label','Conocer operación: '+name);
      const number=document.createElement('b');number.textContent=String(index+1).padStart(2,'0');
      const span=document.createElement('span');span.textContent=name;
      const photo=Array.isArray(data.operationImages) ? data.operationImages[index] : '';
      if(validImage(photo)){
        el.classList.add('op-photo');
        el.style.setProperty('--operation-photo','url("'+photo+'")');
      }
      const details=Array.isArray(data.operationDetails)?data.operationDetails[index]:'';
      el.append(number,span);
      el.addEventListener('click',()=>{
        lastActivator=el;
        title.textContent=name;
        detail.textContent=details||'Contactanos para conocer el alcance de este servicio.';
        glyph.replaceChildren(serviceIcon('Seguridad Física'));
        modal.showModal();
      });
      operations.append(el);
    });
  }
  const menu=$('#menuButton');
  menu?.addEventListener('click',()=>{
    const open=$('#mainNav').classList.toggle('open');
    menu.setAttribute('aria-expanded',String(open));
  });
  document.querySelectorAll('#mainNav a').forEach(link=>link.addEventListener('click',()=>{
    $('#mainNav')?.classList.remove('open');
    menu?.setAttribute('aria-expanded','false');
  }));
})();