'use strict';
window.SatvicoSync = (() => {
  const endpoint = window.SATVICO_SYNC_CONFIG?.endpoint;
  const key = 'satvico-sync-session-v1';
  let revision = null;
  function session() { try { return JSON.parse(sessionStorage.getItem(key) || 'null'); } catch { return null; } }
  function signedIn() { const s=session(); return !!s?.token && s.expires > Date.now(); }
  async function request(body) {
    const response=await fetch(endpoint,{method:body?'POST':'GET',cache:'no-store',headers:{'Content-Type':'application/json',...(body?{'x-satvico-session':session()?.token||''}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(20000)});
    const result=await response.json();
    if(!response.ok){if(response.status===401 && body?.action!=='login')sessionStorage.removeItem(key);throw Error(result.error||'No se pudo conectar con el estudio.');}
    return result;
  }
  async function read() { const data=await request(); revision=data.revision; return data; }
  async function login(username,password) { const data=await request({action:'login',username,password});sessionStorage.setItem(key,JSON.stringify(data)); }
  async function logout() { const pending=request({action:'logout'});sessionStorage.removeItem(key);await pending; }
  async function upload(file,progress) {
    const data=await request({action:'upload',type:file.type,size:file.size});
    await new Promise((resolve,reject)=>{
      const xhr=new XMLHttpRequest();xhr.open('PUT',data.signedUrl);xhr.timeout=180000;
      xhr.setRequestHeader('Content-Type',file.type);xhr.setRequestHeader('Cache-Control','3600');
      xhr.upload.onprogress=e=>{if(e.lengthComputable)progress?.(Math.round(e.loaded/e.total*100));};
      xhr.onload=()=>xhr.status>=200&&xhr.status<300?resolve():reject(Error('No se pudo subir el archivo. Volvé a intentarlo.'));
      xhr.onerror=()=>reject(Error('Se interrumpió la subida. Revisá tu conexión y volvé a guardar.'));
      xhr.ontimeout=()=>reject(Error('La subida tardó demasiado. Volvé a intentarlo con una conexión estable.'));
      xhr.send(file);
    });
    return data.publicUrl;
  }
  async function publish(settings, getLocalFile, progress) {
    if(!signedIn())throw Error('Iniciá sesión para publicar.');
    if(revision===null)throw Error('No se pudo cargar la versión publicada. Recargá antes de guardar.');
    const expected=revision;
    const result=structuredClone(settings),uploaded=new Map();
    async function walk(value){
      if(typeof value==='string' && value.startsWith('media:')){
        if(uploaded.has(value))return uploaded.get(value);
        const file=await getLocalFile(value);
        if(!file)throw Error('Falta un archivo local. Volvé a seleccionarlo antes de publicar.');
        const url=await upload(file,progress);uploaded.set(value,url);return url;
      }
      if(Array.isArray(value)) {const values=[];for(const item of value)values.push(await walk(item));return values;}
      if(value&&typeof value==='object'){const out={};for(const [k,v]of Object.entries(value))out[k]=await walk(v);return out;}
      return value;
    }
    const shared=await walk(result);
    const data=await request({action:'publish',settings:shared,revision:expected});revision=data.revision;
    return {settings:shared,revision};
  }
  return {read,login,logout,signedIn,publish};
})();
