(() => {
'use strict';
const modal=document.getElementById('cvstudio-access-dialog'), panel=modal?.querySelector('.cv-access-panel'), options=modal?.querySelector('.cv-access-options'), form=document.getElementById('collaboratorLogin'), msg=document.getElementById('accessMessage');
if(!modal)return;
const open=()=>{modal.hidden=false;document.body.style.overflow='hidden';document.getElementById('cvAccessTitle')?.focus?.();};
const close=()=>{modal.hidden=true;document.body.style.overflow='';panel.classList.remove('is-login');form.hidden=true;options.hidden=false;msg.textContent='';};
document.getElementById('cvstudioAccessOpen')?.addEventListener('click',open);
modal.querySelectorAll('[data-access-close]').forEach(x=>x.addEventListener('click',close));
document.getElementById('collaboratorAccess')?.addEventListener('click',()=>{panel.classList.add('is-login');options.hidden=true;form.hidden=false;form.email.focus();});
document.getElementById('accessBack')?.addEventListener('click',()=>{panel.classList.remove('is-login');form.hidden=true;options.hidden=false;msg.textContent='';});
document.getElementById('clientAccess')?.addEventListener('click',()=>{msg.textContent='El portal del cliente está planificado para una próxima implementación.';});
form?.addEventListener('submit',async e=>{e.preventDefault();msg.textContent='Ingresando…';const db=window.cvstudioSupabase;if(!db){msg.textContent='No se pudo iniciar la conexión segura.';return;}const fd=new FormData(form);const {error}=await db.auth.signInWithPassword({email:String(fd.get('email')).trim(),password:String(fd.get('password'))});if(error){msg.textContent='Correo o contraseña incorrectos.';return;}location.href='/centro-operaciones-prueba/#inicio';});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden)close();});
})();
