/* Home-page orientation only. Speech starts solely after an explicit click. */
(function(){
 const box=document.getElementById('home-voice-help');if(!box)return;const play=box.querySelector('[data-help-play]'),icon=play.querySelector('[data-help-icon]'),caption=play.querySelector('[data-help-caption]'),toggle=box.querySelector('[data-help-text]'),panel=box.querySelector('[data-help-panel]'),script=box.querySelector('[data-help-script]'),status=box.querySelector('[data-help-status]');
 let active=false,utterance=null,timer=null,token=0;
 function text(open){panel.hidden=!open;toggle.setAttribute('aria-expanded',String(open));toggle.textContent=open?'Скрыть':'Текст';}
 function reset(){active=false;utterance=null;clearTimeout(timer);timer=null;icon.textContent='▶';caption.textContent='Как пользоваться сайтом';play.setAttribute('aria-pressed','false');}
 function stop(){token++;if(utterance&&window.speechSynthesis)window.speechSynthesis.cancel();reset();status.textContent='';}
 function fallback(id){if(id!==token)return;token++;if(utterance&&window.speechSynthesis)window.speechSynthesis.cancel();reset();text(true);status.textContent='Озвучка недоступна. Подсказку можно прочитать ниже.';}
 toggle.addEventListener('click',()=>text(panel.hidden));
 play.addEventListener('click',()=>{if(active){stop();return;}const id=++token;status.textContent='';if(!window.speechSynthesis||!window.SpeechSynthesisUtterance){fallback(id);return;}
  active=true;icon.textContent='■';caption.textContent='Остановить подсказку';play.setAttribute('aria-pressed','true');
  try{utterance=new SpeechSynthesisUtterance(script.textContent.trim());utterance.lang='ru-RU';utterance.rate=.9;utterance.pitch=1;utterance.volume=1;const voices=window.speechSynthesis.getVoices().filter(v=>/^ru(?:-|_)/i.test(v.lang)||v.lang==='ru'),voice=voices.find(v=>v.localService)||voices[0];if(voice)utterance.voice=voice;
   utterance.onstart=()=>{if(id!==token)return;clearTimeout(timer);timer=null;};utterance.onend=()=>{if(id!==token)return;reset();};utterance.onerror=()=>fallback(id);timer=setTimeout(()=>fallback(id),4000);window.speechSynthesis.speak(utterance);
  }catch{fallback(id);}
 });
 window.addEventListener('pagehide',stop);document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
})();
