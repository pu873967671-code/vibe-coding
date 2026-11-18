'use strict';
// Guided fitting: serving a customer is a few short steps instead of an
// editor. Each step is one thing she wished for, offered as three choices;
// her face reacts to every pick, and a wrong pick costs a little patience.
// An optional last step offers a detail from her own taste ("your touch"),
// which earns the existing style bonus. Logic only; app.js draws it.
(function(A){
  const ORDER=['heel','color','material','pattern','strap','decoration','charm'];
  const BOWS=['small','big','puffy','doublebow','heelbow'];
  const copy={
    en:{guided:'Guided fitting',step:'Step {i} of {n}',touch:'Your touch',more:'All options',back:'Guided fitting',skip:'Skip',
      ready:'All set!',readyHint:'Wrap it up for {name} below.',penalty:'−{s}s patience',
      ask:{heel:'Which shape will {name} wear?',color:'Which colour feels like {name}?',material:'Which fabric would {name} pick?',pattern:'Which motif suits {name}?',strap:'Which strap would {name} like?',decoration:'Which heel detail?',charm:'Which toe charm?',noBows:'{name} likes it simple… which heel detail?'},
      touchAsk:'One little extra {name} might secretly love?',
      yes:['That’s it!','Perfect!','Yes, exactly!','I love it!'],no:['Hmm… not quite.','Maybe something else?','Not really me…'],
      treat:['Oh! How did you know?','You remembered!','That’s so me!'],plain:'Cute, but not quite me.'},
    zh:{guided:'贴心试搭',step:'第 {i} 步，共 {n} 步',touch:'你的小心意',more:'全部选项',back:'贴心试搭',skip:'跳过',
      ready:'都搭好了！',readyHint:'在下方为{name}包装吧。',penalty:'耐心 −{s}秒',
      ask:{heel:'{name}会穿哪种鞋型？',color:'哪个颜色最像{name}？',material:'{name}会选哪种面料？',pattern:'哪个图案适合{name}？',strap:'{name}喜欢哪种鞋带？',decoration:'后跟要什么装饰？',charm:'鞋尖要什么点缀？',noBows:'{name}喜欢简简单单……后跟要什么装饰？'},
      touchAsk:'再加一点{name}偷偷喜欢的小细节？',
      yes:['就是它！','完美！','对，就是这个！','好喜欢！'],no:['嗯……不太对。','要不换一个？','不太像我……'],
      treat:['哇！你怎么知道？','你还记得！','太像我了！'],plain:'很可爱，但不太是我。'}
  };
  const tr=()=>copy[A.lang==='zh'?'zh':'en'];
  function target(r){
    if(r.key==='heelHeight')return {key:'heel',value:{3:'kitten',6:'stiletto6',9:'stiletto9'}[Number(r.value)],req:r};
    if(r.key==='noBows')return {key:'decoration',value:'none',noBows:true,req:r};
    return {key:r.key,value:r.value,req:r};
  }
  function seed(order){let h=2166136261;for(const c of JSON.stringify([order.person,order.requirements]))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
  function rng(x){x=x||1;return ()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296;};}
  function steps(s,order){
    const seen=new Set(),list=[];
    for(const t of order.requirements.map(target))if(t.value&&!seen.has(t.key)){seen.add(t.key);list.push({...t,kind:'wish'});}
    list.sort((a,b)=>ORDER.indexOf(a.key)-ORDER.indexOf(b.key));
    const heel=list.find(x=>x.key==='heel')?.value;
    const pref=A.themes[order.person]?.pref||{};
    const touch=Object.entries(pref).find(([k,v])=>!seen.has(k)&&A.unlocked(s,k,v)&&(!heel||A.supportsStyleOption(heel,k,v)));
    if(touch)list.push({key:touch[0],value:touch[1],kind:'touch'});
    return list;
  }
  // Three choices: the wished one and two others the player can use, in a
  // stable order for this customer.
  function choices(s,order,step,index,design){
    const r=rng(seed(order)+index*977);
    const heel=step.key==='heel'?null:design.heel;
    const pool=A.opts[step.key].map(o=>o[0]).filter(v=>v!==step.value&&A.unlocked(s,step.key,v)&&(!heel||A.supportsStyleOption(heel,step.key,v))
      &&!(step.key==='heel'&&A.THIN_HEELS[v])&&!(step.noBows&&BOWS.includes(v)));
    for(let i=pool.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
    const out=pool.slice(0,2);out.splice(Math.floor(r()*3),0,step.value);
    return out;
  }
  function correct(step,design){return step.kind==='touch'?design[step.key]===step.value:A.matches(design,step.req);}
  const pick=(list,n)=>list[n%list.length];
  function reaction(step,ok,n){const c=tr();return step.kind==='touch'?(ok?pick(c.treat,n):c.plain):(ok?pick(c.yes,n):pick(c.no,n));}
  function ask(step,name){const c=tr();return (step.kind==='touch'?c.touchAsk:c.ask[step.noBows?'noBows':step.key]).replace('{name}',name);}
  A.Guided={steps,choices,correct,reaction,ask,tr,PENALTY:4};
})(globalThis.SweetShoe);
