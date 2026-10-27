'use strict';
(function(A){
// Fitting artwork has its own immutable camera. Finish changes touch the shoe
// mask only; the shared calf treatment and pair transforms remain identical
// across every finish, ornament and heel choice.
const SIZE=1024,LIMIT=8;
const COLORS={pink:'#ffadc9',cream:'#fff0d2',blue:'#a9daff',green:'#c6e7a5',purple:'#d6b9ff',peach:'#ffc09e',rose:'#f478a4',black:'#696883'};
const sources=new Map(),cache=new Map(),pending=new Map(),tokens=new WeakMap();
const ornaments=new Map();
// The showcase's layered lilac rosette is the same physical ornament when
// worn. These measured source rectangles project its painted petals/metal
// onto each existing counter mount; no anatomy or viewport transform changes.
const FLOWER_PROJECTIONS={
 flat:{source:[832,186,125,182],target:[724,510,115,139]},
 kitten:{source:[830,80,128,184],target:[732,507,117,142]},
 block:{source:[829,75,128,175],target:[724,502,116,147]},
 wedge:{source:[827,67,132,190],target:[723,487,98,147]},
 stiletto6:{source:[830,73,128,186],target:[732,419,117,142]},
 stiletto9:{source:[830,78,128,185],target:[732,407,117,145]},
 platform:{source:[829,75,128,175],target:[729,462,116,147]}
};
// The crystal toe brooch is the same lilac, gold-set stone in both cameras.
// Keep the existing toe mount, its painted facet proportions and fixed metal
// colours. Camera-local scale is independent of viewport/finish/hosiery.
const CRYSTAL_PROJECTIONS={
 flat:[249,388,87,51,278.5,848,.72],
 block:[249,395,98,58,252,863.5,.67],
 kitten:[269,380,93,70,304,830.5,.67],
 wedge:[240,343,101,80,305,842.5,.58],
 stiletto6:[269,394,93,71,304,827.5,.67],
 stiletto9:[269,399,93,71,304,827.5,.67],
 platform:[249,345,98,56,257,823.5,.67]
};
// The nacre cabochon and its braided gold bezel retain the product painting,
// rather than substituting the former small plain bead in the worn camera.
const PEARL_PROJECTIONS={
 flat:[252,369,64,58,282.5,857,.72],
 block:[288,374,69,54,289,859,.68],
 kitten:[281,381,66,61,304,851,.70],
 wedge:[249,348,82,58,305,837,.60],
 stiletto6:[281,395,66,62,304,848,.70],
 stiletto9:[281,400,66,62,304,848,.70],
 platform:[288,323,69,56,294,819,.68]
};
// Pin the complete folded satin bow to the outside counter in both views.
const GRAND_MOUNTS={
 flat:[915,211,757,594,1.116],block:[877,103,753,545,1.0],
 kitten:[897,91,756,545,1.0],wedge:[890,106,756,530,.96],
 stiletto6:[897,106,770,485,1.0],stiletto9:[897,111,760,485,1.0],
 platform:[877,79,756,523,1.0]
};
function projectGrandBow(p,d,painting,mask,mount){
 const dyed=document.createElement('canvas');dyed.width=1024;dyed.height=640;
 const tint=document.createElement('canvas');tint.width=1024;tint.height=640;
 const t=tint.getContext('2d');t.drawImage(painting,0,0);
 t.globalCompositeOperation='multiply';t.fillStyle=COLORS[d.color]||COLORS.pink;t.fillRect(0,0,1024,640);
 t.globalCompositeOperation='destination-in';t.drawImage(mask,0,0);
 const f=dyed.getContext('2d');f.drawImage(painting,0,0);f.globalCompositeOperation='source-atop';f.drawImage(tint,0,0);
 const [sx,sy,tx,ty,scale]=mount,layer=canvas(),q=layer.getContext('2d');
 q.imageSmoothingEnabled=true;q.imageSmoothingQuality='high';
 const verticalScale=(A.SHOE_STYLES?.[d.heel]?.accessoryBase||d.heel)==='flat'?scale*.82:scale;
 q.setTransform(scale,0,0,verticalScale,tx-sx*scale,ty-sy*verticalScale);q.drawImage(dyed,0,0);q.resetTransform();
 p.save();p.shadowColor='#50303a66';p.shadowBlur=6;p.shadowOffsetY=3;
 p.drawImage(layer,0,0);p.restore();
}
function projectToeOrnament(p,painting,mount){
 const [x,y,w,h,cx,cy,scale]=mount;
 p.save();p.imageSmoothingEnabled=true;p.imageSmoothingQuality='high';
 p.drawImage(painting,x,y,w,h,cx-w*scale/2,cy-h*scale/2,w*scale,h*scale);
 p.restore();
}
// The wide folded band, knot and asymmetric tails are one physical ribbon.
// Project the retained showcase painting between independently measured far
// collar / outer knot mounts. Normal scale preserves its broad satin face.
const RIBBON_MOUNTS={
 flat:{from:[366,342,701,377],to:[420,626,650,727],normal:.76},
 kitten:{from:[420,333,692,347],to:[431,613,670,686],normal:.72},
 block:{from:[483,294,729,295],to:[423,626,652,690],normal:.72},
 wedge:{from:[366,344,674,323],to:[440,590,677,640],normal:.63},
 stiletto6:{from:[420,348,692,357],to:[431,598,683,643],normal:.72},
 stiletto9:{from:[420,348,692,357],to:[431,595,675,640],normal:.72},
 platform:{from:[483,270,729,270],to:[445,587,677,650],normal:.72}
};
// Match the showcase's real buckle, stitched tab and punched holes. Mount the
// buckle at the collar itself; the former painted strip ended on bare skin.
const THIN_MOUNTS={
 flat:{from:[485,286,653,376],to:[414,642,654,713],normal:.78},
 block:{from:[548,247,704,292],to:[429,607,664,658],normal:.78},
 kitten:{from:[532,258,711,306],to:[406,660,652,719],normal:.78},
 wedge:{from:[502,234,670,271],to:[423,621,668,657],normal:.78},
 stiletto6:{from:[556,256,710,309],to:[406,647,671,671],normal:.78},
 stiletto9:{from:[582,267,710,310],to:[406,647,667,657],normal:.78},
 platform:{from:[546,220,700,272],to:[454,559,696,618],normal:.78}
};
async function ornament(heel,name){heel=A.SHOE_STYLES?.[heel]?.accessoryBase||heel;const id=heel+'_'+name,product=name==='decoration_big'&&GRAND_MOUNTS[heel]||name==='charm_pearl'&&PEARL_PROJECTIONS[heel]||name==='charm_crystal'&&CRYSTAL_PROJECTIONS[heel]||name==='decoration_flower'&&FLOWER_PROJECTIONS[heel]||name==='strap_ribbon'&&RIBBON_MOUNTS[heel]||name==='strap_thin'&&THIN_MOUNTS[heel];if(!ornaments.has(id))ornaments.set(id,Promise.all([image('assets/fitting2d/accessories/'+id+'.webp'),['strap_thin','strap_ribbon','strap_cross','decoration_small','decoration_big','charm_mini'].includes(name)?image('assets/fitting2d/accessories/'+id+'_tint.webp'):Promise.resolve(null),product?image('assets/shoe2d/accessories/'+id+'.webp'):Promise.resolve(null),['strap_ribbon','strap_thin','decoration_big'].includes(name)&&product?image('assets/shoe2d/accessories/'+id+'_tint.webp'):Promise.resolve(null)]));return ornaments.get(id);}
function drawRibbon(p,d,painting,mask,mount){
 const fabric=document.createElement('canvas');fabric.width=1024;fabric.height=640;const f=fabric.getContext('2d');
 f.drawImage(painting,0,0);f.globalCompositeOperation='multiply';f.fillStyle=COLORS[d.color]||COLORS.pink;f.fillRect(0,0,1024,640);f.globalCompositeOperation='destination-in';f.drawImage(mask,0,0);
 // Match the product compositor exactly, including partial tint at silk edges.
 const dyed=document.createElement('canvas');dyed.width=1024;dyed.height=640;const z=dyed.getContext('2d');z.drawImage(painting,0,0);z.globalCompositeOperation='source-atop';z.drawImage(fabric,0,0);
 // The wedge's returning far tab fastens behind the fitted ankle. Its empty
 // product-camera loop must not become a pointed free end on bare skin.
 if(d.strap==='ribbon'&&(A.SHOE_STYLES?.[d.heel]?.accessoryBase||d.heel)==='wedge'){z.globalCompositeOperation='destination-out';z.beginPath();z.moveTo(650,290);z.lineTo(724,140);z.lineTo(810,190);z.lineTo(708,320);z.closePath();z.fillStyle='#fff';z.fill();}
 // The product painting's return tab includes a pointed/grey underside
 // intended for an empty shoe. Ease that small end into the fitted foot,
 // keeping the woven face, buckle and bow at their original coordinates.
 z.globalCompositeOperation='destination-in';
 const start=mount.from[0],endFade=z.createLinearGradient(start+(d.strap==='thin'?-2:4),0,start+(d.strap==='thin'?8:16),0);
 endFade.addColorStop(0,'rgba(255,255,255,0)');endFade.addColorStop(1,'#fff');
 z.fillStyle=endFade;z.fillRect(0,0,1024,640);
 const [sx,sy,ex,ey]=mount.from,[tx,ty,nx,ny]=mount.to,dx=ex-sx,dy=ey-sy,length=Math.hypot(dx,dy),ux=dx/length,uy=dy/length,vx=(nx-tx)/length,vy=(ny-ty)/length,angle=Math.atan2(ny-ty,nx-tx),px=-Math.sin(angle)*mount.normal,py=Math.cos(angle)*mount.normal;
 const a=vx*ux-px*uy,b=vy*ux-py*uy,c=vx*uy+px*ux,e=vy*uy+py*ux;
 let projected=canvas();let q=projected.getContext('2d');q.imageSmoothingEnabled=true;q.imageSmoothingQuality='high';q.setTransform(a,b,c,e,tx-a*sx-c*sy,ty-b*sx-e*sy);q.drawImage(dyed,0,0);q.resetTransform();
 if(d.strap==='thin'){
  // Stretch only the unfastened band across the wider fitted instep. The
  // buckle and sewn near tab keep the showcase's own proportions and metal
  // width; a single affine stretch made that hardware unnaturally wide.
  const strip=document.createElement('canvas');strip.width=1400;strip.height=500;const s=strip.getContext('2d');s.imageSmoothingQuality='high';s.translate(900,250);s.rotate(-Math.atan2(dy,dx));s.translate(-ex,-ey);s.drawImage(dyed,0,0);
  const curved=canvas(),c=curved.getContext('2d'),span=Math.hypot(nx-tx,ny-ty),fixed=35,scale=mount.normal,stretch=(span-fixed*scale)/(length-fixed),map=t=>t< -fixed?-fixed*scale+(t+fixed)*stretch:t*scale;
  c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.translate(nx,ny);c.rotate(angle);
  for(let t=-700;t<250;t++){
   const x=map(t),width=map(t+1)-x,progress=Math.max(0,Math.min(1,1+x/span)),lift=-16*Math.sin(Math.PI*progress);
   c.save();c.beginPath();c.rect(x,-1000,width,2000);c.clip();
   c.transform(width,0,0,scale,x-width*(t+900),-250*scale+lift);
   c.drawImage(strip,0,0);c.restore();
  }
  c.resetTransform();projected=curved;q=c;
 }
 // Only the far tab disappears behind the existing foot/sock silhouette.
 // Keep the hanging bow's original soft alpha outside the outer upper.
 const visibility=canvas(),v=visibility.getContext('2d');
 // The inner end rolls around the instep instead of ending in a hard cut.
 // Move the silhouette slightly inward and feather it in camera pixels;
 // this works equally for skin and hosiery and stays with each paired foot.
 v.filter='blur(2px)';v.drawImage(p.canvas,4,0);v.filter='none';
 // Never let the feather or the contact shadow protrude past the leg.
 v.globalCompositeOperation='destination-in';v.drawImage(p.canvas,0,0);
 v.globalCompositeOperation='source-over';
 if(d.strap==='ribbon'){v.fillStyle='#fff';v.fillRect(tx+36,0,SIZE,SIZE);}
 const seated=canvas(),s=seated.getContext('2d');
 s.shadowColor='rgba(67,39,49,.32)';s.shadowBlur=2;s.shadowOffsetY=2;s.drawImage(projected,0,0);
 s.shadowColor='transparent';s.drawImage(projected,0,0);
 s.globalCompositeOperation='destination-in';s.drawImage(visibility,0,0);p.drawImage(seated,0,0);
}
// The Mary Jane's sewn band is part of its shoe and tint paintings. Tuck
// just its inner tip against the same soft leg contour in both layers, so
// the selected colour and the underlying painting keep identical edges.
function tuckMaryJane(source,skin){
 if(!source)return source;
 const out=canvas(),p=out.getContext('2d'),mask=canvas(),m=mask.getContext('2d');
 p.drawImage(source,0,0);m.fillStyle='#fff';m.fillRect(0,0,SIZE,SIZE);
 m.clearRect(375,520,125,140);m.save();m.beginPath();m.rect(375,520,125,140);m.clip();
 m.filter='blur(1.5px)';m.drawImage(skin,2,0);m.restore();
 p.globalCompositeOperation='destination-in';p.drawImage(mask,0,0);
 // Round the two exposed corners of the sewn outer tab. Apply the same
 // cut to the painted shoe and its tint mask so no grey square survives.
 p.globalCompositeOperation='destination-out';p.fillStyle='#fff';
 p.beginPath();p.moveTo(682,657);p.lineTo(691,662);p.lineTo(689,670);
 p.quadraticCurveTo(689,665,685,663);p.closePath();p.fill();
 p.beginPath();p.moveTo(677,689);p.lineTo(674,697);p.lineTo(666,693);
 p.quadraticCurveTo(672,694,675,691);p.closePath();p.fill();
 return out;
}
// The sewn end in the source painting is neutral grey. Retouch only the
// last few pixels with the chosen satin, curving its outer edge where it
// meets the collar; the buckle and stitch work remain untouched.
function finishMaryJaneTab(p,d){
 p.save();
 p.beginPath();p.moveTo(678,657);p.lineTo(686,662);p.quadraticCurveTo(690,664,688,669);
 p.lineTo(675,691);p.quadraticCurveTo(673,696,669,694);p.lineTo(662,690);p.closePath();
 p.globalCompositeOperation='multiply';p.fillStyle=COLORS[d.color]||COLORS.pink;p.fill();
 p.globalCompositeOperation='source-over';
 p.strokeStyle='rgba(79,48,58,.32)';p.lineWidth=1;p.beginPath();p.moveTo(686,665);p.quadraticCurveTo(687,667,685,670);p.lineTo(674,689);p.quadraticCurveTo(672,693,669,692);p.stroke();
 p.restore();
}
async function drawOrnaments(p,d,upper){for(const category of ['strap','decoration','charm']){if(d[category]==='none')continue;if(A.AccessoryRenderer?.handles(category,d[category],'worn')){A.AccessoryRenderer.drawOne(p,d,'worn',category,upper);continue;}const [im,mask,product,productMask]=await ornament(d.heel,category+'_'+d[category]);const family=A.SHOE_STYLES?.[d.heel]?.accessoryBase||d.heel,projection=FLOWER_PROJECTIONS[family];if(category==='decoration'&&d.decoration==='big'&&product?.naturalWidth===1024&&product.naturalHeight===640&&productMask?.naturalWidth===1024&&productMask.naturalHeight===640&&GRAND_MOUNTS[family]){projectGrandBow(p,d,product,productMask,GRAND_MOUNTS[family]);continue;}if(category==='charm'&&['crystal','pearl'].includes(d.charm)&&product?.naturalWidth===1024&&product.naturalHeight===640){const mount=(d.charm==='pearl'?PEARL_PROJECTIONS:CRYSTAL_PROJECTIONS)[family];if(mount){projectToeOrnament(p,product,mount);continue;}}if(category==='decoration'&&d.decoration==='flower'&&product?.naturalWidth===1024&&product.naturalHeight===640&&projection){p.save();p.imageSmoothingEnabled=true;p.imageSmoothingQuality='high';p.drawImage(product,...projection.source,...projection.target);p.restore();continue;}if(category==='strap'&&['thin','ribbon'].includes(d.strap)&&product?.naturalWidth===1024&&product.naturalHeight===640&&productMask?.naturalWidth===1024&&productMask.naturalHeight===640){const mount=(d.strap==='thin'?THIN_MOUNTS:RIBBON_MOUNTS)[family];if(mount){drawRibbon(p,d,product,productMask,mount);continue;}}if(!im)continue;if(!mask){p.drawImage(im,0,0,SIZE,SIZE);continue;}const layer=canvas(),q=layer.getContext('2d');q.drawImage(im,0,0,SIZE,SIZE);q.globalCompositeOperation='multiply';q.fillStyle=COLORS[d.color]||COLORS.pink;q.fillRect(0,0,SIZE,SIZE);q.globalCompositeOperation='destination-in';q.drawImage(mask,0,0,SIZE,SIZE);p.drawImage(im,0,0,SIZE,SIZE);p.drawImage(layer,0,0);if(category==='strap'&&d.strap==='thin')drawThinBuckle(p,d);}}
// The retained Mary-Jane band paintings omitted the product camera's buckle.
// These measured source-local mounts lie within each original satin strip;
// hardware is painted after tint so every palette keeps the same warm metal.
const THIN_BUCKLES={flat:[606,713,.719],kitten:[602,719,.753],block:[619,657.5,.559],wedge:[620,657,.644],stiletto6:[625,671,.512],stiletto9:[624,656.5,.303],platform:[627,618,.602]};
function drawThinBuckle(p,d){
 const key=A.SHOE_STYLES?.[d.heel]?.accessoryBase||d.heel,a=THIN_BUCKLES[key];if(!a)return;
 p.save();p.translate(a[0],a[1]);p.rotate(a[2]);p.scale(1.35,1.35);p.lineJoin='round';
 // Hollow frame leaves the selected satin visible through its opening.
 p.shadowColor='#66473366';p.shadowBlur=2;p.shadowOffsetY=1.3;
 p.strokeStyle='#805f38';p.lineWidth=5.5;p.beginPath();p.roundRect(-13,-15,26,30,5);p.stroke();p.shadowColor='transparent';
 const metal=p.createLinearGradient(-14,-16,14,16);metal.addColorStop(0,'#fff5c8');metal.addColorStop(.24,'#dabc79');metal.addColorStop(.55,'#a68148');metal.addColorStop(.78,'#f5dfa3');metal.addColorStop(1,'#c19b58');
 p.strokeStyle=metal;p.lineWidth=3.5;p.stroke();
 p.lineWidth=2.5;p.beginPath();p.moveTo(-12,0);p.lineTo(11,0);p.stroke();
 p.strokeStyle='#fff5cf';p.lineWidth=1;p.beginPath();p.moveTo(-9,-13);p.lineTo(8,-13);p.moveTo(-11,-10);p.lineTo(-11,-4);p.stroke();p.restore();
}
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
  if(!fittedKit(parts)){sources.delete(heel);return parts;}
  return A.WornBodyFidelity?.prepare(heel,parts)||parts;
 }));
 return sources.get(heel);
}
function clipped(ctx,mask){ctx.globalCompositeOperation='destination-in';ctx.drawImage(mask,0,0,SIZE,SIZE);ctx.globalCompositeOperation='source-over';}
function finish(d,mask){
 const out=canvas(),p=out.getContext('2d');p.lineCap='round';
 if(d.material==='patent'&&A.SHOE_STYLES[d.heel]?.openToe){
  const g=p.createLinearGradient(130,930,720,250);
  // An open vamp has no fabric where a closed pump catches its reflection.
  // Place the two patent glints on its forefoot and instep bands instead.
  for(const [at,alpha] of [[0,0],[.18,0],[.25,.65],[.29,.12],[.34,0],[.55,0],[.62,.30],[.67,.10],[.72,0],[1,0]])g.addColorStop(at,'rgba(255,255,255,'+alpha+')');
  p.fillStyle=g;p.fillRect(0,0,SIZE,SIZE);
 }else A.CoutureFinish?.drawFinish(p,d,SIZE,SIZE,'worn');
 A.CoutureFinish?.drawPattern(p,d,SIZE,SIZE,'worn');
 clipped(p,mask);A.CoutureFinish?.laceTrim(p,mask,d,SIZE,SIZE,'worn');A.CoutureFinish?.loaferLaceSaddle(p,d,'worn');if(d.material==='velvet')A.CoutureFinish?.velvetRim(p,mask,SIZE,SIZE);return out;
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
// Turn the complete fitted foot toward the product's longer side camera.
// Work after socks/ornaments so their mounts cannot separate from the shoe.
// The common calf above y350 is exact; a cubic transition bends the ankle
// gently into the side-profile last. Its moderate width and retained depth
// keep the toe box full instead of stretching it into a paper-thin point.
// Each integer destination row samples
// the complete source, so bilinear filtering can use its neighbouring pixels.
// Cropping fractional source rows first clamps the filter at each crop edge
// and turns smooth skin/cloth into visible horizontal streaks in Canvas.
const SIDE_CAMERA={
 wedge:[1.20,.92,993],kitten:[1.17,.92,964],flat:[1.15,.90,969],ballet:[1.15,.90,969],
 maryjane:[1.15,.90,969],loafer:[1.15,.92,970],block:[1.17,.92,969],bootie:[1.13,.90,969],
 platform:[1.15,.93,999],crystalsandal:[1.13,.94,964]
};
// Premultiplied bilinear inverse sampling writes every destination pixel once.
// In particular it never clamps interpolation to a one-pixel source strip.
function sideCameraPixels(input,wide,depth,floor,size=SIZE){
 const data=input.data||input,out=new Uint8ClampedArray(size*size*4),cutoff=350,pivot=450;
 out.set(data.subarray(0,size*cutoff*4));
 const ease=y=>{const t=Math.max(0,Math.min(1,(y-cutoff)/350));return t*t*t*(10+t*(-15+6*t));};
 const vertical=y=>y+(floor-y)*(1-depth)*ease(y);
 for(let y=cutoff;y<size;y++){
  let lo=cutoff,hi=size;for(let n=0;n<22;n++){const mid=(lo+hi)/2;if(vertical(mid)<y+.5)lo=mid;else hi=mid;}
  const sourceY=(lo+hi)/2-.5;if(sourceY>=size-1)continue;
  const y0=Math.floor(sourceY),fy=sourceY-y0,scale=1+(wide-1)*ease(sourceY+.5);
  for(let x=0;x<size;x++){
   const sx=pivot+(x+.5-pivot)/scale-.5,x0=Math.floor(sx);if(x0<0||x0>=size-1)continue;
   const fx=sx-x0,a=(y0*size+x0)*4,b=a+4,c=a+size*4,d=c+4;
   const wa=(1-fx)*(1-fy)*data[a+3],wb=fx*(1-fy)*data[b+3],wc=(1-fx)*fy*data[c+3],wd=fx*fy*data[d+3],alpha=wa+wb+wc+wd,i=(y*size+x)*4;
   if(!alpha)continue;out[i+3]=alpha;
   for(let channel=0;channel<3;channel++)out[i+channel]=(data[a+channel]*wa+data[b+channel]*wb+data[c+channel]*wc+data[d+channel]*wd)/alpha;
  }
 }
 return out;
}
function sideCamera(source,heel){
 const [wide,depth,floor]=SIDE_CAMERA[heel]||[1.15,.93,964],out=canvas(),p=out.getContext('2d');
 const easing=y=>{const t=Math.max(0,Math.min(1,(y-350)/350));return t*t*t*(10+t*(-15+6*t));};
 const vertical=y=>y+(floor-y)*(1-depth)*easing(y);
 // The offline Canvas recorder records this operation symbolically, then
 // replays this exact pixel sampler; no pixel arrays are written to JSON.
 let sampled=false;
 if(typeof p.sideCamera==='function'){p.sideCamera(source,wide,depth,floor);sampled=true;}
 else try{
  const pixels=source.getContext('2d').getImageData(0,0,SIZE,SIZE),result=p.createImageData(SIZE,SIZE);
  result.data.set(sideCameraPixels(pixels,wide,depth,floor));p.putImageData(result,0,0);sampled=true;
 }catch(error){
  // A redirected non-CORS image can taint Canvas. Keep the complete artwork
  // visible in that case using the read-free geometric projection below.
  if(error?.name!=='SecurityError'&&error?.name!=='NotSupportedError')throw error;
 }
 if(!sampled){
  p.imageSmoothingEnabled=true;p.imageSmoothingQuality='high';p.drawImage(source,0,0,SIZE,350,0,0,SIZE,350);
  const inverse=y=>{let lo=350,hi=SIZE;for(let n=0;n<20;n++){const mid=(lo+hi)/2;if(vertical(mid)<y)lo=mid;else hi=mid;}return (lo+hi)/2;};
  for(let y=350;y<Math.ceil(vertical(SIZE));y++){
   const top=inverse(y),bottom=inverse(y+1),scale=1+(wide-1)*easing((top+bottom)/2);
   p.save();p.beginPath();p.rect(0,y,SIZE,1);p.clip();const sy=1/(bottom-top);
   p.setTransform(scale,0,0,sy,450*(1-scale),y-top*sy);p.drawImage(source,0,0);p.restore();
  }
 }
 A.WornBodyFidelity?.postProjection?.(out,source,heel,(x,y)=>[450+(x-450)*(1+(wide-1)*easing(y)),vertical(y)]);
 return out;
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
 const yarnSection=['slingback','bowsling'].includes(heel)?y=>{const bounds=hosierySection(y);if(y>480)bounds[1]=Math.max(bounds[1],Math.min(810,720+(y-480)*.6)-Math.max(0,y-700)*2);return bounds;}:openToe?y=>y>750?[190,800]:hosierySection(y):hosierySection;
 fishnetYarn(p,layer,o,SIZE,yarnSection);
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
  if(d.decoration==='puffy')await A.AccessoryRenderer?.loadPuffy();
  if(d.material==='lace')await A.CoutureFinish?.loadLace();
  if(!fittedKit(parts))return {canvas:await fallback(d),fallback:true};
  parts=A.WornBodyFidelity?.lacedVamp(parts,d)||parts;
  if(['slingback','bowsling'].includes(d.heel)&&o.sock==='opaque'){
   const upper=canvas(),u=upper.getContext('2d');u.drawImage(parts.upper,0,0);u.save();u.beginPath();u.rect(650,480,250,280);u.clip();u.globalCompositeOperation='destination-in';u.drawImage(parts.shoe,0,0);u.restore();
   const hosiery=canvas(),h=hosiery.getContext('2d');h.drawImage(parts.hosiery,0,0);h.save();h.beginPath();h.rect(650,480,250,280);h.clip();h.clearRect(650,480,250,280);h.filter='blur(1.5px)';h.drawImage(parts.hosiery,0,0);h.restore();
   parts={...parts,upper,hosiery};
  }
  const blackSling=['slingback','bowsling'].includes(d.heel)&&o.sock==='opaque'&&o.color==='black';
  if(blackSling){
   const shoe=canvas(),s=shoe.getContext('2d');s.drawImage(parts.shoe,0,0);s.globalCompositeOperation='destination-out';s.beginPath();s.rect(725,489,9,6);s.fill();
   parts={...parts,shoe};
  }
  const out=canvas(),p=out.getContext('2d');p.imageSmoothingQuality='high';const skin=cleanLegs(parts.legs);p.drawImage(skin,0,0);
  if(d.heel==='maryjane')parts={...parts,shoe:tuckMaryJane(parts.shoe,skin),upper:tuckMaryJane(parts.upper,skin)};
  let sockMask=skin;
  if(blackSling){
   sockMask=canvas();const m=sockMask.getContext('2d');m.drawImage(skin,0,0);m.fillStyle='#fff';m.beginPath();m.moveTo(790,610);m.bezierCurveTo(802,610,801,630,800,638);m.bezierCurveTo(800,640,801,641,802,643);m.lineTo(790,643);m.closePath();m.fill();
  }
  drawSocks(p,sockMask,o,d.heel);
  if(parts.occlusion){p.globalCompositeOperation='destination-out';p.drawImage(parts.occlusion,0,0,SIZE,SIZE);p.globalCompositeOperation='source-over';}
  if(['slingback','bowsling'].includes(d.heel)&&o.sock!=='none'){
   // Dark hosiery behind the open heel exposes every half-transparent strap
   // edge. A one-pixel shoe-coloured underlay keeps strap and seat edges crisp.
   p.save();p.beginPath();p.rect(630,430,290,400);p.clip();p.globalAlpha=.9;
   for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1],[-.7,-.7],[.7,-.7],[-.7,.7],[.7,.7]])p.drawImage(parts.shoe,dx,dy,SIZE,SIZE);
   p.restore();
  }
  p.drawImage(parts.shoe,0,0,SIZE,SIZE);
  if(parts.upper){
   const tint=canvas(),q=tint.getContext('2d');q.drawImage(parts.upper,0,0,SIZE,SIZE);q.globalCompositeOperation='source-in';q.fillStyle=COLORS[d.color]||COLORS.pink;q.fillRect(0,0,SIZE,SIZE);
   q.globalCompositeOperation='source-atop';q.globalAlpha=['velvet','suede'].includes(d.material)?.8:.72;if(parts.shadow)q.drawImage(parts.shadow,0,0,SIZE,SIZE);q.globalAlpha=d.material==='suede'?.08:d.material==='velvet'?.16:d.material==='mesh'?.34:d.material==='brocade'?.42:.78;if(parts.highlight)q.drawImage(parts.highlight,0,0,SIZE,SIZE);q.globalAlpha=1;
   p.drawImage(tint,0,0);
   // Finishes change colour and surface detail, never the antialiased shoe
   // silhouette. Match the product compositor instead of accumulating alpha
   // along soft upper edges differently for satin, crystals and woven cloth.
   p.globalCompositeOperation='source-atop';
   if(d.material==='mesh'){
    const underlay=o.sock==='none'?'#f2c7b0':hosieryColour(o);
    p.drawImage(A.CoutureFinish.meshPanel(d,parts.upper,SIZE,SIZE,'worn',underlay,parts.shadow,parts.highlight),0,0);
    const pattern=canvas(),r=pattern.getContext('2d');A.CoutureFinish.drawPattern(r,d,SIZE,SIZE,'worn');clipped(r,parts.upper);p.drawImage(pattern,0,0);
   }else p.drawImage(finish(d,parts.upper),0,0);p.globalCompositeOperation='source-over';
  }
  if(d.heel==='loafer'){
   p.save();p.globalCompositeOperation='destination-out';p.beginPath();
   p.moveTo(696,750);p.bezierCurveTo(735,730,775,708,793,697);p.lineTo(801,696);p.lineTo(801,773);p.lineTo(728,800);p.lineTo(687,780);p.closePath();p.fill();p.restore();
   p.save();const heel=p.createLinearGradient(0,710,0,785);heel.addColorStop(0,'#c39669');heel.addColorStop(1,'#805332');
   p.fillStyle=heel;p.beginPath();p.moveTo(696,750);p.bezierCurveTo(735,730,775,708,793,697);p.lineTo(795,738);p.quadraticCurveTo(793,746,781,752);p.lineTo(728,779);p.lineTo(696,767);p.closePath();p.fill();
   p.strokeStyle='#714b30';p.lineWidth=1.5;p.beginPath();p.moveTo(696,750);p.lineTo(696,767);p.lineTo(728,779);p.stroke();
   p.strokeStyle='#69462f';p.lineWidth=3;p.beginPath();p.moveTo(696,750);p.bezierCurveTo(735,730,775,708,793,697);p.stroke();p.restore();
  }
  // Some source paintings include a tiny skin-coloured ankle sliver inside
  // the shoe extraction. Extend the same cloth through that camera-specific
  // contact mask, over the embedded skin and under all exterior ornaments.
  // The offline mask excludes piping, soles and dyed uppers; original source
  // alpha, calf contours and every pair/platform transform stay untouched.
  if(!['ballet','slingback','bowsling'].includes(d.heel)&&parts.hosiery.width>1){p.save();p.globalCompositeOperation='source-atop';drawSocks(p,parts.hosiery,o,d.heel,true);p.restore();}
  if(d.heel==='maryjane')finishMaryJaneTab(p,d);
  if(['slingback','bowsling'].includes(d.heel)&&o.sock==='opaque'){
   p.save();p.strokeStyle='rgba(32,27,35,.55)';p.lineWidth=2;p.lineCap='round';p.beginPath();p.moveTo(690,750);p.bezierCurveTo(717,722,797,685,810,654);p.stroke();p.restore();
  }
  await drawOrnaments(p,d,parts.upper);
  return {canvas:sideCamera(out,d.heel),fallback:false,legs:parts.legs};
 }).then(result=>{if(!result.fallback){cache.set(id,result);while(cache.size>LIMIT)cache.delete(cache.keys().next().value);}return result;}).finally(()=>pending.delete(id));pending.set(id,work);return work;
}
const POSE_SETS=Object.freeze({
 flat:{heels:['flat','ballet','loafer','maryjane'],x:65,y:-20,scale:.92},
 low:{heels:['kitten','block','bowmule'],x:75,y:-24,scale:.92},
 mid:{heels:['stiletto6','pearlpump','crystalpump','studpump','slingback','bowsling','pearlheel','luciteheel'],x:85,y:-27,scale:.92},
 high:{heels:['stiletto9','platform','wedge'],x:90,y:-30,scale:.92},
 boot:{heels:['bootie'],x:80,y:-24,scale:.92},
 sandal:{heels:['crystalsandal'],x:85,y:-27,scale:.92}
});
function poseFor(heel){return Object.entries(POSE_SETS).find(([,pose])=>pose.heels.includes(heel))||['low',POSE_SETS.low];}
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
function pairedModel(source,options,extra=0,emergency=false,pose=POSE_SETS.low){
 const leg=document.createElement('canvas');leg.width=SIZE;leg.height=1324+extra;const l=leg.getContext('2d');l.imageSmoothingQuality='high';
 const left=emergency?575:547,right=emergency?755:843,extension=(emergency?300:550)+extra,frontSection=calfSection(extension);
 if(emergency){l.fillStyle=calfPaint(l);l.beginPath();l.moveTo(left+55,-300);l.bezierCurveTo(left+5,extension*.18,left+8,extension*.58,left,extension);l.lineTo(right,extension);l.bezierCurveTo(right+42,extension*.59,right+43,extension*.20,right+9,-300);l.closePath();l.fill();}else paintCalf(l,extension,frontSection);calfVolume(l,left,right,extension);
 const o=fittingOptions(options);if(LONG_HOSIERY.has(o.sock)){
  const sheath=document.createElement('canvas');sheath.width=SIZE;sheath.height=extension;const q=sheath.getContext('2d');q.drawImage(leg,0,0);q.globalCompositeOperation='source-in';q.fillStyle=hosieryColour(o);q.fillRect(0,0,SIZE,sheath.height);
  const section=frontSection;
  hosierySurface(q,sheath.height,section);hosieryTexture(q,o,sheath.height,section,250-extension);l.save();l.globalAlpha=hosieryOpacity(o);l.drawImage(sheath,0,0);l.restore();fishnetYarn(l,sheath,o,sheath.height,section,250-extension);
 }
 if(emergency)l.drawImage(source,0,300+extra);else l.drawImage(source,0,250,SIZE,SIZE-250,0,extension,SIZE,SIZE-250);
 // The side-camera toe extends left of the old near-frontal pair frame.
 // Preserve those pixels with transparent padding, removed at presentation.
 const pair=document.createElement('canvas');pair.width=1420;pair.height=1300+extra;const p=pair.getContext('2d');p.imageSmoothingQuality='high';p.translate(300,0);
 p.save();p.translate(pose.x,pose.y);p.translate(550,1160+extra);p.scale(pose.scale,pose.scale);p.translate(-550,-1160-extra);p.drawImage(leg,0,0);p.globalCompositeOperation='source-atop';p.fillStyle='#77564e23';p.fillRect(0,0,SIZE,1324+extra);p.restore();
 // The nearer calf casts a soft, contour-following contact shadow onto the
 // rear calf. Keeping that shadow inside the existing rear alpha separates
 // the two legs without a painted stripe or a dark halo in the room.
 const contact=document.createElement('canvas');contact.width=pair.width;contact.height=pair.height;const q=contact.getContext('2d');q.translate(300,0);
 q.shadowColor='#77516338';q.shadowBlur=35;q.shadowOffsetX=-8;q.drawImage(leg,-150,0);q.shadowColor='transparent';q.globalCompositeOperation='destination-out';q.drawImage(leg,-150,0);q.resetTransform();q.globalCompositeOperation='destination-in';q.drawImage(pair,0,0);p.save();p.resetTransform();p.drawImage(contact,0,0);p.restore();
 p.drawImage(leg,-150,0);return pair;
}
// Offline-reviewed outsole contacts in each immutable worn camera. A tall
// platform and a flat cannot inherit the kitten heel's floating shadow.
const CONTACTS={
 flat:[[361,969],[728,790]],ballet:[[361,969],[728,790]],maryjane:[[361,969],[728,790]],loafer:[[354,970],[728,779]],
 block:[[393,969],[736,875]],bootie:[[394,969],[735,876]],wedge:[[430,993],[705,928]],platform:[[419,999],[738,953]],
 kitten:[[373,964],[725,851]],slingback:[[373,964],[725,851]],bowsling:[[373,964],[725,851]],bowmule:[[373,964],[726,852]],
 stiletto6:[[382,964],[753,866]],stiletto9:[[370,964],[751,883]],pearlpump:[[382,964],[753,866]],crystalpump:[[382,964],[753,866]],studpump:[[382,964],[753,866]],pearlheel:[[382,964],[754,891]],luciteheel:[[382,964],[753,866]],crystalsandal:[[382,964],[747,875]]
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
 const slender=.80,{scale,floor}=geometry,extra=geometry.extra,[poseName,pose]=poseFor(d.heel),pair=pairedModel(result.canvas,o,extra,result.fallback,pose),w=pair.width*scale*slender,h=pair.height*scale,x=geometry.cx-315*scale,y=floor-(1264+extra)*scale,originalContacts=result.fallback?[[350,963],[675,963]]:CONTACTS[d.heel]||CONTACTS.kitten,shadowContacts=result.fallback?originalContacts:originalContacts.map(([cx,cy])=>{const [wide,depth,ground]=SIDE_CAMERA[d.heel]||[1.15,.93,964];return [450+(cx-450)*wide,cy+(ground-cy)*(1-depth)];});
 p.save();p.translate(x,y);p.scale(scale*slender,scale);
 p.save();p.translate(pose.x,pose.y);p.translate(550,1160+extra);p.scale(pose.scale,pose.scale);p.translate(-550,-1160-extra);p.translate(0,300+extra);soleShadow(p,shadowContacts);p.restore();
 p.translate(-150,300+extra);soleShadow(p,shadowContacts);p.restore();
 p.drawImage(pair,x-300*scale*slender,y,w,h);
 Object.assign(target.dataset,{renderer:'painted-fitting',fitting2dReady:'true',heel:d.heel,color:d.color,material:d.material,fallback:String(result.fallback),legFrame:'0,0,1024,1024',feet:'2',sock:o.sock,sockColor:o.color,footAnchors:`back:${pose.x},${pose.y},${pose.scale},0;front:-150,0,1;slender:.80`,pairPose:poseName,pairLayout:JSON.stringify({scale,x,y,extra,slender,rear:[pose.x,pose.y,0,pose.scale],front:[-150,0],floor}),platformLayout:JSON.stringify(geometry),platformCount:'0',platformBaked:'true',fixedFraming:geometry.composition.join('x'),shadowContacts:JSON.stringify(shadowContacts),legContinuation:'opaque-past-frame',skinFinish:'soft-youthful'});return true;
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
A.Fitting2D={mount,render,composite,sideCameraPixels,frame:Object.freeze({width:SIZE,height:SIZE}),info:()=>({cacheEntries:cache.size,cacheLimit:LIMIT,loadedHeels:[...sources.keys()],pendingComposites:pending.size})};
})(globalThis.SweetShoe=globalThis.SweetShoe||{});
