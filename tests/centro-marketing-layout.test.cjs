'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const css=fs.readFileSync(path.join(__dirname,'../centro-operaciones-prueba/responsive-layout.css'),'utf8');
const js=fs.readFileSync(path.join(__dirname,'../centro-operaciones-prueba/operational.js'),'utf8');
test('Marketing layout overrides fixed row count and scrolls',()=>{
 assert.match(css,/#appMain\[data-module="marketing"\]\s*\{[\s\S]*?overflow-y:auto!important/);
 assert.match(css,/#appMain\[data-module="marketing"\]\s*>\s*\.kpi-grid\s*\{[\s\S]*?height:auto!important/);
});
test('Campaign table is horizontally scrollable and panels expand naturally',()=>{
 assert.match(css,/\.marketing-table-scroll\{[^}]*overflow-x:auto/);
 assert.match(css,/\.marketing-growth-layout\{[^}]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(css,/\.marketing-growth-layout>\.panel\{[^}]*height:auto!important/);
});
test('Campaign layout collapses to one column on narrow screens',()=>{
 assert.match(css,/@media\(max-width:1100px\)\{[^}]*\.marketing-growth-layout\{grid-template-columns:1fr/);
});
test('Marketing panels do not require a payment-derived growth gauge',()=>{
 const start=js.indexOf('  function marketingOperationalRenderer() {');
 const end=js.indexOf('  const calendarTypeMeta=',start);
 const section=js.slice(start,end);
 assert.match(section,/Meta Ads/);
 assert.doesNotMatch(section,/donutChart\(/);
 assert.doesNotMatch(section,/confirmedPayments\(/);
});
