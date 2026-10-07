/* HOA V8.90 — Free Content Consolidation
 * One controller owns the Free Content admin workspace.
 * Source of truth: V8.57 Admin architecture.
 * No MutationObservers, no showAdminSection wrappers, no loader wrappers.
 */
(function(){
  'use strict';
  if(window.__HOA_FREE_CONTENT_V89__) return;
  window.__HOA_FREE_CONTENT_V89__=true;

  const $=id=>document.getElementById(id);
  let resultsModulePromise=null;
  function ensureResultsModule(){
    if(typeof window.hoaV89InstallFreeResults==='function') return Promise.resolve();
    if(resultsModulePromise) return resultsModulePromise;
    resultsModulePromise=Promise.all([
      new Promise((resolve,reject)=>{const id='hoaV89FreeResultsCss';if(document.getElementById(id))return resolve();const l=document.createElement('link');l.id=id;l.rel='stylesheet';l.href='css/free-results-admin-v8.90.css?v=20261005-v89';l.onload=resolve;l.onerror=()=>reject(new Error('Unable to load Free Test Results styles.'));document.head.appendChild(l)}),
      new Promise((resolve,reject)=>{const id='hoaV89FreeResultsJs';if(document.getElementById(id))return resolve();const s=document.createElement('script');s.id=id;s.src='js/free-results-admin-v8.90.js?v=20261005-v89';s.async=false;s.onload=resolve;s.onerror=()=>reject(new Error('Unable to load Free Test Results manager.'));document.body.appendChild(s)})
    ]);
    return resultsModulePromise;
  }
  const esc=window.escapeHTML||((v)=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])));
  let baseLoadResolved=null;
  let openGeneration=0;
  let refreshBusy=false;

  function markerOff(){
    const b=$('adminNavFreeContent');
    if(!b)return;
    b.classList.remove('active','v13-active');
    b.removeAttribute('aria-current');
    b.style.setProperty('border-left','0','important');
    b.style.setProperty('border-left-color','transparent','important');
    b.style.setProperty('box-shadow','none','important');
  }

  function panel(){
    const p=$('adminSectionFreeContentPanel');
    if(p)p.dataset.hoaAdminWorkspace='free-content';
    return p;
  }

  function setupTabs(){
    const p=panel(); if(!p)return null;
    const card=p.querySelector('.dashPanel'); if(!card)return p;
    if(card.dataset.hoaV75Ready==='1'){markerOff();return p;}

    const editor=p.querySelector('.hoa-v70-content-editor');
    const list=p.querySelector('#hoaV70AdminList');
    const profiles=p.querySelector('#hoaV70Profiles');
    const stats=p.querySelector('.hoa-v611-free-stat-grid');
    const legacyResults=p.querySelector('#hoaV70FreeResults');
    if(!editor||!list||!profiles)return p;

    const oldToolbar=card.querySelector('.hoa-v75-free-toolbar');
    oldToolbar?.remove();
    const legacyToolbar=card.querySelector('.hoa-v611-free-toolbar');
    legacyToolbar?.remove();
    const oldAreas=card.querySelectorAll('.hoa-v75-free-area');
    oldAreas.forEach(x=>x.remove());
    const legacyAreas=card.querySelectorAll('.hoa-v611-free-area');
    legacyAreas.forEach(x=>x.remove());

    // Keep the useful legacy nodes as the data/render source, but place them into one controlled workspace.
    const toolbar=document.createElement('div');
    toolbar.className='hoa-v75-free-toolbar';
    toolbar.innerHTML=`<div class="hoa-v75-free-tabs" style="display:flex;gap:8px;flex-wrap:wrap" role="tablist">
      <button type="button" class="secondary" data-hoa-v75-tab="content" aria-selected="true">📚 Content Library</button>
      <button type="button" class="secondary" data-hoa-v75-tab="students" aria-selected="false">👥 Free Students</button>
      <button type="button" class="secondary" data-hoa-v75-tab="results" aria-selected="false">📊 Free Test Results</button>
    </div><div class="hoa-v75-free-note">One connected Free Content workspace. Data reloads only when explicitly refreshed.</div>`;

    const content=document.createElement('section'); content.className='hoa-v75-free-area active'; content.dataset.hoaV75Area='content';
    const students=document.createElement('section'); students.className='hoa-v75-free-area'; students.dataset.hoaV75Area='students';
    const results=document.createElement('section'); results.className='hoa-v75-free-area'; results.dataset.hoaV75Area='results';

    if(stats)content.append(stats);
    content.append(editor,list);
    students.innerHTML='<div class="hoa-v70-subhead"><div><h3>Free Students</h3><p>Manage Free Student registrations separately from Paid Students and Admin accounts.</p></div></div>';
    students.append(profiles);
    results.innerHTML='<div class="hoa-v70-subhead"><div><h3>Free Test Results</h3><p>Search, sort, export, review and manage completed Free Test attempts.</p></div></div><div id="hoaV75ResultsMount"></div>';
    if(legacyResults) $('hoaV70FreeResults')?.remove();
    if(legacyResults) results.querySelector('#hoaV75ResultsMount').appendChild(legacyResults);
    else { const created=document.createElement('div'); created.id='hoaV70FreeResults'; results.querySelector('#hoaV75ResultsMount').appendChild(created); }

    const head=card.querySelector('.hoa-admin-section-head');
    if(head)head.after(toolbar); else card.prepend(toolbar);
    card.append(content,students,results);

    toolbar.querySelectorAll('[data-hoa-v75-tab]').forEach(btn=>btn.addEventListener('click',async()=>{
      const target=btn.dataset.hoaV75Tab;
      toolbar.querySelectorAll('[data-hoa-v75-tab]').forEach(x=>{x.setAttribute('aria-selected',String(x===btn));x.classList.toggle('primary',x===btn);x.classList.toggle('secondary',x!==btn);});
      card.querySelectorAll('.hoa-v75-free-area').forEach(a=>a.classList.toggle('active',a.dataset.hoaV75Area===target));
      markerOff();
      if(target==='results') await installResults();
    }));

    card.dataset.hoaV75Ready='1';
    markerOff();
    enhanceLists();
    return p;
  }

  function tableTools(hostId,placeholder){
    const host=$(hostId);if(!host||host.dataset.hoaV75Tools==='1')return;
    host.dataset.hoaV75Tools='1';
    const tools=document.createElement('div');tools.className='hoa-v75-free-tools';
    tools.innerHTML=`<input type="search" placeholder="${esc(placeholder)}" aria-label="${esc(placeholder)}"><select aria-label="Sort list"><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="az">A–Z</option><option value="za">Z–A</option></select>`;
    host.parentElement?.insertBefore(tools,host);
    const input=tools.querySelector('input'),sort=tools.querySelector('select');
    const apply=()=>{
      const tbody=host.querySelector('tbody'); if(!tbody)return;
      const q=(input.value||'').trim().toLowerCase();
      let rows=[...tbody.querySelectorAll('tr')];
      rows.forEach(r=>{r.hidden=!!q&&!r.textContent.toLowerCase().includes(q);});
      rows=rows.filter(r=>!r.hidden);
      const mode=sort.value;
      rows.sort((a,b)=>{
        if(mode==='az'||mode==='za'){const av=a.textContent.trim().toLowerCase(),bv=b.textContent.trim().toLowerCase();return mode==='az'?av.localeCompare(bv,undefined,{numeric:true}):bv.localeCompare(av,undefined,{numeric:true});}
        const ai=Number(a.dataset.hoaV75Index||0),bi=Number(b.dataset.hoaV75Index||0);return mode==='oldest'?ai-bi:bi-ai;
      });
      rows.forEach(r=>tbody.appendChild(r));
    };
    input.addEventListener('input',apply,{passive:true}); sort.addEventListener('change',apply); host.__hoaV75Apply=apply; apply();
  }

  function enhanceLists(){tableTools('hoaV70AdminList','Search content title / category / type…');tableTools('hoaV70Profiles','Search student name / mobile / email / college…');markerOff();}

  function resolveBaseLoad(){
    if(baseLoadResolved)return baseLoadResolved;
    const fn=window.hoaV70LoadAdmin;
    if(typeof fn!=='function')return null;
    baseLoadResolved=fn;
    return baseLoadResolved;
  }

  async function installResults(){
    if(typeof window.hoaV89InstallFreeResults==='function') {
      const mount=$('hoaV75ResultsMount');
      const legacy=$('hoaV70FreeResults');
      if(legacy&&mount&&legacy.parentNode!==mount)mount.appendChild(legacy);
      await window.hoaV89InstallFreeResults();
    }
  }

  async function load(force=false){
    const p=setupTabs();
    if(!p)return;
    markerOff();
    if(refreshBusy)return;
    if(!force && p.dataset.hoaV75Loaded==='1'){enhanceLists();if(p.querySelector('.hoa-v75-free-area[data-hoa-v75-area="results"]')?.classList.contains('active'))await installResults();return;}
    refreshBusy=true; const generation=++openGeneration;
    try{
      const fn=resolveBaseLoad();
      if(typeof fn!=='function')throw new Error('Existing Free Content loader is unavailable.');
      await fn();
      if(generation!==openGeneration)return;
      setupTabs();enhanceLists();
      if(p.querySelector('.hoa-v75-free-area[data-hoa-v75-area="results"]')?.classList.contains('active')) await installResults();
      const msg=$('hoaV70AdminMsg'); if(msg&&!msg.textContent)msg.textContent='';
      p.dataset.hoaV75Loaded='1';
    }catch(e){
      const msg=$('hoaV70AdminMsg');if(msg)msg.textContent='Free Content could not be loaded: '+String(e?.message||e);
      console.error('[HOA V8.90 Free Content]',e);
    }finally{refreshBusy=false;markerOff();}
  }

  window.hoaV89OpenFreeContent=()=>load(false);
  window.hoaV89RefreshFreeContent=()=>load(true);
  window.hoaV89FreeContentAPI={load,refresh:()=>load(true),setupTabs,markerOff};

  function init(){markerOff();setupTabs();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
