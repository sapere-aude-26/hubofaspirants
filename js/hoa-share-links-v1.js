/* HUB OF ASPIRANTS V8.44 — secure temporary Student Test / Admin Result links. */
(function(global){
  'use strict';
  const API=global.HOA_SERVICES||{};
  const storageKey='hoa_pending_student_test_link';
  let testRouteBusy=false;
  let resultRouteBusy=false;

  function client(){return global.supabaseClient||null}
  function esc(v){return global.HOA_UTILS?.escapeHTML?global.HOA_UTILS.escapeHTML(v):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
  function id(x){return document.getElementById(x)}
  function pad(n){return String(n).padStart(2,'0')}
  function toLocalValue(date){
    const d=new Date(date);
    const local=new Date(d.getTime()-d.getTimezoneOffset()*60000);
    return `${local.getUTCFullYear()}-${pad(local.getUTCMonth()+1)}-${pad(local.getUTCDate())}T${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}`;
  }
  function toISO(value){
    const d=new Date(value);
    if(!Number.isFinite(d.getTime())) throw new Error('Enter a valid date and time.');
    return d.toISOString();
  }
  function fmt(date){
    if(!date)return '—';
    const d=new Date(date);if(!Number.isFinite(d.getTime()))return '—';
    return d.toLocaleString([], {dateStyle:'medium',timeStyle:'short'});
  }
  function tokenFromQuery(name){try{return new URL(location.href).searchParams.get(name)||''}catch(_){return ''}}
  function currentTestToken(){return tokenFromQuery('hoa_test_link')||sessionStorage.getItem(storageKey)||''}
  function savePendingToken(token){try{sessionStorage.setItem(storageKey,token)}catch(_){} }
  function clearPendingToken(){try{sessionStorage.removeItem(storageKey)}catch(_){} }
  function linkUrl(param,token){const u=new URL(location.href);u.search='';u.hash='';u.searchParams.set(param,token);return u.toString()}
  function copy(text){
    if(navigator.clipboard?.writeText)return navigator.clipboard.writeText(text);
    const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();try{document.execCommand('copy')}finally{ta.remove()}return Promise.resolve();
  }
  function setRouteMessage(title,msg,code){
    let box=id('hoaShareRouteMessage');
    if(!box){box=document.createElement('section');box.id='hoaShareRouteMessage';box.className='hoa-share-route-message';document.querySelector('main')?.prepend(box)||document.body.appendChild(box)}
    box.innerHTML=`<h2>${esc(title)}</h2><p>${esc(msg)}</p>${code?`<div class="hoa-share-route-code">${esc(code)}</div>`:''}<div style="margin-top:18px"><button type="button" class="secondary" id="hoaShareRouteBack">← Back</button></div>`;
    box.classList.remove('hidden');
    id('hoaShareRouteBack')?.addEventListener('click',function(){
      const u=new URL(location.href);u.searchParams.delete('hoa_test_link');u.searchParams.delete('hoa_result_link');history.replaceState({},'',u.toString());location.reload();
    },{once:true});
  }
  function hideRouteMessage(){id('hoaShareRouteMessage')?.classList.add('hidden')}

  function openModal(title,subtitle,body){
    const wrap=document.createElement('div');wrap.className='hoa-share-link-modal';
    wrap.innerHTML=`<div class="hoa-share-link-backdrop"></div><div class="hoa-share-link-dialog" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="hoa-share-link-head"><div><h3>${esc(title)}</h3><p>${esc(subtitle||'')}</p></div><button type="button" class="hoa-share-link-close" aria-label="Close">×</button></div><div class="hoa-share-link-body">${body}</div></div>`;
    document.body.appendChild(wrap);
    const close=()=>wrap.remove();wrap.querySelector('.hoa-share-link-close').onclick=close;wrap.querySelector('.hoa-share-link-backdrop').onclick=close;
    wrap.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
    return {wrap,close,body:wrap.querySelector('.hoa-share-link-body')};
  }

  async function populateTestLinkList(testId,boxId,listType){
    const box=id(boxId);if(!box)return;
    try{
      const rows=listType==='result'
        ? await API.result.adminListResultLinks(testId)
        : await API.test.adminListStudentShareLinks(testId);
      const now=Date.now();
      box.innerHTML=(rows||[]).length?(rows||[]).map(x=>{
        const status=!x.is_active?'revoked':(Date.parse(x.expires_at)<=now?'expired':'active');
        const revoke=listType==='result'?'hoaShareLinks.revokeResultLink':'hoaShareLinks.revokeStudentLink';
        return `<div class="hoa-share-link-row"><div class="hoa-share-link-row-main"><b>Valid ${esc(fmt(x.starts_at))} → ${esc(fmt(x.expires_at))}</b><span>${listType==='result'?'Result link':'Student link'}${x.max_attempts?` · ${esc(x.max_attempts)} attempt${x.max_attempts===1?'':'s'}`:''}</span></div><div class="hoa-share-link-row-actions"><span class="hoa-share-link-status ${status==='active'?'':' '+status}">${status.toUpperCase()}</span>${status==='active'?`<button type="button" class="secondary" data-hoa-revoke="${esc(x.id)}">Revoke</button>`:''}</div></div>`;
      }).join(''):'<div class="hoa-share-link-row"><div class="hoa-share-link-row-main"><b>No links generated yet.</b><span>Create a new temporary link above.</span></div></div>';
      box.querySelectorAll('[data-hoa-revoke]').forEach(btn=>btn.addEventListener('click',async()=>{
        if(!confirm('Revoke this link? It will stop working immediately.'))return;
        try{await global.HOA_SHARE_LINKS[(listType==='result'?'revokeResultLink':'revokeStudentLink')](btn.dataset.hoaRevoke);await populateTestLinkList(testId,boxId,listType)}catch(e){alert(e?.message||'Could not revoke the link.')}
      }));
    }catch(e){box.innerHTML=`<div class="hoa-share-link-row"><div class="hoa-share-link-row-main"><b>Unable to load links.</b><span>${esc(e?.message||'Please try again.')}</span></div></div>`}
  }

  async function openStudentLinkModal(testId){
    const t=(Array.isArray(global.tests)?global.tests:[]).find(x=>String(x.id)===String(testId));
    if(!t){alert('Test not found. Refresh the Test Library and try again.');return}
    if(!t.is_published){alert('Publish the test before generating a student link.');return}
    const defaultStart=new Date(Date.now());
    const defaultEnd=new Date(Date.now()+24*60*60*1000);
    const m=openModal('Student Test Link',`Generate a temporary direct link for “${t.title}”.` ,`
      <div class="hoa-share-link-grid">
        <label class="hoa-share-link-wide">Test<input value="${esc(t.title)}" disabled></label>
        <label>Starts At<input id="hoaShareTestStart" type="datetime-local" value="${toLocalValue(defaultStart)}"></label>
        <label>Expires At<input id="hoaShareTestExpiry" type="datetime-local" value="${toLocalValue(defaultEnd)}"></label>
        <label>Maximum Attempts<select id="hoaShareTestMaxAttempts"><option value="1">1 — Single attempt</option><option value="2">2 attempts</option><option value="3">3 attempts</option><option value="5">5 attempts</option><option value="10">10 attempts</option></select></label>
      </div>
      <div class="hoa-share-link-actions"><button type="button" class="primary" id="hoaShareCreateTestLink">GENERATE LINK</button><button type="button" class="secondary" id="hoaShareRefreshTestLinks">REFRESH LINKS</button></div>
      <div id="hoaShareTestLinkOutput"></div>
      <div class="hoa-share-link-existing"><h4>Existing links</h4><div class="hoa-share-link-list" id="hoaShareTestLinksList"></div></div>`);
    const renderList=()=>populateTestLinkList(testId,'hoaShareTestLinksList','student');await renderList();
    id('hoaShareRefreshTestLinks').onclick=renderList;
    id('hoaShareCreateTestLink').onclick=async()=>{
      const btn=id('hoaShareCreateTestLink');btn.disabled=true;btn.textContent='GENERATING…';
      try{
        const result=await API.test.adminCreateStudentShareLink(testId,toISO(id('hoaShareTestStart').value),toISO(id('hoaShareTestExpiry').value),Number(id('hoaShareTestMaxAttempts').value)||1);
        const url=linkUrl('hoa_test_link',result.token);
        const out=id('hoaShareTestLinkOutput');out.className='hoa-share-link-output';out.innerHTML=`<span class="hoa-share-link-output-url">${esc(url)}</span><div class="hoa-share-link-output-meta"><span>Starts: ${esc(fmt(result.starts_at))}</span><span>Expires: ${esc(fmt(result.expires_at))}</span><span>Attempts: ${esc(result.max_attempts)}</span></div><div class="hoa-share-link-actions"><button type="button" class="primary" id="hoaCopyTestShareLink">COPY LINK</button></div>`;id('hoaCopyTestShareLink').onclick=async()=>{await copy(url);id('hoaCopyTestShareLink').textContent='COPIED ✓';setTimeout(()=>{if(id('hoaCopyTestShareLink'))id('hoaCopyTestShareLink').textContent='COPY LINK'},1300)};await renderList();
      }catch(e){alert(e?.message||'Could not generate the student link.')}finally{btn.disabled=false;btn.textContent='GENERATE LINK'}
    };
  }

  function installAdminStudentLinkButtons(){
    const box=id('testLibrary');
    if(!box || box.dataset.hoaShareLinkBound)return;
    box.dataset.hoaShareLinkBound='1';
    box.addEventListener('click',function(e){
      const btn=e.target.closest('[data-hoa-student-link]');
      if(!btn || btn.disabled)return;
      e.preventDefault();
      openStudentLinkModal(btn.dataset.hoaStudentLink);
    });
  }

  function injectResultLinkManager(){
    const panel=id('adminSectionResultPanel');if(!panel||id('hoaShareResultLinkManager'))return;
    const host=panel.querySelector('.dashPanel');if(!host)return;
    const box=document.createElement('div');box.id='hoaShareResultLinkManager';box.className='hoa-share-result-link-manager';
    box.innerHTML=`<div class="hoa-share-result-link-manager-head"><div><h4>🔗 Temporary Result / Status Link</h4><p>Generate a server-validated link for one test. Only authenticated Admin accounts can use the link.</p></div></div><div class="hoa-share-result-link-fields"><label>Test<select id="hoaShareResultTestSelect"><option value="">Select test</option></select></label><label>Expires At<input id="hoaShareResultExpiry" type="datetime-local"></label></div><div class="hoa-share-result-link-actions"><button type="button" class="primary" id="hoaShareCreateResultLink">GENERATE RESULT LINK</button><button type="button" class="secondary" id="hoaShareRefreshResultLinks">REFRESH LINKS</button></div><div id="hoaShareResultLinkOutput" class="hoa-share-result-link-output"></div><div class="hoa-share-link-existing"><h4>Existing result links for selected test</h4><div id="hoaShareResultLinksList" class="hoa-share-link-list"></div></div>`;
    const resultToolbar=host.querySelector('.resultToolbar');
    if(resultToolbar) resultToolbar.parentElement?.insertBefore(box,resultToolbar);
    else host.insertBefore(box,host.firstChild);

    id('hoaShareResultRefresh')?.addEventListener('click',()=>refreshSharedResult());
    id('hoaShareResultBack')?.addEventListener('click',function(){
      const u=new URL(location.href);
      u.searchParams.delete('hoa_result_link');
      history.replaceState({},'',u.toString());
      location.reload();
    });

    const populate=async()=>{
      const sel=id('hoaShareResultTestSelect');if(!sel)return;
      const current=sel.value;
      let rows=Array.isArray(global.tests)?global.tests:[];
      const map=new Map();rows.forEach(t=>{if(t?.id)map.set(String(t.id),t)});
      sel.innerHTML='<option value="">Select test</option>'+[...map.values()].sort((a,b)=>String(a.title||'').localeCompare(String(b.title||''))).map(t=>`<option value="${esc(t.id)}">${esc(t.title||'Untitled')}</option>`).join('');if(current&&map.has(current))sel.value=current;
      if(sel.value)await populateTestLinkList(sel.value,'hoaShareResultLinksList','result');else id('hoaShareResultLinksList').innerHTML='<div class="hoa-share-link-row"><div class="hoa-share-link-row-main"><b>Select a test.</b><span>Existing result links for that test will appear here.</span></div></div>';
    };
    id('hoaShareResultTestSelect').onchange=populate;
    id('hoaShareRefreshResultLinks').onclick=populate;
    id('hoaShareCreateResultLink').onclick=async()=>{
      const testId=id('hoaShareResultTestSelect').value;if(!testId){alert('Select a test first.');return}
      const btn=id('hoaShareCreateResultLink');btn.disabled=true;btn.textContent='GENERATING…';
      try{const result=await API.result.adminCreateShareLink(testId,new Date().toISOString(),toISO(id('hoaShareResultExpiry').value));const url=linkUrl('hoa_result_link',result.token);const out=id('hoaShareResultLinkOutput');out.style.display='block';out.innerHTML=`<a href="${esc(url)}" target="_blank" rel="noopener">${esc(url)}</a><div class="hoa-share-link-actions"><button type="button" class="secondary" id="hoaCopyResultShareLink">COPY LINK</button></div>`;id('hoaCopyResultShareLink').onclick=async()=>{await copy(url);id('hoaCopyResultShareLink').textContent='COPIED ✓';setTimeout(()=>{if(id('hoaCopyResultShareLink'))id('hoaCopyResultShareLink').textContent='COPY LINK'},1300)};await populate();
      }catch(e){alert(e?.message||'Could not generate the result link.')}finally{btn.disabled=false;btn.textContent='GENERATE RESULT LINK'}
    };
    id('hoaShareResultExpiry').value=toLocalValue(Date.now()+24*60*60*1000);
    populate();
  }

  async function prepareLinkTest(token){
    if(testRouteBusy)return;testRouteBusy=true;hideRouteMessage();
    try{
      if(!global.currentStudent){try{sessionStorage.setItem(storageKey,token)}catch(_){};if(typeof global.hoaOpenPortal==='function')global.hoaOpenPortal('student');global.setMessage?.('Log in as a Student to open this test link.');return}
      if(global.adminLoggedIn){setRouteMessage('Student Login Required','This temporary test link is for a Student account. Sign out of Admin and sign in with a Student account.','TEST_LINK_STUDENT_ONLY');return}
      const data=await API.test.studentSharePrepare(token);
      const t=data?.test;if(!t)throw new Error('Test link did not return a test.');
      const qrows=(Array.isArray(data.questions)?data.questions:[]).map(q=>typeof global.HOA_NORMALIZE_EXAM_QUESTION==='function'?global.HOA_NORMALIZE_EXAM_QUESTION(q):[q.question_text||'',q.option_1||'',q.option_2||'',q.option_3||'',q.option_4||'']);
      if(!qrows.length)throw new Error('This test has no questions.');
      const testObj={id:t.id,title:t.title,description:t.description||'',duration:Number(t.duration_minutes)||10,marks:Number(t.marks_per_question)||1,negative:Number(t.negative_marking)||0,is_published:true,accessType:t.access_type||'paid',questions:qrows,showResultDetails:t.show_result_details!==false,allowReview:t.allow_review!==false};
      const arr=Array.isArray(global.tests)?global.tests:[];const idx=arr.findIndex(x=>String(x.id)===String(t.id));if(idx>=0)arr[idx]=testObj;else arr.push(testObj);global.tests=arr;window.tests=arr;
      global.__HOA_EXAM_SOURCE={mode:'student-link',token,testId:String(t.id),expiresAt:data.expires_at,maxAttempts:Number(data.max_attempts)||1};
      clearPendingToken();
      if(typeof global.startSavedTest!=='function')throw new Error('The test launcher is not available. Please refresh and try again.');
      const launched=global.startSavedTest(String(t.id));
      try{document.documentElement.classList.remove('hoa-test-share-route');}catch(_){}
      return launched;
    }catch(e){
      const code=String(e?.message||e||'TEST_LINK_FAILED').replace(/^.*?:/,'').trim();
      setRouteMessage('Test Link Unavailable',shareError(code),'TEST LINK');
    }finally{testRouteBusy=false}
  }

  function shareError(code){
    const map={AUTHENTICATION_REQUIRED:'Please sign in with a Student account before opening this link.',ACTIVE_STUDENT_REQUIRED:'An active Student account is required.',TEST_LINK_INVALID:'This test link is invalid or no longer exists.',TEST_LINK_REVOKED:'This test link has been revoked by Admin.',TEST_LINK_NOT_ACTIVE_YET:'This test link is not active yet.',TEST_LINK_EXPIRED:'This test link has expired. New attempts are no longer accepted.',TEST_LINK_ATTEMPT_LIMIT_REACHED:'The attempt limit for this test link has been reached.',TEST_NOT_AVAILABLE:'The test is no longer available.',TEST_HAS_NO_QUESTIONS:'This test has no questions available.'};return map[code]||code||'The test link could not be opened.'}

  function showSharedResultPage(data,token){
    const page=id('hoaShareResultPage');if(!page)return;
    hideRouteMessage();page.classList.remove('hidden');
    id('hoaShareResultTitle').textContent=data?.test?.title||'Test Result Status';
    id('hoaShareResultExpiry').textContent='Valid until '+fmt(data?.expires_at);
    const rows=Array.isArray(data?.results)?data.results:[];
    page.dataset.token=token;page.dataset.expiresAt=data?.expires_at||'';
    global.__hoaSharedResultRows=rows.slice();
    const completed=rows.filter(r=>r?.attempt_status==='completed').length;
    const inProgress=rows.filter(r=>r?.attempt_status==='in_progress').length;
    if(id('hoaShareResultAppeared'))id('hoaShareResultAppeared').textContent=String(rows.length);
    if(id('hoaShareResultCompleted'))id('hoaShareResultCompleted').textContent=String(completed);
    if(id('hoaShareResultInProgress'))id('hoaShareResultInProgress').textContent=String(inProgress);
    renderSharedResults(rows);
  }

  function formatDuration(seconds){
    const n=Number(seconds);
    if(!Number.isFinite(n)||n<0)return '—';
    const m=Math.floor(n/60),s=n%60;
    return m+'m '+String(s).padStart(2,'0')+'s';
  }

  function renderSharedResults(rows){
    const sort=id('hoaShareResultSort')?.value||'score_desc';
    const data=(rows||[]).slice().sort((a,b)=>{
      const n=(v)=>Number(v)||0;
      if(sort==='score_desc')return n(b.score)-n(a.score)||String(a.student_name||'').localeCompare(String(b.student_name||''));
      if(sort==='name_asc')return String(a.student_name||'').localeCompare(String(b.student_name||''));
      if(sort==='rank_asc')return n(a.rank||999999)-n(b.rank||999999)||String(a.student_name||'').localeCompare(String(b.student_name||''));
      if(sort==='status_asc')return String(a.attempt_status||'').localeCompare(String(b.attempt_status||''))||String(a.student_name||'').localeCompare(String(b.student_name||''));
      if(sort==='submitted_desc')return (Date.parse(b.submitted_at||'')||0)-(Date.parse(a.submitted_at||'')||0);
      return 0;
    });
    const table=id('hoaShareResultTable');const mobile=id('hoaShareResultMobile');
    const fmtScore=r=>r.score==null||r.attempt_status!=='completed'?'—':Number(r.score||0).toFixed(2);
    const fmtPct=r=>r.attempt_status!=='completed'?'—':Number(r.percentage||0).toFixed(2)+'%';
    if(table)table.innerHTML=data.length?`<table class="hoa-share-result-table"><thead><tr><th>Rank</th><th>Student</th><th>Identifier</th><th>Status</th><th>Score</th><th>%</th><th>Correct</th><th>Wrong</th><th>Skipped</th><th>Time</th><th>Submitted</th></tr></thead><tbody>${data.map(r=>`<tr><td class="rank">${r.rank||'—'}</td><td><b>${esc(r.student_name||'Student')}</b></td><td>${esc(r.student_identifier||'—')}</td><td class="status">${esc(String(r.attempt_status||'').replace('_',' ').toUpperCase())}</td><td class="score">${fmtScore(r)}</td><td>${fmtPct(r)}</td><td>${r.attempt_status==='completed'?esc(r.correct??'—'):'—'}</td><td>${r.attempt_status==='completed'?esc(r.wrong??'—'):'—'}</td><td>${r.attempt_status==='completed'?esc(r.skipped??'—'):'—'}</td><td>${r.attempt_status==='completed'?esc(formatDuration(r.time_taken)):'—'}</td><td>${esc(fmt(r.submitted_at||r.started_at))}</td></tr>`).join('')}</tbody></table>`:'<div class="hoa-share-result-empty">No students have appeared for this test yet.</div>';
    if(mobile)mobile.innerHTML=data.length?data.map(r=>`<div class="hoa-share-result-row-card"><div class="hoa-share-result-row-top"><div><div class="hoa-share-result-row-name">${esc(r.student_name||'Student')}</div><div class="hoa-share-result-row-id">${esc(r.student_identifier||'—')}</div></div><div class="rank">#${esc(r.rank||'—')}</div></div><div class="hoa-share-result-row-grid"><div><span>Status</span><b>${esc(String(r.attempt_status||'').replace('_',' ').toUpperCase())}</b></div><div><span>Score</span><b>${fmtScore(r)}</b></div><div><span>Percentage</span><b>${fmtPct(r)}</b></div><div><span>Correct / Wrong / Skipped</span><b>${r.attempt_status==='completed'?`${esc(r.correct??'—')} / ${esc(r.wrong??'—')} / ${esc(r.skipped??'—')}`:'—'}</b></div><div><span>Time</span><b>${r.attempt_status==='completed'?esc(formatDuration(r.time_taken)):'—'}</b></div><div><span>Submitted</span><b>${esc(fmt(r.submitted_at||r.started_at))}</b></div></div></div>`).join(''):'<div class="hoa-share-result-empty">No students have appeared for this test yet.</div>';
  }

  async function openSharedResult(token){
    if(resultRouteBusy)return;resultRouteBusy=true;
    try{
      if(!global.adminLoggedIn){if(typeof global.hoaOpenPortal==='function')global.hoaOpenPortal('admin');return}
      if(global.currentStudent){setRouteMessage('Admin Access Required','This temporary result link is restricted to authenticated Admin accounts.','ADMIN_ONLY');return}
      const data=await API.result.viewShareLink(token);showSharedResultPage(data,token);
    }catch(e){const code=String(e?.message||e||'RESULT_LINK_FAILED').replace(/^.*?:/,'').trim();setRouteMessage('Result Link Unavailable',shareResultError(code),'RESULT LINK')}finally{resultRouteBusy=false}
  }
  function shareResultError(code){const map={AUTHENTICATION_REQUIRED:'Please sign in with an Admin account before opening this link.',ADMIN_REQUIRED:'This result link is restricted to authenticated Admin accounts.',RESULT_LINK_INVALID:'This result link is invalid or no longer exists.',RESULT_LINK_REVOKED:'This result link has been revoked by Admin.',RESULT_LINK_NOT_ACTIVE_YET:'This result link is not active yet.',RESULT_LINK_EXPIRED:'This result link has expired and no longer reveals results.',TEST_NOT_FOUND:'The test connected to this result link no longer exists.'};return map[code]||code||'The result link could not be opened.'}

  async function refreshSharedResult(){const page=id('hoaShareResultPage');const token=page?.dataset.token||tokenFromQuery('hoa_result_link');if(token)await openSharedResult(token)}

  function installAuthWrappers(){
    if(typeof global.loginStudent==='function'&&!global.loginStudent.__hoaShareWrap){const original=global.loginStudent;const wrapped=async function(){const ok=await original.apply(this,arguments);if(ok)setTimeout(()=>{const t=currentTestToken();if(t)prepareLinkTest(t)},0);return ok};wrapped.__hoaShareWrap=true;global.loginStudent=wrapped}
    if(typeof global.loginAdmin==='function'&&!global.loginAdmin.__hoaShareWrap){const original=global.loginAdmin;const wrapped=async function(){const ok=await original.apply(this,arguments);if(ok)setTimeout(()=>{const t=tokenFromQuery('hoa_result_link');if(t)openSharedResult(t)},0);return ok};wrapped.__hoaShareWrap=true;global.loginAdmin=wrapped}
  }

  function installRouteNavigationGuard(){
    const original=global.hoaShowFrontPage;if(typeof original==='function'&&!global.hoaShowFrontPage.__hoaShareWrapFreeFixed){const wrapped=function(){const u=new URL(location.href);const had=u.searchParams.has('hoa_test_link')||u.searchParams.has('hoa_result_link')||u.searchParams.has('hoa_free_test_link')||u.searchParams.has('hoa_free_result_link');u.searchParams.delete('hoa_test_link');u.searchParams.delete('hoa_result_link');u.searchParams.delete('hoa_free_test_link');u.searchParams.delete('hoa_free_result_link');try{sessionStorage.removeItem(storageKey)}catch(_){};if(had){history.replaceState({},'',u.toString());return location.reload()}return original.apply(this,arguments)};wrapped.__hoaShareWrapFreeFixed=true;global.hoaShowFrontPage=wrapped}
  }

  function boot(){
    installAuthWrappers();installRouteNavigationGuard();
    const testToken=tokenFromQuery('hoa_test_link');const resultToken=tokenFromQuery('hoa_result_link');
    if(testToken){savePendingToken(testToken);setTimeout(()=>prepareLinkTest(testToken),0)}
    else if(resultToken){setTimeout(()=>openSharedResult(resultToken),0)}
    id('hoaShareResultSort')?.addEventListener('change',()=>renderSharedResults(window.__hoaSharedResultRows||[]));
    global.supabaseClient?.auth?.onAuthStateChange?.((_event)=>setTimeout(()=>{installAuthWrappers();const t=tokenFromQuery('hoa_test_link');const r=tokenFromQuery('hoa_result_link');if(t&&global.currentStudent)prepareLinkTest(t);else if(r&&global.adminLoggedIn)openSharedResult(r)},0));
  }

  global.HOA_SHARE_LINKS={
    openStudentLinkModal,
    revokeStudentLink:async id=>API.test.adminRevokeStudentShareLink(id),
    openResultLinkModal:async()=>{},
    revokeResultLink:async id=>API.result.adminRevokeShareLink(id),
    refreshSharedResult
  };
  global.renderHOASharedResultRows=renderSharedResults;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})(window);
