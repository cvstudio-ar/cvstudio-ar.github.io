import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {onRequestGet as publicConfig} from '../functions/api/site-config.js';
import {onRequestGet as adminGet,onRequestPost as adminPost} from '../functions/api/admin/config.js';
import {onRequestPost as uploadHero} from '../functions/api/admin/hero.js';

const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const config=read('../config.js'),app=read('../app.js');
const memory=new Map(), localStorage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v),removeItem:k=>memory.delete(k)};
const mock={window:{},localStorage,location:{hostname:'localhost',pathname:'/'},fetch:async()=>{throw Error('not called')}};
runInNewContext(config,mock);
test('GESFIP mantiene identidad y servicios aprobados',()=>{
  const site=mock.window.GESFIPDemo.read();
  assert.equal(site.brand,'GESFIP');
  assert.equal(site.services.length,8);
  assert.equal(site.heroImage,'./hero-aprobada.svg');
  assert.equal(site.gold,'#eeb24c');
});
test('las tarjetas usan ilustraciones vectoriales reales',()=>{
  assert.match(app,/icon\.append\(serviceIcon\(item\.title\)\)/);
  assert.match(app,/hero-mobile-photo/);
});
const store=new Map();
const KV={async get(k){return store.get(k)||null},async put(k,v){store.set(k,typeof v==='string'?v:v)}};
const identity='administrador@example.org';
const ctx=(email=identity)=>({env:{GESFIP_CONFIG:KV,GESFIP_ADMIN_EMAIL:identity},data:{cloudflareAccess:{JWT:{payload:{email}}}}});
test('el contenido público no expone configuración inexistente',async()=>{
  const a=await publicConfig({env:{GESFIP_CONFIG:KV}});
  assert.equal(a.status,200);
  assert.equal((await a.json()).data,null);
});
test('el panel rechaza usuarios ajenos a GESFIP',async()=>{
  const a=await adminGet(ctx('otro@example.org'));
  assert.equal(a.status,403);
});
test('el panel guarda contenido válido y el sitio puede consultarlo',async()=>{
  const defaults=mock.window.GESFIPDemo.read();
  const request=new Request('https://gesfipseguridad.com/api/admin/config',{
    method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({...defaults,heroImage:'./hero-aprobada.svg'})
  });
  const result=await adminPost({...ctx(),request});
  assert.equal(result.status,200,await result.text());
  const publicResult=await publicConfig({env:{GESFIP_CONFIG:KV}});
  assert.equal((await publicResult.json()).data.brand,'GESFIP');
});
test('nadie puede cargar portada sin autenticación administrativa',async()=>{
  const request=new Request('https://gesfipseguridad.com/api/admin/hero',{
    method:'POST',headers:{'content-type':'image/png'},body:new Uint8Array([137,80,78,71,13,10,26,10])
  });
  assert.equal((await uploadHero({...ctx('externo@example.org'),request})).status,403);
});
