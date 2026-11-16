'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const insights=require('../centro-operaciones-prueba/marketing-insights.js');
const source=fs.readFileSync(path.join(__dirname,'../centro-operaciones-prueba/operational.js'),'utf8');
const start=source.indexOf('  function marketingOperationalRenderer() {');
const end=source.indexOf('  const calendarTypeMeta=',start);
assert.ok(start>=0&&end>start,'Marketing renderer must exist');
const renderer=source.slice(start,end);
const compile=new Function('window','state','money','esc','kpi',renderer+'; return marketingOperationalRenderer();');
const money=n=>'$'+Number(n).toLocaleString('es-AR');
const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
function run(state={}){
  return compile({CVStudioMarketingInsights:insights},
    {_integrationStatus:{facebook:'pending'},metaCampaigns:[],...state},
    money,esc,(_,name,value)=>'<b>'+esc(name)+':'+esc(value)+'</b>');
}
test('Marketing does not require manual payment entries',()=>{
  const result=run({payments:[{status:'Confirmado',amount:80000}]});
  assert.match(result,/Optimización de campañas/);
  assert.doesNotMatch(result,/80\.000/);
  assert.match(result,/Meta Ads sin conexión confirmada/);
});
test('a pending Meta connection never displays manual campaign figures as Meta metrics',()=>{
  const result=run({metaCampaigns:[{name:'Local',spend:9000,clicks:23}],_integrationStatus:{facebook:'pending'}});
  assert.match(result,/Meta Ads sin conexión confirmada/);
  assert.doesNotMatch(result,/9\.000/);
});
test('connected Meta campaign data appears in the comparison table',()=>{
  const result=run({_integrationStatus:{facebook:'connected'},metaCampaigns:[{id:'1',name:'Campaña Webs',status:'ACTIVE',spend:3000,impressions:10000,clicks:100,results:4}]});
  assert.match(result,/Campaña Webs/);
  assert.match(result,/3\.000/);
  assert.match(result,/1%/);
  assert.match(result,/costo por resultado/i);
});
test('the dashboard does not equate Meta results with confirmed sales',()=>{
  const result=run({_integrationStatus:{facebook:'connected'},metaCampaigns:[{name:'Meta',status:'ACTIVE',results:4}]});
  assert.match(result,/no equivalen necesariamente a clientes o ventas/);
  assert.doesNotMatch(result,/Ventas generadas/);
});
