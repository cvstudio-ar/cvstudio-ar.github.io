'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');
const worker = fs.readFileSync(require('node:path').join(__dirname, '../config/cloudflare-worker-contacto.js'), 'utf8');
const start = worker.indexOf('function cleanCampaignAttribution(raw)');
const end = worker.indexOf('async function handleMercadoPagoWebhook(');
assert.ok(start >= 0 && end > start);
function harness({ active = true, gatewayOK = true } = {}) {
  const orders = [], calls = [], updates = [];
  const context = vm.createContext({
    crypto: webcrypto, console: { error() {} },
    cleanText: (v, n) => String(v ?? '').trim().slice(0, n),
    normalizePhone: v => String(v || '').replace(/\D/g, ''),
    isValidEmail: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    getPaymentProducts: async () => ({ 'cv-profesional': { title: 'Fixture', unit_price: 11500, active } }),
    effectiveProductPrice: p => p.unit_price,
    makeOrderCode: () => 'CVS-FIXTURE',
    savePaymentOrder: async (_env, row) => orders.push(row),
    updatePaymentOrder: async (_env, ref, row) => updates.push({ ref, ...row }),
    addPaymentEvent: async () => {},
    jsonResponse: (payload, status) => ({ payload, status }),
    fetch: async (url, options) => {
      assert.equal(url, 'https://api.mercadopago.com/checkout/preferences');
      calls.push(JSON.parse(options.body));
      return { ok: gatewayOK, json: async () => gatewayOK
        ? { id: 'fixture-preference', init_point: 'https://example.invalid/checkout' }
        : { message: 'Fixture rejection' } };
    }
  });
  vm.runInContext(worker.slice(start, end) + ';globalThis.run=handleMercadoPagoPreference;', context);
  const body = { productId: 'cv-profesional', customerName: 'Cliente Prueba', customerEmail: 'prueba@example.com', customerPhone: '5491100000000', unit_price: 1, attribution: { utm_source: 'instagram', email: 'private@example.com' } };
  return { orders, calls, updates, run: (changes = {}, env = { MERCADOPAGO_ACCESS_TOKEN: 'fixture-not-a-credential' }) => context.run(env, 'https://example.invalid', { ...body, ...changes }) };
}
test('checkout usa precio del catálogo y guarda UTM sin reenviarlas a la pasarela', async () => {
  const h = harness();
  assert.equal((await h.run()).status, 200);
  assert.equal(h.calls[0].items[0].unit_price, 11500);
  assert.equal(h.orders[0].importe, 11500);
  assert.equal(h.orders[0].atribucion.utm_source, 'instagram');
  assert.equal(h.orders[0].atribucion.email, undefined);
  assert.equal(JSON.stringify(h.calls[0]).includes('utm_source'), false);
  assert.equal(h.orders[0].estado_pago, 'pending');
  assert.equal(h.updates.some(row => row.estado_pago === 'approved'), false);
});
test('checkout sin credencial no crea pedidos ni llama a la pasarela', async () => {
  const h = harness();
  assert.equal((await h.run({}, {})).status, 503);
  assert.equal(h.orders.length + h.calls.length, 0);
});
test('servicio inactivo o contacto inválido se rechazan antes de crear el pedido', async () => {
  const inactive = harness({ active: false });
  assert.equal((await inactive.run()).status, 400);
  assert.equal(inactive.orders.length + inactive.calls.length, 0);
  const invalid = harness();
  assert.equal((await invalid.run({ customerEmail: 'invalid' })).status, 400);
  assert.equal(invalid.orders.length + invalid.calls.length, 0);
});
test('rechazo de pasarela registra error y nunca confirma el pago', async () => {
  const h = harness({ gatewayOK: false });
  assert.equal((await h.run()).status, 502);
  assert.equal(h.updates.at(-1).estado_pago, 'error_preferencia');
  assert.equal(h.updates.some(row => row.estado_pago === 'approved'), false);
});
