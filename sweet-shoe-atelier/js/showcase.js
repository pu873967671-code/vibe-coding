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
 scenes.forEach(s=>s.closeImage='scenes/close_'+s.id);
 scenes[0].closeImage='bg_fitting';
 const find=id=>scenes.find(x=>x.id===id);
 function sanitize(value){const owned=['salon',...new Set((Array.isArray(value?.owned)?value.owned:[]).filter(id=>id!=='salon'&&find(id)))];return {version:1,owned,selected:owned.includes(value?.selected)?value.selected:'salon'};}
 function choose(state,id,artwork){const scene=find(id);if(!scene)return {ok:false,reason:'scene'};const room=state.showcase||(state.showcase=sanitize());const unlocked=!room.owned.includes(id);if(unlocked){if(!Number.isFinite(state.coins)||state.coins<scene.price)return {ok:false,reason:'coins'};state.coins-=scene.price;room.owned.push(id);}room.selected=id;if(artwork)artwork.scene=id;return {ok:true,unlocked,scene};}
 function picker(state,id){const room=state.showcase||sanitize(),zh=A.lang==='zh';return `<div class="showcase-heading"><span>${zh?'展示场景':'Your little escapes'}</span><span><img src="assets/icon_coin.webp" alt=""> ${state.coins}</span></div><div class="showcase-picker" role="group" aria-label="${zh?'展示场景':'Showcase scenes'}">${scenes.map(s=>{const owned=room.owned.includes(s.id),name=zh?s.zh:s.en;return `<button class="showcase-chip ${id===s.id?'selected':''} ${owned?'owned':'locked'}" data-showcase="${s.id}" aria-pressed="${id===s.id}" aria-label="${owned?name:(zh?'解锁 ':'Unlock ')+name+' · '+s.price+(zh?' 金币':' coins')}"><img src="assets/${s.image}${s.id==='salon'?'':'_thumb'}.webp" alt=""><span>${name}</span><small>${owned?(id===s.id?'✓':(zh?'已拥有':'Owned')):'<img class="scene-lock" src="assets/items/ui_lock.webp" alt=""> '+(zh?'解锁 ':'Buy ')+s.price}</small></button>`;}).join('')}</div>`;}
 // One low camera for the immutable worn paintings. Backgrounds contain no
 // stage: this floor-plane calibration owns the only platform in each room.
 // Normalized anchors describe the room, not the cropped viewport.
 const framing={
  salon:{size:[1536,1024],horizon:.40,platform:{center:[.50,.80],rx:.52,ry:.156},top:'#f2fff8',edge:'#acd7c4'},
  mirror_lounge:{size:[1536,1024],horizon:.40,platform:{center:[.50,.80],rx:.52,ry:.156},top:'#f6fff9',edge:'#b7d8c8'},
  car:{size:[1536,1024],horizon:.40,platform:{center:[.50,.80],rx:.52,ry:.156},top:'#f1faf5',edge:'#b0ccbf'},
  vanity:{size:[1536,1024],horizon:.40,platform:{center:[.50,.80],rx:.52,ry:.156},top:'#fffaf2',edge:'#dcc8ac'},
  balcony:{size:[1536,1024],horizon:.40,platform:{center:[.50,.80],rx:.52,ry:.156},top:'#fff9f2',edge:'#d5c4b7'}
 };
 function project(id,w,h,header=60,unit=1){
  const room=framing[id]||framing.salon,anchor=room.platform;
  // Width and visible shoe height constrain the whole camera together. The
  // ellipse ratio never changes when the dock grows or the device rotates.
  const scale=Math.max(.01,Math.min(w*.44/(230/.30),Math.max(40,h-header)*.90/800));
  const rx=230/.30*scale,ratio=anchor.ry/anchor.rx,ry=rx*ratio,depth=14*scale;
  const cx=w*anchor.center[0],cy=h-ry-depth-12*unit;
  return {scene:framing[id]?id:'salon',cx,cy,rx,ry,ratio,depth,scale,
   horizon:cy-(anchor.center[1]-room.horizon)/anchor.rx*rx,
   floor:cy+174*scale,top:room.top,edge:room.edge};
 }
 function frame(stage){
  if(!stage)return;const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;
  const dock=stage.closest('.runway')?.querySelector('.runway-dock'),clearance=Math.max((dock?.offsetHeight||0)+36,dock?h-(dock.getBoundingClientRect().top-stage.getBoundingClientRect().top)+16:0);
  const detail=stage.dataset.runwayAngle==='side'&&stage.dataset.showcaseScene!=='car';
  const art=stage.querySelector('.runway-angle-art'),ratio=parseFloat(art?.style.getPropertyValue('--foot-aspect'))||1.2;
  const available=Math.max(80,h-clearance-80),zoom=stage.classList.contains('zoomed')?1.08:1;
  const fitHeight=Math.min(Math.min(available*(detail?.84:.94)*zoom,available*(detail?.87:1)),(w-40)/(detail?1.35:ratio));
  for(const [key,value] of Object.entries({'dock-clearance':clearance,'fit-height':fitHeight,'fit-left':w*.5,'fit-bottom':clearance+Math.max(0,(available-fitHeight)*.12)}))stage.style.setProperty('--'+key,value+'px');
  const host=stage.querySelector('.runway-worn-window'),room=framing[stage.dataset.showcaseScene]||framing.salon;
  if(host){
   const stageBox=stage.getBoundingClientRect(),box=host.getBoundingClientRect();
   const projected=project(stage.dataset.showcaseScene,box.width,box.height,stage.closest('.runway')?.querySelector('.runway-heading')?.offsetHeight||60);
   const horizon=projected.horizon+box.top-stageBox.top,[iw,ih]=room.size;
   // Cover the viewport while pinning the painted vanishing line to exactly
   // the same horizon as the platform. Portrait crops never tilt the floor.
   const imageScale=Math.max(w/iw,horizon/(ih*room.horizon),(h-horizon)/(ih*(1-room.horizon)));
   const background={width:iw*imageScale,height:ih*imageScale,x:(w-iw*imageScale)/2,y:horizon-ih*room.horizon*imageScale};
   stage.style.backgroundSize=`100% 100%, ${background.width}px ${background.height}px`;
   stage.style.backgroundPosition=`0 0, ${background.x}px ${background.y}px`;
   stage.dataset.floorProjection=JSON.stringify({...projected,background});
  }
  // Buying a room rebuilds the dock. Keep the selected chip fully visible,
  // without scrolling the viewport or moving the separate Share actions.
  const picker=stage.closest('.runway')?.querySelector('.showcase-picker'),chip=picker?.querySelector('.showcase-chip.selected');
  if(picker&&chip&&(stage.dataset.revealedScene!==stage.dataset.showcaseScene||stage.dataset.revealedPickerWidth!==String(picker.clientWidth))){
   const p=picker.getBoundingClientRect(),c=chip.getBoundingClientRect();
   if(c.right>p.right-2)picker.scrollLeft+=c.right-p.right+2;else if(c.left<p.left+2)picker.scrollLeft-=p.left-c.left+2;
   stage.dataset.revealedScene=stage.dataset.showcaseScene;stage.dataset.revealedPickerWidth=String(picker.clientWidth);
  }
 }
 A.Showcase={scenes,find,sanitize,choose,picker,frame,framing,project};
})(globalThis.SweetShoe=globalThis.SweetShoe||{});
