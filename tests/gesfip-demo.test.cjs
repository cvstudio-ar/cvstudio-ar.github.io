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
test('admin preserves local demo and supports authenticated persistent editing',()=>{
 const html=read('admin/index.html'),js=read('admin/admin.js');
 assert.match(html,/solo en tu navegador/);
 assert.match(js,/api\.persist\(next\)/);
 assert.match(js,/api\.localMode\(\)/);
 assert.match(read('functions/api/admin/_middleware.js'),/cloudflareAccessPlugin/);
 assert.match(js,/Exportar|gesfip-configuracion-demo\.json/);
 assert.doesNotMatch(html+js+read('config.js'),/Cvstudio\*26/);
});
test('client-provided emblem is embedded as asset',()=>{
 assert.match(read('logo.svg'),/data:image\/webp;base64,/);
});

test('approved hero replaces unrelated stock and avoids redundant giant logo card',()=>{
 const html=read('index.html');
 const css=read('styles.css');
 const config=read('config.js');
 const picture=read('hero-aprobada.svg');
 assert.doesNotMatch(html, /class="visual"/);
 assert.ok(!((css+config).includes('images.pexels.com')));
 assert.ok(css.includes('hero-aprobada.svg'));
 assert.ok(config.includes('hero-aprobada.svg'));
 assert.ok(picture.includes('data:image/webp;base64,'));
 assert.ok(read('admin/admin.js').includes('hero-aprobada.svg'));
});

test('admin displays the approved hero using its correct relative path',()=>{
  const admin=read('admin/admin.js');
  const page=read('admin/index.html');
  const config=read('config.js');
  assert.ok(admin.includes("v.startsWith('./')?'../'+v.slice(2):v"));
  assert.ok(admin.includes("el.src=previewUrl(config.heroImage)"));
  assert.ok(config.includes("/demo/gesfip/assets/gesfip-hero-approved.webp"));
  assert.ok(page.includes('config.js?v=gesfip-luis-20261117'));
  assert.ok(page.includes('admin.js?v=gesfip-luis-20261117'));
  assert.ok(read('hero-aprobada.svg').includes('data:image/webp;base64,'));
});

test('Luis updates include suited team hero, industrial photo and two contact channels',()=>{
 const config=read('config.js'), page=read('index.html'),app=read('app.js'),admin=read('admin/index.html');
 assert.match(config,/heroImage:"\.\/assets\/equipo-ejecutivo\.svg"/);
 assert.match(config,/aboutImage:"\.\/assets\/patrullaje-industrial\.svg"/);
 assert.match(config,/"\.\/assets\/patrullaje-industrial\.svg",\s*"\.\/assets\/qr\.svg"/);
 assert.match(read('assets/patrullaje-industrial.svg'),/data:image\/webp;base64,/);
 assert.match(page,/contactSecondaryPhone/);
 assert.match(page,/contactInstagram/);
 assert.match(app,/data-secondary-phone/);
 assert.match(app,/data-instagram/);
 assert.match(admin,/data-field="secondaryPhone"/);
 assert.match(admin,/data-field="instagram"/);
});
