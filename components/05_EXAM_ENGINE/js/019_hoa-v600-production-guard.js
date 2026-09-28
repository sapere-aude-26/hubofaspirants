
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
      const msg=e&&e.message?String(e.message):"Unexpected application error.";
      console.error("HOA production error:",e.error||e.message||e); toast("Something went wrong. Your current screen has not been intentionally changed. Please retry.","error");
      if(/Script error/i.test(msg))return;
    });
    window.addEventListener("unhandledrejection",function(e){
      console.error("HOA unhandled promise rejection:",e.reason); toast("A background operation failed. Please retry the action.","error");
    });
    document.addEventListener("visibilitychange",function(){if(document.visibilityState==="visible")network();});
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();
