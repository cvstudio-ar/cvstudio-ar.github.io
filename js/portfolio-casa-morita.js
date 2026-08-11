(() => {
  'use strict';
  const button = document.querySelector('.cm-menu');
  const nav = document.querySelector('.cm-header nav');
  if (!button || !nav) return;
  button.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    button.setAttribute('aria-expanded', String(open));
  });
  nav.addEventListener('click', event => {
    if (!event.target.closest('a')) return;
    nav.classList.remove('is-open');
    button.setAttribute('aria-expanded', 'false');
  });
})();
