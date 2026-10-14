const base = Deno.env.get('SUPABASE_URL');
const secret = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}').default || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const encoder = new TextEncoder();
const authHeaders = secret.startsWith('sb_') ? {apikey:secret} : {apikey:secret,Authorization:`Bearer ${secret}`};
const headers = { ...authHeaders, 'Content-Type': 'application/json' };
const hex = bytes => Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
const digest = async text => hex(await crypto.subtle.digest('SHA-256', encoder.encode(text)));
async function db(path, method = 'GET', body, prefer = 'return=representation') {
  const response = await fetch(`${base}/rest/v1/${path}`, { method, headers: { ...headers, Prefer: prefer }, body: body === undefined ? undefined : JSON.stringify(body) });
  if (!response.ok) throw Error('No se pudo guardar o consultar la información.');
  const text = await response.text(); return text ? JSON.parse(text) : null;
}
function safeUrl(value) {
  if (typeof value !== 'string' || value.length > 1800) return false;
  return /^assets\/(?:demo\/)?[a-zA-Z0-9_-]+\.(webp|png|jpg|jpeg)$/.test(value) || value.startsWith(`${base}/storage/v1/object/public/enpozo-media/`);
}
function clean(data) {
  if (!data || typeof data !== 'object') throw Error('Datos inválidos.');
  const result = {};
  for (const [key, limit] of Object.entries({name:120,address:200,zone:100,rooms:80,area:80,feature:100,price:100,description:16000,advisorWhatsapp:30})) {
    if (key==='advisorWhatsapp' && data[key]===undefined) data[key]='';
    if (typeof data[key] !== 'string' || data[key].length > limit) throw Error('Revisá los textos y sus límites.');
    result[key] = data[key].trim();
  }
  if (!result.name || !result.description || !safeUrl(data.image)) throw Error('Completá título, descripción e imagen de portada.');
  if (!['departamento','casa','duplex','terreno','proyecto'].includes(data.type) || !['pozo','venta','alquiler'].includes(data.operation)) throw Error('Tipo u operación inválidos.');
  if (!Array.isArray(data.gallery) || data.gallery.length > 30 || data.gallery.some(url => !safeUrl(url))) throw Error('La galería admite hasta 30 imágenes.');
  if(result.advisorWhatsapp&&!/^[1-9][0-9]{7,14}$/.test(result.advisorWhatsapp))throw Error('WhatsApp del asesor inválido.');
  if(!['disponible','reservada','vendida','alquilada'].includes(data.status||'disponible'))throw Error('Estado inválido.');
  return {...result, status:data.status||'disponible',featured:data.featured===true, type:data.type, operation:data.operation, image:data.image, gallery:[...new Set(data.gallery)]};
}
const defaults={theme:'green',whatsapp:'5492964652318',facebook:'',instagram:'',tiktok:'',heroImage:'assets/hero.webp',logoImage:'assets/cvstudio-logo.svg',businessName:'CVStudio',address:'',city:'',province:'',mapsUrl:'',email:'',youtube:'',primaryColor:''};
async function siteSettings(id='site'){const rows=await db(`enpozo_demo_settings?id=eq.${encodeURIComponent(id)}&select=data,version`);return {...defaults,...rows[0]?.data,version:rows[0]?.version||1};}
function cleanSettings(input){
 if(!input||typeof input!=='object'||!['green','blue','graphite','black'].includes(input.theme))throw Error('Elegí uno de los cuatro colores disponibles.');
 const result={theme:input.theme};
 for(const key of ['facebook','instagram','tiktok','youtube']){
  const value=String(input[key]||'').trim();if(value.length>1000)throw Error('El enlace es demasiado largo.');
  if(value){const url=new URL(value);const domain=url.hostname.toLowerCase();if(url.protocol!=='https:'||url.username||url.password||!(domain===key+'.com'||domain.endsWith('.'+key+'.com')||(key==='youtube'&&domain==='youtu.be')))throw Error('Usá un enlace HTTPS válido de '+key+'.');}
  result[key]=value;
 }
 const whatsapp=String(input.whatsapp||'').replace(/[ +()-]/g,'');if(whatsapp&&!/^[1-9][0-9]{7,14}$/.test(whatsapp))throw Error('Ingresá WhatsApp con código de país, sin letras.');result.whatsapp=whatsapp;
 if(!safeUrl(input.heroImage)||!(safeUrl(input.logoImage)||input.logoImage==='assets/cvstudio-logo.svg'))throw Error('Subí una portada y un logo válidos.');
 for(const [key,max] of Object.entries({businessName:120,address:200,city:100,province:100,email:200,mapsUrl:1000,primaryColor:7})){const value=String(input[key]||'').trim();if(value.length>max)throw Error('El campo '+key+' es demasiado largo.');result[key]=value;}
 if(result.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result.email))throw Error('Correo inválido.');
 if(result.primaryColor&&!/^#[a-fA-F0-9]{6}$/.test(result.primaryColor))throw Error('Color inválido.');
 if(result.mapsUrl){const url=new URL(result.mapsUrl);if(url.protocol!=='https:'||url.username||url.password||!['www.google.com','google.com','maps.google.com','maps.app.goo.gl','goo.gl'].includes(url.hostname))throw Error('Ingresá un enlace HTTPS de Google Maps.');}
 result.heroImage=input.heroImage;result.logoImage=input.logoImage;return result;
}
async function passwordData(password){
 if(typeof password!=='string'||password.length<10||password.length>200)throw Error('La contraseña debe tener entre 10 y 200 caracteres.');
 const password_salt=hex(crypto.getRandomValues(new Uint8Array(16)));
 const key=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);
 const password_hash=hex(await crypto.subtle.deriveBits({name:'PBKDF2',salt:encoder.encode(password_salt),iterations:210000,hash:'SHA-256'},key,256));return {password_salt,password_hash};
}
const validId=value=>typeof value==='string'&&/^[a-f0-9-]{36}$/.test(value);
Deno.serve(async request => {
  const origin = request.headers.get('origin') || '';
  const allowed = ['https://cvstudio.com.ar','https://www.cvstudio.com.ar','https://cvstudio-ar.github.io'];
  const cors = {'Access-Control-Allow-Origin':allowed.includes(origin)?origin:allowed[0], 'Access-Control-Allow-Headers':'content-type, x-enpozo-session', 'Access-Control-Allow-Methods':'GET, POST, OPTIONS', 'Vary':'Origin', 'Cache-Control':'no-store', 'Content-Type':'application/json'};
  const reply = (data, status=200) => new Response(JSON.stringify(data), {status, headers:cors});
  if (origin && !allowed.includes(origin)) return reply({error:'Origen no permitido.'},403);
  if (request.method === 'OPTIONS') return new Response(null,{status:204,headers:cors});
  try {
    const action = new URL(request.url).searchParams.get('action') || 'catalog';
    if (request.method === 'GET' && action === 'catalog') {
      const rows = await db('enpozo_demo_projects?published=eq.true&deleted_at=is.null&demo_account_id=is.null&select=id,data,position,version&order=position.asc,created_at.asc');
      return reply({projects:rows.map(row=>({...row.data,id:row.id,position:row.position,version:row.version,published:true})),settings:await siteSettings()});
    }
    if (request.method === 'POST' && action === 'login') {
      if (Number(request.headers.get('content-length')) > 4096) return reply({error:'Solicitud inválida.'},400);
      const body = await request.json();
      if (typeof body.username !== 'string' || typeof body.password !== 'string' || body.username.length>100 || body.password.length>200) return reply({error:'Datos inválidos.'},400);
      const ip = (request.headers.get('x-forwarded-for')||'unknown').split(',')[0].trim();
      const limitKey = await digest(`enpozo:${ip}`);
      const permitted = await db('rpc/enpozo_login_permitted','POST',{key:limitKey});
      if (!permitted) return reply({error:'Demasiados intentos. Volvé a intentar en 15 minutos.'},429);
      const accounts = await db(`enpozo_admin_accounts?username=eq.${encodeURIComponent(body.username.trim().toLowerCase())}&select=id,password_salt,password_hash`);
      let account = accounts[0];let collaborator=false;
      if(!account){const members=await db(`enpozo_demo_collaborators?username=eq.${encodeURIComponent(body.username.trim().toLowerCase())}&select=id,password_salt,password_hash,active,role`);account=members[0];collaborator=true;}
      const salt = account?.password_salt || '0'.repeat(32);
      const key = await crypto.subtle.importKey('raw',encoder.encode(body.password),'PBKDF2',false,['deriveBits']);
      const calculated = hex(await crypto.subtle.deriveBits({name:'PBKDF2',salt:encoder.encode(salt),iterations:210000,hash:'SHA-256'},key,256));
      let mismatch = account&&account.active!==false ? 0 : 1;
      const expected = account?.password_hash || '0'.repeat(64);
      for(let i=0;i<64;i++) mismatch |= calculated.charCodeAt(i)^expected.charCodeAt(i);
      if (mismatch) return reply({error:'Usuario o contraseña incorrectos.'},401);
      const token = hex(crypto.getRandomValues(new Uint8Array(32)));
      const expires = new Date(Date.now()+4*3600000).toISOString();
      await db(collaborator?'enpozo_demo_collaborator_sessions':'enpozo_sessions','POST',{token_hash:await digest(token),account_id:account.id,expires_at:expires});
      return reply({token,expires,role:collaborator?(account.role||'editor'):'owner'});
    }
    const token = request.headers.get('x-enpozo-session') || '';
    if (!/^[a-f0-9]{64}$/.test(token)) return reply({error:'Iniciá sesión para continuar.'},401);
    const tokenHash = await digest(token);
    let sessions = await db(`enpozo_sessions?token_hash=eq.${tokenHash}&expires_at=gt.${encodeURIComponent(new Date().toISOString())}&select=account_id`);
    let role='owner',sessionTable='enpozo_sessions';
    if(!sessions.length){
      sessions=await db(`enpozo_demo_collaborator_sessions?token_hash=eq.${tokenHash}&expires_at=gt.${encodeURIComponent(new Date().toISOString())}&select=account_id`);
      sessionTable='enpozo_demo_collaborator_sessions';
      if(sessions.length){const members=await db(`enpozo_demo_collaborators?id=eq.${sessions[0].account_id}&active=eq.true&select=id,role`);if(!members.length)sessions=[];else role=members[0].role;}
    }
    if(!sessions.length)return reply({error:'La sesión venció. Iniciá sesión nuevamente.'},401);
    const accountId=sessions[0].account_id;
    const scope=role==='demo'?`demo_account_id=eq.${accountId}`:role==='editor'?`demo_account_id=is.null&assigned_user=eq.${accountId}`:'demo_account_id=is.null';
    const settingsId=role==='demo'?'demo-'+accountId:'site';
    const projectView=row=>({...row.data,id:row.id,position:row.position,version:row.version,published:row.published,deletedAt:row.deleted_at,assignedUser:row.assigned_user,updatedAt:row.updated_at});
    async function validAssignee(id){if(!id)return true;if(!validId(id))return false;const members=await db(`enpozo_demo_collaborators?id=eq.${id}&active=eq.true&role=neq.demo&select=id`);const owners=await db(`enpozo_admin_accounts?id=eq.${id}&select=id`);return members.length+owners.length>0;}
    if(request.method==='GET'&&action==='admin'){
      const rows=await db(`enpozo_demo_projects?${scope}&select=*&order=position.asc,created_at.asc`);
      let assignees=[];if(role==='owner'){assignees=[...await db('enpozo_admin_accounts?select=id,username'),...await db('enpozo_demo_collaborators?active=eq.true&role=neq.demo&select=id,username')];}
      return reply({projects:rows.map(projectView),role,accountId,assignees,settings:await siteSettings(settingsId)});
    }
    if(['collaborators','collaborator-create','collaborator-update','collaborator-delete'].includes(action)&&role!=='owner')return reply({error:'Solo el administrador puede gestionar usuarios.'},403);
    if(action==='settings-save'&&!['owner','demo'].includes(role))return reply({error:'Solo el administrador puede cambiar la configuración.'},403);
    if (request.method==='POST' && action==='logout') {
      await db(`${sessionTable}?token_hash=eq.${tokenHash}`,'DELETE'); return reply({ok:true});
    }
    if (request.method==='POST' && action==='upload') {
      if (Number(request.headers.get('content-length'))>6500000) return reply({error:'La imagen supera los 6 MB.'},400);
      const form = await request.formData(); const file = form.get('file');
      if (!(file instanceof File) || file.size>6000000 || !['image/jpeg','image/png','image/webp'].includes(file.type)) return reply({error:'Usá imágenes JPG, PNG o WebP de hasta 6 MB.'},400);
      const bytes = new Uint8Array(await file.arrayBuffer());
      const png = bytes[0]===137 && bytes[1]===80 && bytes[2]===78 && bytes[3]===71;
      const jpg = bytes[0]===255 && bytes[1]===216 && bytes[2]===255;
      const webp = new TextDecoder().decode(bytes.slice(0,4))==='RIFF' && new TextDecoder().decode(bytes.slice(8,12))==='WEBP';
      if (!(png||jpg||webp)) return reply({error:'El archivo no es una imagen válida.'},400);
      const extension = png?'png':jpg?'jpg':'webp';
      const path = `demo/${sessions[0].account_id}/${crypto.randomUUID()}.${extension}`;
      const uploaded = await fetch(`${base}/storage/v1/object/enpozo-media/${path}`,{method:'POST',headers:{...authHeaders,'Content-Type':png?'image/png':jpg?'image/jpeg':'image/webp'},body:bytes});
      if (!uploaded.ok) throw Error('No se pudo subir la imagen.');
      return reply({url:`${base}/storage/v1/object/public/enpozo-media/${path}`});
    }
    if(request.method==='POST'&&['delete-project','restore-project','purge-project'].includes(action)){
      const body=await request.json();if(!validId(body.id)||!Number.isInteger(body.version))return reply({error:'Propiedad inválida.'},400);
      if(action==='purge-project'&&role==='editor')return reply({error:'Solo el administrador puede eliminar definitivamente.'},403);
      const path=`enpozo_demo_projects?id=eq.${body.id}&version=eq.${body.version}&${scope}&deleted_at=${action==='delete-project'?'is.null':'not.is.null'}`;
      const rows=await db(path,action==='purge-project'?'DELETE':'PATCH',action==='purge-project'?undefined:{deleted_at:action==='restore-project'?null:new Date().toISOString(),published:false,version:body.version+1,updated_at:new Date().toISOString()});
      if(!rows.length)return reply({error:'La propiedad cambió o no tenés acceso. Recargá el panel.'},409);return reply({ok:true});
    }
    if(request.method==='POST'&&action==='settings-save'){
      const body=await request.json();const data=cleanSettings(body.settings);const version=body.settings.version;
      if(!Number.isInteger(version))return reply({error:'Recargá la configuración antes de guardar.'},400);
      const rows=await db(`enpozo_demo_settings?id=eq.${encodeURIComponent(settingsId)}&version=eq.${version}`,'PATCH',{data,version:version+1,updated_at:new Date().toISOString()});
      if(!rows.length)return reply({error:'La configuración cambió en otra sesión. Recargá el panel.'},409);return reply({settings:{...rows[0].data,version:rows[0].version}});
    }
    if(request.method==='GET'&&action==='collaborators')return reply({collaborators:await db('enpozo_demo_collaborators?select=id,username,active,role,created_at&order=created_at.asc')});
    if(request.method==='POST'&&action==='collaborator-create'){
      const body=await request.json();const username=String(body.username||'').trim().toLowerCase();
      if(!/^[a-z0-9._-]{3,60}$/.test(username))return reply({error:'Usá de 3 a 60 letras minúsculas, números, puntos, guiones o guiones bajos.'},400);
      const owners=await db(`enpozo_admin_accounts?username=eq.${encodeURIComponent(username)}&select=id`);
      const members=await db(`enpozo_demo_collaborators?username=eq.${encodeURIComponent(username)}&select=id`);
      if(owners.length||members.length)return reply({error:'Ese usuario ya existe.'},409);
      if(!['owner','editor','demo'].includes(body.role||'editor'))return reply({error:'Rol inválido.'},400);
      const password=await passwordData(body.password);const created=await db('enpozo_demo_collaborators','POST',{username,...password,active:true,role:body.role||'editor'});const member=created[0];
      if(member.role==='demo'){const originals=await db('enpozo_demo_projects?demo_account_id=is.null&deleted_at=is.null&select=data,position&limit=4');if(originals.length)await db('enpozo_demo_projects','POST',originals.map(p=>({data:p.data,position:p.position,published:false,demo_account_id:member.id})));const settings=await siteSettings();delete settings.version;await db('enpozo_demo_settings','POST',{id:'demo-'+member.id,data:settings});}
      return reply({ok:true});
    }
    if(request.method==='POST'&&action==='collaborator-update'){
      const body=await request.json();if(!validId(body.id))return reply({error:'Usuario inválido.'},400);
      if(body.id===accountId&&(body.active===false||body.role))return reply({error:'No podés quitar tu propio acceso administrativo.'},400);
      const target=await db(`enpozo_demo_collaborators?id=eq.${body.id}&select=id,role`);if(!target.length)return reply({error:'Usuario no encontrado.'},404);
      const change={};if(body.role){if(!['owner','editor','demo'].includes(body.role))return reply({error:'Rol inválido.'},400);if((target[0].role==='demo')!==(body.role==='demo'))return reply({error:'Los accesos de demostración se crean por separado. Creá otro usuario para ese rol.'},400);change.role=body.role;}if(typeof body.active==='boolean')change.active=body.active;
      if(body.password)Object.assign(change,await passwordData(body.password));
      if(!Object.keys(change).length)return reply({error:'Elegí un cambio.'},400);
      const rows=await db(`enpozo_demo_collaborators?id=eq.${body.id}`,'PATCH',change);
      if(!rows.length)return reply({error:'Usuario no encontrado.'},404);
      if(change.active===false||change.password_hash||change.role)await db(`enpozo_demo_collaborator_sessions?account_id=eq.${body.id}`,'DELETE');return reply({ok:true});
    }
    if(request.method==='POST'&&action==='collaborator-delete'){
      const body=await request.json();if(!validId(body.id)||body.id===accountId)return reply({error:'No podés eliminar tu propio usuario.'},400);
      const members=await db(`enpozo_demo_collaborators?id=eq.${body.id}&select=id,role`);if(!members.length)return reply({error:'Usuario no encontrado.'},404);
      const reassigned=body.reassignTo||null;if(!await validAssignee(reassigned)||reassigned===body.id)return reply({error:'Elegí otro usuario activo para reasignar.'},400);
      const assigned=await db(`enpozo_demo_projects?assigned_user=eq.${body.id}&select=id,version`);if(assigned.length&&!reassigned)return reply({error:'Elegí a quién reasignar sus propiedades antes de eliminarlo.'},400);
      await db(`enpozo_demo_collaborator_sessions?account_id=eq.${body.id}`,'DELETE');
      for(const p of assigned){const changed=await db(`enpozo_demo_projects?id=eq.${p.id}&assigned_user=eq.${body.id}&version=eq.${p.version}`,'PATCH',{assigned_user:reassigned,version:p.version+1,updated_at:new Date().toISOString()});if(!changed.length)return reply({error:'Una propiedad cambió durante la reasignación. Volvé a intentar.'},409);}
      await db(`enpozo_demo_projects?demo_account_id=eq.${body.id}`,'DELETE');
      await db(`enpozo_demo_settings?id=eq.demo-${body.id}`,'DELETE');
      await db(`enpozo_demo_collaborators?id=eq.${body.id}`,'DELETE');return reply({ok:true});
    }
    if(request.method==='POST' && action==='save') {
      if(Number(request.headers.get('content-length'))>40000) return reply({error:'El proyecto supera el límite de datos.'},400);
      const body = await request.json(); const data = clean(body.project);
      const published = body.project.published === true;
      const position = Number(body.project.position);
      const assignedUser=role==='owner'?(body.project.assignedUser||null):role==='editor'?accountId:null;
      if(role==='owner'&&!await validAssignee(assignedUser))return reply({error:'Asesor inválido.'},400);
      if(!Number.isInteger(position)||position<0||position>9999) return reply({error:'Orden inválido.'},400);
      let rows;
      if(body.project.id) {
        if(!/^[a-f0-9-]{36}$/.test(body.project.id) || !Number.isInteger(body.project.version)) return reply({error:'Proyecto inválido.'},400);
        rows=await db(`enpozo_demo_projects?id=eq.${body.project.id}&version=eq.${body.project.version}&deleted_at=is.null&${scope}`,'PATCH',{data,published:role==='demo'?false:published,position,assigned_user:assignedUser,version:body.project.version+1,updated_at:new Date().toISOString()});
        if(!rows.length) return reply({error:'El proyecto cambió en otra sesión. Recargá el panel antes de guardar.'},409);
      } else rows=await db('enpozo_demo_projects','POST',{data,published:role==='demo'?false:published,position,assigned_user:assignedUser,demo_account_id:role==='demo'?accountId:null});
      const row=rows[0]; return reply({project:projectView(row)});
    }
    return reply({error:'Acción no disponible.'},405);
  } catch(error) { return reply({error:error.message || 'No se pudo completar la operación.'},400); }
});


