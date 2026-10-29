/* Saved receipt snapshots never depend on later price changes. No customer data is collected. */
(function(root){
 'use strict';
 const SITE='https://vasilico.ru/',MAX_MONEY=10000000;
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const quantityText=r=>r.quantity!==undefined?r.quantity+' × '+money(r.unitAmount):'';
 const money=n=>Number(n).toLocaleString('ru-RU',{maximumFractionDigits:2})+' ₽';
 const cents=n=>Math.round(n*100),validMoney=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=MAX_MONEY&&Math.abs(n*100-Math.round(n*100))<.00001;
 function validate(v){
  if(!v||v.version!==1||typeof v.completed!=='boolean'||!Array.isArray(v.rows)||!v.rows.length||v.rows.length>100||!validMoney(v.discount))throw Error('Некорректный чек');
  const rows=v.rows.map(r=>{if(!r||typeof r.name!=='string'||!r.name.trim()||r.name.length>180||!validMoney(r.amount)||r.amount===0||typeof r.from!=='boolean')throw Error('Некорректная работа');const row={name:r.name.trim(),amount:r.amount,from:r.from};if(r.quantity!==undefined||r.unitAmount!==undefined){if(!Number.isInteger(r.quantity)||r.quantity<1||r.quantity>99||!validMoney(r.unitAmount)||r.unitAmount===0||cents(r.amount)!==cents(r.unitAmount)*r.quantity)throw Error('Некорректное количество');row.quantity=r.quantity;row.unitAmount=r.unitAmount;}return row;});
  const sum=rows.reduce((s,r)=>s+cents(r.amount),0);if(sum>MAX_MONEY*100||cents(v.discount)>sum)throw Error('Некорректная скидка');
  if(typeof v.date!=='string'||!/^\d{4}-\d{2}-\d{2}T/.test(v.date)||!Number.isFinite(Date.parse(v.date)))throw Error('Некорректная дата');
  return {version:1,rows,discount:v.discount,completed:v.completed,date:new Date(v.date).toISOString()};
 }
 function totals(v){const subtotal=v.rows.reduce((s,r)=>s+cents(r.amount),0);return {subtotal:subtotal/100,discount:v.discount,total:(subtotal-cents(v.discount))/100,from:!v.completed&&v.rows.some(r=>r.from)};}
 function day(v){return new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',year:'numeric',timeZone:'Europe/Moscow'}).format(new Date(v.date));}
 function encode(v){v=validate(v);const bytes=new TextEncoder().encode(JSON.stringify(v));let binary='';bytes.forEach(b=>binary+=String.fromCharCode(b));return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
 function decode(s){if(typeof s!=='string'||s.length>50000||!/^[-_a-zA-Z0-9]+$/.test(s))throw Error('Повреждённая ссылка');const bin=atob(s.replace(/-/g,'+').replace(/_/g,'/')),bytes=Uint8Array.from(bin,c=>c.charCodeAt(0));return validate(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)));}
 const link=v=>SITE+'chek/#r='+encode(v);
 function text(v){const t=totals(v);return ['ВАСИЛИЙ ВЛАДИМИРОВИЧ','Частный мастер · Новотитаровская','Чек по работам · '+(v.completed?'Итог согласован':'Предварительный расчёт'),day(v),'',...v.rows.map((r,i)=>(i+1)+'. '+r.name+' — '+(r.quantity!==undefined?quantityText(r)+' = ':'')+(!v.completed&&r.from?'от ':'')+money(r.amount)),'','По прайсу: '+money(t.subtotal),'Скидка: −'+money(t.discount),'ИТОГО: '+(t.from?'от ':'')+money(t.total),v.completed?'РАБОТА ВЫПОЛНЕНА':'Сумму подтверждаем до начала работ.','Материалы и оборудование оплачиваются отдельно.','Расчёт работ · не кассовый чек.','+7 (918) 246-88-52','Обращайтесь: '+SITE].join('\n');}
 function render(paper,v){
  const t=totals(v);paper.innerHTML='<div class="receipt-brand">ВАСИЛИЙ<br>ВЛАДИМИРОВИЧ</div><p class="receipt-subtitle">Частный мастер · Новотитаровская</p><p class="receipt-caption">ЧЕК ПО РАБОТАМ</p><p class="receipt-stage">'+(v.completed?'Итог согласован':'Предварительный расчёт')+'</p><p class="receipt-date">'+esc(day(v))+'</p><ol class="receipt-lines">'+v.rows.map(r=>'<li><span>'+esc(r.name)+(r.quantity!==undefined?'<small class="receipt-quantity">'+esc(quantityText(r))+'</small>':'')+'</span><strong>'+(!v.completed&&r.from?'от ':'')+money(r.amount)+'</strong></li>').join('')+'</ol><dl class="receipt-totals"><div><dt>По прайсу</dt><dd>'+money(t.subtotal)+'</dd></div><div><dt>Скидка</dt><dd>−'+money(t.discount)+'</dd></div><div class="receipt-grand"><dt>ИТОГО</dt><dd>'+(t.from?'от ':'')+money(t.total)+'</dd></div></dl>'+(v.completed?'<div class="receipt-stamp" aria-label="Работа выполнена">РАБОТА<br>ВЫПОЛНЕНА</div>':'<p class="receipt-note">Сумму подтверждаем до начала работ.</p>')+'<p class="receipt-note">Материалы и оборудование оплачиваются отдельно.</p><p class="receipt-note">Расчёт работ · не кассовый чек.</p><a class="receipt-return" href="'+SITE+'">Обращайтесь — vasilico.ru</a><a class="receipt-phone" href="tel:+79182468852">+7 (918) 246-88-52</a>';
 }
 async function png(v){
  const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');if(!ctx)throw Error('Изображение недоступно');
  const width=900,pad=64,commands=[];let y=65;
  function line(value,font='27px Arial',align='left',gap=40,color='#27343b'){ctx.font=font;commands.push({kind:'text',value,font,align,y,color});y+=gap;}
  function rule(){commands.push({kind:'rule',y});y+=28;}
  function wrap(value,max,font){ctx.font=font;const out=[];let row='';for(const word of value.split(/\s+/)){const test=row?row+' '+word:word;if(ctx.measureText(test).width<=max){row=test;continue;}if(row){out.push(row);row='';}if(ctx.measureText(word).width<=max){row=word;continue;}let part='';for(const char of word){if(ctx.measureText(part+char).width>max&&part){out.push(part);part='';}part+=char;}row=part;}if(row)out.push(row);return out;}
  line('ВАСИЛИЙ ВЛАДИМИРОВИЧ','bold 36px Arial','center',50);line('Частный мастер · Новотитаровская','24px Arial','center',45);line('ЧЕК ПО РАБОТАМ','bold 29px monospace','center',45);line(v.completed?'Итог согласован':'Предварительный расчёт','25px Arial','center');line(day(v),'24px Arial','center',50);rule();
  for(const r of v.rows){const rows=wrap(r.name,width-pad*2,'27px Arial');for(const row of rows)line(row);if(r.quantity!==undefined)line(quantityText(r),'24px Arial','left',36);line((!v.completed&&r.from?'от ':'')+money(r.amount),'bold 28px monospace','right',48);}
  rule();const t=totals(v);line('По прайсу: '+money(t.subtotal),'27px monospace','right');line('Скидка: −'+money(t.discount),'27px monospace','right',50);line('ИТОГО: '+(t.from?'от ':'')+money(t.total),'bold 35px monospace','right',60);
  if(v.completed){commands.push({kind:'stamp',y:y+48});y+=158;}else line('Сумму подтверждаем до начала работ.','24px Arial','center',45);
  for(const row of wrap('Материалы и оборудование оплачиваются отдельно.',width-pad*2,'23px Arial'))line(row,'23px Arial','center',32);
  line('Расчёт работ · не кассовый чек.','21px Arial','center',45);line('Обращайтесь — vasilico.ru','bold 30px Arial','center',43,'#246d6b');line('+7 (918) 246-88-52','25px Arial','center',45);
  canvas.width=width;canvas.height=y+20;ctx.fillStyle='#fffcf4';ctx.fillRect(0,0,width,canvas.height);
  for(const c of commands){if(c.kind==='text'){ctx.font=c.font;ctx.fillStyle=c.color;ctx.textAlign=c.align;ctx.fillText(c.value,c.align==='center'?width/2:c.align==='right'?width-pad:pad,c.y);}else if(c.kind==='rule'){ctx.strokeStyle='#9b9a90';ctx.setLineDash([7,7]);ctx.beginPath();ctx.moveTo(pad,c.y);ctx.lineTo(width-pad,c.y);ctx.stroke();ctx.setLineDash([]);}else{ctx.save();ctx.translate(width/2,c.y);ctx.rotate(-.13);ctx.strokeStyle=ctx.fillStyle='#41664d';ctx.lineWidth=4;ctx.strokeRect(-255,-52,510,102);ctx.textAlign='center';ctx.font='bold 30px monospace';ctx.fillText('РАБОТА ВЫПОЛНЕНА',0,10);ctx.restore();}}
  return new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('Не удалось создать картинку')),'image/png'));
 }
 function filename(v){return 'vasilico-chek-'+v.date.slice(0,10)+'.png';}
 function download(blob,name){const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),30000);}
 function actions(panel,get){
  const status=panel.querySelector('[data-receipt-status]'),fallback=panel.querySelector('[data-receipt-fallback]'),field=panel.querySelector('[data-receipt-link]');
  function showLink(v){fallback.hidden=false;field.value=link(v);field.focus();field.select();}
  panel.addEventListener('click',async e=>{const b=e.target.closest('[data-receipt-action]');if(!b)return;const v=get();if(!v)return;const kind=b.dataset.receiptAction;status.textContent='';
   try{if(kind==='print'){window.print();return;}if(kind==='link'||kind==='text'){const value=kind==='link'?link(v):text(v)+'\n\nОткрыть чек: '+link(v);if(!navigator.clipboard?.writeText){showLink(v);status.textContent='Выделите и скопируйте ссылку.';return;}await navigator.clipboard.writeText(value);status.textContent=kind==='link'?'Ссылка на чек скопирована.':'Текст чека скопирован.';return;}
    if(kind==='image'){download(await png(v),filename(v));status.textContent='Картинка чека сохранена. Ссылку на сайт можно отправить вместе с ней.';return;}
    if(kind==='share'){const url=link(v);if(!navigator.share){showLink(v);status.textContent='Скопируйте и отправьте эту ссылку клиенту: в открытом чеке ссылка на сайт нажимается.';return;}await navigator.share({title:'Чек по работам',text:'Чек по работам Василия Владимировича. Обращайтесь: '+SITE,url});status.textContent='Окно отправки закрыто.';}
   }catch(error){if(error.name==='AbortError')return;showLink(v);status.textContent='Не удалось выполнить действие. Можно скопировать ссылку на чек.';}
  });
 }
 function mount({panel,paper,trigger}){
  if(!panel||!paper||!trigger)return null;let value=null;const date=new Date().toISOString();
  const sheet=root.SellerSheet?.mount({trigger,panel});if(sheet){sheet.dialog.classList.add('receipt-sheet');sheet.dialog.querySelector('h2').textContent='Чек по работам';sheet.dialog.querySelector('.seller-sheet-back').textContent='Вернуться к расчёту';sheet.dialog.querySelector('.seller-sheet-close').setAttribute('aria-label','Закрыть чек и вернуться к расчёту');}
  trigger.addEventListener('click',()=>{if(!value)return;if(sheet)sheet.open();else{panel.hidden=false;panel.scrollIntoView({block:'start'});}});actions(panel,()=>value);
  return {update(estimate){trigger.disabled=!estimate.rows.length;panel.hidden=!estimate.rows.length;if(!estimate.rows.length){value=null;paper.replaceChildren();return;}value=validate({version:1,date,completed:!!estimate.completed,discount:estimate.discount,rows:estimate.rows.map(r=>({name:r.name,amount:r.amount,from:!!r.from,...(r.quantity!==undefined?{quantity:r.quantity,unitAmount:r.unitAmount}: {})}))});render(paper,value);},snapshot:()=>value&&JSON.parse(JSON.stringify(value))};
 }
 root.PriceReceipt={validate,totals,encode,decode,link,text,render,png,mount};
 const publicPanel=typeof document!=='undefined'&&document.querySelector('#receipt-public-panel');
 if(publicPanel){const err=document.querySelector('#receipt-public-error');try{const params=new URLSearchParams(location.hash.slice(1)),v=decode(params.get('r'));render(document.querySelector('#receipt-public-paper'),v);publicPanel.hidden=false;err.hidden=true;actions(publicPanel,()=>v);}catch{publicPanel.hidden=true;err.hidden=false;}}
 if(typeof module==='object')module.exports={validate,totals,encode,decode,link,text};
})(typeof window!=='undefined'?window:globalThis);
