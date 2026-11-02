'use strict';
(function(A){
// Authored registration from assets/worn/worn.json; no fetch, including file://.
const SPRITES={"flat":{"x":193,"y":0,"w":550,"h":860},"block":{"x":200,"y":0,"w":532,"h":862},"kitten":{"x":197,"y":0,"w":535,"h":863},"stiletto6":{"x":198,"y":0,"w":535,"h":853},"stiletto9":{"x":203,"y":0,"w":524,"h":868},"wedge":{"x":204,"y":0,"w":527,"h":863},"maryjane":{"x":185,"y":0,"w":550,"h":856},"ballet":{"x":182,"y":0,"w":550,"h":860},"slingback":{"x":192,"y":0,"w":547,"h":854},"loafer":{"x":160,"y":0,"w":575,"h":855},"platform":{"x":203,"y":0,"w":526,"h":889},"bootie":{"x":176,"y":0,"w":526,"h":854},"pearlpump":{"x":180,"y":0,"w":548,"h":859},"bowsling":{"x":185,"y":0,"w":544,"h":857},"crystalpump":{"x":201,"y":0,"w":534,"h":857},"studpump":{"x":202,"y":0,"w":524,"h":864},"bowmule":{"x":170,"y":0,"w":568,"h":854},"pearlheel":{"x":190,"y":0,"w":539,"h":862},"luciteheel":{"x":198,"y":0,"w":540,"h":866},"crystalsandal":{"x":198,"y":0,"w":521,"h":862},"flat_frill":{"x":193,"y":0,"w":551,"h":860},"flat_lace":{"x":193,"y":0,"w":550,"h":860},"block_frill":{"x":200,"y":0,"w":532,"h":862},"block_lace":{"x":200,"y":0,"w":532,"h":861},"kitten_frill":{"x":197,"y":0,"w":535,"h":863},"kitten_lace":{"x":197,"y":0,"w":535,"h":863},"stiletto6_frill":{"x":198,"y":0,"w":535,"h":853},"stiletto6_lace":{"x":198,"y":0,"w":535,"h":854},"stiletto9_frill":{"x":203,"y":0,"w":524,"h":869},"stiletto9_lace":{"x":204,"y":0,"w":523,"h":868},"wedge_frill":{"x":204,"y":0,"w":527,"h":863},"wedge_lace":{"x":204,"y":0,"w":527,"h":863},"maryjane_frill":{"x":186,"y":0,"w":549,"h":856},"maryjane_lace":{"x":186,"y":0,"w":549,"h":855},"ballet_frill":{"x":183,"y":0,"w":549,"h":860},"ballet_lace":{"x":182,"y":0,"w":550,"h":860},"slingback_frill":{"x":190,"y":0,"w":549,"h":854},"slingback_lace":{"x":192,"y":0,"w":548,"h":854},"loafer_frill":{"x":160,"y":0,"w":575,"h":855},"loafer_lace":{"x":160,"y":0,"w":575,"h":855},"platform_frill":{"x":203,"y":0,"w":526,"h":889},"platform_lace":{"x":203,"y":0,"w":526,"h":889},"bootie_frill":{"x":176,"y":0,"w":526,"h":854},"bootie_lace":{"x":176,"y":0,"w":526,"h":854},"pearlpump_frill":{"x":180,"y":0,"w":548,"h":859},"pearlpump_lace":{"x":180,"y":0,"w":549,"h":860},"bowsling_frill":{"x":185,"y":0,"w":546,"h":858},"bowsling_lace":{"x":185,"y":0,"w":546,"h":857},"crystalpump_frill":{"x":201,"y":0,"w":534,"h":856},"crystalpump_lace":{"x":201,"y":0,"w":534,"h":856},"studpump_frill":{"x":202,"y":0,"w":524,"h":864},"studpump_lace":{"x":202,"y":0,"w":524,"h":864},"bowmule_frill":{"x":171,"y":0,"w":567,"h":854},"bowmule_lace":{"x":171,"y":0,"w":567,"h":854},"pearlheel_frill":{"x":192,"y":0,"w":537,"h":862},"pearlheel_lace":{"x":192,"y":0,"w":537,"h":863},"luciteheel_frill":{"x":198,"y":0,"w":539,"h":866},"luciteheel_lace":{"x":198,"y":0,"w":541,"h":866},"crystalsandal_frill":{"x":196,"y":0,"w":524,"h":863},"crystalsandal_lace":{"x":196,"y":0,"w":524,"h":863}};
const ASSET_V='20261103b';
const LIMIT=8, sources=new Map(), loading=new Map(), cache=new Map(), jobs=new Map(), tokens=new WeakMap();
const make=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
function remember(map,key,value,limit=LIMIT){map.delete(key);map.set(key,value);while(map.size>limit)map.delete(map.keys().next().value);return value;}
function image(src){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(new Error('Missing worn sprite: '+src));im.src=src;});}
// WebKit ignores CanvasRenderingContext2D.filter and file:// forbids pixel
// reads, so colour transforms use composite blend modes, masks ship with
// real alpha (white RGB), and blur is done by down/up sampling.
function gray(src,w,h){
 const c=make(w,h),p=c.getContext('2d');p.drawImage(src,0,0);
 p.globalCompositeOperation='saturation';p.fillStyle='#808080';p.fillRect(0,0,w,h);
 p.globalCompositeOperation='destination-in';p.drawImage(src,0,0);return c;
}
function tint(src,colour,w,h){
 // src is the baked grey sock shade (RGB = luminance, alpha = sock).
 // colour * luminance / 205: multiply, then lift by 255/205 with 'lighter'.
 const c=make(w,h),p=c.getContext('2d');p.drawImage(src,0,0);
 p.globalCompositeOperation='multiply';p.fillStyle=colour;p.fillRect(0,0,w,h);
 p.globalCompositeOperation='destination-in';p.drawImage(src,0,0);
 const t=make(w,h),q=t.getContext('2d');q.drawImage(c,0,0);q.globalCompositeOperation='lighter';q.globalAlpha=.24;q.drawImage(c,0,0);
 q.globalAlpha=1;q.globalCompositeOperation='destination-in';q.drawImage(src,0,0);return t;
}
function blurred(src,w,h,r){
 const k=Math.max(2,Math.round(r/2)),sw=Math.max(1,Math.round(w/k)),sh=Math.max(1,Math.round(h/k));
 const a=make(sw,sh),pa=a.getContext('2d');pa.imageSmoothingEnabled=true;pa.imageSmoothingQuality='high';pa.drawImage(src,0,0,sw,sh);
 const b=make(sw,sh),pb=b.getContext('2d');pb.drawImage(a,0,0);pa.clearRect(0,0,sw,sh);
 for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1],[0,0]]){pa.globalAlpha=.2;pa.drawImage(b,dx,dy);}pa.globalAlpha=1;
 const c=make(w,h),pc=c.getContext('2d');pc.imageSmoothingEnabled=true;pc.imageSmoothingQuality='high';pc.drawImage(a,0,0,w,h);return c;
}
const SOCK_COLOURS={pink:'#ffd4e4',mint:'#d6f4e7',cream:'#fff1d6',white:'#fffdfa',black:'#292735'};
function alphaMask(gray,sprite,w,h){
 const c=make(w,h),p=c.getContext('2d');p.drawImage(gray,0,0);
 p.globalCompositeOperation='destination-in';p.drawImage(sprite,0,0);return c;
}
async function load(heel){
 if(sources.has(heel))return remember(sources,heel,sources.get(heel));if(loading.has(heel))return loading.get(heel);
 const short=heel.endsWith('_frill')||heel.endsWith('_lace');
 const job=Promise.all([image('assets/worn/'+heel+'.webp'+'?v='+ASSET_V),image('assets/worn/'+heel+'_mask.webp'+'?v='+ASSET_V),short?image('assets/worn/'+heel+'_sock.webp'+'?v='+ASSET_V):null]).then(([sprite,gray,sockGray])=>{
  const {w,h}=SPRITES[heel];if([sprite,gray,...(sockGray?[sockGray]:[])].some(im=>im.naturalWidth!==w||im.naturalHeight!==h))throw new Error('Invalid worn sprite dimensions: '+heel);
  const mask=alphaMask(gray,sprite,w,h),sockMask=sockGray?alphaMask(sockGray,sprite,w,h):null;
  // Dye masks stop at the upper: preserve the painted outsole immediately
  // below it as footwear too, rather than laying fishnet over the sole.
  const shoeCover=make(w,h),cover=shoeCover.getContext('2d');
  cover.drawImage(mask,0,0);
  cover.globalCompositeOperation='destination-in';cover.drawImage(sprite,0,0);
  const skin=make(w,h),p=skin.getContext('2d');p.drawImage(sprite,0,0);p.globalCompositeOperation='destination-out';p.drawImage(shoeCover,0,0);
  // Extend the top alpha before blurring: hosiery must have no horizontal seam.
  const padded=make(w+72,h+72),b=padded.getContext('2d');b.drawImage(sprite,36,36);b.drawImage(sprite,0,0,w,1,36,0,w,36);
  const edge=make(w,h),e=edge.getContext('2d');e.drawImage(skin,0,0);e.globalCompositeOperation='source-in';e.fillStyle='#211a30';e.fillRect(0,0,w,h);
  e.globalCompositeOperation='destination-out';e.drawImage(blurred(padded,w+72,h+72,18),-36,-36);
  return remember(sources,heel,{sprite,mask,sockMask,sockShade:sockGray,skin,edge});
 }).finally(()=>loading.delete(heel));loading.set(heel,job);return job;
}
function hosiery(source,o,w,h){
 const {sprite,sockMask,skin,edge}=source,c=make(w,h),p=c.getContext('2d'),mono=()=>source.gray||(source.gray=gray(sprite,w,h));
 let colour=SOCK_COLOURS[o.color]||SOCK_COLOURS.cream;
 if(sockMask){
  p.drawImage(tint(source.sockShade,colour,w,h),0,0);
  p.globalCompositeOperation='destination-in';p.drawImage(sockMask,0,0);return c;
 }
 if(o.sock==='blacksheer')colour='#262430';
 if(o.sock==='pantyhose'&&['cream','white'].includes(o.color))colour='#e6bd9f';
 const opacity=({sheer:.35,pantyhose:.35,blacksheer:.55,opaque:.90,knee:.85,thigh:.85,fishnet:.15})[o.sock];
 p.drawImage(sprite,0,0);
 if(['opaque','knee','thigh'].includes(o.sock)){
  // Neutral source luminance retains the calf's volume beneath solid cloth.
  p.drawImage(mono(),0,0);
  p.globalCompositeOperation='source-atop';p.globalAlpha=opacity;p.fillStyle=colour;p.fillRect(0,0,w,h);p.globalAlpha=1;
  p.globalCompositeOperation='multiply';p.globalAlpha=.16;p.drawImage(mono(),0,0);
 }else{
  p.globalCompositeOperation='multiply';p.globalAlpha=opacity;p.fillStyle=colour;p.fillRect(0,0,w,h);
 }
 p.globalCompositeOperation='source-atop';p.globalAlpha=o.sock==='blacksheer'?.85:.5;p.drawImage(edge,0,0);
 p.globalCompositeOperation='screen';p.globalAlpha=.035;p.drawImage(mono(),0,0);p.globalAlpha=1;
 if(o.sock==='fishnet'){
  p.globalCompositeOperation='source-atop';p.strokeStyle=colour;p.lineWidth=1.1;p.globalAlpha=.8;p.beginPath();
  for(let x=-h;x<w+h;x+=14){p.moveTo(x,0);p.lineTo(x+h,h);p.moveTo(x,0);p.lineTo(x-h,h);}p.stroke();p.globalAlpha=1;
 }
 p.globalCompositeOperation='destination-in';p.drawImage(skin,0,0);return c;
}
async function tinted(d,o){
 const variant=d.heel+(['frill','lace'].includes(o.sock)?'_'+o.sock:''),ref=SPRITES[variant];
 // Composite at the authored size once; projection to any target size is a
 // drawImage operation and never allocates a second full hosiery composite.
 const key=A.designKey(d)+'|'+o.sock+'|'+o.color+'|'+ref.w+'x'+ref.h;
 if(cache.has(key))return remember(cache,key,cache.get(key));if(jobs.has(key))return jobs.get(key);
 const job=(async()=>{
  const source=await load(variant),{sprite,mask}=source,{w,h}=SPRITES[variant];
  if(d.material==='lace')await A.CoutureFinish?.loadLace();
  const out=make(w,h),p=out.getContext('2d'),dye=make(w,h),q=dye.getContext('2d');
  q.drawImage(sprite,0,0);q.globalCompositeOperation='multiply';q.fillStyle=A.option('color',d.color)[3];q.fillRect(0,0,w,h);
  q.globalCompositeOperation='screen';q.globalAlpha=['velvet','suede'].includes(d.material)?.08:.25;q.drawImage(sprite,0,0);q.globalAlpha=1;q.globalCompositeOperation='source-over';
  const finish=make(w,h),f=finish.getContext('2d');f.save();f.translate(0,h*.62);f.scale(w/1024,h*.38/640);
  A.CoutureFinish?.drawFinish(f,d,1024,640,'product');A.CoutureFinish?.drawPattern(f,d,1024,640,'product');f.restore();
  q.drawImage(finish,0,0);q.globalCompositeOperation='destination-in';q.drawImage(mask,0,0);
  // Re-keyed shoe masks can overlap a few yarn pixels at narrow openings.
  if(source.sockMask){q.globalCompositeOperation='destination-out';q.drawImage(source.sockMask,0,0);}
  p.drawImage(sprite,0,0);
  if(o.sock!=='none'){
   // Full-leg hosiery replaces the bare skin (not over it), so partially
   // transparent silhouette pixels carry no pale skin fringe.
   if(!source.sockMask){p.globalCompositeOperation='destination-out';p.drawImage(source.skin,0,0);p.globalCompositeOperation='source-over';}
   p.drawImage(hosiery(source,o,w,h),0,0);
  }
  // Shoe is always the final layer, covering the sock at the original opening.
  p.globalCompositeOperation='source-atop';p.drawImage(dye,0,0);p.globalCompositeOperation='source-over';
  return remember(cache,key,out);
 })().finally(()=>jobs.delete(key));jobs.set(key,job);return job;
}
function shadow(p,x,y,rx,ry){
 p.save();p.globalCompositeOperation='multiply';p.translate(x,y);p.scale(1,ry/rx);
 const g=p.createRadialGradient(0,0,0,0,0,rx);g.addColorStop(0,'#4b5e5060');g.addColorStop(.5,'#4b5e5028');g.addColorStop(1,'#4b5e5000');
 p.fillStyle=g;p.beginPath();p.arc(0,0,rx,0,Math.PI*2);p.fill();p.restore();
}
async function paint(target,input,options,sceneId='salon',cropped=false,current=()=>true){
 const token={};tokens.set(target,token);const d=A.cleanDesign(input),o=A.cleanFittingOptions(options);if(!has(d.heel))return false;
 let sprite;try{sprite=await tinted(d,o);}catch(error){return false;}
 if(tokens.get(target)!==token||!current())return false;
 const ref=SPRITES[d.heel+(['frill','lace'].includes(o.sock)?'_'+o.sock:'')],g0=A.Showcase.project('salon',1220,1000,true),g=A.Showcase.project(sceneId,target.width,target.height,cropped),k=g.scale/g0.scale;
 const x=g.cx+(ref.x-g0.cx)*k,y=g.floor+(ref.y-g0.floor)*k,w=ref.w*k,h=ref.h*k,p=target.getContext('2d');
 p.clearRect(0,0,target.width,target.height);p.imageSmoothingEnabled=true;p.imageSmoothingQuality='high';
 const contacts=[[x+w*.29,y+h*.925],[x+w*.64,y+h*.994]];
 contacts.forEach(([cx,cy])=>shadow(p,cx,cy,w*.24,Math.max(1,h*.009)));
 if(y>0){
  const rows=Math.max(1,Math.round(ref.h*.06));p.drawImage(sprite,0,0,ref.w,rows,x,0,w,y+rows*k);
  p.drawImage(sprite,0,rows,ref.w,ref.h-rows,x,y+rows*k,w,h-rows*k);
 }else p.drawImage(sprite,x,y,w,h);
 Object.assign(target.dataset,{renderer:'worn-sprite',fitting2dReady:'true',heel:d.heel,color:d.color,material:d.material,pattern:d.pattern,fallback:'false',feet:'2',sock:o.sock,sockColor:o.color,legFrame:`0,0,${ref.w},${ref.h}`,pairPose:'approved-standing',pairLayout:JSON.stringify({x,y,w,h,scale:k,floor:g.floor}),platformLayout:JSON.stringify(g),platformCount:'0',platformBaked:'true',fixedFraming:g.composition.join('x'),shadowContacts:JSON.stringify(contacts),legContinuation:'opaque-past-frame',skinFinish:'approved-sprite'});return true;
}
function has(heel){return Object.prototype.hasOwnProperty.call(SPRITES,heel);}
A.WornSprites={has,paint,info:()=>({cacheEntries:cache.size,cacheLimit:LIMIT,sourceEntries:sources.size,pending:jobs.size})};
})(globalThis.SweetShoe=globalThis.SweetShoe||{});
