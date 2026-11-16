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
 assert.ok(js.includes("modal?.addEventListener('close'"));
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

test('mobile hero uses content-first layout with restrained photo, CTAs and compact header',()=>{
 const css=read('styles.css');
 const html=read('index.html');
 const section=css.slice(css.lastIndexOf('/* Mobile hero rescue:'));
 assert.ok(section.length>900);
 assert.ok(section.includes('.hero {'));
 assert.ok(section.includes('min-height:0!important'));
 assert.ok(section.includes('background-size:cover,auto 57%!important'));
 assert.ok(section.includes('.hero .actions .btn'));
 assert.ok(section.includes('min-height:47px'));
 assert.ok(section.includes('.mobile-menu::before'));
 assert.ok(html.includes('styles.css?v=gesfip-contenidos-20261116'));
 assert.ok(html.includes('aria-label="Abrir menú de navegación"'));
});

test('mobile image is independently rendered below text instead of behind calls to action',()=>{
 const html=read('index.html'),css=read('styles.css');
 assert.ok(html.includes('class="hero-mobile-photo"'));
 const ref=css.slice(css.lastIndexOf('/* GESFIP mobile layout v27:'));
 assert.ok(ref.includes('.hero::before{display:none!important}'));
 assert.ok(ref.includes('.hero-mobile-photo{'));
 assert.ok(ref.includes('height:clamp(140px,27vw,205px)'));
 assert.ok(ref.includes('#servicios .section-head{'));
 assert.ok(ref.includes('flex-direction:column!important'));
 assert.ok(ref.includes('#servicios .section-head h2{'));
 assert.ok(ref.includes('max-width:100%!important'));
 assert.ok(html.includes('styles.css?v=gesfip-contenidos-20261116'));
});
