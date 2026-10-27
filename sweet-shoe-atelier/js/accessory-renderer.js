'use strict';
(function(A){
// Original code-native jewellery, authored in each immutable source camera.
// Every control point belongs to the shoe/foot, never to the viewport.
const OPTIONS={strap:['cross','pearl','pearltrim','studs','heartbuckle','anklet','crystalband','satinbraid'],decoration:['puffy','doublebow','heelcrystal','rosette','camellia','heelbow'],charm:['oval','heart','spray','toeglitter','butterfly','pearlcluster']};
const PALETTE={pink:'#ffadc9',cream:'#fff0d2',blue:'#a9daff',green:'#c6e7a5',purple:'#d6b9ff',peach:'#ffc09e',rose:'#f478a4',black:'#696883'};
// Far mounts sit four source pixels inside the painted collar silhouette;
// near mounts are sewn into the outer upper, below its rolled binding. Newer
// high-arch kits have no far-binding mask, so their opaque collar edge is the
// reference. Never substitute a footbed point for the far contact.
const PRODUCT={
 flat:{bridge:[525,296,575,125,680,400],toe:[304,438],rear:[860,290],vamp:[355,419]},
 kitten:{bridge:[525,276,575,75,680,376],toe:[300,450],rear:[861,195],vamp:[359,433]},
 block:{bridge:[525,274,575,73,680,383],toe:[300,449],rear:[861,195],vamp:[359,432]},
 wedge:{bridge:[525,259,575,68,680,345],toe:[299,430],rear:[860,188],vamp:[359,413]},
 stiletto6:{bridge:[525,307,575,111,680,384],toe:[300,466],rear:[861,205],vamp:[359,450]},
 stiletto9:{bridge:[525,339,575,163,680,381],toe:[300,471],rear:[861,195],vamp:[359,454]},
 platform:{bridge:[525,242,575,29,680,321],toe:[302,430],rear:[860,180],vamp:[359,414]}
};
const WORN={flat:{bridge:[418,686,495,684,626,790],toe:[344,884],rear:[761,560],vamp:[398,857]},kitten:{bridge:[425,637,513,635,628,742],toe:[335,882],rear:[759,545],vamp:[389,853]},block:{bridge:[425,637,513,635,628,742],toe:[335,882],rear:[759,545],vamp:[389,853]},wedge:{bridge:[424,635,512,634,629,742],toe:[337,873],rear:[761,530],vamp:[391,846]},stiletto6:{bridge:[425,622,513,620,628,731],toe:[335,882],rear:[773,485],vamp:[389,852]},stiletto9:{bridge:[425,622,513,620,628,731],toe:[335,882],rear:[765,485],vamp:[389,852]},platform:{bridge:[425,623,513,622,628,733],toe:[335,869],rear:[762,523],vamp:[390,838]},bootie:{bridge:[425,637,513,635,628,742],toe:[335,882],rear:[759,545],vamp:[389,853]}};
const PRODUCT_CHAIN={flat:[760,350,830,373,883,265],kitten:[760,292,830,307,893,229],block:[760,292,830,307,893,229],wedge:[760,264,830,278,894,214],stiletto6:[760,286,825,270,884,181],stiletto9:[760,278,825,260,884,176],platform:[760,262,830,290,895,198]};
const WORN_ANKLE={flat:[466,561,585,619,728,558],kitten:[482,512,606,574,734,510],block:[482,512,606,574,734,510],wedge:[482,510,595,566,714,510],platform:[481,498,617,555,770,501],stiletto6:[483,497,604,555,727,499],stiletto9:[471,497,592,555,718,499]};
// Both views share three eyelet pairs, two alternating crossings and one side
// bow. Coordinates are authored per source camera; metal never enters dye.
function handles(category,value,camera){return !!OPTIONS[category]?.includes(value);}
const PRODUCT_LACE={
 flat:{rows:[[[391,343],[545,471]],[[353,354],[479,495]],[[317,371],[419,488]]],knot:[620,400]},
 kitten:{rows:[[[394,350],[549,487]],[[356,365],[482,510]],[[320,385],[421,503]]],knot:[623,412]},
 block:{rows:[[[394,352],[549,489]],[[356,367],[482,512]],[[320,387],[421,505]]],knot:[623,414]},
 wedge:{rows:[[[394,334],[549,469]],[[356,349],[482,492]],[[320,369],[421,485]]],knot:[623,395]},
 stiletto6:{rows:[[[394,368],[549,503]],[[356,383],[482,526]],[[320,403],[421,519]]],knot:[623,429]},
 stiletto9:{rows:[[[394,373],[549,508]],[[356,388],[482,531]],[[320,408],[421,524]]],knot:[623,434]},
 platform:{rows:[[[394,330],[549,464]],[[356,345],[482,487]],[[320,365],[421,480]]],knot:[623,390]}
};
const WORN_LACE={
 // A compact, upright field uses the full toe-box depth, rather than
 // stretching the crossings sideways along the throat. Both rows remain
 // sewn into the original low vamp; no cloth is raised over bare instep.
 flat:{rows:[[[312,832],[427,940]],[[274,845],[366,942]],[[240,875],[309,934]]],knot:[496,860]},
 kitten:{rows:[[[312,822],[427,938]],[[274,836],[366,940]],[[240,870],[309,930]]],knot:[496,858]},
 block:{rows:[[[312,830],[429,943]],[[274,840],[368,946]],[[240,875],[311,936]]],knot:[498,862]},
 wedge:{rows:[[[312,818],[425,915]],[[274,838],[365,917]],[[240,869],[309,913]]],knot:[494,840]},
 stiletto6:{rows:[[[328,819],[443,946]],[[286,836],[380,947]],[[248,869],[323,937]]],knot:[512,866]},
 stiletto9:{rows:[[[328,820],[443,944]],[[286,835],[380,946]],[[248,869],[323,936]]],knot:[512,864]},
 platform:{rows:[[[320,804],[435,965]],[[280,820],[376,968]],[[240,848],[317,958]]],knot:[504,878]}
};
function laceCamera(d,camera='worn'){
 const set=camera==='product'?PRODUCT_LACE:WORN_LACE;
 return set[d.heel]||set[A.SHOE_STYLES?.[d.heel]?.accessoryBase]||set.flat;
}
function laceEyelet(p,x,y,camera,rimOnly=false){
 p.save();p.translate(x,y);p.rotate(camera==='product'?.8:-.65);
 // Metal needs its broad lit rim to survive the worn camera's foreshortening.
 // Keep it near the display ring size; satin has a separate textile scale.
 if(camera==='worn')p.scale(.96,.96);
 if(!rimOnly){
  p.shadowColor='#63493566';p.shadowBlur=2.6;p.shadowOffsetY=1.8;
  const gold=p.createLinearGradient(-12,-9,11,10);gold.addColorStop(0,'#fff8d5');gold.addColorStop(.3,'#dfbf7d');gold.addColorStop(.64,'#a67a43');gold.addColorStop(1,'#fce6ad');
  p.fillStyle=gold;p.beginPath();p.ellipse(0,0,12.5,9.5,0,0,Math.PI*2);p.fill();p.shadowColor='transparent';
  p.strokeStyle='#8d643a';p.lineWidth=1;p.stroke();p.fillStyle='#6d5156';p.beginPath();p.ellipse(0,0,7.5,5.5,0,0,Math.PI*2);p.fill();
 }else{
  // The front lip passes over the inserted satin. Its unbroken highlight
  // makes the ribbon read as threaded through a ring, rather than pasted on.
  p.strokeStyle='#d3ad67';p.lineWidth=2.8;p.beginPath();p.ellipse(0,0,11.2,8.3,0,.08,Math.PI-.08);p.stroke();
  p.strokeStyle='#fff1bb';p.lineWidth=1.4;p.beginPath();p.ellipse(-.4,-.5,11.3,8.1,0,Math.PI,Math.PI*1.83);p.stroke();
 }
 p.restore();
}
function laceRibbonPoints(from,to,width=21,camera='worn',wrap=false){
 const dx=to[0]-from[0],dy=to[1]-from[1],lift=camera==='product'?12:wrap?16:12;
 const points=[];
 for(let i=0;i<=48;i++){
  const t=i/48,u=1-t,x=u*u*u*from[0]+3*u*u*t*(from[0]+dx*.32)+3*u*t*t*(to[0]-dx*.28)+t*t*t*to[0],y=u*u*u*from[1]+3*u*u*t*(from[1]+dy*.32-lift)+3*u*t*t*(to[1]-dy*.28-lift*.7)+t*t*t*to[1];
  const tx=3*u*u*dx*.32+6*u*t*dx*.40+3*t*t*dx*.28,ty=3*u*u*(dy*.32-lift)+6*u*t*(dy*.40+lift*.3)+3*t*t*(dy*.28+lift*.7),length=Math.hypot(tx,ty)||1;
  // The satin keeps a broad face and folds narrowly through each hole.
  // Far-side satin turns almost edge-on as it rounds behind the foot.
  // The broad face opens over the instep, then folds into the near eyelet.
  const face=wrap?(.16+.84*Math.pow(Math.sin(Math.min(1,t*1.28)*Math.PI*.5),.65))*(1-.42*Math.pow(t,12)):(.55+.45*Math.pow(Math.sin(t*Math.PI),.45));
  points.push({x,y,nx:-ty/length,ny:tx/length,w:width*face*.5});
 }
 return points;
}
function laceRibbon(p,from,to,colour,width=21,camera='worn',wrap=false,crossing=false){
 const points=laceRibbonPoints(from,to,width,camera,wrap);
 const outline=()=>{p.beginPath();points.forEach((a,i)=>i?p.lineTo(a.x+a.nx*a.w,a.y+a.ny*a.w):p.moveTo(a.x+a.nx*a.w,a.y+a.ny*a.w));[...points].reverse().forEach(a=>p.lineTo(a.x-a.nx*a.w,a.y-a.ny*a.w));p.closePath();};
 p.save();p.lineJoin='round';
 if(wrap){
  // A shallow pressed edge follows the loaded ribbon. This is confined to
  // the contact itself, with no tendon/bone modelling or foot-contour edit.
  // The full ornament is subsequently clipped by the actual foot silhouette.
  for(const side of [-1,1]){
   p.beginPath();points.forEach((a,i)=>{const x=a.x+side*a.nx*(a.w+.75),y=a.y+side*a.ny*(a.w+.75);i?p.lineTo(x,y):p.moveTo(x,y);});
   p.strokeStyle=side<0?'#fff9ef55':'#805b6340';p.lineWidth=1.2;p.stroke();
  }
 }
 p.shadowColor=crossing?'#674253b8':wrap?'#774d4d8a':'#6e42594a';p.shadowBlur=crossing?2.6:wrap?1.8:3;p.shadowOffsetY=crossing?2.3:wrap?1.5:2.5;
 const mid=points[24],g=p.createLinearGradient(mid.x-mid.nx*width*.5,mid.y-mid.ny*width*.5,mid.x+mid.nx*width*.5,mid.y+mid.ny*width*.5);
 g.addColorStop(0,silkTone(colour,-.18));g.addColorStop(.12,silkTone(colour,-.02));g.addColorStop(.24,silkTone(colour,.10));g.addColorStop(.72,silkTone(colour,.12));g.addColorStop(.88,silkTone(colour,-.02));g.addColorStop(1,silkTone(colour,-.18));
 outline();p.fillStyle=g;p.fill();p.shadowColor='transparent';p.strokeStyle=silkTone(colour,-.28);p.lineWidth=.8;p.stroke();
 // A narrow sewn sheen follows a single folded edge, leaving a broad flat
 // satin face. Tapered ends disappear through the metal eyelet openings.
 p.strokeStyle=silkTone(colour,.48);p.lineWidth=.9;p.globalAlpha=.60;p.beginPath();points.forEach((a,i)=>i?p.lineTo(a.x-a.nx*a.w*.70,a.y-a.ny*a.w*.70):p.moveTo(a.x-a.nx*a.w*.70,a.y-a.ny*a.w*.70));p.stroke();p.restore();
}
function laceBow(p,x,y,colour,camera){
 p.save();p.translate(x,y);p.rotate(camera==='product'?-.2:-.15);p.scale(camera==='product'?1:.94,camera==='product'?.85:.88*.94);
 p.shadowColor='#68445355';p.shadowBlur=3;p.shadowOffsetY=2;
 const satin=p.createLinearGradient(-15,-20,18,28);satin.addColorStop(0,silkTone(colour,.30));satin.addColorStop(.28,colour);satin.addColorStop(.50,silkTone(colour,.24));satin.addColorStop(.70,colour);satin.addColorStop(1,silkTone(colour,-.28));
 p.fillStyle=satin;p.strokeStyle=silkTone(colour,-.25);p.lineWidth=1;
 for(const side of [-1,1]){
  p.save();p.scale(side*(side<0?.84:1),side<0?.86:1);
  // Narrow folded tails have a notched satin edge and remain attached.
  p.beginPath();p.moveTo(0,4);p.bezierCurveTo(7,15,13,31,24,45);p.lineTo(25,31);p.lineTo(36,34);p.bezierCurveTo(22,21,15,11,7,1);p.closePath();p.fill();p.stroke();
  p.beginPath();p.moveTo(2,-3);p.bezierCurveTo(20,-22,45,-23,40,-5);p.bezierCurveTo(39,16,17,17,2,5);p.closePath();p.fill();p.stroke();
  p.shadowColor='transparent';p.fillStyle=silkTone(colour,-.25);p.beginPath();p.moveTo(4,1);p.bezierCurveTo(16,-5,30,-9,35,-7);p.bezierCurveTo(31,2,16,6,4,5);p.closePath();p.fill();
  p.strokeStyle=silkTone(colour,.48);p.lineWidth=1.5;p.beginPath();p.moveTo(12,-7);p.quadraticCurveTo(26,-17,35,-12);p.stroke();p.fillStyle=satin;p.restore();
 }
 p.shadowColor='transparent';p.fillStyle=satin;p.beginPath();p.roundRect(-7,-10,14,21,4);p.fill();p.strokeStyle=silkTone(colour,-.30);p.lineWidth=1;p.stroke();p.strokeStyle=silkTone(colour,.48);p.beginPath();p.moveTo(-3,-7);p.quadraticCurveTo(-5,0,-2,7);p.stroke();p.restore();
}
function laceStrands(d,camera){
 const {rows,knot}=laceCamera(d,camera),product=camera==='product',tie=product?knot:[knot[0]+15,knot[1]-6];
 // Each visible end threads through its own vamp eyelet. The low-cut upper
 // clips the satin at the cloth boundary without an ankle-mounted free end.
 const far=point=>point;
 const strands=[];
 for(let i=0;i<2;i++){
  const pairs=[[far(rows[i][0]),rows[i+1][1]],[far(rows[i+1][0]),rows[i][1]]];
  if(i%2)pairs.reverse();
  pairs.forEach(([from,to])=>strands.push({from,to,width:23*(product?1:.88),hidden:!product,over:i%2}));
 }
 strands.push({from:far(rows[0][0]),to:product?tie:rows[0][1],width:18*(product?1:.88),hidden:!product,tie:true});
 strands.push({from:rows[0][1],to:tie,width:17*(product?1:.88),hidden:false});
 return {strands,tie};
}
function laceCrossing(first,second,camera){
 const a=laceRibbonPoints(first.from,first.to,first.width,camera,first.hidden),b=laceRibbonPoints(second.from,second.to,second.width,camera,second.hidden);
 for(let i=1;i<a.length;i++)for(let j=1;j<b.length;j++){
  const p=a[i-1],q=a[i],r=b[j-1],s=b[j],dx=q.x-p.x,dy=q.y-p.y,ex=s.x-r.x,ey=s.y-r.y,den=dx*ey-dy*ex;if(Math.abs(den)<1e-8)continue;
  const u=((r.x-p.x)*ey-(r.y-p.y)*ex)/den,v=((r.x-p.x)*dy-(r.y-p.y)*dx)/den;
  if(u>0&&u<1&&v>0&&v<1)return [p.x+u*dx,p.y+u*dy];
 }
 return null;
}
function crossLaces(p,d,colour,camera,silhouette){
 const {rows}=laceCamera(d,camera),product=camera==='product',rings=rows.flat(),{strands,tie}=laceStrands(d,camera);
 // Clip the wrapped satin to the retained shoe upper. Both eyelet rows are
 // visible on its low vamp; cloth cannot cross the exposed foot or hosiery.
 let mask,layer,q;
 if(!product&&silhouette){mask=document.createElement('canvas');mask.width=p.canvas.width;mask.height=p.canvas.height;mask.getContext('2d').drawImage(silhouette,0,0);layer=document.createElement('canvas');layer.width=p.canvas.width;layer.height=p.canvas.height;q=layer.getContext('2d');}
 rings.forEach(point=>laceEyelet(p,...point,camera));

 for(const strand of strands){
  if(mask&&strand.hidden){
   q.globalCompositeOperation='source-over';q.clearRect(0,0,layer.width,layer.height);
   laceRibbon(q,strand.from,strand.to,colour,strand.width,camera,true);
   q.globalCompositeOperation='destination-in';q.drawImage(mask,0,0);p.drawImage(layer,0,0);
  }else laceRibbon(p,strand.from,strand.to,colour,strand.width,camera,strand.hidden);
 }
 if(!product&&mask){
  // Lift only the short upper pass at each X. Its close shadow falls onto
  // the lower satin face, while the alternating upper direction remains
  // continuous; whole-strand painting alone read as parallel flat stripes.
  for(const index of [0,2]){
   const over=strands[index+1],at=laceCrossing(strands[index],over,camera);if(!at)continue;
   q.globalCompositeOperation='source-over';q.clearRect(0,0,layer.width,layer.height);q.save();q.beginPath();q.ellipse(at[0],at[1],over.width*1.5,over.width*1.5,0,0,Math.PI*2);q.clip();
   laceRibbon(q,over.from,over.to,colour,over.width,camera,over.hidden,true);q.restore();q.globalCompositeOperation='destination-in';q.drawImage(mask,0,0);p.drawImage(layer,0,0);
  }
 }
 rings.forEach(point=>laceEyelet(p,...point,camera,true));
 laceBow(p,...tie,colour,camera);
}

function anchor(d,camera){const set=camera==='product'?PRODUCT:WORN;return set[d.heel]||set[A.SHOE_STYLES?.[d.heel]?.accessoryBase]||set.flat;}
function curve(a,t){const s=1-t;return [s*s*a[0]+2*s*t*a[2]+t*t*a[4],s*s*a[1]+2*s*t*a[3]+t*t*a[5]];}
function strokeCurve(p,a,colour,width){p.beginPath();p.moveTo(a[0],a[1]);p.quadraticCurveTo(a[2],a[3],a[4],a[5]);p.strokeStyle=colour;p.lineWidth=width;p.stroke();}
function tangent(a,t){return Math.atan2((1-t)*(a[3]-a[1])+t*(a[5]-a[3]),(1-t)*(a[2]-a[0])+t*(a[4]-a[2]));}
function bridgeTabs(p,path,colour){
 for(const t of [0,1]){const [x,y]=curve(path,t);p.save();p.translate(x,y);p.rotate(tangent(path,t));p.fillStyle=silkTone(colour,-.28);p.beginPath();p.roundRect(-8,-10,18,20,5);p.fill();p.strokeStyle=silkTone(colour,.55);p.lineWidth=1;p.stroke();p.fillStyle='#fff1c5';p.beginPath();p.arc(1,0,2.7,0,Math.PI*2);p.fill();p.restore();}
}
function braidedBand(p,path,colour){
 strokeCurve(p,path,silkTone(colour,-.4),20);strokeCurve(p,path,colour,16);
 // Three interlaced satin folds follow the camera's instep arc. A local
 // curve normal keeps their woven width constant through the raised arch.
 for(let strand=0;strand<3;strand++){
  p.beginPath();for(let i=0;i<=120;i++){const t=i/120,[x,y]=curve(path,t),angle=tangent(path,t),wave=Math.sin(t*Math.PI*12+strand*Math.PI*2/3)*5.3;const px=x-Math.sin(angle)*wave,py=y+Math.cos(angle)*wave;i?p.lineTo(px,py):p.moveTo(px,py);}
  p.strokeStyle=silkTone(colour,strand===0?.62:strand===1?.12:-.16);p.lineWidth=4;p.stroke();
 }
 bridgeTabs(p,path,colour);
}
function pearl(p,x,y,r){
 p.save();p.translate(x,y);p.scale(1,.92);p.shadowColor='#704b4d66';p.shadowBlur=3;p.shadowOffsetY=2;
 const g=p.createRadialGradient(-r*.32,-r*.38,r*.06,0,0,r);g.addColorStop(0,'#ffffff');g.addColorStop(.35,'#fff9ed');g.addColorStop(.72,'#ebdec9');g.addColorStop(1,'#ad9c8b');
 p.fillStyle=g;p.beginPath();p.arc(0,0,r,0,Math.PI*2);p.fill();p.shadowColor='transparent';p.fillStyle='#ffffffeb';p.beginPath();p.ellipse(-r*.3,-r*.35,r*.28,r*.18,-.5,0,Math.PI*2);p.fill();p.restore();
}
function gem(p,x,y,rx,ry,rotation=0,colour='ice'){
 p.save();p.translate(x,y);p.rotate(rotation);p.shadowColor='#5c40516b';p.shadowBlur=3;p.shadowOffsetY=2;
 const g=p.createLinearGradient(-rx,-ry,rx,ry);g.addColorStop(0,'#fff5ce');g.addColorStop(.3,'#b89358');g.addColorStop(.65,'#fff3c4');g.addColorStop(1,'#9c7448');p.fillStyle=g;p.beginPath();p.ellipse(0,0,rx+3,ry+3,0,0,Math.PI*2);p.fill();p.shadowColor='transparent';
 p.fillStyle=colour==='rose'?'#f4a6c7':'#c4e6f2';p.beginPath();p.ellipse(0,0,rx,ry,0,0,Math.PI*2);p.fill();
 const points=[[-rx*.75,-ry*.45],[0,-ry],[rx*.76,-ry*.42],[rx*.78,ry*.42],[0,ry],[-rx*.8,ry*.4]];
 for(let i=0;i<points.length;i++){p.fillStyle=['#fff9ffe8','#e8f8ff','#90bdd8','#bad7f1','#f8e3f1','#ffffffba'][i];p.beginPath();p.moveTo(0,0);p.lineTo(...points[i]);p.lineTo(...points[(i+1)%points.length]);p.closePath();p.fill();}
 p.strokeStyle='#ffffffc9';p.lineWidth=1;p.beginPath();p.ellipse(0,0,rx*.85,ry*.87,0,0,Math.PI*2);p.stroke();p.restore();
}
function heart(p,x,y,size,colour){p.save();p.translate(x,y);p.fillStyle=colour;p.beginPath();p.moveTo(0,size*.8);p.bezierCurveTo(-size*1.5,-size*.2,-size*.6,-size,0,-size*.4);p.bezierCurveTo(size*.6,-size,size*1.5,-size*.2,0,size*.8);p.closePath();p.fill();p.restore();}
function silkTone(colour,light){const rgb=colour.slice(1).match(/../g).map(v=>parseInt(v,16));return 'rgb('+rgb.map(v=>Math.round(light>=0?v+(255-v)*light:v*(1+light))).join(',')+')';}
function bow(p,x,y,size,colour,puffy=false){
 p.save();p.translate(x,y);p.rotate(-.22);p.scale(1,puffy?.88:.77);
 // A folded satin ribbon lies across the vamp plane. The far loop is narrower
 // and its fold darker; the near loop catches the same upper-left shoe light.
 p.shadowColor='#78505c55';p.shadowBlur=4;p.shadowOffsetY=3;
 const g=p.createLinearGradient(0,-size*.6,0,size*.65);g.addColorStop(0,silkTone(colour,.48));g.addColorStop(.24,colour);g.addColorStop(.44,silkTone(colour,.36));g.addColorStop(.6,colour);g.addColorStop(1,silkTone(colour,-.3));
 for(const side of [-1,1]){
  p.save();p.scale(side*(side<0?.85:1),1);
  // Short fishtail ends stay entirely on the fabric, below their own loops.
  p.fillStyle=g;p.beginPath();p.moveTo(3,2);p.quadraticCurveTo(size*.26,size*.21,size*.47,size*.65);p.lineTo(size*.25,size*.54);p.lineTo(size*.14,size*.7);p.quadraticCurveTo(size*.08,size*.25,-2,6);p.closePath();p.fill();
  p.fillStyle=g;p.beginPath();p.moveTo(2,-5);p.bezierCurveTo(size*.54,-size*.69,size*1.1,-size*.61,size*.94,-size*.02);p.bezierCurveTo(size*.96,size*.54,size*.41,size*.48,2,6);p.closePath();p.fill();p.strokeStyle=silkTone(colour,-.3);p.lineWidth=1.4;p.stroke();p.shadowColor='transparent';
  p.fillStyle=silkTone(colour,-.22);p.beginPath();p.moveTo(5,0);p.quadraticCurveTo(size*.39,-size*.17,size*.77,-size*.13);p.quadraticCurveTo(size*.48,size*.04,5,6);p.closePath();p.fill();
  p.strokeStyle=silkTone(colour,.65);p.lineWidth=puffy?3:2;p.beginPath();p.moveTo(size*.19,-size*.14);p.quadraticCurveTo(size*.54,-size*.4,size*.81,-size*.26);p.stroke();p.restore();
 }
 p.shadowColor='transparent';p.fillStyle=g;p.beginPath();p.roundRect(-10,-14,20,29,7);p.fill();p.strokeStyle=silkTone(colour,-.24);p.lineWidth=1.2;p.stroke();p.strokeStyle='#ffffffa8';p.lineWidth=2;p.beginPath();p.moveTo(-5,-8);p.quadraticCurveTo(-7,0,-4,9);p.stroke();p.restore();
}
function puffyBow(p,x,y,size,colour){
 p.save();p.translate(x,y);p.rotate(-.22);p.scale(1,.84);
 p.fillStyle='#56363d44';p.filter='blur(7px)';p.beginPath();p.ellipse(0,14,size*.89,size*.37,0,0,Math.PI*2);p.fill();p.filter='none';
 for(const side of [-1,1]){
  p.save();p.scale(side*(side<0?.88:1),1);
  const tail=p.createLinearGradient(0,0,size*.5,size*.7);tail.addColorStop(0,silkTone(colour,-.32));tail.addColorStop(.48,colour);tail.addColorStop(1,silkTone(colour,-.25));
  p.fillStyle=tail;p.beginPath();p.moveTo(0,4);p.bezierCurveTo(size*.18,size*.17,size*.31,size*.43,size*.48,size*.72);p.lineTo(size*.28,size*.61);p.lineTo(size*.19,size*.76);p.bezierCurveTo(size*.12,size*.48,size*.08,size*.25,-2,12);p.closePath();p.fill();
  const loop=p.createLinearGradient(size*.35,-size*.55,size*.52,size*.48);loop.addColorStop(0,silkTone(colour,-.12));loop.addColorStop(.18,silkTone(colour,.48));loop.addColorStop(.37,silkTone(colour,.16));loop.addColorStop(.57,colour);loop.addColorStop(.78,silkTone(colour,-.08));loop.addColorStop(1,silkTone(colour,-.35));
  p.fillStyle=loop;p.strokeStyle=silkTone(colour,-.27);p.lineWidth=1.2;p.beginPath();p.moveTo(3,-5);p.bezierCurveTo(size*.28,-size*.31,size*.7,-size*.62,size*.91,-size*.42);p.bezierCurveTo(size*1.08,-size*.26,size*1.02,size*.18,size*.91,size*.28);p.bezierCurveTo(size*.69,size*.44,size*.29,size*.22,3,8);p.closePath();p.fill();p.stroke();
  p.save();p.globalAlpha=.19;p.fillStyle=silkTone(colour,-.42);p.beginPath();p.moveTo(5,1);p.bezierCurveTo(size*.26,-size*.08,size*.51,-size*.17,size*.79,-size*.17);p.bezierCurveTo(size*.55,-size*.06,size*.29,size*.04,5,8);p.closePath();p.fill();p.restore();
  p.strokeStyle=silkTone(colour,.6);p.globalAlpha=.6;p.lineWidth=3;p.beginPath();p.moveTo(size*.18,-size*.15);p.bezierCurveTo(size*.43,-size*.36,size*.7,-size*.43,size*.84,-size*.32);p.stroke();
  p.globalAlpha=.28;p.lineWidth=1.5;p.beginPath();p.moveTo(size*.15,size*.1);p.quadraticCurveTo(size*.47,size*.27,size*.77,size*.23);p.stroke();p.restore();
 }
 const knot=p.createLinearGradient(-12,-12,12,12);knot.addColorStop(0,silkTone(colour,-.2));knot.addColorStop(.3,silkTone(colour,.55));knot.addColorStop(.62,colour);knot.addColorStop(1,silkTone(colour,-.3));
 p.fillStyle=knot;p.strokeStyle=silkTone(colour,-.24);p.lineWidth=1.2;p.beginPath();p.roundRect(-10,-13,20,27,7);p.fill();p.stroke();p.globalAlpha=.48;p.strokeStyle=silkTone(colour,.72);p.lineWidth=2;p.beginPath();p.moveTo(-4,-9);p.quadraticCurveTo(-6,0,-3,9);p.stroke();p.restore();
}
let puffyImage, puffyLoad;
const puffyColours=new Map();
function loadPuffy(){
 if(!puffyLoad)puffyLoad=new Promise(resolve=>{const image=new Image();image.onload=()=>{puffyImage=image;resolve();};image.onerror=()=>resolve();image.src='assets/ornaments/puffy_satin.webp';});
 return puffyLoad;
}
function paintedPuffy(p,d,camera,a,colour){
 if(!puffyImage){puffyBow(p,a.vamp[0]+18,a.vamp[1]+(camera==='product'?24:32),80,colour);return;}
 let image=puffyColours.get(colour);
 if(!image){image=document.createElement('canvas');image.width=puffyImage.naturalWidth;image.height=puffyImage.naturalHeight;const context=image.getContext('2d');context.drawImage(puffyImage,0,0);const pixels=context.getImageData(0,0,image.width,image.height);for(let index=0;index<pixels.data.length;index+=4){const luminance=Math.round(.2126*pixels.data[index]+.7152*pixels.data[index+1]+.0722*pixels.data[index+2]);pixels.data[index]=pixels.data[index+1]=pixels.data[index+2]=luminance;}context.putImageData(pixels,0,0);context.globalCompositeOperation='multiply';context.fillStyle=silkTone(colour,.3);context.fillRect(0,0,image.width,image.height);context.globalCompositeOperation='destination-in';context.drawImage(puffyImage,0,0);puffyColours.set(colour,image);}
 const x=a.vamp[0]+32,y=a.vamp[1]-(camera==='product'?34:22),width=camera==='product'?150:145,height=width*image.height/image.width*.77;
 p.save();p.translate(x,y);p.rotate(camera==='product'?.20:.12);p.shadowColor='#67434b88';p.shadowBlur=6;p.shadowOffsetY=4;p.drawImage(image,-width/2,-height*.42,width,height);p.restore();
}
function drawOne(p,d,camera,category,upper){
 if(category==='charm'&&d.charm==='toeglitter'&&upper){const c=document.createElement('canvas');c.width=p.canvas.width;c.height=p.canvas.height;const q=c.getContext('2d');drawOne(q,d,camera,category);q.globalCompositeOperation='destination-in';q.drawImage(upper,0,0,c.width,c.height);p.drawImage(c,0,0);return true;}
 const value=d[category];if(!handles(category,value,camera))return false;const a=anchor(d,camera),colour=PALETTE[d.color]||PALETTE.pink;
 p.save();p.lineCap='round';p.lineJoin='round';
 if(category==='strap'){
  if(value==='cross'){
   crossLaces(p,d,colour,camera,upper);
  }else if(value==='pearl'){
   // Product straps rise above the empty opening in the Mary-Jane plane.
   // The two camera-specific ends are sewn into the far binding and near
   // upper, rather than terminating along the insole or halfway into space.
   const product=camera==='product',rows=laceCamera(d,camera).rows,far=rows[0][0],near=rows[0][1];
   const start=product?[far[0]+6,far[1]+(d.heel==='stiletto9'?15:0)]:[far[0]+3,far[1]-20];
   const end=product?[near[0]+20,near[1]-65]:[near[0]+100,near[1]-85];
   const path=[...start,(start[0]+end[0])/2-15,product?Math.min(start[1],end[1])-100:(start[1]+end[1])/2-80,...end];
   strokeCurve(p,path,'#79564566',product?13:6);
   strokeCurve(p,path,'#f4e5c8',product?9:2.5);
   for(const t of [0,1]){
    const [x,y]=curve(path,t);p.save();p.translate(x,y);p.rotate(t?.40:-.35);
    const gold=p.createLinearGradient(-9,-6,9,9);gold.addColorStop(0,'#fff2c3');gold.addColorStop(.5,'#bc9257');gold.addColorStop(1,'#e8c78e');
    p.fillStyle=gold;p.beginPath();p.roundRect(-8,-5,16,t?23:16,5);p.fill();
    p.strokeStyle='#fff6d0';p.lineWidth=1;p.beginPath();p.moveTo(-4,8);p.lineTo(4,8);p.stroke();p.restore();
   }
   // Arc-length spacing keeps the pearls connected around the raised arch.
   const samples=[{t:0,length:0}],steps=100;let length=0,previous=curve(path,0);
   for(let i=1;i<=steps;i++){const point=curve(path,i/steps);length+=Math.hypot(point[0]-previous[0],point[1]-previous[1]);samples.push({t:i/steps,length});previous=point;}
   const count=Math.max(11,Math.round(length/17));
   for(let i=0;i<=count;i++){
    const fraction=i/count,target=length*fraction,index=Math.max(1,samples.findIndex(point=>point.length>=target)),sample=samples[index],previous=samples[index-1];
    // Interpolate the measured arc rather than snapping every pearl to one
    // of 100 t samples; the near/far size transition then stays continuous.
    const blend=(target-previous.length)/(sample.length-previous.length||1),t=previous.t+(sample.t-previous.t)*blend,[x,y]=curve(path,t);
    pearl(p,x,y,product?6.8+fraction*4.5:7.5+fraction*5.2);
   }
   for(const t of [0,1]){
    const [x,y]=curve(path,t),angle=tangent(path,t);
    p.save();p.translate(x,y);p.rotate(angle);p.fillStyle='#b58a4f';p.beginPath();p.roundRect(-4,-6,8,12,3);p.fill();
    p.strokeStyle='#ffe9aa';p.lineWidth=1.5;p.stroke();p.restore();
   }
  }else if(value==='crystalband'){
   const path=a.bridge;strokeCurve(p,path,'#76584277',14);strokeCurve(p,path,'#ddbf82',10);
   bridgeTabs(p,path,colour);
   // Facets grow toward the near mount instead of a flat row of identical
   // stamps. Each stone rotates with the instep and has its own gold bezel.
   let length=0,last=curve(path,0);for(let i=1;i<=60;i++){const pt=curve(path,i/60);length+=Math.hypot(pt[0]-last[0],pt[1]-last[1]);last=pt;}
   const count=Math.max(10,Math.round(length/18));
   for(let i=0;i<=count;i++){const t=i/count,[x,y]=curve(path,t),r=5.5+t*2.8;gem(p,x,y,r,r*.78,tangent(path,t),i%4===1?'rose':'ice');}
  }else if(value==='satinbraid'){
   braidedBand(p,a.bridge,colour);
  }else if(value==='heartbuckle'){
   strokeCurve(p,a.bridge,'#865365',22);strokeCurve(p,a.bridge,colour,18);const shine=a.bridge.map((v,i)=>i%2?v-4:v);strokeCurve(p,shine,'#fff5f6a8',3);
   const [x,y]=curve(a.bridge,.83);heart(p,x,y,17,'#b48a50');heart(p,x,y-1,12,'#fff0bd');heart(p,x,y-1,7,colour);
  }else if(value==='anklet'){
   // Product jewellery rests on the exterior quarter; when worn it wraps
   // the ankle contour above the instep, with both ends disappearing sideways.
   const key=PRODUCT_CHAIN[d.heel]?d.heel:A.SHOE_STYLES?.[d.heel]?.accessoryBase,c=camera==='product'?(PRODUCT_CHAIN[key]||PRODUCT_CHAIN.flat):(WORN_ANKLE[key]||WORN_ANKLE.flat);
   strokeCurve(p,c,'#765c443d',5);strokeCurve(p,c,'#ad8653',3);strokeCurve(p,c.map((v,i)=>i%2?v-2:v),'#fff0bc',1.3);
   for(let i=0;i<=13;i++){const [x,y]=curve(c,i/13);p.strokeStyle='#e8ca8e';p.lineWidth=2;p.beginPath();p.ellipse(x,y,3,2,-.3,0,Math.PI*2);p.stroke();}
   const [x,y]=curve(c,.65);gem(p,x,y+14,5,9,-.2);
  }else{
   // Only the *near outer* upper: never follow the far insole rim.
   const [x,y]=a.vamp,c=[x-18,y+8,x+96,y+48,x+174,y+5];
   for(let i=0;i<10;i++){const [px,py]=curve(c,i/9);if(value==='pearltrim')pearl(p,px,py,5.7-i*.16);else{p.save();p.translate(px,py);p.rotate(.65);p.fillStyle='#b28e58';p.fillRect(-3.8,-3.8,7.6,7.6);p.fillStyle='#fff3c8';p.beginPath();p.moveTo(-3.8,-3.8);p.lineTo(3.8,-3.8);p.lineTo(0,0);p.closePath();p.fill();p.restore();}}
  }
 }else if(category==='decoration'){
  const [x,y]=a.vamp;
  // Taller slim-pump arches leave less fabric above the pinned outsole.
  const clearance=camera==='product'&&['stiletto6','stiletto9'].includes(A.SHOE_STYLES?.[d.heel]?.accessoryBase||d.heel)?14:camera!=='product'&&d.heel==='kitten'&&value==='rosette'?8:0;
  const dy=y+(camera==='product'?24:32)-clearance;
  if(value==='puffy')paintedPuffy(p,d,camera,a,colour);
  else if(value==='doublebow'){bow(p,x+16,dy,80,colour);bow(p,x+16,dy,53,'#fff0da');}
  else if(value==='heelcrystal'){const [bx,by]=a.rear;gem(p,bx,by+17,9,15,-.18);gem(p,bx-5,by+49,7,12,.16);}
  else if(value==='heelbow'){
   const [bx,by]=a.rear;p.save();p.translate(bx-5,by+21);p.rotate(.18);p.fillStyle=silkTone(colour,-.2);p.beginPath();p.ellipse(0,0,12,20,-.2,0,Math.PI*2);p.fill();bow(p,0,0,camera==='product'?32:(d.heel==='flat'?39:29),colour);pearl(p,0,0,4.5);p.restore();
  }else if(value==='camellia'){
   p.save();p.translate(x+16,dy+4);p.rotate(-.2);p.scale(1,.74);
   p.shadowColor='#76505c55';p.shadowBlur=4;p.shadowOffsetY=3;
   for(let ring=0;ring<3;ring++){const count=ring===0?7:5,radius=39-ring*12;
    for(let i=0;i<count;i++){p.save();p.rotate(i*Math.PI*2/count+ring*.55);const g=p.createLinearGradient(-10,-radius*1.4,12,4);g.addColorStop(0,silkTone(colour,.72));g.addColorStop(.5,colour);g.addColorStop(1,silkTone(colour,-.28));p.fillStyle=g;p.strokeStyle=silkTone(colour,-.15);p.lineWidth=1;p.beginPath();p.moveTo(-3,5);p.bezierCurveTo(-radius,-radius*.2,-radius*.68,-radius*1.48,0,-radius*1.45);p.bezierCurveTo(radius*.68,-radius*1.48,radius,-radius*.2,3,5);p.closePath();p.fill();p.stroke();p.shadowColor='transparent';p.restore();}
   }
   pearl(p,0,0,8);for(let i=0;i<5;i++){const angle=i*Math.PI*2/5;pearl(p,Math.cos(angle)*11,Math.sin(angle)*11,3.2);}p.restore();
  }
  else{p.save();p.translate(x+16,dy+9);p.rotate(-.2);for(let i=0;i<7;i++){const an=i*Math.PI*2/7;p.save();p.rotate(an);const g=p.createLinearGradient(0,0,0,-35);g.addColorStop(0,colour);g.addColorStop(1,'#fff7fa');p.fillStyle=g;p.strokeStyle='#b87c9344';p.lineWidth=1;p.beginPath();p.ellipse(0,-20,17,28,0,0,Math.PI*2);p.fill();p.stroke();p.restore();}pearl(p,0,0,10);p.restore();}
 }else{
  const [x,y]=a.toe;
  if(value==='oval')gem(p,x,y,33,24,-.27);
  else if(value==='heart'){heart(p,x,y+2,34,'#a98750');heart(p,x,y,29,'#f2adc9');p.strokeStyle='#fff6f9';p.lineWidth=2;p.beginPath();p.moveTo(x-14,y-6);p.quadraticCurveTo(x-13,y-15,x-5,y-10);p.stroke();}
  else if(value==='spray'){for(let i=0;i<7;i++){const an=-Math.PI*.85+i*.28;p.strokeStyle='#c4a46d';p.lineWidth=1.6;p.beginPath();p.moveTo(x,y+9);p.lineTo(x+Math.cos(an)*47,y+Math.sin(an)*38);p.stroke();gem(p,x+Math.cos(an)*47,y+Math.sin(an)*38,8,14,an+.7);}gem(p,x,y+3,12,9,-.2);}
  else if(value==='butterfly'){
   p.save();p.translate(x,y);p.rotate(-.25);p.scale(1,.8);
   gem(p,-18,-10,14,22,-.62,'rose');gem(p,18,-10,14,22,.62,'rose');gem(p,-14,15,10,14,.5);gem(p,14,15,10,14,-.5);
   p.strokeStyle='#b58d55';p.lineWidth=2;p.beginPath();p.moveTo(-2,-17);p.quadraticCurveTo(-4,-27,-12,-28);p.moveTo(2,-17);p.quadraticCurveTo(4,-27,12,-28);p.stroke();pearl(p,-12,-28,2.5);pearl(p,12,-28,2.5);gem(p,0,0,5,18,0);p.restore();
  }else if(value==='pearlcluster'){
   p.save();p.translate(x,y);p.rotate(-.24);p.scale(1,.75);
   for(let i=0;i<7;i++){const angle=i*Math.PI*2/7;pearl(p,Math.cos(angle)*27,Math.sin(angle)*24,9+i*.2);}
   gem(p,0,0,15,12,-.1,'rose');p.restore();
  }
  else{p.save();p.translate(x-22,y+13);p.rotate(-.2);p.scale(1,.64);for(let i=0;i<110;i++){const t=i*2.399963229728653,r=Math.sqrt((i+.5)/110)*58,px=Math.cos(t)*r,py=Math.sin(t)*r*.60;p.fillStyle=i%3?'#fff7dd':'#c79c55';p.fillRect(px,py,i%7?2.5:4,i%7?2.5:4);}p.restore();}
 }
 p.restore();return true;
}
function draw(p,d,camera){for(const category of Object.keys(OPTIONS))drawOne(p,d,camera,category);}
A.AccessoryRenderer=Object.freeze({handles,draw,drawOne,loadPuffy,options:OPTIONS,anchors:Object.freeze({product:PRODUCT,worn:WORN}),laceCamera,laceStrands,laceRibbonPoints});
})(globalThis.SweetShoe=globalThis.SweetShoe||{});
