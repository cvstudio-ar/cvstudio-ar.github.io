import assert from 'node:assert/strict';
import { Miniflare, convertV4MiniflareOptions } from '../../deployment/node_modules/miniflare/dist/src/index.js';
import fs from 'node:fs';
const manifest = JSON.parse(fs.readFileSync('deployment/generated/manifest.json', 'utf8'));
const mf = new Miniflare(convertV4MiniflareOptions({ modules: true, scriptPath: 'deployment/generated/staging-worker.mjs', compatibilityDate: '2026-11-15', bindings: { STAGING_ACCESS_KEY: 'fixture-only', STAGING_SUPABASE_SERVICE_ROLE_KEY: 'fixture-only' } }));
try {
  const base = process.env.STAGING_WORKER_URL || 'https://cvstudio-contacto-pruebas.fixture.workers.dev';
  const response = await mf.dispatchFetch(base + '/health');
  assert.equal(response.status, 200);
  const health = await response.json();
  assert.equal(health.environment, 'staging');
  assert.equal(health.revision, manifest.revision);
  const denied = await mf.dispatchFetch(base + '/', { method: 'POST', headers: { Origin: manifest.site, 'Content-Type': 'application/json' }, body: '{}' });
  assert.equal(denied.status, 401);
  console.log('workerd local: health 200; petición sin autorización 401. Sin tráfico de proveedores.');
} finally { await mf.dispose(); }
