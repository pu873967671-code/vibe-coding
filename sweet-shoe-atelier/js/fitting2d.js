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
function drawSocks(p,legs,input,heel){
 const o=fittingOptions(input);if(o.sock==='none'||!legs)return;
 const layer=canvas(),q=layer.getContext('2d'),top=heel==='bootie'&&['frill','lace'].includes(o.sock)?350:{frill:470,lace:450,knee:170,sheer:-30}[o.sock];
 const openToe=A.SHOE_STYLES?.[heel]?.openToe;
 const colours={pink:'#ffd4e4',mint:'#d6f4e7',cream:'#fff1d6',white:'#fffdfa'},opacity=o.sock==='sheer'?.38:openToe?1:.94;
 const left=openToe&&top>400?(top<465?485:481):top<200?536:top<400?516:top<465?495:489,right=openToe&&top>400?(top<465?750:754):top<200?786:top<400?730:719;
 q.drawImage(legs,0,0,SIZE,SIZE);q.globalCompositeOperation='source-in';q.fillStyle=colours[o.color];q.fillRect(0,0,SIZE,SIZE);
 q.globalCompositeOperation='destination-in';q.beginPath();q.moveTo(0,top);q.lineTo(left,top);q.bezierCurveTo(left+55,top+24,right-52,top+25,right,top+2);q.lineTo(SIZE,top);q.lineTo(SIZE,SIZE);q.lineTo(0,SIZE);q.closePath();q.fillStyle='#fff';q.fill();
 q.globalCompositeOperation='source-atop';
 const light=q.createLinearGradient(openToe?190:left,0,openToe?800:right,0);light.addColorStop(0,'#8e94aa3d');light.addColorStop(.25,'#ffffff96');light.addColorStop(.60,'#ffffff08');light.addColorStop(1,'#82939845');q.fillStyle=light;q.fillRect(0,0,SIZE,SIZE);
 if(A.SHOE_STYLES?.[heel]?.openToe&&o.sock!=='sheer'){
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
 if(o.sock==='knee'||o.sock==='frill'){
  q.strokeStyle='#ffffff70';q.lineWidth=2;
  for(let x=300;x<900;x+=12){q.beginPath();q.moveTo(x,top+9);q.bezierCurveTo(x-10,400,x-35,650,x-140,850);q.stroke();}
 }
 if(o.sock==='lace'){
  q.strokeStyle='#fffef5e0';q.lineWidth=1.8;
  for(let y=top+12;y<900;y+=25)for(let x=290;x<900;x+=25){q.beginPath();q.ellipse(x+(y%2)*7,y,5,8,.5,0,Math.PI*2);q.ellipse(x+8+(y%2)*7,y,5,8,-.5,0,Math.PI*2);q.stroke();}
 }
 p.save();p.globalAlpha=opacity;p.drawImage(layer,0,0);p.restore();
 if(o.sock==='sheer')return;
 p.save();p.lineCap='round';p.lineJoin='round';
 const curve=()=>{p.beginPath();p.moveTo(left+2,top+3);p.bezierCurveTo(left+57,top+28,right-52,top+27,right-1,top+4);};
 curve();p.strokeStyle='#b6a1af5c';p.lineWidth=11;p.stroke();curve();p.strokeStyle=colours[o.color];p.lineWidth=8;p.stroke();
 if(o.sock==='frill'||o.sock==='lace'){
  // Individual little pleats turn around the calf; nearer folds are wider.
  const count=14;
  for(let i=0;i<count;i++){
   const t=i/(count-1),x=left+(right-left)*t,y=top+3+Math.sin(t*Math.PI)*17,r=4+Math.sin(t*Math.PI)*3;
   p.fillStyle=colours[o.color];p.strokeStyle='#d2becb';p.lineWidth=1.1;p.beginPath();p.moveTo(x-r,y+3);p.quadraticCurveTo(x-r*1.5,y-10-r,x,y-10);p.quadraticCurveTo(x+r*1.5,y-10-r,x+r,y+3);p.quadraticCurveTo(x,y+7,x-r,y+3);p.fill();p.stroke();
   if(o.sock==='lace'){p.strokeStyle='#fffefa';p.beginPath();p.ellipse(x,y-3,2.1,3.5,0,0,Math.PI*2);p.stroke();}
  }
 }
 curve();p.strokeStyle='#fffdf7';p.lineWidth=2.4;p.stroke();p.restore();
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
   q.globalCompositeOperation='source-atop';q.globalAlpha=d.material==='velvet'?.8:.72;if(parts.shadow)q.drawImage(parts.shadow,0,0,SIZE,SIZE);q.globalAlpha=d.material==='velvet'?.16:.78;if(parts.highlight)q.drawImage(parts.highlight,0,0,SIZE,SIZE);q.globalAlpha=1;
   p.drawImage(tint,0,0);p.drawImage(finish(d,parts.upper),0,0);
  }
  await drawOrnaments(p,d,parts.upper);
  return {canvas:out,fallback:false,legs:parts.legs};
 }).then(result=>{if(!result.fallback){cache.set(id,result);while(cache.size>LIMIT)cache.delete(cache.keys().next().value);}return result;}).finally(()=>pending.delete(id));pending.set(id,work);return work;
}
// Two independently authored transforms share each fixed painted camera.
// The rear shoe is deliberately tucked behind the near vamp. Its calf leans
// left while the front calf continues right, matching the reference stance.
function pairedModel(source,options,extra=0,emergency=false){
 const leg=document.createElement('canvas');leg.width=SIZE;leg.height=1324+extra;const l=leg.getContext('2d');l.imageSmoothingQuality='high';
 const left=emergency?575:547,right=emergency?755:843,extension=300+extra;l.fillStyle=calfPaint(l);l.beginPath();l.moveTo(left+55,-300);l.bezierCurveTo(left+5,extension*.18,left+8,extension*.58,left,extension);l.lineTo(right,extension);l.bezierCurveTo(right+42,extension*.59,right+43,extension*.20,right+9,-300);l.closePath();l.fill();calfVolume(l,left,right,extension);
 const o=fittingOptions(options);if(o.sock==='sheer'){
  const sheath=document.createElement('canvas');sheath.width=SIZE;sheath.height=300+extra;const q=sheath.getContext('2d');q.drawImage(leg,0,0);q.globalCompositeOperation='source-in';q.fillStyle={pink:'#ffd4e4',mint:'#d6f4e7',cream:'#fff1d6',white:'#fffdfa'}[o.color];q.fillRect(0,0,SIZE,sheath.height);
  q.globalCompositeOperation='source-atop';const light=q.createLinearGradient(536,0,786,0);light.addColorStop(0,'#8e94aa3d');light.addColorStop(.25,'#ffffff96');light.addColorStop(.60,'#ffffff08');light.addColorStop(1,'#82939845');q.fillStyle=light;q.fillRect(0,0,SIZE,sheath.height);l.save();l.globalAlpha=.38;l.drawImage(sheath,0,0);l.restore();
 }
 l.drawImage(source,0,300+extra);
 // Author a separate rear calf, leaning out to the left above the shared
 // camera-matched ankle. Only the ankle/foot painting is reused: a second
 // full-height copy would merge into one oversized calf at this close pose.
 const rear=document.createElement('canvas');rear.width=SIZE;rear.height=leg.height;const r=rear.getContext('2d');r.imageSmoothingQuality='high';
 if(emergency)r.drawImage(leg,0,0);else{
  const join=700+extra;r.fillStyle=calfPaint(r);r.beginPath();r.moveTo(460,-300);r.bezierCurveTo(419,join*.2,551,join-210,509,join);r.lineTo(719,join);r.bezierCurveTo(751,join-210,775,join*.23,747,-300);r.closePath();r.fill();calfVolume(r,462,747,join,true);
  if(o.sock==='sheer'||o.sock==='knee'){
   const sock=document.createElement('canvas');sock.width=SIZE;sock.height=rear.height;const z=sock.getContext('2d'),t=470+extra,cloth={pink:'#ffd4e4',mint:'#d6f4e7',cream:'#fff1d6',white:'#fffdfa'}[o.color];z.drawImage(rear,0,0);z.globalCompositeOperation='source-in';z.fillStyle=cloth;z.fillRect(0,0,SIZE,rear.height);
   if(o.sock==='knee'){z.globalCompositeOperation='destination-in';z.beginPath();z.moveTo(0,t);z.lineTo(474,t);z.bezierCurveTo(535,t+24,683,t+24,742,t);z.lineTo(SIZE,t);z.lineTo(SIZE,rear.height);z.lineTo(0,rear.height);z.closePath();z.fill();}
   z.globalCompositeOperation='source-atop';const shine=z.createLinearGradient(475,0,760,0);shine.addColorStop(0,'#8e94aa3d');shine.addColorStop(.25,'#ffffff96');shine.addColorStop(.60,'#ffffff08');shine.addColorStop(1,'#82939845');z.fillStyle=shine;z.fillRect(0,0,SIZE,rear.height);
   if(o.sock==='knee'){z.strokeStyle='#ffffff70';z.lineWidth=2;for(let x=440;x<790;x+=12){z.beginPath();z.moveTo(x,t);z.bezierCurveTo(x+5,t+80,x+14,t+140,x+20,t+230);z.stroke();}}
   r.save();r.globalAlpha=o.sock==='sheer'?.38:.94;r.drawImage(sock,0,0);r.restore();
   if(o.sock==='knee'){r.strokeStyle=cloth;r.lineWidth=7;r.beginPath();r.moveTo(476,t+2);r.bezierCurveTo(535,t+26,683,t+26,740,t+2);r.stroke();}

  }
  // Join below the common source calf, above every short sock cuff.
  r.drawImage(source,0,400,SIZE,SIZE-400,0,join,SIZE,SIZE-400);
 }
 const pair=document.createElement('canvas');pair.width=1000;pair.height=1300+extra;const p=pair.getContext('2d');p.imageSmoothingQuality='high';
 p.save();p.translate(-132,-166);p.translate(550,1160+extra);p.rotate(-.11);p.scale(.94,.94);p.translate(-550,-1160-extra);p.drawImage(rear,0,0);p.globalCompositeOperation='source-atop';p.fillStyle='#77564e23';p.fillRect(0,0,SIZE,1324+extra);p.restore();
 // The nearer calf casts a soft, contour-following contact shadow onto the
 // rear calf. Keeping that shadow inside the existing rear alpha separates
 // the two legs without a painted stripe or a dark halo in the room.
 const contact=document.createElement('canvas');contact.width=pair.width;contact.height=pair.height;const q=contact.getContext('2d');
 q.shadowColor='#77516370';q.shadowBlur=23;q.shadowOffsetX=-15;q.drawImage(leg,-150,0);q.shadowColor='transparent';q.globalCompositeOperation='destination-out';q.drawImage(leg,-150,0);q.globalCompositeOperation='destination-in';q.drawImage(pair,0,0);p.drawImage(contact,0,0);
 p.drawImage(leg,-150,0);return pair;
}
async function render(target,input,options){
 const token={};tokens.set(target,token);target.dataset.fitting2dReady='false';const d=clean(input),o=fittingOptions(options),result=await composite(d,o);if(tokens.get(target)!==token)return false;
 const p=target.getContext('2d');p.clearRect(0,0,target.width,target.height);p.imageSmoothingEnabled=true;p.imageSmoothingQuality='high';
 // One transform covers skin, socks, shoe and every ornament. Slender fashion
 // proportions therefore cannot open a gap at a collar or move a fastening.
 // Keep long legs bleeding past the viewport while making feet more delicate.
 const slender=.80,scale=Math.min(target.width*.96/(1000*slender),target.height*1.01/1300),extra=Math.max(0,Math.ceil(target.height/scale-1250)),pair=pairedModel(result.canvas,o,extra,result.fallback),w=pair.width*scale*slender,h=pair.height*scale,x=(target.width-w)/2,y=target.height*.98-h;
 const floor=y+(1264+extra)*scale,cx=target.width*.50;
 p.save();p.translate(cx,floor);p.scale(1,.2);
 const halo=p.createRadialGradient(0,0,w*.12,0,0,w*.43);halo.addColorStop(0,'#527d6242');halo.addColorStop(1,'#527d6200');p.fillStyle=halo;p.beginPath();p.arc(0,0,w*.43,0,Math.PI*2);p.fill();p.restore();
 p.save();p.fillStyle='#cfeadf';p.beginPath();p.ellipse(cx,floor+1300*scale*.023,w*.43,1300*scale*.04,0,0,Math.PI*2);p.fill();
 const porcelain=p.createLinearGradient(0,floor-1300*scale*.025,0,floor+1300*scale*.035);porcelain.addColorStop(0,'#ffffff');porcelain.addColorStop(1,'#e5f6ed');p.fillStyle=porcelain;p.beginPath();p.ellipse(cx,floor+1300*scale*.008,w*.43,1300*scale*.037,0,0,Math.PI*2);p.fill();p.strokeStyle='#ffffffdb';p.lineWidth=Math.max(1,w*.002);p.stroke();p.restore();
 p.drawImage(pair,x,y,w,h);
 Object.assign(target.dataset,{renderer:'painted-fitting',fitting2dReady:'true',heel:d.heel,color:d.color,material:d.material,fallback:String(result.fallback),legFrame:'0,0,1024,1024',feet:'2',sock:o.sock,sockColor:o.color,footAnchors:'back:-132,-166,.94,-.11;front:-150,0,1;slender:.80',pairPose:'overlapped-reference-b',skinFinish:'soft-youthful'});return true;
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
