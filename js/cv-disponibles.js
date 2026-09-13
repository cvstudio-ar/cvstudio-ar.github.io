(() => {
  'use strict';

  const whatsapp = '5492964652318';

  const categories = [
    {
      key: 'express', name: 'CV Express', price: '$6.000',
      description: 'Una opción ágil para renovar y ordenar un currículum existente con un diseño prediseñado.',
      band: [['clock','Entrega estimada: 1 hora*'],['layout','Diseño y color predeterminados'],['pen','Corrección y mejora básica'],['pdf','Entrega final en PDF']],
      benefits: ['Diseño prediseñado de una página.','Reorganización del contenido principal.','Corrección ortográfica y mejora básica de redacción.','Presentación clara y profesional.','Archivo final listo para enviar.']
    },
    {
      key: 'basico', name: 'CV Básico', price: '$6.500',
      description: 'Una presentación moderna y organizada, con mejoras en los textos principales y mayor personalización.',
      band: [['clock','Entrega estimada: 1 hora*'],['palette','Personalización de colores'],['pen','Redacción y corrección general'],['pdf','Entrega final en PDF']],
      benefits: ['Diseño profesional de una página.','Organización de experiencia y formación.','Mejora del perfil y los textos principales.','Incorporación de habilidades y conocimientos.','Adaptación para perfiles con o sin experiencia.']
    },
    {
      key: 'estandar', name: 'CV Estándar', price: '$7.500',
      description: 'Redacción profesional, contenido mejor desarrollado y una estructura estratégica para destacar el perfil.',
      band: [['clock','Entrega estimada: 1 hora*'],['palette','Personalización de colores'],['pen','Redacción profesional'],['ats','Optimización ATS básica']],
      benefits: ['Diseño completo de una página.','Organización estratégica del contenido.','Desarrollo de experiencias laborales.','Habilidades, conocimientos y formación.','Entrega final en formato PDF.']
    },
    {
      key: 'avanzado', name: 'CV Avanzado', price: '$10.500',
      description: 'Una propuesta más completa, con diseño premium, redacción optimizada y recursos profesionales adicionales.',
      band: [['clock','Entrega estimada: 1 hora*'],['palette','Diseño premium personalizable'],['ats','Optimización para sistemas ATS'],['qr','QR para LinkedIn']],
      benefits: ['Redacción profesional optimizada.','Desarrollo detallado de las experiencias.','Organización de habilidades y competencias.','Incorporación de idiomas, formación y cursos.','Entrega final en formato PDF.']
    },
    {
      key: 'profesional', name: 'CV Profesional', price: '$12.500',
      description: 'Un currículum exclusivo, desarrollado desde cero según tu trayectoria, sector y objetivo laboral.',
      band: [['clock','Entrega estimada: 1 hora*'],['palette','Diseño completamente personalizado'],['ats','Optimización ATS avanzada'],['qr','QR para LinkedIn']],
      benefits: ['Análisis integral de la información.','Redacción profesional completa.','Estructura y colores definidos a medida.','Selección de habilidades y palabras clave.','Adaptación al sector y al objetivo laboral.','Entrega final en formato PDF.']
    }
  ];

  const models = [
    { code:'EXP-01', category:'express', title:'Azul Ejecutivo', image:'/assets/cv-disponibles/exp-01.webp', description:'Diseño sobrio en azul oscuro, con estructura de dos columnas y lectura directa.' },
    { code:'EXP-02', category:'express', title:'Bordó Elegante', image:'/assets/cv-disponibles/exp-02.webp', description:'La misma estructura ágil en una presentación bordó cálida y profesional.' },
    { code:'BAS-01', category:'basico', title:'Azul Corporativo', image:'/assets/cv-disponibles/bas-01.webp', description:'Encabezado protagonista, bloques claros y una distribución equilibrada del contenido.' },
    { code:'BAS-02', category:'basico', title:'Bordó Corporativo', image:'/assets/cv-disponibles/bas-02.webp', description:'Una alternativa formal y moderna con excelente jerarquía visual.' },
    { code:'BAS-03', category:'basico', title:'Rosa Primer Empleo', image:'/assets/cv-disponibles/bas-03.webp', description:'Ejemplo adaptado para destacar formación, herramientas y habilidades sin experiencia laboral.' },
    { code:'BAS-04', category:'basico', title:'Rosa Ejecutivo', image:'/assets/cv-disponibles/bas-04.webp', description:'Diseño elegante de dos columnas que permite presentar una trayectoria completa.' },
    { code:'EST-01', category:'estandar', title:'Azul Dinámico', image:'/assets/cv-disponibles/est-01.webp', description:'Encabezado curvo y distribución amplia para mostrar experiencia, formación y conocimientos.' },
    { code:'EST-02', category:'estandar', title:'Gris Minimalista', image:'/assets/cv-disponibles/est-02.webp', description:'Estética sobria y atemporal con bloques definidos y lectura ordenada.' },
    { code:'AVA-01', category:'avanzado', title:'Azul Creativo', image:'/assets/cv-disponibles/ava-01.webp', description:'Composición moderna con alto contraste y espacio para información complementaria.' },
    { code:'AVA-02', category:'avanzado', title:'Azul Ejecutivo', image:'/assets/cv-disponibles/ava-02.webp', description:'Diseño corporativo con jerarquías marcadas, certificaciones e idiomas.' },
    { code:'AVA-03', category:'avanzado', title:'Negro Premium', image:'/assets/cv-disponibles/ava-03.webp', description:'Alto contraste, gran presencia visual y código QR para complementar el perfil.' },
    { code:'AVA-04', category:'avanzado', title:'Gris Corporativo', image:'/assets/cv-disponibles/ava-04.webp', description:'Estructura ejecutiva con competencias, habilidades y trayectoria bien diferenciadas.' },
    { code:'PRO-01', category:'profesional', title:'Profesional Premium', image:'/assets/cv-disponibles/pro-01.webp', description:'Referencia de un diseño exclusivo creado a medida según el perfil y el objetivo laboral.' }
  ];

  const elements = {
    tabs: document.getElementById('categoryTabs'), image: document.getElementById('modelImage'),
    previousImage: document.getElementById('previousImage'), nextImage: document.getElementById('nextImage'),
    code: document.getElementById('modelCode'), category: document.getElementById('modelCategory'),
    title: document.getElementById('modelTitle'), price: document.getElementById('modelPrice'),
    description: document.getElementById('modelDescription'), band: document.getElementById('serviceBand'),
    benefits: document.getElementById('modelBenefits'), request: document.getElementById('requestModel'),
    counter: document.getElementById('modelCounter'), dots: document.getElementById('carouselDots'),
    previous: document.getElementById('previousModel'), next: document.getElementById('nextModel'),
    previousPreview: document.getElementById('previousPreview'), nextPreview: document.getElementById('nextPreview'),
    openImage: document.getElementById('openModelImage'), viewFull: document.getElementById('viewFullModel'),
    dialog: document.getElementById('modelDialog'), dialogImage: document.getElementById('dialogImage'),
    dialogTitle: document.getElementById('dialogTitle'), dialogSubtitle: document.getElementById('dialogSubtitle'),
    closeDialog: document.getElementById('closeModelDialog'), featured: document.getElementById('featuredModel')
  };

  const serviceIcons = {
    clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v5l3.5 2"/></svg>',
    layout: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 4v16M9 9h11"/></svg>',
    palette: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5a8.5 8.5 0 1 0 0 17h1.2a1.7 1.7 0 0 0 0-3.4h-.8a1.9 1.9 0 0 1 0-3.8H15a5.5 5.5 0 0 0 5.5-5.5C20.5 5.1 16.5 3.5 12 3.5Z"/><circle cx="7.5" cy="10" r=".8"/><circle cx="9.5" cy="6.8" r=".8"/><circle cx="14" cy="6.5" r=".8"/><circle cx="17" cy="9" r=".8"/></svg>',
    pen: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 19 3.6-.8L19 7.8 16.2 5 5.8 15.4 5 19Z"/><path d="m14.8 6.4 2.8 2.8M5.8 15.4l2.8 2.8"/></svg>',
    pdf: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3.5h7l4 4V20H7Z"/><path d="M14 3.5V8h4M9.2 15.8v-4h1.4a1.2 1.2 0 1 1 0 2.4H9.2m4.1 1.6v-4h1.1c1.5 0 2.3.8 2.3 2s-.8 2-2.3 2Z"/></svg>',
    ats: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5 19 6v5.3c0 4.1-2.9 7.5-7 9.2-4.1-1.7-7-5.1-7-9.2V6Z"/><path d="m8.5 12 2.2 2.2 4.8-5"/></svg>',
    qr: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h6v6H4Zm10 0h6v6h-6ZM4 14h6v6H4Zm11 0h2v2h-2Zm3 0h2v4h-2Zm-4 4h4v2h-4Z"/></svg>'
  };

  const categoryByKey = new Map(categories.map((category) => [category.key, category]));
  const hashCode = window.location.hash.replace('#','').toUpperCase();
  let currentIndex = Math.max(0, models.findIndex((model) => model.code === hashCode));
  let touchStartX = 0;
  let touchStartY = 0;

  const requestLink = (model, category) => {
    const message = `Hola CVStudio, quiero solicitar el modelo ${model.code} — ${category.name} de ${category.price}. ¿Cómo puedo comenzar?`;
    return `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`;
  };

  const createTabs = () => {
    elements.tabs.innerHTML = categories.map((category) => `<button class="category-tab" type="button" role="tab" data-category="${category.key}" aria-selected="false"><span>${category.name.replace('CV ','')}</span><strong>${category.price}</strong></button>`).join('');
    elements.tabs.querySelectorAll('.category-tab').forEach((button) => {
      button.addEventListener('click', () => {
        const index = models.findIndex((model) => model.category === button.dataset.category);
        if (index >= 0) showModel(index);
      });
    });
  };

  const createDots = () => {
    elements.dots.innerHTML = models.map((model, index) => `<button class="carousel-dot" type="button" data-index="${index}" aria-label="Ver ${model.code}"></button>`).join('');
    elements.dots.querySelectorAll('.carousel-dot').forEach((dot) => dot.addEventListener('click', () => showModel(Number(dot.dataset.index))));
  };

  const openDialog = () => {
    const model = models[currentIndex];
    const category = categoryByKey.get(model.category);
    elements.dialogImage.src = model.image;
    elements.dialogImage.alt = `Vista completa del modelo ${model.code}: ${model.title}`;
    elements.dialogTitle.textContent = `${model.code} — ${model.title}`;
    elements.dialogSubtitle.textContent = `${category.name} · ${category.price}`;
    if (typeof elements.dialog.showModal === 'function') elements.dialog.showModal();
  };

  const showModel = (index) => {
    currentIndex = (index + models.length) % models.length;
    const model = models[currentIndex];
    const category = categoryByKey.get(model.category);
    const previousModel = models[(currentIndex - 1 + models.length) % models.length];
    const nextModel = models[(currentIndex + 1) % models.length];

    elements.image.src = model.image;
    elements.image.alt = `Modelo ${model.code}: ${model.title}`;
    elements.previousImage.src = previousModel.image;
    elements.previousImage.alt = '';
    elements.nextImage.src = nextModel.image;
    elements.nextImage.alt = '';
    elements.code.textContent = model.code;
    elements.category.textContent = category.name;
    elements.title.textContent = model.title;
    elements.price.textContent = category.price;
    elements.description.textContent = model.description;
    elements.band.innerHTML = category.band.map(([icon,label]) => `<span class="service-chip"><span class="service-icon">${serviceIcons[icon]}</span><span>${label}</span></span>`).join('');
    elements.benefits.innerHTML = category.benefits.map((benefit) => `<li>${benefit}</li>`).join('');
    elements.request.href = requestLink(model, category);
    elements.request.setAttribute('aria-label', `Solicitar ${model.code}, ${model.title}, por WhatsApp`);
    elements.counter.textContent = `${currentIndex + 1} de ${models.length}`;
    elements.previousPreview.setAttribute('aria-label', `Ver modelo anterior: ${previousModel.code}`);
    elements.nextPreview.setAttribute('aria-label', `Ver modelo siguiente: ${nextModel.code}`);

    elements.tabs.querySelectorAll('.category-tab').forEach((tab) => {
      const active = tab.dataset.category === model.category;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
      if (active) {
        const targetLeft = tab.offsetLeft - ((elements.tabs.clientWidth - tab.offsetWidth) / 2);
        elements.tabs.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' });
      }
    });
    elements.dots.querySelectorAll('.carousel-dot').forEach((dot, dotIndex) => {
      const active = dotIndex === currentIndex;
      dot.classList.toggle('is-active', active);
      dot.setAttribute('aria-current', active ? 'true' : 'false');
    });

    if (window.history?.replaceState) window.history.replaceState(null, '', `#${model.code.toLowerCase()}`);
    elements.featured.classList.remove('is-changing');
    requestAnimationFrame(() => {
      elements.featured.classList.add('is-changing');
      window.setTimeout(() => elements.featured.classList.remove('is-changing'), 260);
    });
    [previousModel.image,nextModel.image].forEach((src) => { const preload = new Image(); preload.src = src; });
  };

  const move = (direction) => showModel(currentIndex + direction);

  createTabs();
  createDots();
  showModel(currentIndex);

  elements.previous.addEventListener('click', () => move(-1));
  elements.next.addEventListener('click', () => move(1));
  elements.previousPreview.addEventListener('click', () => move(-1));
  elements.nextPreview.addEventListener('click', () => move(1));
  elements.openImage.addEventListener('click', openDialog);
  elements.viewFull.addEventListener('click', openDialog);
  elements.closeDialog.addEventListener('click', () => elements.dialog.close());
  elements.dialog.addEventListener('click', (event) => { if (event.target === elements.dialog) elements.dialog.close(); });

  document.addEventListener('keydown', (event) => {
    if (elements.dialog.open) return;
    if (event.key === 'ArrowLeft') move(-1);
    if (event.key === 'ArrowRight') move(1);
  });

  elements.featured.addEventListener('touchstart', (event) => {
    touchStartX = event.changedTouches[0].clientX;
    touchStartY = event.changedTouches[0].clientY;
  }, { passive:true });
  elements.featured.addEventListener('touchend', (event) => {
    const deltaX = event.changedTouches[0].clientX - touchStartX;
    const deltaY = event.changedTouches[0].clientY - touchStartY;
    if (Math.abs(deltaX) > 55 && Math.abs(deltaX) > Math.abs(deltaY)) move(deltaX > 0 ? -1 : 1);
  }, { passive:true });
})();
