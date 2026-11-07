'use strict';
const $ = selector => document.querySelector(selector);
let state=read(), category='', trackingCode='', checkoutBusy=false;
const cart=new Map();
let noticeTimer;
function toast(message){
 const notice=$('#notice');notice.textContent=message;notice.hidden=false;
 clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>notice.hidden=true,2500);
}
function renderBrand(){
 const s=state.settings;applyBrand(s);
 document.title=s.name+' | Demo CVStudio';
 $('#hero-title').textContent=s.title;
 $('#hero-intro').textContent=s.intro;
 $('#hero-image').src=imageURL(s.hero)||'assets/portada.webp';
 const address=[s.address,s.locality].filter(Boolean).join(' · ');
 const map=httpsURL(s.maps);
 $('#location').hidden=!address&&!map;
 $('#address').textContent=address;
 $('#map').hidden=!map;
 if(map)$('#map').href=map;
 $('#whatsapp').href='https://wa.me/'+s.whatsapp.replace(/\D/g,'')+'?text='+encodeURIComponent('Hola CVStudio, quiero consultar por una web para mi farmacia.');
}
function renderCatalog(){
 const visible=state.products.filter(p=>p.visible);
 const categories=[...new Set(visible.map(p=>p.category))].sort();
 if(category&&!categories.includes(category))category='';
 $('#categories').innerHTML=['',...categories].map(c=>`<button class="chip" type="button" data-category="${escapeHTML(c)}" aria-pressed="${category===c}">${escapeHTML(c||'Todos')}</button>`).join('');
 const query=$('#search').value.trim().toLocaleLowerCase('es');
 const items=visible.filter(p=>(!category||p.category===category)&&[p.name,p.category,p.sku].join(' ').toLocaleLowerCase('es').includes(query));
 const sorting={default:(a,b)=>Number(b.featured)-Number(a.featured),low:(a,b)=>a.price-b.price,high:(a,b)=>b.price-a.price,name:(a,b)=>a.name.localeCompare(b.name,'es')};
 items.sort(sorting[$('#sort').value]);
 $('#product-count').textContent=items.length+' '+(items.length===1?'producto':'productos');
 $('#products').innerHTML=items.map(p=>`<article class="product">
   <div class="product-art" style="--art:${safeColor(p.color)}">${productArt(p)}${p.featured?'<span class="badge">Destacado</span>':''}</div>
   <div class="product-body"><p class="meta">${escapeHTML(p.category)} · ${escapeHTML(p.size)}</p>
   <h3><button class="plain" type="button" data-detail="${escapeHTML(p.id)}">${escapeHTML(p.name)}</button></h3>
   <strong class="price">${money(p.price)}</strong>
   <div class="product-actions"><button type="button" class="button outline" data-detail="${escapeHTML(p.id)}">Ver ficha</button><button type="button" class="button solid" data-add="${escapeHTML(p.id)}" ${p.stock?'':'disabled'}>${p.stock?'Agregar':'Sin stock'}</button></div></div></article>`).join('')||'<p class="empty">No encontramos productos con esos filtros.</p>';
}
function openProduct(id){
 const p=state.products.find(product=>product.id===id&&product.visible);
 if(!p)return;
 $('#product-detail').innerHTML=`<div class="product-art detail-art" style="--art:${safeColor(p.color)}">${productArt(p)}</div><p class="kicker">${escapeHTML(p.category)}</p><h2 id="product-dialog-title">${escapeHTML(p.name)}</h2><p>${escapeHTML(p.description)}</p>${productPhotos[p.id]&&!imageURL(p.image)?`<p class="photo-credit"><a href="${escapeHTML(productPhotos[p.id].source)}" target="_blank" rel="noopener">Fuente de la fotografía del producto ↗</a></p>`:''}<p class="muted">${escapeHTML(p.size)} · ${p.stock?'Stock de muestra: '+p.stock:'Sin stock'}</p><p class="price">${money(p.price)}</p><button type="button" class="button solid" data-add="${escapeHTML(p.id)}" ${p.stock?'':'disabled'}>Agregar al carrito</button>`;
 $('#product-dialog').showModal();
}
function editCart(id,amount){
 const p=state.products.find(product=>product.id===id&&product.visible);
 const qty=(cart.get(id)||0)+amount;
 if(amount>0&&(!p||qty>p.stock)){toast('Alcanzaste el stock disponible.');return false}
 if(qty>0)cart.set(id,qty);else cart.delete(id);
 renderCart();return true;
}
function renderCart(){
 let subtotal=0;
 $('#cart-count').textContent=[...cart.values()].reduce((a,b)=>a+b,0);
 $('#cart-lines').innerHTML=[...cart].map(([id,qty])=>{
  const p=state.products.find(product=>product.id===id&&product.visible);
  if(p)subtotal+=p.price*qty;
  return `<div class="cart-line"><div><strong>${escapeHTML(p?.name||'Producto no disponible')}</strong><div class="muted">${p?money(p.price):'Quitalo para continuar'}</div></div><div class="quantity"><button type="button" class="button outline" data-minus="${escapeHTML(id)}" aria-label="Quitar una unidad">−</button><b>${qty}</b><button type="button" class="button outline" data-add="${escapeHTML(id)}" aria-label="Agregar una unidad" ${!p||qty>=p.stock?'disabled':''}>+</button></div></div>`;
 }).join('')||'<p class="empty">Tu carrito está vacío.</p>';
 const delivery=$('#delivery'), payment=$('#payment');
 const previousDelivery=delivery.value, previousPayment=payment.value;
 delivery.innerHTML=[['pickup','Retiro en farmacia'],['delivery','Envío a domicilio']].filter(([key])=>state.settings[key]).map(([key,label])=>`<option value="${key}">${label}</option>`).join('');
 if(state.settings[previousDelivery])delivery.value=previousDelivery;
 const options=allowedPayments(state.settings,delivery.value);
 payment.innerHTML=options.map(key=>`<option value="${key}">${methods[key]}</option>`).join('');
 if(options.includes(previousPayment))payment.value=previousPayment;
 const cost=shipping(state.settings,delivery.value,subtotal);
 $('#order-total').innerHTML=`<div class="totals"><span>Subtotal</span><span>${money(subtotal)}</span><span>Envío</span><span>${money(cost)}</span><strong>Total de muestra</strong><strong>${money(subtotal+cost)}</strong></div>`;
 $('#checkout').hidden=!cart.size;
 $('#checkout button[type=submit]').disabled=checkoutBusy||!options.length||!delivery.value;
}
function renderTracking(){
 const container=$('#track-result');
 if(!trackingCode)return;
 const order=state.orders.find(o=>o.code===trackingCode);
 if(!order){container.textContent='No encontramos ese código en este navegador.';return}
 const flow=orderProgress(order), current=flow.indexOf(order.status);
 container.innerHTML=`<div class="track-card"><div class="section-title"><strong>${escapeHTML(order.code)}</strong><span class="badge static">${statuses[order.status]}</span></div><p class="muted">${dateLabel(order.date)} · ${money(order.total)} · Pago ${paymentStates[order.payState].toLowerCase()}</p>
 ${current>=0?`<ol class="steps">${flow.map((key,i)=>`<li class="${i<=current?'reached':''}">${statuses[key]}</li>`).join('')}</ol>`:''}
 <ul class="history">${order.history.map(event=>`<li>${statuses[event.status]} <span>${dateLabel(event.date)}</span></li>`).join('')}</ul></div>`;
}
function refresh(){state=read();renderBrand();renderCatalog();renderCart();renderTracking()}
document.addEventListener('click',event=>{
 const button=event.target.closest('button');
 if(!button)return;
 if(button.hasAttribute('data-close'))button.closest('dialog').close();
 if(button.hasAttribute('data-category')){category=button.dataset.category;renderCatalog()}
 if(button.dataset.detail)openProduct(button.dataset.detail);
 if(button.dataset.add&&editCart(button.dataset.add,1)&&!$('#cart-dialog').open){$('#product-dialog').close();toast('Producto agregado al carrito.')}
 if(button.dataset.minus)editCart(button.dataset.minus,-1);
});
$('#cart-open').onclick=()=>{$('#checkout-error').textContent='';renderCart();$('#cart-dialog').showModal()};
$('#search').oninput=renderCatalog;
$('#sort').onchange=renderCatalog;
$('#delivery').onchange=renderCart;
$('#track-form').onsubmit=event=>{event.preventDefault();trackingCode=$('#track-code').value.trim().toUpperCase();state=read();renderTracking()};
$('#checkout').onsubmit=async event=>{
 event.preventDefault();
 const button=event.submitter;
 if(checkoutBusy||button.disabled)return;
 checkoutBusy=true;
 button.disabled=true;
 $('#checkout-error').textContent='';
 try{
  const input={cart:new Map(cart),delivery:$('#delivery').value,payment:$('#payment').value};
  const order=await change(data=>createOrder(data,input));
  checkoutBusy=false;cart.clear();trackingCode=order.code;$('#track-code').value=order.code;$('#cart-dialog').close();
  refresh();$('#seguimiento').scrollIntoView();toast('Pedido de prueba confirmado.');
 }catch(error){checkoutBusy=false;$('#checkout-error').textContent=error.message;button.disabled=false}
};
addEventListener('storage',event=>{if(event.key===STORAGE||event.key===null)refresh()});
refresh();

