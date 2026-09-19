(() => {
  'use strict';

  const INSTAGRAM = 'https://www.instagram.com/isabellahogarydeco/';
  const HERO = '/assets/portfolio/isabella/hero-isabella-v1.webp';
  const LOGO = '/assets/portfolio/isabella/logo-isabella.png';
  const CATALOG = '/assets/portfolio/isabella/catalog';
  const staticProducts = [
    {id:'isabella-aeris',item_type:'product',is_visible:true,featured:true,title:'Difusor Aeris',category:'Difusores y aromas',description:'Difusor de 200 ml. Aromas disponibles: Chicle, Té verde, Wanna, Maderas florales, Magnolias, Mango maracuyá, Coco & vainilla, Papaya, Peras & flores, Flores blancas y Lavanda & romero.',price_mode:'price',price:15500,availability:'available',cover_url:`${CATALOG}/aeris-01.webp`,media:[`${CATALOG}/aeris-01.webp`,`${CATALOG}/aeris-02.webp`]},
    {id:'isabella-ezzensa',item_type:'product',is_visible:true,title:'Difusor Ezzensa',category:'Difusores y aromas',description:'Difusor de 200 ml. Aromas disponibles: Té verde, Wanna, Maderas florales y Papaya.',price_mode:'price',price:15500,availability:'available',cover_url:`${CATALOG}/ezzensa-01.webp`,media:[`${CATALOG}/ezzensa-01.webp`,`${CATALOG}/ezzensa-02.webp`]},
    {id:'isabella-native',item_type:'product',is_visible:true,title:'Difusor Native',category:'Difusores y aromas',description:'Difusor de 125 ml. Aromas disponibles: Chicle, Té verde, Wanna, Maderas florales, Magnolias, Mango maracuyá, Coco & vainilla, Papaya, Peras & flores, Flores blancas y Lavanda & romero.',price_mode:'price',price:11000,availability:'available',cover_url:`${CATALOG}/native-01.webp`,media:[`${CATALOG}/native-01.webp`,`${CATALOG}/native-02.webp`]},
    {id:'isabella-vela-ambar',item_type:'product',is_visible:true,title:'Vela Ámbar',category:'Velas artesanales',description:'Vela artesanal presentada en recipiente de vidrio ámbar, ideal para sumar luz cálida y un detalle especial a tus espacios.',price_mode:'price',price:16000,availability:'available',cover_url:`${CATALOG}/vela-ambar-01.webp`,media:[`${CATALOG}/vela-ambar-01.webp`]},
    {id:'isabella-vela-blossom',item_type:'product',is_visible:true,title:'Vela Blossom',category:'Velas artesanales',description:'Vela decorativa con detalle floral, pensada para ambientar, regalar y crear momentos especiales.',price_mode:'price',price:16500,availability:'available',cover_url:`${CATALOG}/vela-blossom-02.webp`,media:[`${CATALOG}/vela-blossom-02.webp`,`${CATALOG}/vela-blossom-01.webp`]},
    {id:'isabella-tulipe',item_type:'product',is_visible:true,title:'Tulipe Candle',category:'Velas artesanales',description:'Vela decorativa con diseño de tulipán. Consultá los colores disponibles al momento de realizar tu pedido.',price_mode:'price',price:17000,availability:'consult_stock',cover_url:`${CATALOG}/tulipe-01.webp`,media:[`${CATALOG}/tulipe-01.webp`,`${CATALOG}/tulipe-02.webp`,`${CATALOG}/tulipe-03.webp`]},
    {id:'isabella-mini-buble',item_type:'product',is_visible:true,title:'Mini Buble',category:'Velas decorativas',description:'Mini vela decorativa con diseño de burbujas, perfecta para complementar bandejas, rincones especiales o pequeños regalos.',price_mode:'price',price:4500,availability:'available',cover_url:`${CATALOG}/mini-buble-01.webp`,media:[`${CATALOG}/mini-buble-01.webp`,`${CATALOG}/mini-buble-02.webp`]},
    {id:'isabella-buble-corazon',item_type:'product',is_visible:true,title:'Buble Corazón',category:'Velas decorativas',description:'Vela decorativa formada por pequeños corazones. Fotografiada en tonos natural y rosa; consultá variantes disponibles.',price_mode:'price',price:6800,availability:'consult_stock',cover_url:`${CATALOG}/buble-corazon-01.webp`,media:[`${CATALOG}/buble-corazon-01.webp`,`${CATALOG}/buble-corazon-02.webp`]},
    {id:'isabella-souvenirs',item_type:'product',is_visible:true,featured:true,title:'Souvenirs personalizados',category:'Souvenirs',description:'Personalizamos souvenirs para tus eventos. Cada propuesta se prepara según la celebración, el diseño y la cantidad requerida.',price_mode:'consult',price:null,availability:'consult_stock',cover_url:`${CATALOG}/souvenirs-03.webp`,media:[`${CATALOG}/souvenirs-03.webp`,`${CATALOG}/souvenirs-01.webp`,`${CATALOG}/souvenirs-02.webp`,`${CATALOG}/souvenirs-04.webp`,`${CATALOG}/souvenirs-05.webp`,`${CATALOG}/souvenirs-06.webp`]},
    {id:'isabella-cesta',item_type:'product',is_visible:true,title:'Cesta organizadora',category:'Cestería y organización',description:'Cesta organizadora de 25 cm de diámetro por 15 cm de alto. Una opción práctica y cálida para mantener cada espacio en orden.',price_mode:'price',price:27000,availability:'available',cover_url:`${CATALOG}/cesta-01.webp`,media:[`${CATALOG}/cesta-01.webp`,`${CATALOG}/cesta-02.webp`]},
    {id:'isabella-bandeja-ovalada',item_type:'product',is_visible:true,title:'Bandeja de yeso ovalada',category:'Decoración y organización',description:'Bandeja decorativa de yeso con formato ovalado. Consultá el stock de colores y diseños disponibles.',price_mode:'price',price:5500,availability:'consult_stock',cover_url:`${CATALOG}/bandeja-ovalada-01.webp`,media:[`${CATALOG}/bandeja-ovalada-01.webp`,`${CATALOG}/bandeja-ovalada-02.webp`,`${CATALOG}/bandeja-ovalada-03.webp`,`${CATALOG}/bandeja-ovalada-04.webp`]},
    {id:'isabella-bandeja-formas',item_type:'product',is_visible:true,title:'Bandeja de yeso corazón o circular',category:'Decoración y organización',description:'Bandeja decorativa disponible en diseños corazón y circular. Consultá el stock de colores y terminaciones.',price_mode:'price',price:3800,availability:'consult_stock',cover_url:`${CATALOG}/bandeja-formas-01.webp`,media:[`${CATALOG}/bandeja-formas-01.webp`,`${CATALOG}/bandeja-formas-02.webp`,`${CATALOG}/bandeja-formas-03.webp`,`${CATALOG}/bandeja-formas-04.webp`,`${CATALOG}/bandeja-formas-05.webp`]},
    {id:'isabella-atril-home',item_type:'product',is_visible:true,title:'Atril “Home is Love”',category:'Decoración para el hogar',description:'Atril decorativo de madera “Home is Love”, un detalle cálido para estantes, mesas y rincones especiales.',price_mode:'price',price:5500,availability:'available',cover_url:`${CATALOG}/atril-home-01.webp`,media:[`${CATALOG}/atril-home-01.webp`,`${CATALOG}/atril-home-02.webp`]},
    {id:'isabella-cuadro-amor',item_type:'product',is_visible:true,title:'Cuadro “Amor”',category:'Cuadros y decoración',description:'Cuadro decorativo con definición de amor: “Donde te abracen y quieras cinco minutos más, ahí es”.',price_mode:'price',price:14000,availability:'available',cover_url:`${CATALOG}/cuadro-amor-01.webp`,media:[`${CATALOG}/cuadro-amor-01.webp`]},
    {id:'isabella-cuadro-amor-propio',item_type:'product',is_visible:true,title:'Cuadro “Amor propio”',category:'Cuadros y decoración',description:'Cuadro decorativo con ilustración lineal y marco de aspecto natural, pensado para sumar personalidad a tus ambientes.',price_mode:'price',price:15800,availability:'available',cover_url:`${CATALOG}/cuadro-amor-propio-01.webp`,media:[`${CATALOG}/cuadro-amor-propio-01.webp`]},
    {id:'isabella-alfombra-handira',item_type:'product',is_visible:true,title:'Alfombra Handira de telar',category:'Textiles y decoración',description:'Alfombra Handira de telar en tono natural. Medidas: 90 × 65 cm.',price_mode:'price',price:21000,availability:'available',cover_url:`${CATALOG}/alfombra-handira-01.webp`,media:[`${CATALOG}/alfombra-handira-01.webp`]},
    {id:'isabella-alfombra-nordica',item_type:'product',is_visible:true,title:'Alfombra nórdica',category:'Textiles y decoración',description:'Alfombra nórdica circular de 100 cm, con textura suave y terminación artesanal.',price_mode:'price',price:35000,availability:'available',cover_url:`${CATALOG}/alfombra-nordica-01.webp`,media:[`${CATALOG}/alfombra-nordica-01.webp`]}
  ];
  const categories = [
    {key:'Velas',icon:'✦',title:'Velas artesanales',copy:'Aromas suaves y luz cálida para crear pequeños rituales de calma.'},
    {key:'Difusores',icon:'⌇',title:'Difusores & aromas',copy:'Fragancias para acompañar cada ambiente y hacerlo sentir propio.'},
    {key:'Cestería',icon:'◯',title:'Cestería & deco',copy:'Texturas naturales y detalles simples que transforman tus espacios.'},
    {key:'Souvenirs',icon:'♡',title:'Souvenirs',copy:'Detalles personalizados para celebraciones y momentos especiales.'},
    {key:'Boxes',icon:'□',title:'Boxes para regalar',copy:'Selecciones pensadas para sorprender con algo cálido y diferente.'}
  ];

  window.renderIsabellaCatalog = (portfolio, helpers) => {
    const {root,esc,safeUrl} = helpers;
    const settings = portfolio.settings || {};
    const liveProducts = (portfolio.projects || []).filter(item => item.is_visible !== false && (!item.item_type || item.item_type === 'product'));
    const key = value => String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-');
    const products = staticProducts.map(item=>({...item,media:[...(item.media||[])]}));
    liveProducts.forEach(item=>{const index=products.findIndex(product=>key(product.title)===key(item.title));if(index>=0)products[index]={...products[index],...item};else products.push(item);});
    const phone = String(portfolio.whatsapp || '+54 9 2901 41-5255').replace(/\D/g,'');
    const brand = portfolio.full_name || 'ISABELLA HOGAR & DECO';
    const instagram = safeUrl(settings.instagram || '') || INSTAGRAM;
    const genericWa = waUrl('Hola Isabella, vi el catálogo online y quisiera hacer una consulta.');

    document.title = `${brand} · Decoración, aromas y regalos`;
    const description = document.querySelector('meta[name="description"]');
    if(description) description.content = 'Velas, aromas, decoración y souvenirs personalizados de Isabella Hogar & Deco en Tolhuin, Tierra del Fuego.';
    document.documentElement.classList.add('isabella-page');
    root.className = 'isabella-catalog';
    root.innerHTML = `
      <div class="ihd-page">
        <header class="ihd-header" id="inicio">
          <a class="ihd-brand" href="#inicio" aria-label="Isabella Hogar y Deco, inicio"><img class="ihd-brand-logo" src="${LOGO}" alt="Isabella Hogar & Deco"></a>
          <button class="ihd-menu" type="button" aria-label="Abrir menú" aria-expanded="false"><span></span><span></span></button>
          <nav aria-label="Navegación principal">
            <a href="#colecciones">Colecciones</a><a href="#catalogo">Catálogo</a><a href="#historia">Nuestra esencia</a><a href="#souvenirs">Souvenirs</a>
          </nav>
          <a class="ihd-instagram-pill" href="${esc(instagram)}" target="_blank" rel="noopener"><img src="/assets/icons/social-official/instagram.svg" alt=""> <span>Instagram</span></a>
        </header>

        <main>
          <section class="ihd-hero" aria-labelledby="ihdHeroTitle">
            <img class="ihd-hero-image" src="${HERO}" alt="Vela, difusor y objetos de decoración en tonos naturales">
            <div class="ihd-hero-shade"></div>
            <div class="ihd-hero-copy">
              <p class="ihd-eyebrow">Tolhuin · Tierra del Fuego</p>
              <h1 id="ihdHeroTitle">Detalles que hacen sentir <em>hogar.</em></h1>
              <p>Velas, aromas y objetos elegidos con amor para transformar tus espacios y acompañar momentos especiales.</p>
              <div class="ihd-actions"><a class="ihd-btn ihd-btn-dark" href="#catalogo">Explorar catálogo</a><a class="ihd-text-link" href="${esc(genericWa)}" target="_blank" rel="noopener">Consultar por WhatsApp <span>↗</span></a></div>
            </div>
            <aside class="ihd-hero-note"><span>Hecho a mano</span><strong>con calma<br>y esencia</strong></aside>
            <div class="ihd-scroll-note" aria-hidden="true"><i></i><span>Descubrí Isabella</span></div>
          </section>

          <section class="ihd-intro" id="colecciones">
            <div class="ihd-intro-lead"><p class="ihd-eyebrow">Nuestra selección</p><h2>Objetos con alma.<br><em>Espacios con historia.</em></h2></div>
            <p class="ihd-intro-copy">Cada pieza está pensada para sumar calidez, aroma y personalidad. Encontrá un detalle para tu casa, un regalo especial o una propuesta personalizada para tu evento.</p>
          </section>

          <section class="ihd-category-strip" aria-label="Colecciones disponibles">
            ${categories.map((item,index)=>`<article data-reveal><span>${String(index+1).padStart(2,'0')}</span><i aria-hidden="true">${item.icon}</i><h3>${item.title}</h3><p>${item.copy}</p><a href="#catalogo" data-category-link="${esc(item.key)}">Ver colección <b>↗</b></a></article>`).join('')}
          </section>

          <section class="ihd-catalog" id="catalogo">
            <div class="ihd-section-head">
              <div><p class="ihd-eyebrow">Elegidos para vos</p><h2>Catálogo <em>Isabella</em></h2></div>
              <p>${products.length ? 'Explorá las piezas disponibles. Abrí cada producto para conocer sus detalles y consultarnos directamente.' : 'Estamos preparando la selección online. Mientras tanto, podés ver las novedades y consultar disponibilidad por WhatsApp.'}</p>
            </div>
            ${products.length ? `
              <div class="ihd-catalog-tools"><strong id="ihdProductCount">${products.length} ${products.length===1?'producto':'productos'}</strong><div id="ihdFilters"><button class="is-active" type="button" data-filter="Todos">Todos</button>${[...new Set(products.map(item=>item.category || 'Otros'))].map(item=>`<button type="button" data-filter="${esc(item)}">${esc(item)}</button>`).join('')}</div></div>
              <div class="ihd-products" id="ihdProducts">${products.map(productCard).join('')}</div>
            ` : emptyCatalog()}
          </section>

          <section class="ihd-story" id="historia">
            <div class="ihd-story-visual"><img src="${HERO}" alt="Texturas cálidas y objetos de decoración"><span>Calma · Calidez · Esencia</span></div>
            <div class="ihd-story-copy"><p class="ihd-eyebrow">Nuestra esencia</p><h2>La belleza vive en los <em>pequeños detalles.</em></h2><p>Isabella nace del amor por los ambientes cálidos, los aromas que despiertan recuerdos y los objetos que convierten una casa en hogar.</p><p>Elegimos una estética natural y cercana, con piezas para disfrutar todos los días o regalar en momentos que merecen ser recordados.</p><a class="ihd-text-link" href="${esc(instagram)}" target="_blank" rel="noopener">Conocenos en Instagram <span>↗</span></a></div>
          </section>

          <section class="ihd-souvenirs" id="souvenirs">
            <div class="ihd-souvenirs-copy"><p class="ihd-eyebrow">Celebraciones especiales</p><h2>Souvenirs hechos para <em>tu momento.</em></h2><p>Propuestas personalizadas para cumpleaños, 15 años, bautismos, baby showers, casamientos y otras celebraciones.</p><a class="ihd-btn ihd-btn-light" href="${esc(waUrl('Hola Isabella, quisiera consultar por souvenirs personalizados para un evento.'))}" target="_blank" rel="noopener">Consultar mi evento</a></div>
            <div class="ihd-order-notes"><article><span>01</span><div><strong>Reserva anticipada</strong><p>Recomendamos encargar con al menos 20 días para diseñar cada detalle con tiempo.</p></div></article><article><span>02</span><div><strong>Seña del 50%</strong><p>La fecha y el pedido quedan confirmados con una seña inicial.</p></div></article><article><span>03</span><div><strong>Urgencias</strong><p>Consultá el stock disponible y vemos juntas la mejor opción.</p></div></article></div>
          </section>

          <section class="ihd-contact">
            <p class="ihd-eyebrow">¿Buscás algo especial?</p><h2>Contanos tu idea.<br><em>La hacemos parte de Isabella.</em></h2><div><a class="ihd-btn ihd-btn-dark" href="${esc(genericWa)}" target="_blank" rel="noopener">Escribir por WhatsApp</a><a class="ihd-btn ihd-btn-outline" href="${esc(instagram)}" target="_blank" rel="noopener">Ver Instagram</a></div>
          </section>
        </main>

        <footer class="ihd-footer"><div class="ihd-brand ihd-brand-footer"><img class="ihd-brand-logo" src="${LOGO}" alt="Isabella Hogar & Deco"></div><div><p>Velas, aromas y detalles con amor.</p><small>Tolhuin · Tierra del Fuego · Argentina</small></div><div class="ihd-footer-links"><a href="${esc(instagram)}" target="_blank" rel="noopener">Instagram</a><a href="${esc(genericWa)}" target="_blank" rel="noopener">WhatsApp</a></div></footer>
        <a class="ihd-floating-wa" href="${esc(genericWa)}" target="_blank" rel="noopener" aria-label="Consultar por WhatsApp"><img src="/assets/icons/social-official/whatsapp.svg" alt=""><span>¿Te ayudamos?</span></a>

        <div class="ihd-modal" id="ihdProductModal" hidden><button class="ihd-modal-backdrop" type="button" data-modal-close aria-label="Cerrar"></button><section role="dialog" aria-modal="true" aria-labelledby="ihdModalTitle"><button class="ihd-modal-close" type="button" data-modal-close aria-label="Cerrar ficha">×</button><div class="ihd-modal-media"><div class="ihd-modal-gallery" id="ihdModalGallery"></div><button class="ihd-gallery-nav ihd-gallery-prev" id="ihdGalleryPrev" type="button" aria-label="Imagen anterior">‹</button><button class="ihd-gallery-nav ihd-gallery-next" id="ihdGalleryNext" type="button" aria-label="Imagen siguiente">›</button><span class="ihd-gallery-counter" id="ihdGalleryCounter" aria-live="polite">1 / 1</span></div><div class="ihd-modal-copy"><p class="ihd-eyebrow" id="ihdModalCategory"></p><h2 id="ihdModalTitle"></h2><p id="ihdModalDescription"></p><div class="ihd-modal-meta"><strong id="ihdModalPrice"></strong><span id="ihdModalAvailability"></span></div><a class="ihd-btn ihd-btn-dark" id="ihdModalContact" target="_blank" rel="noopener">Consultar este producto</a></div></section></div>
      </div>`;

    const header = root.querySelector('.ihd-header');
    const menu = root.querySelector('.ihd-menu');
    menu.addEventListener('click',()=>{const open=header.classList.toggle('menu-open');menu.setAttribute('aria-expanded',String(open));});
    root.querySelectorAll('.ihd-header nav a').forEach(link=>link.addEventListener('click',()=>{header.classList.remove('menu-open');menu.setAttribute('aria-expanded','false');}));
    window.addEventListener('scroll',()=>header.classList.toggle('is-scrolled',window.scrollY>24),{passive:true});

    const reveal = new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');reveal.unobserve(entry.target);}}),{threshold:.12});
    root.querySelectorAll('[data-reveal]').forEach(node=>reveal.observe(node));

    if(products.length) setupProducts();

    function waUrl(message){return phone ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}` : instagram;}
    function money(value){return new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(Number(value || 0));}
    function availability(value){return ({available:'Disponible',last_units:'Últimas unidades',coming_soon:'Próximamente',sold_out:'Agotado',consult_stock:'Consultar stock'}[value] || 'Disponible');}
    function mediaUrl(value){const url=String(value||'').trim();return url.startsWith('/')?url:safeUrl(url);}
    function mediaFor(product){const media=Array.isArray(product.media)?product.media.map(item=>typeof item==='string'?item:(item?.url||item?.publicUrl||item?.src||'')).filter(Boolean):[];return [...new Set([product.cover_url,...media].filter(Boolean))];}
    function productCard(product,index){const image=mediaUrl(product.cover_url)||HERO;return `<article class="ihd-product ${product.featured?'is-featured':''}" data-product-index="${index}" data-product-category="${esc(product.category||'Otros')}" tabindex="0" role="button" aria-label="Ver ${esc(product.title||'producto')}"><div class="ihd-product-image"><img src="${esc(image)}" alt="${esc(product.title||'Producto Isabella')}" loading="lazy">${product.featured?'<span>Elegido Isabella</span>':''}<i>${esc(availability(product.availability))}</i></div><div class="ihd-product-copy"><small>${esc(product.category||'Colección Isabella')}</small><h3>${esc(product.title||'Producto Isabella')}</h3><p>${esc(product.description||'Consultanos por variantes, aromas y disponibilidad.')}</p><div><strong>${product.price_mode==='price'?money(product.price):'Consultar precio'}</strong><b>Ver detalles ↗</b></div></div></article>`;}
    function emptyCatalog(){return `<div class="ihd-empty-catalog"><div><span>Próximamente</span><h3>La selección online está tomando forma.</h3><p>Seguinos para conocer nuevos ingresos o escribinos y te compartimos las opciones disponibles hoy.</p><div><a class="ihd-btn ihd-btn-dark" href="${esc(genericWa)}" target="_blank" rel="noopener">Pedir catálogo por WhatsApp</a><a class="ihd-text-link" href="${esc(instagram)}" target="_blank" rel="noopener">Ver novedades en Instagram <b>↗</b></a></div></div><aside>${categories.slice(0,4).map(item=>`<span>${item.icon}<b>${item.title}</b></span>`).join('')}</aside></div>`;}
    function setupProducts(){
      const modal=root.querySelector('#ihdProductModal'),cards=[...root.querySelectorAll('[data-product-index]')],gallery=root.querySelector('#ihdModalGallery'),previous=root.querySelector('#ihdGalleryPrev'),next=root.querySelector('#ihdGalleryNext'),counter=root.querySelector('#ihdGalleryCounter');
      let galleryIndex=0,galleryTotal=1,lastTrigger=null;
      root.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{root.querySelectorAll('[data-filter]').forEach(item=>item.classList.toggle('is-active',item===button));cards.forEach(card=>card.hidden=button.dataset.filter!=='Todos'&&card.dataset.productCategory!==button.dataset.filter);}));
      root.querySelectorAll('[data-category-link]').forEach(link=>link.addEventListener('click',()=>{const target=[...root.querySelectorAll('[data-filter]')].find(button=>button.dataset.filter.toLowerCase().includes(link.dataset.categoryLink.toLowerCase()));if(target)setTimeout(()=>target.click(),250);}));
      const updateGallery=(smooth=true)=>{galleryIndex=Math.max(0,Math.min(galleryTotal-1,galleryIndex));gallery.scrollTo({left:gallery.clientWidth*galleryIndex,behavior:smooth?'smooth':'auto'});counter.textContent=`${galleryIndex+1} / ${galleryTotal}`;previous.hidden=next.hidden=galleryTotal<2;};
      const openProduct=index=>{const product=products[index],images=mediaFor(product),slides=images.length?images:[HERO];gallery.innerHTML=slides.map((url,i)=>`<img src="${esc(mediaUrl(url)||HERO)}" alt="${esc(product.title)}${i?` · imagen ${i+1}`:''}">`).join('');galleryIndex=0;galleryTotal=slides.length;root.querySelector('#ihdModalCategory').textContent=product.category||'Colección Isabella';root.querySelector('#ihdModalTitle').textContent=product.title||'Producto Isabella';root.querySelector('#ihdModalDescription').textContent=product.description||'Consultanos para conocer variantes, aromas y disponibilidad.';root.querySelector('#ihdModalPrice').textContent=product.price_mode==='price'?money(product.price):'Consultar precio';root.querySelector('#ihdModalAvailability').textContent=availability(product.availability);root.querySelector('#ihdModalContact').href=waUrl(`Hola Isabella, quisiera consultar por ${product.title}.`);modal.hidden=false;document.body.classList.add('ihd-modal-open');requestAnimationFrame(()=>{updateGallery(false);modal.querySelector('.ihd-modal-close').focus();});};
      const closeModal=()=>{modal.hidden=true;document.body.classList.remove('ihd-modal-open');if(lastTrigger)lastTrigger.focus();};
      previous.addEventListener('click',()=>{galleryIndex=(galleryIndex-1+galleryTotal)%galleryTotal;updateGallery();});
      next.addEventListener('click',()=>{galleryIndex=(galleryIndex+1)%galleryTotal;updateGallery();});
      gallery.addEventListener('scroll',()=>{if(!gallery.clientWidth)return;const index=Math.round(gallery.scrollLeft/gallery.clientWidth);if(index!==galleryIndex){galleryIndex=index;counter.textContent=`${galleryIndex+1} / ${galleryTotal}`;}},{passive:true});
      cards.forEach(card=>{const open=()=>{lastTrigger=card;openProduct(Number(card.dataset.productIndex));};card.addEventListener('click',open);card.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();open();}});});
      root.querySelectorAll('[data-modal-close]').forEach(button=>button.addEventListener('click',closeModal));
      document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!modal.hidden)closeModal();});
    }
  };
})();
