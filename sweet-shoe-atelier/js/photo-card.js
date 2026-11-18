(A=>{'use strict';
// The fitting card shows an illustrated "shoe selfie" for the pair's shape and
// sock style (assets/photo-card, built by dev/build-photo-card.py). Each picture
// has a white shoe and white hosiery; its mask (R = shoe, G = sock) lets the card
// multiply them by the design's shoe colour and the chosen sock colour.
// Material, pattern, straps, ornaments, charm and skin tone are not shown.
const VERSION=1,SOURCE=[720,1080];
const SHAPES=new Set(['flat','block','kitten','stiletto6','stiletto9','wedge','maryjane','ballet','slingback','loafer','platform','bootie','pearlpump','bowsling','crystalpump','studpump','bowmule','pearlheel','luciteheel','crystalsandal']);
const SOCKS=new Set(['none','frill','lace','sheer','knee','blacksheer','pantyhose','opaque','fishnet']);
const SHOE_COLOURS={pink:'#ffadc9',cream:'#fff0d2',blue:'#a9daff',green:'#c6e7a5',purple:'#d6b9ff',peach:'#ffc09e',rose:'#f478a4',black:'#555158'};
const SOCK_COLOURS={pink:'#ffd4e4',mint:'#d6f4e7',cream:'#fff1d6',white:'#fffdfa',black:'#292735'};
const images=new Map(),tinted=new Map(),LIMIT=6;
// Thigh-highs and opaque tights look the same in this framing (only shins show).
const sockFor=s=>s==='thigh'?'opaque':SOCKS.has(s)?s:'none';
const has=heel=>SHAPES.has(heel);
const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
function load(src){
 if(!images.has(src))images.set(src,new Promise((resolve,reject)=>{const im=new Image();im.decoding='async';im.crossOrigin='anonymous'; // preview hosts redirect images to another domain; CORS keeps them readable for tintingim.onload=()=>resolve(im);im.onerror=()=>{images.delete(src);reject(new Error('photo card: '+src));};im.src=src;}));
 return images.get(src);
}
// Multiply the masked white areas by a colour, keeping the satin's own shading
// and letting its brightest highlights stay near white.
function tint(d,m,channel,colour,shine){
 const [cr,cg,cb]=colour;shine*=Math.min(1,(.3*cr+.59*cg+.11*cb)/255)**2; // dark colours keep soft highlights, not silver ones
 for(let i=0;i<d.length;i+=4){
  const a=m[i+channel]/255;if(a<.004)continue;
  const r=d[i],g=d[i+1],b=d[i+2],l=(.3*r+.59*g+.11*b)/255,h=Math.max(0,Math.min(1,(l-.93)/.07))*shine;
  let tr=r*cr/255,tg=g*cg/255,tb=b*cb/255;tr+=(255-tr)*h;tg+=(255-tg)*h;tb+=(255-tb)*h;
  d[i]=r+(tr-r)*a;d[i+1]=g+(tg-g)*a;d[i+2]=b+(tb-b)*a;
 }
}
async function picture(design,fitting){
 const sock=sockFor(fitting?.sock),name=design.heel+'__'+sock,shoe=SHOE_COLOURS[design.color]||SHOE_COLOURS.pink,hose=SOCK_COLOURS[fitting?.color]||SOCK_COLOURS.cream;
 const key=[name,shoe,hose].join('|');if(tinted.has(key)){const c=tinted.get(key);tinted.delete(key);tinted.set(key,c);return c;}
 const [photo,mask]=await Promise.all([load(`assets/photo-card/${name}.webp?v=${VERSION}`),load(`assets/photo-card/${name}__mask.webp?v=${VERSION}`)]);
 const c=document.createElement('canvas');c.width=photo.naturalWidth||SOURCE[0];c.height=photo.naturalHeight||SOURCE[1];
 const p=c.getContext('2d',{willReadFrequently:true});p.drawImage(photo,0,0,c.width,c.height);
 try{
  const out=p.getImageData(0,0,c.width,c.height),mc=document.createElement('canvas');mc.width=c.width;mc.height=c.height;
  const mp=mc.getContext('2d',{willReadFrequently:true});mp.drawImage(mask,0,0,c.width,c.height);const m=mp.getImageData(0,0,c.width,c.height).data;
  tint(out.data,m,0,rgb(shoe),.55);
  if(!['none','blacksheer','pantyhose'].includes(sock))tint(out.data,m,1,rgb(hose),.3);
  p.putImageData(out,0,0);c.dataset.tinted='true';
 }catch(e){c.dataset.tinted='false';} // e.g. opened from file://: show the white picture
 tinted.set(key,c);while(tinted.size>LIMIT)tinted.delete(tinted.keys().next().value);
 return c;
}
// Fill the card like CSS object-fit: cover, trimming mostly from the top so
// the feet stay clear of the caption strip.
function draw(target,source){
 const p=target.getContext('2d'),W=target.width,H=target.height,s=Math.max(W/source.width,H/source.height),w=source.width*s,h=source.height*s;
 p.clearRect(0,0,W,H);p.imageSmoothingEnabled=true;p.imageSmoothingQuality='high';p.drawImage(source,(W-w)/2,(H-h)*.85,w,h);
}
async function render(target,design,fitting,isCurrent=()=>true){
 target.dataset.photoCardReady='false';
 const source=await picture(design,fitting);if(!isCurrent())return false;
 draw(target,source);
 Object.assign(target.dataset,{renderer:'photo-card',photoCardReady:'true',heel:design.heel,color:design.color,sock:sockFor(fitting?.sock),sockColor:fitting?.color||'',tinted:source.dataset.tinted});
 return true;
}
// Same controller shape as Fitting2D.mount: {canvas, ready, update, dispose, debug}.
function mount(host,design,fitting){
 const target=document.createElement('canvas');target.className='fitting2d-canvas photo-card-canvas';target.setAttribute('role','img');
 target.setAttribute('aria-label',A.lang==='zh'?'双脚穿着你的鞋款与袜子搭配':'Both feet wearing your shoes and chosen socks');host.replaceChildren(target);
 let disposed=false,token=0,current={design,fitting};
 const fit=()=>{const dpr=Math.min(2,globalThis.devicePixelRatio||1),w=Math.max(1,Math.round(host.clientWidth*dpr)),h=Math.max(1,Math.round(host.clientHeight*dpr));if(target.width===w&&target.height===h)return false;target.width=w;target.height=h;return true;};
 const controller={canvas:target,ready:null,
  update(nextDesign=current.design,nextFitting=current.fitting){if(disposed)return Promise.resolve(false);current={design:nextDesign,fitting:nextFitting};const mine=++token;
   controller.ready=render(target,current.design,current.fitting,()=>!disposed&&mine===token).catch(error=>{console.warn(error);return false;});return controller.ready;},
  dispose(){disposed=true;observer.disconnect();target.remove();},
  debug(){return {renderer:'photo-card',ready:target.dataset.photoCardReady==='true',design:{...current.design},fitting:{...current.fitting},cached:tinted.size};}};
 fit();const observer=new ResizeObserver(()=>{if(!disposed&&fit())controller.update();});observer.observe(host);controller.update();
 return controller;
}
A.PhotoCard={has,mount,render,sockFor};
})(globalThis.SweetShoe=globalThis.SweetShoe||{});
