// Public price reads and authenticated administrative updates.
// Web/Tiendanube updates continue through the existing commerce Worker.
const ALLOWED = new Set(['cv-express','cv-basico','cv-estandar','cv-avanzado','entrevistas','kit-emprendedor','kit-web']);
const ADMIN_ID='3a8b4d50-305a-4da5-9fde-64bd2c8ed68d';
Deno.serve(async req => {
  const origin=req.headers.get('origin')||'';
  const permitted=['https://cvstudio.com.ar','https://www.cvstudio.com.ar','https://cvstudio-ar.github.io'];
  const headers={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info'};
  if(permitted.includes(origin))headers['Access-Control-Allow-Origin']=origin;
  const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
  if(origin&&!permitted.includes(origin))return reply({ok:false,message:'Origen no permitido.'},403);
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
  const url=Deno.env.get('SUPABASE_URL');
  const secret=JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}').default||Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const publicKey=JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS')||'{}').default||Deno.env.get('SUPABASE_ANON_KEY');
  if(!url||!secret||!publicKey)return reply({ok:false,message:'Servicio de precios sin configurar.'},503);
  const rest=async(path,init={})=>{
    const response=await fetch(url+'/rest/v1/'+path,{...init,headers:{apikey:secret,...(secret.startsWith('sb_secret_')?{}:{Authorization:'Bearer '+secret}),'Content-Type':'application/json',...init.headers}});
    const data=await response.json();
    if(!response.ok)throw new Error('No se pudo acceder al catálogo de precios.');
    return data;
  };
  try {
    if(req.method==='GET'){
      const rows=await rest('servicios_precios?select=product_id,title,unit_price,active,test_mode,test_price,sort_order&active=eq.true&order=sort_order.asc');
      return reply({ok:true,products:rows.map(p=>({product_id:p.product_id,title:p.title,unit_price:Number(p.unit_price),effective_price:Number(p.test_mode&&Number(p.test_price)>0?p.test_price:p.unit_price)}))});
    }
    if(req.method!=='POST')return reply({ok:false,message:'Método no permitido.'},405);
    const authorization=req.headers.get('authorization')||'';
    if(!authorization.startsWith('Bearer '))return reply({ok:false,message:'Iniciá sesión para modificar precios.'},401);
    const auth=await fetch(url+'/auth/v1/user',{headers:{apikey:publicKey,Authorization:authorization}});
    const user=auth.ok?await auth.json():null;
    if(!user?.id)return reply({ok:false,message:'Sesión inválida o vencida.'},401);
    if(user.id!==ADMIN_ID && user.app_metadata?.role!=='Director')return reply({ok:false,message:'Se requiere acceso de administración.'},403);
    const body=await req.json(),entries=Object.entries(body.products||{});
    if(!entries.length||entries.length>ALLOWED.size)return reply({ok:false,message:'Seleccioná precios válidos.'},400);
    for(const [id,value] of entries)if(!ALLOWED.has(id)||typeof value!=='number'||!Number.isInteger(value)||value<1||value>10000000)return reply({ok:false,message:'Servicio o precio inválido.'},400);
    const ids=entries.map(([id])=>id).join(',');
    const existing=await rest('servicios_precios?select=product_id,title,sort_order&product_id=in.('+ids+')');
    if(existing.length!==entries.length)return reply({ok:false,message:'Falta un servicio en el catálogo.'},409);
    const prices=new Map(entries);
    const rows=existing.map(p=>({...p,unit_price:prices.get(p.product_id),active:true,test_mode:false,test_price:null,updated_at:new Date().toISOString()}));
    const saved=await rest('servicios_precios?on_conflict=product_id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify(rows)});
    if(saved.length!==rows.length||saved.some(p=>Number(p.unit_price)!==prices.get(p.product_id)))throw new Error('El servidor no confirmó todos los precios.');
    return reply({ok:true,products:saved.map(p=>({product_id:p.product_id,unit_price:Number(p.unit_price)})),updated:saved.length});
  } catch(error) {console.error('CVStudio price sync:',error.message);return reply({ok:false,message:'No se pudieron guardar o verificar los precios. Reintentá.'},502);}
});
