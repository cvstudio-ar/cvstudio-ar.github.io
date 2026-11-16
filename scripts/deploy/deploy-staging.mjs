import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import './staging-preflight.mjs';
const target = JSON.parse(fs.readFileSync('deployment/wrangler.staging.json', 'utf8'));
if (target.name !== 'cvstudio-contacto-pruebas' || target.routes.length || target.triggers.crons.length) throw new Error('Configuración de destino insegura');
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'cvstudio-staging-'));
try {
  const secrets = Object.fromEntries(['STAGING_SUPABASE_SERVICE_ROLE_KEY', 'STAGING_ACCESS_KEY', 'MERCADOPAGO_TEST_ACCESS_TOKEN', 'MERCADOPAGO_TEST_PUBLIC_KEY'].filter(key => process.env[key]).map(key => [key, process.env[key]]));
  const secretFile = path.join(directory, 'secrets.json');
  fs.writeFileSync(secretFile, JSON.stringify(secrets), { mode: 0o600 });
  const result = spawnSync('deployment/node_modules/.bin/wrangler', ['deploy', '--config', 'deployment/wrangler.staging.json', '--secrets-file', secretFile], { stdio: 'inherit', shell: false, env: { ...process.env, WRANGLER_SEND_METRICS: 'false' } });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error('Falló el despliegue del Worker de pruebas');
} finally { fs.rmSync(directory, { recursive: true, force: true }); }
