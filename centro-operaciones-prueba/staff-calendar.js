/* CVStudio · Calendario de colaborador: lectura mínima y cumpleaños propio. */
(() => {
  'use strict';
  const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const names=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const week=['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
  const localToday=()=>{
    const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'America/Argentina/Buenos_Aires',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).filter(p=>p.type!=='literal').map(p=>[p.type,Number(p.value)]));
    return {year:parts.year,month:parts.month-1,day:parts.day};
  };
  const today=localToday();
  let calendarMonth=new Date(today.year,today.month,1);
  let campaigns=null;
  let loading=false;
  let message='';
  let lastFetched=0;
  let attempted=false;
  const owner=()=>window.CVStudioAccess?.owner===true;
  const current=()=>window.CVStudioAccess?.collaborator;
  const allowed=()=>Boolean(window.CVStudioAccess?.ready&&!owner()&&window.CVStudioAccess?.canModule('calendario'));

  async function refresh(){
    if(!allowed()||loading)return;
    loading=true;
    attempted=true;
    message='';
    try{
      const client=window.cvstudioSupabase;
      if(!client)throw new Error('Supabase no está disponible.');
      const {data,error}=await client.rpc('cvstudio_staff_campaign_preview');
      if(error)throw error;
      campaigns=Array.isArray(data)?data.filter(x=>x&&typeof x.title==='string').map(x=>({title:String(x.title).slice(0,120)})):[];
      lastFetched=Date.now();
    }catch(error){
      message='No se pudieron consultar las campañas. Reintentá la conexión.';
      campaigns=null;
      console.error('[CVStudio calendario colaborador]',error);
    }finally{
      loading=false;
      const root=document.getElementById('appMain');
      if(['calendario','inicio'].includes(root?.dataset.module)&&allowed())window.openModule?.(root.dataset.module);
    }
  }

  function render(){
    if(!allowed())return '<section class="panel"><h2>Calendario restringido</h2></section>';
    if(campaigns===null&&!loading&&!attempted)queueMicrotask(refresh);
    const person=current()||{};
    const birth=String(person.birthDate||'').match(/^\d{4}-(\d{2})-(\d{2})/);
    const birthday=birth?{month:Number(birth[1])-1,day:Number(birth[2])}:null;
    const validBirthday=birthday&&birthday.month>=0&&birthday.month<=11&&birthday.day>=1&&birthday.day<=31;
    const upcoming=validBirthday
      ?new Date(today.year+(new Date(today.year,birthday.month,birthday.day)<new Date(today.year,today.month,today.day)?1:0),birthday.month,birthday.day)
      :null;
    const year=calendarMonth.getFullYear(),month=calendarMonth.getMonth();
    const first=new Date(year,month,1),last=new Date(year,month+1,0).getDate();
    const offset=(first.getDay()+6)%7;
    let cells=Array.from({length:offset},()=>'<span class="staff-calendar-day is-empty"></span>').join('');
    for(let day=1;day<=last;day++){
      const todayCell=year===today.year&&month===today.month&&day===today.day;
      const birthdayCell=Boolean(validBirthday&&month===birthday.month&&day===birthday.day);
      cells+='<span class="staff-calendar-day'+(todayCell?' is-today':'')+(birthdayCell?' is-birthday':'')+'"><b>'+day+'</b>'+(birthdayCell?'<i title="Tu cumpleaños">🎂</i>':'')+'</span>';
    }
    const campaignBox=loading
      ?'<p class="staff-calendar-muted">Consultando campañas vigentes…</p>'
      :campaigns===null
        ?'<p class="staff-calendar-muted">'+esc(message||'Información no disponible.')+'</p>'
        :campaigns.length
          ?campaigns.map(c=>'<div class="staff-calendar-campaign"><span class="staff-active-dot"></span><strong>'+esc(c.title)+'</strong><span>Activa</span></div>').join('')
          :'<p class="staff-calendar-muted">No hay campañas vigentes registradas en el Calendario de CVStudio.</p>';
    return '<div class="staff-calendar-dashboard">'+
      '<header class="staff-calendar-hero"><span>CALENDARIO DE COLABORADOR</span><h2>Mi calendario</h2><p>Campañas vigentes de CVStudio y fechas importantes. Sin presupuestos ni información administrativa.</p></header>'+
      '<div class="staff-calendar-layout"><section class="staff-calendar-panel"><div class="staff-calendar-head"><h3>'+names[month].charAt(0).toUpperCase()+names[month].slice(1)+' '+year+'</h3><div><button class="button secondary small" data-staff-cal-nav="prev" aria-label="Mes anterior">‹</button><button class="button secondary small" data-staff-cal-nav="today">Hoy</button><button class="button secondary small" data-staff-cal-nav="next" aria-label="Mes siguiente">›</button></div></div>'+
      '<div class="staff-calendar-grid">'+week.map(x=>'<span class="staff-calendar-week">'+x+'</span>').join('')+cells+'</div><div class="staff-calendar-legend"><span><i></i> Día actual</span><span>🎂 Tu cumpleaños</span></div></section>'+
      '<div class="staff-calendar-aside"><section class="staff-calendar-panel"><h3>Campañas activas</h3><p>Únicamente nombres de campañas vigentes del calendario oficial.</p>'+campaignBox+
      '<button class="button secondary small" type="button" data-staff-cal-refresh '+(loading?'disabled':'')+'>Actualizar campañas</button></section>'+
      '<section class="staff-calendar-panel"><h3>Mi cumpleaños</h3>'+
      (validBirthday?'<div class="staff-calendar-birthday"><span>🎂</span><div><strong>'+birthday.day+' de '+names[birthday.month]+'</strong><small>Próximo: '+new Intl.DateTimeFormat('es-AR',{day:'numeric',month:'long',year:'numeric',timeZone:'America/Argentina/Buenos_Aires'}).format(upcoming)+'</small></div></div>':'<p class="staff-calendar-muted">Todavía no hay una fecha de cumpleaños en tu ficha de colaborador.</p>')+
      '</section></div></div></div>';
  }

  function preview(){
    if(!allowed())return '';
    const birth=String(current()?.birthDate||'').match(/^\d{4}-(\d{2})-(\d{2})/);
    const birthMonth=birth?Number(birth[1])-1:-1;
    const birthDay=birth?Number(birth[2]):0;
    const birthText=birthMonth>=0&&birthMonth<12&&birthDay>0&&birthDay<=31
      ?birthDay+' de '+names[birthMonth]
      :'Sin fecha registrada';
    const campaignsText=loading?'Consultando campañas…'
      :campaigns===null?message||'Campañas sin consultar'
      :campaigns.length?campaigns.map(x=>esc(x.title)).join(' · ')
      :'No hay campañas vigentes registradas';
    return '<div class="staff-home-aside">'+
      '<div class="staff-home-notice"><small>Campañas activas</small><strong>'+campaignsText+'</strong></div>'+
      '<div class="staff-home-notice"><small>Mi cumpleaños</small><strong>🎂 '+esc(birthText)+'</strong></div>'+
      '</div>';
  }

  document.addEventListener('click',event=>{
    const nav=event.target.closest('[data-staff-cal-nav]');
    if(nav){
      event.preventDefault();
      const v=nav.dataset.staffCalNav;
      calendarMonth=v==='today'?new Date(today.year,today.month,1):new Date(calendarMonth.getFullYear(),calendarMonth.getMonth()+(v==='next'?1:-1),1);
      if(allowed())window.openModule?.('calendario');
    }
    if(event.target.closest('[data-staff-cal-refresh]')){event.preventDefault();refresh();}
  });
  document.addEventListener('cvstudio:access-ready',()=>{if(allowed())refresh();});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{if(allowed())refresh();},{once:true});
  else if(allowed())refresh();
  window.CVStudioStaffCalendar={render,refresh,preview};
})();
