/* Shared full-screen seller note. Moves existing content; never recreates calculator state. */
(function(){
 let serial=0;
 function mount({trigger,panel}){
  if(!trigger||!panel)return null;
  const dialog=document.createElement('dialog');dialog.className='seller-sheet';dialog.setAttribute('aria-modal','true');const titleId='seller-sheet-title-'+(++serial);dialog.setAttribute('aria-labelledby',titleId);
  const toolbar=document.createElement('div');toolbar.className='seller-sheet-toolbar';const title=document.createElement('h2');title.id=titleId;title.textContent='Памятка для продавца';const closeButton=document.createElement('button');closeButton.type='button';closeButton.className='seller-sheet-close';closeButton.setAttribute('aria-label','Закрыть памятку и вернуться к подбору');closeButton.innerHTML='<span aria-hidden="true">×</span><span>Закрыть</span>';toolbar.append(title,closeButton);
  const body=document.createElement('div');body.className='seller-sheet-body';const back=document.createElement('button');back.type='button';back.className='seller-sheet-back';back.textContent='Вернуться к подбору';dialog.append(toolbar,body,back);document.body.append(dialog);
  const marker=document.createComment('seller-note-position');panel.before(marker);trigger.setAttribute('aria-haspopup','dialog');trigger.setAttribute('aria-expanded','false');
  let previous=null,opened=false;
  function restore(){if(!previous)return;panel.hidden=previous.hidden;if(panel.tagName==='DETAILS')panel.open=previous.detailsOpen;marker.after(panel);for(const[k,v]of Object.entries(previous.styles))document.body.style[k]=v;document.documentElement.classList.remove('seller-sheet-open');document.body.classList.remove('seller-sheet-open');previous.inert.forEach(([node,value])=>{node.inert=value;});trigger.setAttribute('aria-expanded','false');const pos=previous.scroll;previous=null;window.scrollTo(pos.x,pos.y);trigger.focus({preventScroll:true});}
  function close(){if(!opened)return;opened=false;if(typeof dialog.close==='function'&&dialog.open)dialog.close();else dialog.removeAttribute('open');restore();}
  function open(){if(opened||trigger.disabled)return;opened=true;const styles={};for(const key of ['position','top','left','right','width','overflow'])styles[key]=document.body.style[key];const inert=[...document.body.children].filter(node=>node!==dialog).map(node=>[node,node.inert]);previous={hidden:panel.hidden,detailsOpen:panel.tagName==='DETAILS'?panel.open:false,styles,inert,scroll:{x:window.scrollX,y:window.scrollY}};
   panel.hidden=false;if(panel.tagName==='DETAILS')panel.open=true;body.append(panel);document.documentElement.classList.add('seller-sheet-open');document.body.classList.add('seller-sheet-open');document.body.style.position='fixed';document.body.style.top=-previous.scroll.y+'px';document.body.style.left='0';document.body.style.right='0';document.body.style.width='100%';document.body.style.overflow='hidden';inert.forEach(([node])=>{node.inert=true;});
   try{if(typeof dialog.showModal==='function')dialog.showModal();else{dialog.setAttribute('open','');dialog.setAttribute('role','dialog');}}catch{dialog.setAttribute('open','');dialog.setAttribute('role','dialog');}dialog.scrollTop=0;closeButton.focus({preventScroll:true});trigger.setAttribute('aria-expanded','true');
  }
  closeButton.addEventListener('click',close);back.addEventListener('click',close);dialog.addEventListener('cancel',e=>{e.preventDefault();close();});dialog.addEventListener('close',()=>{if(opened){opened=false;restore();}});
  dialog.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close();return;}if(e.key!=='Tab')return;const stops=[...dialog.querySelectorAll('button,a[href],input,textarea,select,summary,[tabindex]')].filter(el=>!el.disabled&&el.tabIndex>=0&&!el.closest('[hidden]')&&!el.closest('details:not([open]) :not(summary)'));const first=stops[0],last=stops.at(-1);if(!first)return;if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}});
  return{open,close,dialog};
 }
 window.SellerSheet={mount};
})();
