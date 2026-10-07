/* HUB OF ASPIRANTS V8.19 CLEAN — consolidated inline runtime. Original execution order preserved: scripts 15–28. */

/* ===== Original inline script 15 ===== */
(function(){
  function initHoaDeveloperConsoleLauncher(){
    var openBtn=document.getElementById("openHoaDevConsole");
    var modal=document.getElementById("hoaDevConsoleModal");
    var closeBtn=document.getElementById("closeHoaDevConsole");
    if(!openBtn||!modal||!closeBtn)return;

    function openConsole(){
      modal.classList.add("open");
      modal.setAttribute("aria-hidden","false");
      document.body.style.overflow="hidden";
    }
    function closeConsole(){
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden","true");
      document.body.style.overflow="";
      // Stay on the current index.html page; this only hides the iframe overlay.
    }

    openBtn.addEventListener("click",openConsole);
    closeBtn.addEventListener("click",closeConsole);
    modal.addEventListener("click",function(e){
      if(e.target===modal)closeConsole();
    });
    document.addEventListener("keydown",function(e){
      if(e.key==="Escape" && modal.classList.contains("open"))closeConsole();
    });
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",initHoaDeveloperConsoleLauncher);
  }else{
    initHoaDeveloperConsoleLauncher();
  }
})();

/* ===== Original inline script 16 ===== */
/* Keep the Developer Console in index.html, but expose its launcher only
   when the existing admin session UI says the user is an administrator. */
(function(){
  function syncAdminConsoleVisibility(){
    var button=document.getElementById("openHoaDevConsole");
    if(!button)return;
    var adminLogout=document.getElementById("adminHeaderLogout");
    var adminVisible=!!adminLogout &&
      !adminLogout.classList.contains("hidden") &&
      getComputedStyle(adminLogout).display!=="none";
    button.classList.toggle("hoa-admin-console-hidden",!adminVisible);
  }
  function boot(){
    syncAdminConsoleVisibility();
    var obs=new MutationObserver(syncAdminConsoleVisibility);
    obs.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:["class","style"]});
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);
  else boot();
})();

/* ===== Original inline script 17 ===== */
(function(){
  "use strict";

  let warningTimer=null;

  function examVisible(){
    const el=document.getElementById("exam");
    if(!el) return false;
    const s=getComputedStyle(el);
    return !el.classList.contains("hidden") && s.display!=="none" && s.visibility!=="hidden";
  }

  function ensureStatus(){
    if(!examVisible()) return;
    const top=document.querySelector("#exam .examTop");
    if(!top || document.getElementById("hoaV598ExamStatus")) return;

    const status=document.createElement("div");
    status.id="hoaV598ExamStatus";
    status.className="hoa-v598-exam-status";
    status.innerHTML='<span class="dot"></span><span class="label">Connection</span><span class="value">Online</span>';

    const right=top.querySelector(".timer")?.parentElement || top.lastElementChild || top;
    right.insertBefore(status, right.firstChild);
  }

  function updateStatus(){
    ensureStatus();
    const el=document.getElementById("hoaV598ExamStatus");
    if(!el) return;

    const offline=!navigator.onLine;
    el.classList.toggle("offline",offline);
    const value=el.querySelector(".value");
    if(value) value.textContent=offline ? "Offline" : "Online";

    const note=document.getElementById("hoaV598SessionNote");
    if(offline){
      if(!note){
        const n=document.createElement("div");
        n.id="hoaV598SessionNote";
        n.className="hoa-v598-session-note";
        n.textContent="Internet connection lost. Your current exam screen is still open; reconnect before relying on server-side saving.";
        document.body.appendChild(n);
        requestAnimationFrame(()=>n.classList.add("show"));
      }
    }else if(note){
      note.classList.remove("show");
      setTimeout(()=>note.remove(),220);
    }
  }

  function installLeaveProtection(){
    if(window.__hoaV598LeaveProtectionInstalled) return;
    window.__hoaV598LeaveProtectionInstalled=true;

    window.addEventListener("beforeunload",function(e){
      if(!examVisible()) return;
      if(window.submitted===true) return;
      e.preventDefault();
      e.returnValue="";
    });

    window.addEventListener("offline",updateStatus);
    window.addEventListener("online",updateStatus);

    setInterval(function(){
      if(examVisible()) updateStatus();
    },1000);
  }

  function boot(){
    installLeaveProtection();
    updateStatus();

    new MutationObserver(function(){
      if(examVisible()) ensureStatus();
    }).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:["class","style"]});
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot);
  else boot();
})();

