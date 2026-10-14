/* Editable demonstration assumptions; flows are NOT appliance specifications. */
globalThis.PUMP_DATA = {
 version:2, scenario:'central', inletBar:1, inletOptions:[0.5,0.7,1,1.5], barPerMetre:0.0980665,
 referenceBar:2.5, defaultPump:'pb201ea', initialFixtures:['kitchen'],
 scale:{min:1,max:4,normalMin:2,normalMax:3,colors:{low:'#a64d3d',normal:'#40694f',high:'#ae6b30'}},
 network:{segmentK:[0.00010,0.00010,0.00010,0.00010,0.00010],branchK:0.0005,heightM:0,offPumpK:0},
 fixtures:[
  {id:'kitchen',name:'Кухня',detail:'Смеситель',icon:'tap',referenceFlow:8,hot:true},
  {id:'basin',name:'Умывальник',detail:'Смеситель',icon:'basin',referenceFlow:6,hot:true},
  {id:'shower',name:'Душ',detail:'Обычная лейка',icon:'shower',referenceFlow:10,hot:true},
  {id:'toilet',name:'Унитаз',detail:'Набор бачка',icon:'toilet',referenceFlow:4,hot:false},
  {id:'washer',name:'Стиральная машина',detail:'Набор воды',icon:'washer',referenceFlow:6,hot:false}
 ],
 heater:{id:'heater',name:'Газовая колонка',defaultTarget:'kitchen',model:null,minPressure:null,minFlow:null,lossK:null,margin:1.2},
 pumps:[{
  id:'pb201ea',manufacturer:'Wilo',model:'PB-201EA',frequencyHz:50,type:'flow-switch',image:'assets/wilo-pb201ea.png',
  maxHeadM:15, catalogFlowLMin:65, catalogFlowAtHeadM:0.5, maxInletBar:2,maxOperatingBar:2,
  curve:[[0,15],[10,14.7],[20,13.5],[30,11.8],[40,9.6],[50,7],[60,4.1],[70,1]],
  curveUsableMaxFlow:60, curveMethod:'Приближённо снято с графика производителя, печатная стр. 15. Не заводская таблица.',
  auto:{onFlow:2,offFlow:2}, regulation:null,
  summary:[['Долговечность','Положительный опыт мастера и владельцев. Срок службы в годах не обещаем: статистики отказов нет.'],['Уровень шума','В отзывах часто называют тихим. В инструкции Wilo указан максимум 62 дБ(А); это не замер в вашем доме. Монтаж влияет на передачу вибрации.'],['Габариты','Для исполнения 3068136: 246 × 240 × 194 мм (Д × Ш × В), масса около 7,5 кг. Для другого артикула размеры сверяют отдельно.'],['Потребляемая мощность','Значение P1 уточняется по шильдику конкретного исполнения. Указанные в каталоге 200 Вт относятся к мощности двигателя P2 и не заменяют потребление из сети.'],['Стоимость','Цена в местных магазинах пока уточняется. Насос, комплектующие и работа мастера считаются отдельно.']],
  assessment:{badge:'Проверен в практике мастера',experience:'Василий Владимирович устанавливает насосы этого типа много лет. По его словам, за 14 лет работы жалоб от его клиентов не было. Это личный опыт, а не статистика отказов или гарантия для любого дома.',date:'15.10.2026',positive:'Покупатели отмечают тихую работу и повышение напора; есть сообщения о длительном сроке службы.',negative:'Встречаются жалобы на датчик протока, размеры и стоимость. Отзывы не позволяют вычислить вероятность поломки.',reviews:[{name:'ВсеИнструменты',score:'4,8 из 5',count:'16 отзывов',url:'https://www.vseinstrumenti.ru/product/nasos-dlya-vodosnabzheniya-wilo-pb-201-ea-3059254-1311778/otzyvy/'},{name:'Яндекс Отзывы',score:'4,6 из 5',count:'108 оценок · 33 отзыва',url:'https://reviews.yandex.ru/product/nasos-wilo-pb-201ea--103079114545'}]},
  limitNote:'Документы для PB-201EA расходятся: инструкция Wilo 2018 года указывает вход до 0,7 бар и рабочее давление до 2,2 бар; другие карточки и каталоги приводят иные пределы. Исполнение не установлено. Расчёт показывает гидравлику, но не подтверждает допустимость режима для конкретного насоса.',

  sources:[{name:'Wilo: инструкция 2018 года, таблица допустимых давлений',url:'https://cdn.vseinstrumenti.ru/instruction/nomenclaturecontent/202007/3733868.pdf/wilo-pb-201-ea-1311778.pdf'},{name:'Wilo: характеристика H(Q), стр. 15; таблица, стр. 14',url:'https://download.wilo.co.kr/catalog_download.php?catalog=30'},
   {name:'Wilo PB: автоматика по протоку, 2 л/мин',url:'https://wilo.com/es/es/Productos-y-campos-de-aplicaci%C3%B3n/es/productos/pb_id803'},
   {name:'Wilo PB-201EA: европейская карточка оборудования',url:'https://wilo.com/ph/en/Products-and-expertise/en/products/pb_id803/3068136'}]
 }],
 copy:{disclaimer:'Предварительная оценка для сравнения. Реальный результат зависит от водопровода, исполнения насоса и приборов.',
  flowNote:'Условные расходы при 2,5 бар: кухня 8, умывальник 6, душ 10, бачок 4, стиральная машина 6 л/мин. Это настройки примера, их можно изменить.',
  heaterUnknown:'Модель колонки не выбрана. Порог включения и сопротивление неизвестны: подтвердить запуск нельзя.'}
};
