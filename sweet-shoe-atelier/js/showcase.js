'use strict';
(function(A){
 const sockStyles=['none','frill','lace','sheer','knee','thigh','blacksheer','pantyhose','opaque','fishnet'],sockColors=['pink','mint','cream','white','black'];
 function cleanFittingOptions(value){return {sock:sockStyles.includes(value?.sock)?value.sock:'none',color:sockColors.includes(value?.color)?value.color:'cream'};}
 A.cleanFittingOptions=cleanFittingOptions;
 const scenes=[
  {id:'salon',en:'Atelier salon',zh:'试穿沙龙',price:0,image:'bg_fitting'},
  {id:'mirror_lounge',en:'Mirror lounge',zh:'镜前客厅',price:120,image:'scenes/scene_mirror_lounge'},
  {id:'car',en:'City escape',zh:'车内时光',price:240,image:'scenes/scene_car'},
  {id:'vanity',en:'Golden vanity',zh:'梳妆台卧室',price:360,image:'scenes/scene_vanity'},
  {id:'balcony',en:'Rose balcony',zh:'花园阳台',price:500,image:'scenes/scene_balcony'}
 ];
 scenes.forEach(s=>{s.closeImage='scenes/fixed_'+s.id;s.thumbnail=s.closeImage;});
 const find=id=>scenes.find(x=>x.id===id);
 function sanitize(value){const owned=['salon',...new Set((Array.isArray(value?.owned)?value.owned:[]).filter(id=>id!=='salon'&&find(id)))];return {version:1,owned,selected:owned.includes(value?.selected)?value.selected:'salon'};}
 function choose(state,id,artwork){const scene=find(id);if(!scene)return {ok:false,reason:'scene'};const room=state.showcase||(state.showcase=sanitize());const unlocked=!room.owned.includes(id);if(unlocked){if(!Number.isFinite(state.coins)||state.coins<scene.price)return {ok:false,reason:'coins'};state.coins-=scene.price;room.owned.push(id);}room.selected=id;if(artwork)artwork.scene=id;return {ok:true,unlocked,scene};}
 function picker(state,id){const room=state.showcase||sanitize(),zh=A.lang==='zh';return `<div class="showcase-heading"><span>${zh?'展示场景':'Your little escapes'}</span><span><img src="assets/icon_coin.webp" alt=""> ${state.coins}</span></div><div class="showcase-picker" role="group" aria-label="${zh?'展示场景':'Showcase scenes'}">${scenes.map(s=>{const owned=room.owned.includes(s.id),name=zh?s.zh:s.en;return `<button class="showcase-chip ${id===s.id?'selected':''} ${owned?'owned':'locked'}" data-showcase="${s.id}" aria-pressed="${id===s.id}" aria-label="${owned?name:(zh?'解锁 ':'Unlock ')+name+' · '+s.price+(zh?' 金币':' coins')}"><img src="assets/${s.thumbnail}.webp" alt=""><span>${name}</span><small>${owned?(id===s.id?'✓':(zh?'已拥有':'Owned')):'<img class="scene-lock" src="assets/items/ui_lock.webp" alt=""> '+(zh?'解锁 ':'Buy ')+s.price}</small></button>`;}).join('')}</div>`;}
 // Fixed camera authored against user_fixed_framing_1155.webp. These are
 // measured source pixels on the BAKED top surface, excluding the front rim.
 // Every room shares the same 610 x 620 camera. USER12:47 reveals only its
 // y100..600 crop; resizing still uses the original camera's uniform scale.
 const framing={
  salon:{size:[864,1222],horizon:550/1222,platform:{center:[433,728],rx:340,ry:74,depth:30}},
  mirror_lounge:{size:[848,1264],horizon:560/1264,platform:{center:[424,750],rx:348,ry:74,depth:34}},
  car:{size:[848,1264],horizon:550/1264,platform:{center:[424,752],rx:334,ry:72,depth:31}},
  vanity:{size:[848,1264],horizon:560/1264,platform:{center:[424,752],rx:349,ry:74,depth:33}},
  balcony:{size:[896,1200],horizon:520/1200,platform:{center:[448,712],rx:357,ry:73,depth:30}}
 };
 const composition=Object.freeze({width:610,height:620,cx:305,cy:490,ry:59,footScale:.33,floor:542,extra:650,crop:Object.freeze({x:0,y:100,width:610,height:500})});
 function project(id,w,h,cropped=false){
  const room=framing[id]||framing.salon,anchor=room.platform,c=composition;
  const view=cropped===true?c.crop:{x:0,y:0,width:c.width,height:c.height};
  const uniform=Math.min(w/view.width,h/view.height),ox=(w-view.width*uniform)/2-view.x*uniform,oy=(h-view.height*uniform)/2-view.y*uniform;
  const imageScale=c.ry/anchor.ry*uniform,[iw,ih]=room.size;
  const cx=ox+c.cx*uniform,cy=oy+c.cy*uniform;
  const background={x:cx-anchor.center[0]*imageScale,y:cy-anchor.center[1]*imageScale,width:iw*imageScale,height:ih*imageScale};
  return {scene:framing[id]?id:'salon',cx,cy,rx:anchor.rx*imageScale,ry:anchor.ry*imageScale,ratio:anchor.ry/anchor.rx,depth:anchor.depth*imageScale,
   scale:c.footScale*uniform,uniform,ox,oy,floor:oy+c.floor*uniform,extra:c.extra,
   horizon:background.y+ih*room.horizon*imageScale,background,baked:true,composition:[view.width,view.height],crop:cropped===true?c.crop:null};
 }
 // Reveal a saved choice when its strip is rebuilt or changes width. Leave
 // deliberate browsing alone between those events; never scroll the page.
 function revealChoice(picker,chip,value){
  if(!picker||!chip||!picker.clientWidth)return;
  const width=String(picker.clientWidth);
  if(picker.dataset.revealedChoice===value&&picker.dataset.revealedWidth===width)return;
  const p=picker.getBoundingClientRect(),c=chip.getBoundingClientRect();
  if(c.right>p.right-2)picker.scrollLeft+=c.right-p.right+2;
  else if(c.left<p.left+2)picker.scrollLeft-=p.left-c.left+2;
  picker.dataset.revealedChoice=value;picker.dataset.revealedWidth=width;
 }
 function frame(stage){
  if(!stage)return;const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;
  // The dock and header frame the picture. They never change its camera or
  // stretch the calves. Portrait and landscape share the same immutable crop.
  stage.classList.remove('zoomed');stage.classList.remove('show-product-detail');
  const root=stage.closest('.runway'),dock=root?.querySelector('.runway-dock');
  const heading=root?.querySelector('.runway-heading'),stageBox=stage.getBoundingClientRect();
  const top=heading?heading.getBoundingClientRect().bottom-stageBox.top:0;
  const host=stage.querySelector('.runway-worn-window');
  if(host){
   // Keep the approved full-camera scale, then CUT its upper/lower extent.
   // Fitting the shorter crop to the available height would enlarge the feet.
   const legacyClearance=w<h?248:160;
   const available=Math.max(1,h-top-legacyClearance),uniform=Math.min(w/composition.width,available/composition.height);
   const width=composition.crop.width*uniform,height=composition.crop.height*uniform;
   const x=(w-width)/2,y=top;
   Object.assign(host.style,{left:x+'px',top:y+'px',width:width+'px',height:height+'px',right:'auto',bottom:'auto'});
   root?.style.setProperty('--fitting-picture-width',width+'px');
   // The dock starts on the picture's lower edge at every aspect ratio. Its
   // enlarged surface consumes the released space rather than exposing blur.
   if(dock)dock.style.top=(top+height)+'px';
   stage.style.setProperty('--dock-clearance',(h-top-height)+'px');
   const projected=project(stage.dataset.showcaseScene,width,height,true),bg=projected.background;
   // Project the same room beyond the picture without moving the feet.
   host.style.backgroundImage='none';
   stage.style.setProperty('--room-background-size',`${bg.width}px ${bg.height}px`);
   stage.style.setProperty('--room-background-position',`${x+bg.x}px ${y+bg.y}px`);
   stage.style.setProperty('--room-left',`${x+bg.x}px`);
   stage.style.setProperty('--room-right',`${x+bg.x+bg.width}px`);
   stage.dataset.floorProjection=JSON.stringify({...projected,frame:{x,y,width,height}});
   stage.dataset.fixedFraming='610x500';stage.dataset.zoomEnabled='false';
  }
  // Buying a room rebuilds the dock. Keep the selected chip fully visible,
  // without scrolling the viewport or moving the separate Share actions.
  const picker=root?.querySelector('.showcase-picker');
  revealChoice(picker,picker?.querySelector('.showcase-chip.selected'),stage.dataset.showcaseScene);
  const socks=root?.querySelector('.runway-sock-styles'),selected=socks?.querySelector('[aria-pressed="true"]');
  revealChoice(socks,selected,selected?.dataset.fittingSock);
 }
 A.Showcase={scenes,find,sanitize,choose,picker,frame,framing,project,composition};
})(globalThis.SweetShoe=globalThis.SweetShoe||{});
