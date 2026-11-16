'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source=fs.readFileSync(path.join(__dirname,'../centro-operaciones-prueba/operational.js'),'utf8');
const start=source.indexOf('  function marketingOperationalRenderer() {');
const end=source.indexOf('  const calendarTypeMeta=',start);
assert.ok(start>=0 && end>start,'Marketing renderer must exist');
const renderer=source.slice(start,end);
const compile=new Function('state','confirmedPayments','totalRevenue','totalExpenses','calendarItems','localDateKey','money','esc','brand','dateLabel','kpi','panel','donutChart',
  renderer+'; return marketingOperationalRenderer();');
const money=n=>'$'+Number(n).toLocaleString('es-AR');
const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
function run(data={}){
  const state={
    clients:[],payments:[],expenses:[],rules:{growth:0},metaCampaigns:[],metaSummary:{spend:0},
    webIntakes:[],_integrationStatus:{webCommerce:'pending'},...data
  };
  const confirmed=()=>state.payments.filter(p=>p.status==='Confirmado');
  return compile(state,confirmed,()=>confirmed().reduce((sum,p)=>sum+Number(p.amount||0),0),
    ()=>state.expenses.reduce((sum,e)=>sum+Number(e.amount||0),0),
    ()=>[],date=>date.toISOString().slice(0,10),money,esc,()=>'',()=>'',(_,name,value)=>'<b>'+esc(name)+':'+esc(value)+'</b>',
    (name,html)=>'<section><h2>'+esc(name)+'</h2>'+html+'</section>',()=>'<span>0%</span>');
}
test('no confirmed payments never implies campaign revenue',()=>{
  const result=run({payments:[{status:'Pendiente',amount:80000,attribution:{utm_source:'meta',utm_campaign:'webs'}}]});
  assert.match(result,/Sin ventas con UTM verificada/);
  assert.match(result,/Ventas generadas:0/);
  assert.doesNotMatch(result,/80\.000/);
});
test('only confirmed UTM payments are counted as attributed sales',()=>{
  const result=run({payments:[
    {status:'Confirmado',amount:30000,attribution:{utm_source:'meta',utm_campaign:'webs'}},
    {status:'Confirmado',amount:40000,attribution:{utm_source:'meta',utm_campaign:'webs'}},
    {status:'Confirmado',amount:25000},
    {status:'Pendiente',amount:50000,attribution:{utm_source:'meta',utm_campaign:'webs'}}
  ]});
  assert.match(result,/2 ventas atribuidas/);
  assert.match(result,/70\.000/);
  assert.match(result,/Ventas generadas:3/);
  assert.match(result,/Ventas con UTM registrada: 2 de 3/);
});
test('contact sources show only named registered clients',()=>{
  const result=run({clients:[
    {name:'Persona uno',source:'Instagram'},
    {name:'Persona dos',source:'Instagram'},
    {name:'',source:'Instagram'},
    {name:'Persona tres',source:'Sin identificar'}
  ]});
  assert.match(result,/Contactos con origen identificado: 2 de 3/);
  assert.match(result,/Instagram/);
});
test('missing external integration shows explicit pending state',()=>{
  const result=run();
  assert.match(result,/Sin conexión al registro de proyectos web/);
  assert.match(result,/Sin campañas activas/);
});
