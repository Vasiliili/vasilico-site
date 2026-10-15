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
 function regulationRange(pump,inlet){
  const r=pump?.regulation;if(!r)return null;
  const step=r.step||0.1,cap=Math.min(r.max,r.maxBoostBar==null?r.max:inlet+r.maxBoostBar);
  return {min:r.min,max:Math.max(r.min,r.min+Math.floor((cap-r.min+1e-9)/step)*step),step};
 }
 function normalizeSetpoint(pump,inlet,value){
  const r=regulationRange(pump,inlet);if(!r)return null;
  const v=Number.isFinite(value)?value:r.min;
  return clamp(r.min+Math.round((v-r.min)/r.step)*r.step,r.min,r.max);
 }
 function solve(config,state){
  const pump=config.pumps.find(x=>x.id===state.pump),inlet=config.inletBar;
  const off=demand(config,state,inlet),need=config.fixtures.filter(x=>state.active.includes(x.id)).reduce((s,x)=>s+x.referenceFlow,0);
  let result={...off,pressure:inlet,boost:0,need,running:false,limited:false,reason:need?'Без повышения давления':'Все точки закрыты; насос остановлен'};
  if(!pump&&state.pump!=='none')return {...result,limited:true,reason:'Модель насоса не найдена',heater:heaterState(config,state,result)};
  if(pump?.catalogOnly)return {...result,limited:true,reason:'Модель в каталоге — расчёт пока недоступен',heater:{kind:'unknown',text:'Оценка колонки недоступна без расчётных данных выбранного насоса'}};
  if(pump&&need){
   if(!['flow-switch','constant-pressure','pressure-switch'].includes(pump.type))return {...result,limited:true,reason:'Алгоритм этой автоматики ещё не подтверждён',heater:heaterState(config,state,result)};
   const canStart=inlet>=(pump.minInletBar||0)&&(pump.type==='flow-switch'?off.total>=pump.auto.onFlow:pump.type==='pressure-switch'?inlet<pump.auto.cutInBar:inlet<normalizeSetpoint(pump,inlet,state.setpoint));
   if(!canStart){result.reason=pump.type==='flow-switch'?'Естественный проток ниже порога запуска насоса':pump.type==='pressure-switch'?'Входное давление выше порога пуска реле — в этой схеме насос не запускается':'Входное давление не ниже уставки — повышение не требуется';}
   else if(!pump.curve?.length){result.limited=true;result.reason='Нет проверенной характеристики H(Q)';}
   else{
    let lo=inlet,hi=inlet+Math.max(...pump.curve.map(p=>p[1]))*config.barPerMetre;
    // A pressure controller can reduce speed; it cannot exceed the full-speed curve.
    const setpoint=normalizeSetpoint(pump,inlet,state.setpoint);
    if(setpoint!=null)hi=Math.min(hi,Math.max(inlet,setpoint));
    for(let i=0;i<80;i++){
     const mid=(lo+hi)/2,load=demand(config,state,mid),h=head(pump,load.total);
     if(h==null||mid>inlet+h*config.barPerMetre)hi=mid;else lo=mid;
    }
    const p=(lo+hi)/2,load=demand(config,state,p),h=head(pump,load.total);
    const clipped=load.total>=pump.curveUsableMaxFlow-0.001||h==null;
    result={...load,pressure:p,boost:p-inlet,need,running:!clipped,limited:clipped,reason:clipped?'Нагрузка за пределами подтверждённого участка графика':setpoint!=null&&p<setpoint-0.03?'Заданное давление недостижимо при этой нагрузке':pump.type==='constant-pressure'?'Поддерживается заданное давление':pump.type==='pressure-switch'?'Непрерывная работа: верхний порог реле при этой нагрузке не достигается':'Насос работает по протоку'};
    if(pump.type==='flow-switch'&&!clipped&&load.total<pump.auto.offFlow)result={...off,pressure:inlet,boost:0,need,running:false,limited:false,reason:'Проток ниже порога удержания насоса'};
    if(pump.type==='pressure-switch'&&!clipped&&p>=pump.auto.cutOutBar){
     const low=pump.auto.cutInBar,high=pump.auto.cutOutBar;
     const lowLoad=demand(config,state,low),highLoad=demand(config,state,high);
     result={...lowLoad,pressure:low,boost:low-inlet,need,running:true,limited:false,cycle:true,
      pressureRange:[low,high],highLoad,reason:'Работа циклами между порогами реле; это диапазон, не постоянное давление'};
    }
   }
  }
  result.heater=heaterState(config,state,result);
  result.band=result.pressure<config.scale.normalMin?'low':result.pressure<=config.scale.normalMax?'normal':'high';
  return result;
 }
 root.PumpEngine={head,demand,solve,heaterState,regulationRange,normalizeSetpoint};
 if(typeof module!=='undefined')module.exports=root.PumpEngine;
})(globalThis);
