const a=require('node:assert/strict');const D=require('./data.js'),E=require('./engine.js'),s=structuredClone(D.defaults),near=(x,y)=>a(Math.abs(x-y)<1e-7,`${x} != ${y}`);
const r=E.solve({...s,volume:50});near(r.mixedLitres,50*50/28);near(r.fullHeatMinutes,.001163*50*50/2*60);near(r.showerMinutes,r.mixedLitres/8);a(!r.allFit);a(r.rows[0].ok);a(!r.rows[1].ok);near(r.servedTotal,r.mixedLitres);a.equal(E.recommend(s).minimum,80);a.equal(E.recommend(s).reserve,100);
const p=E.solve({...s,pause:60,volume:50});a(p.allFit);a(p.rows[0].afterPause<=p.capacity);a(p.rows[1].servedLitres===64);
for(const volume of D.volumes)for(const people of [1,2,4,10])for(const stored of [50,60,70])for(const during of [false,true]){
 const v={...s,volume,people,stored,during,active:['shower','bath','basin','kitchen']},r=E.solve(v);a(!r.error);a(r.energy>=0&&r.energy<=r.capacity);a(r.servedTotal<=r.total+1e-7);let prev=r.capacity;
 for(const row of r.rows){a(row.servedLitres>=0&&row.servedLitres<=row.litres+1e-7);a(row.afterDraw>=0&&row.afterDraw<=r.capacity);if(!during)near(prev-row.afterDraw,row.servedLitres*r.perLitre);prev=row.afterPause;}
 if(!during)near(r.servedTotal*r.perLitre+r.energy,r.capacity);
 const more=E.solve({...v,volume:volume+1});a(more.servedTotal>=r.servedTotal-1e-7);
}
a(E.solve({...s,stored:38}).error);a(E.solve({...s,cold:38}).error);a(E.solve({...s,people:1.5}).error);a.equal(E.solve({...s,active:[]}).total,0);a.equal(E.recommend({...s,active:[]}).minimum,null);
const strong=E.solve({...s,during:true,power:6,showerFlow:1});a.equal(strong.showerMinutes,Infinity);
near(E.solve({...s,power:4}).mixedLitres,E.solve(s).mixedLitres);near(E.solve({...s,power:4}).fullHeatMinutes,E.solve(s).fullHeatMinutes/2);
a(E.solve({...s,showerFlow:12}).showerMinutes<E.solve({...s,showerFlow:6}).showerMinutes);
console.log('PASS: mixing, warm-up, pauses, capacity, conservation, 264 load variants, invalid inputs and recommendations');
