const headers = {
  'Content-Type':'application/json; charset=utf-8',
  'Cache-Control':'public, max-age=30, must-revalidate',
  'X-Content-Type-Options':'nosniff'
};
export async function onRequestGet({env}) {
  if(!env.GESFIP_CONFIG) return new Response(JSON.stringify({configured:false}),{status:503,headers:{...headers,'Cache-Control':'no-store'}});
  try {
    const raw=await env.GESFIP_CONFIG.get('site-config');
    if(!raw)return new Response(JSON.stringify({configured:true,data:null}),{headers});
    return new Response(JSON.stringify({configured:true,data:JSON.parse(raw)}),{headers});
  }catch{
    return new Response(JSON.stringify({error:'No se pudo recuperar la configuración del sitio.'}),{status:503,headers:{...headers,'Cache-Control':'no-store'}});
  }
}
