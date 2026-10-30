const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const app=fs.readFileSync('web/por-un-mundo-satvico/app.js','utf8');
const functions=app.slice(app.indexOf(' function heroMediaMarkup('),app.indexOf('\n async function heroFileSize'));
test('presentation starts at zero with sound; failed playback keeps the start control',async()=>{
 let removed=false,notice=false;
 const video={currentTime:8,muted:true,defaultMuted:true,volume:0,controls:false,async play(){assert.equal(this.currentTime,0);assert.equal(this.muted,false);assert.equal(this.volume,1);}};
 const button={disabled:false,remove(){removed=true;}};
 const c={$:()=>video,notify:()=>notice=true,heroIsVideo:()=>true,esc:x=>x,media:x=>x,icon:()=>''};vm.createContext(c);vm.runInContext(functions,c);
 const markup=c.heroMediaMarkup({heroImage:'test.mp4'});
 assert(markup.includes('poster="assets/portada-satvico.webp"'));assert(c.heroMediaMarkup({heroImage:'test.mp4',heroPoster:'https://example.com/poster.webp'}).includes('poster="https://example.com/poster.webp"'));assert(!markup.includes('instructora-cuencos'));assert(!markup.includes('autoplay'));assert(!markup.includes(' muted'));assert(markup.includes('play-hero-sound'));
 await c.startHeroVideo(button);assert(removed);assert(video.controls);
 removed=false;video.play=async()=>{throw Error('blocked');};await c.startHeroVideo(button);assert(!removed);assert(!button.disabled);assert(notice);
});
test('night/day toggles keep one animation loop, release audio and stop behind a playing video',async()=>{
 const handlers={},frames=new Map(),classes=new Set(),media=[];let frameId=0,ctx,bufferChannels;
 const audioNode=()=>({gain:{value:0,setTargetAtTime(){},setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},frequency:{value:0,setTargetAtTime(){}},playbackRate:{value:1},connect(to){return to;},start(){},stop(){}});
 class Audio{constructor(){ctx=this;this.state='suspended';this.sampleRate=8000;this.currentTime=0;this.destination=audioNode();}createGain(){return audioNode();}createBufferSource(){return audioNode();}createBiquadFilter(){return audioNode();}createOscillator(){return audioNode();}createBuffer(ch,len){bufferChannels=ch;assert(len<=16000);return{numberOfChannels:ch,getChannelData:()=>new Float32Array(len)};}async resume(){this.state='running';}async suspend(){this.state='suspended';}}
 const root={dataset:{},classList:{contains:k=>classes.has(k),toggle(k,on){if(on)classes.add(k);else classes.delete(k);}}};
 const pen={setTransform(){},clearRect(){},beginPath(){},arc(){},fill(){}};
 const canvas={getContext:()=>pen};
 const doc={hidden:false,documentElement:root,body:{prepend(){}},createElement:()=>({setAttribute(){},querySelector:()=>canvas}),querySelector:()=>null,querySelectorAll:s=>s==='audio,video'?media:[],addEventListener:(k,f)=>handlers[k]=f};
 const c={document:doc,location:{hash:''},window:{AudioContext:Audio,addEventListener(){}},MutationObserver:class{observe(){}},matchMedia:()=>({matches:false,addEventListener(){}}),requestAnimationFrame:f=>{frames.set(++frameId,f);return frameId;},cancelAnimationFrame:id=>frames.delete(id),setInterval:()=>1,clearInterval(){},innerWidth:390,innerHeight:844,devicePixelRatio:3,performance:{now:()=>1000},Math};vm.createContext(c);vm.runInContext(fs.readFileSync('web/por-un-mundo-satvico/atmosphere.js','utf8'),c);
 const click=async mode=>{handlers.click({target:{closest:()=>({dataset:{ambient:mode}})}});await new Promise(r=>setImmediate(r));};
 await click('night');assert.equal(root.dataset.atmosphere,'night');assert.equal(bufferChannels,1);assert.equal(frames.size,1);assert.equal(ctx.state,'running');
 await click('day');assert.equal(root.dataset.atmosphere,'day');assert.equal(frames.size,1);
 media.push({paused:false,ended:false,muted:false,volume:1});handlers.play();assert.equal(ctx.state,'suspended');
 media[0].paused=true;handlers.pause();assert.equal(ctx.state,'running');
 await click('day');assert.equal(root.dataset.atmosphere,'');assert.equal(frames.size,0);assert.equal(ctx.state,'suspended');
});
