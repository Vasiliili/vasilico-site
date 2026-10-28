// Search descriptors are derived from existing standalone work pages, never separately authored copies.
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {walk,main,heading,text,meta,routeOf} from './html.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const items=[];
for(const file of walk(path.join(root,'raboty')).filter(f=>f.endsWith('/index.html'))){const h=fs.readFileSync(file,'utf8');if(h.includes('/app.js')||/noindex/i.test(meta(h,'robots')))continue;const rel=path.relative(root,file);items.push({type:'practice',url:routeOf(rel),heading:heading(h),summary:meta(h,'description'),body:text(main(h)),tags:['насосы','скважина','мои работы'],keywords:text(main(h))});}
if(items.length)items.push({type:'analysis',url:'/raboty/',heading:'Мои работы в Новотитаровской',summary:'Реальные случаи ремонта и водоснабжения: причины, выполненная работа и результат.',tags:['мои работы'],keywords:'реальные выполненные работы сантехника'});
fs.writeFileSync(path.join(root,'knowledge-static.js'),'// Generated from real standalone HTML by scripts/seo/static-index.mjs.\nconst staticKnowledgeItems='+JSON.stringify(items).replaceAll('<','\\u003c')+';\n');
