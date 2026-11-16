'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const insights=require('../centro-operaciones-prueba/marketing-insights.js');
test('no Meta connection never invents spend, clicks or results',()=>{
  const a=insights.analyze([{name:'Manual',spend:1000,clicks:30}],false);
  assert.equal(a.connected,false); assert.equal(a.totals,null);assert.equal(a.rows.length,0);
});
test('calculates CTR CPC and CPR from real numeric API fields',()=>{
  const a=insights.analyze([{id:'1',name:'Web',status:'ACTIVE',spend:3000,impressions:10000,clicks:150,results:5}],true);
  assert.equal(a.totals.ctr,1.5);assert.equal(a.totals.cpc,20);assert.equal(a.totals.cpr,600);
});
test('does not fake rates with zero denominators',()=>{
  const a=insights.analyze([{status:'ACTIVE',spend:100,clicks:0,impressions:0,results:0}],true);
  assert.equal(a.totals.ctr,null);assert.equal(a.totals.cpc,null);assert.equal(a.totals.cpr,null);
});
test('issues guarded suggestions only for sufficiently evidenced active campaigns',()=>{
  const a=insights.analyze([{name:'Anuncio A',status:'ACTIVE',spend:5000,clicks:5,impressions:1200,results:0}],true);
  assert.ok(a.suggestions.some(x=>x.title.includes('Anuncio A')));
  const b=insights.analyze([{name:'Anuncio B',status:'ACTIVE',spend:100,clicks:2,impressions:20,results:0}],true);
  assert.equal(b.suggestions.filter(x=>x.level==='review').length,0);
});
test('does not recommend changes to paused campaigns',()=>{
  const a=insights.analyze([{name:'Pausada',status:'PAUSED',spend:5000,impressions:10000,clicks:0,results:0}],true);
  assert.equal(a.suggestions.filter(x=>x.level==='review').length,0);
});
