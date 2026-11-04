'use strict';
window.PuentesDemo = (() => {
  const key = 'cvstudio-puentes-demo-v1';
  const defaults = { title: "Lo que más querés,\nprotegido pase lo que pase.", description: "Tu familia depende de vos. Hablemos de cómo cuidarla si algún día no podés estar, o no podés trabajar.", whatsapp: '5492994689888', email: 'puentesyasociados@gmail.com', hours: '10:00,11:00,14:00,16:00', video: '', images: {hero:'assets/familia-bebe.webp', retirement:'assets/retiro-patagonia.webp', family:'assets/familia-graduacion.webp', active:'assets/retiro-aventura.webp', advisor:'assets/ivan-puentes.webp'}, content:{}, mediaDescription: 'Ideas y explicaciones para entender cómo proteger tu ingreso, construir un ahorro y planificar tu retiro.' };
  function sanitize(input) {
    const d = {...defaults};
    if (!input || typeof input !== 'object') return d;
    for (const k of ['title','description','mediaDescription']) if(typeof input[k]==='string' && input[k].trim()) d[k]=input[k].trim().slice(0,k==='title'?120:600);
    const phone = String(input.whatsapp || '').replace(/\D/g,'');
    if (/^\d{10,15}$/.test(phone)) d.whatsapp = phone;
    if (typeof input.email==='string' && /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(input.email)) d.email = input.email.slice(0,254);
    if (typeof input.hours==='string') { const hours=[...new Set(input.hours.split(',').map(s=>s.trim()).filter(s=>/^([01]\d|2[0-3]):[0-5]\d$/.test(s)))].sort(); if(hours.length) d.hours=hours.slice(0,24).join(','); }
    if(typeof input.video==='string' && input.video.trim()) {try {const u = new URL(input.video);if(u.protocol==='https:' && ['youtube.com','www.youtube.com','m.youtube.com','youtu.be'].includes(u.hostname)) d.video=u.href;}catch{}}
    d.images={...defaults.images};d.content={};
    if(input.images&&typeof input.images==='object')for(const k of Object.keys(defaults.images)){const v=input.images[k];if(typeof v!=='string'||v.length>650000)continue;let safe=/^assets\/[a-z0-9-]+\.webp$/.test(v)||/^data:image\/(webp|jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(v);try{const u=new URL(v);safe=safe||(u.protocol==='https:'&&!u.username&&!u.password);}catch{}if(safe)d.images[k]=v;}
    if(input.content&&typeof input.content==='object')for(const [k,v] of Object.entries(input.content).slice(0,120)){if(/^copy-\d{3}$/.test(k)&&typeof v==='string'&&v.trim())d.content[k]=v.trim().slice(0,1800);}
    return d;
  }
  function load(){try{const saved=JSON.parse(localStorage.getItem(key));if(saved&&saved.title==='Protegé tu presente.\nPlanificá tu futuro.')saved.title=defaults.title;if(saved&&saved.description==='Tu familia, tu empresa y tus proyectos merecen un plan. Te acompañamos a encontrar la protección y las alternativas de ahorro que se adapten a vos.')saved.description=defaults.description;if(saved&&saved.mediaDescription==='Este espacio permite incorporar los videos de YouTube del estudio, para compartir ideas y explicar cada propuesta.')saved.mediaDescription=defaults.mediaDescription;return sanitize(saved);}catch{return {...defaults};}}
  function save(data){const clean=sanitize(data);localStorage.setItem(key,JSON.stringify(clean));return clean;}
  function reset(){localStorage.removeItem(key);return {...defaults};}
  return {key,defaults,load,save,reset,sanitize};
})();
