(()=>{
'use strict';
function setup(){
 const card=document.querySelector('[data-basic-demo]'),modal=document.getElementById('basic-functions');if(!card||!modal)return;
 const url='https://wa.me/5492964652318?text='+encodeURIComponent('Hola CVStudio, quiero una web similar al modelo básico de barbería de $45.000, sin panel administrativo.');
 // Keep one request action even if another catalog script inserted one.
 card.querySelectorAll('.web-demo-request').forEach(button=>button.remove());
 const request=document.createElement('a');request.className='web-demo-request';request.href=url;request.target='_blank';request.rel='noopener noreferrer';
 request.innerHTML='<svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 3h2l3 12h11l2-9H6"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></svg><span>Quiero una web similar</span>';card.append(request);
 modal.querySelector('[data-basic-request]').href=url;
 card.querySelector('[data-basic-functions]').addEventListener('click',()=>{modal.showModal();modal.scrollTop=0;});
 modal.querySelector('.realestate-close').addEventListener('click',()=>modal.close());
 modal.addEventListener('click',event=>{if(event.target!==modal)return;const box=modal.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)modal.close();});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
})();