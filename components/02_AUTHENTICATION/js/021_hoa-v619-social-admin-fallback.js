
(function(){
  "use strict";
  window.addEventListener("DOMContentLoaded",function(){
    const b=document.querySelector("#hoaFrontSocialFooter .hoa-v619-admin");
    if(!b) return;
    b.addEventListener("click",function(e){
      if(typeof window.hoaOpenPortal==="function") return;
      e.preventDefault();
      if(typeof window.hoaOpenLogin==="function") window.hoaOpenLogin("login");
    });
  });
})();
