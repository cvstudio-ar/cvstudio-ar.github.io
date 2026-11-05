const AZ_DEFAULT_PRODUCTS=[
{id:'p1',name:'Chomba rayada azul',category:'Remeras',price:32900,img:'assets/producto-01.webp',sizes:['S','M','L','XL'],stock:14,featured:true,description:'Chomba de rayas azules y grises. Imagen de referencia.'},
{id:'p2',name:'Camisa estampada negra',category:'Camisas',price:42900,img:'assets/producto-02.webp',sizes:['S','M','L','XL'],stock:9,featured:false,description:'Camisa negra con diseño de hojas blancas. Imagen de referencia.'},
{id:'p3',name:'Remera blanca con estampa',category:'Remeras',price:19900,img:'assets/producto-03.webp',sizes:['S','M','L'],stock:17,featured:true,description:'Remera blanca con estampa delicada. Imagen de referencia.'},
{id:'p4',name:'Chomba coral',category:'Remeras',price:32900,img:'assets/producto-04.webp',sizes:['S','M','L','XL'],stock:12,featured:true,description:'Chomba color coral, manga corta. Imagen de referencia.'},
{id:'p5',name:'Remera gráfica negra',category:'Remeras',price:21900,img:'assets/producto-05.webp',sizes:['S','M','L','XL'],stock:20,featured:true,description:'Remera negra de diseño urbano. Imagen de referencia.'},
{id:'p6',name:'Short denim con lazo',category:'Jeans',price:44900,img:'assets/producto-06.webp',sizes:['36','38','40','42'],stock:8,featured:false,description:'Short denim con cintura con lazo. Imagen de referencia.'},
{id:'p7',name:'Remera rayada azul',category:'Remeras',price:19900,img:'assets/producto-07.webp',sizes:['S','M','L'],stock:10,featured:false,description:'Remera de rayas azules. Imagen de referencia.'},
{id:'p8',name:'Jardinero short denim',category:'Jeans',price:44900,img:'assets/producto-08.webp',sizes:['36','38','40','42'],stock:8,featured:false,description:'Jardinero corto de jean azul. Imagen de referencia.'},
{id:'p9',name:'Conjunto denim estampado',category:'Jeans',price:49900,img:'assets/producto-09.webp',sizes:['S','M','L'],stock:6,featured:false,description:'Conjunto en tela denim. Imagen de referencia.'},
{id:'p10',name:'Mono corto celeste',category:'Otras prendas',price:46900,img:'assets/producto-10.webp',sizes:['S','M','L'],stock:11,featured:false,description:'Mono corto de denim claro. Imagen de referencia.'}
];
const AZ_DEFAULT_SETTINGS={title:'AZ Jeans',subtitle:'Moda urbana para todos los días.',heroTitle:'Tu estilo. Tu tienda. Tu momento.',heroDescription:'Jeans, remeras, buzos y mucho más. Prendas versátiles para cada día.',whatsapp:'5491126637424',instagram:'https://www.instagram.com/azjeans/'};
const AZ_KEY='azjeans-demo-products-v1',AZ_CFG='azjeans-demo-settings-v1',AZ_ORD='azjeans-demo-orders-v1';
const getProducts=()=>{try{let p=JSON.parse(localStorage.getItem(AZ_KEY));return Array.isArray(p)?p:structuredClone(AZ_DEFAULT_PRODUCTS)}catch{return structuredClone(AZ_DEFAULT_PRODUCTS)}};
const setProducts=p=>localStorage.setItem(AZ_KEY,JSON.stringify(p));
const getSettings=()=>{try{return {...AZ_DEFAULT_SETTINGS,...JSON.parse(localStorage.getItem(AZ_CFG))}}catch{return {...AZ_DEFAULT_SETTINGS}}};
const setSettings=s=>localStorage.setItem(AZ_CFG,JSON.stringify(s));
const money=v=>new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(v);
const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const waLink=(message='')=>`https://wa.me/${getSettings().whatsapp.replace(/\D/g,'')}?text=${encodeURIComponent(message)}`;
