'use strict';
(function(A){
// Fitting artwork has its own immutable camera. Finish changes touch the shoe
// mask only; the skin painting is never recoloured, moved, or resampled.
const SIZE=1024,LIMIT=8;
const COLORS={pink:'#ffadc9',cream:'#fff0d2',blue:'#a9daff',green:'#c6e7a5',purple:'#d6b9ff',peach:'#ffc09e',rose:'#f478a4',black:'#696883'};
const sources=new Map(),cache=new Map(),pending=new Map(),tokens=new WeakMap();
let legSource;
const ornaments=new Map();
async function ornament(heel,name){const id=heel+'_'+name;if(!ornaments.has(id))ornaments.set(id,Promise.all([image('assets/fitting2d/accessories/'+id+'.webp'),['strap_thin','strap_ribbon','strap_cross','decoration_small','decoration_big','charm_mini'].includes(name)?image('assets/fitting2d/accessories/'+id+'_tint.webp'):Promise.resolve(null)]));return ornaments.get(id);}
async function drawOrnaments(p,d){for(const category of ['strap','decoration','charm']){if(d[category]==='none')continue;const [im,mask]=await ornament(d.heel,category+'_'+d[category]);if(!im)continue;if(!mask){p.drawImage(im,0,0,SIZE,SIZE);continue;}const layer=canvas(),q=layer.getContext('2d');q.drawImage(im,0,0,SIZE,SIZE);q.globalCompositeOperation='multiply';q.fillStyle=COLORS[d.color]||COLORS.pink;q.fillRect(0,0,SIZE,SIZE);q.globalCompositeOperation='destination-in';q.drawImage(mask,0,0,SIZE,SIZE);p.drawImage(im,0,0,SIZE,SIZE);p.drawImage(layer,0,0);}}
function canvas(){const c=document.createElement('canvas');c.width=SIZE;c.height=SIZE;return c;}
function image(path){return new Promise(resolve=>{const im=new Image();im.decoding='async';im.onload=()=>resolve(im);im.onerror=()=>resolve(null);im.src=path;});}
function clean(d){return A.cleanDesign(d);}
function source(heel){
 if(!sources.has(heel))sources.set(heel,Promise.all([
  image('assets/fitting2d/'+heel+'_legs.webp').then(async im=>['legs',im||await (legSource||(legSource=image('assets/fitting2d/legs.webp')))]),
  ...['shoe','upper','shadow','highlight','occlusion'].map(async part=>[part,await image('assets/fitting2d/'+heel+'_'+part+'.webp')])
 ]).then(Object.fromEntries));
 return sources.get(heel);
}
function clipped(ctx,mask){ctx.globalCompositeOperation='destination-in';ctx.drawImage(mask,0,0,SIZE,SIZE);ctx.globalCompositeOperation='source-over';}
function finish(d,mask){
 const out=canvas(),p=out.getContext('2d');p.lineCap='round';
 if(d.material==='satin'||d.material==='patent'){
  const g=p.createLinearGradient(130,930,720,250);g.addColorStop(0,'#ffffff00');g.addColorStop(.36,'#ffffff00');g.addColorStop(.42,d.material==='patent'?'#ffffffa8':'#ffffff62');g.addColorStop(.49,'#ffffff00');g.addColorStop(1,'#ffffff00');p.fillStyle=g;p.fillRect(0,0,SIZE,SIZE);
 }else if(d.material==='velvet'){
  const g=p.createLinearGradient(0,400,SIZE,900);g.addColorStop(0,'#65417410');g.addColorStop(.62,'#65417406');g.addColorStop(1,'#fff5fb0c');p.fillStyle=g;p.fillRect(0,0,SIZE,SIZE);
 }else if(d.material==='mesh'){
  for(let row=0;row<100;row++)for(let col=0;col<100;col++){p.fillStyle='#62546d55';p.beginPath();p.ellipse(col*11+(row%2)*5.5,row*11,2,2.7,-.2,0,Math.PI*2);p.fill();}
 }else if(d.material==='lace'){
  p.strokeStyle='#fff9efdc';p.lineWidth=1.8;
  for(let row=0;row<24;row++)for(let col=0;col<24;col++){
   const x=col*49+(row%2)*24.5,y=row*49;p.beginPath();
   for(let i=0;i<5;i++){const a=i*Math.PI*2/5;p.moveTo(x,y);p.bezierCurveTo(x+Math.cos(a-.4)*24,y+Math.sin(a-.4)*24,x+Math.cos(a+.4)*24,y+Math.sin(a+.4)*24,x,y);}
   p.moveTo(x+10,y+10);p.quadraticCurveTo(x+18,y+28,x+25,y+40);p.stroke();
  }
 }else if(d.material==='glitter'){
  for(let row=0;row<120;row++)for(let col=0;col<120;col++){const n=((row+1)*374761393^(col+1)*668265263)>>>0,x=col*9+n%7,y=row*9+(n>>>8)%7;p.fillStyle='#fffcf2df';p.beginPath();p.arc(x,y,.7+n%4*.2,0,Math.PI*2);p.fill();}
 }
 if(d.pattern!=='none'){
  p.fillStyle='#fff9edcc';for(let row=0;row<20;row++)for(let col=0;col<20;col++){
   const x=col*58+(row%2)*29,y=row*58,r=6;p.beginPath();
   if(d.pattern==='hearts'){p.moveTo(x,y+r);p.bezierCurveTo(x-r*2,y-r,x-r,y-r*2,x,y-r*.5);p.bezierCurveTo(x+r,y-r*2,x+r*2,y-r,x,y+r);}
   else if(d.pattern==='stars'){for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*.45:r;p.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr);}p.closePath();}
   else if(d.pattern==='flowers'){for(let i=0;i<5;i++){const a=i*Math.PI*2/5;p.moveTo(x,y);p.ellipse(x+Math.cos(a)*5,y+Math.sin(a)*5,4,2.5,a,0,Math.PI*2);}}
   else p.arc(x,y,3,0,Math.PI*2);p.fill();
  }
 }
 clipped(p,mask);return out;
}
async function fallback(d,legs){
 const out=canvas(),p=out.getContext('2d');
 // An unavailable shoe keeps the actual complete barefoot artwork.
 // Never fit a product-camera sticker over the new front-three-quarter foot.
 if(legs){p.drawImage(legs,0,0,SIZE,SIZE);return out;}
 const skin=p.createLinearGradient(500,0,760,0);skin.addColorStop(0,'#eabcb0');skin.addColorStop(.5,'#ffe6d5');skin.addColorStop(1,'#ecc3b8');
 p.fillStyle=skin;p.beginPath();p.moveTo(575,0);p.lineTo(755,0);p.bezierCurveTo(780,275,689,469,716,680);p.quadraticCurveTo(737,757,675,798);p.lineTo(327,822);p.quadraticCurveTo(255,797,335,756);p.quadraticCurveTo(621,701,610,581);p.bezierCurveTo(596,386,572,235,575,0);p.fill();
 try{const shoe=await A.Shoe2D.composite(d);p.drawImage(shoe,80,540,850,531);}catch{}return out;
}
async function composite(input){
 const d=clean(input),id=A.designKey(d);if(cache.has(id)){const hit=cache.get(id);cache.delete(id);cache.set(id,hit);return hit;}if(pending.has(id))return pending.get(id);
 const work=source(d.heel).then(async parts=>{
  if(!parts.legs||!parts.shoe)return {canvas:await fallback(d,parts.legs),fallback:true};
  const out=canvas(),p=out.getContext('2d');p.imageSmoothingQuality='high';p.drawImage(parts.legs,0,0,SIZE,SIZE);
  if(parts.occlusion){p.globalCompositeOperation='destination-out';p.drawImage(parts.occlusion,0,0,SIZE,SIZE);p.globalCompositeOperation='source-over';}
  p.drawImage(parts.shoe,0,0,SIZE,SIZE);
  if(parts.upper){
   const tint=canvas(),q=tint.getContext('2d');q.drawImage(parts.upper,0,0,SIZE,SIZE);q.globalCompositeOperation='source-in';q.fillStyle=COLORS[d.color]||COLORS.pink;q.fillRect(0,0,SIZE,SIZE);
   q.globalCompositeOperation='source-atop';q.globalAlpha=d.material==='velvet'?.8:.72;if(parts.shadow)q.drawImage(parts.shadow,0,0,SIZE,SIZE);q.globalAlpha=d.material==='velvet'?.16:.78;if(parts.highlight)q.drawImage(parts.highlight,0,0,SIZE,SIZE);q.globalAlpha=1;
   p.drawImage(tint,0,0);p.drawImage(finish(d,parts.upper),0,0);
  }
  await drawOrnaments(p,d);
  return {canvas:out,fallback:false,legs:parts.legs};
 }).then(result=>{cache.set(id,result);while(cache.size>LIMIT)cache.delete(cache.keys().next().value);return result;}).finally(()=>pending.delete(id));pending.set(id,work);return work;
}
async function render(target,input){
 const token={};tokens.set(target,token);target.dataset.fitting2dReady='false';const d=clean(input),result=await composite(d);if(tokens.get(target)!==token)return false;
 const p=target.getContext('2d');p.clearRect(0,0,target.width,target.height);p.imageSmoothingEnabled=true;p.imageSmoothingQuality='high';
 const size=Math.min(target.width*.92,target.height*.86),x=(target.width-size)/2,y=target.height*.91-size*.94;
 // A small porcelain plinth grounds the complete calf rather than extending
 // a strip of skin to the glass edge. Leave breathing room above the model.
 const floor=y+size*.94,cx=x+size*.49;
 p.save();p.translate(cx,floor);p.scale(1,.2);
 const halo=p.createRadialGradient(0,0,size*.12,0,0,size*.38);halo.addColorStop(0,'#527d6242');halo.addColorStop(1,'#527d6200');p.fillStyle=halo;p.beginPath();p.arc(0,0,size*.38,0,Math.PI*2);p.fill();p.restore();
 p.save();p.fillStyle='#d3eee2';p.beginPath();p.ellipse(cx,floor+size*.023,size*.34,size*.055,0,0,Math.PI*2);p.fill();
 const porcelain=p.createLinearGradient(0,floor-size*.045,0,floor+size*.035);porcelain.addColorStop(0,'#ffffff');porcelain.addColorStop(1,'#e5f6ed');p.fillStyle=porcelain;p.beginPath();p.ellipse(cx,floor+size*.008,size*.34,size*.052,0,0,Math.PI*2);p.fill();p.strokeStyle='#ffffffdb';p.lineWidth=Math.max(1,size*.002);p.stroke();p.restore();
 // Fade the authored upper calf edge locally; composition and PNG sharing
 // use the same source coordinates at every viewport and device pixel ratio.
 const model=canvas(),m=model.getContext('2d');m.drawImage(result.canvas,0,0);m.globalCompositeOperation='destination-in';
 const fade=m.createLinearGradient(0,0,0,64);fade.addColorStop(0,'#ffffff00');fade.addColorStop(1,'#ffffffff');m.fillStyle=fade;m.fillRect(0,0,SIZE,SIZE);
 p.drawImage(model,x,y,size,size);
 Object.assign(target.dataset,{renderer:'painted-fitting',fitting2dReady:'true',heel:d.heel,color:d.color,material:d.material,fallback:String(result.fallback),legFrame:'0,0,1024,1024'});return true;
}
function mount(host,input){
 const target=canvas();target.className='fitting2d-canvas';target.setAttribute('role','img');target.setAttribute('aria-label',A.lang==='zh'?'小腿与鞋款试穿':'Lower leg wearing your design');host.replaceChildren(target);
 let disposed=false,design=clean(input);const fit=()=>{const dpr=Math.min(2,globalThis.devicePixelRatio||1);target.width=Math.max(1,Math.round(host.clientWidth*dpr));target.height=Math.max(1,Math.round(host.clientHeight*dpr));};fit();let observer;const controller={canvas:target,ready:null,update(next){if(disposed)return Promise.resolve(false);design=clean(next);return render(target,design);},dispose(){disposed=true;observer?.disconnect();tokens.set(target,{});target.remove();},debug(){return {renderer:'painted-fitting',ready:target.dataset.fitting2dReady==='true',fallback:target.dataset.fallback,design:{...design},frame:[0,0,SIZE,SIZE],cacheEntries:cache.size,cacheLimit:LIMIT};}};controller.ready=controller.update(design);observer=new ResizeObserver(()=>{if(disposed)return;fit();controller.update(design);});observer.observe(host);return controller;
}
A.Fitting2D={mount,render,composite,frame:Object.freeze({width:SIZE,height:SIZE}),info:()=>({cacheEntries:cache.size,cacheLimit:LIMIT,loadedHeels:[...sources.keys()],pendingComposites:pending.size})};
})(globalThis.SweetShoe=globalThis.SweetShoe||{});
