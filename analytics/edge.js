const origins = new Set(['https://vasilico.ru','https://www.vasilico.ru']);
const channels = new Set(['phone','whatsapp','telegram','max','avito']);
const sources = new Set(['direct','avito','whatsapp','telegram','max','google','yandex','other','car_qr']);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const api = Deno.env.get('SUPABASE_URL') + '/rest/v1/';
const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
async function db(path, body) {
 const res = await fetch(api + path, {method: body ? 'POST' : 'GET', headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'},body:body ? JSON.stringify(body) : undefined});
 if (!res.ok) throw new Error('storage');
 return res.json();
}
Deno.serve(async req => {
 const origin = req.headers.get('origin');
 const headers = {'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-stats-token'};
 if (origin && !origins.has(origin)) return new Response('{}',{status:403,headers});
 if(origin) headers['Access-Control-Allow-Origin']=origin;
 const respond=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
 if(req.method==='OPTIONS') return new Response(null,{status:204,headers});
 if(req.method!=='POST') return respond({error:'method'},405);
 try {
  if(Number(req.headers.get('content-length')||0)>2048) return respond({error:'size'},413);
  const raw=await req.text();
  if(raw.length>2048) return respond({error:'size'},413);
  const body=JSON.parse(raw);
  if(body.action==='report') {
   const token=req.headers.get('x-stats-token')||'';
   if(token.length<20 || token.length>128) return respond({error:'unauthorized'},401);
   const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token));
   const hash=Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join('');
   const config=await db('vasilico_stats_config?select=token_hash&id=eq.true');
   const expected=config[0]?.token_hash||'';
   let diff=hash.length ^ expected.length; for(let i=0;i<hash.length;i++) diff|=hash.charCodeAt(i)^(expected.charCodeAt(i)||0);
   if(diff) return respond({error:'unauthorized'},401);
   if(![1,7,30,90].includes(body.days)) return respond({error:'days'},400);
   const report=await db('rpc/vasilico_click_report',{p_days:body.days});
   report.t3=await db('rpc/vasilico_t3_report',{p_days:body.days});
   return respond(report);
  }
  if(body.action==='visit'){
   if(!sources.has(body.source)||!uuid.test(body.id)||!uuid.test(body.session)||!['/t3','/t3/'].includes(body.page))return respond({error:'invalid'},400);
   return respond({ok:true,recorded:await db('rpc/vasilico_record_t3_visit',{p_id:body.id,p_session:body.session,p_source:body.source})});
  }
  if(body.action!=='click'||!channels.has(body.channel)||!sources.has(body.source)||!uuid.test(body.id)||!uuid.test(body.session)||typeof body.page!=='string'||!/^\/[a-z0-9/_-]{0,179}$/.test(body.page)) return respond({error:'invalid'},400);
  const recorded=await db('rpc/vasilico_record_click',{p_id:body.id,p_channel:body.channel,p_page:body.page,p_source:body.source,p_session:body.session});
  return respond({ok:true,recorded});
 } catch {return respond({error:'unavailable'},503);}
});
