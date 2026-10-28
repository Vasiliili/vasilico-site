// Public proof key, not an administrative credential. Submit only after deployment verification.
import fs from 'node:fs';import {execFileSync} from 'node:child_process';import {origin} from './html.mjs';
const key=fs.readFileSync('scripts/seo/indexnow-key.txt','utf8').trim();
const current=JSON.parse(fs.readFileSync('scripts/seo/content-state.json'));
let before={};try{before=JSON.parse(execFileSync('git',['show',(process.env.BEFORE_SHA||'HEAD^')+':scripts/seo/content-state.json'],{encoding:'utf8',stdio:['ignore','pipe','ignore']}));}catch{}
const urls=[...new Set([...Object.keys(current),...Object.keys(before)])].filter(p=>current[p]?.hash!==before[p]?.hash).map(p=>origin+p);
let report={at:new Date().toISOString(),urls,status:'nothing-changed'};
if(urls.length){try{const proof=await fetch(origin+'/'+key+'.txt',{signal:AbortSignal.timeout(20000)});if(!proof.ok||(await proof.text()).trim()!==key)throw Error('Published key proof unavailable; submission skipped');const r=await fetch('https://api.indexnow.org/indexnow',{method:'POST',headers:{'Content-Type':'application/json; charset=utf-8'},body:JSON.stringify({host:new URL(origin).host,key,keyLocation:origin+'/'+key+'.txt',urlList:urls}),signal:AbortSignal.timeout(30000)});report.httpStatus=r.status;report.status=r.status===200?'submitted':r.status===202?'accepted-key-validation-pending':'rejected';report.response=(await r.text()).slice(0,500);}catch(e){report.status='error';report.message=e.message;}}
fs.mkdirSync('.reports',{recursive:true});fs.writeFileSync('.reports/indexnow.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(['error','rejected'].includes(report.status))process.exit(1);
