(()=>{
'use strict';
const details=document.getElementById('realestate-details'),full=document.getElementById('realestate-panel-full');if(!details||!full)return;
document.querySelectorAll('[data-realestate-details]').forEach(b=>b.addEventListener('click',()=>{details.showModal();details.scrollTop=0;}));
document.getElementById('realestate-expand').onclick=()=>full.showModal();
for(const modal of [details,full]){modal.querySelector('.realestate-close').onclick=()=>modal.close();modal.addEventListener('click',e=>{if(e.target===modal){const r=modal.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)modal.close();}});}
document.getElementById('realestate-request').onclick=()=>{details.close();document.querySelector('.design-card.realestate .web-demo-request')?.click();};
})();
