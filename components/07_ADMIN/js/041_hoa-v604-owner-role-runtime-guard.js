
(function(){
  "use strict";
  async function syncOwnerRole(){
    try{
      if(typeof window.applyAdminRole==="function") await window.applyAdminRole();
      else if(typeof window.hoaV645LoadPermissions==="function") await window.hoaV645LoadPermissions();
      var role=window.hoaAdminRole;
      document.body.classList.toggle("hoa-owner-mode",role==="owner");
      var nav=document.getElementById("adminNavAdmin");
      var panel=document.getElementById("adminSectionAdminPanel");
      if(nav) nav.style.display=role==="owner"?"":"none";
      if(panel) panel.style.display=role==="owner"?"":"none";
      if(role==="owner" && typeof window.hoaV643RenderOwnerAdminManager==="function"){
        window.hoaV643RenderOwnerAdminManager();
      }
    }catch(e){ console.warn("HOA owner role synchronization failed:",e); }
  }
  window.hoaSyncOwnerRole=syncOwnerRole;
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",function(){setTimeout(syncOwnerRole,250);});
  else setTimeout(syncOwnerRole,250);
  setTimeout(syncOwnerRole,1200);
  setTimeout(syncOwnerRole,2500);
})();
