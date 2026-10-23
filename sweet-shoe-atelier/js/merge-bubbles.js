'use strict';
(function(A){
  const LIFE=60000;
  const price=offer=>offer.tier+1;
  function ensure(board,now=Date.now()) {
    const old=JSON.stringify(board.bubbles||[]);
    board.bubbles=Array.isArray(board.bubbles)?board.bubbles.filter(o=>o&&Number.isSafeInteger(o.id)&&o.id>0&&A.Merge.CHAINS.includes(o.chain)&&Number.isInteger(o.tier)&&o.tier>=2&&o.tier<=7&&Number.isFinite(o.expiresAt)&&o.expiresAt>now&&o.expiresAt<=now+LIFE).slice(0,1):[];
    return old!==JSON.stringify(board.bubbles);
  }
  function offer(board,result,now=Date.now()) {
    ensure(board,now);
    // Optional duplicates live outside the grid: a full board never loses a crafted piece.
    if(result.type!=='merge'||!result.ok||board.merges%9!==0||board.bubbles.length)return null;
    const bubble={id:board.merges,chain:result.item.chain,tier:result.item.tier,expiresAt:now+LIFE};
    board.bubbles.push(bubble);return bubble;
  }
  function dismiss(board,id){const index=(board.bubbles||[]).findIndex(o=>o.id===id);if(index<0)return false;board.bubbles.splice(index,1);return true;}
  function claim(state,id,now=Date.now()) {
    ensure(state.atelier,now);
    const bubble=state.atelier.bubbles.find(o=>o.id===id);
    if(!bubble)return {ok:false,reason:'bubbleExpired'};
    const to=state.atelier.cells.indexOf(null);
    if(to<0)return {ok:false,reason:'chestSpace'};
    if(state.gems<price(bubble))return {ok:false,reason:'bubbleGems'};
    state.gems-=price(bubble);dismiss(state.atelier,id);
    const item={kind:'item',chain:bubble.chain,tier:bubble.tier};state.atelier.cells[to]=item;
    const key=item.chain+item.tier,discovery=!state.atelier.discovered.includes(key);
    if(discovery)state.atelier.discovered.push(key);
    return {ok:true,type:'gift',to,item,discovery};
  }
  A.MergeBubbles={LIFE,price,ensure,offer,dismiss,claim};
})(globalThis.SweetShoe=globalThis.SweetShoe||{});
