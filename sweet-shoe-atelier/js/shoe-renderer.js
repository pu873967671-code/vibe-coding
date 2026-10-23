'use strict';
(function(A){
const {cleanDesign,defaults,option,themes,categories,t}=A;
// Artwork metadata stays inline so the renderer also works from file://.
const SHOE_ANCHORS={"shoe_block_cross":{"w":900,"h":491,"toe":[0.13,0.789],"back":[0.9,0.07]},"shoe_block_none":{"w":900,"h":492,"toe":[0.13,0.794],"back":[0.9,0.066]},"shoe_block_pearl":{"w":900,"h":535,"toe":[0.13,0.82],"back":[0.9,0.077]},"shoe_block_ribbon":{"w":900,"h":568,"toe":[0.13,0.838],"back":[0.9,0.076]},"shoe_block_thin":{"w":900,"h":521,"toe":[0.13,0.817],"back":[0.9,0.066]},"shoe_flat_cross":{"w":900,"h":291,"toe":[0.13,0.687],"back":[0.9,0.101]},"shoe_flat_none":{"w":900,"h":262,"toe":[0.13,0.636],"back":[0.9,0.098]},"shoe_flat_pearl":{"w":900,"h":353,"toe":[0.13,0.702],"back":[0.9,0.077]},"shoe_flat_ribbon":{"w":900,"h":465,"toe":[0.13,0.821],"back":[0.9,0.137]},"shoe_flat_thin":{"w":900,"h":344,"toe":[0.13,0.744],"back":[0.9,0.086]},"shoe_kitten_cross":{"w":900,"h":434,"toe":[0.13,0.786],"back":[0.9,0.078]},"shoe_kitten_none":{"w":900,"h":409,"toe":[0.13,0.776],"back":[0.9,0.092]},"shoe_kitten_pearl":{"w":900,"h":482,"toe":[0.13,0.792],"back":[0.9,0.079]},"shoe_kitten_ribbon":{"w":900,"h":523,"toe":[0.13,0.834],"back":[0.9,0.066]},"shoe_kitten_thin":{"w":900,"h":485,"toe":[0.13,0.816],"back":[0.9,0.087]},"shoe_wedge_cross":{"w":900,"h":432,"toe":[0.13,0.762],"back":[0.9,0.076]},"shoe_wedge_none":{"w":900,"h":452,"toe":[0.13,0.76],"back":[0.9,0.1]},"shoe_wedge_pearl":{"w":900,"h":534,"toe":[0.13,0.785],"back":[0.9,0.062]},"shoe_wedge_ribbon":{"w":900,"h":540,"toe":[0.13,0.796],"back":[0.9,0.099]},"shoe_wedge_thin":{"w":900,"h":502,"toe":[0.13,0.791],"back":[0.9,0.064]}};
const ASSET_NAMES=[...Object.keys(SHOE_ANCHORS),'bow','pearl_drop','flower','charm_pearl','charm_crystal','charm_minibow',...['satin','velvet','glitter','mesh','lace'].map(x=>'tex_'+x),...['flower','heart','star'].map(x=>'motif_'+x),...themes.flatMap(x=>['neutral','happy','sad'].map(e=>x.asset+'_'+e)),...Object.keys(categories).map(x=>'icon_'+x),'icon_coin','icon_star','icon_heart','icon_clock','icon_gift','bg_shop','pedestal','box_closed','box_open','confetti','sparkle','logo',...['flat','block','kitten','wedge'].flatMap(h=>['legs/leg_'+h,'legs/mask_'+h])];
function designKey(d){d=cleanDesign(d);return Object.keys(defaults).map(k=>d[k]).join('|');}
function shoeLayout(d){d=cleanDesign(d);const asset='shoe_'+d.heel+'_'+d.strap,a=SHOE_ANCHORS[asset],width=820,height=a.h/a.w*width,x=70,y=550-height;return {asset,x,y,width,height,toe:[x+a.toe[0]*width,y+a.toe[1]*height],back:[x+a.back[0]*width,y+a.back[1]*height]};}
// Markup is pure; canvases are populated only in the browser after preload.
function shoeCanvas(d){return `<canvas class="shoe-canvas" data-design="${designKey(d)}" role="img" aria-label="${Object.keys(defaults).map(k=>option(k,cleanDesign(d)[k])[1]).join(', ')}"></canvas>`;}

function createShoeRenderer(images){
const composites=new Map();
function imageOK(name){const im=images.get(name);return im?.naturalWidth?im:null;}
function makeCanvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function tile(name,size=150){const im=imageOK(name);if(!im)return null;const c=makeCanvas(size,size),ctx=c.getContext('2d');ctx.drawImage(im,0,0,size,size);return c;}
function composite(d){
 const key=designKey(d);if(composites.has(key)){const cached=composites.get(key);composites.delete(key);composites.set(key,cached);return cached;}
 const out=makeCanvas(1000,660),ctx=out.getContext('2d'),layout=shoeLayout(d),{x,y,width:w,height:h}=layout,base=imageOK(layout.asset)||imageOK('shoe_flat_none');
 if(!base)return out;
 const body=makeCanvas(1000,660),b=body.getContext('2d'),color=option('color',d.color)[3];
 b.drawImage(base,x,y,w,h);b.globalCompositeOperation='multiply';b.fillStyle=color;b.fillRect(x,y,w,h);
 b.globalCompositeOperation='destination-in';b.drawImage(base,x,y,w,h);
 // Keep the hand-painted satin folds, including a little sheen on midnight.
 b.globalCompositeOperation='screen';b.globalAlpha=d.material==='velvet'?.035:d.color==='black'?.08:.15;b.drawImage(base,x,y,w,h);b.globalAlpha=1;
 const texture=tile('tex_'+d.material,d.material==='glitter'?240:180);
 if(texture){b.globalCompositeOperation=d.material==='glitter'?'screen':d.material==='velvet'?'multiply':'source-atop';b.globalAlpha={satin:.13,velvet:.45,glitter:.4,mesh:.4,lace:.52}[d.material];b.fillStyle=b.createPattern(texture,'repeat');b.fillRect(x,y,w,h);b.globalAlpha=1;}
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
 composites.set(key,out);if(composites.size>32)composites.delete(composites.keys().next().value);return out;
}
// The offline mask contains only neutral satin: skin and natural soles are untouched.
function wornComposite(d){
 const leg=imageOK('legs/leg_'+d.heel),mask=imageOK('legs/mask_'+d.heel);
 if(!leg||!mask)return composite(d);
 const stem=600,out=makeCanvas(leg.naturalWidth,leg.naturalHeight+stem),ctx=out.getContext('2d'),body=makeCanvas(out.width,out.height),b=body.getContext('2d');
 ctx.drawImage(leg,0,0,leg.naturalWidth,2,0,0,leg.naturalWidth,stem);ctx.drawImage(leg,0,stem);b.drawImage(leg,0,stem);
 b.globalCompositeOperation='multiply';b.fillStyle=option('color',d.color)[3];b.fillRect(0,0,out.width,out.height);
 b.globalCompositeOperation='screen';b.globalAlpha=d.color==='black'?.08:.13;b.drawImage(leg,0,stem);b.globalAlpha=1;
 const texture=tile('tex_'+d.material,180);
 if(texture){b.globalCompositeOperation=d.material==='glitter'?'screen':'multiply';b.globalAlpha={satin:.12,velvet:.4,glitter:.5,mesh:.18,lace:.45}[d.material];b.fillStyle=b.createPattern(texture,'repeat');b.fillRect(0,0,out.width,out.height);b.globalAlpha=1;}
 if(d.pattern!=='none'){
  const motif=makeCanvas(110,110),m=motif.getContext('2d'),im=imageOK('motif_'+{flowers:'flower',hearts:'heart',stars:'star'}[d.pattern]);
  if(d.pattern==='dots'){m.fillStyle='#fff6e7';m.beginPath();m.arc(30,30,6,0,Math.PI*2);m.arc(85,85,6,0,Math.PI*2);m.fill();}else if(im)m.drawImage(im,25,25,38,38);
  b.globalCompositeOperation='source-atop';b.globalAlpha=.7;b.fillStyle=b.createPattern(motif,'repeat');b.fillRect(0,0,out.width,out.height);b.globalAlpha=1;
 }
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
 return out;
}
function hydrateCanvases(root=document){root.querySelectorAll('canvas[data-design]').forEach(c=>{const parts=c.dataset.design.split('|'),d=Object.fromEntries(Object.keys(defaults).map((k,i)=>[k,parts[i]])),rect=c.getBoundingClientRect(),ratio=Math.min(2,window.devicePixelRatio||1);if(!rect.width)return;const source=c.hasAttribute('data-worn')?wornComposite(d):composite(d),w=Math.max(1,Math.round(rect.width*ratio)),h=Math.round(w*source.height/source.width);c.width=w;c.height=h;c.getContext('2d').drawImage(source,0,0,w,h);});}

return {hydrateCanvases,wornComposite,composite};
}
Object.assign(A,{SHOE_ANCHORS,ASSET_NAMES,designKey,shoeLayout,shoeCanvas,createShoeRenderer});
})(globalThis.SweetShoe = globalThis.SweetShoe || {});
