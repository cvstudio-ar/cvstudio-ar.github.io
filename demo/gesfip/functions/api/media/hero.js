export async function onRequestGet({env}) {
  if(!env.GESFIP_CONFIG)return new Response('Almacenamiento no configurado',{status:503});
  const [data,kind]=await Promise.all([
    env.GESFIP_CONFIG.get('hero-image',{type:'arrayBuffer'}),
    env.GESFIP_CONFIG.get('hero-image-type')
  ]);
  if(!data)return new Response('Imagen todavía no cargada',{status:404});
  if(!['image/png','image/jpeg','image/webp'].includes(kind))return new Response('Formato inválido',{status:500});
  return new Response(data,{headers:{
    'Content-Type':kind,'X-Content-Type-Options':'nosniff',
    'Cache-Control':'public, max-age=60'
  }});
}
