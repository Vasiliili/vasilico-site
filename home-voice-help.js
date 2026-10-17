/* One hosted recording for every visitor; playback requires an explicit click. */
(function(){
 let box=document.getElementById('home-voice-help')||document.querySelector('[data-audio-guide]');
 if(!box){
  const route='/'+location.pathname.replace(/^\/+|\/+$/g,'')+'/',guide=window.SiteAudioGuides?.[route],main=document.querySelector('main');
  if(!guide||!main)return;
  box=document.createElement('section');box.className='home-voice-help';box.dataset.audioGuide=String(guide.number);box.setAttribute('aria-label','Аудиоподсказка о странице');
  box.innerHTML='<div class="voice-help-bar"><button type="button" data-help-play aria-pressed="false" aria-describedby="page-voice-note"><span data-help-icon aria-hidden="true">▶</span><span data-help-caption></span></button><button type="button" data-help-text aria-expanded="false" aria-controls="page-voice-text">Текст</button></div><div id="page-voice-text" data-help-panel hidden><p data-help-script></p><small id="page-voice-note" class="voice-help-note">Записанная аудиоподсказка.</small></div><audio data-help-audio preload="auto"></audio><span data-help-status role="status" aria-live="polite"></span>';
  box.querySelector('[data-help-caption]').textContent=guide.caption;box.querySelector('[data-help-script]').textContent=guide.text;box.querySelector('[data-help-audio]').src=guide.audio;
  const anchor=main.querySelector('.page-top')||main.querySelector('h1');if(anchor)anchor.after(box);else main.prepend(box);
 }
 if(box.dataset.audioReady)return;box.dataset.audioReady='true';
 const play=box.querySelector('[data-help-play]'),icon=play.querySelector('[data-help-icon]'),caption=play.querySelector('[data-help-caption]'),toggle=box.querySelector('[data-help-text]'),panel=box.querySelector('[data-help-panel]'),audio=box.querySelector('[data-help-audio]'),status=box.querySelector('[data-help-status]');
 const idleCaption=caption.textContent;let active=false,token=0;
 function text(open){panel.hidden=!open;toggle.setAttribute('aria-expanded',String(open));toggle.textContent=open?'Скрыть':'Текст';}
 function reset(){active=false;icon.textContent='▶';caption.textContent=idleCaption;play.setAttribute('aria-pressed','false');status.textContent='';}
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
