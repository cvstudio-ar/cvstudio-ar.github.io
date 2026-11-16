const SLOTS = new Set(['hero','about','team',...Array.from({length:8},(_,i)=>'service-'+String(i+1).padStart(2,'0')),...Array.from({length:5},(_,i)=>'operation-'+String(i+1).padStart(2,'0'))]);
export async function onRequestGet({params,env}) {
  const slot=String(params?.slot||'');
  if(!SLOTS.has(slot))return new Response('Recurso no encontrado',{status:404});
  if(!env.GESFIP_CONFIG)return new Response('Multimedia no configurada',{status:503});
  try{
    const {value,metadata}=await env.GESFIP_CONFIG.getWithMetadata('media/'+slot,'arrayBuffer');
    if(!value)return new Response('Imagen no cargada',{status:404});
    const type=metadata?.contentType;
    if(!['image/jpeg','image/png','image/webp'].includes(type))return new Response('Tipo no disponible',{status:500});
    return new Response(value,{headers:{
      'Content-Type':type,
      'Cache-Control':'no-store',
      'X-Content-Type-Options':'nosniff'
    }});
  }catch{return new Response('No se pudo mostrar la imagen',{status:503})}
}
