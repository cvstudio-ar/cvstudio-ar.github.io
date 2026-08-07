(() => {
  'use strict';
  const root=document.getElementById('publicPortfolioRoot');
  const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));
  const slug=new URLSearchParams(location.search).get('slug')||location.pathname.replace(/^\/+|\/+$/g,'');
  const reserved=new Set(['','index.html','admin','clientes','cliente-panel','portfolio','gracias','admin.html','clientes.html','cliente-panel.html','portfolio.html','gracias.html','404.html','css','js','assets','config']);
  if(reserved.has(slug)) return unavailable('Página no encontrada','La dirección solicitada no existe.');
  fetch(`${window.CVSTUDIO_PORTFOLIO_WORKER_URL}/api/public/portfolio?slug=${encodeURIComponent(slug)}`)
    .then(async r=>{const d=await r.json();if(!r.ok||!d.ok)throw new Error(d.message);return d.portfolio;})
    .then(render).catch(e=>{console.error(e);unavailable('Portfolio no disponible','Esta página todavía no fue publicada o la dirección no es correcta.');});
  function unavailable(t,x){root.innerHTML=`<div class="public-empty"><h1>${esc(t)}</h1><p>${esc(x)}</p><a class="button" href="/">Volver a CVStudio</a></div>`;}
  function safeUrl(v){try{const u=new URL(v);return ['http:','https:'].includes(u.protocol)?u.href:''}catch{return''}}
  function slides(project){const out=[];if(project?.cover_url)out.push(project.cover_url);if(Array.isArray(project?.media))project.media.forEach(i=>{const u=typeof i==='string'?i:(i?.url||i?.publicUrl||i?.src||'');if(u&&!out.includes(u))out.push(u)});return out.filter(Boolean)}
  const sectionDefs=[['sobre-mi','Sobre mí','user'],['servicios','Servicios','briefcase'],['proyecto','Proyecto','folder'],['experiencia','Experiencia','star']];
  function normalizeSection(project,index){const raw=String(project?.category||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'-');if(['sobre-mi','servicios','proyecto','experiencia'].includes(raw))return raw;return sectionDefs[index%4][0]}
  const icons={home:'<svg viewBox="0 0 24 24"><path d="m3 11 9-8 9 8"/><path d="M5 10v11h14V10M9 21v-7h6v7"/></svg>',phone:'<svg viewBox="0 0 24 24"><path d="M7.2 3.5 10 8l-2 2.2c1.3 2.6 3.4 4.7 6 6l2.2-2 4.3 2.8c.5.3.7.9.5 1.4-.7 1.8-2.5 3-4.4 2.8C9.5 20.4 3.6 14.5 2.8 7.4 2.6 5.5 3.8 3.7 5.6 3c.6-.2 1.2 0 1.6.5Z"/></svg>',user:'<svg viewBox="0 0 24 24"><circle cx="12" cy="7" r="4"/><path d="M4.5 21c.5-5 3-7.5 7.5-7.5S19 16 19.5 21"/></svg>',briefcase:'<svg viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18"/></svg>',folder:'<svg viewBox="0 0 24 24"><path d="M3 6a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>',star:'<svg viewBox="0 0 24 24"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z"/></svg>',prev:'<svg viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>',next:'<svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>',play:'<svg viewBox="0 0 24 24"><path class="fill" d="m8 5 11 7-11 7z"/></svg>',pause:'<svg viewBox="0 0 24 24"><path class="fill" d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>',volume:'<svg viewBox="0 0 24 24"><path d="M5 10v4h4l5 4V6L9 10zM17 9c1.3 1.6 1.3 4.4 0 6M19 7c2.7 2.8 2.7 7.2 0 10"/></svg>',expand:'<svg viewBox="0 0 24 24"><path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"/></svg>'};
  function render(p){
    if(slug==='julieta-ferrari' && typeof window.renderJulietaPortfolio==='function') return window.renderJulietaPortfolio(p,{root,esc,safeUrl,icons});
    if(slug==='beauty-nails-by-eliana' && typeof window.renderElianaPortfolio==='function') return window.renderElianaPortfolio(p,{root,esc,safeUrl,icons});
    const settings=p.settings||{},colors=Array.isArray(settings.colors)?settings.colors:['#ff4b55','#050506','#f5f5f5'];
    const projects=(p.projects||[]).filter(x=>x.is_visible!==false);
    if(!projects.length)return unavailable('Portfolio sin contenido','Todavía no hay imágenes publicadas.');
    document.title=`${p.brand_name||p.full_name} · Portfolio`;
    const logo=safeUrl(settings.logoUrl||''), instagram=safeUrl(settings.instagram||''), facebook=safeUrl(settings.facebook||'');
    const whatsapp=String(p.whatsapp||'').replace(/\D/g,''), waText=encodeURIComponent(`Hola, vi el portfolio de ${p.brand_name||p.full_name} y quisiera realizar una consulta.`);
    const validSections=new Set(['inicio','sobre-mi','servicios','proyecto','experiencia','contacto']);
    const normalizeSection=(v,f='proyecto')=>validSections.has(String(v||'').toLowerCase())?String(v).toLowerCase():f;
    const allSlides=[];
    projects.forEach((project,projectIndex)=>{
      const fallback=normalizeSection(project.category,'proyecto');
      const media=Array.isArray(project.media)?project.media:[];
      const coverMeta=media.find(x=>typeof x==='object'&&x?.isCover);
      if(project.cover_url) allSlides.push({url:project.cover_url,section:normalizeSection(coverMeta?.section,fallback),title:project.title||'Portfolio',projectIndex});
      media.filter(x=>!(typeof x==='object'&&x?.isCover)).forEach(item=>{const url=typeof item==='string'?item:(item?.url||item?.publicUrl||item?.src||'');if(url)allSlides.push({url,section:normalizeSection(typeof item==='object'?item.section:null,fallback),title:project.title||'Portfolio',projectIndex});});
    });
    if(!allSlides.length)return unavailable('Portfolio sin contenido','Todavía no hay imágenes publicadas.');
    root.className='portfolio-v4';root.style.setProperty('--accent',colors[0]);root.style.setProperty('--shell-bg',colors[1]);root.style.setProperty('--shell-text',colors[2]);root.style.setProperty('--glow-opacity',String(Math.max(.18,Math.min(.72,Number(settings.glowIntensity??42)/100))));
    const brand=esc(p.brand_name||p.full_name||'Mi marca'), business=esc(p.business_type||'Portfolio profesional');
    const track=settings.ambientTrack&&settings.ambientTrack!=='none'?`/assets/audio/${encodeURIComponent(settings.ambientTrack)}.mp3`:'';
    root.innerHTML=`<div class="v4-page"><header class="v4-header"><div class="v4-identity">${logo?`<img src="${esc(logo)}" alt="Logo">`:`<span class="v4-logo-fallback">${brand.slice(0,2).toUpperCase()}</span>`}<div><strong>${brand}</strong><small>MARKETING</small><em>${business}</em></div></div><nav class="v4-nav" aria-label="Secciones del portfolio"><button data-section="inicio">${icons.home}<span>Inicio</span></button>${sectionDefs.slice(0,2).map(([k,l,i])=>`<button data-section="${k}">${icons[i]}<span>${l}</span></button>`).join('')}<div class="v4-signature" aria-live="polite"><small>PORTFOLIO</small><strong id="v4HeaderTitle">${esc(allSlides[0].title)}</strong><i></i></div>${sectionDefs.slice(2).map(([k,l,i])=>`<button data-section="${k}">${icons[i]}<span>${l}</span></button>`).join('')}<button data-section="contacto">${icons.phone}<span>Contacto</span></button></nav><div class="v4-socials">${instagram?`<a href="${esc(instagram)}" target="_blank" rel="noopener"><img src="/assets/icons/instagram-official.png" alt="Instagram"></a>`:''}${facebook?`<a href="${esc(facebook)}" target="_blank" rel="noopener"><img src="/assets/icons/facebook-official.png" alt="Facebook"></a>`:''}</div></header>
    <main class="v4-stage-wrap"><div class="v4-ambilight" aria-hidden="true"></div><section class="v4-stage" id="v4Stage"><img id="v4ImageA" class="v4-slide-layer is-active" crossorigin="anonymous" alt=""><img id="v4ImageB" class="v4-slide-layer" crossorigin="anonymous" alt=""><span class="v4-image-counter" id="v4ImageCounter"></span></section>
    <div class="v4-bottom-row"><div class="v4-player" id="v4Player"><button id="v4Prev" aria-label="Anterior">${icons.prev}</button><button id="v4Play" aria-label="Reproducir">${icons.play}</button><button id="v4Next" aria-label="Siguiente">${icons.next}</button><span class="v4-counter" id="v4Counter"></span><div class="v4-progress"><i id="v4Progress"></i></div><button id="v4Volume" aria-label="Silenciar">${icons.volume}</button><button id="v4Fullscreen" aria-label="Pantalla completa">${icons.expand}</button></div>${whatsapp?`<a class="v4-whatsapp" href="https://wa.me/${whatsapp}?text=${waText}" target="_blank" rel="noopener"><img src="/assets/icons/social-official/whatsapp.svg" alt=""><span><b>¿Trabajamos juntos?</b><small>WHATSAPP</small></span></a>`:''}</div>${track?`<audio id="v4AmbientAudio" src="${track}" loop preload="auto"></audio>`:''}</main></div>`;
    let slideIndex=0,timer=null,playing=false,muted=false,hideTimer=null,audioStarted=false,activeLayer=0,transitioning=false; const MS=9000;
    const stage=document.getElementById('v4Stage'),player=document.getElementById('v4Player'),audio=document.getElementById('v4AmbientAudio');
    const layers=[document.getElementById('v4ImageA'),document.getElementById('v4ImageB')];
    async function startAudio(){
      if(!audio||muted)return false;
      try{if(audio.readyState<2)audio.load();await audio.play();audioStarted=true;return true}catch(error){console.warn('Audio ambiental pendiente de interacción:',error);return false}
    }
    if(audio){
      audio.volume=.42;
      audio.addEventListener('error',()=>console.error('No se pudo cargar la pista ambiental:',audio.currentSrc||audio.src));
      const unlock=async()=>{if(await startAudio()){document.removeEventListener('pointerdown',unlock);document.removeEventListener('keydown',unlock)}};
      document.addEventListener('pointerdown',unlock);document.addEventListener('keydown',unlock);
    }
    function findSection(key){const i=allSlides.findIndex(x=>x.section===key);return i<0?-1:i}
    function activateNav(){document.querySelectorAll('[data-section]').forEach(b=>b.classList.toggle('is-active',b.dataset.section===allSlides[slideIndex].section))}
    function updateUi(item){
      root.style.setProperty('--ambilight-image',`url("${String(item.url).replace(/"/g,'\\"')}")`);
      const headerTitle=document.getElementById('v4HeaderTitle');headerTitle.textContent=item.title;headerTitle.dataset.length=String(item.title.length);
      const count=`${String(slideIndex+1).padStart(2,'0')} / ${String(allSlides.length).padStart(2,'0')}`;
      document.getElementById('v4Counter').textContent=count;document.getElementById('v4ImageCounter').textContent=count;
      document.getElementById('v4Progress').style.width=`${((slideIndex+1)/allSlides.length)*100}%`;activateNav();
    }
    async function update(animate=true){
      slideIndex=(slideIndex+allSlides.length)%allSlides.length;const item=allSlides[slideIndex];
      if(!animate){layers[0].src=item.url;layers[0].alt=item.title;layers[0].classList.add('is-active');layers[1].classList.remove('is-active','is-entering','is-exiting');updateUi(item);return}
      if(transitioning)return;transitioning=true;
      const incoming=layers[1-activeLayer],outgoing=layers[activeLayer];
      incoming.classList.remove('is-active','is-entering','is-exiting');incoming.src=item.url;incoming.alt=item.title;
      try{if(incoming.decode)await incoming.decode()}catch{}
      updateUi(item);
      requestAnimationFrame(()=>requestAnimationFrame(()=>{
        incoming.classList.add('is-active','is-entering');outgoing.classList.add('is-exiting');outgoing.classList.remove('is-active');
        setTimeout(()=>{incoming.classList.remove('is-entering');outgoing.classList.remove('is-exiting');activeLayer=1-activeLayer;transitioning=false},620);
      }));
    }
    function stop(){clearTimeout(timer);timer=null;playing=false;document.getElementById('v4Play').innerHTML=icons.play}
    function schedule(){clearTimeout(timer);if(playing)timer=setTimeout(async()=>{await updateSlide(1);schedule()},MS)}
    function start(){if(allSlides.length<2)return;playing=true;document.getElementById('v4Play').innerHTML=icons.pause;schedule()}
    async function updateSlide(d){if(transitioning)return;slideIndex+=d;await update()}
    async function selectSection(k){const i=findSection(k);if(i<0){if(k==='contacto'){const wa=document.querySelector('.v4-whatsapp');if(wa)wa.click()}return}stop();slideIndex=i;await update()}
    document.querySelectorAll('[data-section]').forEach(b=>b.addEventListener('click',()=>selectSection(b.dataset.section)));
    document.getElementById('v4Prev').onclick=()=>{const was=playing;stop();updateSlide(-1).then(()=>{if(was)start()})};
    document.getElementById('v4Next').onclick=()=>{const was=playing;stop();updateSlide(1).then(()=>{if(was)start()})};
    document.getElementById('v4Play').onclick=()=>playing?stop():start();
    document.getElementById('v4Volume').onclick=async()=>{muted=!muted;const button=document.getElementById('v4Volume');button.classList.toggle('is-muted',muted);button.setAttribute('aria-label',muted?'Activar sonido':'Silenciar');if(audio){audio.muted=muted;if(!muted)await startAudio()}};
    function showControls(){player.classList.add('is-visible');clearTimeout(hideTimer);if(document.fullscreenElement)hideTimer=setTimeout(()=>player.classList.remove('is-visible'),2600)}
    document.getElementById('v4Fullscreen').onclick=async()=>{if(!document.fullscreenElement)await stage.requestFullscreen();else await document.exitFullscreen()};
    document.addEventListener('fullscreenchange',()=>{root.classList.toggle('is-fullscreen',!!document.fullscreenElement);showControls()});stage.addEventListener('pointerdown',showControls);stage.addEventListener('pointermove',showControls);
    document.addEventListener('keydown',e=>{if(e.key==='ArrowLeft')updateSlide(-1);if(e.key==='ArrowRight')updateSlide(1);if(e.key===' '){e.preventDefault();playing?stop():start()}if(e.key==='Escape'&&document.fullscreenElement)document.exitFullscreen()});
    update(false);start();
  }

})();
