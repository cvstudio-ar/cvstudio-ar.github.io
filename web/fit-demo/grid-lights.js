/* Destellos vectoriales que siguen las líneas reales de la grilla. */
(() => {
  'use strict';
  const root=document.getElementById('fit-access');
  if(!root)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let dispose=()=>{};
  function attach(){
    dispose();
    const story=root.querySelector('.fit-story');
    if(!story||reduced.matches)return;
    const canvas=document.createElement('canvas');
    canvas.className='fit-grid-lights';canvas.setAttribute('aria-hidden','true');
    story.prepend(canvas);
    const ctx=canvas.getContext('2d');
    if(!ctx){canvas.remove();return;}
    let width=0,height=0,tracks=[],raf=0,previous=0,ended=false;
    function size(){
      width=story.clientWidth;height=story.clientHeight;
      const dpr=Math.min(devicePixelRatio||1,1.5);
      canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
      ctx.setTransform(dpr,0,0,dpr,0,0);
      const columns=Math.max(2,Math.floor(width/24)-1);
      const count=width<500?3:5;
      tracks=Array.from({length:count},(_,i)=>{
        let x=Math.max(1,Math.min(columns,Math.round(columns*(i+1)/(count+1))))*24;
        const points=[{x,y:-120}];
        for(let y=0;y<height+160;y+=24){
          points.push({x,y});
          if(y>0 && y%120===0 && Math.random()<.45){
            const next=Math.max(24,Math.min(columns*24,x+(Math.random()<.5?-24:24)));
            if(next!==x){x=next;points.push({x,y});}
          }
        }
        const segments=[];let total=0;
        for(let j=1;j<points.length;j++){
          const a=points[j-1],b=points[j],length=Math.hypot(b.x-a.x,b.y-a.y);
          segments.push({a,b,length,start:total});total+=length;
        }
        return {segments,total,position:Math.random()*total,speed:20+Math.random()*8};
      });
    }
    function at(track,distance){
      if(distance<0||distance>track.total)return null;
      const s=track.segments.find(s=>distance<=s.start+s.length);
      if(!s)return null;
      const t=(distance-s.start)/s.length;
      return {x:s.a.x+(s.b.x-s.a.x)*t,y:s.a.y+(s.b.y-s.a.y)*t};
    }
    function draw(now){
      if(ended||!canvas.isConnected)return;
      raf=requestAnimationFrame(draw);
      if(document.hidden){previous=now;return;}
      if(previous && now-previous<30)return;
      const delta=previous?Math.min((now-previous)/1000,.1):0;previous=now;
      ctx.clearRect(0,0,width,height);
      for(const track of tracks){
        track.position=(track.position+track.speed*delta)%(track.total+90);
        const head=track.position;
        for(let n=23;n>=0;n--){
          const a=at(track,head-(n+1)*3),b=at(track,head-n*3);
          if(!a||!b)continue;
          const alpha=Math.pow(1-n/24,1.7)*.32;
          ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);
          ctx.lineWidth=1;ctx.strokeStyle='rgba(170,210,105,'+alpha+')';
          ctx.shadowColor='rgba(161,206,98,.22)';ctx.shadowBlur=3;ctx.stroke();
        }
        const point=at(track,head);
        if(point){
          ctx.shadowBlur=4;ctx.fillStyle='rgba(209,235,166,.48)';
          ctx.beginPath();ctx.arc(point.x,point.y,.7,0,Math.PI*2);ctx.fill();
        }
      }
      ctx.shadowBlur=0;
    }
    const resize=new ResizeObserver(size);resize.observe(story);size();
    raf=requestAnimationFrame(draw);
    dispose=()=>{ended=true;cancelAnimationFrame(raf);resize.disconnect();canvas.remove();};
  }
  const observer=new MutationObserver(attach);
  observer.observe(root,{childList:true});
  reduced.addEventListener('change',attach);
  attach();
})();
