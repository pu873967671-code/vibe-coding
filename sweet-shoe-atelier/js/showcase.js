'use strict';
(function(A){
 const scenes=[
  {id:'salon',en:'Atelier salon',zh:'试穿沙龙',price:0,image:'bg_fitting'},
  {id:'mirror_lounge',en:'Mirror lounge',zh:'镜前客厅',price:120,image:'scenes/scene_mirror_lounge'},
  {id:'car',en:'City escape',zh:'车内时光',price:240,image:'scenes/scene_car'},
  {id:'vanity',en:'Golden vanity',zh:'梳妆台卧室',price:360,image:'scenes/scene_vanity'},
  {id:'balcony',en:'Rose balcony',zh:'花园阳台',price:500,image:'scenes/scene_balcony'}
 ];
 scenes.forEach(s=>s.closeImage='scenes/close_'+s.id);
 const find=id=>scenes.find(x=>x.id===id);
 function sanitize(value){const owned=['salon',...new Set((Array.isArray(value?.owned)?value.owned:[]).filter(id=>id!=='salon'&&find(id)))];return {version:1,owned,selected:owned.includes(value?.selected)?value.selected:'salon'};}
 function choose(state,id,artwork){const scene=find(id);if(!scene)return {ok:false,reason:'scene'};const room=state.showcase||(state.showcase=sanitize());const unlocked=!room.owned.includes(id);if(unlocked){if(!Number.isFinite(state.coins)||state.coins<scene.price)return {ok:false,reason:'coins'};state.coins-=scene.price;room.owned.push(id);}room.selected=id;if(artwork)artwork.scene=id;return {ok:true,unlocked,scene};}
 function picker(state,id){const room=state.showcase||sanitize(),zh=A.lang==='zh';return `<div class="showcase-heading"><span>${zh?'展示场景':'Your little escapes'}</span><span><img src="assets/icon_coin.webp" alt=""> ${state.coins}</span></div><div class="showcase-picker" role="group" aria-label="${zh?'展示场景':'Showcase scenes'}">${scenes.map(s=>{const owned=room.owned.includes(s.id),name=zh?s.zh:s.en;return `<button class="showcase-chip ${id===s.id?'selected':''} ${owned?'owned':'locked'}" data-showcase="${s.id}" aria-pressed="${id===s.id}" aria-label="${owned?name:(zh?'解锁 ':'Unlock ')+name+' · '+s.price+(zh?' 金币':' coins')}"><img src="assets/${s.image}${s.id==='salon'?'':'_thumb'}.webp" alt=""><span>${name}</span><small>${owned?(id===s.id?'✓':(zh?'已拥有':'Owned')):'<img class="scene-lock" src="assets/items/ui_lock.webp" alt=""> '+s.price}</small></button>`;}).join('')}</div>`;}
 // Coordinates are authored against the local background, so cover-cropping
 // changes the room and the fitted pair together at every aspect ratio.
 const framing={
  salon:{size:[1536,1024],position:[.5,.65],feet:[.55,.87],height:770},
  mirror_lounge:{size:[1672,941],position:[.30,.20],portrait:[.24,.5],feet:[.59,.58],height:470},
  car:{size:[1536,1024],position:[.5,.72],portrait:[.30,.72],feet:[.32,.8725],height:455},
  vanity:{size:[1536,1024],position:[.5,.77],feet:[.57,.88],height:650},
  balcony:{size:[1672,940],position:[.5,.76],feet:[.53,.87],height:690}
 };
 function frame(stage){
  if(!stage)return;const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;
  const dock=stage.closest('.runway')?.querySelector('.runway-dock'),clearance=Math.max((dock?.offsetHeight||0)+36,dock?h-(dock.getBoundingClientRect().top-stage.getBoundingClientRect().top)+16:0);
  const detail=stage.dataset.runwayAngle==='side'&&stage.dataset.showcaseScene!=='car';
  const art=stage.querySelector('.runway-angle-art'),ratio=parseFloat(art?.style.getPropertyValue('--foot-aspect'))||1.2;
  const available=Math.max(80,h-clearance-80),zoom=stage.classList.contains('zoomed')?1.08:1;
  const fitHeight=Math.min(Math.min(available*(detail?.84:.94)*zoom,available*(detail?.87:1)),(w-40)/(detail?1.35:ratio));
  for(const [key,value] of Object.entries({'dock-clearance':clearance,'fit-height':fitHeight,'fit-left':w*.5,'fit-bottom':clearance+Math.max(0,(available-fitHeight)*.12)}))stage.style.setProperty('--'+key,value+'px');
  stage.style.backgroundPosition='50% 72%';
 }
 A.Showcase={scenes,find,sanitize,choose,picker,frame,framing};
})(globalThis.SweetShoe=globalThis.SweetShoe||{});
