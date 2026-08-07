/*
 * CVStudio · Cloudflare Worker v2.8.3 · Centro de conversaciones SIAC
 *
 * Secrets obligatorios en Cloudflare:
 *   RESEND_API_KEY
 *   RESEND_WEBHOOK_SECRET
 *   SUPABASE_SERVICE_ROLE_KEY
 *   MERCADOPAGO_ACCESS_TOKEN
 *
 * Recepción recomendada (sin tocar los MX de Cloudflare Email Routing):
 *   usar la dirección administrada por Resend: <codigo>@iokioalkuu.resend.app
 *   opcionalmente definir RESEND_RECEIVING_DOMAIN si Resend muestra otro dominio.
 *   webhook email.received apuntando a:
 *   https://cvstudio-contacto.cvpro-duccionesar.workers.dev/webhooks/resend/inbound?token=TU_SECRETO
 */
const ALLOWED_ORIGINS = new Set(['https://cvstudio.com.ar','https://www.cvstudio.com.ar']);
const isAllowedOrigin=origin=>ALLOWED_ORIGINS.has(origin)||/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
const SUPABASE_URL = 'https://eqepkoegzyqklpxkrkhm.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxZXBrb2Vnenlxa2xweGtya2htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4NTc1MzcsImV4cCI6MjEwMDQzMzUzN30.dy-gMZJRMTQyr--kCq5JsEaDzazcDXFUkxQdiLQBFx8';
const ADMIN_USER_ID = '3a8b4d50-305a-4da5-9fde-64bd2c8ed68d';
const CONTACT_EMAIL = 'contacto@cvstudio.com.ar';
const WORKER_RELEASE = 'v2.9.1-whatsapp-auth-fix';
const FORM_NOTIFICATION_EMAIL = 'cvstudioargentina@gmail.com';
const getFormNotificationEmail = () => FORM_NOTIFICATION_EMAIL;
const DEFAULT_RESEND_RECEIVING_DOMAIN = 'iokioalkuu.resend.app';
const LOGO_URL = 'https://cvstudio.com.ar/assets/images/cvstudio-email-logo.png';



// === Mercado Pago · Checkout Pro + pedidos ===
const MP_PRODUCT_DEFAULTS = Object.freeze({
  'cv-profesional': { title: 'CV Profesional', unit_price: 12000, sort_order: 10 },
  'cv-freelance': { title: 'CV Freelance Profesional', unit_price: 16000, sort_order: 20 },
  'linkedin': { title: 'Perfil Profesional de LinkedIn', unit_price: 19000, sort_order: 30 },
  'combo-2-cv': { title: 'Combo 2 CV Profesionales', unit_price: 20000, sort_order: 40 },
  'combo-cv-linkedin': { title: 'Combo CV + LinkedIn', unit_price: 25000, sort_order: 50 }
});
const effectiveProductPrice=product=>Number(product?.test_mode&&Number(product?.test_price)>0?product.test_price:product?.unit_price||0);
async function getPaymentProducts(env){
  try{
    const rows=await supabaseService(env,'servicios_precios?select=product_id,title,unit_price,active,test_mode,test_price,sort_order,updated_at&order=sort_order.asc',{method:'GET'});
    if(Array.isArray(rows)&&rows.length)return Object.fromEntries(rows.map(row=>[row.product_id,{...row,unit_price:Number(row.unit_price),test_price:row.test_price==null?null:Number(row.test_price)}]));
  }catch(error){console.warn('No se pudieron cargar precios desde Supabase:',error.message)}
  return Object.fromEntries(Object.entries(MP_PRODUCT_DEFAULTS).map(([product_id,row])=>[product_id,{product_id,...row,active:true,test_mode:false,test_price:null}]));
}
async function addPaymentEvent(env,externalReference,eventType,description,metadata={}){
  if(!externalReference)return null;
  try{return await supabaseService(env,'pedidos_eventos',{method:'POST',body:JSON.stringify({external_reference:externalReference,event_type:eventType,description,metadata,created_at:new Date().toISOString()})})}
  catch(error){console.warn('Evento de pedido no persistido:',error.message);return null}
}
const makeOrderCode=()=>{const d=new Date(),date=`${d.getUTCFullYear()}${String(d.getUTCMonth()+1).padStart(2,'0')}${String(d.getUTCDate()).padStart(2,'0')}`,suffix=crypto.randomUUID().replaceAll('-','').slice(0,6).toUpperCase();return `CVS-${date}-${suffix}`};
const normalizePhone=value=>cleanText(value,40).replace(/[^0-9+()\-\s]/g,'');

async function savePaymentOrder(env,record){
  try{return await supabaseService(env,'pedidos_mercadopago',{method:'POST',body:JSON.stringify(record)})}
  catch(error){console.warn('Pedido no persistido en Supabase:',error.message);return null}
}
async function updatePaymentOrder(env,externalReference,changes){
  try{return await supabaseService(env,`pedidos_mercadopago?external_reference=eq.${encodeURIComponent(externalReference)}`,{method:'PATCH',body:JSON.stringify(changes)})}
  catch(error){console.warn('Pedido no actualizado en Supabase:',error.message);return null}
}

