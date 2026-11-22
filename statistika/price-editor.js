(() => {
 const editor = document.getElementById('price-editor');
 const form = document.getElementById('price-entry');
 const search = document.getElementById('price-search');
 const matches = document.getElementById('price-matches');
 const status = document.getElementById('price-status');
 const category = document.getElementById('price-category');
 const name = document.getElementById('price-name');
 const amount = document.getElementById('price-amount');
 const from = document.getElementById('price-from');
 const remove = document.getElementById('price-remove');
 let password = '';
 let timer;
 let busy = true;
 let session = 0;
 const endpoint = 'https://ppeggcgqevmgugqbvmrx.supabase.co/functions/v1/vasilico-price';
 async function request(body) {
  const response = await fetch(endpoint,{method:'POST',cache:'no-store',
   headers:{'Content-Type':'application/json','x-stats-token':password},body:JSON.stringify(body)});
  if (!response.ok) throw Error(response.status===401?'Войдите в статистику ещё раз.':
   response.status===409?'Предыдущая правка уже ожидает публикации.':'Не удалось проверить сохранение. Проверяю ещё раз…');
  return response.json();
 }
 const fold = value => value.toLocaleLowerCase('ru').replaceAll('ё','е').replaceAll('ь','');
 const catalog = vasilicoPriceEditor.model(priceGroups, allPriceJobs, replacementJobs,
  servicePresets, tripPriceJob, diagnosisPriceJob);
 let active = null;


 function button(label, action) {
  const control = document.createElement('button');
  control.type = 'button';
  control.textContent = label;
  control.onclick = action;
  return control;
 }

 for (const group of catalog.groups) category.add(new Option(group.name, group.id));
 function result(group) {
  return catalog.groups.find(item => item.id === group)?.name;
 }
 function renderSearch() {
  const terms = fold(search.value).trim().split(/\s+/).filter(Boolean);
  matches.replaceChildren();
  if (!terms.length) return;
  const jobs = catalog.jobs.filter(job =>
   terms.every(term => fold(job.name + ' ' + result(job.group)).includes(term)));
  for (const job of jobs.slice(0, 12)) {
   matches.append(button(job.name + ' · ' + (job.from ? 'от ' : '') + priceMoney(job.amount), () => start(job)));
  }
  if (!jobs.length) matches.textContent = 'Совпадений нет.';
  if (jobs.length > 12) matches.append('Уточните поиск, чтобы увидеть остальные позиции.');
 }
 function start(job) {
  if (busy) return;
  active = job;

  form.hidden = false;
  name.readOnly = category.disabled = Boolean(job);
  name.value = job?.name ?? '';
  category.value = String(job?.group ?? catalog.groups[0].id);
  amount.value = job?.amount ?? '';
  from.checked = job?.from ?? true;
  remove.hidden = !job || job.required;
  document.getElementById('price-remove-note').hidden = !job?.required;
  (job ? amount : name).focus();
 }
 function lock(value) {
  busy = value;
  for (const element of [search,document.getElementById('price-add'), ...form.querySelectorAll('button')]) element.disabled=value;
 }
 async function refresh(run) {
  if(run!==session) return;
  clearTimeout(timer);
  try {
   const row=await request({action:'latest'});
   if(run!==session) return;
   if (!row) { lock(false); status.textContent=''; return; }
   if (row.state==='failed') {lock(false); status.textContent='Правка не прошла проверку. Выберите позицию и исправьте её.';return;}
   if (row.state==='submitted') {
    const res=await fetch('/api/public/v1.json?t='+Date.now(),{cache:'no-store'});
    if (!res.ok) throw Error('Проверяю опубликованный прайс…');
    const {prices}=await res.json();
    if(run!==session) return;
    if(!Array.isArray(prices)||!prices.length) throw Error('Проверяю опубликованный прайс…');
    const [change]=row.patch.changes;
    const live=prices.find(job=>change.type==='add'?job.name===change.name:job.id===change.id);
    if(change.type==='remove'?!live:live?.amount===change.amount && live.from===change.from){
     const old=catalog.jobs.find(job=>job.id===(live?.id??change.id));
     if(change.type==='remove' && old) catalog.jobs.splice(catalog.jobs.indexOf(old),1);
     if(live && old) Object.assign(old,{amount:live.amount,from:live.from});
     if(live && !old) catalog.jobs.push({...live,group:change.group,required:false});
     lock(false);renderSearch();status.textContent='Опубликовано. '+change.name;return;
    }
    if(Date.now()-Date.parse(row.created_at)>3600000) {
     lock(false); status.textContent='Публикация отправлена, но цена на сайте отличается. Проверьте позицию перед следующей правкой.';return;
    }
   }
   status.textContent='Правка сохранена. Публикация проверяется каждые 20 минут. Можно закрыть страницу.';
  } catch(error) {if(run!==session)return;status.textContent=error.message;}
  timer=setTimeout(()=>refresh(run),30000);
 }
 async function save(change) {
  if(busy) return;
  const run=session;
  try {
   const patch={version:1,changes:[change]};
   vasilicoPriceEditor.validate(patch,catalog);
   lock(true);status.textContent='Сохраняю…';
   await request({action:'save',id:crypto.randomUUID(),patch});
   if(run!==session)return;
   form.hidden=true;await refresh(run);
  } catch(error) {
   if(run!==session)return;
   status.textContent=error.message;
   if(busy) timer=setTimeout(()=>refresh(run),4000);
  }
 }
 const state=()=>({id:active.id,name:active.name,previousAmount:active.amount,previousFrom:active.from});
 search.addEventListener('input',renderSearch);
 document.getElementById('price-add').onclick=()=>start(null);
 document.getElementById('price-cancel').onclick=()=>{form.hidden=true;};
 form.onsubmit=event=>{
  event.preventDefault();
  const price={amount:amount.valueAsNumber,from:from.checked};
  save(active?{type:'update',...state(),...price}:{type:'add',group:Number(category.value),name:name.value.trim(),...price});
 };
 remove.onclick=()=>{if(active && confirm('Убрать «'+active.name+'» из прайса?')) save({type:'remove',...state()});};
 window.vasilicoPriceEditorVisible=(visible,token='')=>{
  editor.hidden=!visible;
  if(visible && password===token)return;
  password=token;session++;clearTimeout(timer);lock(true);form.hidden=true;
  search.value='';status.textContent='';renderSearch();
  if(visible)refresh(session);
 };
})();
