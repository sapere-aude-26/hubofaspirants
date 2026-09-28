
(function(){
  "use strict";
  function removePublicStudentLogin(){
    if(document.body.classList.contains("hoa-login-page")) return;
    const roots=document.querySelectorAll("header, nav, .header, .navbar, .topbar, .publicHeader");
    roots.forEach(function(root){
      root.querySelectorAll("a,button").forEach(function(el){
        const text=(el.textContent||"").replace(/\s+/g," ").trim().toLowerCase();
        const aria=(el.getAttribute("aria-label")||"").toLowerCase();
        const title=(el.getAttribute("title")||"").toLowerCase();
        if(text==="student login" || aria==="student login" || title==="student login"){
          el.remove();
        }
      });
    });
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",removePublicStudentLogin);
  else removePublicStudentLogin();
})();
