
(function(){
  "use strict";
  function forceStudentLoginFields(){
    if(!document.body.classList.contains("hoa-student-auth")) return;
    const host=document.getElementById("hoaStudentLoginHost");
    if(!host) return;
    const box=host.querySelector("#loginBox");
    if(!box) return;
    box.classList.remove("hidden");
    box.hidden=false;
    box.style.removeProperty("display");
    box.style.removeProperty("visibility");
    box.style.removeProperty("opacity");
    box.querySelectorAll(".formGroup").forEach(function(group){
      group.classList.remove("hidden");
      group.hidden=false;
      group.style.removeProperty("display");
      group.style.removeProperty("visibility");
      group.style.removeProperty("opacity");
    });
    box.querySelectorAll("#loginId,#loginPassword").forEach(function(input){
      input.hidden=false;
      input.style.removeProperty("display");
      input.style.removeProperty("visibility");
      input.style.removeProperty("opacity");
    });
  }
  function boot(){
    forceStudentLoginFields();
    setTimeout(forceStudentLoginFields,50);
    setTimeout(forceStudentLoginFields,250);
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot,{once:true});
  else boot();
  window.addEventListener("popstate",function(){setTimeout(forceStudentLoginFields,0);});
})();
