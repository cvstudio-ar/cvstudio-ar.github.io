const monthLabel = document.querySelector('#month-label');
const daysGrid = document.querySelector('#calendar-days');
const previous = document.querySelector('#prev-month');
const next = document.querySelector('#next-month');
const arrivalLabel = document.querySelector('#arrival');
const departureLabel = document.querySelector('#departure');
const bookingLink = document.querySelector('#whatsapp-booking');
const hint = document.querySelector('#calendar-hint');
const today = new Date(); today.setHours(0,0,0,0);
let shownMonth = new Date(today.getFullYear(), today.getMonth(), 1);
let arrival = null, departure = null;
const format = date => new Intl.DateTimeFormat('es-AR',{day:'2-digit',month:'short',year:'numeric'}).format(date);
const sameDay = (a,b) => a && b && a.getTime() === b.getTime();
function drawCalendar(){
  monthLabel.textContent = new Intl.DateTimeFormat('es-AR',{month:'long',year:'numeric'}).format(shownMonth);
  previous.disabled = shownMonth.getFullYear() === today.getFullYear() && shownMonth.getMonth() === today.getMonth();
  daysGrid.replaceChildren();
  const firstDay = (shownMonth.getDay()+6)%7;
  const count = new Date(shownMonth.getFullYear(),shownMonth.getMonth()+1,0).getDate();
  for(let i=0;i<firstDay;i++){const blank=document.createElement('span');blank.className='blank';daysGrid.append(blank)}
  for(let day=1;day<=count;day++){
    const date=new Date(shownMonth.getFullYear(),shownMonth.getMonth(),day);
    const button=document.createElement('button');button.type='button';button.textContent=day;button.disabled=date<today;
    button.setAttribute('aria-label',format(date));
    if(sameDay(date,arrival)||sameDay(date,departure))button.classList.add('selected');
    else if(arrival&&departure&&date>arrival&&date<departure)button.classList.add('in-range');
    button.addEventListener('click',()=>selectDate(date));daysGrid.append(button);
  }
}
function selectDate(date){
  if(!arrival||departure||date<=arrival){arrival=date;departure=null;hint.textContent='Ahora elegí la fecha de salida.'}
  else {departure=date;hint.textContent='La disponibilidad se confirmará por WhatsApp.'}
  arrivalLabel.textContent=arrival?format(arrival):'Elegí un día';
  departureLabel.textContent=departure?format(departure):'Elegí un día';
  if(arrival&&departure){
    const message=`Hola, quisiera consultar disponibilidad en Valhalla 5 km para ingresar el ${format(arrival)} y salir el ${format(departure)}. ¿Qué cabañas tienen disponibles y cuál sería la tarifa?`;
    bookingLink.href=`https://wa.me/5493446570729?text=${encodeURIComponent(message)}`;
    bookingLink.classList.remove('disabled');bookingLink.removeAttribute('aria-disabled');
  }else{bookingLink.href='#ubicacion';bookingLink.classList.add('disabled');bookingLink.setAttribute('aria-disabled','true')}
  drawCalendar();
}
previous.addEventListener('click',()=>{shownMonth=new Date(shownMonth.getFullYear(),shownMonth.getMonth()-1,1);drawCalendar()});
next.addEventListener('click',()=>{shownMonth=new Date(shownMonth.getFullYear(),shownMonth.getMonth()+1,1);drawCalendar()});
bookingLink.addEventListener('click',event=>{if(bookingLink.getAttribute('aria-disabled')==='true')event.preventDefault()});
drawCalendar();


