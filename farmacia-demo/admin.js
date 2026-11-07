'use strict';
const $ = selector => document.querySelector(selector);
let state=read(),tab='overview',search='',orderFilter='', productEditor=null;
let noticeTimer;
function toast(message){
 const notice=$('#notice');notice.textContent=message;notice.hidden=false;
 clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>notice.hidden=true,3500);
}
const esc=escapeHTML;
const option=(value,label,selected)=>`<option value="${esc(value)}" ${value===selected?'selected':''}>${esc(label)}</option>`;
function overview(){
 const metrics=[
  ['Productos publicados',state.products.filter(p=>p.visible).length],
  ['Productos con stock bajo',state.products.filter(p=>p.visible&&p.stock<=5).length],
  ['Pedidos abiertos',state.orders.filter(o=>!['done','cancelled'].includes(o.status)).length],
  ['Total de pedidos aprobados',money(state.orders.filter(o=>o.payState==='approved'&&o.status!=='cancelled').reduce((n,o)=>n+o.total,0))]
 ];
 return `<h2>Resumen de la farmacia</h2><div class="metrics">${metrics.map(([label,value])=>`<div><span>${label}</span><strong>${value}</strong></div>`).join('')}</div>
 <h3>Actividad reciente</h3>${state.orders.slice(0,4).map(o=>`<button type="button" class="overview-order" data-order="${esc(o.code)}"><b>${esc(o.code)}</b><span>${statuses[o.status]} · ${money(o.total)}</span></button>`).join('')||'<p class="muted">Los pedidos aparecen acá cuando completás una compra en la tienda.</p>'}
 <div class="actions"><a class="button solid" href="./#catalogo">Probar una compra</a><button type="button" class="button outline" data-tab="products">Ver productos</button></div>`;
}
function productRows(){
 const items=state.products.filter(p=>[p.name,p.category,p.sku].join(' ').toLowerCase().includes(search));
 return items.map(p=>`<div class="manage-row"><div><strong>${esc(p.name)}</strong><small>${esc(p.sku)} · ${esc(p.category)} · ${p.visible?'Publicado':'Oculto'}${p.featured?' · Destacado':''}</small></div><div class="row-actions"><span>${money(p.price)} · Stock ${p.stock}</span><button class="button outline" type="button" data-product="${esc(p.id)}">Editar</button></div></div>`).join('')||'<p class="empty">No encontramos productos.</p>';
}
function products(){
 return `<div class="section-title"><h2>Productos y stock</h2><button class="button solid" type="button" data-product="">Nuevo producto</button></div><label>Buscar por nombre, código o categoría<input type="search" id="admin-search" value="${esc(search)}"></label><div id="product-rows">${productRows()}</div>`;
}
function orders(){
 const orders=state.orders.filter(o=>!orderFilter||o.status===orderFilter);
 return `<h2>Pedidos y seguimiento</h2><label>Filtrar por estado<select id="order-filter">${option('','Todos los estados',orderFilter)}${Object.entries(statuses).map(([key,label])=>option(key,label,orderFilter)).join('')}</select></label>
 ${orders.map(o=>`<div class="manage-row"><div><strong>${esc(o.code)}</strong><small>${dateLabel(o.date)} · ${statuses[o.status]} · Pago ${paymentStates[o.payState].toLowerCase()}</small></div><div class="row-actions"><span>${money(o.total)}</span><button class="button outline" type="button" data-order="${esc(o.code)}">Ver pedido</button></div></div>`).join('')||'<p class="empty">Todavía no hay pedidos para este filtro.</p>'}`;
}
function design(){
 const s=state.settings;
 return `<h2>Diseño y contacto</h2><form id="design-form" class="form-grid">
 <label>Nombre de la farmacia<input name="name" maxlength="65" required value="${esc(s.name)}"></label>
 <label>Color principal<input name="color" type="color" value="${safeColor(s.color)}"></label>
 <label class="full">Título de portada<input name="title" required maxlength="90" value="${esc(s.title)}"></label>
 <label class="full">Descripción de portada<textarea name="intro" maxlength="280" rows="3">${esc(s.intro)}</textarea></label>
 <label class="full">URL de portada<input name="hero" type="url" maxlength="2048" placeholder="https://…" value="${esc(httpsURL(s.hero))}"></label>
 <label class="full">Subir imagen de portada<input name="heroFile" type="file" accept="image/jpeg,image/png,image/webp"></label>
 <label class="check full"><input name="resetHero" type="checkbox"> Usar la portada original</label>
 <label>Localidad<input name="locality" maxlength="90" value="${esc(s.locality)}"></label>
 <label>Dirección<input name="address" maxlength="160" value="${esc(s.address)}"></label>
 <label>Enlace de Google Maps<input name="maps" type="url" maxlength="2048" value="${esc(s.maps)}" placeholder="https://maps.app.goo.gl/…"></label>
 <label>WhatsApp con código de país<input name="whatsapp" inputmode="tel" maxlength="28" value="${esc(s.whatsapp)}" required></label>
 <div class="actions full"><button class="button solid">Guardar diseño</button></div></form>`;
}
function settings(){
 const s=state.settings;
 return `<h2>Pagos y entregas</h2><form id="payments-form" class="form-grid">
 <fieldset class="full"><legend>Medios de pago de muestra</legend>${Object.entries(methods).map(([key,label])=>`<label class="check"><input name="payment" type="checkbox" value="${key}" ${s.payments.includes(key)?'checked':''}> ${label}</label>`).join('')}</fieldset>
 <fieldset class="full"><legend>Modalidades de entrega</legend><label class="check"><input name="pickup" type="checkbox" ${s.pickup?'checked':''}> Retiro en farmacia</label><label class="check"><input name="delivery" type="checkbox" ${s.delivery?'checked':''}> Envío a domicilio</label></fieldset>
 <label>Costo de envío (ARS)<input name="shipping" type="number" min="0" max="9999999" step="1" required value="${s.shipping}"></label>
 <label>Envío gratis desde (ARS)<input name="freeFrom" type="number" min="0" max="9999999" step="1" required value="${s.freeFrom}"><small>Usá 0 para desactivar este beneficio.</small></label>
 <p class="muted full">Los pagos se simulan dentro de la demo. No se solicitan tarjetas, comprobantes ni datos bancarios.</p>
 <div class="actions full"><button class="button solid">Guardar pagos y entregas</button></div></form>`;
}
function render(){
 state=read();applyBrand(state.settings);
 document.querySelectorAll('.admin-nav [data-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tab===tab)));
 $('#admin-content').innerHTML={overview,products,orders,design,settings}[tab]();
}
function editProduct(id){
 const p=state.products.find(p=>p.id===id)||{name:'',sku:'',category:'',size:'',description:'',price:0,stock:0,image:'',color:'#bde8d3',art:'box',visible:true};
 productEditor=p;
 $('#editor-content').innerHTML=`<h2 id="editor-title">${id?'Editar producto':'Nuevo producto'}</h2><form id="product-form" class="form-grid">
 <label>Nombre<input name="name" required maxlength="90" value="${esc(p.name)}"></label>
 <label>Código / SKU<input name="sku" required maxlength="30" value="${esc(p.sku)}"></label>
 <label>Categoría<input name="category" required maxlength="40" value="${esc(p.category)}"></label>
 <label>Presentación<input name="size" maxlength="36" value="${esc(p.size)}"></label>
 <label>Precio (ARS)<input name="price" type="number" min="0" max="9999999" step="1" required value="${p.price}"></label>
 <label>Stock<input name="stock" type="number" min="0" max="999999" step="1" required value="${p.stock}"></label>
 <label class="full">Descripción<textarea name="description" maxlength="700" rows="3">${esc(p.description)}</textarea></label>
 <label>Tipo de ilustración<select name="art">${Object.entries(visuals).map(([key,label])=>option(key,label,p.art)).join('')}</select></label>
 <label>Color de ilustración<input name="color" type="color" value="${safeColor(p.color)}"></label>
 <label class="full">URL de imagen<input name="image" type="url" maxlength="2048" value="${esc(httpsURL(p.image))}" placeholder="https://…"></label>
 <label class="full">Subir imagen<input name="imageFile" type="file" accept="image/jpeg,image/png,image/webp"></label>
 <label class="check full"><input name="resetImage" type="checkbox"> Usar la ilustración en vez de la imagen</label>
 <label class="check"><input name="featured" type="checkbox" ${p.featured?'checked':''}> Destacado</label>
 <label class="check"><input name="visible" type="checkbox" ${p.visible?'checked':''}> Publicado</label>
 <div class="actions full"><button class="button solid">Guardar producto</button>${id?`<button class="button outline" type="button" data-remove="${esc(id)}">Eliminar</button>`:''}</div></form>`;
 $('#editor').showModal();
}
function editOrder(code){
 const o=state.orders.find(o=>o.code===code);
 if(!o)return;
 const flow=orderProgress(o),next=flow[flow.indexOf(o.status)+1];
 const canAdvance=!['done','cancelled'].includes(o.status)&&next;
 $('#editor-content').innerHTML=`<h2 id="editor-title">Pedido ${esc(o.code)}</h2><p class="muted">${dateLabel(o.date)} · ${o.delivery==='pickup'?'Retiro en farmacia':'Envío a domicilio'} · ${methods[o.payment]}</p>
 <ul class="history">${o.items.map(p=>`<li>${p.qty} × ${esc(p.name)} <span>${money(p.price*p.qty)}</span></li>`).join('')}</ul>
 <div class="totals"><span>Envío</span><span>${money(o.freight)}</span><strong>Total</strong><strong>${money(o.total)}</strong></div>
 ${o.status==='cancelled'?'<p class="muted">Pedido cancelado.</p>':`<form id="order-form" class="form-grid" data-code="${esc(code)}">
 <label>Estado del pedido<select name="status">${option(o.status,statuses[o.status],o.status)}${canAdvance?option(next,statuses[next])+option('cancelled',statuses.cancelled):''}</select></label>
 <label>Estado del pago<select name="payState">${Object.entries(paymentStates).map(([key,label])=>option(key,label,o.payState)).join('')}</select></label>
 <div class="actions full"><button class="button solid">Guardar estado</button></div></form>`}
 <h3>Historial del pedido</h3><ul class="history">${o.history.map(e=>`<li>${statuses[e.status]} <span>${dateLabel(e.date)}</span></li>`).join('')}</ul>`;
 $('#editor').showModal();
}
async function picture(file,url,existing,reset,maxWidth){
 if(reset)return '';
 if(file.size){
  if(file.size>8_000_000||!/^image\/(jpeg|png|webp)$/.test(file.type))throw Error('Elegí una imagen JPG, PNG o WebP de hasta 8 MB.');
  const image=await createImageBitmap(file);
  try{
   const scale=Math.min(1,maxWidth/Math.max(image.width,image.height));
   const canvas=document.createElement('canvas');
   canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));
   canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
   return canvas.toDataURL('image/webp',.8);
  }finally{image.close()}
 }
 if(url&&!httpsURL(url))throw Error('Usá un enlace de imagen que comience con https://.');
 return url||(/^data:image\//.test(existing)?existing:'');
}
async function save(form){
 const fd=new FormData(form);
 const value=key=>String(fd.get(key)??'').trim();
 if(form.id==='design-form'){
  const s={name:value('name'),color:value('color'),title:value('title'),intro:value('intro'),locality:value('locality'),address:value('address'),maps:value('maps'),whatsapp:value('whatsapp').replace(/\D/g,'')};
  if(!s.name||!s.title||!/^\d{8,15}$/.test(s.whatsapp)||(s.maps&&!httpsURL(s.maps)))throw Error('Revisá el nombre, el título, WhatsApp y el enlace del mapa.');
  const hero=await picture(fd.get('heroFile'),value('hero'),state.settings.hero,fd.has('resetHero'),1600);
  await change(data=>Object.assign(data.settings,s,{hero}));return;
 }
 if(form.id==='payments-form'){
  const s={payments:fd.getAll('payment'),pickup:fd.has('pickup'),delivery:fd.has('delivery'),shipping:Number(value('shipping')),freeFrom:Number(value('freeFrom'))};
  if((!s.pickup&&!s.delivery)||(s.pickup&&!allowedPayments(s,'pickup').length)||(s.delivery&&!allowedPayments(s,'delivery').length))throw Error('Activá al menos una modalidad de entrega y un pago compatible para cada modalidad.');
  await change(data=>Object.assign(data.settings,s));return;
 }
 if(form.id==='order-form'){
  await change(data=>setOrderStatus(data,form.dataset.code,value('status'),value('payState')));return;
 }
 const original=productEditor;
 const p={id:original.id||crypto.randomUUID(),name:value('name'),sku:value('sku'),category:value('category'),size:value('size'),description:value('description'),art:value('art'),color:value('color'),price:Number(value('price')),stock:Number(value('stock')),featured:fd.has('featured'),visible:fd.has('visible')};
 if(!p.name||!p.sku||!p.category)throw Error('Completá nombre, código y categoría.');
 p.image=await picture(fd.get('imageFile'),value('image'),original.image,fd.has('resetImage'),700);
 await change(data=>{
  if(data.products.some(other=>other.id!==p.id&&other.sku.toLowerCase()===p.sku.toLowerCase()))throw Error('Ese código ya corresponde a otro producto.');
  const index=data.products.findIndex(other=>other.id===p.id);
  if(original.id&&index<0)throw Error('El producto ya no está disponible para editar.');
  if(index>=0){
   if(data.products[index].stock!==original.stock)throw Error('Cambió el stock. Cerrá y volvé a abrir el producto.');
   data.products[index]=p;
  }else data.products.push(p);
 });
}
document.addEventListener('click',async event=>{
 const b=event.target.closest('button');
 if(!b)return;
 if(b.dataset.tab){tab=b.dataset.tab;render()}
 if(b.hasAttribute('data-product'))editProduct(b.dataset.product);
 if(b.dataset.order)editOrder(b.dataset.order);
 if(b.dataset.remove&&confirm('¿Eliminar este producto de la demo?')){
  b.disabled=true;
  try{await change(data=>{
   const hasOpenOrder=data.orders.some(o=>!['done','cancelled'].includes(o.status)&&o.items.some(item=>item.id===b.dataset.remove));
   if(hasOpenOrder)throw Error('El producto tiene un pedido abierto. Podés ocultarlo.');
   data.products=data.products.filter(p=>p.id!==b.dataset.remove);
  });$('#editor').close();render();toast('Producto eliminado.')}catch(error){toast(error.message);b.disabled=false}
 }
});
$('#close-editor').onclick=()=>$('#editor').close();
$('#admin-content').addEventListener('input',event=>{
 if(event.target.id==='admin-search'){search=event.target.value.trim().toLowerCase();$('#product-rows').innerHTML=productRows()}
});
$('#admin-content').addEventListener('change',event=>{if(event.target.id==='order-filter'){orderFilter=event.target.value;render()}});
document.addEventListener('submit',async event=>{
 event.preventDefault();const button=event.submitter;
 if(button.disabled)return;
 button.disabled=true;
 try{await save(event.target);$('#editor').close();render();toast('Cambios guardados en este navegador.')}
 catch(error){toast(error.name==='QuotaExceededError'?'Sin espacio para guardar. Probá con imágenes más livianas.':error.message);button.disabled=false}
});
addEventListener('storage',event=>{if((event.key===STORAGE||event.key===null)&&['overview','products','orders'].includes(tab)&&!$('#editor').open)render()});
render();
