(() => {
  'use strict';
  const {getData, safeUrl, waUrl} = window.EUGENIA;
  const data = getData();
  const menu = document.querySelector('#menu');
  const toggle = document.querySelector('.menu-toggle');
  const socialLinks = document.querySelectorAll('[data-social]');
  const serviceDetails = [
    ['familia', ['Contanos qué situación familiar querés abordar.', 'Si ya hay acuerdos o actuaciones previas, podés mencionarlos en la entrevista.']],
    ['sucesiones', ['Comentanos qué bienes o trámites motivan tu consulta.', 'Si el trámite ya empezó, indicá en qué etapa está.']],
    ['transito', ['Anotá cuándo y dónde ocurrió el siniestro.', 'Tené a mano las comunicaciones del seguro y los comprobantes que conserves.']],
    ['laboral', ['Contanos cuál era tu relación laboral y qué situación se presentó.', 'Si recibiste comunicaciones o tenés recibos, podés revisarlos con el estudio.']]
  ];
  const articles = [
    {
      category: 'Familia', title: 'Autorización de viaje de menores', art: 'viaje',
      summary: 'Qué conversar con el estudio si tu hijo o hija tiene previsto viajar.',
      details: ['Destino, fechas y quién acompañará al menor.', 'Documentación que ya tenés y si hay algún acuerdo previo sobre el viaje.']
    },
    {
      category: 'Familia', title: 'Divorcios', art: 'divorcio',
      summary: 'Un espacio de orientación para conversar sobre tu situación.',
      details: ['Qué aspectos te interesa resolver primero: vivienda, hijos, bienes u otros acuerdos.', 'Si ya hubo una presentación o algún acuerdo, contanos en qué etapa está.']
    },
    {
      category: 'Sucesiones', title: 'Bienes y sucesión', art: 'bienes',
      summary: 'Consultá por los pasos a evaluar cuando hay bienes familiares.',
      details: ['Qué bienes conocés y con qué documentación contás.', 'Si ya hay una sucesión iniciada o una operación pendiente sobre algún bien.']
    }
  ];
  const serviceContainer = document.querySelector('#services');
  const topic = document.querySelector('#topic');

  document.body.dataset.palette = data.palette;
  document.documentElement.style.setProperty('--hero-focus', data.focus + '%');
  document.querySelector('#hero-photo').src = data.cover;
  document.title = data.business + ' | Estudio jurídico';
  document.querySelectorAll('[data-copy]').forEach(el => {
    el.textContent = data[el.dataset.copy];
  });
  socialLinks.forEach(link => {
    const url = safeUrl(data[link.dataset.social]);
    if (!url) return;
    link.href = url;
    link.hidden = false;
  });
  if (data.phone && /^[+\d\s()-]{7,28}$/.test(data.phone)) {
    const phone = document.querySelector('#phone-link');
    phone.href = 'tel:' + data.phone.replace(/[^+\d]/g, '');
    phone.textContent = data.phone;
    phone.hidden = false;
  }
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    const email = document.querySelector('#email-link');
    email.href = 'mailto:' + encodeURIComponent(data.email);
    email.textContent = data.email;
    email.hidden = false;
  }

  const hello = waUrl(data.whatsapp, 'Hola, quisiera coordinar una consulta con el estudio.');
  document.querySelectorAll('[data-whatsapp]').forEach(link => {
    if (!hello) {
      link.textContent = 'Ver datos de contacto';
      return;
    }
    link.href = hello;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  });
  const dialog = document.querySelector('#detail-dialog');
  const closeDetail = document.querySelector('#close-detail');
  const consultDetail = document.querySelector('#detail-contact');
  let activeCard;
  let activeSubject;
  let movingToContact = false;

  function illustration(art) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const use = document.createElementNS(svg.namespaceURI, 'use');
    svg.setAttribute('viewBox', '0 0 160 90');
    svg.setAttribute('aria-hidden', 'true');
    use.setAttribute('href', 'assets/ilustraciones.svg#' + art);
    svg.append(use);
    return svg;
  }

  function renderCard(container, details, action) {
    const article = document.createElement('article');
    article.className = 'info-card';
    const art = document.createElement('div');
    art.className = 'card-art';
    art.append(illustration(details.art));
    const copy = document.createElement('div');
    copy.className = 'card-copy';
    const category = document.createElement('small');
    category.textContent = details.category;
    const title = document.createElement('h3');
    title.textContent = details.title;
    const summary = document.createElement('p');
    summary.textContent = details.summary;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'card-action';
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-label', action + ': ' + details.title);
    button.innerHTML = '<span></span><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
    button.firstElementChild.textContent = action;
    button.addEventListener('click', () => {
      activeCard = button;
      activeSubject = details.subject;
      document.querySelector('#detail-art').replaceChildren(illustration(details.art));
      document.querySelector('#detail-kicker').textContent = details.category;
      document.querySelector('#detail-title').textContent = details.title;
      document.querySelector('#detail-intro').textContent = details.summary;
      document.querySelector('#detail-list').replaceChildren(...details.details.map(text => {
        const item = document.createElement('li');
        item.textContent = text;
        return item;
      }));
      dialog.showModal();
      closeDetail.focus();
    });
    copy.append(category, title, summary, button);
    article.append(art, copy);
    container.append(article);
  }

  data.services.forEach(({name, description}) => {
    const matched = serviceDetails.find(([key]) =>
      name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(key));
    const [art, details] = matched || ['sucesiones', ['Contanos qué necesitás resolver.', 'Si tenés documentación vinculada con la consulta, podés mencionarla al coordinar.']];
    renderCard(serviceContainer, {category: 'Área de práctica', title: name, art,
      summary: description, details, subject: name}, 'Ver detalles');
    topic.add(new Option(name));
  });
  articles.forEach(article => renderCard(document.querySelector('#articles'),
    {...article, subject: article.category}, 'Leer más'));

  closeDetail.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    if (!movingToContact) activeCard?.focus();
    movingToContact = false;
  });
  consultDetail.addEventListener('click', () => {
    movingToContact = true;
    topic.value = [...topic.options].some(option => option.value === activeSubject)
      ? activeSubject : 'Consulta general';
    dialog.close();
    document.querySelector('#contacto').scrollIntoView();
    document.querySelector('[name=nombre]').focus({preventScroll: true});
  });

  function closeMenu() {
    toggle.setAttribute('aria-expanded', 'false');
    menu.classList.remove('open');
  }
  toggle.addEventListener('click', () => {
    const opened = menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(opened));
  });
  menu.addEventListener('click', closeMenu);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.classList.contains('open')) {
      closeMenu();
      toggle.focus();
    }
  });
  document.querySelector('#contact-form').addEventListener('submit', event => {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const name = fields.get('nombre').trim();
    if (!name) {
      document.querySelector('#form-note').textContent = 'Ingresá tu nombre para preparar la consulta.';
      return;
    }
    const url = waUrl(data.whatsapp, 'Hola, soy ' + name + '. Quisiera coordinar una consulta. Tema: ' + fields.get('motivo') + '.');
    if (!url) {
      document.querySelector('#form-note').textContent = 'El estudio aún no configuró su número de WhatsApp.';
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  });
})();
