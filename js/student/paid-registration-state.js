/* HOA V6.1.0 — Feature-separated JavaScript module.
   Original inline script #15 (id: hoa-v640-paid-registration-state-final).
   Execution position intentionally preserved from V6.0.9. */


(function(){
  "use strict";

  function setVisible(el, visible){
    if(!el) return;
    el.hidden = !visible;
    el.classList.toggle("hidden", !visible);
    if(visible){
      el.style.removeProperty("display");
      el.style.removeProperty("visibility");
      el.style.removeProperty("opacity");
    }else{
      el.style.setProperty("display","none","important");
    }
  }

  /* Final authoritative tab controller for the hosted Student Login panel.
     This deliberately reuses the existing showAuth workflow and fields. */
  window.showAuth = function(mode){
    var login = mode === "login";
    var register = mode === "register";

    var host = document.getElementById("hoaStudentLoginHost");
    var loginBox = host ? host.querySelector("#loginBox") : document.getElementById("loginBox");
    var registerBox = host ? host.querySelector("#registerBox") : document.getElementById("registerBox");
    var freeGateBox = host ? host.querySelector("#freeGateBox") : document.getElementById("freeGateBox");
    var freeRegisterBox = host ? host.querySelector("#freeRegisterBox") : document.getElementById("freeRegisterBox");

    if(!loginBox || !registerBox) return;

    setVisible(loginBox, login);
    setVisible(registerBox, register);
    setVisible(freeGateBox, false);
    setVisible(freeRegisterBox, false);

    var loginTab = host?.querySelector("#loginTab") || document.getElementById("loginTab");
    var registerTab = host?.querySelector("#registerTab") || document.getElementById("registerTab");
    var freeTab = host?.querySelector("#freeTab") || document.getElementById("freeTab");

    loginTab?.classList.toggle("active", login);
    registerTab?.classList.toggle("active", register);
    freeTab?.classList.remove("active");

    if(register){
      registerBox.querySelectorAll(".formGroup").forEach(function(group){
        group.classList.remove("hidden");
        group.hidden = false;
        group.style.removeProperty("display");
        group.style.removeProperty("visibility");
        group.style.removeProperty("opacity");
      });
      registerBox.querySelectorAll("input,select,button").forEach(function(control){
        control.hidden = false;
        control.style.removeProperty("display");
        control.style.removeProperty("visibility");
        control.style.removeProperty("opacity");
      });
      try{ updateRegistrationTypeUI(); }catch(e){}
    }

    try{ setMessage(""); }catch(e){}
    try{ setMessage("",false,"admin"); }catch(e){}
  };

  /* Repair the state if the Student Login page is opened directly with a
     stale registration class/state. */
  function repair(){
    if(!document.body.classList.contains("hoa-student-auth")) return;
    var host=document.getElementById("hoaStudentLoginHost");
    if(!host) return;

    var registerTab=host.querySelector("#registerTab");
    var loginTab=host.querySelector("#loginTab");

    if(registerTab?.classList.contains("active")){
      window.showAuth("register");
    }else if(loginTab?.classList.contains("active")){
      window.showAuth("login");
    }
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",function(){
      setTimeout(repair,0);
    },{once:true});
  }else{
    setTimeout(repair,0);
  }
})();
