
/* Keep the Developer Console in index.html, but expose its launcher only
   when the existing admin session UI says the user is an administrator. */
(function(){
  function syncAdminConsoleVisibility(){
    var button=document.getElementById("openHoaDevConsole");
    if(!button)return;
    var adminLogout=document.getElementById("adminHeaderLogout");
    var adminVisible=!!adminLogout &&
      !adminLogout.classList.contains("hidden") &&
      getComputedStyle(adminLogout).display!=="none";
    button.classList.toggle("hoa-admin-console-hidden",!adminVisible);
  }
  function boot(){
    syncAdminConsoleVisibility();
    var obs=new MutationObserver(syncAdminConsoleVisibility);
    obs.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:["class","style"]});
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);
  else boot();
})();
