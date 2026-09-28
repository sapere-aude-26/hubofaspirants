
(function(){
  "use strict";
  function repairStudentLoginUI(){
    const host=document.getElementById("hoaStudentLoginHost");
    const tab=document.getElementById("loginTab");
    const box=document.getElementById("loginBox");
    const reg=document.getElementById("registerBox");
    const free=document.getElementById("freeGateBox");
    const freeReg=document.getElementById("freeRegisterBox");
    if(!host || !tab || !box || !reg || !free || !freeReg) return;
    if(!document.body.classList.contains("hoa-student-auth")) return;

    tab.hidden=false;
    tab.style.removeProperty("display");
    tab.classList.remove("hidden");

    /* Default Student Login view. Existing showAuth/showFreeGate handlers
       continue to control subsequent tab changes. */
    const anyActive=tab.classList.contains("active") ||
      document.getElementById("registerTab")?.classList.contains("active") ||
      document.getElementById("freeTab")?.classList.contains("active");
    if(!anyActive && !reg.classList.contains("hidden") || (!reg.classList.contains("hidden") && !tab.classList.contains("active"))){
      /* Do not override a deliberate registration state. */
    }
  }
  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",repairStudentLoginUI,{once:true});
  }else repairStudentLoginUI();
  window.addEventListener("popstate",function(){setTimeout(repairStudentLoginUI,0);});
})();
