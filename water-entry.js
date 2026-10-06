/* A single, silent water greeting per tab session, on any entry page. */
(()=>{
 const key='vasilico-water-entry-v2';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let played=false;
 function play(){
  if(played||document.visibilityState!=='visible')return;
  played=true;
  try{if(sessionStorage.getItem(key))return;sessionStorage.setItem(key,'1');}catch{return;}
  if(reduced.matches)return;
  const layer=document.createElement('div');layer.className='water-entry';layer.setAttribute('aria-hidden','true');
  layer.innerHTML='<svg width="0" height="0" aria-hidden="true"><defs><filter id="entry-water-refraction" x="-10%" y="-30%" width="120%" height="160%"><feTurbulence type="fractalNoise" baseFrequency="0.012 0.045" numOctaves="1" seed="8" result="ripples"/><feDisplacementMap in="SourceGraphic" in2="ripples" scale="14" xChannelSelector="R" yChannelSelector="G"/></filter></defs></svg><div class="water-entry-band"></div>';
  document.body.append(layer);
  const cleanup=()=>{layer.remove();reduced.removeEventListener('change',cleanup);};
  reduced.addEventListener('change',cleanup);
  layer.addEventListener('animationend',cleanup,{once:true});
  setTimeout(cleanup,3400);
 }
 function ready(){requestAnimationFrame(()=>requestAnimationFrame(play));}
 if(document.readyState==='complete')ready();else window.addEventListener('load',ready,{once:true});
 document.addEventListener('visibilitychange',()=>{if(document.readyState==='complete'&&!played)ready();});
})();
