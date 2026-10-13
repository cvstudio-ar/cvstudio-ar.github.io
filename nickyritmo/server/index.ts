const URL=Deno.env.get('SUPABASE_URL')!;
let KEY=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
try { KEY=JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}').default||KEY; } catch {}
const headers={apikey:KEY,Authorization:`Bearer ${KEY}`,'Content-Type':'application/json'};
const origins=new Set(['https://cvstudio.com.ar','https://www.cvstudio.com.ar']);
async function db(path:string,method='GET',body?:unknown,extra={}) {const r=await fetch(URL+'/rest/v1/'+path,{method,headers:{...headers,...extra},body:body===undefined?undefined:JSON.stringify(body)});if(!r.ok)throw new Error('database');return r.status===204?null:await r.json();}
async function hash(value:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(x=>x.toString(16).padStart(2,'0')).join('');}
const text=(v:unknown,max:number,required=true)=>{if(typeof v!=='string'||v.length>max||(required&&!v.trim()))throw new Error('validation');return v.trim()};
function product(v:any){const p={name:text(v.name,70),brand:text(v.brand,32),model:text(v.model,150),description:text(v.description,1800),size:text(v.size,30),price:v.price,art:v.art,published:v.published!==false,cover:text(v.cover||'',500,false),category:text(v.category||'Ritmos',40),position:v.position||0};if(!Number.isFinite(p.price)||p.price<0||p.price>10000000||!Number.isInteger(p.art)||p.art<0||p.art>7||!Number.isInteger(p.position)||p.position<0||p.position>10000)throw new Error('validation');if(p.cover&&!p.cover.startsWith(URL+'/storage/v1/object/public/nicky-covers/'))throw new Error('validation');return p;}

