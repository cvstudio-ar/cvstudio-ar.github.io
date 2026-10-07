/* Experimental, self-contained: remove this script and .piano-ripple to undo. */
(()=>{
  const hero=document.querySelector('.hero');
  if(!hero)return;
  let ctx=null,master=null,lastKey=-1,lastAt=0,glowTimer;const voices=new Set();
  const names=['Do','Re','Mi','Fa','Sol','La','Si'],semitones=[0,2,4,5,7,9,11];
  function quiet(){for(const v of voices){try{v.gain.gain.cancelScheduledValues(ctx.currentTime);v.gain.gain.setTargetAtTime(0,ctx.currentTime,.015);for(const o of v.oscs)o.stop(ctx.currentTime+.08)}catch{}}voices.clear();hero.classList.remove('piano-note');lastKey=-1}
  function prepare(){try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;if(!ctx){ctx=new C();master=ctx.createGain();master.gain.value=.1;const compressor=ctx.createDynamicsCompressor();master.connect(compressor);compressor.connect(ctx.destination)}if(ctx.state==='suspended')ctx.resume().catch(()=>{})}catch{}}
  // Ordinary clicks/taps unlock browser audio; there is no dedicated sound control.
  document.addEventListener('pointerdown',prepare,{passive:true});document.addEventListener('keydown',prepare);
  // Perspective hit region in the original 1672 × 941 artwork. The same cover
  // transform as the CSS background keeps it aligned on desktop and mobile.
  function keyAt(clientX,clientY){const r=hero.getBoundingClientRect(),scale=Math.max(r.width/1672,r.height/941),mobile=matchMedia('(max-width:760px)').matches;const x=(clientX-r.left-(r.width-1672*scale)*(mobile?.65:.5))/scale,y=(clientY-r.top-(r.height-941*scale)*(mobile?1:.5))/scale;
    const dx=x-540,dy=y-357,det=910*(-77)-584*250,u=(dx*(-77)-dy*250)/det,v=(910*dy-584*dx)/det;if(u<0||u>=1||v<0||v>1)return null;
    const position=u*22,white=Math.floor(position),fraction=position-white,degree=white%7;let midi=48+12*Math.floor(white/7)+semitones[degree],name=names[degree];
    // Black keys sit between C–D, D–E, F–G, G–A and A–B.
    if(v>.43&&fraction>.7&&[0,1,3,4,5].includes(degree)){midi++;name+='♯'}return{midi,name,x:clientX-r.left,y:clientY-r.top};
  }
  function note(k){const now=ctx.currentTime;if(k.midi===lastKey||now-lastAt<.065)return;lastKey=k.midi;lastAt=now;if(voices.size>=6){const first=voices.values().next().value;for(const o of first.oscs){try{o.stop()}catch{}}voices.delete(first)}
    const gain=ctx.createGain(),voice={gain,oscs:[]};gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(.8,now+.008);gain.gain.exponentialRampToValueAtTime(.22,now+.18);gain.gain.exponentialRampToValueAtTime(.001,now+1.25);gain.connect(master);voices.add(voice);
    const frequency=440*2**((k.midi-69)/12);[1,.36,.14,.055].forEach((amplitude,i)=>{const osc=ctx.createOscillator(),partial=ctx.createGain();osc.type='sine';osc.frequency.value=frequency*(i+1)*(i?1+i*.00035:1);partial.gain.value=amplitude;osc.connect(partial);partial.connect(gain);voice.oscs.push(osc);osc.start(now);osc.stop(now+1.3);if(i===0)osc.onended=()=>{voices.delete(voice);gain.disconnect()}});
    hero.style.setProperty('--piano-x',k.x+'px');hero.style.setProperty('--piano-y',k.y+'px');hero.classList.add('piano-note');clearTimeout(glowTimer);glowTimer=setTimeout(()=>hero.classList.remove('piano-note'),260);
  }
  function play(event){prepare();if(!ctx||ctx.state!=='running'||event.target.closest('button,a,.hero-copy,.pack-art')||document.querySelector('.audio-button.playing'))return;const k=keyAt(event.clientX,event.clientY);if(k)note(k);else lastKey=-1}
  hero.addEventListener('pointermove',event=>{if(event.pointerType==='mouse')play(event)});hero.addEventListener('pointerdown',event=>{lastKey=-1;play(event)});hero.addEventListener('pointerleave',()=>{lastKey=-1;hero.classList.remove('piano-note')});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){quiet();if(ctx)ctx.suspend().catch(()=>{})}});
})();
