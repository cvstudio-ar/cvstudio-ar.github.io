(() => {
  'use strict';
  const {getData, safeUrl, waUrl} = window.EUGENIA;
  const data = getData();
  const menu = document.querySelector('#menu');
  const toggle = document.querySelector('.menu-toggle');
  const socialLinks = document.querySelectorAll('[data-social]');
  const icons = [
    '<circle cx="8" cy="7" r="3"/><circle cx="17" cy="8" r="2.5"/><path d="M2 20v-2a6 6 0 0 1 12 0v2m2-7a5 5 0 0 1 6 5v2"/>',
    '<path d="M6 3h9l4 4v14H6zM9 10h7M9 14h7M9 18h5"/>',
    '<path d="m4 12 2-6h12l2 6M4 12h16l2 2v5h-3v-2H5v2H2v-5zM6 14h2m8 0h2"/>',
    '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V4h8v3M3 11l9 3 9-3"/>'
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
  data.services.forEach(({name, description}, index) => {
    const article = document.createElement('article');
    article.className = 'service';
    article.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + icons[index % icons.length] + '</svg>';
    const title = document.createElement('h3');
    title.textContent = name;
    const copy = document.createElement('p');
    copy.textContent = description;
    article.append(title, copy);
    serviceContainer.append(article);
    topic.add(new Option(name));
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
