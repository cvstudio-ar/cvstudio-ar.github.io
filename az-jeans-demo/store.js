let products=getProducts(),cat='Todos',cart=[];try{cart=JSON.parse(sessionStorage.getItem('az-cart'))||[]}catch{};
const $=s=>document.querySelector(s);
const CAT_META={Todos:['◌','Todos'],Jeans:['👖','Jeans'],Remeras:['👕','Remeras'],Buzos:['🧥','Buzos'],Camisas:['👔','Camisas'],'Otras prendas':['▦','Otras prendas']};
const showToast=t=>{const el=$('#toast');el.textContent=t;el.style.display='block';clearTimeout(window.tt);window.tt=setTimeout(()=>el.style.display='none',2500)};
function productCard(p){return `<article class="product-card">${p.featured?'<span class="badge">DESTACADO</span>':''}<img class="product-img" loading="lazy" src="${escapeHTML(p.img)}" alt="${escapeHTML(p.name)}"><div class="product-body"><h3>${escapeHTML(p.name)}</h3><div class="muted">${escapeHTML(p.category)}</div><div class="price">${money(p.price)}</div><div class="product-actions"><button onclick="openProduct('${p.id}')">Ver más</button><button class="primary" onclick="addCart('${p.id}')">Agregar</button></div></div></article>`}
function featuredCard(p){return `<article class="featured-card"><img loading="lazy" src="${escapeHTML(p.img)}" alt="${escapeHTML(p.name)}"><div class="featured-info"><h3>${escapeHTML(p.name)}</h3><span class="small muted">${escapeHTML(p.description?.split('.')[0]||p.category)}</span><span class="price">${money(p.price)}</span><button onclick="openProduct('${p.id}')">Ver más</button></div></article>`}
function render(){
  products=getProducts().filter(p=>p.visible!==false);
  const cats=Object.keys(CAT_META).filter(c=>c==='Todos'||products.some(p=>p.category===c));
  $('#categories').innerHTML=cats.map(c=>{const [icon,label]=CAT_META[c]||['•',c];return `<button class="category ${cat===c?'active':''}" onclick="setCategory('${escapeHTML(c)}')"><span class="cat-icon">${icon}</span><span>${label}</span></button>`}).join('');
  $('#featured-grid').innerHTML=products.filter(p=>p.featured).slice(0,4).map(featuredCard).join('')||'<p>No hay destacados todavía.</p>';
  let items=products.filter(p=>(cat==='Todos'||p.category===cat)&&`${p.name} ${p.category}`.toLowerCase().includes($('#search').value.toLowerCase()));
  if($('#sort').value==='asc')items.sort((a,b)=>a.price-b.price);
  if($('#sort').value==='desc')items.sort((a,b)=>b.price-a.price);
  if($('#sort').value==='name')items.sort((a,b)=>a.name.localeCompare(b.name));
  $('#products-result').textContent=`${items.length} productos`;
  $('#products-grid').innerHTML=items.map(productCard).join('')||'<p>No encontramos productos para esa búsqueda.</p>';
  refreshCart();
}
function setCategory(c){cat=c;render();document.getElementById('catalogo').scrollIntoView({behavior:'smooth'})}
function saveCart(){sessionStorage.setItem('az-cart',JSON.stringify(cart));refreshCart()}
function addCart(id,size='A definir'){const p=products.find(x=>x.id===id);if(!p)return;const item=cart.find(x=>x.id===id&&x.size===size);if(item)item.qty++;else cart.push({id,size,qty:1});saveCart();showToast(`${p.name} agregado al carrito`)}
function changeQty(i,d){cart[i].qty+=d;if(cart[i].qty<=0)cart.splice(i,1);saveCart()}
function clearCart(){cart=[];saveCart()}
function openCart(){$('#cart-mask').classList.add('open');refreshCart()}
function closeCart(){$('#cart-mask').classList.remove('open')}
function refreshCart(){const count=cart.reduce((s,i)=>s+i.qty,0);$('#cart-count').textContent=count;$('#cart-lines').innerHTML=cart.length?cart.map((item,i)=>{const p=products.find(x=>x.id===item.id);if(!p)return '';return `<div class="cart-line"><img src="${escapeHTML(p.img)}" alt=""><div style="flex:1"><strong>${escapeHTML(p.name)}</strong><div class="muted small">Talle: ${escapeHTML(item.size)} · ${money(p.price)}</div><div class="qty"><button onclick="changeQty(${i},-1)">−</button>${item.qty}<button onclick="changeQty(${i},1)">+</button></div></div></div>`}).join(''):'<p class="empty">Tu carrito está vacío.</p>';const total=cart.reduce((s,i)=>s+(products.find(p=>p.id===i.id)?.price||0)*i.qty,0);$('#cart-total').textContent=money(total);let m=`¡Hola CVStudio! Estoy probando el carrito de la demo de indumentaria. Estos son los productos de muestra:\n${cart.map(i=>{const p=products.find(x=>x.id===i.id);return `• ${p?.name||i.id} | Talle ${i.size} | Cant. ${i.qty}`}).join('\n')}\nTotal de referencia: ${money(total)}\nMe gustaría recibir información para crear una tienda de ropa online.`;$('#checkout-link').href=waLink(m);$('#checkout-link').style.pointerEvents=cart.length?'auto':'none';$('#checkout-link').style.opacity=cart.length?'1':'.45'}
function openProduct(id){const p=products.find(x=>x.id===id);if(!p)return;$('#product-modal').innerHTML=`<div class="modal-content"><img src="${escapeHTML(p.img)}" alt="${escapeHTML(p.name)}"><div><span class="eyebrow">${escapeHTML(p.category)}</span><h2>${escapeHTML(p.name)}</h2><p>${escapeHTML(p.description||'')}</p><h2>${money(p.price)}</h2><p class="small muted">Precio ilustrativo</p><div class="selector"><label for="chosen-size"><strong>Seleccioná el talle</strong></label><select id="chosen-size">${(p.sizes||['Único']).map(s=>`<option>${escapeHTML(s)}</option>`).join('')}</select></div><button class="pill" style="width:100%" onclick="addCart('${p.id}',document.getElementById('chosen-size').value);closeProduct()">Agregar al carrito</button><a class="pill outline" style="width:100%;margin-top:10px" target="_blank" rel="noopener" href="${waLink('¡Hola CVStudio! Estoy probando una ficha de la demo de ropa: '+p.name)}">Consultar por WhatsApp ↗</a></div></div>`;$('#product-mask').classList.add('open')}
function closeProduct(){$('#product-mask').classList.remove('open')}
function init(){
  const s=getSettings();
  document.title=`Tienda de ropa online | Demo ${s.title}`;
  document.querySelectorAll('.brand span').forEach(el=>el.textContent=s.title);
  $('#hero-title').textContent=s.heroTitle;
  $('#hero-description').textContent=s.heroDescription;
  document.querySelectorAll('[data-instagram]').forEach(el=>el.href=httpsLink(s.instagram)||AZ_DEFAULT_SETTINGS.instagram);
  document.querySelectorAll('[data-whatsapp]').forEach(el=>el.href=waLink('¡Hola CVStudio! Quisiera información sobre una tienda de ropa online.'));
  const address=[s.address,s.locality].filter(Boolean).join(' · ');
  const maps=httpsLink(s.mapsUrl);
  $('#store-location').hidden=!address&&!maps;
  $('#store-address').textContent=address;
  $('#store-maps').hidden=!maps;
  if(maps)$('#store-maps').href=maps;
  if(s.heroImage){if(s.heroRatio&&/^\d+\s*\/\s*\d+$/.test(s.heroRatio))$('#inicio').style.setProperty('--az-hero-ratio',s.heroRatio);$('#inicio').classList.add('has-custom-hero');$('#inicio').style.setProperty('--az-custom-hero',`url("${String(s.heroImage).replace(/"/g,'%22')}")`)}$('#hero-whatsapp').href=waLink('¡Hola CVStudio! Vi la demo de indumentaria y quisiera consultar por una tienda de ropa online.');$('#about-wa').href=waLink('¡Hola CVStudio! Quisiera más información para crear mi tienda de ropa online.');$('#floating-wa').href=waLink('¡Hola CVStudio! Quisiera consultar sobre la demo de indumentaria.');$('#search').addEventListener('input',render);$('#sort').addEventListener('change',render);$('#cart-mask').addEventListener('click',e=>{if(e.target.id==='cart-mask')closeCart()});$('#product-mask').addEventListener('click',e=>{if(e.target.id==='product-mask')closeProduct()});document.querySelectorAll('.navlinks a').forEach(a=>a.addEventListener('click',()=>$('#navlinks').classList.remove('show')));render()}
init();
