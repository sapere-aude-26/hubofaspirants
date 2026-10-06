/* HUB OF ASPIRANTS V8.45 — Free Content test/result share links.
   Free Student links use the existing token-based Free Student system and
   free_test_attempts/free_content_profiles tables. Admin result links expose
   only Free Test results and are server-validated on every request. */
(function(global){
  'use strict';
  const free=()=>global.HOA_SERVICES?.free||{};
  const $=id=>document.getElementById(id);
  const esc=v=>global.HOA_UTILS?.escapeHTML?global.HOA_UTILS.escapeHTML(v):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const pad=n=>String(n).padStart(2,'0');
  const localInputValue=ms=>{const d=new Date(ms),local=new Date(d.getTime()-d.getTimezoneOffset()*60000);return `${local.getUTCFullYear()}-${pad(local.getUTCMonth()+1)}-${pad(local.getUTCDate())}T${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}`};
  const toISO=value=>{const d=new Date(value);if(!Number.isFinite(d.getTime()))throw new Error('Enter a valid date and time.');return d.toISOString()};
  const fmt=value=>{if(!value)return '—';const d=new Date(value);return Number.isFinite(d.getTime())?d.toLocaleString([], {dateStyle:'medium',timeStyle:'short'}):'—'};
  const client=()=>global.supabaseClient||null;
  const freeAccessToken=()=>{try{return localStorage.getItem('hoa_free_access_token')||''}catch(_){return ''}};
  const copy=async value=>{if(navigator.clipboard?.writeText)return navigator.clipboard.writeText(value);const ta=document.createElement('textarea');ta.value=value;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();try{document.execCommand('copy')}finally{ta.remove()}return true};
  const siteUrl=(param,token)=>{const u=new URL(location.href);u.search='';u.hash='';u.searchParams.set(param,token);return u.toString()};

  function modal(title,subtitle,body){
    const wrap=document.createElement('div');wrap.className='hoa-share-link-modal';
    wrap.innerHTML=`<div class="hoa-share-link-backdrop"></div><div class="hoa-share-link-dialog" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="hoa-share-link-head"><div><h3>${esc(title)}</h3><p>${esc(subtitle||'')}</p></div><button type="button" class="hoa-share-link-close" aria-label="Close">×</button></div><div class="hoa-share-link-body">${body}</div></div>`;
    document.body.appendChild(wrap);
    const close=()=>wrap.remove();
    wrap.querySelector('.hoa-share-link-close').onclick=close;
    wrap.querySelector('.hoa-share-link-backdrop').onclick=close;
    wrap.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
    return {wrap,close};
  }

  function listHtml(rows,type){
    const now=Date.now();
    return (rows||[]).length ? rows.map(x=>{
      const status=!x.is_active?'revoked':(Date.parse(x.expires_at)<=now?'expired':'active');
      const revoke=type==='student'?'adminRevokeFreeStudentShareLink':'adminRevokeFreeResultShareLink';
      return `<div class="hoa-share-link-row"><div class="hoa-share-link-row-main"><b>${esc(fmt(x.starts_at))} → ${esc(fmt(x.expires_at))}</b><span>${type==='student'?'Free Student Test Link':'Free Test Result Link'}${x.max_attempts?` · ${esc(x.max_attempts)} attempt${x.max_attempts===1?'':'s'}`:''}</span></div><div class="hoa-share-link-row-actions"><span class="hoa-share-link-status${status==='active'?'':' '+status}">${status.toUpperCase()}</span>${status==='active'?`<button type="button" class="secondary" data-hoa-free-revoke="${esc(x.id)}" data-hoa-free-revoke-type="${type}" data-hoa-free-revoke-content="${esc(x.content_id||'')}">REVOKE</button>`:''}</div></div>`;
    }).join(''):`<div class="hoa-share-link-row"><div class="hoa-share-link-row-main"><b>No links generated yet.</b><span>Generate a temporary link for this Free Test.</span></div></div>`;
  }

  async function renderExisting(contentId,host,type){
    if(!host)return;
    try{
      const rows=type==='student' ? await free().adminListFreeStudentShareLinks(contentId) : await free().adminListFreeResultShareLinks(contentId);
      host.innerHTML=listHtml(rows,type);
      host.querySelectorAll('[data-hoa-free-revoke]').forEach(btn=>btn.onclick=async()=>{
        if(!confirm('Revoke this link? It will stop working immediately.'))return;
        try{
          if(btn.dataset.hoaFreeRevokeType==='student') await free().adminRevokeFreeStudentShareLink(btn.dataset.hoaFreeRevoke);
          else await free().adminRevokeFreeResultShareLink(btn.dataset.hoaFreeRevoke);
          await renderExisting(contentId,host,type);
        }catch(e){alert(e?.message||'Could not revoke the link.')}
      });
    }catch(e){host.innerHTML=`<div class="hoa-share-link-row"><div class="hoa-share-link-row-main"><b>Unable to load links.</b><span>${esc(e?.message||'Please try again.')}</span></div></div>`}
  }

  async function openFreeStudentLinkModal(contentId,testId,title){
    if(!contentId||!testId){alert('This Free Test is missing its content reference. Refresh the Free Content section.');return}
    const m=modal('Free Student Test Link',`Generate a temporary direct link for “${title}”.`,`
      <div class="hoa-share-link-context"><span>FREE CONTENT</span><strong>${esc(title)}</strong><small>The link uses the existing Free Student access system and opens only this Free Test.</small></div>
      <div class="hoa-share-link-grid">
        <label>Starts At<input id="hoaFreeShareTestStart" type="datetime-local" value="${localInputValue(Date.now())}"></label>
        <label>Expires At<input id="hoaFreeShareTestExpiry" type="datetime-local" value="${localInputValue(Date.now()+24*60*60*1000)}"></label>
        <label>Maximum Attempts<select id="hoaFreeShareTestMaxAttempts"><option value="1">1 — Single attempt</option><option value="2">2 attempts</option><option value="3">3 attempts</option><option value="5">5 attempts</option><option value="10">10 attempts</option></select></label>
      </div>
      <div class="hoa-share-link-actions"><button type="button" class="primary" id="hoaGenerateFreeStudentLink">GENERATE LINK</button><button type="button" class="secondary" id="hoaRefreshFreeStudentLinks">REFRESH</button></div>
      <div id="hoaFreeStudentLinkOutput"></div>
      <div class="hoa-share-link-existing"><h4>Existing links for this Free Test</h4><div class="hoa-share-link-list" id="hoaFreeStudentLinksList"></div></div>`);
    await renderExisting(contentId,$('hoaFreeStudentLinksList'),'student');
    $('hoaRefreshFreeStudentLinks').onclick=()=>renderExisting(contentId,$('hoaFreeStudentLinksList'),'student');
    $('hoaGenerateFreeStudentLink').onclick=async()=>{
      const btn=$('hoaGenerateFreeStudentLink');btn.disabled=true;btn.textContent='GENERATING…';
      try{
        const result=await free().adminCreateFreeStudentShareLink(contentId,toISO($('hoaFreeShareTestStart').value),toISO($('hoaFreeShareTestExpiry').value),Number($('hoaFreeShareTestMaxAttempts').value)||1);
        const url=siteUrl('hoa_free_test_link',result.token);const out=$('hoaFreeStudentLinkOutput');out.className='hoa-share-link-output';out.innerHTML=`<span class="hoa-share-link-output-url">${esc(url)}</span><div class="hoa-share-link-output-meta"><span>Starts: ${esc(fmt(result.starts_at))}</span><span>Expires: ${esc(fmt(result.expires_at))}</span><span>Attempts: ${esc(result.max_attempts)}</span></div><div class="hoa-share-link-actions"><button type="button" class="primary" id="hoaCopyFreeStudentLink">COPY LINK</button></div>`;
        $('hoaCopyFreeStudentLink').onclick=async()=>{await copy(url);$('hoaCopyFreeStudentLink').textContent='COPIED ✓';setTimeout(()=>{if($('hoaCopyFreeStudentLink'))$('hoaCopyFreeStudentLink').textContent='COPY LINK'},1300)};
        await renderExisting(contentId,$('hoaFreeStudentLinksList'),'student');
      }catch(e){alert(e?.message||'Could not generate the Free Student test link.')}finally{btn.disabled=false;btn.textContent='GENERATE LINK'}
    };
  }

  async function openFreeResultLinkModal(contentId,testId,title){
    if(!contentId||!testId){alert('This Free Test is missing its content reference. Refresh the Free Content section.');return}
    const m=modal('Free Test Result / Status Link',`Generate a temporary Admin result link for “${title}”.`,`
      <div class="hoa-share-link-context"><span>FREE TEST RESULTS</span><strong>${esc(title)}</strong><small>The result link reveals only Free Student attempts for this Free Test and is validated server-side.</small></div>
      <div class="hoa-share-link-grid"><label>Expires At<input id="hoaFreeResultLinkExpiry" type="datetime-local" value="${localInputValue(Date.now()+24*60*60*1000)}"></label></div>
      <div class="hoa-share-link-actions"><button type="button" class="primary" id="hoaGenerateFreeResultLink">GENERATE RESULT LINK</button><button type="button" class="secondary" id="hoaRefreshFreeResultLinks">REFRESH</button></div>
      <div id="hoaFreeResultLinkOutput"></div>
      <div class="hoa-share-link-existing"><h4>Existing result links for this Free Test</h4><div class="hoa-share-link-list" id="hoaFreeResultLinksList"></div></div>`);
    await renderExisting(contentId,$('hoaFreeResultLinksList'),'result');
    $('hoaRefreshFreeResultLinks').onclick=()=>renderExisting(contentId,$('hoaFreeResultLinksList'),'result');
    $('hoaGenerateFreeResultLink').onclick=async()=>{
      const btn=$('hoaGenerateFreeResultLink');btn.disabled=true;btn.textContent='GENERATING…';
      try{
        const result=await free().adminCreateFreeResultShareLink(contentId,new Date().toISOString(),toISO($('hoaFreeResultLinkExpiry').value));
        const url=siteUrl('hoa_free_result_link',result.token);const out=$('hoaFreeResultLinkOutput');out.className='hoa-share-link-output';out.innerHTML=`<span class="hoa-share-link-output-url">${esc(url)}</span><div class="hoa-share-link-output-meta"><span>Expires: ${esc(fmt(result.expires_at))}</span></div><div class="hoa-share-link-actions"><button type="button" class="primary" id="hoaCopyFreeResultLink">COPY LINK</button></div>`;
        $('hoaCopyFreeResultLink').onclick=async()=>{await copy(url);$('hoaCopyFreeResultLink').textContent='COPIED ✓';setTimeout(()=>{if($('hoaCopyFreeResultLink'))$('hoaCopyFreeResultLink').textContent='COPY LINK'},1300)};
        await renderExisting(contentId,$('hoaFreeResultLinksList'),'result');
      }catch(e){alert(e?.message||'Could not generate the Free Test result link.')}finally{btn.disabled=false;btn.textContent='GENERATE RESULT LINK'}
    };
  }

  function installAdminFreeLinkActions(){
    const list=$('hoaV70AdminList');if(!list||list.dataset.hoaFreeShareBound)return;
    list.dataset.hoaFreeShareBound='1';
    list.addEventListener('click',e=>{
      const sb=e.target.closest('[data-hoa-free-student-link]');
      const rb=e.target.closest('[data-hoa-free-result-link]');
      if(sb){e.preventDefault();openFreeStudentLinkModal(sb.dataset.hoaFreeStudentLink,sb.dataset.hoaFreeTestId,sb.dataset.hoaFreeTestTitle);return}
      if(rb){e.preventDefault();openFreeResultLinkModal(rb.dataset.hoaFreeResultLink,rb.dataset.hoaFreeTestId,rb.dataset.hoaFreeTestTitle)}
    });
  }

  function showRouteMessage(title,message,code){
    let box=$('hoaShareRouteMessage');
    if(!box){box=document.createElement('section');box.id='hoaShareRouteMessage';box.className='hoa-share-route-message';document.querySelector('main')?.prepend(box)||document.body.appendChild(box)}
    box.innerHTML=`<h2>${esc(title)}</h2><p>${esc(message)}</p>${code?`<div class="hoa-share-route-code">${esc(code)}</div>`:''}<div style="margin-top:18px"><button type="button" class="secondary" id="hoaFreeResultBackBtn">← Back</button></div>`;
    box.classList.remove('hidden');
    $('hoaFreeResultBackBtn')?.addEventListener('click',()=>{const u=new URL(location.href);u.searchParams.delete('hoa_free_test_link');u.searchParams.delete('hoa_free_result_link');u.searchParams.delete('hoa_free_page');history.replaceState({},'',u.toString());location.reload()},{once:true});
  }
  function hideRouteMessage(){$('hoaShareRouteMessage')?.classList.add('hidden')}
  const resultError=code=>({AUTHENTICATION_REQUIRED:'Please sign in with an Admin account before opening this result link.',ADMIN_REQUIRED:'This result link is restricted to authenticated Admin accounts.',FREE_RESULT_LINK_INVALID:'This result link is invalid or no longer exists.',FREE_RESULT_LINK_REVOKED:'This result link has been revoked by Admin.',FREE_RESULT_LINK_NOT_ACTIVE_YET:'This result link is not active yet.',FREE_RESULT_LINK_EXPIRED:'This result link has expired and no longer reveals results.',FREE_TEST_NOT_AVAILABLE:'The Free Test is no longer available.',FREE_TEST_CONTENT_NOT_AVAILABLE:'The Free Content item connected to this link is no longer published.',TEST_HAS_NO_QUESTIONS:'This Free Test has no questions available.'}[code]||code||'The Free result link could not be opened.');

  async function openFreeResult(token){
    try{
      if(!global.adminLoggedIn){global.hoaOpenPortal?.('admin');return}
      if(global.currentStudent){showRouteMessage('Admin Access Required','This temporary result link is restricted to authenticated Admin accounts.','ADMIN_ONLY');return}
      const data=await free().adminViewFreeResultShareLink(token);
      const page=$('hoaShareResultPage');if(!page)throw new Error('Result page is unavailable.');
      hideRouteMessage();page.classList.remove('hidden');page.dataset.token=token;page.dataset.expiresAt=data?.expires_at||'';
      $('hoaShareResultTitle').textContent=data?.test?.title||'Free Test Result Status';
      $('hoaShareResultExpiry').textContent='Valid until '+fmt(data?.expires_at);
      const rows=Array.isArray(data?.results)?data.results:[];global.__hoaSharedResultRows=rows.slice();
      const completed=rows.filter(r=>r?.attempt_status==='completed').length;
      const progress=rows.filter(r=>r?.attempt_status==='in_progress').length;
      $('hoaShareResultAppeared').textContent=String(rows.length);$('hoaShareResultCompleted').textContent=String(completed);$('hoaShareResultInProgress').textContent=String(progress);
      global.renderHOASharedResultRows?.(rows);
      $('hoaShareResultSort')?.dispatchEvent(new Event('change'));
      const back=$('hoaShareResultBack');if(back){back.onclick=()=>{const u=new URL(location.href);u.searchParams.delete('hoa_free_result_link');history.replaceState({},'',u.toString());location.reload();};}
    }catch(e){const code=String(e?.message||e||'FREE_RESULT_LINK_FAILED').replace(/^.*?:/,'').trim();showRouteMessage('Free Result Link Unavailable',resultError(code),'FREE RESULT LINK')}
  }

  function installRoute(){
    const u=new URL(location.href);const testToken=u.searchParams.get('hoa_free_test_link')||'';const resultToken=u.searchParams.get('hoa_free_result_link')||'';
    if(resultToken){
      const run=()=>openFreeResult(resultToken);
      if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,0),{once:true});else setTimeout(run,0);
      global.__hoaOpenFreeResultShare=run;
    }
    if(testToken){
      try{if(!freeAccessToken())localStorage.setItem('hoa_pending_free_test_link',testToken)}catch(_){}
    }
  }

  function installAdminLoginHook(){
    const old=global.loginAdmin;
    if(typeof old==='function'&&!old.__hoaFreeShareWrap){
      const wrapped=async function(){const ok=await old.apply(this,arguments);if(ok){const token=new URL(location.href).searchParams.get('hoa_free_result_link');if(token)setTimeout(()=>openFreeResult(token),0)}return ok};wrapped.__hoaFreeShareWrap=true;global.loginAdmin=wrapped;
    }
  }

  global.HOA_FREE_SHARE_LINKS={openFreeStudentLinkModal,openFreeResultLinkModal,openFreeResult};
  function boot(){installAdminFreeLinkActions();installRoute();installAdminLoginHook();global.supabaseClient?.auth?.onAuthStateChange?.(()=>{installAdminLoginHook();const t=new URL(location.href).searchParams.get('hoa_free_result_link');if(t&&global.adminLoggedIn)setTimeout(()=>openFreeResult(t),0)});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})(window);