// Public sections open as dialogs. Their own content scrolls; the home stays fixed.
function openPanel(id){
 const panel=document.getElementById(id);
 if(!panel||panel.open)return;
 panel.querySelectorAll('iframe[data-src]').forEach(frame=>{frame.src=frame.dataset.src;delete frame.dataset.src});
 panel.showModal();
}
document.querySelectorAll('[data-open]').forEach(button=>button.addEventListener('click',()=>openPanel(button.dataset.open)));
document.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>button.closest('dialog').close()));
document.querySelectorAll('[data-switch]').forEach(button=>button.addEventListener('click',()=>{button.closest('dialog').close();openPanel(button.dataset.switch)}));
document.querySelectorAll('dialog').forEach(panel=>panel.addEventListener('click',event=>{
 const r=panel.getBoundingClientRect();
 if(event.target===panel&&(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom))panel.close();
}));
const commonKitchen=['Microondas','Termotanque eléctrico','Vajilla completa y utensilios'];
const cabins={
 1:{capacity:4,beds:['Una cama matrimonial','Una cama tipo nido','Ropa de cama completa'],kitchen:['Anafe','Horno eléctrico',...commonKitchen],grill:true},
 2:{capacity:4,beds:['Una cama matrimonial','Una cama tipo nido','Ropa de cama completa'],kitchen:['Anafe','Horno eléctrico',...commonKitchen],grill:true},
 3:{capacity:2,beds:['Una cama matrimonial','Ropa de cama completa'],kitchen:['Anafe',...commonKitchen],grill:true},
 4:{capacity:2,beds:['Una cama matrimonial','Ropa de cama completa'],kitchen:['Anafe',...commonKitchen],grill:false}
};
function list(items){return '<ul>'+items.map(text=>'<li>'+text+'</li>').join('')+'</ul>'}
function showCabin(number){
 const cabin=cabins[number];const detail=document.querySelector('#cabin-detail');
 document.querySelectorAll('[data-cabin]').forEach(button=>{const selected=Number(button.dataset.cabin)===number;button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1});
 detail.setAttribute('aria-labelledby','tab-'+number);
 detail.innerHTML='<span class="capacity">Hasta '+cabin.capacity+' personas</span><h3>Cabaña '+number+'</h3><p>'+(cabin.capacity===4?'Ideal para familias o parejas que buscan confort, independencia y un entorno relajante.':'Ideal para parejas que buscan confort, independencia y un entorno relajante.')+'</p><div class="equipment"><section><h3>Descanso</h3>'+list(cabin.beds)+'</section><section><h3>Cocina equipada</h3>'+list(cabin.kitchen)+'</section><section><h3>Climatización y conexión</h3>'+list(['Aire acondicionado frío/calor','Wi-Fi de alta velocidad','Smart TV'])+'</section><section><h3>Espacios exteriores</h3>'+list(cabin.grill?['Parrilla techada privada','Estacionamiento propio junto a la cabaña']:['Estacionamiento propio junto a la cabaña','Asador fogonero en el espacio común'])+'</section></div><p class="note"><strong>Importante:</strong> no se entregan toallas ni toallones. Recordá traer los tuyos.</p>';
}
document.querySelectorAll('[data-cabin]').forEach(button=>{
 button.addEventListener('click',()=>showCabin(Number(button.dataset.cabin)));
 button.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const current=Number(button.dataset.cabin);const n=event.key==='Home'?1:event.key==='End'?4:((current-1+(event.key==='ArrowRight'?1:3))%4)+1;showCabin(n);document.querySelector('#tab-'+n).focus()});
});showCabin(1);
const photos=window.VALHALLA_PHOTOS||[];
const mainPhoto=document.querySelector('#gallery-main'),caption=document.querySelector('#gallery-caption'),countLabel=document.querySelector('#gallery-count'),thumbs=document.querySelector('#gallery-thumbs');let photoIndex=0;
photos.forEach((photo,index)=>{const button=document.createElement('button');button.type='button';button.setAttribute('aria-label','Ver foto: '+photo.title);const img=document.createElement('img');img.src=photo.src;img.alt='';img.loading='lazy';button.append(img);button.addEventListener('click',()=>showPhoto(index));thumbs.append(button)});
function showPhoto(index){if(!photos.length)return;photoIndex=(index+photos.length)%photos.length;const photo=photos[photoIndex];mainPhoto.src=photo.src;mainPhoto.alt=photo.title;caption.textContent=photo.title;countLabel.textContent=(photoIndex+1)+' / '+photos.length;[...thumbs.children].forEach((b,i)=>{b.classList.toggle('active',i===photoIndex);b.setAttribute('aria-pressed',String(i===photoIndex))})}
document.querySelector('.gallery-prev').addEventListener('click',()=>showPhoto(photoIndex-1));document.querySelector('.gallery-next').addEventListener('click',()=>showPhoto(photoIndex+1));
document.querySelectorAll('.gallery-view button').forEach(button=>{button.hidden=photos.length<2});
document.querySelector('#galeria').addEventListener('keydown',event=>{if(event.key==='ArrowLeft')showPhoto(photoIndex-1);if(event.key==='ArrowRight')showPhoto(photoIndex+1)});showPhoto(0);

const paymentToggle=document.querySelector('#payment-toggle');
const paymentInfo=document.querySelector('#payment-info');
paymentToggle.addEventListener('click',()=>{
 const expanded=paymentToggle.getAttribute('aria-expanded')==='true';
 paymentToggle.setAttribute('aria-expanded',String(!expanded));
 paymentInfo.hidden=expanded;
});
