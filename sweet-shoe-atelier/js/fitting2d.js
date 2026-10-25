'use strict';
(function(A){
// Fitting artwork has its own immutable camera. Finish changes touch the shoe
// mask only; the skin painting is never recoloured, moved, or resampled.
const SIZE=1024,LIMIT=8;
const COLORS={pink:'#ffadc9',cream:'#fff0d2',blue:'#a9daff',green:'#c6e7a5',purple:'#d6b9ff',peach:'#ffc09e',rose:'#f478a4',black:'#696883'};
const sources=new Map(),cache=new Map(),pending=new Map(),tokens=new WeakMap();
const ornaments=new Map();
async function ornament(heel,name){heel=A.SHOE_STYLES?.[heel]?.accessoryBase||heel;const id=heel+'_'+name;if(!ornaments.has(id))ornaments.set(id,Promise.all([image('assets/fitting2d/accessories/'+id+'.webp'),['strap_thin','strap_ribbon','strap_cross','decoration_small','decoration_big','charm_mini'].includes(name)?image('assets/fitting2d/accessories/'+id+'_tint.webp'):Promise.resolve(null)]));return ornaments.get(id);}
async function drawOrnaments(p,d){for(const category of ['strap','decoration','charm']){if(d[category]==='none')continue;const [im,mask]=await ornament(d.heel,category+'_'+d[category]);if(!im)continue;if(!mask){p.drawImage(im,0,0,SIZE,SIZE);continue;}const layer=canvas(),q=layer.getContext('2d');q.drawImage(im,0,0,SIZE,SIZE);q.globalCompositeOperation='multiply';q.fillStyle=COLORS[d.color]||COLORS.pink;q.fillRect(0,0,SIZE,SIZE);q.globalCompositeOperation='destination-in';q.drawImage(mask,0,0,SIZE,SIZE);p.drawImage(im,0,0,SIZE,SIZE);p.drawImage(layer,0,0);}}
function canvas(){const c=document.createElement('canvas');c.width=SIZE;c.height=SIZE;return c;}
function image(path){return new Promise(resolve=>{const im=new Image();im.decoding='async';im.onload=()=>resolve(im);im.onerror=()=>resolve(null);im.src=path;});}
function clean(d){return A.cleanDesign(d);}
function fittingOptions(input){return A.cleanFittingOptions?A.cleanFittingOptions(input):{sock:['frill','lace','sheer','knee'].includes(input?.sock)?input.sock:'none',color:['pink','mint','cream','white'].includes(input?.color)?input.color:'cream'};}
function fittedKit(parts){return parts.legs&&parts.shoe&&parts.upper&&parts.occlusion;}
function source(heel){
 if(!sources.has(heel))sources.set(heel,Promise.all([
  // Skin and shoe are one camera-matched kit. Generic barefoot anatomy has a
  // different arch/toe pose and must never substitute for a missing heel leg.
  image('assets/fitting2d/'+heel+'_legs.webp').then(im=>['legs',im]),
  ...['shoe','upper','shadow','highlight','occlusion'].map(async part=>[part,await image('assets/fitting2d/'+heel+'_'+part+'.webp')])
 ]).then(entries=>{
  const parts=Object.fromEntries(entries);
  // Collar/sole occlusion and the dye mask are part of the fitted kit. A
  // transient failure can recover on the next choice or reopening the room.
  if(!fittedKit(parts))sources.delete(heel);
  return parts;
 }));
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
// Legwear uses the immutable skin silhouette. Shoe and ornament layers are
// painted afterwards, so socks tuck inside every original collar and shaft.
function drawSocks(p,legs,input,heel){
 const o=fittingOptions(input);if(o.sock==='none'||!legs)return;
 const layer=canvas(),q=layer.getContext('2d'),top=heel==='bootie'&&['frill','lace'].includes(o.sock)?350:{frill:470,lace:450,knee:170,sheer:0}[o.sock];
 const colours={pink:'#ffd4e4',mint:'#d6f4e7',cream:'#fff1d6',white:'#fffdfa'},opacity=o.sock==='sheer'?.38:.91;
 q.drawImage(legs,0,0,SIZE,SIZE);q.globalCompositeOperation='source-in';
 const dye=q.createLinearGradient(0,top,0,top+8);dye.addColorStop(0,'#ffffff00');dye.addColorStop(1,colours[o.color]);q.fillStyle=dye;q.fillRect(0,0,SIZE,SIZE);
 q.globalCompositeOperation='source-atop';
 const light=q.createLinearGradient(450,0,790,0);light.addColorStop(0,'#8e94aa24');light.addColorStop(.28,'#ffffff6b');light.addColorStop(.6,'#ffffff00');light.addColorStop(1,'#8293982b');q.fillStyle=light;q.fillRect(0,0,SIZE,SIZE);
 if(o.sock==='knee'||o.sock==='frill'){
  q.strokeStyle='#ffffff6b';q.lineWidth=2;
  for(let x=300;x<900;x+=12){q.beginPath();q.moveTo(x,top+7);q.bezierCurveTo(x-10,400,x-35,650,x-140,850);q.stroke();}
 }
 if(o.sock==='lace'){
  q.strokeStyle='#fffef5ce';q.lineWidth=2.2;
  for(let y=top+12;y<900;y+=27)for(let x=290;x<900;x+=27){q.beginPath();q.ellipse(x+(y%2)*8,y,6,9,.5,0,Math.PI*2);q.ellipse(x+9+(y%2)*8,y,6,9,-.5,0,Math.PI*2);q.stroke();}
 }
 if(o.sock!=='sheer'){
  q.fillStyle='#b1a0ac20';q.fillRect(0,top+7,SIZE,5);q.fillStyle='#fffef8c9';q.fillRect(0,top+1,SIZE,7);
 }
 p.save();p.globalAlpha=opacity;p.drawImage(layer,0,0);p.restore();
 if(o.sock==='frill'){
  // Authored calf edges at y470: the ruffle sits outside the stocking only.
  const left=heel==='bootie'?518:483,right=heel==='bootie'?731:720;
  p.save();p.fillStyle=colours[o.color];p.strokeStyle='#d8c7d2';p.lineWidth=1.4;p.beginPath();p.moveTo(left,top+4);
  for(let x=left;x<right;x+=18)p.quadraticCurveTo(x+9,top-23,Math.min(right,x+18),top+4);
  p.lineTo(right,top+13);p.quadraticCurveTo((left+right)/2,top+24,left,top+13);p.closePath();p.fill();p.stroke();
  p.strokeStyle='#fffdf5';p.lineWidth=3;p.beginPath();p.moveTo(left+5,top+10);p.quadraticCurveTo((left+right)/2,top+19,right-2,top+10);p.stroke();p.restore();
 }
}
async function fallback(d){
 const out=canvas(),p=out.getContext('2d');
 // A missing shoe must not silently display the barefoot source as a finished
 // design. Partial and complete art failure share one complete fitted drawing.
 // Never fit a product-camera sticker over the front-three-quarter foot.
 // The emergency anatomy and shoe share one authored camera. A product
 // painting has a different opening/arch and cannot be pasted onto this foot.
 const skin=p.createLinearGradient(500,0,760,0);skin.addColorStop(0,'#eabcb0');skin.addColorStop(.5,'#ffe6d5');skin.addColorStop(1,'#ecc3b8');
 p.fillStyle=skin;p.beginPath();p.moveTo(575,0);p.lineTo(755,0);p.bezierCurveTo(780,275,689,469,710,710);p.quadraticCurveTo(722,782,677,829);p.lineTo(616,867);p.quadraticCurveTo(559,902,412,930);p.lineTo(285,947);p.quadraticCurveTo(205,948,221,906);p.lineTo(425,832);p.quadraticCurveTo(594,751,610,640);p.bezierCurveTo(596,386,572,235,575,0);p.fill();
 const colour=COLORS[d.color]||COLORS.pink;
 const upper=p.createLinearGradient(260,850,710,980);upper.addColorStop(0,'#fff6f0');upper.addColorStop(.24,colour);upper.addColorStop(1,colour);
 // Low, closed silhouette deliberately remains anatomically complete when
 // every external fitting bitmap has failed, rather than borrowing a camera.
 p.fillStyle=upper;p.beginPath();p.moveTo(221,927);p.quadraticCurveTo(250,912,300,906);p.lineTo(496,852);p.quadraticCurveTo(535,842,560,864);p.quadraticCurveTo(613,865,641,836);p.quadraticCurveTo(657,811,681,808);p.quadraticCurveTo(713,812,716,850);p.lineTo(716,924);p.quadraticCurveTo(714,957,654,963);p.lineTo(246,963);p.quadraticCurveTo(200,954,221,927);p.closePath();p.fill();
 p.strokeStyle='#fff1e0';p.lineWidth=5;p.beginPath();p.moveTo(495,854);p.quadraticCurveTo(535,844,560,866);p.quadraticCurveTo(613,868,641,838);p.quadraticCurveTo(657,813,681,810);p.stroke();
 p.strokeStyle='#b39484';p.lineWidth=5;p.beginPath();p.moveTo(231,958);p.quadraticCurveTo(430,968,654,960);p.quadraticCurveTo(699,955,711,936);p.stroke();return out;
}
async function composite(input,options){
 const o=fittingOptions(options),d=clean(input),id=A.designKey(d)+'|'+o.sock+'|'+o.color;if(cache.has(id)){const hit=cache.get(id);cache.delete(id);cache.set(id,hit);return hit;}if(pending.has(id))return pending.get(id);
 const work=source(d.heel).then(async parts=>{
  if(!fittedKit(parts))return {canvas:await fallback(d),fallback:true};
  const out=canvas(),p=out.getContext('2d');p.imageSmoothingQuality='high';p.drawImage(parts.legs,0,0,SIZE,SIZE);drawSocks(p,parts.legs,o,d.heel);
  if(parts.occlusion){p.globalCompositeOperation='destination-out';p.drawImage(parts.occlusion,0,0,SIZE,SIZE);p.globalCompositeOperation='source-over';}
  p.drawImage(parts.shoe,0,0,SIZE,SIZE);
  if(parts.upper){
   const tint=canvas(),q=tint.getContext('2d');q.drawImage(parts.upper,0,0,SIZE,SIZE);q.globalCompositeOperation='source-in';q.fillStyle=COLORS[d.color]||COLORS.pink;q.fillRect(0,0,SIZE,SIZE);
   q.globalCompositeOperation='source-atop';q.globalAlpha=d.material==='velvet'?.8:.72;if(parts.shadow)q.drawImage(parts.shadow,0,0,SIZE,SIZE);q.globalAlpha=d.material==='velvet'?.16:.78;if(parts.highlight)q.drawImage(parts.highlight,0,0,SIZE,SIZE);q.globalAlpha=1;
   p.drawImage(tint,0,0);p.drawImage(finish(d,parts.upper),0,0);
  }
  await drawOrnaments(p,d);
  return {canvas:out,fallback:false,legs:parts.legs};
 }).then(result=>{if(!result.fallback){cache.set(id,result);while(cache.size>LIMIT)cache.delete(cache.keys().next().value);}return result;}).finally(()=>pending.delete(id));pending.set(id,work);return work;
}
// The original ankle, arch, shoe and accessories remain one fixed painting.
// Lengthen only the broad upper calf, keeping its entire smooth colour ramp.
function pairedModel(source){
 const leg=document.createElement('canvas');leg.width=SIZE;leg.height=1280;const l=leg.getContext('2d');l.imageSmoothingQuality='high';
 l.drawImage(source,0,0,SIZE,400,0,0,SIZE,656);l.drawImage(source,0,400,SIZE,624,0,656,SIZE,624);
 l.globalCompositeOperation='destination-in';const fade=l.createLinearGradient(0,0,0,14);fade.addColorStop(0,'#ffffff00');fade.addColorStop(1,'#ffffffff');l.fillStyle=fade;l.fillRect(0,0,SIZE,1280);
 const pair=document.createElement('canvas');pair.width=1440;pair.height=1400;const p=pair.getContext('2d');p.imageSmoothingQuality='high';
 // Offset, slightly smaller back foot; no mirror flip of painted perspective.
 p.save();p.translate(390,190);p.scale(.88,.88);p.drawImage(leg,0,0);p.globalCompositeOperation='source-atop';p.fillStyle='#59776e0d';p.fillRect(0,0,SIZE,1280);p.restore();
 p.drawImage(leg,-80,100);return pair;
}
async function render(target,input,options){
 const token={};tokens.set(target,token);target.dataset.fitting2dReady='false';const d=clean(input),o=fittingOptions(options),result=await composite(d,o);if(tokens.get(target)!==token)return false;
 const p=target.getContext('2d');p.clearRect(0,0,target.width,target.height);p.imageSmoothingEnabled=true;p.imageSmoothingQuality='high';
 const pair=pairedModel(result.canvas),scale=Math.min(target.width*.98/pair.width,target.height*.94/pair.height),w=pair.width*scale,h=pair.height*scale,x=(target.width-w)/2,y=(target.height-h)/2;
 const floor=y+h*.925,cx=target.width*.50;
 p.save();p.translate(cx,floor);p.scale(1,.2);
 const halo=p.createRadialGradient(0,0,w*.12,0,0,w*.43);halo.addColorStop(0,'#527d6242');halo.addColorStop(1,'#527d6200');p.fillStyle=halo;p.beginPath();p.arc(0,0,w*.43,0,Math.PI*2);p.fill();p.restore();
 p.save();p.fillStyle='#cfeadf';p.beginPath();p.ellipse(cx,floor+h*.023,w*.43,h*.04,0,0,Math.PI*2);p.fill();
 const porcelain=p.createLinearGradient(0,floor-h*.025,0,floor+h*.035);porcelain.addColorStop(0,'#ffffff');porcelain.addColorStop(1,'#e5f6ed');p.fillStyle=porcelain;p.beginPath();p.ellipse(cx,floor+h*.008,w*.43,h*.037,0,0,Math.PI*2);p.fill();p.strokeStyle='#ffffffdb';p.lineWidth=Math.max(1,w*.002);p.stroke();p.restore();
 p.drawImage(pair,x,y,w,h);
 Object.assign(target.dataset,{renderer:'painted-fitting',fitting2dReady:'true',heel:d.heel,color:d.color,material:d.material,fallback:String(result.fallback),legFrame:'0,0,1024,1024',feet:'2',sock:o.sock,sockColor:o.color,footAnchors:'back:390,190,.88;front:-80,100,1'});return true;
}
function mount(host,input,options){
 const target=canvas();target.className='fitting2d-canvas';target.setAttribute('role','img');target.setAttribute('aria-label',A.lang==='zh'?'双脚穿着你的鞋款与袜子搭配':'Both feet wearing your shoes and chosen socks');host.replaceChildren(target);
 let disposed=false,design=clean(input),fitting=fittingOptions(options);const fit=()=>{
  const dpr=Math.min(2,globalThis.devicePixelRatio||1),width=Math.max(1,Math.round(host.clientWidth*dpr)),height=Math.max(1,Math.round(host.clientHeight*dpr));
  // ResizeObserver also fires on observation and on subpixel layout changes.
  // Assigning an unchanged canvas size erases the painted pair unnecessarily.
  if(target.width===width&&target.height===height)return false;
  target.width=width;target.height=height;return true;
 };fit();let observer;const controller={canvas:target,ready:null,update(next,nextOptions=fitting){if(disposed)return Promise.resolve(false);design=clean(next);fitting=fittingOptions(nextOptions);controller.ready=render(target,design,fitting);return controller.ready;},dispose(){disposed=true;observer?.disconnect();tokens.set(target,{});target.remove();},debug(){return {renderer:'painted-fitting',ready:target.dataset.fitting2dReady==='true',fallback:target.dataset.fallback,design:{...design},fitting:{...fitting},feet:2,frame:[0,0,SIZE,SIZE],cacheEntries:cache.size,cacheLimit:LIMIT};}};controller.update(design);observer=new ResizeObserver(()=>{if(disposed||!fit())return;controller.update(design);});observer.observe(host);return controller;
}
A.Fitting2D={mount,render,composite,frame:Object.freeze({width:SIZE,height:SIZE}),info:()=>({cacheEntries:cache.size,cacheLimit:LIMIT,loadedHeels:[...sources.keys()],pendingComposites:pending.size})};
})(globalThis.SweetShoe=globalThis.SweetShoe||{});
