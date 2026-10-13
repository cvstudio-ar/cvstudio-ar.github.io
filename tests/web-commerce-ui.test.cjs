const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('js/web-commerce.js','utf8');
async function scenario({publicKey=null,failCheckout=false}={}){
 const values={business:'Panadería Ejemplo',style:'Minimalista',color:'#ffcc00',palette:'Dorado y negro',features:['WhatsApp','Galería'],details:'Tres propuestas',customerName:'Cliente Ejemplo',customerEmail:'cliente@example.com',customerPhone:'+5491112345678'};
 const fields=Object.entries(values).map(([name,value])=>({name,value,disabled:false}));
 const elements=Object.fromEntries(['webPlans','webPaymentStage','webCartSummary','webOrderForm','webPayMP','webPayTN','webCheckoutMessage','webBrickArea','webPayMethods','webCancelPayment','arma-tu-web'].map(id=>[id,{id,hidden:false,disabled:false,value:id==='webPaymentStage'?'deposit':'',innerHTML:'',textContent:'',scrollIntoView(){},addEventListener(){},querySelectorAll(){return[];}}]));
 elements.webOrderForm.querySelectorAll=()=>fields;elements.webOrderForm.querySelector=selector=>fields.find(f=>selector.includes(f.name));elements.webOrderForm.reportValidity=()=>true;elements.webOrderForm.fields=fields;
 const payloads=[],redirects=[];let callbacks;
 const document={getElementById:id=>elements[id],querySelectorAll:()=>[],querySelector:()=>null};
 const context={console,document,URLSearchParams,Intl,AbortSignal,location:{hash:'',assign:url=>redirects.push(url)},FormData:class{constructor(form){this.entries=form.fields.filter(f=>!f.disabled);}get(name){return this.entries.find(f=>f.name===name)?.value??null;}getAll(name){const v=this.get(name);return Array.isArray(v)?v:v?[v]:[];}},fetch:async(url,options)=>{
  const body=JSON.parse(options.body);payloads.push(body);let result;
  if(body.action==='web-commerce-catalog')result={ok:true,products:['web-basica','web-panel','web-catalogo','web-tienda'].map((id,i)=>({product_id:id,effective_price:[65000,85000,120000,180000][i]})),mercadopago:true,tiendanube:false};
  else if(body.action==='web-commerce-checkout')result=failCheckout?{ok:false,message:'No se pudo generar el pago.'}:{ok:true,checkoutId:'charge',checkoutToken:'token',projectToken:'project',checkoutUrl:'https://www.mercadopago.com.ar/checkout/test',preferenceId:'preference',publicKey,amount:16250,email:values.customerEmail,stage:'deposit'};
  else if(body.action==='web-commerce-pay')result={ok:true,status:'approved'};
  else throw Error('Unexpected action '+body.action);
  return {ok:result.ok,json:async()=>result};
 },MercadoPago:class{bricks(){return{create:async(type,id,settings)=>{callbacks=settings.callbacks;return{unmount:async()=>{}};}};}}};context.window=context;vm.runInNewContext(source,context);
 await new Promise(setImmediate);assert.equal(elements.webPayTN.hidden,true,'Disconnected provider is hidden');
 await elements.webPayMP.onclick();const checkout=payloads.find(x=>x.action==='web-commerce-checkout');assert.equal(checkout.customerName,values.customerName);assert.equal(checkout.options.business,values.business);assert.deepEqual(checkout.options.features,values.features);assert.equal(checkout.stage,'deposit');
 if(failCheckout){assert.equal(elements.webPayMP.disabled,false);assert.equal(fields.every(f=>!f.disabled),true);assert.match(elements.webCheckoutMessage.textContent,/generar/);}
 else if(!publicKey)assert.equal(redirects.length,1);
 else{const before=payloads.length;await callbacks.onSubmit({selectedPaymentMethod:'wallet_purchase',formData:{}});assert.equal(payloads.length,before,'Wallet does not enter card-token backend');await callbacks.onSubmit({selectedPaymentMethod:'credit_card',formData:{token:'safe-card-token'}});assert.equal(elements.webPayMethods.hidden,true);assert.match(elements.webCheckoutMessage.textContent,/procesado correctamente/);await elements.webPayMP.onclick();assert.equal(payloads.filter(x=>x.action==='web-commerce-checkout').length,1,'Approved checkout cannot be started again');}
}
(async()=>{await scenario();await scenario({failCheckout:true});await scenario({publicKey:'public-test'});console.log('PASS: form values survive locking, failed checkout unlocks, disconnected provider hidden, wallet bypasses card API, approval prevents duplicate checkout.');})().catch(e=>{console.error(e);process.exitCode=1;});
