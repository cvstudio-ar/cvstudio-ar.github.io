'use strict';
window.PuentesDemo = (() => {
  const key = 'cvstudio-puentes-demo-v1';
  const defaults = { title: 'Protegé tu presente.\nPlanificá tu futuro.', description: 'Tu familia, tu empresa y tus proyectos merecen un plan. Te acompañamos a encontrar la protección y las alternativas de ahorro que se adapten a vos.', whatsapp: '5492994689888', email: 'puentesyasociados@gmail.com', hours: '10:00,11:00,14:00,16:00', video: '', mediaDescription: 'Este espacio permite incorporar los videos de YouTube del estudio, para compartir ideas y explicar cada propuesta.' };
  function sanitize(input) {
    const d = {...defaults};
    if (!input || typeof input !== 'object') return d;
    for (const k of ['title','description','mediaDescription']) if(typeof input[k]==='string' && input[k].trim()) d[k]=input[k].trim().slice(0,k==='title'?120:600);
    const phone = String(input.whatsapp || '').replace(/\D/g,'');
    if (/^\d{10,15}$/.test(phone)) d.whatsapp = phone;
    if (typeof input.email==='string' && /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(input.email)) d.email = input.email.slice(0,254);
    if (typeof input.hours==='string') { const hours=[...new Set(input.hours.split(',').map(s=>s.trim()).filter(s=>/^([01]\d|2[0-3]):[0-5]\d$/.test(s)))].sort(); if(hours.length) d.hours=hours.slice(0,24).join(','); }
    if(typeof input.video==='string' && input.video.trim()) {try {const u = new URL(input.video);if(u.protocol==='https:' && ['youtube.com','www.youtube.com','m.youtube.com','youtu.be'].includes(u.hostname)) d.video=u.href;}catch{}}
    return d;
  }
  function load(){try{return sanitize(JSON.parse(localStorage.getItem(key)));}catch{return {...defaults};}}
  function save(data){const clean=sanitize(data);localStorage.setItem(key,JSON.stringify(clean));return clean;}
  function reset(){localStorage.removeItem(key);return {...defaults};}
  return {key,defaults,load,save,reset,sanitize};
})();
