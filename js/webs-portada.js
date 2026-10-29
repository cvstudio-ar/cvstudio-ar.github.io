(() => {
  'use strict';
  // Mejoras de portada sin modificar el contenido comercial ni los datos de pago.
  const originalPicker = document.getElementById('webCurrency');
  if (originalPicker?.tagName === 'SELECT') {
    const template = document.createElement('template');
    template.innerHTML = "<details class=\"currency-picker\" id=\"webCurrency\"><summary aria-label=\"Moneda: Arg\" aria-controls=\"webCurrencyMenu\"><span class=\"currency-current-flag currency-flag\"><svg viewBox=\"0 0 30 20\" aria-hidden=\"true\" focusable=\"false\"><path fill=\"#74acdf\" d=\"M0 0h30v20H0z\"/><path fill=\"#fff\" d=\"M0 6.67h30v6.66H0z\"/><circle cx=\"15\" cy=\"10\" r=\"2.3\" fill=\"#f6b40e\"/></svg></span><span class=\"currency-current-name\">Arg</span><svg class=\"currency-chevron\" viewBox=\"0 0 12 8\" aria-hidden=\"true\"><path d=\"m1 1 5 5 5-5\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\"/></svg></summary><div class=\"currency-options\" id=\"webCurrencyMenu\" role=\"menu\" aria-label=\"Moneda de preferencia\"><button type=\"button\" role=\"menuitemradio\" aria-checked=\"true\" data-currency=\"ARS\"><span class=\"currency-flag\"><svg viewBox=\"0 0 30 20\" aria-hidden=\"true\" focusable=\"false\"><path fill=\"#74acdf\" d=\"M0 0h30v20H0z\"/><path fill=\"#fff\" d=\"M0 6.67h30v6.66H0z\"/><circle cx=\"15\" cy=\"10\" r=\"2.3\" fill=\"#f6b40e\"/></svg></span><span>Arg</span></button><button type=\"button\" role=\"menuitemradio\" aria-checked=\"false\" data-currency=\"USD\"><span class=\"currency-flag\"><svg viewBox=\"0 0 30 20\" aria-hidden=\"true\" focusable=\"false\"><path fill=\"#fff\" d=\"M0 0h30v20H0z\"/><path stroke=\"#b22234\" stroke-width=\"1.54\" d=\"M0 .77h30M0 3.85h30M0 6.92h30M0 10h30M0 13.08h30M0 16.15h30M0 19.23h30\"/><path fill=\"#3c3b6e\" d=\"M0 0h13v10.77H0z\"/><path fill=\"#fff\" d=\"M2 2h1v1H2zm4 0h1v1H6zm4 0h1v1h-1zM4 4h1v1H4zm4 0h1v1H8zM2 6h1v1H2zm4 0h1v1H6zm4 0h1v1h-1zM4 8h1v1H4zm4 0h1v1H8z\"/></svg></span><span>Dólar</span></button><button type=\"button\" role=\"menuitemradio\" aria-checked=\"false\" data-currency=\"EUR\"><span class=\"currency-flag\"><svg viewBox=\"0 0 30 20\" aria-hidden=\"true\" focusable=\"false\"><path fill=\"#aa151b\" d=\"M0 0h30v20H0z\"/><path fill=\"#f1bf00\" d=\"M0 5h30v10H0z\"/><path fill=\"#aa151b\" d=\"M8 8h4v5H8z\"/><path fill=\"#fff\" d=\"M8 8h2v2H8zm2 3h2v2h-2z\"/><path fill=\"#c8a347\" d=\"M7 7h6v1H7zM6 9h1v4H6zm8 0h1v4h-1z\"/></svg></span><span>Euro</span></button></div></details>";
    originalPicker.closest('.currency-picker').replaceWith(template.content.firstElementChild);
  }
  const title = document.getElementById('hero-title');
  if (title && !title.querySelector('.hero-title-line')) {
    title.replaceChildren(...['Tu negocio merece', 'una web que', 'lo represente.'].map((text, index) => {
      const line = document.createElement(index === 2 ? 'em' : 'span');
      line.className = 'hero-title-line';
      line.textContent = text;
      return line;
    }));
  }
  const kicker = document.querySelector('.hero-kicker');
  if (kicker) {
    const phrases = ['Diseño web a tu medida', 'Rapidez', 'Modernización', 'Estrategia de venta', 'Diseño personalizado', 'Tu negocio a otro nivel', 'CVStudio'];
    let phraseIndex = 0;
    const rotator = document.createElement('span');
    rotator.className = 'kicker-rotator';
    rotator.setAttribute('aria-hidden', 'true');
    rotator.textContent = phrases[0];
    kicker.setAttribute('aria-label', 'Diseño web a tu medida');
    kicker.replaceChildren(rotator);
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    // El texto también cambia con movimiento reducido; solo se omite el difuminado.
    let transitionTimer;
    let interval;
    function advancePhrase() {
      if (document.hidden) return;
      const change = () => {
        phraseIndex = (phraseIndex + 1) % phrases.length;
        rotator.textContent = phrases[phraseIndex];
        rotator.classList.remove('is-changing');
      };
      if (motionPreference.matches) { change(); return; }
      rotator.classList.add('is-changing');
      transitionTimer = window.setTimeout(change, 180);
    }
    function syncTicker() {
      window.clearInterval(interval);
      window.clearTimeout(transitionTimer);
      rotator.classList.remove('is-changing');
      if (!document.hidden) interval = window.setInterval(advancePhrase, 2000);
    }
    document.addEventListener('visibilitychange', syncTicker);
    window.addEventListener('pageshow', syncTicker);
    window.addEventListener('pagehide', () => { window.clearInterval(interval); window.clearTimeout(transitionTimer); });
    syncTicker();
  }
  const scene = document.querySelector('.intro-scene');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let visible = true;
  function updateMotion() {
    scene?.classList.toggle('light-stopped', reduced.matches || !visible || document.hidden);
  }
  document.addEventListener('visibilitychange', updateMotion);
  if (reduced.addEventListener) reduced.addEventListener('change', updateMotion);
  else if (reduced.addListener) reduced.addListener(updateMotion);
  if (scene && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; updateMotion(); }).observe(scene);
  }
  const benefits = scene?.querySelector('.benefits');
  function fitBackground() {
    if (benefits) scene.style.setProperty('--benefits-height', `${benefits.getBoundingClientRect().height}px`);
  }
  if (benefits && 'ResizeObserver' in window) new ResizeObserver(fitBackground).observe(benefits);
  window.addEventListener('resize', fitBackground);
  fitBackground();
  updateMotion();

  const picker = document.getElementById('webCurrency');
  const notice = document.getElementById('currencyNotice');
  if (!picker || !notice) return;
  const trigger = picker.querySelector('summary');
  const options = Array.from(picker.querySelectorAll('[data-currency]'));
  const names = { ARS: 'pesos argentinos (ARS)', USD: 'dólares (USD)', EUR: 'euros (EUR)' };
  const labels = { ARS: 'Arg', USD: 'Dólar', EUR: 'Euro' };
  const storageKey = 'cvstudio-web-currency';
  let saved;
  try { saved = localStorage.getItem(storageKey); } catch (_) { /* Preferencia opcional. */ }
  const locale = (navigator.language || '').toLowerCase();
  let currency = names[saved] ? saved : locale === 'es-es' ? 'EUR' : locale.startsWith('en-us') ? 'USD' : 'ARS';
  function updateCurrency() {
    const selected = options.find(option => option.dataset.currency === currency);
    picker.querySelector('.currency-current-flag').replaceChildren(selected.querySelector('svg').cloneNode(true));
    picker.querySelector('.currency-current-name').textContent = labels[currency];
    trigger.setAttribute('aria-label', `Moneda: ${labels[currency]}`);
    options.forEach(option => option.setAttribute('aria-checked', String(option.dataset.currency === currency)));
    picker.dataset.currency = currency;
    document.documentElement.dataset.preferredCurrency = currency;
    try { localStorage.setItem(storageKey, currency); } catch (_) { /* Funciona sin almacenamiento. */ }
    notice.hidden = true;
    notice.textContent = '';
    document.dispatchEvent(new CustomEvent('cvstudio:currencychange', { detail: { currency } }));
  }
  options.forEach(option => option.addEventListener('click', () => {
    currency = option.dataset.currency;
    updateCurrency();
    picker.open = false;
    trigger.focus();
  }));
  trigger.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      event.stopPropagation();
      picker.open = true;
      options.find(option => option.dataset.currency === currency).focus();
    }
  });
  picker.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); picker.open = false; trigger.focus(); return; }
    const index = options.indexOf(document.activeElement);
    if (index < 0) return;
    let next;
    if (event.key === 'ArrowDown') next = (index + 1) % options.length;
    if (event.key === 'ArrowUp') next = (index + options.length - 1) % options.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = options.length - 1;
    if (next !== undefined) { event.preventDefault(); options[next].focus(); }
  });
  document.addEventListener('click', event => { if (!picker.contains(event.target)) picker.open = false; });
  document.addEventListener('focusin', event => { if (!picker.contains(event.target)) picker.open = false; });
  updateCurrency();
})();
