/* Own contact-click statistics. Public anon JWT authenticates only the application;
   database tables and reports remain inaccessible without the separate owner token. */
(() => {
 'use strict';
 const endpoint='https://ppeggcgqevmgugqbvmrx.supabase.co/functions/v1/vasilico-statistics';
 const anon='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwZWdnY2dxZXZtZ3VncWJ2bXJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0NzEwODUsImV4cCI6MjEwNzA0NzA4NX0.4ycZAVoiRVc2aWlxxntfpVSPoM2kuF1ooSzd0u7LBx0';
 window.vasilicoStatsRequest=(body,token)=>fetch(endpoint,{method:'POST',headers:{Authorization:'Bearer '+anon,apikey:anon,'Content-Type':'application/json',...(token?{'x-stats-token':token}:{})},body:JSON.stringify(body),keepalive:true});
 if(location.pathname.startsWith('/statistika'))return;
 const safeStorage={get(k){try{return sessionStorage.getItem(k);}catch{return null;}},set(k,v){try{sessionStorage.setItem(k,v);}catch{}}};
 const channelFor=href=>{try{const u=new URL(href,location.href),h=u.hostname;if(u.protocol==='tel:')return 'phone';if(h==='wa.me'||h==='api.whatsapp.com')return 'whatsapp';if(h==='t.me')return 'telegram';if(h==='max.ru')return 'max';if(h==='avito.ru'||h.endsWith('.avito.ru'))return 'avito';}catch{}return null;};
 let session=safeStorage.get('vasilico-visit');
 if(!session){session=crypto.randomUUID();safeStorage.set('vasilico-visit',session);}
 let source=safeStorage.get('vasilico-source');
 if(!source){
  const utm=new URLSearchParams(location.search).get('utm_source');
  if(['avito','whatsapp','telegram','max','google','yandex'].includes(utm))source=utm;
  else {try{const r=new URL(document.referrer);source=channelFor(r.href)||(r.hostname.endsWith('google.com')||r.hostname.endsWith('google.ru')?'google':r.hostname==='yandex.ru'||r.hostname==='ya.ru'?'yandex':r.hostname===location.hostname?'direct':'other');}catch{source='direct';}}
  safeStorage.set('vasilico-source',source);
 }
 const last={};
 document.addEventListener('click',event=>{
  const link=event.target.closest?.('a[href]'); if(!link)return;
  const channel=channelFor(link.href);if(!channel)return;
  try{if(localStorage.getItem('vasilico-stats-exclude')==='1')return;}catch{}
  const now=Date.now();if(last[channel]&&now-last[channel]<30000)return;last[channel]=now;
  const page=/^\/[a-z0-9/_-]{0,179}$/.test(location.pathname)?location.pathname:'/';
  try{window.vasilicoStatsRequest({action:'click',id:crypto.randomUUID(),session,channel,page,source}).catch(()=>{});}catch{}
 },true);
})();