/* ===== Original inline script 18 ===== */
(function(){
  "use strict";
  const VERSION="V6.0.123";
  window.__HOA_PRODUCTION_VERSION=VERSION;
  let toastTimer=0;
  function ensureUi(){
    if(!document.body)return;
    if(!document.getElementById("hoaV600Status")){
      const n=document.createElement("div"); n.id="hoaV600Status"; n.className="hoa-v600-status"; n.setAttribute("role","status"); n.setAttribute("aria-live","polite");
      n.innerHTML='<span class="dot" aria-hidden="true"></span><span class="msg"></span>'; document.body.appendChild(n);
    }
    if(!document.getElementById("hoaV600Loading")){
      const l=document.createElement("div"); l.id="hoaV600Loading"; l.className="hoa-v600-loading"; l.setAttribute("aria-hidden","true");
      l.innerHTML='<div class="hoa-v600-spinner" role="progressbar" aria-label="Loading"></div>'; document.body.appendChild(l);
    }
  }
  function toast(message,type){
    ensureUi(); const n=document.getElementById("hoaV600Status"); if(!n)return;
    clearTimeout(toastTimer); n.className="hoa-v600-status "+(type||""); const m=n.querySelector(".msg"); if(m)m.textContent=String(message||"");
    requestAnimationFrame(()=>n.classList.add("show")); toastTimer=setTimeout(()=>n.classList.remove("show"),type==="error"?7000:4000);
  }
  window.HOAToast=toast;
  window.HOALoading=function(show){ensureUi();const l=document.getElementById("hoaV600Loading");if(l)l.classList.toggle("show",!!show);};
  function network(){
    ensureUi(); const n=document.getElementById("hoaV600Status"); if(!n)return;
    if(!navigator.onLine){n.className="hoa-v600-status offline show";const m=n.querySelector(".msg");if(m)m.textContent="Internet connection is offline. Reconnect before submitting or saving.";}
    else if(n.classList.contains("offline")){n.classList.remove("show");}
  }
  function prepareButtons(){
    document.querySelectorAll("button").forEach(function(b){
      if(!b.getAttribute("type"))b.setAttribute("type","button");
      if(!b.getAttribute("aria-label") && !b.textContent.trim()){
        const title=b.getAttribute("title"); if(title)b.setAttribute("aria-label",title);
      }
    });
  }
  function observeUi(){
    prepareButtons();
    if(window.__HOA_V600_OBSERVER)return;
    window.__HOA_V600_OBSERVER=true;
    const mo=new MutationObserver(function(records){
      let added=false; for(const r of records){if(r.addedNodes&&r.addedNodes.length){added=true;break;}}
      if(added)prepareButtons();
    });
    mo.observe(document.body,{childList:true,subtree:true});
  }
  function boot(){
    ensureUi(); prepareButtons(); observeUi(); network();
    window.addEventListener("online",function(){toast("Connection restored.","success");network();});
    window.addEventListener("offline",function(){toast("Internet connection lost. Reconnect before submitting or saving.","offline");network();});
    window.addEventListener("error",function(e){
      /* Ignore resource-loading failures here. They do not mean the current
         UI was changed by application code and should not trigger a generic
         user-facing error toast. Uncaught JavaScript errors still surface. */
      if(!e || !e.error) return;
      const msg=e.message?String(e.message):"Unexpected application error.";
      console.error("HOA production error:",e.error||e.message||e);
      if(/Script error/i.test(msg)) return;
      toast("Something went wrong. Please retry.","error");
    });
    window.addEventListener("unhandledrejection",function(e){
      console.error("HOA unhandled promise rejection:",e.reason);
      if(window.__HOA_NAVIGATION_IN_PROGRESS) return;
      toast("A background operation failed. Please retry the action.","error");
    });
    document.addEventListener("visibilitychange",function(){if(document.visibilityState==="visible")network();});
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();

/* ===== Original inline script 19 ===== */
(function(){
  'use strict';
  function syncAdminLogout(){
    var body=document.body, btn=document.getElementById('adminHeaderLogout');
    if(!body || !btn) return;
    if(body.classList.contains('admin-ui')) {
      btn.classList.remove('hidden');
      btn.setAttribute('aria-hidden','false');
    } else {
      btn.classList.add('hidden');
      btn.setAttribute('aria-hidden','true');
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',syncAdminLogout); else syncAdminLogout();
  new MutationObserver(syncAdminLogout).observe(document.body,{attributes:true,attributeFilter:['class']});
})();

/* ===== Original inline script 20 ===== */
/* ===== Original inline script 21 ===== */
/*
 * V6.0.123
 * One history owner: V6.0.123 public router.
 * Authentication lifecycle is coordinated through the existing public router;
 * no second popstate listener is installed.
 */
(function () {
  "use strict";

  function clearAuthClasses() {
    document.body.classList.remove(
      "hoa-app-authenticated",
      "hoa-app-student",
      "hoa-app-admin"
    );
  }

  function clearPublicClasses() {
    document.body.classList.remove(
      "hoa-public-front",
      "hoa-public-portal",
      "hoa-public-auth",
      "hoa-student-auth",
      "hoa-admin-auth"
    );
  }

  function syncLegacyShell() {
    const authScreen = document.getElementById("authScreen");
    const home = document.getElementById("home");
    if (!document.body.classList.contains("hoa-app-authenticated")) {
      if (authScreen) {
        authScreen.classList.add("hidden");
        authScreen.style.removeProperty("display");
      }
      if (home) home.classList.add("hidden");
    }
  }

  window.hoaEnterAuthenticated = function (role) {
    role = role === "admin" ? "admin" : "student";

    clearPublicClasses();
    clearAuthClasses();

    document.body.classList.add("hoa-app-authenticated");
    document.body.classList.add("hoa-app-" + role);

    const authScreen = document.getElementById("authScreen");
    const home = document.getElementById("home");
    if (authScreen) authScreen.classList.add("hidden");
    if (home) home.classList.remove("hidden");

    if (role === "student") {
      document.getElementById("studentOnlyDashboard")?.classList.remove("hidden");
      document.getElementById("adminOnlyDashboard")?.classList.add("hidden");
    } else {
      document.getElementById("adminOnlyDashboard")?.classList.remove("hidden");
      document.getElementById("studentOnlyDashboard")?.classList.add("hidden");
    }

    // Replace the current public entry rather than creating another history
    // stack controlled by the authentication layer.
    try {
      history.replaceState({ hoaApp: true, authenticated: true, role }, "", location.href);
    } catch (_) {}
  };

  window.hoaExitToFrontPage = function () {
    clearAuthClasses();
    clearPublicClasses();

    const authScreen = document.getElementById("authScreen");
    const home = document.getElementById("home");
    if (home) home.classList.add("hidden");
    if (authScreen) authScreen.classList.add("hidden");

    document.getElementById("studentOnlyDashboard")?.classList.add("hidden");
    document.getElementById("adminOnlyDashboard")?.classList.add("hidden");

    document.body.classList.add("hoa-public-front");

    try {
      history.replaceState({ hoaPublic: true, page: "front" }, "", location.href);
    } catch (_) {}

    if (typeof window.hoaShowFrontPage === "function") {
      try { window.hoaShowFrontPage(false); } catch (_) {}
    }
  };

  // Public router remains the only popstate owner. This hook only reconciles
  // authenticated DOM state when the router has already rendered a page.
  window.hoaSyncAuthenticatedShell = function () {
    if (!document.body.classList.contains("hoa-app-authenticated")) {
      syncLegacyShell();
      return;
    }

    const role = document.body.classList.contains("hoa-app-admin") ? "admin" : "student";
    const authScreen = document.getElementById("authScreen");
    const home = document.getElementById("home");
    if (authScreen) authScreen.classList.add("hidden");
    if (home) home.classList.remove("hidden");

    if (role === "admin") {
      document.getElementById("adminOnlyDashboard")?.classList.remove("hidden");
      document.getElementById("studentOnlyDashboard")?.classList.add("hidden");
    } else {
      document.getElementById("studentOnlyDashboard")?.classList.remove("hidden");
      document.getElementById("adminOnlyDashboard")?.classList.add("hidden");
    }
  };
})();

/* ===== Original inline script 22 ===== */
(function () {
  "use strict";

  function normalizeUI() {
    document.documentElement.style.overflowX = "hidden";
    document.body.style.overflowX = "hidden";

    // Prevent accidental native overflow from oversized images in the public shell.
    document.querySelectorAll("#hoaFrontPage img, #hoaLoginPage img").forEach(function (img) {
      img.style.maxWidth = "100%";
      img.style.height = img.style.height || "auto";
    });

    // Add accessible labels to unlabeled password/text inputs only when an
    // adjacent placeholder exists; do not alter application values.
    document.querySelectorAll("input").forEach(function (input) {
      if (!input.getAttribute("aria-label") && !input.labels?.length) {
        const placeholder = input.getAttribute("placeholder");
        if (placeholder) input.setAttribute("aria-label", placeholder);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", normalizeUI, { once: true });
  } else {
    normalizeUI();
  }

  window.addEventListener("resize", normalizeUI, { passive: true });
})();

/* ===== Original inline script 23 ===== */
(function(){
 window.hoaShowFreeComingSoon=function(kind){
   var label=kind==='notes'?'Free Notes':'Free Videos';
   alert(label+' will be connected to the free-content library in the next module.');
 };
})();

/* ===== Original inline script 24 ===== */
(function(){
  'use strict';
  const wrap=document.getElementById('hoaV653ConnectWrap');
  const toggle=document.getElementById('hoaV653ConnectToggle');
  if(!wrap||!toggle||wrap.dataset.bound==='1')return;
  wrap.dataset.bound='1';
  function setOpen(open){wrap.classList.toggle('is-open',open);toggle.setAttribute('aria-expanded',String(open));}
  toggle.addEventListener('click',function(e){e.stopPropagation();setOpen(!wrap.classList.contains('is-open'));});
  document.addEventListener('click',function(e){if(!wrap.contains(e.target))setOpen(false);});
  document.addEventListener('keydown',function(e){if(e.key==='Escape')setOpen(false);});
})();

/* ===== Original inline script 25 ===== */
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

/* ===== Original inline script 26 ===== */
(function(){
  "use strict";

  window.hoaScrollToStudentArea = function(){
    var target = document.getElementById("hoaV648StudentOptions");
    if(!target){
      /* Fallback to the section's title if the wrapper id changes later. */
      target = document.querySelector(".hoa-v648-student-options");
    }

    if(!target) return;

    /* Vertical-only navigation. scrollIntoView() can also adjust the horizontal
       scroll position when a transformed/overflowing child is present; that is
       exactly what causes the public Home canvas to appear shifted on phones. */
    var nav = document.querySelector("#hoaFrontPage .hoa-front-nav");
    var navHeight = nav ? Math.ceil(nav.getBoundingClientRect().height) : 0;
    var top = Math.max(0, window.scrollY + target.getBoundingClientRect().top - navHeight - 10);

    window.scrollTo({
      top: top,
      left: 0,
      behavior: "smooth"
    });

    /* Give keyboard users a meaningful focus target without changing the UI. */
    setTimeout(function(){
      try{
        target.setAttribute("tabindex","-1");
        target.focus({preventScroll:true});
      }catch(e){}
    },450);
  };
})();

/* ===== Original inline script 27 ===== */
/* V6.0.123 — slow, refined scroll-linked hero animation */
(function(){
  function initHOAHeroScroll(){
    const hero = document.querySelector('#hoaFrontPage .hoa-front-hero');
    if(!hero || hero.dataset.scrollAnimationReady === '1') return;
    hero.dataset.scrollAnimationReady = '1';

    const reduceMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if(reduceMotion) return;

    let ticking = false;

    function update(){
      ticking = false;
      const rect = hero.getBoundingClientRect();
      const vh = Math.max(window.innerHeight || 1, 1);

      /* 0 while entering the viewport, 1 as it leaves the upper viewport. */
      const progress = Math.max(0, Math.min(1,
        (vh * 0.78 - rect.top) / Math.max(rect.height + vh * 0.35, 1)
      ));

      /* Small movement only — keeps the hero stable and polished. */
      const shift = (progress - 0.18) * 24;

      hero.style.setProperty('--hoa-scroll-progress', progress.toFixed(4));
      hero.style.setProperty('--hoa-scroll-shift', shift.toFixed(2) + 'px');

      const visible = rect.bottom > 0 && rect.top < vh;
      hero.classList.toggle('hoa-scroll-visible', visible);
    }

    function onScroll(){
      if(!ticking){
        ticking = true;
        requestAnimationFrame(update);
      }
    }

    if('IntersectionObserver' in window){
      const observer = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          if(entry.isIntersecting){
            hero.classList.add('hoa-scroll-ready');
          }
        });
      }, {threshold:0.08});
      observer.observe(hero);
    }else{
      hero.classList.add('hoa-scroll-ready');
    }

    window.addEventListener('scroll', onScroll, {passive:true});
    window.addEventListener('resize', onScroll, {passive:true});
    update();
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', initHOAHeroScroll);
  }else{
    initHOAHeroScroll();
  }
})();

/* ===== Original inline script 28 ===== */
(function(){
  function initEverythingAnimation(){
    const section=document.getElementById('hoaFrontFeatures');
    if(!section || section.dataset.v6083Animation==='ready') return;
    section.dataset.v6083Animation='ready';
    section.classList.add('hoa-v6083-features-animate');
    if(!('IntersectionObserver' in window)){
      section.classList.add('is-visible');
      return;
    }
    const observer=new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          section.classList.add('is-visible');
          observer.unobserve(section);
        }
      });
    },{threshold:.16,rootMargin:'0px 0px -60px 0px'});
    observer.observe(section);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',initEverythingAnimation);
  else initEverythingAnimation();
})();
