'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const src = fs.readFileSync(path.join(__dirname, '../js/cvstudio-meta-consent.js'), 'utf8');

function fixture(host, stored) {
  const scripts=[], elements=[], documentEvents={}, store=new Map();
  if(stored) store.set('cvstudio_meta_consent_v1',stored);
  const mk=()=>({
    style:{}, children:[], textContent:'', id:'', closest(){return null;},
    setAttribute(){}, addEventListener(name,fn){this[name]=fn},
    append(...nodes){this.children.push(...nodes)},
    remove(){this.removed=true}
  });
  const marker={parentNode:{insertBefore(node){scripts.push(node)}}};
  const document={
    body:{append(node){elements.push(node)}},
    createElement(){return mk()},
    getElementById(id){return elements.find(el=>el.id===id && !el.removed)},
    getElementsByTagName(){return [marker]},
    addEventListener(name,fn){documentEvents[name]=fn}
  };
  let reloads=0;
  const window={};
  const location={hostname:host,href:'https://'+host+'/',origin:'https://'+host,reload(){reloads++}};
  vm.runInNewContext(src,{document,window,location,URL,localStorage:{
    getItem(k){return store.get(k)??null},
    setItem(k,v){store.set(k,v)}
  }});
  const ready=()=>documentEvents.DOMContentLoaded?.();
  const button=(label)=>elements.concat(elements.flatMap(e=>e.children.flatMap(x=>x.children??[])))
    .find(x=>x.textContent===label);
  return {document,window,location,scripts,elements,store,ready,button,reloads:()=>reloads};
}

test('before opt-in does not load Meta or send PageView',()=>{
  const h=fixture('cvstudio.com.ar');
  h.ready();
  assert.equal(h.scripts.length,0);
  assert.equal(h.window.fbq,undefined);
  assert.ok(h.button('Aceptar Meta Pixel'));
});
test('rejection does not load Meta and stays rejected',()=>{
  const h=fixture('cvstudio.com.ar');
  h.ready();
  h.button('Rechazar').click();
  assert.equal(h.store.get('cvstudio_meta_consent_v1'),'rejected');
  assert.equal(h.scripts.length,0);
  assert.equal(h.window.fbq,undefined);
});
test('acceptance initializes Meta once, with PageView',()=>{
  const h=fixture('www.cvstudio.com.ar');
  h.ready();
  h.button('Aceptar Meta Pixel').click();
  assert.equal(h.scripts.length,1);
  assert.match(h.scripts[0].src,/connect\.facebook\.net\/en_US\/fbevents\.js$/);
  assert.equal(h.store.get('cvstudio_meta_consent_v1'),'accepted');
  assert.equal(h.window.fbq.queue.length,2);
  assert.equal(h.window.fbq.queue[0][1],'1486370042926294');
  assert.equal(h.window.fbq.queue[1][1],'PageView');
});
test('preaccepted consent loads once; staging loads never',()=>{
  const yes=fixture('cvstudio.com.ar','accepted');
  yes.ready(); yes.ready();
  assert.equal(yes.scripts.length,1);
  const staging=fixture('cvstudio-marketing-pruebas.cvstudioargentina.workers.dev','accepted');
  staging.ready();
  assert.equal(staging.scripts.length,0);
});
test('revoking consent stops an already initialized pixel by reloading',()=>{
  const h=fixture('cvstudio.com.ar','accepted');
  h.ready();
  h.button('Privacidad · Meta').click();
  h.button('Rechazar').click();
  assert.equal(h.reloads(),1);
});
