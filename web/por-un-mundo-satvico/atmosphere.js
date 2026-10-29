/* Atmósferas de calma. El audio se genera localmente y comienza por gesto explícito. */
'use strict';
(() => {
  let mode = '', muted = true, volume = .28, ctx, master, windFilter, waterFilter, audioTimer, frame;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.documentElement;
  const layer = document.createElement('div');
  layer.className = 'ambient-world'; layer.setAttribute('aria-hidden', 'true');
  layer.innerHTML = '<div class="ambient-scene ambient-night"></div><div class="ambient-scene ambient-day"></div><div class="ambient-aurora"></div><div class="ambient-sun"></div><canvas></canvas>';
  document.body.prepend(layer);
  const canvas = layer.querySelector('canvas'), pen = canvas.getContext('2d');
  const controls = document.createElement('aside');
  controls.className = 'ambient-sound'; controls.setAttribute('aria-label', 'Sonido ambiental');
  controls.hidden = true;
  controls.innerHTML = '<span class="sound-state" role="status" aria-live="polite"></span><button type="button" class="ambient-mute" aria-pressed="false">Activar sonido</button><label>Volumen<input type="range" min="0" max="60" value="28" aria-label="Volumen ambiental"></label><button type="button" class="ambient-reset">Volver al diseño original</button>';
  document.body.append(controls);
  function sync() {
    root.dataset.atmosphere = mode;
    controls.hidden = !mode;
    controls.querySelector('.ambient-mute').textContent = muted ? 'Activar sonido' : 'Silenciar';
    controls.querySelector('.ambient-mute').setAttribute('aria-pressed', String(!muted));
    controls.querySelector('.sound-state').textContent = mode === 'night' ? 'Noche · calma interior' : 'Día · brisa del bosque';
    document.querySelectorAll('[data-ambient]').forEach(b => {
      b.setAttribute('aria-checked', String(mode === b.dataset.ambient));
    });
    gain(); paint();
  }
  function gain() {
    if (!ctx || !master) return;
    const mediaPlaying = [...document.querySelectorAll('audio,video')].some(m => !m.paused && !m.ended);
    master.gain.setTargetAtTime(muted || !mode || document.hidden || mediaPlaying ? 0 : volume, ctx.currentTime, .65);
  }
  function noise(seconds) {
    const buffer = ctx.createBuffer(2, ctx.sampleRate * seconds, ctx.sampleRate);
    for (let c=0;c<2;c++) {
      const data = buffer.getChannelData(c); let brown=0;
      for(let i=0;i<data.length;i++){brown=(brown+.022*(Math.random()*2-1))/1.022;data[i]=brown*4;}
    }
    return buffer;
  }
  function bird() {
    if (!ctx || muted || !mode || document.hidden) return;
    const t=ctx.currentTime;
    if (mode==='day') {
      for(let k=0;k<2;k++) {
        const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';
        o.frequency.setValueAtTime(1600+k*180,t+k*.25);o.frequency.exponentialRampToValueAtTime(2400,t+k*.25+.11);o.frequency.exponentialRampToValueAtTime(1700,t+k*.25+.2);
        g.gain.setValueAtTime(0,t+k*.25);g.gain.linearRampToValueAtTime(.018,t+k*.25+.035);g.gain.exponentialRampToValueAtTime(.0001,t+k*.25+.23);
        o.connect(g).connect(master);o.start(t+k*.25);o.stop(t+k*.25+.25);
      }
    } else {
      [196,294,392].forEach((f,i)=>{
        const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.value=f;
        g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.012/(i+1),t+.15);g.gain.exponentialRampToValueAtTime(.0001,t+7);
        o.connect(g).connect(master);o.start(t);o.stop(t+7);
      });
    }
  }
  async function sound() {
    try {
      if (!ctx) {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) throw Error('Audio no disponible');
        ctx = new Audio();master=ctx.createGain();master.gain.value=0;master.connect(ctx.destination);
        const buffer=noise(12);
        function bed(type,freq,level,rate) {
          const src=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),g=ctx.createGain();
          src.buffer=buffer;src.loop=true;src.playbackRate.value=rate;filter.type=type;filter.frequency.value=freq;g.gain.value=level;
          src.connect(filter).connect(g).connect(master);src.start();return filter;
        }
        windFilter=bed('lowpass',650,.8,.72);waterFilter=bed('bandpass',1300,.25,1.13);
        const lfo=ctx.createOscillator(),depth=ctx.createGain();lfo.frequency.value=.06;depth.gain.value=150;lfo.connect(depth).connect(windFilter.frequency);lfo.start();
        audioTimer=setInterval(bird,11000);
      }
      await ctx.resume(); muted=false;
      windFilter.frequency.setTargetAtTime(mode==='night'?420:850,ctx.currentTime,2);
      waterFilter.frequency.setTargetAtTime(mode==='night'?800:1400,ctx.currentTime,2);
    } catch {
      muted=true;controls.querySelector('.sound-state').textContent='El sonido no está disponible en este navegador.';
      return false;
    }
    return true;
  }
  async function activate(next) {
    if(mode===next){mode='';muted=true;sync();return;}
    mode=next;sync();
    if(await sound()) sync();
  }
  function mount() {
    const top=document.querySelector('#practicas'), bottom=document.querySelector('.demo-caption');
    if(top && !top.querySelector('[data-ambient]')) {
      const row=document.createElement('div');row.className='ambient-trigger-row';
      row.innerHTML='<button type="button" class="ambient-switch" role="switch" aria-checked="false" data-ambient="night"><span class="switch-track"><span>☾</span></span><span><strong>Apagá la luz y presenciá la magia</strong><small>Una pausa de luz, calma y sonido</small></span></button>';
      top.prepend(row);
    }
    if(bottom && !document.querySelector('.ambient-day-row')) {
      const row=document.createElement('div');row.className='ambient-day-row wrap';
      row.innerHTML='<button type="button" class="ambient-switch day-switch" role="switch" aria-checked="false" data-ambient="day"><span class="switch-track"><span>☀</span></span><span><strong>Encendé la luz</strong><small>Respirá la calma del bosque</small></span></button>';
      bottom.before(row);
    }
    document.querySelectorAll('[data-ambient]').forEach(b=>b.setAttribute('aria-checked',String(mode===b.dataset.ambient)));
    root.classList.toggle('ambient-admin',location.hash.startsWith('#admin'));
    root.classList.toggle('ambient-still',!!document.querySelector('.practice-ribbon.is-still'));
  }
  new MutationObserver(mount).observe(document.querySelector('main'),{childList:true,subtree:true});mount();
  document.addEventListener('click', e=>{
    const b=e.target.closest('[data-ambient]');if(b)activate(b.dataset.ambient);
  });
  controls.querySelector('.ambient-mute').onclick=async()=>{if(muted){if(await sound())sync();}else{muted=true;sync();}};
  controls.querySelector('input').oninput=e=>{volume=Number(e.target.value)/100;gain();};
  controls.querySelector('.ambient-reset').onclick=()=>{mode='';muted=true;sync();};
  document.addEventListener('play',gain,true);document.addEventListener('pause',gain,true);document.addEventListener('ended',gain,true);
  document.addEventListener('visibilitychange',()=>{gain();paint();});
  let w=0,h=0, particles=[];
  function resize() {
    w=innerWidth;h=innerHeight;const dpr=Math.min(devicePixelRatio||1,1.5);
    canvas.width=w*dpr;canvas.height=h*dpr;pen.setTransform(dpr,0,0,dpr,0,0);
    particles=Array.from({length:w<700?32:65},()=>({x:Math.random()*w,y:Math.random()*h,r:.6+Math.random()*1.5,v:5+Math.random()*12,phase:Math.random()*7}));paint();
  }
  let last=0;
  function draw(t) {
    const dt=Math.min((t-last)/1000,.05);last=t;pen.clearRect(0,0,w,h);
    const night=mode==='night';
    particles.forEach(p=>{
      if(!reduced.matches&&!root.classList.contains('ambient-still')){p.y-=p.v*dt;p.x+=Math.sin(t*.00025+p.phase)*dt*5;if(p.y < -8)p.y=h+8;}
      const glow=.25+.5*(.5+.5*Math.sin(t*.0006+p.phase));
      pen.beginPath();pen.fillStyle=night?`rgba(255,211,148,${glow})`:`rgba(221,255,177,${glow})`;
      pen.shadowColor=night?'#ffc684':'#caffb0';pen.shadowBlur=10;pen.arc(p.x,p.y,p.r,0,Math.PI*2);pen.fill();
    });
    if(mode&&!document.hidden&&!reduced.matches&&!root.classList.contains('ambient-still'))frame=requestAnimationFrame(draw);
  }
  function paint(){cancelAnimationFrame(frame);if(mode&&!document.hidden){last=performance.now();draw(last);}else pen.clearRect(0,0,w,h);}
  window.addEventListener('resize',resize);reduced.addEventListener('change',paint);resize();
  window.addEventListener('pageshow',e=>{if(e.persisted){if(ctx&&!muted&&mode)ctx.resume();clearInterval(audioTimer);if(ctx)audioTimer=setInterval(bird,11000);sync();}});
  window.addEventListener('pagehide',()=>{clearInterval(audioTimer);cancelAnimationFrame(frame);if(ctx)ctx.suspend();});
})();
