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
  }else{bookingLink.href='#fechas';bookingLink.classList.add('disabled');bookingLink.setAttribute('aria-disabled','true')}
  drawCalendar();
}
previous.addEventListener('click',()=>{shownMonth=new Date(shownMonth.getFullYear(),shownMonth.getMonth()-1,1);drawCalendar()});
next.addEventListener('click',()=>{shownMonth=new Date(shownMonth.getFullYear(),shownMonth.getMonth()+1,1);drawCalendar()});
bookingLink.addEventListener('click',event=>{if(bookingLink.getAttribute('aria-disabled')==='true')event.preventDefault()});
drawCalendar();
