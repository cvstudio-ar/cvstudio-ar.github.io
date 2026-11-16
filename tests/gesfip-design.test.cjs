'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'../demo/gesfip',p),'utf8');

test('service cards and modal use the same SVG illustration function',()=>{
 const js=read('app.js');
 assert.match(js,/function serviceIcon\(title\)/);
 assert.match(js,/glyph\.replaceChildren\(serviceIcon\(item\.title\)\)/);
 assert.match(js,/modal\.showModal\(\)/);
 assert.match(js,/modal\.addEventListener\('close'/);
 assert.doesNotMatch(js,/glyph\.textContent=item\.glyph/);
});
test('all service categories have custom vector paths',()=>{
 const source=read('app.js');
 for(const name of ['Seguridad Física','Monitoreo','Gestión de Riesgos','Custodia de Personas','Seguridad para Empresas','Country y Barrios','Silos y Campos','Hoteles y Eventos']){
  assert.ok(source.includes("['"+name+"',"),'missing '+name);
 }
});
test('layout responds to mobile and accessible motion preferences',()=>{
 const css=read('styles.css');
 assert.match(css,/@media\(max-width:800px\)/);
 assert.match(css,/@media\(max-width:460px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/\.modal\{width:min\(92vw,630px\)/);
});
