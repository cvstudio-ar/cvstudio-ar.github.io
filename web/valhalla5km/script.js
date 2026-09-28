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

// Las tres secciones se abren sin desplazar la portada.
document.querySelectorAll('[data-open]').forEach(button=>button.addEventListener('click',()=>document.getElementById(button.dataset.open).showModal()));
document.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>button.closest('dialog').close()));
document.querySelectorAll('[data-switch]').forEach(button=>button.addEventListener('click',()=>{button.closest('dialog').close();document.getElementById(button.dataset.switch).showModal()}));
document.querySelectorAll('dialog').forEach(panel=>panel.addEventListener('click',event=>{if(event.target===panel)panel.close()}));
const photos=[['01-exterior.webp','Exterior de las cabañas'],['02-cabana-glamping.webp','Rincón de descanso al atardecer'],['03-cabana-parrilla.webp','Cabaña con parrilla'],['04-bano.webp','Baño de la cabaña'],['05-pileta.webp','Pileta iluminada por la noche'],['06-cocina.webp','Cocina equipada'],['07-cabana-interior.webp','Interior de la cabaña'],['08-cocina-detalle.webp','Detalles de la cocina'],['09-jardin.webp','Espacio para compartir en el jardín'],['10-living.webp','Otra vista del interior']];
const mainPhoto=document.querySelector('#gallery-main'),caption=document.querySelector('#gallery-caption'),countLabel=document.querySelector('#gallery-count'),thumbs=document.querySelector('#gallery-thumbs');let photoIndex=0;
photos.forEach(([file,title],index)=>{const b=document.createElement('button');b.type='button';b.setAttribute('aria-label',`Ver foto ${index+1}: ${title}`);const img=document.createElement('img');img.src=`assets/fotos/${file}`;img.alt='';img.loading='lazy';b.append(img);b.addEventListener('click',()=>showPhoto(index));thumbs.append(b)});
function showPhoto(index){photoIndex=(index+photos.length)%photos.length;const [file,title]=photos[photoIndex];mainPhoto.src=`assets/fotos/${file}`;mainPhoto.alt=title;caption.textContent=title;countLabel.textContent=`${photoIndex+1} / ${photos.length}`;[...thumbs.children].forEach((b,i)=>{b.classList.toggle('active',i===photoIndex);b.setAttribute('aria-pressed',String(i===photoIndex))})}
document.querySelector('.gallery-prev').addEventListener('click',()=>showPhoto(photoIndex-1));document.querySelector('.gallery-next').addEventListener('click',()=>showPhoto(photoIndex+1));document.querySelector('#galeria').addEventListener('keydown',e=>{if(e.key==='ArrowLeft')showPhoto(photoIndex-1);if(e.key==='ArrowRight')showPhoto(photoIndex+1)});showPhoto(0);
