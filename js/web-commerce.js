(() => {
'use strict';
const root=document.getElementById('webPlans');if(!root)return;
const endpoint='https://cvstudio-contacto.cvpro-duccionesar.workers.dev/';
let plans=[
{id:'web-basica',title:'Web de presentación — Pantalla única',price:65000,description:'Tu negocio en una página: presentación, servicios y contacto.'},
{id:'web-panel',title:'Web de presentación + Panel administrativo básico',price:85000,description:'Presentación y acceso privado para actualizar el contenido acordado.'},
{id:'web-catalogo',title:'Web avanzada con catálogo y panel administrativo',price:120000,description:'Catálogo de productos o servicios y gestión de su contenido.'},
{id:'web-tienda',title:'Web completa con Tiendanube',price:180000,description:'Diseño, catálogo y puesta en marcha de tu tienda. Abono de Tiendanube a cargo del cliente.'}
];
const $=id=>document.getElementById(id),money=n=>new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:2,minimumFractionDigits:0}).format(n),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let selected=plans[0],config=null,checkout=null,controller=null,busy=false,project=null,activeProjectToken=null,selectedReference="";
const planVisuals={
'web-basica':{image:'/assets/images/webs-barberia-hd.webp',includes:['Diseño personalizado','Presentación de tu negocio','Secciones principales','Contacto por WhatsApp']},
'web-panel':{image:'/assets/images/webs-spa-hd.webp',includes:['Diseño personalizado','Panel de autogestión básico','Contenido editable','Galería y contacto']},
'web-catalogo':{image:'/assets/images/portfolio-mica-20261008.webp',includes:['Diseño personalizado','Catálogo de productos o servicios','Panel administrativo','Organización por categorías']},
'web-tienda':{image:'/assets/images/portfolio-nicky-20261008.webp',includes:['Diseño personalizado','Integración con Tiendanube','Catálogo y carrito','Configuración y puesta en marcha']}
};
let shopStep=1;
function showStep(next){
 if(busy||controller)return;
 shopStep=project?3:next;
 const panels={webPackagesPanel:shopStep===1,webCustomizePanel:shopStep===2,webCustomerPanel:shopStep===3,webCartPanel:shopStep===3};
 for(const [id,visible] of Object.entries(panels)){if($(id))$(id).hidden=!visible;}
 document.querySelectorAll('[data-shop-step]').forEach(b=>{if(Number(b.dataset.shopStep)===shopStep)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});
 const builder=document.querySelector('.web-builder');if(builder)builder.dataset.step=String(shopStep);
 if($('webSelectedPlan'))$('webSelectedPlan').textContent=selected.title+' · '+money(selected.price);
 if($('webCustomizeImage'))$('webCustomizeImage').src=planVisuals[selected.id].image;
 if($('webPlanIncludes'))$('webPlanIncludes').innerHTML='<h4>Tu paquete incluye</h4><ul>'+planVisuals[selected.id].includes.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>';
 summary();
}
const stageLabels={deposit:'Seña del 25%',publication:'Publicación · 25%',balance:'Finalización · 50%',full:'Pago total'};
async function api(action,data={}){const res=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...data}),signal:AbortSignal.timeout(25000)});const result=await res.json();if(!res.ok||!result.ok)throw new Error(result.message||'No pudimos completar la operación.');return result;}
function stage(){return new URLSearchParams(location.hash.slice(1)).get('stage')||$('webPaymentStage').value;}
function render(){root.innerHTML=plans.map(p=>`<button type="button" class="web-plan" data-plan="${p.id}" aria-pressed="${p.id===selected.id}"><img src="${planVisuals[p.id].image}" alt="" width="1000" height="667" loading="lazy"><div class="web-plan-body"><h3>${esc(p.title)}</h3><strong>${money(p.price)}</strong><p>${esc(p.description)}</p><ul>${planVisuals[p.id].includes.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><small>Personalizar mi web</small></div></button>`).join('');root.querySelectorAll('[data-plan]').forEach(btn=>btn.onclick=()=>{if(busy||project)return;selected=plans.find(p=>p.id===btn.dataset.plan);activeProjectToken=null;render();showStep(2);$('arma-tu-web').scrollIntoView({behavior:'smooth',block:'start'});});summary();}
function summary(){const total=project?.total||selected.price,cents=Math.round(total*100),first=Math.round(cents*.25),due=(stage()==='full'?cents:stage()==='balance'?cents-first*2:first)/100;$('webCartSummary').innerHTML=`<img class="web-cart-image" src="${planVisuals[selected.id].image}" alt="Ejemplo del paquete seleccionado" width="1000" height="667"><p>${esc(project?.title||selected.title)}</p><dl><dt>Total del servicio</dt><dd>${money(total)}</dd><dt>${esc(stageLabels[stage()]||stageLabels.deposit)}</dt><dd>${money(due)}</dd><dt>Saldo después de este pago</dt><dd>${money(Math.max(0,total-(project?.paid||0)-due))}</dd></dl>${!project?'<p class="web-cart-business">'+esc($('webOrderForm').querySelector('[name="business"]')?.value||'Tu proyecto personalizado')+'</p>':''}${selected.id==='web-tienda'?'<p class="web-platform-note">Incluye diseño y puesta en marcha. El abono de Tiendanube y las comisiones de cobro se pagan por separado.</p>':''}`;}
function lock(value){busy=value;if($('webPayTransfer'))$('webPayTransfer').disabled=value||Boolean(controller);root.querySelectorAll('button').forEach(b=>b.disabled=value||Boolean(project)||Boolean(controller));$('webOrderForm').querySelectorAll('input,select,textarea').forEach(x=>x.disabled=value||Boolean(project)||Boolean(controller));$('webPaymentStage').disabled=value||Boolean(project)||Boolean(controller);$('webPayMP').disabled=value||!config?.mercadopago;$('webPayTN').disabled=value||!config?.tiendanube;$('webPayTN').hidden=!config?.tiendanube;}
function message(text){$('webCheckoutMessage').textContent=text;}
async function pay(provider){if(busy)return;const form=$('webOrderForm');if(!project&&!form.reportValidity())return;const f=new FormData(form);lock(true);message('Preparando tu pago seguro…');try{const payload=(project||activeProjectToken)?{projectToken:project?.token||activeProjectToken,stage:stage(),provider}:{productId:selected.id,stage:$('webPaymentStage').value,provider,customerName:f.get('customerName'),customerEmail:f.get('customerEmail'),customerPhone:f.get('customerPhone'),options:{reference:selectedReference,business:f.get('business'),style:f.get('style'),color:f.get('color'),palette:f.get('palette'),features:f.getAll('features'),details:f.get('details')}};
checkout=await api('web-commerce-checkout',payload);activeProjectToken=checkout.projectToken;
if(provider==='tiendanube'||!checkout.publicKey){location.assign(checkout.checkoutUrl);return;}
if(!window.MercadoPago)throw new Error('El formulario de pago no pudo cargarse. Volvé a intentarlo.');
await controller?.unmount();$('webBrickArea').hidden=false;$('webPayMethods').hidden=true;
const mp=new MercadoPago(checkout.publicKey,{locale:'es-AR'});controller=await mp.bricks().create('payment','webPaymentBrick',{initialization:{amount:checkout.amount,preferenceId:checkout.preferenceId,payer:{email:checkout.email}},customization:{paymentMethods:{creditCard:'all',debitCard:'all',prepaidCard:'all',mercadoPago:'all'}},callbacks:{onReady:()=>message(`Pagás ${money(checkout.amount)} · ${stageLabels[checkout.stage]}.`),onError:()=>message('No se pudo cargar el medio de pago. Podés volver al pedido e intentarlo nuevamente.'),onSubmit:async({selectedPaymentMethod,formData})=>{if(selectedPaymentMethod==='wallet_purchase'){message('Continuá el pago en tu cuenta de Mercado Pago.');return;}const result=await api('web-commerce-pay',{checkoutId:checkout.checkoutId,checkoutToken:checkout.checkoutToken,formData});message(result.status==='approved'?'Tu pedido fue procesado correctamente. En breve nos pondremos en contacto contigo.':result.status==='pending'||result.status==='in_process'?'Tu pago está pendiente de confirmación.':'El pago no fue aprobado. Probá otro medio.');if(result.status==='approved'){await controller?.unmount();controller=null;$('webBrickArea').hidden=true;$('webPayMethods').hidden=true;busy=true;message('Tu pedido fue procesado correctamente. En breve nos pondremos en contacto contigo.');}return result;}}});
$('webBrickArea').scrollIntoView({behavior:'smooth',block:'center'});
}catch(e){message(e.message);lock(false);return;}lock(false);}
function transfer(){
 if(busy||controller)return;
 const total=project?.total||selected.price,cents=Math.round(total*100),first=Math.round(cents*.25),due=(stage()==='full'?cents:stage()==='balance'?cents-first*2:first)/100;
 const panel=$('webTransferPanel');if(!panel)return;
 panel.hidden=false;
 $('webTransferAmount').textContent=(stageLabels[stage()]||stageLabels.deposit)+': '+money(due);
 const business=$('webOrderForm').querySelector('[name="business"]')?.value?.trim();
 const text=['Hola CVStudio, quiero pagar por transferencia bancaria.',project?.title||selected.title,business?'Negocio: '+business:'',`${stageLabels[stage()]||stageLabels.deposit}: ${money(due)}`,selectedReference?'Referencia: '+selectedReference:'','¿Me comparten el alias o CVU y el titular de la cuenta?'].filter(Boolean).join('\n');
 $('webTransferContact').href='https://wa.me/5492964652318?text='+encodeURIComponent(text);
 panel.scrollIntoView({behavior:'smooth',block:'nearest'});
}
$('webPayTransfer')?.addEventListener('click',transfer);
$('webPayMP').onclick=()=>pay('mercadopago');$('webPayTN').onclick=()=>pay('tiendanube');$('webPaymentStage').onchange=()=>{checkout=null;activeProjectToken=null;summary();if($('webTransferPanel')&&!$('webTransferPanel').hidden)transfer();};$('webCancelPayment').onclick=async()=>{await controller?.unmount();controller=null;$('webBrickArea').hidden=true;$('webPayMethods').hidden=false;message('');lock(false);};
$('webOrderForm').addEventListener('input',()=>{activeProjectToken=null;summary();if($('webTransferPanel')&&!$('webTransferPanel').hidden)transfer();});
$('webAddToCart')?.addEventListener('click',()=>{const fields=$('webCustomizePanel').querySelectorAll('input,select,textarea');for(const field of fields){if(!field.reportValidity())return;}showStep(3);$('arma-tu-web').scrollIntoView({behavior:'smooth',block:'start'});});
document.querySelectorAll('[data-shop-step]').forEach(b=>b.addEventListener('click',()=>{const next=Number(b.dataset.shopStep);if(project&&next!==3)return;if(next===3&&shopStep!==3){$('webAddToCart')?.click();return;}showStep(next);}));
document.querySelectorAll('.design-card').forEach(card=>{
 const title=card.querySelector('h3')?.textContent?.trim();if(!title)return;
 const btn=document.createElement('button');btn.type='button';btn.className='web-demo-request';
 btn.innerHTML='<svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 3h2l3 12h11l2-9H6"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></svg><span>Quiero una web similar</span>';
 btn.addEventListener('click',()=>{if(busy||project||controller)return;selectedReference=title;activeProjectToken=null;
 let note=$('webDemoReference');if(!note){note=document.createElement('p');note.id='webDemoReference';note.className='web-demo-reference';$('webOrderForm').prepend(note);}
 note.textContent='Referencia elegida: '+title+'. Podés personalizarla a tu estilo.';
 showStep(2);$('arma-tu-web').scrollIntoView({behavior:'smooth',block:'start'});$('webOrderForm').querySelector('[name="business"]')?.focus({preventScroll:true});});card.append(btn);
});
render();showStep(1);
(async()=>{try{config=await api('web-commerce-catalog');plans=plans.filter(p=>config.products.some(x=>x.product_id===p.id));if(!plans.length)throw new Error("No hay servicios disponibles.");for(const p of plans){p.price=config.products.find(x=>x.product_id===p.id).effective_price;}selected=plans[0];const price=document.querySelector('.price-number');if(price)price.textContent=money(plans[0].price);const params=new URLSearchParams(location.hash.slice(1));if(params.has('project')){project=await api('web-commerce-project',{projectToken:params.get('project')});project.token=params.get('project');selected=plans.find(p=>p.id===project.productId)||selected;$('webOrderForm').hidden=true;root.hidden=true;$('webPaymentStage').hidden=true;document.getElementById('arma-tu-web').scrollIntoView();}render();showStep(project?3:shopStep);lock(false);if(!config.mercadopago&&!config.tiendanube)message('Consultanos por WhatsApp para coordinar tu pedido.');}catch(e){message('El pago online está temporalmente fuera de servicio. Consultanos por WhatsApp.');}})();
})();
