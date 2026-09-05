(() => {
  'use strict';

  const whatsapp = '5492964652318';
  const categories = [
    {
      key: 'express',
      name: 'CV Express',
      price: '$5.500',
      description: 'Una renovación rápida para ordenar y mejorar la presentación de un CV existente mediante un diseño prediseñado.',
      includes: [
        'Organización de la información proporcionada.',
        'Adaptación al diseño prediseñado elegido.',
        'Corrección ortográfica general.',
        'Distribución clara de las secciones principales.',
        'Entrega final en formato PDF listo para enviar.'
      ]
    },
    {
      key: 'basico',
      name: 'CV Básico',
      price: '$6.500',
      description: 'Mejora la presentación y el contenido principal con una estructura más completa y un diseño moderno.',
      includes: [
        'Revisión general del contenido existente.',
        'Mejora del perfil profesional y textos principales.',
        'Organización de experiencia, formación y habilidades.',
        'Adaptación al modelo seleccionado.',
        'Corrección ortográfica y de presentación.',
        'Entrega final en formato PDF.'
      ]
    },
    {
      key: 'estandar',
      name: 'CV Estándar',
      price: '$7.500',
      description: 'Una opción más desarrollada, con redacción integral, mejor jerarquía de la información y enfoque profesional.',
      includes: [
        'Revisión completa de la información.',
        'Redacción y optimización del perfil profesional.',
        'Mejora de experiencias, funciones y habilidades.',
        'Organización estratégica del contenido.',
        'Estructura preparada para una lectura ATS más clara.',
        'Diseño prediseñado y entrega final en PDF.'
      ]
    },
    {
      key: 'avanzado',
      name: 'CV Avanzado',
      price: '$10.500',
      description: 'Desarrollo estratégico con diseño premium, mayor profundidad de contenido y recursos profesionales adicionales.',
      includes: [
        'Evaluación completa del CV y del objetivo laboral.',
        'Redacción profesional en primera persona.',
        'Optimización del perfil y las experiencias laborales.',
        'Palabras clave y estructura optimizada para ATS.',
        'Habilidades y competencias presentadas por separado.',
        'Código QR de LinkedIn cuando corresponda.',
        'Elección entre dos diseños premium y entrega en PDF.'
      ]
    },
    {
      key: 'profesional',
      name: 'CV Profesional Personalizado',
      price: '$11.500',
      description: 'Un currículum desarrollado desde cero y completamente a medida según la experiencia, el sector y el objetivo laboral.',
      includes: [
        'Evaluación detallada de la trayectoria profesional.',
        'Definición del enfoque y objetivo laboral.',
        'Redacción estratégica de todas las secciones.',
        'Optimización integral para sistemas ATS.',
        'Diseño exclusivo y personalizado, sin plantilla fija.',
        'Selección de colores, secciones y recursos visuales.',
        'QR de LinkedIn y propuesta de valor cuando corresponda.',
        'Entrega final en PDF lista para postulaciones.'
      ]
    }
  ];

  const models = [
    { code:'EXP-01', category:'express', title:'Clásico Azul Claro', image:'/assets/cv-disponibles/exp-01.webp', description:'Dos columnas, encabezados azules y lectura directa.', details:['Contacto y herramientas en columna lateral.','Experiencia y formación con espacio amplio.','Estilo limpio para perfiles generales y operativos.'] },
    { code:'EXP-02', category:'express', title:'Azul Ejecutivo', image:'/assets/cv-disponibles/exp-02.webp', description:'Columna lateral azul oscuro y presentación corporativa.', details:['Perfil y contacto destacados.','Experiencia organizada en el área principal.','Ideal para administración, logística y comercio.'] },
    { code:'EXP-03', category:'express', title:'Rosa Profesional', image:'/assets/cv-disponibles/exp-03.webp', description:'Diseño cálido, moderno y ordenado en dos columnas.', details:['Paleta rosa suave.','Secciones fáciles de localizar.','Recomendado para atención, salud, estética y servicios.'] },
    { code:'EXP-04', category:'express', title:'Bordó Ejecutivo', image:'/assets/cv-disponibles/exp-04.webp', description:'Diseño sobrio con columna bordó y tipografía amplia.', details:['Presencia seria y contemporánea.','Datos personales agrupados.','Adecuado para áreas comerciales y administrativas.'] },
    { code:'BAS-01', category:'basico', title:'Rosa Minimalista', image:'/assets/cv-disponibles/bas-01.webp', description:'Formato moderno con títulos amplios y paleta neutra.', details:['Secciones claramente diferenciadas.','Espacio para herramientas y habilidades.','Ideal para comercio, recepción y atención al público.'] },
    { code:'BAS-02', category:'basico', title:'Azul Petróleo', image:'/assets/cv-disponibles/bas-02.webp', description:'Alternativa formal con estructura sólida y equilibrada.', details:['Contraste profesional.','Experiencia laboral protagonista.','Recomendado para perfiles técnicos y administrativos.'] },
    { code:'BAS-03', category:'basico', title:'Salmón Dinámico', image:'/assets/cv-disponibles/bas-03.webp', description:'Recorrido visual moderno con estilo de línea de tiempo.', details:['Distribución dinámica de las secciones.','Paleta clara y actual.','Apropiado para perfiles jóvenes, creativos y de servicios.'] },
    { code:'EST-01', category:'estandar', title:'Azul Curvo', image:'/assets/cv-disponibles/est-01.webp', description:'Encabezado curvo y distribución completa de la información.', details:['Espacio para perfil, experiencia e idiomas.','Alta legibilidad.','Útil para administración, ventas y perfiles polivalentes.'] },
    { code:'EST-02', category:'estandar', title:'Azul Geométrico', image:'/assets/cv-disponibles/est-02.webp', description:'Bloques geométricos con fuerte jerarquía visual.', details:['Formación y habilidades destacadas.','Contenido organizado por relevancia.','Ideal para perfiles técnicos y corporativos.'] },
    { code:'EST-03', category:'estandar', title:'Gris Ejecutivo', image:'/assets/cv-disponibles/est-03.webp', description:'Diseño sobrio para transmitir experiencia y estabilidad.', details:['Estilo formal y atemporal.','Columna lateral con información complementaria.','Recomendado para gestión y perfiles con trayectoria.'] },
    { code:'EST-04', category:'estandar', title:'Azul Corporativo', image:'/assets/cv-disponibles/est-04.webp', description:'Estructura compacta con indicadores y certificaciones.', details:['Espacio específico para certificaciones.','Habilidades organizadas visualmente.','Adecuado para industria, tecnología y logística.'] },
    { code:'AVA-01', category:'avanzado', title:'Negro Premium', image:'/assets/cv-disponibles/ava-01.webp', description:'Alto contraste, QR de LinkedIn y contenido ampliado.', details:['Habilidades y competencias diferenciadas.','Espacio para idiomas y formación.','Recomendado para perfiles digitales y especializados.'] },
    { code:'AVA-02', category:'avanzado', title:'Gris Premium', image:'/assets/cv-disponibles/ava-02.webp', description:'Modelo ejecutivo con bloques amplios y lectura ordenada.', details:['QR de LinkedIn integrado.','Competencias y habilidades por separado.','Ideal para administración, liderazgo y perfiles senior.'] },
    { code:'PRO-01', category:'profesional', title:'Ejemplo de CV personalizado', image:'/assets/cv-disponibles/pro-01.webp', description:'Referencia de un diseño creado completamente a medida.', details:['No está limitado a una plantilla fija.','Contenido, estructura y colores adaptados al cliente.','Puede incorporar propuesta de valor, gráficos y QR.'] }
  ];

  const sectionRoot = document.getElementById('categorySections');
  const waLink = (model, category) => `https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hola CVStudio, quiero solicitar el modelo ${model.code} — ${category.name} de ${category.price}. ¿Cómo puedo comenzar?`)}`;

  sectionRoot.innerHTML = categories.map((category) => {
    const categoryModels = models.filter((model) => model.category === category.key);
    const includes = category.includes.map((item) => `<li>${item}</li>`).join('');
    const cards = categoryModels.map((model) => {
      const details = model.details.map((item) => `<li>${item}</li>`).join('');
      return `<article class="model-card">
        <a class="model-image" href="${model.image}" target="_blank" rel="noopener noreferrer" aria-label="Abrir imagen completa del modelo ${model.code}">
          <img src="${model.image}" alt="Modelo ${model.code}: ${model.title}" width="1414" height="2000" loading="lazy" decoding="async">
        </a>
        <div class="model-content">
          <div class="model-meta"><span>${model.code}</span><strong>${category.price}</strong></div>
          <h3>${model.title}</h3>
          <p>${model.description}</p>
          <ul>${details}</ul>
          <a class="model-request" href="${waLink(model, category)}" target="_blank" rel="noopener noreferrer">Solicitar este modelo</a>
        </div>
      </article>`;
    }).join('');

    return `<section class="category-block" id="${category.key}" aria-labelledby="${category.key}-title">
      <div class="category-header">
        <div class="category-title-row">
          <div><span>${categoryModels.length} ${categoryModels.length === 1 ? 'modelo disponible' : 'modelos disponibles'}</span><h2 id="${category.key}-title">${category.name}</h2></div>
          <strong class="category-price">${category.price}</strong>
        </div>
        <p>${category.description}</p>
        <div class="category-includes"><h3>Este servicio incluye:</h3><ul>${includes}</ul></div>
      </div>
      <div class="models-grid">${cards}</div>
    </section>`;
  }).join('');
})();
