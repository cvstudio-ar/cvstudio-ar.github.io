(() => {
  'use strict';
  const scene = document.querySelector('.intro-scene');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let visible = true;
  function updateMotion() {
    scene?.classList.toggle('light-stopped', reduced.matches || !visible || document.hidden);
  }
  document.addEventListener('visibilitychange', updateMotion);
  reduced.addEventListener('change', updateMotion);
  if (scene && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; updateMotion(); }).observe(scene);
  }
  updateMotion();

  const picker = document.getElementById('webCurrency');
  const notice = document.getElementById('currencyNotice');
  if (!picker || !notice) return;
  const names = { ARS: 'pesos argentinos (ARS)', USD: 'dólares (USD)', EUR: 'euros (EUR)' };
  const storageKey = 'cvstudio-web-currency';
  let saved;
  try { saved = localStorage.getItem(storageKey); } catch (_) { /* Preferencia opcional. */ }
  const country = (navigator.language || '').toLowerCase();
  picker.value = names[saved] ? saved : country === 'es-es' ? 'EUR' : country.startsWith('en-us') ? 'USD' : 'ARS';
  function updateCurrency() {
    const currency = picker.value;
    document.documentElement.dataset.preferredCurrency = currency;
    try { localStorage.setItem(storageKey, currency); } catch (_) { /* Funciona sin almacenamiento. */ }
    notice.hidden = currency === 'ARS';
    notice.textContent = currency === 'ARS' ? '' : `Tu moneda de preferencia es ${names[currency]}. Por ahora, los precios publicados y el pago online están expresados en ARS. Consultanos por WhatsApp para recibir tu presupuesto en ${names[currency]}.`;
    document.dispatchEvent(new CustomEvent('cvstudio:currencychange', { detail: { currency } }));
  }
  picker.addEventListener('change', updateCurrency);
  updateCurrency();
})();
