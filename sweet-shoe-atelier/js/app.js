'use strict';
(function(A){
const {I18N,categories,opts,defaults,themes,option,t,cleanDesign,unlocked,customersForDay,generateOrder,matches,scoreOrder,freshSave,sanitizeSave,ASSET_NAMES,shoeCanvas,productCanvas}=A;
const $=id=>document.getElementById(id);let state=freshSave(),design={...defaults},tab='color',mode='merge',busy=false,modalKind='',sdk=null,sdkActive=false,playing=false,adActive=false,lastMidgame=Date.now(),tutorialStep=0,toastTimer,saveTimer,memory='',lastFrame=0,saveElapsed=0;
const images=new Map();
let saveReady=false,cloudDataAvailable=false,cloudWriteRunning=false,cloudWritePending=null;
const {hydrateCanvases}=A.createShoeRenderer(images);
const guidance=A.createTutorialDirector();
const mergeScreen=A.createMergeScreen($('atelierScreen'),{state:()=>state,active:()=>mode==='merge'&&!modalKind&&!busy&&!adActive,save:persist,toast,modal,header:renderHeader,close:closeModal,studio:()=>switchMode('order'),journey:renderJourney,sound:(kind,tier)=>{audio.ensure();audio.sfx(kind,tier);},particles});
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const icon=(name,cls='')=>`<img class="ui-icon ${cls}" src="assets/icon_${name}.webp" alt="" aria-hidden="true">`;
let lastJourneyStep=0,collectionMoment=null;
let resizeFrame;
function scheduleCanvasResize(){cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(()=>{document.querySelectorAll('.runway-scene').forEach(A.Showcase.frame);hydrateCanvases();});}
new ResizeObserver(scheduleCanvasResize).observe($('app'));
window.addEventListener('resize',scheduleCanvasResize);
function optionPreview(k,v){
 if(k==='color')return `<span class="swatch" style="--swatch:${option(k,v)[3]}"></span>`;
 if(k==='material'&&['metallic','pearlescent','suede','brocade','pave'].includes(v))return `<span class="texture-swatch couture-${v}" aria-hidden="true">${v==='brocade'?'❀':''}</span>`;
 if(k==='pattern'&&['rosebuds','diamonds','gingham','scallops','pinstripes'].includes(v))return `<span class="texture-swatch couture-${v}" aria-hidden="true">${v==='rosebuds'?'❀':''}</span>`;
 if(k==='material'&&v==='patent')return '<span class="texture-swatch patent" style="background:linear-gradient(128deg,#925c83 0%,#f4a9d1 33%,#fffafc 38%,#e980b5 43%,#ba73a2 68%,#fff3fa 72%,#d785b4 78%)"></span>';
 if(k==='material')return `<span class="texture-swatch ${v}" style="background-image:url('assets/tex_${v}.webp')"></span>`;
 if(k==='pattern')return v==='none'?'<span class="empty-swatch">—</span>':v==='dots'?'<span class="dots-swatch"></span>':`<img class="option-art motif" src="assets/motif_${{flowers:'flower',hearts:'heart',stars:'star'}[v]}.webp" alt="">`;
 if(k==='heel')return `<canvas class="shoe2d-option" data-painted-heel="${v}" aria-hidden="true"></canvas>`;
 if(A.AccessoryRenderer?.handles(k,v))return shoeCanvas({...defaults,heel:design.heel,color:design.color,[k]:v});
 if(k==='strap')return shoeCanvas({...defaults,color:design.color,[k]:v});
 const name=k==='decoration'?{small:'bow',big:'bow',drop:'pearl_drop',flower:'flower'}[v]:{pearl:'charm_pearl',crystal:'charm_crystal',mini:'charm_minibow'}[v];
 return name?`<img class="option-art ${v==='small'?'small-bow':''}" src="assets/${name}.webp" alt="">`:'<span class="empty-swatch">—</span>';
}
function expression(person,stars=0){return themes[person].asset+'_'+(stars===3?'happy':stars===1?'sad':'neutral');}
function starIcons(count){return [1,2,3].map(i=>icon('star',i>count?'unearned':'earned')).join('');}
function craftLabel(k,v){const id=A.CRAFT_UNLOCKS[k+':'+v];if(!id)return '';return (A.lang==='zh'?'合成发现：':'Discover: ')+A.materialName({chain:id.slice(0,3),tier:+id.slice(-1),kind:'item'});}
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function withDeadline(promise,ms){let timer;try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('timeout')),ms);})]);}finally{clearTimeout(timer);}}
async function initSDK(){try{for(let i=0;i<30&&!window.CrazyGames?.SDK;i++)await delay(50);if(!window.CrazyGames?.SDK)return;const candidate=window.CrazyGames.SDK;await withDeadline(candidate.init(),2500);if(candidate.environment!=='disabled'){sdk=candidate;sdkActive=true;}}catch{sdk=null;sdkActive=false;}}
function sdkCall(area,method){try{if(sdkActive)sdk[area]?.[method]?.();}catch{}}
function syncGameplay(){const active=!busy&&!modalKind&&!adActive&&!document.hidden&&!$('app').hidden&&(mode==='merge'||mode==='free'||state.served<customersForDay(state.day));if(active===playing)return;playing=active;sdkCall('game',active?'gameplayStart':'gameplayStop');}
async function readSave(){
 cloudDataAvailable=sdkActive&&['crazygames','local'].includes(sdk.environment);
 // Prefer the current local save over legacy cloud data; never let an old v2 overwrite v3.
 for(const key of ['sweet-shoe-v3','sweet-shoe-v2']){
  const candidates=[];
  // A stalled cloud read must neither block play nor authorize overwriting unread cloud data.
  try{if(cloudDataAvailable)candidates.push(await withDeadline(sdk.data.getItem(key),2000));}catch{cloudDataAvailable=false;}
  try{candidates.push(localStorage.getItem(key));}catch{}
  const parsedCandidates=[];for(const value of candidates)if(value)try{const parsed=JSON.parse(value);if(parsed&&typeof parsed==='object'&&!Array.isArray(parsed))parsedCandidates.push(parsed);}catch{}
  if(parsedCandidates.length)return sanitizeSave(parsedCandidates.sort((a,b)=>(Number(b.savedAt)||0)-(Number(a.savedAt)||0))[0]);
 }
 return freshSave();
}
async function flushCloudSave(){
 if(cloudWriteRunning||!cloudDataAvailable)return;
 cloudWriteRunning=true;
 try{
  // One request at a time prevents a slow older write from replacing newer
  // progress. While it is pending, keep only the latest local snapshot.
  while(cloudDataAvailable&&cloudWritePending!==null){
   const snapshot=cloudWritePending;cloudWritePending=null;
   try{await sdk.data.setItem('sweet-shoe-v3',snapshot);}catch{}
  }
 }finally{cloudWriteRunning=false;}
}
function persist(){if(!saveReady)return;state.design={...design};state.version=3;state.savedAt=Date.now();memory=JSON.stringify(state);try{localStorage.setItem('sweet-shoe-v3',memory);}catch{}if(cloudDataAvailable){cloudWritePending=memory;void flushCloudSave();}}
function saveSoon(){clearTimeout(saveTimer);saveTimer=setTimeout(persist,250);}
const audio=A.createAudioEngine(()=>state,()=>adActive||document.hidden||modalKind==='pause',()=>modalKind==='runway'||modalKind==='shop'||modalKind==='collection'?'tea':mode);
function toast(text){clearTimeout(toastTimer);if(!text){$('toast').classList.remove('show');return;}$('toast').textContent=text;$('toast').classList.add('show');toastTimer=setTimeout(()=>$('toast').classList.remove('show'),3200);}
function particles(x=innerWidth/2,y=innerHeight/2,coin=false,chain=''){
 if(reducedMotion)return;const host=$('particles'),target=$('coins').getBoundingClientRect();
 // Bound bursts during fast merging; short radial glints keep the board readable.
 while(host.children.length>56)host.firstElementChild.remove();
 const tint={fab:'#e694b0',lea:'#d5a062',spk:'#afa1e4',rib:'#e79e96'}[chain]||'#eac68b';
 for(let i=0;i<10;i++){
  const p=document.createElement(coin?'img':'span');if(coin){p.src='assets/icon_coin.webp';p.alt='';}
  p.className=coin?'particle':'craft-spark';p.style.left=x+'px';p.style.top=y+'px';p.style.setProperty('--spark-color',tint);
  const angle=i/10*Math.PI*2,radius=28+Math.random()*36;
  p.style.setProperty('--x',(coin?target.x-x:Math.cos(angle)*radius)+'px');p.style.setProperty('--y',(coin?target.y-y:Math.sin(angle)*radius-12)+'px');
  p.style.animationDelay=(coin?i*.035:i*.012)+'s';host.append(p);setTimeout(()=>p.remove(),coin?1800:850);
 }
}

