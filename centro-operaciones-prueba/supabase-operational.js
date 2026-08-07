/* CVStudio Centro de Operaciones · RC4 v2.4
   Persistencia normalizada de staging en Supabase.
   Mantiene la UI funcional existente y sincroniza entidades separadas para
   Clientes → Producción → Administración, sin tocar las tablas productivas. */
(() => {
  'use strict';

  const STORE_KEY = 'cvstudio_ops_operational_v2';
  const STATUS_ID = 'opsSyncStatus';
  const META_ID = 'centro-operaciones-prueba';
  const originalSetItem = Storage.prototype.setItem;
  let client = null;
  let initialized = false;
  let applyingRemote = false;
  let timer = null;
  let lastSerialized = '';
  let realtimeChannel = null;

  const TABLES = {
    meta: 'cvstudio_ops_stage_meta',
    clients: 'cvstudio_ops_stage_clients',
    jobs: 'cvstudio_ops_stage_jobs',
    payments: 'cvstudio_ops_stage_payments',
    executions: 'cvstudio_ops_stage_executions',
    expenses: 'cvstudio_ops_stage_expenses',
    activities: 'cvstudio_ops_stage_activities',
    services: 'cvstudio_ops_stage_services',
    collaborators: 'cvstudio_ops_stage_collaborators'
  };

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

  function normalizeState(state) {
    if (!state || typeof state !== 'object') return null;
    return {
      ...state,
      version: 4,
      rules: state.rules || { colab: 20, growth: 15, reserve: 5, company: 60 },
      prices: state.prices || {},
      clients: Array.isArray(state.clients) ? state.clients : [],
      jobs: Array.isArray(state.jobs) ? state.jobs : [],
      payments: Array.isArray(state.payments) ? state.payments : [],
      executions: Array.isArray(state.executions) ? state.executions : [],
      expenses: Array.isArray(state.expenses) ? state.expenses : [],
      activities: Array.isArray(state.activities) ? state.activities : [],
      collaborators: Array.isArray(state.collaborators) ? state.collaborators : [],
      urlSpaces: Array.isArray(state.urlSpaces) ? state.urlSpaces : []
    };
  }

  function row(entity, extra = {}) {
    return {
      id: Number(entity.id),
      workspace_id: META_ID,
      payload: entity,
      updated_at: new Date().toISOString(),
      ...extra
    };
  }

  async function replaceTable(table, entities) {
    const { error: deleteError } = await client.from(table).delete().eq('workspace_id', META_ID);
    if (deleteError) throw deleteError;
    if (!entities.length) return;
    const { error: insertError } = await client.from(table).insert(entities.map(item => row(item)));
    if (insertError) throw insertError;
  }

  async function pushState(rawValue) {
    if (!client || applyingRemote) return;
    let state;
    try { state = normalizeState(JSON.parse(rawValue)); }
    catch (_) { return; }
    if (!state) return;

    const serialized = JSON.stringify(state);
    if (serialized === lastSerialized) return;
    status('Guardando cambios…', 'syncing');

    try {
      const services = Object.entries(state.prices).map(([name, price], index) => ({
        id: index + 1,
        workspace_id: META_ID,
        name,
        price: Number(price || 0),
        active: true,
        updated_at: new Date().toISOString()
      }));

      const meta = {
        id: META_ID,
        rules: { ...(state.rules || {}), __urlSpaces: state.urlSpaces || [] },
        version: state.version,
        updated_at: new Date().toISOString(),
        updated_by: 'pablexe'
      };

      const { error: metaError } = await client.from(TABLES.meta).upsert(meta, { onConflict: 'id' });
      if (metaError) throw metaError;

      await Promise.all([
        replaceTable(TABLES.clients, state.clients),
        replaceTable(TABLES.jobs, state.jobs),
        replaceTable(TABLES.payments, state.payments),
        replaceTable(TABLES.executions, state.executions),
        replaceTable(TABLES.expenses, state.expenses),
        replaceTable(TABLES.activities, state.activities),
        replaceTable(TABLES.collaborators, state.collaborators),
        (async () => {
          const { error: d } = await client.from(TABLES.services).delete().eq('workspace_id', META_ID);
          if (d) throw d;
          if (services.length) {
            const { error: i } = await client.from(TABLES.services).insert(services);
            if (i) throw i;
          }
        })()
      ]);

      lastSerialized = serialized;
      status('Supabase operativo', 'connected');
    } catch (error) {
      console.error('[CVStudio RC4] Error al sincronizar:', error);
      status('Error de sincronización', 'warning');
    }
  }

  function schedulePush(rawValue) {
    clearTimeout(timer);
    timer = setTimeout(() => pushState(rawValue), 500);
  }

  Storage.prototype.setItem = function(key, value) {
    originalSetItem.call(this, key, value);
    if (this === localStorage && key === STORE_KEY && initialized && !applyingRemote) {
      schedulePush(value);
    }
  };

  async function selectPayload(table) {
    const { data, error } = await client.from(table)
      .select('payload')
      .eq('workspace_id', META_ID)
      .order('id', { ascending: true });
    if (error) throw error;
    return (data || []).map(item => item.payload).filter(Boolean);
  }

  async function pullRemote() {
    status('Cargando Supabase…', 'syncing');
    const { data: meta, error: metaError } = await client.from(TABLES.meta)
      .select('rules,version,updated_at')
      .eq('id', META_ID)
      .maybeSingle();
    if (metaError) throw metaError;

    if (!meta) {
      initialized = true;
      const local = parseLocal();
      if (local) await pushState(JSON.stringify(local));
      else status('Supabase operativo', 'connected');
      return;
    }

    const [clients, jobs, payments, executions, expenses, activities, collaborators, servicesResult] = await Promise.all([
      selectPayload(TABLES.clients),
      selectPayload(TABLES.jobs),
      selectPayload(TABLES.payments),
      selectPayload(TABLES.executions),
      selectPayload(TABLES.expenses),
      selectPayload(TABLES.activities),
      selectPayload(TABLES.collaborators),
      client.from(TABLES.services).select('name,price').eq('workspace_id', META_ID).order('id')
    ]);
    if (servicesResult.error) throw servicesResult.error;

    const local = normalizeState(parseLocal()) || {};
    const remoteRules = meta.rules || local.rules || {};
    const remoteUrlSpaces = Array.isArray(remoteRules.__urlSpaces) ? remoteRules.__urlSpaces : (local.urlSpaces || []);
    const cleanRules = { ...remoteRules };
    delete cleanRules.__urlSpaces;
    const prices = {};
    (servicesResult.data || []).forEach(service => { prices[service.name] = Number(service.price); });

    const remote = normalizeState({
      ...local,
      version: Number(meta.version || 4),
      rules: cleanRules,
      prices: Object.keys(prices).length ? prices : local.prices,
      clients,
      jobs,
      payments,
      executions,
      expenses,
      activities,
      collaborators,
      urlSpaces: remoteUrlSpaces,
      _sync: { updatedAt: meta.updated_at, source: 'supabase-normalized' }
    });

    applyingRemote = true;
    originalSetItem.call(localStorage, STORE_KEY, JSON.stringify(remote));
    applyingRemote = false;
    lastSerialized = JSON.stringify(remote);
    initialized = true;
    status('Supabase operativo', 'connected');

    sessionStorage.setItem('cvstudio_ops_rc3_loaded', '1');
    window.dispatchEvent(new CustomEvent('cvstudio:state-updated', { detail: { source: 'supabase' } }));
  }

  async function verifySchema() {
    const checks = await Promise.all(Object.values(TABLES).map(async (table) => {
      const query = table === TABLES.meta
        ? client.from(table).select('id', { count: 'exact', head: true })
        : client.from(table).select('id', { count: 'exact', head: true }).eq('workspace_id', META_ID);
      const { error } = await query;
      return { table, error };
    }));
    const failed = checks.find(item => item.error);
    if (failed) {
      const error = new Error(`${failed.table}: ${failed.error.message}`);
      error.code = failed.error.code;
      throw error;
    }
  }

  function startRealtime() {
    if (!client || realtimeChannel) return;
    realtimeChannel = client.channel('cvstudio-ops-rc4')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: TABLES.meta, filter: `id=eq.${META_ID}`
      }, payload => {
        if (payload?.new?.updated_by === 'pablexe') return;
        status('Cambios remotos detectados', 'syncing');
        setTimeout(() => pullRemote().catch(error => {
          console.error('[CVStudio RC4] Error al actualizar en tiempo real:', error);
          status('Error de actualización', 'warning');
        }), 250);
      })
      .subscribe();
  }

  async function boot() {
    if ((!window.supabase && !window.cvstudioSupabase) || !window.CVSTUDIO_SUPABASE_URL || !window.CVSTUDIO_SUPABASE_PUBLISHABLE_KEY) {
      initialized = true;
      status('Modo local · configuración ausente', 'warning');
      return;
    }
    try {
      client = window.cvstudioSupabase || window.supabase.createClient(
        window.CVSTUDIO_SUPABASE_URL,
        window.CVSTUDIO_SUPABASE_PUBLISHABLE_KEY,
        { auth: { persistSession: true, autoRefreshToken: true } }
      );
      status('Verificando Supabase…', 'syncing');
      await verifySchema();
      await pullRemote();
      startRealtime();
    } catch (error) {
      console.error('[CVStudio RC4] No se pudo iniciar Supabase:', error);
      initialized = true;
      const message = String(error?.message || 'Error desconocido');
      if (/permission denied|42501/i.test(message)) status('Ejecutar parche SQL RC4', 'warning');
      else if (/does not exist|42P01/i.test(message)) status('Faltan tablas RC3', 'warning');
      else status('Supabase sin conexión', 'warning');
    }
  }

  window.addEventListener('online', () => { status('Reconectando Supabase…', 'syncing'); boot(); });
  window.addEventListener('offline', () => status('Sin conexión · modo local', 'warning'));
  window.addEventListener('DOMContentLoaded', boot, { once: true });
})();
