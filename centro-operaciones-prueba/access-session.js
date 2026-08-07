(() => {
'use strict';
const INACTIVITY_MS=10*60*1000;
const WARNING_MS=60*1000;
const TABLE='cvstudio_ops_stage_collaborators';
const WORKSPACE='centro-operaciones-prueba';
let session=null, lastActivity=Date.now(), warningTimer=null, logoutTimer=null, presenceTimer=null, away=false;
const db=()=>window.cvstudioSupabase;

function modal(html,locked=false){
  const host=document.getElementById('appModal'),content=document.getElementById('modalContent');
  if(!host||!content)return;
  content.innerHTML=html; host.hidden=false; host.dataset.locked=locked?'true':'false';
  host.querySelectorAll('[data-close-modal]').forEach(el=>el.onclick=()=>{if(host.dataset.locked!=='true')host.hidden=true;});
}
function closeModal(){const host=document.getElementById('appModal');if(host&&host.dataset.locked!=='true')host.hidden=true;}
async function ownCollaborator(){
  if(!session?.user)return null;
  const {data,error}=await db().from(TABLE).select('id,payload').eq('workspace_id',WORKSPACE);
  if(error)return null;
  const email=(session.user.email||'').toLowerCase();
  return (data||[]).find(r=>r.payload?.authUserId===session.user.id||String(r.payload?.email||'').toLowerCase()===email)||null;
}
async function updatePresence(status){
  const row=await ownCollaborator(); if(!row)return;
  row.payload={...row.payload,presenceStatus:status,lastSeen:new Date().toISOString()};
  await db().from(TABLE).update({payload:row.payload,updated_at:new Date().toISOString()}).eq('workspace_id',WORKSPACE).eq('id',row.id);
}
async function logout(reason='manual'){
  clearTimeout(warningTimer);clearTimeout(logoutTimer);clearInterval(presenceTimer);
  try{await updatePresence('offline');}catch{}
  await db().auth.signOut();
  sessionStorage.setItem('cvstudio_logout_reason',reason);
  location.href='/?access=collaborator';
}
function showExpiryWarning(){
  away=true; updatePresence('away').catch(()=>{});
  modal(`<h2 id="modalTitle">Sesión a punto de expirar</h2><p style="color:var(--muted)">Detectamos inactividad. Por seguridad, la sesión se cerrará en 60 segundos.</p><div class="session-countdown" id="sessionCountdown">60</div><div class="modal-actions"><button class="button secondary" id="logoutNow">Cerrar sesión</button><button class="button primary" id="keepSession">Continuar trabajando</button></div>`,true);
  let remaining=60; const el=document.getElementById('sessionCountdown');
  const interval=setInterval(()=>{remaining--;if(el)el.textContent=String(Math.max(remaining,0));if(remaining<=0)clearInterval(interval);},1000);
  document.getElementById('keepSession').onclick=()=>{clearInterval(interval);document.getElementById('appModal').dataset.locked='false';document.getElementById('appModal').hidden=true;document.body.style.overflow='';registerActivity(true);};
  document.getElementById('logoutNow').onclick=()=>logout('manual');
}
function armTimers(){
  clearTimeout(warningTimer);clearTimeout(logoutTimer);
  const elapsed=Date.now()-lastActivity;
  warningTimer=setTimeout(showExpiryWarning,Math.max(0,INACTIVITY_MS-WARNING_MS-elapsed));
  logoutTimer=setTimeout(()=>logout('inactive'),Math.max(0,INACTIVITY_MS-elapsed));
}
function registerActivity(force=false){
  const now=Date.now(); if(!force&&now-lastActivity<15000)return;
  lastActivity=now; if(away){away=false;updatePresence('online').catch(()=>{});} armTimers();
}
async function forcePasswordChange(){
  modal(`<h2 id="modalTitle">Creá tu contraseña personal</h2><p style="color:var(--muted)">Por seguridad, reemplazá la contraseña temporal antes de comenzar.</p><form id="passwordChangeForm" class="form-grid"><label>Nueva contraseña<input name="password" type="password" minlength="10" required autocomplete="new-password"></label><label>Repetir contraseña<input name="confirm" type="password" minlength="10" required autocomplete="new-password"></label><div class="modal-actions" style="grid-column:1/-1"><button type="submit" class="button primary">Guardar y continuar</button></div></form>`,true);
  document.getElementById('passwordChangeForm').onsubmit=async event=>{
    event.preventDefault(); const form=event.currentTarget,p=form.password.value,c=form.confirm.value,btn=form.querySelector('button');
    if(p!==c){alert('Las contraseñas no coinciden.');return;} if(p.length<10){alert('Usá al menos 10 caracteres.');return;}
    btn.disabled=true;btn.textContent='Guardando…';
    const metadata={...(session.user.user_metadata||{}),must_change_password:false};
    const {data,error}=await db().auth.updateUser({password:p,data:metadata});
    if(error){alert(error.message);btn.disabled=false;btn.textContent='Guardar y continuar';return;}
    session=(await db().auth.getSession()).data.session;
    const row=await ownCollaborator();if(row){row.payload={...row.payload,mustChangePassword:false,authStatus:'Activo'};await db().from(TABLE).update({payload:row.payload,updated_at:new Date().toISOString()}).eq('workspace_id',WORKSPACE).eq('id',row.id);}
    const host=document.getElementById('appModal');host.dataset.locked='false';host.hidden=true;document.body.style.overflow='';updatePresence('online').catch(()=>{});
  };
}
window.addEventListener('load',async()=>{
  const client=db();if(!client)return;
  session=(await client.auth.getSession()).data.session;
  if(!session?.user){location.href='/?access=collaborator';return;}
  const profile=document.getElementById('profileMenu');
  const row=await ownCollaborator(); const collab=row?.payload;
  const email=session.user.email||'colaborador@cvstudio.com.ar'; const name=collab?.name||session.user.user_metadata?.full_name||email.split('@')[0];
  const normalizedEmail=String(email).toLowerCase();
  const ownerEmails=['pablexe@cvstudio.com.ar'];
  const rawRole=collab?.role||session.user.user_metadata?.role||'Aprendiz';
  const roleMap={'Administrador':'Director','Coordinador':'Líder','Producción':'Operario','Diseñador':'Operario','Redactor':'Operario','Corrector':'Operario','Editor LinkedIn':'Operario','Portfolio':'Operario','Marketing':'Operario','Atención al cliente':'Operario'};
  // Salvaguarda del propietario: evita que una ficha heredada vuelva a degradar al Director.
  const accessLevel=ownerEmails.includes(normalizedEmail)?'Director':(roleMap[rawRole]||rawRole);
  if(!collab&&!ownerEmails.includes(normalizedEmail)){
    await client.auth.signOut();
    sessionStorage.setItem('cvstudio_logout_reason','profile_missing');
    location.href='/?access=collaborator&error=profile_missing';
    return;
  }
  window.CVStudioAccess?.set(accessLevel,collab);
  if(profile){profile.querySelector('strong').textContent=name;profile.querySelector('.avatar').textContent=name.charAt(0).toUpperCase();profile.querySelector('small').textContent=accessLevel;profile.onclick=()=>{if(confirm('¿Cerrar sesión del Centro de Operaciones?'))logout('manual');};}
  await updatePresence('online').catch(()=>{});
  ['pointerdown','keydown','touchstart','scroll'].forEach(type=>window.addEventListener(type,()=>registerActivity(),{passive:true,capture:true}));
  armTimers(); presenceTimer=setInterval(()=>updatePresence(away?'away':'online').catch(()=>{}),60000);
  if(session.user.user_metadata?.must_change_password===true||collab?.mustChangePassword===true)await forcePasswordChange();
});
window.addEventListener('pagehide',()=>{updatePresence('offline').catch(()=>{});});
})();
