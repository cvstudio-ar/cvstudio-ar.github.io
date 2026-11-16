import { mkdir, cp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
const output = new URL('../dist/', import.meta.url);
await rm(output,{recursive:true,force:true});
await mkdir(output,{recursive:true});
for(const name of ['index.html','styles.css','config.js','app.js','logo.svg','hero-aprobada.svg','assets','admin']){
  await cp(new URL('../'+name,import.meta.url),new URL('../dist/'+name,import.meta.url),{recursive:true});
}
const configuredUrl=String(process.env.GESFIP_PUBLIC_URL||'').trim();
const siteUrl=configuredUrl.endsWith('/')?configuredUrl.slice(0,-1):configuredUrl;
// Publicación definitiva solo al configurar explícitamente el dominio confirmado del cliente.
const isProduction=/^https:\/\/[a-z0-9.-]+\.[a-z]{2,}$/i.test(siteUrl) && !siteUrl.includes('pages.dev') && !siteUrl.includes('cvstudio.com.ar');
const indexPath=new URL('../dist/index.html',import.meta.url);
const {readFile}=await import('node:fs/promises');
let html=await readFile(indexPath,'utf8');
if(isProduction){
  html=html.replace('noindex,nofollow,noarchive','index,follow');
  html=html.replace('Demostración CVStudio','GESFIP');
  html=html.replace('Demostración visual de sitio web institucional para GESFIP, preparada por CVStudio Argentina.','GESFIP: soluciones profesionales de seguridad física, protección de personas, vigilancia y prevención en Santa Fe.');
  html=html.replace('Propuesta de diseño de','Web desarrollada por');
  html=html.replace('Administración (vista demostrativa)','Administración');
  html=html.replace('<small class="demo-note">Demostración visual sujeta a aprobación · no es el sitio oficial de GESFIP</small>','');
  html=html.replace('</head>',`<link rel="canonical" href="${siteUrl}/"><meta property="og:url" content="${siteUrl}/"><meta property="og:title" content="GESFIP | Seguridad física y de personas"></head>`);
  await writeFile(new URL('../dist/sitemap.xml',import.meta.url),`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${siteUrl}/</loc></url></urlset>`);
}
await writeFile(indexPath,html);
await writeFile(new URL('../dist/robots.txt',import.meta.url),isProduction?`User-agent: *\nAllow: /\nDisallow: /admin/\nSitemap: ${siteUrl}/sitemap.xml\n`:'User-agent: *\nDisallow: /\n');
console.log(isProduction?'GESFIP listo para dominio validado.':'Compilación de revisión no indexable por buscadores.');
console.log('GESFIP estático preparado para Cloudflare Pages (dist/).');
