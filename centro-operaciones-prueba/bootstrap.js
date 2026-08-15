(() => {
  'use strict';

  const MANIFEST_PATH = './version.json';
  const LOCAL_STYLES = ['./app.css'];
  const LOCAL_SCRIPTS = [
    '../js/supabase-config.js',
    './supabase-operational.js',
    './settings.js',
    './collaborators.js',
    './app.js',
    './operational.js',
    './real-bridge.js',
    './access-session.js'
  ];

  const uniqueNonce = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const withBuild = (path, build) => {
    const url = new URL(path, location.href);
    url.searchParams.set('build', build);
    return url.href;
  };

  async function getManifest() {
    const url = new URL(MANIFEST_PATH, location.href);
    url.searchParams.set('_fresh', uniqueNonce());
    const response = await fetch(url.href, {
      cache: 'no-store',
      credentials: 'same-origin',
      headers: { 'Cache-Control': 'no-cache, no-store, max-age=0', Pragma: 'no-cache' }
    });
    if (!response.ok) throw new Error(`No se pudo cargar version.json (${response.status})`);
    const manifest = await response.json();
    if (!manifest?.build || !manifest?.version) throw new Error('version.json no contiene version/build válidos');
    return manifest;
  }

  function exposeRelease(manifest) {
    const version = String(manifest.version).replace(/^v/i, '');
    window.CVSTUDIO_BUILD = String(manifest.build);
    window.CVSTUDIO_VERSION = version;
    window.CVSTUDIO_RELEASE = {
      version,
      build: String(manifest.build),
      date: manifest.releasedAt || '',
      name: manifest.name || ''
    };
    document.documentElement.dataset.cvstudioBuild = String(manifest.build);
    document.querySelectorAll('.app-version').forEach(node => { node.textContent = `v${version}`; });
  }

  function loadStyle(path, build) {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = withBuild(path, build);
      link.onload = resolve;
      link.onerror = () => reject(new Error(`No se pudo cargar ${path}`));
      document.head.appendChild(link);
    });
  }

  function loadScript(src, build, external = false) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = external ? src : withBuild(src, build);
      script.async = false;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
      document.body.appendChild(script);
    });
  }

  function showFatal(error) {
    console.error('Error de inicio CVStudio', error);
    const main = document.getElementById('appMain');
    if (main) main.innerHTML = `<section style="padding:24px"><h2>No se pudo iniciar el panel</h2><p>${String(error?.message || error)}</p><button onclick="location.reload()">Reintentar</button></section>`;
  }

  async function start() {
    try {
      const manifest = await getManifest();
      exposeRelease(manifest);
      await Promise.all(LOCAL_STYLES.map(path => loadStyle(path, manifest.build)));
      await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.102.0', manifest.build, true);
      for (const src of LOCAL_SCRIPTS) await loadScript(src, manifest.build);
    } catch (error) {
      showFatal(error);
    }
  }

  start();
})();
