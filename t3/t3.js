/* Keep content below the existing fixed header, including larger text settings. */
(()=>{const header=document.querySelector('header');if(!header)return;const sync=()=>document.documentElement.style.setProperty('--header',Math.ceil(header.getBoundingClientRect().height)+'px');sync();if(typeof ResizeObserver!=='undefined')new ResizeObserver(sync).observe(header);})();
