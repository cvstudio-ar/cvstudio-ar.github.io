(function(){
"use strict";
const defaults={
  brand:"GESFIP",
  eyebrow:"Empresa de seguridad privada",
  heroLine1:"Tu seguridad es",
  heroLine2:"nuestra prioridad",
  heroDescription:"Vigilancia, protección de personas y bienes, control de accesos y prevención de riesgos. Soluciones adaptadas a empresas, establecimientos, barrios privados y eventos.",
  heroImage:"./assets/equipo-ejecutivo.svg",
  aboutImage:"./assets/patrullaje-industrial.svg",
  teamImage:"./assets/qr.svg",
  gold:"#eeb24c", dark:"#070d13",
  aboutTitle:"Compromiso, experiencia y confianza",
  teamDescription:"GESFIP está liderada por personal militar retirado del Ejército Argentino y oficiales retirados de la Policía Federal Argentina. El equipo combina formación en seguridad pública, protección de personas, análisis de riesgos e instructores que desarrollan capacitaciones periódicas.",
  history:"Fundada en Santa Fe en 2024, GESFIP trabaja para consolidar una propuesta de seguridad basada en la experiencia operativa, la capacitación y la mejora continua de sus servicios.",
  about:"GESFIP es una empresa santafesina fundada en 2024 y especializada en seguridad física y protección de personas y bienes. Desarrollamos soluciones a medida, con prevención, planificación y atención responsable.",
  mission:"Proteger a las personas y sus bienes mediante servicios confiables, personal capacitado y procedimientos orientados a anticipar riesgos y responder de manera efectiva.",
  phone:"3424762303",
  secondaryPhone:"3426510714",
  instagram:"gesfip.samsbert",
  email:"gesfip.samsbert@gmail.com",
  address:"Santa Fe, Argentina",
  services:[
    {
      "title": "Seguridad Física",
      "image": "./assets/accesos.svg",
      "glyph": "⬡",
      "short": "Vigilancia preventiva, control de objetivos y protección de bienes.",
      "detail": "Brindamos vigilancia y control en instalaciones, propiedades y objetivos específicos, con personal capacitado para prevenir incidentes, controlar accesos y ejecutar recorridos. Los procedimientos se adecuan a los riesgos y necesidades de cada servicio."
    },
    {
      "title": "Monitoreo",
      "image": "./assets/qr.svg",
      "glyph": "◉",
      "short": "Supervisión de sistemas, cámaras y registros operativos.",
      "detail": "Monitoreamos y supervisamos sistemas de seguridad para detectar incidencias y verificar el cumplimiento de protocolos. Según el servicio, complementamos la tarea con controles de vigiladores mediante puntos QR y registros para generar informes operativos."
    },
    {
      "title": "Gestión de Riesgos",
      "image": "./assets/mercaderia.svg",
      "glyph": "▥",
      "short": "Análisis de vulnerabilidades y planificación preventiva.",
      "detail": "Realizamos análisis de riesgos para identificar amenazas, reconocer puntos vulnerables y diseñar medidas de prevención. Asesoramos en procedimientos, planificación y organización de sistemas de seguridad ajustados a personas, empresas y bienes."
    },
    {
      "title": "Custodia de Personas",
      "image": "./assets/hotel.svg",
      "glyph": "♢",
      "short": "Acompañamiento, escoltas y protección personal o VIP.",
      "detail": "Ofrecemos custodia de personas, protección de perfiles que requieren seguridad especial y acompañamiento en desplazamientos. Cada servicio se planifica conforme al entorno, la movilidad, las necesidades del cliente y los riesgos identificados."
    },
    {
      "title": "Seguridad para Empresas",
      "image": "./assets/accesos.svg",
      "glyph": "▣",
      "short": "Vigilancia de instalaciones, ingresos y mercadería.",
      "detail": "Protegemos establecimientos comerciales e industriales mediante control de entradas y salidas, recorridos perimetrales, verificación de vehículos y documentación, y prevención de incidentes. Los registros facilitan la supervisión y el seguimiento de cada operación."
    },
    {
      "title": "Country y Barrios",
      "image": "./assets/country.svg",
      "glyph": "⌂",
      "short": "Control de accesos y recorridos en barrios privados.",
      "detail": "Prestamos vigilancia para barrios y urbanizaciones privadas con verificación de visitantes, supervisión de accesos, patrullaje y protección de personas y propiedades. El esquema operativo se adapta a las características de cada complejo."
    },
    {
      "title": "Silos y Campos",
      "image": "./assets/rural.svg",
      "glyph": "⌁",
      "short": "Seguridad rural, perímetros y objetivos productivos.",
      "detail": "Desarrollamos recorridos y controles en campos, silos y establecimientos rurales para proteger instalaciones, bienes y mercadería. Planificamos patrullajes por límites y puntos estratégicos según las condiciones de cada establecimiento."
    },
    {
      "title": "Hoteles y Eventos",
      "image": "./assets/hotel.svg",
      "glyph": "✧",
      "short": "Prevención y control para huéspedes, reuniones y eventos.",
      "detail": "Organizamos servicios de vigilancia y control de accesos para hoteles, encuentros empresariales y eventos. El objetivo es proteger a huéspedes, trabajadores y asistentes con presencia preventiva y procedimientos adecuados al lugar."
    }
  ],  operations:["Recorridos perimetrales","Patrulla por límites","Control con QR","Control de ingresos","Control de mercadería con documentación cruzada"],
  operationDetails:[
    "Rondas preventivas en perímetros de establecimientos, campos e industrias. Recorridos planificados y detección de situaciones que requieran intervención.",
    "Supervisión de límites, sectores sensibles y puntos de control con patrullaje adaptado a cada predio.",
    "Registro de rondas mediante lectura de códigos QR en puntos estratégicos, con información trazable e informes de seguimiento.",
    "Verificación de personas, visitantes, proveedores y vehículos. Control documentado de entradas y salidas.",
    "Control de cargas y descargas mediante cotejo de remitos, registros y documentación de mercadería."
  ],
  operationImages:[
    "./assets/rural.svg",
    "./assets/patrullaje-industrial.svg",
    "./assets/qr.svg",
    "./assets/hotel.svg",
    "./assets/mercaderia.svg"
  ]
};
const KEY="gesfip-demo-config-v1";
const clone=()=>JSON.parse(JSON.stringify(defaults));
function read(){
  let saved={};
  try{saved=JSON.parse(localStorage.getItem(KEY)||"{}")||{}}catch{}
  // Migrate the previous stock photograph and the incorrect URL supplied during setup.
  // Keep valid custom images and all other administrator settings intact.
  if(typeof saved.heroImage==='string' && (
    saved.heroImage.includes('/photos/36753422/') ||
    saved.heroImage.includes('/demo/gesfip/assets/gesfip-hero-approved.webp')
  )) saved.heroImage='./hero-aprobada.svg';
  // Actualizar únicamente la imagen de ejemplo anterior; conservar imágenes personalizadas del administrador.
  if(saved.heroImage==='./hero-aprobada.svg')saved.heroImage='./assets/equipo-ejecutivo.svg';
  if(['./assets/accesos.svg','./assets/equipo-ejecutivo.svg'].includes(saved.aboutImage))saved.aboutImage='./assets/patrullaje-industrial.svg';
  if(Array.isArray(saved.operationImages)&&saved.operationImages[1]==='./assets/accesos.svg')
    saved.operationImages[1]='./assets/patrullaje-industrial.svg';
  const data={...clone(),...saved};
  if(!Array.isArray(data.services)||data.services.length===0)data.services=clone().services;
  const baseServices=clone().services;
  data.services=data.services.map((service,index)=>({
    ...(baseServices[index]||{}),...service,
    image: typeof service.image==='string'&&service.image ? service.image : (baseServices[index]?.image||'')
  }));
  if(!Array.isArray(data.operations))data.operations=clone().operations;
  if(!Array.isArray(data.operationDetails)||data.operationDetails.length!==5)data.operationDetails=clone().operationDetails;
  if(!Array.isArray(data.operationImages)||data.operationImages.length!==5)
    data.operationImages=clone().operationImages;
  return data;
}
function save(data){localStorage.setItem(KEY,JSON.stringify(data))}
function reset(){localStorage.removeItem(KEY)}
const localMode=()=>location.hostname==='localhost'||location.hostname==='127.0.0.1'||location.pathname.startsWith('/demo/gesfip/');
async function load(){
  if(localMode())return read();
  try{
    const response=await fetch(new URL('./api/site-config',new URL('./',location.href)),{cache:'no-store'});
    if(response.ok){
      const body=await response.json();
      if(body?.data && typeof body.data==='object')return {...clone(),...body.data};
    }
  }catch{}
  return clone();
}
async function loadAdmin(){
  if(localMode())return read();
  const response=await fetch(new URL('../api/admin/config',location.href),{cache:'no-store'});
  if(!response.ok)throw new Error('Acceso administrativo no configurado ('+response.status+').');
  const body=await response.json();
  return body?.data ? {...clone(),...body.data} : clone();
}
async function persist(data){
  if(localMode()){save(data);return}
  const response=await fetch(new URL('../api/admin/config',location.href),{
    method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),cache:'no-store'
  });
  const result=await response.json().catch(()=>({error:'Error en el servicio de configuración.'}));
  if(!response.ok || !result.ok)throw new Error(result.error||'No se pudo guardar');
}
window.GESFIPDemo={defaults:clone(),read,save,reset,load,loadAdmin,persist,localMode};
})();