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
  return /^assets\/[a-zA-Z0-9_-]+\.(webp|png|jpg|jpeg)$/.test(value) || value.startsWith(`${base}/storage/v1/object/public/enpozo-media/`);
}
function clean(data) {
  if (!data || typeof data !== 'object') throw Error('Datos inválidos.');
  const result = {};
  for (const [key, limit] of Object.entries({name:120,address:200,zone:100,rooms:80,area:80,feature:100,price:100,description:16000})) {
    if (typeof data[key] !== 'string' || data[key].length > limit) throw Error('Revisá los textos y sus límites.');
    result[key] = data[key].trim();
  }
  if (!result.name || !result.description || !safeUrl(data.image)) throw Error('Completá título, descripción e imagen de portada.');
  if (!['departamento','casa','duplex','terreno','proyecto'].includes(data.type) || !['pozo','venta','alquiler'].includes(data.operation)) throw Error('Tipo u operación inválidos.');
  if (!Array.isArray(data.gallery) || data.gallery.length > 30 || data.gallery.some(url => !safeUrl(url))) throw Error('La galería admite hasta 30 imágenes.');
  return {...result, type:data.type, operation:data.operation, image:data.image, gallery:[...new Set(data.gallery)]};
}
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
      const rows = await db('enpozo_projects?published=eq.true&select=id,data,position,version&order=position.asc,created_at.asc');
      return reply({projects:rows.map(row=>({...row.data,id:row.id,position:row.position,version:row.version,published:true}))});
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
      const account = accounts[0];
      const salt = account?.password_salt || '0'.repeat(32);
      const key = await crypto.subtle.importKey('raw',encoder.encode(body.password),'PBKDF2',false,['deriveBits']);
      const calculated = hex(await crypto.subtle.deriveBits({name:'PBKDF2',salt:encoder.encode(salt),iterations:210000,hash:'SHA-256'},key,256));
      let mismatch = account ? 0 : 1;
      const expected = account?.password_hash || '0'.repeat(64);
      for(let i=0;i<64;i++) mismatch |= calculated.charCodeAt(i)^expected.charCodeAt(i);
      if (mismatch) return reply({error:'Usuario o contraseña incorrectos.'},401);
      const token = hex(crypto.getRandomValues(new Uint8Array(32)));
      const expires = new Date(Date.now()+4*3600000).toISOString();
      await db('enpozo_sessions','POST',{token_hash:await digest(token),account_id:account.id,expires_at:expires});
      return reply({token,expires});
    }
    const token = request.headers.get('x-enpozo-session') || '';
    if (!/^[a-f0-9]{64}$/.test(token)) return reply({error:'Iniciá sesión para continuar.'},401);
    const tokenHash = await digest(token);
    const sessions = await db(`enpozo_sessions?token_hash=eq.${tokenHash}&expires_at=gt.${encodeURIComponent(new Date().toISOString())}&select=account_id`);
    if (!sessions.length) return reply({error:'La sesión venció. Iniciá sesión nuevamente.'},401);
    if (request.method==='GET' && action==='admin') {
      const rows = await db('enpozo_projects?select=*&order=position.asc,created_at.asc');
      return reply({projects:rows.map(row=>({...row.data,id:row.id,position:row.position,version:row.version,published:row.published}))});
    }
    if (request.method==='POST' && action==='logout') {
      await db(`enpozo_sessions?token_hash=eq.${tokenHash}`,'DELETE'); return reply({ok:true});
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
      const path = `${sessions[0].account_id}/${crypto.randomUUID()}.${extension}`;
      const uploaded = await fetch(`${base}/storage/v1/object/enpozo-media/${path}`,{method:'POST',headers:{...authHeaders,'Content-Type':png?'image/png':jpg?'image/jpeg':'image/webp'},body:bytes});
      if (!uploaded.ok) throw Error('No se pudo subir la imagen.');
      return reply({url:`${base}/storage/v1/object/public/enpozo-media/${path}`});
    }
    if(request.method==='POST' && action==='save') {
      if(Number(request.headers.get('content-length'))>40000) return reply({error:'El proyecto supera el límite de datos.'},400);
      const body = await request.json(); const data = clean(body.project);
      const published = body.project.published === true;
      const position = Number(body.project.position);
      if(!Number.isInteger(position)||position<0||position>9999) return reply({error:'Orden inválido.'},400);
      let rows;
      if(body.project.id) {
        if(!/^[a-f0-9-]{36}$/.test(body.project.id) || !Number.isInteger(body.project.version)) return reply({error:'Proyecto inválido.'},400);
        rows=await db(`enpozo_projects?id=eq.${body.project.id}&version=eq.${body.project.version}`,'PATCH',{data,published,position,version:body.project.version+1,updated_at:new Date().toISOString()});
        if(!rows.length) return reply({error:'El proyecto cambió en otra sesión. Recargá el panel antes de guardar.'},409);
      } else rows=await db('enpozo_projects','POST',{data,published,position});
      const row=rows[0]; return reply({project:{...row.data,id:row.id,published:row.published,position:row.position,version:row.version}});
    }
    return reply({error:'Acción no disponible.'},405);
  } catch(error) { return reply({error:error.message || 'No se pudo completar la operación.'},400); }
});
