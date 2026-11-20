// Search descriptors are derived from existing standalone work pages, never separately authored copies.
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {walk,main,heading,text,meta,routeOf} from './html.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const items=[];
const publicPaths=new Set([...fs.readFileSync(path.join(root,'sitemap.xml'),'utf8').matchAll(/<loc>https:\/\/vasilico\.ru([^<]+)<\/loc>/g)].map(m=>m[1]));
for(const file of walk(root).filter(f=>f.endsWith('/index.html'))){const h=fs.readFileSync(file,'utf8');if(h.includes('/app.js')||/noindex/i.test(meta(h,'robots')))continue;const rel=path.relative(root,file),url=routeOf(rel),title=heading(h),body=text(main(h));if(!publicPaths.has(url)||!title||!body)continue;items.push({type:url.startsWith('/raboty/')?'practice':'analysis',url,heading:title,summary:meta(h,'description'),body,tags:[],keywords:''});}
if(items.length)items.push({type:'analysis',url:'/raboty/',heading:'Мои работы в Новотитаровской',summary:'Реальные случаи ремонта и водоснабжения: причины, выполненная работа и результат.',tags:['мои работы'],keywords:'реальные выполненные работы сантехника'});
fs.writeFileSync(path.join(root,'knowledge-static.js'),'// Generated from real standalone HTML by scripts/seo/static-index.mjs.\nconst staticKnowledgeItems='+JSON.stringify(items).replaceAll('<','\\u003c')+';\n');
