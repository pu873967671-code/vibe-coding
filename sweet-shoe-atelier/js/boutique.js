'use strict';
(function(A){
  const SLOTS=['rug','counter','shelf','sofa','mirror','flowers','chandelier','window'];
  const ORDER=['rug','counter','shelf','sofa','mirror','flowers','chandelier','window','rug','counter','shelf','sofa','mirror','flowers','chandelier','window'];
  const COSTS=[2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,8];
  const copy={
    en:{title:'A little more lovely',kicker:'YOUR BOUTIQUE',intro:'One thoughtful detail at a time.',chapter:['Little Workshop','Sparkle Street','Ribbon Gala','The atelier is yours'],names:['Salon rug','Welcome counter','Display shelf','Velvet sofa','Gilded mirror','Fresh flowers','Chandelier','Window display'],task:['A soft first step','A warm welcome','A place for your creations','Stay a little longer','Reflect your finest work','Bring the garden inside','Let the salon sparkle','A glimpse of something lovely','A silk-soft entrance','The signature counter','A couture collection','The velvet lounge','A golden reflection','Flowers for the gala','An evening in lights','Your grand unveiling'],renovate:'Renovate',upgrade:'Deluxe',level:'Level',charm:'Order coin bonus',stars:'stars',earn:'Earn stars in Atelier',back:'Back',next:'NEXT CHAPTER TASK',complete:'Boutique complete',endless:'All sixteen details are yours. Keep crafting wishes and creating beautiful pairs.',pending:'Your new generator is waiting for an empty board space.',sparkle:'Unlock the jewelry box & jewel chain',ribbon:'Unlock the ribbon drawer & ribbon chain',finish:'Complete the boutique · Endless wishes',done:'A lovely new detail!',chapterDone:'A new chapter begins',continue:'Continue',preview:'Before / after',before:'Before',after:'After',locked:'Complete earlier tasks',owned:'Complete',need:'Complete customer wishes to earn renovation stars.'},
    zh:{title:'让美好，慢慢发生',kicker:'你的精品店',intro:'用每一处用心，迎接下一份心动。',chapter:['小小工坊','闪耀街区','丝带盛典','属于你的精品店'],names:['迎宾地毯','接待柜台','作品陈列架','天鹅绒沙发','鎏金试衣镜','鲜花摆设','水晶吊灯','橱窗陈列'],task:['温柔的第一步','一份温暖的欢迎','让作品闪闪发光','请多坐一会儿','映见你的匠心','把花园带进店里','点亮试穿沙龙','橱窗里的小心动','丝绸般的迎宾路','独一无二的柜台','高级定制陈列','天鹅绒会客厅','金色的倒影','盛典的花香','华灯初上','你的精品店，焕然一新'],renovate:'翻新',upgrade:'精品升级',level:'等级',charm:'心愿金币加成',stars:'星星',earn:'前往工坊赚星星',back:'返回',next:'下一项章节任务',complete:'精品店已焕新',endless:'十六处细节，都是你的心意。继续完成心愿，设计更多美丽作品。',pending:'新工具篮正在等待棋盘空位，腾出空间后即可领取。',sparkle:'解锁珠宝盒与珠宝材料链',ribbon:'解锁丝带抽屉与丝带材料链',finish:'完成精品店 · 开启无限心愿',done:'又一处令人心动的细节！',chapterDone:'新的篇章开始了',continue:'继续',preview:'翻新前后对比',before:'翻新前',after:'翻新后',locked:'请先完成前面的任务',owned:'已完成',need:'完成顾客心愿，获得用于翻新的星星。'}
  };
  Object.assign(copy.en,{expertLabel:'Expert · 25% tier 2',journal:'Our atelier story',odette:'Madame Odette',inspiration:'A little inspiration · +16 energy',upgraded:'Expert tools · every fourth gather gives a tier-2 piece',newFaces:'New customers',daily:'Today’s neighborhood wishes',dailyHint:'Deliver five wishes in the workroom. A fresh page opens each day at 00:00 UTC.',claim:'Collect your thank-you',claimed:'Today’s gift collected',dailyReward:'+20 energy · +50 coins · +1 gem',renovationStars:'Renovation stars',story:[
    'Your grandmother always left the door open. Let’s give her atelier a warm first step.',
    'Célia remembers this counter. She used to bring flowers every Friday.',
    'Rosie has saved a space for your first collection in the neighborhood paper.',
    'Mia stayed all afternoon. A little sofa makes this a place to belong.',
    'Lily’s wedding is in spring. She wants to see herself in something made here.',
    'June brought cuttings from her garden. Every neighbor has a part in this shop.',
    'Your grandmother kept this chandelier wrapped away for a special evening.',
    'Poppy stopped in the street. “Is that your work in the window?”',
    'The first rug welcomed a few friends. This one will welcome the whole street.',
    'Célia left a note: “I knew you would make this place your own.”',
    'There are enough creations for a collection now. Shall we plan a little gala?',
    'Mia is bringing her friends. We may need every seat tonight.',
    'Lily chose her wedding pair. She says the mirror makes her feel brave.',
    'June has filled the shop with flowers. The invitations are on their way.',
    'The lights are ready. Your grandmother would have loved this evening.',
    'Poppy opens the door to the whole neighborhood. This is your atelier now.'
  ],chapterStory:[
    'A few stitches, a few friends. Let’s bring your grandmother’s atelier back to life.',
    'Lily heard about your work from Célia. She and June are bringing a little sparkle to the street.',
    'Poppy is planning a neighborhood gala. With ribbons, flowers and your own collection, we can welcome everyone.',
    'The gala is over, but the door stays open. There will always be another wish to make.'
  ]});
  Object.assign(copy.zh,{expertLabel:'熟练工具 · 25%二级材料',journal:'小铺故事',odette:'奥黛特夫人',inspiration:'一份新灵感 · +16能量',upgraded:'熟练工具 · 每获取四次，必得一份二级材料',newFaces:'新顾客',daily:'今日街坊心愿',dailyHint:'在工坊完成五份心愿。每日零点（UTC）开启新的一页。',claim:'领取街坊谢礼',claimed:'今日谢礼已领取',dailyReward:'+20能量 · +50金币 · +1宝石',renovationStars:'翻新星星',story:[
    '你的祖母总是敞开店门。先为她的小铺，铺好迎宾的第一步。',
    '绵绵还记得这个柜台。过去每个周五，她都会送来一束花。',
    '小桃为你的第一组作品，在街坊小报上留好了位置。',
    '可可坐了一下午。小小沙发，让这里有了家的感觉。',
    '小梨的婚礼在春天。她想穿着这里做的鞋，看见自己的模样。',
    '安安带来了自家花园的花。每位街坊，都为小铺添了一份心意。',
    '祖母一直珍藏着这盏吊灯，等一个特别的夜晚。',
    '糖糖在橱窗前停下脚步：“这都是你的作品吗？”',
    '第一张地毯迎接朋友。这一次，我们要迎接整条街。',
    '绵绵留下一张纸条：“我就知道，你会让这里拥有自己的模样。”',
    '作品已经足够办一场展览了。我们来筹备小小盛典吧。',
    '可可要带朋友来。今晚，每一个座位都会有人。',
    '小梨选好了婚鞋。她说，镜子里的自己，变得更勇敢了。',
    '安安用鲜花装点整间店。邀请函已经寄出。',
    '灯光准备好了。祖母一定也会喜欢这个夜晚。',
    '糖糖推开店门，迎来整条街的朋友。这一次，是属于你的小铺。'
  ],chapterStory:[
    '从一针一线、几位朋友开始，让祖母的小铺重新充满心意。',
    '小梨从绵绵那里听说了你的手艺。她和安安，要为街区带来新的闪耀。',
    '糖糖正在筹备街坊盛典。用丝带、鲜花和你的作品，迎接每一位朋友。',
    '盛典落幕，店门依然敞开。总有下一份心愿，等你用心完成。'
  ]});
  const tr=k=>copy[A.lang||'en'][k];
  const count=s=>Number.isInteger(s.boutique?.completed)?Math.max(0,Math.min(16,s.boutique.completed)):0;
  const chapter=s=>count(s)<4?0:count(s)<10?1:count(s)<16?2:3;
  function levels(s){const result=Object.fromEntries(SLOTS.map(k=>[k,0]));for(const id of ORDER.slice(0,count(s)))result[id]++;return result;}
  function task(s){const i=count(s);return i<16?{id:i,slot:ORDER[i],level:i<8?1:2,cost:COSTS[i]}:null;}
  function sync(s,now=Date.now()){
    s.boutique=count(s)===16?{...s.boutique,completed:count(s)}:{completed:count(s)};
    if(count(s)===16)daily(s,now);
    const missing=[];
    for(const [threshold,chain] of [[4,'spk'],[10,'rib']]){
      if(count(s)<threshold||s.atelier.cells.some(c=>c?.kind==='generator'&&c.chain===chain))continue;
      const index=s.atelier.cells.indexOf(null);
      if(index<0){missing.push(chain);continue;}
      s.atelier.cells[index]={kind:'generator',chain,charges:A.Merge.CHARGES,readyAt:0,level:1,draws:0};
      if(!s.atelier.discovered.includes(chain+'1'))s.atelier.discovered.push(chain+'1');
    }
    for(const cell of s.atelier.cells)if(cell?.kind==='generator'){
      const expert=count(s)>=(['fab','lea'].includes(cell.chain)?4:cell.chain==='spk'?10:14);
      if(expert)cell.level=2;
    }
    return missing;
  }
  function renovate(s,id,now=Date.now()){
    const next=task(s);
    if(!next||id!==next.id)return {ok:false,reason:'stale'};
    if(!Number.isFinite(s.stars)||s.stars<next.cost)return {ok:false,reason:'stars'};
    const oldChapter=chapter(s);s.stars-=next.cost;s.boutique={completed:next.id+1};
    A.Merge.tick(s.atelier,now);s.atelier.energy=Math.min(A.Merge.MAX_ENERGY,s.atelier.energy+16);
    const pending=sync(s,now);
    return {ok:true,task:next,chapterComplete:chapter(s)!==oldChapter,pending};
  }
  function daily(s,now=Date.now()){
    const key=new Date(now).toISOString().slice(0,10),old=s.boutique.daily;
    const valid=old&&/^\d{4}-\d{2}-\d{2}$/.test(old.key)&&Number.isFinite(Date.parse(old.key+'T00:00:00Z'));
    if(!valid||old.key<key)s.boutique.daily={key,delivered:0,claimed:false};
    else s.boutique.daily={key:old.key,delivered:Number.isInteger(old.delivered)?Math.max(0,Math.min(5,old.delivered)):0,claimed:old.claimed===true};
    return s.boutique.daily;
  }
  function recordDelivery(s,now=Date.now()){if(count(s)===16){const d=daily(s,now);d.delivered=Math.min(5,d.delivered+1);}}
  function claimDaily(s,key,now=Date.now()){
    if(count(s)!==16)return false;
    const d=daily(s,now);if(d.key!==key||d.claimed||d.delivered<5)return false;
    d.claimed=true;A.Merge.tick(s.atelier,now);s.atelier.energy=Math.min(100,s.atelier.energy+20);s.coins+=50;s.gems++;return true;
  }
  function customers(s){return count(s)>=10?[0,1,2,3,4,5]:count(s)>=4?[0,1,2,3,4]:[0,1,2];}
  function customerPool(board){return board?.cells.some(c=>c?.kind==='generator'&&c.chain==='rib')?[0,1,2,3,4,5]:board?.cells.some(c=>c?.kind==='generator'&&c.chain==='spk')?[0,1,2,3,4]:[0,1,2];}
  function storyMarkup(s){const ch=chapter(s);return `<div class="atelier-journal"><button class="secondary journal-back" data-boutique-return>${tr('back')}</button><span class="section-kicker">${tr('journal')}</span><h2>${tr('chapter')[ch]}</h2><p>${tr('chapterStory')[ch]}</p>${tr('story').slice(0,count(s)).map((line,i)=>`<article><span>${i+1} · ${tr('task')[i]}</span><p>${line}</p></article>`).join('')}</div>`;}
  function dailyMarkup(s){const d=daily(s);return `<div class="daily-wishes"><span class="section-kicker">${tr('daily')} · ${d.key}</span><h3>${d.delivered} / 5</h3><p>${tr('dailyHint')}</p><p>${tr('dailyReward')}</p><button class="primary" data-daily-claim="${d.key}" ${d.delivered<5||d.claimed?'disabled':''}>${tr(d.claimed?'claimed':'claim')}</button></div>`;}
  function markup(s,before=false){
    const n=count(s),next=task(s),lv=levels(s),ch=chapter(s),start=ch===0?0:ch===1?4:10,end=ch===0?4:ch===1?10:16;
    const reward=ch===0?'sparkle':ch===1?'ribbon':'finish';
    return `<div class="boutique-heading"><div><span class="section-kicker">${tr('kicker')} · ${Math.min(3,ch+1)} / 3</span><h2>${tr('title')}</h2><p>${tr('intro')}</p></div><button class="secondary" data-action="close">${tr('back')}</button></div><div class="boutique-layout"><div class="boutique-visual"><div class="boutique-scene ${before?'before':''}" data-boutique-scene style="--restored:${n/16}"><div class="boutique-room"></div>${SLOTS.map((id,i)=>{const level=lv[id]-(before&&n>0&&ORDER[n-1]===id?1:0);return level>0?`<img class="boutique-object decor-${id}" data-decor="${id}" src="assets/decor/d_${id}${level}.webp" alt="${tr('names')[i]} · ${tr('level')} ${level}">`:`<span class="boutique-placeholder decor-${id}" aria-hidden="true">${i+1}</span>`;}).join('')}<span class="boutique-sign">${A.lang==='zh'?'甜甜小鞋铺<br><small>精品店</small>':'Sweet Shoe<br><small>ATELIER</small>'}</span></div><div class="boutique-scene-footer"><span>✧ +${n*2}% ${tr('charm')}</span><button class="secondary" data-boutique-before aria-pressed="${before}" ${n?'':'disabled'}>${before?tr('after'):tr('preview')}</button></div></div><aside class="boutique-tasks"><div class="boutique-chapter"><span class="section-kicker">${A.lang==='zh'?'第 '+Math.min(3,ch+1)+' 章':'CHAPTER '+Math.min(3,ch+1)}</span><h3>${tr('chapter')[ch]}</h3><button class="story-link secondary" data-boutique-story>${tr('journal')} ↗</button><div class="boutique-progress"><i style="width:${ch===3?100:(n-start)/(end-start)*100}%"></i></div><p>${Math.min(end,n)-start} / ${end-start} · ${tr(reward)}</p></div>${next?`<div class="renovation-task"><span class="section-kicker">${tr('next')}</span><div class="renovation-story"><img src="assets/mentor_neutral.webp" alt="${tr('odette')}"><p>“${tr('story')[n]}”</p></div><div class="renovation-preview"><img src="assets/decor/d_${next.slot}${next.level}.webp" alt=""><div><h3>${tr('task')[n]}</h3><p>${tr('names')[SLOTS.indexOf(next.slot)]} · ${next.level===2?tr('upgrade'):tr('level')+' 1'}</p></div></div><button class="primary renovate-button" data-renovate="${n}" ${s.stars<next.cost?'disabled':''}>${tr('renovate')} <img src="assets/icon_star.webp" alt="${tr('stars')}"> ${next.cost}<small>${s.stars} ${tr('stars')}</small></button><p class="inspiration-reward">✧ ${tr('inspiration')}</p>${s.stars<next.cost?`<p class="renovation-hint">${tr('need')}</p>`:''}<button class="secondary" data-boutique-earn>${tr('earn')} ↗</button></div>`:`<div class="renovation-task"><h3>✓ ${tr('complete')}</h3><p>${tr('endless')}</p>${dailyMarkup(s)}<button class="primary" data-boutique-earn>${tr('earn')} ↗</button></div>`}<div class="boutique-slots">${SLOTS.map((id,i)=>`<div class="boutique-slot ${next?.slot===id?'current':''}"><img src="assets/decor/d_${id}${Math.max(1,lv[id])}.webp" alt=""><span>${tr('names')[i]}<small aria-label="${tr('level')} ${lv[id]} / 2">${lv[id]>0?'★':'☆'} ${lv[id]>1?'★':'☆'}</small></span></div>`).join('')}</div></aside></div>`;
  }
  A.Boutique={SLOTS,ORDER,COSTS,count,chapter,levels,task,sync,renovate,markup,tr,daily,recordDelivery,claimDaily,customers,customerPool,storyMarkup};
})(globalThis.SweetShoe=globalThis.SweetShoe||{});
