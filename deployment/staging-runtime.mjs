// Included lexically in the generated Worker; all application fetches pass here.
const testActions = new Set(['', 'siac-form-notification', 'web-commerce-intake', 'web-commerce-catalog', 'web-commerce-project', 'web-commerce-checkout', 'web-commerce-pay', 'mercadopago-products', 'mercadopago-create-preference']);
const databaseTables = new Set(['clientes', 'solicitudes', 'cvstudio_web_intakes', 'servicios_precios', 'pedidos_mercadopago', 'pedidos_eventos', 'web_commerce_settings', 'web_commerce_projects', 'web_commerce_charges', 'web_notification_outbox']);
const reply = (data, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store', 'X-CVStudio-Environment': 'staging' } });

export function safeFetch(env, network = globalThis.fetch) {
  return async (input, init = {}) => {
    const url = new URL(typeof input === 'string' ? input : input.url);
    if (url.origin === config.db) {
      const table = url.pathname.match(/^\/rest\/v1\/([^/]+)$/)?.[1];
      const storage = url.pathname.startsWith('/storage/v1/object/cvstudio-web-intakes/');
      if (!databaseTables.has(table) && !storage) throw new Error('Endpoint Supabase no habilitado en pruebas');
      return network(input, { ...init, redirect: 'error' });
    }
    // Notifications are deliberately simulated, never transmitted to customers.
    if (url.href === 'https://api.resend.com/emails' && init.method === 'POST') return reply({ id: 'STAGING-SIMULATED-' + crypto.randomUUID() });
    if (url.origin !== 'https://api.mercadopago.com' || !/^\/(checkout\/preferences|v1\/payments(?:\/\d+)?)$/.test(url.pathname)) throw new Error('Destino externo no habilitado en pruebas');
    if (!/^TEST-/.test(env.MERCADOPAGO_TEST_ACCESS_TOKEN || '')) throw new Error('Se requiere una credencial TEST de Mercado Pago');
    const response = await network(input, { ...init, redirect: 'error' });
    const data = await response.json();
    if (response.ok) {
      if (url.pathname === '/checkout/preferences') {
        const checkout = new URL(data.sandbox_init_point);
        if (checkout.protocol !== 'https:' || !/^sandbox\.mercadopago\.(com|com\.ar)$/.test(checkout.hostname)) throw new Error('Mercado Pago no devolvió un checkout sandbox');
        data.init_point = data.sandbox_init_point;
      } else if (data.live_mode !== false) throw new Error('Pago ajeno al modo de prueba');
    }
    return Response.json(data, { status: response.status });
  };
}

export default {
  async fetch(request, bindings) {
    const url = new URL(request.url);
    if (url.origin !== config.worker) return reply({ ok: false, message: 'Worker de destino incorrecto' }, 403);
    if (request.method === 'GET' && url.pathname === '/health') return reply({ ok: true, environment: 'staging', worker: 'cvstudio-contacto-pruebas', revision: config.revision, notifications: 'simulated' });
    const origin = request.headers.get('Origin');
    if (origin !== config.site && origin !== null) return reply({ ok: false, message: 'Origen de pruebas requerido' }, 403);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': config.site, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CVStudio-Test-Key', Vary: 'Origin' } });
    if (!bindings.STAGING_SUPABASE_SERVICE_ROLE_KEY || !bindings.STAGING_ACCESS_KEY) return reply({ ok: false, message: 'Faltan secretos exclusivos de pruebas' }, 503);
    const webhook = url.pathname === '/webhooks/mercadopago' && request.method === 'POST';
    if (!webhook && request.headers.get('X-CVStudio-Test-Key') !== bindings.STAGING_ACCESS_KEY) return reply({ ok: false }, 401);
    if (request.method !== 'POST' || (!webhook && url.pathname !== '/')) return reply({ ok: false }, 404);
    let body;
    try { body = await request.clone().json(); } catch { return reply({ ok: false }, 400); }
    if (!webhook && !testActions.has(String(body.action || ''))) return reply({ ok: false, message: 'Acción excluida del entorno de pruebas' }, 403);
    if (body.provider && body.provider !== 'mercadopago') return reply({ ok: false, message: 'Solo Mercado Pago sandbox está habilitado' }, 400);
    // Ignore every production-named binding, even if accidentally attached.
    const env = { SUPABASE_SERVICE_ROLE_KEY: bindings.STAGING_SUPABASE_SERVICE_ROLE_KEY, MERCADOPAGO_ACCESS_TOKEN: /^TEST-/.test(bindings.MERCADOPAGO_TEST_ACCESS_TOKEN || '') ? bindings.MERCADOPAGO_TEST_ACCESS_TOKEN : undefined, MERCADOPAGO_PUBLIC_KEY: bindings.MERCADOPAGO_TEST_PUBLIC_KEY, RESEND_API_KEY: 'simulated-no-network' };
    const response = await createApplication(safeFetch(bindings)).fetch(request, env);
    const headers = new Headers(response.headers);
    headers.set('X-CVStudio-Environment', 'staging');
    const payload = await response.json();
    payload.testEnvironment = { notifications: 'simulated', payments: 'sandbox' };
    if (body.action === 'siac-form-notification' && payload.ok) payload.message = 'Notificación simulada; no se envió ningún correo.';
    return new Response(JSON.stringify(payload), { status: response.status, headers });
  }
};
