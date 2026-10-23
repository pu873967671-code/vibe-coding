'use strict';
(function(A){
 const scenes=[
  {id:'salon',en:'Atelier salon',zh:'试穿沙龙',price:0,image:'bg_fitting'},
  {id:'mirror_lounge',en:'Mirror lounge',zh:'镜前客厅',price:120,image:'scenes/scene_mirror_lounge'},
  {id:'car',en:'City escape',zh:'车内时光',price:240,image:'scenes/scene_car'},
  {id:'vanity',en:'Golden vanity',zh:'梳妆台卧室',price:360,image:'scenes/scene_vanity'},
  {id:'balcony',en:'Rose balcony',zh:'花园阳台',price:500,image:'scenes/scene_balcony'}
 ];
 const find=id=>scenes.find(x=>x.id===id);
 function sanitize(value){const owned=['salon',...new Set((Array.isArray(value?.owned)?value.owned:[]).filter(id=>id!=='salon'&&find(id)))];return {version:1,owned,selected:owned.includes(value?.selected)?value.selected:'salon'};}
 function choose(state,id,artwork){const scene=find(id);if(!scene)return {ok:false,reason:'scene'};const room=state.showcase||(state.showcase=sanitize());const unlocked=!room.owned.includes(id);if(unlocked){if(!Number.isFinite(state.coins)||state.coins<scene.price)return {ok:false,reason:'coins'};state.coins-=scene.price;room.owned.push(id);}room.selected=id;if(artwork)artwork.scene=id;return {ok:true,unlocked,scene};}
 function picker(state,id){const room=state.showcase||sanitize(),zh=A.lang==='zh';return `<div class="showcase-heading"><span>${zh?'展示场景':'Your little escapes'}</span><span><img src="assets/icon_coin.webp" alt=""> ${state.coins}</span></div><div class="showcase-picker" role="group" aria-label="${zh?'展示场景':'Showcase scenes'}">${scenes.map(s=>{const owned=room.owned.includes(s.id),name=zh?s.zh:s.en;return `<button class="showcase-chip ${id===s.id?'selected':''} ${owned?'owned':'locked'}" data-showcase="${s.id}" aria-pressed="${id===s.id}" aria-label="${owned?name:(zh?'解锁 ':'Unlock ')+name+' · '+s.price+(zh?' 金币':' coins')}"><img src="assets/${s.image}${s.id==='salon'?'':'_thumb'}.webp" alt=""><span>${name}</span><small>${owned?(id===s.id?'✓':(zh?'已拥有':'Owned')):'<img class="scene-lock" src="assets/items/ui_lock.webp" alt=""> '+s.price}</small></button>`;}).join('')}</div>`;}
 A.Showcase={scenes,find,sanitize,choose,picker};
})(globalThis.SweetShoe=globalThis.SweetShoe||{});
