
/* HUB OF ASPIRANTS V5.2 — Test Attempt Reliability Layer
   The existing Supabase attempt/submission logic remains authoritative.
   This layer provides browser-side recovery for an active test. */
(function(){
  const KEY = "hoa_v5_2_active_attempt";

  function safeGet(){
    try { return JSON.parse(localStorage.getItem(KEY) || "null"); }
    catch(e){ return null; }
  }
  function safeSet(v){
    try { localStorage.setItem(KEY, JSON.stringify(v)); } catch(e){}
  }
  function clearRecovery(){
    try { localStorage.removeItem(KEY); } catch(e){}
  }

  window.HOA_attemptRecovery = {
    save: function(payload){
      if(!payload || typeof payload !== "object") return;
      safeSet({
        savedAt: Date.now(),
        payload: payload
      });
    },
    load: function(){
      const v = safeGet();
      return v && v.payload ? v : null;
    },
    clear: clearRecovery
  };

  /* Prevent accidental loss on refresh/navigation while a test is active.
     No blocking prompt is shown when the page is being submitted normally. */
  window.addEventListener("beforeunload", function(e){
    try{
      const active =
        window.HOA_testActive === true ||
        window.currentTestActive === true ||
        document.querySelector(
          "#testScreen:not(.hidden), #testInterface:not(.hidden), #testPage:not(.hidden)"
        );
      if(active){
        e.preventDefault();
        e.returnValue = "";
      }
    }catch(_){}
  });

  /* If the application exposes a current answer collection, periodically
     snapshot it without changing the existing submission flow. */
  setInterval(function(){
    try{
      if(window.HOA_testActive !== true && window.currentTestActive !== true) return;

      const candidateNames = [
        "userAnswers","answers","selectedAnswers",
        "currentAnswers","testAnswers"
      ];

      let data = null;
      for(const name of candidateNames){
        if(window[name] && typeof window[name] === "object"){
          data = window[name];
          break;
        }
      }

      if(data) window.HOA_attemptRecovery.save({
        answers: data,
        testId: window.currentTestId || window.activeTestId || null
      });
    }catch(_){}
  }, 5000);

  /* Expose an explicit clear hook for successful submission handlers. */
  window.HOA_clearAttemptRecovery = clearRecovery;
})();
