// Publish only site assets, never repository tooling, SQL, tests or reports.
import fs from 'node:fs';import path from 'node:path';
const target='_site';fs.rmSync(target,{recursive:true,force:true});fs.mkdirSync(target);
const skip=new Set(['.git','.github','.openai','.reports','node_modules','scripts','analytics','_site','AGENTS.md','package.json','package-lock.json','README.md']);
for(const name of fs.readdirSync('.')){
 if(skip.has(name)||name.startsWith('.')&&!['.nojekyll'].includes(name))continue;
 fs.cpSync(name,path.join(target,name),{recursive:true,filter:p=>!/(?:^|\/)(?:test[^/]*\.(?:cjs|js|mjs)|README\.md|index \(\d+\)\.html)$/.test(p)});
}
console.log('Checked public site staged in _site/.');
