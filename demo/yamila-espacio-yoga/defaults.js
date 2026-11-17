// Datos de los audios de Yamila. El folleto de muestra no es una oferta vigente ni se publica.
// Horarios exactos, dirección y redes quedan vacíos hasta confirmación.
export const defaults = {
  identity: {
    name: 'Espacio Yoga', claim: 'Salud · Equilibrio · Bienestar',
    heroEyebrow: 'UN ESPACIO PARA VOS',
    heroTitle: 'Un espacio para volver a vos.',
    heroText: 'Un encuentro con tu cuerpo, tu respiración y tu bienestar. Descubrí las clases de yoga y meditación con Yamila, online o presencial.',
    introTitle: 'Tu espacio, tu tiempo, tu yoga.',
    introText: 'Cada práctica es una invitación a escucharte, moverte a tu ritmo y encontrar un momento propio. Hay opciones online y presenciales para que puedas elegir la modalidad que mejor te acompañe.',
    aboutTitle: 'Hola, soy Yamila',
    aboutText: 'Te doy la bienvenida a Espacio Yoga, un espacio dedicado a la práctica, el equilibrio y el bienestar. Escribime para conocer las propuestas y encontrar la clase que mejor se adapte a vos.',
    signoff: 'Tu bienestar también es una forma de cuidarte.',
    benefitTitle: 'Pequeños momentos que hacen bien',
    featuredTitle: 'Yoga desde donde estés',
    featuredText: 'Clases online de yoga terapéutico y yoga en silla. Una propuesta para todas las edades, para practicar sin preocuparte por el viaje.',
    featuredSchedule: 'Clases de una hora, dos veces por semana. Turnos por la mañana o por la tarde.',
    featuredPrice: '', featuredCurrency: 'ARS', featuredPriceNote: 'Valor publicado en el folleto. Consultá vigencia y disponibilidad.',
    featuredVisible: false
  },
  contact: {
    whatsapp: '1168711268', instagram: '', facebook: '', email: '', address: '', mapUrl: '',
    locationText: 'Consultá dónde se realizan las clases presenciales.',
    whatsappText: 'Hola Yamila, vi la web de Espacio Yoga y quisiera consultar por las clases.'
  },
  design: { palette: 'lavanda', logo: '/demo/yamila-espacio-yoga/assets/emblema-yoga.webp', heroImage: '/demo/yamila-espacio-yoga/assets/hero-practica.webp', aboutImage: '', flyerImage: '/demo/yamila-espacio-yoga/assets/folleto-yamila.webp' },
  sections: { services: true, modalities: true, about: true, featured: true, benefits: true, schedules: true, faq: true },
  seo: { title: 'Espacio Yoga | Salud, equilibrio y bienestar', description: 'Clases online y presenciales de yoga en silla, restaurativo, terapéutico y meditación con la profe Yamila.' },
  services: [
    { id:'silla', name:'Yoga en silla', label:'Movete a tu ritmo', description:'Una propuesta que incorpora la silla como apoyo para acompañar la práctica y adaptar los movimientos.', mode:'online y presencial', image:'', visible:true, order:1 },
    { id:'restaurativo', name:'Yoga restaurativo', label:'Una pausa para vos', description:'Una práctica de movimientos suaves, pausas y atención al descanso.', mode:'online y presencial', image:'', visible:true, order:2 },
    { id:'terapeutico', name:'Yoga terapéutico', label:'Práctica consciente', description:'Encuentros que priorizan la atención al cuerpo, la movilidad y el bienestar personal.', mode:'online y presencial', image:'', visible:true, order:3 },
    { id:'meditacion', name:'Meditación', label:'Respirar y conectar', description:'Un espacio para detenerte, acompañar la respiración y cultivar la atención al presente.', mode:'online y presencial', image:'', visible:true, order:4 }
  ],
  classes: [
    {id:'clase-online', title:'Yoga en silla y terapéutico', mode:'Online', duration:'60 minutos', frequency:'2 veces por semana', days:'', time:'Mañana o tarde', price:'', notes:'Consultá cupos y horarios disponibles.', visible:true, order:1},
    {id:'clase-presencial', title:'Clases presenciales', mode:'Presencial', duration:'', frequency:'', days:'', time:'', price:'A consultar', notes:'Consultá ubicación, horarios y disponibilidad.', visible:true, order:2}
  ],
  benefits: [
    { icon:'heart', text:'Regalate un espacio para vos' },
    { icon:'flower', text:'Explorá movimiento y respiración consciente' },
    { icon:'moon', text:'Buscá momentos de calma y descanso' },
    { icon:'sun', text:'Compartí prácticas a tu propio ritmo' }
  ],
  faqs: [
    { question:'¿Hay clases online?', answer:'Sí, Espacio Yoga ofrece clases online. Consultá con Yamila por disponibilidad y acceso.' },
    { question:'¿También hay clases presenciales?', answer:'Sí. La ubicación, los días y los horarios se informan por consulta.' },
    { question:'¿Qué tipos de prácticas se ofrecen?', answer:'Yoga en silla, yoga restaurativo, yoga terapéutico y meditación.' },
    { question:'¿Cómo me inscribo?', answer:'Escribí por WhatsApp para consultar cupos, horarios y cómo sumarte.' }
  ]
};
export const clone = obj => JSON.parse(JSON.stringify(obj));
export function mergeData(base, override) {
  if (!override || typeof override !== 'object') return clone(base);
  const out=clone(base);
  for (const key of Object.keys(base)) {
    if (override[key]===undefined) continue;
    if (Array.isArray(base[key])) out[key]=Array.isArray(override[key])?clone(override[key]):clone(base[key]);
    else if (base[key] && typeof base[key]==='object') out[key]={...base[key],...(override[key]||{})};
    else out[key]=override[key];
  }
  return out;
}