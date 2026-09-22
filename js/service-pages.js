(() => {
  'use strict';

  const whatsapp = '5492964652318';
  const services = {
    'cv-profesional': {
      kicker:'Currículum desarrollado a medida', title:'Tu experiencia merece un <span>CV profesional.</span>', price:'$12.500',
      lead:'Analizamos tu trayectoria, definimos el enfoque y desarrollamos un currículum de una página con redacción estratégica, diseño personalizado y estructura preparada para procesos de selección.',
      image:'/assets/cv-disponibles/pro-03.webp', imageClass:'', imageAlt:'Modelo Ejecutivo Premium de CV Profesional',
      trust:['Análisis integral','Optimización ATS','Diseño personalizado'],
      analyze:[['Objetivo laboral','Definimos el puesto, sector y enfoque que debe comunicar el documento.'],['Trayectoria','Ordenamos experiencias, funciones, logros, formación y conocimientos.'],['Fortalezas','Identificamos habilidades y palabras clave relevantes para el perfil.'],['Coherencia','Revisamos fechas, repeticiones, vacíos y datos que puedan generar dudas.'],['Lectura ATS','Priorizamos jerarquía, claridad y términos reconocibles por los sistemas de selección.'],['Presentación','Elegimos estructura, color y recursos visuales según la identidad profesional.']],
      includes:['Revisión completa de la información.','Perfil profesional redactado en primera persona.','Experiencias laborales desarrolladas con enfoque profesional.','Selección de habilidades, competencias y palabras clave.','Diseño personalizado de una página.','Optimización avanzada para filtros ATS.','Corrección ortográfica y de estilo.','PDF final listo para enviar.'],
      result:'Un CV claro, profesional y coherente, preparado para presentar tu verdadero valor sin información repetida ni contenido genérico.',
      process:[['01','Evaluación','Revisamos tu CV actual y el objetivo laboral.'],['02','Organización','Seleccionamos y jerarquizamos la información útil.'],['03','Desarrollo','Redactamos perfil, experiencias y competencias.'],['04','Diseño y entrega','Personalizamos el modelo y entregamos el PDF final.']],
      message:'Hola CVStudio, me interesa el CV Profesional de $12.500. Quisiera recibir información para comenzar.',
      models:true
    },
    'cv-freelance': {
      kicker:'Portfolio profesional', title:'Mostrá lo que hacés y convertí tu experiencia en una <span>propuesta de valor.</span>', price:'$15.000',
      lead:'El CV Freelance está pensado para profesionales independientes, creativos y emprendedores que necesitan presentar servicios, proyectos, herramientas y experiencia con una identidad propia.',
      image:'/assets/images/experiencia-cv-freelance-v2.webp', imageAlt:'Ejemplo de currículum freelance profesional',
      trust:['Marca personal','Proyectos destacados','Presentación profesional'],
      analyze:[['Propuesta de valor','Definimos qué ofrecés, para quién y qué te diferencia.'],['Servicios','Organizamos tus áreas de trabajo de forma clara y comercial.'],['Proyectos','Seleccionamos trabajos, clientes o resultados que demuestren experiencia.'],['Especialización','Destacamos herramientas, conocimientos, nichos y metodología.'],['Identidad','Desarrollamos una presentación visual alineada con tu actividad.'],['Confianza','Ordenamos la información para que potenciales clientes comprendan rápidamente tu valor.']],
      includes:['Perfil profesional y presentación de marca personal.','Servicios o especialidades destacadas.','Experiencia freelance y proyectos relevantes.','Herramientas, conocimientos y habilidades.','Formación, cursos e idiomas.','Diseño exclusivo adaptado a tu actividad.','Redacción profesional y corrección integral.','PDF listo para compartir con clientes y agencias.'],
      result:'Una pieza profesional que funciona como CV y portfolio breve, transmite confianza y facilita la presentación de tus servicios.',
      process:[['01','Definición','Conocemos tu actividad, público y objetivos.'],['02','Selección','Elegimos proyectos, servicios y fortalezas relevantes.'],['03','Narrativa','Construimos una presentación clara y comercial.'],['04','Diseño','Creamos el documento y preparamos su versión final.']],
      message:'Hola CVStudio, me interesa el CV Freelance de $15.000. Quisiera conocer el proceso para comenzar.'
    },
    'linkedin-profesional': {
      kicker:'Presencia profesional digital', title:'Convertimos tu LinkedIn en un perfil <span>completo y estratégico.</span>', price:'$20.000',
      lead:'Creamos u optimizamos tu perfil para comunicar con claridad tu experiencia, mejorar tu visibilidad y presentar una imagen coherente ante empresas, reclutadores y clientes.',
      image:'/assets/images/experiencia-linkedin.webp', imageAlt:'Ejemplo de perfil profesional de LinkedIn optimizado',
      trust:['Perfil completo','SEO en LinkedIn','Identidad visual'],
      analyze:[['Posicionamiento','Definimos los puestos, sectores y oportunidades a los que apunta el perfil.'],['Titular profesional','Construimos un título claro con especialidad y palabras clave.'],['Acerca de','Redactamos una presentación personal, profesional y fácil de leer.'],['Experiencias','Ordenamos funciones, logros y responsabilidades en cada puesto.'],['Visibilidad','Seleccionamos aptitudes y términos de búsqueda relevantes.'],['Imagen','Diseñamos portada y optimizamos la foto para mantener coherencia visual.']],
      includes:['Creación u optimización integral del perfil.','Título profesional y sección Acerca de.','Carga y redacción de experiencias.','Formación, cursos, aptitudes e idiomas.','Foto de perfil optimizada.','Portada de LinkedIn personalizada.','URL profesional y datos de contacto.','Optimización con palabras clave para búsquedas.','QR de LinkedIn para incorporar al CV cuando corresponda.'],
      result:'Un perfil ordenado, completo y profesional que respalda el CV y mejora la forma en que te encuentran y evalúan en LinkedIn.',
      process:[['01','Diagnóstico','Revisamos el perfil actual y el objetivo.'],['02','Estrategia','Definimos título, enfoque y palabras clave.'],['03','Contenido','Redactamos y cargamos todas las secciones.'],['04','Imagen final','Diseñamos portada, verificamos datos y entregamos.']],
      message:'Hola CVStudio, me interesa la optimización completa de LinkedIn por $20.000. Quisiera recibir información.'
    },
    'dos-cv-profesionales': {
      kicker:'Dos objetivos, una propuesta completa', title:'Dos CV profesionales para <span>dos necesidades diferentes.</span>', price:'$20.000',
      lead:'El combo permite desarrollar dos currículums para dos personas o dos versiones de un mismo perfil orientadas a objetivos laborales distintos, sin mezclar enfoques.',
      image:'/assets/images/combo-2-cv-profesionales.webp', imageAlt:'Combo de dos CV profesionales',
      trust:['Dos desarrollos','Enfoques diferenciados','Ahorro en combo'],
      analyze:[['Alternativa elegida','Definimos si son dos personas o dos objetivos para la misma persona.'],['Puestos objetivo','Separamos palabras clave, fortalezas y prioridades según cada búsqueda.'],['Experiencias','Seleccionamos qué funciones conviene destacar en cada versión.'],['Identidad visual','Podemos diferenciar los diseños manteniendo calidad y coherencia.'],['Compatibilidad ATS','Optimizamos ambos documentos para sus respectivas búsquedas.'],['Consistencia','Evitamos contradicciones y contenido genérico entre las dos versiones.']],
      includes:['Dos CV profesionales completos.','Redacción y organización individual de cada perfil.','Diseños personalizados de una página.','Optimización ATS según cada objetivo.','Selección diferenciada de habilidades y palabras clave.','Corrección integral y entrega en PDF.'],
      result:'Dos herramientas laborales independientes, cada una enfocada en la oportunidad para la que fue creada.',
      process:[['01','Objetivos','Definimos las dos personas o búsquedas.'],['02','Separación','Asignamos contenido y palabras clave a cada CV.'],['03','Desarrollo','Redactamos y diseñamos ambos documentos.'],['04','Revisión','Verificamos coherencia y entregamos los dos PDF.']],
      message:'Hola CVStudio, me interesa el combo de 2 CV Profesionales por $20.000. Quisiera recibir información.'
    },
    'cv-linkedin': {
      kicker:'Presentación profesional integral', title:'Un CV sólido y un LinkedIn que <span>cuentan la misma historia.</span>', price:'$28.000',
      lead:'Desarrollamos el currículum y el perfil de LinkedIn como un sistema coherente: misma orientación laboral, mensajes consistentes y una identidad profesional reconocible.',
      image:'/assets/images/combo-cv-linkedin.webp', imageAlt:'Combo de CV Profesional y LinkedIn completo',
      trust:['CV Profesional','LinkedIn completo','Identidad coherente'],
      analyze:[['Objetivo común','Definimos la dirección profesional que compartirán ambos recursos.'],['Contenido','Adaptamos la información al formato breve del CV y al desarrollo de LinkedIn.'],['Palabras clave','Trabajamos términos relevantes para ATS y búsquedas dentro de LinkedIn.'],['Experiencias','Mantenemos coherencia en cargos, fechas, funciones y logros.'],['Imagen profesional','Coordinamos diseño del CV, foto, portada y QR.'],['Conversión','Preparamos ambos canales para facilitar el contacto y la postulación.']],
      includes:['CV Profesional personalizado y optimizado para ATS.','Perfil profesional, experiencias, formación y habilidades.','Creación u optimización completa de LinkedIn.','Título y sección Acerca de.','Foto optimizada y portada personalizada.','Aptitudes, cursos, idiomas y datos de contacto.','QR de LinkedIn incorporado al CV.','PDF final listo para enviar.'],
      result:'Una presentación profesional unificada para postularte, mejorar tu visibilidad y respaldar tu experiencia en ambos formatos.',
      process:[['01','Estrategia','Definimos objetivo y posicionamiento.'],['02','CV','Redactamos y diseñamos el documento.'],['03','LinkedIn','Construimos u optimizamos el perfil completo.'],['04','Integración','Unificamos imagen, enlaces y mensajes.']],
      message:'Hola CVStudio, me interesa el combo CV Profesional + LinkedIn por $28.000. Quisiera comenzar.'
    },
    'otros-servicios': {
      kicker:'Soluciones para tu perfil o marca', title:'Desarrollamos la pieza que necesitás para <span>presentarte mejor.</span>', price:'Presupuesto personalizado',
      lead:'Además de currículums y LinkedIn, realizamos cartas de presentación, identidad visual, piezas para redes, portfolios y sitios web adaptados a cada proyecto.',
      image:'/assets/images/kit-lanzamiento-marca.webp', imageAlt:'Kit de lanzamiento de marca y servicios de diseño',
      trust:['Diseño personalizado','Desarrollo a medida','Entrega digital'],
      analyze:[['Carta de presentación','Complementamos el CV con una presentación profesional adaptable a postulaciones.'],['Identidad visual','Creamos logo, paleta, tipografías y lineamientos básicos de marca.'],['Contenido para redes','Diseñamos flyers, historias, portadas y plantillas coherentes.'],['Portfolio','Organizamos trabajos, servicios y casos para mostrar experiencia.'],['Sitio web','Creamos una presencia digital adaptable a celulares y con contacto directo.'],['Kit emprendedor','Integramos identidad, contenido y recursos comerciales en una sola propuesta.']],
      includes:['Relevamiento del objetivo y del público.','Propuesta de contenido y estructura.','Diseño alineado con la identidad del proyecto.','Adaptación a los formatos necesarios.','Correcciones acordadas durante el desarrollo.','Entrega digital lista para publicar o compartir.'],
      result:'Una solución pensada para el objetivo real del proyecto, sin paquetes genéricos ni elementos que no aporten valor.',
      process:[['01','Consulta','Nos contás qué necesitás y para qué.'],['02','Propuesta','Definimos alcance, formato y presupuesto.'],['03','Desarrollo','Creamos el contenido y el diseño.'],['04','Entrega','Revisamos y preparamos los archivos finales.']],
      message:'Hola CVStudio, quiero consultar por un servicio personalizado. Necesito asesoramiento para definir la mejor opción.'
    }
  };

  const key = document.body.dataset.service;
  const service = services[key];
  const root = document.getElementById('serviceRoot');
  if (!service || !root) return;

  const messageLink = `https://wa.me/${whatsapp}?text=${encodeURIComponent(service.message)}`;
  const cards = service.analyze.map(([title,text],index) => `<article class="service-info-card"><b>${String(index + 1).padStart(2,'0')}</b><h3>${title}</h3><p>${text}</p></article>`).join('');
  const checklist = service.includes.map(item => `<li>${item}</li>`).join('');
  const steps = service.process.map(([number,title,text]) => `<article class="service-step"><strong>${number}</strong><h3>${title}</h3><p>${text}</p></article>`).join('');
  const models = service.models ? `<section class="service-section"><div class="service-shell"><div class="service-section-heading"><span class="service-kicker">Modelos profesionales disponibles</span><h2>Cuatro estilos, un desarrollo completamente personalizado.</h2><p>Podés conocerlos en detalle y ampliar cada diseño dentro de nuestro catálogo.</p></div><div class="service-models">
    ${[
      ['PRO-01','Profesional Premium','Diseño exclusivo y adaptable a distintos sectores.','/assets/cv-disponibles/pro-01.webp'],
      ['PRO-02','Harvard Clásico','Lectura directa, estructura académica y máxima claridad.','/assets/cv-disponibles/pro-02.webp'],
      ['PRO-03','Ejecutivo Premium','Presentación sobria para liderazgo y trayectoria.','/assets/cv-disponibles/pro-03.webp'],
      ['PRO-04','Profesional Suave','Estética moderna, cercana y equilibrada.','/assets/cv-disponibles/pro-04.webp']
    ].map(([code,title,text,image]) => `<a class="service-model" href="/cvdisponibles/#${code.toLowerCase()}"><div class="service-model-image"><img src="${image}" alt="Modelo ${code}: ${title}" loading="lazy"></div><div><small>${code}</small><h3>${title}</h3><p>${text}</p></div></a>`).join('')}
  </div><div class="service-actions" style="justify-content:center"><a class="service-button primary" href="/cvdisponibles/">Ver los 16 modelos disponibles</a></div></div></section>` : '';

  root.innerHTML = `<section class="service-shell service-hero"><div><span class="service-kicker">${service.kicker}</span><h1>${service.title}</h1><p class="service-lead">${service.lead}</p><strong class="service-price">Valor del servicio: ${service.price}</strong><div class="service-actions"><a class="service-button primary" href="${messageLink}" target="_blank" rel="noopener">Consultar por WhatsApp</a><a class="service-button" href="#desarrollo">Ver qué trabajamos</a></div><div class="service-trust">${service.trust.map(item => `<span>${item}</span>`).join('')}</div></div><div class="service-visual"><figure class="service-visual-card ${service.imageClass || ''}"><img src="${service.image}" alt="${service.imageAlt}" fetchpriority="high"></figure></div></section>
  <section class="service-section" id="desarrollo"><div class="service-shell"><div class="service-section-heading"><span class="service-kicker">Análisis y desarrollo</span><h2>Qué evaluamos y qué trabajamos.</h2><p>Cada parte del servicio responde a una necesidad concreta del perfil o del proyecto.</p></div><div class="service-grid">${cards}</div></div></section>
  ${models}
  <section class="service-section"><div class="service-shell service-split"><div class="service-split-copy"><span class="service-kicker">Alcance del servicio</span><h2>Qué incluye el desarrollo.</h2><p>${service.result}</p></div><ul class="service-checklist">${checklist}</ul></div></section>
  <section class="service-section"><div class="service-shell"><div class="service-section-heading"><span class="service-kicker">Cómo trabajamos</span><h2>Un proceso claro de principio a fin.</h2></div><div class="service-steps">${steps}</div></div></section>
  <section class="service-section"><div class="service-shell service-banner"><div><h2>¿Querés comenzar con este servicio?</h2><p>Escribinos por WhatsApp, contanos tu objetivo y te indicamos la información necesaria para iniciar.</p></div><a class="service-button primary" href="${messageLink}" target="_blank" rel="noopener">Me interesa este servicio</a></div></section>`;
})();
