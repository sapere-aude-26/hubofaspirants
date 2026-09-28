
(function(){
  "use strict";
  function applyStudentTabState(){
    if(!document.body.classList.contains("hoa-student-auth")) return;
    var host=document.getElementById("hoaStudentLoginHost");
    if(!host) return;
    var loginBox=host.querySelector("#loginBox");
    var registerBox=host.querySelector("#registerBox");
    var freeGateBox=host.querySelector("#freeGateBox");
    var freeRegisterBox=host.querySelector("#freeRegisterBox");
    var loginTab=host.querySelector("#loginTab");
    var registerTab=host.querySelector("#registerTab");
    var freeTab=host.querySelector("#freeTab");
    if(!loginBox||!registerBox||!freeGateBox||!freeRegisterBox) return;

    var mode="login";
    if(registerTab && registerTab.classList.contains("active")) mode="register";
    else if(freeTab && freeTab.classList.contains("active")) mode="free";

    function state(el,show){
      el.classList.toggle("hidden",!show);
      el.hidden=!show;
      if(show){
        el.style.removeProperty("display");
        el.style.removeProperty("visibility");
        el.style.removeProperty("opacity");
      }else{
        el.style.setProperty("display","none","important");
        el.style.setProperty("visibility","hidden","important");
        el.style.setProperty("opacity","0","important");
      }
    }

    state(loginBox,mode==="login");
    state(registerBox,mode==="register");
    state(freeGateBox,mode==="free");
    state(freeRegisterBox,false);

    if(loginTab) loginTab.classList.toggle("active",mode==="login");
    if(registerTab) registerTab.classList.toggle("active",mode==="register");
    if(freeTab) freeTab.classList.toggle("active",mode==="free");
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",function(){setTimeout(applyStudentTabState,10);},{once:true});
  }else setTimeout(applyStudentTabState,10);
})();
