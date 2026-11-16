import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const forbiddenRefs = ['eqepkoegzyqklpxkrkhm', 'uxfsuhvmfxguqlvzlavp'];
export function configuration(env = process.env) {
  const origin = (name) => {
    const value = env[name];
    if (!value) throw new Error(`Falta ${name}`);
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.origin !== value || url.username || url.password) throw new Error(`${name} debe ser un origen HTTPS sin ruta`);
    return url;
  };
  const db = origin('STAGING_SUPABASE_URL');
  if (!/^[a-z]{20}\.supabase\.co$/.test(db.hostname) || forbiddenRefs.some(ref => db.hostname.startsWith(ref + '.'))) throw new Error('Supabase debe ser un proyecto independiente de pruebas');
  const site = origin('STAGING_SITE_ORIGIN');
  const worker = origin('STAGING_WORKER_URL');
  if (!/^cvstudio-contacto-pruebas\.[a-z0-9-]+\.workers\.dev$/.test(worker.hostname)) throw new Error('El destino debe ser cvstudio-contacto-pruebas en workers.dev');
  if (site.hostname === 'cvstudio.com.ar' || site.hostname.endsWith('.cvstudio.com.ar') || site.hostname === 'cvstudio-ar.github.io') throw new Error('El frontend debe estar separado de producción');
  if (!/^cvstudio-(marketing|contacto)-pruebas\.[a-z0-9.-]+$/.test(site.hostname)) throw new Error('El frontend debe usar un nombre exclusivo de pruebas de CVStudio');
  if (!env.STAGING_SUPABASE_PUBLISHABLE_KEY) throw new Error('Falta STAGING_SUPABASE_PUBLISHABLE_KEY');
  return { db: db.origin, site: site.origin, worker: worker.origin, anon: env.STAGING_SUPABASE_PUBLISHABLE_KEY, revision: env.GITHUB_SHA || 'local' };
}

export function build(source, config) {
  const replaceOne = (pattern, value) => {
    if ([...source.matchAll(new RegExp(pattern.source, 'g'))].length !== 1) throw new Error(`Cambió el contrato de compilación: ${pattern.source}`);
    source = source.replace(pattern, () => value);
  };
  replaceOne(/const ALLOWED_ORIGINS = .*;/, `const ALLOWED_ORIGINS = new Set([${JSON.stringify(config.site)}]);`);
  replaceOne(/const isAllowedOrigin=.*;/, 'const isAllowedOrigin=origin=>ALLOWED_ORIGINS.has(origin);');
  replaceOne(/const SUPABASE_URL = .*;/, `const SUPABASE_URL = ${JSON.stringify(config.db)};`);
  replaceOne(/const SUPABASE_PUBLISHABLE_KEY = .*;/, `const SUPABASE_PUBLISHABLE_KEY = ${JSON.stringify(config.anon)};`);
  replaceOne(/export default \{/, 'return {');
  source = source.replaceAll('https://cvstudio-contacto.cvpro-duccionesar.workers.dev', config.worker)
    .replaceAll('https://www.cvstudio.com.ar', config.site).replaceAll('https://cvstudio.com.ar', config.site);
  if (forbiddenRefs.some(ref => source.includes(ref)) || source.includes('https://cvstudio-contacto.')) throw new Error('Quedó una conexión a producción');
  const runtime = fs.readFileSync(new URL('../../deployment/staging-runtime.mjs', import.meta.url), 'utf8');
  return `// Generated from the feature branch; never edit or deploy to production.\nconst config = ${JSON.stringify(config)};\n${runtime}\nfunction createApplication(fetch) {\n${source}\n}\n`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const config = configuration();
  const source = fs.readFileSync('config/cloudflare-worker-contacto.js', 'utf8');
  fs.mkdirSync('deployment/generated', { recursive: true });
  fs.writeFileSync('deployment/generated/staging-worker.mjs', build(source, config));
  fs.writeFileSync('deployment/generated/manifest.json', JSON.stringify({ worker: 'cvstudio-contacto-pruebas', revision: config.revision, supabase: config.db, site: config.site, notifications: 'simulated', production: false }, null, 2));
  console.log('Compilado cvstudio-contacto-pruebas; producción excluida.');
}