async function handleMercadoPagoPreference(env,origin,body){
  if(!env.MERCADOPAGO_ACCESS_TOKEN)return jsonResponse({ok:false,message:'Mercado Pago todavía no está configurado en el servidor.'},503,origin);
  const productId=cleanText(body.productId,80),products=await getPaymentProducts(env),product=products[productId];
  if(!product||product.active===false)return jsonResponse({ok:false,message:'El servicio seleccionado no está disponible para compra directa.'},400,origin);
  const unitPrice=effectiveProductPrice(product);
  if(!Number.isFinite(unitPrice)||unitPrice<1)return jsonResponse({ok:false,message:'El servicio no tiene un precio válido.'},400,origin);
  const customerName=cleanText(body.customerName,100),customerEmail=cleanText(body.customerEmail,160).toLowerCase(),customerPhone=normalizePhone(body.customerPhone);
  if(customerName.length<3||!isValidEmail(customerEmail)||customerPhone.replace(/\D/g,'').length<8)return jsonResponse({ok:false,message:'Revisá tu nombre, correo y WhatsApp antes de continuar.'},400,origin);
  const orderCode=makeOrderCode(),externalReference=`${orderCode}:${productId}`;
  await savePaymentOrder(env,{codigo:orderCode,external_reference:externalReference,producto_id:productId,producto_nombre:product.title,importe:unitPrice,moneda:'ARS',cliente_nombre:customerName,cliente_email:customerEmail,cliente_whatsapp:customerPhone,estado_pago:'pending',estado_pedido:'Pendiente de pago',medio_pago:'Mercado Pago · Checkout Pro',created_at:new Date().toISOString(),updated_at:new Date().toISOString()});
  await addPaymentEvent(env,externalReference,'order_created','Pedido creado y pendiente de pago',{product_id:productId,amount:unitPrice,test_mode:Boolean(product.test_mode)});
  const preference={
    items:[{id:productId,title:product.title,description:`Pedido ${orderCode} · Servicio profesional de CVStudio Argentina`,quantity:1,currency_id:'ARS',unit_price:unitPrice}],
    payer:{name:customerName,email:customerEmail,phone:{number:customerPhone}},
    external_reference:externalReference,
    statement_descriptor:'CVSTUDIO',
    metadata:{order_code:orderCode,product_id:productId,customer_name:customerName,customer_email:customerEmail,customer_phone:customerPhone},
    back_urls:{success:`https://cvstudio.com.ar/pago/aprobado/?pedido=${encodeURIComponent(orderCode)}`,pending:`https://cvstudio.com.ar/pago/pendiente/?pedido=${encodeURIComponent(orderCode)}`,failure:`https://cvstudio.com.ar/pago/rechazado/?pedido=${encodeURIComponent(orderCode)}`},
    auto_return:'approved',
    notification_url:'https://cvstudio-contacto.cvpro-duccionesar.workers.dev/webhooks/mercadopago'
  };
  try{
    const response=await fetch('https://api.mercadopago.com/checkout/preferences',{method:'POST',headers:{Authorization:`Bearer ${env.MERCADOPAGO_ACCESS_TOKEN}`,'Content-Type':'application/json','X-Idempotency-Key':crypto.randomUUID()},body:JSON.stringify(preference)});
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(data?.message||data?.error||`Mercado Pago devolvió ${response.status}`);
    await updatePaymentOrder(env,externalReference,{preferencia_id:data.id,updated_at:new Date().toISOString()});
    await addPaymentEvent(env,externalReference,'checkout_created','Checkout Pro creado',{preference_id:data.id,amount:unitPrice});
    if(env.RESEND_API_KEY){
      sendResend(env,{from:'CVStudio Argentina <contacto@cvstudio.com.ar>',to:[customerEmail],reply_to:CONTACT_EMAIL,subject:`Pedido ${orderCode} iniciado | CVStudio`,html:emailShell({eyebrow:'Pedido iniciado',title:`Hola ${customerName}`,requestCode:orderCode,body:`<p>Registramos tu pedido de <strong>${escapeHtml(product.title)}</strong> por <strong>$${unitPrice.toLocaleString('es-AR')}</strong>.</p><p>El pedido quedará confirmado cuando Mercado Pago apruebe la operación.</p>`}),text:`Pedido ${orderCode}: ${product.title}. Pendiente de pago.`}).catch(e=>console.warn('No se pudo enviar email de pedido',e.message));
    }
    return jsonResponse({ok:true,preferenceId:data.id,initPoint:data.init_point,externalReference,orderCode},200,origin);
  }catch(error){
    await updatePaymentOrder(env,externalReference,{estado_pago:'error_preferencia',detalle_estado:error.message,updated_at:new Date().toISOString()});
    console.error('Mercado Pago preference error',error);return jsonResponse({ok:false,message:`No se pudo iniciar el pago: ${error.message}`},502,origin)
  }
}

