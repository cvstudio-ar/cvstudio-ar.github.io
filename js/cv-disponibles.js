(() => {
  'use strict';
  const whatsapp = '5492964652318';
  const categories = {
    express: { name:'CV Express', price:'$5.500', summary:'Renovación visual rápida con un modelo prediseñado y organización clara de la información.', count:4 },
    basico: { name:'CV Básico', price:'$6.500', summary:'Diseño moderno, mejor presentación del contenido y una estructura lista para postularse.', count:3 },
    estandar: { name:'CV Estándar', price:'$7.500', summary:'Redacción integral, jerarquía profesional y optimización del contenido para sistemas ATS.', count:4 },
    avanzado: { name:'CV Avanzado', price:'$10.500', summary:'Desarrollo estratégico, diseño premium y secciones ampliadas según el perfil profesional.', count:2 },
    profesional: { name:'CV Profesional', price:'$11.500', summary:'Propuesta creada a medida desde cero, con estrategia, identidad visual y optimización ATS.', count:1 }
  };
  const models = [
    {code:'EXP-01',category:'express',title:'Clásico Azul Claro',image:'/assets/cv-disponibles/exp-01.webp',description:'Diseño limpio de dos columnas con encabezados azules y una lectura directa. Mantiene la información ordenada sin recargar la página.',details:['Distribución equilibrada en dos columnas.','Contacto, herramientas e idiomas bien visibles.','Recomendado para perfiles generales, operativos o de primer empleo.']},
    {code:'EXP-02',category:'express',title:'Azul Ejecutivo',image:'/assets/cv-disponibles/exp-02.webp',description:'Modelo sobrio con columna lateral azul oscuro y área principal amplia. Su contraste ayuda a localizar rápidamente los datos importantes.',details:['Estética formal y corporativa.','Perfil, experiencia y formación con jerarquía clara.','Ideal para administración, logística, comercio y servicios.']},
    {code:'EXP-03',category:'express',title:'Rosa Profesional',image:'/assets/cv-disponibles/exp-03.webp',description:'Versión cálida y moderna del formato de dos columnas. Combina una presentación amable con una estructura clara y profesional.',details:['Paleta rosa suave con buen contraste.','Bloques fáciles de identificar.','Sugerido para atención al cliente, salud, estética y servicios.']},
    {code:'EXP-04',category:'express',title:'Bordó Ejecutivo',image:'/assets/cv-disponibles/exp-04.webp',description:'Diseño de presencia marcada con columna lateral bordó, tipografía amplia y distribución compacta para destacar la trayectoria.',details:['Imagen seria y contemporánea.','Información personal agrupada en la columna lateral.','Adecuado para perfiles comerciales, administrativos y profesionales.']},
    {code:'BAS-01',category:'basico',title:'Rosa Minimalista',image:'/assets/cv-disponibles/bas-01.webp',description:'Modelo horizontal con títulos amplios y una paleta rosa neutra. Ofrece más desarrollo de contenido sin perder claridad visual.',details:['Encabezado protagonista y secciones diferenciadas.','Espacio para herramientas, habilidades y formación.','Ideal para diseño, comercio, recepción y atención al público.']},
    {code:'BAS-02',category:'basico',title:'Azul Petróleo',image:'/assets/cv-disponibles/bas-02.webp',description:'Alternativa corporativa del formato horizontal, con azul petróleo y una estructura sólida para perfiles que buscan mayor formalidad.',details:['Contraste profesional y lectura fluida.','Experiencia laboral con espacio destacado.','Recomendado para áreas técnicas, administrativas y operativas.']},
    {code:'BAS-03',category:'basico',title:'Salmón Dinámico',image:'/assets/cv-disponibles/bas-03.webp',description:'Diseño moderno con recorrido visual tipo línea de tiempo. Organiza contacto, herramientas, habilidades y experiencia de manera dinámica.',details:['Secciones conectadas visualmente.','Paleta clara y moderna.','Apropiado para perfiles jóvenes, creativos y de servicios.']},
    {code:'EST-01',category:'estandar',title:'Azul Curvo',image:'/assets/cv-disponibles/est-01.webp',description:'Modelo profesional con encabezado curvo, alta legibilidad y espacio para perfil, idiomas e información adicional.',details:['Redacción integral y jerarquía reforzada.','Distribución completa sin sobrecarga visual.','Útil para administración, ventas y perfiles polivalentes.']},
    {code:'EST-02',category:'estandar',title:'Azul Geométrico',image:'/assets/cv-disponibles/est-02.webp',description:'Composición moderna con bloques geométricos y zonas de lectura bien separadas. Destaca formación, experiencia y competencias.',details:['Estructura visual de alto impacto.','Contenido organizado por relevancia.','Ideal para perfiles técnicos, corporativos y profesionales.']},
    {code:'EST-03',category:'estandar',title:'Gris Ejecutivo',image:'/assets/cv-disponibles/est-03.webp',description:'Propuesta sobria en escala de grises, pensada para transmitir experiencia, estabilidad y una imagen ejecutiva.',details:['Diseño formal y atemporal.','Columna lateral para formación, habilidades e idiomas.','Recomendado para supervisión, gestión y perfiles con trayectoria.']},
    {code:'EST-04',category:'estandar',title:'Azul Corporativo',image:'/assets/cv-disponibles/est-04.webp',description:'Modelo estructurado con indicadores visuales, certificaciones y secciones compactas. Permite presentar información técnica con claridad.',details:['Espacio específico para certificaciones.','Habilidades organizadas con guía visual.','Adecuado para industria, tecnología, administración y logística.']},
    {code:'AVA-01',category:'avanzado',title:'Negro Premium',image:'/assets/cv-disponibles/ava-01.webp',description:'Diseño premium de alto contraste con QR de LinkedIn y separación entre habilidades y competencias. Su estructura permite desarrollar un perfil más completo.',details:['QR de LinkedIn integrado.','Habilidades, competencias e idiomas diferenciados.','Recomendado para perfiles corporativos, digitales y especializados.']},
    {code:'AVA-02',category:'avanzado',title:'Gris Premium',image:'/assets/cv-disponibles/ava-02.webp',description:'Modelo ejecutivo con bloques amplios, QR de LinkedIn y lectura ordenada. Combina sobriedad con un desarrollo estratégico del contenido.',details:['Secciones profesionales de alta claridad.','Competencias y habilidades separadas.','Ideal para administración, gestión, liderazgo y perfiles senior.']},
    {code:'PRO-01',category:'profesional',title:'Profesional Personalizado',image:'/assets/cv-disponibles/pro-01.webp',description:'Ejemplo de referencia de un CV desarrollado completamente a medida. La estructura, los colores y la estrategia se crean según el sector y objetivo de cada cliente.',details:['Diseño 100 % personalizado, no limitado a una plantilla.','Redacción estratégica y optimización ATS.','Propuesta de valor, recursos visuales y QR de LinkedIn según necesidad.']}
  ];
  const summary = document.getElementById('categorySummary');
  const filters = document.getElementById('catalogFilters');
  const grid = document.getElementById('catalogGrid');
  const count = document.getElementById('modelCount');
  const modal = document.getElementById('catalogModal');
  const menuButton = document.querySelector('.menu-button');
  const navigation = document.getElementById('catalog-navigation');
  let active = 'all';
  let lastTrigger = null;

  const waLink = model => `https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hola CVStudio, quiero solicitar el modelo ${model.code} — ${categories[model.category].name} de ${categories[model.category].price}. ¿Cómo puedo comenzar?`)}`;
  const renderSummary = () => {
    summary.innerHTML = Object.entries(categories).map(([key,item]) => `<article class="category-summary"><span>${item.count} ${item.count === 1 ? 'modelo' : 'modelos'}</span><h3>${item.name}</h3><strong>${item.price}</strong><p>${item.summary}</p><a href="#catalogo" data-filter-link="${key}">Ver diseños →</a></article>`).join('');
  };
  const renderFilters = () => {
    const entries = [['all',{name:'Todos',count:models.length}],...Object.entries(categories)];
    filters.innerHTML = entries.map(([key,item]) => `<button type="button" class="catalog-filter ${key === active ? 'is-active' : ''}" data-filter="${key}" aria-pressed="${key === active}">${item.name} · ${item.count}</button>`).join('');
  };
  const renderModels = () => {
    const visible = active === 'all' ? models : models.filter(model => model.category === active);
    count.textContent = `${visible.length} ${visible.length === 1 ? 'modelo disponible' : 'modelos disponibles'}`;
    grid.innerHTML = visible.map(model => { const cat=categories[model.category]; return `<article class="catalog-card"><div class="catalog-card-media" data-label="${model.code} · ${cat.name} · ${cat.price}"><img src="${model.image}" alt="Vista del modelo ${model.code}, ${model.title}" width="1414" height="2000" loading="lazy" decoding="async"><button class="catalog-card-open" type="button" data-model="${model.code}" aria-label="Ver el modelo ${model.code} ampliado"><span>Ver diseño completo</span></button></div><div class="catalog-card-body"><div class="catalog-card-meta"><span class="catalog-card-category">${cat.name}</span><span class="catalog-card-code">${model.code}</span></div><h3>${model.title}</h3><strong class="catalog-card-price">${cat.price}</strong><p>${model.description}</p><div class="catalog-card-actions"><a class="button button-primary" href="${waLink(model)}" target="_blank" rel="noopener noreferrer" data-model-request="${model.code}">Solicitar este CV</a><button type="button" class="catalog-details-button" data-model="${model.code}" aria-label="Ver detalles de ${model.code}">＋</button></div></div></article>`; }).join('');
  };
  const setFilter = key => {
    active = key;
    renderFilters();
    renderModels();
  };
  const openModal = (code,trigger) => {
    const model=models.find(item => item.code === code); if(!model) return;
    const cat=categories[model.category]; lastTrigger=trigger;
    document.getElementById('modalImage').src=model.image;
    document.getElementById('modalImage').alt=`Vista completa del modelo ${model.code}, ${model.title}`;
    document.getElementById('modalCategory').textContent=`${cat.name} · ${model.code}`;
    document.getElementById('modalTitle').textContent=model.title;
    document.getElementById('modalPrice').textContent=cat.price;
    document.getElementById('modalDescription').textContent=model.description;
    document.getElementById('modalDetails').innerHTML=model.details.map(detail => `<li>${detail}</li>`).join('');
    document.getElementById('modalWhatsapp').href=waLink(model);
    modal.hidden=false; document.body.classList.add('catalog-modal-open');
    modal.querySelector('.catalog-modal-close').focus();
  };
  const closeModal = () => { modal.hidden=true; document.body.classList.remove('catalog-modal-open'); if(lastTrigger) lastTrigger.focus(); };
  document.addEventListener('click', event => {
    const filter=event.target.closest('[data-filter]'); if(filter) setFilter(filter.dataset.filter);
    const summaryLink=event.target.closest('[data-filter-link]'); if(summaryLink) setFilter(summaryLink.dataset.filterLink);
    const modelButton=event.target.closest('[data-model]'); if(modelButton) openModal(modelButton.dataset.model,modelButton);
    if(event.target.closest('[data-modal-close]')) closeModal();
  });
  document.addEventListener('keydown', event => { if(event.key === 'Escape' && !modal.hidden) closeModal(); });
  if(menuButton && navigation){ menuButton.addEventListener('click',()=>{ const open=navigation.classList.toggle('is-open'); menuButton.setAttribute('aria-expanded',String(open)); document.body.classList.toggle('menu-open',open); }); navigation.addEventListener('click',()=>{navigation.classList.remove('is-open');menuButton.setAttribute('aria-expanded','false');document.body.classList.remove('menu-open');}); }
  renderSummary(); renderFilters(); renderModels();
})();
