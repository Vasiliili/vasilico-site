// Rebuild crawlable HTML from the same price data and renderers used in the browser.
// No dependencies, no network. Run from anywhere: node scripts/build-static.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const app=read('app.js').split('initializeKnowledgeSearch();')[0];
const paths=['kalkulyator','cena-zamena-unitaza'];
const skeleton=read('index.html').replace(/<main id="main">[\s\S]*?<\/main>/,'<main id="main"></main>');
for(const route of paths){const dir=path.join(root,route);fs.mkdirSync(dir,{recursive:true});if(!fs.existsSync(path.join(dir,'index.html')))fs.writeFileSync(path.join(dir,'index.html'),skeleton);}
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()&&!e.name.startsWith('.')?walk(path.join(dir,e.name)):e.isFile()&&e.name==='index.html'?[path.join(dir,e.name)]:[]);}
for(const file of walk(root)){
 let page=fs.readFileSync(file,'utf8');if(!page.includes('/app.js'))continue;
 const route=path.relative(root,path.dirname(file)).split(path.sep).join('/');
 const nodes={nav:{innerHTML:''},main:{innerHTML:''}};
 const document={title:'',documentElement:{style:{setProperty(){}}},querySelector:s=>nodes[s]||null,querySelectorAll:()=>[]};
 const ctx=vm.createContext({document,location:{pathname:'/'+(route?route+'/':''),search:'',origin:'https://vasilico.ru'},URLSearchParams,URL,console});
 for(const f of ['knowledge.js','pricing-data.js','pricing-pages.js'])vm.runInContext(read(f),ctx,{filename:f});
 vm.runInContext(app,ctx,{filename:'app.js'});
 if(!nodes.main.innerHTML.includes('<h1'))throw Error('Missing heading '+route);
 page=page.replace(/<main id="main">[\s\S]*?<\/main>/,'<main id="main">'+nodes.main.innerHTML+'</main>');
 page=page.replace(/<nav aria-label="Основные разделы">[\s\S]*?<\/nav>/,'<nav aria-label="Основные разделы">'+nodes.nav.innerHTML+'</nav>');
 // Keep existing titles for existing routes; new routes have explicit metadata.
 if(paths.includes(route)){
  page=page.replace(/<title>[\s\S]*?<\/title>/,'<title>'+escape(document.title)+'</title>');
  const description=route==='kalkulyator'?'Калькулятор работ по прайсу сантехника Василия Владимировича в Новотитаровской. Выберите услуги, добавьте поездку в магазин и получите предварительную стоимость.':'Стоимость замены напольного унитаза по прайсу сантехника Василия Владимировича в Новотитаровской: демонтаж, установка и предварительный расчёт на одной странице.';
  page=page.replace(/<meta name="description" content="[^"]*">/,'<meta name="description" content="'+description+'">');
  page=page.replace(/<link rel="canonical" href="[^"]*">/,'<link rel="canonical" href="https://vasilico.ru/'+route+'/">');
  page=page.replace(/<script type="application\/ld\+json" id="price-structured-data">[\s\S]*?<\/script>/,'');
  const label=route==='kalkulyator'?'Калькулятор':'Стоимость замены унитаза';
  const crumbs={'@type':'BreadcrumbList',itemListElement:[{name:'Главная',item:'https://vasilico.ru/'},{name:'Цены',item:'https://vasilico.ru/ceny/'},{name:label,item:'https://vasilico.ru/'+route+'/'}].map((x,i)=>({'@type':'ListItem',position:i+1,...x}))};
  const provider={'@type':'Plumber','@id':'https://vasilico.ru/#master',name:'Сантехник Василий Владимирович',url:'https://vasilico.ru/',telephone:'+79182468852',areaServed:'Новотитаровская'};
  let entity;
  if(route==='kalkulyator')entity={'@type':'WebApplication',name:'Калькулятор работ сантехника Василия Владимировича',url:'https://vasilico.ru/kalkulyator/',applicationCategory:'UtilitiesApplication',operatingSystem:'Web browser',browserRequirements:'JavaScript для изменения расчёта',inLanguage:'ru',description,creator:provider};
  else {const total=vm.runInContext("presetJobs('zamena-unitaza').reduce((sum,j)=>sum+j.amount,0)",ctx);entity={'@type':'Service',name:'Замена напольного унитаза в Новотитаровской',serviceType:'Демонтаж старого и установка нового напольного унитаза',url:'https://vasilico.ru/'+route+'/',provider,areaServed:'Новотитаровская',description:'Предварительно от '+total+' ₽ по прайсу Василия Владимировича. Материалы и унитаз отдельно. Цена согласуется до начала работы.',offers:{'@type':'Offer',url:'https://vasilico.ru/'+route+'/',priceSpecification:{'@type':'PriceSpecification',minPrice:total,priceCurrency:'RUB'},description:'Предварительная стоимость работы от '+total+' ₽, не фиксированная окончательная цена.'}};}
  const data={'@context':'https://schema.org','@graph':[entity,crumbs]};
  page=page.replace('</head>','<script type="application/ld+json" id="price-structured-data">'+JSON.stringify(data).replaceAll('<','\\u003c')+'</script></head>');
 }
 fs.writeFileSync(file,page);
}
let sitemap=read('sitemap.xml');for(const route of paths){if(!sitemap.includes('https://vasilico.ru/'+route+'/'))sitemap=sitemap.replace('</urlset>','<url><loc>https://vasilico.ru/'+route+'/</loc></url>\n</urlset>');}fs.writeFileSync(path.join(root,'sitemap.xml'),sitemap);
console.log('Static HTML rebuilt from shared renderers and pricing-data.js.');
