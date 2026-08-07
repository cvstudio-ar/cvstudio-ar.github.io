/* CVStudio · Menú público de portfolios administrado desde Generador URL · v1.4.14 */
(() => {
  'use strict';

  const MENU_ID = 'clientPortfoliosMenu';
  const NAV_ID = 'clientPortfoliosNav';
  const STORE_KEY = 'cvstudio_ops_operational_v2';
  const META_ID = 'centro-operaciones-prueba';
  const PUBLIC_STATUS = 'Publicado';

  const BUILTIN = [
    { slug: 'beauty-nails-by-eliana', name: 'Beauty Nails by Eliana', menuLabel: 'By Eliana', status: PUBLIC_STATUS, publicPath: '/beauty-nails-by-eliana/' },
    { slug: 'julieta-ferrari', name: 'Julieta Ferrari · Follow Digital', menuLabel: 'Follow Digital', status: PUBLIC_STATUS, publicPath: '/julieta-ferrari/' }
  ];

  const safeText = value => String(value || '').trim();
  const isPublic = item => safeText(item.status) === PUBLIC_STATUS && item.deleted !== true && item.is_visible !== false;

  function localSpaces() {
    try {
      const state = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
      return Array.isArray(state.urlSpaces) ? state.urlSpaces : [];
    } catch (_) {
      return [];
    }
  }

  function mergeSpaces(saved) {
    const source = Array.isArray(saved) ? saved : [];
    const builtins = BUILTIN.map(base => ({ ...base, ...(source.find(item => item && item.slug === base.slug) || {}) }));
    const custom = source.filter(item => item && item.slug && !BUILTIN.some(base => base.slug === item.slug));
    const seen = new Set();
    return [...builtins, ...custom].filter(item => item.slug && !seen.has(item.slug) && seen.add(item.slug));
  }

  async function remoteSpaces() {
    const client = window.cvstudioSupabase;
    if (!client) return null;
    const { data, error } = await client
      .from('cvstudio_ops_stage_meta')
      .select('rules')
      .eq('id', META_ID)
      .maybeSingle();
    if (error) throw error;
    return Array.isArray(data?.rules?.__urlSpaces) ? data.rules.__urlSpaces : [];
  }

  function render(spaces) {
    const menu = document.getElementById(MENU_ID);
    const nav = document.getElementById(NAV_ID);
    if (!menu || !nav) return;

    const published = mergeSpaces(spaces).filter(isPublic);
    menu.replaceChildren();

    if (!published.length) {
      nav.hidden = true;
      return;
    }

    nav.hidden = false;
    published.forEach(project => {
      const link = document.createElement('a');
      const path = safeText(project.publicPath) || `/${encodeURIComponent(project.slug)}/`;
      link.href = new URL(path, window.location.origin).href;
      link.textContent = safeText(project.menuLabel) || safeText(project.name) || project.slug;
      link.dataset.portfolioSlug = project.slug;
      menu.appendChild(link);
    });
  }

  async function load() {
    render(localSpaces());
    try {
      const remote = await remoteSpaces();
      if (remote) render(remote);
    } catch (error) {
      console.warn('[CVStudio] No se pudo leer el menú remoto de portfolios:', error);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load, { once: true });
  else load();

  window.addEventListener('storage', event => {
    if (event.key === STORE_KEY) load();
  });
})();
