'use strict';
(function (A) {
  const CHAINS = ['fab','lea','spk','rib'];
  const work = needs => needs.reduce((total,n)=>total + 2 ** (n.tier-1) * n.count,0);
  // Minimum crafting work from actual inventory, without consuming higher pieces.
  // A ready item is zero merges; two scraps are one; a scrap quartet is three.
  function mergesNeeded(cells, chain, tier) {
    let missing=1,merges=0;
    for(let level=tier;level>=1;level--) {
      const available=cells.filter(c=>c?.kind==='item'&&c.chain===chain&&c.tier===level).length;
      missing=Math.max(0,missing-available);
      if(!missing)return merges;
      if(level===1)return Infinity;
      merges+=missing;missing*=2;
      if(merges>2)return Infinity;
    }
    return Infinity;
  }
  // Reproducible weighted selection makes saves stable and balancing simulations honest.
  function make(sequence, slot, board, avoid) {
    if(sequence===0)return {id:slot,person:slot,needs:[{chain:slot===0?'fab':'lea',tier:2,count:1}]};
    let seed = ((sequence + 1) * 2654435761 + slot * 1013904223) >>> 0;
    const random = () => ((seed = (Math.imul(seed,1664525) + 1013904223) >>> 0) / 4294967296);
    const cells = board?.cells || [], discovered = board?.discovered || [];
    const simple = slot === 0 || sequence < 6;
    const count = simple ? 1 : random() < .35 ? 3 : 2;
    const budget = simple ? 4 : Math.min(20,8 + Math.floor(sequence / 4) * 2);
    const needs = [];
    for (let i=0;i<count;i++) {
      const remaining = budget - work(needs) - (count-i-1)*2;
      let candidates = [];
      for (const chain of CHAINS.filter(c=>!board || cells.some(item=>item?.kind==='generator'&&item.chain===c))) {
        const known = Math.max(2,...discovered.filter(id=>id.startsWith(chain)).map(id=>+id.slice(-1)));
        const ceiling = simple ? 3 : Math.min(5,known+1,3+Math.floor(sequence/8));
        for(let tier=2;tier<=ceiling;tier++) {
          const cost=2**(tier-1);
          if(cost>remaining || needs.some(n=>n.chain===chain&&n.tier===tier))continue;
          const mass=cells.reduce((sum,c)=>sum+(c?.kind==='item'&&c.chain===chain&&c.tier<=tier?2**(c.tier-1):0),0);
          const ready=cells.some(c=>c?.kind==='item'&&c.chain===chain&&c.tier===tier);
          const generator=cells.find(c=>c?.kind==='generator'&&c.chain===chain);
          const committed=work(needs.filter(n=>n.chain===chain));
          const supply=generator?(generator.charges||0)+Math.floor(((generator.draws||0)+(generator.charges||0))/4)*(generator.level===2?1:0):Infinity;
          candidates.push({chain,tier,merges:mergesNeeded(cells,chain,tier),charged:cost+committed<=mass+supply,weight:(ready?4:mass>=cost/2?2.5:1)*(tier===2?1.3:1)});
        }
      }
      const charged=candidates.filter(c=>c.charged);
      if(charged.length)candidates=charged;
      if(simple) {
        const close=candidates.filter(c=>c.merges<=2);
        if(close.length)candidates=close;
        // Distinct wishes are desirable, but never at the cost of the only
        // inventory-backed request or a chain that is resting.
        const distinct=candidates.filter(c=>!avoid?.some(n=>n.chain===c.chain&&n.tier===c.tier));
        if(distinct.length)candidates=distinct;
      }
      let roll=random()*candidates.reduce((sum,c)=>sum+c.weight,0);
      const chosen=candidates.find(c=>(roll-=c.weight)<=0)||candidates[0];
      if(chosen)needs.push({chain:chosen.chain,tier:chosen.tier,count:1});
    }
    return {id:sequence*2+slot,person:A.Boutique.customerPool(board)[(sequence+slot)%A.Boutique.customerPool(board).length],needs};
  }
  function valid(order) {
    return order && Number.isSafeInteger(order.id) && order.id>=0 && Number.isInteger(order.person) && order.person>=0 && order.person<6 && Array.isArray(order.needs) && order.needs.length>=1 && order.needs.length<=3 && order.needs.every(n=>n && CHAINS.includes(n.chain) && Number.isInteger(n.tier) && n.tier>=2 && n.tier<=5 && n.count===1);
  }
  function ensure(board) {
    board.orderSequence=Number.isSafeInteger(board.orderSequence)&&board.orderSequence>=0?Math.min(board.orderSequence,1e7):0;
    if(!Array.isArray(board.orders)||board.orders.length!==2||board.orders[0]?.id===board.orders[1]?.id||!board.orders.every(o=>valid(o)&&o.needs.every(n=>board.cells.some(c=>c?.kind==='generator'&&c.chain===n.chain)))) {
      const first=make(board.orderSequence,0,board);
      board.orders=[first,make(board.orderSequence,1,board,first.needs)];
    }
    return board.orders;
  }
  function availability(board,order) {
    const used=new Set();
    return order.needs.map(need=>{
      const found=[];
      for(let n=0;n<need.count;n++) {
        const index=board.cells.findIndex((c,i)=>!used.has(i)&&c?.kind==='item'&&c.chain===need.chain&&c.tier===need.tier);
        if(index<0)break;
        used.add(index);found.push(index);
      }
      return {ready:found.length===need.count,indices:found};
    });
  }
  function indices(board,order) {
    const found=availability(board,order);
    return found.every(n=>n.ready)?found.flatMap(n=>n.indices):null;
  }
  function reward(order,state) {
    const effort=work(order.needs);
    return {coins:Math.round((6+effort*3+(order.needs.length-1)*6)*(1+(state?A.Boutique.count(state):0)*.02)),stars:Math.min(3,Math.max(1,Math.ceil(effort/8))),xp:effort*2};
  }
  // Count actual pieces and the generator's saved expert-drop sequence. Higher
  // pieces cannot be split to satisfy a smaller request. This is read-only: an
  // expired cooldown is treated just like the next normal board tick.
  function supplied(board, needs, now, maxDraws=Infinity) {
    return [...new Set(needs.map(n=>n.chain))].every(chain=>{
      const counts=Array(8).fill(0),required=Array(8).fill(0);
      for(const cell of board.cells)if(cell?.kind==='item'&&cell.chain===chain)counts[cell.tier]++;
      for(const need of needs)if(need.chain===chain)required[need.tier]+=need.count;
      const source=board.cells.find(c=>c?.kind==='generator'&&c.chain===chain);
      if(source) {
        const charges=Math.min(maxDraws,source.charges||((source.readyAt||0)<=now?A.Merge.CHARGES:0));
        for(let draw=1;draw<=charges;draw++)counts[source.level===2&&((source.draws||0)+draw)%4===0?2:1]++;
      }
      for(let tier=1;tier<=7;tier++) {
        counts[tier]-=required[tier];
        if(counts[tier]<0)return false;
        if(tier<7)counts[tier+1]+=Math.floor(counts[tier]/2);
      }
      return true;
    });
  }
  // Relief is an explicit choice, never an automatic reroll. Preview and commit
  // use the same deterministic candidate; checking a card cannot mutate a save.
  function relief(board,order,now=Date.now()) {
    if(!valid(order)||!Array.isArray(board?.cells))return {available:false,reason:'invalid'};
    if(indices(board,order))return {available:false,reason:'ready'};
    if(supplied(board,order.needs,now))return {available:false,reason:'supplied'};
    const candidates=[];
    for(const chain of CHAINS) {
      if(!board.cells.some(c=>c?.kind==='generator'&&c.chain===chain))continue;
      for(let tier=2;tier<=3;tier++) {
        if(order.needs.length===1&&order.needs[0].chain===chain&&order.needs[0].tier===tier)continue;
        const need={chain,tier,count:1};
        // An easier request must not exchange a cooldown wait for an energy
        // wait. Its single chain can use at most the energy already available.
        const energy=Number.isFinite(board.energy)?Math.max(0,Math.floor(board.energy)):Infinity;
        if(supplied(board,[need],now,energy))candidates.push({need,merges:mergesNeeded(board.cells,chain,tier)});
      }
    }
    candidates.sort((a,b)=>(Math.min(a.merges,3)-Math.min(b.merges,3))||a.need.tier-b.need.tier||CHAINS.indexOf(a.need.chain)-CHAINS.indexOf(b.need.chain));
    if(!candidates.length)return {available:false,reason:'no-alternative'};
    return {available:true,reason:'cooldown',next:candidates[0].need};
  }
  function replace(state,id,now=Date.now()) {
    const board=state?.atelier,order=board?.orders?.find(o=>o.id===id);
    const choice=relief(board,order,now);
    if(!choice.available)return {ok:false,reason:choice.reason};
    // Keep customer/id/sequence: a free replacement never counts as a delivery,
    // grants a gift, consumes a piece or changes the earned-reward cadence.
    order.needs=[{...choice.next}];
    return {ok:true,nextId:order.id,needs:order.needs.map(n=>({...n}))};
  }
  function deliver(state,id,now=Date.now()) {
    const board=state.atelier,orders=ensure(board),slot=orders.findIndex(o=>o.id===id);
    if(slot<0)return {ok:false};
    const order=orders[slot],consumed=indices(board,order);
    if(!consumed)return {ok:false};
    const payout=reward(order,state);
    if((board.orderSequence+1)%5===0)payout.gems=1;
    for(const i of consumed)board.cells[i]=null;
    for(const [key,value] of Object.entries(payout))state[key]=(state[key]||0)+value;
    A.Boutique.sync(state,now);
    A.Boutique.recordDelivery(state,now);
    board.orderSequence++;
    const other=orders[1-slot],next=make(board.orderSequence,slot,board,other.needs);
    if(next.person===other.person){const pool=A.Boutique.customerPool(board);next.person=pool[(pool.indexOf(next.person)+1)%pool.length];}
    orders[slot]=next;
    return {ok:true,consumed,reward:payout,nextId:next.id};
  }
  A.MergeOrders={make,ensure,availability,indices,reward,relief,replace,deliver};
})(globalThis.SweetShoe=globalThis.SweetShoe||{});
