/* One hosted recording for every visitor; playback requires an explicit click. */
(function(){
 const box=document.getElementById('home-voice-help');if(!box)return;
 const play=box.querySelector('[data-help-play]'),icon=play.querySelector('[data-help-icon]'),caption=play.querySelector('[data-help-caption]'),toggle=box.querySelector('[data-help-text]'),panel=box.querySelector('[data-help-panel]'),audio=box.querySelector('[data-help-audio]'),status=box.querySelector('[data-help-status]');
 let active=false,token=0;
 function text(open){panel.hidden=!open;toggle.setAttribute('aria-expanded',String(open));toggle.textContent=open?'Скрыть':'Текст';}
 function reset(){active=false;icon.textContent='▶';caption.textContent='Как пользоваться сайтом';play.setAttribute('aria-pressed','false');status.textContent='';}
 function stop(){token++;if(audio){audio.pause();try{audio.currentTime=0;}catch{}}reset();}
 function fallback(id){if(id!==token)return;stop();text(true);status.textContent='Не удалось воспроизвести запись. Подсказку можно прочитать ниже.';}
 toggle.addEventListener('click',()=>text(panel.hidden));
 play.addEventListener('click',()=>{
  if(active){stop();return;}const id=++token;
  if(!audio||typeof audio.play!=='function'){fallback(id);return;}
  active=true;icon.textContent='■';caption.textContent='Остановить подсказку';play.setAttribute('aria-pressed','true');status.textContent='Загрузка записи…';
  try{const pending=audio.play();if(pending&&typeof pending.catch==='function')pending.catch(()=>fallback(id));}catch{fallback(id);}
 });
 if(audio){
  audio.addEventListener('playing',()=>{if(active)status.textContent='';});
  audio.addEventListener('waiting',()=>{if(active)status.textContent='Загрузка записи…';});
  audio.addEventListener('ended',stop);
  audio.addEventListener('error',()=>{if(active)fallback(token);});
 }
 window.addEventListener('pagehide',stop);document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
})();
