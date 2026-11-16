import { configuration } from './build-staging.mjs';
configuration();
for (const key of ['CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID', 'STAGING_SUPABASE_SERVICE_ROLE_KEY', 'STAGING_ACCESS_KEY']) {
  if (!process.env[key]) throw new Error(`Falta el secreto de staging: ${key}`);
}
if (!/^[a-f0-9]{32}$/.test(process.env.CLOUDFLARE_ACCOUNT_ID)) throw new Error('CLOUDFLARE_ACCOUNT_ID inválido');
if (process.env.STAGING_ACCESS_KEY.length < 32) throw new Error('STAGING_ACCESS_KEY debe tener al menos 32 caracteres aleatorios');
if (process.env.MERCADOPAGO_TEST_ACCESS_TOKEN && !process.env.MERCADOPAGO_TEST_ACCESS_TOKEN.startsWith('TEST-')) throw new Error('Credencial Mercado Pago no identificada como TEST; despliegue bloqueado');
console.log('Preflight de staging aprobado; valores secretos omitidos.');
