const assert=require('node:assert/strict');
const D=require('./data.js'),E=require('./engine.js');
const state=()=>({building:'house',phase:'single',startMode:'together',reserve:20,loads:D.loads.map(l=>({...l,active:false,known:false}))});
const all={fuel:'any',technology:'any',start:'any',automatic:false};
let s=state();s.loads[0].active=true;s.loads[3].active=true;s.loads[4].active=true;
let r=E.calculate(s);assert.equal(r.runningW,960);assert.equal(r.runningVA,1247.5);assert.equal(r.startingVA,5260);
s.startMode='sequential';r=E.calculate(s);assert.equal(r.startingVA,4247.5);s.loads[4].startVA=null;assert.equal(E.calculate(s).startingVA,null);
s.loads[4].pf=0;assert(E.calculate(s).errors.length);s.loads[4].pf=.75;s.loads[4].watts=-1;assert(E.calculate(s).errors.length);s.loads[4].watts=NaN;assert(E.calculate(s).errors.length);
s=state();assert(E.calculate(s).empty);s.loads[0].active=true;s.building='apartment';assert(E.calculate(s).blocked);assert.equal(E.shortlist(E.variants(D,all),E.calculate(s)).length,0);s.building='house';s.phase='three';assert(E.calculate(s).blocked);
const options=E.variants(D,all);assert.equal(D.models.length,8);assert.equal(options.length,10);assert.equal(options.find(x=>x.key==='champion-lpg6500e:lpg').rating.watts,4500);assert.equal(options.find(x=>x.key==='champion-lpg6500e:petrol').rating.watts,5000);assert.equal(options.find(x=>x.key==='generac-6520:ng').rating.watts,5000);
assert(E.variants(D,{...all,start:'electric'}).every(x=>x.model.electric));assert(E.variants(D,{...all,automatic:true}).every(x=>x.model.id==='generac-6520'));
s=state();s.loads[4].active=true;r=E.calculate(s);const small=options.find(x=>x.key==='honda-eu22i:petrol');assert.equal(E.assess(small,r).startWithinContinuous,false);assert.deepEqual(E.assess({...small,rating:{...small.rating,maximum:999999}},r),E.assess(small,r));
for(let mask=0;mask<512;mask++){s=state();s.loads.forEach((l,i)=>l.active=!!(mask&(1<<i)));const a=E.calculate(s);s.startMode='sequential';const b=E.calculate(s);assert.equal(a.errors.length,0);assert(a.startingVA+1e-9>=b.startingVA);assert(a.startingVA+1e-9>=a.runningVA);assert.equal(a.requiredW,a.runningW*1.2);for(const x of E.shortlist(options,a)){const z=E.assess(x,a);assert(z.reserve);assert(z.working);}}
console.log('PASS: 512 load combinations; units, startup, unknown data, phase restrictions, fuel ratings, filters and peak-rating isolation.');
