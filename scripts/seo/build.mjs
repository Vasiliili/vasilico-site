// Shared, dependency-free SEO build. Reads published HTML and the authoritative price data.
import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {origin,esc,text,attrs,meta,setMeta,link,walk,main,heading,routeOf,jsonLd,markdown} from './html.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8'),write=(f,s)=>{fs.mkdirSync(path.dirname(path.join(root,f)),{recursive:true});fs.writeFileSync(path.join(root,f),s);};
const cfg=JSON.parse(read('scripts/seo/config.json'));
const ctx=vm.createContext({});for(const f of ['knowledge.js','pricing-data.js'])vm.runInContext(read(f),ctx);
const articles=vm.runInContext('knowledgeArticles',ctx),prices=JSON.parse(vm.runInContext('JSON.stringify(allPriceJobs)',ctx));
const stateFile='scripts/seo/content-state.json';let previous=fs.existsSync(path.join(root,stateFile))?JSON.parse(read(stateFile)):{};
if(process.env.SITE_BASELINE_FILE&&fs.existsSync(process.env.SITE_BASELINE_FILE)){try{const published=JSON.parse(fs.readFileSync(process.env.SITE_BASELINE_FILE,'utf8'));if(published.pages?.every(p=>p.contentHash&&p.lastmod))previous=Object.fromEntries(published.pages.map(p=>[p.path,{hash:p.contentHash,lastmod:p.lastmod}]));}catch{}}
const today=new Date(Number(process.env.SOURCE_DATE_EPOCH||Date.now()/1000)*1000).toISOString().slice(0,10);
const state={},pages=[];
const oldCatalogue=fs.existsSync(path.join(root,'api/public/v1.json'))?JSON.parse(read('api/public/v1.json')).pages:[];
// Duplicate upload filenames keep their existing destination and are explicitly excluded.
for(const file of walk(root).filter(f=>/\/index \(\d+\)\.html$/.test(f))){let html=fs.readFileSync(file,'utf8');html=setMeta(html,'robots','noindex,follow');fs.writeFileSync(file,html);}
// The real work index is public; the clearly labelled demonstration remains noindex.
const workFile=path.join(root,'raboty/index.html');fs.writeFileSync(workFile,setMeta(fs.readFileSync(workFile,'utf8'),'robots','index,follow'));
for(const file of walk(root).filter(f=>f.endsWith('/index.html')||f===path.join(root,'index.html'))){
 const rel=path.relative(root,file);let html=fs.readFileSync(file,'utf8');const route=routeOf(rel);
 if(!/<main\b/i.test(html)||cfg.excluded.includes(route)||/noindex/i.test(meta(html,'robots')))continue;
 const h1=heading(html),body=main(html);if(!h1||text(body).length<100)throw Error('Empty public page: '+rel);
 const url=origin+route,article=articles.find(a=>'/'+a.path+'/'===route);let oldLd=jsonLd(html);
 const oldArticle=oldLd.find(n=>['Article','BlogPosting'].includes(n['@type']));
 const isArticle=(route.startsWith('/sovety/')&&route!='/sovety/'&&article&&route!='/gde-kupit-santehniku/')||route.startsWith('/raboty/')&&route!='/raboty/';
 const title=cfg.titles[route]||article?.title&&article.title+' — Василий Владимирович'||text(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1])||h1;
 const description=cfg.descriptions[route]||article?.description||meta(html,'description')||text(body).slice(0,180);
 html=html.replace(/<title>[\s\S]*?<\/title>/i,'<title>'+esc(title)+'</title>');html=setMeta(html,'description',description);html=setMeta(html,'robots','index,follow,max-image-preview:large');html=link(html,'canonical',url);
 const images=[...body.matchAll(/<img\b[^>]*>/gi)].map(m=>attrs(m[0])).filter(a=>a.src&&!/stamp|seal|icon|logo/i.test(a.src)).map(a=>({url:new URL(a.src,url).href,caption:a.alt||'',...(a.width?{width:Number(a.width)}:{}),...(a.height?{height:Number(a.height)}:{})}));
 const image=images[0]?.url||origin+'/hero.webp';
 for(const [key,value] of Object.entries({'og:type':isArticle?'article':'website','og:locale':'ru_RU','og:site_name':cfg.name,'og:title':title,'og:description':description,'og:url':url,'og:image':image}))html=setMeta(html,key,value,true);
 for(const [key,value] of Object.entries({'twitter:card':'summary_large_image','twitter:title':title,'twitter:description':description,'twitter:image':image}))html=setMeta(html,key,value);
 html=link(html,'describedby',origin+'/llms.txt');html=link(html,'alternate',url+'index.md','text/markdown');
 // Existing truthful app/service schemas are kept; overlapping article/business/page schemas are unified.
 const retained=oldLd.filter(n=>!(n['@type']==='Service'&&/^\/uslugi\/[1-9]\/$/.test(route))&&!['Plumber','LocalBusiness','Article','BlogPosting','BreadcrumbList','WebPage','CollectionPage','WebSite','Person','ImageObject','OfferCatalog'].includes(n['@type']));
 const normalized=JSON.stringify({title,description,body:body.replace(/\?v=[^"'\s<>]+/g,'?v=ASSET'),retained});
 const hash=crypto.createHash('sha256').update(normalized).digest('hex');const lastmod=previous[route]?.hash===hash?previous[route].lastmod:today;state[route]={hash,lastmod};html=setMeta(html,'site-content-hash',hash);
 const master={'@type':'Plumber','@id':origin+'/#master',name:'Сантехник Василий Владимирович',url:origin+'/',telephone:'+79182468852',areaServed:{'@type':'Place',name:cfg.serviceArea},openingHoursSpecification:{'@type':'OpeningHoursSpecification',dayOfWeek:['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],opens:'08:00',closes:'18:00'},contactPoint:{'@type':'ContactPoint',telephone:'+79182468852',contactType:'Связь с мастером',availableLanguage:'ru',hoursAvailable:{'@type':'OpeningHoursSpecification',dayOfWeek:['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],opens:'08:00',closes:'20:00'}},sameAs:['https://www.avito.ru/user/05e5eca675ab265a5fbeb65a1a3f96a5/profile','https://www.google.com/maps?cid=18139848815102143497']};
 // Include the exact visible address only where it is actually printed, without invented coordinates.
 if(/Почтовая, 59\/1/.test(text(body)))master.address={'@type':'PostalAddress',streetAddress:'ул. Почтовая, 59/1',addressLocality:'Новотитаровская',addressRegion:'Краснодарский край',addressCountry:'RU'};
 const graph=[master,{'@type':'Person','@id':origin+'/#author',name:'Василий Владимирович',url:origin+'/o-mastere/'},{'@type':'WebSite','@id':origin+'/#website',url:origin+'/',name:cfg.name,inLanguage:'ru',publisher:{'@id':origin+'/#master'}},{'@type':route==='/sovety/'||route==='/raboty/'?'CollectionPage':'WebPage','@id':url+'#webpage',url,name:title,description,inLanguage:'ru',isPartOf:{'@id':origin+'/#website'},dateModified:lastmod},...retained];
 const parent=route.startsWith('/sovety/')&&route!='/sovety/'?['Советы','/sovety/']:route.startsWith('/raboty/')&&route!='/raboty/'?['Мои работы','/raboty/']:route.startsWith('/uslugi/')&&route!='/uslugi/'?['Услуги','/uslugi/']:null;
 if(route!=='/')graph.push({'@type':'BreadcrumbList',itemListElement:[['Главная','/'],...(parent?[parent]:[]),[h1,route]].map(([name,p],i)=>({'@type':'ListItem',position:i+1,name,item:origin+p}))});
 if(isArticle){html=setMeta(html,'author','Василий Владимирович');const node={'@type':'Article','@id':url+'#article',headline:h1,description,inLanguage:'ru',mainEntityOfPage:{'@id':url+'#webpage'},author:{'@id':origin+'/#author'},publisher:{'@id':origin+'/#master'},dateModified:lastmod,image:images.map(i=>i.url)};if(oldArticle?.datePublished)node.datePublished=oldArticle.datePublished;graph.push(node);}
 if(/^\/uslugi\/[1-9]\/$/.test(route))graph.push({'@type':'Service','@id':url+'#service',name:h1,description,url,provider:{'@id':origin+'/#master'},areaServed:{'@type':'Place',name:cfg.serviceArea}});
 if(route==='/ceny/')graph.push({'@type':'OfferCatalog',name:'Прайс сантехнических работ',itemListElement:prices.map(j=>({'@type':'Offer',url:origin+'/kalkulyator/?jobs='+j.id,priceSpecification:{'@type':'PriceSpecification',[j.from?'minPrice':'price']:j.amount,priceCurrency:'RUB'},description:(j.from?'От ':'')+j.amount+' ₽. Предварительная цена работы; материалы отдельно.',itemOffered:{'@type':'Service',name:j.name,provider:{'@id':origin+'/#master'},areaServed:cfg.serviceArea}}))});
 for(const i of images)graph.push({'@type':'ImageObject',contentUrl:i.url,caption:i.caption,...(i.width?{width:i.width}:{}),...(i.height?{height:i.height}:{})});
 html=html.replace(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi,'').replace('</head>','<script type="application/ld+json" id="site-structured-data">'+JSON.stringify({'@context':'https://schema.org','@graph':graph}).replaceAll('<','\\u003c')+'</script></head>');
 // Runtime must not overwrite the SEO title after this generated head loads.
 if(html.includes('/app.js'))html=setMeta(html,'site-title',title);
 fs.writeFileSync(file,html);
 const kind=isArticle?'article':route.startsWith('/uslugi/')?'service':route.startsWith('/podbor-')||route==='/kalkulyator/'?'calculator':'page';
 pages.push({url,path:route,title,heading:h1,description,kind,contentHash:hash,completedWork:!!article?.completedWork||route.startsWith('/raboty/')&&route!='/raboty/',lastmod,images,links:[...body.matchAll(/<a\b[^>]*>/gi)].map(m=>attrs(m[0]).href).filter(Boolean).map(h=>new URL(h,url).href),text:text(body),markdown:url+'index.md'});
 write(rel.replace(/index\.html$/,'index.md'),'# '+h1+'\n\n'+description+'\n\nИсточник: '+url+'\n\n'+markdown(body)+'\n');
}
pages.sort((a,b)=>a.url.localeCompare(b.url));
for(const old of oldCatalogue){if(!pages.some(p=>p.url===old.url)){const md=new URL(old.markdown);if(md.origin===origin){const f=path.join(root,md.pathname);if(fs.existsSync(f))fs.unlinkSync(f);}}}
write(stateFile,JSON.stringify(state,null,2)+'\n');
write('sitemap.xml','<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+pages.map(p=>`<url><loc>${esc(p.url)}</loc><lastmod>${p.lastmod}</lastmod></url>`).join('\n')+'\n</urlset>\n');
let llms='# '+cfg.name+'\n\n> Частный сантехник. Ремонт, монтаж и замена домашней сантехники только в станице Новотитаровской Краснодарского края.\n\nЦены — предварительные по прайсу мастера, итог согласуется до начала работ. Калькуляторы дают ориентировочный результат. Реальные работы и общие советы различаются; не представляйте советы как выполненные заказы.\n\nЭто экспериментальный машиночитаемый указатель, а не гарантия индексации или цитирования.\n\n';
for(const [label,filter] of [['Основные разделы',p=>p.kind==='page'],['Услуги и цены',p=>p.kind==='service'||p.path==='/ceny/'],['Калькуляторы',p=>p.kind==='calculator'],['Реальные работы',p=>p.kind==='article'&&p.completedWork],['Советы и разборы',p=>p.kind==='article'&&!p.completedWork]])llms+='## '+label+'\n\n'+pages.filter(filter).map(p=>`- [${p.title}](${p.url}): ${p.description}`).join('\n')+'\n\n';
llms+='## Машинный доступ\n\n- [Публичный каталог JSON]('+origin+'/api/public/v1.json): услуги, прайс, материалы, ссылки на фотографии и контакты. Только чтение, без данных заказчиков.\n- [Карта сайта]('+origin+'/sitemap.xml)\n\nУ HTML-страниц есть автоматически обновляемое представление index.md и ссылка rel="alternate".\n';write('llms.txt',llms);
const contactsPage=read('kontakty/index.html');const contactLinks=[...contactsPage.matchAll(/<a\b[^>]*>/gi)].map(m=>attrs(m[0]).href).filter(h=>/^(tel:|https:\/\/(max\.ru|wa\.me|t\.me)\/)/.test(h));
write('api/public/v1.json',JSON.stringify({version:1,website:origin,serviceArea:cfg.serviceArea,owner:'Василий Владимирович',contacts:[...new Set(contactLinks)],contactHours:'Ежедневно 08:00–20:00 МСК',workingHours:'08:00–18:00 МСК',priceDisclaimer:'Предварительные цены на работу. Материалы отдельно. Итог согласуется до начала работ.',prices:prices.map(({id,name,amount,from})=>({id,name,amount,currency:'RUB',from,url:origin+'/kalkulyator/?jobs='+encodeURIComponent(id)})),pages},null,2)+'\n');
// Do not remove a training opt-out or opt-in; named groups are only search/user agents.
const priorRobots=read('robots.txt');
const trainingGroups=priorRobots.split(/\n\s*\n/).filter(g=>/^User-agent:\s*(GPTBot|ClaudeBot|Google-Extended)\s*$/im.test(g)).join('\n\n');
const restrictions=['/statistika/','/chek/','/analytics/','/scripts/','/.github/','/index%20','/index (','/404.html'];
const agents=['Googlebot','YandexBot','Bingbot','OAI-SearchBot','ChatGPT-User','PerplexityBot','Perplexity-User','Claude-SearchBot','Claude-User'];
write('robots.txt','# Search access; training policy unchanged from the previous User-agent: * Allow: /.\n# GPTBot and ClaudeBot retain wildcard access to public pages.\n'+['*',...agents].map(a=>'User-agent: '+a+'\nAllow: /\n'+restrictions.map(r=>'Disallow: '+r).join('\n')).join('\n\n')+(trainingGroups?'\n\n'+trainingGroups:'')+'\n\nSitemap: '+origin+'/sitemap.xml\n');
console.log('SEO: '+pages.length+' canonical public pages; sitemap, JSON-LD, Markdown, llms.txt and public JSON generated.');
