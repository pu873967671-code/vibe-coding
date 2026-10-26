'use strict';
(function(A){
// Fitting artwork has its own immutable camera. Finish changes touch the shoe
// mask only; the shared calf treatment and pair transforms remain identical
// across every finish, ornament and heel choice.
const SIZE=1024,LIMIT=8;
const COLORS={pink:'#ffadc9',cream:'#fff0d2',blue:'#a9daff',green:'#c6e7a5',purple:'#d6b9ff',peach:'#ffc09e',rose:'#f478a4',black:'#696883'};
const sources=new Map(),cache=new Map(),pending=new Map(),tokens=new WeakMap();
const ornaments=new Map();
async function ornament(heel,name){heel=A.SHOE_STYLES?.[heel]?.accessoryBase||heel;const id=heel+'_'+name;if(!ornaments.has(id))ornaments.set(id,Promise.all([image('assets/fitting2d/accessories/'+id+'.webp'),['strap_thin','strap_ribbon','strap_cross','decoration_small','decoration_big','charm_mini'].includes(name)?image('assets/fitting2d/accessories/'+id+'_tint.webp'):Promise.resolve(null)]));return ornaments.get(id);}
async function drawOrnaments(p,d,upper){for(const category of ['strap','decoration','charm']){if(d[category]==='none')continue;if(A.AccessoryRenderer?.handles(category,d[category])){A.AccessoryRenderer.drawOne(p,d,'worn',category,upper);continue;}const [im,mask]=await ornament(d.heel,category+'_'+d[category]);if(!im)continue;if(!mask){p.drawImage(im,0,0,SIZE,SIZE);continue;}const layer=canvas(),q=layer.getContext('2d');q.drawImage(im,0,0,SIZE,SIZE);q.globalCompositeOperation='multiply';q.fillStyle=COLORS[d.color]||COLORS.pink;q.fillRect(0,0,SIZE,SIZE);q.globalCompositeOperation='destination-in';q.drawImage(mask,0,0,SIZE,SIZE);p.drawImage(im,0,0,SIZE,SIZE);p.drawImage(layer,0,0);}}
function canvas(){const c=document.createElement('canvas');c.width=SIZE;c.height=SIZE;return c;}
function image(path){return new Promise(resolve=>{const im=new Image();im.decoding='async';im.onload=()=>resolve(im);im.onerror=()=>resolve(null);im.src=path;});}
function clean(d){return A.cleanDesign(d);}
function fittingOptions(input){return A.cleanFittingOptions?A.cleanFittingOptions(input):{sock:['frill','lace','sheer','knee','thigh','blacksheer','pantyhose','opaque','fishnet'].includes(input?.sock)?input.sock:'none',color:['pink','mint','cream','white','black'].includes(input?.color)?input.color:'cream'};}
function fittedKit(parts){return parts.legs&&parts.shoe&&parts.upper&&parts.occlusion&&parts.hosiery;}
function source(heel){
 if(!sources.has(heel))sources.set(heel,Promise.all([
  // Skin and shoe are one camera-matched kit. Generic barefoot anatomy has a
  // different arch/toe pose and must never substitute for a missing heel leg.
  image('assets/fitting2d/'+heel+'_legs.webp').then(im=>['legs',im]),
  ...['shoe','upper','shadow','highlight','occlusion','hosiery'].map(async part=>[part,await image('assets/fitting2d/'+heel+'_'+part+'.webp')])
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
  const g=p.createLinearGradient(130,930,720,250);
  // An open vamp has no fabric where a closed pump catches its reflection.
  // Place the two patent glints on its forefoot and instep bands instead.
  if(d.material==='patent'&&A.SHOE_STYLES[d.heel]?.openToe){
   for(const [at,alpha] of [[0,0],[.18,0],[.25,.65],[.29,.12],[.34,0],[.55,0],[.62,.30],[.67,.10],[.72,0],[1,0]])g.addColorStop(at,'rgba(255,255,255,'+alpha+')');
  }else{g.addColorStop(0,'#ffffff00');g.addColorStop(.36,'#ffffff00');g.addColorStop(.42,d.material==='patent'?'#ffffffa8':'#ffffff62');g.addColorStop(.49,'#ffffff00');g.addColorStop(1,'#ffffff00');}
  p.fillStyle=g;p.fillRect(0,0,SIZE,SIZE);
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
 A.CoutureFinish?.drawMaterial(p,d,SIZE,SIZE);
 if(!['none','rosebuds','diamonds','gingham','scallops','pinstripes'].includes(d.pattern)){
  p.fillStyle='#fff9edcc';for(let row=0;row<20;row++)for(let col=0;col<20;col++){
   const x=col*58+(row%2)*29,y=row*58,r=6;p.beginPath();
   if(d.pattern==='hearts'){p.moveTo(x,y+r);p.bezierCurveTo(x-r*2,y-r,x-r,y-r*2,x,y-r*.5);p.bezierCurveTo(x+r,y-r*2,x+r*2,y-r,x,y+r);}
   else if(d.pattern==='stars'){for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*.45:r;p.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr);}p.closePath();}
   else if(d.pattern==='flowers'){for(let i=0;i<5;i++){const a=i*Math.PI*2/5;p.moveTo(x,y);p.ellipse(x+Math.cos(a)*5,y+Math.sin(a)*5,4,2.5,a,0,Math.PI*2);}}
   else p.arc(x,y,3,0,Math.PI*2);p.fill();
  }
 }
 A.CoutureFinish?.drawPattern(p,d,SIZE,SIZE);
 clipped(p,mask);return out;
}
// Soft, youthful skin: broad light planes only. The offline skin layers have
// rounded contours and no veins, tendons or ankle-bone highlights.
function calfPaint(p){
 const skin=p.createLinearGradient(475,0,850,0);skin.addColorStop(0,'#e9b9a7');skin.addColorStop(.19,'#f4cbb4');skin.addColorStop(.36,'#ffdfc7');skin.addColorStop(.57,'#ffe0ca');skin.addColorStop(.76,'#f5c9b1');skin.addColorStop(.91,'#e8b6a3');skin.addColorStop(1,'#dda998');return skin;
}
function skinGlow(p,x,y,rx,ry,colour,opacity=1){
 p.save();p.translate(x,y);p.scale(rx,ry);const g=p.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,colour);g.addColorStop(.15,colour);g.addColorStop(1,'#ffffff00');p.globalAlpha=opacity;p.fillStyle=g;p.beginPath();p.arc(0,0,1,0,Math.PI*2);p.fill();p.restore();
}
function cleanLegs(original){
 const out=canvas();out.getContext('2d').drawImage(original,0,0,SIZE,SIZE);return out;
}
function calfVolume(p,left,right,height,rear=false){
 p.save();p.globalCompositeOperation='source-atop';
 // Broad curved light/shadow planes make the long extension a calf rather
 // than a uniformly shaded tube, with a soft knee taper above the frame.
 const mid=(left+right)/2;
 skinGlow(p,mid-30,height*.28,95,height*.55,'#fff0d4',rear?.07:.10);
 skinGlow(p,right-12,height*.28,95,height*.55,'#c18f7f',rear?.06:.08);
 p.restore();
}
// Cuffs follow an elliptical section around the sloping calf rather than a
// horizontal rectangle. The shoe's collar occlusion is applied afterwards.
// All these styles continue beyond the visible frame on both calves. A
// knee-high cuff belongs above this crop, never at the source ankle join.
const LONG_HOSIERY=new Set(['knee','sheer','thigh','blacksheer','pantyhose','opaque','fishnet']);
function hosieryColour(o){return o.sock==='blacksheer'?'#262430':({pink:'#ffd4e4',mint:'#d6f4e7',cream:'#fff1d6',white:'#fffdfa',black:'#292735'}[o.color]||'#fff1d6');}
function hosieryOpacity(o){return ({sheer:.38,blacksheer:.48,pantyhose:.48,fishnet:.20,opaque:.98}[o.sock]??.94);}
// Source-camera cross sections. The cloth light and stitches turn with the
// narrowing shin and sloping instep, rather than using a vertical shine strip.
const HOSIERY_SECTIONS=[[0,546.388,842.437],[170,537,787],[350,518.198,728.892],[450,495,719],[550,464,730],[650,423,680],[750,364,622],[850,326,554],[1024,240,450]];
function hosierySection(y){
 for(let i=1;i<HOSIERY_SECTIONS.length;i++){
  const a=HOSIERY_SECTIONS[i-1],b=HOSIERY_SECTIONS[i];if(y>b[0])continue;
  const t=Math.max(0,(y-a[0])/(b[0]-a[0]));return [a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
 }return HOSIERY_SECTIONS.at(-1).slice(1);
}
// Sample in source-camera coordinates, including both ends of every piece.
// A 950px extension previously stopped its 8px yarn samples at944, leaving
// six bare rows. Source-aligned samples share the exact yarn phase at joins.
function hosieryRows(height,step,offset=0){
 const rows=[0];for(let y=(((-offset%step)+step)%step)||step;y<height;y+=step)rows.push(y);
 rows.push(height);return rows;
}
function hosieryPoint(section,y,u){const [left,right]=section(y);return (left+right)/2+(right-left)*.5*Math.sin(u*Math.PI/2);}
function hosierySurface(p,height,section=hosierySection){
 p.save();p.globalCompositeOperation='source-atop';
 // Matte cylindrical volume: broad feathered light, quiet edges. Every stop
 // has low opacity, including on midnight cloth; there is no specular band.
 for(let y=0;y<height;y+=4){
  const [left,right]=section(y+2),g=p.createLinearGradient(left,0,right,0);
  for(const [t,c] of [[0,'#4542541b'],[.18,'#45425408'],[.38,'#ffffff0b'],[.53,'#ffffff14'],[.70,'#ffffff0b'],[.86,'#45425406'],[1,'#45425422']])g.addColorStop(t,c);
  p.fillStyle=g;p.fillRect(0,y,SIZE,Math.min(4,height-y));
 }p.restore();
}
function hosieryTexture(p,o,height,section=hosierySection,offset=0,threadOnly=false){
 if(o.sock==='knee'){
  p.save();p.globalCompositeOperation='source-atop';p.lineJoin='round';p.lineCap='round';
  // A quiet recessed yarn with a soft lit edge stays readable on ivory as
  // well as midnight. Project every rib through the same calf cross sections
  // as the matte light, including both full-height extensions.
  for(const [shift,colour,width] of [[0,o.color==='black'?'#0b091726':'#8d7d8a24',1.7],[1.2,o.color==='black'?'#e4dbe926':'#ffffff78',1.4]]){
   p.strokeStyle=colour;p.lineWidth=width;
   for(let u=-.94;u<1;u+=.105){
    p.beginPath();let started=false;
    for(const y of hosieryRows(height,6,offset)){const x=hosieryPoint(section,y,u)+shift;if(started)p.lineTo(x,y);else p.moveTo(x,y);started=true;}p.stroke();
   }
  }p.restore();return;
 }
 if(o.sock!=='fishnet')return;
 p.save();p.globalCompositeOperation=threadOnly?'source-over':'source-atop';
 // A fine opaque yarn remains readable after the sheer layer's 20% blend
 // and the fitting camera's phone-scale downsample. Match the chosen colour;
 // midnight knit must use dark thread, rather than a nearly invisible glint.
 p.strokeStyle=({black:'#211c30',white:'#fffdfa',cream:'#fff1d6',pink:'#ca7f9c',mint:'#77ad95'}[o.color]||'#fff1d6');
 p.lineWidth=2.6;p.lineJoin='round';p.lineCap='round';
 // Diagonal yarn is projected around the cylinder, compressing at its sides.
 for(const direction of [-1,1])for(let strand=-Math.ceil(height/80)-3;strand<=Math.ceil(height/80)+3;strand++){
  p.beginPath();let drawing=false;
  for(const y of hosieryRows(height,8,offset)){const u=strand*.19+direction*(y+offset)*.0024;if(Math.abs(u)>1){drawing=false;continue;}const x=hosieryPoint(section,y,u);if(drawing)p.lineTo(x,y);else p.moveTo(x,y);drawing=true;}p.stroke();
 }p.restore();
}
function fishnetYarn(p,mask,o,height,section=hosierySection,offset=0){
 if(o.sock!=='fishnet')return;
 const layer=document.createElement('canvas');layer.width=SIZE;layer.height=height;const q=layer.getContext('2d');
 hosieryTexture(q,o,height,section,offset,true);q.globalCompositeOperation='destination-in';q.drawImage(mask,0,0);
 p.save();p.globalAlpha=.45;p.drawImage(layer,0,0);p.restore();
}
function drawSocks(p,legs,input,heel,collarOnly=false){
 const o=fittingOptions(input);if(o.sock==='none'||!legs)return;
 const layer=canvas(),q=layer.getContext('2d'),top=heel==='bootie'&&['frill','lace'].includes(o.sock)?350:{frill:470,lace:450,knee:-30,sheer:-30,thigh:-30,blacksheer:-30,pantyhose:-30,opaque:-30,fishnet:-30}[o.sock];
 const openToe=A.SHOE_STYLES?.[heel]?.openToe;
 const cloth=hosieryColour(o),opacity=openToe&&!LONG_HOSIERY.has(o.sock)?1:hosieryOpacity(o);
 const left=openToe&&top>400?(top<465?485:481):top<200?536:top<400?516:top<465?495:489,right=openToe&&top>400?(top<465?750:754):top<200?786:top<400?730:719;
 q.drawImage(legs,0,0,SIZE,SIZE);q.globalCompositeOperation='source-in';q.fillStyle=cloth;q.fillRect(0,0,SIZE,SIZE);
 q.globalCompositeOperation='destination-in';q.beginPath();q.moveTo(0,top);q.lineTo(left,top);q.bezierCurveTo(left+55,top+24,right-52,top+25,right,top+2);q.lineTo(SIZE,top);q.lineTo(SIZE,SIZE);q.lineTo(0,SIZE);q.closePath();q.fillStyle='#fff';q.fill();
 q.globalCompositeOperation='source-atop';
 hosierySurface(q,SIZE,openToe?y=>y>750?[190,800]:hosierySection(y):hosierySection);
 if(A.SHOE_STYLES?.[heel]?.openToe&&!['sheer','blacksheer','pantyhose','fishnet'].includes(o.sock)){
  // An opaque sock keeps the painted toe volume, without transferring skin
  // colour or sharp pedicure details. Draw-only compositing also works when
  // the host redirects the source images across origins.
  const footprint=canvas(),volume=canvas(),v=volume.getContext('2d');
  footprint.getContext('2d').drawImage(layer,0,0);
  v.filter='grayscale(1) brightness(1.2) blur(8px)';v.drawImage(legs,0,0,SIZE,SIZE);v.filter='none';
  v.globalCompositeOperation='destination-in';
  const fade=v.createLinearGradient(0,750,0,825);fade.addColorStop(0,'#ffffff00');fade.addColorStop(1,'#fff');v.fillStyle=fade;v.fillRect(0,0,SIZE,SIZE);
  q.globalCompositeOperation='multiply';q.globalAlpha=.78;q.drawImage(volume,0,0);q.globalAlpha=1;
  q.globalCompositeOperation='destination-in';q.drawImage(footprint,0,0);q.globalCompositeOperation='source-atop';
 }
 if(o.sock==='frill'){
  q.strokeStyle=o.color==='black'?'#ffffff20':'#ffffff55';q.lineWidth=1.5;
  for(let u=-.94;u<1;u+=.105){q.beginPath();for(let y=top+9;y<=880;y+=8){const x=hosieryPoint(hosierySection,y,u);if(y===top+9)q.moveTo(x,y);else q.lineTo(x,y);}q.stroke();}
 }
 if(o.sock==='lace'){
  q.strokeStyle=o.color==='black'?'#eee3ed70':'#fffef5cf';q.lineWidth=1.5;
  for(let row=0,y=top+15;y<900;row++,y+=26)for(let u=-.94+(row%2)*.09;u<1;u+=.19){const x=hosieryPoint(hosierySection,y,u),turn=.4+.6*Math.cos(u*Math.PI/2);q.beginPath();q.ellipse(x-3*turn,y,4.5*turn,6.5,.35,0,Math.PI*2);q.ellipse(x+3*turn,y,4.5*turn,6.5,-.35,0,Math.PI*2);q.stroke();}
 }
 hosieryTexture(q,o,SIZE);
 p.save();p.globalAlpha=opacity;p.drawImage(layer,0,0);
 if(['sheer','blacksheer','pantyhose'].includes(o.sock)){
  const dense=canvas(),v=dense.getContext('2d');v.drawImage(layer,0,0);v.globalCompositeOperation='destination-in';const toe=v.createLinearGradient(0,740,0,960);toe.addColorStop(0,'#ffffff00');toe.addColorStop(.55,'#ffffff00');toe.addColorStop(1,'#ffffffa0');v.fillStyle=toe;v.fillRect(0,0,SIZE,SIZE);p.globalAlpha=.23;p.drawImage(dense,0,0);
 }p.restore();
 fishnetYarn(p,layer,o,SIZE,openToe?y=>y>750?[190,800]:hosierySection(y):hosierySection);
 if(collarOnly||LONG_HOSIERY.has(o.sock))return;
 p.save();p.lineCap='round';p.lineJoin='round';
 const curve=()=>{p.beginPath();p.moveTo(left+2,top+3);p.bezierCurveTo(left+57,top+28,right-52,top+27,right-1,top+4);};
 curve();p.strokeStyle='#b6a1af5c';p.lineWidth=11;p.stroke();curve();p.strokeStyle=cloth;p.lineWidth=8;p.stroke();
 if(o.sock==='frill'||o.sock==='lace'){
  // Individual little pleats turn around the calf; nearer folds are wider.
  const count=14;
  for(let i=0;i<count;i++){
   const t=i/(count-1),x=left+(right-left)*t,y=top+3+Math.sin(t*Math.PI)*17,r=4+Math.sin(t*Math.PI)*3;
   p.fillStyle=cloth;p.strokeStyle='#d2becb';p.lineWidth=1.1;p.beginPath();p.moveTo(x-r,y+3);p.quadraticCurveTo(x-r*1.5,y-10-r,x,y-10);p.quadraticCurveTo(x+r*1.5,y-10-r,x+r,y+3);p.quadraticCurveTo(x,y+7,x-r,y+3);p.fill();p.stroke();
   if(o.sock==='lace'){p.strokeStyle='#fffefa';p.beginPath();p.ellipse(x,y-3,2.1,3.5,0,0,Math.PI*2);p.stroke();}
  }
 }
 curve();p.strokeStyle=o.color==='black'?'#82788d':'#fffdf7';p.lineWidth=2.4;p.stroke();p.restore();
}
async function fallback(d){
 const out=canvas(),p=out.getContext('2d');
 // A missing shoe must not silently display the barefoot source as a finished
 // design. Partial and complete art failure share one complete fitted drawing.
 // Never fit a product-camera sticker over the front-three-quarter foot.
 // The emergency anatomy and shoe share one authored camera. A product
 // painting has a different opening/arch and cannot be pasted onto this foot.
 const skin=calfPaint(p);
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
  const out=canvas(),p=out.getContext('2d');p.imageSmoothingQuality='high';const skin=cleanLegs(parts.legs);p.drawImage(skin,0,0);drawSocks(p,skin,o,d.heel);
  if(parts.occlusion){p.globalCompositeOperation='destination-out';p.drawImage(parts.occlusion,0,0,SIZE,SIZE);p.globalCompositeOperation='source-over';}
  p.drawImage(parts.shoe,0,0,SIZE,SIZE);
  if(parts.upper){
   const tint=canvas(),q=tint.getContext('2d');q.drawImage(parts.upper,0,0,SIZE,SIZE);q.globalCompositeOperation='source-in';q.fillStyle=COLORS[d.color]||COLORS.pink;q.fillRect(0,0,SIZE,SIZE);
   q.globalCompositeOperation='source-atop';q.globalAlpha=['velvet','suede'].includes(d.material)?.8:.72;if(parts.shadow)q.drawImage(parts.shadow,0,0,SIZE,SIZE);q.globalAlpha=d.material==='suede'?.08:d.material==='velvet'?.16:d.material==='brocade'?.42:.78;if(parts.highlight)q.drawImage(parts.highlight,0,0,SIZE,SIZE);q.globalAlpha=1;
   p.drawImage(tint,0,0);
   // Finishes change colour and surface detail, never the antialiased shoe
   // silhouette. Match the product compositor instead of accumulating alpha
   // along soft upper edges differently for satin, crystals and woven cloth.
   p.globalCompositeOperation='source-atop';p.drawImage(finish(d,parts.upper),0,0);p.globalCompositeOperation='source-over';
  }
  // Some source paintings include a tiny skin-coloured ankle sliver inside
  // the shoe extraction. Extend the same cloth through that camera-specific
  // contact mask, over the embedded skin and under all exterior ornaments.
  // The offline mask excludes piping, soles and dyed uppers; original source
  // alpha, calf contours and every pair/platform transform stay untouched.
  if(parts.hosiery.width>1){p.save();p.globalCompositeOperation='source-atop';drawSocks(p,parts.hosiery,o,d.heel,true);p.restore();}
  await drawOrnaments(p,d,parts.upper);
  return {canvas:out,fallback:false,legs:parts.legs};
 }).then(result=>{if(!result.fallback){cache.set(id,result);while(cache.size>LIMIT)cache.delete(cache.keys().next().value);}return result;}).finally(()=>pending.delete(id));pending.set(id,work);return work;
}
// Two independently authored transforms share each fixed painted camera.
// The rear shoe is deliberately tucked behind the near vamp. Its calf leans
// left while the front calf continues right, matching the reference stance.
function cubicValue(a,b,c,d,t){const s=1-t;return s*s*s*a+3*s*s*t*b+3*s*t*t*c+t*t*t*d;}
function calfSection(height,rear=false){
 // One cubic covers the whole calf, from the knee taper above the crop,
 // through its soft swell to the shared y250/y350 ankle approach. A short splice
 // left most of the old outline almost straight and merely hid its corner.
 // Linear y controls make this an exact smooth x(y), shared by skin and yarn.
 const span=height+300,ends=rear?[518.198,728.892]:[530.848,759.607],slopes=rear?[-.1647,-.2369]:[-.09359,-.35146];
 const starts=rear?[460,747]:[602,845],initial=rear?[-.038,.08]:[-.06,.12];
 const controls=starts.map((x,i)=>[x,x+initial[i]*span/3,ends[i]-slopes[i]*span/3,ends[i]]);
 return y=>{const t=Math.max(0,Math.min(1,(y+300)/span));return controls.map(c=>cubicValue(...c,t));};
}
function paintCalf(p,height,section){
 p.fillStyle=calfPaint(p);p.beginPath();const rows=hosieryRows(height+300,4).map(y=>y-300);
 for(const [i,y] of rows.entries()){const x=section(y)[0];if(i)p.lineTo(x,y);else p.moveTo(x,y);}
 for(const y of rows.reverse())p.lineTo(section(y)[1],y);p.closePath();p.fill();
}
function pairedModel(source,options,extra=0,emergency=false){
 const leg=document.createElement('canvas');leg.width=SIZE;leg.height=1324+extra;const l=leg.getContext('2d');l.imageSmoothingQuality='high';
 const left=emergency?575:547,right=emergency?755:843,extension=(emergency?300:550)+extra,frontSection=calfSection(extension);
 if(emergency){l.fillStyle=calfPaint(l);l.beginPath();l.moveTo(left+55,-300);l.bezierCurveTo(left+5,extension*.18,left+8,extension*.58,left,extension);l.lineTo(right,extension);l.bezierCurveTo(right+42,extension*.59,right+43,extension*.20,right+9,-300);l.closePath();l.fill();}else paintCalf(l,extension,frontSection);calfVolume(l,left,right,extension);
 const o=fittingOptions(options);if(LONG_HOSIERY.has(o.sock)){
  const sheath=document.createElement('canvas');sheath.width=SIZE;sheath.height=extension;const q=sheath.getContext('2d');q.drawImage(leg,0,0);q.globalCompositeOperation='source-in';q.fillStyle=hosieryColour(o);q.fillRect(0,0,SIZE,sheath.height);
  const section=frontSection;
  hosierySurface(q,sheath.height,section);hosieryTexture(q,o,sheath.height,section,250-extension);l.save();l.globalAlpha=hosieryOpacity(o);l.drawImage(sheath,0,0);l.restore();fishnetYarn(l,sheath,o,sheath.height,section,250-extension);
 }
 if(emergency)l.drawImage(source,0,300+extra);else l.drawImage(source,0,250,SIZE,SIZE-250,0,extension,SIZE,SIZE-250);
 // Author a separate rear calf, leaning out to the left above the shared
 // camera-matched ankle. Only the ankle/foot painting is reused: a second
 // full-height copy would merge into one oversized calf at this close pose.
 const rear=document.createElement('canvas');rear.width=SIZE;rear.height=leg.height;const r=rear.getContext('2d');r.imageSmoothingQuality='high';
 if(emergency)r.drawImage(leg,0,0);else{
  // y350 is the last calf contour shared by every heel, before independent
  // ankle paintings diverge. Moving the splice leaves source mounts fixed.
  const join=650+extra,rearSection=calfSection(join,true);paintCalf(r,join,rearSection);calfVolume(r,462,747,join,true);
  if(LONG_HOSIERY.has(o.sock)){
   const sock=document.createElement('canvas');sock.width=SIZE;sock.height=rear.height;const z=sock.getContext('2d'),cloth=hosieryColour(o);z.drawImage(rear,0,0);z.globalCompositeOperation='source-in';z.fillStyle=cloth;z.fillRect(0,0,SIZE,rear.height);
   const section=rearSection;
   hosierySurface(z,rear.height,section);
   hosieryTexture(z,o,join,section,350-join);r.save();r.globalAlpha=hosieryOpacity(o);r.drawImage(sock,0,0);r.restore();fishnetYarn(r,sock,o,join,section,350-join);
  }
  // Join below the common source calf, above every short sock cuff.
  r.drawImage(source,0,350,SIZE,SIZE-350,0,join,SIZE,SIZE-350);
 }
 const pair=document.createElement('canvas');pair.width=1120;pair.height=1300+extra;const p=pair.getContext('2d');p.imageSmoothingQuality='high';
 // Both shoes share one physical size. Depth comes from the authored rear
 // calf, its higher contact point and the front leg's real occlusion.
 p.save();p.translate(-100,-200);p.translate(550,1160+extra);p.rotate(-.08);p.translate(-550,-1160-extra);p.drawImage(rear,0,0);p.globalCompositeOperation='source-atop';p.fillStyle='#77564e23';p.fillRect(0,0,SIZE,1324+extra);p.restore();
 // The nearer calf casts a soft, contour-following contact shadow onto the
 // rear calf. Keeping that shadow inside the existing rear alpha separates
 // the two legs without a painted stripe or a dark halo in the room.
 const contact=document.createElement('canvas');contact.width=pair.width;contact.height=pair.height;const q=contact.getContext('2d');
 q.shadowColor='#77516338';q.shadowBlur=35;q.shadowOffsetX=-8;q.drawImage(leg,-150,0);q.shadowColor='transparent';q.globalCompositeOperation='destination-out';q.drawImage(leg,-150,0);q.globalCompositeOperation='destination-in';q.drawImage(pair,0,0);p.drawImage(contact,0,0);
 p.drawImage(leg,-150,0);return pair;
}
// Offline-reviewed outsole contacts in each immutable worn camera. A tall
// platform and a flat cannot inherit the kitten heel's floating shadow.
const CONTACTS={
 flat:[[361,969],[728,790]],ballet:[[361,969],[728,790]],maryjane:[[361,969],[728,790]],loafer:[[354,970],[728,793]],
 block:[[393,969],[736,875]],bootie:[[394,969],[735,876]],wedge:[[430,993],[705,928]],platform:[[419,999],[738,953]],
 kitten:[[373,964],[725,851]],slingback:[[373,964],[725,851]],bowsling:[[373,964],[725,851]],bowmule:[[373,964],[726,852]],
 stiletto6:[[382,964],[753,866]],stiletto9:[[370,964],[751,883]],pearlpump:[[382,964],[753,866]],crystalpump:[[382,964],[753,866]],studpump:[[382,964],[753,866]],pearlheel:[[382,964],[754,866]],luciteheel:[[382,964],[753,866]],crystalsandal:[[382,964],[747,875]]
};
function soleShadow(p,contacts){
 // Contact follows the painted camera's toe-to-heel slope. Drawing in source
 // coordinates keeps both shadows attached through resize, socks and styles.
 for(const [i,[x,ground]] of contacts.entries()){
  const y=ground-2,rx=i?35:139,ry=i?7:10;
  p.save();p.translate(x,y);p.rotate(-.12);p.scale(1,ry/rx);const g=p.createRadialGradient(0,0,0,0,0,rx);g.addColorStop(0,'#4b5e5070');g.addColorStop(.55,'#4b5e503c');g.addColorStop(1,'#4b5e5000');p.fillStyle=g;p.beginPath();p.arc(0,0,rx,0,Math.PI*2);p.fill();p.restore();
 }
}
async function render(target,input,options,sceneId,cropped=false){
 const token={};tokens.set(target,token);target.dataset.fitting2dReady='false';const d=clean(input),o=fittingOptions(options),result=await composite(d,o);if(tokens.get(target)!==token)return false;
 const p=target.getContext('2d');p.clearRect(0,0,target.width,target.height);p.imageSmoothingEnabled=true;p.imageSmoothingQuality='high';
 // One transform covers skin, socks, shoe and every ornament. Slender fashion
 // proportions therefore cannot open a gap at a collar or move a fastening.
 // Keep long legs bleeding past the viewport while making feet more delicate.
 const stage=target.closest?.('.runway-scene');
 const geometry=A.Showcase.project(sceneId||stage?.dataset.showcaseScene||'salon',target.width,target.height,!!stage||cropped);
 // Fixed source-camera registration: taller sole paintings keep the same
 // toe contact as the approved pump, without resizing the shoe or calf.
 geometry.floor+=({wedge:(964-993)*.33,platform:(964-999)*.33}[d.heel]||0)*geometry.uniform;
 const slender=.80,{scale,floor}=geometry,extra=geometry.extra,pair=pairedModel(result.canvas,o,extra,result.fallback),w=pair.width*scale*slender,h=pair.height*scale,x=geometry.cx-315*scale,y=floor-(1264+extra)*scale,shadowContacts=result.fallback?[[350,963],[675,963]]:CONTACTS[d.heel]||CONTACTS.kitten;
 p.save();p.translate(x,y);p.scale(scale*slender,scale);
 p.save();p.translate(-100,-200);p.translate(550,1160+extra);p.rotate(-.08);p.translate(-550,-1160-extra);p.translate(0,300+extra);soleShadow(p,shadowContacts);p.restore();
 p.translate(-150,300+extra);soleShadow(p,shadowContacts);p.restore();
 p.drawImage(pair,x,y,w,h);
 Object.assign(target.dataset,{renderer:'painted-fitting',fitting2dReady:'true',heel:d.heel,color:d.color,material:d.material,fallback:String(result.fallback),legFrame:'0,0,1024,1024',feet:'2',sock:o.sock,sockColor:o.color,footAnchors:'back:-100,-200,1,-.08;front:-150,0,1;slender:.80',pairPose:'overlapped-full-height',pairLayout:JSON.stringify({scale,x,y,extra,slender,rear:[-100,-200,-.08],front:[-150,0],floor}),platformLayout:JSON.stringify(geometry),platformCount:'0',platformBaked:'true',fixedFraming:geometry.composition.join('x'),shadowContacts:JSON.stringify(shadowContacts),legContinuation:'opaque-past-frame',skinFinish:'soft-youthful'});return true;
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
