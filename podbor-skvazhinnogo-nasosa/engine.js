(function(root){
 function normalize(s){return String(s||'').toLowerCase().replace(/ё/g,'е').replace(/бцпе/g,'бцпэ').replaceAll(',','.').replace(/[^а-яa-z0-9.]/g,'');}
 function legacy(name,d){const key=normalize(name);return d.legacy.find(x=>normalize(x.name)===key)||null;}
 function head(curve,q){if(!Number.isFinite(q)||q<curve[0][0]||q>curve.at(-1)[0])return null;for(let i=1;i<curve.length;i++){const[a,h]=curve[i-1],[b,j]=curve[i];if(q<=b)return h+(j-h)*(q-a)/(b-a);}return null;}
 function loss(q,length,diameter,k,p){const dia=diameter/1000,v=q/60000/(Math.PI*dia*dia/4),re=v*dia/p.viscosity;const f=re===0?0:re<2300?64/re:1/Math.pow(-1.8*Math.log10(Math.pow(p.roughness/dia/3.7,1.11)+6.9/re),2);return(f*length/dia+k)*v*v/(2*p.g);}
 function solve(s,d){
 const incomplete=message=>({message,complete:false,rows:[]});let q,h,basis,pumpDepthKnown=false;
 if(s.mode==='replace'){
  if(s.oldGood!=='yes')return incomplete('Если прежней подачи не хватало или это неизвестно, нужен подбор по условиям. Перейдите в «Подбираю впервые» или обсудите задачу с мастером.');
  if(s.changed!=='no')return incomplete('Условия изменились или требуют уточнения. Прежний насос остаётся подсказкой, но выбирать замену только по нему нельзя. Нужен расчёт текущей задачи.');
  const old=legacy(s.oldModel,d);
  if(s.manual){q=s.oldFlow;h=s.oldHead;basis='Данные рабочего режима, указанные посетителем';}
  else if(old){q=old.flow;h=old.head;basis='Номинальная паспортная точка '+old.name;}
  else return incomplete('Записали старый насос. Для автоматического сравнения нужно точное обозначение из базы или рабочие подача и напор из паспорта. Памятку с известными сведениями уже можно показать продавцу.');
 }else{
  q=s.flow;if(s.unknownLevel)return incomplete('Чтобы подобрать насос по напору, нужен уровень воды во время откачки. Пока можно подготовить памятку с задачей и уточнить уровень у мастера.');
  if(['level','setting','distance','pipe','height','pressure','localK'].some(k=>!Number.isFinite(s[k])))return incomplete('Заполните параметры скважины и труб или отметьте неизвестный уровень воды.');
  if(s.level<0||s.setting<=s.level||s.distance<0||s.pipe<=0||s.height<0||s.pressure<0||s.localK<0)return incomplete('Проверьте условия: насос должен быть ниже рабочего уровня воды, а размеры труб, давление и высота — допустимыми.');
  h=s.level+s.height+s.pressure/d.physics.barPerMetre+loss(q,s.setting+s.distance,s.pipe,s.localK,d.physics);basis='Предварительный расчёт по указанным условиям';pumpDepthKnown=true;
 }
 if(!Number.isFinite(q)||!Number.isFinite(h)||q<=0||h<=0)return incomplete('Нужны положительные рабочие подача и напор. Два паспортных максимума не составляют рабочую точку.');
 if(!s.unknownBore&&(!Number.isFinite(s.bore)||s.bore<=0))return incomplete('Укажите фактический внутренний диаметр или отметьте, что он неизвестен.');
 if(!s.unknownYield&&(!Number.isFinite(s.yield)||s.yield<=0))return incomplete('Укажите устойчивую подачу скважины или отметьте, что она неизвестна.');
 if(!s.unknownYield&&q>s.yield)return{...incomplete('Указанной подачи скважины не хватает для этого расхода. Нужна меньшая одновременная нагрузка или другое решение, например запас воды.'),flow:q,required:h,basis};
 const all=d.models.map(m=>{const available=head(m.curve,q),warnings=[];let eligible=available!==null&&available>=h;
 if(!s.unknownBore){if(s.bore<=m.diameter||m.minBore&&s.bore<m.minBore)eligible=false;if(!m.minBore)warnings.push('Минимальный проход скважины для этого исполнения надо подтвердить.');}
 else warnings.push('Проверить фактический внутренний диаметр скважины.');
 if(s.unknownYield)warnings.push('Уточнить устойчивую подачу скважины.');
 if(pumpDepthKnown){const submerged=s.setting-s.level;if(submerged>m.maxSubmerge||m.minSubmerge&&submerged<m.minSubmerge)eligible=false;if(!m.minSubmerge)warnings.push('Проверить минимальное погружение и охлаждение по паспорту.');}
 else warnings.push('Проверить глубину установки и охлаждение двигателя.');
 if(m.flowMin&&q<m.flowMin||m.flowMax&&q>m.flowMax)warnings.push('Рабочая точка вне рекомендованного диапазона расхода этой модели: проверить автоматику и режим работы.');
 if(available!==null&&available-h<d.closeHeadMargin)warnings.push('Небольшой запас напора — уточнить исходные данные.');
 if(s.mode==='replace'&&available!==null&&available-h>d.oldHeadExcess)warnings.push('Напор заметно выше опорного режима старого насоса: проверить всю характеристику и настройки системы.');
 return{model:m,head:available,excess:available===null?null:available-h,eligible,warnings};});
 const rows=all.filter(x=>x.eligible).sort((a,b)=>a.excess-b.excess||a.model.power-b.model.power);
 return{complete:true,flow:q,required:h,basis,category:d.classes.find(x=>q<=x.upTo)?.label||'Большой расход',rows,all,message:rows.length?'Есть образцы для проверки замены и комплектации.':'В этой базе нет подходящего образца при заданных условиях. Продавец или мастер может проверить другую модель по памятке.'};
 }
 root.BoreEngine={normalize,legacy,head,loss,solve};
})(typeof window==='undefined'?globalThis:window);
