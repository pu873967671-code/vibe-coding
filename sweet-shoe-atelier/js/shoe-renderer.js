'use strict';
(function(A){
const {cleanDesign,defaults,option,themes,categories,t}=A;
// Artwork metadata stays inline so the renderer also works from file://.
const SHOE_ANCHORS={"shoe_block_cross":{"w":900,"h":491,"toe":[0.13,0.789],"back":[0.9,0.07]},"shoe_block_none":{"w":900,"h":492,"toe":[0.13,0.794],"back":[0.9,0.066]},"shoe_block_pearl":{"w":900,"h":535,"toe":[0.13,0.82],"back":[0.9,0.077]},"shoe_block_ribbon":{"w":900,"h":568,"toe":[0.13,0.838],"back":[0.9,0.076]},"shoe_block_thin":{"w":900,"h":521,"toe":[0.13,0.817],"back":[0.9,0.066]},"shoe_flat_cross":{"w":900,"h":291,"toe":[0.13,0.687],"back":[0.9,0.101]},"shoe_flat_none":{"w":900,"h":262,"toe":[0.13,0.636],"back":[0.9,0.098]},"shoe_flat_pearl":{"w":900,"h":353,"toe":[0.13,0.702],"back":[0.9,0.077]},"shoe_flat_ribbon":{"w":900,"h":465,"toe":[0.13,0.821],"back":[0.9,0.137]},"shoe_flat_thin":{"w":900,"h":344,"toe":[0.13,0.744],"back":[0.9,0.086]},"shoe_kitten_cross":{"w":900,"h":434,"toe":[0.13,0.786],"back":[0.9,0.078]},"shoe_kitten_none":{"w":900,"h":409,"toe":[0.13,0.776],"back":[0.9,0.092]},"shoe_kitten_pearl":{"w":900,"h":482,"toe":[0.13,0.792],"back":[0.9,0.079]},"shoe_kitten_ribbon":{"w":900,"h":523,"toe":[0.13,0.834],"back":[0.9,0.066]},"shoe_kitten_thin":{"w":900,"h":485,"toe":[0.13,0.816],"back":[0.9,0.087]},"shoe_wedge_cross":{"w":900,"h":432,"toe":[0.13,0.762],"back":[0.9,0.076]},"shoe_wedge_none":{"w":900,"h":452,"toe":[0.13,0.76],"back":[0.9,0.1]},"shoe_wedge_pearl":{"w":900,"h":534,"toe":[0.13,0.785],"back":[0.9,0.062]},"shoe_wedge_ribbon":{"w":900,"h":540,"toe":[0.13,0.796],"back":[0.9,0.099]},"shoe_wedge_thin":{"w":900,"h":502,"toe":[0.13,0.791],"back":[0.9,0.064]}};
const ASSET_NAMES=[...Object.keys(SHOE_ANCHORS),'bow','pearl_drop','flower','charm_pearl','charm_crystal','charm_minibow',...['satin','velvet','glitter','mesh','lace'].map(x=>'tex_'+x),...['flower','heart','star'].map(x=>'motif_'+x),...themes.flatMap(x=>['neutral','happy','sad'].map(e=>x.asset+'_'+e)),...Object.keys(categories).map(x=>'icon_'+x),'icon_coin','icon_star','icon_heart','icon_clock','icon_gift','bg_shop','pedestal','box_closed','box_open','confetti','sparkle','logo',...['flat','block','kitten','wedge'].flatMap(h=>['legs/leg_'+h,'legs/mask_'+h,'legs/calf_'+h])];
const TONE_NAMES=[...Object.keys(SHOE_ANCHORS),...['flat','block','kitten','wedge'].flatMap(h=>['leg_'+h,h+'_front34_shade',h+'_top_shade'])];
ASSET_NAMES.push(...TONE_NAMES.flatMap(n=>['tones/'+n+'_tone','tones/'+n+'_gleam']),...['flat','block','kitten','wedge'].flatMap(h=>['front34','top'].flatMap(v=>['angles/'+h+'_'+v+'_legs','angles/'+h+'_'+v+'_shade'])));
ASSET_NAMES.push(...['flat','block','kitten','wedge'].flatMap(h=>['relaxed','crossed','step','seated'].flatMap(p=>['poses/'+h+'_'+p+'_legs','poses/'+h+'_'+p+'_shade','tones/'+h+'_'+p+'_shade_tone','tones/'+h+'_'+p+'_shade_gleam'])));
ASSET_NAMES.push(...Object.keys(A.FABRIC_REGIONS||{}).flatMap(n=>['fabrics/'+n+'_upper','fabrics/'+n+'_edge']));
A.POSE_ANCHORS={"block_crossed":[[0.375,0.7917771883289124],[0.66875,0.7718832891246684]],"block_relaxed":[[0.78125,0.7562326869806094],[0.40208333333333335,0.8213296398891967]],"block_step":[[0.7916666666666666,0.8512747875354107],[0.24375,0.7039660056657224]],"flat_crossed":[[0.7208333333333333,0.8356545961002786],[0.41041666666666665,0.8245125348189415]],"flat_relaxed":[[0.7708333333333334,0.7569444444444444],[0.425,0.8555555555555555]],"flat_step":[[0.7875,0.8456284153005464],[0.27291666666666664,0.6721311475409836]],"kitten_crossed":[[0.4708333333333333,0.7746835443037975],[0.76875,0.779746835443038]],"kitten_relaxed":[[0.7604166666666666,0.7702349869451697],[0.32083333333333336,0.839425587467363]],"kitten_step":[[0.8041666666666667,0.8218232044198895],[0.23125,0.6850828729281768]],"wedge_crossed":[[0.46458333333333335,0.8027777777777778],[0.7395833333333334,0.7708333333333334]],"wedge_relaxed":[[0.6375,0.7395287958115183],[0.475,0.8232984293193717]],"wedge_step":[[0.8166666666666667,0.8457142857142858],[0.20208333333333334,0.7257142857142858]],"block_seated":[[0.42,0.86],[0.62,0.86]],"flat_seated":[[0.57,0.87],[0.74,0.86]],"kitten_seated":[[0.7,0.87],[0.87,0.85]],"wedge_seated":[[0.59,0.83],[0.77,0.82]]};
function designKey(d){d=cleanDesign(d);return Object.keys(defaults).map(k=>d[k]).join('|');}
function shoeLayout(d){d=cleanDesign(d);const asset='shoe_'+d.heel+'_'+d.strap,a=SHOE_ANCHORS[asset],width=820,height=a.h/a.w*width,x=70,y=550-height;return {asset,x,y,width,height,toe:[x+a.toe[0]*width,y+a.toe[1]*height],back:[x+a.back[0]*width,y+a.back[1]*height]};}
// Markup is pure; canvases are populated only in the browser after preload.
function shoeCanvas(d){return `<canvas class="shoe-canvas" data-design="${designKey(d)}" role="img" aria-label="${Object.keys(defaults).map(k=>option(k,cleanDesign(d)[k])[1]).join(', ')}"></canvas>`;}

function createShoeRenderer(images){
// Share a bounded LRU across studio and worn artwork. A worn source is ~6 MiB;
// retaining dozens of these on a phone costs far more than rebuilding a cold design.
const composites=new Map(),painted=new WeakMap(),cacheBudget=24*1024*1024;let cacheBytes=0;
function cached(key){const value=composites.get(key);if(value){composites.delete(key);composites.set(key,value);}return value;}
function remember(key,canvas){
 const bytes=canvas.width*canvas.height*4;
 while(composites.size&&cacheBytes+bytes>cacheBudget){const oldest=composites.keys().next().value,old=composites.get(oldest);cacheBytes-=old.width*old.height*4;composites.delete(oldest);}
 if(bytes<=cacheBudget){composites.set(key,canvas);cacheBytes+=bytes;}return canvas;
}
let imageCount=images.size;
function syncAssets(){if(imageCount!==images.size){imageCount=images.size;composites.clear();cacheBytes=0;}}
function imageOK(name){const im=images.get(name);return im?.naturalWidth?im:null;}
function makeCanvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
// Lift shadows before tinting; highlight maps restore the painted satin sheen.
// All source luminance is prepared offline, with no runtime pixel reads.
function luminous(ctx,name,color,x,y,w,h,material='satin'){
 const tone=imageOK('tones/'+name+'_tone'),gleam=imageOK('tones/'+name+'_gleam');
 if(!tone)return false;
 ctx.drawImage(tone,x,y,w,h);ctx.globalCompositeOperation='multiply';ctx.fillStyle=color;ctx.fillRect(x,y,w,h);
 ctx.globalCompositeOperation='destination-in';ctx.drawImage(tone,x,y,w,h);
 if(gleam){ctx.globalCompositeOperation='screen';ctx.globalAlpha=material==='velvet'?.12:material==='mesh'?.12:material==='lace'?.38:1;ctx.drawImage(gleam,x,y,w,h);ctx.globalAlpha=1;}
 ctx.globalCompositeOperation='source-over';return true;
}
// Each material and motif uses one upper-only mask. Original shade maps light
// the details, while original edge pixels restore piping/contact at the collar.
function finishFabric(b,d,w,h,source){
 const {name,x=0,y=0,width=w,height=h}=source,upper=imageOK('fabrics/'+name+'_upper'),tone=imageOK('tones/'+name+'_tone');
 const layer=makeCanvas(w,h),p=layer.getContext('2d'),regions=A.FABRIC_REGIONS?.[name]||[[0,0,1,1]];
 for(const [rx,ry,rw,rh] of regions){
  const bx=x+rx*width,by=y+ry*height,bw=rw*width,bh=rh*height,unit=Math.max(4,bw/16);
  p.save();p.translate(bx,by);
  if(d.material==='satin'){
   // Two clean directional ribbons; no photographic/noise texture.
   const g=p.createLinearGradient(0,bh*.1,bw,bh*.9);
   for(const [at,alpha] of [[0,0],[.23,0],[.34,.34],[.44,0],[.65,0],[.74,.15],[.83,0],[1,0]])g.addColorStop(at,`rgba(255,253,241,${alpha})`);
   p.fillStyle=g;p.fillRect(0,0,bw,bh);
  }else if(d.material==='velvet'){
   p.fillStyle='rgba(99,46,69,.09)';p.fillRect(0,0,bw,bh);
   p.strokeStyle='rgba(255,244,229,.12)';p.lineWidth=.6;
   for(let yy=0;yy<bh;yy+=2.8){p.beginPath();p.moveTo(0,yy);p.lineTo(bw,yy-bh*.1);p.stroke();}
  }else if(d.material==='mesh'){
   // Diamond perforations stay visible at fitting scale; the interior is matte.
   const pitch=Math.max(3.8,bw/29);
   for(let row=0;row<Math.ceil(bh/pitch)+1;row++)for(let col=-1;col<31;col++){
    const px=(col+(row%2)*.5)*pitch,py=row*pitch;
    p.beginPath();p.moveTo(px,py-pitch*.30);p.lineTo(px+pitch*.24,py);p.lineTo(px,py+pitch*.30);p.lineTo(px-pitch*.24,py);p.closePath();
    p.fillStyle='rgba(83,49,61,.48)';p.fill();
    p.strokeStyle='rgba(255,253,240,.5)';p.lineWidth=Math.max(.55,pitch*.10);p.stroke();
   }
  }else if(d.material==='lace'){
   // Fine open scallops, much smaller and quieter than the chosen motif.
   const pitch=Math.max(5,bw/21);
   p.strokeStyle='rgba(255,252,235,.30)';p.lineWidth=Math.max(.55,pitch*.045);
   for(let row=0;row<Math.ceil(bh/pitch)+1;row++)for(let col=-1;col<23;col++){
    const px=(col+(row%2)*.5)*pitch,py=row*pitch;
    p.beginPath();p.arc(px,py,pitch*.37,.12,Math.PI-.12);p.stroke();
    p.beginPath();p.arc(px,py+pitch*.10,pitch*.25,.12,Math.PI-.12);p.stroke();
   }
  }else if(d.material==='glitter'){
   for(let row=0;row<Math.ceil(bh/unit)+1;row++)for(let col=0;col<17;col++){
    const px=(col+(row%2)*.5)*unit,py=row*unit;
    const seed=(row*73+col*37)%101,dx=seed/101*unit,dy=(seed*17%101)/101*unit;
    p.fillStyle=seed%3?'rgba(255,253,237,.9)':'rgba(255,219,156,.65)';p.beginPath();p.arc(px+dx,py+dy,unit*(seed%7===0?.12:.05),0,Math.PI*2);p.fill();
    if(seed%19===0){p.strokeStyle='#fffef0';p.lineWidth=.8;p.beginPath();p.moveTo(px+dx-unit*.23,py+dy);p.lineTo(px+dx+unit*.23,py+dy);p.moveTo(px+dx,py+dy-unit*.23);p.lineTo(px+dx,py+dy+unit*.23);p.stroke();}
   }
  }
  p.restore();
 }
 function lightAndClip(){
  if(tone){const coverage=makeCanvas(w,h);coverage.getContext('2d').drawImage(layer,0,0);p.globalCompositeOperation='multiply';p.drawImage(tone,x,y,width,height);p.globalCompositeOperation='destination-in';p.drawImage(coverage,0,0);}
  p.globalCompositeOperation='destination-in';p.drawImage(upper||tone,x,y,width,height);
  p.globalCompositeOperation='source-over';
 }
 if(upper||tone){lightAndClip();b.save();b.globalCompositeOperation='source-atop';b.drawImage(layer,0,0);b.restore();}
 if(d.pattern!=='none'&&upper){
  p.clearRect(0,0,w,h);
  for(const [rx,ry,rw,rh] of regions){
   const bx=x+rx*width,by=y+ry*height,bw=rw*width,bh=rh*height,step=Math.max(9,bw/8);
   p.save();p.translate(bx,by);p.fillStyle='#fff9e7';p.strokeStyle='#fff9e7';p.lineWidth=Math.max(1,step*.055);
   for(let row=0;row<Math.ceil(bh/step)+1;row++)for(let col=-1;col<10;col++){
    const v=row*step/bh,curve=Math.sin(v*Math.PI)*step*.24,px=(col+(row%2)*.5)*step+curve,py=row*step;
    p.save();p.translate(px,py);p.scale(.72+.25*Math.sin(v*Math.PI),1);p.rotate(name.includes('_top_')?0:-.22);const r=step*.15;
    p.beginPath();
    if(d.pattern==='dots')p.arc(0,0,r*.72,0,Math.PI*2);
    else if(d.pattern==='hearts'){p.moveTo(0,r);p.bezierCurveTo(-r*2,-r*.3,-r,-r*1.5,0,-r*.4);p.bezierCurveTo(r,-r*1.5,r*2,-r*.3,0,r);}
    else if(d.pattern==='stars'){for(let n=0;n<10;n++){const a=-Math.PI/2+n*Math.PI/5,rr=n%2?r*.44:r;p.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);}p.closePath();}
    else {for(let n=0;n<5;n++){const a=n*Math.PI*2/5;p.moveTo(Math.cos(a)*r*.5,Math.sin(a)*r*.5);p.ellipse(Math.cos(a)*r*.65,Math.sin(a)*r*.65,r*.55,r*.35,a,0,Math.PI*2);}}
    p.fill();p.restore();
   }p.restore();
  }
  lightAndClip();b.save();b.globalCompositeOperation='source-atop';b.globalAlpha=d.material==='lace'?.90:.68;b.drawImage(layer,0,0);b.restore();
 }
 if(d.material==='lace'&&upper){
  p.clearRect(0,0,w,h);
  for(const [rx,ry,rw,rh] of regions){
   const bx=x+rx*width,by=y+ry*height,bw=rw*width,bh=rh*height,pitch=Math.max(5,bw/21);
   p.strokeStyle='rgba(255,252,235,.85)';p.lineWidth=Math.max(1,pitch*.12);
   for(let yy=by;yy<by+bh;yy+=pitch)for(let xx=bx;xx<bx+bw;xx+=pitch){p.beginPath();p.arc(xx,yy,pitch*.40,0,Math.PI);p.stroke();}
  }
  // Subtract the inset mask: the lace trim hugs the collar and upper perimeter.
  p.globalCompositeOperation='destination-in';const trim=imageOK('fabrics/'+name+'_edge');
  if(trim){p.drawImage(trim,x,y,width,height);p.globalCompositeOperation='source-over';b.save();b.globalCompositeOperation='source-atop';b.drawImage(layer,0,0);b.restore();}
 }
 const edge=imageOK('fabrics/'+name+'_edge');
 if(edge){b.save();b.globalCompositeOperation='source-atop';b.drawImage(edge,x,y,width,height);b.restore();}
 b.globalCompositeOperation='source-over';
}
function composite(d){
 d=cleanDesign(d);const key='shoe:'+designKey(d),hit=cached(key);if(hit)return hit;
 const out=makeCanvas(1000,660),ctx=out.getContext('2d'),layout=shoeLayout(d),{x,y,width:w,height:h}=layout,base=imageOK(layout.asset)||imageOK('shoe_flat_none');
 if(!base)return out;
 const body=makeCanvas(1000,660),b=body.getContext('2d'),color=option('color',d.color)[3];
 if(!luminous(b,layout.asset,color,x,y,w,h,d.material))b.drawImage(base,x,y,w,h);
 finishFabric(b,d,1000,660,{name:layout.asset,x,y,width:w,height:h});
 b.globalCompositeOperation='destination-in';b.drawImage(base,x,y,w,h);b.globalCompositeOperation='source-over';
 ctx.drawImage(body,0,0);
 function sprite(name,anchor,width){const im=imageOK(name);if(!im)return;const height=width*im.naturalHeight/im.naturalWidth;ctx.save();ctx.shadowColor='#50313b44';ctx.shadowBlur=7;ctx.shadowOffsetY=5;ctx.drawImage(im,anchor[0]-width/2,anchor[1]-height*.38,width,height);ctx.restore();}
 const decor={small:['bow',.14],big:['bow',.25],drop:['pearl_drop',.055],flower:['flower',.16]}[d.decoration];if(decor)sprite(decor[0],layout.back,w*decor[1]);
 const charm={pearl:'charm_pearl',crystal:'charm_crystal',mini:'charm_minibow'}[d.charm];if(charm)sprite(charm,layout.toe,w*(d.charm==='mini'?.11:.075));
 return remember(key,out);
}
// Self-contained fashion silhouette: missing/network-blocked legs must never become floating shoes.
function fallbackWorn(d){
 const out=makeCanvas(1200,1811),ctx=out.getContext('2d');ctx.translate(0,461);const skin=ctx.createLinearGradient(710,0,1050,0);
 skin.addColorStop(0,'#d39b7f');skin.addColorStop(.48,'#f5d0b7');skin.addColorStop(1,'#d8a086');
 ctx.fillStyle=skin;ctx.beginPath();ctx.moveTo(720,-461);ctx.lineTo(1020,-461);ctx.bezierCurveTo(1040,350,940,750,1005,1000);ctx.bezierCurveTo(1100,1090,1080,1180,960,1200);ctx.lineTo(180,1215);ctx.quadraticCurveTo(100,1160,220,1125);ctx.bezierCurveTo(540,1090,790,985,790,830);ctx.bezierCurveTo(790,600,700,310,720,0);ctx.fill();
 // Draw the designed shoe on the complete fallback foot, with its opening at the ankle.
 const source=composite({...d,strap:'none'}),layout=shoeLayout({...d,strap:'none'});
 ctx.drawImage(source,layout.x,layout.y,layout.width,layout.height,90,1040,1030,260);
 return out;
}
// The offline mask contains only neutral satin: skin and natural soles are untouched.
function wornComposite(d){
 syncAssets();d=cleanDesign(d);const key='worn:'+designKey(d),hit=cached(key);if(hit)return hit;
 const leg=imageOK('legs/leg_'+d.heel),mask=imageOK('legs/mask_'+d.heel);
 if(!leg)return fallbackWorn(d);
 if(!mask){const out=makeCanvas(leg.naturalWidth,leg.naturalHeight+1200),ctx=out.getContext('2d');const calf=imageOK('legs/calf_'+d.heel);if(calf)ctx.drawImage(calf,0,0);else ctx.drawImage(leg,0,0,leg.naturalWidth,2,0,0,leg.naturalWidth,1200);ctx.drawImage(leg,0,1200);return remember(key,out);}
 const stem=1200,out=makeCanvas(leg.naturalWidth,leg.naturalHeight+stem),ctx=out.getContext('2d'),body=makeCanvas(out.width,out.height),b=body.getContext('2d');
 const calf=imageOK('legs/calf_'+d.heel);if(calf)ctx.drawImage(calf,0,0);else ctx.drawImage(leg,0,0,leg.naturalWidth,2,0,0,leg.naturalWidth,stem);ctx.drawImage(leg,0,stem);if(!luminous(b,'leg_'+d.heel,option('color',d.color)[3],0,stem,leg.naturalWidth,leg.naturalHeight,d.material))b.drawImage(leg,0,stem);
 finishFabric(b,d,out.width,out.height,{name:'leg_'+d.heel,y:stem,width:leg.naturalWidth,height:leg.naturalHeight});
 b.globalCompositeOperation='destination-in';b.drawImage(mask,0,stem);ctx.drawImage(body,0,0);
 const anchors={flat:{toe:[170,487],back:[1100,326],ankle:[940,240]},block:{toe:[170,710],back:[1100,300],ankle:[940,220]},kitten:{toe:[170,535],back:[1100,200],ankle:[940,150]},wedge:{toe:[170,685],back:[1095,330],ankle:[940,230]}}[d.heel];
 for(const point of Object.values(anchors))point[1]+=stem;
 const [ax,ay]=anchors.ankle;
 if(d.strap!=='none'){
  const layer=makeCanvas(out.width,out.height),strapCtx=layer.getContext('2d');strapCtx.save();strapCtx.strokeStyle=option('color',d.color)[3];strapCtx.lineWidth=18;strapCtx.lineCap='round';strapCtx.shadowColor='#68413455';strapCtx.shadowBlur=5;
  const strap=(y,tilt=0)=>{strapCtx.beginPath();strapCtx.moveTo(ax-92,y-tilt);strapCtx.quadraticCurveTo(ax,y+35,ax+72,y+tilt);strapCtx.stroke();};
  if(d.strap==='cross'){strap(ay-8,35);strap(ay+12,-35);}else strap(ay);
  if(d.strap==='pearl'){strapCtx.shadowBlur=2;for(let i=0;i<11;i++){strapCtx.fillStyle=i%2?'#e6dac5':'#fff9eb';strapCtx.beginPath();strapCtx.arc(ax-112+i*20,ay+12+Math.sin(i/10*Math.PI)*13,11,0,Math.PI*2);strapCtx.fill();}}
  strapCtx.restore();strapCtx.globalCompositeOperation='destination-in';strapCtx.drawImage(leg,0,stem);ctx.drawImage(layer,0,0);
 }
 function sprite(id,point,width){const im=imageOK(id);if(!im)return;ctx.save();ctx.shadowColor='#63403744';ctx.shadowBlur=6;ctx.shadowOffsetY=4;ctx.drawImage(im,point[0]-width/2,point[1]-width*.3,width,width*im.naturalHeight/im.naturalWidth);ctx.restore();}
 if(d.strap==='ribbon')sprite('bow',[ax+56,ay],130);
 const decor={small:['bow',140],big:['bow',240],drop:['pearl_drop',65],flower:['flower',170]}[d.decoration];if(decor)sprite(decor[0],anchors.back,decor[1]);
 const charm={pearl:'charm_pearl',crystal:'charm_crystal',mini:'charm_minibow'}[d.charm];if(charm)sprite(charm,anchors.toe,d.charm==='mini'?120:85);
 return remember(key,out);
}
// Extra-angle sources already contain the pair, with matching painted skin.
function angleComposite(d,angle){
 syncAssets();d=cleanDesign(d);const key='angle:'+angle+':'+designKey(d),hit=cached(key);if(hit)return hit;
 // Car poses share the dedicated bent-knee painting; never remap calves.
 if(angle.startsWith('seated_'))angle='seated';
 const natural=['relaxed','crossed','step','seated'].includes(angle),folder=natural?'poses/':'angles/',name=d.heel+'_'+angle,legs=imageOK(folder+name+'_legs'),shade=imageOK(folder+name+'_shade');
 if(!legs||!shade)return angle==='seated'?angleComposite(d,'relaxed'):wornComposite(d);
 const out=makeCanvas(legs.naturalWidth,legs.naturalHeight),ctx=out.getContext('2d'),body=makeCanvas(out.width,out.height),b=body.getContext('2d');
 // Authored sole contacts live in source coordinates, so shadows follow every
 // heel, seated pose, zoom and room crop together with the painted anatomy.
 if(angle==='seated'){
  const contacts={flat:[[.58,.928,.23],[.75,.899,.17]],block:[[.405,.928,.25],[.655,.909,.23]],kitten:[[.72,.925,.24],[.895,.908,.17]],wedge:[[.59,.907,.25],[.79,.894,.21]]}[d.heel];
  for(const [x,y,width] of contacts){
   ctx.save();ctx.translate(x*out.width,y*out.height);ctx.scale(width*out.width,.022*out.height);
   const soft=ctx.createRadialGradient(0,0,0,0,0,1);soft.addColorStop(0,'#38251d70');soft.addColorStop(.35,'#49302548');soft.addColorStop(1,'#49302500');
   ctx.fillStyle=soft;ctx.beginPath();ctx.ellipse(0,0,1,1,0,0,Math.PI*2);ctx.fill();ctx.restore();
  }
 }
 ctx.drawImage(legs,0,0);if(!luminous(b,name+'_shade',option('color',d.color)[3],0,0,out.width,out.height,d.material)){b.drawImage(shade,0,0);b.globalCompositeOperation='source-in';b.fillStyle=option('color',d.color)[3];b.fillRect(0,0,out.width,out.height);b.globalCompositeOperation='source-over';}finishFabric(b,d,out.width,out.height,{name:name+'_shade'});
 b.globalCompositeOperation='destination-in';b.drawImage(shade,0,0);ctx.drawImage(body,0,0);
 const anchors=natural?(A.POSE_ANCHORS[name]||[[.28,.82],[.7,.82]]):{flat:{front34:[[.23,.78],[.70,.82]],top:[[.38,.78],[.68,.78]]},block:{front34:[[.23,.75],[.70,.80]],top:[[.35,.78],[.66,.78]]},kitten:{front34:[[.23,.76],[.70,.80]],top:[[.40,.78],[.69,.78]]},wedge:{front34:[[.26,.75],[.70,.80]],top:[[.41,.79],[.72,.79]]}}[d.heel][angle];
 function sprite(id,x,y,size){const im=imageOK(id);if(!im)return;const w=out.width*size;ctx.save();ctx.shadowColor='#593d422d';ctx.shadowBlur=4;ctx.drawImage(im,x-w/2,y-w*.3,w,w*im.naturalHeight/im.naturalWidth);ctx.restore();}
 for(const [px,py] of anchors){const x=px*out.width,y=py*out.height;
  if(d.strap!=='none'){const strapCanvas=makeCanvas(out.width,out.height),strapCtx=strapCanvas.getContext('2d');strapCtx.save();strapCtx.strokeStyle=option('color',d.color)[3];strapCtx.lineWidth=out.width*.012;strapCtx.lineCap='round';strapCtx.beginPath();strapCtx.moveTo(x-out.width*.07,y-out.height*.025);strapCtx.quadraticCurveTo(x,y-out.height*.015,x+out.width*.065,y-out.height*.025);strapCtx.stroke();
   if(d.strap==='cross'){strapCtx.beginPath();strapCtx.moveTo(x-out.width*.06,y-out.height*.04);strapCtx.lineTo(x+out.width*.06,y+out.height*.005);strapCtx.stroke();}
   if(d.strap==='pearl')for(let i=0;i<7;i++){strapCtx.fillStyle='#fff8e5';strapCtx.beginPath();strapCtx.arc(x+out.width*(-.06+i*.02),y-out.height*.02,out.width*.009,0,Math.PI*2);strapCtx.fill();}strapCtx.restore();strapCtx.globalCompositeOperation='destination-in';strapCtx.drawImage(shade,0,0);ctx.drawImage(strapCanvas,0,0);
   if(d.strap==='ribbon')sprite('bow',x,y-out.height*.015,.09);
  }
  const decor={small:['bow',.10],big:['bow',.16],drop:['pearl_drop',.05],flower:['flower',.12]}[d.decoration];if(decor)sprite(decor[0],x,y-out.height*.01,decor[1]);
  const charm={pearl:'charm_pearl',crystal:'charm_crystal',mini:'charm_minibow'}[d.charm];if(charm)sprite(charm,x,y+out.height*.025,.05);
 }
 return remember(key,out);
}
function hydrateCanvases(root=document){root.querySelectorAll('canvas[data-design]').forEach(c=>{
 // Layout width excludes pose/zoom transforms. Resizing a rotated shoe must not
 // inflate its backing store or repeatedly soften the same artwork.
 let width=c.clientWidth;const ratio=Math.min(3,Math.min(2,window.devicePixelRatio||1)*(c.closest('.zoomed')?1.5:1));if(!width||!c.getClientRects().length)return;
 let w=Math.max(1,Math.round(width*ratio));const key=(c.dataset.angle?'angle:'+c.dataset.angle+':':c.hasAttribute('data-worn')?'worn:':'shoe:')+c.dataset.design,previous=painted.get(c);
 if(previous?.assetCount===images.size&&previous?.key===key&&previous.width===w&&c.width===w&&c.height===previous.height)return;
 const parts=c.dataset.design.split('|'),d=Object.fromEntries(Object.keys(defaults).map((k,i)=>[k,parts[i]])),source=c.dataset.angle?angleComposite(d,c.dataset.angle):c.hasAttribute('data-worn')?wornComposite(d):composite(d);
 let h=Math.round(w*source.height/source.width);
 if(c.hasAttribute('data-worn')||c.dataset.angle){c.parentElement.style.setProperty('--foot-aspect',source.width/source.height);width=c.clientWidth;w=Math.max(1,Math.round(width*ratio));h=Math.round(w*source.height/source.width);}
 c.width=w;c.height=h;const ctx=c.getContext('2d');ctx.imageSmoothingQuality='high';ctx.drawImage(source,0,0,w,h);painted.set(c,{key,width:w,height:h,assetCount:images.size});
});}

return {hydrateCanvases,wornComposite,composite,angleComposite};
}
Object.assign(A,{SHOE_ANCHORS,ASSET_NAMES,designKey,shoeLayout,shoeCanvas,createShoeRenderer});
})(globalThis.SweetShoe = globalThis.SweetShoe || {});
