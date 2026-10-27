(function(root){
 'use strict';
 const A=root.SweetShoe||(root.SweetShoe={});
 const COUNT=40,STEP=125,STATIC='assets/mentor/mentor_think.webp';
 // Calibrated to the approved static alpha: head y20, soles y980. Source
 // frames remain byte-for-byte user artwork; only the canvas camera is mapped.
 const SCALE=960/1021,DX=419.5-436*SCALE,DY=20-28*SCALE;
 const framePath=i=>'assets/mentor/think_anim/think_'+String(i+1).padStart(2,'0')+'.webp';
 A.MentorAnimation={framePath,frameCount:COUNT,frameDuration:STEP,calibration:{scale:SCALE,x:DX,y:DY}};
 if(!root.document||!root.MutationObserver)return;
 const motion=root.matchMedia('(prefers-reduced-motion: reduce)'),targets=new Map();
 let urls=null,loading=null,failed=false,timer=0,index=0,current=null,next=null,epoch=0,running=false,deadline=0;
 function eligible(im){return im.isConnected&&!im.classList.contains('leaving')&&im.getAttribute('src')===STATIC;}
 function visible(im){if(im.closest('[inert],[hidden]'))return false;const r=im.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(im).visibility!=='hidden'&&r.right>0&&r.bottom>0&&r.left<innerWidth&&r.top<innerHeight;}
 function restore(im,entry){entry.canvas.remove();im.style.opacity=entry.opacity;im.style.animation=entry.animation;targets.delete(im);}
 function reset(){clearTimeout(timer);timer=0;epoch++;current=null;next=null;index=0;deadline=0;for(const [im,entry]of [...targets])restore(im,entry);}
 async function prepare(){
  if(urls)return urls;if(loading)return loading;
  loading=(async()=>{const values=new Array(COUNT);let cursor=0;
   try{const jobs=await Promise.allSettled(Array.from({length:4},async()=>{while(cursor<COUNT){const i=cursor++,res=await fetch(framePath(i),{cache:'force-cache'});if(!res.ok)throw Error('Mimi frame unavailable');values[i]=URL.createObjectURL(await res.blob());}}));if(jobs.some(job=>job.status==='rejected'))throw Error('Mimi frames unavailable');urls=values;return urls;}
   catch(e){for(const value of values)if(value)URL.revokeObjectURL(value);failed=true;reset();return null;}
  })();return loading;
 }
 async function decode(i){const im=new Image();im.src=urls[i];await im.decode();return im;}
 function attach(im){
  const canvas=document.createElement('canvas');canvas.width=800;canvas.height=1000;canvas.setAttribute('aria-hidden','true');canvas.dataset.mentorAnimation='think';
  const entry={canvas,opacity:im.style.opacity,animation:im.style.animation};targets.set(im,entry);
  im.style.animation='none';im.style.opacity='0';im.after(canvas);position(im,entry);return entry;
 }
 function position(im,entry){const s=getComputedStyle(im),c=entry.canvas.style;for(const key of ['position','left','right','top','bottom','width','height','translate','transform','transformOrigin','zIndex'])c[key]=s[key];c.pointerEvents='none';c.maxWidth='none';}
 function paint(){for(const [im,entry]of [...targets]){if(!eligible(im)){restore(im,entry);continue;}position(im,entry);const p=entry.canvas.getContext('2d');p.clearRect(0,0,800,1000);p.imageSmoothingEnabled=true;p.imageSmoothingQuality='high';p.drawImage(current,DX,DY,848*SCALE,1072*SCALE);entry.canvas.dataset.frame=String(index+1);}}
 async function tick(token){
  if(running)return;running=true;try{
  timer=0;if(token!==epoch||document.hidden||motion.matches||failed)return;
  const candidates=[...document.querySelectorAll('img[src="'+STATIC+'"]')].filter(im=>eligible(im)&&visible(im));
  if(!candidates.length){reset();return;}
  try{
   if(!current){if(!await prepare()||token!==epoch)return;const decoded=await decode(index);if(token!==epoch)return;current=decoded;}
   else if(next){const decoded=await next;if(token!==epoch)return;current=decoded;index=(index+1)%COUNT;}
   for(const im of candidates)if(!targets.has(im))attach(im);
   paint();next=decode((index+1)%COUNT);next.catch(()=>{});
   const now=performance.now();deadline=Math.max((deadline||now)+STEP,now);timer=setTimeout(()=>tick(token),deadline-now);
  }catch(e){failed=true;reset();}
  }finally{running=false;if(!timer&&!current)scan();}
 }
 function scan(){
  for(const [im,entry]of [...targets])if(!eligible(im))restore(im,entry);
  if(motion.matches||document.hidden){reset();return;}
  if(!running&&!timer&&!current&&!failed&&[...document.querySelectorAll('img[src="'+STATIC+'"]')].some(im=>eligible(im)&&visible(im)))timer=setTimeout(()=>tick(epoch),700);
 }
 // Register after the initial page paints. Only an actual think pose starts
 // loading frames; title/onboarding have no animation download dependency.
 function start(){new MutationObserver(scan).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['src','class','inert','hidden']});document.addEventListener('visibilitychange',()=>{if(document.hidden)reset();else scan();});motion.addEventListener('change',scan);root.addEventListener('resize',()=>{for(const [im,entry]of targets)position(im,entry);});scan();}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>requestAnimationFrame(start),{once:true});else requestAnimationFrame(start);
})(globalThis);
