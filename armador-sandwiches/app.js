(()=>{
'use strict';
const KEY='cvstudio-food-lab-prices-v1';
const fmt=v=>new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(v);
const catalog={
 sandwich:{
  label:'Sándwich',emoji:'🥪',
  breads:[{id:'miga',name:'Pan de miga',emoji:'🍞',price:1800},{id:'frances',name:'Pan francés',emoji:'🥖',price:2300},{id:'artesanal',name:'Pan artesanal',emoji:'🍞',price:2700}],
  ingredients:[
   {id:'carne',name:'Carne',emoji:'🥩',group:'Proteínas',price:2800},
   {id:'pollo',name:'Pollo',emoji:'🍗',group:'Proteínas',price:2400},
   {id:'paleta',name:'Paleta',emoji:'🍖',group:'Proteínas',price:1600},
   {id:'bacon',name:'Panceta',emoji:'🥓',group:'Proteínas',price:1700},
   {id:'lechuga',name:'Lechuga',emoji:'🥬',group:'Vegetales',price:450},
   {id:'tomate',name:'Tomate',emoji:'🍅',group:'Vegetales',price:550},
   {id:'cebolla',name:'Cebolla',emoji:'🧅',group:'Vegetales',price:400},
   {id:'pepino',name:'Pepinillos',emoji:'🥒',group:'Vegetales',price:500},
   {id:'huevo',name:'Huevo',emoji:'🍳',group:'Extras',price:950},
   {id:'queso',name:'Queso',emoji:'🧀',group:'Extras',price:950},
   {id:'cheddar',name:'Queso cheddar',emoji:'🟨',group:'Extras',price:1100},
   {id:'mayonesa',name:'Mayonesa',emoji:'🥫',group:'Aderezos',price:300},
   {id:'ketchup',name:'Ketchup',emoji:'🍅',group:'Aderezos',price:300},
   {id:'mostaza',name:'Mostaza',emoji:'🟡',group:'Aderezos',price:300},
   {id:'salsagolf',name:'Salsa golf',emoji:'🥣',group:'Aderezos',price:350}
  ]},
 burger:{
  label:'Hamburguesa',emoji:'🍔',
  breads:[{id:'clasico',name:'Pan clásico',emoji:'🍞',price:2300},{id:'brioche',name:'Pan brioche',emoji:'🥯',price:2900},{id:'sesamo',name:'Pan con sésamo',emoji:'🍔',price:2700}],
  ingredients:[
   {id:'carne',name:'Medallón de carne',emoji:'🥩',group:'Proteínas',price:3400},
   {id:'pollo',name:'Medallón de pollo',emoji:'🍗',group:'Proteínas',price:3000},
   {id:'paleta',name:'Paleta',emoji:'🍖',group:'Proteínas',price:1700},
   {id:'bacon',name:'Panceta',emoji:'🥓',group:'Proteínas',price:1900},
   {id:'lechuga',name:'Lechuga',emoji:'🥬',group:'Vegetales',price:450},
   {id:'tomate',name:'Tomate',emoji:'🍅',group:'Vegetales',price:550},
   {id:'cebolla',name:'Cebolla',emoji:'🧅',group:'Vegetales',price:450},
   {id:'pepino',name:'Pepinillos',emoji:'🥒',group:'Vegetales',price:550},
   {id:'huevo',name:'Huevo',emoji:'🍳',group:'Extras',price:1050},
   {id:'queso',name:'Queso',emoji:'🧀',group:'Extras',price:1000},
   {id:'cheddar',name:'Queso cheddar',emoji:'🟨',group:'Extras',price:1200},
   {id:'mayonesa',name:'Mayonesa',emoji:'🥫',group:'Aderezos',price:300},
   {id:'ketchup',name:'Ketchup',emoji:'🍅',group:'Aderezos',price:300},
   {id:'mostaza',name:'Mostaza',emoji:'🟡',group:'Aderezos',price:300},
   {id:'salsagolf',name:'Salsa golf',emoji:'🥣',group:'Aderezos',price:350}
  ]},
 pizza:{label:'Pizza',emoji:'🍕',breads:[
{id:'muzzarella',name:'Muzzarella',emoji:'🧀',price:10500},
{id:'napolitana',name:'Napolitana',emoji:'🍅',price:12500},
{id:'roquefort',name:'Roquefort',emoji:'🧀',price:14800},
{id:'morrones',name:'Especial de morrones',emoji:'🫑',price:13900}],
ingredients:[
{id:'aceitunas',name:'Aceitunas',emoji:'🫒',group:'Clásicos',price:650},
{id:'huevo',name:'Huevo',emoji:'🍳',group:'Clásicos',price:1250},
{id:'cebollacaramelizada',name:'Cebolla caramelizada',emoji:'🧅',group:'Clásicos',price:1100},
{id:'morronextra',name:'Morrones extra',emoji:'🫑',group:'Clásicos',price:1050},
{id:'jamon',name:'Jamón / paleta',emoji:'🥓',group:'Más sabor',price:1700},
{id:'muzzextra',name:'Muzzarella extra',emoji:'🧀',group:'Más sabor',price:1750},
{id:'roqueextra',name:'Roquefort extra',emoji:'🧀',group:'Más sabor',price:2300},
{id:'tomate',name:'Tomate fresco',emoji:'🍅',group:'Más sabor',price:750},
{id:'albahaca',name:'Albahaca',emoji:'🌿',group:'Más sabor',price:550},
{id:'champi',name:'Champiñones',emoji:'🍄',group:'Más sabor',price:1700},
{id:'oregano',name:'Orégano extra',emoji:'🌱',group:'Aderezos',price:250},
{id:'aji',name:'Ají molido',emoji:'🌶️',group:'Aderezos',price:250},
{id:'salsapicante',name:'Salsa picante',emoji:'🌶️',group:'Aderezos',price:450}]}
};
const basePrices=Object.fromEntries(Object.entries(catalog).map(([key,mode])=>[key,Object.fromEntries([...mode.breads,...mode.ingredients].map(item=>[item.id,item.price]))]));
function loadPrices(){
 try{const raw=JSON.parse(localStorage.getItem(KEY));if(!raw||typeof raw!=='object')return structuredClone(basePrices);
 return Object.fromEntries(Object.keys(basePrices).map(m=>[m,Object.fromEntries(Object.keys(basePrices[m]).map(id=>[id,Number.isInteger(raw[m]?.[id])&&raw[m][id]>=0&&raw[m][id]<=1000000?raw[m][id]:basePrices[m][id]]))]));
 }catch{return structuredClone(basePrices);}
}
let prices=loadPrices();
const orders={sandwich:{bread:'miga',ingredients:{paleta:1,queso:1,lechuga:1,tomate:1}},burger:{bread:'sesamo',ingredients:{carne:1,cheddar:1,lechuga:1,tomate:1}},pizza:{bread:'muzzarella',ingredients:{aceitunas:1}}};
let mode='sandwich',editing='sandwich';
const selectedGroup={sandwich:'Proteínas',burger:'Proteínas',pizza:'Clásicos'};
const $=id=>document.getElementById(id);
const element=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;};
function drawBread(){
 $('pizza-varieties').hidden=mode!=='pizza';
 const root=$('bread-options');root.replaceChildren();
 if(mode!=='pizza')return;
 $('base-title').textContent='Elegí tu variedad';
 root.setAttribute('aria-label','Elegí la variedad de pizza');
 catalog[mode].breads.forEach(b=>{
  const btn=element('button','bread'+(orders[mode].bread===b.id?' active':''));btn.type='button';btn.setAttribute('role','radio');btn.setAttribute('aria-checked',String(orders[mode].bread===b.id));
  btn.append(element('span','bread-emoji',b.emoji),element('strong','',b.name),element('small','',fmt(prices[mode][b.id])));
  btn.addEventListener('click',()=>{orders[mode].bread=b.id;render();});root.append(btn);
 });
}
function drawIngredients(){
 const root=$('ingredients');root.replaceChildren();const grouped=Object.groupBy?Object.groupBy(catalog[mode].ingredients,i=>i.group):catalog[mode].ingredients.reduce((a,i)=>(a[i.group]??=[]).push(i),{});
 const tabs=$('ingredient-tabs');tabs.replaceChildren();
 const groups=Object.keys(grouped);if(!groups.includes(selectedGroup[mode]))selectedGroup[mode]=groups[0];
 groups.forEach(group=>{
  const tab=element('button','ingredient-tab'+(selectedGroup[mode]===group?' active':''),group);
  tab.type='button';tab.setAttribute('aria-pressed',String(selectedGroup[mode]===group));
  const n=grouped[group].reduce((sum,item)=>sum+(orders[mode].ingredients[item.id]||0),0);
  if(n)tab.append(element('span','tab-count',String(n)));
  tab.addEventListener('click',()=>{selectedGroup[mode]=group;drawIngredients();});
  tabs.append(tab);
 });
 Object.entries(grouped).filter(([group])=>selectedGroup[mode]===group).forEach(([group,items])=>{
  const box=element('section','ingredient-group'),head=element('div','group-head');head.append(element('h3','',group),element('small','',group==='Aderezos'?'ELEGÍ LOS QUE QUIERAS':'HASTA 2 POR INGREDIENTE'));box.append(head);
  items.forEach(item=>{
   const q=orders[mode].ingredients[item.id]||0,row=element('div','ingredient-row'+(q?' chosen':''));
   row.append(photoThumb(item.id,item.emoji,'ingredient-icon food-thumb'));
   const info=element('div','ingredient-info');info.append(element('strong','',item.name),element('small','',fmt(prices[mode][item.id])+' c/u'));row.append(info);
   const ctl=element('div','qty-control');const minus=element('button','', '−'),qty=element('output','',String(q)),plus=element('button','', '+');
   minus.type=plus.type='button';minus.setAttribute('aria-label','Quitar '+item.name);plus.setAttribute('aria-label','Agregar '+item.name);
   minus.disabled=q===0;plus.disabled=q===2;
   minus.addEventListener('click',()=>changeQuantity(item.id,-1));plus.addEventListener('click',()=>changeQuantity(item.id,1));
   ctl.append(minus,qty,plus);row.append(ctl);box.append(row);
  });root.append(box);
 });
}
function changeQuantity(id,delta){
 const current=orders[mode].ingredients[id]||0,next=Math.max(0,Math.min(2,current+delta));
 if(next===0)delete orders[mode].ingredients[id];else orders[mode].ingredients[id]=next;
 render();
}
function bill(){
 const order=orders[mode],bread=catalog[mode].breads.find(b=>b.id===order.bread);
 const additions=catalog[mode].ingredients.filter(i=>(order.ingredients[i.id]||0)>0).map(i=>({...i,qty:order.ingredients[i.id],unit:prices[mode][i.id]}));
 return {bread,additions,total:prices[mode][bread.id]+additions.reduce((s,i)=>s+i.unit*i.qty,0),count:additions.reduce((s,i)=>s+i.qty,0)};
}
function summary(){
 const d=bill();$('total').textContent=fmt(d.total);$('summary-total').textContent=fmt(d.total);
 $('item-count').textContent=d.count+' agregado'+(d.count===1?'':'s');
 const lines=$('order-summary');lines.replaceChildren();
 const row=(label,value,id,qty)=>{const line=element('div','summary-row');
  line.append(photoThumb(id,id==='base'?'🍞':id==='pizza'?'🍕':'✦','summary-thumb food-thumb'));
  const labelNode=element('span','summary-name',label);line.append(labelNode);
  if(qty){const quantity=element('span','summary-qty','×'+qty);line.append(quantity);}
  line.append(element('b','',fmt(value)));lines.append(line);
 };
 row(mode==='pizza'?'Pizza '+d.bread.name:'Base incluida',prices[mode][d.bread.id],mode==='pizza'?'pizza':'base',0);
 d.additions.forEach(i=>row(i.name,i.unit*i.qty,i.id,i.qty));
 if(!d.additions.length)lines.append(element('p','helper','Todavía no elegiste adicionales.'));
}
function createLayer(id,y,h,idx){
 const x=102,w=316,r=(n)=>Number(n.toFixed(1));const base='stroke="#633622" stroke-opacity=".16" stroke-width="2"';
 const meat=(fill)=>`<path d="M ${x+15} ${r(y+h*.4)} Q ${x+3} ${r(y+h*.08)} ${x+43} ${r(y)} L ${x+w-43} ${r(y)} Q ${x+w+4} ${r(y+h*.14)} ${x+w-10} ${r(y+h*.52)} Q ${x+w-15} ${r(y+h)} ${x+18} ${r(y+h)} Z" fill="${fill}" ${base}/><path d="M130 ${r(y+h*.65)} Q258 ${r(y+h*1.16)} 383 ${r(y+h*.62)}" stroke="#f4c291" stroke-opacity=".35" stroke-width="3" fill="none"/>`;
 const rect=(fill)=>`<path d="M116 ${r(y+1)} Q150 ${r(y-5)} 195 ${r(y+2)} L392 ${r(y+1)} L 415 ${r(y+h*.4)} L391 ${r(y+h)} L125 ${r(y+h)} L102 ${r(y+h*.45)} Z" fill="${fill}" ${base}/>`;
 const lettuce=()=>`<path d="M98 ${r(y+h*.3)} Q114 ${r(y-h*.1)} 128 ${r(y+h*.25)} T160 ${r(y+h*.18)} T195 ${r(y+h*.15)} T225 ${r(y+h*.23)} T260 ${r(y+h*.1)} T296 ${r(y+h*.25)} T330 ${r(y+h*.1)} T365 ${r(y+h*.2)} T415 ${r(y+h*.18)} L418 ${r(y+h*.63)} Q386 ${r(y+h*1.25)} 365 ${r(y+h*.7)} T321 ${r(y+h*.8)} T275 ${r(y+h*.82)} T235 ${r(y+h*.8)} T185 ${r(y+h*.93)} T145 ${r(y+h*.78)} T103 ${r(y+h*.76)} Z" fill="url(#lettuce)" stroke="#43892c" stroke-width="2"/>`;
 const yolk=()=>`<path d="M126 ${r(y+h*.55)} Q119 ${r(y)} 167 ${r(y+.6)} Q222 ${r(y-h*.35)} 262 ${r(y+2)} Q329 ${r(y-h*.25)} 382 ${r(y+1)} Q415 ${r(y+h*.18)} 396 ${r(y+h*.7)} Q341 ${r(y+h*1.1)} 258 ${r(y+h*.78)} Q179 ${r(y+h*1.2)} 126 ${r(y+h*.55)}Z" fill="#fff9ed" stroke="#eee1be" stroke-width="2"/><ellipse cx="260" cy="${r(y+h*.42)}" rx="55" ry="${Math.max(4,r(h*.39))}" fill="#e9a525"/><ellipse cx="247" cy="${r(y+h*.32)}" rx="23" ry="${Math.max(2,r(h*.12))}" fill="#ffdc71" opacity=".8"/>`;
 switch(id){
 case 'carne':return meat('url(#meat)');
 case 'pollo':return meat('#b77e4b');
 case 'paleta':return rect('#e59a91')+`<path d="M130 ${r(y+h*.3)} Q245 ${r(y+h*.7)} 389 ${r(y+h*.33)}" fill="none" stroke="#f5c1ba" stroke-width="3"/>`;
 case 'bacon':return `<path d="M102 ${r(y+2)} Q160 ${r(y+h*.72)} 213 ${r(y+2)} T319 ${r(y+2)} T424 ${r(y+2)} L424 ${r(y+h)} Q365 ${r(y+h*.4)} 319 ${r(y+h)} T213 ${r(y+h)} T102 ${r(y+h)}Z" fill="#9a422b" stroke="#efbd89" stroke-width="3"/>`;
 case 'lechuga':return lettuce();
 case 'tomate':return `<ellipse cx="177" cy="${r(y+h*.5)}" rx="85" ry="${r(Math.max(5,h*.47))}" fill="#d93e35" stroke="#f38a5d" stroke-width="4"/><ellipse cx="340" cy="${r(y+h*.47)}" rx="84" ry="${r(Math.max(5,h*.45))}" fill="#e4493d" stroke="#f28d66" stroke-width="4"/><path d="M135 ${r(y+h*.44)} Q171 ${r(y)} 206 ${r(y+h*.41)} M297 ${r(y+h*.42)} Q340 ${r(y)} 378 ${r(y+h*.43)}" fill="none" stroke="#ffb2a0" stroke-width="3" opacity=".65"/>`;
 case 'cebolla':return `<ellipse cx="180" cy="${r(y+h*.5)}" rx="71" ry="${Math.max(5,r(h*.4))}" fill="none" stroke="#ab85b9" stroke-width="7"/><ellipse cx="322" cy="${r(y+h*.5)}" rx="71" ry="${Math.max(5,r(h*.4))}" fill="none" stroke="#d1a3d3" stroke-width="7"/>`;
 case 'pepino':return `<ellipse cx="168" cy="${r(y+h*.55)}" rx="63" ry="${Math.max(5,r(h*.47))}" fill="#75a33b" stroke="#c1da75" stroke-width="4"/><ellipse cx="277" cy="${r(y+h*.45)}" rx="68" ry="${Math.max(5,r(h*.45))}" fill="#689c3b" stroke="#c1da75" stroke-width="4"/><ellipse cx="364" cy="${r(y+h*.55)}" rx="50" ry="${Math.max(5,r(h*.44))}" fill="#72a94c" stroke="#c1da75" stroke-width="4"/>`;
 case 'huevo':return yolk();
 case 'queso':return `<path d="M108 ${r(y+2)} L407 ${r(y+2)} L398 ${r(y+h*.45)} L361 ${r(y+h*.45)} L349 ${r(y+h*1.32)} L310 ${r(y+h*.85)} L185 ${r(y+h*.85)} L158 ${r(y+h*1.28)} L133 ${r(y+h*.55)} L105 ${r(y+h*.55)}Z" fill="#f7d36b" stroke="#edb84a" stroke-width="2"/>`;
 case 'cheddar':return `<path d="M107 ${r(y+2)} L410 ${r(y+2)} L400 ${r(y+h*.54)} L370 ${r(y+h*.54)} L353 ${r(y+h*1.4)} L319 ${r(y+h*.8)} L207 ${r(y+h*.82)} L172 ${r(y+h*1.25)} L143 ${r(y+h*.6)} L107 ${r(y+h*.6)}Z" fill="#ffab1d" stroke="#db8314" stroke-width="2"/>`;
 default:return `<path d="M128 ${r(y+h*.3)} Q156 ${r(y-h*.28)} 191 ${r(y+h*.3)} T260 ${r(y+h*.3)} T328 ${r(y+h*.3)} T397 ${r(y+h*.3)}" stroke="${id==='ketchup'?'#cf3f36':id==='mostaza'?'#e5b535':id==='salsagolf'?'#eda78b':'#faf0dd'}" stroke-width="${Math.max(5,r(h*.6))}" stroke-linecap="round" fill="none"/>`;
 }
}
function sandwichTop(y){return `<path d="M100 ${y+28} Q108 ${y+10} 154 ${y+6} L368 ${y+6} Q410 ${y+8} 420 ${y+28} L419 ${y+48} Q267 ${y+60} 103 ${y+48}Z" fill="url(#bread)" stroke="#b66b32" stroke-width="4"/><path d="M120 ${y+25} Q256 ${y+4} 402 ${y+26}" fill="none" stroke="#fff1c4" stroke-width="10" stroke-linecap="round" opacity=".65"/><path d="M107 ${y+43} Q260 ${y+51} 416 ${y+42}" fill="none" stroke="#ba7236" stroke-width="5"/>`;}
function burgerTop(y,seeded){let seeds='';
 if(seeded){for(let i=0;i<25;i++){const x=155+(i%9)*26+(Math.floor(i/9)%2)*9;const yy=y+20+Math.floor(i/9)*13+((i*13)%7);seeds+=`<ellipse cx="${x}" cy="${yy}" rx="5" ry="2.2" transform="rotate(-28 ${x} ${yy})" fill="#fff4cf" stroke="#c88e52" stroke-width=".7"/>`;}}
 return `<path d="M103 ${y+73} C104 ${y-2} 150 ${y-21} 260 ${y-21} C366 ${y-21} 414 ${y+7} 417 ${y+73} Q263 ${y+90} 103 ${y+73}Z" fill="url(#bun)" stroke="#af6329" stroke-width="4"/><path d="M127 ${y+25} Q265 ${y-28} 393 ${y+26}" fill="none" stroke="#fff0c4" stroke-width="10" opacity=".4"/>${seeds}<path d="M107 ${y+71} Q264 ${y+84} 414 ${y+71}" stroke="#e7b264" stroke-width="8" fill="none"/>`;}
function renderPizza(){
 const svg=$('food-svg'),order=orders.pizza,kind=order.bread,details=bill();
 const variety=catalog.pizza.breads.find(x=>x.id===kind);
 $('visual-label').textContent='TU PIZZA · '+variety.name.toUpperCase();
 const parts=[];
 const ellipse=(x,y,rx,ry,fill,stroke='#ffffff55')=>'<ellipse cx="'+x+'" cy="'+y+'" rx="'+rx+'" ry="'+ry+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="2"/>';
 const circle=(x,y,r,fill,stroke='#ffffff55')=>'<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="1.8"/>';
 const scatter=(id,n,fn)=>{for(let i=0;i<n;i++){
 const a=(i*137.5+19+id.length*11)*Math.PI/180,r=37+((i*47+id.length*17)%109);
 const x=260+Math.cos(a)*r,y=211+Math.sin(a)*r*.76;
 parts.push(fn(Number(x.toFixed(1)),Number(y.toFixed(1)),i));
 }};
 if(kind==='napolitana'){scatter('tomate',8,(x,y)=>ellipse(x,y,20,12,'#d94e3b','#eb9f84'));scatter('albahaca',7,(x,y)=>ellipse(x,y,10,5,'#448e45','#2b713c'));}
 if(kind==='roquefort')scatter('roque',18,(x,y)=>circle(x,y,9,'#e7f0df','#a4ad82'));
 if(kind==='morrones'){scatter('morron',12,(x,y)=>ellipse(x,y,17,7,'#e34a35','#ff9a60'));scatter('jamon',9,(x,y)=>ellipse(x,y,18,9,'#e89a9a','#ffcebe'));}
 const toppings={
 aceitunas:(x,y)=>circle(x,y,10,'#35462e','#8c9a57')+circle(x,y,3.5,'#e9d7a7'),
 huevo:(x,y)=>circle(x,y,22,'#fff6e4','#e5d8b4')+circle(x,y,10,'#efb827','#f8d769'),
 cebollacaramelizada:(x,y)=>'<path d="M '+(x-18)+' '+(y+4)+' Q '+x+' '+(y-15)+' '+(x+18)+' '+(y+4)+'" stroke="#bc7134" stroke-width="8" fill="none" stroke-linecap="round"/>',
 morronextra:(x,y)=>ellipse(x,y,19,7,'#d44930','#f3a16c'),
 jamon:(x,y)=>ellipse(x,y,22,12,'#e9948b','#ffd3c2'),
 muzzextra:(x,y)=>ellipse(x,y,18,12,'#fff1b9','#e0bd7a'),
 roqueextra:(x,y)=>circle(x,y,13,'#dfe9db','#98a77d'),
 tomate:(x,y)=>ellipse(x,y,20,12,'#d94438','#f7b09a'),
 albahaca:(x,y)=>ellipse(x,y,13,6,'#367a44','#6ebc60'),
 champi:(x,y)=>ellipse(x,y,16,10,'#e8c8a2','#ae8b68'),
 oregano:(x,y)=>circle(x,y,3,'#477b37','#88ab58'),
 aji:(x,y)=>circle(x,y,4,'#b73d24','#ff8e4c'),
 salsapicante:(x,y)=>circle(x,y,7,'#b92d1d','#f87246')
 };
 Object.entries(order.ingredients).forEach(([id,qty])=>{if(toppings[id])scatter(id,(id==='oregano'||id==='aji'?23:5)*qty,toppings[id]);});
 let herbs='';for(let i=0;i<38;i++){const a=i*2.3999,d=42+(i*19%132),x=(260+Math.cos(a)*d).toFixed(1),y=(210+Math.sin(a)*d*.76).toFixed(1);herbs+=circle(x,y,2.1,'#51773d','#ffffff20');}
 svg.innerHTML='<defs><radialGradient id="pizzaDough"><stop stop-color="#f0b66b"/><stop offset=".85" stop-color="#e8a057"/><stop offset="1" stop-color="#b67738"/></radialGradient><radialGradient id="pizzaCheese"><stop stop-color="#ffecc0"/><stop offset=".7" stop-color="#f5d788"/><stop offset="1" stop-color="#e0a748"/></radialGradient></defs><ellipse cx="260" cy="377" rx="206" ry="26" fill="#00000020"/><ellipse cx="260" cy="218" rx="221" ry="177" fill="#eae5dc" stroke="#faf6e9" stroke-width="7"/><ellipse cx="260" cy="211" rx="204" ry="160" fill="url(#pizzaDough)" stroke="#a86d32" stroke-width="6"/><ellipse cx="260" cy="211" rx="180" ry="140" fill="#bc4d2b"/><ellipse cx="260" cy="209" rx="174" ry="134" fill="url(#pizzaCheese)"/>'+herbs+parts.join('')+'<ellipse cx="260" cy="211" rx="176" ry="137" fill="none" stroke="#b9613377" stroke-width="4"/>';
 svg.setAttribute('aria-label','Pizza '+variety.name+' con '+details.additions.map(i=>i.name).join(', '));
}

const photographicSlots={carne:2,lechuga:3,tomate:4,huevo:5,queso:6,cheddar:7,paleta:8,mayonesa:9};
const fallbackPhoto={pollo:2,bacon:2,cebolla:4,pepino:3,jamon:8,muzzextra:6,roqueextra:6,morronextra:4,albahaca:3,aceitunas:3,cebollacaramelizada:4};
function photoThumb(id,emoji,className='food-thumb'){
 const slot=photographicSlots[id]??fallbackPhoto[id];
 if(slot===undefined)return element('span',className+' thumb-fallback',emoji||'✦');
 const pic=element('span',className);
 const row=Math.floor(slot/5),col=slot%5;
 pic.style.backgroundPosition=(col*25)+'% '+(row*100)+'%';
 pic.setAttribute('aria-hidden','true');
 return pic;
}
function renderPhotographicFood(){
 const svg=$('food-svg'),stack=$('photo-stack'),data=bill(),selected=orders[mode].ingredients;
 svg.hidden=true;stack.hidden=false;stack.replaceChildren();
 $('visual-label').textContent=mode==='burger'?'TU HAMBURGUESA':'TU SÁNDWICH';
 const slot=(number,layerClass,index)=>{
  const row=Math.floor(number/5),column=number%5;
  const el=element('div','photo-layer '+layerClass);
  el.style.backgroundPosition=(column*25)+'% '+(row*100)+'%';
  el.style.setProperty('--layer-offset',index*12+'px');
  el.style.zIndex=String(index+1);
  return el;
 };
 stack.append(slot(1,'bottom',0));
 const order=['mayonesa','carne','paleta','queso','cheddar','huevo','tomate','lechuga'];
 let i=0,missing=[];
 order.forEach(id=>{
  const qty=selected[id]||0;
  for(let q=0;q<qty;q++){const el=slot(photographicSlots[id],'ingredient',i+1);el.title=id;stack.append(el);i++;}
 });
 for(const [id,q] of Object.entries(selected))if(q&&!Object.prototype.hasOwnProperty.call(photographicSlots,id))missing.push(id);
 stack.append(slot(0,'top',i+2));
 stack.setAttribute('aria-label',(mode==='burger'?'Hamburguesa':'Sándwich')+' con '+data.additions.map(a=>a.name).join(', '));
 stack.classList.toggle('has-many',i>7);
 const indicator=$('photo-pending');
 if(indicator){indicator.hidden=true;}
}

function renderFood(){
 if(mode==='pizza'){$('food-svg').hidden=false;$('photo-stack').hidden=true;const note=$('photo-pending');if(note)note.hidden=true;renderPizza();return;}
 renderPhotographicFood();return;
 const svg=$('food-svg'),data=bill(),burger=mode==='burger',bread=orders[mode].bread;
 $('visual-label').textContent=burger?'TU HAMBURGUESA':'TU SÁNDWICH';
 const choices=[...catalog[mode].ingredients.filter(i=>(orders[mode].ingredients[i.id]||0)>0)].sort((a,b)=>['mayonesa','ketchup','mostaza','salsagolf','carne','pollo','paleta','bacon','queso','cheddar','huevo','pepino','cebolla','tomate','lechuga'].indexOf(a.id)-['mayonesa','ketchup','mostaza','salsagolf','carne','pollo','paleta','bacon','queso','cheddar','huevo','pepino','cebolla','tomate','lechuga'].indexOf(b.id));
 const layers=choices.flatMap(i=>Array.from({length:orders[mode].ingredients[i.id]},()=>i.id));
 const dy=Math.min(20,236/Math.max(4,layers.length+2));let y=336;
 const base=`<defs><linearGradient id="bun" x1=".1" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="#f5cc7b"/><stop offset=".65" stop-color="#d98b3d"/><stop offset="1" stop-color="#b96f30"/></linearGradient><linearGradient id="bread" x1="0" y1="0" x2=".4" y2="1"><stop stop-color="#fce4a9"/><stop offset="1" stop-color="#d6a069"/></linearGradient><linearGradient id="meat" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#874321"/><stop offset=".5" stop-color="#583021"/><stop offset="1" stop-color="#a5522a"/></linearGradient><linearGradient id="lettuce" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#93d653"/><stop offset="1" stop-color="#4e9d37"/></linearGradient></defs><ellipse cx="260" cy="379" rx="212" ry="30" fill="#d0ad82" opacity=".25"/><ellipse cx="260" cy="373" rx="205" ry="25" fill="#fffdf9" stroke="#ecd6b8" stroke-width="4"/>`;
 let shapes=burger?`<path d="M108 341 Q260 355 414 341 L409 357 Q259 370 114 357Z" fill="url(#bun)" stroke="#a86735" stroke-width="3"/>`:`<path d="M108 332 Q260 341 412 332 L420 355 Q260 370 102 355Z" fill="url(#bread)" stroke="#b77f4b" stroke-width="3"/>`;
 layers.forEach((id,i)=>{y-=dy;shapes+=createLayer(id,y,dy,i);});
 const top=burger?burgerTop(y-78,bread==='sesamo'):sandwichTop(y-51);
 svg.innerHTML=base+shapes+top;
 svg.setAttribute('aria-label',(burger?'Hamburguesa':'Sándwich')+' con '+data.additions.map(i=>i.name+(i.qty>1?' por '+i.qty:'')).join(', '));
}
function render(){
 document.querySelectorAll('[data-mode]').forEach(b=>{const active=b.dataset.mode===mode;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
 drawBread();drawIngredients();summary();renderFood();
}
document.querySelectorAll('[data-mode]').forEach(btn=>btn.addEventListener('click',()=>{mode=btn.dataset.mode;$('copy-status').textContent='';render();}));
$('clear-order').addEventListener('click',()=>{orders[mode].ingredients={};render();$('copy-status').textContent='Pedido reiniciado.';});
$('copy-order').addEventListener('click',async()=>{
 const d=bill(),text='Pedido de '+catalog[mode].label+'\n'+(mode==='pizza'?'Variedad: '+d.bread.name:'Base de '+catalog[mode].label)+'\n'+d.additions.map(i=>i.qty+' × '+i.name+' ('+fmt(i.qty*i.unit)+')').join('\n')+'\nTotal estimado: '+fmt(d.total)+'\nDemo CVStudio · precios referenciales';
 try{await navigator.clipboard.writeText(text);$('copy-status').textContent='✓ Pedido copiado. Ya podés pegarlo.';}
 catch{const area=element('textarea');area.value=text;area.style.cssText='position:fixed;top:0;left:0;opacity:0';document.body.append(area);area.select();const ok=document.execCommand('copy');area.remove();$('copy-status').textContent=ok?'✓ Pedido copiado.':'No se pudo copiar automáticamente.';}
});
const dialog=$('pricing-dialog');
function openPrices(){editing=mode;drawPricing();if(!dialog.open)dialog.showModal();}
$('pricing-open').addEventListener('click',openPrices);$('pricing-footer').addEventListener('click',openPrices);
$('pricing-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
document.querySelectorAll('[data-edit-mode]').forEach(btn=>btn.addEventListener('click',()=>{editing=btn.dataset.editMode;drawPricing();}));
function drawPricing(){
 document.querySelectorAll('[data-edit-mode]').forEach(b=>b.classList.toggle('active',b.dataset.editMode===editing));
 const root=$('pricing-fields');root.replaceChildren();$('pricing-status').textContent='';
 [...(editing==='pizza'?catalog[editing].breads:[catalog[editing].breads.find(b=>b.id===orders[editing].bread)]),...catalog[editing].ingredients].forEach(item=>{
  const field=element('label','price-field'),txt=element('span','',editing!=='pizza'&&catalog[editing].breads.some(x=>x.id===item.id)?'Base '+catalog[editing].label:item.name),input=element('input');input.type='number';input.name=item.id;input.min='0';input.max='1000000';input.step='50';input.value=prices[editing][item.id];input.required=true;input.setAttribute('aria-label','Precio de '+item.name);
  txt.append(element('small','',catalog[editing].breads.some(x=>x.id===item.id)?(editing==='pizza'?'VARIEDAD':'PRECIO BASE'):item.group.toUpperCase()));
  field.append(txt,input);root.append(field);
 });
}
$('save-prices').addEventListener('click',()=>{
 const inputs=[...$('pricing-fields').querySelectorAll('input')],updates={};
 for(const input of inputs){const v=Number(input.value);if(!Number.isInteger(v)||v<0||v>1000000){$('pricing-status').textContent='Ingresá valores enteros entre $0 y $1.000.000.';return;}updates[input.name]=v;}
 prices[editing]={...prices[editing],...updates};
 try{localStorage.setItem(KEY,JSON.stringify(prices));$('pricing-status').textContent='✓ Precios guardados en este navegador.';}catch{$('pricing-status').textContent='Precios aplicados, pero este navegador no permitió guardarlos.';}
 render();drawPricing();$('pricing-status').textContent='✓ Precios actualizados. Cerrá para ver el resultado.';
});
$('reset-prices').addEventListener('click',()=>{if(!confirm('¿Restaurar los precios de referencia de '+catalog[editing].label+'?'))return;prices[editing]=structuredClone(basePrices[editing]);try{localStorage.setItem(KEY,JSON.stringify(prices));}catch{}drawPricing();render();$('pricing-status').textContent='Precios referenciales restaurados.';});
render();
})();