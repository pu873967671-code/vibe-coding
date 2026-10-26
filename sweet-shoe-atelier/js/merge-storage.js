'use strict';
(function(A){
  // One free holding space. Moving a piece never spends, merges or rewards it.
  function sanitize(value){
    return value?.kind==='item'&&A.Merge.CHAINS.includes(value.chain)&&Number.isInteger(value.tier)&&value.tier>=1&&value.tier<=7
      ? {kind:'item',chain:value.chain,tier:value.tier}:null;
  }
  function ensure(board){board.storage=sanitize(board.storage);return board.storage;}
  function store(board,index){
    if(ensure(board))return {ok:false,reason:'occupied'};
    const piece=board.cells[index];
    if(!Number.isInteger(index)||piece?.kind!=='item')return {ok:false,reason:'select'};
    board.storage=piece;board.cells[index]=null;
    return {ok:true,type:'store',from:index,item:piece};
  }
  function take(board,index){
    const piece=ensure(board);
    if(!piece)return {ok:false,reason:'empty'};
    const to=Number.isInteger(index)&&index>=0&&index<board.cells.length&&board.cells[index]===null?index:board.cells.indexOf(null);
    if(to<0)return {ok:false,reason:'space'};
    board.cells[to]=piece;board.storage=null;
    return {ok:true,type:'retrieve',to,item:piece};
  }
  A.MergeStorage={sanitize,ensure,store,take};
})(globalThis.SweetShoe=globalThis.SweetShoe||{});
