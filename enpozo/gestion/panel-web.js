'use strict';
const $=id=>document.getElementById(id),form=$('project-form');
let role='editor',siteSettings=null,settingsDirty=false;
let token=sessionStorage.getItem('enpozo-session')||'',projects=[],current=null,images=[],cover='',dirty=false,busy=false;
const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function api(action,body){
 const response=await fetch(`${window.ENPOZO_API}?action=${action}`,{method:body===undefined?'GET':'POST',headers:{...(body instanceof FormData?{}:{'Content-Type':'application/json'}),...(token?{'x-enpozo-session':token}:{})},body:body===undefined?undefined:body instanceof FormData?body:JSON.stringify(body)});
 const result=await response.json();
 if(!response.ok){if(response.status===401&&action!=='login'){token='';sessionStorage.removeItem('enpozo-session');$('manager').hidden=true;$('login').hidden=false;}throw Error(result.error||'No se pudo completar la operación.');}return result;
}
function status(id,text,error=false){$(id).textContent=text;$(id).classList.toggle('error',error);}
function lock(value){busy=value;form.querySelectorAll('input,button,textarea,select').forEach(el=>el.disabled=value);$('new-project').disabled=value;$('logout').disabled=value;}
async function load(){const result=await api('admin');projects=result.projects;role=result.role||'editor';siteSettings=result.settings;document.querySelectorAll('.owner-only').forEach(el=>{if(role!=='owner')el.hidden=true;else if(el.tagName==='BUTTON')el.hidden=false;});if(role!=='owner')showPanel('catalog-pane');if(!settingsDirty)fillSettings(siteSettings);window.applySiteSettings?.(siteSettings);renderList();$('login').hidden=true;$('manager').hidden=false;}
function renderList(){$('project-list').innerHTML=projects.map(p=>`<button type="button" class="project-item ${current?.id===p.id?'selected':''}" data-project="${escapeHTML(p.id)}"><img src="${escapeHTML(resolveImage(p.image))}" alt=""><span><strong>${escapeHTML(p.name)}</strong><small>${p.published?'Publicado':'Borrador / oculto'}</small></span></button>`).join('')||'<p>Todavía no hay proyectos. Creá tu primera publicación.</p>';}
function resolveImage(url){return url?.startsWith('assets/')?'../'+url:url;}
function mayDiscard(){return !dirty||confirm('Tenés cambios sin guardar. ¿Querés descartarlos?');}
function edit(project){
 current=project?structuredClone(project):null;images=project?[...new Set([project.image,...project.gallery].filter(Boolean))]:[];cover=project?.image||'';
 form.reset();for(const name of ['name','position','type','operation','zone','address','rooms','area','feature','price','description'])form.elements[name].value=project?.[name]??({type:'departamento',operation:'pozo',position:projects.length,price:'Consultar precio'}[name]??'');
 form.elements.published.checked=project?.published??false;
 $('delete-project').hidden=!project;
 $('editor-title').textContent=project?'Editar proyecto':'Nuevo proyecto';$('editor-state').textContent=project?.published?'Publicado':'Borrador';$('editor-empty').hidden=true;form.hidden=false;dirty=false;status('save-status','');status('upload-status','');renderImages();renderList();
}
function renderImages(){$('image-list').innerHTML=images.map((url,index)=>`<article class="image-item"><img src="${escapeHTML(resolveImage(url))}" alt="Foto ${index+1}"><div><button type="button" class="${url===cover?'cover-selected':'secondary'}" data-cover="${index}">${url===cover?'✓ Portada':'Usar de portada'}</button><div class="image-actions"><button type="button" class="secondary" data-move="${index}" data-direction="-1" ${index===0?'disabled':''} aria-label="Mover foto ${index+1} antes">←</button><button type="button" class="secondary" data-move="${index}" data-direction="1" ${index===images.length-1?'disabled':''} aria-label="Mover foto ${index+1} después">→</button><button type="button" class="remove-image" data-remove="${index}">Eliminar foto</button></div></div></article>`).join('')||'<p class="no-images">Agregá al menos una foto para elegir la portada.</p>';}
form.addEventListener('input',()=>dirty=true);
$('project-list').onclick=e=>{const item=e.target.closest('[data-project]');if(!busy&&item&&mayDiscard())edit(projects.find(p=>p.id===item.dataset.project));};
$('new-project').onclick=()=>{if(!busy&&mayDiscard()){showPanel('catalog-pane');edit(null);}};
$('cancel-edit').onclick=()=>{if(mayDiscard()){current=null;dirty=false;form.hidden=true;$('editor-empty').hidden=false;renderList();}};
$('image-list').onclick=e=>{
 if(busy)return;const button=e.target.closest('button');if(!button)return;
 if(button.dataset.cover!==undefined)cover=images[Number(button.dataset.cover)];
 if(button.dataset.remove!==undefined){if(images.length<=1){status('upload-status','Agregá otra foto antes de eliminar la única imagen del proyecto.',true);return;}if(!confirm('¿Eliminar esta foto del proyecto? Se aplicará cuando guardes el proyecto.'))return;const index=Number(button.dataset.remove);const [removed]=images.splice(index,1);if(cover===removed)cover=images[0]||'';}
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
window.addEventListener('beforeunload',e=>{if(dirty||settingsDirty){e.preventDefault();e.returnValue='';}});


function showPanel(id){$('manager-title').textContent={'catalog-pane':'Proyectos y propiedades','settings-pane':'Configuración de la web','users-pane':'Colaboradores'}[id];$('new-project').hidden=id!=='catalog-pane';for(const key of ['catalog-pane','settings-pane','users-pane'])$(key).hidden=key!==id;document.querySelectorAll('[data-panel]').forEach(b=>b.classList.toggle('selected',b.dataset.panel===id));}
document.querySelectorAll('[data-panel]').forEach(b=>b.onclick=()=>{showPanel(b.dataset.panel);if(b.dataset.panel==='users-pane')loadUsers();});
$('delete-project').onclick=async()=>{if(!current||busy)return;if(!confirm('¿Eliminar definitivamente "'+current.name+'"? Se quitará del panel y de la web.'))return;lock(true);try{await api('delete-project',{id:current.id,version:current.version});current=null;dirty=false;form.hidden=true;$('editor-empty').hidden=false;await load();status('manager-status','Proyecto eliminado.');}catch(e){status('save-status',e.message,true);}finally{lock(false);}};
let pendingUploads=0;const settingsForm=$('settings-form');
function fillSettings(data){if(!data)return;for(const key of ['theme','whatsapp','facebook','instagram','tiktok','heroImage','logoImage','version'])settingsForm.elements[key].value=data[key]??'';previewBranding();}
function previewBranding(){$('hero-preview').src=resolveImage(settingsForm.elements.heroImage.value);$('logo-preview').src=resolveImage(settingsForm.elements.logoImage.value);}
settingsForm.oninput=()=>settingsDirty=true;
settingsForm.onsubmit=async e=>{e.preventDefault();if(pendingUploads){status('settings-status','Esperá a que terminen de subir las imágenes.',true);return;}const settings={};for(const key of ['theme','whatsapp','facebook','instagram','tiktok','heroImage','logoImage'])settings[key]=settingsForm.elements[key].value.trim();settings.version=Number(settingsForm.elements.version.value);$('save-settings').disabled=true;status('settings-status','Guardando…');try{const result=await api('settings-save',{settings});siteSettings=result.settings;settingsDirty=false;fillSettings(siteSettings);window.applySiteSettings?.(siteSettings);status('settings-status','Configuración guardada. Ya está disponible en la web.');}catch(e){status('settings-status',e.message,true);}finally{$('save-settings').disabled=false;}};
async function uploadBranding(input,field){const file=input.files[0];if(!file)return;if(file.size>6000000||!['image/jpeg','image/png','image/webp'].includes(file.type)){status('branding-status','Usá JPG, PNG o WebP de hasta 6 MB.',true);input.value='';return;}input.disabled=true;pendingUploads++;$('save-settings').disabled=true;status('branding-status','Subiendo imagen…');try{const body=new FormData();body.append('file',file);const result=await api('upload',body);settingsForm.elements[field].value=result.url;settingsDirty=true;previewBranding();status('branding-status','Imagen lista. Guardá la configuración para aplicarla.');}catch(e){status('branding-status',e.message,true);}finally{input.disabled=false;pendingUploads--;$('save-settings').disabled=pendingUploads>0;input.value='';}}
$('hero-upload').onchange=e=>uploadBranding(e.target,'heroImage');$('logo-upload').onchange=e=>uploadBranding(e.target,'logoImage');
document.querySelectorAll('[data-default-image]').forEach(b=>b.onclick=()=>{settingsForm.elements[b.dataset.defaultImage].value=b.dataset.defaultImage==='heroImage'?'assets/hero.webp':'assets/cvstudio-logo.svg';settingsDirty=true;previewBranding();});
async function loadUsers(){try{const result=await api('collaborators');$('user-list').innerHTML=result.collaborators.map(u=>`<article class="user-card"><div><strong>${escapeHTML(u.username)}</strong><span>${u.active?'Activo':'Desactivado'} · Gestión de propiedades</span></div><button type="button" class="secondary" data-toggle-user="${escapeHTML(u.id)}" data-active="${u.active}">${u.active?'Desactivar':'Activar'}</button><form class="reset-user-form" data-user="${escapeHTML(u.id)}"><label>Nueva contraseña<input type="password" name="password" required minlength="10" maxlength="200" autocomplete="new-password"></label><button class="secondary" type="submit">Cambiar contraseña</button></form></article>`).join('')||'<p>Todavía no hay colaboradores.</p>';}catch(e){status('users-status',e.message,true);}}
$('user-form').onsubmit=async e=>{e.preventDefault();const f=e.currentTarget;f.querySelector('button').disabled=true;try{await api('collaborator-create',{username:f.elements.username.value,password:f.elements.password.value});f.reset();await loadUsers();status('users-status','Colaborador creado. Puede entrar con su usuario y contraseña.');}catch(e){status('users-status',e.message,true);}finally{f.querySelector('button').disabled=false;}};
$('user-list').onclick=async e=>{const b=e.target.closest('[data-toggle-user]');if(!b)return;if(b.dataset.active==='true'&&!confirm('¿Desactivar este colaborador? Se cerrarán sus sesiones.'))return;b.disabled=true;try{await api('collaborator-update',{id:b.dataset.toggleUser,active:b.dataset.active!=='true'});await loadUsers();status('users-status','Acceso actualizado.');}catch(e){status('users-status',e.message,true);b.disabled=false;}};
$('user-list').addEventListener('submit',async e=>{const f=e.target.closest('.reset-user-form');if(!f)return;e.preventDefault();const b=f.querySelector('button');b.disabled=true;try{await api('collaborator-update',{id:f.dataset.user,password:f.elements.password.value});f.reset();status('users-status','Contraseña actualizada. El colaborador deberá iniciar sesión nuevamente.');}catch(e){status('users-status',e.message,true);}finally{b.disabled=false;}});
if(token)load().catch(error=>status('login-status',error.message,true));
