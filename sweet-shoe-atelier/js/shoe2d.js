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
let accessoryLoad,laceLoad,laceTile;
function loadLace(){return laceLoad||(laceLoad=image('assets/materials/lace_seamless.webp').then(im=>{laceTile=im;if(!im)laceLoad=null;return im;}));}
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
   // Cross lacing is drawn procedurally in both cameras. Its retired source
   // paintings are intentionally absent from the upload, so do not fetch them
   // or report a false legacy fallback when that renderer is available.
   const variants=Object.entries(ACCESSORY_OPTIONS).filter(([category])=>!dedicated||!(category==='strap'&&ownStyle?.builtInStrap)&&!(category==='decoration'&&(ownStyle?.openHeel||ownStyle?.noRearDecor))).flatMap(([category,values])=>values.filter(value=>!(category==='strap'&&value==='cross'&&A.AccessoryRenderer?.handles(category,value,'product'))).map(value=>category+'_'+value));
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
function drawRichMaterial(p,d,width,height,bounds=[0,0,width,height]){
 if(!['metallic','pearlescent','suede','brocade','pave'].includes(d.material))return;
 const [left,top,right,bottom]=bounds,projected=left!==0||top!==0||right!==width||bottom!==height;
 p.save();
 if(d.material==='pave'){
  // Small individually set crystals, rather than glitter flecks. Staggered
  // rows compress and bend over the vamp in each immutable source camera.
  const point=(x,y)=>[x-y*.13+Math.sin(y/height*Math.PI)*14,y*.84+Math.cos(x/width*Math.PI)*9];
  const polygon=(points,colour)=>{p.fillStyle=colour;p.beginPath();points.forEach(([x,y],i)=>i?p.lineTo(x,y):p.moveTo(x,y));p.closePath();p.fill();};
  for(let row=projected?Math.floor(top/.84/20)-3:-1;row<(projected?bottom/.84/20+4:height/20+4);row++)for(let col=projected?Math.floor((left+Math.min(top,bottom)*.16)/23)-4:-2;col<(projected?(right+Math.max(top,bottom)*.16)/23+9:width/23+9);col++){
   const [x,y]=point((col+(row&1)*.5)*23,row*20);
   const n=((row+3)*374761393^(col+3)*668265263)>>>0;
   p.save();p.translate(x,y);p.rotate(-.18);p.scale(1.25,.96);
   // Quiet metal seat and four opposed crown facets leave dyed cloth visible
   // between stones. Their stable highlights do not flicker when choosing.
   polygon([[0,-8.8],[7.4,0],[0,8.8],[-7.4,0]],'#705b7952');
   polygon([[0,-7.1],[6,0],[0,7.1],[-6,0]],'#e5e8f599');
   polygon([[0,-7.1],[6,0],[2.2,0],[0,-2.8]],'#fffbeded');
   polygon([[6,0],[0,7.1],[0,2.8],[2.2,0]],'#c4a5d87a');
   polygon([[0,7.1],[-6,0],[-2.2,0],[0,2.8]],'#fff9e2b8');
   polygon([[-6,0],[0,-7.1],[0,-2.8],[-2.2,0]],'#b8d7e49c');
   polygon([[0,-2.8],[2.2,0],[0,2.8],[-2.2,0]],'#fffdf6ed');
   if(n%17===0){p.strokeStyle='#fffdf4db';p.lineWidth=.85;p.beginPath();p.moveTo(-2.5,-5.3);p.lineTo(2.5,-5.3);p.moveTo(0,-7.8);p.lineTo(0,-2.8);p.stroke();}
   p.restore();
  }
  p.restore();return;
 }
 if(d.material==='suede'){
  // Short brushed fibres absorb light. Stable, tiny dashes follow the vamp;
  // they never turn into glitter points or a tiled photographic texture.
  const shade=p.createLinearGradient(0,height*.15,width,height*.9);
  for(const [at,c] of [[0,'#60465e14'],[.32,'#fff4e50a'],[.62,'#73536b0e'],[1,'#493e591d']])shade.addColorStop(at,c);
  p.fillStyle=shade;p.fillRect(left,top,right-left,bottom-top);
  p.lineWidth=.7;
  for(let row=projected?Math.floor(top/5)-1:0;row<(projected?bottom/5+1:height/5);row++)for(let col=projected?Math.floor(left/6)-1:0;col<(projected?right/6+1:width/6);col++){
   const n=((row+1)*374761393^(col+1)*668265263)>>>0;
   const x=col*6+(n%31)/8,y=row*5+((n>>>8)%23)/8;
   p.strokeStyle=n%3?'#fff4e717':'#57455c12';p.beginPath();p.moveTo(x,y);p.lineTo(x+1.8,y-.65);p.stroke();
  }
  p.restore();return;
 }
 if(d.material==='brocade'){
  // Tone-on-tone damask: raised woven petals and paired leaves, with the
  // same curved source projection in each camera and upper-only clipping.
  const point=(x,y)=>[x-y*.12+Math.sin(y/height*Math.PI)*13,y*.86+Math.cos(x/width*Math.PI)*8];
  p.fillStyle='#fff1d70b';p.fillRect(left,top,right-left,bottom-top);
  p.lineCap='round';p.lineJoin='round';
  for(let row=projected?Math.floor(top/.86/58)-2:-1;row<(projected?bottom/.86/58+3:height/58+2);row++)for(let col=projected?Math.floor((left+Math.min(top,bottom)*.15)/62)-3:-1;col<(projected?(right+Math.max(top,bottom)*.15)/62+4:width/62+4);col++){
   const [x,y]=point((col+(row%2)*.5)*62,row*58);
   p.save();p.translate(x,y);p.rotate(-.28);p.scale(1,.78);
   const flower=()=>{p.beginPath();for(let petal=0;petal<4;petal++){p.save();p.rotate(petal*Math.PI/2);p.moveTo(0,0);p.bezierCurveTo(-12,-11,-8,-25,0,-23);p.bezierCurveTo(8,-25,12,-11,0,0);p.restore();}p.moveTo(0,4);p.bezierCurveTo(-8,15,-13,16,-18,12);p.bezierCurveTo(-13,6,-5,7,0,4);p.moveTo(0,4);p.bezierCurveTo(8,15,13,16,18,12);p.bezierCurveTo(13,6,5,7,0,4);};
   p.translate(.9,1.2);flower();p.strokeStyle='#62476724';p.lineWidth=2.4;p.stroke();p.translate(-.9,-1.2);
   flower();p.fillStyle='#fff3dc30';p.fill();p.strokeStyle='#fff6dd7a';p.lineWidth=1.35;p.stroke();
   p.beginPath();p.moveTo(0,2);p.quadraticCurveTo(-3,15,0,24);p.strokeStyle='#fff6dd56';p.lineWidth=1;p.stroke();p.restore();
  }
  p.strokeStyle='#fff4df10';p.lineWidth=.55;
  for(let y=projected?Math.floor((top+left*.12)/3)*3:0;y<(projected?bottom+right*.12:height);y+=3){p.beginPath();p.moveTo(left,y-left*.12);p.lineTo(right,y-right*.12);p.stroke();}
  p.restore();return;
 }
 const g=p.createLinearGradient(width*.12,height*.86,width*.80,height*.15);
 if(d.material==='metallic'){
  for(const [at,colour] of [[0,'#3b284b40'],[.22,'#56415e20'],[.35,'#fff3cf28'],[.405,'#fffbea9c'],[.45,'#fffdf26e'],[.50,'#46334a38'],[.62,'#38263b25'],[.72,'#fff8df62'],[.76,'#fffdf293'],[.82,'#6e4d5b1c'],[1,'#3b284b30']])g.addColorStop(at,colour);
 }else{
  for(const [at,colour] of [[0,'#d4b8ed25'],[.22,'#a3e6db24'],[.38,'#fffbe56d'],[.48,'#fffdfb92'],[.57,'#efb5d832'],[.72,'#b7d3ef36'],[.83,'#fff8de55'],[1,'#d2b7e626']])g.addColorStop(at,colour);
 }
 p.fillStyle=g;p.fillRect(left,top,right-left,bottom-top);
 // Quiet directional brushing, never glitter or polka-dot texture.
 if(d.material==='metallic'){
  p.lineWidth=.55;p.strokeStyle='#fff8e112';
  for(let y=projected?Math.floor((top+left*.24)/4)*4:-height;y<(projected?bottom+right*.24:height*2);y+=4){p.beginPath();p.moveTo(left,y-left*.24);p.lineTo(right,y-right*.24);p.stroke();}
 }
 p.restore();
}
function drawRichPattern(p,d,width,height){
 if(!['rosebuds','diamonds','gingham','scallops','pinstripes'].includes(d.pattern))return;
 p.save();p.lineCap='round';p.lineJoin='round';
 if(d.pattern==='scallops'){
  // Fine shell embroidery follows the same soft vamp projection as the weave.
  // Each shell is one continuous sewn arc, with quieter inset running stitches.
  const step=52,point=(x,y)=>[x-y*.10+Math.sin(y/height*Math.PI)*12,y*.83+Math.cos(x/width*Math.PI)*9];
  const arc=(x,y,inset)=>{p.beginPath();for(let i=0;i<=20;i++){const a=Math.PI-i*Math.PI/20,v=point(x+step*.5+Math.cos(a)*(step*.5-inset),y+Math.sin(a)*(17-inset*.38));if(!i)p.moveTo(...v);else p.lineTo(...v);}};
  for(let row=-1;row<height/32+4;row++)for(let col=-3;col<width/step+5;col++){
   const x=(col+(row&1)*.5)*step,y=row*32;
   arc(x,y,0);p.strokeStyle='#674a651a';p.lineWidth=3.2;p.stroke();
   arc(x,y,0);p.strokeStyle='#fff6dfba';p.lineWidth=1.5;p.stroke();
   arc(x,y,6);p.strokeStyle='#fff6df73';p.lineWidth=.9;p.setLineDash([1.4,3.1]);p.stroke();p.setLineDash([]);
  }
 }else if(d.pattern==='pinstripes'){
  // Paired woven threads curve over the vamp, rather than tiling flat bars.
  const line=(offset,inset)=>{p.beginPath();for(let x=-48;x<=width+48;x+=16){const y=offset+x*.23+Math.sin(x/width*Math.PI)*15+inset;if(x===-48)p.moveTo(x,y);else p.lineTo(x,y);}};
  for(let y=-width*.3-48;y<height+48;y+=24){
   line(y,1.8);p.strokeStyle='#60465d1c';p.lineWidth=1;p.stroke();
   line(y,0);p.strokeStyle='#fff7e4b0';p.lineWidth=1.4;p.stroke();
   line(y,3.8);p.strokeStyle='#fff7e44a';p.lineWidth=.65;p.stroke();
  }
 }else if(d.pattern==='gingham'){
  // Interlaced cream warp/weft let the selected dye form the darker checks.
  // A single projected grid bends gently over the vamp without square tiles
  // escaping the camera-specific upper mask applied by the caller.
  const step=36,point=(x,y)=>[x-y*.10+Math.sin(y/height*Math.PI)*12,y*.83+Math.cos(x/width*Math.PI)*9];
  for(let row=-2;row<height/(step*.83)+3;row++)for(let col=-3;col<width/step+5;col++){
   const warp=(col&1)===0,weft=(row&1)===0;if(!warp&&!weft)continue;
   p.fillStyle=warp&&weft?'#fff8e99c':'#fff8e94a';p.beginPath();
   for(const [dx,dy] of [[0,0],[1,0],[1,1],[0,1]]){const [x,y]=point((col+dx)*step,(row+dy)*step);if(dx===0&&dy===0)p.moveTo(x,y);else p.lineTo(x,y);}p.closePath();p.fill();
  }
  // Fine, quiet yarn makes the crossings read as cloth at native zoom.
  p.lineWidth=.65;p.strokeStyle='#fff9ea15';
  for(let y=-step;y<height/.83+step;y+=4){p.beginPath();for(let x=-step;x<width+height*.12+step;x+=24){const v=point(x,y);if(x===-step)p.moveTo(...v);else p.lineTo(...v);}p.stroke();}
 }else if(d.pattern==='diamonds'){
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
// A textile has one stitch recipe in both cameras. Worn cloth uses an
// authored vamp-plane transform around the toe, independent of viewport size.
function textilePlane(p,camera){
 if(camera!=='worn')return;
 p.translate(344,884);p.rotate(-.48);p.scale(.76,.76);p.translate(-285,-432);
}
// Bound repeated art in inverse source coordinates instead of painting a
// 3072-square field. Padding retains whole petals/strokes at every edge.
function repeatExtent(p,width,height){
 const inverse=p.getTransform().inverse(),points=[[0,0],[width,0],[0,height],[width,height]].map(([x,y])=>inverse.transformPoint({x,y}));
 const left=Math.floor((Math.min(...points.map(v=>v.x))-80)/128)*128,top=Math.floor((Math.min(...points.map(v=>v.y))-80)/128)*128;
 const right=Math.max(...points.map(v=>v.x))+80,bottom=Math.max(...points.map(v=>v.y))+80;
 p.translate(left,top);return [Math.ceil(right-left),Math.ceil(bottom-top)];
}
function surfaceBounds(p,width,height){
 const inverse=p.getTransform().inverse(),corners=[[0,0],[width,0],[0,height],[width,height]].map(([x,y])=>inverse.transformPoint({x,y}));
 return [Math.floor(Math.min(...corners.map(v=>v.x))-80),Math.floor(Math.min(...corners.map(v=>v.y))-80),Math.ceil(Math.max(...corners.map(v=>v.x))+80),Math.ceil(Math.max(...corners.map(v=>v.y))+80)];
}
function drawTextile(p,d,width,height,camera='product'){
 if(!['lace','mesh'].includes(d.material))return;
 p.save();textilePlane(p,camera);
 // The rotated worn canvas needs extra source extent, including negative rows.
 // Translation keeps every repeat continuous through the visible upper.
 if(camera==='worn')[width,height]=repeatExtent(p,width,height);
 if(d.material==='mesh'){
  const colour=COLORS[d.color]||COLORS.pink;const channels=[1,3,5].map(offset=>Math.min(255,parseInt(colour.slice(offset,offset+2),16)+38));
  p.strokeStyle='rgba('+channels.join(',')+',.6)';p.lineWidth=1;
  for(let x=-height;x<width+height;x+=5){p.beginPath();p.moveTo(x,0);p.lineTo(x+height,height);p.moveTo(x,0);p.lineTo(x-height,height);p.stroke();}
 }else if(laceTile){
  const tile=camera==='worn'?420:280,pattern=p.createPattern(laceTile,'repeat');
  pattern.setTransform(new DOMMatrix().scale(tile/laceTile.naturalWidth));
  p.fillStyle=pattern;p.shadowColor='rgba(67,40,52,.36)';p.shadowOffsetY=1;p.shadowBlur=1;
  p.fillRect(0,0,width,height);

 }
 p.restore();
}
// Motifs retain the product camera's exact silhouette, opacity and repeat.
// A worn upper spans roughly 630 source pixels against the product's 832;
// the source-plane ratio prevents the same design becoming oversized checks.
function drawMotifs(p,d,width,height){
 const step=59,r=7;p.fillStyle='rgba(255,253,242,.80)';
 for(let row=0;row<height/step+1;row++)for(let col=-1;col<width/step+1;col++){
  p.save();p.translate((col+(row%2)*.5)*step,row*step);p.rotate(-.16);p.scale(1,.85);p.beginPath();
  if(d.pattern==='dots')p.arc(0,0,r*.65,0,Math.PI*2);
  else if(d.pattern==='hearts'){p.moveTo(0,r);p.bezierCurveTo(-r*2,-r*.4,-r,-r*1.7,0,-r*.4);p.bezierCurveTo(r,-r*1.7,r*2,-r*.4,0,r);}
  else if(d.pattern==='stars'){for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rad=i%2?r*.45:r;p.lineTo(Math.cos(a)*rad,Math.sin(a)*rad);}p.closePath();}
  else {for(let i=0;i<5;i++){const a=i*Math.PI*2/5;p.moveTo(Math.cos(a)*r*.45,Math.sin(a)*r*.45);p.ellipse(Math.cos(a)*r*.6,Math.sin(a)*r*.6,r*.55,r*.34,a,0,Math.PI*2);}}
  p.fill();p.restore();
 }
}
function drawPattern(p,d,width,height,camera='product'){
 if(d.pattern==='none')return;
 p.save();textilePlane(p,camera);
 if(camera==='worn')[width,height]=repeatExtent(p,width,height);
 if(['rosebuds','diamonds','gingham','scallops','pinstripes'].includes(d.pattern))drawRichPattern(p,d,width,height);
 else drawMotifs(p,d,width,height);
 p.restore();
}
// Both cameras show the same fabric: reflectance, fibre/glitter size and
// crystal spacing come from this one recipe. Only the fitted vamp plane turns.
function drawFinish(p,design,width,height,camera='product'){
 const type=design.material;
 if(type==='mesh'||type==='lace'){drawTextile(p,design,width,height,camera);return;}
 p.save();textilePlane(p,camera);
 const [left,top,right,bottom]=camera==='worn'?surfaceBounds(p,width,height):[0,0,width,height],projected=camera==='worn';
 p.lineCap='round';p.lineJoin='round';
 if(type==='satin'||type==='patent'){
  const g=p.createLinearGradient(130,530,730,80);
  // Patent has sharper, brighter reflected light; satin keeps its soft ribbons.
  const stops=type==='patent'?[[0,0],[.27,0],[.345,.10],[.365,.70],[.395,.55],[.455,0],[.65,0],[.705,.30],[.73,.10],[.77,0],[1,0]]:[[0,0],[.24,0],[.34,.12],[.39,.27],[.47,0],[.65,0],[.72,.09],[.79,0],[1,0]];
  for(const [stop,alpha] of stops)g.addColorStop(stop,'rgba(255,255,251,'+alpha+')');
  p.fillStyle=g;p.fillRect(left,top,right-left,bottom-top);
 }else if(type==='velvet'){
  // Pale velvet should retain its dye instead of taking on a grey-brown
  // cast. Dark velvet keeps the deeper nap; the same palette-aware recipe
  // is used by both cameras so a fitting still matches its display shoe.
  const velvetShade=design.color==='black'?.32:design.color==='rose'?.20:.08;
  p.fillStyle=`rgba(35,16,36,${velvetShade})`;p.fillRect(left,top,right-left,bottom-top);
  const nap=p.createLinearGradient(100,180,380,560);
  for(const [at,alpha] of [[0,0],[.24,0],[.34,.10],[.44,0],[.63,0],[.73,.075],[.84,0],[1,0]])nap.addColorStop(at,'rgba(255,238,245,'+alpha+')');
  p.fillStyle=nap;p.fillRect(left,top,right-left,bottom-top);
  for(let row=Math.floor(top/5);row<bottom/5;row++)for(let col=Math.floor(left/7);col<right/7;col++){
   let hash=Math.imul(row,374761393)^Math.imul(col,668265263);hash=Math.imul(hash^(hash>>>13),1274126177)>>>0;
   const x=col*7+(hash%70)/10,y=row*5+((hash>>>8)%50)/10;
   p.strokeStyle=hash&1?'rgba(255,235,244,.075)':'rgba(43,19,42,.075)';p.lineWidth=.65;
   p.beginPath();p.moveTo(x,y);p.lineTo(x+1.5+(hash%20)/10,y-.6);p.stroke();
  }
  if(camera==='worn'){
   // These cameras have differently painted light maps from the display
   // view. Balance only the affected velvet dyes, preserving fabric detail.
   const dark=design.color==='black'?({flat:.15,kitten:.08,wedge:.44,maryjane:.12}[design.heel]||0):design.heel==='wedge'&&design.color==='pink'?.07:0;
   const light=design.heel==='platform'&&['pink','cream'].includes(design.color)?.09:0;
   if(dark){p.fillStyle=`rgba(35,16,36,${dark})`;p.fillRect(left,top,right-left,bottom-top);}
   if(light){p.fillStyle=`rgba(255,248,245,${light})`;p.fillRect(left,top,right-left,bottom-top);}
  }
 }else if(type==='glitter'){
  for(let row=Math.floor(top/5);row<bottom/5;row++)for(let col=Math.floor(left/5);col<right/5;col++){
   let hash=Math.imul(row,374761393)^Math.imul(col,668265263);hash=Math.imul(hash^(hash>>>13),1274126177)>>>0;
   const x=col*5+(hash%50)/10,y=row*5+((hash>>>8)%50)/10,r=1.5+((hash>>>16)%13)/10;
   p.fillStyle=['rgba(76,35,61,.40)','rgba(155,85,104,.30)','rgba(255,223,218,.38)','rgba(255,245,231,.58)'][(hash>>>22)%4];
   p.beginPath();p.ellipse(x,y,r,r*(.65+((hash>>>20)%25)/100),-.3,0,Math.PI*2);p.fill();
   p.strokeStyle='rgba(255,255,244,.48)';p.lineWidth=.6;p.beginPath();p.arc(x,y,r*.72,3.5,5.5);p.stroke();
   if(hash%47===0){p.fillStyle='rgba(255,255,248,.95)';p.beginPath();p.arc(x-.5,y-.5,.85,0,Math.PI*2);p.fill();}
  }

 }
 drawRichMaterial(p,design,WIDTH,HEIGHT,[left,top,right,bottom]);p.restore();
}
function velvetRim(p,mask,width,height){
 const inner=document.createElement('canvas');inner.width=width;inner.height=height;const i=inner.getContext('2d');
 i.drawImage(mask,0,0,width,height);i.globalCompositeOperation='destination-in';
 for(const [dx,dy] of [[-11,0],[11,0],[0,-11],[0,11],[-8,-8],[8,-8],[-8,8],[8,8]])i.drawImage(mask,dx,dy,width,height);
 const rim=document.createElement('canvas');rim.width=width;rim.height=height;const q=rim.getContext('2d');
 q.drawImage(mask,0,0,width,height);q.globalCompositeOperation='destination-out';q.drawImage(inner,0,0);
 q.globalCompositeOperation='source-in';q.fillStyle='rgba(255,239,246,.26)';q.fillRect(0,0,width,height);
 const soft=document.createElement('canvas');soft.width=width;soft.height=height;const s=soft.getContext('2d');
 s.filter='blur(3px)';s.drawImage(rim,0,0);s.filter='none';s.globalCompositeOperation='destination-in';s.drawImage(mask,0,0,width,height);
 p.drawImage(soft,0,0);
}
function meshPanel(design,upper,width,height,camera='product',underlay='#e8d1b8',shadow=null,highlight=null){
 const make=()=>{const layer=document.createElement('canvas');layer.width=width;layer.height=height;return layer;};
 const mask=make(),m=mask.getContext('2d');m.drawImage(upper,0,0,width,height);
 for(const [dx,dy] of [[-8,0],[8,0],[0,-8],[0,8]]){m.globalCompositeOperation='destination-in';m.drawImage(upper,dx,dy,width,height);}
 m.globalCompositeOperation='destination-out';m.fillStyle='#fff';m.beginPath();
 if(camera==='worn'){m.moveTo(0,0);m.lineTo(240,0);m.bezierCurveTo(225,650,205,860,235,1024);}else{m.moveTo(0,0);m.lineTo(150,0);m.bezierCurveTo(160,300,135,460,155,640);}
 m.lineTo(0,height);m.closePath();m.fill();
 if(design.heel==='kitten'){
  m.beginPath();
  if(camera==='worn'){m.moveTo(694,754);m.lineTo(762,754);m.lineTo(762,860);m.lineTo(694,860);}
  else{m.moveTo(806,324);m.lineTo(855,324);m.lineTo(855,440);m.lineTo(806,440);}
  m.closePath();m.fill();
 }
 if(['block','platform','stiletto6','stiletto9'].includes(design.heel)){
  m.beginPath();
  if(camera==='worn'){m.moveTo(670,790);m.lineTo(810,710);m.lineTo(810,900);m.lineTo(670,900);}
  else{m.moveTo(740,395);m.lineTo(940,300);m.lineTo(940,520);m.lineTo(740,520);}
  m.closePath();m.fill();
 }
 if(design.heel==='bootie'){
  m.beginPath();
  if(camera==='worn'){
   m.moveTo(0,0);m.lineTo(width,0);m.lineTo(width,710);m.bezierCurveTo(730,710,650,680,570,700);m.bezierCurveTo(490,720,420,770,360,800);m.lineTo(0,800);
  }else{
   m.moveTo(0,0);m.lineTo(width,0);m.lineTo(width,345);m.bezierCurveTo(790,345,690,315,610,335);m.bezierCurveTo(520,355,455,400,390,420);m.lineTo(0,420);
  }
  m.closePath();m.fill();
  m.beginPath();
  if(camera==='worn'){m.moveTo(660,780);m.lineTo(810,680);m.lineTo(810,900);m.lineTo(660,900);}
  else{m.moveTo(740,405);m.lineTo(940,300);m.lineTo(940,520);m.lineTo(740,520);}
  m.closePath();m.fill();
 }
 if(design.heel==='loafer'){
  m.beginPath();
  if(camera==='worn'){m.moveTo(319,775);m.quadraticCurveTo(345,735,369,718);m.bezierCurveTo(431,719,511,764,568,819);m.lineTo(514,860);m.bezierCurveTo(459,815,384,777,319,775);}
  else{m.moveTo(305,349);m.lineTo(370,290);m.bezierCurveTo(435,310,505,367,547,421);m.lineTo(443,460);m.bezierCurveTo(404,411,352,365,305,349);}
  m.closePath();m.fill();
 }
 const layer=make(),p=layer.getContext('2d');p.fillStyle=underlay;p.fillRect(0,0,width,height);
 const shade=p.createLinearGradient(0,camera==='worn'?650:300,0,camera==='worn'?960:540);
 shade.addColorStop(0,'rgba(58,34,38,.22)');shade.addColorStop(.38,'rgba(255,244,224,.12)');shade.addColorStop(1,'rgba(52,31,38,.28)');p.fillStyle=shade;p.fillRect(0,0,width,height);
 if(camera==='worn'){
  for(let index=0;index<4;index++){
   const x=250+index*32,y=900-index*10,g=p.createRadialGradient(x,y,0,x,y,24);
   g.addColorStop(0,'rgba(255,245,226,.15)');g.addColorStop(1,'rgba(255,245,226,0)');p.fillStyle=g;p.fillRect(x-24,y-24,48,48);
  }
 }
 const bareMesh=camera==='worn'&&underlay==='#f2c7b0';
 if(bareMesh){
  // A warm, softly modelled instep reads through the mesh. The long highlight
  // follows the foot rather than the rectangular bounds of the upper mask.
  const form=p.createRadialGradient(425,825,20,425,825,260);form.addColorStop(0,'rgba(255,245,225,.32)');form.addColorStop(1,'rgba(100,51,47,.22)');p.fillStyle=form;p.fillRect(0,0,width,height);
  p.save();p.translate(465,805);p.rotate(-.27);p.scale(1,.34);
  const instep=p.createRadialGradient(0,0,8,0,0,190);instep.addColorStop(0,'rgba(255,244,222,.43)');instep.addColorStop(.55,'rgba(255,235,213,.20)');instep.addColorStop(1,'rgba(255,235,213,0)');p.fillStyle=instep;p.fillRect(-190,-190,380,380);p.restore();
 }
 // Reduce the shoe-colour veil by one third so the warm underlay reads more
 // clearly while retaining the chosen colour and the separate opaque trim.
 p.globalAlpha=bareMesh?.20:.4;p.fillStyle=COLORS[design.color]||COLORS.pink;p.fillRect(0,0,width,height);p.globalAlpha=1;
 if(shadow){p.globalAlpha=bareMesh?.65:.8;p.drawImage(shadow,0,0,width,height);p.globalAlpha=1;}
 if(highlight){p.globalAlpha=bareMesh?.42:.55;p.drawImage(highlight,0,0,width,height);p.globalAlpha=1;}
 drawTextile(p,design,width,height,camera);p.globalCompositeOperation='destination-in';p.drawImage(mask,0,0);
 if(design.heel==='bootie'){
  const trim=make(),t=trim.getContext('2d');t.beginPath();
  if(camera==='worn'){t.moveTo(360,800);t.bezierCurveTo(420,770,490,720,570,700);t.bezierCurveTo(650,680,730,710,width,710);}
  else{t.moveTo(390,420);t.bezierCurveTo(455,400,520,355,610,335);t.bezierCurveTo(690,315,790,345,width,345);}
  t.lineCap='round';t.lineJoin='round';t.strokeStyle='rgba(74,38,47,.65)';t.lineWidth=5;t.stroke();
  t.strokeStyle=COLORS[design.color]||COLORS.pink;t.lineWidth=3;t.stroke();
  t.globalCompositeOperation='destination-in';t.drawImage(upper,0,0,width,height);p.globalCompositeOperation='source-over';p.drawImage(trim,0,0);
 }
 return layer;
}
function laceTrim(p,mask,design,width,height,camera='product'){
 if(design.material!=='lace'||!['kitten','loafer'].includes(design.heel))return;
 const probe=document.createElement('canvas');probe.width=width;probe.height=height;
 const q=probe.getContext('2d',{willReadFrequently:true});q.drawImage(mask,0,0,width,height);
 const data=q.getImageData(0,0,width,height).data;
 const bounds=camera==='product'?(design.heel==='kitten'?[310,860]:[540,885]):(design.heel==='kitten'?[320,735]:[550,735]);
 p.save();p.lineWidth=1.5;p.strokeStyle='rgba(255,250,231,.9)';p.lineCap='round';
 for(let x=bounds[0];x<bounds[1];x+=8){
  let y=0;while(y<height&&data[(y*width+x)*4+3]<180)y++;
  if(y>=height)continue;
  p.beginPath();p.arc(x,y+3,3,0,Math.PI);p.stroke();
 }
 p.restore();
}
function loaferLaceSaddle(p,design,camera='product'){
 if(design.heel!=='loafer'||design.material!=='lace')return;
 p.save();p.lineCap='round';p.lineJoin='round';p.strokeStyle='rgba(71,39,42,.46)';p.lineWidth=1.5;
 p.shadowColor='rgba(51,28,30,.30)';p.shadowBlur=3;p.shadowOffsetY=2;
 p.beginPath();
 if(camera==='worn'){
  p.moveTo(319,775);p.bezierCurveTo(384,777,459,815,514,860);p.lineTo(568,819);
  p.moveTo(369,718);p.bezierCurveTo(431,719,511,764,568,819);
 }else{
  p.moveTo(305,349);p.bezierCurveTo(352,365,404,411,443,460);p.lineTo(547,421);
  p.moveTo(370,290);p.bezierCurveTo(435,310,505,367,547,421);
 }
 p.stroke();p.restore();
}
A.CoutureFinish=Object.freeze({drawMaterial:drawRichMaterial,drawPattern,drawTextile,drawFinish,velvetRim,meshPanel,loadLace,laceTrim,loaferLaceSaddle});
function materialLayer(design,upper){
 const out=canvas(),p=out.getContext('2d');drawFinish(p,design,WIDTH,HEIGHT);
 clip(p,upper);laceTrim(p,upper,design,WIDTH,HEIGHT);loaferLaceSaddle(p,design);if(design.material==='velvet')velvetRim(p,upper,WIDTH,HEIGHT);return out;
}
function patternLayer(design,upper){
 if(design.pattern==='none')return null;
 const out=canvas(),p=out.getContext('2d');
 drawPattern(p,design,WIDTH,HEIGHT);clip(p,upper);return out;
}

async function composite(input){
 const design=clean(input),id=key(design);
 if(cache.has(id)){const hit=cache.get(id);cache.delete(id);cache.set(id,hit);return hit;}
 if(jobs.has(id))return jobs.get(id);
 const job=Promise.all([load(design.heel),accessories(design.heel),design.decoration==='puffy'?A.AccessoryRenderer?.loadPuffy():null,design.material==='lace'?loadLace():null]).then(([parts,sprites])=>{
  const out=canvas(),p=out.getContext('2d'),tint=canvas(),q=tint.getContext('2d');
  if(!parts.upper){p.drawImage(parts.base,0,0);cache.set(id,out);while(cache.size>CACHE_LIMIT)cache.delete(cache.keys().next().value);return out;}
  q.drawImage(parts.upper,0,0);q.globalCompositeOperation='source-in';q.fillStyle=COLORS[design.color]||COLORS.pink;q.fillRect(0,0,WIDTH,HEIGHT);
  q.globalCompositeOperation='source-atop';q.globalAlpha=['velvet','suede'].includes(design.material)?.80:.72;if(parts.shadow)q.drawImage(parts.shadow,0,0);
  q.globalAlpha=design.material==='suede'?.08:design.material==='velvet'?.16:design.material==='mesh'?.34:design.material==='brocade'?.42:.78;if(parts.highlight)q.drawImage(parts.highlight,0,0);q.globalAlpha=1;
  p.drawImage(parts.base,0,0);
  // source-atop preserves the original destination alpha exactly; fabrics and
  // motifs cannot grow the outline or paint into a cream footbed/sole.
  p.globalCompositeOperation='source-atop';p.drawImage(tint,0,0);if(design.material==='mesh')p.drawImage(meshPanel(design,parts.upper,WIDTH,HEIGHT,'product','#e8d1b8',parts.shadow,parts.highlight),0,0);else p.drawImage(materialLayer(design,parts.upper),0,0);
  const pattern=patternLayer(design,parts.upper);if(pattern)p.drawImage(pattern,0,0);
  p.globalCompositeOperation='source-over';
  if(design.heel==='loafer'){
   // Fill the narrow exposed base-colour fringe between the tinted upper
   // and the welt with adjacent shaded upper pixels; preserve the sole edge.
   const repair=canvas(),rp=repair.getContext('2d');rp.drawImage(out,0,0);
   p.save();p.beginPath();p.moveTo(750,440);p.lineTo(780,429);p.lineTo(800,422);p.lineTo(830,416);p.lineTo(860,409);p.lineTo(890,400);p.lineTo(915,389);p.lineTo(915,394);p.lineTo(890,405);p.lineTo(860,415);p.lineTo(830,423);p.lineTo(800,430);p.lineTo(780,435);p.lineTo(750,443);p.closePath();p.clip();p.drawImage(repair,0,9);p.restore();
   p.save();p.lineCap='round';p.lineJoin='round';
   if(design.material==='satin'){
    // The painted saddle is recoloured with the upper; its lower edge used to
    // dissolve into a translucent blur. Restore a continuous, opaque seam in
    // a shade of the chosen leather, with a separate restrained contact shadow.
    const saddleEdge=()=>{p.beginPath();p.moveTo(314,348);p.bezierCurveTo(354,343,415,405,443,460);p.quadraticCurveTo(447,461,451,459);p.lineTo(544,435);};
    p.save();p.shadowColor='rgba(57,27,30,.35)';p.shadowBlur=2;p.shadowOffsetY=2;
    p.strokeStyle='rgba(57,27,30,.28)';p.lineWidth=2;saddleEdge();p.stroke();p.restore();
    const colour=COLORS[design.color]||COLORS.pink;
    const rgb=colour.match(/[a-f\d]{2}/gi).map(v=>Math.round(parseInt(v,16)*.60));
    p.strokeStyle=`rgb(${rgb.join(',')})`;p.lineWidth=1.5;saddleEdge();p.stroke();
   }
   p.restore();
  }
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
 if(options.pair){p.drawImage(source,x+w*.10,y-h*.02,w*.87,h*.87);p.drawImage(source,x-w*.06,y+h*.035,w,h);}
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