async function handleMercadoPagoWebhook(request,env){
  if(!env.MERCADOPAGO_ACCESS_TOKEN)return jsonResponse({ok:false},503);
  const url=new URL(request.url);let body={};try{body=await request.json()}catch{}
  const paymentId=body?.data?.id||url.searchParams.get('data.id')||url.searchParams.get('id'),type=body?.type||url.searchParams.get('type')||url.searchParams.get('topic');
  if(!paymentId||!(type==='payment'||type==='merchant_order'))return jsonResponse({ok:true,ignored:true});
  if(type!=='payment')return jsonResponse({ok:true,received:true});
  try{
    const response=await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`,{headers:{Authorization:`Bearer ${env.MERCADOPAGO_ACCESS_TOKEN}`}}),payment=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(payment?.message||`Mercado Pago devolvió ${response.status}`);
    const externalReference=cleanText(payment.external_reference,180),status=cleanText(payment.status,50),statusDetail=cleanText(payment.status_detail,100),approved=status==='approved';
    const rows=await updatePaymentOrder(env,externalReference,{mercadopago_payment_id:String(payment.id),estado_pago:status,detalle_estado:statusDetail,estado_pedido:approved?'Pago recibido':['pending','in_process','authorized'].includes(status)?'Pendiente de pago':'Pago no aprobado',medio_pago:cleanText(payment.payment_method_id||payment.payment_type_id||'Mercado Pago',80),importe:Number(payment.transaction_amount||0),fecha_aprobacion:payment.date_approved||null,updated_at:new Date().toISOString()});
    const order=rows?.[0];
    await addPaymentEvent(env,externalReference,approved?'payment_approved':'payment_updated',approved?'Pago aprobado por Mercado Pago':`Estado de pago actualizado: ${status}`,{payment_id:String(payment.id),status,status_detail:statusDetail,method:payment.payment_method_id||payment.payment_type_id||'',amount:Number(payment.transaction_amount||0)});
    if(approved&&env.RESEND_API_KEY&&order?.cliente_email){
      await Promise.allSettled([
        sendResend(env,{from:'CVStudio Argentina <contacto@cvstudio.com.ar>',to:[order.cliente_email],reply_to:CONTACT_EMAIL,subject:`Pago aprobado · ${order.codigo} | CVStudio`,html:emailShell({eyebrow:'Pago confirmado',title:'¡Tu contratación fue confirmada!',requestCode:order.codigo,body:`<p>Recibimos correctamente el pago de <strong>${escapeHtml(order.producto_nombre)}</strong>.</p><p>Nos comunicaremos por WhatsApp o correo para solicitar la información necesaria y comenzar el trabajo.</p>`}),text:`Pago aprobado. Pedido ${order.codigo}.`}),
        sendResend(env,{from:'CVStudio Pagos <contacto@cvstudio.com.ar>',to:[CONTACT_EMAIL],reply_to:order.cliente_email,subject:`💳 Pago aprobado · ${order.codigo} · ${order.producto_nombre}`,html:emailShell({eyebrow:'Nuevo pago aprobado',title:order.producto_nombre,requestCode:order.codigo,button:false,body:`<p><strong>Cliente:</strong> ${escapeHtml(order.cliente_nombre)}</p><p><strong>Email:</strong> ${escapeHtml(order.cliente_email)}</p><p><strong>WhatsApp:</strong> ${escapeHtml(order.cliente_whatsapp)}</p><p><strong>Importe:</strong> $${Number(order.importe).toLocaleString('es-AR')}</p>`}),text:`Pago aprobado ${order.codigo}`})
      ]);
    }
    console.log('Mercado Pago payment verified',{id:payment.id,status,external_reference:externalReference,amount:payment.transaction_amount});
    return jsonResponse({ok:true,status});
  }catch(error){console.error('Mercado Pago webhook error',error);return jsonResponse({ok:false},500)}
}

const jsonResponse=(data,status=200,origin='')=>{const headers={'Content-Type':'application/json; charset=UTF-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};if(isAllowedOrigin(origin)){headers['Access-Control-Allow-Origin']=origin;headers.Vary='Origin'}return new Response(JSON.stringify(data),{status,headers})};
const escapeHtml=(value='')=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const cleanText=(value,max)=>String(value??'').trim().slice(0,max);
const isValidEmail=email=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const nl2br=value=>escapeHtml(value).replace(/\n/g,'<br>');
const getReceivingDomain=env=>cleanText(env.RESEND_RECEIVING_DOMAIN||DEFAULT_RESEND_RECEIVING_DOMAIN,253).toLowerCase();
const inboundAddress=(env,code)=>`${String(code||'consulta').toLowerCase().replace(/[^a-z0-9-]/g,'')}@${getReceivingDomain(env)}`;

async function sendResend(env,payload){const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify(payload)});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data?.message||`Resend devolvió ${response.status}`);return data}
async function resendGet(env,path){const r=await fetch(`https://api.resend.com${path}`,{headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`}});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d?.message||`Resend devolvió ${r.status}`);return d?.data??d}
async function verifyAdmin(request){const authorization=request.headers.get('Authorization')||'';if(!authorization.startsWith('Bearer '))return null;const response=await fetch(`${SUPABASE_URL}/auth/v1/user`,{headers:{Authorization:authorization,apikey:SUPABASE_PUBLISHABLE_KEY}});if(!response.ok)return null;const user=await response.json().catch(()=>null);return user?.id===ADMIN_USER_ID?user:null}
async function verifyAuthenticatedUser(request){const authorization=request.headers.get('Authorization')||'';if(!authorization.startsWith('Bearer '))return null;const response=await fetch(`${SUPABASE_URL}/auth/v1/user`,{headers:{Authorization:authorization,apikey:SUPABASE_PUBLISHABLE_KEY,'Cache-Control':'no-store'}});if(!response.ok)return null;const user=await response.json().catch(()=>null);return user?.id?user:null}

function emailShell({eyebrow='CVStudio Argentina',title,body,requestCode='',button=true}){return `<!doctype html><html><body style="margin:0;background:#f3f6fb;padding:28px 12px;font-family:Arial,sans-serif;color:#172033"><table role="presentation" width="100%"><tr><td align="center"><table role="presentation" width="100%" style="max-width:650px;background:#fff;border-radius:18px;overflow:hidden"><tr><td style="background:#091225;padding:24px 30px;text-align:center"><img src="${LOGO_URL}" width="190" alt="CVStudio Argentina" style="display:block;margin:0 auto 15px"><div style="color:#ffd447;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase">${escapeHtml(eyebrow)}</div><h1 style="margin:7px 0 0;color:#fff;font-size:25px">${escapeHtml(title)}</h1></td></tr><tr><td style="padding:30px;line-height:1.65;font-size:15px">${body}${requestCode?`<div style="margin:24px 0;padding:14px 16px;background:#fff8d8;border:1px solid #ffe27a;border-radius:11px"><small>Código de solicitud</small><br><strong>${escapeHtml(requestCode)}</strong></div>`:''}${button?`<p style="text-align:center"><a href="https://cvstudio.com.ar" style="display:inline-block;background:#ffd447;color:#111827;text-decoration:none;font-weight:800;padding:12px 21px;border-radius:999px">Visitar CVStudio</a></p>`:''}</td></tr><tr><td style="padding:18px 30px;background:#f8fafc;text-align:center;color:#667085;font-size:12px"><strong>CVStudio Argentina</strong><br><a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a> · cvstudio.com.ar</td></tr></table></td></tr></table></body></html>`}

async function supabaseService(env,path,options={}){if(!env.SUPABASE_SERVICE_ROLE_KEY)throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY');const r=await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{...options,headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,'Content-Type':'application/json',Prefer:'return=representation',...(options.headers||{})}});const d=await r.json().catch(()=>null);if(!r.ok)throw new Error(d?.message||d?.hint||`Supabase devolvió ${r.status}`);return d}

function b64ToBytes(value){let base64=String(value).replace(/-/g,'+').replace(/_/g,'/');while(base64.length%4)base64+='=';const raw=atob(base64);return Uint8Array.from(raw,c=>c.charCodeAt(0))}
function bytesToB64(bytes){let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s)}
function safeEqual(a,b){if(a.length!==b.length)return false;let x=0;for(let i=0;i<a.length;i++)x|=a.charCodeAt(i)^b.charCodeAt(i);return x===0}
async function verifyResendWebhook(request,raw,secret){
  if(!secret)return false;
  const url=new URL(request.url);
  const token=url.searchParams.get('token')||'';
  if(token&&safeEqual(token,secret))return true;
  const id=request.headers.get('svix-id')||'';
  const timestamp=request.headers.get('svix-timestamp')||'';
  const signatures=request.headers.get('svix-signature')||'';
  if(!secret.startsWith('whsec_')||!id||!timestamp||!signatures)return false;
  if(Math.abs(Date.now()/1000-Number(timestamp))>300)return false;
  try{
    const key=await crypto.subtle.importKey('raw',b64ToBytes(secret.slice(6)),{name:'HMAC',hash:'SHA-256'},false,['sign']);
    const sig=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(`${id}.${timestamp}.${raw}`));
    const expected=bytesToB64(new Uint8Array(sig));
    return signatures.split(' ').some(part=>{const [,value]=part.split(',');return value&&safeEqual(value,expected)});
  }catch{return false}
}

function extractCode(event,email){const recipients=[...(event?.data?.to||[]),...(event?.data?.received_for||[])].join(' ');const subject=event?.data?.subject||email?.subject||'';return recipients.match(/(cvs-[a-z0-9-]+)@/i)?.[1]?.toUpperCase()||subject.match(/(CVS-[A-Z0-9-]+)/i)?.[1]||''}
function plainFromHtml(html=''){return String(html).replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<br\s*\/?\s*>/gi,'\n').replace(/<\/p>/gi,'\n').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/\s+\n/g,'\n').replace(/\n{3,}/g,'\n\n').trim()}

async function handleInboundWebhook(request,env){const raw=await request.text();if(!(await verifyResendWebhook(request,raw,env.RESEND_WEBHOOK_SECRET)))return new Response('Invalid webhook',{status:400});const event=JSON.parse(raw);if(event.type!=='email.received')return jsonResponse({ok:true,ignored:true});const emailId=event.data?.email_id;if(!emailId)return jsonResponse({ok:false,message:'Falta email_id'},400);
  const email=await resendGet(env,`/emails/receiving/${encodeURIComponent(emailId)}`);
  let attachments=[];try{const list=await resendGet(env,`/emails/receiving/${encodeURIComponent(emailId)}/attachments`);attachments=Array.isArray(list)?list:(list?.data||[])}catch(err){console.warn('Adjuntos no disponibles',err.message);attachments=event.data?.attachments||[]}
  const code=extractCode(event,email);if(!code){console.warn('Correo entrante sin código reconocible',event.data?.subject);return jsonResponse({ok:true,unmatched:true})}
  const requests=await supabaseService(env,`solicitudes?codigo=eq.${encodeURIComponent(code)}&select=id,codigo,estado&limit=1`);const solicitud=requests?.[0];if(!solicitud){console.warn('Solicitud no encontrada',code);return jsonResponse({ok:true,unmatched:true,code})}
  const text=cleanText(email?.text||plainFromHtml(email?.html)||'(Mensaje sin contenido de texto)',20000);const from=cleanText(event.data?.from||email?.from||'',320);const record={solicitud_id:solicitud.id,destinatario:(event.data?.to||[]).join(', '),remitente:from,asunto:cleanText(event.data?.subject||email?.subject||'Respuesta del cliente',500),mensaje:text,html:cleanText(email?.html||'',50000),plantilla:'inbound',estado:'Recibido',direccion:'entrante',resend_id:null,email_externo_id:emailId,message_id:event.data?.message_id||null,no_leido:true,adjuntos:attachments,usuario_id:null,fecha_creacion:event.data?.created_at||new Date().toISOString()};
  try{await supabaseService(env,'comunicaciones?on_conflict=email_externo_id',{method:'POST',headers:{Prefer:'resolution=ignore-duplicates,return=representation'},body:JSON.stringify(record)});await supabaseService(env,`solicitudes?id=eq.${solicitud.id}`,{method:'PATCH',body:JSON.stringify({estado:solicitud.estado==='Finalizado'?solicitud.estado:'Falta información',fecha_actualizacion:new Date().toISOString()})});}catch(err){console.error('No se pudo guardar correo entrante',err);throw err}
  return jsonResponse({ok:true,stored:true,code})}

