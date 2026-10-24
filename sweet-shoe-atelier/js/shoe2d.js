'use strict';
(function(A){
// A design is a finish applied to one immutable painting. Neither a colour nor
// a fabric selection changes the source frame, silhouette, or camera.
const WIDTH=1024,HEIGHT=640,HEELS=['flat','block','kitten','wedge'];
// Binding/insole/sole authoring masks ship with the kit. Their pixels already
// remain in the full base, so the preview need not decode those extra bitmaps.
const PARTS=['base','upper','shadow','highlight'];
const COLORS={pink:'#ffadc9',cream:'#fff0d2',blue:'#a9daff',green:'#c6e7a5',purple:'#d6b9ff',peach:'#ffc09e',rose:'#f478a4',black:'#696883'};
const loads=new Map(),cache=new Map(),jobs=new Map(),paintTokens=new WeakMap(),fallbacks=new Map();
const CACHE_LIMIT=8;
const ACCESSORIES={bow:'bow',pearls:'pearls',laces:'laces',maryjane:'maryjane',drop:'drop',crystal:'crystal',flower:'flower',pearl:'pearl'};
let accessoryLoad;
const ANCHORS={
 flat:{toe:[285,432],back:[854,294],strap:[576,352],lace:[350,405],strapAngle:.70},
 kitten:{toe:[285,445],back:[855,197],strap:[594,318],lace:[352,421],strapAngle:.90},
 block:{toe:[285,446],back:[854,197],strap:[595,319],lace:[352,423],strapAngle:.87},
 wedge:{toe:[285,426],back:[855,188],strap:[595,304],lace:[352,405],strapAngle:.87}
};
function accessories(){return accessoryLoad||(accessoryLoad=Promise.all(Object.entries(ACCESSORIES).map(async([name,file])=>[name,await image('assets/shoe2d/accessories/'+file+'.webp')])).then(Object.fromEntries));}
function canvas(){const c=document.createElement('canvas');c.width=WIDTH;c.height=HEIGHT;return c;}
function clean(design){return A.cleanDesign?A.cleanDesign(design):{color:'pink',material:'satin',pattern:'none',strap:'none',decoration:'none',heel:'flat',charm:'none',...design};}
function key(design){return [design.heel,design.color,design.material,design.pattern,design.strap,design.decoration,design.charm].join('|');}
function fullKey(design){return A.designKey?A.designKey(design):Object.values(design).join('|');}
function image(url){return new Promise(resolve=>{const im=new Image();im.decoding='async';im.onload=()=>resolve(im);im.onerror=()=>resolve(null);im.src=url;});}
function load(heel){
 if(loads.has(heel))return loads.get(heel);
 const promise=Promise.all(PARTS.map(async part=>{
  const im=await image('assets/shoe2d/'+heel+'_'+part+'.webp');
  return [part,im?.naturalWidth===WIDTH&&im?.naturalHeight===HEIGHT?im:null];
 })).then(async entries=>{
  const parts=Object.fromEntries(entries);
  if(!parts.base){
   const original=await image('assets/shoe_'+heel+'_none.webp');
   if(!original)throw new Error('Painted shoe artwork unavailable: '+heel);
   const normalized=canvas(),height=Math.min(480,832*original.naturalHeight/original.naturalWidth);
   normalized.getContext('2d').drawImage(original,96,540-height,832,height);parts.base=normalized;parts.upper=null;
   fallbacks.set(heel,'legacy complete painting');
  }else if(!parts.upper)fallbacks.set(heel,'neutral complete painting; upper mask unavailable');
  return parts;
 }).catch(error=>{loads.delete(heel);throw error;});
 loads.set(heel,promise);return promise;
}
function clip(p,upper){p.globalCompositeOperation='destination-in';p.drawImage(upper,0,0);p.globalCompositeOperation='source-over';}
function materialLayer(design,upper){
 const out=canvas(),p=out.getContext('2d'),type=design.material;
 p.lineCap='round';p.lineJoin='round';
 if(type==='satin'||type==='patent'){
  const g=p.createLinearGradient(130,530,730,80);
  for(const [stop,alpha] of [[0,0],[.24,0],[.34,.12],[.39,.27],[.47,0],[.65,0],[.72,.09],[.79,0],[1,0]])g.addColorStop(stop,'rgba(255,255,251,'+alpha+')');
  p.fillStyle=g;p.fillRect(0,0,WIDTH,HEIGHT);
 }else if(type==='velvet'){
  p.fillStyle='rgba(62,31,88,.055)';p.fillRect(0,0,WIDTH,HEIGHT);
  p.strokeStyle='rgba(255,252,255,.14)';p.lineWidth=.65;
  for(let y=0;y<HEIGHT;y+=3.5){p.beginPath();p.moveTo(0,y);p.lineTo(WIDTH,y-85);p.stroke();}
 }else if(type==='mesh'){
  const step=12;
  for(let row=0;row<HEIGHT/step+1;row++)for(let col=-1;col<WIDTH/step+1;col++){
   const x=(col+(row%2)*.5)*step,y=row*step;
   p.beginPath();p.ellipse(x,y,2.4,3.0,-.22,0,Math.PI*2);p.fillStyle='rgba(69,47,87,.28)';p.fill();
   p.strokeStyle='rgba(255,255,247,.42)';p.lineWidth=1;p.stroke();
  }
 }else if(type==='lace'){
  // Connected floral guipure: large open petals, leaf sprigs and fine diamond
  // netting. Every stitch is fixed in source coordinates, never random dots.
  p.strokeStyle='rgba(255,252,239,.32)';p.lineWidth=.65;
  for(let x=-HEIGHT;x<WIDTH+HEIGHT;x+=16){p.beginPath();p.moveTo(x,0);p.lineTo(x+HEIGHT,HEIGHT);p.moveTo(x,0);p.lineTo(x-HEIGHT,HEIGHT);p.stroke();}
  const step=68;
  for(let row=-1;row<HEIGHT/step+1;row++)for(let col=-1;col<WIDTH/step+1;col++){
   const x=(col+(row%2)*.5)*step,y=row*step;
   p.save();p.translate(x,y);p.rotate(-.22);
   p.strokeStyle='rgba(111,77,115,.15)';p.lineWidth=3.8;
   const petals=()=>{p.beginPath();for(let i=0;i<6;i++){const a=i*Math.PI/3;p.moveTo(Math.cos(a)*3,Math.sin(a)*3);p.bezierCurveTo(Math.cos(a-.38)*24,Math.sin(a-.38)*24,Math.cos(a+.38)*24,Math.sin(a+.38)*24,Math.cos(a)*3,Math.sin(a)*3);}p.stroke();};
   petals();p.strokeStyle='rgba(255,253,239,.93)';p.lineWidth=2;petals();
   p.beginPath();p.arc(0,0,3,0,Math.PI*2);p.stroke();
   p.lineWidth=1.4;p.beginPath();p.moveTo(15,13);p.bezierCurveTo(30,18,24,42,34,57);p.stroke();
   for(let j=0;j<3;j++){const sy=23+j*9,sx=25+j*2;p.beginPath();p.ellipse(sx+(j%2?-5:5),sy,7,2.8,j%2?.6:-.6,0,Math.PI*2);p.stroke();}
   p.restore();
  }
 }else if(type==='glitter'){
  // Fixed integer hashes keep every fleck at the same source pixel on update.
  for(let row=0;row<73;row++)for(let col=0;col<118;col++){
   const n=((row+1)*374761393^(col+1)*668265263)>>>0;
   const x=col*9+(n%73)/9,y=row*9+((n>>>8)%73)/9,r=.45+(n%5)*.17;
   p.fillStyle=n%5?'rgba(255,255,249,.78)':'rgba(255,232,186,.75)';
   p.beginPath();p.arc(x,y,r,0,Math.PI*2);p.fill();
   if(n%97===0){p.strokeStyle='rgba(255,255,255,.95)';p.lineWidth=1.0;p.beginPath();p.moveTo(x-3.3,y);p.lineTo(x+3.3,y);p.moveTo(x,y-3.3);p.lineTo(x,y+3.3);p.stroke();}
  }
 }
 clip(p,upper);return out;
}
function patternLayer(design,upper){
 if(design.pattern==='none')return null;
 const out=canvas(),p=out.getContext('2d'),step=59,r=7;
 p.fillStyle='rgba(255,253,242,.80)';
 for(let row=0;row<HEIGHT/step+1;row++)for(let col=-1;col<WIDTH/step+1;col++){
  p.save();p.translate((col+(row%2)*.5)*step,row*step);p.rotate(-.16);p.scale(1,.85);p.beginPath();
  if(design.pattern==='dots')p.arc(0,0,r*.65,0,Math.PI*2);
  else if(design.pattern==='hearts'){p.moveTo(0,r);p.bezierCurveTo(-r*2,-r*.4,-r,-r*1.7,0,-r*.4);p.bezierCurveTo(r,-r*1.7,r*2,-r*.4,0,r);}
  else if(design.pattern==='stars'){for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rad=i%2?r*.45:r;p.lineTo(Math.cos(a)*rad,Math.sin(a)*rad);}p.closePath();}
  else {for(let i=0;i<5;i++){const a=i*Math.PI*2/5;p.moveTo(Math.cos(a)*r*.45,Math.sin(a)*r*.45);p.ellipse(Math.cos(a)*r*.6,Math.sin(a)*r*.6,r*.55,r*.34,a,0,Math.PI*2);}}
  p.fill();p.restore();
 }
 clip(p,upper);return out;
}
async function composite(input){
 const design=clean(input),id=key(design);
 if(cache.has(id)){const hit=cache.get(id);cache.delete(id);cache.set(id,hit);return hit;}
 if(jobs.has(id))return jobs.get(id);
 const job=Promise.all([load(design.heel),accessories()]).then(([parts,sprites])=>{
  const out=canvas(),p=out.getContext('2d'),tint=canvas(),q=tint.getContext('2d');
  if(!parts.upper){p.drawImage(parts.base,0,0);cache.set(id,out);while(cache.size>CACHE_LIMIT)cache.delete(cache.keys().next().value);return out;}
  q.drawImage(parts.upper,0,0);q.globalCompositeOperation='source-in';q.fillStyle=COLORS[design.color]||COLORS.pink;q.fillRect(0,0,WIDTH,HEIGHT);
  q.globalCompositeOperation='source-atop';q.globalAlpha=design.material==='velvet'?.80:.72;if(parts.shadow)q.drawImage(parts.shadow,0,0);
  q.globalAlpha=design.material==='velvet'?.16:design.material==='mesh'?.34:.78;if(parts.highlight)q.drawImage(parts.highlight,0,0);q.globalAlpha=1;
  p.drawImage(parts.base,0,0);
  // source-atop preserves the original destination alpha exactly; fabrics and
  // motifs cannot grow the outline or paint into a cream footbed/sole.
  p.globalCompositeOperation='source-atop';p.drawImage(tint,0,0);p.drawImage(materialLayer(design,parts.upper),0,0);
  const pattern=patternLayer(design,parts.upper);if(pattern)p.drawImage(pattern,0,0);
  p.globalCompositeOperation='source-over';
  drawAccessories(p,design,sprites);
  cache.set(id,out);while(cache.size>CACHE_LIMIT)cache.delete(cache.keys().next().value);
  return out;
 }).finally(()=>jobs.delete(id));
 jobs.set(id,job);return job;
}
function drawAccessories(p,d,sprites){
 const a=ANCHORS[d.heel]||ANCHORS.flat;
 const sprite=(name,point,w,rotation=0,h)=>{const im=sprites[name];if(!im)return;p.save();p.translate(point[0],point[1]);p.rotate(rotation);const height=h||w*im.naturalHeight/im.naturalWidth;p.drawImage(im,-w/2,-height/2,w,height);p.restore();};
 if(d.strap==='thin')sprite('maryjane',a.strap,146,a.strapAngle,32);
 if(d.strap==='pearl')sprite('pearls',a.strap,146,a.strapAngle,33);
 if(d.strap==='cross')sprite('laces',a.lace,105,.18,65);
 if(d.strap==='ribbon'){sprite('maryjane',a.strap,146,a.strapAngle,32);sprite('bow',[a.strap[0]+45,a.strap[1]+43],75,-.12);}
 const decor={small:['bow',90],big:['bow',130],drop:['drop',35],flower:['flower',88]}[d.decoration];
 if(decor)sprite(decor[0],a.back,decor[1],-.22);
 if(d.charm==='pearl')sprite('pearl',a.toe,59,-.12);
 if(d.charm==='crystal')sprite('crystal',a.toe,58,-.12);
 if(d.charm==='mini')sprite('bow',a.toe,93,-.12);
}
function draw(source,target,options){
 const p=target.getContext('2d');p.clearRect(0,0,target.width,target.height);p.imageSmoothingEnabled=true;p.imageSmoothingQuality='high';
 const scale=Math.min(target.width/WIDTH,target.height/HEIGHT),w=WIDTH*scale,h=HEIGHT*scale,x=(target.width-w)/2,y=(target.height-h)/2;
 if(options.pair){p.save();p.globalAlpha=.94;p.drawImage(source,x+w*.10,y-h*.02,w*.87,h*.87);p.restore();p.drawImage(source,x-w*.06,y+h*.035,w,h);}
 else p.drawImage(source,x,y,w,h);
}
async function render(target,input,options={}){
 const design=clean(input),token={};paintTokens.set(target,token);target.dataset.shoe2dReady='false';
 const source=await composite(design);if(paintTokens.get(target)!==token)return false;
 if(!target.width||!target.height){target.width=WIDTH;target.height=HEIGHT;}
 draw(source,target,options);target.dataset.renderer='painted-2d';target.dataset.design=fullKey(design);target.dataset.heel=design.heel;target.dataset.color=design.color;target.dataset.material=design.material;target.dataset.shoe2dReady='true';return true;
}
function mount(host,input,options={}){
 const target=canvas();target.className='shoe2d-canvas';target.setAttribute('role','img');target.style.cssText='display:block;width:100%;height:100%;object-fit:contain;';
 let design=clean(input),disposed=false,error=null;
 const controller={canvas:target,ready:null,update(next){
  if(disposed)return Promise.resolve(false);design=clean(next);
  target.setAttribute('aria-label',(A.lang==='zh'?'手绘小鞋预览':'Painted shoe preview')+' · '+(A.option?A.option('color',design.color)[1]:design.color)+' · '+(A.option?A.option('heel',design.heel)[1]:design.heel));
  return render(target,design,options).then(ok=>{
   if(ok&&!disposed){if(target.parentNode!==host)host.replaceChildren(target);host.classList.add('shoe2d-host');host.dataset.renderer='painted-2d';error=null;options.onReady?.(controller);}
   return ok;
  }).catch(reason=>{error=String(reason);if(!disposed)options.onError?.(reason);return false;});
 },dispose(){disposed=true;paintTokens.set(target,{});target.remove();host.classList.remove('shoe2d-host');},debug(){return {renderer:'painted-2d',ready:target.dataset.shoe2dReady==='true',design:{...design},width:WIDTH,height:HEIGHT,toe:[96,540],ground:540,length:832,error,fallback:fallbacks.get(design.heel)||null,cacheEntries:cache.size};}};
 controller.ready=controller.update(design);return controller;
}
const api={mount,render,composite,preload:()=>Promise.allSettled([...HEELS.map(load),accessories()]),anchors:ANCHORS,frame:Object.freeze({width:WIDTH,height:HEIGHT,toeX:96,groundY:540,length:832}),info:()=>({renderer:'painted-2d',cacheEntries:cache.size,cacheLimit:CACHE_LIMIT,loadedHeels:[...loads.keys()],fallbacks:Object.fromEntries(fallbacks),pendingComposites:jobs.size})};
A.Shoe2D=api;globalThis.Shoe2D=api;
})(globalThis.SweetShoe=globalThis.SweetShoe||{});