const MP=Deno.env.get('NICKY_MERCADOPAGO_ACCESS_TOKEN')||'';
const SITE='https://cvstudio.com.ar/nickyritmo/';
const enc=encodeURIComponent;
const safeEmail=(v:unknown,optional=false)=>{const x=text(v||'',160,!optional).toLowerCase();if(x&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x))throw Error('validation');return x;};
const uuid=(v:unknown)=>{const x=text(v,36);if(!/^[a-f0-9-]{36}$/.test(x))throw Error('validation');return x;};
function settings(v:any){const x:any={};for(const [k,max] of Object.entries({headline:65,accent:65,subtitle:180,catalogTitle:75,storeName:50,footerText:180}))x[k]=text(v[k]||'',max,!['footerText'].includes(k));x.email=safeEmail(v.email);x.whatsapp=text(v.whatsapp,20).replace(/[^0-9]/g,'');if(!/^[0-9]{8,18}$/.test(x.whatsapp))throw Error('validation');for(const k of ['instagram','facebook','tiktok']){x[k]=text(v[k]||'',500,false);if(x[k]){const u=new globalThis.URL(x[k]);const allowed:any={instagram:['instagram.com','www.instagram.com'],facebook:['facebook.com','www.facebook.com','web.facebook.com'],tiktok:['tiktok.com','www.tiktok.com']};if(u.protocol!=='https:'||!allowed[k].includes(u.hostname))throw Error('validation');}}for(const k of ['logo','heroImage']){x[k]=text(v[k]||'',500,false);if(x[k]&&!x[k].startsWith(URL+'/storage/v1/object/public/nicky-covers/'))throw Error('validation');}if(!['classic','rounded','dark'].includes(v.style)||!/^#[a-f0-9]{6}$/i.test(v.color))throw Error('validation');x.style=v.style;x.color=v.color;x.demoMode=v.demoMode!==false;return x;}
const publicOrder=(o:any)=>({...o,items:o.items.map(({file,...item}:any)=>item)});
async function storage(path:string,method:string,body:any){const r=await fetch(URL+'/storage/v1/'+path,{method,headers,body:JSON.stringify(body)});if(!r.ok)throw Error('storage');return await r.json();}
async function verifyPayment(id:string){
 if(!MP||!/^\d{1,24}$/.test(id))throw Error('payment');
 const r=await fetch('https://api.mercadopago.com/v1/payments/'+id,{headers:{Authorization:'Bearer '+MP}});if(!r.ok)throw Error('payment');const payment=await r.json();
 const reference=uuid(payment.external_reference);const [o]=await db('nicky_orders?id=eq.'+reference);
 if(!o||o.provider!=='mercadopago'||payment.currency_id!=='ARS'||Math.round(Number(payment.transaction_amount)*100)!==Math.round(Number(o.total)*100))throw Error('payment');
 if(payment.status==='approved'&&payment.live_mode===true)await db('nicky_orders?id=eq.'+reference+'&status=eq.pending','PATCH',{status:'approved',payment_id:String(payment.id),approved_at:new Date().toISOString()});
 else if(['refunded','charged_back'].includes(payment.status))await db('nicky_orders?id=eq.'+reference+'&payment_id=eq.'+id,'PATCH',{status:'refunded'});
 return reference;
}

Deno.serve(async(req)=>{const origin=req.headers.get('origin')||'';const cors={'Access-Control-Allow-Origin':origins.has(origin)?origin:'https://cvstudio.com.ar','Access-Control-Allow-Headers':'authorization,content-type,x-customer-token','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Vary':'Origin','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};const out=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{...cors,'Content-Type':'application/json'}});
if(origin&&!origins.has(origin))return out({error:'Origen no autorizado'},403);
if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
try{
 if(req.method==='GET'&&new globalThis.URL(req.url).searchParams.get('webhook')==='1'){try{const id=new globalThis.URL(req.url).searchParams.get('id')||new globalThis.URL(req.url).searchParams.get('data.id')||'';await verifyPayment(id);return out({ok:true});}catch{return out({error:'Pago no verificado'},400);}}
 if(req.method==='GET'){const media=await db('nicky_product_files?select=product_id,sample_url,path');const products=await db('nicky_products?archived=eq.false&select=id,body,updated_at&order=id');const [settings]=await db('nicky_settings?id=eq.1&select=body,revision');return out({payments:{mercadopago:Boolean(MP),transfer:true},products:products.filter((p:any)=>p.body.published!==false).map((p:any)=>({...p.body,id:p.id,version:p.updated_at,sampleUrl:media.find((f:any)=>f.product_id===p.id)?.sample_url||'',fileReady:Boolean(media.find((f:any)=>f.product_id===p.id)?.path)})),settings});}
 if(req.method!=='POST')return out({error:'Método no permitido'},405);
 if(Number(req.headers.get('content-length')||0)>1500000)return out({error:'Archivo demasiado grande'},413);
 const raw=await req.text();if(raw.length>1500000)return out({error:'Archivo demasiado grande'},413);const b=JSON.parse(raw);

 if(new globalThis.URL(req.url).searchParams.get('webhook')==='1'){try{await verifyPayment(String(b.data?.id||b.id||''));return out({ok:true});}catch{return out({error:'Pago no verificado'},400);}}
 if(['customer-register','customer-login'].includes(b.action)){
 const password=text(b.password,72);if(new TextEncoder().encode(password).length>72)return out({error:'Usá una contraseña de hasta 72 bytes.'},400);
 const client=await hash('customer:'+((req.headers.get('x-forwarded-for')||'unknown').split(',')[0]));
 const data=await db('rpc/nicky_customer_auth','POST',{p_action:b.action==='customer-register'?'register':'login',p_name:text(b.name||'',100,false),p_email:safeEmail(b.email),p_password:password,p_client:client});return data.error?out(data,400):out(data);
 }
 if(String(b.action).startsWith('customer-')){
 const token=req.headers.get('x-customer-token')||'';if(!/^[a-f0-9]{64}$/.test(token))return out({error:'Iniciá sesión en tu cuenta para continuar.'},401);
 const digest=await hash(token);const [session]=await db('nicky_customer_sessions?token_hash=eq.'+digest+'&expires_at=gt.'+enc(new Date().toISOString()));if(!session)return out({error:'Tu sesión venció. Iniciá sesión nuevamente.'},401);
 const [customer]=await db('nicky_customers?id=eq.'+session.customer_id+'&select=id,name,email');
 if(b.action==='customer-me')return out({customer});
 if(b.action==='customer-logout'){await db('nicky_customer_sessions?token_hash=eq.'+digest,'DELETE');return out({ok:true});}
 if(b.action==='customer-password'){const data=await db('rpc/nicky_account_update','POST',{p_digest:digest,p_kind:'customer',p_current:text(b.currentPassword,72),p_password:text(b.password,72),p_email:''});return data.error?out(data,400):out(data);}
 if(b.action==='customer-orders'){const orders=await db('nicky_orders?customer_id=eq.'+customer.id+'&order=created_at.desc&limit=100');return out({orders:orders.map(publicOrder)});}
 if(b.action==='customer-checkout'){
 const [config]=await db('nicky_settings?id=eq.1&select=body');const demo=config.body.demoMode!==false;
 const provider=demo?'demo':b.provider;if(!['demo','transfer','mercadopago'].includes(provider))throw Error('validation');
 if(provider==='mercadopago'&&!MP)return out({error:'Mercado Pago todavía no está conectado. Elegí transferencia.'},503);
 if(!Array.isArray(b.ids)||b.ids.some((id:any)=>typeof id!=='string'||id.length>80))throw Error('validation');
 const o=await db('rpc/nicky_create_order','POST',{p_customer:customer.id,p_ids:b.ids,p_provider:provider,p_key:uuid(b.key)});
 if(o.provider!==provider)return out({error:'El pedido ya existe con otro medio de pago.'},409);
 if(o.status!=='pending'||o.checkout_url)return out({order:publicOrder(o),checkoutUrl:o.checkout_url});
 if(provider==='mercadopago'){
 const r=await fetch('https://api.mercadopago.com/checkout/preferences',{method:'POST',headers:{Authorization:'Bearer '+MP,'Content-Type':'application/json','X-Idempotency-Key':o.id},body:JSON.stringify({items:o.items.map((x:any)=>({id:x.id,title:x.name,currency_id:'ARS',quantity:1,unit_price:Number(x.price)})),payer:{email:customer.email},external_reference:o.id,notification_url:URL+'/functions/v1/nicky-ritmo-api?webhook=1',back_urls:{success:SITE+'?purchase=success',pending:SITE+'?purchase=pending',failure:SITE+'?purchase=failure'},auto_return:'approved'})});
 const result=await r.json();if(!r.ok||!result.init_point)return out({error:'No pudimos abrir Mercado Pago. Intentá nuevamente.'},502);
 await db('nicky_orders?id=eq.'+o.id,'PATCH',{checkout_url:result.init_point});return out({order:publicOrder(o),checkoutUrl:result.init_point});
 }
 return out({order:publicOrder(o)});
 }
 if(b.action==='customer-verify'){const reference=await verifyPayment(text(b.paymentId,24));const [o]=await db('nicky_orders?id=eq.'+reference+'&customer_id=eq.'+customer.id);if(!o)return out({error:'Pedido no encontrado.'},404);return out({order:publicOrder(o)});}
 if(b.action==='customer-download'){
 const [o]=await db('nicky_orders?id=eq.'+uuid(b.orderId)+'&customer_id=eq.'+customer.id);const item=o?.items.find((x:any)=>x.id===b.productId);
 if(!o||o.status!=='approved'||!item?.file)return out({error:'La descarga requiere un pedido propio con pago confirmado.'},403);
 const data=await storage('object/sign/nicky-downloads/'+item.file,'POST',{expiresIn:60});return out({url:URL+'/storage/v1'+data.signedURL,filename:item.filename});
 }
 return out({error:'Operación no disponible'},400);
 }

 if(b.action==='login'){const user=text(b.username,80),password=text(b.password,128);const client=await hash((req.headers.get('x-forwarded-for')||'unknown').split(',')[0].trim());const data=await db('rpc/nicky_admin_login','POST',{p_user:user,p_password:password,p_client:client});return data.error?out({error:data.error==='limit'?'Demasiados intentos. Esperá 15 minutos.':'Usuario o contraseña incorrectos'},data.error==='limit'?429:401):out(data);}
 const token=(req.headers.get('authorization')||'').replace(/^Bearer /,'');if(!/^[a-f0-9]{64}$/.test(token))return out({error:'Ingresá a Administración para continuar'},401);
 const digest=await hash(token);const sessions=await db('nicky_admin_sessions?token_hash=eq.'+digest+'&expires_at=gt.'+encodeURIComponent(new Date().toISOString())+'&select=expires_at,username');if(!sessions.length)return out({error:'La sesión venció. Ingresá nuevamente.'},401);

 if(b.action==='profile'){if(!sessions[0].username)return out({error:'Cerrá sesión y volvé a ingresar para configurar la cuenta.'},401);const [profile]=await db('nicky_admin_credentials?username=eq.'+enc(sessions[0].username)+'&select=username,email');return out({profile});}
 if(b.action==='account'){const data=await db('rpc/nicky_account_update','POST',{p_digest:digest,p_kind:'admin',p_current:text(b.currentPassword,72),p_password:text(b.password||'',72,false),p_email:safeEmail(b.email)});return data.error?out(data,400):out(data);}
 if(b.action==='orders'){const orders=await db('nicky_orders?order=created_at.desc&limit=100');const customers=await db('nicky_customers?select=id,name,email&limit=10000');return out({orders:orders.map((o:any)=>({...publicOrder(o),customer:customers.find((c:any)=>c.id===o.customer_id)}))});}
 if(b.action==='approve-transfer'){const id=uuid(b.id);const rows=await db('nicky_orders?id=eq.'+id+'&provider=eq.transfer&status=eq.pending','PATCH',{status:'approved',approved_at:new Date().toISOString()},{Prefer:'return=representation'});return rows.length?out({ok:true}):out({error:'Ese pedido no es una transferencia pendiente.'},409);}
 if(b.action==='cancel-order'){const rows=await db('nicky_orders?id=eq.'+uuid(b.id)+'&status=eq.pending','PATCH',{status:'cancelled'},{Prefer:'return=representation'});return rows.length?out({ok:true}):out({error:'El pedido ya no está pendiente.'},409);}
 if(b.action==='upload-ticket'){
 const kind=text(b.kind,20),filename=text(b.filename,150);if(!['sample','full'].includes(kind))throw Error('validation');const limit=kind==='sample'?20971520:52428800;
 if(!Number.isInteger(b.size)||b.size<1||b.size>limit)return out({error:kind==='sample'?'La muestra admite hasta 20 MB.':'El almacenamiento actual admite hasta 50 MB por archivo. Para packs más grandes se debe ampliar ese límite.'},400);
 const bucket=kind==='sample'?'nicky-samples':'nicky-downloads';const path=crypto.randomUUID()+'/'+filename.replace(/[^a-zA-Z0-9._-]/g,'_');const data=await storage('object/upload/sign/'+bucket+'/'+path,'POST',{});
 return out({bucket,path,token:data.token||new globalThis.URL(URL+'/storage/v1'+data.url).searchParams.get('token'),url:URL+'/storage/v1'+data.url});
 }
 if(b.action==='files'){
 const id=text(b.id,80);if(b.path&&!/^[0-9a-f-]{36}\/[a-zA-Z0-9._-]+$/.test(b.path))throw Error('validation');
 const [p]=await db('nicky_products?id=eq.'+enc(id));if(!p)throw Error('validation');
 if(b.path){const objects=await storage('object/list/nicky-downloads','POST',{prefix:b.path.split('/')[0],limit:100});if(!objects.some((o:any)=>o.name===b.path.split('/')[1]))return out({error:'El archivo todavía no terminó de subir.'},409);}
 const sample=text(b.sampleUrl||'',600,false);if(sample&&!sample.startsWith(URL+'/storage/v1/object/public/nicky-samples/'))throw Error('validation');
 await db('nicky_product_files','POST',{product_id:id,path:text(b.path||'',150,false),filename:text(b.filename||'',150,false),sample_url:sample,updated_at:new Date().toISOString()},{Prefer:'resolution=merge-duplicates'});return out({ok:true});
 }

 if(b.action==='logout'){await db('nicky_admin_sessions?token_hash=eq.'+digest,'DELETE');return out({ok:true});}
 if(b.action==='admin'){const fileInfo=await db('nicky_product_files');const products=await db('nicky_products?select=id,body,updated_at,archived&order=id');const [settings]=await db('nicky_settings?id=eq.1&select=body,revision');return out({products:products.map((p:any)=>({...p.body,id:p.id,version:p.updated_at,archived:p.archived,fileInfo:fileInfo.find((f:any)=>f.product_id===p.id)})),settings});}
 if(b.action==='save'){const p=product(b.product);const id=b.product.id?text(b.product.id,80):crypto.randomUUID();const version=new Date().toISOString();let rows;if(b.product.id){const expected=text(b.product.version,60);rows=await db('nicky_products?id=eq.'+encodeURIComponent(id)+'&updated_at=eq.'+encodeURIComponent(expected),'PATCH',{body:p,updated_at:version},{Prefer:'return=representation'});if(!rows.length)return out({error:'El producto cambió en otra sesión. Actualizá el panel antes de guardar.'},409);}else rows=await db('nicky_products','POST',{id,body:p,updated_at:version},{Prefer:'return=representation'});return out({product:{...rows[0].body,id,version:rows[0].updated_at}});}
 if(b.action==='archive'||b.action==='restore'){const id=text(b.id,80),expected=text(b.version,60);const rows=await db('nicky_products?id=eq.'+encodeURIComponent(id)+'&updated_at=eq.'+encodeURIComponent(expected),'PATCH',{archived:b.action==='archive',updated_at:new Date().toISOString()},{Prefer:'return=representation'});if(!rows.length)return out({error:'El producto cambió. Actualizá el panel.'},409);return out({ok:true});}
 if(b.action==='settings'){const [current]=await db('nicky_settings?id=eq.1');const defaults={storeName:'CVStudio',email:'cvstudioargentina@gmail.com',whatsapp:'5492964652318',instagram:'https://www.instagram.com/cvstudioargentina/',facebook:'https://web.facebook.com/profile.php?id=61591787648939',tiktok:'https://www.tiktok.com/@cvstudioargentina',style:'classic',color:'#0864f5',heroImage:'',logo:'',footerText:'CVStudio · Tienda digital',demoMode:true};const value=settings({...defaults,...current.body,...b.settings});if(!Number.isInteger(b.revision)||b.revision<1)throw Error('validation');const rows=await db('nicky_settings?id=eq.1&revision=eq.'+b.revision,'PATCH',{body:value,revision:b.revision+1},{Prefer:'return=representation'});if(!rows.length)return out({error:'La configuración cambió. Actualizá antes de guardar.'},409);return out({settings:rows[0]});}
 if(b.action==='upload'){const mime=text(b.mime,30);if(!['image/jpeg','image/png','image/webp'].includes(mime))return out({error:'Usá JPG, PNG o WebP'},400);const bytes=Uint8Array.from(atob(text(b.data,1400000)),c=>c.charCodeAt(0));if(bytes.length>1048576)return out({error:'La portada debe pesar menos de 1 MB'},400);const sig=Array.from(bytes.slice(0,12));const valid=mime==='image/png'?sig.slice(0,8).join(',')==='137,80,78,71,13,10,26,10':mime==='image/jpeg'?sig[0]===255&&sig[1]===216&&sig[2]===255:String.fromCharCode(...sig.slice(0,4))==='RIFF'&&String.fromCharCode(...sig.slice(8,12))==='WEBP';if(!valid)return out({error:'El archivo no es una imagen válida'},400);const path=crypto.randomUUID()+'.'+({ 'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[mime]);const r=await fetch(URL+'/storage/v1/object/nicky-covers/'+path,{method:'POST',headers:{apikey:KEY,Authorization:`Bearer ${KEY}`,'Content-Type':mime},body:bytes});if(!r.ok)throw new Error('upload');return out({url:URL+'/storage/v1/object/public/nicky-covers/'+path});}
 return out({error:'Operación no disponible'},400);
}catch(e){return out({error:e instanceof Error&&e.message==='validation'?'Revisá los campos ingresados.':'No pudimos completar la operación. Revisá que los productos estén disponibles y tengan un archivo cargado si la tienda está en modo real.'},400);}
});

