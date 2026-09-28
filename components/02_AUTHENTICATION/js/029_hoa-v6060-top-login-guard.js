
(function(){
  "use strict";

  function ensureTopLogin(){
    var nav = document.querySelector("#hoaFrontPage .hoa-front-navlinks");
    if(!nav) return;

    var login = nav.querySelector(".hoa-v6060-login-card");
    if(!login){
      login = document.createElement("button");
      login.type = "button";
      login.className = "hoa-v6058-nav-login hoa-v6060-login-card";
      login.setAttribute("aria-label","Login");
      login.title = "Go to Student Area";
      login.innerHTML = '<span class="hoa-v6058-login-icon">🎓</span><span>LOGIN</span>';
      login.addEventListener("click",function(){
        if(typeof window.hoaScrollToStudentArea === "function"){
          window.hoaScrollToStudentArea();
        }
      });
      nav.insertBefore(login, nav.firstElementChild);
    }

    login.style.display = "inline-flex";
    login.style.visibility = "visible";
    login.style.opacity = "1";
    login.style.pointerEvents = "auto";
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded",ensureTopLogin,{once:true});
  }else{
    ensureTopLogin();
  }

  /* Re-check after existing navigation/legacy scripts finish their work. */
  setTimeout(ensureTopLogin,100);
  setTimeout(ensureTopLogin,500);
})();
