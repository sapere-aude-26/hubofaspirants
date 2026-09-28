
(function(){
  'use strict';
  function syncAdminLogout(){
    var body=document.body, btn=document.getElementById('adminHeaderLogout');
    if(!body || !btn) return;
    if(body.classList.contains('admin-ui')) {
      btn.classList.remove('hidden');
      btn.setAttribute('aria-hidden','false');
    } else {
      btn.classList.add('hidden');
      btn.setAttribute('aria-hidden','true');
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',syncAdminLogout); else syncAdminLogout();
  new MutationObserver(syncAdminLogout).observe(document.body,{attributes:true,attributeFilter:['class']});
})();
