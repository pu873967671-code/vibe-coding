'use strict';
(function(A){
// Original code-native jewellery, authored in each immutable source camera.
// Every control point belongs to the shoe/foot, never to the viewport.
const OPTIONS={strap:['pearl','pearltrim','studs','heartbuckle','anklet'],decoration:['puffy','doublebow','heelcrystal','rosette'],charm:['oval','heart','spray','toeglitter']};
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
function handles(category,value){return !!OPTIONS[category]?.includes(value);}
function anchor(d,camera){const set=camera==='product'?PRODUCT:WORN;return set[d.heel]||set[A.SHOE_STYLES?.[d.heel]?.accessoryBase]||set.flat;}
function curve(a,t){const s=1-t;return [s*s*a[0]+2*s*t*a[2]+t*t*a[4],s*s*a[1]+2*s*t*a[3]+t*t*a[5]];}
function strokeCurve(p,a,colour,width){p.beginPath();p.moveTo(a[0],a[1]);p.quadraticCurveTo(a[2],a[3],a[4],a[5]);p.strokeStyle=colour;p.lineWidth=width;p.stroke();}
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
function drawOne(p,d,camera,category,upper){
 if(category==='charm'&&d.charm==='toeglitter'&&upper){const c=document.createElement('canvas');c.width=p.canvas.width;c.height=p.canvas.height;const q=c.getContext('2d');drawOne(q,d,camera,category);q.globalCompositeOperation='destination-in';q.drawImage(upper,0,0,c.width,c.height);p.drawImage(c,0,0);return true;}
 const value=d[category];if(!handles(category,value))return false;const a=anchor(d,camera),colour=PALETTE[d.color]||PALETTE.pink;
 p.save();p.lineCap='round';p.lineJoin='round';
 if(category==='strap'){
  if(value==='pearl'){
   // Product straps rise above the empty opening in the Mary-Jane plane.
   // The two camera-specific ends are sewn into the far binding and near
   // upper, rather than terminating along the insole or halfway into space.
   const product=camera==='product',path=a.bridge;
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
   if(product){
    const [x,y]=curve(path,1);p.save();p.shadowColor='#80584666';p.shadowBlur=3;p.shadowOffsetY=2;
    p.fillStyle='#b28a52';p.beginPath();p.ellipse(x+4,y+11,10,9,.4,0,Math.PI*2);p.fill();
    p.shadowColor='transparent';p.strokeStyle='#ffe8ac';p.lineWidth=2;p.stroke();pearl(p,x+3,y+10,5);p.restore();
   }
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
  if(value==='puffy')bow(p,x+18,dy,80,colour,true);
  else if(value==='doublebow'){bow(p,x+16,dy,80,colour);bow(p,x+16,dy,53,'#fff0da');}
  else if(value==='heelcrystal'){const [bx,by]=a.rear;gem(p,bx,by+17,9,15,-.18);gem(p,bx-5,by+49,7,12,.16);}
  else{p.save();p.translate(x+16,dy+9);p.rotate(-.2);for(let i=0;i<7;i++){const an=i*Math.PI*2/7;p.save();p.rotate(an);const g=p.createLinearGradient(0,0,0,-35);g.addColorStop(0,colour);g.addColorStop(1,'#fff7fa');p.fillStyle=g;p.strokeStyle='#b87c9344';p.lineWidth=1;p.beginPath();p.ellipse(0,-20,17,28,0,0,Math.PI*2);p.fill();p.stroke();p.restore();}pearl(p,0,0,10);p.restore();}
 }else{
  const [x,y]=a.toe;
  if(value==='oval')gem(p,x,y,33,24,-.27);
  else if(value==='heart'){heart(p,x,y+2,34,'#a98750');heart(p,x,y,29,'#f2adc9');p.strokeStyle='#fff6f9';p.lineWidth=2;p.beginPath();p.moveTo(x-14,y-6);p.quadraticCurveTo(x-13,y-15,x-5,y-10);p.stroke();}
  else if(value==='spray'){for(let i=0;i<7;i++){const an=-Math.PI*.85+i*.28;p.strokeStyle='#c4a46d';p.lineWidth=1.6;p.beginPath();p.moveTo(x,y+9);p.lineTo(x+Math.cos(an)*47,y+Math.sin(an)*38);p.stroke();gem(p,x+Math.cos(an)*47,y+Math.sin(an)*38,8,14,an+.7);}gem(p,x,y+3,12,9,-.2);}
  else{p.save();p.translate(x-22,y+13);p.rotate(-.2);p.scale(1,.64);for(let i=0;i<110;i++){const t=i*2.399963229728653,r=Math.sqrt((i+.5)/110)*58,px=Math.cos(t)*r,py=Math.sin(t)*r*.60;p.fillStyle=i%3?'#fff7dd':'#c79c55';p.fillRect(px,py,i%7?2.5:4,i%7?2.5:4);}p.restore();}
 }
 p.restore();return true;
}
function draw(p,d,camera){for(const category of Object.keys(OPTIONS))drawOne(p,d,camera,category);}
A.AccessoryRenderer=Object.freeze({handles,draw,drawOne,options:OPTIONS,anchors:Object.freeze({product:PRODUCT,worn:WORN})});
})(globalThis.SweetShoe=globalThis.SweetShoe||{});
