/* Alma Market | Demo pública de CVStudio. Sin claves ni backend compartido. */
(() => {
  'use strict';
  const KEY = 'cvstudio_alma_market_demo_v1';
  const defaults = {
    name: 'Alma Market',
    tagline: 'Tu almacén saludable & wellness',
    eyebrow: 'TIENDA NATURAL · SAN ISIDRO',
    heroTitle: 'Lo natural tiene otro sabor.',
    heroAccent: 'Elegí sentirte bien.',
    heroDescription: 'Un lugar para descubrir alimentos ricos, infusiones, productos de cuidado personal y pequeños rituales que hacen bien.',
    heroButton: 'Explorar productos',
    heroImage: '',
    logoImage: '',
    aboutTitle: 'Un poquito de alma en cada elección.',
    aboutText: 'En Alma Market creemos que alimentarse bien también puede ser simple, rico y disfrutable. Reunimos propuestas naturales, snacks, infusiones y productos de bienestar para incorporar a tu día a día.',
    aboutImage: '',
    instagram: 'https://www.instagram.com/almamarket.ar/',
    whatsapp: 'https://wa.me/message/ODU247JWJPHWN1',
    address: 'Alsina 132, San Isidro, Buenos Aires',
    hours: 'Consultanos por los horarios de atención',
    delivery: 'Envíos disponibles · Consultanos por cobertura',
    phone: '',
    accent: '#E96D50',
    forest: '#285044',
    cream: '#FFF9F1',
    products: [
      {id:'p01',name:'Yerba Mate Propósito · Moving',category:'Yerbas e infusiones',description:'Yerba mate funcional para acompañar tus momentos.',badge:'Rituales de cada día',price:'Consultar',tile:0,image:'',visible:true},
      {id:'p02',name:'Yerba Mate Propósito · Focus',category:'Yerbas e infusiones',description:'Una alternativa distinta para quienes disfrutan el mate.',badge:'Elegidos Alma',price:'Consultar',tile:0,image:'',visible:true},
      {id:'p03',name:'Yerba Mate Propósito · Relax',category:'Yerbas e infusiones',description:'Sabores para disfrutar de una pausa.',badge:'Momento relax',price:'Consultar',tile:0,image:'',visible:true},
      {id:'p04',name:'Set de cuidado natural',category:'Cuidado personal',description:'Accesorios y productos para mimarte de manera consciente.',badge:'Regalá bienestar',price:'Consultar',tile:1,image:'',visible:true},
      {id:'p05',name:'Cosmética natural · AguaCalma',category:'Cuidado personal',description:'Ideas de autocuidado: shampoo sólido, colonia y cuidado capilar.',badge:'Detalles que suman',price:'Consultar',tile:2,image:'',visible:true},
      {id:'p06',name:'Infusiones Tenki Patagonia',category:'Yerbas e infusiones',description:'Variedades de té para transformar la pausa en un ritual.',badge:'Infusiones',price:'Consultar',tile:4,image:'',visible:true},
      {id:'p07',name:'Tés e infusiones de autor',category:'Yerbas e infusiones',description:'Una selección de sabores, aromas y blends.',badge:'Momento té',price:'Consultar',tile:5,image:'',visible:true},
      {id:'p08',name:'Barras CRUDDA · Avellanas',category:'Snacks saludables',description:'Snack con chocolate y avellanas para llevar.',badge:'Algo rico',price:'Consultar',tile:8,image:'',visible:true},
      {id:'p09',name:'Barras CRUDDA · Coco',category:'Snacks saludables',description:'Una opción práctica para una pausa dulce.',badge:'Para llevar',price:'Consultar',tile:9,image:'',visible:true},
      {id:'p10',name:'Barras CRUDDA · Banana Toffee',category:'Snacks saludables',description:'Barrita sabor banana y toffee.',badge:'Snack favorito',price:'Consultar',tile:10,image:'',visible:true},
      {id:'p11',name:'Regalos con intención',category:'Regalos y bienestar',description:'Combinaciones de productos para regalar bienestar.',badge:'Ideas para regalar',price:'Consultar',tile:3,image:'',visible:true},
      {id:'p12',name:'Productos del local',category:'Regalos y bienestar',description:'Conocé nuestra selección en el almacén de San Isidro.',badge:'En nuestro local',price:'Consultar',tile:11,image:'',visible:true}
    ]
  };
  const clone=v=>JSON.parse(JSON.stringify(v));
  const cleanString=(v,max=450)=>String(v??'').trim().slice(0,max);
  function url(v,def=''){
    try{const u=new URL(String(v||''));return u.protocol==='https:'?u.href:def;}
    catch{return def;}
  }
  function image(v){
    if(typeof v!=='string')return '';
    return /^data:image\/(?:webp|jpeg|png);base64,[a-z0-9+/=]+$/i.test(v)&&v.length<900000?v:'';
  }
  function normalize(input){
    const d=clone(defaults);
    if(!input||typeof input!=='object'||Array.isArray(input))return d;
    for(const k of ['name','tagline','eyebrow','heroTitle','heroAccent','heroDescription','heroButton','aboutTitle','aboutText','address','hours','delivery','phone'])
      if(typeof input[k]==='string')d[k]=cleanString(input[k],k==='aboutText'?1400:400);
    for(const k of ['instagram','whatsapp'])if(typeof input[k]==='string')d[k]=url(input[k],defaults[k]);
    for(const k of ['accent','forest','cream'])if(/^#[\da-f]{6}$/i.test(input[k]||''))d[k]=input[k];
    for(const k of ['heroImage','aboutImage','logoImage'])d[k]=image(input[k]);
    if(Array.isArray(input.products)){
      d.products=input.products.slice(0,24).flatMap((p,i)=>{
        if(!p||typeof p!=='object'||typeof p.name!=='string')return [];
        return [{id:cleanString(p.id||'item'+i,48)||'item'+i,
          name:cleanString(p.name,95),category:cleanString(p.category,60),
          description:cleanString(p.description,220),badge:cleanString(p.badge,55),
          price:cleanString(p.price,50)||'Consultar',tile:Number.isInteger(p.tile)?Math.max(0,Math.min(11,p.tile)):0,
          image:image(p.image),visible:p.visible!==false}];
      });
    }
    return d;
  }
  function read(){
    try{return normalize(JSON.parse(localStorage.getItem(KEY)));}
    catch{return clone(defaults);}
  }
  function save(d){
    const normalized=normalize(d);
    try{localStorage.setItem(KEY,JSON.stringify(normalized));return normalized;}
    catch(e){throw new Error('No hay espacio de almacenamiento en este navegador. Probá con fotos más pequeñas.');}
  }
  function format(src){
    return src;
  }
  function esc(v){return cleanString(v,2000).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function photo(file,max=1100){
    if(!file||!/^image\/(png|jpeg|webp)$/.test(file.type))return Promise.reject(new Error('Usá JPG, PNG o WebP.'));
    if(file.size>8_000_000)return Promise.reject(new Error('La imagen debe pesar menos de 8 MB.'));
    return new Promise((resolve,reject)=>{
      const reader=new FileReader();
      reader.onerror=()=>reject(new Error('No se pudo leer la foto.'));
      reader.onload=()=>{
        const img=new Image();
        img.onload=()=>{
          const scale=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight));
          const canvas=document.createElement('canvas');
          canvas.width=Math.round(img.naturalWidth*scale);canvas.height=Math.round(img.naturalHeight*scale);
          canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
          const src=canvas.toDataURL('image/webp',.72);
          if(src.length>850000)reject(new Error('Foto demasiado pesada para el panel de prueba.'));
          else resolve(src);
        };
        img.onerror=()=>reject(new Error('La imagen no pudo abrirse.'));
        img.src=reader.result;
      };
      reader.readAsDataURL(file);
    });
  }
  window.ALMA={KEY,defaults,clone,normalize,read,save,photo,esc,url,format};
})();
