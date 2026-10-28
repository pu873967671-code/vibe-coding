'use strict';
(function(A){
// These worn paintings have a shorter, rounder last than their display
// cameras. Project only the distal toe of their existing paint and semantic
// masks. The ankle, collar mounts, heel, sole contact height and calf stay in
// their original camera. This is deliberately independent of the pair pose.
const SIZE=1024,TOE_END=410;
const TOE={
 block:{amount:90,centre:938,radius:65,depth:.94},kitten:{amount:76,centre:938,radius:65,depth:.94},
 wedge:{amount:58,centre:939,radius:75,depth:.94,floor:990},bootie:{amount:62,centre:938,radius:65,depth:.96},
 stiletto6:{amount:66,centre:933,radius:65},stiletto9:{amount:66,centre:933,radius:65},
 pearlpump:{amount:66,centre:933,radius:65},crystalpump:{amount:66,centre:933,radius:65},
 studpump:{amount:66,centre:933,radius:65},pearlheel:{amount:66,centre:933,radius:65},
 luciteheel:{amount:66,centre:933,radius:65},slingback:{amount:66,centre:933,radius:65},
 bowsling:{amount:66,centre:933,radius:65},bowmule:{amount:66,centre:933,radius:65}
};
const COLLAR={
 bootie:[[516,413],[540,417],[580,422],[620,423],[660,422],[690,418],[714,410],[724,404]],
 flat:[[300,812],[340,840],[380,854],[420,863],[460,866],[500,863],[540,848],[580,814],[620,759],[660,696],[700,632],[740,520]],
 block:[[300,813],[340,836],[380,849],[420,858],[460,860],[500,855],[540,834],[580,787],[620,725],[660,660],[700,593],[735,512]],
 kitten:[[300,811],[340,824],[380,840],[420,850],[460,855],[500,854],[540,840],[580,808],[620,756],[660,691],[700,616],[736,528]],
 wedge:[[300,814],[340,820],[380,834],[420,845],[460,852],[500,852],[540,839],[580,802],[620,737],[660,660],[700,570],[735,500]],
 stiletto6:[[320,804],[340,810],[380,834],[420,848],[460,857],[500,860],[540,854],[580,832],[620,765],[660,670],[700,580],[740,485]],
 stiletto9:[[320,804],[340,812],[380,835],[420,849],[460,857],[500,860],[540,855],[580,835],[620,752],[660,652],[700,561],[740,461]]
};
function canvas(){const c=document.createElement('canvas');c.width=SIZE;c.height=SIZE;return c;}
function smooth(v){v=Math.max(0,Math.min(1,v));return v*v*(3-2*v);}
function collarMask(source,heel){
 // Ballet masks already separate the binding from every sewn satin turn.
 // A generic pump collar cut passes through those turns as grey rectangles.
 if(heel==='ballet')return source;
 const family=COLLAR[heel]?heel:A.SHOE_STYLES?.[heel]?.accessoryBase,points=COLLAR[family];
 if(!source||!points||['loafer','slingback','bowsling','bowmule','crystalsandal'].includes(heel))return source;
 const out=canvas(),p=out.getContext('2d');p.drawImage(source,0,0);p.save();
 // Ballet's ankle turns and near knot sit in front of the collar. The
 // inherited pump piping must never punch a grey fastening through them.
 if(heel==='ballet'){p.beginPath();p.rect(0,705,SIZE,SIZE-705);p.clip();}
 p.globalCompositeOperation='destination-out';p.lineWidth=10.5;p.lineCap='round';p.lineJoin='round';p.strokeStyle='#fff';p.beginPath();p.moveTo(...points[0]);
 for(let i=0;i<points.length-1;i++){
  const a=points[Math.max(0,i-1)],b=points[i],c=points[i+1],d=points[Math.min(points.length-1,i+2)];
  p.bezierCurveTo(b[0]+(c[0]-a[0])/6,b[1]+(c[1]-a[1])/6,c[0]-(d[0]-b[0])/6,c[1]-(d[1]-b[1])/6,...c);
 }
 p.stroke();p.restore();
 if(heel==='ballet'){
  // The sewn ribbons lie above the cream collar. Cutting their dye with
  // the pump's continuous collar path exposed grey rectangular gaps at
  // both arch crossings. Restore only those two local ribbon mounts.
  p.save();p.globalCompositeOperation='source-over';p.beginPath();
  p.moveTo(285,823);p.lineTo(343,776);p.lineTo(354,773);p.lineTo(345,798);p.lineTo(291,839);p.closePath();
  p.moveTo(530,779);p.lineTo(617,807);p.lineTo(597,840);p.lineTo(525,809);p.closePath();
  p.clip();p.drawImage(source,0,0);p.restore();
 }
 return out;
}
function toeShift(heel,y){
 const t=TOE[heel];if(!t)return 0;
 const distance=(y-t.centre)/t.radius;
 // A compact smooth lobe lengthens the point, then returns to the original
 // floor before its existing front contact. No vertical shoe movement.
 const envelope=Math.max(0,1-distance*distance);
 return -t.amount*envelope*envelope*smooth((966-y)/28);
}
function toe(source,heel){
 if(!source||!TOE[heel])return source;
 const out=canvas(),p=out.getContext('2d');p.imageSmoothingEnabled=true;p.imageSmoothingQuality='high';
 p.drawImage(source,0,0);
 // Each one-pixel row owns its pixels once. An affine horizontal stretch
 // ends exactly at TOE_END; adjacent rows share an unbroken smooth outline.
 // Keeping the untouched right-hand source avoids any calf/heel resampling.
 const start=848,end=966;p.clearRect(0,start,TOE_END,end-start);
 for(let y=start;y<end;y++){
  const shift=toeShift(heel,y+.5);
  // Clip destination coverage, sample the complete painting so bilinear
  // filtering can see neighbouring source rows instead of clamping strips.
  p.save();p.beginPath();p.rect(0,y,TOE_END,1);p.clip();
  p.setTransform((TOE_END-shift)/TOE_END,0,0,1,shift,0);p.drawImage(source,0,0);p.restore();
 }
 const depth=TOE[heel].depth;if(!depth)return out;
 // The product last is low through its distal vamp. Extending width alone
 // left a tall almond bulb at the worn tip; compress that same painted cloth
 // toward the existing sole contact, fading continuously before the instep.
 // Paint, finish masks and sole occlusion receive the identical projection.
 const flat=canvas(),q=flat.getContext('2d'),floor=TOE[heel].floor||966,top=600;
 q.imageSmoothingEnabled=true;q.imageSmoothingQuality='high';q.drawImage(out,0,0);
 q.clearRect(0,top,TOE_END,floor-top);
 for(let x=0;x<TOE_END;x++){
  const scale=depth+(1-depth)*smooth((x-115)/(TOE_END-115));
  q.save();q.beginPath();q.rect(x,top,1,floor-top);q.clip();
  q.setTransform(1,0,0,scale,0,floor*(1-scale));q.drawImage(out,0,0);q.restore();
 }
 return flat;
}
// Raise only the forefoot woven seam. Its toe support has two visible rope
// courses like the product, while the original tall heel and outsole stay put.
function ropePath(p){
 p.beginPath();p.moveTo(175,915);p.bezierCurveTo(260,929,408,939,499,916);
 p.bezierCurveTo(526,909,550,892,570,870);p.lineTo(577,960);
 p.lineTo(480,1000);p.lineTo(150,1000);p.closePath();
}
function wedgeRope(source,part){
 if(!source)return source;
 const out=canvas(),p=out.getContext('2d');p.imageSmoothingEnabled=true;p.imageSmoothingQuality='high';p.drawImage(source,0,0);
 if(part==='shoe'){
  // Reuse the authored rope relief, retaining its warm natural colour.
  const woven=canvas(),w=woven.getContext('2d');w.imageSmoothingEnabled=true;w.imageSmoothingQuality='high';
  w.save();ropePath(w);w.clip();w.drawImage(source,0,-22);w.restore();
  w.globalCompositeOperation='destination-in';w.drawImage(source,0,0);
  const fade=w.createLinearGradient(465,0,580,0);fade.addColorStop(0,'#fff');fade.addColorStop(1,'#ffffff00');w.fillStyle=fade;w.fillRect(0,0,SIZE,SIZE);
  p.drawImage(woven,0,0);
 }else if(['upper','shadow','highlight'].includes(part)){
  const fade=p.createLinearGradient(465,0,580,0);fade.addColorStop(0,'#fff');fade.addColorStop(1,'#ffffff00');
  p.globalCompositeOperation='destination-out';p.fillStyle=fade;ropePath(p);p.fill();
 }
 return out;
}
// Lower only the rear cloth counter. The rope seam remains the pivot, and
// the same transform on occlusion reveals the retained skin beneath it.
function wedgeCounter(source){
 if(!source)return source;
 const out=canvas(),p=out.getContext('2d'),pivot=660,top=350;
 p.imageSmoothingEnabled=true;p.imageSmoothingQuality='high';p.drawImage(source,0,0);
 p.clearRect(600,top,SIZE-600,pivot-top);
 for(let x=600;x<SIZE;x++){
  const scale=1-.18*smooth((x-600)/150);
  p.save();p.beginPath();p.rect(x,top,1,pivot-top);p.clip();
  p.setTransform(1,0,0,scale,0,pivot*(1-scale));p.drawImage(source,0,0);p.restore();
 }
 return out;
}
// Smooth the low-flat counter's bulb without touching the fitted calf. The
// same antialiased outline cuts every semantic layer, so dye stays registered.
function flatCounter(source,part,heel){
 if(!source)return source;
 const out=canvas(),p=out.getContext('2d');p.imageSmoothingEnabled=true;p.imageSmoothingQuality='high';
 if(part==='shoe'&&heel!=='flat'){
  const wood=p.createLinearGradient(690,762,790,798);wood.addColorStop(0,'#be9470');wood.addColorStop(.55,'#a77d58');wood.addColorStop(1,'#846044');
  p.fillStyle=wood;p.beginPath();p.moveTo(684,773);p.bezierCurveTo(716,770,761,754,793,743);
  p.lineTo(790,769);p.bezierCurveTo(769,780,736,794,714,801);p.lineTo(685,790);p.closePath();p.fill();
  p.strokeStyle='#cba17c';p.lineWidth=1.7;p.beginPath();p.moveTo(697,787);p.bezierCurveTo(727,787,767,769,788,763);p.stroke();
 }
 p.save();p.beginPath();p.moveTo(0,0);p.lineTo(SIZE,0);p.lineTo(SIZE,490);p.lineTo(725,490);
 p.bezierCurveTo(746,531,776,599,782,649);p.bezierCurveTo(786,687,790,716,793,742);
 p.lineTo(SIZE,790);p.lineTo(SIZE,SIZE);p.lineTo(0,SIZE);p.closePath();
 // The ballet ankle knot and both tails extend beyond the shoe counter.
 // Keep their complete native extent; only the lower heel needs this trim.
 if(heel==='ballet')p.rect(0,0,SIZE,705);
 p.clip();p.drawImage(source,0,0);p.restore();
 return out;
}
function loaferHeel(source,upper){
 if(!source)return source;
 const out=canvas(),p=out.getContext('2d');p.drawImage(source,0,0);
 const wood=canvas(),w=wood.getContext('2d');
 // The worn source painted an ivory heel insert, while the display has one
 // continuous warm stacked sole. Retain its authored relief and outside alpha.
 w.fillStyle='#89633f';w.globalAlpha=.84;w.beginPath();w.moveTo(694,767);
 w.bezierCurveTo(731,744,779,718,795,692);w.lineTo(804,692);w.lineTo(804,750);
 w.bezierCurveTo(786,763,756,777,728,779);w.closePath();w.fill();
 // Keep the selected upper, its piping and their soft boundaries untouched.
 if(upper){w.globalCompositeOperation='destination-out';w.drawImage(upper,0,0);}
 p.globalCompositeOperation='source-atop';p.drawImage(wood,0,0);return out;
}
// Lacing follows the existing low-cut pump upper. Raising a new throat to
// meet ankle-mounted ribbons turned the fitted kitten into an ankle boot.
// The accessory camera now places all three eyelet pairs on this original
// cloth, so the retained neckline and its skin/hosiery boundary stay intact.
function lacedVamp(parts){return parts;}
// Lower the front of the studded pump's topline while keeping the original
// painted binding and each integral stud attached to the cloth. The shoe is
// compressed toward its unchanged sole, while the underlying foot extends
// into the new opening; both use the same smooth, tapered local displacement.
function lowerStudThroat(parts){
 const collar=x=>{
  const points=COLLAR.stiletto6;
  for(let i=0;i<points.length-1;i++)if(x>=points[i][0]&&x<=points[i+1][0]){
   const a=points[i],b=points[i+1],t=(x-a[0])/(b[0]-a[0]);return a[1]+(b[1]-a[1])*t;
  }
  return 804;
 };
 function warp(source,binding=false){
  if(!source)return source;
  if(binding){
   const painted=canvas(),b=painted.getContext('2d');b.drawImage(source,0,0);
   // A narrow ivory rolled edge belongs to the shoe, under the metal studs.
   // The dye mask already leaves this seam clear in both camera renderers.
   b.globalCompositeOperation='source-atop';b.strokeStyle='#f8e9d4';b.lineWidth=8;b.lineCap='round';b.lineJoin='round';b.beginPath();
   const points=[...COLLAR.stiletto6,[760,418]];b.moveTo(...points[0]);
   for(let i=0;i<points.length-1;i++){
    const a=points[Math.max(0,i-1)],v=points[i],c=points[i+1],d=points[Math.min(points.length-1,i+2)];
    b.bezierCurveTo(v[0]+(c[0]-a[0])/6,v[1]+(c[1]-a[1])/6,c[0]-(d[0]-v[0])/6,c[1]-(d[1]-v[1])/6,...c);
   }
   b.stroke();
   source=painted;
  }
  const out=canvas(),p=out.getContext('2d');p.imageSmoothingEnabled=true;p.imageSmoothingQuality='high';p.drawImage(source,0,0);
  const top=700,bottom=964,left=320,right=610;
  p.clearRect(left,top,right-left,bottom-top);
  for(let x=left;x<right;x++){
   const drop=37*smooth((x-left)/65)*smooth((right-x)/95),edge=collar(x);
   const scale=1-drop/(bottom-edge),pivot=bottom;
   p.save();p.beginPath();p.rect(x,top,1,bottom-top);p.clip();
   p.setTransform(1,0,0,scale,0,pivot*(1-scale));p.drawImage(source,0,0);p.restore();
  }
  return out;
 }
 const leg=canvas(),l=leg.getContext('2d');l.drawImage(parts.legs,0,0);
 const cut=canvas(),c=cut.getContext('2d');c.drawImage(parts.occlusion,0,0);
 for(let x=320;x<610;x++){
  const drop=37*smooth((x-320)/65)*smooth((610-x)/95),edge=collar(x);
  // Sample just inside the existing skin so its painted colour continues
  // across the newly exposed sliver, without altering the ankle outline.
  l.drawImage(parts.legs,x,edge-12,1,1,x,edge-12,1,drop+15);
  c.clearRect(x,edge-20,1,drop+23);
 }
 const result={...parts,legs:leg,occlusion:cut};
 for(const key of ['shoe','upper','shadow','highlight'])result[key]=warp(parts[key],key==='shoe');
 return result;
}
function balletSeat(source){
 const out=canvas(),p=out.getContext('2d');p.drawImage(source,0,0);
 // A restrained contact shade seats the foot below the enclosing vamp.
 // It belongs to the skin, so opaque hosiery naturally covers it later.
 p.globalCompositeOperation='source-atop';p.lineCap='round';p.lineJoin='round';
 p.strokeStyle='#9c676019';p.lineWidth=13;p.shadowColor='#a86f641c';p.shadowBlur=8;
 p.beginPath();p.moveTo(305,815);p.bezierCurveTo(390,876,509,892,580,818);p.stroke();
 return out;
}
function prepare(heel,parts){
 if(!parts.shoe||!parts.upper)return parts;
 if(heel==='loafer')return {...parts,shoe:loaferHeel(parts.shoe,parts.upper)};
 if(['flat','ballet','maryjane'].includes(heel)){
  const result={...parts};for(const key of ['shoe','upper','shadow','highlight','occlusion'])result[key]=flatCounter(key==='upper'?collarMask(parts[key],heel):parts[key],key,heel);
  if(heel==='ballet')result.legs=balletSeat(parts.legs);
  return result;
 }
 if(!TOE[heel])return {...parts,upper:collarMask(parts.upper,heel)};
 const result={...parts};
 for(const key of ['shoe','upper','shadow','highlight','occlusion']){
  let source=parts[key];
  if(key==='upper')source=collarMask(source,heel);
  if(heel==='wedge')source=wedgeCounter(wedgeRope(source,key));
  result[key]=toe(source,heel);
 }
 return heel==='studpump'?lowerStudThroat(result):result;
}
// The pearl orb is a round solid object, not part of the flattened shoe last.
// Its isolated transparent source region lets us restore the retained painted
// sphere after the side camera without touching the upper, skin or calf.
const SEWN_PEARLS=[[214,916,9],[240,876,8],[276,856,11],[288,916,14],[328,832,8],[332,884,9],[380,926,9],[392,870,12],[438,912,14],[482,880,14],[500,928,8],[540,870,8],[558,902,10],[592,840,9],[666,722,8],[686,670,12],[716,616,9],[744,580,14],[742,644,9],[762,520,10],[780,476,9],[808,542,11],[792,590,8]];
function sewnPearls(projected,original,projectPoint){
 const p=projected.getContext('2d');p.save();p.resetTransform();p.imageSmoothingEnabled=true;p.imageSmoothingQuality='high';
 for(const [x,y,r] of SEWN_PEARLS){
  const shift=x<TOE_END&&y>=848&&y<966?toeShift('pearlpump',y):0,stretch=(TOE_END-shift)/TOE_END;
  const sx=x<TOE_END?x*stretch+shift:x,rx=(r+1)*stretch,ry=r+1,centre=projectPoint(sx,y),edge=projectPoint(sx+rx,y),radius=edge[0]-centre[0];
  // A circular crop encloses the old flattened bead. Restore its local
  // vertical volume using the same retained pearl paint and contact shade.
  p.save();p.beginPath();p.ellipse(centre[0],centre[1],radius,radius,0,0,Math.PI*2);p.clip();
  p.drawImage(original,sx-rx,y-ry,2*rx,2*ry,centre[0]-radius,centre[1]-radius,2*radius,2*radius);p.restore();
 }
 p.restore();return projected;
}
function postProjection(projected,original,heel,projectPoint){
 if(heel==='pearlpump'&&projectPoint)return sewnPearls(projected,original,projectPoint);
 if(heel!=='pearlheel'||!projectPoint)return projected;
 const p=projected.getContext('2d'),left=700,top=737,right=810,bottom=871;
 const a=projectPoint(left,top),b=projectPoint(right,top),c=projectPoint(left,bottom);
 const scale=(c[1]-a[1])/(bottom-top)*1.18,centre=projectPoint(754,top)[0];
 p.save();p.resetTransform();p.imageSmoothingEnabled=true;p.imageSmoothingQuality='high';
 // Below the gold neck this rectangle contains only the orb and its lift;
 // clearing the original oval cannot erase the arch or the foot silhouette.
 p.clearRect(a[0]-2,a[1],b[0]-a[0]+4,c[1]-a[1]+2);
 p.drawImage(original,left,top,right-left,bottom-top,centre-(754-left)*scale,a[1],(right-left)*scale,(bottom-top)*scale);
 p.restore();return projected;
}
A.WornBodyFidelity={prepare,lacedVamp,toeShift,postProjection,styles:[...Object.keys(TOE),'loafer']};
})(globalThis.SweetShoe);
