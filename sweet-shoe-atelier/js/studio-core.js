'use strict';
(function(A){
const {opts,defaults,option,themes}=A;
function cleanDesign(d){return Object.fromEntries(Object.keys(opts).map(k=>[k,opts[k].some(o=>o[0]===d?.[k])?d[k]:defaults[k]]));}
function unlocked(s,k,v){return !option(k,v)[2]||s.unlocks.includes(k+':'+v)||!!(A.CRAFT_UNLOCKS[k+':'+v]&&s.atelier?.discovered.includes(A.CRAFT_UNLOCKS[k+':'+v]));}
function customersForDay(day){return Math.min(8,5+Math.floor(day/3));}
function generateOrder(s,rng=Math.random){const person=s.day===1&&s.served===0?1:A.Boutique.customers(s)[Math.floor(rng()*A.Boutique.customers(s).length)],theme=themes[person],vip=s.day>=3&&s.served===customersForDay(s.day)-1;const count=Math.min(4,2+Math.floor((s.day-1)/2)+(vip?1:0));const keys=Object.keys(opts);for(let i=keys.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[keys[i],keys[j]]=[keys[j],keys[i]];}const req=keys.slice(0,count).map(k=>{const pool=opts[k].filter(o=>unlocked(s,k,o[0]));return {key:k,value:theme.pref[k]&&unlocked(s,k,theme.pref[k])?theme.pref[k]:pool[Math.floor(rng()*pool.length)][0]};});if(s.day>=2&&rng()<.35){const i=req.findIndex(r=>r.key==='decoration'||r.key==='charm');req[i>=0?i:req.length-1]={key:'noBows',value:true};for(const r of req){if(r.key==='decoration'&&['small','big'].includes(r.value))r.value='none';if(r.key==='strap'&&r.value==='ribbon')r.value='thin';if(r.key==='charm'&&r.value==='mini')r.value='pearl';}}return {person,requirements:req,vip,duration:Math.max(38,85-(s.day-1)*5-(vip?8:0)),adUsed:false};}
function matches(d,r){return r.key==='noBows'?!['small','big'].includes(d.decoration)&&d.charm!=='mini'&&d.strap!=='ribbon':d[r.key]===r.value;}
function scoreOrder(d,o,remaining,combo=0){const matched=o.requirements.filter(r=>matches(d,r)).length,stars=matched===o.requirements.length?3:matched/o.requirements.length>=.5?2:1;const style=Object.entries(themes[o.person].pref).filter(([k,v])=>d[k]===v&&!o.requirements.some(r=>r.key===k)).length*3;const speed=Math.ceil(Math.max(0,remaining)/10),streak=stars===3?combo+1:0,multiplier=1+Math.min(4,Math.floor(streak/3))*.25;return {matched,stars,style,speed,streak,multiplier,earned:Math.round((stars*10+style+speed)*multiplier*(o.vip?2:1))};}

const commissionStars=result=>Math.max(0,Math.min(2,(result?.stars||1)-1));
Object.assign(A,{commissionStars,cleanDesign,unlocked,customersForDay,generateOrder,matches,scoreOrder});
})(globalThis.SweetShoe = globalThis.SweetShoe || {});
