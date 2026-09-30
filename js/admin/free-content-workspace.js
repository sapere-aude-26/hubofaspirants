/* HOA V6.1.0 — Feature-separated JavaScript module.
   Original inline script #55 (id: hoa-v611-free-content-admin-workspace).
   Execution position intentionally preserved from V6.0.9. */


(function(){
  'use strict';
  const V='HOA V6.1.1';
  const navOrder=['adminNavStudent','adminNavTest','adminNavCourse','adminNavVideo','adminNavNotes','adminNavPoster','adminNavAccess','adminNavFreeContent','adminNavResult','adminNavAdmin'];

  function ensureFreePanel(){
    if(typeof window.ensureAdminPanel==='function'){
      try{return window.ensureAdminPanel()}catch(e){console.warn(V+' ensureAdminPanel',e)}
    }
    return document.getElementById('adminSectionFreeContentPanel');
  }

  function reorderNav(){
    const nav=document.querySelector('#adminOnlyDashboard .adminSectionNav');
    if(!nav)return;
    const free=document.getElementById('adminNavFreeContent');
    const result=document.getElementById('adminNavResult');
    const admin=document.getElementById('adminNavAdmin');
    if(!free)return;
    if(result)nav.insertBefore(free,result); else if(admin)nav.insertBefore(free,admin); else nav.appendChild(free);
    /* Keep Result before Admin Access, with Free Content immediately before Result. */
    if(result&&admin)nav.insertBefore(result,admin);
    navOrder.forEach(id=>{const b=document.getElementById(id);if(b)b.dataset.hoa611Order=String(navOrder.indexOf(id))});
  }

  function decorateNav(){
    const b=document.getElementById('adminNavFreeContent');
    if(!b)return;
    if(!b.querySelector('.adminRefIcon')){
      const label=(b.textContent||'').replace(/^\s*🎁\s*/,'').trim()||'Free Content';
      b.textContent='';
      const i=document.createElement('span');i.className='adminRefIcon';i.textContent='🎁';i.setAttribute('aria-hidden','true');
      const l=document.createElement('span');l.className='adminRefLabel';l.textContent=label;
      b.append(i,l);
    }
    b.setAttribute('aria-label','Free Content');
  }

  function ensureAreas(){
    const panel=document.getElementById('adminSectionFreeContentPanel');
    if(!panel||panel.dataset.hoa611Ready==='1')return;
    const editor=panel.querySelector('.hoa-v70-content-editor');
    const list=panel.querySelector('#hoaV70AdminList');
    const profiles=panel.querySelector('#hoaV70Profiles');
    if(!editor||!list||!profiles)return;
    const card=panel.querySelector('.dashPanel');
    if(!card)return;

    const toolbar=document.createElement('div');
    toolbar.className='hoa-v611-free-toolbar';
    toolbar.innerHTML='<div class="hoa-v611-free-tabs" role="tablist" aria-label="Free Content management"><button type="button" class="hoa-v611-free-tab active" data-free-area="content">📚 Content Library</button><button type="button" class="hoa-v611-free-tab" data-free-area="students">👥 Free Students</button><button type="button" class="hoa-v611-free-tab" data-free-area="results">📊 Free Test Results</button></div><span class="hoa-v611-free-toolbar-note">Manage Free Content without leaving the Admin workspace.</span>';

    const contentArea=document.createElement('section');
    contentArea.className='hoa-v611-free-area active';contentArea.dataset.freeArea='content';
    const stats=document.createElement('div');stats.className='hoa-v611-free-stat-grid';
    stats.innerHTML='<div class="hoa-v611-free-stat"><b id="hoaV611ContentStat">0</b><span>Total Free Content</span></div><div class="hoa-v611-free-stat"><b id="hoaV611PublishedStat">0</b><span>Published</span></div><div class="hoa-v611-free-stat"><b id="hoaV611TestStat">0</b><span>Free Tests / Mock Tests</span></div>';
    contentArea.append(stats,editor);

    const studentsArea=document.createElement('section');
    studentsArea.className='hoa-v611-free-area';studentsArea.dataset.freeArea='students';
    const studentHead=document.createElement('div');studentHead.className='hoa-v70-subhead';studentHead.innerHTML='<div><h3>Free Students</h3><p>Manage Free Student registrations separately from Paid Students and Admin accounts.</p></div>';
    studentsArea.append(studentHead,profiles);

    const resultsArea=document.createElement('section');
    resultsArea.className='hoa-v611-free-area';resultsArea.dataset.freeArea='results';
    const resultHost=document.createElement('div');resultHost.id='hoaV611ResultsHost';
    resultsArea.append(resultHost);

    const existingSubheads=[...card.querySelectorAll('.hoa-v70-subhead')];
    existingSubheads.forEach(x=>{
      if(x.textContent.includes('Published / Saved Content')||x.textContent.includes('Free Students'))x.remove();
    });

    /* Existing saved-content list belongs to Content Library. */
    const contentHead=document.createElement('div');contentHead.className='hoa-v70-subhead';contentHead.innerHTML='<div><h3>Published / Saved Content</h3><p>Preview, edit, publish or delete resources without leaving this section.</p></div>';
    contentArea.append(contentHead,list);

    const fr=document.getElementById('hoaV70FreeResults');
    if(fr){resultsArea.append(fr)}else{
      const empty=document.createElement('div');empty.id='hoaV611ResultsPlaceholder';empty.className='emptyState';empty.textContent='Free Test Results will appear here when available.';resultsArea.append(empty);
    }

    toolbar.querySelectorAll('[data-free-area]').forEach(btn=>btn.addEventListener('click',function(){
      const target=this.dataset.freeArea;
      toolbar.querySelectorAll('.hoa-v611-free-tab').forEach(x=>x.classList.toggle('active',x===this));
      card.querySelectorAll('.hoa-v611-free-area').forEach(x=>x.classList.toggle('active',x.dataset.freeArea===target));
      if(target==='results')window.hoaV611RefreshFreeResults?.();
    }));

    /* Insert after the main section header. */
    const header=card.querySelector('.hoa-admin-section-head');
    if(header)header.after(toolbar);else card.prepend(toolbar);
    card.append(contentArea,studentsArea,resultsArea);
    panel.dataset.hoa611Ready='1';
  }

  function updateStats(){
    const rows=[...document.querySelectorAll('#hoaV70AdminList tbody tr')];
    const total=rows.length;
    const published=rows.filter(r=>/\bYES\b/i.test(r.children[2]?.textContent||'')).length;
    const tests=rows.filter(r=>/test/i.test(r.children[1]?.textContent||'')).length;
    const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=String(v)};
    set('hoaV611ContentStat',total);set('hoaV611PublishedStat',published);set('hoaV611TestStat',tests);
  }

  function enhance(){
    const p=ensureFreePanel();
    reorderNav();decorateNav();
    if(p){ensureAreas();updateStats()}
  }

  window.hoaV611RefreshFreeResults=async function(){
    try{
      if(typeof window.hoaV70LoadAdmin==='function')await window.hoaV70LoadAdmin();
      const fr=document.getElementById('hoaV70FreeResults');
      const host=document.getElementById('hoaV611ResultsHost');
      if(fr&&host&&!host.contains(fr))host.appendChild(fr);
      updateStats();
    }catch(e){console.warn(V+' result refresh',e)}
  };

  const oldShow=window.showAdminSection;
  window.showAdminSection=async function(section){
    if(section==='freecontent'){
      ensureFreePanel();reorderNav();decorateNav();ensureAreas();
      const p=document.getElementById('adminSectionFreeContentPanel');
      document.querySelectorAll('#adminOnlyDashboard .adminSectionPanel').forEach(x=>{x.classList.toggle('active',x===p);if(x!==p)x.style.removeProperty('display')});
      document.querySelectorAll('#adminOnlyDashboard .adminSectionNav button').forEach(x=>x.classList.remove('active'));
      document.getElementById('adminNavFreeContent')?.classList.add('active');
      p?.style.setProperty('display','block','important');
      if(typeof window.hoaV70LoadAdmin==='function')await window.hoaV70LoadAdmin();
      ensureAreas();updateStats();reorderNav();decorateNav();
      const title=document.getElementById('adminReferencePageTitle');
      const sub=document.getElementById('adminReferencePageSub');
      if(title)title.textContent='Free Content';
      if(sub)sub.textContent='Create, publish, preview and manage Free Student resources';
      return;
    }
    const r=oldShow?await oldShow.apply(this,arguments):undefined;
    reorderNav();decorateNav();
    return r;
  };

  function boot(){
    enhance();
    setTimeout(enhance,250);setTimeout(enhance,1000);setTimeout(enhance,2000);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
