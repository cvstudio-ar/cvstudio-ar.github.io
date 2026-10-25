/* CVStudio: estado real y alertas de sincronización por origen. */
(() => {
  'use strict';
  const sources = new Map();
  const timers = new Map();
  const labels = {prices:'Publicación de precios',operations:'Guardado operativo',production:'Lectura de datos reales'};
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const issues = () => [...sources].filter(([,s]) => s.error);
  const summary = () => issues().length ? 'Sincronización con errores' : [...sources.values()].some(s=>s.mode==='syncing') ? 'Sincronizando…' : sources.size ? 'Conexión verificada' : 'Sin verificar';
  function html() {
    const rows = issues();
    return rows.length ? rows.map(([key,s]) => '<div class="sync-issue" style="display:block;min-width:0;margin:8px 0;padding:10px 12px;border:1px solid #ffffff20;border-radius:8px"><div style="min-width:0"><strong style="display:block;font-size:13px;line-height:1.4">'+esc(labels[key])+' · requiere atención</strong><small style="display:block;font-size:12px;line-height:1.5;margin-top:4px;overflow-wrap:anywhere">'+esc(s.error)+'</small><small style="display:block;font-size:11px;line-height:1.4;opacity:.8;margin-top:4px">Última confirmación: '+esc(s.okAt ? new Date(s.okAt).toLocaleString('es-AR') : 'Sin confirmar en esta sesión')+'</small></div></div>').join('')+'<button class="button primary" data-sync-retry>Reintentar sincronización</button>' : '<p>'+esc(summary())+'</p>';
  }
  function render() {
    let badge = document.getElementById('opsSyncStatus');
    if (!badge) {
      const foot = document.querySelector('.sidebar-foot');
      if (foot) { badge = document.createElement('div'); badge.id='opsSyncStatus'; badge.className='sync-badge'; foot.appendChild(badge); }
    }
    const errors=issues(), busy=[...sources.values()].some(s=>s.mode==='syncing');
    if (badge) { badge.dataset.mode=errors.length?'warning':busy?'syncing':'connected'; badge.innerHTML='<span></span>'+esc(summary()); badge.title=errors.map(([k,s])=>labels[k]+': '+s.error).join('\n'); }
    let banner=document.getElementById('syncErrorBanner');
    if (!banner) {
      const workspace=document.querySelector('.workspace');
      if (workspace) { banner=document.createElement('section'); banner.id='syncErrorBanner'; banner.setAttribute('role','alert'); banner.style.cssText='margin:12px 16px 0;padding:14px 18px;border:1px solid #ff5d73;border-radius:12px;background:#351723;color:#fff;overflow-wrap:anywhere;min-width:0;max-height:220px;overflow:auto'; workspace.insertBefore(banner,document.getElementById('appMain')); }
    }
    if (banner) { banner.hidden=!errors.length; banner.innerHTML=errors.length?'<strong>La sincronización necesita atención</strong>'+html():''; }
    const panel=document.querySelector('[data-sync-settings]');
    if(panel) panel.textContent=summary();
  }
  function report(key,text,mode) {
    clearTimeout(timers.get(key));
    if(mode==='syncing') timers.set(key,setTimeout(()=>report(key,'La operación lleva más de 30 segundos sin confirmación. Revisá la conexión y reintentá.','warning'),30000));
    const previous=sources.get(key)||{};
    const state={...previous,text,mode};
    if(mode==='warning') state.error=text;
    if(mode==='connected') {state.error='';state.okAt=Date.now();}
    sources.set(key,state);
    render();
    window.dispatchEvent(new CustomEvent('cvstudio:sync-health'));
    if(mode==='warning' && previous.error!==text) window.toast?.('No se pudo sincronizar. Revisá la alerta de conexión.');
  }
  window.CVStudioSyncHealth={report,html,summary,count:()=>issues().length};
  document.addEventListener('click',async e=>{
    const button=e.target.closest('[data-sync-retry]');
    if(!button)return;
    button.disabled=true;button.textContent='Reintentando…';
    try { await window.CVStudioRetryPriceSync?.(); await window.CVStudioRetryOperationalSync?.(); await window.CVStudioRetryRealSync?.(); }
    finally {render();if(button.isConnected){button.disabled=false;button.textContent='Reintentar sincronización';}}
  });
})();
