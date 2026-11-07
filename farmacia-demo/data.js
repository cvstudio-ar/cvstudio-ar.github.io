'use strict';
const STORAGE = 'cvstudio-pharmacy-demo-v1';
const methods = {card:'Tarjeta de prueba',wallet:'Mercado Pago simulado',transfer:'Transferencia simulada',pickup:'Pago simulado al retirar'};
const statuses = {received:'Recibido',preparing:'En preparación',ready:'Listo para retirar',sent:'En camino',done:'Entregado',cancelled:'Cancelado'};
const paymentStates = {pending:'Pendiente',approved:'Aprobado',rejected:'Rechazado',refunded:'Reembolsado'};
const visuals = {tube:'Tubo',bottle:'Frasco',box:'Caja',pump:'Dispensador'};
const defaults = {
 settings:{name:'Farmacia Demo',title:'Cuidado de todos los días.',intro:'Explorá productos de higiene, cuidado personal y dermocosmética. Probá el carrito y seguí tu pedido de muestra.',color:'#126445',hero:'',locality:'',address:'',maps:'',whatsapp:'5492964652318',payments:['card','wallet','transfer','pickup'],pickup:true,delivery:true,shipping:2500,freeFrom:30000},
 products:[
  {id:'solar',sku:'DER-01',name:'Protector solar facial FPS 50',category:'Dermocosmética',price:14900,stock:20,art:'tube',color:'#f6e2a2',size:'50 ml',featured:true,description:'Presentación facial de muestra para explorar el catálogo.'},
  {id:'cream',sku:'DER-02',name:'Crema hidratante facial',category:'Dermocosmética',price:12900,stock:15,art:'box',color:'#d6deff',size:'50 g',featured:true,description:'Ejemplo de ficha de un producto de cuidado facial.'},
  {id:'soap',sku:'HIG-01',name:'Jabón líquido para manos',category:'Higiene',price:5400,stock:32,art:'pump',color:'#bde8d3',size:'300 ml',featured:true,description:'Envase con dosificador. Producto ilustrativo.'},
  {id:'water',sku:'PER-01',name:'Agua micelar',category:'Cuidado personal',price:8900,stock:18,art:'bottle',color:'#cfe6fb',size:'200 ml',featured:true,description:'Presentación de muestra de la línea de cuidado personal.'},
  {id:'brush',sku:'HIG-02',name:'Cepillo dental suave',category:'Higiene',price:3200,stock:26,art:'box',color:'#bde8d3',size:'1 unidad',featured:false,description:'Cepillo de uso cotidiano. Producto ilustrativo.'},
  {id:'body',sku:'PER-02',name:'Loción corporal',category:'Cuidado personal',price:9900,stock:12,art:'pump',color:'#f4d4d9',size:'250 ml',featured:false,description:'Ejemplo de una ficha de loción para el cuerpo.'},
  {id:'baby',sku:'BEB-01',name:'Toallitas húmedas',category:'Bebés',price:6100,stock:28,art:'box',color:'#f6e2a2',size:'48 unidades',featured:false,description:'Paquete de muestra para la categoría de bebés.'},
  {id:'shampoo',sku:'BEB-02',name:'Shampoo infantil',category:'Bebés',price:7500,stock:14,art:'bottle',color:'#d6deff',size:'200 ml',featured:false,description:'Presentación de ejemplo para probar el catálogo.'}
 ].map(p=>({...p,visible:true,image:''})),
 orders:[]
};
const money = value => new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(value);
const escapeHTML = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dateLabel = date => new Intl.DateTimeFormat('es-AR',{dateStyle:'short',timeStyle:'short'}).format(new Date(date));
const safeColor = color => /^#[\da-f]{6}$/i.test(color||'')?color:'#126445';
function httpsURL(value){
 try{const url=new URL(value);return url.protocol==='https:'?url.href:''}catch{return ''}
}
function imageURL(value){
 return /^data:image\/(webp|png|jpeg);base64,[a-z0-9+/=]+$/i.test(value||'')?value:httpsURL(value);
}
function read(){
 try{const value=JSON.parse(localStorage.getItem(STORAGE));if(value)return upgradeCatalog(value)}catch{}
 return structuredClone(defaults);
}
async function change(mutator){
 const update=()=>{const state=read();const result=mutator(state);localStorage.setItem(STORAGE,JSON.stringify(state));return result};
 return navigator.locks?navigator.locks.request(STORAGE,update):update();
}
function allowedPayments(settings,delivery){
 return settings.payments.filter(key=>Object.hasOwn(methods,key)&&(key!=='pickup'||delivery==='pickup'));
}
function shipping(settings,delivery,subtotal){
 return delivery==='delivery'&&(!settings.freeFrom||subtotal<settings.freeFrom)?settings.shipping:0;
}
function orderProgress(order){
 return ['received','preparing',order.delivery==='pickup'?'ready':'sent','done'];
}
function createOrder(state,{cart,delivery,payment}){
 const s=state.settings;
 if(!['pickup','delivery'].includes(delivery)||!s[delivery]||!allowedPayments(s,delivery).includes(payment))throw Error('Revisá el método de entrega y pago.');
 if(!cart.size)throw Error('Agregá productos al carrito.');
 const items=[...cart].map(([id,qty])=>{
  const product=state.products.find(p=>p.id===id&&p.visible);
  if(!product||!Number.isInteger(qty)||qty<1||qty>product.stock)throw Error('Cambió la disponibilidad. Revisá el carrito.');
  return {id,name:product.name,qty,price:product.price};
 });
 const subtotal=items.reduce((sum,p)=>sum+p.price*p.qty,0);
 const freight=shipping(s,delivery,subtotal);
 const date=new Date().toISOString();
 const order={code:'FAR-'+crypto.randomUUID().slice(0,8).toUpperCase(),items,subtotal,freight,total:subtotal+freight,delivery,payment,payState:payment==='card'||payment==='wallet'?'approved':'pending',status:'received',date,history:[{status:'received',date}]};
 items.forEach(item=>{state.products.find(p=>p.id===item.id).stock-=item.qty});
 state.orders.unshift(order);
 return order;
}
function setOrderStatus(state,code,status,payState){
 const order=state.orders.find(o=>o.code===code);
 if(!order)throw Error('No encontramos el pedido.');
 if(order.status==='cancelled')throw Error('El pedido ya está cancelado.');
 const flow=orderProgress(order);
 const current=flow.indexOf(order.status);
 if(status!==order.status){
  if(current<0||current===flow.length-1||(status!=='cancelled'&&status!==flow[current+1]))throw Error('El pedido cambió. Volvé a abrirlo.');
  if(status==='cancelled'){
   order.items.forEach(item=>{const product=state.products.find(p=>p.id===item.id);if(product)product.stock+=item.qty});
   if(order.payState==='approved')payState='refunded';
  }
  order.status=status;
  order.history.push({status,date:new Date().toISOString()});
 }
 if(Object.hasOwn(paymentStates,payState))order.payState=payState;
}
const productPhotos={
 solar:{name:'NIVEA Sun Facial FPS 50',size:'50 ml',source:'https://www.falabella.com.co/falabella-co/product/125120326/Bloqueador-Solar-Nivea-Sun-Protect-Fps50-X-50Ml/125120327'},
 cream:{name:'NIVEA Creme en lata',size:'60 ml',source:'https://www.eurosupermercados.com.co/crema-nivea-lata-x-60ml-5c4/p'},
 soap:{name:'Dove Jabón líquido para manos',size:'250 ml',source:'https://www.sanroque.com.uy/catalogo/dove-jabon-liquido-para-manos_93540_93540'},
 water:{name:'Garnier Agua micelar',size:'400 ml',source:'https://bellisima.mx/products/skin-active-agua-micelar-todo-en-1-todo-tipo-de-piel-400ml-garnier'},
 brush:{name:'Colgate Ultra Soft',size:'1 unidad',source:'https://drogueriasmultifarma.com/products/cepillo-dental-colgate-ultra-soft-x-1-uni-paquete-x-1-und'},
 body:{name:'NIVEA Hidratación Express',size:'250 ml',source:'https://farmacorp.com/products/90611'},
 baby:{name:'Huggies Triple Protección',size:'48 unidades',source:'https://www.farmacity.com/toallas-humedas-huggies-triple-proteccion-x-48-un-/p'},
 shampoo:{name:"Johnson’s Baby Shampoo",size:'200 ml',source:'https://www.farmacenter.com.py/catalogo/johnson-sha-clasico-fr-x-200-ml_10001182_10001182'}
};
const legacyNames=Object.fromEntries(defaults.products.map(p=>[p.id,p.name]));
for(const product of defaults.products){
 const detail=productPhotos[product.id];
 if(detail)Object.assign(product,{name:detail.name,size:detail.size,description:'Producto de referencia del catálogo de demostración. Precio y stock de muestra.'});
}
function upgradeCatalog(state){
 state.products=state.products.map(product=>{
  const info=productPhotos[product.id];
  if(info&&product.name===legacyNames[product.id])return {...product,name:info.name,size:info.size,description:'Producto de referencia del catálogo de demostración. Precio y stock de muestra.'};
  return product;
 });
 return state;
}
function productArt(product){
 const custom=imageURL(product.image);
 if(custom)return `<img src="${escapeHTML(custom)}" alt="" loading="lazy">`;
 if(Object.hasOwn(productPhotos,product.id))return `<img class="real-product-photo" src="assets/productos/${product.id}.webp" alt="" loading="lazy">`;
 const shapes={
  tube:'<path d="M31 14h58l-7 65H38z"/><rect x="39" y="79" width="42" height="15" rx="3"/>',
  bottle:'<rect x="43" y="10" width="34" height="17" rx="4"/><rect x="33" y="26" width="54" height="70" rx="15"/>',
  box:'<rect x="30" y="18" width="60" height="78" rx="5"/><path d="M30 31h60"/>',
  pump:'<path d="M58 28V12h24v7H68v9"/><rect x="34" y="27" width="52" height="69" rx="12"/>'
 };
 return `<svg class="pack" viewBox="0 0 120 112" aria-hidden="true"><ellipse cx="60" cy="100" rx="38" ry="6" fill="#173429" opacity=".12"/><g fill="white" stroke="#244b3d" stroke-width="2" stroke-linejoin="round">${shapes[product.art]||shapes.box}</g><path d="M44 45h32v26H44z" fill="${safeColor(product.color)}"/><path d="M53 58h14m-7-7v14" stroke="#214e3b" stroke-width="3" stroke-linecap="round"/></svg>`;
}
function applyBrand(settings){
 const color=safeColor(settings.color);
 const luminance=color.slice(1).match(/../g).map(hex=>parseInt(hex,16)/255).map(channel=>channel<=.04045?channel/12.92:((channel+.055)/1.055)**2.4).reduce((sum,channel,index)=>sum+channel*[.2126,.7152,.0722][index],0);
 document.documentElement.style.setProperty('--green',color);
 document.documentElement.style.setProperty('--on-green',luminance>.179?'#111':'#fff');
 document.querySelectorAll('[data-brand]').forEach(el=>el.textContent=settings.name);
}
