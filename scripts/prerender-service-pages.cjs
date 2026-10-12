// Run from the repository root after updating js/service-pages.js.
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('js/service-pages.js','utf8');
for(const key of ["cv-profesional","cv-freelance","linkedin-profesional","dos-cv-profesionales","cv-linkedin"]) {
  const root={innerHTML:''};
  vm.runInNewContext(source,{document:{body:{dataset:{service:key}},getElementById:()=>root}});
  if(!root.innerHTML.includes('<h1>')) throw new Error('Missing content for '+key);
  const path=key+'/index.html';
  const html=fs.readFileSync(path,'utf8');
  fs.writeFileSync(path,html.replace(/<main id="serviceRoot">[\s\S]*?<\/main>/, '<main id="serviceRoot">'+root.innerHTML+'</main>'));
}
