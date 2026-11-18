'use strict';
(function(A){
// Authored registration from assets/worn/worn.json; no fetch, including file://.
const STRAPS={"block":["cross","pearl","ribbon","thin"],"flat":["cross","pearl","ribbon","thin"],"kitten":["cross","pearl","ribbon","thin"],"luciteheel":["cross","pearl","ribbon","thin"],"pearlheel":["cross","pearl","ribbon","thin"],"platform":["cross","pearl","ribbon","thin"],"stiletto6":["cross","pearl","ribbon","thin"],"stiletto9":["cross","pearl","ribbon","thin"],"wedge":["cross","pearl","ribbon","thin"]};
const SPRITES={"flat":{"x":193,"y":0,"w":550,"h":860,"ox":144,"rc":0.922},"block":{"x":200,"y":0,"w":532,"h":862,"ox":144,"rc":0.923},"kitten":{"x":115,"y":0,"w":619,"h":865,"ox":186,"rc":0.891},"stiletto6":{"x":152,"y":0,"w":585,"h":855,"ox":166,"rc":0.91},"stiletto9":{"x":203,"y":0,"w":524,"h":868,"ox":146,"rc":0.929},"wedge":{"x":204,"y":0,"w":527,"h":863,"ox":143,"rc":0.924},"maryjane":{"x":185,"y":0,"w":550,"h":856,"ox":150,"rc":0.936},"ballet":{"x":182,"y":0,"w":550,"h":860,"ox":154,"rc":0.927},"slingback":{"x":130,"y":0,"w":612,"h":856,"ox":176,"rc":0.891},"loafer":{"x":160,"y":0,"w":575,"h":855,"ox":162,"rc":0.929},"platform":{"x":203,"y":0,"w":526,"h":889,"ox":144,"rc":0.917},"bootie":{"x":176,"y":0,"w":526,"h":854,"ox":172,"rc":0.922},"pearlpump":{"x":118,"y":0,"w":612,"h":862,"ox":186,"rc":0.903},"bowsling":{"x":107,"y":0,"w":627,"h":860,"ox":191,"rc":0.886},"crystalpump":{"x":136,"y":0,"w":604,"h":859,"ox":172,"rc":0.903},"studpump":{"x":125,"y":0,"w":603,"h":866,"ox":184,"rc":0.901},"bowmule":{"x":122,"y":0,"w":619,"h":855,"ox":179,"rc":0.906},"pearlheel":{"x":190,"y":0,"w":539,"h":862,"ox":152,"rc":0.926},"luciteheel":{"x":135,"y":0,"w":606,"h":868,"ox":172,"rc":0.9},"crystalsandal":{"x":198,"y":0,"w":521,"h":862,"ox":153,"rc":0.935},"flat_frill":{"x":193,"y":0,"w":551,"h":860,"ox":144},"flat_lace":{"x":193,"y":0,"w":550,"h":860,"ox":144},"block_frill":{"x":200,"y":0,"w":532,"h":862,"ox":144},"block_lace":{"x":200,"y":0,"w":532,"h":861,"ox":144},"kitten_frill":{"x":116,"y":0,"w":618,"h":866,"ox":186},"kitten_lace":{"x":116,"y":0,"w":619,"h":867,"ox":186},"stiletto6_frill":{"x":152,"y":0,"w":585,"h":855,"ox":166},"stiletto6_lace":{"x":152,"y":0,"w":585,"h":855,"ox":166},"stiletto9_frill":{"x":203,"y":0,"w":524,"h":869,"ox":146},"stiletto9_lace":{"x":204,"y":0,"w":523,"h":868,"ox":146},"wedge_frill":{"x":204,"y":0,"w":527,"h":863,"ox":143},"wedge_lace":{"x":204,"y":0,"w":527,"h":863,"ox":143},"maryjane_frill":{"x":186,"y":0,"w":549,"h":856,"ox":150},"maryjane_lace":{"x":186,"y":0,"w":549,"h":855,"ox":150},"ballet_frill":{"x":183,"y":0,"w":549,"h":860,"ox":154},"ballet_lace":{"x":182,"y":0,"w":550,"h":860,"ox":154},"slingback_frill":{"x":130,"y":0,"w":612,"h":856,"ox":176},"slingback_lace":{"x":130,"y":0,"w":612,"h":855,"ox":176},"loafer_frill":{"x":160,"y":0,"w":575,"h":855,"ox":162},"loafer_lace":{"x":160,"y":0,"w":575,"h":855,"ox":162},"platform_frill":{"x":203,"y":0,"w":526,"h":889,"ox":144},"platform_lace":{"x":203,"y":0,"w":526,"h":889,"ox":144},"bootie_frill":{"x":176,"y":0,"w":526,"h":854,"ox":172},"bootie_lace":{"x":176,"y":0,"w":526,"h":854,"ox":172},"pearlpump_frill":{"x":118,"y":0,"w":613,"h":862,"ox":186},"pearlpump_lace":{"x":118,"y":0,"w":612,"h":862,"ox":186},"bowsling_frill":{"x":107,"y":0,"w":627,"h":860,"ox":191},"bowsling_lace":{"x":107,"y":0,"w":627,"h":860,"ox":191},"crystalpump_frill":{"x":137,"y":0,"w":603,"h":858,"ox":172},"crystalpump_lace":{"x":136,"y":0,"w":604,"h":859,"ox":172},"studpump_frill":{"x":125,"y":0,"w":603,"h":866,"ox":184},"studpump_lace":{"x":125,"y":0,"w":603,"h":866,"ox":184},"bowmule_frill":{"x":122,"y":0,"w":619,"h":855,"ox":179},"bowmule_lace":{"x":123,"y":0,"w":619,"h":855,"ox":179},"pearlheel_frill":{"x":192,"y":0,"w":537,"h":862,"ox":152},"pearlheel_lace":{"x":192,"y":0,"w":537,"h":863,"ox":152},"luciteheel_frill":{"x":135,"y":0,"w":606,"h":868,"ox":172},"luciteheel_lace":{"x":135,"y":0,"w":606,"h":868,"ox":172},"crystalsandal_frill":{"x":196,"y":0,"w":524,"h":863,"ox":153},"crystalsandal_lace":{"x":196,"y":0,"w":524,"h":863,"ox":153}};
const ASSET_V='20261107f';
const HOSE_BASES=new Set(Object.keys(SPRITES).filter(b=>!b.includes('_')));
const LIMIT=8, sources=new Map(), loading=new Map(), cache=new Map(), jobs=new Map(), tokens=new WeakMap();
const make=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
function remember(map,key,value,limit=LIMIT){map.delete(key);map.set(key,value);while(map.size>limit)map.delete(map.keys().next().value);return value;}
function image(src){return new Promise((resolve,reject)=>{const im=new Image();if(/^https?:$/.test(location.protocol))im.crossOrigin='anonymous';im.onload=()=>resolve(im);im.onerror=()=>reject(new Error('Missing worn sprite: '+src));im.src=src;});}
// WebKit ignores CanvasRenderingContext2D.filter and file:// forbids pixel
// reads, so colour transforms use composite blend modes, masks ship with
// real alpha (white RGB), and blur is done by down/up sampling.
function gray(src,w,h){
 const c=make(w,h),p=c.getContext('2d');p.drawImage(src,0,0);
 p.globalCompositeOperation='saturation';p.fillStyle='#808080';p.fillRect(0,0,w,h);
 p.globalCompositeOperation='destination-in';p.drawImage(src,0,0);return c;
}
function tint(src,colour,w,h){
 // src is the baked grey sock shade (RGB = luminance, alpha = sock).
 // colour * luminance / 205: multiply, then lift by 255/205 with 'lighter'.
 const c=make(w,h),p=c.getContext('2d');p.drawImage(src,0,0);
 p.globalCompositeOperation='multiply';p.fillStyle=colour;p.fillRect(0,0,w,h);
 p.globalCompositeOperation='destination-in';p.drawImage(src,0,0);
 const t=make(w,h),q=t.getContext('2d');q.drawImage(c,0,0);q.globalCompositeOperation='lighter';q.globalAlpha=.24;q.drawImage(c,0,0);
 q.globalAlpha=1;q.globalCompositeOperation='destination-in';q.drawImage(src,0,0);return t;
}
function blurred(src,w,h,r){
 const k=Math.max(2,Math.round(r/2)),sw=Math.max(1,Math.round(w/k)),sh=Math.max(1,Math.round(h/k));
 const a=make(sw,sh),pa=a.getContext('2d');pa.imageSmoothingEnabled=true;pa.imageSmoothingQuality='high';pa.drawImage(src,0,0,sw,sh);
 const b=make(sw,sh),pb=b.getContext('2d');pb.drawImage(a,0,0);pa.clearRect(0,0,sw,sh);
 for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1],[0,0]]){pa.globalAlpha=.2;pa.drawImage(b,dx,dy);}pa.globalAlpha=1;
 const c=make(w,h),pc=c.getContext('2d');pc.imageSmoothingEnabled=true;pc.imageSmoothingQuality='high';pc.drawImage(a,0,0,w,h);return c;
}
const SOCK_COLOURS={pink:'#ffd4e4',mint:'#d6f4e7',cream:'#fff1d6',white:'#fffdfa',black:'#292735'};
const SHEER_YARN={pink:'#f6b3c8',mint:'#a8dfc6',cream:'#f1d7a8',white:'#ffffff',black:'#292735'};
function alphaMask(gray,sprite,w,h){
 const c=make(w,h),p=c.getContext('2d');p.drawImage(gray,0,0);
 p.globalCompositeOperation='destination-in';p.drawImage(sprite,0,0);return c;
}
// The Mary Jane painting leaves a small tan lining pocket inside the front
// foot's registered legs map. Shoe dye incorrectly owns that pocket while
// short-sock coverage omits it. Clone adjacent painting pixels at 1:1 and
// give the same local coverage to the foot/sock, preserving the collar trim.
function maryJaneCollar(sprite,mask,sockShade,legs,w,h){
 if(!legs)return {sprite,mask,sockShade};
 try{
  const c=make(w,h),p=c.getContext('2d');p.drawImage(sprite,0,0);
  const m=make(w,h),q=m.getContext('2d');q.drawImage(mask,0,0);
  const l=make(w,h),r=l.getContext('2d');r.drawImage(legs,0,0);
  const s=sockShade?make(w,h):null,t=s?.getContext('2d');if(t)t.drawImage(sockShade,0,0);
  const box=[216,744,58,33],im=p.getImageData(...box),dye=q.getImageData(...box),
   leg=r.getImageData(...box),sock=t?.getImageData(...box),original=p.getImageData(0,0,w,h).data;
  const lining=new Uint8Array(box[2]*box[3]);
  for(let j=0;j<lining.length;j++){const i=j*4,R=im.data[i],G=im.data[i+1],B=im.data[i+2];
   lining[j]=R<245&&G<222&&R-G>=8&&G-B>=12?1:0;}
  for(let y=0;y<box[3];y++)for(let x=0;x<box[2];x++){
   const i=(y*box[2]+x)*4;
   // Include the two-pixel codec fringe of the warm lining. The independent
   // legs alpha supplies the painted contour and protects the collar piping.
   let selected=false;
   for(let yy=Math.max(0,y-2);yy<=Math.min(box[3]-1,y+2);yy++)
    for(let xx=Math.max(0,x-2);xx<=Math.min(box[2]-1,x+2);xx++)selected ||= !!lining[yy*box[2]+xx];
   const a=selected?leg.data[i+3]/255:0;if(!a)continue;
   const j=((y+box[1])*w+x+box[0]+42)*4;
   for(let k=0;k<3;k++)im.data[i+k]=Math.round(im.data[i+k]*(1-a)+original[j+k]*a);
   dye.data[i+3]=Math.round(dye.data[i+3]*(1-a));
   if(sock){const lum=Math.round(original[j]*.299+original[j+1]*.587+original[j+2]*.114);
    for(let k=0;k<3;k++)sock.data[i+k]=lum;
    sock.data[i+3]=Math.max(sock.data[i+3],leg.data[i+3]);}
  }
  p.putImageData(im,box[0],box[1]);q.putImageData(dye,box[0],box[1]);if(t)t.putImageData(sock,box[0],box[1]);
  return {sprite:c,mask:m,sockShade:s};
 }catch(error){return {sprite,mask,sockShade};} // Read-restricted loading retains the painting.
}
// These authored legs mattes contain detached codec fragments on footwear.
// Keep anatomical components without changing any shipped legs map.
function cleanLegFragments(legs,w,h){
 if(!legs)return legs;
 try{
  const c=make(w,h),p=c.getContext('2d');p.drawImage(legs,0,0);
  const im=p.getImageData(0,0,w,h),px=im.data,seen=new Uint8Array(w*h);
  for(let i=0;i<seen.length;i++){
   if(seen[i]||!px[i*4+3])continue;
   const group=[i];seen[i]=1;
   for(let n=0;n<group.length;n++){
    const j=group[n];
    for(const k of [j-w,j+w,...(j%w?[j-1]:[]),...(j%w<w-1?[j+1]:[])])
     if(k>=0&&k<seen.length&&!seen[k]&&px[k*4+3]){seen[k]=1;group.push(k);}
   }
   if(group.length<1000)for(const j of group)px[j*4+3]=0;
  }
  p.putImageData(im,0,0);return c;
 }catch(error){return legs;}
}
async function load(heel){
 if(sources.has(heel))return remember(sources,heel,sources.get(heel));if(loading.has(heel))return loading.get(heel);
 const short=heel.endsWith('_frill')||heel.endsWith('_lace');
 const base=short?heel.replace(/_(frill|lace)$/,''):heel;
 const job=Promise.all([image('assets/worn/'+heel+'.webp'+'?v='+ASSET_V),image('assets/worn/'+heel+'_mask.webp'+'?v='+ASSET_V),short?image('assets/worn/'+heel+'_sock.webp'+'?v='+ASSET_V):null,image('assets/worn/'+heel+'_clear.webp?v='+ASSET_V),image('assets/worn/'+base+'_legs.webp'+'?v='+ASSET_V).catch(()=>null),image('assets/worn/'+base+'_sole.webp?v='+ASSET_V),!short&&HOSE_BASES.has(base)?image('assets/worn/'+base+'_hose.webp?v='+ASSET_V).catch(()=>null):null]).then(async ([sprite,gray,sockGray,clear,legs,sole,hose])=>{
  const tops=short?null:await Promise.all(['knee','thigh'].map(kind=>image('assets/worn/'+base+'_'+kind+'.webp?v='+ASSET_V)));
  const {w,h}=SPRITES[heel];if([sprite,gray,clear,...(sockGray?[sockGray]:[])].some(im=>im.naturalWidth!==w||im.naturalHeight!==h))throw new Error('Invalid worn sprite dimensions: '+heel);
  if(sole.naturalWidth!==SPRITES[base].w||sole.naturalHeight!==SPRITES[base].h)throw new Error('Invalid worn sole mask: '+base);
  const noDye=make(w,h);noDye.getContext('2d').drawImage(sole,SPRITES[base].x-SPRITES[heel].x,SPRITES[base].y-SPRITES[heel].y);
  if(legs&&(legs.naturalWidth!==SPRITES[base].w||legs.naturalHeight!==SPRITES[base].h))legs=null;
  if(hose&&(hose.naturalWidth!==w||hose.naturalHeight!==h))hose=null;
  if(short&&legs){const aligned=make(w,h);aligned.getContext('2d').drawImage(legs,SPRITES[base].x-SPRITES[heel].x,SPRITES[base].y-SPRITES[heel].y);legs=aligned;}
  if(['flat','block','kitten','stiletto6','wedge','platform','bootie','pearlpump','crystalpump','studpump','loafer','bowmule','pearlheel','luciteheel','stiletto9','ballet','slingback','bowsling','crystalsandal'].includes(base))legs=cleanLegFragments(legs,w,h);
  if(base==='maryjane'){
   legs=cleanLegFragments(legs,w,h);
   const collar=maryJaneCollar(sprite,gray,sockGray,legs,w,h);
   sprite=collar.sprite;gray=collar.mask;sockGray=collar.sockShade;
  }
  const mask=alphaMask(gray,sprite,w,h),sockMask=sockGray?alphaMask(sockGray,sprite,w,h):null;
  // Dye masks stop at the upper: preserve the painted outsole immediately
  // below it as footwear too, rather than laying fishnet over the sole.
  const shoeCover=make(w,h),cover=shoeCover.getContext('2d');
  cover.drawImage(mask,0,0);
  cover.globalCompositeOperation='destination-in';cover.drawImage(sprite,0,0);
  const skin=make(w,h),p=skin.getContext('2d');p.drawImage(sprite,0,0);p.globalCompositeOperation='destination-out';p.drawImage(shoeCover,0,0);
  // Legs map (alpha = leg skin only, excluding floor shadow and sole fringe;
  // RGB = 255 front leg, darker back leg with a contour where the front leg overlaps).
  if(legs){p.globalCompositeOperation='destination-in';p.drawImage(legs,0,0);}
  if(sockMask){p.globalCompositeOperation='destination-out';p.drawImage(sockMask,0,0);}
  // Extend the top alpha before blurring: hosiery must have no horizontal seam.
  const padded=make(w+72,h+72),b=padded.getContext('2d');b.drawImage(sprite,36,36);b.drawImage(sprite,0,0,w,1,36,0,w,36);
  const edge=make(w,h),e=edge.getContext('2d');e.drawImage(skin,0,0);e.globalCompositeOperation='source-in';e.fillStyle='#211a30';e.fillRect(0,0,w,h);
  e.globalCompositeOperation='destination-out';e.drawImage(blurred(padded,w+72,h+72,18),-36,-36);
  return remember(sources,heel,{sprite,mask,dyeMask:dyeShare(mask,noDye,w,h,sprite),clear,noDye,sockMask,sockShade:sockGray,skin,edge,legs,hose,tops,maryJane:base==='maryjane',edgeD:['ballet','slingback','bowsling','crystalsandal'].includes(base)});
 }).finally(()=>loading.delete(heel));loading.set(heel,job);return job;
}
// Where the dyed upper meets the undyed piping or sole, both mattes are soft,
// so their alphas can add to less than one and the pale undyed painting shows
// through as a ragged fringe. Inside the shoe, give the dye its share of the
// pair (m / (m + n)); on the shoe's outer silhouette, keep the dye matte as is.
function dyeShare(mask,noDye,w,h,sprite){
 try{
  const c=make(w,h),p=c.getContext('2d');p.drawImage(mask,0,0);const m=p.getImageData(0,0,w,h);
  p.clearRect(0,0,w,h);p.drawImage(noDye,0,0);const n=p.getImageData(0,0,w,h).data,d=m.data;
  p.clearRect(0,0,w,h);p.drawImage(sprite,0,0);const px=p.getImageData(0,0,w,h).data;
  const N=w*h,U=new Uint8Array(N),V=new Uint8Array(N);
  for(let i=0;i<N;i++){const a=d[i*4+3],b=n[i*4+3];U[i]=a>=180&&b<50?1:0;V[i]=b>=140?1:0;}
  const out=new Uint8ClampedArray(N),band=new Uint8Array(N);
  for(let i=0;i<N;i++){
   const a=d[i*4+3],b=n[i*4+3];out[i]=a;if(!a&&!b)continue;
   const x=i%w,y=(i-x)/w;
   // Where upper and piping meet, the painted colour decides: a pixel that
   // looks like the nearby piping stays undyed, one that looks like the
   // nearby upper is dyed. The two mattes are not trusted there.
   let su=0,sv=0;const ur=[0,0,0],vr=[0,0,0];
   for(let dy=-5;dy<=5;dy++){const yy=y+dy;if(yy<0||yy>=h)continue;for(let dx=-5;dx<=5;dx++){const xx=x+dx;if(xx<0||xx>=w)continue;const j=yy*w+xx;
    if(U[j]){su++;ur[0]+=px[j*4];ur[1]+=px[j*4+1];ur[2]+=px[j*4+2];}else if(V[j]){sv++;vr[0]+=px[j*4];vr[1]+=px[j*4+1];vr[2]+=px[j*4+2];}}}
   const cover=Math.min(255,a+b);
   if(su>=3&&sv>=3&&cover>=160){band[i]=1;
    let num=0,den=0;for(let k=0;k<3;k++){const u=ur[k]/su,v=vr[k]/sv,dd=v-u;num+=(px[i*4+k]-u)*dd;den+=dd*dd;}
    if(den>=300){const t=Math.max(0,Math.min(1,num/den));out[i]=Math.round(255*(1-t));continue;}
   }
   if(!a||!b)continue;
   // elsewhere split the pair by share; on the outer silhouette keep the matte
   out[i]=Math.round(cover>=200?255*a/(a+b):a*(255-b)/255);
  }
  // soften the colour decision along the seam so it reads as a clean line, not speckle
  for(let i=0;i<N;i++){if(!band[i]){d[i*4+3]=out[i];continue;}const x=i%w,y=(i-x)/w;let s=0,k=0;
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=w||yy>=h)continue;const j=yy*w+xx;if(!band[j]&&!(d[j*4+3]||n[j*4+3]))continue;s+=out[j];k++;}
   d[i*4+3]=k?Math.round(s/k):out[i];}
  p.clearRect(0,0,w,h);p.putImageData(m,0,0);return c;
 }catch(error){return null;}
}
function skinTone(source,colour,w,h){
 // The map's alpha alone selects skin. Recolour by the painting's own
 // luminance, contrast-stretched so the light fair-skin shading survives.
 const c=make(w,h),p=c.getContext('2d');p.drawImage(source.sprite,0,0);
 const m=make(w,h),q=m.getContext('2d');q.drawImage(source.skin,0,0);
 let img,ma;try{img=p.getImageData(0,0,w,h);ma=q.getImageData(0,0,w,h).data;}catch(error){
  // Draw-only skin sync for read-restricted file:// canvases.
  const t=make(w,h),r=t.getContext('2d');r.drawImage(source.skin,0,0);r.globalCompositeOperation='multiply';r.fillStyle=colour;r.fillRect(0,0,w,h);r.globalCompositeOperation='destination-in';r.drawImage(source.skin,0,0);
  p.globalCompositeOperation='destination-out';p.drawImage(source.skin,0,0);p.globalCompositeOperation='source-over';p.drawImage(t,0,0);return c;
 }const px=img.data;
 const t=colour.slice(1).match(/../g).map(v=>parseInt(v,16));
 let lo=1,hi=0;const L=new Float32Array(w*h);
 for(let i=0,j=0;i<px.length;i+=4,j++){L[j]=(px[i]*.3+px[i+1]*.59+px[i+2]*.11)/255;if(ma[i+3]>200){if(L[j]<lo)lo=L[j];if(L[j]>hi)hi=L[j];}}
 const lo2=Math.max(lo,hi-.42),span=Math.max(.05,hi-lo2);
 for(let i=0,j=0;i<px.length;i+=4,j++){const a=ma[i+3]/255;if(!a)continue;
  const v=Math.min(1,Math.max(0,(L[j]-lo2)/span)),k=.42+.78*Math.pow(v,1.15),hl=Math.max(0,v-.82)*1.6;
  for(let c3=0;c3<3;c3++){const o=Math.min(255,t[c3]*k+(255-t[c3]*k)*hl*.35);px[i+c3]=px[i+c3]*(1-a)+o*a;}}
 p.putImageData(img,0,0);return c;
}
// Tiny deterministic yarn tile, shared by all mapped composites (no per-frame noise).
let knitTile;
function knit(){
 if(knitTile)return knitTile;
 knitTile=make(32,32);const p=knitTile.getContext('2d'),im=p.createImageData(32,32);
 let seed=631;
 for(let i=0;i<im.data.length;i+=4){seed=(Math.imul(seed,1664525)+1013904223)>>>0;
  const v=112+(seed>>>27);im.data[i]=im.data[i+1]=im.data[i+2]=v;im.data[i+3]=255;}
 p.putImageData(im,0,0);return knitTile;
}
// Some shipped hose maps (strapped lasts such as the Mary Jane) carry
// row-to-row steps where a strap crossed the instep, which read as pale
// horizontal streaks under sheer hosiery. Below the ankle, average each
// column vertically over covered pixels only: horizontal streaks vanish while
// the across-the-leg cylinder gradient (the volume) is untouched.
function smoothFootRows(data,w,h,radius=12){
 const y0=Math.round(h*.56),rows=h-y0;if(rows<=0)return;
 const col=new Float32Array(rows*3);
 for(let x=0;x<w;x++){
  for(let y=y0;y<h;y++){const k=(y*w+x)*4,a=data[k+3]?1:0,t=(y-y0)*3;col[t]=data[k]*a;col[t+1]=data[k+1]*a;col[t+2]=a;}
  let sr=0,sg=0,sn=0;
  for(let y=0;y<Math.min(rows,radius);y++){sr+=col[y*3];sg+=col[y*3+1];sn+=col[y*3+2];}
  for(let y=0;y<rows;y++){
   const add=y+radius,drop=y-radius-1;
   if(add<rows){sr+=col[add*3];sg+=col[add*3+1];sn+=col[add*3+2];}
   if(drop>=0){sr-=col[drop*3];sg-=col[drop*3+1];sn-=col[drop*3+2];}
   const k=((y+y0)*w+x)*4;
   if(data[k+3]&&sn>0){data[k]=Math.round(sr/sn);data[k+1]=Math.round(sg/sn);}
  }
 }
}
function hosePixels(source,w,h){
 if(source.hoseData!==undefined)return source.hoseData;
 try{const c=make(w,h),p=c.getContext('2d');p.drawImage(source.hose,0,0);
  const data=p.getImageData(0,0,w,h).data;smoothFootRows(data,w,h);
  return source.hoseData=data;
 }catch(error){return source.hoseData=null;} // Read-restricted file:// keeps the incumbent cloth.
}
function mappedHose(p,data,colour,sock,w,h){
 const solid=['opaque','knee','thigh'].includes(sock),black=sock==='blacksheer',nude=sock==='pantyhose';
 const rgb=colour.slice(1).match(/../g).map(v=>parseInt(v,16));
 const c=make(w,h),q=c.getContext('2d'),im=q.createImageData(w,h),px=im.data;
 for(let i=0;i<px.length;i+=4){const r=data[i]/255,b=data[i+2]/255;
  for(let k=0;k<3;k++)px[i+k]=solid?45:rgb[k];
  px[i+3]=data[i+3]?Math.round(255*(solid?.045*r:Math.min(.88,nude?.18+.08*r+.10*b:(black?.30:.22)+.48*r+.07*b))):0;}
 q.putImageData(im,0,0);p.globalCompositeOperation='multiply';p.globalAlpha=1;p.drawImage(c,0,0);
 // Multiply alone cannot show a pale yarn on skin (multiplying by white is a
 // no-op), so pale and nude hosiery also lay a thin veil of the yarn colour
 // over the leg: denser at the silhouette where the knit is seen edge-on.
 if(!solid&&!black){
  const v=(nude?'#c4927b':colour).slice(1).match(/../g).map(x=>parseInt(x,16));
  for(let i=0;i<px.length;i+=4){const r=data[i]/255;for(let k=0;k<3;k++)px[i+k]=v[k];
   px[i+3]=data[i+3]?Math.round(255*Math.min(.62,nude?.20+.24*r:.20+.40*r)):0;}
  q.putImageData(im,0,0);p.globalCompositeOperation='source-over';p.drawImage(c,0,0);
 }
 for(let i=0;i<px.length;i+=4){px[i]=255;px[i+1]=black?244:255;px[i+2]=black?229:255;
  px[i+3]=data[i+3]?Math.round(data[i+1]*(solid?.06:nude?.11:black?.25:.18)):0;}
 q.putImageData(im,0,0);p.globalCompositeOperation='screen';p.drawImage(c,0,0);
 if(!solid){p.globalCompositeOperation='soft-light';p.globalAlpha=.035;p.fillStyle=p.createPattern(knit(),'repeat');
  p.fillRect(0,0,w,h);p.globalAlpha=1;}
}
// Source-space cloth relief, shared by colours and cached with the source LRU.
// The legs map separates the overlapping calves; each painted row supplies
// its own cylinder width, so neither the pose nor the silhouette is changed.
function opaqueRelief(source,w,h){
 if(source.opaqueRelief!==undefined)return source.opaqueRelief;
 try{
  if(!source.legs)return source.opaqueRelief=null;
  const c=make(w,h),p=c.getContext('2d');p.drawImage(source.legs,0,0);
  const legs=p.getImageData(0,0,w,h).data;
  p.clearRect(0,0,w,h);p.drawImage(source.sprite,0,0);
  const painting=p.getImageData(0,0,w,h).data;
  p.clearRect(0,0,w,h);p.drawImage(source.sockMask||source.skin,0,0);
  const mask=p.getImageData(0,0,w,h).data,field=new Uint8Array(w*h*3);
  for(let y=0;y<h;y++){
   // These four painted ribbon/sling/sandal lasts have strap cutouts in the
   // legs matte. Measure each foot across those cutouts so an occluding
   // strap cannot create a second cylinder or a groove in the cloth.
   const spans=[[w,-1],[w,-1]];
   if(source.edgeD&&y>=530)for(let sx=0;sx<w;sx++){
    const k=(y*w+sx)*4;if(legs[k+3]<64)continue;
    const span=spans[legs[k]>=207?1:0];span[0]=Math.min(span[0],sx);span[1]=sx;
   }
   let x=0;
   while(x<w){
    const start=x,i=(y*w+x)*4,front=legs[i]>=207;
    if(legs[i+3]<64){x++;continue;}
    while(x<w&&legs[(y*w+x)*4+3]>=64&&(legs[(y*w+x)*4]>=207)===front)x++;
    const width=x-start;
    for(let sx=start;sx<x;sx++){
     const j=y*w+sx,k=j*4,span=source.edgeD&&y>=530?spans[front?1:0]:null;
     const u=span?2*(sx-span[0]+.5)/Math.max(1,span[1]-span[0]+1)-1:2*(sx-start+.5)/width-1;
     const rim=Math.pow(Math.abs(u),2.2),shine=Math.exp(-Math.pow((u+.18)/.52,2));
     const lum=(painting[k]*.3+painting[k+1]*.59+painting[k+2]*.11)/255;
     field[j*3]=Math.round(255*rim);
     field[j*3+1]=Math.round(255*shine);
     field[j*3+2]=Math.round(255*Math.min(1,(front?0:.34)+(source.edgeD&&y>=530?0:Math.max(0,.92-lum)*1.5)));
     // Strap cutouts are occlusion, not dents in the cloth. Continue the
     // calf's smooth light field through the Mary Jane foot, on both legs.
     if(source.maryJane&&y>=620){
      const t=Math.min(1,(y-620)/40),blend=t*t*(3-2*t),u=(sx-(front?325:190))/155;
      field[j*3]=Math.round(field[j*3]*(1-blend)+255*(.08+.12*Math.min(1,u*u))*blend);
      field[j*3+1]=Math.round(field[j*3+1]*(1-blend)+255*Math.exp(-u*u)*blend);
      field[j*3+2]=Math.round(field[j*3+2]*(1-blend)+(front?0:87)*blend);
     }
    }
   }
  }
  // Cuff and shoe-mouth contact follows the existing sock matte. Ignore
  // the frame's top edge, where the calf continues beyond the camera.
  for(let x=0;x<w;x++){
   let top=-100;
   for(let y=0;y<h;y++){
    const j=y*w+x;if(mask[j*4+3]<64){top=y;continue;}
    if(top>=0&&y-top<9&&!(source.maryJane&&y>=640)&&!(source.edgeD&&y>=530))field[j*3+2]=Math.min(255,field[j*3+2]+Math.round(70*(1-(y-top)/9)));
   }
   let bottom=h+100;
   for(let y=h-1;y>=0;y--){
    const j=y*w+x;if(mask[j*4+3]<64){bottom=y;continue;}
    if(bottom<h&&bottom-y<12&&!(source.maryJane&&y>=640)&&!(source.edgeD&&y>=530))field[j*3+2]=Math.min(255,field[j*3+2]+Math.round(85*(1-(bottom-y)/12)));
   }
  }
  return source.opaqueRelief=field;
 }catch(error){return source.opaqueRelief=null;}
}
function shadeOpaque(source,cloth,colour,w,h){
 // Pixel access may be forbidden (notably file://); retain the incumbent
 // composite exactly in that case. Never touch its alpha or shoe pixels.
 try{
  const field=opaqueRelief(source,w,h);if(!field)return cloth;
  const p=cloth.getContext('2d'),im=p.getImageData(0,0,w,h),px=im.data;
  const rgb=colour.slice(1).match(/../g).map(v=>parseInt(v,16));
  const light=(rgb[0]*.3+rgb[1]*.59+rgb[2]*.11)/255,dark=1-light;
  for(let i=0,j=0;i<px.length;i+=4,j+=3){
   if(!px[i+3])continue;
   const rim=field[j]/255,shine=field[j+1]/255,shade=field[j+2]/255;
   // Keep authored ruffle/lace folds, whose luminance is baked in sockShade.
   // Lace and frill detail (threads, holes, ruffle folds) is baked into
   // sockShade luminance. Keep a wide range so it survives every colour, and
   // on dark yarn lift the light threads toward a soft sheen instead of
   // multiplying them away (multiply alone leaves black lace featureless).
   const fold=source.sockMask?Math.max(.55,Math.min(1.12,(px[i]+px[i+1]+px[i+2])/Math.max(1,rgb[0]+rgb[1]+rgb[2]))):1;
   const thread=source.sockMask?Math.max(0,fold-.86)*dark*1.6:0;
   const volume=1-(.065+.22*dark)*rim-(.065+.19*dark)*shade;
   for(let k=0;k<3;k++)px[i+k]=Math.min(255,Math.round(rgb[k]*fold*volume+[18,23,33][k]*dark*shine+(205-rgb[k])*thread));
  }
  p.putImageData(im,0,0);
 }catch(error){/* Keep the original cloth if reads are restricted. */}
 return cloth;
}
// Coverage and welts use shipped per-base alpha maps, including when file://
// disallows pixel reads. Bare skin comes from the same customer-toned painting.
function stockingTop(source,cloth,base,colour,sock,w,h){
 const mask=source.tops[sock==='knee'?0:1],band=make(w,h),b=band.getContext('2d');
 b.drawImage(mask,0,0);b.globalCompositeOperation='destination-out';b.drawImage(mask,0,sock==='knee'?17:25);
 b.globalCompositeOperation='source-in';b.fillStyle='#342b39';b.fillRect(0,0,w,h);
 const c=make(w,h),p=c.getContext('2d');p.drawImage(cloth,0,0);
 p.globalCompositeOperation='multiply';p.globalAlpha=.18;p.drawImage(band,0,0);p.globalAlpha=1;
 // Soft knit welt, with two fine ribs and a restrained highlight.
 const welt=make(w,h),q=welt.getContext('2d');q.drawImage(band,0,0);
 q.globalCompositeOperation='source-in';q.fillStyle=colour;q.fillRect(0,0,w,h);
 q.globalCompositeOperation='source-atop';q.strokeStyle='#ffffff';q.globalAlpha=.2;q.lineWidth=1;
 for(let x=0;x<w;x+=3){q.beginPath();q.moveTo(x,0);q.lineTo(x,h);q.stroke();}
 q.globalAlpha=1;p.globalCompositeOperation='source-atop';p.globalAlpha=.65;p.drawImage(welt,0,0);p.globalAlpha=1;
 p.globalCompositeOperation='destination-in';p.drawImage(mask,0,0);
 const out=make(w,h),r=out.getContext('2d');r.drawImage(base,0,0);
 r.globalCompositeOperation='destination-in';r.drawImage(source.skin,0,0);
 r.globalCompositeOperation='destination-out';r.drawImage(mask,0,0);
 r.globalCompositeOperation='source-over';r.drawImage(c,0,0);return out;
}
// Diamond knit wrapped on the legs. Each painted row of each leg (from the
// legs map, the same spans opaqueRelief uses) is treated as a cylinder cross
// section: the lattice is laid out in surface arc length, so diamonds narrow
// and crowd toward the silhouette, each leg carries its own phase, and the
// threads take the leg's light (sheen in front, shade at the rims and on the
// back leg). Geometry is cached per source; only the colouring is per call.
function netField(source,w,h){
 if(source.netField!==undefined)return source.netField;
 try{
  if(!source.legs)return source.netField=null;
  const c=make(w,h),p=c.getContext('2d');p.drawImage(source.legs,0,0);
  const legs=p.getImageData(0,0,w,h).data,P=24,field=new Float32Array(w*h*4);
  // Per leg (0 back, 1 front) and row: the full span, ignoring strap cutouts.
  // The legs map only tells the legs apart lower down (higher up both are
  // marked front), so the boundary between them is found where it is known
  // and carried smoothly up into the rows where the two silhouettes merge.
  const lo=[new Float32Array(h).fill(NaN),new Float32Array(h).fill(NaN)],hi=[new Float32Array(h).fill(NaN),new Float32Array(h).fill(NaN)];
  const all=[new Float32Array(h).fill(NaN),new Float32Array(h).fill(NaN)],split=new Float32Array(h).fill(NaN);let side=0,votes=0;
  for(let y=0;y<h;y++){
   let bl=NaN,bh=NaN,fl=NaN,fh=NaN,al=NaN,ah=NaN;
   for(let x=0;x<w;x++){const k=(y*w+x)*4;if(legs[k+3]<64)continue;if(isNaN(al))al=x;ah=x;if(legs[k]>=207){if(isNaN(fl))fl=x;fh=x;}else{if(isNaN(bl))bl=x;bh=x;}}
   all[0][y]=al;all[1][y]=ah;
   if(bh-bl>=12){ // the back leg is visible as its own region in this row
    const right=(fh>bh); // front leg to the right of the back leg
    votes+=right?1:-1;
    split[y]=right?bh+.5:bl-.5;
   }
  }
  side=votes>=0?1:-1; // 1: front leg on the right
  // carry the boundary up (and down) from the nearest known rows, following its slope
  const known=[];for(let y=0;y<h;y++)if(!isNaN(split[y]))known.push(y);
  if(known.length>=6){
   const top=known[0],bot=known[known.length-1],fit=(ys)=>{let n=0,sy=0,sx=0,sxy=0,syy=0;for(const y of ys){n++;sy+=y;sx+=split[y];sxy+=y*split[y];syy+=y*y;}const m=(n*sxy-sy*sx)/Math.max(1e-6,n*syy-sy*sy);return {m,c:(sx-m*sy)/n};};
   const up=fit(known.slice(0,Math.min(40,known.length))),dn=fit(known.slice(-Math.min(40,known.length)));
   for(let y=0;y<top;y++)split[y]=up.c+up.m*y;
   for(let y=bot+1;y<h;y++)split[y]=dn.c+dn.m*y;
   for(let i=0;i+1<known.length;i++)for(let y=known[i]+1;y<known[i+1];y++){const t=(y-known[i])/(known[i+1]-known[i]);split[y]=split[known[i]]*(1-t)+split[known[i+1]]*t;}
  }
  const isFront=(x,y,k)=>isNaN(split[y])?legs[k]>=207:side>0?x>=split[y]:x<=split[y];
  for(let y=0;y<h;y++){if(isNaN(all[0][y]))continue;
   if(isNaN(split[y])){lo[1][y]=all[0][y];hi[1][y]=all[1][y];continue;}
   const sp=Math.max(all[0][y],Math.min(all[1][y],split[y]));
   if(side>0){lo[0][y]=all[0][y];hi[0][y]=sp;lo[1][y]=sp;hi[1][y]=all[1][y];}else{lo[1][y]=all[0][y];hi[1][y]=sp;lo[0][y]=sp;hi[0][y]=all[1][y];}
   for(const f of [0,1])if(hi[f][y]-lo[f][y]<3){lo[f][y]=NaN;hi[f][y]=NaN;}
  }
  // Smooth centre and half-width down each leg. Below the ankle (the narrowest
  // row in the lower half) the ankle's cylinder carries on unchanged, so the
  // lattice flows over the foot instead of re-fitting to each wider row.
  const geo=[0,1].map(f=>{
   const C=new Float32Array(h),R=new Float32Array(h);let ankle=-1,best=1e9;
   for(let y=0;y<h;y++){C[y]=(lo[f][y]+hi[f][y])/2;R[y]=(hi[f][y]-lo[f][y]+1)/2;}
   for(let y=Math.floor(h*.45);y<h*.9;y++)if(R[y]>=3&&R[y]<best){best=R[y];ankle=y;}
   const sm=(A,y,r=14)=>{let s=0,n=0;for(let k=Math.max(0,y-r);k<=Math.min(h-1,y+r);k++)if(!isNaN(A[k])&&(ankle<0||k<=ankle)){s+=A[k];n++;}return n?s/n:NaN;};
   const C2=new Float32Array(h),R2=new Float32Array(h);
   for(let y=0;y<h;y++){const yy=ankle>=0?Math.min(y,ankle):y;C2[y]=sm(C,yy);R2[y]=sm(R,yy);}
   // below the ankle the centre keeps following the leg's slant
   if(ankle>=40){const slope=(C2[ankle]-C2[ankle-40])/40;for(let y=ankle+1;y<h;y++)C2[y]=C2[ankle]+slope*(y-ankle);}
   return {C:C2,R:R2};
  });
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const k=(y*w+x)*4;if(legs[k+3]<64)continue;
   const front=isFront(x,y,k),g=geo[front?1:0],cx=g.C[y],R=g.R[y];if(!(R>=2))continue;
   // a soft cylinder: wrap round to |v| = .9, then continue flat with the same
   // slope, so the diamonds never jump in size where the wrap ends
   const v=(x-cx)/R,av=Math.abs(v),u=Math.max(-.995,Math.min(.995,v)),K=.9,slope=1/Math.sqrt(1-K*K);
   const arc=(av<=K?Math.asin(v)*R:Math.sign(v)*(Math.asin(K)*R+(av-K)*R*slope))+(front?0:P*.37),t=y*1.04;
   const a=(arc+t)/P,b=(arc-t)/P,d=Math.min(Math.abs(a-Math.round(a)),Math.abs(b-Math.round(b)))*P;
   const ds=d*(.3+.7*Math.sqrt(1-Math.min(K,av)**2));
   const j=(y*w+x)*4;
   field[j]=Math.max(0,Math.min(1,(1.6-ds)/1.2));
   field[j+1]=Math.max(0,Math.min(1,(3.0-ds)/1.8));
   field[j+2]=Math.abs(v)<=1?Math.max(.5,1-.42*u*u-(front?0:.14)):(front?.82:.68);
   field[j+3]=Math.abs(v)<=1?Math.exp(-Math.pow((u+.2)/.42,2))*(front?1:.55):0;
  }
  return source.netField=field;
 }catch(error){return source.netField=null;}
}
function wrappedNet(source,colour,w,h){
 const field=netField(source,w,h);if(!field)return null;
 const c=make(w,h),q=c.getContext('2d'),im=q.createImageData(w,h),px=im.data;
 const rgb=colour.slice(1).match(/../g).map(v=>parseInt(v,16)),pale=(rgb[0]*.3+rgb[1]*.59+rgb[2]*.11)/255>.5;
 const shadow=[92,62,72];
 for(let i=0,j=0;i<px.length;i+=4,j+=4){
  const thread=field[j],halo=field[j+1];if(thread<=0&&halo<=0)continue;
  const light=field[j+2],lift=(pale?.22:.38)*field[j+3];
  // Pale yarn needs a faint contact shadow beside each strand to read on skin.
  const under=pale?.17*halo*(1-thread):0,alpha=Math.min(1,thread*.95+under);
  if(alpha<=0)continue;
  for(let k=0;k<3;k++){
   const yarn=Math.min(255,rgb[k]*light+(255-rgb[k]*light)*lift);
   px[i+k]=Math.round((yarn*thread*.95+shadow[k]*under)/alpha);
  }
  px[i+3]=Math.round(255*alpha);
 }
 q.putImageData(im,0,0);return c;
}
function hosiery(source,o,w,h,base=source.sprite){
 const {sprite,sockMask,skin,edge}=source,c=make(w,h),p=c.getContext('2d'),mono=()=>source.gray||(source.gray=gray(sprite,w,h));
 let colour=SOCK_COLOURS[o.color]||SOCK_COLOURS.cream;
 if(sockMask){
  p.drawImage(tint(source.sockShade,colour,w,h),0,0);
  p.globalCompositeOperation='destination-in';p.drawImage(sockMask,0,0);return shadeOpaque(source,c,colour,w,h);
 }
 if(o.sock==='blacksheer')colour='#262430';
 if(o.sock==='pantyhose')colour=o.skin||'#d7ab90';
 // Sheer yarn shows its hue more strongly than the pastel used for socks.
 else if(o.sock==='sheer')colour=SHEER_YARN[o.color]||colour;
 const mapped=source.hose&&['sheer','pantyhose','blacksheer','opaque','knee','thigh'].includes(o.sock)?hosePixels(source,w,h):null;
 const opacity=({sheer:.35,pantyhose:.35,blacksheer:.55,opaque:.90,knee:.85,thigh:.85,fishnet:.15})[o.sock];
 p.drawImage(base,0,0);
 if(['opaque','knee','thigh'].includes(o.sock)){
  // Solid cloth: flat colour, then the skin's own light and shade laid back
  // over it (soft-light keeps knee/calf volume without washing the colour).
  p.globalCompositeOperation='source-atop';p.globalAlpha=1;p.fillStyle=colour;p.fillRect(0,0,w,h);
  p.globalCompositeOperation='multiply';p.globalAlpha=.55;p.drawImage(mono(),0,0);
  p.globalCompositeOperation='soft-light';p.globalAlpha=.45;p.drawImage(mono(),0,0);
  p.globalCompositeOperation='screen';p.globalAlpha=(colour==='#292735'?.06:.04)+(o.sock==='thigh'?.16:0);p.drawImage(mono(),0,0);p.globalAlpha=1;
 }else if(!mapped){
  p.globalCompositeOperation='multiply';p.globalAlpha=opacity;p.fillStyle=colour;p.fillRect(0,0,w,h);
  // Same pale-yarn veil as the mapped path, for heels without a hose map.
  if(['sheer','pantyhose'].includes(o.sock)){p.globalCompositeOperation='source-atop';p.globalAlpha=o.sock==='pantyhose'?.26:.32;p.fillStyle=o.sock==='pantyhose'?'#c4927b':colour;p.fillRect(0,0,w,h);}
  p.globalAlpha=1;
 }
 // The mapped field already supplies silhouette density and sheen.
 // Doubling it with the generic edge tint flattened the earlier sheer look.
 if(!mapped){p.globalCompositeOperation='source-atop';p.globalAlpha=o.sock==='blacksheer'?.85:o.sock==='fishnet'?.14:.5;p.drawImage(edge,0,0);p.globalAlpha=1;}
 if(!mapped||['opaque','knee','thigh'].includes(o.sock)){
  p.globalCompositeOperation='screen';p.globalAlpha=.035;p.drawImage(mono(),0,0);p.globalAlpha=1;
 }
 if(mapped)mappedHose(p,mapped,colour,o.sock,w,h);
 if(o.sock==='fishnet'){
  const net=wrappedNet(source,colour,w,h);
  p.globalCompositeOperation='source-atop';
  if(net)p.drawImage(net,0,0);
  else{ // Pixel reads forbidden (file://): keep the flat fallback lattice.
   const flat=()=>{p.beginPath();for(let x=-h;x<w+h;x+=14){p.moveTo(x,0);p.lineTo(x+h,h);p.moveTo(x,0);p.lineTo(x-h,h);}p.stroke();};
   if(colour!=='#292735'){p.strokeStyle='#6b4652';p.lineWidth=2.2;p.globalAlpha=.22;flat();}
   p.strokeStyle=colour;p.lineWidth=1.3;p.globalAlpha=.92;flat();p.globalAlpha=1;
  }
 }
 // Back leg sits in shadow behind the front one, with a soft contour line.
 if(source.legs){p.globalCompositeOperation='multiply';p.globalAlpha=(colour==='#292735'||colour==='#262430')?.6:o.sock==='fishnet'?.2:.38;p.drawImage(source.legs,0,0);p.globalAlpha=1;}
 p.globalCompositeOperation='destination-in';p.drawImage(skin,0,0);
 if(['opaque','knee','thigh'].includes(o.sock))shadeOpaque(source,c,colour,w,h);
 return ['knee','thigh'].includes(o.sock)?stockingTop(source,c,base,colour,o.sock,w,h):c;
}
async function tinted(d,o){
 const variant=d.heel+(['frill','lace'].includes(o.sock)?'_'+o.sock:''),ref=SPRITES[variant];
 // Composite at the authored size once; projection to any target size is a
 // drawImage operation and never allocates a second full hosiery composite.
 const key=A.designKey(d)+'|'+d.strap+'|'+o.sock+'|'+o.color+'|'+(o.skin||'')+'|'+ref.w+'x'+ref.h;
 if(cache.has(key))return remember(cache,key,cache.get(key));if(jobs.has(key))return jobs.get(key);
 const job=(async()=>{
  const source=await load(variant),{sprite,mask}=source,{w,h}=SPRITES[variant];
  if(d.material==='lace')await A.CoutureFinish?.loadLace();
  const out=make(w,h),p=out.getContext('2d'),dye=make(w,h),q=dye.getContext('2d');
  q.drawImage(sprite,0,0);q.globalCompositeOperation='multiply';q.fillStyle=A.option('color',d.color)[3];q.fillRect(0,0,w,h);
  q.globalCompositeOperation='screen';q.globalAlpha=['velvet','suede'].includes(d.material)?.08:.25;q.drawImage(sprite,0,0);q.globalAlpha=1;q.globalCompositeOperation='source-over';
  const finish=make(w,h),f=finish.getContext('2d');f.save();f.translate(0,h*.62);f.scale(w/1024,h*.38/640);
  A.CoutureFinish?.drawFinish(f,d,1024,640,'sprite');A.CoutureFinish?.drawPattern(f,d,1024,640,'sprite');f.restore();
  q.drawImage(finish,0,0);q.globalCompositeOperation='destination-in';q.drawImage(source.dyeMask||mask,0,0);
  // Keep natural soles, welt/piping, insoles and non-fabric heel details
  // in their original painting, for dye, material finish and every motif.
  // Sock variants share the base matte with authored registration offsets.
  if(!source.dyeMask){q.globalCompositeOperation='destination-out';q.drawImage(source.noDye,0,0);}
  // Re-keyed shoe masks can overlap a few yarn pixels at narrow openings.
  if(source.sockMask){q.globalCompositeOperation='destination-out';q.drawImage(source.sockMask,0,0);}
  if(o.skin&&!source.legs)throw new Error('Missing worn skin mask: '+variant);
  const base=o.skin?skinTone(source,o.skin,w,h):sprite;
  p.drawImage(base,0,0);
  if(o.sock!=='none'){
   // Full-leg hosiery replaces the bare skin (not over it), so partially
   // transparent silhouette pixels carry no pale skin fringe.
   if(!source.sockMask){p.globalCompositeOperation='destination-out';p.drawImage(source.skin,0,0);p.globalCompositeOperation='source-over';}
   // Short socks too: remove the painted (mint) cuff under the sock so its
   // soft lace/frill edges blend with the leg, not with green paint.
   else{p.globalCompositeOperation='destination-out';p.drawImage(source.sockMask,0,0);p.globalCompositeOperation='source-over';}
   p.drawImage(hosiery(source,o,w,h,base),0,0);
  }
  // Shoe is always the final layer, covering the sock at the original opening.
  p.globalCompositeOperation='source-atop';p.drawImage(dye,0,0);p.globalCompositeOperation='source-over';
  // Straps are painted per heel from generated worn references, registered on
  // the base heel's frame; sock variants offset by their own registration.
  const strap=d.strap&&d.strap!=='none'&&STRAPS[d.heel]?.includes(d.strap)?await image('assets/worn/straps/'+d.heel+'_'+d.strap+'.webp?v='+ASSET_V).catch(()=>null):null;
  if(strap){
   const base=SPRITES[d.heel],dx=base.x-ref.x,dy=base.y-ref.y;
   if(d.strap==='pearl')p.drawImage(strap,dx,dy);
   else{const t=make(strap.naturalWidth||strap.width,strap.naturalHeight||strap.height),c=t.getContext('2d');c.drawImage(strap,0,0);c.globalCompositeOperation='multiply';c.fillStyle=A.option('color',d.color)[3];c.fillRect(0,0,t.width,t.height);c.globalCompositeOperation='destination-in';c.drawImage(strap,0,0);p.drawImage(t,dx,dy);}
  }
  // Per-painting sole/gap clearance is the final operation. Keeping the
  // immutable source intact preserves every shading calculation and pixel
  // outside the reviewed repair regions, including read-restricted canvases.
  p.globalCompositeOperation='destination-out';p.drawImage(source.clear,0,0);
  p.globalCompositeOperation='source-over';
  return remember(cache,key,out);
 })().finally(()=>jobs.delete(key));jobs.set(key,job);return job;
}
function shadow(p,x,y,rx,ry){
 p.save();p.globalCompositeOperation='multiply';p.translate(x,y);p.scale(1,ry/rx);
 const g=p.createRadialGradient(0,0,0,0,0,rx);g.addColorStop(0,'#4b5e5060');g.addColorStop(.5,'#4b5e5028');g.addColorStop(1,'#4b5e5000');
 p.fillStyle=g;p.beginPath();p.arc(0,0,rx,0,Math.PI*2);p.fill();p.restore();
}
async function paint(target,input,options,sceneId='salon',cropped=false,current=()=>true){
 const token={};tokens.set(target,token);const d=A.cleanDesign(input),o=A.cleanFittingOptions(options);if(!has(d.heel))return false;
 let sprite;try{sprite=await tinted(d,o);}catch(error){return false;}
 if(tokens.get(target)!==token||!current())return false;
 const ref=SPRITES[d.heel+(['frill','lace'].includes(o.sock)?'_'+o.sock:'')],g0=A.Showcase.project('salon',1220,1000,'ref'),g=A.Showcase.project(sceneId,target.width,target.height,cropped),k=g.scale/g0.scale;
 const x=g.cx+(ref.x+(SPRITES[d.heel].ox||0)-g0.cx)*k,y=g.floor+(ref.y-g0.floor)*k,w=ref.w*k,h=ref.h*k,p=target.getContext('2d');
 p.clearRect(0,0,target.width,target.height);p.imageSmoothingEnabled=true;p.imageSmoothingQuality='high';
 const B=SPRITES[d.heel],rearY=B.rc?g.floor+(B.y-g0.floor)*k+B.h*k*B.rc:y+h*.925;
 const contacts=[[x+w*.29,rearY],[x+w*.64,y+h*.994]];
 contacts.forEach(([cx,cy])=>shadow(p,cx,cy,w*.24,Math.max(1,h*.009)));
 if(y>0){
  const rows=Math.max(1,Math.round(ref.h*.06));p.drawImage(sprite,0,0,ref.w,rows,x,0,w,y+rows*k);
  p.drawImage(sprite,0,rows,ref.w,ref.h-rows,x,y+rows*k,w,h-rows*k);
 }else p.drawImage(sprite,x,y,w,h);
 Object.assign(target.dataset,{renderer:'worn-sprite',fitting2dReady:'true',heel:d.heel,color:d.color,material:d.material,pattern:d.pattern,fallback:'false',feet:'2',sock:o.sock,sockColor:o.color,legFrame:`0,0,${ref.w},${ref.h}`,pairPose:'approved-standing',pairLayout:JSON.stringify({x,y,w,h,scale:k,floor:g.floor}),platformLayout:JSON.stringify(g),platformCount:'0',platformBaked:'true',fixedFraming:g.composition.join('x'),shadowContacts:JSON.stringify(contacts),legContinuation:'opaque-past-frame',skinFinish:'approved-sprite'});return true;
}
function has(heel){return Object.prototype.hasOwnProperty.call(SPRITES,heel);}
A.WornSprites={has,paint,info:()=>({cacheEntries:cache.size,cacheLimit:LIMIT,sourceEntries:sources.size,pending:jobs.size})};
})(globalThis.SweetShoe=globalThis.SweetShoe||{});
