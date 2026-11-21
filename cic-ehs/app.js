(()=>{
"use strict";
const page=document.body.dataset.page;
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
if(page==="home"){
 const toggle=document.getElementById("menu-toggle"),nav=document.getElementById("nav");
 toggle?.addEventListener("click",()=>{const opened=nav.classList.toggle("open");toggle.setAttribute("aria-expanded",String(opened));});
 nav?.addEventListener("click",e=>{if(e.target.closest("a")){nav.classList.remove("open");toggle?.setAttribute("aria-expanded","false");}});
}
if(page==="campus"){
 const tabs=[...document.querySelectorAll("[data-campus-tab]")],panel=document.getElementById("campus-panel");
 let finished=[false,false,false,false],active="modulos";
 function draw(){
  const completed=finished.filter(Boolean).length,percent=completed*25;
  document.getElementById("campus-progress").style.width=percent+"%";document.getElementById("campus-progress-label").textContent=percent+"%";
  tabs.forEach(b=>{const yes=b.dataset.campusTab===active;b.classList.toggle("active",yes);b.setAttribute("aria-selected",String(yes));});
  if(active==="modulos"){
   const names=["Introducción a la seguridad alimentaria","Riesgos y contaminación","Conservación y buenas prácticas","Repaso y evaluación final"];
   panel.innerHTML='<h3>Recorrido de aprendizaje</h3><p>Marcá cada actividad para simular el avance secuencial de un alumno.</p>'+names.map((name,i)=>'<div class="course-row"><span><b>0'+(i+1)+'</b> · '+name+'<br><small>'+(finished[i]?'Completado':'Pendiente')+'</small></span><button class="btn '+(finished[i]?'btn-outline':'btn-green')+'" data-finish="'+i+'" '+(i>0&&!finished[i-1]?'disabled':'')+'>'+(finished[i]?'Revisar':'Completar demo')+'</button></div>').join("");
   panel.querySelectorAll("[data-finish]").forEach(b=>b.addEventListener("click",()=>{const i=Number(b.dataset.finish);finished[i]=true;draw();}));
  }else if(active==="evaluacion"){
   panel.innerHTML='<h3>Evaluación de ejemplo</h3><p>Pregunta demostrativa: ¿qué conducta reduce el riesgo de contaminación cruzada?</p><form id="quiz"><label class="quiz-option"><input type="radio" name="answer" value="a" required> Utilizar la misma tabla para alimentos crudos y cocidos</label><label class="quiz-option"><input type="radio" name="answer" value="b"> Separar utensilios y superficies según el tipo de alimento</label><label class="quiz-option"><input type="radio" name="answer" value="c"> Guardar los alimentos sin identificar</label><button class="btn btn-primary">Comprobar respuesta</button></form><p id="quiz-result" role="status"></p>';
   panel.querySelector("#quiz").addEventListener("submit",e=>{e.preventDefault();const a=new FormData(e.target).get("answer");document.getElementById("quiz-result").textContent=a==="b"?"Correcto. Separar utensilios y superficies ayuda a prevenir la contaminación cruzada.":"Revisá tu respuesta: la separación de utensilios y superficies es una práctica preventiva importante.";});
  }else{
   panel.innerHTML='<h3>Credencial oficial · seguimiento</h3><p>En la versión definitiva, CIC EHS podría registrar el estado del trámite provincial y adjuntar el PDF con QR recibido del Ministerio.</p><div class="demo-signal">No se genera, simula ni emite una credencial oficial desde esta demo.</div><ul class="feature-list"><li>Finalización del curso</li><li>Revisión de documentación y pagos</li><li>Presentación ante el organismo provincial</li><li>Recepción y entrega de la credencial oficial</li></ul>';
  }
 }
 tabs.forEach(b=>b.addEventListener("click",()=>{active=b.dataset.campusTab;draw();}));
 document.getElementById("campus-reset").addEventListener("click",()=>{finished=[false,false,false,false];active="modulos";draw();});draw();
}
if(page==="admin"){
 const tabs=[...document.querySelectorAll("[data-admin-tab]")],panel=document.getElementById("admin-panel"),title=document.getElementById("admin-title");
 let active="resumen";
 const defaults=[{nombre:"María González",grupo:"Particular",avance:75,pago:"Confirmado"},{nombre:"Lucas Fernández",grupo:"Empresa Norte (demo)",avance:50,pago:"Pendiente"},{nombre:"Ana López",grupo:"Empresa Norte (demo)",avance:100,pago:"Confirmado"},{nombre:"Tomás Pérez",grupo:"Particular",avance:25,pago:"Confirmado"}];
 let students=defaults.map(s=>({...s}));let settings={title:"Capacitación y prevención para trabajar mejor.",subtitle:"Asesoramiento y formación profesional para personas y empresas."};
 function table(rows){return '<div class="tablewrap"><table class="tbl"><thead><tr><th>Alumno</th><th>Grupo</th><th>Avance</th><th>Pago</th><th>Acción</th></tr></thead><tbody>'+rows.map((s,i)=>'<tr><td>'+esc(s.nombre)+'</td><td>'+esc(s.grupo)+'</td><td>'+s.avance+'%</td><td><span class="pill '+(s.pago==="Pendiente"?"pending":"")+'">'+esc(s.pago)+'</span></td><td><button type="button" class="switch" data-advance="'+i+'">+25% avance</button></td></tr>').join("")+'</tbody></table></div>';}
 function draw(){
  tabs.forEach(b=>b.classList.toggle("active",b.dataset.adminTab===active));title.textContent=({"resumen":"Panel de control","alumnos":"Seguimiento de alumnos","empresas":"Capacitaciones empresariales","cursos":"Cursos y materiales","pagos":"Pagos y credenciales","web":"Personalización de la web"})[active];
  if(active==="resumen")panel.innerHTML='<h2>Actividad de demostración</h2><p>Revisá el estado de las inscripciones y probá el control de avance. Los cambios son temporales y no se guardan.</p>'+table(students);
  if(active==="alumnos")panel.innerHTML='<h2>Fichas y seguimiento de alumnos</h2><p>Una versión definitiva incluiría fichas privadas, documentos DNI y fotos, con permisos y almacenamiento seguro.</p>'+table(students)+'<div class="action-row"><button id="add-student" class="btn btn-primary">Agregar alumno de ejemplo</button></div>';
  if(active==="empresas")panel.innerHTML='<h2>Grupos de empresas</h2><div class="grid2"><div class="card"><h3>Empresa Norte · Demo</h3><p>5 empleados · 2 avanzando · 3 pendientes de actividad</p><button type="button" class="btn btn-outline" data-company="Empresa Norte">Ver ejemplo de grupo</button></div><div class="card"><h3>Empresa Sur · Demo</h3><p>4 empleados · 2 pendientes de validación</p><button type="button" class="btn btn-outline" data-company="Empresa Sur">Ver ejemplo de grupo</button></div></div><p id="company-note" role="status"></p>';
  if(active==="cursos")panel.innerHTML='<h2>Contenido de capacitaciones</h2><p>Ejemplo de estructura editable en la futura plataforma.</p><div class="grid2"><div class="card"><h3>Manipulación Segura de Alimentos</h3><ul class="feature-list"><li>Introducción</li><li>Contaminación</li><li>Conservación</li><li>Evaluación</li></ul><a class="btn btn-outline" href="../campus/">Abrir campus demo</a></div><div class="card"><h3>Nuevo curso</h3><p>Podrían agregarse otros contenidos de seguridad, ambiente y bromatología.</p><button class="btn btn-outline" type="button" data-note="Módulos y materiales editables en una versión final.">Ver función prevista</button></div></div><p id="demo-note" role="status"></p>';
  if(active==="pagos")panel.innerHTML='<h2>Control administrativo de pagos y credenciales</h2><p>La validación de transferencias y las tasas provinciales corresponden a CIC EHS. El carnet es emitido por el organismo oficial, y se recibe posteriormente como PDF con QR.</p><div class="grid2"><div class="card"><h3>Transferencias</h3><p>Estado, comprobante y aprobación manual del pago.</p><span class="pill pending">Pendiente de integrar</span></div><div class="card"><h3>Carnet oficial</h3><p>Seguimiento del trámite y adjunto privado del archivo recibido del Ministerio.</p><span class="pill pending">No emite credenciales</span></div></div>';
  if(active==="web")panel.innerHTML='<h2>Personalización de contenido · Demo</h2><p>Probá cómo se editarían los textos de portada. Los cambios de esta pantalla no se publican ni persisten.</p><form id="web-settings" class="admin-fields"><label class="full">Título principal<input name="title" maxlength="130" value="'+esc(settings.title)+'" required></label><label class="full">Descripción principal<textarea name="subtitle" rows="3" maxlength="280" required>'+esc(settings.subtitle)+'</textarea></label><div class="full"><button class="btn btn-primary" type="submit">Mostrar vista previa</button></div></form><div id="settings-preview" class="demo-signal" style="margin-top:17px">Vista previa de textos pendiente.</div>';
  panel.querySelectorAll("[data-advance]").forEach(b=>b.addEventListener("click",()=>{const i=Number(b.dataset.advance);students[i].avance=Math.min(100,students[i].avance+25);draw();}));
  panel.querySelector("#add-student")?.addEventListener("click",()=>{students.push({nombre:"Alumno de ejemplo "+(students.length+1),grupo:"Particular",avance:0,pago:"Pendiente"});draw();});
  panel.querySelectorAll("[data-company]").forEach(b=>b.addEventListener("click",()=>{document.getElementById("company-note").textContent="Grupo "+b.dataset.company+": ejemplo ilustrativo de seguimiento empresarial."; }));
  panel.querySelectorAll("[data-note]").forEach(b=>b.addEventListener("click",()=>{document.getElementById("demo-note").textContent=b.dataset.note;}));
  panel.querySelector("#web-settings")?.addEventListener("submit",e=>{e.preventDefault();const f=new FormData(e.target);settings={title:String(f.get("title")).trim(),subtitle:String(f.get("subtitle")).trim()};const out=document.getElementById("settings-preview");out.replaceChildren();const h=document.createElement("strong"),p=document.createElement("p");h.textContent=settings.title;p.textContent=settings.subtitle;out.append(h,p);});
 }
 tabs.forEach(b=>b.addEventListener("click",()=>{active=b.dataset.adminTab;draw();}));draw();
}
})();