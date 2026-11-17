(() => {
 'use strict';
 const endpoint='https://ppeggcgqevmgugqbvmrx.supabase.co/functions/v1/vasilico-schedule';
 const anon="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwZWdnY2dxZXZtZ3VncWJ2bXJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0NzEwODUsImV4cCI6MjEwNzA0NzA4NX0.4ycZAVoiRVc2aWlxxntfpVSPoM2kuF1ooSzd0u7LBx0";
 const days=['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
 const request=(body,token)=>fetch(endpoint,{method:'POST',cache:'no-store',headers:{Authorization:'Bearer '+anon,apikey:anon,'Content-Type':'application/json',...(token?{'x-stats-token':token}:{})},body:JSON.stringify(body)});
 const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Moscow',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const format=s=>{
  const selected=days.filter((_,i)=>s.days[i]);
  return {day: selected.length===7?'Ежедневно':selected.length?selected.join(', '):'Нет рабочих дней',contact:s.contactStart+'–'+s.contactEnd,work:s.workStart+'–'+s.workEnd,notice:s.notice&&(!s.until||today()<=s.until)?s.notice:'',until:s.until};
 };
 const create=(tag,text)=>{const e=document.createElement(tag); e.textContent=text; return e;};
 function show(host,s,full){
  const f=format(s);host.replaceChildren();
  if(f.notice){const n=create('p',f.notice);n.className='availability-notice';host.append(n);if(f.until)host.append(create('div','Действует до '+f.until.split('-').reverse().join('.')+' включительно'));}
  host.append(create('div','Для связи: '+f.day+', '+f.contact+' · МСК'));
  if(full){host.append(create('div','Время работы: '+f.day+', '+f.work));const off=days.filter((_,i)=>!s.days[i]);if(off.length)host.append(create('div','Выходные: '+off.join(', ')));}
 }
 function mount(){
  const targets=[...document.querySelectorAll('.hero-contact-hours,.contact-hours')];
  if(!targets.length)return;
  for(const el of targets){el.replaceChildren(create('span','Уточните график по телефону'));el.setAttribute('aria-live','polite');}
  request({action:'read'}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(({schedule})=>targets.forEach(el=>show(el,schedule,el.classList.contains('contact-hours')))).catch(()=>{});
 }
 window.vasilicoScheduleAdmin=async(token)=>{
  const host=document.getElementById('schedule-admin');if(!host)return;host.hidden=false;host.replaceChildren(create('p','Загружаю расписание…'));
  try{
   const response=await request({action:'read'});if(!response.ok)throw Error();const {schedule}=await response.json();renderAdmin(host,schedule,token);
  }catch{host.replaceChildren(create('p','Не удалось загрузить расписание. Проверьте интернет и обновите страницу.'));}
 };
 function renderAdmin(host,s,token){
  host.innerHTML='<h2>Расписание и доступность</h2><p>Выберите рабочие дни и время по Москве.</p><form id="schedule-form"><fieldset><legend>Рабочие дни</legend><div id="schedule-days" class="controls"></div></fieldset><div class="schedule-times"><label>Для связи с <input name="contactStart" type="time" required></label><label>до <input name="contactEnd" type="time" required></label><label>Работа с <input name="workStart" type="time" required></label><label>до <input name="workEnd" type="time" required></label></div><label for="schedule-notice">Временное сообщение для посетителей</label><select id="schedule-presets"><option value="">Выберите готовый вариант или напишите свой</option><option>Сегодня на звонки ответить не смогу</option><option>Временно не принимаю заказы</option><option>Сейчас без машины. Работаю по Новотитаровской</option></select><textarea id="schedule-notice" rows="3" maxlength="240" placeholder="Например: буду на связи с понедельника"></textarea><label for="schedule-until">Показывать по эту дату включительно (необязательно)</label><input type="date" id="schedule-until"><p class="muted">Без даты сообщение будет показываться, пока вы его не уберёте. Время московское.</p><div class="controls"><button type="button" id="schedule-preview">Посмотреть</button><button type="submit">Сохранить</button><button type="button" id="schedule-clear">Убрать сообщение</button></div><p id="schedule-status" role="status" aria-live="polite"></p><div id="schedule-preview-box" class="card" hidden></div></form>';
  const form=host.querySelector('form'), daybox=host.querySelector('#schedule-days'), notice=host.querySelector('#schedule-notice'), until=host.querySelector('#schedule-until'), status=host.querySelector('#schedule-status'), preview=host.querySelector('#schedule-preview-box');
  days.forEach((name,i)=>{const label=document.createElement('label'),box=document.createElement('input');box.type='checkbox';box.checked=s.days[i];box.name='day';label.append(box,document.createTextNode(' '+name));daybox.append(label);});
  for(const k of ['contactStart','contactEnd','workStart','workEnd'])form.elements[k].value=s[k];notice.value=s.notice;until.value=s.until;
  host.querySelector('#schedule-presets').onchange=e=>{if(e.target.value)notice.value=e.target.value;};
  const values=()=>({days:[...form.querySelectorAll('[name=day]')].map(el=>el.checked),contactStart:form.elements.contactStart.value,contactEnd:form.elements.contactEnd.value,workStart:form.elements.workStart.value,workEnd:form.elements.workEnd.value,notice:notice.value.trim(),until:notice.value.trim()?until.value:''});
  host.querySelector('#schedule-preview').onclick=()=>{preview.hidden=false;show(preview,values(),true);};
  host.querySelector('#schedule-clear').onclick=()=>{notice.value='';until.value='';status.textContent='Сообщение убрано из формы. Нажмите «Сохранить».';};
  form.onsubmit=async e=>{e.preventDefault();const v=values();if(v.contactStart>=v.contactEnd||v.workStart>=v.workEnd){status.textContent='Время окончания должно быть позже времени начала.';return;}status.textContent='Сохраняю…';for(const b of form.querySelectorAll('button'))b.disabled=true;try{const r=await request({action:'write',schedule:v},token);if(!r.ok)throw Error();const result=await r.json();const check=await request({action:'read'});if(!check.ok)throw Error();const actual=(await check.json()).schedule;if(['contactStart','contactEnd','workStart','workEnd','notice','until'].some(k=>actual[k]!==result.schedule[k]) || actual.days.some((v,i)=>v!==result.schedule.days[i]))throw Error();status.textContent='Сохранено. Посетители увидят новое расписание.';show(preview,actual,true);preview.hidden=false;}catch{status.textContent='Не удалось подтвердить сохранение. Проверьте интернет и обновите страницу.';}finally{for(const b of form.querySelectorAll('button'))b.disabled=false;}};
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
