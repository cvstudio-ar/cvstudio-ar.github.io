'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const src = fs.readFileSync(path.join(__dirname, '../js/cvstudio-meta-pixel.js'), 'utf8');
function harness(hostname, accepted) {
  const scripts = [];
  const handlers = {};
  const headScript = { parentNode: { insertBefore: el => scripts.push(el) } };
  const doc = {
    createElement: () => ({ async: false, src: '' }),
    getElementsByTagName: () => [headScript],
    addEventListener: (name, fn) => { handlers[name] = fn; }
  };
  const window = { CVStudioCampaignAttribution: { isAnalyticsEnabled: () => accepted } };
  const location = { hostname, href: 'https://' + hostname + '/' , origin: 'https://' + hostname };
  vm.runInNewContext(src, { window, document: doc, location, URL });
  return { window, scripts, handlers };
}
test('Meta Pixel is blocked when consent is missing', () => {
  const h = harness('cvstudio.com.ar', false);
  assert.equal(h.window.CVStudioMarketingPixel.enable(), false);
  assert.equal(h.scripts.length, 0);
  assert.equal(h.window.fbq, undefined);
});
test('Meta Pixel is blocked on Cloudflare staging even with consent', () => {
  const h = harness('cvstudio-marketing-pruebas.cvstudioargentina.workers.dev', true);
  assert.equal(h.window.CVStudioMarketingPixel.enable(), false);
  assert.equal(h.scripts.length, 0);
});
test('Meta Pixel loads only on approved production host after opt-in', () => {
  const h = harness('cvstudio.com.ar', true);
  assert.equal(h.window.CVStudioMarketingPixel.enable(), true);
  assert.equal(h.scripts.length, 1);
  assert.match(h.scripts[0].src, /connect\.facebook\.net\/en_US\/fbevents\.js$/);
  assert.equal(h.window.fbq.queue.length, 2);
  assert.equal(h.window.fbq.queue[0][0], 'init');
  assert.equal(h.window.fbq.queue[0][1], '1486370042926294');
  assert.equal(h.window.fbq.queue[1][1], 'PageView');
  assert.equal(h.window.CVStudioMarketingPixel.enable(), false);
  assert.equal(h.scripts.length, 1);
});