function achievement(id){if(state.achievements.includes(id))return;state.achievements.push(id);setTimeout(()=>toast('✧ '+t('achievement')+': '+t('a_'+id)),650);saveSoon();}
function checkAchievements(result){if(state.total>=1)achievement('first');if(result?.stars===3)achievement('perfect');if(state.combo>=3)achievement('streak');if(state.total>=10)achievement('ten');if(state.unlocks.length>=1)achievement('shop');if(state.gallery.length>=5)achievement('gallery');if(state.served>=customersForDay(state.day))achievement('day');if(result?.stars===3&&state.order?.vip)achievement('vip');}
function setTutorial(){const show=!A.Introduction.active(state)&&!state.tutorial&&mode==='order'&&!modalKind&&!busy;$('tutorial').hidden=!show;if(show)$('tutorial').innerHTML=`<span>${t('tutorial'+tutorialStep)}</span><button data-action="tutorial">${t('skip')}</button>`;}
function renderJourney(){
 document.querySelectorAll('.journey-target').forEach(el=>el.classList.remove('journey-target'));
 document.querySelectorAll('.journey-coach').forEach(el=>el.remove());
 const suppressed=['welcome','opening','pause','chapter','unlock','craft-unlock','atelier-book','journal'].includes(modalKind);
 const lesson=A.Introduction.lesson(state,{mode,modal:modalKind,design,tab});
 document.body.classList.toggle('journey-active',!!lesson);
 if(suppressed){guidance.hide();return;}
 if(state.mergeGuide<6&&mode==='merge'&&!modalKind){
  const step=state.mergeGuide,box=$('atelierScreen').querySelector('[data-guide-step]');
  if(!box){guidance.hide();return;}
  box.querySelector('[data-guide-skip]')?.removeAttribute('data-guide-skip');
  const finishButton=box.querySelector('[data-guide-finish]'),finishLabel=finishButton?.textContent||box.dataset.finishLabel;if(finishButton){box.dataset.finishLabel=finishLabel;finishButton.removeAttribute('data-guide-finish');}
  const plan=A.MergeGuide.plans[step],cells=plan.cells,selected=$('atelierScreen').querySelector('.merge-cell.selected');
  const from=cells.length>1?'[data-cell="'+cells[0]+'"]':'';
  const target=step===5?'[data-guide-finish]':step===4?'[data-deliver="0"]':'[data-cell="'+cells[cells.length>1?1:0]+'"]';
  guidance.show({key:'guide-'+step,marker:'data-guidance-step="'+step+'"',title:box.querySelector('h3').textContent,body:box.querySelector('p').textContent+(step===5?' '+box.querySelectorAll('p')[1].textContent:''),target,from,
   label:step===5?finishLabel:A.lang==='zh'?(step===0?'点击缝纫篮':step<4?'拖动到这里 · 也可依次点击':'点这里交付！'):(step===0?'Tap the sewing basket':step<4?'Drag here · or tap both':'Tap to deliver!'),
   action:step===5?'<button class="primary" data-guide-finish>'+finishLabel+'</button>':'',skip:'data-guide-skip'});
  return;
 }
 if(!lesson){guidance.hide();return;}
 if(lastJourneyStep&&lastJourneyStep!==lesson.step)audio.sfx('guide');lastJourneyStep=lesson.step;
 const action=lesson.action?'<button class="primary" data-journey-action="'+lesson.action+'">'+lesson.label+' →</button>':'';
 guidance.show({key:'journey-'+lesson.step,marker:'data-journey="'+lesson.step+'"',title:lesson.title,body:lesson.body+(lesson.extra?' '+lesson.extra:''),target:action?'[data-journey-action="'+lesson.action+'"]':lesson.target,label:lesson.extra||lesson.label||lesson.title,action,skip:'data-journey-skip'});
 if(!action)document.querySelector(lesson.target||'[data-no-target]')?.classList.add('journey-target');
}

