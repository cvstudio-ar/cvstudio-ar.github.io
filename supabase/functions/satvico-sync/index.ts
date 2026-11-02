import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false, autoRefreshToken: false } });
const bucket = 'satvico-public-media';
const allowedOrigins = new Set((Deno.env.get('SATVICO_ALLOWED_ORIGINS') || 'https://cvstudio.com.ar,https://www.cvstudio.com.ar,https://cvstudio-ar.github.io').split(',').map(s=>s.trim()).filter(Boolean));
const hash = async (s: string) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))), b => b.toString(16).padStart(2, '0')).join('');
const mimeExt: Record<string,string> = { 'image/jpeg':'jpg', 'image/png':'png', 'image/webp':'webp', 'image/gif':'gif', 'video/mp4':'mp4', 'video/webm':'webm' };
const fields = new Set(['name','tagline','heroTitle','heroText','heroImage','heroPoster','heroMediaType','heroAspectRatio','logo','primary','background','libraryTitle','aboutTitle','aboutText','membershipTitle','membershipText','price','instagram','whatsapp','email','showMeditation','showReflections','showMembership','showAbout','showAmbient','spaces','studioPhotos','address','city','hours','locationNote','mapsUrl','mapsEmbed','catalogue','cycles','programme']);
function validSettings(s: unknown): boolean {
  if (!s || typeof s !== 'object' || Array.isArray(s)) return false;
  if (Object.keys(s).some(k => !fields.has(k))) return false;
  const x = s as Record<string,unknown>;
  if (typeof x.name !== 'string' || !x.name.trim() || typeof x.heroTitle !== 'string' || !x.heroTitle.trim()) return false;
  if (![x.primary,x.background].every(v => typeof v === 'string' && /^#[a-f\d]{6}$/i.test(v))) return false;
  const walk = (v: unknown, depth = 0): boolean => {
    if (depth > 8) return false;
    if (typeof v === 'string') return v.length <= 5000 && !/^(media:|blob:|data:|javascript:)/i.test(v);
    if (Array.isArray(v)) return v.length <= 250 && v.every(t => walk(t, depth + 1));
    if (v && typeof v === 'object') return Object.entries(v).every(([k,t]) => !['__proto__','constructor','prototype'].includes(k) && walk(t, depth + 1));
    return v === null || typeof v === 'boolean' || typeof v === 'number' && Number.isFinite(v);
  };
  if(x.catalogue!==undefined){
    if(!Array.isArray(x.catalogue)||x.catalogue.length>250)return false;
    const ids=new Set();
    for(const c of x.catalogue as any[]){
      if(!c||typeof c.id!=='string'||ids.has(c.id)||typeof c.title!=='string'||!c.title.trim()||!['yoga','meditation','reflection'].includes(c.category)||!['audio','video'].includes(c.kind)||!['free','member'].includes(c.access))return false;
      ids.add(c.id);
      if(c.privatePath&&!/^contenidos\/[a-f0-9-]+\.(mp4|webm|mp3|m4a|ogg|wav)$/.test(c.privatePath))return false;
      if(c.access==='member'&&c.media)return false;
      if(c.zoomUrl){try{const u=new URL(c.zoomUrl);if(u.protocol!=='https:'||!(u.hostname==='zoom.us'||u.hostname.endsWith('.zoom.us')))return false;}catch{return false;}}
    }
  }
  return walk(s);
}
Deno.serve(async req => {
  const origin = req.headers.get('origin') || '';
  const cors: Record<string,string> = { 'Access-Control-Allow-Origin': allowedOrigins.has(origin) ? origin : 'https://cvstudio.com.ar', 'Access-Control-Allow-Headers':'content-type,x-satvico-session,apikey,authorization', 'Access-Control-Allow-Methods':'GET,POST,OPTIONS', 'Cache-Control':'no-store', 'Vary':'Origin' };
  const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type':'application/json' } });
  if (origin && !allowedOrigins.has(origin)) return reply({ error:'Origen no permitido.' },403);
  if (req.method === 'OPTIONS') return new Response(null,{ status:204,headers:cors });
  try {
    if (req.method === 'GET') {
      const { data,error } = await db.from('satvico_sync_settings').select('settings,revision').eq('id',1).single();
      if (error) throw error;
      const shared=structuredClone(data);
      if(Array.isArray(shared.settings.catalogue))shared.settings.catalogue=shared.settings.catalogue.filter((c:any)=>c.published).map((c:any)=>{const {privatePath,zoomUrl,...publicFields}=c;return {...publicFields,hasMedia:!!privatePath||!!c.media};});
      return reply(shared);
    }
    if (req.method !== 'POST') return reply({error:'Método no permitido.'},405);
    const raw = await req.text();
    if (raw.length > 500000) return reply({error:'Solicitud demasiado grande.'},413);
    let body; try { body=JSON.parse(raw); } catch { return reply({error:'Solicitud inválida.'},400); }
    if (body.action === 'login') {
      if (typeof body.password !== 'string' || body.password.length > 100 || typeof body.username !== 'string' || body.username.length > 80) return reply({error:'Usuario o contraseña incorrectos.'},401);
      const ip = req.headers.get('x-forwarded-for') || 'unknown';
      const {data:allowed,error:rateError}=await db.rpc('satvico_sync_allow_login',{client_key:await hash(ip)});
      if (rateError) throw rateError;
      if (!allowed) return reply({error:'Demasiados intentos. Esperá 15 minutos.'},429);
      const {data:credential,error}=await db.from('satvico_sync_credentials').select('password_hash').eq('username',body.username.trim()).maybeSingle();
      if(error)throw error;
      const actual = await hash(body.password);
      if (!credential || actual !== credential.password_hash) return reply({error:'Usuario o contraseña incorrectos.'},401);
      const token=Array.from(crypto.getRandomValues(new Uint8Array(32)), b=>b.toString(16).padStart(2,'0')).join('');
      const expires=Date.now()+4*60*60*1000;
      const {error:sessionError}=await db.from('satvico_sync_sessions').insert({token_hash:await hash(token),expires_at:new Date(expires).toISOString()});
      if(sessionError)throw sessionError;
      await db.from('satvico_sync_sessions').delete().lt('expires_at',new Date().toISOString());
      return reply({token,expires});
    }
    // Open practices may be streamed anonymously only after their release date.
    if(body.action==='library-play'){
      const {data,error}=await db.from('satvico_sync_settings').select('settings').eq('id',1).single();
      if(error)throw error;
      const c=data.settings.catalogue?.find((item:any)=>item.id===body.id);
      const released=!c?.releaseAt||Number.isFinite(Date.parse(c.releaseAt))&&Date.parse(c.releaseAt)<=Date.now();
      if(c?.published&&c.access==='free'&&released&&c.privatePath&&/^contenidos\/[a-f0-9-]+\.(mp4|webm|mp3|m4a|ogg|wav)$/.test(c.privatePath)){
        const {data:link,error:linkError}=await db.storage.from('satvico-library').createSignedUrl(c.privatePath,1800);
        if(linkError)throw linkError;return reply({url:link.signedUrl});
      }
    }
    const token=req.headers.get('x-satvico-session')||'';
    if(!/^[a-f0-9]{64}$/.test(token))return reply({error:'Iniciá sesión para publicar cambios.'},401);
    const tokenHash=await hash(token);
    const {data:session,error:sessionError}=await db.from('satvico_sync_sessions').select('token_hash').eq('token_hash',tokenHash).gt('expires_at',new Date().toISOString()).maybeSingle();
    if(sessionError)throw sessionError;
    if(!session)return reply({error:'La sesión venció. Volvé a ingresar.'},401);
    if(body.action==='read-admin'){
      const {data,error}=await db.from('satvico_sync_settings').select('settings,revision').eq('id',1).single();
      if(error)throw error;return reply(data);
    }
    if(body.action==='library-upload'){
      const types:Record<string,string>={'video/mp4':'mp4','video/webm':'webm','audio/mpeg':'mp3','audio/mp4':'m4a','audio/ogg':'ogg','audio/wav':'wav'};
      if(!types[body.type]||!Number.isInteger(body.size)||body.size<=0||body.size>50000000)return reply({error:'La biblioteca admite MP4, WebM, MP3, M4A, OGG o WAV de hasta 50 MB. Para archivos mayores, usá una versión optimizada.'},400);
      const privateBucket='satvico-library';
      const {data:found}=await db.storage.getBucket(privateBucket);
      if(!found){const {error}=await db.storage.createBucket(privateBucket,{public:false,fileSizeLimit:50000000,allowedMimeTypes:Object.keys(types)});if(error)throw error;}
      const path='contenidos/'+crypto.randomUUID()+'.'+types[body.type];
      const {data,error}=await db.storage.from(privateBucket).createSignedUploadUrl(path);
      if(error)throw error;return reply({signedUrl:data.signedUrl,privatePath:path});
    }
    if(body.action==='library-play'){
      const {data,error}=await db.from('satvico_sync_settings').select('settings').eq('id',1).single();
      if(error)throw error;
      const content=data.settings.catalogue?.find((c:any)=>c.id===body.id);
      if(!content?.privatePath)return reply({error:'Este contenido todavía no tiene un archivo cargado.'},404);
      if(!/^contenidos\/[a-f0-9-]+\.(mp4|webm|mp3|m4a|ogg|wav)$/.test(content.privatePath))return reply({error:'Archivo inválido.'},400);
      const {data:link,error:linkError}=await db.storage.from('satvico-library').createSignedUrl(content.privatePath,1800);
      if(linkError)throw linkError;return reply({url:link.signedUrl});
    }
    if(body.action==='logout') {const {error}=await db.from('satvico_sync_sessions').delete().eq('token_hash',tokenHash);if(error)throw error;return reply({ok:true});}
    if(body.action==='upload') {
      if(!mimeExt[body.type] || !Number.isInteger(body.size) || body.size<=0 || body.size>50000000 || body.type.startsWith('image/') && body.size>4000000)return reply({error:'Usá imágenes de hasta 4 MB o videos MP4/WebM de hasta 50 MB.'},400);
      const path=`portada/${crypto.randomUUID()}.${mimeExt[body.type]}`;
      const {data,error}=await db.storage.from(bucket).createSignedUploadUrl(path);
      if(error)throw error;
      return reply({signedUrl:data.signedUrl,publicUrl:db.storage.from(bucket).getPublicUrl(path).data.publicUrl});
    }
    if(body.action==='publish') {
      if(!validSettings(body.settings) || !Number.isInteger(body.revision))return reply({error:'La portada contiene datos inválidos o archivos que todavía no están publicados.'},400);
      const {data,error}=await db.from('satvico_sync_settings').update({settings:body.settings,revision:body.revision+1,updated_at:new Date().toISOString()}).eq('id',1).eq('revision',body.revision).select('revision');
      if(error)throw error;
      if(!data?.length)return reply({error:'Hay una versión más nueva. Recargá y revisá los cambios antes de publicar.'},409);
      return reply({revision:data[0].revision});
    }
    return reply({error:'Acción no permitida.'},400);
  } catch { return reply({error:'No pudimos completar la operación. Intentá nuevamente.'},500); }
});

