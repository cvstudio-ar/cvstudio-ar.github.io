'use strict';
const $=id=>document.getElementById(id),form=$('project-form');
let token=sessionStorage.getItem('enpozo-session')||'',projects=[],current=null,images=[],cover='',dirty=false,busy=false;
const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function api(action,body){
 const response=await fetch(`${window.ENPOZO_API}?action=${action}`,{method:body===undefined?'GET':'POST',headers:{...(body instanceof FormData?{}:{'Content-Type':'application/json'}),...(token?{'x-enpozo-session':token}:{})},body:body===undefined?undefined:body instanceof FormData?body:JSON.stringify(body)});
 const result=await response.json();
 if(!response.ok){if(response.status===401&&action!=='login'){token='';sessionStorage.removeItem('enpozo-session');$('manager').hidden=true;$('login').hidden=false;}throw Error(result.error||'No se pudo completar la operación.');}return result;
}
function status(id,text,error=false){$(id).textContent=text;$(id).classList.toggle('error',error);}
function lock(value){busy=value;form.querySelectorAll('input,button,textarea,select').forEach(el=>el.disabled=value);$('new-project').disabled=value;$('logout').disabled=value;}
async function load(){projects=(await api('admin')).projects;renderList();$('login').hidden=true;$('manager').hidden=false;}
function renderList(){$('project-list').innerHTML=projects.map(p=>`<button type="button" class="project-item ${current?.id===p.id?'selected':''}" data-project="${escapeHTML(p.id)}"><img src="${escapeHTML(resolveImage(p.image))}" alt=""><span><strong>${escapeHTML(p.name)}</strong><small>${p.published?'Publicado':'Borrador / oculto'}</small></span></button>`).join('')||'<p>Todavía no hay proyectos. Creá tu primera publicación.</p>';}
function resolveImage(url){return url?.startsWith('assets/')?'../'+url:url;}
function mayDiscard(){return !dirty||confirm('Tenés cambios sin guardar. ¿Querés descartarlos?');}
function edit(project){
 current=project?structuredClone(project):null;images=project?[...new Set([project.image,...project.gallery].filter(Boolean))]:[];cover=project?.image||'';
 form.reset();for(const name of ['name','position','type','operation','zone','address','rooms','area','feature','price','description'])form.elements[name].value=project?.[name]??({type:'departamento',operation:'pozo',position:projects.length,price:'Consultar precio'}[name]??'');
 form.elements.published.checked=project?.published??false;
 $('editor-title').textContent=project?'Editar proyecto':'Nuevo proyecto';$('editor-state').textContent=project?.published?'Publicado':'Borrador';$('editor-empty').hidden=true;form.hidden=false;dirty=false;status('save-status','');status('upload-status','');renderImages();renderList();
}
function renderImages(){$('image-list').innerHTML=images.map((url,index)=>`<article class="image-item"><img src="${escapeHTML(resolveImage(url))}" alt="Foto ${index+1}"><div><button type="button" class="${url===cover?'cover-selected':'secondary'}" data-cover="${index}">${url===cover?'✓ Portada':'Usar de portada'}</button><div class="image-actions"><button type="button" class="secondary" data-move="${index}" data-direction="-1" ${index===0?'disabled':''} aria-label="Mover foto ${index+1} antes">←</button><button type="button" class="secondary" data-move="${index}" data-direction="1" ${index===images.length-1?'disabled':''} aria-label="Mover foto ${index+1} después">→</button><button type="button" class="remove-image" data-remove="${index}">Quitar</button></div></div></article>`).join('')||'<p class="no-images">Agregá al menos una foto para elegir la portada.</p>';}
form.addEventListener('input',()=>dirty=true);
$('project-list').onclick=e=>{const item=e.target.closest('[data-project]');if(!busy&&item&&mayDiscard())edit(projects.find(p=>p.id===item.dataset.project));};
$('new-project').onclick=()=>{if(!busy&&mayDiscard())edit(null);};
$('cancel-edit').onclick=()=>{if(mayDiscard()){current=null;dirty=false;form.hidden=true;$('editor-empty').hidden=false;renderList();}};
$('image-list').onclick=e=>{
 if(busy)return;const button=e.target.closest('button');if(!button)return;
 if(button.dataset.cover!==undefined)cover=images[Number(button.dataset.cover)];
 if(button.dataset.remove!==undefined){const index=Number(button.dataset.remove);const [removed]=images.splice(index,1);if(cover===removed)cover=images[0]||'';}
 if(button.dataset.move!==undefined){const from=Number(button.dataset.move),to=from+Number(button.dataset.direction);if(to>=0&&to<images.length)[images[from],images[to]]=[images[to],images[from]];}
 dirty=true;renderImages();
};
$('upload-files').onchange=async e=>{
 const files=[...e.target.files];if(!files.length||busy)return;
 if(images.length+files.length>30){status('upload-status','Podés incluir hasta 30 imágenes.',true);e.target.value='';return;}
 if(files.some(file=>file.size>6000000||!['image/jpeg','image/png','image/webp'].includes(file.type))){status('upload-status','Usá JPG, PNG o WebP de hasta 6 MB por foto.',true);e.target.value='';return;}
 lock(true);let uploaded=0;
 try{for(const file of files){status('upload-status',`Subiendo foto ${uploaded+1} de ${files.length}…`);const data=new FormData();data.append('file',file);const result=await api('upload',data);images.push(result.url);if(!cover)cover=result.url;uploaded++;dirty=true;}status('upload-status',`${uploaded} ${uploaded===1?'foto agregada':'fotos agregadas'}. Guardá el proyecto para publicar los cambios.`);}
 catch(error){status('upload-status',`${error.message} ${uploaded?'Las fotos que ya se subieron están disponibles.':''}`,true);}
 finally{e.target.value='';renderImages();lock(false);}
};
form.onsubmit=async e=>{
 e.preventDefault();if(busy)return;if(!cover){status('save-status','Agregá una imagen de portada.',true);return;}
 const project={};for(const name of ['name','type','operation','zone','address','rooms','area','feature','price','description'])project[name]=form.elements[name].value.trim();
 Object.assign(project,{image:cover,gallery:images.filter(url=>url!==cover),published:form.elements.published.checked,position:Number(form.elements.position.value),...(current?{id:current.id,version:current.version}:{})});
 lock(true);status('save-status','Guardando…');try{const result=await api('save',{project});await load();edit(result.project);status('save-status',result.project.published?'Proyecto guardado y publicado en la web.':'Borrador guardado. El proyecto está oculto en la web.');}catch(error){status('save-status',error.message,true);}finally{lock(false);}
};
$('login-form').onsubmit=async e=>{
 e.preventDefault();const form=e.currentTarget;form.querySelector('button').disabled=true;status('login-status','Ingresando…');
 try{const result=await api('login',{username:form.elements.username.value,password:form.elements.password.value});token=result.token;sessionStorage.setItem('enpozo-session',token);form.elements.password.value='';await load();status('login-status','');}catch(error){status('login-status',error.message,true);}finally{form.querySelector('button').disabled=false;}
};
$('logout').onclick=async()=>{if(busy||!mayDiscard())return;try{await api('logout',{});}catch{}token='';sessionStorage.removeItem('enpozo-session');current=null;dirty=false;form.hidden=true;$('editor-empty').hidden=false;$('manager').hidden=true;$('login').hidden=false;};
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
if(token)load().catch(error=>status('login-status',error.message,true));
