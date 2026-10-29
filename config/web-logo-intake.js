/* Add these narrowly scoped helpers to the existing contact Worker before commerceHandle. */
const WEB_FOREIGN_PRICES={'web-basica':{USD:110,EUR:100},'web-panel':{USD:140,EUR:130},'web-catalogo':{USD:190,EUR:180},'web-tienda':{USD:240,EUR:230}};
function webLogoAttachment(logo){
 if(!logo)return null;
 const mime=String(logo.type||''),content=String(logo.content||''),extensions={'image/png':'png','image/jpeg':'jpg','image/webp':'webp','application/pdf':'pdf'};
 if(!extensions[mime]||!content||content.length>Math.ceil(2*1024*1024/3)*4||!(/^[A-Za-z0-9+/]+={0,2}$/.test(content)))throw new Error('El logo debe ser PNG, JPG, WebP o PDF y pesar hasta 2 MB.');
 let data;try{data=atob(content);}catch{throw new Error('El archivo del logo no es válido.');}
 if(data.length>2*1024*1024)throw new Error('El logo supera los 2 MB.');
 const signature=mime==='image/png'?data.startsWith('\x89PNG\r\n\x1a\n'):mime==='image/jpeg'?data.startsWith('\xff\xd8\xff'):mime==='image/webp'?data.startsWith('RIFF')&&data.slice(8,12)==='WEBP':data.startsWith('%PDF-');
 if(!signature)throw new Error('El contenido del logo no coincide con el formato indicado.');
 const base=cleanText(logo.name||'logo',100).replace(/\.[^.]+$/,'').replace(/[^a-zA-Z0-9_-]/g,'-').slice(0,70)||'logo';
 return {filename:base+'.'+extensions[mime],content};
}
async function commerceWebIntake(env,origin,body){
 if(!env.RESEND_API_KEY)throw new Error('El envío de solicitudes no está configurado.');
 const product=WEB_PRODUCTS[body.productId],currency=String(body.currency||'ARS'),stage=String(body.stage||'deposit');
 if(!product||!['ARS','USD','EUR'].includes(currency)||!['deposit','full'].includes(stage))throw new Error('Servicio, moneda o modalidad inválidos.');
 const reference=String(body.reference||'');if(!/^CVS-[A-Z0-9-]{8,70}$/.test(reference))throw new Error('Referencia de solicitud inválida.');
 const name=cleanText(body.customerName,100),email=cleanText(body.customerEmail,160).toLowerCase(),phone=cleanText(body.customerPhone,40),options=body.options||{};
 if(name.length<3||!(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))||phone.length<5||!cleanText(options.business,120))throw new Error('Completá tu nombre, email, WhatsApp y negocio.');
 const logo=webLogoAttachment(body.logo),total=currency==='ARS'?product.unit_price:WEB_FOREIGN_PRICES[body.productId][currency],due=commerceAmount(total,stage);
 const money=n=>new Intl.NumberFormat('es-AR',{style:'currency',currency,currencyDisplay:'code'}).format(n);
 const rows=[['Nombre',name],['Email',email],['WhatsApp',phone],['Servicio',product.title],['Moneda',currency],['Total',money(total)],['Modalidad',WEB_STAGES[stage]],['Importe inicial',money(due)],['Medio elegido',cleanText(body.provider,30)],['Negocio',cleanText(options.business,120)],['Estilo',cleanText(options.style,160)],['Color principal',cleanText(options.color,30)],['Otros colores',cleanText(options.palette,160)],['Funciones',(Array.isArray(options.features)?options.features:[]).slice(0,8).map(x=>cleanText(x,60)).join(', ')],['Detalles y referencias',cleanText(options.details,2000)],['Logo',logo?logo.filename+' (adjunto)':'Sin logo adjunto']];
 await sendResend(env,{from:'CVStudio Web <contacto@cvstudio.com.ar>',to:[FORM_NOTIFICATION_EMAIL],reply_to:email,subject:`Solicitud web con formulario · ${reference}`,html:emailShell({eyebrow:'Nueva solicitud web',title:product.title,requestCode:reference,button:false,body:'<p>El cliente completó el formulario y eligió continuar con su pedido. Esta solicitud no confirma un pago.</p>'+rows.map(([label,value])=>`<p><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value||'—')}</p>`).join('')}),text:['Solicitud de proyecto '+reference,'Estado: solicitud recibida, pago sin confirmar.',...rows.map(([label,value])=>label+': '+(value||'—'))].join('\n'),...(logo?{attachments:[logo]}:{})},'web-intake-'+reference);
 return jsonResponse({ok:true,reference,message:'Recibimos tu solicitud y el material del proyecto.'},200,origin);
}

