const dialog=document.querySelector('#panel');
const title=document.querySelector('#panel-title');
const content=document.querySelector('#panel-content');
const notice='pagina bloqueada por pendiente de pago';
function showBlocked(){
 title.textContent=notice;
 content.replaceChildren();
 const banner=document.createElement('p');
 banner.className='blocked-payment-banner';
 banner.textContent=notice;
 content.append(banner);
 if(!dialog.open)dialog.showModal();
}
document.addEventListener('click',event=>{
 const trigger=event.target.closest('[data-open], [data-video], .whatsapp');
 if(!trigger)return;
 event.preventDefault();
 showBlocked();
});
document.querySelector('.close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',event=>{
 if(event.target!==dialog)return;
 const rect=dialog.getBoundingClientRect();
 if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();
});
