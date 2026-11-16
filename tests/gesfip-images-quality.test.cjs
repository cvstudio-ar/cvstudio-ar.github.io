'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const base=path.resolve(__dirname,'../demo/gesfip');
const get=p=>fs.readFileSync(path.join(base,p),'utf8');
test('approved hero has a genuine large bitmap, not a 360-pixel enlargement',()=>{
  const s=get('hero-aprobada.svg');
  assert.ok(s.includes('width="1200" height="714"'));
  assert.ok(s.includes('data:image/webp;base64,'));
  assert.ok(s.length>25000);
  assert.ok(get('styles.css').includes("url('./hero-aprobada.svg?v=2')"));
});
test('six client-provided photos exist and are large enough for service cards',()=>{
  for(const name of ['rural','accesos','qr','country','hotel','mercaderia']){
    const s=get('assets/'+name+'.svg');
    assert.ok(s.includes('width="720" height="400"'),name);
    assert.ok(s.length>12000,name);
  }
});
test('service cards use photographic backgrounds and prominent line art',()=>{
  const script=get('app.js'),css=get('styles.css');
  assert.ok(script.includes("const photo=item.image"));
  assert.ok(script.includes('data.operationImages'));
  assert.ok(css.includes('var(--operation-photo)'));
  assert.ok(script.includes("button.style.setProperty('--service-photo'"));
  assert.ok(css.includes('var(--service-photo,'));
  assert.ok(css.includes('width:56px!important;height:56px!important'));
  assert.ok(css.includes('grid-template-columns:92px minmax(0,1fr)'));
});
test('existing safe modals and responsive layout are retained',()=>{
  const s=get('app.js'),css=get('styles.css');
  assert.ok(s.includes('modal.showModal()'));
  assert.ok(s.includes('button.addEventListener(\'click\''));
  assert.ok(css.includes('@media(max-width:460px)'));
});