function renderAtelierHud(){
 const level=Math.floor(Math.sqrt(state.xp/40))+1,base=40*(level-1)**2,goal=40*level**2;
 $('atelierStars').textContent=state.stars;$('atelierGems').textContent=state.gems;
 $('atelierLevel').innerHTML='<b>'+(A.lang==='zh'?'等级 ':'Lv. ')+level+'</b><span><i style="width:'+((state.xp-base)/(goal-base)*100)+'%"></i></span>';
 if($('headerEnergy')){const b=state.atelier,sec=Math.ceil((A.Merge.REGEN_MS-(Date.now()-b.energyAt))/1000);$('headerEnergy').innerHTML='<img src="assets/items/ui_energy.webp" alt=""><span><b id="energyCount">'+b.energy+' / 100</b><small id="energyRegen">'+(b.energy===100?(A.lang==='zh'?'已充满':'Full'):(Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0')))+'</small></span>';}$('atelierLevel').title=(A.lang==='zh'?'经验 ':'XP ')+state.xp+' / '+goal;
 for(const [id,label] of [['atelierStars',A.lang==='zh'?'装修星星':'Renovation stars'],['atelierGems',A.lang==='zh'?'宝石':'Gems']]){
  const pill=$(id).parentElement;pill?.setAttribute('aria-label',label+' '+$(id).textContent);pill?.setAttribute('title',label);
 }
}
function renderHeader(){$('brand').textContent=t('brand');$('tagline').textContent=t('tagline');$('coins').textContent=state.coins;renderAtelierHud();$('sound').textContent=state.sound?'♪':'♩';$('sound').setAttribute('aria-label',t('effects')+': '+t(state.sound?'on':'off'));$('pause').setAttribute('aria-label',t('pause'));$('sound').setAttribute('aria-pressed',String(state.sound));$('nav').setAttribute('aria-label',t('brand'));$('atelierScreen').setAttribute('aria-label',A.lang==='zh'?'工坊':'Merge Atelier');$('customer').setAttribute('aria-label',t('customer'));$('tabs').setAttribute('aria-label',t('custom'));$('coins').previousElementSibling?.setAttribute('alt',t('coins'));$('nav').innerHTML=['atelier','serve','free','collection','shop'].map((k,i)=>`<button data-nav="${k}" class="${(mode==='merge'&&i===0)||(mode==='order'&&i===1)||(mode==='free'&&i===2)?'active':''}">${icon(['material','heart','color','gift','coin'][i])}<span>${k==='atelier'?(A.lang==='zh'?'工坊':'Atelier'):(k==='shop'?(A.lang==='zh'?'精品店':'Boutique'):t(k)).replace(/^[^\p{L}]+/u,'')}</span></button>`).join('');$('eyebrow').textContent=t('eyebrow');$('workTitle').textContent=t(mode==='free'?'freeTitle':'workTitle');$('dayBadge').textContent=A.lang==='zh'?`第 ${state.day} 日`:`Day ${state.day}`;$('stageLabel').textContent=t('stageLabel');$('customTitle').textContent=t('custom');$('sampleNote').textContent=t('sampleNote');$('pack').innerHTML=icon('gift')+'<span>'+t(mode==='free'?'save':'pack').replace(/[↗♡]/g,'')+'</span>';$('inspire').innerHTML=icon('color')+'<span>'+t('inspire').replace('✧ ','')+'</span>';$('stageNote').textContent=t(mode==='free'?'freeHint':'stageNote');$('goal').innerHTML=icon('heart')+`${t('goal')} · ${Math.min(3,state.perfect)}/3 <span class="goal-progress"><i style="width:${Math.min(100,state.perfect/3*100)}%"></i></span>`;$('footerText').textContent=t('footer');document.documentElement.lang=A.lang==='zh'?'zh-CN':'en';document.title=t('brand');document.querySelectorAll('img[alt="Sweet Shoe Atelier"]').forEach(im=>im.alt=t('brand'));}
let studioAngle='front34',studioCloseup=false;
let studioPainted=null;
function renderPreview(bounce=false){
 const host=$('preview'),stage=$('stage');
 stage.classList.remove('product-stage','shoe3d-stage');
 stage.classList.add('shoe2d-stage');
 stage.querySelector('.studio-angles')?.remove();
 stage.classList.toggle('glitter',design.material==='glitter');
 $('designLabel').textContent=option('color',design.color)[1]+' · '+option('material',design.material)[1]+' · '+option('heel',design.heel)[1];
 // Keep one canvas in place. Updates commit a complete frame only after assets
 // are ready; rapid choices cannot expose a blank frame or an older selection.
 if(!studioPainted||!host.contains(studioPainted.canvas)){
  studioPainted?.dispose();
  host.replaceChildren();
  studioPainted=A.Shoe2D.mount(host,design);
 }else studioPainted.update(design);
 host.classList.remove('bounce');
 // Feedback is outside the shoe so every selectable finish keeps fixed pixels.
 if(bounce&&!reducedMotion){
  const r=host.getBoundingClientRect();particles(r.x+r.width*.72,r.y+r.height*.42);
 }
}

const pickerColors={color:['#bd688b','#fff0f5'],material:['#588f99','#edf8fa'],pattern:['#9374ad','#f5effb'],strap:['#bb8c48','#fff7e8'],decoration:['#b96d80','#fff0f3'],heel:['#598c72','#edf9f1'],charm:['#847cb2','#f3f1ff']};
function pickerLabel(k){return (A.lang==='zh'?{color:'颜色',material:'材质',pattern:'图案',strap:'鞋带',decoration:'后跟',heel:'鞋型',charm:'鞋尖'}:{color:'Color',material:'Fabric',pattern:'Motif',strap:'Strap',decoration:'Décor',heel:'Shape',charm:'Charm'})[k];}
function renderTabs(){
 const pane=$('options'),oldScroll=pane.scrollTop,oldTab=pane.dataset.category;
 $('tabs').innerHTML=Object.keys(categories).map(k=>`<button role="tab" aria-selected="${tab===k}" aria-controls="options" class="${tab===k?'active':''}" data-tab="${k}" aria-label="${t(k)}" title="${t(k)}" style="--picker-color:${pickerColors[k][0]};--picker-wash:${pickerColors[k][1]}">${icon(k)}<span>${pickerLabel(k)}</span></button>`).join('');
 const style=A.SHOE_STYLES?.[design.heel];
 const restricted=!A.supportsStyleOption(design.heel,tab,'trim');
 const choices=opts[tab].filter(o=>A.supportsStyleOption(design.heel,tab,o[0])&&(tab!=='heel'||!A.THIN_HEELS[o[0]]||o[0]==='kitten'));
 let heightRow=$('heelHeightChoices');if(!heightRow){heightRow=document.createElement('div');heightRow.id='heelHeightChoices';heightRow.className='heel-height-choices';heightRow.setAttribute('role','group');pane.before(heightRow);}heightRow.hidden=tab!=='heel'||!A.THIN_HEELS[design.heel];heightRow.setAttribute('aria-label',t('heelHeight'));heightRow.innerHTML=`<span>${t('heelHeight')}</span>`+Object.entries(A.THIN_HEELS).map(([heel,cm],i)=>`<button data-heel-height="${cm}" aria-pressed="${design.heel===heel}">${t(['heelLow','heelMid','heelHigh'][i])} ${cm}cm</button>`).join('');
 $('partTitle').innerHTML=icon(tab)+'<span>'+t(tab)+'</span>';$('optionCount').textContent=choices.length+' '+t('samples');
 $('sampleNote').textContent=t(restricted?(style.fixedTrims?style.trimCopy:tab==='decoration'?(style.decorationCopy||'openHeelDecor'):(style.builtInCopy||'builtInStrap')):'sampleNote');
 let recent=$('recentChoices');if(!recent){recent=document.createElement('div');recent.id='recentChoices';recent.className='picker-recent';pane.before(recent);}
 const used=(state.recentChoices[tab]||[]).filter(v=>unlocked(state,tab,v)&&A.supportsStyleOption(design.heel,tab,v));
 recent.hidden=!used.length;recent.setAttribute('role','group');recent.setAttribute('aria-label',A.lang==='zh'?'最近使用':'Recently used');
 recent.innerHTML='<span class="picker-recent-label">'+(A.lang==='zh'?'最近使用':'Recently used')+'</span><div>'+used.map(v=>`<button data-recent-option="${v}" aria-label="${t(tab)} · ${t(v)}" aria-pressed="${design[tab]===v}" title="${t(v)}">${tab==='color'?optionPreview(tab,v):''}<span>${t(v)}</span></button>`).join('')+'</div>';
 pane.dataset.category=tab;pane.setAttribute('aria-label',t(tab));pane.style.setProperty('--picker-color',pickerColors[tab][0]);
 pane.innerHTML=choices.map(o=>{const locked=!unlocked(state,tab,o[0]),selected=design[tab]===o[0]||(tab==='heel'&&o[0]==='kitten'&&!!A.THIN_HEELS[design.heel]);return `<button class="option ${selected?'selected':''} ${locked?'craft-locked':''}" data-option="${o[0]}" aria-label="${t(o[0])}${locked?' · '+(craftLabel(tab,o[0])||t('unlock')):''}" aria-pressed="${selected}">${optionPreview(tab,o[0])}<span>${t(tab==='heel'&&o[0]==='kitten'?'thinPump':o[0])}</span>${locked?`<small><span aria-label="${t('unlock')}" class="lock-mark"></span>${A.CRAFT_UNLOCKS[tab+':'+o[0]]?'✧':icon('coin')+o[2]}</small>`:''}</button>`;}).join('');
 pane.scrollTop=oldTab===tab?oldScroll:0;
 hydrateCanvases(pane);for(const canvas of pane.querySelectorAll('[data-painted-heel]'))A.Shoe2D.render(canvas,{...design,heel:canvas.dataset.paintedHeel});
}

function newOrder(){$('customer').classList.remove('customer-enter');void $('customer').offsetWidth;$('customer').classList.add('customer-enter');state.order=generateOrder(state);state.remaining=state.order.duration;persist();}
function renderCustomer(){
 const free=mode==='free';$('customer').classList.toggle('free-brief',free);
 if(free){$('customer').innerHTML=`<div class="commission-identity"><div class="portrait-wrap"><img src="assets/c_pink_happy.webp" alt=""></div><div><span class="section-kicker">${t('free').replace('✧ ','')}</span><h3 class="customer-name">${t('freeCustomer')}</h3><p class="theme">${t('noTimer')}</p></div></div><div class="commission-brief"><div class="speech">${t('freeQuote')}</div></div>`;return;}
 if(!state.order&&!commissionReady&&state.served<customersForDay(state.day))newOrder();const o=state.order;if(!o)return;const theme=themes[o.person],wishDesign=A.commissionDesign(o);
 $('customer').innerHTML=`<div class="commission-identity"><div class="portrait-wrap"><img src="assets/${expression(o.person)}.webp" alt="${t('name'+o.person)}"></div><div><span class="section-kicker">${t('customer')} · ${Math.min(state.served+1,customersForDay(state.day))} / ${customersForDay(state.day)}</span><h3 class="customer-name">${t('name'+o.person)}</h3><p class="theme">${o.vip?t('vip'):t(theme.id)}</p></div></div><div class="commission-brief"><div class="speech">${t('wish').replace('{theme}',t(theme.id))}</div><div class="commission-shoe">${shoeCanvas(wishDesign)}</div><div class="requirements">${o.requirements.map(r=>`<span class="req ${matches(design,r)?'match':''}" title="${r.key==='noBows'?t('noBows'):r.key==='heelHeight'?t('heelHeight')+' · '+r.value+'cm':t(r.key)+' · '+(r.key==='heel'&&r.value==='kitten'?t('thinPump'):option(r.key,r.value)[1])}">${icon(r.key==='noBows'?'decoration':r.key==='heelHeight'?'heel':r.key)}<span>${r.key==='noBows'?t('noBows'):r.key==='heelHeight'?r.value+'cm':r.key==='heel'&&r.value==='kitten'?t('thinPump'):option(r.key,r.value)[1]}</span><b aria-hidden="true">${matches(design,r)?'✓':'○'}</b></span>`).join('')}</div></div><div class="commission-status"><div class="timer-row"><span>${icon('clock')}${t('patience')}</span><span id="timerText"></span></div><div class="timer-track"><i id="timerFill"></i></div><div class="customer-top"><span class="hearts" id="hearts"></span><button class="time-ad" data-action="time" ${o.adUsed?'disabled':''}>${t('timeAd')}</button></div></div>`;hydrateCanvases($('customer'));renderTimer();
}
function renderTimer(){
 const text=$('timerText'),fill=$('timerFill'),hearts=$('hearts');if(!text||!state.order)return;
 const ratio=Math.max(0,Math.min(1,state.remaining/state.order.duration)),seconds=Math.ceil(state.remaining)+t('seconds');
 if(text.textContent!==seconds)text.textContent=seconds;
 fill.style.transform='scaleX('+ratio+')';fill.classList.toggle('urgent',ratio<.25);
 let combo=hearts.querySelector('b');if(!combo){hearts.innerHTML=icon('heart')+'<b></b>';combo=hearts.querySelector('b');}
 if(combo.textContent!==String(state.combo))combo.textContent=state.combo;
}
function renderAll(){document.body.classList.toggle('merge-active',mode==='merge');renderHeader();$('studioScreen').hidden=mode==='merge';mergeScreen.show(mode==='merge');if(mode!=='merge'){renderPreview();renderTabs();renderCustomer();}setTutorial();renderJourney();syncGameplay();audio.update();}
function modal(kind,html){A.Celebration.dismiss();runwayFitting?.dispose();runwayFitting=null;modalKind=kind;$('modalRoot').innerHTML=`<div class="backdrop${kind==='runway'?' runway-backdrop':''}"><section class="modal${kind==='runway'?' runway-modal':kind==='shop'?' boutique-modal':kind==='collection'?' collection-modal':''}" data-modal-kind="${kind}" role="dialog" aria-modal="true" aria-label="${t(kind==='pause'?'pause':'brand')}">${html}${['welcome','opening','atelier-book'].includes(kind)?'':`<button class="modal-dismiss secondary" data-modal-dismiss aria-label="${A.lang==='zh'?'关闭':'Close'}">×</button>`}</section></div>`;$('app').inert=true;setTutorial();syncGameplay();audio.update();renderJourney();hydrateCanvases($('modalRoot'));$('modalRoot').querySelector('button:not(:disabled)')?.focus();}
function dismissModal(){if(adActive||busy)return;if(modalKind==='opening'){finishOpening();return;}if(modalKind==='welcome')return;if(modalKind==='chapter'){continueBoutique();return;}if(modalKind==='saved'){action('continueFree');return;}if(modalKind==='result'){action('next');return;}if(modalKind==='runway'){leaveRunway();return;}closeModal();}
$('modalRoot').addEventListener('click',e=>{if(e.target.classList.contains('backdrop')||e.target.closest('[data-modal-dismiss]'))dismissModal();});
function closeModal(){A.Celebration.dismiss();runwayFitting?.dispose();runwayFitting=null;modalKind='';$('app').inert=false;$('modalRoot').innerHTML='';setTutorial();syncGameplay();audio.update();renderJourney();(mode==='merge'?$('atelierScreen').querySelector('[data-cell="23"]'):$('pack'))?.focus();}
const btn=(action,label,secondary=false)=>`<button class="${secondary?'secondary':'primary'}" data-action="${action}">${['welcome','titleFree','next','newDay'].includes(action)?icon(action==='titleFree'?'color':action==='welcome'?'heart':'gift'):''}<span>${t(label).replace(/^[^\p{L}]+/u,'')}</span></button>`;
function openPause(){
 if(busy||adActive)return;
 modal('pause',`<div class="pause-emblem" aria-hidden="true">${icon('heart')}</div><span class="eyebrow">${t('brand')}</span><h2>${t('pause')}</h2><p class="pause-tip">${t('tip')}</p><div class="pause-resume">${btn('resume','resume')}</div><div class="atelier-settings" role="group" aria-label="${A.lang==='zh'?'设置':'Preferences'}">${['sound','music'].map(key=>`<button class="settings-toggle" data-action="${key}" aria-pressed="${state[key]}"><span>${t(key==='sound'?'effects':'music')}</span><span class="setting-value">${t(state[key]?'on':'off')}<i aria-hidden="true"></i></span></button>`).join('')}<button class="settings-toggle settings-language" data-action="language"><span>${t('language')}</span><span class="setting-value">${A.lang==='en'?'English':'简体中文'} ↗</span></button></div><div class="pause-links">${btn('achievements','achievements',true)}${btn('resetAsk','reset',true)}</div><p class="audio-credits">${A.lang==='zh'?'音乐':'Music'}: A cup of tea — TAD · CC0<br>${A.lang==='zh'?'音效':'Sound effects'}: Kenney · CC0</p>`);
}
function openShop(before=false){if(modalKind!=='shop')toast('');modal('shop',A.Boutique.markup(state,before));}
async function renovate(id){
 const result=A.Boutique.renovate(state,id);if(!result.ok)return;
 A.Introduction.sync(state);persist();renderHeader();openShop();audio.sfx(result.chapterComplete?'chapter':'renovate');
 const object=$('modalRoot').querySelector('[data-room-decor="'+result.task.slot+'"]');object?.classList.add('renovation-reveal');
 const scene=$('modalRoot').querySelector('[data-boutique-scene]');if(scene)A.Celebration.show({host:scene,title:A.Boutique.tr('names')[A.Boutique.SLOTS.indexOf(result.task.slot)],label:A.Boutique.tr('done')+' · '+A.Boutique.tr('level')+' '+result.task.level,artwork:'<img src="'+A.Boutique.decorAsset(result.task.slot,result.task.level)+'" alt="">',kind:'decor'});setTimeout(()=>object?.classList.remove('renovation-reveal'),1800);
 const rect=object?.getBoundingClientRect();if(rect)particles(rect.x+rect.width/2,rect.y+rect.height/2,true);
 if(result.chapterComplete){
  clearTimeout(toastTimer);$('toast').classList.remove('show');
  sdkCall('game','happytime');
  modal('chapter',`<div class="chapter-celebration"><div class="boutique-scene chapter-room-preview" style="--restored:${A.Boutique.count(state)/16}">${A.Boutique.roomMarkup(state)}</div><div class="chapter-portraits"><img src="assets/mentor_neutral.webp" alt="${A.Boutique.tr('odette')}"><img src="assets/${themes[result.task.id===3?3:5].asset}_happy.webp" alt=""></div><img src="${A.Boutique.decorAsset(result.task.slot,result.task.level)}" alt=""><span class="section-kicker">${A.Boutique.tr('chapterDone')}</span><h2>${A.Boutique.tr('chapter')[A.Boutique.chapter(state)]}</h2><p class="chapter-letter">“${A.Boutique.tr('chapterStory')[A.Boutique.chapter(state)]}”</p>${result.task.id<15?'<p>'+A.Boutique.tr('newFaces')+': '+(result.task.id===3?t('name3')+' · '+t('name4'):t('name5'))+'</p>':''}<p>${A.Boutique.tr('upgraded')}</p><p>${A.Boutique.tr(result.task.id===3?'sparkle':result.task.id===9?'ribbon':'finish')}</p>${result.pending.length?'<p>'+A.Boutique.tr('pending')+'</p>':''}<button class="primary" data-boutique-continue>${A.Boutique.tr('continue')}</button></div>`);
  $('modalRoot').querySelector('.modal').classList.add('chapter-modal');
 }
}
async function continueBoutique(){
 if(busy||adActive||modalKind!=='chapter')return;
 busy=true;syncGameplay();
 if(Date.now()-lastMidgame>=180000&&sdkActive){lastMidgame=Date.now();await requestAd('midgame');}
 busy=false;openShop();
}

function buy(k,v){const o=option(k,v);if(unlocked(state,k,v))return true;if(A.CRAFT_UNLOCKS[k+':'+v]){closeModal();switchMode('merge');mergeScreen.openBook(A.CRAFT_UNLOCKS[k+':'+v].slice(0,3));return false;}if(state.coins<o[2]){audio.sfx('error');toast(t('notEnough'));return false;}state.coins-=o[2];state.unlocks.push(k+':'+v);audio.sfx('unlock');toast(t('unlocked'));checkAchievements();persist();renderHeader();return true;}
function openGallery(selected=0){
 if(modalKind!=='collection')toast('');
 const index=Math.max(0,Math.min(state.gallery.length-1,selected)),artwork=state.gallery[index];
 modal('collection',`<div class="collection-heading"><button class="secondary collection-back" data-action="close">${t('close')}</button><span class="section-kicker">${t('brand')}</span><h2>${t('collection')}</h2><p>${state.gallery.length?state.gallery.length+' '+t('collectionCount'):t('empty')}</p></div>${artwork?`<div class="collection-layout"><div class="collection-stage">${productCanvas(artwork.design)}</div><aside class="collection-detail"><span class="section-kicker">${A.lang==='zh'?'第 '+artwork.day+' 天':t('day')+' '+artwork.day}</span><h3>${option('color',artwork.design.color)[1]} · ${option('material',artwork.design.material)[1]}</h3><div class="collection-rating">${artwork.stars?starIcons(artwork.stars):t('free').replace('✧ ','')}</div><button class="primary" data-try-on="${index}">${runwayText('Try on','试穿')} ↗</button><button class="secondary" data-reuse="${index}">${t('reuse')}</button></aside></div><div class="gallery collection-filmstrip" aria-label="${t('collection')}">${state.gallery.map((a,i)=>`<button class="gallery-item ${i===index?'selected':''}" data-gallery-select="${i}" aria-pressed="${i===index}" aria-label="${option('color',a.design.color)[1]} · ${A.lang==='zh'?'第 '+a.day+' 天':t('day')+' '+a.day}"><div class="collection-thumbnail">${productCanvas(a.design)}</div><span>${A.lang==='zh'?'第 '+a.day+' 天':t('day')+' '+a.day}</span></button>`).join('')}</div>`:`<div class="collection-empty">${icon('gift')}<p>${t('empty')}</p><button class="primary" data-nav="free">${t('free').replace('✧ ','')} ↗</button></div>`}`);
 if(artwork&&collectionMoment===artwork.design.heel){collectionMoment=null;A.Celebration.show({host:$('modalRoot').querySelector('.collection-stage'),title:t(artwork.design.heel),label:t('saved'),design:artwork.design,kind:'collection'});audio.sfx('unlock');}
}

let runwayReturn=null,runwayIndex=0,runwayFitting=null,commissionReady=null;
const runwayText=(en,zh)=>A.lang==='zh'?zh:en;
function setRunwayProduct(scene,on){
 if(!scene?.isConnected)return;
 scene.classList.toggle('product-showcase',on);
 const root=scene.closest('.runway');
 root.querySelector('.runway-heading h2').textContent=on?runwayText('Your shoe showcase','鞋款展示'):runwayText('The fitting room','试穿沙龙');
 root.querySelector('.section-kicker').textContent=t('brand')+' · '+(on?runwayText('THE SHOE SHOWCASE','鞋款展示'):runwayText('THE FITTING ROOM','试穿沙龙'));

}
function fittingOptionsMarkup(value){
 const selected=A.cleanFittingOptions(value),zh=A.lang==='zh';
 const styles=[['none','None','无袜'],['frill','Frill','荷叶边'],['lace','Lace','蕾丝'],['sheer','Sheer tights','薄丝袜'],['knee','Knee-high','及膝袜'],['thigh','Thigh-high','长筒袜'],['blacksheer','Black sheer','黑丝袜'],['pantyhose','Sheer pantyhose','薄连裤袜'],['opaque','Opaque tights','厚连裤袜'],['fishnet','Diamond knit','菱格袜']];
 const colors=[['pink','Candy pink','糖果粉','#ffd1e0'],['mint','Mint','薄荷绿','#c4eadb'],['cream','Cream','奶油色','#fff0d2'],['white','White','白色','#ffffff'],['black','Midnight','午夜黑','#292735']];
 return `<div class="runway-sock-panel"><div class="runway-sock-styles" role="group" aria-label="${zh?'袜子搭配':'Sock pairing'}">${styles.map(([id,en,cn])=>`<button class="sock-chip" data-fitting-sock="${id}" aria-pressed="${selected.sock===id}">${zh?cn:en}</button>`).join('')}</div><div class="runway-sock-colors" role="group" aria-label="${zh?'袜子颜色':'Sock colour'}">${colors.map(([id,en,cn,color])=>`<button class="sock-color" data-fitting-color="${id}" ${selected.sock==='none'?'disabled':''} aria-disabled="${selected.sock==='none'}" aria-label="${zh?cn:en}" title="${zh?cn:en}" aria-pressed="${selected.color===id}" style="--sock-color:${color}"><span></span></button>`).join('')}</div></div>`;
}
function chooseFitting(key,value){
 const artwork=state.gallery[runwayIndex];if(!artwork||modalKind!=='runway')return;
 const selected=A.cleanFittingOptions({...artwork.fitting,[key]:value});
 state.fitting={...selected};artwork.fitting={...selected};persist();
 const root=$('modalRoot');root.querySelectorAll('[data-fitting-sock]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.fittingSock===selected.sock)));
 root.querySelectorAll('[data-fitting-color]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.fittingColor===selected.color));b.disabled=selected.sock==='none';b.setAttribute('aria-disabled',String(b.disabled));});
 runwayFitting?.update(artwork.design,selected);refreshFitting(root.querySelector('.runway-scene'));
}
function openRunway(index=0,refresh=false){
 const artwork=state.gallery[index];if(!artwork)return;
 clearTimeout(toastTimer);$('toast').classList.remove('show');
 if(!refresh){runwayReturn={kind:modalKind};audio.sfx('tryon');}
 artwork.fitting=A.cleanFittingOptions(artwork.fitting||state.fitting);
 runwayIndex=index;const sceneId=state.showcase.owned.includes(artwork.scene)?artwork.scene:state.showcase.selected;
 modal('runway',`<div class="runway"><div class="runway-heading"><button class="secondary runway-return" data-runway-back aria-label="${runwayText('Back','返回')}">‹</button><span class="section-kicker">${t('brand')} · ${runwayText('THE FITTING ROOM','试穿沙龙')}</span><h2>${runwayText('The fitting room','试穿沙龙')}</h2><p>${option('color',artwork.design.color)[1]} · ${option('material',artwork.design.material)[1]} · ${option('heel',artwork.design.heel)[1]}</p></div><div class="runway-scene" data-showcase-scene="${sceneId}" data-material="${artwork.design.material}" style="--scene-image:url('assets/${A.Showcase.find(sceneId).closeImage}.webp')" data-runway-pose="stand" data-runway-angle="front34"><div class="runway-contact contact-back"></div><div class="runway-contact contact-front"></div><div class="runway-mirror" aria-hidden="true"></div><div class="runway-light"></div><div class="runway-painted-window runway-worn-window"></div><div class="scene-atmosphere" aria-hidden="true">${Array.from({length:6},(_,i)=>`<i style="--i:${i}"></i>`).join('')}</div><img class="runway-spark spark-one" src="assets/sparkle.webp" alt=""><img class="runway-spark spark-two" src="assets/sparkle.webp" alt=""><span class="runway-monogram">${A.lang==='zh'?'小鞋铺':'SSA'}</span></div><div class="runway-dock"><div class="showcase-strip">${A.Showcase.picker(state,sceneId)}</div>${fittingOptionsMarkup(artwork.fitting)}<p class="runway-reaction">“${runwayText('Exactly the pair I dreamed of.','就是我梦里的那双鞋。')}”</p><div class="runway-actions"><button class="secondary" data-runway-share>${runwayText('Share','分享')} ↗</button><button class="primary" data-runway-collection>✓ ${runwayText('Continue','继续')}</button></div></div></div>`);
 A.Introduction.advance(state,'fitting');persist();renderJourney();refreshFitting($('modalRoot').querySelector('.runway-scene'));hydrateCanvases($('modalRoot'));scheduleCanvasResize();
 runwayFitting?.dispose();runwayFitting=A.Fitting2D.mount($('modalRoot').querySelector('.runway-painted-window'),artwork.design,artwork.fitting);
 setRunwayProduct($('modalRoot').querySelector('.runway-scene'),false);
}
// A commission is paid once in pack(). Every exit from its fitting must
// consume that same committed result before returning to the active studio.
function leaveRunway(){
 if(busy||adActive||modalKind!=='runway')return;
 A.Introduction.advance(state,'pose');persist();
 if(runwayReturn?.kind==='result'&&commissionReady){void continueCommission();return;}
 clearPacking();openGallery(runwayIndex);
}
async function continueCommission(){
 if(busy||adActive||!commissionReady)return;
 const reward=commissionReady;commissionReady=null;busy=true;syncGameplay();
 $('customer').classList.add('customer-exit');
 await delay(reducedMotion?0:200);
 $('customer').classList.remove('customer-exit');clearPacking();busy=false;
 if(state.served>=customersForDay(state.day))summary();
 else{newOrder();closeModal();renderAll();}
 audio.sfx('coin',reward.coins);particles(innerWidth/2,innerHeight/2,true);
 persist();
}
async function shareRunway(){
 const artwork=state.gallery[runwayIndex];if(!artwork)return;
 const button=$('modalRoot').querySelector('[data-runway-share]');if(button)button.disabled=true;
 const title=t('brand'),text=option('color',artwork.design.color)[1]+' · '+option('heel',artwork.design.heel)[1];
 try{
  const sceneId=artwork.scene||state.showcase.selected;
  const source=document.createElement('canvas');source.width=1220;source.height=1000;
  const fitted=document.createElement('canvas');fitted.width=source.width;fitted.height=source.height;
  await A.Fitting2D.render(fitted,artwork.design,artwork.fitting,sceneId,true);
  const backdrop=new Image();backdrop.src='assets/'+A.Showcase.find(sceneId).closeImage+'.webp';await backdrop.decode();
  const {background:bg}=A.Showcase.project(sceneId,source.width,source.height,true),picture=source.getContext('2d');
  picture.drawImage(backdrop,bg.x,bg.y,bg.width,bg.height);picture.drawImage(fitted,0,0);
  const blob=source?await new Promise(resolve=>source.toBlob(resolve,'image/png')):null;
  const file=blob?new File([blob],'sweet-shoe-atelier.png',{type:'image/png'}):null;
  if(file&&navigator.canShare?.({files:[file]}))await navigator.share({title,text,files:[file]});
  else if(navigator.share)await navigator.share({title,text});
  else if(file){const url=URL.createObjectURL(file),link=document.createElement('a');link.href=url;link.download=file.name;link.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
  else toast(runwayText('Your pair is saved in Collection.','鞋子已经珍藏。'));
 }catch(error){if(error.name!=='AbortError')toast(runwayText('Your pair is saved in Collection.','鞋子已经珍藏。'));}
 finally{if(button?.isConnected)button.disabled=false;}
}
function refreshFitting(scene){
 if(!scene)return;
 A.Showcase.frame(scene);hydrateCanvases(scene);
}

function saveArtwork(stars=0){if(!state.gallery.some(a=>a.design.heel===design.heel))collectionMoment=design.heel;const art={design:{...design},stars,day:state.day,scene:state.showcase.selected,fitting:A.cleanFittingOptions(state.fitting)};state.gallery.unshift(art);state.gallery=state.gallery.slice(0,60);return art;}
function clearPacking(){$('stage').classList.remove('packing','closed');$('pack').disabled=false;}
async function pack(){
 if(busy||modalKind||adActive||mode==='order'&&(!state.order||state.served>=customersForDay(state.day)))return;busy=true;syncGameplay();state.tutorial=true;$('tutorial').hidden=true;$('pack').disabled=true;
 const order=state.order, timedOut=mode==='order'&&state.remaining<=0;
 const result=mode==='order'?scoreOrder(design,order,state.remaining,state.combo):null;
 const mood=result?(timedOut?1:result.stars):3;
 const portrait=$('customer').querySelector('.portrait-wrap img');if(portrait&&order&&mode==='order')portrait.src='assets/'+expression(order.person,mood)+'.webp';
 $('stage').classList.add('packing');audio.sfx('box');await delay(reducedMotion?50:800);$('stage').classList.add('closed');audio.sfx('ribbon');
 if(result?.stars===3){particles();const conf=document.createElement('img');conf.className='confetti';conf.src='assets/confetti.webp';conf.alt='';$('stage').append(conf);setTimeout(()=>conf.remove(),1800);}
 await delay(reducedMotion?50:650);
 if(mode==='free'){saveArtwork();checkAchievements();persist();modal('saved',`<img class="modal-hero" src="assets/ui/logo_v4.webp" alt=""><div class="result-shoes">${productCanvas(design)}</div><h2>${t('saved')}</h2><button class="secondary" data-try-on="0">${runwayText('Try on your pair','试穿这双鞋')} ↗</button>${btn('continueFree','continue')}`);busy=false;return;}
 const totalRequirements=order.requirements.length;state.combo=result.streak;state.total++;state.served++;state.dayStars+=result.stars;state.stars+=A.commissionStars(result);state.dayCoins+=result.earned;state.coins+=result.earned;if(result.stars===3)state.perfect++;
 const art=saveArtwork(result.stars);if(!state.best||result.earned>state.best.earned)state.best={...art,earned:result.earned};
 if(state.perfect>=3&&!state.goalClaimed){state.goalClaimed=true;state.coins+=30;state.dayCoins+=30;setTimeout(()=>toast(t('goalDone')),1500);}checkAchievements(result);
 if(state.combo>0&&state.combo%3===0){sdkCall('game','happytime');$('combo').textContent='×'+result.multiplier+' '+t('streak');setTimeout(()=>$('combo').textContent='',2200);}
 state.order=null;commissionReady={coins:result.earned};A.Introduction.advance(state,'commission');persist();renderHeader();audio.sfx('delivery');
 modal('result',`<span class="eyebrow">${t('result')}</span><img class="result-portrait" src="assets/${expression(order.person,mood)}.webp" alt="${t('name'+order.person)}"><div class="result-shoes">${productCanvas(art.design)}</div><h2>${t(result.stars===3?'perfect':result.stars===2?'good':'okay')}</h2><div class="stars" aria-label="${result.stars} ${t('starsLabel')}">${starIcons(result.stars)}</div><p class="commission-reward">${icon('star')} +${A.commissionStars(result)} ${t('renovationStars')}</p><p>${result.matched} / ${totalRequirements} ${t('matched')}</p><div class="stats"><div><strong>${icon('coin')}+${result.earned}</strong><small>${t('coins')}</small></div><div><strong>+${result.speed}</strong><small>${t('speed')}</small></div><div><strong>+${result.style}</strong><small>${t('style')}</small></div></div><button class="secondary" data-try-on="0">${runwayText('Try on your pair','试穿这双鞋')} ↗</button>${btn('next',state.served>=customersForDay(state.day)?'summaryButton':'next')}`);busy=false;
}
function summary(){if(state.dayCoins>state.record){state.record=state.dayCoins;sdkCall('game','happytime');toast(t('record'));persist();}modal('summary',`<img class="modal-hero" src="assets/ui/logo_v4.webp" alt=""><span class="eyebrow">${A.lang==='zh'?'第 '+state.day+' 天':t('day')+' '+state.day}</span><h2>${t('summary')}</h2><div class="stats"><div><strong>${state.dayStars} / ${customersForDay(state.day)*3}</strong><small>${t('starsLabel')}</small></div><div><strong>${state.dayCoins}</strong><small>${t('coins')}</small></div><div><strong>${state.served}</strong><small>${t('customers')}</small></div></div><p>${t('best')}</p><div class="best-design">${state.best?productCanvas(state.best.design):''}</div><p><button class="secondary" data-action="double" ${state.doubled?'disabled':''}>${t(state.doubled?'rewarded':'double')}</button></p>${btn('newDay','newDay')}`);}
async function requestAd(type,reward){if(adActive)return false;if(!sdkActive){toast(t('unavailable'));return false;}adActive=true;syncGameplay();audio.update();const oldDisabled=[...document.querySelectorAll('button')].map(b=>[b,b.disabled]);oldDisabled.forEach(([b])=>b.disabled=true);const success=await new Promise(resolve=>{let settled=false;const finish=ok=>{if(settled)return;settled=true;clearTimeout(watchdog);resolve(ok);};const watchdog=setTimeout(()=>finish(false),90000);try{const adPromise=sdk.ad.requestAd(type,{adStarted:()=>{audio.update();syncGameplay();},adFinished:()=>finish(true),adError:()=>finish(false)});if(adPromise?.catch)adPromise.catch(()=>finish(false));}catch{finish(false);}});adActive=false;oldDisabled.forEach(([b,disabled])=>{if(b.isConnected)b.disabled=disabled;});audio.update();if(success&&reward)reward();else if(!success)toast(t('unavailable'));syncGameplay();return success;}
async function nextDay(){if(busy||adActive)return;busy=true;syncGameplay();if(Date.now()-lastMidgame>=180000&&sdkActive){lastMidgame=Date.now();await requestAd('midgame');}state.day++;state.served=state.dayStars=state.dayCoins=state.perfect=state.combo=0;state.goalClaimed=state.doubled=false;state.best=null;newOrder();busy=false;clearPacking();closeModal();renderAll();persist();}
function switchMode(next){if(busy||adActive)return;toast('');persist();mode=next;if(next==='order')A.Introduction.advance(state,'studio');persist();clearPacking();closeModal();renderAll();if(mode==='order'&&state.served>=customersForDay(state.day))summary();}
function choose(k,v){if(busy||modalKind||adActive)return;if(!unlocked(state,k,v)){if(A.CRAFT_UNLOCKS[k+':'+v]){modal('craft-unlock',`<h2>${t(v)}</h2><p>${craftLabel(k,v)}</p><p>${A.lang==='zh'?'在工坊合成发现，即可永久用于顾客订单与自由设计。':'Craft this material once to use this detail in commissions and free designs forever.'}</p><button class="primary" data-craft-chain="${A.CRAFT_UNLOCKS[k+':'+v].slice(0,3)}">${A.lang==='zh'?'前往工坊':'Visit the workroom'}</button>${btn('close','close',true)}`);return;}modal('unlock',`<h2>${t('unlock')} · ${t(v)}</h2><p>${icon('coin')} ${option(k,v)[2]} · ${t('coins')}: ${state.coins}</p><button class="primary" data-unlock="${k}:${v}">${t('unlock')}</button>${btn('close','close',true)}`);return;}design=cleanDesign({...design,[k]:v});state.recentChoices[k]=[v,...(state.recentChoices[k]||[]).filter(id=>id!==v)].slice(0,3);if(k==='decoration'&&v==='big'&&A.Introduction.advance(state,'bow'))persist();audio.sfx('pop');renderPreview(true);renderTabs();renderCustomer();if(!state.tutorial){tutorialStep=2;setTutorial();}renderJourney();saveSoon();}
async function action(a){if(adActive)return;switch(a){case 'tutorial':state.tutorial=true;setTutorial();persist();break;case 'resume':case 'close':closeModal();audio.ensure();renderAll();break;case 'sound':state.sound=!state.sound;audio.ensure();audio.update();persist();renderHeader();if(modalKind==='pause')openPause();break;case 'music':state.music=!state.music;audio.ensure();audio.update();persist();openPause();break;case 'language':A.lang=A.lang==='en'?'zh':'en';state.lang=A.lang;persist();renderAll();openPause();break;case 'resetAsk':modal('reset',`<h2>${t('resetAsk')}</h2><p>${t('resetBody')}</p>${btn('reset','confirm')}${btn('pause','cancel',true)}`);break;case 'reset':state=freshSave();commissionReady=null;state.lang=A.lang;state.visited=true;design={...defaults};mode='merge';tutorialStep=0;clearPacking();closeModal();newOrder();renderAll();persist();break;case 'pause':openPause();break;case 'continueFree':clearPacking();closeModal();renderAll();break;case 'next':await continueCommission();break;case 'newDay':await nextDay();break;case 'double':if(!state.doubled)await requestAd('rewarded',()=>{state.coins+=state.dayCoins;state.dayCoins*=2;state.doubled=true;persist();renderHeader();summary();toast(t('doubled'));});break;case 'time':if(state.order&&!state.order.adUsed)await requestAd('rewarded',()=>{state.remaining+=15;state.order.adUsed=true;persist();renderCustomer();toast(t('reward'));});break;case 'achievements':modal('achievements',`<h2>${t('achievements')}</h2><div class="shop-grid">${['first','perfect','streak','ten','shop','gallery','day','vip'].map(id=>`<div class="shop-item">${icon('star',state.achievements.includes(id)?'':'unearned')}<p>${t('a_'+id)}</p></div>`).join('')}</div><p>${btn('pause','return',true)}</p>`);break;case 'titleLanguage':A.lang=A.lang==='en'?'zh':'en';state.lang=A.lang;persist();renderAll();openTitle();break;case 'openingNext':state.opening++;persist();if(state.opening>=4)finishOpening();else openOpening(state.opening);break;case 'openingSkip':finishOpening();break;case 'titleFree':state.visited=true;switchMode('free');persist();break;case 'welcome':if(state.opening<4&&state.mergeGuide===0){openOpening(state.opening);break;}state.visited=true;persist();closeModal();renderAll();if(mode==='order'&&state.served>=customersForDay(state.day))summary();break;}}
document.addEventListener('click',e=>{audio.ensure();if(modalKind==='opening'&&e.target.closest('.vn-story')&&!e.target.closest('[data-action=openingSkip]')){if(guidance.completeType())return;action('openingNext');return;}const b=e.target.closest('button');if(!b||b.disabled||adActive)return;if(b.closest('#tutorialDirector')&&b.dataset.guideSkip!==undefined){state.mergeGuide=6;A.Introduction.skip(state);state.tutorial=true;persist();renderAll();return;}if(b.closest('#tutorialDirector')&&b.dataset.guideFinish!==undefined){state.mergeGuide=6;A.Introduction.begin(state);persist();renderAll();return;}if(!b.dataset.cell&&!b.dataset.deliver&&!b.dataset.option&&!b.dataset.heelHeight)audio.sfx(b.dataset.nav||b.dataset.tab?'navigation':'click');if(b.dataset.journeySkip!==undefined){A.Introduction.skip(state);state.tutorial=true;persist();if(modalKind==='shop')openShop();else if(modalKind==='collection')openGallery();else{renderAll();renderJourney();}return;}if(b.dataset.journeyAction){const a=b.dataset.journeyAction;if(a==='finish'){A.Introduction.advance(state,'finish');state.tutorial=true;persist();switchMode('merge');}else if(a==='collection')openGallery();else if(a==='shop')openShop();else if(a==='fitting')openRunway(0);else switchMode(a==='studio'?'order':'merge');return;}if(b.dataset.boutiqueStory!==undefined){modal('journal',A.Boutique.storyMarkup(state));return;}if(b.dataset.boutiqueReturn!==undefined){openShop();return;}if(b.dataset.dailyClaim){const claimed=A.Boutique.claimDaily(state,b.dataset.dailyClaim);persist();renderHeader();if(claimed)audio.sfx('coin');openShop();return;}if(b.dataset.renovate!==undefined){renovate(+b.dataset.renovate);return;}if(b.dataset.boutiqueBefore!==undefined){openShop(b.getAttribute('aria-pressed')!=='true');return;}if(b.dataset.boutiqueEarn!==undefined){switchMode('merge');return;}if(b.dataset.boutiqueContinue!==undefined){continueBoutique();return;}if(b.dataset.tryOn!==undefined){openRunway(+b.dataset.tryOn);return;}if(b.dataset.showcase){const result=A.Showcase.choose(state,b.dataset.showcase,state.gallery[runwayIndex]);if(!result.ok){audio.sfx('error');toast(runwayText('A few more wishes will earn these coins.','再完成几份心愿，就能攒够金币。'));return;}persist();renderHeader();const angle=$('modalRoot').querySelector('.runway-scene')?.dataset.runwayAngle,pose=$('modalRoot').querySelector('.runway-scene')?.dataset.runwayPose;openRunway(runwayIndex,true);const stage=$('modalRoot').querySelector('.runway-scene');if(pose){stage.dataset.runwayPose=pose;document.querySelectorAll('[data-runway-pose-button]').forEach(x=>{const active=x.dataset.runwayPoseButton===pose;x.className=active?'primary':'secondary';x.setAttribute('aria-pressed',active);});}refreshFitting(stage);if(angle)$('modalRoot').querySelector('[data-runway-angle-button="'+angle+'"]')?.click();hydrateCanvases($('modalRoot'));if(result.unlocked){audio.sfx('unlock');stage.classList.add('scene-unlocked');const badge=document.createElement('span');badge.className='scene-unlock-badge';badge.setAttribute('role','status');badge.textContent='✧ '+runwayText('A new little escape','新场景已解锁')+' · '+runwayText(result.scene.en,result.scene.zh);stage.append(badge);setTimeout(()=>badge.remove(),3200);particles(innerWidth/2,innerHeight/2);}document.querySelector('[data-showcase="'+b.dataset.showcase+'"]').focus({preventScroll:true});return;}if(b.dataset.runwayBack!==undefined){leaveRunway();return;}if(b.dataset.fittingSock!==undefined){chooseFitting('sock',b.dataset.fittingSock);return;}if(b.dataset.fittingColor!==undefined){chooseFitting('color',b.dataset.fittingColor);return;}if(b.dataset.runwayShare!==undefined){shareRunway();return;}if(b.dataset.runwayCollection!==undefined){leaveRunway();return;}if(b.dataset.runwayPoseButton){const scene=$('modalRoot').querySelector('.runway-scene');scene.dataset.runwayPose=b.dataset.runwayPoseButton;refreshFitting(scene);if(A.Introduction.advance(state,'pose')){persist();renderJourney();audio.sfx('guide');}document.querySelectorAll('[data-runway-pose-button]').forEach(x=>{const active=x===b;x.className=active?'primary':'secondary';x.setAttribute('aria-pressed',active);});audio.sfx('whoosh');return;}if(b.dataset.runwayAngleButton){const scene=$('modalRoot').querySelector('.runway-scene'),canvas=scene.querySelector('.angle-canvas');scene.dataset.runwayAngle=b.dataset.runwayAngleButton;refreshFitting(scene);document.querySelectorAll('[data-runway-angle-button]').forEach(x=>{const active=x===b;x.className=active?'primary':'secondary';x.setAttribute('aria-pressed',active);});hydrateCanvases(scene);audio.sfx('whoosh');return;}if(b.dataset.runwayDetail!==undefined){const stage=$('modalRoot').querySelector('.runway-scene');let layer=stage.querySelector('.runway-product-detail');if(!layer){layer=document.createElement('div');layer.className='runway-product-detail';stage.append(layer);}const on=stage.classList.toggle('show-product-detail');b.setAttribute('aria-pressed',on);refreshFitting(stage);return;}if(b.dataset.runwayZoom!==undefined){return;}if(b.dataset.bubbleBuy){mergeScreen.bubbleAction(+b.dataset.bubbleBuy,'buy');return;}if(b.dataset.bubbleDismiss){mergeScreen.bubbleAction(+b.dataset.bubbleDismiss,'dismiss');return;}if(b.dataset.craftChain){switchMode('merge');mergeScreen.openBook(b.dataset.craftChain);return;}if(b.dataset.bookChain && modalKind==='atelier-book'){mergeScreen.openBook(b.dataset.bookChain);$('modalRoot').querySelector('[data-book-chain="'+b.dataset.bookChain+'"]')?.focus();return;}if(b.dataset.action){action(b.dataset.action);return;}if(b.dataset.tab){if(busy||modalKind)return;tab=b.dataset.tab;renderTabs();if(!state.tutorial){tutorialStep=1;setTutorial();}renderJourney();return;}if(b.dataset.studioCloseup!==undefined){studioCloseup=!studioCloseup;b.setAttribute('aria-pressed',studioCloseup);return;}if(b.dataset.studioAngle){studioAngle=b.dataset.studioAngle;renderPreview();return;}if(b.dataset.heelHeight){const heel=Object.keys(A.THIN_HEELS).find(h=>A.THIN_HEELS[h]===Number(b.dataset.heelHeight));if(heel){choose('heel',heel);document.querySelector('[data-heel-height="'+b.dataset.heelHeight+'"]')?.focus({preventScroll:true});}return;}if(b.dataset.recentOption){choose(tab,b.dataset.recentOption);return;}if(b.dataset.option){choose(tab,b.dataset.option);return;}if(b.dataset.nav){if(busy)return;const n=b.dataset.nav;if(n==='atelier'||n==='serve'||n==='free')switchMode(n==='atelier'?'merge':n==='serve'?'order':'free');else if(n==='shop')openShop();else openGallery();return;}if(b.dataset.buy){if(buy(...b.dataset.buy.split(':'))){renderTabs();openShop();}return;}if(b.dataset.unlock){const [k,v]=b.dataset.unlock.split(':');if(buy(k,v)){closeModal();choose(k,v);}return;}if(b.dataset.gallerySelect!==undefined){openGallery(+b.dataset.gallerySelect);$('modalRoot').querySelector('[data-gallery-select=\"'+b.dataset.gallerySelect+'\"]')?.focus({preventScroll:true});return;}if(b.dataset.reuse!==undefined){design=cleanDesign(state.gallery[+b.dataset.reuse].design);switchMode('free');persist();}});
$('pack').onclick=pack;$('pause').onclick=openPause;$('sound').onclick=()=>action('sound');$('inspire').onclick=()=>{if(busy||modalKind||adActive)return;for(const k of Object.keys(opts)){const pool=opts[k].filter(o=>unlocked(state,k,o[0]));design[k]=pool[Math.floor(Math.random()*pool.length)][0];}design=cleanDesign(design);renderPreview(true);renderTabs();renderCustomer();saveSoon();};
document.addEventListener('error',e=>{if(e.target instanceof HTMLImageElement)e.target.style.visibility='hidden';},true);
document.addEventListener('touchend',()=>audio.ensure(),{passive:true});document.addEventListener('contextmenu',e=>e.preventDefault());
document.addEventListener('keydown',e=>{audio.ensure();if(adActive)return;if(guidance.dialogueActive()&&(e.key==='Enter'||e.key===' '||e.key==='Escape')){e.preventDefault();guidance.advance();return;}if(e.key==='Escape'||e.key.toLowerCase()==='p'){e.preventDefault();if(modalKind)dismissModal();else openPause();}if(e.key==='Tab'&&modalKind){const buttons=[...$('modalRoot').querySelectorAll('button:not(:disabled)')];const first=buttons[0],last=buttons[buttons.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}});
document.addEventListener('visibilitychange',()=>{lastFrame=performance.now();audio.update();syncGameplay();if(document.hidden)persist();});window.addEventListener('pagehide',persist);
function frame(now){mergeScreen.tick(now);const dt=Math.min(.25,(now-lastFrame)/1000||0);lastFrame=now;if(playing&&mode==='order'&&state.order&&state.tutorial&&!A.Introduction.active(state)){state.remaining=Math.max(0,state.remaining-dt);renderTimer();saveElapsed+=dt;if(saveElapsed>=4){saveElapsed=0;persist();}if(state.remaining<=0)pack();}requestAnimationFrame(frame);}
function finishOpening(){state.opening=4;state.visited=true;persist();closeModal();renderAll();}
function openOpening(step=0){
 const panels=A.Introduction.opening[A.lang],panel=panels[Math.min(3,step)];
 modal('opening',`<div class="opening-story vn-story"><div class="opening-art opening-art-${step}"><img class="opening-room" src="assets/bg_shop.webp" alt=""><img class="opening-character" src="assets/mentor/mentor_${step===0?'wave':step===2?'present':'point'}.webp" alt="">${step===3?'<img class="opening-customer" src="assets/c_buns_neutral.webp" alt="">':''}</div><div class="opening-copy vn-box"><span class="vn-name">${A.lang==='zh'?'米米':'Mimi'}</span><span class="section-kicker">${A.lang==='zh'?'奶奶的来信':'A LETTER FROM GRANDMA'} · ${step+1} / 4</span><h2>${panel[0]}</h2><p class="vn-text">${panel[1]}</p><button class="vn-next" data-action="openingNext">${A.lang==='zh'?'点击继续':'Tap to continue'} <span>▼</span></button><button class="secondary vn-skip" data-action="openingSkip">${A.lang==='zh'?'跳过':'Skip'}</button></div></div>`);
 $('modalRoot').querySelector('.backdrop').classList.add('opening-backdrop');
 $('modalRoot').querySelector('.modal').classList.add('opening-modal');
 guidance.type($('modalRoot').querySelector('.vn-text'));

}
function openTitle(){modal('welcome',`<div class="title-sparkles"><img src="assets/sparkle.webp" alt=""><img src="assets/sparkle.webp" alt=""><img src="assets/sparkle.webp" alt=""></div><img class="title-logo" src="assets/ui/logo_v4.webp" alt="${t('brand')}">${A.lang==='zh'?'<h2>甜甜小鞋铺</h2>':''}<p>${t('tagline')}</p><div class="title-actions">${btn('welcome',state.visited?'continue':(A.lang==='zh'?'工坊':'Atelier'))}${btn('titleFree','free',true)}<button class="secondary" data-action="titleLanguage">${A.lang==='en'?'简体中文':'English'}</button></div>`);$('modalRoot').querySelector('.backdrop').classList.add('title-backdrop');const card=$('modalRoot').querySelector('.modal');card.classList.add('title-card');card.tabIndex=-1;card.focus({preventScroll:true});}
async function boot(){
 let preferred;try{const saved=JSON.parse(localStorage.getItem('sweet-shoe-v3')||localStorage.getItem('sweet-shoe-v2')||'null');preferred=A.normalizeLanguage(saved?.lang);}catch{}
 const localizeLoading=()=>{$('loadText').textContent=t('loading');$('loadBar').setAttribute('aria-label',t('loading'));document.documentElement.lang=A.lang==='zh'?'zh-CN':'en';document.title=t('brand');$('loading').querySelector('img').alt=t('brand');};
 // Resolve saved language before awaiting the SDK so startup never flashes English.
 A.lang=preferred||A.normalizeLanguage(navigator.language)||'en';localizeLoading();
 await initSDK();sdkCall('game','loadingStart');let locale;try{locale=sdk?.user?.systemInfo?.locale;}catch{}
 A.lang=preferred||A.normalizeLanguage(locale)||A.lang;localizeLoading();
 const paintedReady=A.Shoe2D.preload();
 const runtimeAssets=ASSET_NAMES.filter(name=>!/^shoe_|^(legs|tones|angles|poses|fabrics)\//.test(name));
 let loaded=0;await Promise.all(runtimeAssets.map(name=>new Promise(resolve=>{const im=new Image();let done=false;const finish=ok=>{if(done)return;done=true;clearTimeout(timeout);if(ok)images.set(name,im);loaded++;$('loadFill').style.width=loaded/runtimeAssets.length*100+'%';$('loadProgress').textContent=Math.round(loaded/runtimeAssets.length*100)+'%';$('loadBar').setAttribute('aria-valuenow',Math.round(loaded/runtimeAssets.length*100));resolve();};const timeout=setTimeout(()=>finish(false),12000);im.onload=()=>{images.set(name,im);finish(true);scheduleCanvasResize();};im.onerror=()=>finish(false);im.src='assets/'+name+'.webp';})));
 await paintedReady;
 state=await readSave();saveReady=true;A.lang=state.lang||A.lang;design=cleanDesign(state.design);for(const k of Object.keys(opts))if(!unlocked(state,k,design[k]))design[k]=defaults[k];
 if(!state.order&&!commissionReady&&state.served<customersForDay(state.day))newOrder();persist();sdkCall('game','loadingStop');$('app').hidden=false;$('loading').hidden=true;modalKind='welcome';renderAll();openTitle();lastFrame=performance.now();requestAnimationFrame(frame);
}
boot().catch(error=>{console.error('Atelier startup failed',error);$('loading').hidden=true;$('app').hidden=false;renderAll();});

// Title screen: try to start the music as soon as the game opens. Browsers that
// block autoplay start it on the very first press anywhere (pointerdown beats click).
document.addEventListener('pointerdown',()=>audio.ensure(),{passive:true,capture:true});
window.addEventListener('load',()=>{try{audio.ensure();}catch{}},{once:true});

})(globalThis.SweetShoe = globalThis.SweetShoe || {});
