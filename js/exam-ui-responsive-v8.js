
/* HOA Exam Responsive V8 - presentation-only helpers. */
(function(){
  "use strict";
  function byId(id){return document.getElementById(id);}
  function setConnection(){
    const el=byId("hoaExamConnectionStatus");
    if(!el)return;
    const online=navigator.onLine!==false;
    el.classList.toggle("is-offline",!online);
    const label=el.querySelector("span:last-child");
    if(label)label.textContent=online?"Connection Online":"Connection Offline";
    el.setAttribute("aria-label",online?"Connection Online":"Connection Offline");
  }
  function syncProgressAccessibility(){
    const exam=byId("exam"), bar=byId("bar");
    if(!exam||!bar)return;
    const progress=exam.querySelector(".hoa-exam-progress");
    if(!progress)return;
    const width=Math.max(0,Math.min(100,parseFloat(bar.style.width)||0));
    progress.setAttribute("aria-valuenow",String(Math.round(width)));
  }
  function init(){
    setConnection();
    window.addEventListener("online",setConnection);
    window.addEventListener("offline",setConnection);
    const exam=byId("exam");
    if(exam){
      const bar=byId("bar");
      if(bar){
        new MutationObserver(syncProgressAccessibility).observe(bar,{attributes:true,attributeFilter:["style"]});
      }
    }
    syncProgressAccessibility();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();

/* HOA Exam Responsive V8.7 — interaction/integrity bridge.
 * Presentation-layer safeguard only. The proven unified runtime remains the
 * behavior authority. This bridge repairs phase synchronization for admin
 * preview and student/free exams without duplicating the exam engine. */
(function(){
  "use strict";

  function byId(id){ return document.getElementById(id); }

  function isAdminPreview(){
    return window.adminPreviewMode === true;
  }

  function examIsVisible(){
    const exam = byId("exam");
    if(!exam) return false;
    const cs = getComputedStyle(exam);
    return !exam.classList.contains("hidden") &&
           cs.display !== "none" &&
           cs.visibility !== "hidden";
  }

  function examSurfaceActive(){
    const body = document.body;
    return body.classList.contains("v13-exam-active") ||
           body.classList.contains("exam-active") ||
           body.classList.contains("hoa-exam-live") ||
           body.dataset.hoaPhase21Exam === "active" ||
           body.dataset.hoaExamMode === "exam";
  }

  function examFallbackAction(button){
    if(!button) return false;
    const runtime = window.hoaUnifiedExamRuntime;

    if(runtime){
      const map = {
        ui21Prev: runtime.prev,
        ui21MarkReview: runtime.markReview,
        ui21Clear: runtime.clearResponse,
        ui21SaveNext: runtime.saveNext,
        ui21Submit: runtime.submit
      };
      const fn = map[button.id];
      if(typeof fn === "function"){
        try{
          fn.call(runtime);
          return true;
        }catch(error){
          console.error("HOA V8.7 exam control fallback failed:", error);
        }
      }
    }

    if(button.id === "ui21Submit" && typeof window.openMissionSubmitConfirmation === "function"){
      try{
        window.openMissionSubmitConfirmation();
        return true;
      }catch(error){
        console.error("HOA V8.7 submit confirmation fallback failed:", error);
      }
    }

    if(button.id === "ui21Submit" && typeof window.submitTest === "function"){
      try{
        window.submitTest(false);
        return true;
      }catch(error){
        console.error("HOA V8.7 submit fallback failed:", error);
      }
    }

    return false;
  }

  function reconcileRuntimePhase(){
    const runtime = window.hoaUnifiedExamRuntime;
    if(!runtime || !examIsVisible() || !examSurfaceActive()){
      delete document.documentElement.dataset.hoaV87PhaseAligned;
      return;
    }

    if(document.documentElement.dataset.hoaV87PhaseAligned === "1") return;

    try{
      if(isAdminPreview()){
        /* Admin preview is intentionally non-integrity. We still put the
         * shared runtime into active phase so the five controls work. */
        if(runtime.state && runtime.state.phase !== "active"){
          runtime.setPhase("active");
          runtime.state.finalizing = false;
        }
      }else if(runtime.state && runtime.state.phase !== "active" &&
               typeof runtime.activate === "function"){
        runtime.activate();
      }
      document.documentElement.dataset.hoaV87PhaseAligned = "1";
    }catch(error){
      console.warn("HOA V8.7 runtime phase reconciliation skipped:", error);
    }
  }

  function bindInteractionFallback(){
    if(document.documentElement.dataset.hoaV87InteractionBridge === "1") return;
    document.documentElement.dataset.hoaV87InteractionBridge = "1";

    document.addEventListener("click", function(event){
      const button = event.target && event.target.closest
        ? event.target.closest("#exam.hoa-unified-exam .ui21-bottom button")
        : null;
      if(!button) return;
      if(event.defaultPrevented) return;
      if(examFallbackAction(button)) event.preventDefault();
    }, false);
  }

  function bindDirectFallbackHandlers(){
    const bind=()=>{
      ["ui21Prev","ui21MarkReview","ui21Clear","ui21SaveNext","ui21Submit"].forEach(function(id){
        const button=byId(id);
        if(!button || button.dataset.hoaV87Bound === "1") return;
        button.dataset.hoaV87Bound="1";
        button.addEventListener("click", function(event){
          if(event.defaultPrevented) return;
          if(examFallbackAction(button)) event.preventDefault();
        }, false);
      });
    };
    bind();
    new MutationObserver(bind).observe(document.body,{subtree:true,childList:true});
  }

  function bootV87Bridge(){
    bindInteractionFallback();
    bindDirectFallbackHandlers();
    reconcileRuntimePhase();
    new MutationObserver(reconcileRuntimePhase).observe(document.body,{attributes:true,attributeFilter:["class","style","hidden" ]});
    window.setInterval(reconcileRuntimePhase,500);
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", bootV87Bridge, {once:true});
  }else{
    bootV87Bridge();
  }
})();

