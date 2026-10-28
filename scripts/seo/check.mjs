import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {origin,attrs,meta,text,main,heading,jsonLd,walk} from './html.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const errors=[],warnings=[];const check=(ok,msg)=>{if(!ok)errors.push(msg);};
const catalogue=JSON.parse(fs.readFileSync(path.join(root,'api/public/v1.json'),'utf8'));
const sitemap=fs.readFileSync(path.join(root,'sitemap.xml'),'utf8');const sitemapUrls=[...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(x=>x[1]);
check(sitemap.includes('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'),'Sitemap namespace');
check(sitemapUrls.length===new Set(sitemapUrls).size,'Duplicate sitemap URLs');
check(sitemapUrls.length===catalogue.pages.length,'Sitemap/catalog mismatch');
const titles=new Set(),descs=new Set();let resources=0,links=0;
const fileFor=url=>{const p=decodeURIComponent(new URL(url,origin).pathname);return path.join(root,p.endsWith('/')?p+'index.html':p);};
for(const p of catalogue.pages){
 const html=fs.readFileSync(fileFor(p.url),'utf8');
 check(meta(html,'site-content-hash')===p.contentHash,'Content version '+p.path);
 check(sitemapUrls.includes(p.url),'Missing sitemap entry '+p.path);
 check(!/noindex/i.test(meta(html,'robots')),'noindex in sitemap '+p.path);
 check(/<html[^>]*lang="ru"/i.test(html),'Russian language '+p.path);check(!!meta(html,'viewport'),'Viewport '+p.path);
 check((html.match(/<h1\b/gi)||[]).length===1,'One H1 '+p.path);check(text(main(html)).length>100,'Missing main content '+p.path);
 check(!titles.has(p.title),'Duplicate title '+p.path);titles.add(p.title);check(!descs.has(p.description),'Duplicate description '+p.path);descs.add(p.description);
 const canonical=[...html.matchAll(/<link\b[^>]*>/gi)].map(m=>attrs(m[0])).filter(a=>a.rel==='canonical');check(canonical.length===1&&canonical[0].href===p.url,'Canonical '+p.path);
 check(meta(html,'og:url',true)===p.url,'OG URL '+p.path);check(!!meta(html,'og:image',true),'OG image '+p.path);
 check(fs.existsSync(fileFor(p.markdown)),'Missing Markdown '+p.path);
 try{const nodes=jsonLd(html);check(nodes.some(n=>n['@type']==='WebSite'),'WebSite JSON-LD '+p.path);check(nodes.some(n=>['WebPage','CollectionPage'].includes(n['@type'])),'WebPage JSON-LD '+p.path);
  if(p.kind==='article')check(nodes.some(n=>n['@type']==='Article'&&n.author&&n.mainEntityOfPage),'Article JSON-LD '+p.path);
  const master=nodes.find(n=>n['@type']==='Plumber');check(master?.telephone==='+79182468852','Actual contact '+p.path);check(!nodes.some(n=>n.aggregateRating),'No invented aggregate rating '+p.path);
 }catch(e){errors.push('JSON-LD '+p.path+': '+e.message);}
 for(const m of html.matchAll(/<(a|img|script|link|source)\b[^>]*>/gi)){
  const a=attrs(m[0]),h=a.href||a.src;if(!h||/^(tel:|mailto:|data:|blob:|javascript:)/.test(h))continue;
  const u=new URL(h,p.url);if(u.origin!==origin)continue;
  if(u.pathname.startsWith('/index%20')){errors.push('Linked duplicate '+h);continue;}
  const target=fileFor(u.href);let exists=fs.existsSync(target)&&fs.statSync(target).isFile();
  if(!exists&&!path.extname(target))exists=fs.existsSync(path.join(target,'index.html'));
  check(exists,'Broken internal '+p.path+' -> '+h);
  if(m[1].toLowerCase()==='a'){links++;if(exists&&u.hash&&target.endsWith('.html')){const dest=fs.readFileSync(target,'utf8'),id=decodeURIComponent(u.hash.slice(1));if(!dest.includes('id="'+id+'"')&&!dest.includes("id='"+id+"'")&&!/^(tip-|calculator|price-list)/.test(id))warnings.push('Fragment may be dynamic '+p.path+' -> '+h);}}
  else resources++;
  if(m[1].toLowerCase()==='img')check(a.alt!==undefined,'Missing image alt '+p.path+' '+h);
 }
 check(!html.includes('/seal-vasilico.webp'),'Old stamp '+p.path);
}
// Every indexed page except the QR entry point must be reachable by ordinary HTML links.
const reachable=new Set([origin+'/']);let size=-1;
while(size!==reachable.size){size=reachable.size;for(const p of catalogue.pages.filter(p=>reachable.has(p.url)))for(const h of p.links){const u=new URL(h);const canonical=u.origin+u.pathname;if(catalogue.pages.some(p=>p.url===canonical))reachable.add(canonical);}}
for(const p of catalogue.pages)check(p.path==='/t3/'||reachable.has(p.url),'Orphan public page '+p.path);
const robots=fs.readFileSync(path.join(root,'robots.txt'),'utf8');check(robots.includes('Sitemap: '+origin+'/sitemap.xml'),'Robots sitemap');
for(const s of ['/statistika/','/chek/','/analytics/'])check(robots.includes('Disallow: '+s),'Technical exclusion '+s);
check(!sitemapUrls.some(u=>/\/statistika\/|\/chek\/|protechka|slabyy-napor|voda-pod-rakovinoy/.test(u)),'Excluded page leaked into sitemap');
check(fs.readFileSync(path.join(root,'404.html'),'utf8').includes('noindex'),'404 noindex');
const report={status:errors.length?'failed':'passed',pages:catalogue.pages.length,links,resources,errors,warnings:[...new Set(warnings)]};
fs.mkdirSync(path.join(root,'.reports'),{recursive:true});fs.writeFileSync(path.join(root,'.reports/seo-check.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));if(errors.length)process.exit(1);
