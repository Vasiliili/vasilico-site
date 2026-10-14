/* Pure steady-state model. All flows L/min, pressures bar, elevations metres. */
(function(root){
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 function head(pump,q){
  if(!pump?.curve?.length || q<0 || q>pump.curveUsableMaxFlow)return null;
  for(let i=1;i<pump.curve.length;i++){let [q0,h0]=pump.curve[i-1],[q1,h1]=pump.curve[i];if(q<=q1)return h0+(h1-h0)*(q-q0)/(q1-q0);}
  return null;
 }
 function demand(config,state,pout){
  const f=config.fixtures,n=f.length,ref=config.referenceBar;
  let flows=f.map(x=>state.active.includes(x.id)?x.referenceFlow:0),pressures=[];
  for(let pass=0;pass<300;pass++){
   let loss=0,next=[];
   for(let i=0;i<n;i++){
    const downstream=flows.slice(i).reduce((a,b)=>a+b,0);
    loss+=(config.network.segmentK[i]||0)*downstream**2;
    const available=Math.max(0,pout-loss-(f[i].heightM??config.network.heightM)*config.barPerMetre);
    const hot=state.hot&&state.hotTarget===f[i].id;
    const k=(f[i].branchK??config.network.branchK)+(hot?(config.heater.lossK??0):0);
    const q=state.active.includes(f[i].id)?Math.sqrt(available/(ref/f[i].referenceFlow**2+k)):0;
    next.push(q);pressures[i]=Math.max(0,available-k*q*q);
   }
   const err=Math.max(...next.map((q,i)=>Math.abs(q-flows[i])));
   flows=next.map((q,i)=>q*0.35+flows[i]*0.65);
   if(err<1e-8)break;
  }
  return {flows,pressures,total:flows.reduce((a,b)=>a+b,0)};
 }
 function heaterState(config,state,result){
  if(!state.hot)return {kind:'off',text:'Колонка не используется'};
  const idx=config.fixtures.findIndex(x=>x.id===state.hotTarget),q=result.flows[idx]||0,p=result.pressures[idx]||0;
  if(q<0.01)return {kind:'low',text:'Нет протока через колонку — условия включения не обеспечены',flow:q,pressure:p};
  const h=config.heater;
  if(!h.model||h.minPressure==null||h.minFlow==null||h.lossK==null)return {kind:'unknown',text:config.copy.heaterUnknown,flow:q,pressure:p};
  if(p<h.minPressure||q<h.minFlow)return {kind:'low',text:'Расчётные условия включения не обеспечены',flow:q,pressure:p};
  if(p<h.minPressure*h.margin||q<h.minFlow*h.margin)return {kind:'high',text:'Работа может быть нестабильной: небольшой запас',flow:q,pressure:p};
  return {kind:'normal',text:'Расчётные условия нормальной работы обеспечены; проверка на месте обязательна',flow:q,pressure:p};
 }
 function solve(config,state){
  const pump=config.pumps.find(x=>x.id===state.pump),inlet=config.inletBar;
  const off=demand(config,state,inlet),need=config.fixtures.filter(x=>state.active.includes(x.id)).reduce((s,x)=>s+x.referenceFlow,0);
  let result={...off,pressure:inlet,boost:0,need,running:false,limited:false,reason:need?'Без повышения давления':'Все точки закрыты; насос остановлен'};
  if(!pump&&state.pump!=='none')return {...result,limited:true,reason:'Модель насоса не найдена',heater:heaterState(config,state,result)};
  if(pump&&need){
   if(pump.type!=='flow-switch'&&pump.type!=='constant-pressure')return {...result,limited:true,reason:'Алгоритм этой автоматики ещё не подтверждён',heater:heaterState(config,state,result)};
   const canStart=off.total>=pump.auto.onFlow;
   if(!canStart){result.reason='Естественный проток ниже порога запуска насоса';}
   else if(!pump.curve?.length){result.limited=true;result.reason='Нет проверенной характеристики H(Q)';}
   else{
    let lo=inlet,hi=inlet+Math.max(...pump.curve.map(p=>p[1]))*config.barPerMetre;
    // A pressure controller can reduce speed; it cannot exceed the full-speed curve.
    const setpoint=pump.regulation?clamp(state.setpoint,pump.regulation.min,pump.regulation.max):null;
    if(setpoint!=null)hi=Math.min(hi,Math.max(inlet,setpoint));
    for(let i=0;i<80;i++){
     const mid=(lo+hi)/2,load=demand(config,state,mid),h=head(pump,load.total);
     if(h==null||mid>inlet+h*config.barPerMetre)hi=mid;else lo=mid;
    }
    const p=(lo+hi)/2,load=demand(config,state,p),h=head(pump,load.total);
    const clipped=load.total>=pump.curveUsableMaxFlow-0.001||h==null;
    result={...load,pressure:p,boost:p-inlet,need,running:!clipped,limited:clipped,reason:clipped?'Нагрузка за пределами подтверждённого участка графика':setpoint!=null&&p<setpoint-0.03?'Заданное давление недостижимо при этой нагрузке':'Насос работает по протоку'};
    if(!clipped&&load.total<pump.auto.offFlow)result={...off,pressure:inlet,boost:0,need,running:false,limited:false,reason:'Проток ниже порога удержания насоса'};
   }
  }
  result.heater=heaterState(config,state,result);
  result.band=result.pressure<config.scale.normalMin?'low':result.pressure<=config.scale.normalMax?'normal':'high';
  return result;
 }
 root.PumpEngine={head,demand,solve,heaterState};
 if(typeof module!=='undefined')module.exports=root.PumpEngine;
})(globalThis);
