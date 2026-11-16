'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../js/cvstudio-marketing-consent.js'), 'utf8');
function harness(choice) {
  const elements = [], scripts = [], listeners = {}, session = new Map();
  const local = new Map(choice ? [['cvstudio_analytics_consent_v1', choice]] : []);
  let reloads = 0;
  const storage = map => ({ getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, value), removeItem: key => map.delete(key) });
  const document = {
    documentElement: { dataset: { cvstudioPage: 'webs' } },
    head: { append: e => scripts.push(e) }, body: { append() {} },
    createElement: tag => {
      const e = { tag, style: {}, setAttribute() {}, append() {}, remove() {}, addEventListener(event, handler) { this[event] = handler; } };
      elements.push(e); return e;
    },
    getElementById: id => elements.find(e => e.id === id),
    addEventListener: (event, handler) => { listeners[event] = handler; }
  };
  const window = {};
  vm.runInNewContext(source, { window, document, localStorage: storage(local), sessionStorage: storage(session), URL, URLSearchParams,
    location: { search: '?utm_source=instagram&utm_campaign=webs&email=private%40example.com', pathname: '/otros-servicios/', href: 'https://example.invalid/otros-servicios/', reload() { reloads++; } } });
  listeners.DOMContentLoaded();
  return { window, elements, scripts, session, reloads: () => reloads,
    click: label => { const button = elements.filter(e => e.textContent === label).at(-1); assert.ok(button, label); button.click(); } };
}
test('sin decisión o con rechazo no carga GA ni conserva campaña', () => {
  for (const choice of [undefined, 'rejected']) {
    const h = harness(choice);
    assert.equal(h.scripts.length, 0);
    assert.equal(h.window.CVStudioCampaignAttribution.getCampaign(), null);
    assert.equal(h.window.CVStudioCampaignAttribution.track('whatsapp_click'), false);
    assert.equal(h.session.size, 0);
  }
});
test('aceptación carga una sola etiqueta y filtra datos personales de eventos', () => {
  const h = harness();
  h.click('Aceptar estadísticas');
  h.click('Privacidad y estadísticas');
  h.click('Aceptar estadísticas');
  assert.equal(h.scripts.length, 1);
  assert.equal(h.window.CVStudioCampaignAttribution.getCampaign().utm_source, 'instagram');
  assert.equal(h.window.CVStudioCampaignAttribution.getCampaign().email, undefined);
  assert.equal(h.window.CVStudioCampaignAttribution.track('web_checkout_started', { product_id: 'web-panel', email: 'private@example.com', customer_name: 'Prueba' }), true);
  const event = h.window.dataLayer.at(-1);
  assert.equal(event[2].product_id, 'web-panel');
  assert.equal(event[2].email, undefined);
  assert.equal(event[2].customer_name, undefined);
});
test('retirar permiso borra atribución, bloquea eventos y solicita recarga', () => {
  const h = harness('accepted');
  h.click('Privacidad y estadísticas');
  h.click('Rechazar');
  assert.equal(h.reloads(), 1);
  assert.equal(h.session.size, 0);
  assert.equal(h.window.CVStudioCampaignAttribution.isAnalyticsEnabled(), false);
  assert.equal(h.window.CVStudioCampaignAttribution.track('whatsapp_click'), false);
});
