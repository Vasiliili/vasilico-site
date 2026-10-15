const a=require('node:assert/strict');require('./data.js');require('./catalog.js');require('./stations.js');const E=require('./engine.js'),C=PUMP_DATA;
const base={active:['kitchen'],hot:false,hotTarget:'kitchen',setpoint:2.5};
for(const id of ['esybox-mini3','scala2']){
 const p=C.pumps.find(p=>p.id===id),s={...base,pump:id},one=E.solve(C,s);
 a(Math.abs(one.pressure-2.5)<1e-7);a(one.running);a(!one.limited);
 const c=structuredClone(C);c.fixtures.forEach(f=>f.referenceFlow=20);const high=E.solve(c,{...s,active:c.fixtures.map(f=>f.id),setpoint:5.5});
 a(high.pressure<E.normalizeSetpoint(p,c.inletBar,5.5));a(!high.limited);a(Math.abs(high.pressure-c.inletBar-E.head(p,high.total)*c.barPerMetre)<1e-6);
 a.equal(E.solve(C,{...s,active:[]}).total,0);
 for(const inlet of C.inletOptions){const r=E.regulationRange(p,inlet);if(p.regulation.maxBoostBar)a(r.max-inlet<=3.5+1e-8);a(E.normalizeSetpoint(p,inlet,100)<=r.max);}
}
const pw=C.pumps.find(p=>p.id==='pw175ea'),s={...base,pump:pw.id},r=E.solve(C,s);
a(r.cycle);a.equal(r.pressureRange[0],1.1*.980665);a.equal(r.pressureRange[1],1.8*.980665);a(r.highLoad.total>r.total);
const c=structuredClone(C);c.fixtures.forEach(f=>f.referenceFlow=9);const loaded=E.solve(c,{...s,active:c.fixtures.map(f=>f.id)});a(!loaded.cycle);a(loaded.running);a(!loaded.limited);a(loaded.pressure<pw.auto.cutOutBar);
const passive=structuredClone(C);passive.inletBar=1.5;a(!E.solve(passive,s).running);
for(const p of C.pumps.filter(p=>!p.catalogOnly)){const s={...base,pump:p.id};a.equal(E.solve(C,s).need,E.solve(C,{...s,hot:true}).need);a(Math.abs(E.solve(C,s).total-E.solve(C,{...s,hot:true}).total)<1e-7);}
console.log('PASS: inverter setpoints, capacity limits, relay cycle/continuous/passive, gas route');
