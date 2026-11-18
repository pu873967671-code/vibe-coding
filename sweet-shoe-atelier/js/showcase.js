'use strict';
(function(A){
 const sockStyles=['none','frill','lace','sheer','knee','thigh','blacksheer','pantyhose','opaque','fishnet'],sockColors=['pink','mint','cream','white','black'];
 function cleanFittingOptions(value){const o={sock:sockStyles.includes(value?.sock)?value.sock:'none',color:sockColors.includes(value?.color)?value.color:'cream'};if(typeof value?.skin==='string'&&/^#[0-9a-f]{6}$/i.test(value.skin))o.skin=value.skin.toLowerCase();return o;}
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
 function picker(state,id){const room=state.showcase||sanitize(),zh=A.lang==='zh';return `<div class="showcase-heading"><span>${zh?'展示场景':'Your little escapes'}</span><span><img src="assets/icons/coin.svg" alt=""> ${state.coins}</span></div><div class="showcase-picker" role="group" aria-label="${zh?'展示场景':'Showcase scenes'}">${scenes.map(s=>{const owned=room.owned.includes(s.id),name=zh?s.zh:s.en;return `<button class="showcase-chip ${id===s.id?'selected':''} ${owned?'owned':'locked'}" data-showcase="${s.id}" aria-pressed="${id===s.id}" aria-label="${owned?name:(zh?'解锁 ':'Unlock ')+name+' · '+s.price+(zh?' 金币':' coins')}"><img src="assets/${s.thumbnail}.webp" alt=""><span>${name}</span><small>${owned?(id===s.id?'✓':(zh?'已拥有':'Owned')):'<img class="scene-lock" src="assets/icons/lock.svg" alt=""> '+(zh?'解锁 ':'Buy ')+s.price}</small></button>`;}).join('')}</div>`;}
 // A retired/missing recommended room falls back without changing saved people.
 function recommended(themeId){const theme=A.themes.find(t=>t.id===themeId);return find(theme?.scene)||find('mirror_lounge');}
 function sceneHint(state,themeId){return '';const scene=recommended(themeId),owned=state.showcase?.owned.includes(scene.id),name=A.lang==='zh'?scene.zh:scene.en;return `<span class="scene-recommendation"><img src="assets/${scene.thumbnail}.webp" alt=""><span>${A.t('sceneRecommended').replace('{scene}',name)}${owned?'':` <span class="scene-hint-price"><img src="assets/icons/lock.svg" alt="${A.t('unlock')}"> ${scene.price} ${A.t('coins')}</span>`}</span></span>`;}
 function bonusAmount(artwork){return Number.isFinite(artwork?.orderEarned)&&artwork.orderEarned>0?Math.round(artwork.orderEarned*1.2)-artwork.orderEarned:0;}
 function claimSceneBonus(state,artwork,sceneId){
  if(!artwork||artwork.sceneBonusClaimed||!A.themes.some(t=>t.id===artwork.customerTheme)||!state.showcase?.owned.includes(sceneId)||recommended(artwork.customerTheme).id!==sceneId)return 0;
  const amount=bonusAmount(artwork);if(!amount)return 0;
  artwork.sceneBonusClaimed=true;artwork.sceneBonus=amount;artwork.sceneAppearance=sceneId;
  state.coins+=amount;state.dayCoins+=amount;
  if(state.best?.customerTheme===artwork.customerTheme&&state.best.day===artwork.day&&state.best.earned===artwork.orderEarned){state.best.earned+=amount;}
  return amount;
 }
 function bonusLine(artwork){if(!artwork?.customerTheme||!bonusAmount(artwork))return '';const scene=recommended(artwork.customerTheme),name=A.lang==='zh'?scene.zh:scene.en;return `<p class="scene-bonus-line" data-scene-bonus="${artwork.sceneBonusClaimed?'claimed':'pending'}"><strong>${A.t('sceneBonus')} +${bonusAmount(artwork)}</strong><span>${artwork.sceneBonusClaimed?A.t('sceneAppearance'):A.t('scenePending').replace('{scene}',name)}</span></p>`;}
 function appearance(artwork){return '';return artwork?.sceneBonusClaimed?`<div class="scene-photo-caption"><strong>${A.t('sceneAppearance')}</strong><p>“${A.t('appearance_'+artwork.customerTheme)}”</p></div>`:'';}
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
 const composition=Object.freeze({width:610,height:620,cx:305,cy:490,ry:59,footScale:.33,floor:542,extra:650,crop:Object.freeze({x:135,y:158,width:340,height:478}),
  // the camera the worn paintings were placed in; display crops never move them
  ref:Object.freeze({x:0,y:100,width:610,height:500})});
 function project(id,w,h,cropped=false){
  const room=framing[id]||framing.salon,anchor=room.platform,c=composition;
  const view=cropped===true?c.crop:cropped==='ref'?c.ref:{x:0,y:0,width:c.width,height:c.height};
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
   // Ordinary screens keep the approved full-camera scale and crop; very
   // wide screens enlarge that same crop uniformly beside the controls.
   const ultrawide=window.matchMedia('(min-width: 2200px) and (orientation: landscape)').matches;
   // The portrait photo card sits beside its controls on any landscape screen.
   const rail=ultrawide||stage.classList.contains('card-mode')&&w>=700&&w/h>=1.15,railW=ultrawide?500:Math.round(Math.max(300,Math.min(460,w*.42)))+40;
   root?.classList.toggle('card-rail',rail&&!ultrawide);root?.style.setProperty('--rail-w',(railW-40)+'px');
   const legacyClearance=w<h?248:160;
   // On very wide displays the controls have their own side rail, leaving the
   // fixed camera room to use the full available height. Keep its projection
   // uniform and reserve enough horizontal space for the rail.
   // The picture is the knees-down crop; it takes the height the dock leaves
   // (measured, not guessed) so the feet never sit behind the controls.
   const dockSpace=dock&&dock.offsetHeight?dock.offsetHeight+12:legacyClearance;
   const gap=stage.classList.contains('card-mode')?14:0; // the photo card floats with a little air
   // without a side rail the styling wish sits on its own line above the card
   const brief=stage.querySelector('.styling-brief'),stack=gap&&!rail&&brief;if(brief)brief.style.top=stack?(top+8)+'px':'';
   const briefH=stack?brief.offsetHeight+8:0;
   const available=Math.max(1,h-top-(rail?16:dockSpace)-2*gap-briefH);
   const pictureSpace=rail?Math.max(1,w-railW):w;
   const uniform=rail?Math.min(pictureSpace/composition.crop.width,available/composition.crop.height):Math.min(w/composition.crop.width,available/composition.crop.height,1.75);
   const width=composition.crop.width*uniform,height=composition.crop.height*uniform;
   const x=(pictureSpace-width)/2,y=top+gap+briefH;
   Object.assign(host.style,{left:x+'px',top:y+'px',width:width+'px',height:height+'px',right:'auto',bottom:'auto'});
   root?.style.setProperty('--fitting-picture-width',width+'px');
   // The regular dock meets the picture; the wide side rail is centered in
   // the space below the heading and may scroll within a short viewport.
   if(dock)dock.style.top=rail?(top+Math.max(0,(h-top-dock.offsetHeight)/2))+'px':(top+height+2*gap+briefH)+'px';
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
 // Styling wish: every commission asks for a sock style, a sock colour and a
 // room. Each matched item is a heart; each heart pays 10% of the order once
 // (at least 5 coins). Improving a look later pays only the difference, and
 // coins already paid by the older single scene bonus count toward it.
 const STYLING={date:['frill','pink'],tea:['lace','cream'],school:['knee','white'],wedding:['lace','white'],everyday:['none',null],party:['blacksheer',null],streamer:['thigh','pink'],redcarpet:['sheer','black'],bridal:['sheer','white']};
 const COLORLESS=new Set(['none','blacksheer','pantyhose']);
 const SOCK_LABELS={none:['Bare legs','光腿'],frill:['Frill socks','荷叶边袜'],lace:['Lace socks','蕾丝袜'],sheer:['Sheer tights','薄丝袜'],knee:['Knee-highs','及膝袜'],thigh:['Thigh-highs','长筒袜'],blacksheer:['Black sheer','黑丝袜'],pantyhose:['Sheer pantyhose','薄连裤袜'],opaque:['Opaque tights','厚连裤袜'],fishnet:['Diamond knit','菱格袜']};
 const COLOR_LABELS={pink:['Candy pink','糖果粉'],mint:['Mint','薄荷绿'],cream:['Cream','奶油色'],white:['White','白色'],black:['Midnight','午夜黑']};
 const label=(map,id)=>(map[id]||[id,id])[A.lang==='zh'?1:0];
 function brief(artwork){
  const theme=A.themes.find(t=>t.id===artwork?.customerTheme);if(!theme||!(artwork.orderEarned>0))return null;
  const [sock,color]=STYLING[theme.id]||['none',null];
  return {sock,color:COLORLESS.has(sock)?null:color,scene:recommended(theme.id).id};
 }
 // Colour only counts with the right sock; for a colourless brief (bare legs,
 // black sheer) the colour heart comes with the sock.
 function stylingChecks(artwork,fitting,sceneId){
  const b=brief(artwork);if(!b)return null;const f=cleanFittingOptions(fitting);
  // Rooms were retired for the photo card: the wish is the sock and its colour.
  const sock=f.sock===b.sock,color=sock&&(b.color===null||f.color===b.color);
  return {brief:b,sock,color,hearts:(sock?1:0)+(color?1:0)};
 }
 function heartValue(artwork){return Number.isFinite(artwork?.orderEarned)&&artwork.orderEarned>0?Math.max(8,Math.round(artwork.orderEarned*.15)):0;}
 function stylingPaid(artwork){return Number.isInteger(artwork?.stylingPaid)?artwork.stylingPaid:artwork?.sceneBonusClaimed?bonusAmount(artwork):0;}
 function claimStyling(state,artwork,fitting,sceneId){
  const c=stylingChecks(artwork,fitting,sceneId);if(!c)return {paid:0,checks:c};
  const best=Math.min(MAX_HEARTS,Math.max(c.hearts,artwork.stylingHearts|0)),target=best*heartValue(artwork),before=stylingPaid(artwork),paid=Math.max(0,target-before);
  artwork.stylingHearts=best;artwork.stylingPaid=Math.max(before,target);
  if(paid){state.coins+=paid;state.dayCoins+=paid;
   if(state.best?.customerTheme===artwork.customerTheme&&state.best.day===artwork.day&&state.best.earned>=artwork.orderEarned)state.best.earned+=paid;}
  const perfect=best===MAX_HEARTS&&!artwork.perfectLook;if(perfect)artwork.perfectLook=true;
  return {paid,checks:c,perfect};
 }
 const MAX_HEARTS=2;
 function heartIcons(n){return '<span class="styling-hearts" aria-hidden="true">'+[0,1].map(i=>`<i class="${i<n?'on':''}">♥</i>`).join('')+'</span>';}
 function stylingCard(state,artwork,fitting,sceneId){
  const c=stylingChecks(artwork,fitting,sceneId);if(!c)return '';const zh=A.lang==='zh',b=c.brief;
  const best=Math.min(MAX_HEARTS,Math.max(c.hearts,artwork.stylingHearts|0)),value=heartValue(artwork);
  const item=(ok,text)=>`<li class="${ok?'ok':''}"><b aria-hidden="true">${ok?'✓':'○'}</b>${text}</li>`;
  const colorText=b.color?label(COLOR_LABELS,b.color):(zh?'任意颜色':'Any colour');
  return `<div class="styling-brief" data-hearts="${best}" role="status" aria-label="${zh?'造型心愿':'Styling wish'}: ${c.hearts}/2"><strong class="styling-title">${zh?'造型心愿':'Styling wish'}</strong>${heartIcons(best)}<ul>${item(c.sock,label(SOCK_LABELS,b.sock))}${item(c.color,colorText)}</ul><span class="styling-reward"><img src="assets/icons/coin.svg" alt=""> ${best*value}/${MAX_HEARTS*value}</span></div>`;
 }
 function stylingTeaser(artwork){const b=brief(artwork);if(!b)return '';const zh=A.lang==='zh';
  return `<p class="styling-teaser">${heartIcons(0)}<span>${zh?'试穿造型心愿':'Styling wish'}: ${label(SOCK_LABELS,b.sock)}${b.color?' · '+label(COLOR_LABELS,b.color):''} — ${zh?'最多':'up to'} +${MAX_HEARTS*heartValue(artwork)} ${zh?'金币':'coins'}</span></p>`;}
 A.Showcase={scenes,find,sanitize,choose,picker,frame,framing,project,composition,recommended,sceneHint,bonusAmount,claimSceneBonus,bonusLine,appearance,brief,stylingChecks,heartValue,stylingPaid,claimStyling,stylingCard,stylingTeaser,STYLING};
})(globalThis.SweetShoe=globalThis.SweetShoe||{});
