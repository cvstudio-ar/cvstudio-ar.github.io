const SLOTS = new Set(['hero','about','team',...Array.from({length:8},(_,i)=>'service-'+String(i+1).padStart(2,'0'))]);
const FORMATS=['image/png','image/jpeg','image/webp'];
const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{
  'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',
  'X-Content-Type-Options':'nosniff'
}});
function allowed(context){
  const email=context.data?.cloudflareAccess?.JWT?.payload?.email;
  const expected=String(context.env.GESFIP_ADMIN_EMAIL||'').trim().toLowerCase();
  return !!email&&!!expected&&email.toLowerCase()===expected;
}
export async function onRequestPost(context){
  if(!allowed(context))return reply({error:'Acceso administrativo no autorizado.'},403);
  const slot=String(context.params?.slot||'');
  if(!SLOTS.has(slot))return reply({error:'La posición solicitada no existe.'},404);
  if(!context.env.GESFIP_CONFIG)return reply({error:'No está configurado el almacenamiento de imágenes.'},503);
  const request=context.request;
  const type=String(request.headers.get('content-type')||'').split(';')[0].toLowerCase();
  if(!FORMATS.includes(type))return reply({error:'Subí una imagen JPG, PNG o WebP.'},415);
  const length=Number(request.headers.get('content-length')||0);
  if(length>3_000_000)return reply({error:'La imagen supera el máximo de 3 MB.'},413);
  let data;
  try{data=await request.arrayBuffer()}catch{return reply({error:'No se pudo leer el archivo.'},400)}
  if(!data.byteLength||data.byteLength>3_000_000)return reply({error:'Imagen vacía o mayor a 3 MB.'},413);
  const a=new Uint8Array(data);
  const signature=(i,n)=>String.fromCharCode(...a.slice(i,i+n));
  const valid=type==='image/png' ? a.slice(0,8).join(',')==='137,80,78,71,13,10,26,10' :
    type==='image/jpeg' ? a[0]===255&&a[1]===216&&a[2]===255 :
    signature(0,4)==='RIFF'&&signature(8,4)==='WEBP';
  if(!valid)return reply({error:'El contenido no coincide con el tipo de imagen indicado.'},415);
  try{
    await context.env.GESFIP_CONFIG.put('media/'+slot,data,{metadata:{contentType:type}});
    return reply({ok:true,slot,url:'/api/media/'+slot});
  }catch{return reply({error:'No se pudo guardar la imagen.'},503)}
}
