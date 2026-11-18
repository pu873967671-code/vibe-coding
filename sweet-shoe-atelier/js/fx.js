'use strict';
// Drawn hit effects for Sweet Shoe Atelier, using the Sakuga VFX effects layer
// (vendor/sakuga-vfx/core.js, MIT, by Justin Finkelman). The game never calls
// it directly: this file watches for the classes and elements the game already
// adds at its key moments and fires a matching effect there. Recoloured to the
// mint palette; the manga sound-effect lettering is not used. The core itself
// skips every effect when the player prefers reduced motion.
(function(){
  const F=window.SakugaFX;if(!F)return;
  Object.assign(F.P,{fill:'#ffffff',shade:'#bfe8d6',line:'#3f9a78',accent:'#f2a6bf',ink:'#2c5a4a',sfx:['#2c5a4a','#ffffff']});
  const pt=(el,fx=.5,fy=.5)=>F.at(el,fx,fy);
  // real-time delays: the library's own clock slows down with the frame rate
  const wait=(ms,f)=>setTimeout(f,ms);
  const recent=new WeakMap();
  // one effect per element per moment, even if the class is re-added in a re-render
  const once=(el,key,ms=500)=>{const m=recent.get(el)||{},t=performance.now();if(m[key]&&t-m[key]<ms)return false;m[key]=t;recent.set(el,m);return true;};
  const FX={
    'just-merged'(el){const p=pt(el),r=Math.max(30,p.w*.62);F.burst(p.x,p.y,{r,spikes:12,life:.32});wait(70,()=>{F.shards(p.x,p.y,{n:7,speed:170,size:4.5});F.kira(p.x+p.w*.36,p.y-p.h*.3,{r:8});F.kira(p.x-p.w*.34,p.y-p.h*.2,{r:6});});},
    'just-spawned'(el){const p=pt(el,.5,.72);F.puff(p.x,p.y,{n:4,size:9,vy:-14,life:.6});},
    'just-opened'(el){const p=pt(el);F.ring(p.x,p.y+p.h*.25,{rx:p.w*.6,ry:p.h*.18,life:.45,w:3});F.puff(p.x,p.y,{n:5,size:10,life:.7});F.kira(p.x,p.y-p.h*.35,{r:9});},
    'delivery-celebrate'(el){const p=pt(el);F.burst(p.x,p.y,{r:Math.min(90,p.w*.42),spikes:15,life:.38});wait(90,()=>{F.puff(p.x-p.w*.35,p.y+p.h*.3,{n:4,vx:-30});F.puff(p.x+p.w*.35,p.y+p.h*.3,{n:4,vx:30});for(let i=0;i<4;i++)F.kira(p.x+F.rnd(-p.w*.45,p.w*.45),p.y+F.rnd(-p.h*.45,p.h*.2),{r:F.rnd(6,11)});});},
    'closed'(el){if(!el.classList.contains('stage'))return;const p=pt(el,.5,.62);F.ring(p.x,p.y,{rx:p.w*.26,ry:p.h*.07,life:.55,w:4});F.puff(p.x-p.w*.2,p.y,{n:4,vx:-24,vy:-8});F.puff(p.x+p.w*.2,p.y,{n:4,vx:24,vy:-8});},
    'guided-ready-glow'(el){const p=pt(el);F.ticks(p.x-p.w*.42,p.y-p.h*.2,{n:3,r:14,dir:-2.3});F.ticks(p.x+p.w*.42,p.y-p.h*.2,{n:3,r:14,dir:-.8});}
  };
  function onClass(el){for(const c in FX)if(el.classList.contains(c)&&once(el,c))FX[c](el);}
  function onAdded(node){
    if(node.nodeType!==1)return;
    // cells re-rendered with an effect class already on them
    for(const c in FX){if(node.classList.contains(c))onClass(node);node.querySelectorAll?.('.'+c).forEach(onClass);}
    // a guided pick: sparkles on the chosen card when right, a little wobble when not
    if(node.classList.contains('guided-reaction')){
      const pick=document.querySelector('.guided-choice[aria-pressed="true"]');if(!pick)return;const p=pt(pick);
      if(node.classList.contains('ok')){F.ticks(p.x,p.y-p.h*.38,{n:5,r:18,dir:-Math.PI/2,fan:.5});F.kira(p.x+p.w*.32,p.y-p.h*.3,{r:9});F.kira(p.x-p.w*.3,p.y-p.h*.12,{r:6});}
      else F.wob(p.x+p.w*.5,p.y,{r:14});
      return;
    }
    const modal=node.matches?.('.modal')?node:node.querySelector?.('.modal');
    if(modal)wait(380,()=>onModal(modal));
  }
  function onModal(modal){
    // the game may redraw the same dialog right after opening it
    if(!modal.isConnected){const kind=modal.dataset.modalKind;modal=document.querySelector('#modalRoot .modal');if(!modal||modal.dataset.modalKind!==kind)return;}
    const kind=modal.dataset.modalKind,stars=modal.querySelector('.stars');
    if(kind==='result'&&stars){
      const label=stars.getAttribute('aria-label')||'';
      // over a card, never an opaque burst: ticks either side of the stars and a few sparkles
      if(/^3\b/.test(label)){const st=[...stars.children],l=pt(st[0]||stars),r=pt(st[st.length-1]||stars);
        F.ticks(l.x-l.w*.6,l.y,{n:4,r:16,dir:Math.PI,fan:.5});F.ticks(r.x+r.w*.6,r.y,{n:4,r:16,dir:0,fan:.5});
        wait(120,()=>{for(const e of st){const q=pt(e);F.kira(q.x+F.rnd(-q.w*.5,q.w*.5),q.y-q.h*.6,{r:F.rnd(6,10)});}});}
      const beat=modal.querySelector('.lane-beat:not(.retry)');
      if(beat)wait(450,()=>{const b=pt(beat,.5,0);F.kira(b.x-b.w*.42,b.y+6,{r:10});F.kira(b.x+b.w*.42,b.y+10,{r:8});});
    }
    if(kind==='party'){
      const row=modal.querySelector('.party-row');if(!row)return;const p=pt(row);
      // around the guests, not over them
      [0,240,480].forEach((ms,i)=>wait(ms,()=>{for(let k=0;k<4;k++)F.kira(p.x+F.rnd(-p.w*.55,p.w*.55),p.y-p.h*.62+F.rnd(-10,10),{r:F.rnd(7,12)});F.ticks(p.x+(i-1)*p.w*.36,p.y-p.h*.55,{n:5,r:16,dir:-Math.PI/2,fan:.6});}));
      wait(300,()=>{F.donut(p.x-p.w*.5,p.y,{vx:-40});F.donut(p.x+p.w*.5,p.y,{vx:40});});
    }
  }
  const start=()=>{
    new MutationObserver(list=>{for(const m of list){if(m.type==='attributes')onClass(m.target);else for(const n of m.addedNodes)onAdded(n);}})
      .observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
  };
  if(document.body)start();else addEventListener('DOMContentLoaded',start);
})();
