(function(){
 try{
 const D=HEATER_DATA,E=HeaterEngine,$=id=>document.getElementById(id),n=(v,d=1)=>Number(v).toLocaleString('ru-RU',{maximumFractionDigits:d}),time=v=>{const m=Math.ceil(Math.max(0,v));return m<60?m+' мин':Math.floor(m/60)+' ч '+m%60+' мин';};
 let state=structuredClone(D.defaults),customVolume=false;
 $('volume-preset').innerHTML=D.volumes.map(v=>`<option value="${v}">${v} л</option>`).join('')+'<option value="custom">Свой объём</option>';
 $('scheme').insertAdjacentHTML('beforeend',D.fixtures.map(f=>`<button type="button" class="fixture" data-fixture="${f.id}" aria-pressed="false"><svg viewBox="0 0 64 64" aria-hidden="true"><path d="${f.icon}"/></svg><b>${f.name}</b><small>Не подключено</small></button>`).join(''));
 function sync(){document.querySelectorAll('[data-value]').forEach(el=>el.value=state[el.dataset.value]);$('during').checked=state.during;$('flow-preset').value=[6,8,12].includes(state.showerFlow)?String(state.showerFlow):'custom';}
 function measure(){const l=Number($('measure-litres').value),s=Number($('measure-seconds').value),valid=$('measure-litres').validity.valid&&$('measure-seconds').validity.valid&&l>0&&s>0;$('measure-result').textContent=valid?'Ваш расход: '+n(l*60/s)+' л/мин':'Введите объём и время.';$('apply-flow').disabled=!valid||l*60/s<1||l*60/s>25;return valid?l*60/s:null;}
 function update(){
  for(const f of D.fixtures){const on=state.active.includes(f.id);$(f.id+'-fields').hidden=!on;const b=document.querySelector('[data-fixture="'+f.id+'"]');b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));b.querySelector('small').textContent=on?'Подключено':'Не подключено';}
  $('volume-preset').value=customVolume||!D.volumes.includes(state.volume)?'custom':String(state.volume);$('custom-volume-wrap').hidden=!customVolume&&!(!D.volumes.includes(state.volume));
  const invalid=[...document.querySelectorAll('[data-value]')].some(x=>x.value===''||!x.validity.valid),r=E.solve(state),error=invalid?'Проверьте значения: они должны находиться в указанных диапазонах.':r.error;
  $('error').hidden=!error;$('error').textContent=error||'';$('results').hidden=!!error;if(error){$('quick-result').textContent='Проверьте настройки';$('quick-verdict').textContent=error;return;}
  $('tool-status').hidden=true;document.documentElement.dataset.heaterReady='true';
  $('temperature-summary').textContent=`бак ${n(state.stored,0)} °C · холодная ${n(state.cold,0)} °C · купание ${n(state.mixed,0)} °C`;
  $('quick-result').textContent=`${n(state.volume,0)} л в баке → ≈ ${n(r.mixedLitres,0)} л при ${n(state.mixed,0)} °C`;
  document.querySelector('.live-summary').classList.toggle('short',!r.allFit);
  const firstShort=r.rows.find(x=>!x.ok);$('quick-verdict').textContent=!r.rows.length?'Выберите, где нужна горячая вода.':r.allFit?'По расчёту хватает на выбранный сценарий.':`${firstShort.name}: ≈ ${n(firstShort.servedMinutes)} из ${n(firstShort.duration)} мин при заданном расходе.`;
  $('tank-litres').textContent=n(state.volume,0)+' л';$('tank-temp').textContent=n(state.stored,0)+' °C';$('mix-label').textContent='В кране '+n(state.mixed,0)+' °C';
  $('mixed-output').textContent='≈ '+n(r.mixedLitres,0)+' л';$('shower-output').textContent=Number.isFinite(r.showerMinutes)?'≈ '+n(r.showerMinutes)+' мин':'ТЭН покрывает расход в модели';$('heat-output').textContent='≥ '+time(r.fullHeatMinutes);
  $('mix-explanation').textContent=`${n(state.volume,0)} л при ${n(state.stored,0)} °C + холодная вода ${n(state.cold,0)} °C → теоретически ${n(r.mixedLitres,0)} л при ${n(state.mixed,0)} °C. Доля горячей воды в смеси: ${n(r.hotShare*100,0)}%. Это запас без догрева. Душ ${n(state.showerFlow)} л/мин; время душа ${state.during?'учитывает идеальный догрев':'показано без догрева'}.`;
  const verdict=$('verdict');verdict.classList.toggle('short',!r.allFit);
  if(!r.rows.length)verdict.textContent='Подключите хотя бы один прибор — тогда появится результат для вашего сценария.';
  else if(r.allFit)verdict.textContent=`В идеальной модели воды хватает на весь сценарий: ${n(r.total,0)} л при ${n(state.mixed,0)} °C. Остаток после выбранных пауз — около ${n(r.remainingLitres,0)} л смешанной воды. Сверьте полезную отдачу реального бойлера.`;
  else{const first=r.rows.find(x=>!x.ok);verdict.textContent=`Запаса не хватает. Первая нехватка: ${first.name.toLowerCase()}. При прежнем расходе получится примерно ${n(first.servedMinutes)} из ${n(first.duration)} мин. Увеличьте объём, уменьшите расход или добавьте время на нагрев между людьми.`;}
  $('stage-rows').innerHTML=r.rows.map(x=>`<tr class="${x.ok?'':'short'}"><td>${x.name}${x.pause?'<small>После него пауза '+n(x.pause,0)+' мин с нагревом</small>':''}</td><td>${n(x.litres,0)} л<small>${n(x.duration)} мин</small></td><td>${x.ok?'Хватает':n(x.servedLitres,0)+' из '+n(x.litres,0)+' л'}<div class="bar" aria-hidden="true"><span style="width:${Math.min(100,x.servedLitres/x.litres*100)}%"></span></div><small>${n(x.servedMinutes)} мин при ${n(x.flow)} л/мин</small></td></tr>`).join('');
  $('wait-output').textContent=r.rows.length?`После этого сценария восстановление полного запаса займёт теоретически не менее ${time(r.reheatMinutes)}. ${r.nextWaitMinutes==null?'Даже полный выбранный бак не обеспечит ещё один душ заданной длительности без изменения условий.':'Чтобы затем обеспечить ещё один душ '+n(state.minutes,0)+' мин, нужно не менее '+time(r.nextWaitMinutes)+' нагрева без разбора.'} Потери и автоматика могут увеличить ожидание.`:'';
  // A zero wait is explicitly represented, rather than "less than a minute".
  if(r.rows.length&&r.nextWaitMinutes===0)$('wait-output').textContent=`После сценария в модели остаётся достаточно запаса ещё на один душ ${n(state.minutes,0)} мин. Полное восстановление запаса — не менее ${time(r.reheatMinutes)} без разбора.`;
  const rec=E.recommend(state);$('minimum-output').textContent=!r.rows.length?'—':rec.minimum==null?'Больше 200 л':rec.minimum+' л';$('reserve-output').textContent=!r.rows.length?'—':rec.reserve==null?'Больше 200 л':rec.reserve+' л';
 }
 document.querySelectorAll('[data-value]').forEach(el=>el.addEventListener('input',()=>{state[el.dataset.value]=el.value===''?NaN:Number(el.value);if(el.id==='showerFlow')$('flow-preset').value=[6,8,12].includes(state.showerFlow)?String(state.showerFlow):'custom';update();}));
 $('scheme').addEventListener('click',e=>{const b=e.target.closest('[data-fixture]');if(!b)return;const id=b.dataset.fixture;state.active=state.active.includes(id)?state.active.filter(x=>x!==id):[...state.active,id];update();});
 $('volume-preset').addEventListener('change',e=>{if(e.target.value==='custom'){customVolume=true;$('custom-volume-wrap').hidden=false;$('volume').focus();return;}customVolume=false;state.volume=Number(e.target.value);$('volume').value=state.volume;update();});
 $('flow-preset').addEventListener('change',e=>{if(e.target.value==='custom'){$('showerFlow').focus();return;}state.showerFlow=Number(e.target.value);$('showerFlow').value=state.showerFlow;update();});
 $('during').addEventListener('change',e=>{state.during=e.target.checked;update();});
 document.querySelectorAll('[data-scenario]').forEach(b=>b.addEventListener('click',()=>{Object.assign(state,{people:2,minutes:8,showerFlow:8,pause:0});state.active=b.dataset.scenario==='two'?['shower']:b.dataset.scenario==='kitchen'?['shower','kitchen']:['shower','bath'];sync();update();}));
 document.querySelectorAll('a[href="#results"],a[href="#measure-flow"],a[href="#heater-start"]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();const target=$(a.getAttribute('href').slice(1));if(target.tagName==='DETAILS')target.open=true;if(!target.hidden)target.scrollIntoView?.({block:'start',behavior:'auto'});else $('error').scrollIntoView?.({block:'center'});}));
 for(const id of ['measure-litres','measure-seconds'])$(id).addEventListener('input',measure);
 $('apply-flow').addEventListener('click',()=>{const q=measure();if(q==null||$('apply-flow').disabled)return;state.showerFlow=Math.round(q*10)/10;if(!state.active.includes('shower'))state.active.push('shower');sync();update();});
 $('reset').addEventListener('click',()=>{state=structuredClone(D.defaults);customVolume=false;sync();update();});sync();measure();update();
 }catch(error){const status=document.getElementById('tool-status');if(status){status.hidden=false;status.textContent='Не удалось запустить расчёт. Обновите страницу. Если проблема остаётся, напишите мастеру через контакты ниже.';}console.error('Heater calculator failed:',error);}
})();
