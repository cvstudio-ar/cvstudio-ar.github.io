(() => {
  'use strict';
  const data=window.GESFIPDemo?.read?.();
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
  const validImage=url=>/^https:\/\/[^"'<>\s]+$/i.test(String(url||''));
  if(validImage(data.heroImage)){
    const style=document.createElement('style');
    style.textContent='.hero::before{background-image:linear-gradient(90deg,#080e15 2%,rgba(8,14,21,.96) 34%,rgba(8,14,21,.45) 75%),url("'+data.heroImage.replace(/\\/g,'')+'")}';
    document.head.append(style);
  }
  const cleanPhone=String(data.phone||'').replace(/\D/g,'');
  const wa=cleanPhone?('https://wa.me/'+(cleanPhone.startsWith('54')?cleanPhone:'549'+cleanPhone)):'#contacto';
  document.querySelectorAll('[data-whatsapp]').forEach(a=>a.href=wa);
  document.querySelectorAll('[data-email]').forEach(a=>a.href='mailto:'+encodeURIComponent(data.email||'').replace('%40','@'));
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
    glyph.textContent=item.glyph||'◇';
    modal.showModal();
  }
  function renderCarousel(){
    if(!track)return;
    track.replaceChildren();
    const count=Math.min(shown(),services.length);
    for(let n=0;n<count;n++){
      const index=(offset+n)%services.length, item=services[index];
      const button=document.createElement('button');
      button.className='service';button.type='button';
      const icon=document.createElement('span');icon.className='glyph';icon.textContent=item.glyph||'◇';
      const heading=document.createElement('strong');heading.textContent=item.title||'Servicio';
      const desc=document.createElement('span');desc.className='desc';desc.textContent=item.short||'';
      const more=document.createElement('span');more.className='more';more.textContent='Ver detalles  ↗';
      button.append(icon,heading,desc,more);
      button.addEventListener('click',()=>openItem(index,button));
      track.append(button);
    }
    text('#carouselPosition',services.length?((offset+1)+' / '+services.length):'');
  }
  $('#nextService')?.addEventListener('click',()=>{offset=(offset+1)%services.length;renderCarousel()});
  $('#prevService')?.addEventListener('click',()=>{offset=(offset-1+services.length)%services.length;renderCarousel()});
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
      const el=document.createElement('div');el.className='op';
      const number=document.createElement('b');number.textContent=String(index+1).padStart(2,'0');
      const span=document.createElement('span');span.textContent=name;
      el.append(number,span);operations.append(el);
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