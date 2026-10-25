'use strict';
(function(A){
 A.createTutorialDirector=function(){
  const root=document.createElement('div');root.id='tutorialDirector';document.body.append(root);
  const seen=new Set(),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Once a gesture is learned, let the next highlighted action teach by doing.
  // Repeating a modal between each move/merge made the first pair feel distant.
  const practiceSteps=new Set(['guide-2','guide-3','guide-4','guide-5','journey-5']);
  let current,phase='',typed,timer,animation,raf;
  const copy=(en,zh)=>A.lang==='zh'?zh:en;
  function completeType(){if(!typed)return false;clearInterval(timer);typed.el.textContent=typed.text;typed=null;return true;}
  function type(el){completeType();if(!el||reduced)return;const text=el.textContent;el.textContent='';let n=0;typed={el,text};timer=setInterval(()=>{if(!el.isConnected){clearInterval(timer);typed=null;return;}el.textContent=text.slice(0,++n);if(n>=text.length){clearInterval(timer);typed=null;}},A.lang==='zh'?32:18);}
  function clear(){completeType();animation?.cancel();cancelAnimationFrame(raf);root.replaceChildren();phase='';document.body.classList.remove('dialogue-active');}
  function hide(){clear();current=null;}
  function position(){
   if(!current||phase!=='spotlight')return;
   root.querySelector('.guide-focus')?.remove();animation?.cancel();
   const target=document.querySelector(current.target||'[data-no-target]');if(!target)return;
   const r=target.getBoundingClientRect();if(!r.width||!r.height)return;
   const from=current.from?document.querySelector(current.from):null,f=from?.getBoundingClientRect();
   const cx=r.x+r.width/2,cy=r.y+r.height/2,pad=6;
   const hole=b=>`M${b.x-pad} ${b.y-pad}h${b.width+pad*2}v${b.height+pad*2}h-${b.width+pad*2}Z`;
   const dest=f&&from!==target?f:null;
   const group=document.createElement('div');group.className='guide-focus';group.setAttribute('aria-hidden','true');
   group.innerHTML=`<svg class="guide-shade" width="100%" height="100%"><path fill="#2f233f80" fill-rule="evenodd" d="M0 0H${innerWidth}V${innerHeight}H0Z ${hole(r)} ${dest?hole(dest):''}"/>${dest?`<path class="guide-drag-path" d="M${dest.x+dest.width/2} ${dest.y+dest.height/2} Q${(dest.x+dest.width/2+cx)/2} ${Math.min(dest.y,cy)-30} ${cx} ${cy}"/>`:''}</svg><i class="guide-ring"></i><img class="guide-hand" src="assets/ui/tutorial_hand.svg" alt=""><span class="guide-label"></span>`;
   root.append(group);Object.assign(group.querySelector('.guide-ring').style,{left:r.x-pad+'px',top:r.y-pad+'px',width:r.width+pad*2+'px',height:r.height+pad*2+'px'});
   const hand=group.querySelector('.guide-hand'),hx=Math.min(innerWidth-82,Math.max(0,cx-22)),hy=Math.min(innerHeight-100,cy+6);Object.assign(hand.style,{left:hx+'px',top:hy+'px'});
   if(dest&&!reduced){const dx=dest.x+dest.width/2-cx,dy=dest.y+dest.height/2-cy;animation=hand.animate([{transform:`translate(${dx}px,${dy}px)`,opacity:.2},{transform:`translate(${dx}px,${dy}px)`,opacity:1,offset:.15},{transform:'translate(0,0)',opacity:1,offset:.8},{transform:'translate(0,0)',opacity:0}],{duration:1800,iterations:Infinity,easing:'ease-in-out'});}
   const label=group.querySelector('.guide-label');label.textContent=current.label||'';Object.assign(label.style,{maxWidth:'260px',left:Math.max(12,Math.min(innerWidth-272,cx-130))+'px',top:(dest?Math.max(8,Math.min(dest.y,r.y)-76):r.top>80?r.top-48:Math.min(innerHeight-48,r.bottom+90))+'px'});
  }
  function advance(){if(phase!=='dialogue'||completeType())return;seen.add(current.key);phase='spotlight';document.body.classList.remove('dialogue-active');root.querySelector('.guide-dialogue')?.remove();if(!current.target){hide();return;}const skip=document.createElement('button');skip.className='secondary director-skip';skip.textContent=copy('Skip guide','跳过引导');skip.setAttribute(current.skip,'');root.querySelector('.guide-action').append(skip);position();document.querySelector(current.target||'[data-no-target]')?.focus({preventScroll:true});}
  function show(config){
   const same=current?.key===config.key;current=config;if(same&&phase==='dialogue')return;
   clear();root.innerHTML=`<div class="guide-marker" ${config.marker||''}></div><div class="guide-action">${config.action||''}</div>`;
   if(seen.has(config.key)||practiceSteps.has(config.key)){
    seen.add(config.key);phase='spotlight';
    const skip=document.createElement('button');skip.className='secondary director-skip';skip.textContent=copy('Skip guide','跳过引导');skip.setAttribute(config.skip,'');root.querySelector('.guide-action').append(skip);
    const instruction=document.createElement('span');instruction.setAttribute('role','status');instruction.textContent=config.body;
    Object.assign(instruction.style,{position:'absolute',width:'1px',height:'1px',overflow:'hidden',clipPath:'inset(50%)'});root.append(instruction);
    position();document.querySelector(config.target||'[data-no-target]')?.focus({preventScroll:true});return;
   }
   phase='dialogue';document.body.classList.add('dialogue-active');
   root.insertAdjacentHTML('beforeend',`<div class="guide-dialogue" role="dialog" aria-modal="true" aria-labelledby="vnTitle"><img class="vn-mentor" src="assets/mentor/mentor_${config.key==='guide-0'?'wave':config.key==='guide-5'?'cheer':'point'}.webp" alt=""><div class="vn-box"><span class="vn-name">${copy('Mimi','米米')}</span><h2 id="vnTitle"></h2><p class="vn-text"></p><button class="vn-next" data-dialogue-next>${copy('Tap to continue','点击继续')} <span>▼</span></button><button class="secondary vn-skip" ${config.skip}>${copy('Skip','跳过')}</button></div></div>`);
   root.querySelector('h2').textContent=config.title;const text=root.querySelector('.vn-text');text.textContent=config.body;type(text);root.querySelector('[data-dialogue-next]').focus({preventScroll:true});
  }
  root.addEventListener('click',e=>{if(e.target.closest('[data-director-dismiss]')){e.stopPropagation();hide();return;}if(e.target.closest('.guide-dialogue')&&!e.target.closest('.vn-skip')){e.stopPropagation();advance();}});
  document.addEventListener('keydown',e=>{if(phase!=='dialogue')return;if(['Enter',' ','Escape'].includes(e.key)){e.preventDefault();e.stopImmediatePropagation();advance();}else if(e.key==='Tab'){e.preventDefault();const b=[...root.querySelectorAll('.guide-dialogue button')],i=b.indexOf(document.activeElement);b[(i+(e.shiftKey?-1:1)+b.length)%b.length]?.focus();}},true);
  window.addEventListener('resize',()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(position);});
  return {show,hide,type,completeType,advance,dialogueActive:()=>phase==='dialogue'};
 };
})(globalThis.SweetShoe=globalThis.SweetShoe||{});
