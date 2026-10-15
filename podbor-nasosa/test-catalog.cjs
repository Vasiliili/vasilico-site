const assert=require('node:assert/strict');require('./data.js');require('./catalog.js');const E=require('./engine.js'),C=PUMP_DATA;
assert.equal(C.pumps.length,9);assert.equal(new Set(C.pumps.map(p=>p.id)).size,9);
let checks=0;
for(const p of C.pumps){assert.equal(p.summary.length,5);assert(p.sources.length);for(const inlet of C.inletOptions){for(let mask=0;mask<32;mask++){
 const c=structuredClone(C);c.inletBar=inlet;const active=c.fixtures.filter((_,i)=>mask&(1<<i)).map(f=>f.id),state={pump:p.id,active,hot:true,hotTarget:'kitchen',setpoint:2.5};
 const r=E.solve(c,state);assert(Number.isFinite(r.pressure));if(p.catalogOnly){assert(r.limited);assert(!r.running);assert.equal(r.heater.kind,'unknown');}else if(!r.limited){assert(r.pressure>=inlet-1e-6);assert(r.pressure<=inlet+p.maxHeadM*c.barPerMetre+1e-6);}checks++;
}}}
assert.equal(E.head(C.pumps.find(p=>p.id==='tema400'),40),12);
assert.equal(E.head(C.pumps.find(p=>p.id==='ac159'),20),4.5);
assert.equal(E.head(C.pumps.find(p=>p.id==='ac159'),26),null);
console.log(checks+' catalogue/inlet/load combinations passed');
