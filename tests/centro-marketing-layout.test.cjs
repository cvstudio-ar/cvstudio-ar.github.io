'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const css=fs.readFileSync(path.join(__dirname,'../centro-operaciones-prueba/responsive-layout.css'),'utf8');
const js=fs.readFileSync(path.join(__dirname,'../centro-operaciones-prueba/operational.js'),'utf8');
test('Marketing layout overrides fixed row count and has a scroll container',()=>{
  assert.match(css,/#appMain\[data-module="marketing"\]\s*\{[\s\S]*?display:block!important/);
  assert.match(css,/#appMain\[data-module="marketing"\]\s*\{[\s\S]*?overflow-y:auto!important/);
  assert.match(css,/#appMain\[data-module="marketing"\]\s*>\s*\.marketing-grid\s*\{[\s\S]*?grid-template-rows:none!important/);
  assert.match(css,/#appMain\[data-module="marketing"\]\s*>\s*\.kpi-grid\s*\{[\s\S]*?height:auto!important/);
});
test('Marketing has mobile layout without overlapping grid tracks',()=>{
  assert.match(css,/@media\(max-width:650px\)\s*\{[\s\S]*?#appMain\[data-module="marketing"\]\s*>\s*\.kpi-grid,[\s\S]*?grid-template-columns:1fr/);
});
test('Growth ring flags exceeded or undefined budget instead of unbounded percentages',()=>{
  assert.match(js,/budget<=0\?'Sin fondo':spent>budget\?'Excedido'/);
});
