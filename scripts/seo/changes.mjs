import fs from 'node:fs';import {execFileSync} from 'node:child_process';
const current=JSON.parse(fs.readFileSync('scripts/seo/content-state.json'));let before={};
try{const c=JSON.parse(fs.readFileSync('.reports/published-catalog.json'));if(c.pages.every(p=>p.contentHash))before=Object.fromEntries(c.pages.map(p=>[p.path,{hash:p.contentHash}]));else throw Error('Old format');}
catch{try{before=JSON.parse(execFileSync('git',['show','HEAD^:scripts/seo/content-state.json'],{encoding:'utf8',stdio:['ignore','pipe','ignore']}));}catch{}}
const urls=[...new Set([...Object.keys(current),...Object.keys(before)])].filter(p=>current[p]?.hash!==before[p]?.hash).map(p=>'https://vasilico.ru'+p);
fs.mkdirSync('.reports',{recursive:true});fs.writeFileSync('.reports/indexnow-pending.json',JSON.stringify({urls},null,2));console.log('Changed/deleted public URLs for post-deployment notification:',urls.length);
