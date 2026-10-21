(function(root){
 const finite=(v,min,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
 function calculate(state){
  const rows=state.loads.filter(l=>l.active),errors=[];
  if(!finite(state.reserve,0,50))errors.push('Запас должен быть от 0 до 50%.');
  for(const l of rows){
   if(!finite(l.watts,1,30000))errors.push(l.label+': укажите потребление от 1 до 30 000 Вт.');
   if(!finite(l.pf,.1,1))errors.push(l.label+': коэффициент мощности должен быть от 0,1 до 1.');
   if(l.startVA!==null&&!finite(l.startVA,1,150000))errors.push(l.label+': укажите пусковую нагрузку или оставьте её неизвестной.');
   if(finite(l.watts,1,30000)&&finite(l.pf,.1,1)&&l.startVA!==null&&l.startVA+1<l.watts/l.pf)errors.push(l.label+': пусковая нагрузка меньше полной рабочей. Проверьте единицы.');
  }
  if(errors.length)return {errors,rows};
  const runningW=rows.reduce((s,l)=>s+l.watts,0),runningVA=rows.reduce((s,l)=>s+l.watts/l.pf,0);
  const unknownStart=rows.some(l=>l.startVA===null),unconfirmed=rows.filter(l=>!l.known).map(l=>l.label);
  let startingVA=null;
  if(!unknownStart)startingVA=state.startMode==='together'?rows.reduce((s,l)=>s+Math.max(l.startVA,l.watts/l.pf),0):Math.max(runningVA,...rows.map(l=>runningVA-l.watts/l.pf+Math.max(l.startVA,l.watts/l.pf)));
  return {errors:[],rows,runningW,runningVA,startingVA,unknownStart,unconfirmed,requiredW:runningW*(1+state.reserve/100),requiredVA:runningVA*(1+state.reserve/100),hasMotor:rows.some(l=>l.motor),blocked:state.building!=='house'||state.phase!=='single',empty:!rows.length};
 }
 function variants(data,filters){return data.models.flatMap(model=>Object.entries(model.ratings).map(([fuel,rating])=>({model,fuel,rating,key:model.id+':'+fuel}))).filter(v=>(filters.fuel==='any'||v.fuel===filters.fuel)&&(filters.technology==='any'||v.model.technology===filters.technology)&&(filters.start!=='electric'||v.model.electric)&&(!filters.automatic||v.model.automatic));}
 function assess(variant,result){
  if(result.errors.length||result.empty||result.blocked)return {status:'blocked'};
  const r=variant.rating,working=r.watts>=result.runningW&&r.va>=result.runningVA,reserve=r.watts>=result.requiredW&&r.va>=result.requiredVA;
  const startWithinContinuous=result.startingVA===null?null:r.va>=result.startingVA;
  return {working,reserve,startWithinContinuous,loadPercent:Math.max(result.runningW/r.watts,result.runningVA/r.va)*100,status:!working?'overload':!reserve?'little-reserve':'working'};
 }
 function shortlist(options,result){return options.filter(v=>{const a=assess(v,result);return a.reserve;}).sort((a,b)=>{const aa=assess(a,result),bb=assess(b,result);return Number(bb.startWithinContinuous===true)-Number(aa.startWithinContinuous===true)||a.rating.watts-b.rating.watts;});}
 root.GeneratorEngine={calculate,variants,assess,shortlist};if(typeof module==='object')module.exports=root.GeneratorEngine;
})(typeof window!=='undefined'?window:globalThis);
