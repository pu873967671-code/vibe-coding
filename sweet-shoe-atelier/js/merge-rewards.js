'use strict';
(function (A) {
  // Milestone rewards are deterministic and claimed atomically, including on full boards.
  const EVERY = 5, DROPS = 4;
  const earned = board => Math.floor((board.orderSequence || 0) / EVERY);
  function ensure(board) {
    board.chestsClaimed = Number.isSafeInteger(board.chestsClaimed) ? Math.max(0, Math.min(earned(board), board.chestsClaimed)) : 0;
  }
  function pending(board) { ensure(board); return earned(board) - board.chestsClaimed; }
  function claim(board) {
    if (!pending(board)) return {ok:false,reason:'invalid'};
    const to = board.cells.indexOf(null);
    if (to < 0) return {ok:false,reason:'chestSpace'};
    board.cells[to] = {kind:'chest',drops:DROPS,seed:board.chestsClaimed++};
    return {ok:true,type:'chest',to};
  }
  function open(board, index) {
    const chest = board.cells[index];
    if (chest?.kind !== 'chest') return {ok:false,reason:'invalid'};
    // The last gift replaces its chest, so opening it can never require a spare cell.
    const to = chest.drops === 1 ? index : A.Merge.adjacent(index).find(i => !board.cells[i]) ?? board.cells.indexOf(null);
    if (to < 0) return {ok:false,reason:'chestSpace'};
    const step = DROPS - chest.drops;
    const item = {kind:'item',chain:(chest.seed + Math.floor(step / 2)) % 2 ? 'lea' : 'fab',tier:1 + step % 2};
    chest.drops--;
    board.cells[to] = item;
    const id = item.chain + item.tier, discovery = !board.discovered.includes(id);
    if (discovery) board.discovered.push(id);
    return {ok:true,type:'gift',to,from:index,item,discovery,remaining:chest.drops};
  }
  function hint(board) {
    for (let i=0;i<board.cells.length;i++) for (let j=i+1;j<board.cells.length;j++) {
      if (A.Merge.canMerge(board.cells[i],board.cells[j])) return [i,j];
    }
    return [];
  }
  A.MergeRewards = {EVERY,DROPS,ensure,pending,claim,open,hint};
})(globalThis.SweetShoe = globalThis.SweetShoe || {});
