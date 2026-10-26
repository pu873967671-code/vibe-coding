'use strict';
(function (A) {
  // Pure board operations. All clocks are injectable so offline recovery is testable.
  const COLS = 7, ROWS = 9, SIZE = COLS * ROWS;
  const MAX_ENERGY = 100, REGEN_MS = 90000, CHARGES = 12, COOLDOWN_MS = 240000;
  const CHAINS = ['fab', 'lea', 'spk', 'rib'];
  const item = (chain, tier = 1) => ({kind: 'item', chain, tier});
  const generator = chain => ({kind: 'generator', chain, charges: CHARGES, readyAt: 0, level:1, draws:0});
  function adjacent(index) {
    const x = index % COLS, y = Math.floor(index / COLS), result = [];
    if (y > 0) result.push(index - COLS);
    if (x < COLS - 1) result.push(index + 1);
    if (y < ROWS - 1) result.push(index + COLS);
    if (x > 0) result.push(index - 1);
    return result;
  }
  function create(now = Date.now()) {
    const cells = Array.from({length: SIZE}, (_, i) => {
      const x = i % COLS, y = Math.floor(i / COLS);
      return x === 0 || x === 6 || y === 0 || y === 8 ? {kind: 'crate'} : null;
    });
    cells[16] = generator('fab'); cells[18] = generator('lea');
    for (const [i, chain, tier] of [[23,'fab',1],[24,'fab',1],[25,'lea',1],[30,'fab',2],[31,'fab',2],[32,'lea',1],[37,'lea',2],[38,'lea',2]]) cells[i] = item(chain, tier);
    return {cells, storage:null, energy: MAX_ENERGY, energyAt: now, merges: 0, discovered: ['fab1','lea1','fab2','lea2']};
  }
  function tick(board, now = Date.now()) {
    let changed = false;
    // A backwards system clock cannot create energy or stall recovery indefinitely.
    if (board.energyAt > now) board.energyAt = now;
    if (board.energy >= MAX_ENERGY) board.energyAt = now;
    else {
      const amount = Math.floor((now - board.energyAt) / REGEN_MS);
      if (amount > 0) {
        board.energy = Math.min(MAX_ENERGY, board.energy + amount);
        board.energyAt = board.energy === MAX_ENERGY ? now : board.energyAt + amount * REGEN_MS;
        changed = true;
      }
    }
    for (const cell of board.cells) if (cell?.kind === 'generator' && cell.charges === 0 && cell.readyAt <= now) {
      cell.charges = CHARGES; cell.readyAt = 0; changed = true;
    }
    return changed;
  }
  function sanitize(input, now = Date.now()) {
    if (!input || !Array.isArray(input.cells) || input.cells.length !== SIZE) return create(now);
    const fresh = create(now), seenGenerators = new Set();
    fresh.cells = input.cells.map(cell => {
      if (!cell || typeof cell !== 'object') return null;
      if (cell.kind === 'crate') return {kind:'crate'};
      if (cell.kind === 'chest' && Number.isInteger(cell.drops) && cell.drops >= 1 && cell.drops <= 4) return {kind:'chest',drops:cell.drops,seed:Number.isSafeInteger(cell.seed) && cell.seed >= 0 ? cell.seed : 0};
      if (!CHAINS.includes(cell.chain)) return null;
      if (cell.kind === 'item' && Number.isInteger(cell.tier) && cell.tier >= 1 && cell.tier <= 7) return item(cell.chain, cell.tier);
      if (cell.kind === 'generator' && CHAINS.includes(cell.chain) && !seenGenerators.has(cell.chain)) {
        seenGenerators.add(cell.chain);
        const charges = Number.isInteger(cell.charges) ? Math.max(0, Math.min(CHARGES, cell.charges)) : CHARGES;
        const readyAt = charges ? 0 : Number.isFinite(cell.readyAt) ? Math.min(now + COOLDOWN_MS, Math.max(0, cell.readyAt)) : now;
        return {kind:'generator',chain:cell.chain,charges,readyAt,level:cell.level===2?2:1,draws:Number.isInteger(cell.draws)?Math.max(0,cell.draws)%4:0};
      }
      return null;
    });
    for (const chain of ['fab','lea']) if (!seenGenerators.has(chain)) {
      let free = fresh.cells.indexOf(null);
      if (free < 0) free = fresh.cells.findIndex(c => c.kind === 'crate');
      if (free < 0) free = fresh.cells.findIndex(c => c.kind !== 'generator');
      if (free >= 0) fresh.cells[free] = generator(chain);
    }
    fresh.energy = Number.isFinite(input.energy) ? Math.max(0, Math.min(MAX_ENERGY, Math.floor(input.energy))) : MAX_ENERGY;
    fresh.energyAt = Number.isFinite(input.energyAt) ? Math.max(0, Math.min(now, input.energyAt)) : now;
    fresh.merges = Number.isFinite(input.merges) ? Math.max(0, Math.floor(input.merges)) : 0;
    fresh.discovered = Array.isArray(input.discovered) ? [...new Set(input.discovered.filter(x => /^(fab|lea|spk|rib)[1-7]$/.test(x)))] : fresh.discovered;
    // A piece already on the board is always part of the player's collection.
    for (const cell of fresh.cells) if (cell?.kind === 'item' && !fresh.discovered.includes(cell.chain + cell.tier)) fresh.discovered.push(cell.chain + cell.tier);
    tick(fresh, now);
    return fresh;
  }
  const validIndex = index => Number.isInteger(index) && index >= 0 && index < SIZE;
  function canMerge(a, b) {
    return a?.kind === 'item' && b?.kind === 'item' && a.chain === b.chain && a.tier === b.tier && a.tier < 7;
  }
  function move(board, from, to) {
    if (!validIndex(from) || !validIndex(to) || from === to) return {ok:false, reason:'invalid'};
    const source = board.cells[from], target = board.cells[to];
    if (!source || source.kind === 'crate') return {ok:false, reason:'invalid'};
    if (!target) {board.cells[to] = source; board.cells[from] = null; return {ok:true, type:'move', to};}
    if (!canMerge(source, target)) return {ok:false, reason:target.kind === 'crate' ? 'crate' : 'mismatch'};
    const next = item(source.chain, source.tier + 1), id = next.chain + next.tier;
    board.cells[from] = null; board.cells[to] = next; board.merges++;
    const opened = adjacent(to).filter(i => board.cells[i]?.kind === 'crate');
    for (const index of opened) board.cells[index] = null;
    const discovery = !board.discovered.includes(id);
    if (discovery) board.discovered.push(id);
    return {ok:true, type:'merge', to, opened, discovery, item:next};
  }
  function generate(board, index, now = Date.now()) {
    tick(board, now);
    const source = board.cells[index];
    if (!validIndex(index) || source?.kind !== 'generator') return {ok:false, reason:'invalid'};
    if (!source.charges) return {ok:false, reason:'cooldown'};
    if (!board.energy) return {ok:false, reason:'energy'};
    const target = adjacent(index).find(i => board.cells[i] === null);
    if (target === undefined) return {ok:false, reason:'space'};
    source.charges--; board.energy--;
    source.draws=((source.draws||0)+1)%4;
    const tier=source.level===2&&source.draws===0?2:1;
    board.cells[target] = item(source.chain,tier);
    const discovery=!board.discovered.includes(source.chain+tier);
    if(discovery)board.discovered.push(source.chain+tier);
    if (!source.charges) source.readyAt = now + COOLDOWN_MS;
    return {ok:true, type:'generate', to:target, from:index,item:board.cells[target],discovery};
  }
  // Organize only movable materials. Tools, crates and gifts keep their exact
  // cells; existing free capacity first gives each tool a place to produce.
  function sort(board, landscape = false) {
    const slots=[], pieces=[], old=board.cells.slice(), reserved=new Set();
    let spaces=0;
    old.forEach((cell,i)=>{if(!cell||cell.kind==='item'){slots.push(i);if(cell)pieces.push(cell);else spaces++;}});
    old.forEach((cell,i)=>{
      if(cell?.kind!=='generator'||reserved.size>=spaces)return;
      const nearby=adjacent(i).filter(j=>!old[j]||old[j].kind==='item');
      if(nearby.some(j=>reserved.has(j)))return;
      const free=nearby[0];
      if(free!==undefined)reserved.add(free);
    });
    const reading=i=>landscape?(COLS-1-i%COLS)*ROWS+Math.floor(i/COLS):i;
    slots.sort((a,b)=>reading(a)-reading(b));
    pieces.sort((a,b)=>CHAINS.indexOf(a.chain)-CHAINS.indexOf(b.chain)||a.tier-b.tier);
    let next=0;
    for(const i of slots)board.cells[i]=reserved.has(i)?null:pieces[next++]||null;
    return slots.filter(i=>board.cells[i]?.chain!==old[i]?.chain||board.cells[i]?.tier!==old[i]?.tier);
  }
  A.Merge = {COLS,ROWS,SIZE,MAX_ENERGY,REGEN_MS,CHARGES,COOLDOWN_MS,CHAINS,create,sanitize,tick,adjacent,canMerge,move,generate,sort};
})(globalThis.SweetShoe = globalThis.SweetShoe || {});
