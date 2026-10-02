/* HOA Unified Student Examination Runtime V4
 * One active examination controller for Paid Mock Tests and Free Content Tests.
 * Storage/access remains delegated to the existing paid/free adapters.
 */
(function(global){
  'use strict';
  if(global.__HOA_UNIFIED_EXAM_RUNTIME_V4)return;
  global.__HOA_UNIFIED_EXAM_RUNTIME_V4=true;

  const D=document;
  const id=x=>D.getElementById(x);
  const qsa=(sel)=>Array.from(D.querySelectorAll(sel));
  const show=e=>{if(!e)return;e.classList.remove('hidden');e.removeAttribute('aria-hidden');e.style.removeProperty('display');e.style.removeProperty('visibility');e.style.removeProperty('opacity');e.style.removeProperty('pointer-events');};
  const hide=e=>{if(!e)return;e.classList.add('hidden');e.setAttribute('aria-hidden','true');e.style.setProperty('display','none','important');e.style.setProperty('pointer-events','none','important');};
  const safe=(fn)=>{try{return fn()}catch(e){console.error('HOA unified exam runtime:',e);return undefined;}};

  const state={phase:'idle',integrity:false,violations:0,maxViolations:3,warningOpen:false,internalUntil:0,intentional:false,finalizing:false,bound:false,blurTimer:null};

  function setPhase(phase){
    state.phase=phase;
    D.body.dataset.hoaExamRuntime=phase;
    D.body.classList.toggle('hoa-unified-exam-active',phase==='active');
    D.body.classList.toggle('hoa-unified-exam-launch',phase==='launch');
    D.body.classList.toggle('hoa-unified-exam-result',phase==='result');
  }

  function closeFeedback(){
    ['hoaFeedbackModal','hoaPublicFeedbackModal'].forEach(x=>hide(id(x)));
    D.body.classList.remove('hoa-feedback-open');
    D.body.dataset.hoaFeedbackState='closed';
  }

  function hideNormalSurfaces(){
    ['home','authScreen','adminOnlyDashboard','studentOnlyDashboard','hoaGlobalPublicFooter','hoaPublicFeedbackStrip','hoaPublicFeedbackModal','hoaFeedbackModal','hoaV650PaidLearningPortal','testInstructionsModal','testCountdownOverlay','result'].forEach(x=>hide(id(x)));
    closeFeedback();
  }

  function showExamOnly(){
    hideNormalSurfaces();
    const exam=id('exam');
    if(exam){
      show(exam);
      exam.style.setProperty('display','block','important');
      exam.style.setProperty('visibility','visible','important');
      exam.style.setProperty('opacity','1','important');
      exam.style.setProperty('pointer-events','auto','important');
    }
  }

  function ensureWarning(){
    let m=id('examIntegrityWarning');
    if(!m){
      m=D.createElement('div');
      m.id='examIntegrityWarning';
      m.innerHTML='<div class="ei-card"><div class="ei-icon">⚠️</div><h2 id="eiTitle">Examination Warning</h2><p id="eiText"></p><p>Violation <span class="ei-count" id="eiCount">0 / 3</span></p><button id="eiContinue" type="button">Return to Examination</button></div>';
      D.body.appendChild(m);
      const b=id('eiContinue');
      if(b)b.addEventListener('click',async function(){
        if(state.finalizing){closeWarning();return;}
        closeWarning();
        state.intentional=false;
        await requestFullscreen();
        if(state.integrity){showExamOnly();}
      });
    }
    return m;
  }
  function closeWarning(){
    const m=id('examIntegrityWarning');if(m)m.style.setProperty('display','none','important');
    state.warningOpen=false;
  }
  function showWarning(reason,final){
    const m=ensureWarning();
    const title=id('eiTitle'),text=id('eiText'),count=id('eiCount'),btn=id('eiContinue');
    if(count)count.textContent=`${state.violations} / ${state.maxViolations}`;
    if(final){
      if(title)title.textContent='Examination Submitted';
      if(text)text.textContent='You have exceeded the allowed examination violations. Your test is being submitted.';
      if(btn)btn.textContent='View Submitted Result';
    }else{
      if(title)title.textContent='⚠️ Examination Warning';
      if(text)text.textContent=`${reason} Please return to the examination screen and continue your test.`;
      if(btn)btn.textContent='Return to Examination';
    }
    m.style.setProperty('display','flex','important');
    m.style.setProperty('visibility','visible','important');
    m.style.setProperty('opacity','1','important');
    m.style.setProperty('pointer-events','auto','important');
    state.warningOpen=true;
  }

  async function requestFullscreen(){
    if(D.fullscreenElement)return true;
    const root=D.documentElement;
    const fn=root&&(root.requestFullscreen||root.webkitRequestFullscreen||root.msRequestFullscreen);
    if(typeof fn!=='function'){
      D.body.classList.add('hoa-local-exam-immersive');
      return false;
    }
    try{
      const r=fn.call(root,{navigationUI:'hide'});
      if(r&&typeof r.then==='function')await r;
      D.body.classList.remove('hoa-local-exam-immersive');
      return true;
    }catch(_){
      try{
        const r=fn.call(root);
        if(r&&typeof r.then==='function')await r;
        D.body.classList.remove('hoa-local-exam-immersive');
        return true;
      }catch(__){
        D.body.classList.add('hoa-local-exam-immersive');
        return false;
      }
    }
  }
  async function exitFullscreen(){
    state.intentional=true;
    try{if(D.fullscreenElement&&D.exitFullscreen)await D.exitFullscreen();}catch(_){ }
    D.body.classList.remove('hoa-local-exam-immersive');
  }

  function markInternal(ms){state.internalUntil=Math.max(state.internalUntil||0,Date.now()+Math.max(0,Number(ms)||0));}

  function isExamVisible(){
    const e=id('exam');
    if(!e)return false;
    const cs=getComputedStyle(e);
    return !e.classList.contains('hidden')&&cs.display!=='none'&&cs.visibility!=='hidden';
  }

  async function violation(reason){
    if(!state.integrity||state.finalizing||state.warningOpen||Date.now()<state.internalUntil)return;
    if(Date.now()<state._lastViolation+1200)return;
    state._lastViolation=Date.now();
    state.violations++;
    if(state.violations>=state.maxViolations){
      state.finalizing=true;
      state.integrity=false;
      showWarning(reason,true);
      setTimeout(async()=>{
        try{if(typeof global.submitTest==='function')await global.submitTest(true);}catch(e){console.error('HOA auto-submit after violations failed:',e);}
      },250);
      return;
    }
    showWarning(reason,false);
  }

  function bindIntegrity(){
    if(state.bound)return;
    state.bound=true;
    D.addEventListener('fullscreenchange',()=>{
      if(state.intentional)return;
      if(state.integrity&&state.phase==='active'&&!D.fullscreenElement)violation('You exited full-screen mode.');
    },true);
    D.addEventListener('visibilitychange',()=>{
      if(state.integrity&&state.phase==='active'&&D.visibilityState==='hidden')violation('You left the examination tab or window.');
    },true);
    // Window blur can occur transiently while an in-page exam control is being
    // focused/re-rendered (especially in fullscreen). Never count that as a
    // violation unless the document actually remains unfocused.
    global.addEventListener('blur',(ev)=>{
      if(!state.integrity||state.phase!=='active')return;
      if(Date.now()<state.internalUntil)return;
      if(state.blurTimer)clearTimeout(state.blurTimer);
      state.blurTimer=setTimeout(()=>{
        state.blurTimer=null;
        if(!state.integrity||state.phase!=='active'||state.finalizing||state.warningOpen)return;
        if(Date.now()<state.internalUntil)return;
        if(D.visibilityState!=='visible')return;
        if(D.hasFocus && D.hasFocus())return;
        violation('The examination window lost focus.');
      },180);
    },true);

    // Every normal exam control interaction is internal activity. This includes
    // Clear Response and prevents a focus/re-render transition from being
    // interpreted as an integrity violation.
    D.addEventListener('pointerdown',(ev)=>{
      if(!state.integrity||state.phase!=='active')return;
      const t=ev.target&&ev.target.closest?ev.target.closest('#exam button, #exam input, #exam select, #exam textarea, #exam a'):null;
      if(t)markInternal(t.id==='ui21Clear'?2200:1500);
    },true);
    D.addEventListener('keydown',(ev)=>{
      if(!state.integrity||state.phase!=='active')return;
      const t=ev.target&&ev.target.closest?ev.target.closest('#exam button, #exam input, #exam select, #exam textarea, #exam a'):null;
      if(t)markInternal(1200);
    },true);
  }

  function commitCurrent(){
    const i=Number(global.current)||0;
    if(!Array.isArray(global.answers))global.answers=[];
    if(!Array.isArray(global.pendingAnswers))global.pendingAnswers=[];
    global.answers[i]=global.pendingAnswers[i]??global.answers[i]??null;
    return i;
  }
  function rerender(){if(typeof global.render==='function')global.render();}
  function prev(){markInternal(1200);const i=commitCurrent();if(i>0){global.current=i-1;rerender();requestAnimationFrame(scrollExamQuestionToTop);}}
  function scrollExamQuestionToTop(){
    const card=D.querySelector('#exam .examGrid > .card:first-child');
    if(card)card.scrollTop=0;
  }
  function saveNext(){
    markInternal(1800);
    const total=Array.isArray(global.questions)?global.questions.length:0;
    const i=Math.max(0,Number(global.current)||0);
    commitCurrent();
    if(total>0 && i<total-1){
      global.current=i+1;
      if(Array.isArray(global.pendingAnswers)) global.pendingAnswers[global.current]=global.answers?.[global.current]??global.pendingAnswers[global.current]??null;
      if(Array.isArray(global.visited)) global.visited[global.current]=true;
    }
    rerender();
    requestAnimationFrame(scrollExamQuestionToTop);
  }
  function markReview(){markInternal(1600);const i=commitCurrent();if(Array.isArray(global.visited))global.visited[i]=true;if(Array.isArray(global.marked))global.marked[i]=true;if(i<global.questions.length-1)global.current=i+1;rerender();requestAnimationFrame(scrollExamQuestionToTop);}
  function clearResponse(){markInternal(2200);const i=Number(global.current)||0;if(Array.isArray(global.pendingAnswers))global.pendingAnswers[i]=null;if(Array.isArray(global.answers))global.answers[i]=null;if(Array.isArray(global.marked))global.marked[i]=false;if(Array.isArray(global.visited))global.visited[i]=true;rerender();}
  function submit(){markInternal(1000);if(typeof global.openMissionSubmitConfirmation==='function')global.openMissionSubmitConfirmation();else if(typeof global.submitTest==='function')global.submitTest(false);}

  function beginSubmission(){
    // Final submission can involve one or more awaited Supabase calls.
    // Integrity must stop immediately so fullscreen exit, focus changes or
    // the result transition cannot be misclassified as a violation.
    state.finalizing=true;
    state.integrity=false;
    state.warningOpen=false;
    closeWarning();
  }

  function resumeAfterFailedSubmission(){
    state.finalizing=false;
    if(state.phase==='active'){
      state.integrity=true;
      state.warningOpen=false;
      closeWarning();
      bindIntegrity();
    }
  }

  function controlClick(e){
    if(state.phase!=='active')return;
    const t=e.target&&e.target.closest?e.target.closest('button'):null;
    if(!t)return;
    let fn=null;
    if(t.id==='ui21Prev')fn=prev;
    else if(t.id==='ui21MarkReview')fn=markReview;
    else if(t.id==='ui21Clear')fn=clearResponse;
    else if(t.id==='ui21SaveNext')fn=saveNext;
    else if(t.id==='ui21Submit'||t.id==='examSubmitTestButton'||t.matches('[data-mission-submit="1"]'))fn=submit;
    if(fn){e.preventDefault();e.stopImmediatePropagation();safe(fn);return;}
    if(t.classList.contains('option')){
      const opts=global.questions?.[Number(global.current)||0];
      if(opts){
        const label=(t.textContent||'').trim().charAt(0).toUpperCase();
        const i={A:1,B:2,C:3,D:4}[label];
        if(i){e.preventDefault();e.stopImmediatePropagation();markInternal(900);global.pendingAnswers[global.current]=i;global.answers[global.current]=i;global.visited[global.current]=true;rerender();}
      }
      return;
    }
    if(t.classList.contains('ui21-palette-btn')){
      const n=parseInt((t.textContent||'').replace(/[^0-9]/g,''),10)-1;
      if(Number.isInteger(n)&&n>=0&&n<global.questions.length){e.preventDefault();e.stopImmediatePropagation();markInternal(900);commitCurrent();global.current=n;global.pendingAnswers[n]=global.answers[n]??global.pendingAnswers[n]??null;rerender();}
    }
  }

  function makeStartAuthoritative(){
    if(typeof global.confirmAndStartTest!=='function'||global.confirmAndStartTest.__hoaV4)return;
    const original=global.confirmAndStartTest;
    const wrapped=async function(){
      const cb=id('testReadyCheckbox');
      if(!cb||!cb.checked){cb?.focus();return false;}
      const pending=global.pendingInstructionLaunch;
      if(!pending||typeof pending.start!=='function'){
        alert('The examination could not be started. Please click START TEST again.');
        return false;
      }
      global.selectedTestLanguage=id('testLanguageSelect')?.value||'english';
      state.phase='launch';state.integrity=false;state.warningOpen=false;closeWarning();
      markInternal(2500);
      // Hide every normal dashboard surface before any asynchronous fullscreen
      // or countdown work. This prevents the Home/Dashboard from flashing
      // behind the launch overlay.
      hideNormalSurfaces();
      // Preserve the user gesture for fullscreen.
      await requestFullscreen();
      try{
        D.body.classList.add('test-launching-active');
        id('testCountdownOverlay')&&show(id('testCountdownOverlay'));
        const p=pending.start();
        if(p&&typeof p.then==='function')await p;
        return true;
      }catch(e){
        console.error('HOA unified Start Exam failed:',e);
        await exitFullscreen();
        setPhase('idle');
        alert('The examination could not be started. Please try again.');
        return false;
      }
    };
    wrapped.__hoaV4=true;wrapped.__hoaOriginal=original;global.confirmAndStartTest=wrapped;
  }

  function observeActiveExam(){
    let last=false;
    const mo=new MutationObserver(()=>{
      const now=isExamVisible()&&(D.body.dataset.hoaExamMode==='exam'||D.body.classList.contains('hoa-phase21-exam-active')||D.body.classList.contains('exam-active'));
      if(now&&!last){
        setPhase('active');state.integrity=true;state.finalizing=false;state.violations=0;state.warningOpen=false;state.intentional=false;bindIntegrity();closeWarning();showExamOnly();
      }
      if(!now&&last&&state.phase==='active'&&!D.body.classList.contains('hoa-result-live')){
        state.integrity=false;
      }
      last=now;
    });
    mo.observe(D.body,{subtree:true,attributes:true,attributeFilter:['class','style','hidden']});
  }

  function watchResult(){
    const mo=new MutationObserver(()=>{
      const r=id('result');
      if(r&&!r.classList.contains('hidden')&&getComputedStyle(r).display!=='none'){
        state.integrity=false;state.phase='result';closeWarning();
      }
    });
    mo.observe(D.body,{subtree:true,attributes:true,attributeFilter:['class','style']});
  }

  function boot(){
    bindIntegrity();
    D.addEventListener('click',controlClick,true);
    observeActiveExam();
    watchResult();
    // Re-run after all feature scripts have loaded and expose the shared start wrapper.
    setTimeout(makeStartAuthoritative,0);
    setTimeout(makeStartAuthoritative,500);
    setTimeout(makeStartAuthoritative,1500);
    global.hoaUnifiedExamRuntime={
      state,
      setPhase,
      activate:function(){setPhase('active');state.integrity=true;state.finalizing=false;state.violations=0;state.warningOpen=false;showExamOnly();},
      stop:function(){state.integrity=false;state.phase='idle';state.finalizing=false;closeWarning();},
      prepare:requestFullscreen,
      exit:exitFullscreen,
      violation,
      markInternal,
      prev,saveNext,markReview,clearResponse,submit
    };
    /* Compatibility facade: every legacy caller now talks to the same runtime. */
    global.MISSION_TES_ExamIntegrity={
      prepare:requestFullscreen,
      start:requestFullscreen,
      activate:global.hoaUnifiedExamRuntime.activate,
      stop:global.hoaUnifiedExamRuntime.stop,
      cancelLaunch:function(){state.integrity=false;state.phase='idle';state.intentional=true;closeWarning();exitFullscreen();setTimeout(()=>{state.intentional=false;},1200);},
      intentionalExit:async function(){state.integrity=false;state.phase='idle';closeWarning();await exitFullscreen();},
      beginSubmission,
      resumeAfterFailedSubmission,
      requestFullscreen,
      markInternalInteraction:markInternal
    };
  }
  if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})(window);
