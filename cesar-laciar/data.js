(function(){
'use strict';
const KEY='cvstudio_cesar_laciar_demo_v1';
const initial={
 business:'Estudio Laciar',professional:'Dr. César Laciar',profession:'Abogado',
 kicker:'ESTUDIO JURÍDICO',headline:'Asesoramiento legal con compromiso y trayectoria',
 intro:'Soluciones jurídicas claras, confiables y personalizadas para vos, tu familia o tu empresa.',
 aboutTitle:'Asesoramiento cercano y profesional',
 about:'Acompañamiento jurídico con atención personalizada. Compartinos tu consulta para coordinar una entrevista.',
 journeyTitle:'Trayectoria y confianza',journeyText:'Experiencia profesional, compromiso, atención y confidencialidad. Esta sección se completará con los antecedentes que nos indique el estudio.',
 location:'P. Noguera 831',city:'San Antonio de Padua, Buenos Aires',hours:'Horarios de atención a confirmar',
 phone:'+54 9 11 3826-7865',whatsapp:'5491138267865',email:'',instagram:'https://www.instagram.com/cesarlaciar_abog/',facebook:'',linkedin:'',maps:'',
 palette:'navy',cover:'assets/cesar-referencia.webp',
 services:[
 {name:'Civil y Comercial',description:'Consultas, contratos y asuntos civiles y comerciales.'},
 {name:'Penal',description:'Orientación jurídica y consultas en materia penal.'},
 {name:'Laboral',description:'Asesoramiento sobre conflictos y cuestiones laborales.'},
 {name:'Familia',description:'Consultas sobre asuntos y relaciones familiares.'},
 {name:'Otros asuntos',description:'Consultá por otras cuestiones jurídicas.'}
 ]
};
function getData(){try{const value=JSON.parse(localStorage.getItem(KEY));if(value&&typeof value==='object')return {...initial,...value,services:Array.isArray(value.services)?value.services:initial.services}}catch{}return structuredClone(initial)}
function saveData(value){localStorage.setItem(KEY,JSON.stringify(value));}
function clean(text){return String(text??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function safeUrl(url){try{const parsed=new URL(url);return ['https:','http:'].includes(parsed.protocol)?parsed.href:'#'}catch{return '#'}}
function waUrl(number,text){const digits=String(number||'').replace(/\D/g,'');return digits?'https://wa.me/'+digits+'?text='+encodeURIComponent(text):'#contacto'}
window.LACIAR={initial,getData,saveData,clean,safeUrl,waUrl,KEY};
})();
