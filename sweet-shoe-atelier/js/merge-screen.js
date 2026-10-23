'use strict';
(function (A) {
  const M = A.Merge, O = A.MergeOrders, R = A.MergeRewards, B = A.MergeBubbles, G = A.MergeGuide;
  const text = {
    en: {atelier:'Atelier',kicker:'THE WORKROOM',title:'Beautiful things begin here',subtitle:'A little thread. A world of possibilities.',guide:'Your first stitches',step1:'Tap a basket to gather materials.',step2:'Drag matching pieces together to craft something new.',step3:'Merge beside a crate to open more room.',cotton:'Sewing basket',leather:'Cobbler’s toolbox',energy:'Energy',full:'Fully recharged',next:'Next energy in',ready:'Ready to gather',charges:'charges',cooldown:'Restocking',empty:'Every masterpiece starts with a little rest.',emptyBody:'Energy returns every 90 seconds, even while you’re away.',space:'Make a little room beside the generator first.',mismatch:'Match two identical pieces to merge.',crate:'Merge beside this crate to open it.',max:'The finest in its collection',select:'Select a piece to explore',hint:'Tip: you can also tap a piece, then tap its match.',new:'Discovered',merges:'pieces crafted',room:'spaces waiting to be opened',tier:'Tier',move:'Move or merge',sold:'Material sold',sell:'Sell',workshop:'Chapter 1 · Little Workshop',materials:'Your materials',crateName:'Sealed supply crate',free:'Empty space',rest:'Ready in',orders:'Customer wishes',orderHint:'Craft a little happiness',deliver:'Deliver',gather:'Craft these pieces',delivered:'A lovely delivery!',collection:'Material collection',locked:'Undiscovered',tap:'Tap to gather',fab:'Textiles',lea:'Leatherwork',spk:'Jewels',rib:'Ribbons'},
    zh: {atelier:'工坊',kicker:'手作工坊',title:'美好，从一针一线开始',subtitle:'一缕细线，无限可能。',guide:'第一针，第一份灵感',step1:'点击工具篮，获取材料。',step2:'拖动两个相同材料，合成新的作品。',step3:'在木箱旁合成，开启更多空间。',cotton:'缝纫篮',leather:'制鞋工具箱',energy:'能量',full:'能量已充满',next:'下次恢复',ready:'点击获取材料',charges:'次',cooldown:'补充材料中',empty:'休息片刻，让灵感回归。',emptyBody:'每90秒恢复1点能量，离线时也会恢复。',space:'请先腾出工具篮旁的空位。',mismatch:'两个相同材料才能合成。',crate:'在木箱旁合成即可打开。',max:'已达最高等级',select:'选择材料，查看详情',hint:'也可以先点击材料，再点击相同材料合成。',new:'新发现',merges:'次合成',room:'个木箱等待开启',tier:'等级',move:'移动或合成',sold:'材料已出售',sell:'出售',workshop:'第一章 · 小小工坊',materials:'你的材料',crateName:'封存的材料箱',free:'空位',rest:'剩余',orders:'顾客心愿',orderHint:'用双手编织幸福',deliver:'交付',gather:'合成所需材料',delivered:'心愿已完成！',collection:'材料图鉴',locked:'尚未发现',tap:'点击获取',fab:'布艺',lea:'皮革',spk:'珠宝',rib:'丝带'}
  };
  const names = {
    en: {fab:['Cotton ball','Thread spool','Yarn skein','Folded fabric','Printed fabric','Satin bolt','Silk bolt'],lea:['Leather scrap','Leather strip','Insole','Outsole','Heel block','Wooden shoe last','Blush pump'],spk:['Glass bead','Seed pearls','Pearl strand','Crystal','Pink gem','Gem brooch','Jeweled tiara'],rib:['Ribbon scrap','Ribbon roll','Lace trim','Satin bow','Rosette','Corsage','Couture bow']},
    zh: {fab:['棉花球','线轴','毛线团','折叠布料','印花布卷','缎布','丝绸'],lea:['皮革碎片','皮革条','鞋垫','鞋底','鞋跟块','木鞋楦','裸粉高跟鞋'],spk:['玻璃珠','小珍珠','珍珠串','水晶','粉宝石','宝石胸针','宝石皇冠'],rib:['丝带碎片','丝带卷','蕾丝边','缎带蝴蝶结','玫瑰花结','胸花','华丽蝴蝶结']}
  };
  Object.assign(text.en,{chest:'Supply chest',gifts:'little gifts inside',chestHint:'Tap this chest to unpack a material. Four gifts, no energy needed.',chestSpace:'Make one free space to unpack your gift. Your rewards are safe.',giftReady:'A thank-you gift is ready!',giftProgress:'Deliver 5 wishes for a supply chest.',claimGift:'Collect your gift',nextGift:'Next thank-you gift',bookHint:'Every new material you craft becomes a page in your story.',bookOpen:'Explore the material book',bookLater:'A new craft awaits in a later chapter.',discovered:'discovered',back:'Back to the workroom',craftFrom:'Merge two of',gatherFrom:'Gather from',chestCollected:'A gift from your happy customers',idle:'These two pieces can become something lovely.'});
  Object.assign(text.zh,{chest:'材料宝箱',gifts:'份小礼物',chestHint:'点击宝箱，领取一份材料。内含四份礼物，无需能量。',chestSpace:'请腾出一个空位领取礼物。奖励会为你保留。',giftReady:'顾客的谢礼已备好！',giftProgress:'每完成5份心愿，获得一个材料宝箱。',claimGift:'领取谢礼',nextGift:'下一份谢礼',bookHint:'每一份新材料，都是你的手作故事的一页。',bookOpen:'打开材料图鉴',bookLater:'新的手艺将在之后的章节开启。',discovered:'已发现',back:'回到工坊',craftFrom:'合成两个',gatherFrom:'获取自',chestCollected:'来自顾客的一份心意',idle:'这两份材料可以合成新的美好。'});
  Object.assign(text.en,{bubble:'A little extra magic',bubbleHint:'An optional duplicate of your crafted material. Your original is already on the board.',bubbleExpired:'This bubble has floated away.',bubbleGems:'Earn gems by completing your introduction. More gem rewards arrive in later chapters.',bubbleDismiss:'Let it float away · free',bubbleBuy:'Keep this material',bubbleOpen:'A bonus bubble',guideName:'Madame Odette',guideSkip:'Skip guide',guideDone:'Your atelier awaits',guideFinish:'Our next little wish',guideReward:'Beautifully done! +5 gems. Materials you discover unlock new details in the studio.',guide0:'Welcome, darling. Tap the glowing sewing basket to gather a cotton ball.',guide1:'Tap the two glowing cotton balls, one after the other. You’ll craft a thread spool.',guide2:'Make room to grow: tap the glowing spool, then the empty space beside the sealed crate.',guide3:'Now tap the other glowing spool, then its match beside the crate. A merge opens the crate!',guide4:'Your first wish is ready! Tap the glowing Deliver button to send your thread to Rosie.',guide5:'Your first customer is delighted! One more wish will earn the stars for our first renovation.'});
  Object.assign(text.zh,{bubble:'一份额外的小魔法',bubbleHint:'可选的材料副本。你合成的原材料已经在棋盘上。',bubbleExpired:'气泡已经飘走了。',bubbleGems:'完成入门引导即可获得宝石，更多宝石奖励将在后续章节开放。',bubbleDismiss:'免费放走气泡',bubbleBuy:'留下这份材料',bubbleOpen:'惊喜气泡',guideName:'奥黛特夫人',guideSkip:'跳过引导',guideDone:'小小工坊，等你创造',guideFinish:'下一份小小心愿',guideReward:'做得漂亮！获得5颗宝石。发现材料，就能解锁工作室的新细节。',guide0:'欢迎，亲爱的。点击发光的缝纫篮，收集一团棉花。',guide1:'依次点击两团发光的棉花，就能合成一枚线轴。',guide2:'先腾出更多空间：点击发光的线轴，再点击封存木箱旁的空位。',guide3:'点击另一枚发光的线轴，再点击木箱旁的线轴。合成就能打开木箱！',guide4:'第一份心愿准备好了！点击发光的交付按钮，把线轴送给小桃。',guide5:'第一位顾客很开心！再完成一份心愿，就能用星星装修小店。'});
  Object.assign(text.en,{jewelry:'Jewelry box',ribbonDrawer:'Ribbon drawer'});
  Object.assign(text.zh,{jewelry:'珠宝盒',ribbonDrawer:'丝带抽屉'});
  const tr = k => text[A.lang][k] || k;
  const name = cell => !cell ? tr('free') : cell.kind === 'chest' ? tr('chest') : cell.kind === 'crate' ? tr('crateName') : cell.kind === 'generator' ? tr({fab:'cotton',lea:'leather',spk:'jewelry',rib:'ribbonDrawer'}[cell.chain]) : names[A.lang][cell.chain][cell.tier - 1];
  A.materialName=name;
  const artId = cell => cell.kind === 'chest' ? 'ui_chest' : cell.kind === 'crate' ? 'ui_crate' : cell.kind === 'generator' ? 'gen_' + cell.chain : 'm_' + cell.chain + cell.tier;
  function art(cell) {
    const id = artId(cell), real = A.ITEM_ASSETS.includes(id), bounds = A.ITEM_BOUNDS?.[id] || [1,0,0];
    // A local fallback remains visible if an optional image fails to load.
    const symbol = cell.kind === 'chest' ? '✧' : cell.kind === 'crate' ? '✦' : cell.kind === 'generator' ? (cell.chain === 'fab' ? '✂' : '⚒') : ({fab:['','☁','♧','❧','▱','▥','▰','✧'],lea:['','◒','⌁','◡','◡','▱','♜','♧'],spk:['','○','◌','♧','◇','◆','✧','♕'],rib:['','⌁','◎','≋','⋈','❋','✾','⋈']}[cell.chain][cell.tier]);
    return `<span class="merge-art ${cell.kind} ${cell.chain || ''} tier-${cell.tier || 0}"><span class="fallback-art" aria-hidden="true">${symbol}</span>${real ? `<img src="assets/items/${id}.webp" style="transform:scale(${bounds[0]}) translate(${bounds[1]*100}%,${bounds[2]*100}%)" alt="" draggable="false" onerror="this.remove()">` : ''}</span>`;
  }
  const clock = ms => {const sec=Math.max(0,Math.ceil(ms/1000));return Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0');};
  A.createMergeScreen = function (root, api) {
    let selected = -1, pointer = null, ghost = null, over = null, lastTick = 0, visible = false, lastInput = performance.now(), mentorHint = false;
    const board = () => api.state().atelier;
    function activity() {
      lastInput=performance.now();mentorHint=false;
      root.querySelectorAll('.idle-match').forEach(el=>el.classList.remove('idle-match'));
    }
    function controls() {
      const b = board(), now = Date.now();
      root.querySelectorAll('[data-bubble-clock]').forEach(el=>el.textContent=clock((b.bubbles[0]?.expiresAt||now)-now));
      const meter = document.getElementById('energyCount');
      if (meter) meter.textContent = b.energy + ' / 100';
      const regen = document.getElementById('energyRegen');
      if (regen) regen.textContent = b.energy === 100 ? tr('full') : tr('next')+' '+clock(M.REGEN_MS-(now-b.energyAt));
      root.querySelectorAll('[data-charge]').forEach(el => {
        const cell=b.cells[+el.dataset.charge];
        el.textContent=cell.charges ? cell.charges : clock(cell.readyAt-now);
        el.closest('button').classList.toggle('restocking',!cell.charges);
      });
    }
    const resource = id => `<img class="resource-icon" src="assets/${id==='energy'?'items/ui_energy':'icon_'+id}.webp" alt="" aria-hidden="true">`;
    function chainPreview(chain, tier) {
      return `<button class="chain-preview" data-book="${chain}" aria-label="${tr('bookOpen')}">${Array.from({length:7},(_,i)=>{
        const seen=board().discovered.includes(chain+(i+1));
        return `<span class="chain-piece ${seen?'':'locked'} ${tier===i+1?'current':''}" title="${seen?names[A.lang][chain][i]:tr('locked')} · ${tr('tier')} ${i+1}">${art({kind:'item',chain,tier:i+1})}<small>${i+1}</small>${seen?'':'<img class="chain-lock" src="assets/items/ui_lock.webp" alt="'+tr('locked')+'">'}</span>`;
      }).join('')}</button>`;
    }
    function openBook(chain='fab') {
      if(!M.CHAINS.includes(chain))chain='fab';
      const b=board(), count=b.discovered.filter(id=>id.startsWith(chain)).length;
      api.modal('atelier-book',`<div class="material-book"><button class="book-dismiss secondary" data-action="close" aria-label="${tr('back')}">×</button><span class="section-kicker">${tr('kicker')}</span><h2>${tr('collection')}</h2><p>${tr('bookHint')}</p><div class="book-tabs" role="group" aria-label="${tr('collection')}">${M.CHAINS.map(c=>`<button class="${chain===c?'primary':'secondary'}" aria-pressed="${chain===c}" data-book-chain="${c}">${tr(c)}</button>`).join('')}</div><div class="book-heading"><h3>${tr(chain)}</h3><span>${count} / 7 ${tr('discovered')}</span></div><div class="book-progress"><i style="width:${count/7*100}%"></i></div><div class="book-grid">${Array.from({length:7},(_,i)=>{
        const seen=b.discovered.includes(chain+(i+1));
        return `<article class="book-piece ${seen?'':'locked'}">${art({kind:'item',chain,tier:i+1})}<small>${tr('tier')} ${i+1}</small><h3>${seen?names[A.lang][chain][i]:tr('locked')}</h3><p>${seen?(i?tr('craftFrom')+' '+names[A.lang][chain][i-1]:tr('gatherFrom')+' '+tr(chain==='fab'?'cotton':chain==='lea'?'leather':chain)):tr('step2')}</p>${seen?'<span class="book-check" aria-hidden="true">✓</span>':'<img class="book-lock" src="assets/items/ui_lock.webp" alt="">'}</article>`;
      }).join('')}</div>${['spk','rib'].includes(chain)?'<p>'+tr('bookLater')+'</p>':''}<button class="secondary book-close" data-action="close">${tr('back')}</button></div>`);
    }
    function openBubble(id) {
      B.ensure(board());const offer=board().bubbles.find(o=>o.id===id);
      if(!offer){api.toast(tr('bubbleExpired'));return;}
      api.modal('bubble',`<div class="bubble-dialog"><span class="section-kicker">${tr('kicker')}</span><h2>${tr('bubble')}</h2><div class="bubble-orb">${art({kind:'item',chain:offer.chain,tier:offer.tier})}</div><h3>${names[A.lang][offer.chain][offer.tier-1]}</h3><p>${tr('bubbleHint')}</p><p>${tr('rest')} <strong data-offer-expiry="${offer.expiresAt}">${clock(offer.expiresAt-Date.now())}</strong></p><button class="primary" data-bubble-buy="${id}"><img class="resource-icon" src="assets/items/ui_gem.webp" alt="">${B.price(offer)} · ${tr('bubbleBuy')}</button><button class="secondary" data-bubble-dismiss="${id}">${tr('bubbleDismiss')}</button></div>`);
    }
    function orderCards() {
      return O.ensure(board()).map(order=>{
        const status=O.availability(board(),order),ready=status.every(n=>n.ready),payout=O.reward(order,api.state());
        const person=A.themes[order.person].asset;
        return `<article class="atelier-order ${ready?'ready':''}" data-order="${order.id}"><div class="order-customer"><img src="assets/${person}_neutral.webp" alt=""><span>${A.t('name'+order.person)}</span><span class="order-reward">${resource('coin')}${payout.coins} ${resource('star')}${payout.stars}</span></div><div class="order-request" data-needs="${order.needs.length}">${order.needs.map((n,i)=>`<span class="requested-item ${status[i].ready?'fulfilled':''}" aria-label="${names[A.lang][n.chain][n.tier-1]} · ${status[i].ready?'✓':tr('gather')}" title="${names[A.lang][n.chain][n.tier-1]} · ${tr('tier')} ${n.tier}">${art({kind:'item',chain:n.chain,tier:n.tier})}<span class="request-name">${names[A.lang][n.chain][n.tier-1]}</span><b class="request-check">${status[i].ready?'✓':n.tier}</b></span>`).join('')}</div><button class="order-deliver ${ready?'primary':'secondary'}" data-deliver="${order.id}" ${ready&&(!G.active(api.state())||(api.state().mergeGuide===4&&order.id===0))?'':'disabled'}>${ready?'✓ '+tr('deliver'):tr('gather')}</button></article>`;
      }).join('');
    }
    // The transaction commits before animation; flights are disposable presentation only.
    function deliveryFlight(consumed, cardRect, reward, order) {
      const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
      const center=r=>({x:r.x+r.width/2,y:r.y+r.height/2});
      const destination=center(cardRect), pieces=consumed.map(index=>{
        const cell=board().cells[index],rect=root.querySelector(`[data-cell="${index}"]`)?.getBoundingClientRect();
        return rect?{markup:art(cell),from:center(rect),size:Math.min(66,rect.width)}:null;
      }).filter(Boolean);
      function fly(markup,from,to,size,delay,kind) {
        if(reduced)return;
        const flight=document.createElement('span');flight.className='delivery-flight '+kind;flight.innerHTML=markup;flight.setAttribute('aria-hidden','true');
        Object.assign(flight.style,{left:from.x+'px',top:from.y+'px',width:size+'px',height:size+'px'});document.body.append(flight);
        const dx=to.x-from.x,dy=to.y-from.y;
        const animation=flight.animate([{transform:'translate(-50%,-50%) scale(1)',opacity:1},{transform:`translate(calc(-50% + ${dx*.45}px),calc(-50% + ${dy*.45-55}px)) scale(1.12)`,opacity:1,offset:.5},{transform:`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(.4)`,opacity:.3}],{duration:540,delay,easing:'cubic-bezier(.3,.05,.45,1)',fill:'both'});
        animation.finished.then(()=>flight.remove(),()=>flight.remove());
      }
      return nextId=>{
        const card=root.querySelector(`[data-order="${nextId}"]`);
        const person=A.themes[order.person].asset;
        const chapter=Math.min(2,A.Boutique.chapter(api.state()));
        const lines=A.lang==='zh'?['正是我想要的！','你的手艺让小店闪闪发光！','为晚会增添一份美好！']:['Just what I wished for!','You make our street sparkle!','A little magic for the gala!'];
        if(card){
          const reaction=document.createElement('div');reaction.className='order-reaction';reaction.setAttribute('role','status');
          reaction.innerHTML=`<img class="reaction-portrait" src="assets/${person}_happy.webp" alt=""><div><strong>${A.t('name'+order.person)}</strong><p>“${lines[chapter]}”</p><span>${resource('coin')} +${reward.coins} ${resource('star')} +${reward.stars}</span></div><b aria-hidden="true">✓</b>`;
          const button=card.querySelector('[data-deliver]'),disabled=button.disabled;
          button.disabled=true;card.classList.add('receiving');card.append(reaction);
          setTimeout(()=>{reaction.remove();card.classList.remove('receiving');button.disabled=disabled;},reduced?1400:1900);
        }
        mentorPose('cheer',lines[chapter]);api.sound('delivery');
        pieces.forEach((piece,i)=>fly(piece.markup,piece.from,destination,piece.size,i*75,'material-flight'));
        const delay=reduced?0:560+(pieces.length-1)*75;
        setTimeout(()=>{
          if(!visible||!api.active()||!card?.isConnected)return;
          card?.classList.add('delivery-celebrate');
          const coins=document.getElementById('coins').getBoundingClientRect(),stars=document.getElementById('atelierStars').getBoundingClientRect();
          for(let i=0;i<5;i++)fly(resource('coin'),destination,center(coins),28,i*55,'reward-flight');
          for(let i=0;i<Math.min(3,reward.stars);i++)fly(resource('star'),destination,center(stars),28,90+i*75,'reward-flight');
          setTimeout(()=>{if(visible&&api.active()&&card?.isConnected)api.sound('coin');},reduced?0:540);
          if(!reduced)for(const id of ['coins','atelierStars'])document.getElementById(id).animate([{transform:'scale(1)'},{transform:'scale(1.25)'},{transform:'scale(1)'}],{duration:350,delay:540});
        },delay);
      };
    }
    function detail() {
      const cell=board().cells[selected], box=root.querySelector('#mergeDetail');
      if(!box)return;
      if(G.active(api.state())) {
        const step=api.state().mergeGuide;
        box.innerHTML=`<div class="odette-guide" data-guide-step="${step}"><img src="assets/mentor_neutral.webp" alt="${tr('guideName')}"><div><span class="section-kicker">${tr('guideName')} · ${Math.min(5,step+1)} / 5</span><h3>${tr(step===5?'guideDone':'guide')}</h3><p>${tr('guide'+step)}</p>${step===5?`<p>${tr('guideReward')}</p><button class="primary" data-guide-finish>${tr('guideFinish')}</button>`:''}</div><button class="secondary guide-skip" data-guide-skip>${tr('guideSkip')}</button></div>`;
        return;
      }
      if(cell?.kind==='chest') {
        box.innerHTML=`<div class="detail-heading">${art(cell)}<div><span class="section-kicker">${tr('materials')}</span><h3>${tr('chest')}</h3><p>${cell.drops} ${tr('gifts')}</p></div><button class="primary" data-open-chest="${selected}">${tr('claimGift')}</button></div><p class="detail-tip">${tr('chestHint')}</p>`;
        return;
      }
      const preview=cell?.kind==='item'||cell?.kind==='generator'?cell:{kind:'item',chain:'fab',tier:1};
      box.innerHTML=`<div class="detail-heading">${art(preview)}<div><span class="section-kicker">${tr(cell?.chain||'materials')}</span><h3>${cell?name(cell):tr('select')}</h3><p>${cell?.kind==='item'?tr('tier')+' '+cell.tier+' / 7':cell?.kind==='crate'?tr('crate'):cell?.kind==='generator'?tr('ready')+' · 1 '+resource('energy')+(cell.level===2?' · '+A.Boutique.tr('expertLabel'):''):tr('hint')}</p></div>${cell?.kind==='item'?`<button class="secondary merge-sell" data-merge-sell>${tr('sell')} ${resource('coin')}${cell.tier}</button>`:''}</div>${chainPreview(preview.chain,cell?.tier)}<p class="detail-tip">${cell?.kind==='item'?(cell.tier===7?tr('max'):tr('step2')):tr('step3')}</p>`;
    }
    function render() {
      A.Boutique.sync(api.state());
      const b=board();
      root.innerHTML=`<aside class="merge-intro"><div class="merge-intro-copy"><span class="eyebrow">${A.lang==='zh'?'第 '+Math.min(3,A.Boutique.chapter(api.state())+1)+' 章':'Chapter '+Math.min(3,A.Boutique.chapter(api.state())+1)} · ${A.Boutique.tr('chapter')[A.Boutique.chapter(api.state())]}</span><h2>${tr('orders')}</h2><p>${tr('orderHint')}</p><div class="atelier-tools"><button class="secondary book-tool" data-book="fab" aria-label="${tr('bookOpen')}"><img src="assets/icon_material.webp" alt=""><span>${tr('collection')}<small>${b.discovered.length} / 28</small></span></button><button class="secondary chest-tool ${R.pending(b)?'gift-ready':''}" data-claim-chest ${R.pending(b)?'':'disabled'} aria-label="${tr(R.pending(b)?'claimGift':'giftProgress')}" title="${tr('giftProgress')}"><img src="assets/items/ui_chest.webp" alt=""><span>${tr(R.pending(b)?'claimGift':'nextGift')}<small>${R.pending(b)?'× '+R.pending(b):(b.orderSequence||0)%R.EVERY+' / '+R.EVERY}</small></span><i style="width:${R.pending(b)?100:((b.orderSequence||0)%R.EVERY)/R.EVERY*100}%"></i></button></div></div><div class="atelier-orders">${orderCards()}</div></aside><div class="merge-board-wrap"><div class="board-rim"><div class="merge-board" role="group" aria-label="${tr('atelier')}">${b.cells.map((cell,i)=>`<button class="merge-cell ${cell?.kind||'empty'} ${selected===i?'selected':''} ${cell?.kind==='generator'&&b.energy===100&&b.merges===0?'inviting':''} ${cell?.kind==='crate'&&M.adjacent(i).some(n=>b.cells[n]?.kind==='item')?'openable':''}" data-chain="${cell?.chain||''}" style="--land-col:${Math.floor(i/7)+1};--land-row:${7-i%7}" data-cell="${i}" aria-label="${name(cell)}${cell?.tier?', '+tr('tier')+' '+cell.tier:''}" aria-pressed="${selected===i}">${cell?art(cell):''}${cell?.kind==='chest'?`<span class="chest-drops">${cell.drops}</span>`:cell?.kind==='item'?`<span class="item-tier">${cell.tier}</span>`:cell?.kind==='generator'?`${cell.level===2?'<span class="generator-level" aria-label="'+A.Boutique.tr('upgraded')+'">Ⅱ</span>':''}<span class="generator-bolt">${resource('energy')}</span><span class="generator-charge" data-charge="${i}"></span>`:''}</button>`).join('')}</div></div><p class="board-caption"><span>${b.merges} ${tr('merges')}</span><i>·</i><span>${b.cells.filter(c=>c?.kind==='crate').length} ${tr('room')}</span></p></div><div class="mentor-area"><aside class="merge-detail panel" id="mergeDetail" aria-live="polite"></aside><div class="atelier-mentor" aria-hidden="true"><img src="assets/mentor/mentor_${G.active(api.state())?(api.state().mergeGuide===0?'wave':'point'):'think'}.webp" alt=""></div><button class="mentor-bubble secondary" data-mentor-talk hidden>${G.active(api.state())?tr('guide'+Math.min(5,api.state().mergeGuide)):tr('idle')}</button></div>`;
      controls();detail();
      const guide=api.state().mergeGuide;
      if(guide<4){const cells=G.plans[guide].cells,i=cells[selected===cells[0]&&cells.length>1?1:0];root.querySelector(`[data-cell="${i}"]`)?.classList.add('guide-target');}
      if(guide===4)root.querySelector('[data-deliver="0"]')?.classList.add('guide-target');
      api.journey();
      if(B.ensure(b))api.save();
      const bubble=b.bubbles[0];
      if(bubble&&guide>=6)root.querySelector('.chest-tool').outerHTML=`<button class="bubble-offer chest-tool secondary" data-bubble="${bubble.id}" aria-label="${tr('bubbleOpen')}">${art({kind:'item',chain:bubble.chain,tier:bubble.tier})}<span>${tr('bubbleOpen')}<small data-bubble-clock>${clock(bubble.expiresAt-Date.now())}</small></span></button>`;
    }
    function mentorPose(pose,message){const bubble=root.querySelector('[data-mentor-talk]');if(bubble&&message){bubble.textContent=message;bubble.hidden=false;setTimeout(()=>{if(bubble.isConnected)bubble.hidden=true;},5000);}const host=root.querySelector('.atelier-mentor'),im=host?.querySelector('img');if(!im)return;const next=new Image();next.src='assets/mentor/mentor_'+pose+'.webp';next.alt='';next.onload=()=>{im.classList.add('leaving');host.append(next);setTimeout(()=>im.remove(),360);};}
    function discovery(item) {mentorPose('surprise',tr('new')+' · '+name(item));
      root.querySelector('.discovery-banner')?.remove();
      const banner=document.createElement('div'),c=A.Introduction.copy();
      banner.className='discovery-banner';banner.setAttribute('role','status');
      const unlocks=Object.entries(A.CRAFT_UNLOCKS).filter(([,id])=>id===item.chain+item.tier);
      if(unlocks.length&&api.moment?.(tr('new')+' · '+name(item),c.unlocked+' · '+unlocks.map(([id])=>A.t(id.split(':')[1])).join(' · ')))return;
      if(G.active(api.state()))return;
      banner.innerHTML=art(item)+`<div><span class="section-kicker">${c.new}</span><strong>${name(item)}</strong>${unlocks.length?`<small>${c.unlocked} · ${unlocks.map(([id])=>A.t(id.split(':')[1])).join(' · ')}</small>`:`<small>${tr('tier')} ${item.tier} / 7 · ${tr(item.chain)}</small>`}</div>`;
      root.querySelector('.merge-board-wrap')?.append(banner);setTimeout(()=>banner.remove(),3400);
    }
    function commit(result) {
      if (!result.ok) {api.toast(tr(result.reason==='chestSpace'?'chestSpace':result.reason==='space'?'space':result.reason==='energy'?'emptyBody':result.reason==='crate'?'crate':result.reason==='cooldown'?'cooldown':'mismatch'));api.sound('whoosh');return false;}
      const guided=G.advance(api.state(),result);
      if(result.type==='merge'&&!G.active(api.state()))B.offer(board(),result);
      selected=guided?-1:result.to; api.save();api.header();render();
      const target=root.querySelector(`[data-cell="${result.to}"]`);
      if(result.type==='generate')root.querySelector(`[data-cell="${result.from}"]`)?.classList.add('generator-tapped');
      target?.classList.add(result.type==='merge'?'just-merged':'just-spawned');
      if(result.type==='merge'||result.type==='gift') {
        api.sound(result.discovery?'discovery':'merge',result.item.tier);
        const r=target.getBoundingClientRect();api.particles(r.x+r.width/2,r.y+r.height/2);
        if(result.discovery)discovery(result.item);
        if(result.opened?.length)setTimeout(()=>{if(visible&&api.active())api.sound('crate');},120);
        for(const index of result.opened||[])root.querySelector(`[data-cell="${index}"]`)?.classList.add('just-opened');
      } else {api.sound(result.discovery?'discovery':'pop');if(result.discovery)discovery(result.item);}
      if(result.type==='chest')mentorPose('present',tr('chestCollected'));
      if(result.type==='chest')api.toast(tr('chestCollected'));
      return true;
    }
    function activate(index) {
      if(!G.allows(api.state(),index))return;
      const guide=G.plans[api.state().mergeGuide];
      if(guide?.to===index&&selected!==guide.cells[0])return;
      const b=board(), cell=b.cells[index];
      if(selected>=0 && selected!==index && b.cells[selected] && b.cells[selected].kind!=='crate' && (!cell || M.canMerge(b.cells[selected],cell))) {commit(M.move(b,selected,index));return;}
      selected=index;
      if(cell?.kind==='generator')commit(M.generate(b,index));
      else if(cell?.kind==='chest') {
        const result=R.open(b,index);commit(result);
        if(result.ok&&b.cells[index]?.kind==='chest'){selected=index;render();root.querySelector(`[data-cell="${result.to}"]`)?.classList.add('just-spawned');}
      }
      else {render(); if(cell?.kind==='crate')api.toast(tr('crate'));}
    }
    function clearDrag() {
      ghost?.remove();ghost=null;
      root.querySelectorAll('.drag-source,.merge-target,.drop-target').forEach(el=>el.classList.remove('drag-source','merge-target','drop-target'));
      over=null;pointer=null;
    }
    root.addEventListener('pointerdown',e=>{
      activity();
      const button=e.target.closest('[data-cell]');
      if(!button || e.button!==0 || !api.active())return;
      const index=+button.dataset.cell,cell=board().cells[index];
      if(!G.allows(api.state(),index)||(G.active(api.state())&&G.plans[api.state().mergeGuide].cells[0]!==index))return;
      if(!cell || cell.kind==='crate')return;
      pointer={id:e.pointerId,index,x:e.clientX,y:e.clientY,dragging:false,button};
      button.setPointerCapture(e.pointerId);
    });
    root.addEventListener('pointermove',e=>{
      if(!pointer||pointer.id!==e.pointerId)return;
      if(!pointer.dragging && Math.hypot(e.clientX-pointer.x,e.clientY-pointer.y)>7) {
        pointer.dragging=true;pointer.button.classList.add('drag-source');
        ghost=document.createElement('div');ghost.className='merge-drag-ghost';ghost.innerHTML=art(board().cells[pointer.index]);
        const r=pointer.button.getBoundingClientRect();ghost.style.width=r.width+'px';ghost.style.height=r.height+'px';document.body.append(ghost);
      }
      if(!pointer.dragging)return;
      e.preventDefault();ghost.style.left=e.clientX+'px';ghost.style.top=e.clientY+'px';
      const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-cell]');
      if(over!==target) {over?.classList.remove('merge-target','drop-target');over=target;if(over&&+over.dataset.cell!==pointer.index){const cell=board().cells[+over.dataset.cell];if(M.canMerge(board().cells[pointer.index],cell))over.classList.add('merge-target');else if(!cell)over.classList.add('drop-target');}}
    });
    let suppressClick=false;
    root.addEventListener('pointerup',e=>{
      if(!pointer||pointer.id!==e.pointerId)return;
      const drag=pointer;
      if(drag.dragging) {
        suppressClick=true;
        const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-cell]');
        clearDrag();
        if(target && G.allows(api.state(),+target.dataset.cell) && +target.dataset.cell!==drag.index) {const result=M.move(board(),drag.index,+target.dataset.cell);if(!commit(result))drag.button.animate?.([{transform:'translateX(-4px)'},{transform:'translateX(4px)'},{transform:'none'}],{duration:180});}
        setTimeout(()=>{suppressClick=false;},0);
      } else clearDrag();
    });
    root.addEventListener('pointercancel',clearDrag);
    root.addEventListener('lostpointercapture',()=>{if(pointer)clearDrag();});
    root.addEventListener('click',e=>{
      if(suppressClick||!api.active())return;
      activity();
      if(e.target.closest('[data-mentor-talk]')){e.target.closest('[data-mentor-talk]').hidden=true;return;}
      if(e.target.closest('[data-guide-skip]')){api.state().mergeGuide=6;A.Introduction.skip(api.state());api.save();api.header();render();return;}
      if(e.target.closest('[data-guide-finish]')){api.state().mergeGuide=6;A.Introduction.begin(api.state());api.save();api.header();render();return;}
      const bubbleButton=e.target.closest('[data-bubble]');if(bubbleButton){openBubble(+bubbleButton.dataset.bubble);return;}
      const bookButton=e.target.closest('[data-book]');
      if(bookButton){openBook(bookButton.dataset.book);return;}
      if(e.target.closest('[data-claim-chest]')){commit(R.claim(board()));return;}
      const openChest=e.target.closest('[data-open-chest]');
      if(openChest){activate(+openChest.dataset.openChest);return;}
      const delivery=e.target.closest('[data-deliver]');
      if(delivery) {
        const order=O.ensure(board()).find(o=>o.id===+delivery.dataset.deliver),consumed=order&&O.indices(board(),order);
        if(!consumed)return;
        const rect=delivery.closest('[data-order]').getBoundingClientRect(),flight=deliveryFlight(consumed,rect,O.reward(order,api.state()),order);
        const result=O.deliver(api.state(),order.id);
        if(result.ok){G.advance(api.state(),{ok:true,type:'delivery'});A.Introduction.sync(api.state());selected=-1;api.save();api.header();render();flight(result.nextId);api.toast((R.pending(board())?tr('giftReady'):tr('delivered'))+' +'+result.reward.coins+' · +'+result.reward.stars+' ★');}
        return;
      }
      if(e.target.closest('[data-merge-sell]')) {
        const cell=board().cells[selected];if(cell?.kind!=='item')return;
        api.state().coins+=cell.tier;board().cells[selected]=null;selected=-1;api.save();api.header();api.sound('coin');render();return;
      }
      const cell=e.target.closest('[data-cell]');if(cell)activate(+cell.dataset.cell);
    });
    root.addEventListener('keydown',e=>{
      activity();
      const cell=e.target.closest('[data-cell]');if(!cell)return;
      const landscape=matchMedia('(orientation: landscape)').matches;
      const step=(landscape?{ArrowLeft:-7,ArrowRight:7,ArrowUp:1,ArrowDown:-1}:{ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7})[e.key];
      if(step){e.preventDefault();root.querySelector(`[data-cell="${Math.max(0,Math.min(62,+cell.dataset.cell+step))}"]`)?.focus();}
      if(e.key==='Escape'){selected=-1;render();}
    });
    return {
      show(value){visible=value;clearDrag();activity();root.hidden=!value;if(value){M.tick(board());render();}},
      render,openBook,openBubble,
      bubbleAction(id,kind){
        if(kind==='dismiss'){B.dismiss(board(),id);api.save();api.close();render();return;}
        const result=B.claim(api.state(),id);api.close();
        if(result.ok){commit(result);api.header();}else{api.save();render();api.toast(tr(result.reason));}
      },
      tick(now){
        if(now-lastTick<1000)return;lastTick=now;
        document.querySelectorAll('[data-offer-expiry]').forEach(el=>{const remaining=+el.dataset.offerExpiry-Date.now();el.textContent=remaining>0?clock(remaining):tr('bubbleExpired');const buy=el.closest('.modal').querySelector('[data-bubble-buy]');if(buy)buy.disabled=remaining<=0;});
        const changed=M.tick(board())|B.ensure(board());if(changed){api.save();if(visible&&api.active()&&!pointer)render();else controls();}else controls();
        if(!visible||!api.active()||document.hidden||pointer){lastInput=now;return;}
        if(now-lastInput>=5000&&!mentorHint){mentorHint=true;mentorPose('think',tr('idle'));}
        if(now-lastInput>=5000)for(const i of R.hint(board()))root.querySelector(`[data-cell="${i}"]`)?.classList.add('idle-match');
      }
    };
  };
})(globalThis.SweetShoe = globalThis.SweetShoe || {});
