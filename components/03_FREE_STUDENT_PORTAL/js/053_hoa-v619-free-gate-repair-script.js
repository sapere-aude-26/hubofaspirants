
(function(){
'use strict';
var originalGate=window.hoaOpenFreeContent;
function getModal(){return document.getElementById('hoaV648FreeContentModal');}
function forceVisible(m){
  if(!m)return false;
  if(m.parentElement!==document.body)document.body.appendChild(m);
  m.classList.remove('hidden');
  m.classList.add('hoa-v619-visible');
  m.style.setProperty('display','flex','important');
  m.style.setProperty('visibility','visible','important');
  m.style.setProperty('opacity','1','important');
  m.style.setProperty('pointer-events','auto','important');
  m.style.setProperty('z-index','2147483000','important');
  document.documentElement.classList.add('hoa-free-modal-open');
  document.body.classList.add('hoa-free-modal-open');
  return true;
}
function openCanonical(){
  var m=getModal();
  if(!m){console.error('HOA Free Content popup element not found');return false;}
  try{
    if(typeof originalGate==='function'){
      originalGate();
    }
  }catch(e){console.error('Existing Free Content gate failed:',e);}
  if(!forceVisible(m))return false;
  var title=document.getElementById('hoaV648FreeContentTitle');
  if(title)title.textContent='Free Content Access';
  var mobile=document.getElementById('hoaV616Mobile');
  if(mobile)setTimeout(function(){try{mobile.focus({preventScroll:true});}catch(_){mobile.focus();}},40);
  return true;
}
window.hoaOpenFreeContent=openCanonical;
window.hoaV619OpenFreeContent=openCanonical;
function bind(){
  document.querySelectorAll('button[aria-label="Free Content"], [onclick*="hoaOpenFreeContent"]').forEach(function(el){
    if(el.dataset.hoaV619Bound==='1')return;
    el.dataset.hoaV619Bound='1';
    el.onclick=function(e){
      if(e){e.preventDefault();e.stopImmediatePropagation();}
      openCanonical();
      return false;
    };
  });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
window.addEventListener('load',bind);
})();
