
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
