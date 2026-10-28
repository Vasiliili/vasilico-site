const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'../..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
new JSDOM(read('sitemap.xml'),{contentType:'application/xml'}).window.close();
const pages=JSON.parse(read('api/public/v1.json')).pages;let tested=0;
for(const p of pages){const html=read(p.path==='/'?'index.html':p.path.slice(1)+'index.html');if(!html.includes('/app.js'))continue;
 const d=new JSDOM(html,{url:p.url,runScripts:'outside-only',pretendToBeVisual:true}),w=d.window;w.matchMedia=()=>({matches:true,addEventListener(){}});w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
 w.eval(['knowledge-static.js','knowledge.js','pricing-data.js','pricing-pages.js','app.js'].map(read).join('\n')); 
 assert.equal(w.document.title,p.title,p.path+' runtime title');assert.equal(w.document.querySelectorAll('h1').length,1,p.path+' one runtime heading');
 assert(w.document.querySelector('a[href="tel:+79182468852"]'),p.path+' actual master phone');
 const liveText=w.document.querySelector('main').textContent.replace(/\s+/g,' ').trim();assert(liveText.length>100,p.path+' runtime content');
 if(p.path==='/sovety/'){assert(w.document.querySelectorAll('#knowledge-results a').length>10,'Search list with links');const input=w.document.querySelector('#knowledge-search');input.value='насос';input.dispatchEvent(new w.Event('input',{bubbles:true}));assert(w.document.querySelectorAll('#knowledge-suggestions a').length>0,'Live suggestions');}
 tested++;w.close();}
const data=JSON.parse(read('api/public/v1.json'));assert.equal(data.prices.find(x=>x.name==='Демонтаж фильтра воды').amount,500);assert.equal(data.prices.find(x=>x.name==='Монтаж фильтра для глубокой очистки воды').amount,1500);
console.log('PASS: '+tested+' shared-renderer routes, SEO titles survive JS, contacts, live search, unchanged filter prices.');
