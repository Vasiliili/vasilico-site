(function(){
 const C=structuredClone(PUMP_DATA),E=PumpEngine,$=id=>document.getElementById(id),baseNetwork=structuredClone(C.network);
 let state={pump:C.defaultPump,active:[...C.initialFixtures],hot:false,hotTarget:C.heater.defaultTarget,setpoint:2.5};
 const number=x=>Number(x).toLocaleString('ru-RU',{maximumFractionDigits:1,minimumFractionDigits:1});
 const paths={tap:'M13 47h38M22 47V22c0-17 24-17 24 0v5M40 27h12M23 36h10M29 36v-7',basin:'M7 31h50c-2 13-48 13-50 0ZM26 41v15h12V41M30 29V14h13v6M27 12h9',shower:'M11 56V16c0-14 29-14 29 0M27 20h26l-4-6H31ZM30 29v4m10-4v4m10-4v4m-20 7v4m10-4v4m10-4v4',toilet:'M9 10h22v25H9ZM17 18h7M29 29h27v9c0 9-14 12-24 8L24 56H15V35M28 35h28',washer:'M12 5h40v54H12ZM12 17h40M18 11h2m6 0h2m16 0h2M44 37a12 12 0 1 1-24 0 12 12 0 1 1 24 0ZM21 38c10-7 12 7 22-1',heater:'M17 5h30v46H17ZM25 5V1m13 4V1M25 51v10m14-10v10M25 15h14M31 22c1 9-9 10-5 17 4 6 14 1 11-6-1-4-6-5-6-11Z'};
 const icon=id=>`<svg viewBox="0 0 64 64" aria-hidden="true"><path d="${paths[id]}" fill="${['washer','heater','toilet','basin'].includes(id)?'#fffdf8':'none'}"></path>${id==='washer'?'<circle cx="32" cy="37" r="9" fill="#b9d6e4" stroke="none"/><path d="M24 38q4-5 8 0t8 0" stroke="#365c7b"/>':''}</svg>`;
 function gauge(id){let ticks='';for(let i=0;i<=50;i++){const a=(-225+i*5.4)*Math.PI/180,r1=i%5?81:75;ticks+=`<line x1="${100+Math.cos(a)*r1}" y1="${100+Math.sin(a)*r1}" x2="${100+Math.cos(a)*87}" y2="${100+Math.sin(a)*87}" stroke="#53645d" stroke-width="${i%5?1:2}"/>`;if(i%10===0){ticks+=`<text x="${100+Math.cos(a)*61}" y="${108+Math.sin(a)*61}" text-anchor="middle" font-size="22" fill="#27343b">${i/5}</text>`;}}
  return `<svg viewBox="0 0 200 190" role="img" aria-label="Манометр от 0 до 10 бар"><circle cx="100" cy="100" r="91" fill="#fffdf8" stroke="#83958a" stroke-width="4"/>${ticks}<text x="100" y="147" text-anchor="middle" font-size="20" fill="#616864">бар</text><g class="needle" id="${id}" style="transform:rotate(-225deg)"><path d="M87 97 L171 100 L87 103Z" fill="#a64d3d"/></g><circle cx="100" cy="100" r="6" fill="#27343b"/></svg>`;
 }
 $('out-gauge').innerHTML=gauge('needle-out');$('in-gauge').innerHTML=gauge('needle-in');
 $('pump-model').innerHTML=C.pumps.map(p=>`<option value="${p.id}">${p.manufacturer} ${p.model} · ${p.frequencyHz} Гц</option>`).join('')+'<option value="none">Без насоса — для сравнения</option>';
 $('pump-model').value=state.pump;
 $('inlet-pressure').innerHTML=C.inletOptions.map(v=>`<option value="${v}">${number(v)} бар</option>`).join('');$('inlet-pressure').value=String(C.inletBar);
 $('fixtures').innerHTML=C.fixtures.map(f=>`<button class="fixture" type="button" data-id="${f.id}" aria-pressed="false">${icon(f.icon)}<b>${f.name}</b><span class="switch-label">Закрыто</span></button>`).join('')+`<button class="fixture heater-fixture" type="button" data-id="heater" aria-pressed="false">${icon('heater')}<b>Газовая колонка</b><span class="switch-label">Выключена</span></button>`;
 $('hot-target').innerHTML=C.fixtures.filter(f=>f.hot).map(f=>`<option value="${f.id}">${f.name}</option>`).join('');
 $('flow-settings').innerHTML=C.fixtures.map(f=>`<label>${f.name}, л/мин при ${number(C.referenceBar)} бар<input type="number" data-flow="${f.id}" min="1" max="20" step="0.5" value="${f.referenceFlow}"></label>`).join('');
 function update(){
  const r=E.solve(C,state),pump=C.pumps.find(p=>p.id===state.pump);
  document.querySelector('.supply strong').textContent='На входе '+number(C.inletBar)+' бар';$('inlet-pressure').value=String(C.inletBar);
  $('pump-verdict').hidden=!pump;if(pump)$('pump-verdict').innerHTML='<h2>Итог по '+pump.manufacturer+' '+pump.model+'</h2><dl class="verdict-list">'+(pump.summary||[]).map(([k,v])=>'<div><dt>'+k+'</dt><dd>'+v+'</dd></div>').join('')+'</dl><p>Сначала проверяем, подходит ли насос по расходу и давлению, затем сравниваем удобство, обслуживание и стоимость. Подробные источники — в паспортных данных и отзывах выше.</p>';
  const a=pump?.assessment;$('pump-assessment').hidden=!a;if(a)$('pump-assessment').innerHTML=`<h2>Опыт и отзывы</h2><strong class="quality-badge">${a.badge}</strong><p>${a.experience}</p><div class="review-grid">${a.reviews.map(v=>`<a href="${v.url}" target="_blank" rel="noopener"><b>${v.name}: ${v.score}</b><span>${v.count}</span></a>`).join('')}</div><p>${a.positive}</p><p>${a.negative}</p><p class="small">Снимок оценок на ${a.date}. Рейтинги площадок не объединяются. Пригодность для вашего дома определяется отдельно по давлению, расходу и паспорту.</p>`;
  document.querySelectorAll('[data-id]').forEach(b=>{const id=b.dataset.id,on=id==='heater'?state.hot:state.active.includes(id);b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));b.querySelector('.switch-label').textContent=id==='heater'?(on?'Горячая вода':'Выключена'):(on?'Открыто':'Закрыто');});
  $('heater-control').hidden=!state.hot;$('hot-target').value=state.hotTarget;
  $('pump-photo').hidden=!pump;if(pump){$('pump-photo').src=pump.image;$('pump-photo').alt=pump.manufacturer+' '+pump.model;}
  $('pump-name').textContent=pump?`${pump.manufacturer} ${pump.model}`:'Без насоса';
  const display=r.limited?'—':r.pressure.toLocaleString('ru-RU',{minimumFractionDigits:2,maximumFractionDigits:2});
  $('out-value').textContent=display+' бар';$('in-value').textContent=number(C.inletBar)+' бар';$('pressure-output').textContent=(r.limited?'':'≈ ')+display+' бар';
  $('needle-out').style.transform=`rotate(${-225+Math.min(10,r.pressure)*27}deg)`;$('needle-out').style.opacity=r.limited?'0':'1';
  $('needle-in').style.transform=`rotate(${-225+Math.min(10,C.inletBar)*27}deg)`;
  $('scale-marker').hidden=r.limited;$('scale-marker').style.left=(Math.max(0,Math.min(1,(r.pressure-C.scale.min)/(C.scale.max-C.scale.min)))*100)+'%';
  $('need-output').textContent=number(r.need)+' л/мин';$('flow-output').textContent=r.limited?'Расчёт ограничен':number(r.total)+' л/мин';
  $('pump-status').textContent=r.reason+(r.running?` · прибавка ${number(r.boost)} бар`:'');
  const warnings=[];if(r.pressure<C.scale.min)warnings.push(`Ниже ${C.scale.min} бар: проверьте требования приборов. Указатель у левого края шкалы.`);if(r.pressure>C.scale.max)warnings.push(`Выше ${C.scale.max} бар: проверьте допустимые давления приборов. Указатель у правого края шкалы.`);if(pump?.limitNote)warnings.push(pump.limitNote);if(r.limited)warnings.push('Числовой результат не показывается: требуются дополнительные паспортные данные.');
  $('range-warning').hidden=!warnings.length;$('range-warning').textContent=warnings.join(' ');
  $('heater-result').hidden=!state.hot;$('heater-result').textContent=r.heater.text+(r.heater.flow!=null?` Через колонку: ${number(r.heater.flow)} л/мин. Доступное давление в ветви: ${number(r.heater.pressure)} бар.`:'');
  $('regulation').hidden=!pump?.regulation;if(pump?.regulation){$('pressure-set').min=pump.regulation.min;$('pressure-set').max=pump.regulation.max;$('pressure-set').value=state.setpoint;$('set-value').textContent=number(state.setpoint)+' бар';}
  $('fixture-results').innerHTML=C.fixtures.map((f,i)=>`<tr><td>${f.name}${state.hot&&state.hotTarget===f.id?' · горячая':''}</td><td>${state.active.includes(f.id)?(r.limited?'—':number(r.flows[i])+' л/мин'):'Закрыто'}</td><td>${state.active.includes(f.id)?(r.limited?'—':number(r.pressures[i])+' бар'):'—'}</td></tr>`).join('');
  $('pump-specs').innerHTML=pump?`<p><b>${pump.manufacturer} ${pump.model}, ${pump.frequencyHz} Гц.</b> Максимальный паспортный напор ${pump.maxHeadM} м — это не постоянная прибавка давления. В таблице каталога: ${pump.catalogFlowLMin} л/мин при напоре ${pump.catalogFlowAtHeadM} м. Автоматический пуск по протоку от ${pump.auto.onFlow} л/мин. Регулировки давления нет.</p><p>В европейской карточке максимальное рабочее давление указано ${pump.maxOperatingBar} бар; в корейском каталоге отдельно указано максимальное входное давление ${pump.maxInletBar} бар. Эти пределы не взаимозаменяемы: перед покупкой сверяют исполнение и его инструкцию.</p>`:'<p>Насос исключён из расчёта. Те же приборы и выбранное входное давление.</p>';
  $('sources').innerHTML=(pump||C.pumps[0]).sources.map(s=>`<li><a href="${s.url}" target="_blank" rel="noopener">${s.name}</a></li>`).join('');
  $('diagram').classList.toggle('no-flow',r.total<0.01||r.limited);drawPipes();
 }
 function drawPipes(){
  const box=$('diagram').getBoundingClientRect(),relative=el=>{const b=el.getBoundingClientRect();return {x:b.x-box.x,y:b.y-box.y,w:b.width,h:b.height};};
  if(!box.width)return;
  const cards=[...$('fixtures').children].map(relative),frame=relative(document.querySelector('.pump-frame')),input=relative(document.querySelector('.inlet')),output=relative(document.querySelector('.outlet'));
  const y=frame.y+frame.h/2,rows=[];for(const c of cards){let row=rows.find(a=>Math.abs(a[0].y-c.y)<5);if(!row){row=[];rows.push(row);}row.push(c);}
  const left=5,right=box.width-5;
  let main=`M${frame.x},${y} H${left} V${rows[0][0].y+rows[0][0].h+20}`;
  rows.forEach((row,i)=>{const by=row[0].y+row[0].h+20;if(i)main+=` V${by}`;main+=` H${i%2?24:right}`;});
  let branches=cards.map(c=>`M${c.x+c.w/2},${c.y+c.h+20} V${c.y+c.h}`).join(' ');
  const inputPath=`M${right},${y+68} V${y} H${frame.x+frame.w}`;
  // The schematic connects only to the outer frame, never to the photo's ports.
  let arrows=`<text x="${frame.x-15}" y="${y+24}" text-anchor="end" font-size="23" fill="#365c7b">←</text><text x="${frame.x+frame.w+18}" y="${y+24}" font-size="23" fill="#365c7b">←</text>`;
  rows.forEach((row,i)=>{arrows+=`<text x="${box.width/2}" y="${row[0].y+row[0].h+35}" text-anchor="middle" font-size="22" fill="#365c7b">${i%2?'←':'→'}</text>`;});
  $('pipes').setAttribute('viewBox',`0 0 ${box.width} ${box.height}`);
  $('pipes').innerHTML=`<path class="pipe-base" d="${main} ${branches} ${inputPath}"/><path class="pipe-flow" d="${main} ${inputPath}"/>${arrows}<path d="M${right-8} ${y+45}l8 8 8-8v16l-8-8-8 8z" fill="#ae6b30"/><path d="M${right} ${y+53}h-13m-2-8v16" stroke="#a64d3d" stroke-width="4"/>`;
 }
 $('fixtures').addEventListener('click',e=>{const b=e.target.closest('[data-id]');if(!b)return;let id=b.dataset.id;if(id==='heater'){state.hot=!state.hot;if(state.hot&&!state.active.includes(state.hotTarget))state.active.push(state.hotTarget);}else{state.active=state.active.includes(id)?state.active.filter(x=>x!==id):[...state.active,id];}update();});
 $('hot-target').addEventListener('change',e=>{state.hotTarget=e.target.value;if(!state.active.includes(state.hotTarget))state.active.push(state.hotTarget);update();});
 $('pump-model').addEventListener('change',e=>{state.pump=e.target.value;update();});
 $('inlet-pressure').addEventListener('change',e=>{const v=Number(e.target.value);if(C.inletOptions.includes(v)){C.inletBar=v;update();}});
 $('close-all').addEventListener('click',()=>{state.active=[];state.hot=false;update();});
 $('reset').addEventListener('click',()=>{Object.assign(C,structuredClone(PUMP_DATA));$('height').value=C.network.heightM;$('pipe-loss').value='1';document.querySelectorAll('[data-flow]').forEach(el=>el.value=C.fixtures.find(f=>f.id===el.dataset.flow).referenceFlow);state={pump:C.defaultPump,active:[...C.initialFixtures],hot:false,hotTarget:C.heater.defaultTarget,setpoint:2.5};$('pump-model').value=state.pump;update();});
 $('pressure-set').addEventListener('input',e=>{state.setpoint=Number(e.target.value);update();});
 $('height').addEventListener('input',e=>{if(e.target.value!==''&&e.target.validity.valid){C.network.heightM=Number(e.target.value);update();}});
 $('pipe-loss').addEventListener('change',e=>{const k=Number(e.target.value);C.network.segmentK=baseNetwork.segmentK.map(x=>x*k);C.network.branchK=baseNetwork.branchK*k;update();});
 $('flow-settings').addEventListener('input',e=>{if(e.target.dataset.flow&&e.target.value!==''&&e.target.validity.valid){C.fixtures.find(f=>f.id===e.target.dataset.flow).referenceFlow=Number(e.target.value);update();}});
 const zones=[...document.querySelectorAll('.scale-zone')],bounds=[C.scale.min,C.scale.normalMin,C.scale.normalMax,C.scale.max];zones.forEach((el,i)=>{el.style.background=C.scale.colors[['low','normal','high'][i]];el.querySelector('span').textContent=bounds[i]+'–'+bounds[i+1]+' бар';});$('comfort-scale').style.gridTemplateColumns=bounds.slice(1).map((b,i)=>(b-bounds[i])+'fr').join(' ');
 new ResizeObserver(drawPipes).observe($('diagram'));update();
})();
