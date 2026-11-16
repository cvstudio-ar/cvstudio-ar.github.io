(function(){
"use strict";
const defaults={
  brand:"GESFIP",
  eyebrow:"Empresa de seguridad privada",
  heroLine1:"Tu seguridad es",
  heroLine2:"nuestra prioridad",
  heroDescription:"Soluciones profesionales de seguridad física y de personas, con personal capacitado, control y prevención.",
  heroImage:"./hero-aprobada.svg",
  aboutImage:"./assets/equipo-ejecutivo.svg",
  teamImage:"./assets/qr.svg",
  gold:"#eeb24c", dark:"#070d13",
  aboutTitle:"Compromiso, experiencia y confianza",
  about:"Somos una empresa de seguridad comprometida con la protección de las personas y sus bienes. Diseñamos servicios a medida, con profesionales experimentados y un enfoque preventivo.",
  mission:"Proteger y salvaguardar la integridad de las personas y sus bienes, proporcionando servicios de seguridad confiables y una respuesta efectiva.",
  phone:"3424762303",
  email:"gesfip.samsbert@gmail.com",
  address:"Santa Fe, Argentina",
  services:[
    {title:"Seguridad Física",image:"./assets/accesos.svg",glyph:"⬡",short:"Vigilancia, prevención y protección de bienes e instalaciones.",detail:"Servicios de vigilancia y monitoreo, protección de personas e instalaciones y control de objetivos. Incluye presencia operativa, vigilancia de bienes y supervisión de medidas de prevención."},
    {title:"Monitoreo",image:"./assets/qr.svg",glyph:"◉",short:"Vigilancia y supervisión de sistemas de seguridad.",detail:"Monitoreo de sistemas de seguridad para detectar incidentes, evaluar posibles riesgos y supervisar el cumplimiento de los procedimientos operativos."},
    {title:"Gestión de Riesgos",image:"./assets/mercaderia.svg",glyph:"▥",short:"Análisis, planificación y protección integral.",detail:"Evaluación de amenazas y vulnerabilidades, asesoramiento especializado y planificación de estrategias de prevención para personas, empresas y propiedades."},
    {title:"Custodia de Personas",image:"./assets/hotel.svg",glyph:"♢",short:"Protección, acompañamiento y escolta.",detail:"Protección personal, acompañamiento y escolta en desplazamientos y servicios de custodia VIP según las necesidades del cliente."},
    {title:"Seguridad para Empresas",image:"./assets/accesos.svg",glyph:"▣",short:"Control de accesos y vigilancia de instalaciones.",detail:"Seguridad en establecimientos empresariales e industriales, control de ingresos, rondas perimetrales y registro de operaciones."},
    {title:"Country y Barrios",image:"./assets/country.svg",glyph:"⌂",short:"Prevención y control en urbanizaciones privadas.",detail:"Vigilancia de accesos, controles de rondas y protección de bienes y residentes en countries y barrios privados."},
    {title:"Silos y Campos",image:"./assets/rural.svg",glyph:"⌁",short:"Protección de instalaciones rurales y productivas.",detail:"Recorridos perimetrales, vigilancia de silos y campos y procedimientos para control de mercadería e ingresos."},
    {title:"Hoteles y Eventos",image:"./assets/hotel.svg",glyph:"✧",short:"Seguridad operativa para huéspedes y asistentes.",detail:"Control de acceso y presencia preventiva en hoteles, eventos corporativos y reuniones, adaptados al entorno."}
  ],
  operations:["Recorridos perimetrales","Patrulla por límites","Control con QR","Control de ingresos","Control de mercadería con documentación cruzada"],
  operationImages:[
    "./assets/rural.svg",
    "./assets/accesos.svg",
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
  if(saved.aboutImage==='./assets/accesos.svg')saved.aboutImage='./assets/equipo-ejecutivo.svg';
  const data={...clone(),...saved};
  if(!Array.isArray(data.services)||data.services.length===0)data.services=clone().services;
  const baseServices=clone().services;
  data.services=data.services.map((service,index)=>({
    ...(baseServices[index]||{}),...service,
    image: typeof service.image==='string'&&service.image ? service.image : (baseServices[index]?.image||'')
  }));
  if(!Array.isArray(data.operations))data.operations=clone().operations;
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