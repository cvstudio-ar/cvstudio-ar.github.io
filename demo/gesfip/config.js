(function(){
"use strict";
const defaults={
  brand:"GESFIP",
  eyebrow:"Empresa de seguridad privada",
  heroLine1:"Tu seguridad es",
  heroLine2:"nuestra prioridad",
  heroDescription:"Soluciones profesionales de seguridad física y de personas, con personal capacitado, control y prevención.",
  heroImage:"./hero-aprobada.svg",
  gold:"#eeb24c", dark:"#070d13",
  aboutTitle:"Compromiso, experiencia y confianza",
  about:"Somos una empresa de seguridad comprometida con la protección de las personas y sus bienes. Diseñamos servicios a medida, con profesionales experimentados y un enfoque preventivo.",
  mission:"Proteger y salvaguardar la integridad de las personas y sus bienes, proporcionando servicios de seguridad confiables y una respuesta efectiva.",
  phone:"3424762303",
  email:"gesfip.samsbert@gmail.com",
  address:"Santa Fe, Argentina",
  services:[
    {title:"Seguridad Física",glyph:"⬡",short:"Vigilancia, prevención y protección de bienes e instalaciones.",detail:"Servicios de vigilancia y monitoreo, protección de personas e instalaciones y control de objetivos. Incluye presencia operativa, vigilancia de bienes y supervisión de medidas de prevención."},
    {title:"Monitoreo",glyph:"◉",short:"Vigilancia y supervisión de sistemas de seguridad.",detail:"Monitoreo de sistemas de seguridad para detectar incidentes, evaluar posibles riesgos y supervisar el cumplimiento de los procedimientos operativos."},
    {title:"Gestión de Riesgos",glyph:"▥",short:"Análisis, planificación y protección integral.",detail:"Evaluación de amenazas y vulnerabilidades, asesoramiento especializado y planificación de estrategias de prevención para personas, empresas y propiedades."},
    {title:"Custodia de Personas",glyph:"♢",short:"Protección, acompañamiento y escolta.",detail:"Protección personal, acompañamiento y escolta en desplazamientos y servicios de custodia VIP según las necesidades del cliente."},
    {title:"Seguridad para Empresas",glyph:"▣",short:"Control de accesos y vigilancia de instalaciones.",detail:"Seguridad en establecimientos empresariales e industriales, control de ingresos, rondas perimetrales y registro de operaciones."},
    {title:"Country y Barrios",glyph:"⌂",short:"Prevención y control en urbanizaciones privadas.",detail:"Vigilancia de accesos, controles de rondas y protección de bienes y residentes en countries y barrios privados."},
    {title:"Silos y Campos",glyph:"⌁",short:"Protección de instalaciones rurales y productivas.",detail:"Recorridos perimetrales, vigilancia de silos y campos y procedimientos para control de mercadería e ingresos."},
    {title:"Hoteles y Eventos",glyph:"✧",short:"Seguridad operativa para huéspedes y asistentes.",detail:"Control de acceso y presencia preventiva en hoteles, eventos corporativos y reuniones, adaptados al entorno."}
  ],
  operations:["Recorridos perimetrales","Patrulla por límites","Control con QR","Control de ingresos","Control de mercadería con documentación cruzada"]
};
const KEY="gesfip-demo-config-v1";
const clone=()=>JSON.parse(JSON.stringify(defaults));
function read(){
  let saved={};
  try{saved=JSON.parse(localStorage.getItem(KEY)||"{}")||{}}catch{}
  if(typeof saved.heroImage==='string' && saved.heroImage.includes('/photos/36753422/')) saved.heroImage='./hero-aprobada.svg';
  const data={...clone(),...saved};
  if(!Array.isArray(data.services)||data.services.length===0)data.services=clone().services;
  if(!Array.isArray(data.operations))data.operations=clone().operations;
  return data;
}
function save(data){localStorage.setItem(KEY,JSON.stringify(data))}
function reset(){localStorage.removeItem(KEY)}
window.GESFIPDemo={defaults:clone(),read,save,reset};
})();