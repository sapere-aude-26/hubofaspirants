
(function(){
  "use strict";

  const S = {
    FRONT: "front",
    PORTAL: "portal",
    STUDENT: "student",
    ADMIN: "admin"
  };

  function bodyState(){
    return document.body;
  }

  function clearPublicState(){
    const b = bodyState();
    b.classList.remove(
      "hoa-public-front",
      "hoa-public-portal",
      "hoa-public-auth",
      "hoa-student-auth",
      "hoa-admin-auth"
    );
  }

  function hideLegacyAuth(){
    const a = document.getElementById("authScreen");
    if(a) a.style.setProperty("display","none","important");
  }

  function moveExistingAuthPanels(){
    const auth = document.getElementById("authScreen");
    const studentHost = document.getElementById("hoaStudentLoginHost");
    const adminHost = document.getElementById("hoaAdminLoginHost");
    if(!auth || !studentHost || !adminHost) return;

    const adminPanel = auth.querySelector("#homeAdminPanel");
    const panels = Array.from(auth.querySelectorAll(".dashPanel"));
    const studentPanel = panels.find(p => p !== adminPanel);

    if(studentPanel && !studentHost.contains(studentPanel)){
      studentHost.appendChild(studentPanel);
    }
    if(adminPanel && !adminHost.contains(adminPanel)){
      adminHost.appendChild(adminPanel);
    }

    /* The legacy panel must be visible when it is deliberately hosted on the
       public Student/Admin page; its parent authScreen can remain hidden. */
    if(adminPanel && adminHost.contains(adminPanel)){
      adminPanel.classList.remove("hidden");
      const adminBody = adminPanel.querySelector("#homeAdminBody");
      const adminToggle = adminPanel.querySelector("#homeAdminToggle");
      if(adminBody){
        adminBody.hidden = true;
        adminBody.style.removeProperty('display');
      }
      if(adminToggle){
        adminToggle.setAttribute("aria-expanded","false");
        adminToggle.textContent = "ADMIN LOGIN";
      }
    }
    if(studentPanel && studentHost.contains(studentPanel)){
      studentPanel.classList.remove("hidden");
    }
  }


  function openAdminCredentials(){
    const panel = document.getElementById("homeAdminPanel");
    if(!panel) return;
    const body = panel.querySelector("#homeAdminBody");
    const toggle = panel.querySelector("#homeAdminToggle");
    if(body){
      body.hidden = false;
      body.style.setProperty("display","block","important");
    }
    if(toggle){
      toggle.setAttribute("aria-expanded","true");
      toggle.textContent = "CLOSE";
    }
  }

  function scrollTop(){
    try{ window.scrollTo(0,0); }catch(e){}
  }

  function setState(state, replace){
    const b = bodyState();
    clearPublicState();

    if(state === S.FRONT){
      b.classList.add("hoa-public-front");
    }else if(state === S.PORTAL){
      // V6.0.123: the intermediate portal-selection page no longer exists.
      state = S.FRONT;
      b.classList.add("hoa-public-front");
    }else if(state === S.STUDENT){
      b.classList.add("hoa-public-auth","hoa-student-auth");
    }else if(state === S.ADMIN){
      b.classList.add("hoa-public-auth","hoa-admin-auth");
    }else{
      b.classList.add("hoa-public-front");
      state = S.FRONT;
    }

    hideLegacyAuth();
    if(state === S.ADMIN) openAdminCredentials();

    const url = location.pathname + location.search + location.hash;
    const stateObj = {hoaPublicPage:state};
    try{
      if(replace) history.replaceState(stateObj,"",url);
      else history.pushState(stateObj,"",url);
    }catch(e){}

    scrollTop();
  }

  function go(state){
    moveExistingAuthPanels();
    setState(state,false);
  }

  window.hoaShowFrontPage = function(){
    go(S.FRONT);
  };

  window.hoaShowPortalChoices = function(){
    // Legacy compatibility only: the portal-selection screen no longer exists.
    window.hoaShowFrontPage();
  };

  window.hoaOpenPortal = function(type){
    go(type === "admin" ? S.ADMIN : S.STUDENT);
  };

  /*
   * Register and Free Test are existing student workflows. They first enter
   * the Student Portal; after that the existing functions are invoked.
   */
  window.hoaOpenLogin = function(mode){
    if(mode === "register" || mode === "free"){
      go(S.STUDENT);
      setTimeout(function(){
        if(mode === "register" && typeof showAuth === "function"){
          try{ showAuth("register"); }catch(e){}
        }else if(mode === "free" && typeof showFreeGate === "function"){
          try{ showFreeGate(); }catch(e){}
        }
      },50);
      return;
    }
    go(S.STUDENT);
  };

  function renderFromHistory(){
    const s = history.state && history.state.hoaPublicPage;
    if(s === S.PORTAL) goHistory(S.FRONT);
    else if(s === S.STUDENT) goHistory(S.STUDENT);
    else if(s === S.ADMIN) goHistory(S.ADMIN);
    else goHistory(S.FRONT);
  }

  function goHistory(state){
    moveExistingAuthPanels();
    const b = bodyState();
    clearPublicState();

    if(state === S.FRONT || state === S.PORTAL) b.classList.add("hoa-public-front");
    else if(state === S.STUDENT) b.classList.add("hoa-public-auth","hoa-student-auth");
    else b.classList.add("hoa-public-auth","hoa-admin-auth");

    hideLegacyAuth();
    if(state === S.ADMIN) openAdminCredentials();
    scrollTop();
  }

  window.addEventListener("popstate",renderFromHistory);

  function bindBackButtons(){
    /*
     * Back buttons should actually go to the previous public state instead of
     * pushing a new history entry.
     */
    document.querySelectorAll("[data-hoa-back]").forEach(function(btn){
      if(btn.dataset.hoaBackBound === "1") return;
      btn.dataset.hoaBackBound = "1";
      btn.addEventListener("click",function(){
        const target = btn.getAttribute("data-hoa-back");
        if(target === "front") window.hoaShowFrontPage();
        else window.hoaShowPortalChoices();
      });
    });
  }

  function boot(){
    moveExistingAuthPanels();
    const b = bodyState();

    /*
     * Do not interfere with an already authenticated student/admin session.
     * If the public navigation is being loaded fresh, start at Front Page.
     */
    const hasPublic =
      b.classList.contains("hoa-public-front") ||
      b.classList.contains("hoa-public-portal") ||
      b.classList.contains("hoa-public-auth");

    if(!hasPublic){
      clearPublicState();
      b.classList.add("hoa-public-front");
      hideLegacyAuth();
      try{
        history.replaceState({hoaPublicPage:S.FRONT},"",
          location.pathname + location.search + location.hash);
      }catch(e){}
    }else{
      renderFromHistory();
    }

    bindBackButtons();
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded",boot,{once:true});
  }else{
    boot();
  }
})();
