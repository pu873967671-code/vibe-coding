'use strict';
(function(A){
const {cleanDesign,defaults,option,themes,categories,t}=A;
// Artwork metadata stays inline so the renderer also works from file://.
const SHOE_ANCHORS={"shoe_block_cross":{"w":900,"h":491,"toe":[0.13,0.789],"back":[0.9,0.07]},"shoe_block_none":{"w":900,"h":492,"toe":[0.13,0.794],"back":[0.9,0.066]},"shoe_block_pearl":{"w":900,"h":535,"toe":[0.13,0.82],"back":[0.9,0.077]},"shoe_block_ribbon":{"w":900,"h":568,"toe":[0.13,0.838],"back":[0.9,0.076]},"shoe_block_thin":{"w":900,"h":521,"toe":[0.13,0.817],"back":[0.9,0.066]},"shoe_flat_cross":{"w":900,"h":291,"toe":[0.13,0.687],"back":[0.9,0.101]},"shoe_flat_none":{"w":900,"h":262,"toe":[0.13,0.636],"back":[0.9,0.098]},"shoe_flat_pearl":{"w":900,"h":353,"toe":[0.13,0.702],"back":[0.9,0.077]},"shoe_flat_ribbon":{"w":900,"h":465,"toe":[0.13,0.821],"back":[0.9,0.137]},"shoe_flat_thin":{"w":900,"h":344,"toe":[0.13,0.744],"back":[0.9,0.086]},"shoe_kitten_cross":{"w":900,"h":434,"toe":[0.13,0.786],"back":[0.9,0.078]},"shoe_kitten_none":{"w":900,"h":409,"toe":[0.13,0.776],"back":[0.9,0.092]},"shoe_kitten_pearl":{"w":900,"h":482,"toe":[0.13,0.792],"back":[0.9,0.079]},"shoe_kitten_ribbon":{"w":900,"h":523,"toe":[0.13,0.834],"back":[0.9,0.066]},"shoe_kitten_thin":{"w":900,"h":485,"toe":[0.13,0.816],"back":[0.9,0.087]},"shoe_wedge_cross":{"w":900,"h":432,"toe":[0.13,0.762],"back":[0.9,0.076]},"shoe_wedge_none":{"w":900,"h":452,"toe":[0.13,0.76],"back":[0.9,0.1]},"shoe_wedge_pearl":{"w":900,"h":534,"toe":[0.13,0.785],"back":[0.9,0.062]},"shoe_wedge_ribbon":{"w":900,"h":540,"toe":[0.13,0.796],"back":[0.9,0.099]},"shoe_wedge_thin":{"w":900,"h":502,"toe":[0.13,0.791],"back":[0.9,0.064]}};
const ASSET_NAMES=[...Object.keys(SHOE_ANCHORS),'bow','pearl_drop','flower','charm_pearl','charm_crystal','charm_minibow',...['satin','velvet','glitter','mesh','lace'].map(x=>'tex_'+x),...['flower','heart','star'].map(x=>'motif_'+x),...themes.flatMap(x=>['neutral','happy','sad'].map(e=>x.asset+'_'+e)),...Object.keys(categories).map(x=>'icon_'+x),'icon_coin','icon_star','icon_heart','icon_clock','icon_gift','bg_shop','pedestal','box_closed','box_open','confetti','sparkle','logo',...['flat','block','kitten','wedge'].flatMap(h=>['legs/leg_'+h,'legs/mask_'+h,'legs/calf_'+h])];
const TONE_NAMES=[...Object.keys(SHOE_ANCHORS),...['flat','block','kitten','wedge'].flatMap(h=>['leg_'+h,h+'_front34_shade',h+'_top_shade'])];
ASSET_NAMES.push(...TONE_NAMES.flatMap(n=>['tones/'+n+'_tone','tones/'+n+'_gleam']),...['flat','block','kitten','wedge'].flatMap(h=>['front34','top'].flatMap(v=>['angles/'+h+'_'+v+'_legs','angles/'+h+'_'+v+'_shade'])));
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
function tile(name,size=150){const im=imageOK(name);if(!im)return null;const c=makeCanvas(size,size),ctx=c.getContext('2d');ctx.drawImage(im,0,0,size,size);return c;}
// Lift shadows before tinting; highlight maps restore the painted satin sheen.
// All source luminance is prepared offline, with no runtime pixel reads.
function luminous(ctx,name,color,x,y,w,h){
 const tone=imageOK('tones/'+name+'_tone'),gleam=imageOK('tones/'+name+'_gleam');
 if(!tone)return false;
 ctx.drawImage(tone,x,y,w,h);ctx.globalCompositeOperation='multiply';ctx.fillStyle=color;ctx.fillRect(x,y,w,h);
 ctx.globalCompositeOperation='destination-in';ctx.drawImage(tone,x,y,w,h);
 if(gleam){ctx.globalCompositeOperation='screen';ctx.drawImage(gleam,x,y,w,h);}
 ctx.globalCompositeOperation='source-over';return true;
}
function finishFabric(b,d,w,h){
 const texture=tile('tex_'+d.material,d.material==='glitter'?120:100);
 if(texture){b.globalCompositeOperation=d.material==='glitter'?'screen':'soft-light';b.globalAlpha={satin:.09,velvet:.23,glitter:.24,mesh:.17,lace:.25}[d.material];b.fillStyle=b.createPattern(texture,'repeat');b.fillRect(0,0,w,h);b.globalAlpha=1;}
 if(d.pattern!=='none'){
  const motif=makeCanvas(100,100),m=motif.getContext('2d'),im=imageOK('motif_'+{flowers:'flower',hearts:'heart',stars:'star'}[d.pattern]);
  if(d.pattern==='dots'){m.fillStyle='#fff9e9';m.beginPath();m.arc(25,25,5,0,Math.PI*2);m.arc(75,75,5,0,Math.PI*2);m.fill();}else if(im)m.drawImage(im,22,22,36,36);
  b.globalCompositeOperation='source-atop';b.globalAlpha=.65;b.fillStyle=b.createPattern(motif,'repeat');b.fillRect(0,0,w,h);b.globalAlpha=1;
 }
 b.globalCompositeOperation='source-over';
}
function composite(d){
 d=cleanDesign(d);const key='shoe:'+designKey(d),hit=cached(key);if(hit)return hit;
 const out=makeCanvas(1000,660),ctx=out.getContext('2d'),layout=shoeLayout(d),{x,y,width:w,height:h}=layout,base=imageOK(layout.asset)||imageOK('shoe_flat_none');
 if(!base)return out;
 const body=makeCanvas(1000,660),b=body.getContext('2d'),color=option('color',d.color)[3];
 if(!luminous(b,layout.asset,color,x,y,w,h))b.drawImage(base,x,y,w,h);
 finishFabric(b,{...d,pattern:'none'},1000,660);
 if(d.pattern!=='none'){
  const motif=makeCanvas(100,100),m=motif.getContext('2d'),name={flowers:'flower',hearts:'heart',stars:'star'}[d.pattern],im=imageOK('motif_'+name);
  if(d.pattern==='dots'){m.fillStyle='#fff7e5';m.beginPath();m.arc(25,25,5,0,Math.PI*2);m.arc(75,75,5,0,Math.PI*2);m.fill();}
  else if(im){m.globalAlpha=.85;m.drawImage(im,18,18,30,30);m.drawImage(im,65,65,23,23);}
  b.save();b.beginPath();b.moveTo(x,y);b.lineTo(x+w,y);b.lineTo(x+w,y+h*.65);b.lineTo(x+w*.70,y+h*.72);b.lineTo(x+w*.38,y+h*.88);b.lineTo(x,y+h*.90);b.closePath();b.clip();b.globalCompositeOperation='source-atop';b.globalAlpha=.66;b.fillStyle=b.createPattern(motif,'repeat');b.fillRect(x,y,w,h);b.restore();
 }
 b.globalCompositeOperation='destination-in';b.drawImage(base,x,y,w,h);b.globalCompositeOperation='source-over';
 ctx.globalAlpha=d.material==='mesh'?.84:1;ctx.drawImage(body,0,0);ctx.globalAlpha=1;
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
 const calf=imageOK('legs/calf_'+d.heel);if(calf)ctx.drawImage(calf,0,0);else ctx.drawImage(leg,0,0,leg.naturalWidth,2,0,0,leg.naturalWidth,stem);ctx.drawImage(leg,0,stem);if(!luminous(b,'leg_'+d.heel,option('color',d.color)[3],0,stem,leg.naturalWidth,leg.naturalHeight))b.drawImage(leg,0,stem);
 finishFabric(b,d,out.width,out.height);
 b.globalCompositeOperation='destination-in';b.drawImage(mask,0,stem);ctx.drawImage(body,0,0);
 const anchors={flat:{toe:[170,487],back:[1100,326],ankle:[940,240]},block:{toe:[170,710],back:[1100,300],ankle:[940,220]},kitten:{toe:[170,535],back:[1100,200],ankle:[940,150]},wedge:{toe:[170,685],back:[1095,330],ankle:[940,230]}}[d.heel];
 for(const point of Object.values(anchors))point[1]+=stem;
 const [ax,ay]=anchors.ankle;
 if(d.strap!=='none'){
  ctx.save();ctx.strokeStyle=option('color',d.color)[3];ctx.lineWidth=22;ctx.lineCap='round';ctx.shadowColor='#68413455';ctx.shadowBlur=5;
  const strap=(y,tilt=0)=>{ctx.beginPath();ctx.moveTo(ax-120,y-tilt);ctx.quadraticCurveTo(ax,y+35,ax+95,y+tilt);ctx.stroke();};
  if(d.strap==='cross'){strap(ay-8,35);strap(ay+12,-35);}else strap(ay);
  if(d.strap==='pearl'){ctx.shadowBlur=2;for(let i=0;i<11;i++){ctx.fillStyle=i%2?'#e6dac5':'#fff9eb';ctx.beginPath();ctx.arc(ax-112+i*20,ay+12+Math.sin(i/10*Math.PI)*13,11,0,Math.PI*2);ctx.fill();}}
  ctx.restore();
 }
 function sprite(id,point,width){const im=imageOK(id);if(!im)return;ctx.save();ctx.shadowColor='#63403744';ctx.shadowBlur=6;ctx.shadowOffsetY=4;ctx.drawImage(im,point[0]-width/2,point[1]-width*.3,width,width*im.naturalHeight/im.naturalWidth);ctx.restore();}
 if(d.strap==='ribbon')sprite('bow',[ax+70,ay],165);
 const decor={small:['bow',140],big:['bow',240],drop:['pearl_drop',65],flower:['flower',170]}[d.decoration];if(decor)sprite(decor[0],anchors.back,decor[1]);
 const charm={pearl:'charm_pearl',crystal:'charm_crystal',mini:'charm_minibow'}[d.charm];if(charm)sprite(charm,anchors.toe,d.charm==='mini'?120:85);
 return remember(key,out);
}
// Extra-angle sources already contain the pair, with matching painted skin.
function angleComposite(d,angle){
 syncAssets();d=cleanDesign(d);const key='angle:'+angle+':'+designKey(d),hit=cached(key);if(hit)return hit;
 const name=d.heel+'_'+angle,legs=imageOK('angles/'+name+'_legs'),shade=imageOK('angles/'+name+'_shade');
 if(!legs||!shade)return wornComposite(d);
 const out=makeCanvas(legs.naturalWidth,legs.naturalHeight),ctx=out.getContext('2d'),body=makeCanvas(out.width,out.height),b=body.getContext('2d');
 ctx.drawImage(legs,0,0);luminous(b,name+'_shade',option('color',d.color)[3],0,0,out.width,out.height);finishFabric(b,d,out.width,out.height);
 b.globalCompositeOperation='destination-in';b.drawImage(shade,0,0);ctx.drawImage(body,0,0);
 const anchors={flat:{front34:[[.23,.78],[.70,.82]],top:[[.38,.78],[.68,.78]]},block:{front34:[[.23,.75],[.70,.80]],top:[[.35,.78],[.66,.78]]},kitten:{front34:[[.23,.76],[.70,.80]],top:[[.40,.78],[.69,.78]]},wedge:{front34:[[.26,.75],[.70,.80]],top:[[.41,.79],[.72,.79]]}}[d.heel][angle];
 function sprite(id,x,y,size){const im=imageOK(id);if(!im)return;const w=out.width*size;ctx.save();ctx.shadowColor='#593d422d';ctx.shadowBlur=4;ctx.drawImage(im,x-w/2,y-w*.3,w,w*im.naturalHeight/im.naturalWidth);ctx.restore();}
 for(const [px,py] of anchors){const x=px*out.width,y=py*out.height;
  if(d.strap!=='none'){ctx.save();ctx.strokeStyle=option('color',d.color)[3];ctx.lineWidth=out.width*.012;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x-out.width*.07,y-out.height*.09);ctx.quadraticCurveTo(x,y-out.height*.07,x+out.width*.065,y-out.height*.09);ctx.stroke();
   if(d.strap==='cross'){ctx.beginPath();ctx.moveTo(x-out.width*.06,y-out.height*.12);ctx.lineTo(x+out.width*.06,y-out.height*.06);ctx.stroke();}
   if(d.strap==='pearl')for(let i=0;i<7;i++){ctx.fillStyle='#fff8e5';ctx.beginPath();ctx.arc(x+out.width*(-.06+i*.02),y-out.height*.085,out.width*.009,0,Math.PI*2);ctx.fill();}ctx.restore();
   if(d.strap==='ribbon')sprite('bow',x,y-out.height*.09,.11);
  }
  const decor={small:['bow',.10],big:['bow',.16],drop:['pearl_drop',.05],flower:['flower',.12]}[d.decoration];if(decor)sprite(decor[0],x,y-out.height*.035,decor[1]);
  const charm={pearl:'charm_pearl',crystal:'charm_crystal',mini:'charm_minibow'}[d.charm];if(charm)sprite(charm,x,y+out.height*.055,.065);
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