async function handlePaymentsAdminList(request,env,origin){
  const admin=await verifyAdmin(request);if(!admin)return jsonResponse({ok:false,message:'Sesión administrativa inválida o vencida.'},401,origin);
  try{
    const [orders,events]=await Promise.all([
      supabaseService(env,'pedidos_mercadopago?select=*&order=created_at.desc&limit=500',{method:'GET',headers:{Prefer:'count=exact'}}),
      supabaseService(env,'pedidos_eventos?select=*&order=created_at.desc&limit=1500',{method:'GET'}).catch(()=>[])
    ]);
    const grouped={};for(const event of (Array.isArray(events)?events:[])){(grouped[event.external_reference]||(grouped[event.external_reference]=[])).push(event)}
    return jsonResponse({ok:true,orders:(Array.isArray(orders)?orders:[]).map(order=>({...order,events:grouped[order.external_reference]||[]}))},200,origin)
  }catch(error){return jsonResponse({ok:false,message:`No se pudieron cargar los pedidos: ${error.message}`},502,origin)}
}
async function handlePaymentProductsPublic(env,origin){
  const products=await getPaymentProducts(env);return jsonResponse({ok:true,products:Object.values(products).filter(p=>p.active!==false).map(p=>({...p,effective_price:effectiveProductPrice(p)}))},200,origin)
}
async function handlePaymentProductsAdmin(request,env,origin){
  const admin=await verifyAdmin(request);if(!admin)return jsonResponse({ok:false,message:'Sesión administrativa inválida o vencida.'},401,origin);
  const products=await getPaymentProducts(env);return jsonResponse({ok:true,products:Object.values(products)},200,origin)
}
async function handlePaymentProductUpdate(request,env,origin,body){
  const admin=await verifyAdmin(request);if(!admin)return jsonResponse({ok:false,message:'Sesión administrativa inválida o vencida.'},401,origin);
  const productId=cleanText(body.productId,80),defaults=MP_PRODUCT_DEFAULTS[productId];if(!defaults)return jsonResponse({ok:false,message:'Servicio inválido.'},400,origin);
  const unitPrice=Math.round(Number(body.unitPrice)),testPrice=body.testPrice===''||body.testPrice==null?null:Math.round(Number(body.testPrice));
  if(!Number.isFinite(unitPrice)||unitPrice<1||unitPrice>10000000)return jsonResponse({ok:false,message:'Ingresá un precio comercial válido.'},400,origin);
  if(testPrice!=null&&(!Number.isFinite(testPrice)||testPrice<1||testPrice>10000000))return jsonResponse({ok:false,message:'Ingresá un precio de prueba válido.'},400,origin);
  const record={product_id:productId,title:defaults.title,unit_price:unitPrice,active:body.active!==false,test_mode:Boolean(body.testMode),test_price:testPrice,sort_order:defaults.sort_order,updated_at:new Date().toISOString()};
  try{const rows=await supabaseService(env,'servicios_precios?on_conflict=product_id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify(record)});return jsonResponse({ok:true,product:rows?.[0]||record},200,origin)}catch(error){return jsonResponse({ok:false,message:`No se pudo guardar el precio: ${error.message}`},502,origin)}
}
async function handlePaymentsAdminUpdate(request,env,origin,body){
  const admin=await verifyAdmin(request);if(!admin)return jsonResponse({ok:false,message:'Sesión administrativa inválida o vencida.'},401,origin);
  const id=cleanText(body.id,80),estadoPedido=cleanText(body.estadoPedido,60);const allowed=new Set(['Pendiente de pago','Pago recibido','En producción','Entregado','Finalizado','Cancelado']);
  if(!id||!allowed.has(estadoPedido))return jsonResponse({ok:false,message:'Datos del pedido inválidos.'},400,origin);
  try{const rows=await supabaseService(env,`pedidos_mercadopago?id=eq.${encodeURIComponent(id)}`,{method:'PATCH',body:JSON.stringify({estado_pedido:estadoPedido,updated_at:new Date().toISOString()})});const order=rows?.[0]||null;if(order)await addPaymentEvent(env,order.external_reference,'order_status_changed',`Estado interno actualizado: ${estadoPedido}`,{estado_pedido:estadoPedido});return jsonResponse({ok:true,order},200,origin)}catch(error){return jsonResponse({ok:false,message:`No se pudo actualizar el pedido: ${error.message}`},502,origin)}
}

async function handleAdminReply(request,env,origin,body){const user=await verifyAdmin(request);if(!user)return jsonResponse({ok:false,message:'Sesión administrativa inválida o vencida.'},401,origin);const to=cleanText(body.to,160).toLowerCase(),subject=cleanText(body.subject,180),message=cleanText(body.message,6000),clientName=cleanText(body.clientName,100)||'cliente',requestCode=cleanText(body.requestCode,80),service=cleanText(body.service,120);if(!isValidEmail(to)||subject.length<4||message.length<10)return jsonResponse({ok:false,message:'Revisá destinatario, asunto y mensaje.'},400,origin);const rawAttachments=Array.isArray(body.attachments)?body.attachments.slice(0,3):[];const attachments=rawAttachments.filter(a=>a&&typeof a.filename==='string'&&typeof a.content==='string'&&a.content.length<8000000).map(a=>({filename:cleanText(a.filename,180),content:a.content,content_type:cleanText(a.content_type,100)||'application/octet-stream'}));const bodyHtml=`<p>Hola <strong>${escapeHtml(clientName)}</strong>,</p><div>${nl2br(message)}</div>${service?`<p><strong>Servicio:</strong> ${escapeHtml(service)}</p>`:''}<p>Saludos,<br><strong>Equipo de CVStudio Argentina</strong></p>`;try{const result=await sendResend(env,{from:'CVStudio Argentina <contacto@cvstudio.com.ar>',to:[to],...(body.copyToSelf?{bcc:[CONTACT_EMAIL]}:{}),reply_to:inboundAddress(env,requestCode),subject,html:emailShell({eyebrow:'Respuesta de nuestro equipo',title:'Información sobre tu solicitud',body:bodyHtml,requestCode}),text:[`Hola ${clientName},`,'',message,'',`Código: ${requestCode}`].join('\n'),...(attachments.length?{attachments}:{})});return jsonResponse({ok:true,id:result.id||null,attachments:attachments.map(a=>({filename:a.filename,name:a.filename})),message:'Correo enviado correctamente.'},200,origin)}catch(error){return jsonResponse({ok:false,message:`No se pudo enviar el correo: ${error.message}`},502,origin)}}


async function supabaseAuthAdmin(env,path,options={}){
  if(!env.SUPABASE_SERVICE_ROLE_KEY)throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY');
  const response=await fetch(`${SUPABASE_URL}/auth/v1/admin/${path}`,{...options,headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,'Content-Type':'application/json',...(options.headers||{})}});
  const data=await response.json().catch(()=>null);
  if(!response.ok)throw new Error(data?.msg||data?.message||data?.error_description||`Supabase Auth devolvió ${response.status}`);
  return data;
}
const normalizeUsername=value=>cleanText(value,40).toLowerCase().replace(/[^a-z0-9._-]/g,'');
const normalizeSlug=value=>cleanText(value,80).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
const portfolioAuthEmail=username=>`${username}@clientes.cvstudio.com.ar`;

const COLLABORATOR_ROLES = new Set(['Aprendiz','Operario','Líder','Supervisor','Director']);
const normalizeCorporateEmail=value=>cleanText(value,160).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');

async function handleCollaboratorAdminCreate(request,env,origin,body){
  const admin=await verifyAdmin(request);
  if(!admin)return jsonResponse({ok:false,message:'Sesión administrativa inválida o vencida.'},401,origin);
  const fullName=cleanText(body.fullName,120),email=normalizeCorporateEmail(body.email),password=cleanText(body.password,72);
  const role=COLLABORATOR_ROLES.has(body.role)?body.role:'Aprendiz';
  const commission=Math.max(0,Math.min(100,Number(body.commission||20)));
  if(fullName.length<3)return jsonResponse({ok:false,message:'Ingresá el nombre y apellido del colaborador.'},400,origin);
  if(!/^[a-z0-9._-]+@cvstudio\.com\.ar$/.test(email))return jsonResponse({ok:false,message:'El correo debe pertenecer al dominio @cvstudio.com.ar.'},400,origin);
  if(password.length<10)return jsonResponse({ok:false,message:'La contraseña temporal debe tener al menos 10 caracteres.'},400,origin);
  try{
    const authUser=await supabaseAuthAdmin(env,'users',{method:'POST',body:JSON.stringify({
      email,password,email_confirm:true,
      user_metadata:{role,full_name:fullName,must_change_password:true,commission,status:body.status||'Activo'}
    })});
    const userId=authUser?.id||authUser?.user?.id;
    if(!userId)throw new Error('Supabase no devolvió el identificador del usuario.');
    return jsonResponse({ok:true,user:{id:userId,email,role,fullName,mustChangePassword:true}},201,origin);
  }catch(error){
    const duplicate=/already|registered|exists|duplicate/i.test(error.message||'');
    return jsonResponse({ok:false,message:duplicate?'Ya existe un usuario de acceso con ese correo.':`No se pudo crear el acceso: ${error.message}`},duplicate?409:500,origin);
  }
}

async function handleCollaboratorAdminUpdate(request,env,origin,body){
  const admin=await verifyAdmin(request);if(!admin)return jsonResponse({ok:false,message:'Sesión administrativa inválida o vencida.'},401,origin);
  const c=body.collaborator||{},id=cleanText(c.authUserId,100),email=normalizeCorporateEmail(c.email),role=COLLABORATOR_ROLES.has(c.role)?c.role:'Aprendiz';
  if(!id)return jsonResponse({ok:false,message:'El colaborador no tiene un usuario Auth asociado.'},400,origin);
  try{const user=await supabaseAuthAdmin(env,`users/${encodeURIComponent(id)}`,{method:'PUT',body:JSON.stringify({email,email_confirm:true,ban_duration:c.status==='Activo'||c.status==='Ausente'?'none':'876000h',user_metadata:{role,full_name:cleanText(c.name,120),must_change_password:Boolean(c.mustChangePassword),commission:Number(c.commission||0),status:c.status||'Activo',capabilities:Array.isArray(c.capabilities)?c.capabilities:[]}})});return jsonResponse({ok:true,user},200,origin)}catch(error){return jsonResponse({ok:false,message:`No se pudo actualizar el acceso: ${error.message}`},500,origin)}
}
async function handleCollaboratorAdminDelete(request,env,origin,body){
  const admin=await verifyAdmin(request);if(!admin)return jsonResponse({ok:false,message:'Sesión administrativa inválida o vencida.'},401,origin);
  const id=cleanText(body.authUserId,100);if(!id)return jsonResponse({ok:false,message:'Falta el usuario Auth del colaborador.'},400,origin);
  try{await supabaseAuthAdmin(env,`users/${encodeURIComponent(id)}`,{method:'DELETE'});return jsonResponse({ok:true},200,origin)}catch(error){return jsonResponse({ok:false,message:`No se pudo eliminar el acceso: ${error.message}`},500,origin)}
}

async function handlePortfolioAdminList(request,env,origin){
  const user=await verifyAdmin(request);
  if(!user)return jsonResponse({ok:false,message:'Sesión administrativa inválida o vencida.'},401,origin);
  try{
    const clients=await supabaseService(env,'portfolio_clientes?select=*&order=created_at.desc');
    return jsonResponse({ok:true,clients:Array.isArray(clients)?clients:[]},200,origin);
  }catch(error){return jsonResponse({ok:false,message:`No se pudieron cargar los portfolios: ${error.message}`},500,origin)}
}

async function handlePortfolioAdminCreate(request,env,origin,body){
  const admin=await verifyAdmin(request);
  if(!admin)return jsonResponse({ok:false,message:'Sesión administrativa inválida o vencida.'},401,origin);
  const username=normalizeUsername(body.username),slug=normalizeSlug(body.slug),password=cleanText(body.password,72),fullName=cleanText(body.fullName,120);
  const status=['draft','active'].includes(body.status)?body.status:'draft';
  const templateKey=['creative','professional','business','minimal'].includes(body.templateKey)?body.templateKey:'creative';
  if(username.length<3||slug.length<3||fullName.length<2||password.length<10)return jsonResponse({ok:false,message:'Revisá nombre, usuario, URL y contraseña. La contraseña debe tener al menos 10 caracteres.'},400,origin);
  const existing=await supabaseService(env,`portfolio_clientes?or=(username.eq.${encodeURIComponent(username)},slug.eq.${encodeURIComponent(slug)})&select=id,username,slug&limit=1`);
  if(existing?.length)return jsonResponse({ok:false,message:'El usuario o la URL personalizada ya están en uso.'},409,origin);
  let authUser=null;
  try{
    authUser=await supabaseAuthAdmin(env,'users',{method:'POST',body:JSON.stringify({email:portfolioAuthEmail(username),password,email_confirm:true,user_metadata:{role:'portfolio_client',username,full_name:fullName}})});
    const userId=authUser?.id||authUser?.user?.id;
    if(!userId)throw new Error('Supabase no devolvió el identificador del usuario.');
    const record={auth_user_id:userId,username,slug,full_name:fullName,brand_name:cleanText(body.brandName,120)||null,contact_email:cleanText(body.contactEmail,160)||null,whatsapp:cleanText(body.whatsapp,40)||null,business_type:cleanText(body.businessType,100)||null,bio:cleanText(body.bio,1000)||null,template_key:templateKey,status,settings:{created_by:'siac',login_email:portfolioAuthEmail(username)}};
    const rows=await supabaseService(env,'portfolio_clientes',{method:'POST',body:JSON.stringify(record)});
    const client=rows?.[0];
    if(!client)throw new Error('No se pudo guardar el perfil del cliente.');
    return jsonResponse({ok:true,client},201,origin);
  }catch(error){
    const userId=authUser?.id||authUser?.user?.id;
    if(userId)try{await supabaseAuthAdmin(env,`users/${encodeURIComponent(userId)}`,{method:'DELETE'})}catch(cleanupError){console.error('No se pudo revertir usuario de portfolio',cleanupError)}
    return jsonResponse({ok:false,message:`No se pudo crear la cuenta: ${error.message}`},500,origin);
  }
}

async function handlePortfolioAdminUpdate(request,env,origin,body){
  const admin=await verifyAdmin(request);
  if(!admin)return jsonResponse({ok:false,message:'Sesión administrativa inválida o vencida.'},401,origin);
  const portfolioId=cleanText(body.portfolioId,80);
  const input=body.changes&&typeof body.changes==='object'?body.changes:{};
  const changes={updated_at:new Date().toISOString()};
  if(['draft','active','suspended'].includes(input.status))changes.status=input.status;
  if(['creative','professional','business','minimal'].includes(input.template_key))changes.template_key=input.template_key;
  ['full_name','brand_name','contact_email','whatsapp','business_type','bio'].forEach(key=>{if(Object.prototype.hasOwnProperty.call(input,key))changes[key]=cleanText(input[key],key==='bio'?1000:160)||null});
  try{const rows=await supabaseService(env,`portfolio_clientes?id=eq.${encodeURIComponent(portfolioId)}`,{method:'PATCH',body:JSON.stringify(changes)});if(!rows?.length)return jsonResponse({ok:false,message:'Portfolio no encontrado.'},404,origin);return jsonResponse({ok:true,client:rows[0]},200,origin)}catch(error){return jsonResponse({ok:false,message:error.message},500,origin)}
}

async function handlePortfolioAdminDelete(request,env,origin,body){
  try{
    const portfolioId=String(body.portfolioId||'').trim();
    if(!portfolioId)return jsonResponse({ok:false,message:'Falta el portfolio.'},400,origin);
    const rows=await supabaseService(env,`portfolio_clientes?id=eq.${encodeURIComponent(portfolioId)}&select=id,auth_user_id,username,slug&limit=1`);
    const client=rows?.[0];
    if(!client)return jsonResponse({ok:false,message:'Portfolio no encontrado.'},404,origin);
    await supabaseService(env,`portfolio_proyectos?portfolio_id=eq.${encodeURIComponent(portfolioId)}`,{method:'DELETE',headers:{Prefer:'return=minimal'}});
    await supabaseService(env,`portfolio_clientes?id=eq.${encodeURIComponent(portfolioId)}`,{method:'DELETE',headers:{Prefer:'return=minimal'}});
    if(client.auth_user_id)try{await supabaseAuthAdmin(env,`users/${encodeURIComponent(client.auth_user_id)}`,{method:'DELETE'})}catch(cleanupError){console.error('No se pudo eliminar usuario Auth',cleanupError)}
    return jsonResponse({ok:true,deleted:{id:portfolioId,username:client.username,slug:client.slug}},200,origin);
  }catch(error){return jsonResponse({ok:false,message:error.message},500,origin)}
}

async function handlePortfolioAdminResetPassword(request,env,origin,body){
  const admin=await verifyAdmin(request);
  if(!admin)return jsonResponse({ok:false,message:'Sesión administrativa inválida o vencida.'},401,origin);
  const portfolioId=cleanText(body.portfolioId,80),password=cleanText(body.password,72);
  if(password.length<10)return jsonResponse({ok:false,message:'La contraseña debe tener al menos 10 caracteres.'},400,origin);
  try{
    const rows=await supabaseService(env,`portfolio_clientes?id=eq.${encodeURIComponent(portfolioId)}&select=id,auth_user_id,username,slug&limit=1`);
    const client=rows?.[0];if(!client)return jsonResponse({ok:false,message:'Portfolio no encontrado.'},404,origin);
    await supabaseAuthAdmin(env,`users/${encodeURIComponent(client.auth_user_id)}`,{method:'PUT',body:JSON.stringify({password})});
    return jsonResponse({ok:true,client},200,origin);
  }catch(error){return jsonResponse({ok:false,message:`No se pudo cambiar la contraseña: ${error.message}`},500,origin)}
}

async function findOrCreatePublicClient(env,{name,email,phone,city}){
  const normalizedPhone=cleanText(phone,50).replace(/\D/g,'');
  let client=null;
  if(email){
    const rows=await supabaseService(env,`clientes?email=eq.${encodeURIComponent(email)}&select=*&limit=1`);
    client=rows?.[0]||null;
  }
  if(!client&&phone){
    const candidates=await supabaseService(env,`clientes?telefono=eq.${encodeURIComponent(phone)}&select=*&limit=1`);
    client=candidates?.[0]||null;
  }
  if(!client&&normalizedPhone){
    const recent=await supabaseService(env,'clientes?select=*&order=creado.desc&limit=1000');
    client=(recent||[]).find(row=>String(row.telefono||'').replace(/\D/g,'')===normalizedPhone)||null;
  }
  if(client){
    const changes={nombre:name,telefono:phone||client.telefono||'',email:email||client.email||'',ciudad:city||client.ciudad||''};
    const rows=await supabaseService(env,`clientes?id=eq.${encodeURIComponent(client.id)}`,{method:'PATCH',body:JSON.stringify(changes)});
    return {client:rows?.[0]||{...client,...changes},existing:true};
  }
  const record={id:crypto.randomUUID(),nombre:name,telefono:phone||'',email:email||'',ciudad:city||'',creado:new Date().toISOString()};
  const rows=await supabaseService(env,'clientes',{method:'POST',body:JSON.stringify(record)});
  return {client:rows?.[0]||record,existing:false};
}

async function createPublicRequestRecord(env,{client,requestCode,service,message,formData,source}){
  const now=new Date().toISOString();
  const record={
    id:crypto.randomUUID(),cliente_id:client.id,codigo:requestCode,servicio:service||'Solicitud web',subtipo:'',
    descripcion:message,datos:{origen:source||'Formulario web',formulario:formData||{},localidad:client.ciudad||''},
    estado:'Nuevo formulario recibido',prioridad:'Normal',responsable:'Exequiel',asignado:'Sin definir',notas:'',
    canal:source||'Formulario web',fecha_creacion:now,fecha_actualizacion:now
  };
  const rows=await supabaseService(env,'solicitudes',{method:'POST',body:JSON.stringify(record)});
  return rows?.[0]||record;
}


async function handleSiacFormNotification(env,origin,body){
  const recipient=getFormNotificationEmail();
  if(cleanText(body.website,200))return jsonResponse({ok:true},200,origin);
  const name=cleanText(body.name,100),email=cleanText(body.email,160).toLowerCase(),phone=cleanText(body.phone,50),city=cleanText(body.city,120),service=cleanText(body.service,100),message=cleanText(body.message,12000),requestCode=cleanText(body.requestCode,80);
  if(name.length<2||!isValidEmail(email)||phone.length<6||message.length<10)return jsonResponse({ok:false,message:'Revisá nombre, correo, WhatsApp y los datos del formulario.'},400,origin);
  try{
    await sendResend(env,{
      from:'CVStudio Formularios <contacto@cvstudio.com.ar>',
      to:[recipient],
      reply_to:email,
      subject:`📩 Nuevo formulario completado · ${name}${service?` · ${service}`:''}`,
      html:emailShell({
        eyebrow:'Nuevo formulario completado',
        title:name,
        requestCode,
        button:false,
        body:`<p><strong>Cliente:</strong> ${escapeHtml(name)}</p><p><strong>WhatsApp:</strong> ${escapeHtml(phone)}</p><p><strong>Correo:</strong> ${escapeHtml(email)}</p><p><strong>Localidad:</strong> ${escapeHtml(city||'No informada')}</p><p><strong>Servicio:</strong> ${escapeHtml(service||'No especificado')}</p><hr style="border:0;border-top:1px solid #e5e7eb;margin:22px 0"><div>${nl2br(message)}</div>`
      }),
      text:message
    });
    return jsonResponse({ok:true,recipient,message:`Formulario enviado correctamente a ${recipient}.`},200,origin);
  }catch(error){
    console.error('No se pudo notificar el formulario SIAC',error);
    return jsonResponse({ok:false,message:`No se pudo enviar el formulario a ${recipient}: ${error.message}`},502,origin);
  }
}

async function handlePublicRequest(env,origin,body){
  if(cleanText(body.website,200))return jsonResponse({ok:true},200,origin);
  const name=cleanText(body.name,100),email=cleanText(body.email,160).toLowerCase(),phone=cleanText(body.phone,50),city=cleanText(body.city,120),service=cleanText(body.service,100),message=cleanText(body.message,6000);
  if(name.length<2||!isValidEmail(email)||phone.length<6||city.length<2||message.length<10)return jsonResponse({ok:false,message:'Revisá nombre, correo, WhatsApp, localidad y los datos del formulario.'},400,origin);
  const requestCode=message.match(/Código de solicitud:\s*(CVS-[A-Z0-9-]+)/i)?.[1]||`CVS-${Date.now()}`;
  let persisted=null;
  try{
    const resolved=await findOrCreatePublicClient(env,{name,email,phone,city});
    const requestRecord=await createPublicRequestRecord(env,{client:resolved.client,requestCode,service,message,formData:body.formData,source:cleanText(body.source,60)||'Formulario web'});
    persisted={client:resolved.client,request:requestRecord,existingClient:resolved.existing};
  }catch(error){
    console.error('No se pudo crear automáticamente el cliente/solicitud',error);
    return jsonResponse({ok:false,message:`No pudimos registrar la solicitud en el Centro de Operaciones: ${error.message}`},502,origin);
  }
  try{
    await sendResend(env,{from:'CVStudio Web <contacto@cvstudio.com.ar>',to:[CONTACT_EMAIL],reply_to:email,subject:`Nueva consulta web${service?` · ${service}`:''}`,html:emailShell({eyebrow:'Nueva solicitud web',title:'Nueva consulta desde CVStudio',requestCode,button:false,body:`<p><strong>Nombre:</strong> ${escapeHtml(name)}</p><p><strong>Correo:</strong> ${escapeHtml(email)}</p><p><strong>WhatsApp:</strong> ${escapeHtml(phone)}</p><p><strong>Localidad:</strong> ${escapeHtml(city)}</p><p><strong>Servicio:</strong> ${escapeHtml(service||'No especificado')}</p><div>${nl2br(message)}</div>`}),text:message});
    try{await sendResend(env,{from:'CVStudio Argentina <contacto@cvstudio.com.ar>',to:[email],reply_to:inboundAddress(env,requestCode),subject:'✅ Recibimos tu solicitud | CVStudio',html:emailShell({eyebrow:'Solicitud registrada',title:`¡Hola ${name}!`,requestCode,body:`<p>Gracias por comunicarte con <strong>CVStudio Argentina</strong>.</p><p>Tu solicitud fue registrada correctamente en nuestro Centro de Operaciones.</p><p>Podés responder directamente este correo para agregar información.</p>`}),text:`Hola ${name}. Código: ${requestCode}`})}catch(e){console.warn(e.message)}
    return jsonResponse({ok:true,requestCode,clientId:persisted.client.id,requestId:persisted.request.id,existingClient:persisted.existingClient,message:'¡Consulta registrada correctamente!'},200,origin);
  }catch(error){
    console.error('Solicitud guardada, pero falló el correo',error);
    return jsonResponse({ok:true,requestCode,clientId:persisted.client.id,requestId:persisted.request.id,existingClient:persisted.existingClient,emailWarning:true,message:'La solicitud quedó registrada; no se pudo enviar el correo de confirmación.'},200,origin);
  }
}



// === WhatsApp Cloud API · prueba y producción ===
const WA_GRAPH_VERSION = 'v25.0';
const digitsOnly = value => String(value || '').replace(/\D/g, '');
const waNow = () => new Date().toISOString();
const waCode = phone => `WA-${digitsOnly(phone).slice(-8)}-${Date.now().toString(36).toUpperCase()}`;

async function whatsappGraph(env, path, options={}) {
  if (!env.WHATSAPP_ACCESS_TOKEN) throw new Error('Falta WHATSAPP_ACCESS_TOKEN');
  const response = await fetch(`https://graph.facebook.com/${WA_GRAPH_VERSION}/${path}`, {
    ...options,
    headers: { Authorization:`Bearer ${env.WHATSAPP_ACCESS_TOKEN}`, 'Content-Type':'application/json', ...(options.headers||{}) }
  });
  const data = await response.json().catch(()=>({}));
  if (!response.ok) throw new Error(data?.error?.message || `WhatsApp devolvió ${response.status}`);
  return data;
}

async function findOrCreateWhatsAppRequest(env, contact, phone) {
  const name = cleanText(contact?.profile?.name, 100) || `WhatsApp ${phone.slice(-4)}`;
  const resolved = await findOrCreatePublicClient(env,{name,email:'',phone:`+${phone}`,city:''});
  const existing = await supabaseService(env,`solicitudes?cliente_id=eq.${encodeURIComponent(resolved.client.id)}&canal=eq.WhatsApp&select=*&order=fecha_creacion.desc&limit=1`);
  if (existing?.[0]) return {client:resolved.client, request:existing[0]};
  const request = await createPublicRequestRecord(env,{client:resolved.client,requestCode:waCode(phone),service:'Pendiente de definir',message:'Nuevo contacto recibido desde WhatsApp.',formData:{},source:'WhatsApp'});
  return {client:resolved.client, request};
}

async function saveWhatsAppCommunication(env,{requestId,direction,phone,text,messageId,status='recibido',raw}) {
  const record={
    id:crypto.randomUUID(),solicitud_id:requestId,tipo:'whatsapp',direccion:direction,
    remitente:direction==='entrante'?phone:'CVStudio',destinatario:direction==='saliente'?phone:'CVStudio',
    asunto:'WhatsApp',contenido:text||'',estado:status,proveedor_id:messageId||null,
    metadatos:{canal:'whatsapp',telefono:phone,raw:raw||null},fecha_creacion:waNow()
  };
  try { const rows=await supabaseService(env,'comunicaciones',{method:'POST',body:JSON.stringify(record)}); return rows?.[0]||record; }
  catch(error){ console.warn('No se pudo guardar comunicación WhatsApp:',error.message); return record; }
}

async function handleWhatsAppVerification(request,env){
  const url=new URL(request.url), mode=url.searchParams.get('hub.mode'), token=url.searchParams.get('hub.verify_token'), challenge=url.searchParams.get('hub.challenge');
  if(mode==='subscribe' && token && env.WHATSAPP_VERIFY_TOKEN && token===env.WHATSAPP_VERIFY_TOKEN) return new Response(challenge||'',{status:200,headers:{'Content-Type':'text/plain'}});
  return new Response('Token de verificación inválido',{status:403});
}

async function handleWhatsAppWebhook(request,env){
  const body=await request.json().catch(()=>null);
  if(!body || body.object!=='whatsapp_business_account') return jsonResponse({ok:true,ignored:true});
  for(const entry of body.entry||[]) for(const change of entry.changes||[]){
    const value=change.value||{};
    const contacts=value.contacts||[];
    for(const message of value.messages||[]){
      const phone=digitsOnly(message.from), contact=contacts.find(c=>digitsOnly(c.wa_id)===phone)||contacts[0]||{};
      const text=message.text?.body || message.button?.text || message.interactive?.button_reply?.title || message.interactive?.list_reply?.title || `[${message.type||'mensaje'}]`;
      const linked=await findOrCreateWhatsAppRequest(env,contact,phone);
      await saveWhatsAppCommunication(env,{requestId:linked.request.id,direction:'entrante',phone,text,messageId:message.id,status:'recibido',raw:{type:message.type,timestamp:message.timestamp}});
      await supabaseService(env,`solicitudes?id=eq.${encodeURIComponent(linked.request.id)}`,{method:'PATCH',body:JSON.stringify({estado:'Nuevo contacto',fecha_actualizacion:waNow(),canal:'WhatsApp'})}).catch(()=>null);
    }
    for(const st of value.statuses||[]){
      if(!st.id) continue;
      await supabaseService(env,`comunicaciones?proveedor_id=eq.${encodeURIComponent(st.id)}`,{method:'PATCH',body:JSON.stringify({estado:st.status||'actualizado',metadatos:{canal:'whatsapp',status:st.status,conversation:st.conversation||null,pricing:st.pricing||null}})}).catch(()=>null);
    }
  }
  return jsonResponse({ok:true,received:true});
}

async function handleWhatsAppAdminSend(request,env,origin,body){
  const admin=await verifyAuthenticatedUser(request); if(!admin)return jsonResponse({ok:false,message:'Sesión del panel inválida o vencida. Volvé a iniciar sesión.'},401,origin);
  const to=digitsOnly(body.to), text=cleanText(body.message,4096), requestId=cleanText(body.requestId,100);
  if(to.length<8 || text.length<1)return jsonResponse({ok:false,message:'Revisá el número y el mensaje.'},400,origin);
  const phoneNumberId=env.WHATSAPP_PHONE_NUMBER_ID; if(!phoneNumberId)return jsonResponse({ok:false,message:'Falta WHATSAPP_PHONE_NUMBER_ID.'},503,origin);
  try{
    const result=await whatsappGraph(env,`${phoneNumberId}/messages`,{method:'POST',body:JSON.stringify({messaging_product:'whatsapp',recipient_type:'individual',to,type:'text',text:{preview_url:false,body:text}})});
    if(requestId) await saveWhatsAppCommunication(env,{requestId,direction:'saliente',phone:to,text,messageId:result?.messages?.[0]?.id,status:'enviado',raw:null});
    return jsonResponse({ok:true,id:result?.messages?.[0]?.id||null},200,origin);
  }catch(error){return jsonResponse({ok:false,message:`No se pudo enviar por WhatsApp: ${error.message}`},502,origin)}
}
export default {async fetch(request,env){const origin=request.headers.get('Origin')||'';try{const url=new URL(request.url);if(request.method==='GET'&&url.pathname==='/health')return jsonResponse({ok:true,worker:WORKER_RELEASE,formRecipient:FORM_NOTIFICATION_EMAIL,whatsapp:Boolean(env.WHATSAPP_PHONE_NUMBER_ID&&env.WHATSAPP_ACCESS_TOKEN)},200,origin);if(url.pathname==='/webhooks/whatsapp'&&request.method==='GET')return handleWhatsAppVerification(request,env);if(url.pathname==='/webhooks/whatsapp'&&request.method==='POST')return handleWhatsAppWebhook(request,env);if(url.pathname==='/webhooks/resend/inbound'&&request.method==='POST')return handleInboundWebhook(request,env);if(url.pathname==='/webhooks/mercadopago'&&request.method==='POST')return handleMercadoPagoWebhook(request,env);if(request.method==='OPTIONS'){if(!isAllowedOrigin(origin))return jsonResponse({ok:false},403,origin);return new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type, Authorization','Access-Control-Max-Age':'86400',Vary:'Origin'}})}if(request.method!=='POST')return jsonResponse({ok:false,message:'Método no permitido.'},405,origin);if(!isAllowedOrigin(origin))return jsonResponse({ok:false,message:'Origen no autorizado.'},403,origin);let body;try{body=await request.json()}catch{return jsonResponse({ok:false,message:'Datos inválidos.'},400,origin)}if(body?.action==='whatsapp-admin-send')return handleWhatsAppAdminSend(request,env,origin,body);if(body?.action==='mercadopago-products')return handlePaymentProductsPublic(env,origin);if(body?.action==='mercadopago-create-preference')return handleMercadoPagoPreference(env,origin,body);if(body?.action==='payments-admin-list')return handlePaymentsAdminList(request,env,origin);if(body?.action==='payments-admin-update')return handlePaymentsAdminUpdate(request,env,origin,body);if(body?.action==='payments-admin-products')return handlePaymentProductsAdmin(request,env,origin);if(body?.action==='payments-admin-product-update')return handlePaymentProductUpdate(request,env,origin,body);if(!env.RESEND_API_KEY)return jsonResponse({ok:false,message:'Configuración incompleta.'},500,origin);if(body?.action==='siac-form-notification')return handleSiacFormNotification(env,origin,body);if(body?.action==='admin-reply')return handleAdminReply(request,env,origin,body);if(body?.action==='collaborator-admin-create')return handleCollaboratorAdminCreate(request,env,origin,body);if(body?.action==='collaborator-admin-update')return handleCollaboratorAdminUpdate(request,env,origin,body);if(body?.action==='collaborator-admin-delete')return handleCollaboratorAdminDelete(request,env,origin,body);if(body?.action==='portfolio-admin-list')return handlePortfolioAdminList(request,env,origin);if(body?.action==='portfolio-admin-create')return handlePortfolioAdminCreate(request,env,origin,body);if(body?.action==='portfolio-admin-update')return handlePortfolioAdminUpdate(request,env,origin,body);if(body?.action==='portfolio-admin-reset-password')return handlePortfolioAdminResetPassword(request,env,origin,body);if(body?.action==='portfolio-admin-delete')return handlePortfolioAdminDelete(request,env,origin,body);return handlePublicRequest(env,origin,body)}catch(error){console.error('Worker request failed',error);return jsonResponse({ok:false,message:`Error interno del Worker: ${error?.message||'desconocido'}`},500,origin)}}};
