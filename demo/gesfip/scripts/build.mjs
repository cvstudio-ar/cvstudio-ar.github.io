import { mkdir, cp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
const output = new URL('../dist/', import.meta.url);
await rm(output,{recursive:true,force:true});
await mkdir(output,{recursive:true});
for(const name of ['index.html','styles.css','config.js','app.js','logo.svg','hero-aprobada.svg','assets','admin']){
  await cp(new URL('../'+name,import.meta.url),new URL('../dist/'+name,import.meta.url),{recursive:true});
}
await writeFile(new URL('../dist/robots.txt',import.meta.url),'User-agent: *\nDisallow: /admin/\n');
console.log('GESFIP estático preparado para Cloudflare Pages (dist/).');
