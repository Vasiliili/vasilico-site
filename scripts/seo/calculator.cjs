const {JSDOM}=require('jsdom'),fs=require('fs'),assert=require('node:assert/strict');
const root=require('node:path').resolve(__dirname,'../..')+'/';
const src=n=>fs.readFileSync(root+n,'utf8');
function setup(route='kalkulyator',query='?jobs=0-0,0-2',service=''){
 const d=new JSDOM('<body><main class="prices-page"></main></body>',{url:'https://vasilico.ru/'+route+'/'+query,runScripts:'outside-only'}),w=d.window;
 w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder;w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
 w.eval("const path="+JSON.stringify(route)+';'+src('pricing-data.js')+'\n'+src('pricing-pages.js')+'\ndocument.querySelector("main").innerHTML=renderCalculator('+JSON.stringify(service)+');\n'+src('seller-sheet.js')+'\n'+src('price-receipt.js')+'\n'+src('calculator.js'));
 return w;
}
const w=setup(),doc=w.document,$=s=>doc.querySelector(s),input=(s,v)=>{$(s).value=v;$(s).dispatchEvent(new w.Event('input',{bubbles:true}));},change=(s,v)=>{$(s).checked=v;$(s).dispatchEvent(new w.Event('change',{bubbles:true}));};
assert.match($('#estimate-result').textContent,/1\s500/);
input('#estimate-discount','200.25');assert.match($('#estimate-result').textContent,/1\s299,75/);
assert.equal($('#estimate-completed').closest('.selection-toggle'),null);
change('#estimate-completed',true);assert.ok($('.receipt-stamp'));assert.ok(![...doc.querySelectorAll('#estimate-receipt-paper strong,#estimate-receipt-paper dd')].some(el=>el.textContent.startsWith('от ')));
$('#estimate-receipt-open').click();assert.ok($('dialog').hasAttribute('open'));assert.equal($('#estimate-receipt-panel').closest('dialog'),$('dialog'));
$('.seller-sheet-close').click();assert.equal($('dialog').hasAttribute('open'),false);assert.equal($('#estimate-receipt-panel').closest('.receipt-builder'),$('.receipt-builder'));
input('#estimate-discount','9999');assert.match($('#estimate-result').textContent,/Итого за работы: 0 ₽/);assert.equal($('#estimate-discount').value,'1500');
input('#estimate-discount','-2');assert.match($('#estimate-result').textContent,/1\s500/);
input('#estimate-discount','100');change('#estimate-trip',true);assert.match($('#estimate-result').textContent,/1\s700/);change('#estimate-trip',false);
const handoff=new URL($('.estimate-full-link').href);assert.equal(handoff.searchParams.get('discount'),'100');assert.equal(handoff.searchParams.get('completed'),'1');
$('#estimate-clear').click();assert.equal($('#estimate-discount').value,'');assert.equal($('#estimate-completed').checked,false);assert.equal($('#estimate-receipt-open').disabled,true);
input('#estimate-task','фильтр');const labels=[...doc.querySelectorAll('.estimate-option')];for(const name of ['Демонтаж фильтра воды','Монтаж фильтра для глубокой очистки воды']){const label=labels.find(l=>l.textContent.includes(name));assert.ok(label,name);const c=label.querySelector('input');c.checked=true;c.dispatchEvent(new w.Event('change',{bubbles:true}));}
assert.match($('#estimate-result').textContent,/2\s000/);assert.ok(![...doc.querySelectorAll('#estimate-receipt-paper strong,#estimate-receipt-paper dd')].some(el=>el.textContent.startsWith('от ')));input('#estimate-discount','500');assert.match($('#estimate-result').textContent,/1\s500/);
const r=require(root+'price-receipt.js'),v={version:1,date:'2026-10-22T10:00:00.000Z',completed:true,discount:500,rows:[{name:'Демонтаж фильтра воды',amount:500,from:false},{name:'Монтаж фильтра для глубокой очистки воды',amount:1500,from:false}]};
assert.deepEqual(r.decode(r.encode(v)),v);assert.equal(r.totals(v).total,1500);assert.ok(r.link(v).startsWith('https://vasilico.ru/chek/#r='));assert.match(r.text(v),/Обращайтесь: https:\/\/vasilico.ru\//);
for(const bad of [{...v,discount:2001},{...v,discount:-1},{...v,rows:[]},{...v,completed:'yes'},{...v,rows:[{name:'x',amount:NaN,from:false}]}])assert.throws(()=>r.validate(bad));assert.throws(()=>r.decode('<script>'));assert.throws(()=>r.decode('a'.repeat(50001)));
const publicHtml=src('chek/index.html');for(const valid of [true,false]){const d=new JSDOM(publicHtml,{url:'https://vasilico.ru/chek/#r='+(valid?r.encode(v):'bad'),runScripts:'outside-only'});d.window.TextEncoder=TextEncoder;d.window.TextDecoder=TextDecoder;d.window.eval(src('price-receipt.js'));assert.equal(d.window.document.querySelector('#receipt-public-panel').hidden,!valid);assert.equal(d.window.document.querySelector('#receipt-public-error').hidden,valid);}
const malicious={...v,rows:[{name:'<img src=x onerror=alert(1)>',amount:100,from:false}],discount:0};w.PriceReceipt.render($('#estimate-receipt-paper'),malicious);assert.equal($('#estimate-receipt-paper img'),null);
for(const [route,service]of [['ceny',''],['cena-zamena-unitaza','zamena-unitaza']]){const other=setup(route,'',service);assert.ok(other.document.querySelector('#estimate-discount'));if(service)assert.match(other.document.querySelector('#estimate-result').textContent,/Выберите работы/);}
const reopened=setup('kalkulyator',handoff.search);assert.equal(reopened.document.querySelector('#estimate-discount').value,'100');assert.ok(reopened.document.querySelector('.receipt-stamp'));
console.log('PASS: prices, search, discounts, cap/reset, presets, trip, fullscreen return, frozen receipts, malformed links, escaping, calculator handoff');
const clean=setup('kalkulyator',''),cd=clean.document;
assert.equal(cd.querySelector('#estimate-options').children.length,0);assert.equal(cd.querySelector('#estimate-options').hidden,true);assert.equal(cd.querySelector('#estimate-selected').children.length,0);assert.equal(cd.querySelector('.receipt-builder').hidden,true);
cd.querySelector('#estimate-task').focus();assert.equal(cd.querySelector('#estimate-options').hidden,false);assert.ok(cd.querySelector('#estimate-options').children.length);
const firstChoice=cd.querySelector('#estimate-options input');firstChoice.checked=true;firstChoice.dispatchEvent(new clean.Event('change',{bubbles:true}));assert.equal(cd.querySelector('#estimate-selected').children.length,2);
for(const el of [...cd.querySelectorAll('#estimate-selected input')]){el.checked=false;el.dispatchEvent(new clean.Event('change',{bubbles:true}));}assert.equal(cd.querySelector('#estimate-selected').children.length,0);assert.equal(cd.querySelector('.receipt-builder').hidden,true);
const again=cd.querySelector('#estimate-options input');again.checked=true;again.dispatchEvent(new clean.Event('change',{bubbles:true}));cd.querySelector('#estimate-clear').click();assert.equal(cd.querySelector('#estimate-options').hidden,true);assert.equal(cd.querySelector('#estimate-task').value,'');
assert.equal(new JSDOM(src('ceny/index.html')).window.document.querySelectorAll('.price-group[open]').length,0);
(async()=>{let shared;clean.navigator.share=async value=>{shared=value;};const panel=cd.querySelector('#estimate-receipt-panel');const mounted=clean.PriceReceipt.mount({panel,paper:cd.querySelector('#estimate-receipt-paper'),trigger:cd.querySelector('#estimate-receipt-open')});mounted.update({...clean.PriceReceipt.totals(v),rows:v.rows,discount:v.discount,completed:true});panel.querySelector('[data-receipt-action=share]').click();await new Promise(resolve=>setImmediate(resolve));assert.ok(shared.url.startsWith('https://vasilico.ru/chek/#r='));assert.equal(shared.files,undefined);assert.match(shared.text,/https:\/\/vasilico.ru\//);console.log('PASS: clean initial state, suggestions on focus only, no removed rows, all price groups collapsed, share sends clickable receipt URL');})();
