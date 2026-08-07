/* CVStudio · Carga diferida del SIAC y Supabase. */
(() => {
  'use strict';
  const launchers = [...document.querySelectorAll('[data-siac-open]')];
  if (!launchers.length) return;
  let loadingPromise = null;
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[data-siac-src="${src}"]`);
      if (existing) {
        if (existing.dataset.loaded === 'true') resolve();
        else existing.addEventListener('load', resolve, { once: true });
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.defer = true;
      script.dataset.siacSrc = src;
      script.addEventListener('load', () => { script.dataset.loaded = 'true'; resolve(); }, { once: true });
      script.addEventListener('error', () => reject(new Error(`No se pudo cargar ${src}`)), { once: true });
      document.body.appendChild(script);
    });
  }
  function loadSIAC() {
    if (!loadingPromise) {
      loadingPromise = loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2')
        .then(() => loadScript('js/supabase-config.js'))
        .then(() => loadScript('js/siac.js'));
    }
    return loadingPromise;
  }
  async function activate(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    const launcher = event.currentTarget;
    launcher.setAttribute('aria-busy', 'true');
    launcher.classList.add('is-loading');
    try {
      await loadSIAC();
      launchers.forEach(button => button.removeEventListener('click', activate, true));
      launcher.click();
    } catch (error) {
      console.error('SIAC loader:', error);
      alert('No se pudo abrir el asistente. Revisá tu conexión e intentá nuevamente.');
    } finally {
      launcher.removeAttribute('aria-busy');
      launcher.classList.remove('is-loading');
    }
  }
  launchers.forEach(button => button.addEventListener('click', activate, true));
})();
