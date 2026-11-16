'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
test('CVStudio primary web card shows starting price without changing CV services',()=>{
 const html=read('index.html');
 assert.match(html,/<h3>Webs personalizadas<\/h3>\s*<strong class="service-price">Desde \$110\.000<\/strong>/);
 assert.match(html,/<h3>Currículum Profesional<\/h3>/);
});
test('four ARS website plan prices reflect approved scale',()=>{
 const js=read('js/web-commerce-inmobiliaria.js');
 for(const [id,amount] of [['web-basica',110000],['web-panel',155000],['web-catalogo',210000],['web-tienda',290000]]){
  assert.ok(js.includes("id:'"+id+"'") && js.includes('price:'+amount));
 }
 assert.ok(js.includes('pricingMismatch=plans.some('),'Server prices must be checked before checkout');
 assert.ok(js.includes('if(!foreignOrder()&&pricingMismatch)'),'Never charge outdated ARS amounts');
});
test('website detail dialogs and request messages match public pricing',()=>{
 const html=read('otros-servicios/index.html');
 for(const n of ['110.000','210.000','290.000'])assert.ok(html.includes('$'+n));
 for(const n of ['65.000','120.000','180.000'])assert.ok(!html.includes('$'+n));
 assert.ok(read('js/web-basica-presentacion.js').includes('$110.000'));
 assert.ok(read('js/tienda-cvstudio-presentacion.js').includes('$290.000'));
 assert.ok(html.includes('web-commerce-inmobiliaria.js?v=precios-20261116'));
});
