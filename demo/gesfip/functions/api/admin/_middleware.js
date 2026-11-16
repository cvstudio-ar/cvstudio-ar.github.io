import cloudflareAccessPlugin from '@cloudflare/pages-plugin-cloudflare-access';

export async function onRequest(context) {
  const {CF_ACCESS_DOMAIN,CF_ACCESS_AUD, GESFIP_ADMIN_EMAIL}=context.env;
  if(!CF_ACCESS_DOMAIN||!CF_ACCESS_AUD||!GESFIP_ADMIN_EMAIL) {
    return new Response('La autenticación administrativa todavía no está configurada.',{status:503});
  }
  const auth=cloudflareAccessPlugin({domain:CF_ACCESS_DOMAIN,aud:CF_ACCESS_AUD});
  return auth(context);
}
