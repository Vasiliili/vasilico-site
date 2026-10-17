/* Ideal stratified-store energy balance. Litres, degrees Celsius, kW, minutes. */
(function(root){
 const D=typeof HEATER_DATA!=='undefined'?HEATER_DATA:require('./data.js');
 const cp=()=>D.heatCapacity;
 function validate(s){
  for(const k of ['volume','power','stored','cold','mixed','people','minutes','showerFlow','pause','bathLitres','bathFlow','basinLitres','basinFlow','kitchenLitres','kitchenFlow'])if(!Number.isFinite(s[k]))return 'Заполните все числовые поля.';
  if(s.volume<=0||s.power<=0)return 'Объём и мощность должны быть больше нуля.';
  if(s.cold>=s.mixed)return 'Температура холодной воды должна быть ниже температуры купания.';
  if(s.stored<=s.mixed)return 'Для этого расчёта температура в баке должна быть выше температуры воды в кране.';
  if(!Array.isArray(s.active)||s.people<1||s.people>10||!Number.isInteger(s.people)||s.pause<0)return 'Проверьте число человек и паузу.';
  if(['minutes','showerFlow','bathLitres','bathFlow','basinLitres','basinFlow','kitchenLitres','kitchenFlow'].some(k=>s[k]<=0))return 'Расход, длительность и объём воды должны быть больше нуля.';
  return '';
 }
 function stages(s){const rows=[];
  if(s.active.includes('shower'))for(let i=0;i<s.people;i++)rows.push({name:'Душ · человек '+(i+1),litres:s.showerFlow*s.minutes,flow:s.showerFlow,pause:i<s.people-1?s.pause:0});
  if(s.active.includes('bath'))rows.push({name:'Наполнение ванны',litres:s.bathLitres,flow:s.bathFlow,pause:0});
  if(s.active.includes('basin'))rows.push({name:'Умывальник',litres:s.basinLitres,flow:s.basinFlow,pause:0});
  if(s.active.includes('kitchen'))rows.push({name:'Кухня',litres:s.kitchenLitres,flow:s.kitchenFlow,pause:0});return rows;
 }
 function solve(s){const error=validate(s);if(error)return {error};
  const perLitre=cp()*(s.mixed-s.cold),capacity=cp()*s.volume*(s.stored-s.cold),mixedLitres=capacity/perLitre;
  let energy=capacity,servedTotal=0,total=0;const rows=[];
  for(const item of stages(s)){
   const duration=item.litres/item.flow,drawPower=item.flow*perLitre*60,net=drawPower-(s.during?s.power:0);
   const servedMinutes=net<=0?duration:Math.min(duration,energy/net*60),servedLitres=servedMinutes*item.flow;
   energy=Math.max(0,Math.min(capacity,energy+(s.during?s.power:0)*duration/60-item.litres*perLitre));
   servedTotal+=servedLitres;total+=item.litres;
   const afterDraw=energy;energy=Math.min(capacity,energy+s.power*item.pause/60);
   rows.push({...item,duration,servedMinutes,servedLitres,ok:servedLitres>=item.litres-1e-6,afterDraw,afterPause:energy});
  }
  const showerPower=s.showerFlow*perLitre*60,netShower=showerPower-(s.during?s.power:0);
  const nextNeed=Math.max(0,s.showerFlow*s.minutes*perLitre-(s.during?s.power*s.minutes/60:0));
  return {capacity,mixedLitres,rows,total,servedTotal,energy,remainingLitres:energy/perLitre,allFit:rows.every(r=>r.ok),
   showerMinutes:netShower<=0?Infinity:capacity/netShower*60,
   fullHeatMinutes:capacity/s.power*60,reheatMinutes:(capacity-energy)/s.power*60,
   nextWaitMinutes:nextNeed>capacity+1e-8?null:Math.max(0,nextNeed-energy)/s.power*60,
   hotShare:(s.mixed-s.cold)/(s.stored-s.cold),perLitre};
 }
 function recommend(s){if(validate(s)||!stages(s).length)return {minimum:null,reserve:null};
  const minimum=D.volumes.find(volume=>solve({...s,volume}).allFit)??null;
  const reserve=minimum==null?null:D.volumes.find(v=>v>=minimum*D.reserveFactor)??null;return {minimum,reserve};
 }
 root.HeaterEngine={validate,stages,solve,recommend};if(typeof module!=='undefined')module.exports=root.HeaterEngine;
})(globalThis);
