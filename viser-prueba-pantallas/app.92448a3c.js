import {PRODUCTS} from './products.js';
import {icons,escape,safeUrl,waLink,money,client,defaultSettings} from './shared.ce5d7712.js';
let products=PRODUCTS, settings={...defaultSettings}, category='Todos';
const grid=document.querySelector('#products');
const DESCRIPTION_LIMIT=180;
function descriptionPreview(value){
  const full=String(value??'').trim();
  if(full.length<=DESCRIPTION_LIMIT)return {full,preview:full,truncated:false};
  const slice=full.slice(0,DESCRIPTION_LIMIT);
  const boundary=slice.lastIndexOf(' ');
  return {full,preview:(boundary>DESCRIPTION_LIMIT*.65?slice.slice(0,boundary):slice).trimEnd()+'…',truncated:true};
}
const descriptionDialog=document.createElement('dialog');
descriptionDialog.className='description-dialog';
descriptionDialog.setAttribute('aria-labelledby','description-dialog-title');
descriptionDialog.innerHTML='<div class="description-dialog-header"><h2 id="description-dialog-title"></h2><button type="button" class="description-dialog-close" aria-label="Cerrar descripción" autofocus>×</button></div><div class="description-dialog-text"></div>';
document.body.append(descriptionDialog);
let descriptionTrigger=null;
descriptionDialog.querySelector('button').onclick=()=>descriptionDialog.close();
descriptionDialog.addEventListener('click',event=>{if(event.target===descriptionDialog){const rect=descriptionDialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)descriptionDialog.close();}});
descriptionDialog.addEventListener('close',()=>{document.body.classList.remove('description-open');if(descriptionTrigger?.isConnected)descriptionTrigger.focus();});
grid.addEventListener('click',event=>{
  const button=event.target.closest('[data-description-index]');
  if(!button)return;
  const product=products[Number(button.dataset.descriptionIndex)];
  if(!product)return;
  descriptionTrigger=button;
  descriptionDialog.querySelector('h2').textContent=product.title;
  descriptionDialog.querySelector('.description-dialog-text').textContent=String(product.description??'').trim();
  descriptionDialog.showModal();
  document.body.classList.add('description-open');
});
function updateDescriptionLinks(){
  grid.querySelectorAll('.product-description').forEach(element=>{
    const button=element.nextElementSibling;
    if(button?.matches('[data-description-index]'))button.hidden=button.dataset.truncated!=='true'&&element.scrollHeight<=element.clientHeight+1;
  });
}
window.addEventListener('resize',updateDescriptionLinks);

function render(){if(settings.hero_image?.startsWith('assets/'))settings.hero_image='https://viserint.com/'+(settings.hero_image==='assets/hero.webp'?'assets/hero-extended.webp':settings.hero_image);const items=products.filter(p=>p.published && (category==='Todos'||p.category===category));grid.innerHTML=items.length?items.map(p=>`<article class="product"><div class="product-visual"><img src="${escape(safeUrl(p.image))}" alt="${escape(p.title)}" loading="lazy"></div><div class="product-info"><span class="product-category">${escape(p.category)}</span><h3>${escape(p.title)}</h3><p class="product-description">${escape(descriptionPreview(p.description).preview)}</p><button type="button" class="description-more" data-description-index="${products.indexOf(p)}" data-truncated="${descriptionPreview(p.description).truncated}" aria-haspopup="dialog" aria-label="${escape('Ver más sobre '+p.title)}" ${descriptionPreview(p.description).truncated?'':'hidden'}>Ver más</button><div class="product-footer"><div class="price"><span class="price-label">Precio</span>${escape(money(p))}</div>${p.stock==null?'':`<p class="stock">${p.stock>0?'Stock disponible: '+p.stock:'Sin stock · Consultar disponibilidad'}</p>`}<a class="btn product-inquiry" href="${escape(waLink(settings.whatsapp,p.title))}" aria-label="${escape('Solicitar información sobre '+p.title)}" ${settings.whatsapp?'target="_blank" rel="noopener"':''}>Solicitar información <span aria-hidden="true">↗</span></a></div></div></article>`).join(''):'<p class="empty">Próximamente incorporaremos productos a esta categoría. Consultanos por el equipo que buscás.</p>';requestAnimationFrame(updateDescriptionLinks);document.querySelectorAll('.wa').forEach(a=>{a.innerHTML=icons.wa+(a.dataset.label??'WhatsApp');a.href=waLink(settings.whatsapp);if(settings.whatsapp){a.target='_blank';a.rel='noopener';}});document.querySelector('#socials').innerHTML=[['Instagram',settings.instagram],['Facebook',settings.facebook]].filter(([,url])=>safeUrl(url)&&url).map(([name,url])=>`<a href="${escape(safeUrl(url))}" target="_blank" rel="noopener">${name}</a>`).join('');let details=[];if(settings.whatsapp)details.push('WhatsApp: +'+String(settings.whatsapp).replace(/\D/g,''));document.querySelector('#contact-details').innerHTML=details.map(escape).join(' · ')+(settings.email?' · <a href="mailto:'+escape(settings.email)+'">'+escape(settings.email)+'</a>':'')+'<p>Av. Francisco de Aguirre 1598 · San Miguel de Tucumán, Tucumán</p>';if(settings.hero_image&&safeUrl(settings.hero_image))document.querySelector('.hero').style.setProperty('--hero-image',`url("${safeUrl(settings.hero_image==='https://viserint.com/assets/hero.webp'?'https://viserint.com/assets/hero-extended.webp':settings.hero_image).replace(/"/g,'%22')}")`);}
document.querySelectorAll('[data-icon]').forEach(e=>e.innerHTML=icons[e.dataset.icon]);document.querySelector('#year').textContent=new Date().getFullYear();document.querySelector('#menu').onclick=()=>{let open=document.querySelector('#nav').classList.toggle('open');document.querySelector('#menu').setAttribute('aria-expanded',String(open));};document.querySelectorAll('nav a').forEach(a=>a.onclick=()=>{document.querySelector('#nav').classList.remove('open');document.querySelector('#menu').setAttribute('aria-expanded','false');});document.querySelectorAll('[data-category]').forEach(b=>b.onclick=()=>{category=b.dataset.category;document.querySelectorAll('[data-category]').forEach(x=>x.classList.toggle('selected',x===b));render();});render();
async function refresh(){const db=await client();if(!db)return;try{const [ps,ss]=await Promise.all([db.from('viser_products').select('*').eq('published',true).order('sort_order'),db.from('viser_settings').select('*').eq('id',1).single()]);if(ps.error||ss.error)throw ps.error||ss.error;products=ps.data;settings={...defaultSettings,...ss.data};render();document.querySelector('#catalog-status').hidden=true;}catch{const el=document.querySelector('#catalog-status');el.textContent='No pudimos actualizar el catálogo. Consultanos para confirmar precios y disponibilidad.';el.hidden=false;}}
refresh();document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});setInterval(refresh,30000);
