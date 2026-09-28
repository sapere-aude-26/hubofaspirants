
(function(){
  'use strict';
  const wrap=document.getElementById('hoaV653ConnectWrap');
  const toggle=document.getElementById('hoaV653ConnectToggle');
  if(!wrap||!toggle)return;
  function setOpen(open){wrap.classList.toggle('is-open',open);toggle.setAttribute('aria-expanded',String(open));}
  toggle.addEventListener('click',function(e){e.stopPropagation();setOpen(!wrap.classList.contains('is-open'));});
  document.addEventListener('click',function(e){if(!wrap.contains(e.target))setOpen(false);});
  document.addEventListener('keydown',function(e){if(e.key==='Escape')setOpen(false);});
})();
