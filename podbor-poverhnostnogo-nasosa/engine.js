/* Pure duty-point screening, not a pump controller or a full suction model. */
(function(root){
 const ids=['lift','flow','pressure','height','suctionLength','suctionDiameter','deliveryLength','deliveryDiameter','suctionK','deliveryK','yield'];
 function loss(q,length,diameter,k,p){const d=diameter/1000,v=(q/60000)/(Math.PI*d*d/4),re=v*d/p.viscosity;const f=re===0?0:re<2300?64/re:1/Math.pow(-1.8*Math.log10(Math.pow(p.roughness/d/3.7,1.11)+6.9/re),2);return(f*length/d+k)*v*v/(2*p.g);}
 function head(curve,q){if(q<curve[0][0]||q>curve[curve.length-1][0])return null;for(let i=1;i<curve.length;i++){const[a,h]=curve[i-1],[b,j]=curve[i];if(q<=b)return h+(j-h)*(q-a)/(b-a);}return curve[curve.length-1][1];}
 function calculate(s,data){
 if(ids.some(k=>!Number.isFinite(s[k])))return{error:'Заполните все числовые поля.'};
 if(s.flow<=0||s.pressure<0||s.height<0||s.suctionLength<=0||s.deliveryLength<0||s.suctionDiameter<=0||s.deliveryDiameter<=0||s.suctionK<0||s.deliveryK<0||s.yield<=0)return{error:'Проверьте расход, размеры труб и давление: значения не должны быть отрицательными или нулевыми там, где нужна величина.'};
 if(s.unknownLevel)return{error:'Для подбора нужен уровень воды во время откачки. Уточните его или обратитесь к мастеру — по общей глубине колодца насос не подбирают.'};
 if(s.suctionLength<Math.max(0,s.lift))return{error:'Длина трубы до насоса не может быть меньше высоты подъёма воды.'};
 if(s.deliveryLength<s.height)return{error:'Длина трубы после насоса не может быть меньше подъёма до крана.'};
 const p=data.physics,suctionLoss=loss(s.flow,s.suctionLength,s.suctionDiameter,s.suctionK,p),deliveryLoss=loss(s.flow,s.deliveryLength,s.deliveryDiameter,s.deliveryK,p),required=s.lift+s.height+s.pressure/p.barPerMetre+suctionLoss+deliveryLoss;
 return{required,suctionLoss,deliveryLoss,rows:data.models.map(m=>{const h=head(m.curve,s.flow),margin=h===null?null:h-required;let state='ok',verdict='По напору хватает. Всасывание и источник ещё нужно проверить.';
 if(h===null){state='unknown';verdict='Этот расход за пределами опубликованного графика. Сравнение недоступно.';}
 else if(margin<0){state='bad';verdict='При выбранном расходе требуемого напора не хватает.';}
 else if(margin<data.headMargin){state='warn';verdict='Запас напора небольшой. Уточните трубы и фактические условия.';}
 if(s.lift>m.maxLift){state='bad';verdict='Уровень ниже заявленной высоты всасывания этой модели. Обычная поверхностная установка не подходит.';}
 else if(s.lift+suctionLoss>=data.suctionCaution&&state!=='bad'&&h!==null){state='warn';verdict='Всасывание требует отдельной проверки: подъём и потери велики. Достаточный напор не гарантирует подачу.';}
 if(!s.unknownYield&&s.flow>s.yield){state='bad';verdict='Запрошенный расход превышает указанную подачу источника. Более мощный насос проблему не решает.';}
 return{model:m,head:h,margin,state,verdict,pressure:h===null?null:Math.max(0,(h-s.lift-s.height-suctionLoss-deliveryLoss)*p.barPerMetre)};})};
 }
 root.SurfaceEngine={loss,head,calculate};
})(typeof window==='undefined'?globalThis:window);
