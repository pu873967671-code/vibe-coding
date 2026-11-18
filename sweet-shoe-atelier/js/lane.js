'use strict';
// Ribbon Lane — the main story. Every regular on the lane has three big days;
// each big day is a commission with its own wish and look. Helping every
// neighbour reach all of theirs ends in the street party (the finale).
// Story data lives here, in English and Chinese side by side; the screens
// only read it through A.Lane.
(function(A){
  // person index -> three beats: [en title, zh title, look, en wish, zh wish, en story, zh story]
  const B=(en,zh,look,wishEn,wishZh,storyEn,storyZh)=>({title:{en,zh},look,wish:{en:wishEn,zh:wishZh},story:{en:storyEn,zh:storyZh}});
  const BEATS={
    0:[B('First date','第一次约会',{color:'pink',decoration:'small'},
        '“He asked me out! Something sweet, but I have to be able to walk…”','“他约我了！想要甜甜的，但一定要好走路……”',
        '“He said I looked like spring. I didn’t trip once!”','“他说我像春天一样。我一次都没绊倒！”'),
       B('Meeting his parents','见家长',{color:'cream',heel:'block',strap:'pearl'},
        '“Sunday lunch with his parents. Polite, pretty, no wobbling, please!”','“周日要去他家吃饭。要端庄、要好看，千万别崴脚！”',
        '“His mum asked where my shoes were from. I said: Ribbon Lane, of course.”','“他妈妈问我鞋在哪儿买的，我说：当然是丝带巷！”'),
       B('The picnic proposal','野餐求婚',{color:'pink',pattern:'hearts',charm:'pearl'},
        '“I think he’s planning something at the picnic… I need to look perfect.”','“我觉得他在野餐时要做点什么……我得美美的。”',
        '“He knelt on the blanket… I said yes! You’re invited to everything.”','“他在野餐垫上单膝跪下……我答应了！之后的每一场你都要来。”')],
    1:[B('Garden tea','花园下午茶',{color:'cream',pattern:'flowers'},
        '“The garden club meets on Saturday. Something soft, like a teacup.”','“周六花园俱乐部聚会。想要柔柔的，像一只茶杯。”',
        '“Everyone asked for your shop’s name. I wrote it on a napkin for them.”','“大家都问我鞋是哪家店的，我把名字写在餐巾上给她们了。”'),
       B('Book club reading','读书会朗读',{color:'green',heel:'flat',strap:'thin'},
        '“I’m reading aloud at the book club. I’ll be standing for an hour!”','“我要在读书会上朗读，要站整整一小时！”',
        '“My hands shook, my feet didn’t. Thank you, truly.”','“我的手在抖，脚却稳稳的。真的谢谢你。”'),
       B('Her own tea room','她的茶室开张',{color:'cream',strap:'pearl',charm:'pearl'},
        '“I signed the lease. My little tea room opens next week!”','“租约签好了！我的小茶室下周就开张！”',
        '“There’s a table by the window with your name on it. Always.”','“靠窗那张桌子永远留给你。”')],
    2:[B('First day of school','开学第一天',{color:'blue',heel:'flat'},
        '“New school tomorrow. I want shoes that say ‘be my friend’!”','“明天去新学校。想要一双会说“和我做朋友吧”的鞋！”',
        '“Three people said they liked my shoes. That’s three friends!”','“有三个人说喜欢我的鞋。那就是三个朋友！”'),
       B('The school play','学校话剧',{color:'pink',decoration:'small',strap:'thin'},
        '“I got a part in the play! Only two lines, but they’re very important.”','“我演话剧啦！只有两句台词，但很重要。”',
        '“I said both lines and nobody looked at anything but my shoes.”','“两句台词都说好了，大家都盯着我的鞋看。”'),
       B('Graduation','毕业典礼',{color:'blue',heel:'block',charm:'pearl'},
        '“I’m graduating! Mum is crying already and it’s still a week away.”','“我要毕业了！还有一周，妈妈已经开始哭了。”',
        '“I walked across the stage like a grown-up. Grandma would have clapped.”','“我像大人一样走过礼台。奶奶一定也会鼓掌。”')],
    3:[B('Engagement photos','订婚照',{color:'cream',material:'satin'},
        '“We’re taking engagement photos by the river. Something that glows.”','“我们要在河边拍订婚照，想要会发光的鞋。”',
        '“The photographer said the shoes stole the picture. I don’t mind!”','“摄影师说鞋子抢镜了，我一点都不介意！”'),
       B('Bridal shower','新娘派对',{color:'pink',pattern:'flowers',strap:'pearl'},
        '“My friends are throwing me a bridal shower. Pink is a must!”','“朋友们要为我办新娘派对，一定要粉色！”',
        '“We danced in the living room until the neighbours joined in.”','“我们在客厅跳舞，最后邻居们也加入了。”'),
       B('Wedding day','婚礼当天',{color:'cream',material:'lace',strap:'pearl',charm:'pearl'},
        '“The wedding is on Saturday. These are the most important shoes of my life.”','“婚礼就在周六。这是我这辈子最重要的一双鞋。”',
        '“I walked down the aisle in your shoes. Ribbon Lane cried with me.”','“我穿着你做的鞋走过红毯。整条丝带巷都陪我哭了。”')],
    4:[B('Job interview','求职面试',{color:'blue',heel:'block'},
        '“Big interview on Monday. I need to look like I already work there.”','“周一有个重要面试。我要看起来像已经在那儿上班了。”',
        '“I got the job! The manager complimented my shoes first.”','“我被录用了！经理第一句就夸了我的鞋。”'),
       B('First paycheck treat','第一份薪水',{color:'green',material:'satin',decoration:'small'},
        '“My first paycheck! I promised myself one beautiful pair.”','“第一份薪水到账！我答应过自己要买一双好看的鞋。”',
        '“Worth every coin. I keep looking down at them on the bus.”','“每一分钱都值得。坐公交时我一直低头看它们。”'),
       B('Housewarming','乔迁派对',{color:'cream',heel:'flat',pattern:'dots'},
        '“I’m moving onto Ribbon Lane! Comfy shoes for a long party, please.”','“我要搬到丝带巷啦！派对很长，要舒服的鞋。”',
        '“My new door is three doors down from yours. Hello, neighbour!”','“我的新家就在你家隔壁第三间。你好呀，邻居！”')],
    5:[B('Karaoke night','卡拉OK之夜',{color:'pink',pattern:'stars'},
        '“Karaoke on Friday! I need shoes that can handle a high note.”','“周五去唱K！要一双能撑住高音的鞋。”',
        '“I hit the high note AND the dance move. Encore!”','“高音和舞步都完美！安可！”'),
       B('Dance recital','舞蹈演出',{color:'pink',heel:'flat',strap:'cross'},
        '“My first dance recital. Shoes that stay on when I spin!”','“我的第一场舞蹈演出。转圈时不能掉的鞋！”',
        '“Seven spins, zero wobbles. The whole row stood up.”','“转了七圈，一点没晃。整排观众都站起来了。”'),
       B('Birthday party','生日派对',{color:'rose',material:'glitter',charm:'crystal'},
        '“It’s my birthday party, so I’m allowed to sparkle the most.”','“今天是我的生日派对，我可以最闪亮！”',
        '“Best birthday ever. You and your shoes are on every photo.”','“最棒的生日！每张照片里都有你和你的鞋。”')]
  };
  const PEOPLE=[0,1,2,3,4,5],TOTAL=PEOPLE.length*3,ARC_BONUS=50,PARTY={coins:200,gems:5};
  // Neighbours move onto the lane as the story grows.
  const ARRIVAL={0:0,1:0,2:0,3:3,4:3,5:6};
  const copy={
    en:{arc:'{name}’s story is complete!',bonus:'+{c} coins for a story well told',moved:'{names} moved onto Ribbon Lane!',and:' and ',partyTitle:'The Ribbon Lane street party',partyLead:'Every neighbour reached her big day, in shoes you made. Tonight, the whole lane celebrates you.',partyReward:'+{c} coins · +{g} gems',partyGo:'Join the party',lane:'Ribbon Lane',goal:'Help every neighbour reach their big day',bigDay:'BIG DAY',next:'Next',party:'Street party',partyLocked:'When every neighbour has had their big day, Ribbon Lane throws a party for you.',arrives:'Moves in after {n} big days',done:'All big days done',again:'{name} loved the effort, but it wasn’t quite it. She’ll come back for another try.',complete:'{name}’s big day',progress:'{n} / {t} big days',close:'Back to work',map:'Ribbon Lane'},
    zh:{arc:'{name}的故事圆满了！',bonus:'故事圆满奖励 +{c} 金币',moved:'{names}搬进了丝带巷！',and:'和',partyTitle:'丝带巷街坊派对',partyLead:'每一位邻居都穿着你做的鞋，迎来了她的重要日子。今晚，整条巷子为你庆祝。',partyReward:'+{c} 金币 · +{g} 钻石',partyGo:'加入派对',lane:'丝带巷',goal:'帮每一位邻居迎来她们的重要日子',bigDay:'重要日子',next:'下一个',party:'街坊派对',partyLocked:'当每位邻居都迎来了她们的重要日子，丝带巷会为你办一场派对。',arrives:'完成 {n} 个重要日子后搬来',done:'重要日子已全部完成',again:'{name}很感谢你的用心，但还差一点点。她会再来试一次。',complete:'{name}的重要日子',progress:'{n} / {t} 个重要日子',close:'继续工作',map:'丝带巷'}
  };
  const tr=k=>copy[A.lang==='zh'?'zh':'en'][k];
  const L=v=>v[A.lang==='zh'?'zh':'en'];
  function ensure(s){
    if(s.lane&&s.lane.ok===true)return s.lane; // already normalised: keep its identity
    const lane=s.lane&&typeof s.lane==='object'?s.lane:{};
    const done={};for(const p of PEOPLE)done[p]=Math.max(0,Math.min(3,Math.floor(Number(lane.done?.[p])||0)));
    s.lane={done,last:Number.isInteger(lane.last)?lane.last:-1,party:lane.party===true};
    Object.defineProperty(s.lane,'ok',{value:true,enumerable:false});
    return s.lane;
  }
  const count=s=>PEOPLE.reduce((n,p)=>n+ensure(s).done[p],0);
  const arrived=(s,p)=>count(s)>=ARRIVAL[p];
  const finished=s=>count(s)>=TOTAL;
  // The neighbour whose story is furthest behind goes next; never the same one twice running.
  function nextPerson(s){
    const lane=ensure(s),open=PEOPLE.filter(p=>arrived(s,p)&&lane.done[p]<3);
    if(!open.length)return null;
    const pool=open.length>1?open.filter(p=>p!==lane.last):open;
    return pool.sort((a,b)=>lane.done[a]-lane.done[b]||a-b)[0];
  }
  function nextBeat(s){const p=nextPerson(s);return p===null?null:{person:p,step:ensure(s).done[p],...BEATS[p][ensure(s).done[p]]};}
  // Turn a generated order into the next big day: same person, the beat's look
  // as requirements (only details the player can already use), topped up from
  // the generated requirements so the count stays familiar.
  function storyOrder(s,order){
    if(!order||A.Introduction?.active?.(s)||finished(s))return order;
    if((s.total||0)%2!==0)return order;
    const beat=nextBeat(s);if(!beat)return order;
    const req=Object.entries(beat.look).filter(([k,v])=>A.unlocked(s,k,v)).map(([key,value])=>({key,value}));
    for(const r of order.requirements){if(req.length>=Math.max(2,Math.min(4,order.requirements.length)))break;if(!req.some(x=>x.key===r.key)&&r.key!=='noBows')req.push(r);}
    const heel=req.find(r=>r.key==='heel')?.value;
    const final=req.filter(r=>!heel||r.key==='heel'||A.supportsStyleOption(heel,r.key,r.value)).slice(0,4);
    if(final.length<2)return order;
    return {...order,person:beat.person,requirements:final,vip:false,beat:{person:beat.person,step:beat.step}};
  }
  function beatOf(order){const b=order?.beat;return b&&BEATS[b.person]?.[b.step]?{...b,...BEATS[b.person][b.step]}:null;}
  // Record a delivered big day. Two stars or more completes it.
  function complete(s,order,stars){
    const beat=beatOf(order);if(!beat)return null;
    const lane=ensure(s);lane.last=beat.person;
    const success=stars>=2&&lane.done[beat.person]===beat.step,before=PEOPLE.filter(p=>arrived(s,p));
    if(success)lane.done[beat.person]=beat.step+1;
    const arc=success&&lane.done[beat.person]===3;if(arc)s.coins=(s.coins||0)+ARC_BONUS;
    const moved=PEOPLE.filter(p=>arrived(s,p)&&!before.includes(p));
    return {beat,success,arc,moved,count:count(s),finished:finished(s)};
  }
  const name=p=>A.t('name'+p);
  function dots(s,p){const d=ensure(s).done[p];return [0,1,2].map(i=>`<i class="${i<d?'on':''}"></i>`).join('');}
  function trackerMarkup(s){
    const beat=nextBeat(s),n=count(s);
    const next=finished(s)?tr('party'):beat?`${name(beat.person)} · ${L(beat.title)}`:'';
    return `<span class="lane-ribbon" aria-hidden="true"></span><span class="lane-text"><b data-short="${n}/${TOTAL}">${tr('lane')} ${n}/${TOTAL}</b><small>${finished(s)?'🎉 ':tr('next')+': '}${next}</small></span><span class="lane-meter" aria-hidden="true"><i style="width:${n/TOTAL*100}%"></i></span>`;
  }
  function mapMarkup(s){
    const lane=ensure(s);
    const rows=PEOPLE.map(p=>{
      const here=arrived(s,p),d=lane.done[p],beat=d<3?BEATS[p][d]:null,asset=A.themes[p].asset;
      return `<li class="lane-house ${here?'':'away'} ${d>=3?'complete':''}"><img src="assets/${asset}_${d>=3?'happy':'neutral'}.webp" alt=""><div><b>${name(p)}</b><span class="lane-dots">${dots(s,p)}</span><small>${!here?tr('arrives').replace('{n}',ARRIVAL[p]):beat?tr('next')+': '+L(beat.title):tr('done')}</small></div></li>`;
    }).join('');
    return `<span class="eyebrow">${tr('map')}</span><h2>${tr('goal')}</h2><p class="lane-progress-line">${tr('progress').replace('{n}',count(s)).replace('{t}',TOTAL)}</p><ul class="lane-street">${rows}</ul><div class="lane-party ${finished(s)?'ready':''}"><b>🎉 ${tr('party')}</b><small>${tr('partyLocked')}</small></div>`;
  }
  function brief(order){
    const b=beatOf(order);if(!b)return null;
    return {kicker:`${tr('bigDay')} · ${b.step+1} / 3`,title:L(b.title),wish:L(b.wish)};
  }
  function resultMarkup(s,outcome){
    if(!outcome)return '';
    const {beat,success}=outcome;
    if(!success)return `<div class="lane-beat retry"><p>${tr('again').replace('{name}',name(beat.person))}</p></div>`;
    return `<div class="lane-beat ${outcome.arc?'arc':''}"><span class="eyebrow">${tr('complete').replace('{name}',name(beat.person))} · ${L(beat.title)}</span><p>${L(beat.story)}</p><span class="lane-dots">${dots(s,beat.person)}</span>${outcome.arc?`<strong class="lane-arc">✦ ${tr('arc').replace('{name}',name(beat.person))} <small>${tr('bonus').replace('{c}',ARC_BONUS)}</small></strong>`:''}<small>${tr('progress').replace('{n}',outcome.count).replace('{t}',TOTAL)}</small></div>`;
  }
  function movedLine(outcome){return outcome?.moved?.length?tr('moved').replace('{names}',outcome.moved.map(name).join(tr('and'))):'';}
  const partyDue=s=>finished(s)&&!ensure(s).party;
  // The finale: every neighbour together, happy, with her last line.
  function party(s){
    const lane=ensure(s);if(lane.party)return null;lane.party=true;s.coins=(s.coins||0)+PARTY.coins;s.gems=(s.gems||0)+PARTY.gems;
    const guests=PEOPLE.map(p=>`<figure class="party-guest"><img src="assets/${A.themes[p].asset}_happy.webp" alt=""><figcaption>${name(p)}</figcaption></figure>`).join('');
    return `<span class="eyebrow">🎉 ${tr('lane')}</span><h2>${tr('partyTitle')}</h2><div class="party-row">${guests}</div><p class="party-lead">${tr('partyLead')}</p><p class="party-reward">${tr('partyReward').replace('{c}',PARTY.coins).replace('{g}',PARTY.gems)}</p>`;
  }
  A.Lane={movedLine,partyDue,party,BEATS,TOTAL,ensure,count,finished,nextBeat,storyOrder,beatOf,complete,brief,trackerMarkup,mapMarkup,resultMarkup,tr};
})(globalThis.SweetShoe);
