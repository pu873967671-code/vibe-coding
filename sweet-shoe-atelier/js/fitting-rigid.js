'use strict';
(function(A){
// Individually reviewed rigid cameras. Flat, stiletto6, kitten, studpump and Mary Jane use the returned
// hand-fixed user anatomy; other styles retain their existing paintings.
const STYLES=Object.freeze(['studpump','flat','maryjane','stiletto9','stiletto6','kitten']);
const USER_STYLES=Object.freeze(['flat','stiletto6','kitten','studpump','maryjane']);
// One reference composition for both returned-leg cameras, in stage units.
// Shoe, leg, hosiery and ornaments always travel as a complete rigid stack.
const USER_PAIRS=Object.freeze({
 stiletto6:Object.freeze({rearScale:.78,rearX:103,rearY:498}),
 kitten:Object.freeze({rearScale:.78,rearX:103,rearY:498}),
 studpump:Object.freeze({rearScale:.78,rearX:103,rearY:498}),
 maryjane:Object.freeze({rearScale:.78,rearX:103,rearY:498}),
 flat:Object.freeze({rearScale:.78,rearX:103,rearY:498})
});
const images=new Map(),cache=new Map(),pending=new Map(),LIMIT=6;
const W=1024,H=1840,OY=1200,USER_OY=1500;
function canvas(w=W,h=H){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function load(path){
 if(!images.has(path))images.set(path,new Promise(resolve=>{const im=new Image();im.decoding='async';im.onload=()=>resolve(im);im.onerror=()=>{images.delete(path);resolve(null);};im.src=path;}));
 return images.get(path);
}
const COLOURS={white:'#fffdfa',cream:'#fff1d6',pink:'#ffd4e4',mint:'#d6f4e7',black:'#292735'};
async function leg(heel,which,o){
 const black=o.color==='black'||o.sock==='blacksheer',kind=o.sock==='none'?'skin':black?'black':'cloth';
 const paths=[`assets/fitting-rigid/${heel}_${which}_skin.webp`,`assets/fitting-rigid/${heel}_${which}_${kind}.webp`];
 const [skin,texture]=await Promise.all(paths.map(load));if(!skin||!texture)return null;
 const H=skin.naturalHeight,OY=USER_STYLES.includes(heel)?USER_OY:1200;
 const out=canvas(W,H),p=out.getContext('2d');p.drawImage(skin,0,0);
 if(o.sock==='none')return out;
 const cloth=canvas(W,H),q=cloth.getContext('2d');q.drawImage(texture,0,0);
 if(!black){q.globalCompositeOperation='multiply';q.fillStyle=COLOURS[o.color]||COLOURS.cream;q.fillRect(0,0,W,H);q.globalCompositeOperation='destination-in';q.drawImage(texture,0,0);}
 q.globalCompositeOperation='source-atop';
 if(USER_STYLES.includes(heel)&&!['stiletto6','kitten'].includes(heel)&&o.color==='white'){
  // Warm white cloth keeps the source's ankle shadows without reading grey.
  q.fillStyle='rgba(255,253,249,.22)';q.fillRect(0,0,W,H);
 }
 // Fine yarn follows the original painted volume; it never expands the alpha.
 if(o.sock==='fishnet'){
  q.strokeStyle='rgba(30,24,36,.72)';q.lineWidth=2;
  q.beginPath();for(let x=-H;x<W+H;x+=32){q.moveTo(x,0);q.lineTo(x+H,H);q.moveTo(x,0);q.lineTo(x-H,H);}q.stroke();
 }else{
  q.strokeStyle=black?'rgba(225,214,235,.045)':['stiletto6','kitten'].includes(heel)?'rgba(110,82,100,.025)':'rgba(110,82,100,.06)';q.lineWidth=1;
  q.beginPath();for(let x=0;x<W;x+=8){q.moveTo(x,0);q.lineTo(x,H);}q.stroke();
 }
 const top=({frill:OY-40,lace:OY-60,knee:OY-780}[o.sock]??0);
 if(top){
  q.clearRect(0,0,W,top);
  // Rounded ribbed cuff is clipped to the painted calf, including its edge.
  q.fillStyle=black?'#4c4559':'#fff8ed';q.fillRect(0,top,W,9);
  q.strokeStyle=black?'#71667d':'#d8c8cb';q.lineWidth=2;q.beginPath();
  for(let x=0;x<W;x+=10){q.moveTo(x,top+1);q.lineTo(x,top+8);}q.stroke();
  if(o.sock==='frill'||o.sock==='lace'){
   q.strokeStyle=black?'#7d718b':'#fffaf3';q.lineWidth=5;q.beginPath();
   for(let x=0;x<W;x+=14){q.moveTo(x,top+1);q.quadraticCurveTo(x+7,top+12,x+14,top+1);}q.stroke();
  }
  q.globalCompositeOperation='destination-in';q.drawImage(texture,0,0);
 }
 // Preserve this seated foot's original edge alpha: stacking two identical
 // antialiased masks source-over otherwise thickens the ankle by up to 2px.
 p.globalCompositeOperation=USER_STYLES.includes(heel)?'source-atop':'source-over';
 p.globalAlpha=({blacksheer:.46,sheer:.30,pantyhose:.72,fishnet:.16}[o.sock]??1);p.drawImage(cloth,0,0);p.globalAlpha=1;
 // Fishnet strands remain visible over the sheer base.
 if(o.sock==='fishnet'){const net=canvas(W,H),n=net.getContext('2d');n.strokeStyle='rgba(29,23,35,.7)';n.lineWidth=2;n.beginPath();for(let x=-H;x<W+H;x+=32){n.moveTo(x,0);n.lineTo(x+H,H);n.moveTo(x,0);n.lineTo(x-H,H);}n.stroke();n.globalCompositeOperation='destination-in';n.drawImage(skin,0,0);p.drawImage(net,0,0);}
 return out;
}
async function composite(d,o){
 const id=JSON.stringify([d,o]);if(cache.has(id)){const hit=cache.get(id);cache.delete(id);cache.set(id,hit);return hit;}if(pending.has(id))return pending.get(id);
 const work=Promise.all([A.Shoe2D.composite(d),A.Shoe2D.openingAccessories(d),leg(d.heel,'front',o),leg(d.heel,'rear',o),d.heel==='maryjane'?load('assets/fitting-rigid/maryjane_strap.webp'):null]).then(([shoe,over,front,rear,strap])=>{
  if(!front||!rear||(d.heel==='maryjane'&&!strap)){
   // The returned user anatomy is authoritative, including during recovery.
   // Keep its rigid shoes grounded while a failed leg/band load can retry; never
   // substitute an older painted body for the user's hand-fixed source.
   if(USER_STYLES.includes(d.heel))return {shoe,over,front:null,rear:null};
   return null;
  }
  if(strap){
   const integral=canvas(1024,640),q=integral.getContext('2d');q.drawImage(shoe,0,0);q.globalCompositeOperation='destination-in';q.drawImage(strap,0,0);q.globalCompositeOperation='source-over';
   // The retained band mask omits the buckle's two metal rails. Restore
   // their complete original product footprint over the foot as well.
   q.save();q.beginPath();q.moveTo(668,322);q.lineTo(699,351);q.lineTo(678,390);q.lineTo(636,362);q.closePath();q.clip();q.drawImage(shoe,0,0);q.restore();
   q.drawImage(over,0,0);over=integral;
  }
  const value={shoe,over,front,rear};cache.set(id,value);while(cache.size>LIMIT)cache.delete(cache.keys().next().value);return value;
 }).finally(()=>pending.delete(id));pending.set(id,work);return work;
}
function transforms(g,heel){
 const u=g.uniform,s=222/832*u,pair=USER_PAIRS[heel],user=!!pair,rs=s*(pair?pair.rearScale:.9);
 const front={s,tx:g.ox+150*u-96*s,ty:g.oy+526*u-540*s};
 // Returned pair reference: the standing leg is LEFT and behind the raised
 // front leg. Move the complete foot/shoe stack; never shear either painting.
 const rearX=user?pair.rearX:278,rearY=user?pair.rearY:480;
 const rear={s:rs,tx:g.ox+rearX*u-96*rs,ty:g.oy+rearY*u-540*rs};
 return {front,rear};
}
function put(p,t,im,offset=0){p.save();p.setTransform(t.s,0,0,t.s,t.tx,t.ty);p.drawImage(im,0,-offset);p.restore();}
function shadow(p,t,heel){
 const points=heel==='stiletto9'?[[300,532,155,13],[490,529,115,12],[860,498,38,10]]:['studpump','stiletto6'].includes(heel)?[[300,530,155,13],[490,525,115,12],[840,470,38,10]]:heel==='kitten'?[[260,528,160,13],[490,528,115,12],[815,445,38,10]]:[[260,528,160,13],[550,526,140,12],[815,455,42,10]];
 p.save();p.setTransform(t.s,0,0,t.s,t.tx,t.ty);
 for(const [x,y,rx,ry] of points){p.save();p.translate(x,y+4);p.scale(1,ry/rx);const grad=p.createRadialGradient(0,0,0,0,0,rx);grad.addColorStop(0,'#46584e55');grad.addColorStop(1,'#46584e00');p.fillStyle=grad;p.beginPath();p.arc(0,0,rx,0,Math.PI*2);p.fill();p.restore();}p.restore();
}
async function prepare(d,o){return STYLES.includes(d.heel)?composite(d,o):null;}
function paint(target,d,o,parts,scene,cropped){
 const g=A.Showcase.project(scene,target.width,target.height,cropped),t=transforms(g,d.heel),p=target.getContext('2d');p.clearRect(0,0,target.width,target.height);p.imageSmoothingEnabled=true;p.imageSmoothingQuality='high';
 shadow(p,t.rear,d.heel);shadow(p,t.front,d.heel);
 // One uniform transform per shoe: exact showcase pixels, no row resampling.
 for(const [which,foot] of [['rear',parts.rear],['front',parts.front]]){put(p,t[which],parts.shoe);if(foot)put(p,t[which],foot,USER_STYLES.includes(d.heel)?USER_OY:OY);put(p,t[which],parts.over);}
 Object.assign(target.dataset,{renderer:'rigid-gen5',fitting2dReady:'true',heel:d.heel,color:d.color,material:d.material,fallback:String(!parts.front||!parts.rear),feet:parts.front&&parts.rear?'2':'0',sock:o.sock,sockColor:o.color,pairPose:USER_STYLES.includes(d.heel)?'user-reference-crossed':'half-on-front-standing-rear',pairLayout:JSON.stringify(t),platformLayout:JSON.stringify(g),platformCount:'0',platformBaked:'true',fixedFraming:g.composition.join('x'),legContinuation:'painted',skinFinish:'soft-youthful',shoeTransform:'uniform',legSource:USER_STYLES.includes(d.heel)?'src-user-legs-20261029':`gen5/${d.heel}`,footAnchors:USER_STYLES.includes(d.heel)?'front:150,526;rear:103,498,.78':'front:150,526;rear:278,480,.90'});
 return true;
}
A.RigidFitting={styles:STYLES,userStyles:USER_STYLES,prepare,paint,transforms,info:()=>({cacheEntries:cache.size,cacheLimit:LIMIT,pending:pending.size})};
})(globalThis.SweetShoe=globalThis.SweetShoe||{});
