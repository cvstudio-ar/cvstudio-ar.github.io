(() => {
  'use strict';
  const KEY = 'cvstudio_eugenia_ibanez_demo_v1';
  const initial = {
    business: 'Eugenia Ibañez Esmoris & Asociados',
    professional: 'Eugenia Ibañez Esmoris',
    profession: 'Estudio jurídico integral',
    kicker: 'ESTUDIO JURÍDICO INTEGRAL',
    headline: 'Claridad para tomar decisiones.',
    intro: 'Asesoramiento jurídico personalizado.',
    aboutTitle: 'Asesoramiento cercano y profesional.',
    about: 'Somos un estudio jurídico integral. Te acompañamos con atención personalizada para entender tu situación y conversar sobre los próximos pasos.',
    journeyTitle: 'Trayectoria profesional',
    journeyText: 'Abogada, Universidad de Buenos Aires.',
    location: 'Juan Agustín Maza 185',
    city: 'San Antonio de Padua, Buenos Aires',
    hours: 'Atención presencial y virtual · GBA y CABA',
    phone: '+54 9 11 3888-1265',
    whatsapp: '5491138881265',
    email: '',
    instagram: 'https://www.instagram.com/eibanez.abogada/',
    facebook: '', linkedin: '', maps: '',
    palette: 'navy',
    cover: 'assets/portada.webp',
    focus: '78',
    services: [
      {name: 'Familia', description: 'Orientación en divorcios, cuestiones familiares y autorizaciones de viaje.'},
      {name: 'Sucesiones', description: 'Asesoramiento sobre trámites sucesorios y bienes familiares.'},
      {name: 'Accidentes de tránsito', description: 'Consultas sobre reclamos vinculados con siniestros viales.'},
      {name: 'Derecho laboral', description: 'Orientación ante despidos y otras consultas laborales.'}
    ]
  };

  function safeUrl(value) {
    try {
      const parsed = new URL(value);
      return parsed.protocol === 'https:' ? parsed.href : '';
    } catch {
      return '';
    }
  }

  function normalize(value) {
    const data = structuredClone(initial);
    if (!value || typeof value !== 'object' || Array.isArray(value)) return data;
    for (const field of Object.keys(initial)) {
      if (typeof value[field] === 'string' && field !== 'cover') data[field] = value[field].trim().slice(0, 1800);
    }
    if (typeof value.cover === 'string' && value.cover.length <= 3000000 &&
        /^data:image\/(webp|jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(value.cover)) data.cover = value.cover;
    data.palette = data.palette === 'wine' ? 'wine' : 'navy';
    data.focus = data.focus !== '' && Number.isFinite(Number(data.focus))
      ? String(Math.max(0, Math.min(100, Number(data.focus)))) : initial.focus;
    data.whatsapp = data.whatsapp.replace(/\D/g, '').slice(0, 15);
    if (Array.isArray(value.services)) {
      const services = value.services.slice(0, 20).flatMap(service => {
        if (typeof service?.name !== 'string' || !service.name.trim()) return [];
        return [{name: service.name.trim().slice(0, 65),
          description: typeof service.description === 'string' ? service.description.trim().slice(0, 280) : ''}];
      });
      if (services.length) data.services = services;
    }
    return data;
  }

  function getData() {
    try {
      return normalize(JSON.parse(localStorage.getItem(KEY)));
    } catch {
      return normalize(null);
    }
  }

  function saveData(data) {
    localStorage.setItem(KEY, JSON.stringify(normalize(data)));
  }

  function clean(text) {
    return String(text ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function waUrl(number, message) {
    return /^\d{8,15}$/.test(number) ? 'https://wa.me/' + number + '?text=' + encodeURIComponent(message) : '';
  }

  window.EUGENIA = {initial, normalize, getData, saveData, clean, safeUrl, waUrl};
})();
