import {createRemoteJWKSet, jwtVerify} from 'npm:jose@6.1.0';
const issuer = 'https://token.actions.githubusercontent.com';
const keys = createRemoteJWKSet(new URL(issuer + '/.well-known/jwks'));
const audience = 'vasilico-price-publisher';
const workflow = 'Vasiliili/vasilico-site/.github/workflows/publish-price.yml@refs/heads/main';
const origins = ['https://vasilico.ru','https://www.vasilico.ru'];
const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
async function db(path, method='GET', body) {
 const response = await fetch(Deno.env.get('SUPABASE_URL')+'/rest/v1/'+path, {
  method, headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json',Prefer:'return=representation'},body:JSON.stringify(body)
 });
 if (!response.ok) throw new Error('storage',{cause:response.status});
 return response.json();
}
Deno.serve(async req => {
 const origin = req.headers.get('Origin');
 const headers = {'Cache-Control':'no-store','Vary':'Origin','Access-Control-Allow-Headers':'content-type, x-stats-token, authorization','Access-Control-Allow-Methods':'POST, OPTIONS'};
 const reply = (data,status=200) => Response.json(data,{status,headers});
 if (origin && !origins.includes(origin)) return reply({},403);
 if (origin) headers['Access-Control-Allow-Origin']=origin;
 if (req.method==='OPTIONS') return new Response(null,{status:204,headers});
 if (req.method!=='POST') return reply({},405);
 try {
  const raw=await req.text();
  if(raw.length>2500) return reply({},413);
  const {action,id,patch,state}=JSON.parse(raw);
  const table='vasilico_price_requests';
  if (action==='next'||action==='finish') {
   let claims;
   try { claims=(await jwtVerify((req.headers.get('authorization')||'').replace(/^Bearer /,''),keys,{issuer,audience,algorithms:['RS256']})).payload; }
   catch { return reply({},401); }
   if(claims.workflow_ref!==workflow || claims.repository_id!=='1391323447' || claims.ref!=='refs/heads/main'||!['schedule','push'].includes(claims.event_name)) return reply({},403);
   if(action==='next') return reply((await db(table+'?state=eq.pending&limit=1'))[0]||null);
  } else {
   const password=req.headers.get('x-stats-token')||'';
   if(password.length<20||password.length>128) return reply({},401);
   const hash=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(password)));
   const [config]=await db('vasilico_stats_config?id=eq.true&select=token_hash');
   const hex=Array.from(hash,n=>n.toString(16).padStart(2,'0')).join('');
   let diff=hex.length^(config?.token_hash||'').length;
   for(let i=0;i<hex.length;i++) diff|=hex.charCodeAt(i)^(config?.token_hash||'').charCodeAt(i);
   if(diff) return reply({},401);
   if(action==='latest') return reply((await db(table+'?order=created_at.desc&limit=1'))[0]||null);
  }
  if(typeof id!=='string'||!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(id)) return reply({},400);
  if(action==='finish' && ['submitted','failed'].includes(state)) {
   await db(table+'?id=eq.'+id+'&state=eq.pending','PATCH',{state}); return reply({ok:true});
  }
  if(action!=='save'||patch?.version!==1||patch.changes?.length!==1||!['add','update','remove'].includes(patch.changes[0]?.type)) return reply({},400);
  try { return reply((await db(table,'POST',{id,patch}))[0]); }
  catch(e){if(e.cause!==409)throw e;return reply({error:'pending'},409);}
 } catch {return reply({},503);}
});
