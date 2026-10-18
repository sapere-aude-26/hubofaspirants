/* HUB OF ASPIRANTS V8.19 CLEAN — consolidated inline runtime. Original execution order preserved: scripts 7–9. */

/* ===== Original inline script 7 ===== */
(function(){
  "use strict";
  function removePublicStudentLogin(){
    if(document.body.classList.contains("hoa-login-page")) return;
    const roots=document.querySelectorAll("header, nav, .header, .navbar, .topbar, .publicHeader");
    roots.forEach(function(root){
      root.querySelectorAll("a,button").forEach(function(el){
        /* P18: the redesigned public homepage owns its Student Login action.
           The old cleanup removed any button with this title/aria-label, including
           #hoaFrontPage's working navigation button. Keep all current homepage
           controls intact; only clean up duplicate legacy header actions elsewhere. */
        if(el.closest && el.closest("#hoaFrontPage")) return;
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

/* ===== Original inline script 8 ===== */
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

  function isStandaloneAdminPortal(){
    const root = document.documentElement;
    const b = document.body;
    return !!(root && root.classList.contains("hoa-admin-portal")) || !!(b && b.dataset && b.dataset.hoaPortal === "admin");
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
    if(!auth || !studentHost) return;

    const adminHost = document.getElementById("hoaAdminLoginHost");
    const adminPanel = auth.querySelector("#homeAdminPanel");
    const panels = Array.from(auth.querySelectorAll(".dashPanel"));
    const studentPanel = panels.find(p => p !== adminPanel);

    if(studentPanel && !studentHost.contains(studentPanel)){
      studentHost.appendChild(studentPanel);
    }

    /* Admin login is no longer part of the public page. Keep the legacy
       compatibility move only when an older/admin shell actually provides
       both elements; never require them for Student login. */
    if(adminHost && adminPanel && !adminHost.contains(adminPanel)){
      adminHost.appendChild(adminPanel);
    }
    if(adminHost && adminPanel && adminHost.contains(adminPanel)){
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

  function currentPublicState(){
    const hs = window.history && window.history.state;
    const state = hs && hs.hoaPublicPage;
    if(state === S.FRONT || state === S.STUDENT || state === S.ADMIN) return state;
    const b = bodyState();
    if(b.classList.contains("hoa-admin-auth")) return S.ADMIN;
    if(b.classList.contains("hoa-student-auth")) return S.STUDENT;
    if(b.classList.contains("hoa-public-front")) return S.FRONT;
    return null;
  }

  let frontBackPending = false;

  function setState(state, replace){
    const previousState = currentPublicState();
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
    if(!replace && previousState && previousState !== state){
      stateObj.hoaPreviousPublicPage = previousState;
    }
    try{
      if(replace) history.replaceState(stateObj,"",url);
      else history.pushState(stateObj,"",url);
    }catch(e){}

    scrollTop();
  }

  function go(state){
    moveExistingAuthPanels();
    const normalizedState = state === S.PORTAL ? S.FRONT : state;
    /* Re-entering the current public view should not create duplicate history
       entries. Register/free flows can still change their active auth tab after
       this route check without adding repeated Student Login entries. */
    if(currentPublicState() === normalizedState){
      goHistory(normalizedState);
      return;
    }
    setState(state,false);
  }

  window.hoaShowFrontPage = function(){
    if(frontBackPending) return;
    const hs = window.history && window.history.state;
    /* Login is normally pushed from the homepage. Returning with HOME should
       consume that router-created entry, not push another homepage entry (which
       made the phone/browser Back button reopen Login). Use history.back only
       when this entry explicitly records a router-managed Front -> Student
       transition; otherwise replace the current entry as a safe fallback. */
    if(hs && hs.hoaPublicPage === S.STUDENT &&
       hs.hoaPreviousPublicPage === S.FRONT){
      frontBackPending = true;
      try{ history.back(); return; }catch(e){ frontBackPending = false; }
    }
    frontBackPending = false;
    setState(S.FRONT,true);
  };

  window.hoaShowPortalChoices = function(){
    // Legacy compatibility only: the portal-selection screen no longer exists.
    window.hoaShowFrontPage();
  };

  window.hoaOpenPortal = function(type){
    if(type === "admin" && !isStandaloneAdminPortal()){
      try{ location.assign("./admin.html"); }catch(e){ location.href = "admin.html"; }
      return;
    }
    go(type === "admin" ? S.ADMIN : S.STUDENT);
    if(type !== "admin") {
      setTimeout(function(){
        try{ moveExistingAuthPanels(); }catch(e){}
        try{ if(typeof showAuth === "function") showAuth("login"); }catch(e){}
      },0);
    }
  };

  /*
   * Register and Free Test are existing student workflows. They first enter
   * the Student Portal; after that the existing functions are invoked.
   */
  window.hoaOpenLogin = function(mode){
    /* P36: the public Free Student gate and the legacy Paid Student auth tabs
       are mutually exclusive views. Close the Free Student overlay before
       switching to Student Login / Paid Register / Free Test. */
    try{
      const freeModal = document.getElementById("hoaV648FreeContentModal");
      if(freeModal){
        freeModal.classList.add("hidden");
        freeModal.classList.remove("hoa-v619-visible");
        ["display","visibility","opacity","pointer-events","z-index"].forEach(function(k){ freeModal.style.removeProperty(k); });
      }
      document.documentElement.classList.remove("hoa-free-modal-open");
      document.body.classList.remove("hoa-free-modal-open");
    }catch(e){}
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
    setTimeout(function(){
      try{ moveExistingAuthPanels(); }catch(e){}
      try{ if(typeof showAuth === "function") showAuth("login"); }catch(e){}
    },0);
  };

  function renderFromHistory(){
    frontBackPending = false;
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

    /* Standalone Admin Portal is not part of the public router. Keep its
       login state isolated so the public Front Page cannot hide admin.html. */
    if(isStandaloneAdminPortal()){
      clearPublicState();
      b.classList.add("hoa-public-auth","hoa-admin-auth");
      hideLegacyAuth();
      try{ history.replaceState({hoaPublicPage:S.ADMIN},"",location.pathname+location.search+location.hash); }catch(e){}
      bindBackButtons();
      return;
    }

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

/* ===== Original inline script 9 ===== */
(function(){
  const RE=/^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{6,}$/;
  window.hoaAdminPasswordPolicy={
    minLength:6,
    validate:function(password){
      const p=String(password||"");
      return {valid:RE.test(p),length:p.length>=6,upper:/[A-Z]/.test(p),lower:/[a-z]/.test(p),special:/[^A-Za-z0-9]/.test(p)};
    }
  };
  window.hoaValidateAdminPassword=function(password){
    const r=window.hoaAdminPasswordPolicy.validate(password);
    return r.valid ? {ok:true,message:""} : {
      ok:false,
      message:"Admin password must be at least 6 characters and contain at least 1 uppercase letter, 1 lowercase letter and 1 special character."
    };
  };
  window.hoaOwnerCredentialsAreSupabaseManaged=true;
})();
