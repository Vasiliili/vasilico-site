// Checks downloaded HTML and the DOM after all actually published deferred scripts execute.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'../..'),expected=fs.readFileSync(path.join(__dirname,'avito-review-url.txt'),'utf8').trim();
const pageUrl='https://vasilico.ru/o-mastere/',local=process.env.AVITO_LOCAL_TEST==='1';
async function download(url){if(local)return fs.readFileSync(path.join(root,new URL(url).pathname),'utf8');const r=await fetch(url,{signal:AbortSignal.timeout(30000)});assert.equal(r.status,200,'Published resource '+url);return r.text();}
function button(document,label){const aa=[...document.querySelectorAll('a.review-source')];assert.equal(aa.length,1,label+' button count');assert.equal(aa[0].textContent.replace(/\s*↗\s*$/,'').trim(),'Читать отзывы на Авито');assert.equal(aa[0].getAttribute('href'),expected,label+' complete href');return aa[0].href;}
(async()=>{const html=await download(local?pageUrl+'index.html':pageUrl);const w=new JSDOM(html,{url:pageUrl,runScripts:'outside-only',pretendToBeVisual:true}).window;
 const result={url:pageUrl,checkedAt:new Date().toISOString(),mode:local?'local':'published',staticHref:button(w.document,'Static HTML')};
 w.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}});w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
 w.HTMLMediaElement.prototype.load=()=>{};w.localStorage.setItem('vasilico-stats-exclude','1');
 const scripts=[...w.document.querySelectorAll('script[src]')].map(s=>new URL(s.getAttribute('src'),pageUrl).href);assert(scripts.some(s=>new URL(s).pathname==='/app.js'),'Actual published renderer script');
 const code=await Promise.all(scripts.map(download));w.eval(code.join('\n;\n'));w.document.dispatchEvent(new w.Event('DOMContentLoaded'));w.dispatchEvent(new w.Event('load'));await new Promise(r=>setTimeout(r,100));
 result.runtimeHref=button(w.document,'DOM after published JavaScript');result.scripts=scripts;result.status='passed';w.close();fs.mkdirSync(path.join(root,'.reports'),{recursive:true});fs.writeFileSync(path.join(root,'.reports/avito-live.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
