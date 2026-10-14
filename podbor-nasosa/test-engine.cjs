const assert=require('node:assert/strict');require('./data.js');const E=require('./engine.js'),C=PUMP_DATA;
const state=(active=['kitchen'])=>({pump:'pb201ea',active,hot:false,hotTarget:'kitchen',setpoint:2.5});
let count=0;
for(let mask=0;mask<32;mask++){
 const active=C.fixtures.filter((f,i)=>mask&(1<<i)).map(f=>f.id),s=state(active),r=E.solve(C,s);count++;
 assert(Number.isFinite(r.pressure)&&r.pressure>=C.inletBar);assert(!r.limited);
 assert(Math.abs(r.total-r.flows.reduce((a,b)=>a+b,0))<1e-8);
 if(r.running)assert(Math.abs(r.pressure-(C.inletBar+E.head(C.pumps[0],r.total)*C.barPerMetre))<1e-6);
 for(let i=0;i<5;i++)if(!active.includes(C.fixtures[i].id))assert.equal(r.flows[i],0);
 const hot=E.solve(C,{...s,hot:true});assert(Math.abs(hot.total-r.total)<1e-8,'gas must not double count');
 const off=E.solve(C,{...s,pump:'none'});assert.equal(off.pressure,C.inletBar);assert(off.total<=r.total+1e-8);
 for(const f of C.fixtures.filter(f=>!active.includes(f.id))){if(r.running)assert(E.solve(C,state([...active,f.id])).pressure<=r.pressure+1e-7);}
}
const r=E.solve(C,state()),all=E.solve(C,state(C.fixtures.map(f=>f.id)));
assert(!E.solve(C,state([])).running);assert.equal(E.solve(C,state([])).total,0);
const low=structuredClone(C);low.fixtures[0].referenceFlow=1;assert(!E.solve(low,state()).running);
const up=structuredClone(C);up.network.heightM=20;assert(!E.solve(up,state()).running);assert(E.solve(up,state()).total<1e-7);
const high=structuredClone(C);high.fixtures.forEach(f=>f.referenceFlow=100);assert(E.solve(high,state(high.fixtures.map(f=>f.id))).limited);
assert.equal(E.head(C.pumps[0],61),null);
const no=structuredClone(C);no.pumps[0].curve=null;assert(E.solve(no,state()).limited);
const heater=structuredClone(C);Object.assign(heater.heater,{model:'TEST FIXTURE ONLY',minPressure:1,minFlow:2,lossK:.001});
assert.equal(E.solve(C,{...state(),hot:true}).heater.kind,'unknown');
assert.equal(E.solve(heater,{...state(),hot:true}).heater.kind,'normal');
heater.heater.minFlow=100;assert.equal(E.solve(heater,{...state(),hot:true}).heater.kind,'low');
const vfd=structuredClone(C);vfd.pumps[0].type='constant-pressure';vfd.pumps[0].regulation={min:1,max:4};
assert(E.solve(vfd,{...state(),setpoint:4}).pressure<4);assert(Math.abs(E.solve(vfd,{...state(),setpoint:1.3}).pressure-1.3)<1e-5);
console.log(JSON.stringify({combinations:count,gasChecks:count,first:{pressure:r.pressure,total:r.total},all:{pressure:all.pressure,total:all.total},tests:'PASS'},null,2));

for(const inlet of C.inletOptions){const c=structuredClone(C);c.inletBar=inlet;for(let mask=0;mask<32;mask++){const a=c.fixtures.filter((f,i)=>mask&(1<<i)).map(f=>f.id);const r=E.solve(c,state(a));assert(Number.isFinite(r.pressure));assert(!r.limited);assert.equal(E.solve(c,{...state(a),pump:'none'}).pressure,inlet);assert(Math.abs(E.solve(c,{...state(a),hot:true}).total-r.total)<1e-8);}}console.log('128 inlet/load combinations passed');
