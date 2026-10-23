'use strict';
(function(A){
  const CRAFT_UNLOCKS={
    'material:lace':'fab4','material:velvet':'fab5','material:glitter':'spk4',
    'heel:kitten':'lea5','heel:wedge':'lea4','strap:cross':'lea3','strap:ribbon':'rib4',
    'decoration:big':'fab3','decoration:drop':'spk3','decoration:flower':'rib5',
    'charm:crystal':'spk4','charm:mini':'rib4','pattern:hearts':'fab3','pattern:dots':'fab3','pattern:stars':'spk3'
  };
  const plans=[{cells:[16],kind:'generate'},{cells:[23,24],kind:'merge',to:24},{cells:[30,15],kind:'move',to:15},{cells:[24,15],kind:'merge',to:15},{cells:[],kind:'delivery'}, {cells:[],kind:'finish'}];
  function advance(state,event){
    const step=state.mergeGuide,plan=plans[step];
    if(!plan||!event.ok||event.type!==plan.kind||(plan.to!==undefined&&event.to!==plan.to))return false;
    if(step===3&&!event.opened?.length)return false;
    state.mergeGuide++;
    if(state.mergeGuide===5)state.gems+=5;
    return true;
  }
  A.CRAFT_UNLOCKS=CRAFT_UNLOCKS;
  A.MergeGuide={plans,advance,active:s=>s.mergeGuide<6,allows:(s,index)=>s.mergeGuide>=6||!!plans[s.mergeGuide]?.cells.includes(index)};
  // Independent of the board guide: later lessons never lock navigation or spend for the player.
  A.Introduction={
    active:s=>s.introduction>0&&s.introduction<9,
    begin(s){if(s.introduction===0)s.introduction=1;this.sync(s);},
    sync(s){
      if(s.introduction===1&&(s.stars>=2||A.Boutique.count(s)>0))s.introduction=2;
      if(s.introduction===2&&A.Boutique.count(s)>0)s.introduction=3;
    },
    advance(s,event){
      const expected={3:'studio',4:'bow',5:'commission',6:'fitting',7:'pose',8:'finish'};
      if(expected[s.introduction]!==event)return false;
      s.introduction++;return true;
    },
    skip(s){s.introduction=9;}
  };
})(globalThis.SweetShoe=globalThis.SweetShoe||{});
