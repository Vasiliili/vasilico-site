import fs from 'node:fs';
import path from 'node:path';
export const origin='https://vasilico.ru';
export const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const decode=s=>s.replace(/&#(x[\da-f]+|\d+);/gi,(_,n)=>String.fromCodePoint(n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):Number(n))).replace(/&(nbsp|amp|lt|gt|quot|apos|mdash|ndash);/g,(_,n)=>({nbsp:' ',amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",mdash:'—',ndash:'–'}[n]));
export const text=s=>decode(String(s||'').replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,'').replace(/<br\s*\/?\s*>/gi,' ').replace(/<[^>]+>/g,' ')).replace(/\s+/g,' ').trim();
export const attrs=tag=>Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)].map(m=>[m[1].toLowerCase(),decode(m[2]??m[3])]));
export function meta(html,key,property=false){return [...html.matchAll(/<meta\b[^>]*>/gi)].map(m=>attrs(m[0])).find(a=>a[property?'property':'name']===key)?.content||'';}
export function setMeta(html,key,value,property=false){const attr=property?'property':'name';const re=new RegExp('<meta\\b(?=[^>]*\\b'+attr+'=["\']'+key+'["\'])[^>]*>','gi');return html.replace(re,'').replace('</head>',`<meta ${attr}="${key}" content="${esc(value)}"></head>`);}
export function link(html,rel,href,type){const re=new RegExp('<link\\b(?=[^>]*\\brel=["\']'+rel+'["\'])[^>]*>','gi');return html.replace(re,'').replace('</head>',`<link rel="${rel}" href="${esc(href)}"${type?` type="${type}"`:''}></head>`);}
export function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.name.startsWith('.')||['node_modules','_site'].includes(e.name)?[]:e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
export const main=html=>html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1]||'';
export const heading=html=>text(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]||'');
export const routeOf=file=>file==='index.html'?'/':'/'+file.replace(/index\.html$/,'');
export function jsonLd(html){return [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].flatMap(m=>{const d=JSON.parse(m[1]);return d['@graph']||[d];});}
export function markdown(html){return decode(html.replace(/<(script|style|svg|button|select|audio|video)\b[^>]*>[\s\S]*?<\/\1>/gi,'').replace(/<img\b[^>]*>/gi,t=>{const a=attrs(t);return a.src&&a.alt?`\n![${a.alt}](${new URL(a.src,origin).href})\n`:'';}).replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi,(_,a,b)=>{const h=attrs(a).href;return h?`[${text(b)}](${new URL(h,origin).href})`:text(b);}).replace(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi,(_,n,b)=>'\n\n'+'#'.repeat(Number(n))+' '+text(b)+'\n\n').replace(/<li\b[^>]*>/gi,'\n- ').replace(/<\/(p|div|section|article|aside|figure|ul|ol|tr)>/gi,'\n\n').replace(/<br\s*\/?\s*>/gi,'\n').replace(/<[^>]+>/g,'')).replace(/[ \t]+/g,' ').replace(/\n[ \t]+/g,'\n').replace(/\n{3,}/g,'\n\n').trim();}
