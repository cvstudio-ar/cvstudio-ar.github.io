(() => {
  'use strict';

  const CURRENT_BUILD = String(window.CVSTUDIO_BUILD || '');
  const RELOAD_KEY = 'cvstudio_build_reload';
  const MAX_RELOADS = 2;

  async function clearLegacyCaches() {
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(registration => registration.unregister()));
      }
      if ('caches' in window) {
        const names = await caches.keys();
        await Promise.all(names.map(name => caches.delete(name)));
      }
    } catch (error) {
      console.warn('No se pudieron limpiar cachés residuales.', error);
    }
  }

  async function loadFreshDocument(latestBuild) {
    const attempts = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
    if (attempts >= MAX_RELOADS) {
      console.error('Se evitó un ciclo de recarga de versión.', {CURRENT_BUILD, latestBuild});
      return;
    }
    sessionStorage.setItem(RELOAD_KEY, String(attempts + 1));
    await clearLegacyCaches();

    const documentUrl = new URL(location.href);
    documentUrl.searchParams.set('build', latestBuild);
    documentUrl.searchParams.set('_refresh', Date.now().toString());

    const response = await fetch(documentUrl.toString(), {
      cache: 'no-store',
      credentials: 'same-origin',
      headers: {'Cache-Control': 'no-cache'}
    });
    if (!response.ok) throw new Error(`No se pudo recuperar el panel actualizado (${response.status}).`);

    const freshHtml = await response.text();
    if (!freshHtml.includes(`CVSTUDIO_BUILD=\"${latestBuild}\"`)) {
      throw new Error('El servidor todavía no entregó el HTML correspondiente al build publicado.');
    }

    document.open();
    document.write(freshHtml);
    document.close();
  }

  async function checkVersion() {
    try {
      const response = await fetch(`./version.json?_=${Date.now()}`, {
        cache: 'no-store',
        credentials: 'same-origin',
        headers: {'Cache-Control': 'no-cache'}
      });
      if (!response.ok) return;
      const latest = await response.json();
      const latestBuild = String(latest?.build || '');

      if (!latestBuild || latestBuild === CURRENT_BUILD) {
        sessionStorage.removeItem(RELOAD_KEY);
        return;
      }

      await loadFreshDocument(latestBuild);
    } catch (error) {
      console.warn('No se pudo comprobar o aplicar la versión publicada.', error);
    }
  }

  clearLegacyCaches();
  window.addEventListener('pageshow', checkVersion, {once: true});
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) checkVersion();
  });
})();
