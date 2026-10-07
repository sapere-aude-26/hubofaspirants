/* HOA — Authoritative Student Exam/Result Controller V3
   One navigation context for paid Mock Tests and a matched Free Test flow. */
(function(){
  'use strict';

  const root = document;
  const byId = id => document.getElementById(id);
  const hide = el => { if(!el)return; el.classList.add('hidden'); el.setAttribute('aria-hidden','true'); el.style.setProperty('display','none','important'); el.style.setProperty('pointer-events','none','important'); };
  const show = el => { if(!el)return; el.classList.remove('hidden'); el.removeAttribute('aria-hidden'); el.style.removeProperty('display'); el.style.removeProperty('visibility'); el.style.removeProperty('opacity'); el.style.removeProperty('pointer-events'); };
  const safeRun = (fn)=>Promise.resolve().then(fn).catch(e=>{ console.error('HOA navigation operation failed:',e); return false; });

  window.__HOA_EXAM_RESULT_V3 = { version:'3.0', busy:false };

  function supabase(){ return window.supabaseClient || window.supabase || null; }
  function activeStudent(){ try{ if(typeof currentStudent!=='undefined' && currentStudent) return currentStudent; }catch(_){} return window.currentStudent||null; }
  async function rpc(name,args){ const c=supabase(); if(!c) throw new Error('Supabase is not ready. Please refresh.'); const r=await c.rpc(name,args||{}); if(r.error) throw r.error; return r.data; }

  function captureMockCourseId(){
    return window.__hoaCurrentMockCourseId || window.__hoaExamReturnContext?.batchId || window.__hoaLastMockTestContext?.batchId || null;
  }

  function closeSuggestionModal(){
    ['hoaFeedbackModal','hoaPublicFeedbackModal'].forEach(id=>{ const e=byId(id); if(e){ hide(e); e.style.setProperty('visibility','hidden','important'); } });
    document.body.classList.remove('hoa-feedback-open');
    document.body.setAttribute('data-hoa-feedback-state','closed');
  }

  function clearExamVisualState(){
    ['exam','result','testCountdownOverlay','testInstructionsModal'].forEach(id=>hide(byId(id)));
    hide(byId('hoaV650PaidLearningPortal'));
    const footer=byId('hoaGlobalPublicFooter'); if(footer) show(footer);
    const timer=byId('headerTimer'); if(timer) hide(timer);
    document.body.classList.remove('hoa-phase21-exam-active','hoa-exam-live','hoa-result-live','hoa-launch-live','test-instructions-active','test-launching-active','v13-exam-active','exam-active','mission-submit-open');
    document.body.dataset.hoaPhase21Exam='normal';
    document.body.dataset.hoaExamMode='normal';
    closeSuggestionModal();
    try{ if(window.closeMissionSubmitConfirmation) window.closeMissionSubmitConfirmation(); }catch(_){ }
  }

  function restoreNormalStudent(){
    clearExamVisualState();
    if(window.MISSION_TES_ExamIntegrity) { try{ window.MISSION_TES_ExamIntegrity.stop(); }catch(_){ } }
    const home=byId('home'), student=byId('studentOnlyDashboard'), admin=byId('adminOnlyDashboard'), auth=byId('authScreen');
    if(home) show(home);
    if(student) show(student);
    if(admin) hide(admin);
    if(auth) hide(auth);
    const testPanel=byId('candidateSectionTestPanel'); const resultPanel=byId('candidateSectionResultPanel');
    if(testPanel) testPanel.classList.add('active');
    if(resultPanel) resultPanel.classList.remove('active');
    const tn=byId('candidateNavTest'), rn=byId('candidateNavResult'); if(tn)tn.classList.add('active'); if(rn)rn.classList.remove('active');
    try{ if(typeof window.renderStudentDashboard==='function') window.renderStudentDashboard(); }catch(_){ }
    try{ if(typeof window.showSuggestionOnNormalStudentSurface==='function') window.showSuggestionOnNormalStudentSurface(); }catch(_){ }
  }

  async function returnToOrigin(tab){
    const ctx=window.__hoaExamReturnContext||{};
    const batchId=ctx.batchId || captureMockCourseId();
    const isMock=ctx.origin==='mock-course' && batchId;
    window.__HOA_NAVIGATION_IN_PROGRESS=true;
    try{
      if(typeof window.exitHOAExamFullscreen==='function') await window.exitHOAExamFullscreen();
      clearExamVisualState();
      if(ctx.origin==='free-content' && ctx.returnUrl){
        clearExamVisualState();
        clearFreeLaunchContext();
        window.location.href=ctx.returnUrl;
        return true;
      }
      if(isMock && typeof window.hoaV650OpenMockCourse==='function'){
        /* Exact originating Mock Test Course is the return target. */
        await window.hoaV650OpenMockCourse(batchId);
        await new Promise(r=>setTimeout(r,0));
        const p=byId('hoaV650PaidLearningPortal');
        if(p){ show(p); }
        const wanted=tab||'tests';
        const button=p?.querySelector(`[data-v650-mock-tab="${wanted}"]`);
        if(button) button.click();
        window.__hoaCurrentMockCourseId=batchId;
        return true;
      }
      restoreNormalStudent();
      return true;
    } finally {
      setTimeout(()=>{ window.__HOA_NAVIGATION_IN_PROGRESS=false; },350);
    }
  }

  async function loadPaidReview(attemptId){
    const detail = await window.HOA_SERVICES.result.getReview(attemptId);
    if(!Array.isArray(detail) || !detail.length) throw new Error('Historical answer review is not available for this attempt.');
    return detail;
  }

  function applyPaidReviewToResult(row, detail){
    const questions=Array.isArray(detail)?detail.slice():[];
    const answers=questions.map(q=>q.question_type==='numerical'?(q.selected_value==null?null:Number(q.selected_value)):(q.selected_option==null?null:Number(q.selected_option)));
    window.__missionTESReviewSnapshot={questions,answers,testTitle:row.title||'Mock Test',testId:row.testId||row.test_id||null,historical:true,attemptId:String(row.id),allowReview:true,showResultDetails:true};
    window.__missionTESHistoricalAttempt=row;
    window.reviewCurrent=0;
    if(typeof window.forceRenderSubmittedQuestionReview==='function') window.forceRenderSubmittedQuestionReview();
  }

  async function openPaidAttemptReview(attemptId){
    if(!attemptId || !activeStudent()) throw new Error('Attempt ID or student session is missing.');
    window.__HOA_NAVIGATION_IN_PROGRESS=true;
    try{
      const summary = await window.HOA_SERVICES.result.getAttemptSummary(attemptId);
      if(!summary) throw new Error('This completed attempt could not be found.');
      if(summary.score===null || summary.score===undefined){
        const total=Number(summary.total_questions||0);const skipped=Number(summary.unanswered||0);const attempted=Math.max(0,total-skipped);const remaining=Math.max(0,total-attempted);
        clearExamVisualState();const result=byId('result');if(result){show(result);result.style.setProperty('display','block','important');result.style.setProperty('pointer-events','auto','important');}
        const home=byId('home');if(home)hide(home);const student=byId('studentOnlyDashboard');if(student)hide(student);
        const set=(id,v)=>{const e=byId(id);if(e)e.textContent=v;};set('resultTitle',(summary.test_title||'Mock Test')+' — Result');
        const scoreEl=byId('score');if(scoreEl&&scoreEl.parentElement)scoreEl.parentElement.innerHTML='<span class="hoa-result-restricted-note">Result details are currently hidden by Admin.</span>';
        const secs=(summary.started_at&&summary.submitted_at)?Math.max(0,Math.round((Date.parse(summary.submitted_at)-Date.parse(summary.started_at))/1000)):0;
        const metricGrid=document.querySelector('.resultInfoGridFive');if(metricGrid)metricGrid.innerHTML=`<div class="resultInfoItem"><span>TOTAL QUESTIONS</span><b>${total}</b></div><div class="resultInfoItem"><span>ATTEMPTED</span><b>${attempted}</b></div><div class="resultInfoItem"><span>REMAINING</span><b>${remaining}</b></div><div class="resultInfoItem resultMetricTime"><span>TIME TAKEN</span><b>${typeof window.formatElapsedTime==='function'?window.formatElapsedTime(secs):secs+'s'}</b></div>`;
        document.querySelector('.reviewHeading')?.classList.add('hidden');document.querySelector('.reviewLayout')?.classList.add('hidden');
        return true;
      }
      const detail = await loadPaidReview(attemptId);
      const row={id:summary.id,testId:summary.test_id,title:summary.test_title,startedAt:summary.started_at,submittedAt:summary.submitted_at,status:summary.status,totalQuestions:Number(summary.total_questions)||detail.length,correct:Number(summary.correct_answers)||0,wrong:Number(summary.wrong_answers)||0,skipped:Number(summary.unanswered)||0,marks:Number(summary.score)||0,score:Number(summary.score)||0,marksPerCorrect:Number(summary.marks_per_question)||1,negativeMarks:Number(summary.negative_marking)||0,maxMarks:(Number(summary.total_questions)||detail.length)*(Number(summary.marks_per_question)||1)};
      const st=Date.parse(summary.started_at||''); const en=Date.parse(summary.submitted_at||''); row.timeTaken=Number.isFinite(st)&&Number.isFinite(en)?Math.max(0,Math.round((en-st)/1000)):0;
      window.__hoaExamReturnContext={origin:window.__hoaExamReturnContext?.origin||'student-dashboard',batchId:window.__hoaExamReturnContext?.batchId||null,tab:'results'};
      applyPaidReviewToResult(row,detail);
      clearExamVisualState();
      const result=byId('result'); if(result){ show(result); result.style.setProperty('display','block','important'); result.style.setProperty('pointer-events','auto','important'); }
      const home=byId('home'); if(home)hide(home);
      const student=byId('studentOnlyDashboard'); if(student)hide(student);
      const portal=byId('hoaV650PaidLearningPortal'); if(portal)hide(portal);
      const set=(id,v)=>{const e=byId(id);if(e)e.textContent=v;};
      set('resultTitle',(row.title||'Mock Test')+' — Attempt Review');
      set('score',row.marks.toFixed(2)+' / '+row.maxMarks.toFixed(2));
      set('percentage','Percentage: '+(row.maxMarks?Math.max(0,row.marks)/row.maxMarks*100:0).toFixed(2)+'%');
      set('correct',row.correct); set('wrong',row.wrong); set('skipped',row.skipped); set('finalMarks',row.marks.toFixed(2));
      if(byId('resultMarksInfo'))byId('resultMarksInfo').textContent=row.marks.toFixed(2)+' / '+row.maxMarks.toFixed(2);
      if(byId('resultCorrectInfo'))byId('resultCorrectInfo').textContent=row.correct;
      if(byId('resultWrongInfo'))byId('resultWrongInfo').textContent=row.wrong;
      if(byId('resultSkippedInfo'))byId('resultSkippedInfo').textContent=row.skipped;
      if(byId('resultTimeInfo'))byId('resultTimeInfo').textContent=(typeof window.formatElapsedTime==='function'?window.formatElapsedTime(row.timeTaken):'0m 00s');
      if(byId('reviewSummary'))byId('reviewSummary').textContent=`${row.correct} Correct • ${row.wrong} Wrong • ${row.skipped} Skipped`;
      if(window.forceRenderSubmittedQuestionReview) window.forceRenderSubmittedQuestionReview();
      const back=byId('resultBackBtn'); if(back){ back.textContent='← BACK TO RESULTS'; }
      return true;
    } finally {
      setTimeout(()=>{window.__HOA_NAVIGATION_IN_PROGRESS=false;},350);
    }
  }

  async function renderMockResults(){
    const p=byId('hoaV650PaidLearningPortal'); const body=p?.querySelector('#hoaV650MockBody');
    if(!p||!body) return false;
    const batchId=captureMockCourseId();
    window.__hoaCurrentMockCourseId=batchId;
    window.__HOA_NAVIGATION_IN_PROGRESS=true;
    try{
      body.innerHTML='<div class="hoa-v650-result-host"><div class="hoa-v650-result-head"><div><h3>📊 Your Results</h3><p>Completed attempts from this Mock Test Course.</p></div><span class="hoa-v650-chip" id="hoaV650MockResultsBadge">0 TESTS</span></div><div id="hoaV650MockCandidateResultsList"><div class="hoa-v650-empty">Loading your results…</div></div></div>';
      const box=byId('hoaV650MockCandidateResultsList');
      const c=supabase(); if(!c||!window.currentStudent?.id)throw new Error('Student session is not ready.');
      const {data,error}=await c.rpc('get_student_result_history_v4_5'); if(error)throw error;
      const ids=[];
      try{
        const loaded=await c.from('test_batch_test_assignments').select('test_id').eq('test_batch_id',batchId);
        if(!loaded.error) ids.push(...(loaded.data||[]).map(x=>String(x.test_id)));
      }catch(_){ }
      if(!ids.length){
        try{
          const direct=await c.from('tests').select('id').eq('test_batch_id',batchId).eq('is_published',true);
          if(!direct.error) ids.push(...(direct.data||[]).map(x=>String(x.id)));
        }catch(_){ }
      }
      let rows=(data||[]).filter(r=>ids.length ? ids.includes(String(r.test_id)) : false);
      if(!rows.length){ box.innerHTML='<div class="hoa-v650-empty">No completed attempts in this Mock Test Course yet.</div>'; }
      else{
        box.innerHTML=rows.map(r=>{const details=r.score!==null&&r.score!==undefined;const total=Number(r.total_questions||0);const skipped=Number(r.unanswered||0);const attempted=Math.max(0,total-skipped);const remaining=Math.max(0,total-attempted);const timeTaken=(r.submitted_at&&r.started_at)?Math.max(0,Math.round((Date.parse(r.submitted_at)-Date.parse(r.started_at))/1000)):0;return `<article class="studentAttemptCard"><div class="studentAttemptCardTop"><div><div class="attemptEyebrow">ATTEMPT</div><h4>${window.escapeHTML?window.escapeHTML(r.test_title||'Mock Test'):String(r.test_title||'Mock Test')}</h4><div class="attemptDate">${r.submitted_at?new Date(r.submitted_at).toLocaleString():'—'}</div></div><div class="attemptScore">${details?`<b>${Number(r.score).toFixed(2)}</b><span>${Number(r.correct_answers||0)} Correct</span>`:`<b>Details Hidden</b><span>Score unavailable</span>`}</div></div><div class="attemptMetrics">${details?`<span><b>${Number(r.correct_answers||0)}</b> Correct</span><span><b>${Number(r.wrong_answers||0)}</b> Wrong</span><span><b>${Number(r.unanswered||0)}</b> Skipped</span>`:`<span><b>${total}</b> Total</span><span><b>${attempted}</b> Attempted</span><span><b>${remaining}</b> Remaining</span>`}<span><b>${typeof window.formatElapsedTime==='function'?window.formatElapsedTime(timeTaken):timeTaken+'s'}</b> Time</span></div><div class="attemptActionRow">${details?`<button type="button" class="viewAttemptBtn" data-v3-attempt="${String(r.id)}">VIEW ATTEMPT</button>`:''}</div></article>`}).join('');
      }
      const badge=byId('hoaV650MockResultsBadge'); if(badge)badge.textContent=rows.length+' '+(rows.length===1?'TEST':'TESTS');
      return true;
    } finally { setTimeout(()=>{window.__HOA_NAVIGATION_IN_PROGRESS=false;},250); }
  }

  function installPaidGuards(){
    document.addEventListener('click',function(e){
      const target=e.target;
      if(!target || !target.closest) return;
      const resultBack=target.closest('#resultBackBtn');
      let studentSession=null; try{studentSession=activeStudent()}catch(_){}
      if(resultBack && studentSession && window.adminLoggedIn!==true){ e.preventDefault();e.stopImmediatePropagation();safeRun(async()=>{
        const isReview=(resultBack.textContent||'').toUpperCase().includes('BACK TO RESULTS');
        return await returnToOrigin(isReview?'results':'tests');
      });return; }
      const v=target.closest('[data-v3-attempt], #hoaV650PaidLearningPortal .viewAttemptBtn');
      if(v){ const id=v.getAttribute('data-v3-attempt')||v.getAttribute('onclick')?.match(/viewStudentAttempt\(['\"]([^'\"]+)/)?.[1]; if(id){e.preventDefault();e.stopImmediatePropagation();safeRun(()=>openPaidAttemptReview(id));} return; }
      const tab=target.closest('#hoaV650PaidLearningPortal [data-v650-mock-tab]');
      if(tab){ const which=tab.getAttribute('data-v650-mock-tab'); if(which==='results'){ e.preventDefault();e.stopImmediatePropagation();safeRun(renderMockResults); } }
    },true);
  }

  function paidResultObserver(){
    let last='';
    const mo=new MutationObserver(()=>{
      const result=byId('result'); if(!result || result.classList.contains('hidden')) return;
      const attempt=window.__hoaLastSubmittedAttemptId;
      if(!attempt || attempt===last) return;
      last=attempt;
      if(window.__missionTESReviewSnapshot?.allowReview===false)return;
      safeRun(async()=>{
        try{ const detail=await loadPaidReview(attempt); const row=window.__missionTESHistoricalAttempt||{id:attempt,testId:(typeof activeTestId!=='undefined'?activeTestId:null),title:(typeof testTitle!=='undefined'?testTitle:'Mock Test'),marks:0,maxMarks:0}; applyPaidReviewToResult(row,detail); }catch(e){ console.warn('HOA automatic post-submit review unavailable:',e); }
      });
    });
    mo.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style']});
  }

  // ---------- Unified Free Test route ----------
  function freeToken(){
    try{return localStorage.getItem('hoa_free_access_token')||'';}catch(_){return '';}
  }
  function freeLibraryUrl(){
    const u=new URL(location.href);
    u.searchParams.delete('hoa_free_page');
    u.searchParams.delete('hoa_free_test');
    u.searchParams.delete('hoa_free_test_link');
    u.searchParams.delete('content');
    u.searchParams.delete('hoa_exam_engine');
    u.searchParams.set('hoa_free_page','library');
    return u.href;
  }
  function waitForClient(max=80){
    return new Promise((resolve,reject)=>{
      let n=0;
      const step=()=>{
        const c=supabase();
        if(c){resolve(c);return;}
        n++;
        if(n>=max){reject(new Error('Supabase is not ready. Please refresh the Free Content page.'));return;}
        setTimeout(step,125);
      };
      step();
    });
  }
  function normalizeFreeQuestions(rows){
    return (Array.isArray(rows)?rows:[]).map(q=>typeof window.HOA_NORMALIZE_EXAM_QUESTION==='function' ? window.HOA_NORMALIZE_EXAM_QUESTION(q) : [q?.question_text??'',q?.option_1??'',q?.option_2??'',q?.option_3??'',q?.option_4??'',null,'',q?.id||null]);
  }
  function ensureSharedFreeTest(testId, payload){
    const current=Array.isArray(window.tests)?window.tests.slice():[];
    const virtual={
      id:String(testId),
      title:String(payload?.test?.title||'Free Test'),
      description:String(payload?.test?.description||''),
      duration:Number(payload?.test?.duration_minutes)||10,
      marks:Number(payload?.test?.marks_per_question)||1,
      negative:Number(payload?.test?.negative_marking)||0,
      accessType:'free',
      is_published:true,
      questions:normalizeFreeQuestions(payload?.questions),
      showResultDetails:payload?.test?.show_result_details!==false,
      allowReview:payload?.test?.allow_review!==false,
      __hoaFree:true
    };
    const idx=current.findIndex(t=>String(t?.id)===String(testId));
    if(idx>=0) current[idx]=virtual; else current.push(virtual);
    window.tests=current;
    try{window.adminLoggedIn=false;}catch(_){ }
    return virtual;
  }
  function clearFreeLaunchContext(){
    try{window.__HOA_EXAM_SOURCE=null;}catch(_){ }
    try{window.__hoaExamReturnContext=null;}catch(_){ }
  }
  async function startFreeContentTest(testId,contentId){
    const token=freeToken();
    if(!token){
      alert('Your Free Student access session is missing. Please open Free Content again.');
      location.href=freeLibraryUrl();
      return false;
    }
    await waitForClient();
    const prepared=await window.HOA_SERVICES.free.prepareTest(token,String(testId));
    if(!prepared?.test || !Array.isArray(prepared.questions) || !prepared.questions.length){
      throw new Error('This Free Test is not available or has no questions.');
    }
    ensureSharedFreeTest(testId,prepared);
    const returnUrl=freeLibraryUrl();
    window.__HOA_EXAM_SOURCE={mode:'free',token,testId:String(testId),contentId:contentId||null,returnUrl};
    window.__hoaExamReturnContext={origin:'free-content',testId:String(testId),contentId:contentId||null,returnUrl,tab:'library'};
    if(typeof window.startSavedTest!=='function') throw new Error('The shared examination engine is not ready yet. Please refresh and try again.');
    return window.startSavedTest(String(testId));
  }
  async function startFreeShareTest(shareToken){
    const token=freeToken();
    if(!shareToken){location.href=freeLibraryUrl();return false;}
    if(!token){
      try{localStorage.setItem('hoa_pending_free_test_link',shareToken);}catch(_){ }
      const u=new URL(location.href);u.searchParams.set('hoa_free_page','library');u.searchParams.set('hoa_free_test_link',shareToken);u.searchParams.delete('hoa_free_test');u.searchParams.delete('content');location.href=u.href;return false;
    }
    await waitForClient();
    const prepared=await window.HOA_SERVICES.free.studentFreeSharePrepare(String(shareToken),String(token));
    if(!prepared?.test||!Array.isArray(prepared.questions)||!prepared.questions.length)throw new Error('This Free Test link did not return a valid test.');
    ensureSharedFreeTest(prepared.test.id,prepared);
    const returnUrl=freeLibraryUrl();
    window.__HOA_EXAM_SOURCE={mode:'free',token:String(token),shareToken:String(shareToken),testId:String(prepared.test.id),contentId:prepared.content_id||null,returnUrl};
    window.__hoaExamReturnContext={origin:'free-content',testId:String(prepared.test.id),contentId:prepared.content_id||null,returnUrl,tab:'library'};
    if(typeof window.startSavedTest!=='function')throw new Error('The shared examination engine is not ready yet. Please refresh and try again.');
    return window.startSavedTest(String(prepared.test.id));
  }
  async function installFreeUnifiedRoute(){
    const u=new URL(location.href),mode=u.searchParams.get('hoa_free_page');
    if(mode!=='test') return;
    const shareToken=u.searchParams.get('hoa_free_test_link')||'';
    const testId=u.searchParams.get('hoa_free_test');
    const contentId=u.searchParams.get('content')||null;
    if(!shareToken && !testId) { location.href=freeLibraryUrl(); return; }
    const run=async()=>{
      try{ if(shareToken) await startFreeShareTest(shareToken); else await startFreeContentTest(testId,contentId); }
      catch(e){
        console.error('HOA Free Test launch failed:',e);
        clearFreeLaunchContext();
        alert('Unable to open this Free Test. '+(e?.message||e));
        location.href=freeLibraryUrl();
      }
    };
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>safeRun(run),{once:true});
    else setTimeout(()=>safeRun(run),0);
  }
  function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}


  function patchLegacyBootAndContext(){
    /* The source build performs these writes before this controller runs in some browsers.
       Exposing the current batch ID makes the return target deterministic. */
    if(!window.__hoaCurrentMockCourseId){window.__hoaCurrentMockCourseId=window.__hoaExamReturnContext?.batchId||null;}
  }

  window.viewStudentAttempt=function(attemptId){ return safeRun(()=>openPaidAttemptReview(attemptId)); };
  const previousResultReturn=window.hoaReturnStudentFromResult;
  window.hoaReturnStudentFromResult=async function(){
    const source=window.__HOA_EXAM_SOURCE||{};
    const ctx=window.__hoaExamReturnContext||{};
    if(source.mode==='free' || ctx.origin==='free-content') return safeRun(()=>returnToOrigin('library'));
    if(typeof previousResultReturn==='function') return previousResultReturn();
    return safeRun(()=>returnToOrigin('tests'));
  };
  window.returnToStudentDashboard=function(){
    const source=window.__HOA_EXAM_SOURCE||{};
    const ctx=window.__hoaExamReturnContext||{};
    if(source.mode==='free' || ctx.origin==='free-content') return safeRun(()=>returnToOrigin('library'));
    return safeRun(()=>returnToOrigin('tests'));
  };
  installPaidGuards();
  paidResultObserver();
  patchLegacyBootAndContext();
  installFreeUnifiedRoute();

})();
