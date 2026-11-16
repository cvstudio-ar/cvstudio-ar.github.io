const allowed=['image/jpeg','image/png','image/webp'];
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
function authorized(context){
  const user=context.data?.cloudflareAccess?.JWT?.payload?.email;
  return !!user && user.toLowerCase()===String(context.env.GESFIP_ADMIN_EMAIL||'').trim().toLowerCase();
}
export async function onRequestPost(context) {
  if(!authorized(context))return json({error:'Acceso no autorizado'},403);
  if(!context.env.GESFIP_CONFIG)return json({error:'Almacenamiento no configurado'},503);
  const {request,env}=context;
  const type=request.headers.get('content-type')?.split(';')[0].toLowerCase()||'';
  if(!allowed.includes(type))return json({error:'Solo JPG, PNG o WebP'},415);
  const length=Number(request.headers.get('content-length')||0);
  if(length>3_000_000)return json({error:'Imagen demasiado grande (máximo 3 MB)'},413);
  const bytes=await request.arrayBuffer();
  if(!bytes.byteLength||bytes.byteLength>3_000_000)return json({error:'Imagen inválida o demasiado grande'},413);
  const a=new Uint8Array(bytes);
  const str=(i,n)=>String.fromCharCode(...a.slice(i,i+n));
  const valid=type==='image/png' ? a.slice(0,8).join(',')==='137,80,78,71,13,10,26,10' :
    type==='image/jpeg' ? a[0]===255&&a[1]===216&&a[2]===255 :
    str(0,4)==='RIFF'&&str(8,4)==='WEBP';
  if(!valid)return json({error:'El archivo no coincide con el formato indicado'},415);
  try{
    await env.GESFIP_CONFIG.put('hero-image',bytes);
    await env.GESFIP_CONFIG.put('hero-image-type',type);
    return json({ok:true,url:'/api/media/hero'});
  }catch{return json({error:'No se pudo guardar la portada'},503)}
}
