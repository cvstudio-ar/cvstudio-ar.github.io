import fs from 'node:fs';
const release = JSON.parse(fs.readFileSync('deployment/production-release.json', 'utf8'));
if (!release.approved || release.worker !== 'cvstudio-contacto' || !process.env.CVSTUDIO_PRODUCTION_APPROVED_SHA || process.env.CVSTUDIO_PRODUCTION_APPROVED_SHA !== process.env.GITHUB_SHA) throw new Error('Producción permanece bloqueada; requiere autorización y revisión del commit exacto');
if (process.env.GITHUB_REF !== 'refs/heads/main') throw new Error('Producción solo acepta main');
const config = JSON.parse(fs.readFileSync('deployment/wrangler.production.json', 'utf8'));
if (config.name !== 'cvstudio-contacto' || config.main !== '../config/cloudflare-worker-contacto.js') throw new Error('Destino de producción incorrecto');
if (!process.env.CLOUDFLARE_API_TOKEN || !process.env.CLOUDFLARE_ACCOUNT_ID) throw new Error('Faltan credenciales exclusivas de producción');
