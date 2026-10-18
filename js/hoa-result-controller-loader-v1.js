/* HOA V8.90.53 — on-demand student result controller.
   Keeps the initial public homepage lean; loads the authoritative result/review
   controller before an exam is shown or when result history/review is requested.
   Shared-link and direct Free Test result routes load it immediately. */
(function (global, document) {
  'use strict';
  var current = document.currentScript;
  var loaderBase = current && current.src ? current.src : new URL('js/hoa-result-controller-loader-v1.js', document.baseURI).href;
  var controllerSrc = new URL('exam-result-controller-v3.js?v=20261018-p60-baseline-flow-correction', loaderBase).href;
  var loadPromise = null;

  function alreadyReady() {
    return !!(global.__HOA_EXAM_RESULT_V3 && global.__HOA_EXAM_RESULT_V3.version);
  }

  function ensureLoaded() {
    if (alreadyReady()) return Promise.resolve(true);
    if (loadPromise) return loadPromise;
    loadPromise = new Promise(function (resolve, reject) {
      var existing = document.querySelector('script[data-hoa-result-controller="1"]');
      var script = existing || document.createElement('script');
      var created = !existing;
      var settled = false;
      function finish(error) {
        if (settled) return;
        settled = true;
        script.removeEventListener('load', onload);
        script.removeEventListener('error', onerror);
        if (error || !alreadyReady()) {
          if (created && script.parentNode) script.parentNode.removeChild(script);
          loadPromise = null;
          reject(error || new Error('The result controller did not initialise.'));
          return;
        }
        script.dataset.loaded = '1';
        resolve(true);
      }
      function onload() { finish(null); }
      function onerror() { finish(new Error('Could not load the student result controller.')); }
      script.addEventListener('load', onload, { once: true });
      script.addEventListener('error', onerror, { once: true });
      if (created) {
        script.src = controllerSrc;
        script.async = false;
        script.dataset.hoaResultController = '1';
        document.head.appendChild(script);
      } else if (script.dataset.loaded === '1' && alreadyReady()) {
        finish(null);
      }
    });
    return loadPromise;
  }

  global.hoaEnsureResultControllerLoaded = ensureLoaded;

  function routeNeedsController() {
    try {
      var url = new URL(global.location.href);
      var p = url.searchParams;
      var freePage = p.get('hoa_free_page');
      return ['hoa_test_link', 'hoa_result_link', 'hoa_free_test_link', 'hoa_free_result_link'].some(function (key) { return p.has(key); }) ||
        ['test', 'review', 'answers'].indexOf(freePage) >= 0;
    } catch (_) { return false; }
  }

  function closest(target, selector) {
    return target && typeof target.closest === 'function' ? target.closest(selector) : null;
  }

  function resultTab(target) {
    return closest(target, '#candidateNavResult, #hoaV650PaidLearningPortal [data-v650-mock-tab="results"]');
  }

  function isResultAction(target) {
    return !!closest(target, '#candidateNavResult, #hoaV650PaidLearningPortal [data-v650-mock-tab="results"], #resultBackBtn, .viewAttemptBtn, [data-v3-attempt], [onclick*="viewStudentAttempt"]');
  }

  function isExamLaunchAction(target) {
    return !!closest(target, '[onclick*="startSavedTest"], [data-hoa-start-saved-test], [data-v650-mock-tab="tests"]');
  }

  function requestWhenRelevant(event) {
    var target = event && event.target;
    var tab = resultTab(target);
    /* Do not let a fast click open the results area before its authoritative
       controller has registered. Replay only result-tab navigation after load;
       this is not used for exam launch, fullscreen, form submission, or links. */
    if (event && event.type === 'click' && tab && !alreadyReady() && !event.__hoaResultControllerReplay) {
      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
      ensureLoaded().then(function () {
        if (tab.isConnected && typeof tab.click === 'function') tab.click();
      }).catch(function (error) {
        console.warn('[HOA] Result controller could not load; using the existing results navigation:', error && error.message ? error.message : error);
        if (!tab.isConnected) return;
        var insidePaidPortal = typeof tab.closest === 'function' && !!tab.closest('#hoaV650PaidLearningPortal');
        if ((insidePaidPortal || tab.getAttribute('data-v650-mock-tab') === 'results') && typeof global.hoaStudentShowMockTab === 'function') {
          global.hoaStudentShowMockTab('result');
        } else if (tab.id === 'candidateNavResult' && typeof global.showCandidateSection === 'function') {
          global.showCandidateSection('result');
        }
      });
      return;
    }
    if (isResultAction(target) || isExamLaunchAction(target)) {
      ensureLoaded().catch(function (error) {
        console.warn('[HOA] Result controller will retry when needed:', error && error.message ? error.message : error);
      });
    }
  }

  /* Begin loading on focus/hover so it is commonly ready before a result button is activated. */
  document.addEventListener('pointerover', requestWhenRelevant, true);
  document.addEventListener('focusin', requestWhenRelevant, true);
  document.addEventListener('click', requestWhenRelevant, true);

  /* Deep links must initialise their route controller without waiting for user input. */
  if (routeNeedsController()) {
    ensureLoaded().catch(function (error) {
      global.__HOA_RESULT_CONTROLLER_LOAD_ERROR__ = String(error && error.message ? error.message : error);
      console.error('[HOA] Could not initialise the result route:', error);
    });
  }
})(window, document);
