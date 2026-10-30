const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const test = require('node:test');
const source = fs.readFileSync('web/por-un-mundo-satvico/sync.js','utf8');
const defaults = JSON.parse(fs.readFileSync('web/por-un-mundo-satvico/defaults.json','utf8')).settings;
function fixture(){
  const server={settings:structuredClone(defaults),revision:1,uploads:0,publishes:0};
  function device(){
    const values=new Map();
    const context={window:{},Date,Map,JSON,structuredClone,AbortSignal,Error,sessionStorage:{getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)}};
    context.fetch=async(url,options)=>{
      const b=options.body?JSON.parse(options.body):null;
      const reply=(x,status=200)=>({ok:status<300,status,json:async()=>structuredClone(x)});
      if(!b)return reply({settings:server.settings,revision:server.revision});
      if(b.action==='login')return reply({token:'a'.repeat(64),expires:Date.now()+60000});
      if(!options.headers['x-satvico-session'])return reply({error:'Sin sesión'},401);
      if(b.action==='logout')return reply({ok:true});
      if(b.action==='upload'){server.uploads++;return reply({signedUrl:'https://storage.test/signed',publicUrl:'https://storage.test/cover-'+server.uploads+'.mp4'});}
      if(b.action==='publish'){
        if(b.revision!==server.revision)return reply({error:'Conflicto de versión'},409);
        server.settings=b.settings;server.revision++;server.publishes++;return reply({revision:server.revision});
      }
      throw Error('Acción inesperada');
    };
    context.XMLHttpRequest=class{constructor(){this.upload={};}open(method,url){assert.equal(method,'PUT');assert.equal(url,'https://storage.test/signed');}setRequestHeader(){}send(file){assert.ok(file);this.status=200;this.upload.onprogress({lengthComputable:true,loaded:10,total:10});this.onload();}};
    vm.createContext(context);vm.runInContext(source,context);return context.window.SatvicoSync;
  }
  return {server,device};
}
test('PC publishes local video and independent mobile reads the same public URL',async()=>{
  const {server,device}=fixture(),pc=device(),mobile=device();
  await pc.read();await mobile.read();await pc.login('Satvico','test');
  const settings={...defaults,heroImage:'media:local-video'};
  const result=await pc.publish(settings,async()=>({type:'video/mp4',size:100}));
  assert.equal(result.settings.heroImage,'https://storage.test/cover-1.mp4');
  assert.equal((await mobile.read()).settings.heroImage,result.settings.heroImage);
  assert.equal(server.uploads,1);assert.equal(server.publishes,1);
  assert.equal(settings.heroImage,'media:local-video');
});
test('stale second editor cannot overwrite the first publication',async()=>{
  const {server,device}=fixture(),a=device(),b=device();
  await a.read();await b.read();await a.login('Satvico','test');await b.login('Satvico','test');
  await a.publish({...defaults,heroTitle:'Primera versión'},async()=>null);
  await assert.rejects(b.publish({...defaults,heroTitle:'Versión atrasada'},async()=>null),/Conflicto/);
  assert.equal(server.settings.heroTitle,'Primera versión');assert.equal(server.publishes,1);
});
test('missing local file or no server version never produces a false publication',async()=>{
  const {server,device}=fixture(),pc=device();
  await assert.rejects(pc.publish(defaults,async()=>null),/sesión/);
  await pc.login('Satvico','test');
  await assert.rejects(pc.publish(defaults,async()=>null),/versión publicada/);
  await pc.read();
  await assert.rejects(pc.publish({...defaults,heroImage:'media:missing'},async()=>null),/Falta un archivo/);
  assert.equal(server.publishes,0);
});
test('local media shared by two settings is uploaded once; private profile data is absent',async()=>{
  const {server,device}=fixture(),pc=device();await pc.read();await pc.login('Satvico','test');
  await pc.publish({...defaults,heroImage:'media:same',logo:'media:same'},async()=>({type:'image/png',size:100}));
  assert.equal(server.uploads,1);assert.equal(server.settings.logo,server.settings.heroImage);
  assert.equal(server.settings.member,undefined);assert.equal(server.settings.demoMembers,undefined);
  await pc.logout();assert.equal(pc.signedIn(),false);
});
test('server validator rejects browser-local URLs and user data',()=>{
  const edge=fs.readFileSync('supabase/functions/satvico-sync/index.ts','utf8');
  const fields=edge.slice(edge.indexOf('const fields ='),edge.indexOf('function validSettings'));
  let code=edge.slice(edge.indexOf('function validSettings'),edge.indexOf('Deno.serve'));
  code=code.replace('(s: unknown): boolean','(s)').replace('s as Record<string,unknown>','s').replace('(v: unknown, depth = 0): boolean','(v, depth = 0)');
  const context={};vm.createContext(context);vm.runInContext(fields+code,context);
  assert.equal(context.validSettings(defaults),true);
  for(const prefix of ['media:','blob:','data:','javascript:'])assert.equal(context.validSettings({...defaults,heroImage:prefix+'hidden'}),false);
  assert.equal(context.validSettings({...defaults,spaces:{yoga:{image:'media:hidden'}}}),false);
  assert.equal(context.validSettings({...defaults,demoMembers:[{email:'private'}]}),false);
  assert.equal(context.validSettings({...defaults,primary:'invalid'}),false);
});
