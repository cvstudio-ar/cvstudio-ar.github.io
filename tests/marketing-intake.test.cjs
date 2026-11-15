'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {webcrypto}=require('node:crypto');
const {TextEncoder}=require('node:util');
const worker=fs.readFileSync(path.join(__dirname,'../config/cloudflare-worker-contacto.js'),'utf8');

function slice(start,end){
  const a=worker.indexOf(start),b=worker.indexOf(end,a+start.length);
  assert.ok(a>=0&&b>a, 'Worker debe contener '+start);
  return worker.slice(a,b);
}
const helpers=slice('function cleanCampaignAttribution(raw)','async function handleMercadoPagoPreference(');
const intake=slice("const WEB_INTAKE_BUCKET='cvstudio-web-intakes'","async function commerceHandle(");

function harness({limit=0}={}){
  const records=new Map();
  const uploads=[];
  let inserts=0;
  const mockDB=async (_env,query,opts)=>{
    if(opts.method==='GET'){
      if(query.includes('visitor_hash'))return Array.from({length:limit},(_,i)=>({id:i}));
      if(query.includes('reference=eq.')){
        const ref=decodeURIComponent(query.match(/reference=eq\.([^&]+)/)[1]);
        return records.has(ref)?[records.get(ref)]:[];
      }
      throw Error('Consulta imprevista: '+query);
    }
    if(opts.method==='POST'&&query==='cvstudio_web_intakes'){
      const record=JSON.parse(opts.body);
      if(records.has(record.reference))throw Error('duplicate');
      records.set(record.reference,record);inserts++;
      return [record];
    }
    throw Error('Escritura imprevista');
  };
  const sandbox={
    commerceDB:mockDB,TextEncoder,crypto:webcrypto,Uint8Array,atob,
    cleanText:(value,max)=>String(value??'').trim().slice(0,max),
    normalizePhone:value=>String(value||'').replace(/\D/g,''),
    isValidEmail:value=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    jsonResponse:(payload,status)=>({payload,status}),
    WEB_PRODUCTS:{'web-basica':{},'web-panel':{},'web-catalogo':{},'web-tienda':{}},
    SUPABASE_URL:'https://example.invalid',
    fetch:async(url,options)=>{uploads.push({url,options});return {ok:true}}
  };
  const ctx=vm.createContext(sandbox);
  vm.runInContext(helpers+intake+'globalThis.runIntake=handleWebCommerceIntake; globalThis.magic=validLogoMagic;',ctx,{timeout:1000});
  const req={headers:{get:(key)=>key==='CF-Connecting-IP'?'203.0.113.42':null}};
  return {run:data=>ctx.runIntake(req,{SUPABASE_SERVICE_ROLE_KEY:'fixture-only'},'https://cvstudio.com.ar',data),
    records,uploads,inserts:()=>inserts,magic:ctx.magic};
}
const base={
  reference:'CVS-TESTING-123456789',productId:'web-basica',currency:'ARS',
  stage:'deposit',provider:'mercadopago',customerName:'Cliente Prueba',
  customerEmail:'prueba@example.com',customerPhone:'5491100000000',
  options:{business:'Negocio demostración',features:['catalogo']},
  attribution:{utm_source:'instagram',utm_campaign:'webs_cvstudio'}
};
test('alta privada sin datos ficticios de pago y reintento idempotente',async()=>{
  const h=harness();
  const first=await h.run(base);
  assert.equal(first.status,200);
  assert.equal(first.payload.ok,true);
  assert.equal(h.inserts(),1);
  const again=await h.run(base);
  assert.equal(again.payload.alreadyRegistered,true);
  assert.equal(h.inserts(),1);
  const dbRecord=h.records.get(base.reference);
  assert.equal(dbRecord.attribution.utm_source,'instagram');
  assert.equal(dbRecord.customer_email,'prueba@example.com');
});
test('mismo código con cambios de cliente, producto o modalidad recibe 409',async()=>{
  const h=harness();
  await h.run(base);
  for(const changes of [{customerEmail:'otro@example.com'},{productId:'web-panel'},{provider:'transferencia'},{
    options:{...base.options,business:'Proyecto diferente'}
  }]){
    const response=await h.run({...base,...changes});
    assert.equal(response.status,409);
  }
  assert.equal(h.inserts(),1);
});
test('solo combinaciones válidas de moneda y método de pago',async()=>{
  const h=harness();
  await assert.rejects(()=>h.run({...base,provider:'paypal'}),/incompatibles/);
  await assert.rejects(()=>h.run({...base,currency:'USD',provider:'mercadopago'}),/incompatibles/);
  const ok=await h.run({...base,currency:'USD',provider:'paypal'});
  assert.equal(ok.status,200);
});
test('límite de preparaciones devuelve 429 antes de guardar',async()=>{
  const h=harness({limit:10});
  const blocked=await h.run(base);
  assert.equal(blocked.status,429);
  assert.equal(h.inserts(),0);
});
test('archivo sospechoso con MIME de PNG rechazado por cabecera',async()=>{
  const h=harness();
  await assert.rejects(()=>h.run({...base,logo:{type:'image/png',name:'falso.png',content:btoa('not-a-png')}}),/archivo no es/);
  assert.equal(h.uploads.length,0);
});
test('UTM malformadas son descartadas y nunca se copia correo en attribution',async()=>{
  const h=harness();
  await h.run({...base,attribution:{utm_source:'meta',utm_campaign:'A'.repeat(121),email:'privado@example.com'}});
  const data=h.records.get(base.reference).attribution;
  assert.equal(data.utm_source,'meta');
  assert.equal(data.utm_campaign,undefined);
  assert.equal(data.email,undefined);
});
test('filtro de cabeceras reconoce PNG y rechaza PDF disfrazado',()=>{
  const h=harness();
  assert.equal(h.magic(new Uint8Array([137,80,78,71,13,10,26,10]),'image/png'),true);
  assert.equal(h.magic(new Uint8Array([37,80,68,70,45,0,0,0]),'image/png'),false);
});
