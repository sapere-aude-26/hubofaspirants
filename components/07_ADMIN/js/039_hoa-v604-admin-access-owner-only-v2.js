
(function(){
  "use strict";
  function enforce(){
    var owner=window.hoaAdminRole==="owner";
    var b=document.getElementById("adminNavAdmin");
    var p=document.getElementById("adminSectionAdminPanel");
    if(b)b.style.display=owner?"":"none";
    if(!owner && p){
      p.style.display="none";
      p.classList.remove("active","v13-active");
    }
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",enforce);
  else enforce();
  setTimeout(enforce,300);
  setTimeout(enforce,1000);
  setTimeout(enforce,2000);
  setInterval(enforce,3000);
})();
