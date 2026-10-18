/* HOA P3: load exam-only resources when a saved test is selected.
   The exam screen waits for CSS and its interaction/accessibility bridge before it is shown. */
(function(global, document){
  'use strict';
  var loaderScript = document.currentScript;
  var loaderBase = loaderScript && loaderScript.src
    ? loaderScript.src
    : new URL('js/hoa-exam-style-loader-v1.js', document.baseURI).href;
  var cssHref = new URL('../css/hoa-exam-responsive-v8.18.css?v=20261018-p58-mobile-exam-audit-fix', loaderBase).href;
  var bridgeHref = new URL('exam-ui-responsive-v8.js?v=20261018-p50-mobile-exam-polish', loaderBase).href;
  var promise = null;
  var loaded = false;

  function ensureExamCss(){
    return new Promise(function(resolve, reject){
      var link = document.querySelector('link[data-hoa-exam-responsive-style="1"]');
      if (link && link.dataset.loaded === '1') { resolve(); return; }
      var created = !link;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = cssHref;
        link.dataset.hoaExamResponsiveStyle = '1';
      }
      var settled = false;
      function done(err){
        if (settled) return;
        settled = true;
        link.onload = null;
        link.onerror = null;
        if (err) {
          if (created) { try { link.remove(); } catch (_) {} }
          reject(err);
        } else {
          link.dataset.loaded = '1';
          resolve();
        }
      }
      link.addEventListener('load', function(){ done(); }, { once: true });
      link.addEventListener('error', function(){ done(new Error('Unable to load the exam layout stylesheet.')); }, { once: true });
      if (created) document.head.appendChild(link);
    });
  }

  function ensureExamBridge(){
    return new Promise(function(resolve, reject){
      if (document.documentElement.dataset.hoaExamUiBridgeLoaded === '1') { resolve(); return; }
      var script = document.querySelector('script[data-hoa-exam-ui-bridge="1"]');
      var created = !script;
      if (!script) {
        script = document.createElement('script');
        script.src = bridgeHref;
        script.async = true;
        script.dataset.hoaExamUiBridge = '1';
      }
      var settled = false;
      function done(err){
        if (settled) return;
        settled = true;
        script.onload = null;
        script.onerror = null;
        if (err) {
          if (created) { try { script.remove(); } catch (_) {} }
          reject(err);
        } else {
          document.documentElement.dataset.hoaExamUiBridgeLoaded = '1';
          resolve();
        }
      }
      script.addEventListener('load', function(){ done(); }, { once: true });
      script.addEventListener('error', function(){ done(new Error('Unable to load exam interaction and accessibility helpers.')); }, { once: true });
      if (created) document.head.appendChild(script);
      else if (script.dataset.loaded === '1') done();
    });
  }

  /* Backward-compatible API name: launch code already awaits hoaEnsureExamStyles().
     This now guarantees both the layout stylesheet and the exam-only bridge are ready. */
  global.hoaEnsureExamStyles = function(){
    if (loaded) return Promise.resolve();
    if (promise) return promise;
    promise = Promise.all([ensureExamCss(), ensureExamBridge()]).then(function(){
      loaded = true;
      /* Ensure result guards/review handlers are installed before the exam appears.
         A result-controller network failure is logged but must not block exam launch. */
      if (typeof global.hoaEnsureResultControllerLoaded === 'function') {
        return global.hoaEnsureResultControllerLoaded().catch(function(error){
          console.warn('HOA result controller could not load before exam launch; continuing with existing fallback result flow:', error);
          return false;
        });
      }
      return true;
    }).catch(function(error){
      promise = null;
      throw error;
    });
    return promise;
  };
})(window, document);
