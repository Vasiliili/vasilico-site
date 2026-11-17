const origins = new Set(['https://vasilico.ru','https://www.vasilico.ru']);
const api = Deno.env.get('SUPABASE_URL') + '/rest/v1/';
const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
async function db(path, options={}) {
 const r=await fetch(api+path,{...options,headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json',...(options.headers||{})}});
 if(!r.ok) throw Error('storage'); return r.status===204?null:await r.json();
}
function valid(x){
 if(!x || !Array.isArray(x.days) || x.days.length!==7 || !x.days.every(y=>typeof y==='boolean')) return false;
 const time=/^(?:[01]\d|2[0-3]):[0-5]\d$/;
 if(!['contactStart','contactEnd','workStart','workEnd'].every(k=>time.test(x[k])) || x.contactStart>=x.contactEnd || x.workStart>=x.workEnd) return false;
 if(typeof x.notice!=='string'||x.notice.length>240 || typeof x.until!=='string')return false;
 if(x.until && (!/^\d{4}-\d{2}-\d{2}$/.test(x.until) || !Number.isFinite(Date.parse(x.until+'T12:00:00Z')) || new Date(x.until+'T12:00:00Z').toISOString().slice(0,10)!==x.until))return false;
 return true;
}
Deno.serve(async req=>{
 const origin=req.headers.get('origin'); const h={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-stats-token'};
 if(origin&&!origins.has(origin))return new Response('{}',{status:403,headers:h}); if(origin)h['Access-Control-Allow-Origin']=origin;
 const reply=(v,status=200)=>new Response(JSON.stringify(v),{status,headers:h});
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:h}); if(req.method!=='POST')return reply({error:'method'},405);
 try {
  const raw=await req.text(); if(raw.length>4096)return reply({error:'size'},413); const body=JSON.parse(raw);
  if(body.action==='read') {const rows=await db('vasilico_schedule?select=schedule,updated_at&id=eq.true'); if(!rows[0])throw Error('missing'); return reply(rows[0]);}
  if(body.action!=='write')return reply({error:'action'},400);
  const token=req.headers.get('x-stats-token')||''; if(token.length<20||token.length>128)return reply({error:'unauthorized'},401);
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token)); const hash=Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join('');
  const config=await db('vasilico_stats_config?select=token_hash&id=eq.true'); const expected=config[0]?.token_hash||'';
  let diff=hash.length^expected.length; for(let i=0;i<hash.length;i++)diff|=hash.charCodeAt(i)^(expected.charCodeAt(i)||0); if(diff)return reply({error:'unauthorized'},401);
  if(!valid(body.schedule))return reply({error:'invalid'},400);
  const schedule={days:body.schedule.days,contactStart:body.schedule.contactStart,contactEnd:body.schedule.contactEnd,workStart:body.schedule.workStart,workEnd:body.schedule.workEnd,notice:body.schedule.notice.trim(),until:body.schedule.notice.trim()?body.schedule.until:''};
  const rows=await db('vasilico_schedule?id=eq.true',{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({schedule,updated_at:new Date().toISOString()})}); if(!rows?.[0])throw Error('missing');
  return reply({ok:true,schedule:rows[0].schedule,updated_at:rows[0].updated_at});
 }catch{return reply({error:'unavailable'},503);}
});
