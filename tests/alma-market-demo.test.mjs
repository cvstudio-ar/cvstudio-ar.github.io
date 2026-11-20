import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const code=read('alma-market/data.js');
const storage=new Map();
const context={
  window:{},localStorage:{
    getItem:key=>storage.has(key)?storage.get(key):null,
    setItem:(key,value)=>storage.set(key,String(value)),
    removeItem:key=>storage.delete(key)
  },URL
};
runInNewContext(code,context);
const {ALMA}=context.window;
test('La demo tiene identidad y productos de referencia de Alma Market',()=>{
  assert.equal(ALMA.defaults.name,'Alma Market');
  assert.equal(ALMA.defaults.products.length,12);
  assert.equal(ALMA.defaults.address,'Alsina 132, San Isidro, Buenos Aires');
  assert.match(ALMA.defaults.instagram,/instagram\.com\/almamarket\.ar/);
  assert.match(ALMA.defaults.whatsapp,/wa\.me\/message/);
  assert.match(ALMA.defaults.hours,/Consultanos/);
  assert.ok(ALMA.defaults.products.every(p=>p.price==='Consultar'));
});
test('Editor de prueba guarda solamente en almacenamiento local',()=>{
  const next=ALMA.clone(ALMA.defaults);
  next.heroTitle='Una portada nueva';
  next.products[0].name='Producto actualizado';
  const saved=ALMA.save(next);
  assert.equal(saved.heroTitle,'Una portada nueva');
  assert.equal(ALMA.read().products[0].name,'Producto actualizado');
  assert.equal(storage.size,1);
  storage.clear();
});
test('Datos modificados se normalizan antes de mostrar',()=>{
  const m=ALMA.normalize({...ALMA.defaults,
    instagram:'javascript:alert(1)',logoImage:'javascript:alert(1)',
    products:[{name:'Prueba',category:'Snacks saludables',visible:true,image:'file:///etc/passwd'}]
  });
  assert.equal(m.instagram,ALMA.defaults.instagram);
  assert.equal(m.logoImage,'');
  assert.equal(m.products[0].image,'');
});
test('Página pública ofrece catálogo, navegación, contacto, panel y mapa',()=>{
 const html=read('alma-market/index.html');
 for(const fragment of ['id="catalogo"','id="products"','id="filters"',
  'id="hero-image"','id="visitanos"','id="maps-frame"','href="admin/"',
  'data-link="whatsapp"','data-link="instagram"','data-alma-logo'])
   assert.ok(html.includes(fragment),fragment);
 assert.match(html,/name="robots" content="noindex,nofollow"/);
 const site=read('alma-market/site.js');
 assert.match(site,/catalogo-alma\.svg/);
 assert.match(site,/read\(\)/);
 assert.match(site,/renderProducts/);
});
test('Panel de prueba sin contraseña informa claramente que no sincroniza',()=>{
 const html=read('alma-market/admin/index.html');
 assert.match(html,/Panel de prueba sin contraseña/);
 assert.match(html,/solo en este navegador/);
 for(const field of ['name','heroTitle','heroDescription','instagram','whatsapp',
  'address','hours','delivery','accent','forest','cream'])
  assert.ok(html.includes('data-field="'+field+'"'),field);
 for(const elem of ['id="logo-input"','id="hero-input"','id="about-input"','id="add-product"','id="save"','id="reset-demo"'])
  assert.ok(html.includes(elem),elem);
 const js=read('alma-market/admin/admin.js');
 assert.match(js,/model=save\(model\)/);
 assert.match(js,/photo\(file/);
 assert.match(js,/renderProducts/);
});
