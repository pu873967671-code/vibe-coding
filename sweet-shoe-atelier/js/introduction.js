'use strict';
(function(A){
  const copy={
    en:{name:'Madame Odette',skip:'Skip guide',chapter:'YOUR ATELIER JOURNEY',
      titles:['','A star for our little shop','Make yourself at home','From thread to a dream','A detail you made yourself','Your first commission','Made to be worn','A little turn, darling','A beautiful beginning'],
      bodies:['','The yarn you crafted can fulfil Mia’s wish. Deliver another wish to collect two renovation stars.','Open Boutique and spend two stars on our first rug. Wishes and commissions earn stars; renovations open new chapters.','Our rug is in place! Choose Serve customers to visit the design studio. Free design is yours whenever inspiration strikes.','Yarn unlocked Grand bow for every design. Choose Heel décor, then Grand bow.','Match each wish, then wrap your pair. Follow the glowing detail and green checks. The clock is resting.','Your pair is saved. Choose Try on to see it in the fitting room. You can revisit every pair from Collection.','Choose Tiptoe or Step to admire your pair. Try Zoom for a closer look.','Your collection keeps every finished pair. Return to Atelier for wishes, Boutique for renovations, or Free design to create at your own pace.'],
      workroom:'Back to Atelier',shop:'Visit Boutique',studio:'Serve customers',fitting:'Try on your pair',collection:'Visit Collection',finish:'My atelier awaits',next:'Next detail',ready:'Every wish matches. Wrap your pair!',unlocked:'Permanently unlocked by crafting',new:'New discovery'},
    zh:{name:'奥黛特夫人',skip:'跳过引导',chapter:'我的工坊之旅',
      titles:['','为小店攒一颗星','让小店温暖起来','从一缕线，到一个梦','亲手解锁的小细节','第一份定制委托','为每一步心动','亲爱的，转个身','美好才刚刚开始'],
      bodies:['','刚合成的毛线团能完成小米的心愿。再交付一份心愿，攒够两颗装修星星。','打开精品店，花两颗星星铺上第一张地毯。心愿和委托赚星星，装修开启新章节。','地毯铺好了！点击服务顾客，前往设计工作室。想随心创作时，也可以选择自由设计。','合成毛线团，已永久解锁大蝴蝶结。选择后跟装饰，再点击大蝴蝶结试试看。','搭配顾客想要的细节。绿色对勾表示已满足，完成后包装鞋子。慢慢来，引导时不会倒计时。','鞋子已经珍藏。点击试穿，去沙龙看看上脚效果。每双作品都可以从作品集再次试穿。','选择踮脚或迈步，欣赏这双鞋。还可以放大，看看细节。','作品集珍藏每一双鞋。回工坊完成心愿，去精品店装修，或在自由设计中随心创作。'],
      workroom:'回到工坊',shop:'前往精品店',studio:'服务顾客',fitting:'试穿这双鞋',collection:'前往作品集',finish:'开启我的工坊',next:'下一个细节',ready:'心愿全部满足，可以包装了！',unlocked:'合成发现，永久解锁',new:'新发现'}
  };
  A.Introduction.opening={
    en:[['A little shop. A thousand memories.','“Your grandmother made every pair with love. This little atelier is her gift to you.”'],['A little faded, still full of heart','“It has been quiet here. Together, we can fill these shelves with beautiful things again.”'],['Your own beautiful beginning','“I’m Madame Odette. A little thread, a little patience… I’ll show you, one stitch at a time.”'],['Our first customer!','“Rosie needs a little thread for her dream pair. Let’s open Grandma’s sewing basket.”']],
    zh:[['一间小店，满满回忆','“奶奶用心做好每一双鞋。如今，这间小鞋铺，是她留给你的礼物。”'],['旧时光里，心意仍在','“这里安静了好久。让我们一起，让小店重新温暖起来。”'],['属于你的美好开始','“我是奥黛特夫人。一缕线，一点耐心。我会一步一步教你。”'],['第一位顾客来了','“小桃想为梦中的鞋子准备一缕线。打开奶奶的缝纫篮，开始吧。”']]
  };
  A.Introduction.copy=()=>copy[A.lang];
  A.Introduction.lesson=function(s,context){
    if(!this.active(s)||s.mergeGuide<6)return null;
    const c=copy[A.lang],step=s.introduction;
    let target='',action='',label='',extra='';
    if(step===1){
      if(context.mode!=='merge'||context.modal){action='merge';label=c.workroom;}
      else{const ready=s.atelier.orders.find(o=>A.MergeOrders.indices(s.atelier,o));target=ready?'[data-deliver="'+ready.id+'"]':'[data-cell="16"]';}
    }
    if(step===2){target=context.modal==='shop'?'[data-renovate]':'[data-nav="shop"]';if(context.modal!=='shop'){action='shop';label=c.shop;}}
    if(step===3){target='[data-nav="serve"]';action='studio';label=c.studio;}
    if(step===4||step===5){
      if(context.mode!=='order'||context.modal){action='studio';label=c.studio;}
      else if(step===4)target=context.tab==='decoration'?'[data-option="big"]':'[data-tab="decoration"]';
      else{
        const need=s.order?.requirements.find(r=>!A.matches(context.design,r));
        let key=need?.key,value=need?.value;
        if(key==='noBows'){
          key=['small','big'].includes(context.design.decoration)?'decoration':context.design.strap==='ribbon'?'strap':'charm';value='none';
        }
        target=need?(context.tab===key?'[data-option="'+value+'"]':'[data-tab="'+key+'"]'):'#pack';
        extra=need?c.next+': '+A.t(key)+' · '+A.t(value):c.ready;
      }
    }
    if(step===6){target=context.modal==='result'?'[data-try-on="0"]':'[data-nav="collection"]';if(context.modal!=='result'){action='fitting';label=c.fitting;}}
    if(step===7){target='[data-runway-pose-button="tiptoe"]';if(context.modal!=='runway'){action='fitting';label=c.fitting;}}
    if(step===8){action=context.modal==='collection'?'finish':'collection';label=context.modal==='collection'?c.finish:c.collection;target=context.modal==='collection'?'[data-journey-action="finish"]':'[data-runway-collection]';}
    let body=c.bodies[step];if(s.introductionFlow===2&&step===3)body=A.lang==='zh'?'第一份心愿完成了！去服务顾客，把灵感做成一双鞋。':'Our first wish is delivered! Choose Serve customers to turn a little thread into a lovely pair.';if(s.introductionFlow===2&&step===2)body=A.lang==='zh'?'第一双鞋真漂亮！现在用赚到的星星，为小店铺上第一张地毯。':'Your first pair looks lovely! Spend your earned stars on our first rug, and make Grandma’s shop your own.';return {step,title:c.titles[step],body,target,action,label,extra};
  };
})(globalThis.SweetShoe=globalThis.SweetShoe||{});
