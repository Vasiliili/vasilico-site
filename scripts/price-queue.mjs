import fs from 'node:fs/promises';
import path from 'node:path';
const folder=process.env.RUNNER_TEMP;
const endpoint='https://ppeggcgqevmgugqbvmrx.supabase.co/functions/v1/vasilico-price';
const action=process.argv[2];
const url=new URL(process.env.ACTIONS_ID_TOKEN_REQUEST_URL);
url.searchParams.set('audience','vasilico-price-publisher');
const auth=await fetch(url,{headers:{Authorization:'Bearer '+process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN}});
if(!auth.ok) throw Error('Workflow identity unavailable');
const {value}=await auth.json();
const request=action==='next'?{action}:{action:'finish',id:process.env.REQUEST_ID,state:action};
const response=await fetch(endpoint,{method:'POST',headers:{Authorization:'Bearer '+value,'Content-Type':'application/json'},body:JSON.stringify(request)});
if(!response.ok) throw Error('Queue unavailable: '+response.status);
if(action==='next'){
 const row=await response.json();
 if(row){
  if(!/^[a-f0-9-]{36}$/.test(row.id)) throw Error('Invalid request');
  await fs.writeFile(path.join(folder,'price-patch.json'),JSON.stringify(row.patch));
  await fs.appendFile(process.env.GITHUB_OUTPUT,'id='+row.id+'\n');
 }
}
