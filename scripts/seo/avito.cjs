// The owner-supplied full URL is a contract, including the opaque context parameter.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'../..'),read=(f)=>fs.readFileSync(path.join(root,f),'utf8');
const expected=read('scripts/seo/avito-review-url.txt').trim();
assert.equal(new URL(expected).searchParams.has('context'),true);
const expectedContext=new URL(expected).searchParams.get('context');assert.equal(expected.length,621);assert.equal(expectedContext.length,503);
const oldId='05e5eca675ab265a5fbeb65a1a3f96a5';
function assertButton(document,label){const buttons=[...document.querySelectorAll('a.review-source')];assert.equal(buttons.length,1,label+': one existing reviews button');const a=buttons[0];assert.equal(a.textContent.replace(/\s*↗\s*$/,'').trim(),'Читать отзывы на Авито',label+': caption');assert.equal(a.getAttribute('href'),expected,label+': exact href including context');assert.equal(a.href,expected,label+': resolved href');assert(!a.href.includes(oldId),label+': obsolete profile');return a;}
function check(html,base,label,runtime){const w=new JSDOM(html,{url:base,runScripts:'outside-only',pretendToBeVisual:true}).window;assertButton(w.document,label+' static HTML');if(runtime){w.matchMedia=()=>({matches:true,addEventListener(){}});w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.eval(['knowledge-static.js','knowledge.js','pricing-data.js','pricing-pages.js','app.js'].map(read).join('\n'));assertButton(w.document,label+' after actual renderer JS');}w.close();}
check(read('o-mastere/index.html'),'https://vasilico.ru/o-mastere/','About master',true);
if(fs.existsSync(path.join(root,'_site/o-mastere/index.html')))check(read('_site/o-mastere/index.html'),'https://vasilico.ru/o-mastere/','Publish artifact',false);
// Do not mislabel an advertisement as a sameAs profile identity.
const d=new JSDOM(read('o-mastere/index.html')).window.document;
const graph=JSON.parse(d.querySelector('#site-structured-data').textContent)['@graph'];const master=graph.find(n=>n['@type']==='Plumber');assert(!master.sameAs.includes(expected),'Listing must not replace profile identity in sameAs');assert(master.sameAs.includes('https://www.avito.ru/user/e210c885a007339875bd33366eadb8c0/profile?src=sharing'));
console.log('PASS: exact 621-character reviews URL, unchanged caption, one button, built HTML, runtime DOM, staged artifact when present, sameAs identity preserved.');
