/* All amounts come from the same price data that renders the price list. */
const normalizeService=value=>value.toLocaleLowerCase('ru-RU').replace(/ё/g,'е').replace(/[^а-яa-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();
function serviceTokens(value){
 return normalizeService(value).split(' ').filter(Boolean).map(word=>{
  if(/^смесител/.test(word))return 'смесител';
  if(/^унитаз/.test(word))return 'унитаз';
  if(/^раковин/.test(word))return 'раковин';
  if(/^ванн/.test(word))return 'ванн';
  if(/^батаре/.test(word))return 'радиатор';
  if(/^бойлер/.test(word))return 'водонагревател';
  if(word==='монтаж'||/^установ/.test(word)||/^постав/.test(word))return 'установ';
  if(/^помен/.test(word)||/^замен/.test(word))return 'замен';
  if(/^снят/.test(word)||/^сним/.test(word))return 'демонтаж';
  return word.replace(/(ами|ями|ого|ему|ому|ов|ей|ый|ий|ая|ое|ые|ую|а|я|ы|и|у|ю|е|ь)$/,'');
 }).filter(word=>!['нужн','надо','мне','хочу','в','на','для','и','к','с'].includes(word));
}
const calculatorChoices=[...replacementJobs,...allPriceJobs.slice(0,-1).map(job=>({id:'single-'+job.id,name:job.name,jobs:[job.id]}))];
function searchServiceChoices(query){
 const tokens=serviceTokens(query);
 if(!tokens.length)return replacementJobs;
 return calculatorChoices.filter(choice=>{const words=serviceTokens(choice.name);return tokens.every(token=>words.some(word=>word.startsWith(token)||(word.length>=4&&token.startsWith(word))));});
}
const selectedJobs=new Set();
function toggleEstimateJobs(ids,checked){ids.forEach(id=>{if(!allPriceJobs.some(job=>job.id===id))return;checked?selectedJobs.add(id):selectedJobs.delete(id);});}
function currentEstimate(){const rows=allPriceJobs.filter(job=>selectedJobs.has(job.id));return {rows,total:rows.reduce((sum,job)=>sum+job.amount,0),from:rows.some(job=>job.from)};}
const taskInput=document.querySelector('#estimate-task');
if(taskInput){
 const options=document.querySelector('#estimate-options'),count=document.querySelector('#estimate-match-count'),basket=document.querySelector('#estimate-selected'),empty=document.querySelector('#estimate-empty'),result=document.querySelector('#estimate-result'),clear=document.querySelector('#estimate-clear');
 const seenJobs=new Set(),basketNodes=new Map();
 const tripId=allPriceJobs.at(-1).id;
 const money=value=>value.toLocaleString('ru-RU')+' ₽';
 function updateSelectionButtons(){
  document.querySelectorAll('.prices-page input[type=checkbox]').forEach(input=>{
   let wrapper=input.closest('.selection-toggle');
   if(!wrapper){wrapper=document.createElement('span');wrapper.className='selection-toggle';input.before(wrapper);wrapper.append(input);const caption=document.createElement('span');caption.className='selection-caption';caption.setAttribute('aria-hidden','true');wrapper.append(caption);}
   wrapper.querySelector('.selection-caption').textContent=input.checked?'− Убрать':input.indeterminate?'+ Дополнить':'+ Добавить';
  });
 }
 function renderOptions(){
  options.replaceChildren();const choices=searchServiceChoices(taskInput.value);
  count.textContent=taskInput.value.trim()?(choices.length?'Подходящих вариантов: '+choices.length:'Ничего не найдено. Попробуйте другое слово или выберите работу в прайсе выше.'):'Частые задачи';
  choices.forEach(choice=>{
   const label=document.createElement('label');label.className='estimate-option';
   const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.dataset.choice=choice.id;checkbox.checked=choice.jobs.every(id=>selectedJobs.has(id));
   const text=document.createElement('span');text.textContent=choice.name;
   if(choice.jobs.length>1){const detail=document.createElement('small');detail.textContent='Демонтаж + установка';text.append(detail);}
   label.append(checkbox,text);options.append(label);
  });
  updateSelectionButtons();
 }
 function syncEstimate(){
  const estimate=currentEstimate();
  estimate.rows.forEach(job=>{if(job.id!==tripId)seenJobs.add(job.id);});
  seenJobs.forEach(id=>{
   if(basketNodes.has(id))return;
   const job=allPriceJobs.find(job=>job.id===id),label=document.createElement('label'),checkbox=document.createElement('input'),name=document.createElement('span'),amount=document.createElement('strong');
   label.className='estimate-selected-row';checkbox.type='checkbox';checkbox.dataset.job=id;name.textContent=job.name;amount.textContent=(job.from?'от ':'')+money(job.amount);label.append(checkbox,name,amount);basket.append(label);basketNodes.set(id,label);
  });
  document.querySelectorAll('input[data-job]').forEach(input=>{input.checked=selectedJobs.has(input.dataset.job);});
  document.querySelectorAll('input[data-choice]').forEach(input=>{
   const choice=calculatorChoices.find(item=>item.id===input.dataset.choice);if(!choice)return;
   const n=choice.jobs.filter(id=>selectedJobs.has(id)).length;input.checked=n===choice.jobs.length;input.indeterminate=n>0&&n<choice.jobs.length;
  });
  basketNodes.forEach((label,id)=>label.classList.toggle('not-included',!selectedJobs.has(id)));
  empty.hidden=seenJobs.size>0;
  result.replaceChildren();const total=document.createElement('p');total.className='estimate-total';total.textContent=estimate.rows.length?'Предварительно: '+(estimate.from?'от ':'')+money(estimate.total):'Выберите работы для расчёта';result.append(total);
  clear.disabled=selectedJobs.size===0;
  updateSelectionButtons();
  document.querySelectorAll('[data-price-group]').forEach(group=>{
   const link=group.querySelector('.price-to-calc');const included=estimate.rows.some(job=>job.group===Number(group.dataset.priceGroup));link.hidden=!included;
   if(included)link.textContent='К расчёту: '+(estimate.from?'от ':'')+money(estimate.total)+' ↓';
  });
 }
 document.querySelector('.prices-page').addEventListener('change',event=>{
  const input=event.target;if(input.type!=='checkbox')return;
  if(input.dataset.job)toggleEstimateJobs([input.dataset.job],input.checked);
  else if(input.dataset.choice){const choice=calculatorChoices.find(item=>item.id===input.dataset.choice);if(choice)toggleEstimateJobs(choice.jobs,input.checked);}
  else return;
  syncEstimate();
 });
 taskInput.addEventListener('input',renderOptions);
 taskInput.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();options.querySelector('input')?.focus();}});
 clear.addEventListener('click',()=>{selectedJobs.clear();syncEstimate();});
 renderOptions();syncEstimate();
}
const siteHeader=document.querySelector('header');
if(siteHeader && typeof ResizeObserver!=='undefined')new ResizeObserver(entries=>{document.documentElement.style.setProperty('--header',Math.ceil(entries[0].target.getBoundingClientRect().height)+'px');}).observe(siteHeader);
if(location.hash==='#calculator')requestAnimationFrame(()=>requestAnimationFrame(()=>{
 const panel=document.querySelector('#calculator');if(panel){panel.focus({preventScroll:true});panel.scrollIntoView({block:'start',behavior:'auto'});}
}));
