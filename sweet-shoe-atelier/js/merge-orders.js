'use strict';
(function (A) {
  const CHAINS = ['fab','lea','spk','rib'];
  const work = needs => needs.reduce((total,n)=>total + 2 ** (n.tier-1) * n.count,0);
  // Reproducible weighted selection makes saves stable and balancing simulations honest.
  function make(sequence, slot, board) {
    if(sequence===0)return {id:slot,person:slot,needs:slot===0?[{chain:'fab',tier:2,count:1}]:[{chain:'lea',tier:3,count:1},{chain:'fab',tier:2,count:1}]};
    let seed = ((sequence + 1) * 2654435761 + slot * 1013904223) >>> 0;
    const random = () => ((seed = (Math.imul(seed,1664525) + 1013904223) >>> 0) / 4294967296);
    const cells = board?.cells || [], discovered = board?.discovered || [];
    const count = slot === 0 ? 1 : sequence >= 6 && random() < .35 ? 3 : 2;
    const budget = slot === 0 ? 4 : Math.min(20,8 + Math.floor(sequence / 4) * 2);
    const needs = [];
    for (let i=0;i<count;i++) {
      const remaining = budget - work(needs) - (count-i-1)*2;
      const candidates = [];
      for (const chain of CHAINS.filter(c=>!board || cells.some(item=>item?.kind==='generator'&&item.chain===c))) {
        const known = Math.max(2,...discovered.filter(id=>id.startsWith(chain)).map(id=>+id.slice(-1)));
        const ceiling = slot === 0 ? 3 : Math.min(5,known+1,3+Math.floor(sequence/8));
        for(let tier=2;tier<=ceiling;tier++) {
          const cost=2**(tier-1);
          if(cost>remaining || needs.some(n=>n.chain===chain&&n.tier===tier))continue;
          const mass=cells.reduce((sum,c)=>sum+(c?.kind==='item'&&c.chain===chain&&c.tier<=tier?2**(c.tier-1):0),0);
          const ready=cells.some(c=>c?.kind==='item'&&c.chain===chain&&c.tier===tier);
          candidates.push({chain,tier,weight:(ready?4:mass>=cost/2?2.5:1)*(tier===2?1.3:1)});
        }
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
      board.orders=[make(board.orderSequence,0,board),make(board.orderSequence,1,board)];
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
    const next=make(board.orderSequence,slot,board),other=orders[1-slot];
    if(JSON.stringify(next.needs)===JSON.stringify(other.needs))next.needs[0].chain=next.needs[0].chain==='fab'?'lea':'fab';
    if(next.person===other.person){const pool=A.Boutique.customerPool(board);next.person=pool[(pool.indexOf(next.person)+1)%pool.length];}
    orders[slot]=next;
    return {ok:true,consumed,reward:payout,nextId:next.id};
  }
  A.MergeOrders={make,ensure,availability,indices,reward,deliver};
})(globalThis.SweetShoe=globalThis.SweetShoe||{});
