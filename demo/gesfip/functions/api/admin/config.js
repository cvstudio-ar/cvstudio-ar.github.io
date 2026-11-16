const jsonHeaders={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const respond=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:jsonHeaders});
function authorized(context){
  const email=context.data?.cloudflareAccess?.JWT?.payload?.email;
  const expected=String(context.env.GESFIP_ADMIN_EMAIL||'').trim().toLowerCase();
  return !!email && !!expected && email.toLowerCase()===expected;
}
export async function onRequestGet(context){
  if(!authorized(context))return respond({error:'Acceso no autorizado.'},403);
  if(!context.env.GESFIP_CONFIG)return respond({error:'Falta configurar almacenamiento de contenidos.'},503);
  const raw=await context.env.GESFIP_CONFIG.get('site-config');
  return respond({data:raw?JSON.parse(raw):null,configured:true});
}
const textKeys=['brand','eyebrow','heroLine1','heroLine2','heroDescription','heroImage','aboutImage','teamImage','gold','dark','aboutTitle','about','mission','phone','email','address'];
const maxLen={brand:80,eyebrow:150,heroLine1:140,heroLine2:140,heroDescription:1000,heroImage:600,aboutImage:600,teamImage:600,gold:7,dark:7,aboutTitle:200,about:2000,mission:2000,phone:40,email:200,address:200};
function normalize(source){
  if(!source || typeof source!=='object' || Array.isArray(source))throw Error('Formato no válido');
  const output={};
  for(const key of textKeys){
    const val=source[key];
    if(typeof val!=='string'||val.length>maxLen[key])throw Error('Campo no válido: '+key);
    output[key]=val.trim();
  }
  for(const k of ['gold','dark'])if(!/^#[a-f0-9]{6}$/i.test(output[k]))throw Error('Color inválido: '+k);
  const safeImage=value=>{
    return value==='./hero-aprobada.svg'
      || /^\.\/assets\/[a-z0-9-]+\.svg$/i.test(value)
      || /^\/api\/media\/(?:hero|about|team|(?:service-0[1-8]|operation-0[1-5]))$/.test(value)
      || /^https:\/\/[a-z0-9.-]+\/[a-z0-9_./?=&%+-]*$/i.test(value);
  };
  for(const key of ['heroImage','aboutImage','teamImage']){
    if(!safeImage(output[key]))throw Error('Imagen inválida: '+key);
  }
  if(output.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(output.email))throw Error('Correo inválido');
  if(!Array.isArray(source.services)||source.services.length<1||source.services.length>16)throw Error('Servicios inválidos');
  output.services=source.services.map(s=>{
    if(!s||typeof s!=='object')throw Error('Servicio inválido');
    const o={};
    for(const [k,n] of [['title',100],['short',350],['detail',1600],['glyph',10],['image',600]]){
      if(typeof s[k]!=='string'||s[k].length>n)throw Error('Campo de servicio inválido');
      o[k]=s[k].trim();
    }
    if(!o.title)throw Error('El servicio necesita título');
    if(!safeImage(o.image))throw Error('Imagen de servicio inválida');
    return o;
  });
  if(!Array.isArray(source.operations)||source.operations.length!==5)throw Error('Se necesitan cinco operaciones válidas');
  output.operations=source.operations.map(s=>{
    if(typeof s!=='string'||s.length>220||!s.trim())throw Error('Operación inválida');
    return s.trim();
  });
  if(!Array.isArray(source.operationImages)||source.operationImages.length!==5)throw Error('Imágenes de operaciones inválidas');
  output.operationImages=source.operationImages.map(src=>{
    if(typeof src!=='string'||src.length>600||!safeImage(src))throw Error('Imagen de operación inválida');
    return src;
  });
  return output;
}
export async function onRequestPost(context){
  if(!authorized(context))return respond({error:'Acceso no autorizado.'},403);
  const {request,env}=context;
  if(!env.GESFIP_CONFIG)return respond({error:'Falta configurar almacenamiento de contenidos.'},503);
  if(!request.headers.get('content-type')?.toLowerCase().includes('application/json'))return respond({error:'Enviar JSON.'},415);
  const length=Number(request.headers.get('content-length')||0);
  if(length>75000)return respond({error:'El contenido excede el tamaño permitido.'},413);
  let parsed;
  try {
    const raw=await request.text();
    if(raw.length>75000)return respond({error:'Contenido excesivo.'},413);
    parsed=normalize(JSON.parse(raw));
  }catch(err){return respond({error:err?.message||'Datos inválidos.'},400)}
  try {
    const previous=await env.GESFIP_CONFIG.get('site-config');
    if(previous){
      const key='versions/'+new Date().toISOString().replace(/[:.]/g,'-');
      await env.GESFIP_CONFIG.put(key,previous,{expirationTtl:60*60*24*90});
    }
    await env.GESFIP_CONFIG.put('site-config',JSON.stringify(parsed));
    return respond({ok:true});
  }catch{
    return respond({error:'No fue posible guardar la configuración.'},503);
  }
}
