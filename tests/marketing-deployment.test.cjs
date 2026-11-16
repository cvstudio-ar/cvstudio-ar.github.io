'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const fixture = {
  STAGING_SUPABASE_URL: 'https://aaaaaaaaaaaaaaaaaaaa.supabase.co',
  STAGING_SUPABASE_PUBLISHABLE_KEY: 'fixture-public-key',
  STAGING_SITE_ORIGIN: 'https://cvstudio-marketing-pruebas.pages.dev',
  STAGING_WORKER_URL: 'https://cvstudio-contacto-pruebas.fixture.workers.dev',
  GITHUB_SHA: 'fixture-revision'
};
const builder = import('../scripts/deploy/build-staging.mjs');
const modulePromise = builder.then(({ build, configuration }) => {
  const source = fs.readFileSync(path.join(root, 'config/cloudflare-worker-contacto.js'), 'utf8');
  return import('data:text/javascript;base64,' + Buffer.from(build(source, configuration(fixture))).toString('base64'));
});
const bindings = { STAGING_ACCESS_KEY: 'x'.repeat(40), STAGING_SUPABASE_SERVICE_ROLE_KEY: 'fixture-private', MERCADOPAGO_TEST_ACCESS_TOKEN: 'TEST-fixture' };
const request = (body = {}, extra = {}) => new Request(fixture.STAGING_WORKER_URL + '/', { method: 'POST', headers: { Origin: fixture.STAGING_SITE_ORIGIN, 'Content-Type': 'application/json', 'X-CVStudio-Test-Key': bindings.STAGING_ACCESS_KEY, ...extra }, body: JSON.stringify(body) });

test('compilación rechaza Supabase de producción y de Javier, frontend real y Worker real', async () => {
  const { configuration } = await builder;
  for (const ref of ['eqepkoegzyqklpxkrkhm', 'uxfsuhvmfxguqlvzlavp']) assert.throws(() => configuration({ ...fixture, STAGING_SUPABASE_URL: `https://${ref}.supabase.co` }), /independiente/);
  assert.throws(() => configuration({ ...fixture, STAGING_WORKER_URL: 'https://cvstudio-contacto.fixture.workers.dev' }), /destino/);
  assert.throws(() => configuration({ ...fixture, STAGING_SITE_ORIGIN: 'https://cvstudio.com.ar' }), /separado/);
  assert.throws(() => configuration({ ...fixture, STAGING_SITE_ORIGIN: 'https://lasmorillas.example' }), /exclusivo/);
});
test('cambios inesperados del código detienen la compilación', async () => {
  const { build, configuration } = await builder;
  assert.throws(() => build('export default {};', configuration(fixture)), /contrato/);
});
test('health identifica entorno y revisión sin exponer secretos', async () => {
  const { default: worker } = await modulePromise;
  const response = await worker.fetch(new Request(fixture.STAGING_WORKER_URL + '/health'), bindings);
  const body = await response.json();
  assert.equal(body.environment, 'staging');
  assert.equal(body.revision, 'fixture-revision');
  assert.equal(body.notifications, 'simulated');
  assert.equal(JSON.stringify(body).includes('fixture-private'), false);
  assert.equal(worker.scheduled, undefined);
});
test('rechaza orígenes y host de producción, acceso anónimo y acciones administrativas', async () => {
  const { default: worker } = await modulePromise;
  assert.equal((await worker.fetch(new Request('https://cvstudio-contacto.fixture.workers.dev/health'), bindings)).status, 403);
  assert.equal((await worker.fetch(request({}, { Origin: 'https://cvstudio.com.ar' }), bindings)).status, 403);
  assert.equal((await worker.fetch(request({}, { 'X-CVStudio-Test-Key': '' }), bindings)).status, 401);
  assert.equal((await worker.fetch(request({ action: 'portfolio-admin-delete' }), bindings)).status, 403);
  assert.equal((await worker.fetch(request({ action: 'web-commerce-checkout', provider: 'tiendanube' }), bindings)).status, 400);
});
test('secretos con nombres de producción no habilitan el Worker', async () => {
  const { default: worker } = await modulePromise;
  assert.equal((await worker.fetch(request(), { SUPABASE_SERVICE_ROLE_KEY: 'production', RESEND_API_KEY: 'production' })).status, 503);
});
test('tráfico de base de datos va solo a staging, sin redirecciones', async () => {
  const { safeFetch } = await modulePromise;
  const calls = [];
  const fetch = safeFetch(bindings, async (url, options) => { calls.push({ url, options }); return Response.json([]); });
  await fetch(fixture.STAGING_SUPABASE_URL + '/rest/v1/clientes', { method: 'POST', body: '{}' });
  assert.equal(calls[0].options.redirect, 'error');
  for (const url of ['https://eqepkoegzyqklpxkrkhm.supabase.co/rest/v1/clientes', 'https://uxfsuhvmfxguqlvzlavp.supabase.co/rest/v1/clientes', fixture.STAGING_SUPABASE_URL + '/rest/v1/unrelated_table', 'https://graph.facebook.com/messages']) await assert.rejects(fetch(url));
  assert.equal(calls.length, 1);
});
test('notificaciones simuladas no hacen conexiones externas', async () => {
  const { safeFetch } = await modulePromise;
  const fetch = safeFetch(bindings, () => { throw new Error('No debe conectar'); });
  const response = await fetch('https://api.resend.com/emails', { method: 'POST' });
  assert.match((await response.json()).id, /^STAGING-SIMULATED-/);
});
test('pago con credencial ajena a TEST o live_mode real se bloquea', async () => {
  const { safeFetch } = await modulePromise;
  await assert.rejects(safeFetch({ MERCADOPAGO_TEST_ACCESS_TOKEN: 'APP_USR-invalid' }, () => { throw Error('No conectar'); })('https://api.mercadopago.com/v1/payments/123'), /TEST/);
  await assert.rejects(safeFetch(bindings, async () => Response.json({ live_mode: true }))('https://api.mercadopago.com/v1/payments/123'), /modo de prueba/);
});
test('checkout devuelve exclusivamente la URL sandbox y valida el host', async () => {
  const { safeFetch } = await modulePromise;
  const response = await safeFetch(bindings, async () => Response.json({ init_point: 'https://www.mercadopago.com.ar/checkout', sandbox_init_point: 'https://sandbox.mercadopago.com.ar/checkout' }))('https://api.mercadopago.com/checkout/preferences');
  assert.equal((await response.json()).init_point, 'https://sandbox.mercadopago.com.ar/checkout');
  await assert.rejects(safeFetch(bindings, async () => Response.json({ sandbox_init_point: 'https://example.invalid' }))('https://api.mercadopago.com/checkout/preferences'), /sandbox/);
});
test('producción permanece bloqueada incluso con variables de habilitación', () => {
  const result = spawnSync(process.execPath, ['scripts/deploy/production-preflight.mjs'], { cwd: root, env: { ...process.env, GITHUB_REF: 'refs/heads/main', GITHUB_SHA: 'fixture', CVSTUDIO_PRODUCTION_APPROVED_SHA: 'fixture' }, encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Producción permanece bloqueada/);
  const config = JSON.parse(fs.readFileSync(path.join(root, 'deployment/wrangler.staging.json'), 'utf8'));
  assert.equal(config.name, 'cvstudio-contacto-pruebas');
  assert.deepEqual(config.routes, []);
  assert.deepEqual(config.triggers.crons, []);
});
