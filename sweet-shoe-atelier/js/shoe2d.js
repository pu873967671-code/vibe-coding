'use strict';
(function(A){
// A design is a finish applied to one immutable painting. Neither a colour nor
// a fabric selection changes the source frame, silhouette, or camera.
const WIDTH=1024,HEIGHT=640,HEELS=A.opts.heel.map(o=>o[0]);
// The binding mask restores the painted inner seam over the sewn strap tab.
// Insole/sole pixels stay in the immutable base and need no extra bitmap decode.
const PARTS=['base','upper','shadow','highlight','binding'];
const COLORS={pink:'#ffadc9',cream:'#fff0d2',blue:'#a9daff',green:'#c6e7a5',purple:'#d6b9ff',peach:'#ffc09e',rose:'#f478a4',black:'#696883'};
const loads=new Map(),cache=new Map(),jobs=new Map(),paintTokens=new WeakMap(),fallbacks=new Map();
const CACHE_LIMIT=8;
const ACCESSORIES={bow:'bow',pearls:'pearls',laces:'laces',maryjane:'maryjane',drop:'drop',crystal:'crystal',flower:'flower',pearl:'pearl'};
const ACCESSORY_OPTIONS=Object.freeze({strap:['thin','ribbon','cross','pearl'],decoration:['small','big','flower','drop'],charm:['mini','pearl','crystal']});
const TINTABLE_ACCESSORIES=new Set(['strap_thin','strap_ribbon','strap_cross','decoration_small','decoration_big','charm_mini']);
const perspectiveLayers=Object.create(null),perspectiveTints=Object.create(null),perspectiveLoads=new Map(),accessoryFallbacks=new Map(),tintFallbacks=new Map();
let accessoryLoad;
const ANCHORS={
 flat:{toe:[285,432],back:[854,294],strap:[576,352],lace:[350,405],strapAngle:.70},
 kitten:{toe:[285,445],back:[855,197],strap:[594,318],lace:[352,421],strapAngle:.90},
 stiletto6:{toe:[285,460],back:[855,205],strap:[594,332],lace:[352,437],strapAngle:1.0},
 stiletto9:{toe:[285,465],back:[855,195],strap:[594,332],lace:[352,441],strapAngle:1.12},
 block:{toe:[285,446],back:[854,197],strap:[595,319],lace:[352,423],strapAngle:.87},
 wedge:{toe:[285,426],back:[855,188],strap:[595,304],lace:[352,405],strapAngle:.87}
};
async function accessories(heel){
 const ownStyle=A.SHOE_STYLES?.[heel];
 const dedicated=!ownStyle?.accessoryBase||ownStyle.accessoryBase===heel;
 heel=A.SHOE_STYLES?.[heel]?.accessoryBase||heel;
 const legacy=await (accessoryLoad||(accessoryLoad=Promise.all(Object.entries(ACCESSORIES).map(async([name,file])=>[name,await image('assets/shoe2d/accessories/'+file+'.webp')])).then(Object.fromEntries)));
 if(heel){
  if(!perspectiveLoads.has(heel)){
   const variants=Object.entries(ACCESSORY_OPTIONS).filter(([category])=>!dedicated||!(category==='strap'&&ownStyle?.builtInStrap)&&!(category==='decoration'&&(ownStyle?.openHeel||ownStyle?.noRearDecor))).flatMap(([category,values])=>values.map(value=>category+'_'+value));
   perspectiveLoads.set(heel,Promise.all(variants.map(async name=>{
    const prefix='assets/shoe2d/accessories/'+heel+'_'+name;
    const tintable=TINTABLE_ACCESSORIES.has(name);
    const [im,mask]=await Promise.all([image(prefix+'.webp'),tintable?image(prefix+'_tint.webp'):null]);
    const valid=im?.naturalWidth===WIDTH&&im?.naturalHeight===HEIGHT;
    const tintValid=mask?.naturalWidth===WIDTH&&mask?.naturalHeight===HEIGHT;
    if(!valid)accessoryFallbacks.set(heel+'_'+name,'perspective layer unavailable; legacy ornament');
    if(tintable&&!tintValid)tintFallbacks.set(heel+'_'+name,'fabric mask unavailable; neutral painted ornament');
    return [name,valid?im:null,tintValid?mask:null];
   })).then(entries=>{
    perspectiveLayers[heel]=Object.fromEntries(entries.map(([name,im])=>[name,im]));
    perspectiveTints[heel]=Object.fromEntries(entries.map(([name,,mask])=>[name,mask]));
   }));
  }
  await perspectiveLoads.get(heel);
 }
 return {...legacy,layers:perspectiveLayers,tints:perspectiveTints};
}
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
   const original=await image('assets/shoe_'+(A.SHOE_STYLES?.[heel]?.fallbackHeel||A.SHOE_STYLES?.[heel]?.accessoryBase||heel)+'_none.webp');
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
// New couture finishes share one source-coordinate renderer between product
// and worn cameras. The caller clips it to its own immutable upper mask.
function drawRichMaterial(p,d,width,height){
 if(!['metallic','pearlescent'].includes(d.material))return;
 p.save();
 const g=p.createLinearGradient(width*.12,height*.86,width*.80,height*.15);
 if(d.material==='metallic'){
  for(const [at,colour] of [[0,'#3b284b40'],[.22,'#56415e20'],[.35,'#fff3cf28'],[.405,'#fffbea9c'],[.45,'#fffdf26e'],[.50,'#46334a38'],[.62,'#38263b25'],[.72,'#fff8df62'],[.76,'#fffdf293'],[.82,'#6e4d5b1c'],[1,'#3b284b30']])g.addColorStop(at,colour);
 }else{
  for(const [at,colour] of [[0,'#d4b8ed25'],[.22,'#a3e6db24'],[.38,'#fffbe56d'],[.48,'#fffdfb92'],[.57,'#efb5d832'],[.72,'#b7d3ef36'],[.83,'#fff8de55'],[1,'#d2b7e626']])g.addColorStop(at,colour);
 }
 p.fillStyle=g;p.fillRect(0,0,width,height);
 // Quiet directional brushing, never glitter or polka-dot texture.
 if(d.material==='metallic'){
  p.lineWidth=.55;p.strokeStyle='#fff8e112';
  for(let y=-height;y<height*2;y+=4){p.beginPath();p.moveTo(0,y);p.lineTo(width,y-width*.24);p.stroke();}
 }
 p.restore();
}
function drawRichPattern(p,d,width,height){
 if(!['rosebuds','diamonds'].includes(d.pattern))return;
 p.save();p.lineCap='round';p.lineJoin='round';
 if(d.pattern==='diamonds'){
  const step=54;p.strokeStyle='#fff8e9a6';p.lineWidth=1.15;p.setLineDash([3,3]);
  for(let x=-height;x<width+height;x+=step){p.beginPath();p.moveTo(x,0);p.lineTo(x+height*.7,height);p.moveTo(x,0);p.lineTo(x-height*.7,height);p.stroke();}
  p.setLineDash([]);
 }else{
  const step=76;
  for(let row=0;row<height/step+1;row++)for(let col=-1;col<width/step+1;col++){
   p.save();p.translate((col+(row%2)*.5)*step,row*step);p.rotate(-.24);p.scale(1,.82);
   p.strokeStyle='#4b826d99';p.lineWidth=1.6;p.beginPath();p.moveTo(0,5);p.quadraticCurveTo(3,13,-1,20);p.stroke();
   p.fillStyle='#a9d8b6c9';p.beginPath();p.ellipse(-4,12,5,2.2,.55,0,Math.PI*2);p.ellipse(4,17,5,2.2,-.55,0,Math.PI*2);p.fill();
   p.fillStyle='#fff3e7e8';p.beginPath();p.ellipse(0,0,6.8,7.2,-.2,0,Math.PI*2);p.fill();
   p.strokeStyle='#d678a1d9';p.lineWidth=1.35;p.beginPath();p.moveTo(-5,-1);p.bezierCurveTo(-2,5,5,4,4,-2);p.bezierCurveTo(3,-6,-3,-6,-3,-1);p.bezierCurveTo(-3,2,2,2,2,-1);p.stroke();
   p.restore();
  }
 }
 p.restore();
}
A.CoutureFinish=Object.freeze({drawMaterial:drawRichMaterial,drawPattern:drawRichPattern});
function materialLayer(design,upper){
 const out=canvas(),p=out.getContext('2d'),type=design.material;
 p.lineCap='round';p.lineJoin='round';
 if(type==='satin'||type==='patent'){
  const g=p.createLinearGradient(130,530,730,80);
  // Patent has sharper, brighter reflected light; satin keeps its soft ribbons.
  const stops=type==='patent'?[[0,0],[.27,0],[.345,.10],[.365,.70],[.395,.55],[.455,0],[.65,0],[.705,.30],[.73,.10],[.77,0],[1,0]]:[[0,0],[.24,0],[.34,.12],[.39,.27],[.47,0],[.65,0],[.72,.09],[.79,0],[1,0]];
  for(const [stop,alpha] of stops)g.addColorStop(stop,'rgba(255,255,251,'+alpha+')');
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
 drawRichMaterial(p,design,WIDTH,HEIGHT);
 clip(p,upper);return out;
}
function patternLayer(design,upper){
 if(design.pattern==='none')return null;
 const out=canvas(),p=out.getContext('2d'),step=59,r=7;
 if(['rosebuds','diamonds'].includes(design.pattern)){drawRichPattern(p,design,WIDTH,HEIGHT);clip(p,upper);return out;}
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
 const job=Promise.all([load(design.heel),accessories(design.heel)]).then(([parts,sprites])=>{
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
  drawAccessories(p,design,sprites,parts.base,parts.binding,parts.upper);
  cache.set(id,out);while(cache.size>CACHE_LIMIT)cache.delete(cache.keys().next().value);
  return out;
 }).finally(()=>jobs.delete(id));
 jobs.set(id,job);return job;
}
// Every reviewed edit is extracted onto its original 1024×640 source frame.
// Its perspective and contact shading are already painted: drawing it at the
// origin keeps the base camera/silhouette exact through all finish changes.
function drawAccessories(p,d,sprites,base,binding,upper){
 for(const category of ['strap','decoration','charm']){
  const value=d[category];if(!value||value==='none')continue;
  if(A.AccessoryRenderer?.handles(category,value)){A.AccessoryRenderer.drawOne(p,d,'product',category,upper);continue;}
  const accessoryHeel=A.SHOE_STYLES?.[d.heel]?.accessoryBase||d.heel;
  const name=category+'_'+value,layer=sprites.layers?.[accessoryHeel]?.[name];
  if(layer){
   const mask=sprites.tints?.[accessoryHeel]?.[name];
   p.drawImage(mask?tintAccessory(layer,mask,COLORS[d.color]||COLORS.pink):layer,0,0);
  }
  else drawLegacyAccessories(p,{...d,strap:'none',decoration:'none',charm:'none',[category]:value},sprites,base,binding);
 }
}
// Tint only the extracted fabric, preserving painted folds, jewellery and
// contact ink. The last source-atop pass preserves the source alpha exactly,
// including its soft antialiased edges, at every selected colour.
function tintAccessory(layer,mask,colour){
 const dyed=canvas(),q=dyed.getContext('2d');
 q.drawImage(layer,0,0);q.globalCompositeOperation='multiply';q.fillStyle=colour;q.fillRect(0,0,WIDTH,HEIGHT);
 q.globalCompositeOperation='destination-in';q.drawImage(mask,0,0);
 const out=canvas(),p=out.getContext('2d');p.drawImage(layer,0,0);
 p.globalCompositeOperation='source-atop';p.drawImage(dyed,0,0);return out;
}
// Missing image fallback retains the last complete, playable ornament kit.
function drawLegacyAccessories(p,d,sprites,base,binding){
 const a=ANCHORS[d.heel]||ANCHORS[A.SHOE_STYLES?.[d.heel]?.fallbackHeel||A.SHOE_STYLES?.[d.heel]?.accessoryBase]||ANCHORS.flat,layer=canvas(),q=layer.getContext('2d');
 const bandStart=d.heel==='flat'?[-66,-53]:d.heel==='kitten'?[-84,-34]:[-85,d.heel==='wedge'?-38:-37];
 const sprite=(name,point,w,rotation=0,h)=>{const im=sprites[name];if(!im)return;q.save();q.translate(point[0],point[1]);q.rotate(rotation);const height=h||w*im.naturalHeight/im.naturalWidth;q.drawImage(im,-w/2,-height/2,w,height);q.restore();};
 const band=()=>{
  // One constant-width satin strip, not a hooked arc. Each start is sewn into
  // the actual far collar; the outer end continues underneath its buckle.
  // Clipping to the immutable painting tucks the far cut edge into the shoe
  // silhouette instead of exposing a suspended pink cap above the opening.
  const strip=canvas(),b=strip.getContext('2d');
  const start=bandStart;
  const end=d.heel==='flat'?[60,53]:[58,62];
  const bridge=()=>{b.beginPath();b.moveTo(...start);b.bezierCurveTo(start[0]+36,start[1]+45,end[0]-32,end[1]-35,...end);};
  b.save();b.translate(...a.strap);b.lineCap='butt';b.lineJoin='round';
  const colour=COLORS[d.color]||COLORS.pink,shade=colour.match(/[a-f\d]{2}/gi).map(v=>Math.round(parseInt(v,16)*.70));
  bridge();b.strokeStyle='rgb('+shade.join(',')+')';b.lineWidth=56;b.stroke();
  const silk=b.createLinearGradient(-65,-28,57,58);
  silk.addColorStop(0,colour);silk.addColorStop(.27,'#fff1ed');silk.addColorStop(.47,colour);silk.addColorStop(1,colour);
  bridge();b.strokeStyle=silk;b.lineWidth=51;b.stroke();
  // Restrained continuous sheen follows the strip, with no detached arc line.
  bridge();b.strokeStyle='rgba(255,249,241,.22)';b.lineWidth=30;b.stroke();
  b.restore();clip(b,base);q.drawImage(strip,0,0);
  q.save();q.translate(...a.strap);
  // Raised outer gold frame, inset satin and a polished fastening tongue.
  q.save();q.translate(49,35);q.rotate(-.39);q.scale(1.6,1.6);
  q.shadowColor='rgba(76,38,45,.48)';q.shadowBlur=3;q.shadowOffsetY=2;
  q.fillStyle='#9b693c';q.beginPath();q.roundRect(-21,-17,42,35,8);q.fill();
  q.shadowColor='transparent';
  const gold=q.createLinearGradient(-19,-16,19,16);gold.addColorStop(0,'#fff2bf');gold.addColorStop(.4,'#e6c079');gold.addColorStop(.72,'#ad7943');gold.addColorStop(1,'#ffe6a7');
  q.strokeStyle=gold;q.lineWidth=5;q.beginPath();q.roundRect(-18,-14,36,29,6);q.stroke();
  q.fillStyle=colour;q.fillRect(-12,-8,24,17);q.strokeStyle='#ffedb2';q.lineWidth=3;q.beginPath();q.moveTo(0,-12);q.lineTo(0,14);q.moveTo(0,1);q.lineTo(13,1);q.stroke();
  q.restore();
  q.restore();
 };
 if(d.strap==='thin'||d.strap==='ribbon')band();
 if(d.strap==='pearl')sprite('pearls',a.strap,202,a.strapAngle,62);
 if(d.strap==='cross'){
  // Widen the lacing in the shoe's perspective. A rectangular enlargement
  // leaves its far eyelets floating and its loose ends below the sole.
  q.save();q.translate(a.lace[0],a.lace[1]);q.lineCap='round';
  const rows=[[[-88,-25],[132,-65]],[[-122,24],[158,-6]],[[-140,78],[172,57]]];
  const eyelet=([x,y])=>{
   q.save();q.translate(x,y);q.rotate(-.18);
   q.fillStyle='#9c714c';q.beginPath();q.ellipse(0,2,15,10,0,0,Math.PI*2);q.fill();
   const gold=q.createLinearGradient(-12,-8,10,8);gold.addColorStop(0,'#fff0be');gold.addColorStop(.5,'#d3ac65');gold.addColorStop(1,'#ad7c45');
   q.fillStyle=gold;q.beginPath();q.ellipse(0,0,14,9,0,0,Math.PI*2);q.fill();
   q.fillStyle='#9b6f78';q.beginPath();q.ellipse(0,0,7,4,0,0,Math.PI*2);q.fill();q.restore();
  };
  const cord=(from,to)=>{
   const path=()=>{q.beginPath();q.moveTo(...from);q.bezierCurveTo(from[0]+(to[0]-from[0])*.32,from[1]+8,to[0]-(to[0]-from[0])*.25,to[1]+9,...to);};
   for(const [width,color] of [[16,'#9d7382'],[12,'#ecc4d1'],[7,'#fff0e5']]){path();q.lineWidth=width;q.strokeStyle=color;q.stroke();}
  };
  rows.forEach(row=>row.forEach(eyelet));
  for(let i=0;i<rows.length-1;i++){cord(rows[i][0],rows[i+1][1]);cord(rows[i][1],rows[i+1][0]);}
  cord(rows[0][0],[115,-43]);cord(rows[0][1],[115,-43]);q.restore();
  sprite('bow',[a.lace[0]+115,a.lace[1]-43],150,-.18);
 }
 if(d.strap==='ribbon')sprite('bow',[a.strap[0]+54,a.strap[1]+42],151,-.16);
 const decor={small:['bow',260],big:['bow',370],drop:['drop',105],flower:['flower',172]}[d.decoration];
 // Spread the enlarged silk inward from its permanent counter mount. This
 // fixed per-option offset keeps the complete bow clear of the source edges.
 if(decor)sprite(decor[0],decor[0]==='bow'?[a.back[0]-50,a.back[1]+18]:a.back,decor[1],-.18);
 if(d.charm==='pearl')sprite('pearl',a.toe,118,-.12);
 if(d.charm==='crystal')sprite('crystal',a.toe,116,-.12);
 if(d.charm==='mini')sprite('bow',a.toe,186,-.12);
 const shadow=canvas(),s=shadow.getContext('2d');
 s.drawImage(layer,0,0);s.globalCompositeOperation='source-in';s.fillStyle='rgba(84,42,56,.42)';s.fillRect(0,0,WIDTH,HEIGHT);
 const contact=canvas(),c=contact.getContext('2d');
 c.filter='blur(5px)';c.drawImage(shadow,3,7);c.filter='blur(1.4px)';c.globalAlpha=.52;c.drawImage(shadow,1,2);c.filter='none';c.globalAlpha=1;
 clip(c,base);p.drawImage(contact,0,0);p.drawImage(layer,0,0);
 if(binding&&(d.strap==='thin'||d.strap==='ribbon')){
  // Restore the actual painted piping alpha, rather than an estimated seam
  // polygon, so the sewn far tab cannot leave a cream triangular crop edge.
  const seam=canvas(),edge=seam.getContext('2d'),x=a.strap[0]+bandStart[0],y=a.strap[1]+bandStart[1];
  edge.drawImage(base,0,0);clip(edge,binding);
  p.save();p.beginPath();p.ellipse(x-6,y-8,35,27,-.45,0,Math.PI*2);p.clip();p.drawImage(seam,0,0);p.restore();
 }
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
const api={mount,render,composite,preload:()=>Promise.allSettled(HEELS.flatMap(heel=>[load(heel),accessories(heel)])),anchors:ANCHORS,frame:Object.freeze({width:WIDTH,height:HEIGHT,toeX:96,groundY:540,length:832}),info:()=>({renderer:'painted-2d',cacheEntries:cache.size,cacheLimit:CACHE_LIMIT,loadedHeels:[...loads.keys()],fallbacks:Object.fromEntries(fallbacks),pendingComposites:jobs.size,perspectiveLayers:Object.fromEntries(Object.entries(perspectiveLayers).map(([heel,layers])=>[heel,Object.values(layers).filter(Boolean).length])),accessoryFallbacks:Object.fromEntries(accessoryFallbacks),tintMasks:Object.fromEntries(Object.entries(perspectiveTints).map(([heel,masks])=>[heel,Object.values(masks).filter(Boolean).length])),tintFallbacks:Object.fromEntries(tintFallbacks)})};
A.Shoe2D=api;globalThis.Shoe2D=api;
})(globalThis.SweetShoe=globalThis.SweetShoe||{});
