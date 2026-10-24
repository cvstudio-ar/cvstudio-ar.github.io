const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(process.env.WEB_COMMERCE_SOURCE||'js/web-commerce-inmobiliaria.js','utf8');
async function scenario({publicKey=null,failCheckout=false,currency='ARS'}={}){
 const values={business:'Panadería Ejemplo',style:'Minimalista',color:'#ffcc00',palette:'Dorado y negro',features:['WhatsApp','Galería'],details:'Tres propuestas',customerName:'Cliente Ejemplo',customerEmail:'cliente@example.com',customerPhone:'+5491112345678'};
 const fields=Object.entries(values).map(([name,value])=>({name,value,disabled:false}));
 const elements=Object.fromEntries(['webPlans','webPaymentStage','webCartSummary','webOrderForm','webPayMP','webPayTN','webCheckoutMessage','webBrickArea','webPayMethods','webCancelPayment','arma-tu-web','webPayTransfer','webTransferPanel','webTransferAmount','webTransferContact','webInternationalNote','webPayPalForm','webPayPalButtonId','webPayPalCurrency','webPayPalOption','webPayPalReference','webPayPalProject','webSelectedPlan'].map(id=>[id,{id,hidden:false,disabled:false,value:id==='webPaymentStage'?'deposit':'',innerHTML:'',textContent:'',scrollIntoView(){},addEventListener(event,fn){this["on"+event]=fn;},querySelectorAll(){return[];}}]));
 elements.webOrderForm.querySelectorAll=()=>fields;elements.webOrderForm.querySelector=selector=>fields.find(f=>selector.includes(f.name));elements.webOrderForm.reportValidity=()=>true;elements.webOrderForm.fields=fields;
 const payloads=[],redirects=[];let callbacks;
 const events={};const document={documentElement:{dataset:{preferredCurrency:currency}},addEventListener:(name,fn)=>events[name]=fn,getElementById:id=>elements[id],querySelectorAll:()=>[],querySelector:()=>null};
 const savedOrders={};const context={console,document,URLSearchParams,Intl,AbortSignal,sessionStorage:{setItem:(key,value)=>savedOrders[key]=value},location:{hash:'',assign:url=>redirects.push(url)},FormData:class{constructor(form){this.entries=form.fields.filter(f=>!f.disabled);}get(name){return this.entries.find(f=>f.name===name)?.value??null;}getAll(name){const v=this.get(name);return Array.isArray(v)?v:v?[v]:[];}},fetch:async(url,options)=>{
  const body=JSON.parse(options.body);payloads.push(body);let result;
  if(body.action==='web-commerce-catalog')result={ok:true,products:['web-basica','web-panel','web-catalogo','web-tienda'].map((id,i)=>({product_id:id,effective_price:[65000,85000,120000,180000][i]})),mercadopago:true,tiendanube:false};
  else if(body.action==='web-commerce-checkout')result=failCheckout?{ok:false,message:'No se pudo generar el pago.'}:{ok:true,checkoutId:'charge',checkoutToken:'token',projectToken:'project',checkoutUrl:'https://www.mercadopago.com.ar/checkout/test',preferenceId:'preference',publicKey,amount:16250,email:values.customerEmail,stage:'deposit'};
  else if(body.action==='web-commerce-pay')result={ok:true,status:'approved'};
  else throw Error('Unexpected action '+body.action);
  return {ok:result.ok,json:async()=>result};
 },MercadoPago:class{bricks(){return{create:async(type,id,settings)=>{callbacks=settings.callbacks;return{unmount:async()=>{}};}};}}};context.window=context;vm.runInNewContext(source,context);
 await new Promise(setImmediate);assert.equal(elements.webPayTN.hidden,true,'Disconnected provider is hidden');
 if(currency!=='ARS'){
  const amounts=currency==='USD'?[110,140,190,240]:[100,130,180,230];
  for(const amount of amounts)assert.ok(elements.webPlans.innerHTML.includes(new Intl.NumberFormat('es-AR',{style:'currency',currency,currencyDisplay:'code',maximumFractionDigits:2,minimumFractionDigits:0}).format(amount)),currency+' fixed price '+amount);
  assert.equal(elements.webPayMethods.hidden,true);assert.equal(elements.webPayTransfer.hidden,true);assert.equal(elements.webPayPalForm.hidden,false);
  assert.equal(elements.webPayPalCurrency.value,currency);assert.equal(elements.webPayPalButtonId.value,currency==='USD'?'Q5JE7LJJRW946':'YWCQRKWRNRTH2');assert.equal(elements.webPayPalOption.value,'Presentación — Seña 25%');
  let prevented=false;elements.webPayPalForm.onsubmit({preventDefault(){prevented=true;}});assert.equal(prevented,false);assert.equal(JSON.parse(savedOrders['cvstudio-paypal-order']).currency,currency);
  elements.webPaymentStage.value='full';elements.webPaymentStage.onchange();assert.equal(elements.webPayPalOption.value,'Presentación — Pago total');
  await elements.webPayMP.onclick();assert.equal(payloads.filter(x=>x.action==='web-commerce-checkout').length,0,'Foreign currency never starts an ARS checkout');
  elements.webOrderForm.reportValidity=()=>false;elements.webPayPalForm.onsubmit({preventDefault(){prevented=true;}});assert.equal(prevented,true,'PayPal requires valid customer/project fields');
  events['cvstudio:currencychange']({detail:{currency:'ARS'}});assert.equal(elements.webPayPalForm.hidden,true);assert.equal(elements.webPayMethods.hidden,false);assert.equal(elements.webPayTransfer.hidden,false);assert.equal(fields.find(f=>f.name==='business').value,values.business,'Currency changes retain project data');
  assert.match(elements.webCartSummary.innerHTML,/ARS/);
  return;
 }

 elements.webPayTransfer.onclick();assert.equal(elements.webTransferPanel.hidden,false);assert.match(elements.webTransferAmount.textContent,/16.250/);assert.match(decodeURIComponent(elements.webTransferContact.href),/Panadería Ejemplo/);assert.match(elements.webTransferContact.href,/^https:\/\/wa\.me\/5492964652318/);assert.equal(payloads.filter(x=>x.action==='web-commerce-checkout').length,0,'Transfer instructions do not create or confirm a payment');
 elements.webPaymentStage.value='full';elements.webPaymentStage.onchange();assert.match(elements.webTransferAmount.textContent,/65.000/);elements.webPaymentStage.value='deposit';elements.webPaymentStage.onchange();
 await elements.webPayMP.onclick();const checkout=payloads.find(x=>x.action==='web-commerce-checkout');assert.equal(checkout.customerName,values.customerName);assert.equal(checkout.options.business,values.business);assert.deepEqual(checkout.options.features,values.features);assert.equal(checkout.stage,'deposit');
 if(failCheckout){assert.equal(elements.webPayMP.disabled,false);assert.equal(fields.every(f=>!f.disabled),true);assert.match(elements.webCheckoutMessage.textContent,/generar/);}
 else if(!publicKey)assert.equal(redirects.length,1);
 else{const before=payloads.length;await callbacks.onSubmit({selectedPaymentMethod:'wallet_purchase',formData:{}});assert.equal(payloads.length,before,'Wallet does not enter card-token backend');await callbacks.onSubmit({selectedPaymentMethod:'credit_card',formData:{token:'safe-card-token'}});assert.equal(elements.webPayMethods.hidden,true);assert.match(elements.webCheckoutMessage.textContent,/procesado correctamente/);await elements.webPayMP.onclick();assert.equal(payloads.filter(x=>x.action==='web-commerce-checkout').length,1,'Approved checkout cannot be started again');}
}
(async()=>{await scenario();await scenario({failCheckout:true});await scenario({publicKey:'public-test'});await scenario({currency:'USD'});await scenario({currency:'EUR'});console.log('PASS: checkout ARS, fixed USD/EUR prices, PayPal hosted buttons and installments, valid forms, currency switching, no foreign amount sent to Mercado Pago.');})().catch(e=>{console.error(e);process.exitCode=1;});
