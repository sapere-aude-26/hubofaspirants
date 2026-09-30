/* HOA V6.1.0 — Feature-separated JavaScript module.
   Original inline script #31 (id: hoa-v637-student-login-state).
   Execution position intentionally preserved from V6.0.9. */


(function(){
  "use strict";
  function ensureStudentLoginTab(){
    const loginTab = document.getElementById("loginTab");
    const loginBox = document.getElementById("loginBox");
    const registerBox = document.getElementById("registerBox");
    const freeGateBox = document.getElementById("freeGateBox");
    const freeRegisterBox = document.getElementById("freeRegisterBox");
    if(!loginTab || !loginBox || !registerBox || !freeGateBox || !freeRegisterBox) return;
    if(document.body.classList.contains("hoa-student-auth")){
      loginTab.classList.add("active");
      loginBox.classList.remove("hidden");
      registerBox.classList.add("hidden");
      freeGateBox.classList.add("hidden");
      freeRegisterBox.classList.add("hidden");
    }
  }
  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", ensureStudentLoginTab, {once:true});
  }else{
    ensureStudentLoginTab();
  }
})();
