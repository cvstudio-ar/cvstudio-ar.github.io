/* CVStudio Centro de Operaciones · RC2 staging sync
   Sincroniza el estado funcional con Supabase sin tocar /admin ni tablas productivas. */
(() => {
  'use strict';

  const STORE_KEY = 'cvstudio_ops_demo_v2';
  const ROW_ID = 'centro-operaciones-prueba';
  const TABLE = 'cvstudio_ops_staging_state';
  const STATUS_ID = 'opsSyncStatus';
  const originalSetItem = Storage.prototype.setItem;
  let client = null;
  let applyingRemote = false;
  let syncTimer = null;
  let initialized = false;

  function status(text, mode = 'local') {
    let el = document.getElementById(STATUS_ID);
    if (!el) {
      const foot = document.querySelector('.sidebar-foot');
      if (!foot) return;
      el = document.createElement('div');
      el.id = STATUS_ID;
      el.className = 'sync-badge';
      foot.appendChild(el);
    }
    el.dataset.mode = mode;
    el.innerHTML = `<span></span>${text}`;
  }

  function parseLocal() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); }
    catch (_) { return null; }
  }

  function stamp(state) {
    if (!state || typeof state !== 'object') return state;
    state._sync = {
      ...(state._sync || {}),
      updatedAt: new Date().toISOString(),
      source: 'browser'
    };
    return state;
  }

  async function pushState(rawValue) {
    if (!client || applyingRemote) return;
    let payload;
    try { payload = stamp(JSON.parse(rawValue)); }
    catch (_) { return; }
    // Persistimos también el sello local para comparar correctamente al recargar.
    originalSetItem.call(localStorage, STORE_KEY, JSON.stringify(payload));
    status('Guardando en Supabase…', 'syncing');
    const { error } = await client.from(TABLE).upsert({
      id: ROW_ID,
      payload,
      updated_at: payload._sync.updatedAt,
      updated_by: 'pablexe'
    }, { onConflict: 'id' });
    if (error) {
      console.warn('[CVStudio RC2] No se pudo guardar en Supabase:', error.message);
      status('Modo local · falta activar Supabase', 'warning');
      return;
    }
    status('Supabase conectado', 'connected');
  }

  function schedulePush(rawValue) {
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => pushState(rawValue), 350);
  }

  Storage.prototype.setItem = function(key, value) {
    originalSetItem.call(this, key, value);
    if (this === localStorage && key === STORE_KEY && initialized && !applyingRemote) {
      schedulePush(value);
    }
  };

  async function pullRemote() {
    status('Conectando Supabase…', 'syncing');
    const { data, error } = await client.from(TABLE)
      .select('payload,updated_at')
      .eq('id', ROW_ID)
      .maybeSingle();

    if (error) {
      console.warn('[CVStudio RC2] Tabla de staging no disponible:', error.message);
      status('Modo local · ejecutar SQL RC2', 'warning');
      initialized = true;
      return;
    }

    const local = parseLocal();
    const remote = data?.payload && Object.keys(data.payload).length ? data.payload : null;
    const localTime = Date.parse(local?._sync?.updatedAt || 0) || 0;
    const remoteTime = Date.parse(remote?._sync?.updatedAt || data?.updated_at || 0) || 0;

    if (remote && remoteTime > localTime) {
      applyingRemote = true;
      originalSetItem.call(localStorage, STORE_KEY, JSON.stringify(remote));
      applyingRemote = false;
      status('Datos recuperados de Supabase', 'connected');
      sessionStorage.setItem('cvstudio_ops_rc2_remote_loaded', '1');
      window.location.reload();
      return;
    }

    initialized = true;
    if (local) await pushState(JSON.stringify(local));
    else status('Supabase conectado', 'connected');
  }

  async function boot() {
    if (!window.supabase || !window.CVSTUDIO_SUPABASE_URL || !window.CVSTUDIO_SUPABASE_PUBLISHABLE_KEY) {
      status('Modo local · configuración ausente', 'warning');
      initialized = true;
      return;
    }
    try {
      client = window.supabase.createClient(
        window.CVSTUDIO_SUPABASE_URL,
        window.CVSTUDIO_SUPABASE_PUBLISHABLE_KEY,
        { auth: { persistSession: true, autoRefreshToken: true } }
      );
      await pullRemote();
    } catch (error) {
      console.warn('[CVStudio RC2] Error de conexión:', error);
      status('Modo local · error de conexión', 'warning');
      initialized = true;
    }
  }

  window.addEventListener('DOMContentLoaded', boot, { once: true });
})();
