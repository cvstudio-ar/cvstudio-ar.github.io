'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const base=path.resolve(__dirname,'../demo/gesfip');
const read=p=>fs.readFileSync(path.join(base,p),'utf8');
test('the public GESFIP demo is separated from CVStudio pages',()=>{
 const html=read('index.html');
 assert.match(html,/noindex,nofollow,noarchive/);
 assert.match(html,/GESFIP/);
 assert.match(html,/serviceModal/);
 assert.match(html,/serviceTrack/);
 assert.match(html,/data-whatsapp/);
 assert.match(html,/admin\//);
});
test('all service cards have in-page descriptions and modal controls',()=>{
 const js=read('app.js'), config=read('config.js');
 assert.match(js,/modal\.showModal\(\)/);
 assert.match(js,/button\.addEventListener\('click',\(\)=>openItem/);
 assert.match(js,/modal\.close\(\)/);
 assert.match(config,/Control con QR/);
 assert.match(config,/Silos y Campos/);
});
test('styles have fluid containers and mobile breakpoints',()=>{
 const css=read('styles.css');
 assert.match(css,/width:min\(100% - clamp\(32px,6vw,140px\),1600px\)/);
 assert.match(css,/@media\(max-width:800px\)/);
 assert.match(css,/@media\(max-width:460px\)/);
 assert.match(css,/border-radius:var\(--radius\)/);
});
test('admin is a local preview, not a fake password-protected editor',()=>{
 const html=read('admin/index.html'),js=read('admin/admin.js');
 assert.match(html,/solo en este navegador/);
 assert.match(js,/api\.save\(next\)/);
 assert.match(js,/Exportar|gesfip-configuracion-demo\.json/);
 assert.doesNotMatch(html+js+read('config.js'),/Cvstudio\*26/);
});
test('client-provided emblem is embedded as asset',()=>{
 assert.match(read('logo.svg'),/data:image\/webp;base64,/);
});
