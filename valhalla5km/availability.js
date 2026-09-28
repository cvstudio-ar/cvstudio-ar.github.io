// Calendario público: las noches ocupadas se cargan desde el panel de gestión.
const availabilityClient = supabase.createClient(VALHALLA_SUPABASE_URL, VALHALLA_SUPABASE_KEY);
const cabinAvailability = document.querySelector('#cabin-availability');
const availabilityStatus = document.querySelector('#availability-status');
let occupiedDays = new Set();
let availabilityPublished = false;
let availabilityLoaded = false;
const dayKey = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const occupiedKey = (cabin, date) => `${cabin}:${dayKey(date)}`;
function freeCabins(start, end) {
  const result=[];
  for(let cabin=1;cabin<=4;cabin++) {
    let free=true;
    for(let d=new Date(start);d<end;d.setDate(d.getDate()+1)) {
      if(occupiedDays.has(occupiedKey(cabin,d))) {free=false;break}
    }
    if(free) result.push(cabin);
  }
  return result;
}
function showAvailability() {
  const ready=availabilityLoaded && availabilityPublished;
  availabilityStatus.textContent=!availabilityLoaded?'Consultando disponibilidad…':ready?'Disponibilidad actualizada según las reservas cargadas por el alojamiento.':'Las fechas se confirman por WhatsApp. La disponibilidad en línea aún no está publicada.';
  cabinAvailability.replaceChildren();
  if(!ready) {
    hint.textContent='Elegí ingreso y salida para consultar por WhatsApp.';
    if(arrival&&departure) bookingLink.classList.remove('disabled');
    return;
  }
  if(!arrival||!departure) {
    hint.textContent='Elegí ingreso y salida para ver qué cabañas están disponibles.';
    return;
  }
  const free=freeCabins(arrival,departure);
  for(let cabin=1;cabin<=4;cabin++) {
    const badge=document.createElement('span');
    badge.className=`cabin-badge ${free.includes(cabin)?'free':'busy'}`;
    badge.textContent=`Cabaña ${cabin}: ${free.includes(cabin)?'Disponible':'No disponible'}`;
    cabinAvailability.append(badge);
  }
  if(!free.length) {
    hint.textContent='No hay cabañas disponibles para toda la estadía seleccionada. Probá otras fechas.';
    bookingLink.classList.add('disabled'); bookingLink.setAttribute('aria-disabled','true');
  } else {
    hint.textContent='Disponibilidad según las reservas registradas. El alojamiento confirma la estadía y la tarifa por WhatsApp.';
    const message=`Hola, quisiera consultar por Valhalla 5 km del ${format(arrival)} al ${format(departure)}. Veo disponibles las cabañas ${free.join(', ')}. ¿Podrían confirmarme la reserva y la tarifa?`;
    bookingLink.href=`https://wa.me/5493446570729?text=${encodeURIComponent(message)}`;
    bookingLink.classList.remove('disabled'); bookingLink.removeAttribute('aria-disabled');
  }
}
const originalDrawCalendar=drawCalendar;
drawCalendar=function() {
  originalDrawCalendar();
  if(!availabilityLoaded||!availabilityPublished) return;
  daysGrid.querySelectorAll('button').forEach(button=>{
    const day=Number(button.textContent);
    const date=new Date(shownMonth.getFullYear(),shownMonth.getMonth(),day);
    if(!freeCabins(date,new Date(date.getFullYear(),date.getMonth(),date.getDate()+1)).length) {
      button.classList.add('fully-booked'); button.disabled=true;
      button.setAttribute('aria-label',`${format(date)}: todas las cabañas ocupadas`);
      button.title='Todas las cabañas ocupadas';
    }
  });
};
const originalSelectDate=selectDate;
selectDate=function(date){originalSelectDate(date);showAvailability()};
async function refreshAvailability() {
  const first=dayKey(new Date(today.getFullYear(),today.getMonth(),1));
  const last=dayKey(new Date(today.getFullYear()+2,today.getMonth(),1));
  try {
    const [settings,days]=await Promise.all([
      availabilityClient.from('valhalla_settings').select('availability_published').eq('id','main').single(),
      availabilityClient.from('valhalla_occupied_days').select('cabin_id,occupied_on').gte('occupied_on',first).lt('occupied_on',last)
    ]);
    if(settings.error||days.error) throw settings.error||days.error;
    availabilityPublished=settings.data.availability_published;
    occupiedDays=new Set(days.data.map(row=>`${row.cabin_id}:${row.occupied_on}`));
    availabilityLoaded=true;
  } catch(error) {
    console.error('Disponibilidad:',error);
    availabilityLoaded=false;
  }
  drawCalendar(); showAvailability();
}
document.querySelector('[data-open="ubicacion"]').addEventListener('click',refreshAvailability);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshAvailability()});
setInterval(()=>{if(!document.hidden)refreshAvailability()},60000);
refreshAvailability();
