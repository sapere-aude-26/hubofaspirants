/* HUB OF ASPIRANTS V8.19 CLEAN — consolidated inline runtime. Original execution order preserved: scripts 49–61. */

/* ===== Original inline script 49 ===== */
/* =========================================================
   HOA V6.2.0 — THEME SYSTEM
   Feature owner: CORE / UI SYSTEM
   Public functions: window.hoaSetTheme, window.hoaToggleTheme
   Storage: hoa-theme
   Database/RPC: none
   Future module: js/theme.js (optional)
   ========================================================= */
(function(){
  'use strict';
  var KEY='hoa-theme';
  var root=document.documentElement;
  function systemTheme(){return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}
  function apply(theme,save){
    theme=theme==='dark'?'dark':'light';
    root.setAttribute('data-theme',theme);
    root.classList.add('hoa-theme-transition');
    if(save){try{localStorage.setItem(KEY,theme)}catch(e){}}
    document.dispatchEvent(new CustomEvent('hoa:themechange',{detail:{theme:theme}}));
  }
  function init(){
    var saved=null; try{saved=localStorage.getItem(KEY)}catch(e){}
    apply(saved==='dark'||saved==='light'?saved:systemTheme(),false);
  }
  window.hoaSetTheme=function(theme){apply(theme,true)};
  window.hoaToggleTheme=function(){apply(root.getAttribute('data-theme')==='dark'?'light':'dark',true)};
  window.hoaGetTheme=function(){return root.getAttribute('data-theme')||'light'};
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();

/* ===== Original inline script 50 ===== */
/* =========================================================
   HOA V6.2.1 — ADMIN THEME CONTROL
   Feature owner: CORE / ADMIN UI
   Dependencies: V6.2.0 theme API
   Database/RPC: none
   Future module: js/theme.js / js/ui.js
   ========================================================= */
(function(){
  'use strict';
  function label(){return document.documentElement.getAttribute('data-theme')==='dark'?'☀️ Light':'🌙 Dark';}
  function sync(btn){if(btn) btn.innerHTML=label()+' Mode';}
  function mount(){
    if(!document.body.classList.contains('admin-ui')) return;
    var host=document.querySelector('.adminReferenceTopbarActions');
    if(!host || document.getElementById('hoaV621ThemeBtn')) return;
    var b=document.createElement('button');
    b.type='button'; b.id='hoaV621ThemeBtn'; b.className='hoa-v621-theme-btn'; b.title='Toggle light and dark mode';
    b.addEventListener('click',function(){if(typeof window.hoaToggleTheme==='function') window.hoaToggleTheme(); sync(b);});
    host.insertBefore(b,host.firstChild); sync(b);
    document.addEventListener('hoa:themechange',function(){sync(b);});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',mount,{once:true}); else mount();
  new MutationObserver(mount).observe(document.body,{attributes:true,attributeFilter:['class'],subtree:false});
})();

/* ===== Original inline script 51 ===== */
/* HOA V6.2.3 — Mobile drawer API; intentionally additive. */
(function(){
  function toggle(){ document.body.classList.toggle('hoa-sidebar-open'); }
  function close(){ document.body.classList.remove('hoa-sidebar-open'); }
  window.hoaToggleMobileSidebar=toggle;
  window.hoaCloseMobileSidebar=close;
  document.addEventListener('click',function(e){
    if(!document.body.classList.contains('hoa-sidebar-open')) return;
    if(e.target.closest('.adminReferenceSidebar')) return;
    if(e.target.closest('[data-hoa-mobile-sidebar]')) return;
    close();
  });
})();

/* ===== Original inline script 52 ===== */
(function(){
  'use strict';
  function sync(){
    var b=document.getElementById('hoaMobileAdminSectionsBtn');
    if(b) b.setAttribute('aria-expanded',document.body.classList.contains('hoa-sidebar-open')?'true':'false');
  }
  document.addEventListener('click',function(e){ if(e.target.closest && e.target.closest('.adminReferenceSidebar')) setTimeout(sync,0); });
  new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['class']});
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',sync,{once:true}); else sync();
})();

/* ===== Original inline script 53 ===== */
(function(){
  window.hoaV627RefreshDataUI=function(){
    document.querySelectorAll('input[required],select[required],textarea[required]').forEach(function(el){
      var l=el.closest('.hoa-v627-form-group')?.querySelector('label'); if(l) l.classList.add('hoa-v627-required');
    });
    document.querySelectorAll('table').forEach(function(t){ if(!t.parentElement.classList.contains('hoa-v627-table-wrap')){ var w=document.createElement('div'); w.className='hoa-v627-table-wrap'; t.parentNode.insertBefore(w,t); w.appendChild(t); }});
  };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',window.hoaV627RefreshDataUI); else window.hoaV627RefreshDataUI();
})();

/* ===== Original inline script 54 ===== */
(function(){'use strict';window.hoaV629RefreshPages=function(){try{document.querySelectorAll('#adminOnlyDashboard .card,#studentOnlyDashboard .card').forEach(function(el){if(!el.hasAttribute('tabindex')&&(el.onclick||el.getAttribute('role')==='button'))el.setAttribute('tabindex','0')})}catch(e){console.warn('[HOA V6.2.9] page refinement refresh skipped:',e)}};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',window.hoaV629RefreshPages,{once:true});else window.hoaV629RefreshPages()})();

/* ===== Original inline script 55 ===== */
(function(){
  'use strict';
  function mark(root){
    root=root||document;
    const selectors=['[id*="test"]','.test-card','.mock-test-card','.test-item','.question-card','.option-card','.question-option'];
    selectors.forEach(sel=>root.querySelectorAll(sel).forEach(el=>{
      if(el.classList.contains('hoa-v610-mock-card')||el.classList.contains('hoa-v610-question')||el.classList.contains('hoa-v610-option')) return;
      const id=(el.id||'').toLowerCase(); const cls=(el.className||'').toString().toLowerCase();
      if(/question/.test(id+' '+cls)) el.classList.add('hoa-v610-question');
      else if(/option/.test(id+' '+cls)) el.classList.add('hoa-v610-option');
      else if(/test/.test(id+' '+cls)) el.classList.add('hoa-v610-mock-card');
    }));
  }
  window.hoaV610RefreshMockUI=function(){mark(document);};
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>mark(document)); else mark(document);
})();

/* ===== Original inline script 56 ===== */
window.__HOA_ADMIN_MOCK_WORKSPACE_INIT?.();

/* ===== Original inline script 57 ===== */
(function(){
  'use strict';
  const ORDER=['adminNavStudent','adminNavTest','adminNavCourse','adminNavVideo','adminNavNotes','adminNavPoster','adminNavAccess','adminNavFreeContent','adminNavResult','adminNavAdmin'];
  const META={
    freecontent:['Free Content','Create, publish, preview and manage Free Student resources']
  };

  function adminNav(){
    return document.querySelector('#adminReferenceSidebar .adminSectionNav') ||
           document.querySelector('#adminReferenceSidebar .adminSectionNav, #adminOnlyDashboard .adminSectionNav');
  }

  function ensureNavButton(){
    const nav=adminNav();
    if(!nav) return null;
    let b=document.getElementById('adminNavFreeContent');
    if(!b){
      b=document.createElement('button');
      b.type='button';
      b.id='adminNavFreeContent';
      b.innerHTML='<span class="adminRefIcon" aria-hidden="true">🎁</span><span class="adminRefLabel">Free Content</span>';
      b.setAttribute('aria-label','Free Content');
      nav.appendChild(b);
    }
    /* Never route this button through the public/student Free Content opener. */
    b.onclick=function(e){
      e.preventDefault();
      e.stopPropagation();
      return window.hoaAdminOpenFreeContent ? window.hoaAdminOpenFreeContent() : false;
    };
    return b;
  }

  function reorder(){
    const nav=adminNav();
    if(!nav) return;
    const b=ensureNavButton();
    if(!b) return;
    const result=document.getElementById('adminNavResult');
    const admin=document.getElementById('adminNavAdmin');
    if(result) nav.insertBefore(b,result);
    else if(admin) nav.insertBefore(b,admin);
    else nav.appendChild(b);
  }

  function panel(){
    let p=document.getElementById('adminSectionFreeContentPanel');
    if(p) return p;
    if(typeof window.ensureAdminPanel==='function'){
      try{ p=window.ensureAdminPanel(); }catch(e){ console.warn('V6.1.3 Free Content panel creation:',e); }
    }
    return document.getElementById('adminSectionFreeContentPanel');
  }

  function activate(){
    if(typeof adminLoggedIn!=='undefined' && adminLoggedIn!==true){
      return false;
    }
    const p=panel();
    if(!p){
      console.error('HOA V6.1.3: Free Content admin panel was not created.');
      return false;
    }
    reorder();

    document.querySelectorAll('#adminOnlyDashboard .adminSectionPanel').forEach(function(x){
      const on=x===p;
      x.classList.toggle('active',on);
      if(on){
        x.style.setProperty('display','block','important');
        x.style.setProperty('visibility','visible','important');
        x.style.setProperty('opacity','1','important');
        x.style.setProperty('pointer-events','auto','important');
      }else{
        x.style.setProperty('display','none','important');
        x.classList.remove('v13-active');
      }
    });

    document.querySelectorAll('#adminReferenceSidebar .adminSectionNav button, #adminOnlyDashboard .adminSectionNav button').forEach(function(x){
      x.classList.remove('active','v13-active');
    });
    const b=document.getElementById('adminNavFreeContent');
    if(b) b.classList.add('active','v13-active');

    const title=document.getElementById('adminReferencePageTitle');
    const sub=document.getElementById('adminReferencePageSub');
    if(title) title.textContent=META.freecontent[0];
    if(sub) sub.textContent=META.freecontent[1];

    /* Explicitly load ADMIN Free Content. This must never call hoaOpenFreeContent(). */
    if(typeof window.hoaV70LoadAdmin==='function'){
      Promise.resolve(window.hoaV70LoadAdmin()).catch(function(e){console.error('Free Content admin load failed:',e);});
    }
    if(typeof window.hoaV611RefreshFreeResults==='function'){
      Promise.resolve(window.hoaV611RefreshFreeResults()).catch(function(e){console.warn('Free Content admin refresh:',e);});
    }
    return true;
  }

  window.hoaAdminOpenFreeContent=activate;

  function install(){
    reorder();
    const p=panel();
    if(p){
      /* Ensure the panel is never mistaken for a student/public portal. */
      p.dataset.hoaAdminWorkspace='free-content';
    }
    reorder();
  }

  /* Final navigation authority: intercept only the admin Free Content route. */
  const previous=window.showAdminSection;
  if(typeof previous==='function' && !previous.__hoaV613FreeContentAuthority){
    const wrapped=async function(section){
      if(String(section).toLowerCase()==='freecontent'){
        return activate();
      }
      return previous.apply(this,arguments);
    };
    wrapped.__hoaV613FreeContentAuthority=true;
    wrapped.__hoaV613FreeContentPrevious=previous;
    window.showAdminSection=wrapped;
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',function(){install();setTimeout(install,300);setTimeout(install,1000);}, {once:true});
  }else{
    install();
    setTimeout(install,300);
    setTimeout(install,1000);
  }
})();

/* ===== Original inline script 58 ===== */
/* HOA V6.2.4 — Interaction polish runtime. No database/RPC dependencies. */
(function(){
  'use strict';
  function enhance(){
    var selectors=['.admin-card','.dashboard-card','.stat-card','.course-card','.test-card','.content-card','.result-card'];
    selectors.forEach(function(sel){document.querySelectorAll(sel).forEach(function(el){el.classList.add('hoa-lift');});});
  }
  window.hoaRefreshMotion=enhance;
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',enhance,{once:true}); else enhance();
})();

/* ===== Original inline script 59 ===== */
(function(){
  'use strict';
  function markActive(){
    var candidates=document.querySelectorAll('[data-admin-section],.admin-nav-item,.admin-sidebar button,.admin-sidebar a,.sidebar button,.sidebar a');
    candidates.forEach(function(el){
      if(el.classList.contains('active')||el.getAttribute('aria-current')==='page'||el.getAttribute('aria-selected')==='true') el.classList.add('hoa-v626-nav-active');
      else el.classList.remove('hoa-v626-nav-active');
    });
  }
  function enhance(){
    document.querySelectorAll('.admin-sidebar button,.admin-sidebar a,.sidebar button,.sidebar a').forEach(function(el){
      if(!el.getAttribute('title') && el.textContent.trim()) el.setAttribute('title',el.textContent.trim().replace(/\s+/g,' '));
    });
    markActive();
  }
  window.hoaRefreshNavigationUI=enhance;
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',enhance,{once:true}); else enhance();
  var observer=new MutationObserver(function(){markActive();});
  if(document.body) observer.observe(document.body,{subtree:true,attributes:true,attributeFilter:['class','aria-current','aria-selected']});
})();

/* ===== Original inline script 60 ===== */
(function(){
  let lastFocus=null;
  function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  window.hoaV628CloseDialog=function(){const o=document.getElementById('hoaV628Overlay');if(!o)return;o.classList.remove('is-open');o.setAttribute('aria-hidden','true');if(lastFocus&&document.contains(lastFocus))lastFocus.focus();};
  window.hoaV628Dialog=function(opts={}){const o=document.getElementById('hoaV628Overlay'),b=document.getElementById('hoaV628Body'),t=document.getElementById('hoaV628Title'),a=document.getElementById('hoaV628Actions');if(!o||!b||!t||!a)return Promise.resolve(false);lastFocus=document.activeElement;t.textContent=opts.title||'Confirm action';b.innerHTML=opts.html||esc(opts.message||'Are you sure?');a.innerHTML='';const cancel=document.createElement('button');cancel.type='button';cancel.className='hoa-btn hoa-btn-secondary';cancel.textContent=opts.cancelText||'Cancel';const ok=document.createElement('button');ok.type='button';ok.className='hoa-btn hoa-btn-primary';ok.textContent=opts.confirmText||'Confirm';a.append(cancel,ok);o.classList.add('is-open');o.setAttribute('aria-hidden','false');setTimeout(()=>ok.focus(),30);return new Promise(resolve=>{let done=false;const finish=v=>{if(done)return;done=true;hoaV628CloseDialog();resolve(v)};cancel.onclick=()=>finish(false);ok.onclick=()=>{if(opts.onConfirm){Promise.resolve(opts.onConfirm()).then(()=>finish(true)).catch(()=>finish(false));}else finish(true)};o.onclick=e=>{if(e.target===o)finish(false)};document.addEventListener('keydown',function key(e){if(!o.classList.contains('is-open')){document.removeEventListener('keydown',key);return}if(e.key==='Escape')finish(false)});});};
  window.hoaV628Confirm=function(message,opts={}){return window.hoaV628Dialog(Object.assign({},opts,{message,confirmText:opts.confirmText||'Confirm'}));};
  window.hoaV628Toast=function(message,opts={}){const s=document.getElementById('hoaV628ToastStack');if(!s)return;const el=document.createElement('div');const type=opts.type||'info';el.className='hoa-v628-toast '+type;el.innerHTML='<div aria-hidden="true">'+(type==='success'?'✓':type==='error'?'!':type==='warning'?'⚠':'i')+'</div><div><div class="hoa-v628-toast-title">'+esc(opts.title||(type==='success'?'Success':type==='error'?'Error':type==='warning'?'Attention':'Notice'))+'</div><div class="hoa-v628-toast-message">'+esc(message)+'</div></div><button class="hoa-v628-toast-close" aria-label="Dismiss">×</button>';el.querySelector('.hoa-v628-toast-close').onclick=()=>el.remove();s.appendChild(el);const ms=Math.max(2500,Number(opts.duration)||4200);setTimeout(()=>{if(el.isConnected)el.remove()},ms);};
  window.hoaV628Loading=function(show=true){const el=document.getElementById('hoaV628Loading');if(!el)return;el.classList.toggle('is-open',!!show);el.setAttribute('aria-hidden',String(!show));};
  window.hoaV628RefreshFeedbackUI=function(){document.querySelectorAll('[data-hoa-toast]').forEach(el=>{if(!el.dataset.hoaToastBound){el.dataset.hoaToastBound='1';el.addEventListener('click',()=>window.hoaV628Toast(el.dataset.hoaToast,{type:el.dataset.hoaToastType||'info'}));}});};
  document.addEventListener('DOMContentLoaded',window.hoaV628RefreshFeedbackUI);
})();

/* ===== Original inline script 61 ===== */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const client=()=>window.supabaseClient||null;
  const isAdmin=()=>typeof adminLoggedIn!=='undefined'&&adminLoggedIn===true&&(!currentStudent);
  const fmtDate=v=>{if(!v)return '—';try{return new Date(v).toLocaleString();}catch(_){return String(v)}};
  const n=v=>Number(v||0);
  function status(text,error){const e=$('hoaMasterStatus');if(!e)return;e.textContent=text||'';e.classList.toggle('error',!!error);}
  function chip(text,type){return `<span class="hoa-master-chip ${type||''}">${esc(text)}</span>`;}
  function section(title,sub,html,wide){
    return `<section class="hoa-master-section ${wide?'hoa-master-wide-section':''}"><div class="hoa-master-section-head"><div><h4>${esc(title)}</h4><span>${esc(sub||'')}</span></div></div>${html||'<div class="hoa-master-empty">No records found.</div>'}</section>`;
  }
  function table(headers,rows){
    if(!rows.length)return '<div class="hoa-master-empty">No records found.</div>';
    return `<div class="hoa-master-table-wrap"><table><thead><tr>${headers.map(x=>`<th>${esc(x)}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
  }
  function masterStatSvg(label){
    const m={
      'Total Students':'<svg viewBox="0 0 24 24"><path d="M16 20c0-2.7-2-4.5-5-4.5S6 17.3 6 20"/><circle cx="11" cy="8" r="3.2"/><path d="M17 11.5c2.1.3 3.5 1.5 4 3.5M16.5 5.2a3 3 0 0 1 0 5.6"/></svg>',
      'Teachers / Admins':'<svg viewBox="0 0 24 24"><path d="M5 19c0-2.6 2.1-4.4 5-4.4s5 1.8 5 4.4"/><circle cx="10" cy="8" r="3"/><path d="M15.5 8.5h4M17.5 6.5v4.1"/></svg>',
      'Batches':'<svg viewBox="0 0 24 24"><path d="m4 7 8-3 8 3-8 3-8-3Z"/><path d="M6.5 9.5V16c1.7 1.4 3.5 2 5.5 2s3.8-.6 5.5-2V9.5M20 8.5V14"/></svg>',
      'Mock Tests':'<svg viewBox="0 0 24 24"><rect x="5" y="3.5" width="14" height="17" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/></svg>',
      'Questions':'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.6 2.6 0 1 1 4.7 1.5c-.8 1-2.2 1.2-2.2 2.7M12 16.8h.01"/></svg>',
      'Classes / Videos':'<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m10 9 5 3-5 3V9Z"/></svg>',
      'Notes':'<svg viewBox="0 0 24 24"><path d="M5 4.5h11a3 3 0 0 1 3 3V20H8a3 3 0 0 1-3-3V4.5Z"/><path d="M10 8h6M10 11.5h6"/></svg>',
      'Posters':'<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><circle cx="9" cy="9" r="1.7"/><path d="m6.5 17 4.5-4 3 2.5 2-2 2 3.5"/></svg>',
      'Free Content':'<svg viewBox="0 0 24 24"><path d="M12 3.5 14 8l4.5.4-3.4 3 1 4.5-4.1-2.3L7.9 16l1-4.5-3.4-3L10 8l2-4.5Z"/></svg>'
    };
    return m[label] || '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 8v8M8 12h8"/></svg>';
  }
  function stat(icon,label,value,sub){return `<article class="hoa-master-stat-card"><div class="hoa-master-stat-icon" aria-hidden="true">${masterStatSvg(label)}</div><div><b>${esc(value)}</b><span>${esc(label)}</span>${sub?`<small>${esc(sub)}</small>`:''}</div></article>`;}
  function engagement(label,value,sub){return `<article class="hoa-master-eng-card"><span class="label">${esc(label)}</span><b>${esc(value)}</b><small>${esc(sub||'')}</small></article>`;}

  function decorateMasterTables(){
    const wrap=document.getElementById('hoaMasterSections');
    if(!wrap) return;
    wrap.querySelectorAll('.hoa-master-table-wrap table').forEach(table=>{
      const headers=[...table.querySelectorAll('thead th')].map(th=>th.textContent.trim());
      table.querySelectorAll('tbody tr').forEach(row=>{
        [...row.children].forEach((cell,i)=>{
          if(headers[i]) cell.setAttribute('data-label',headers[i]);
        });
      });
    });
  }

  function render(data){
    const counts=data.counts||{}, eng=data.engagement||{}, site=data.site||{}, free=data.free_content||{};
    const stats=$('hoaMasterStats'), engagementBox=$('hoaMasterEngagement'), sections=$('hoaMasterSections');
    if(stats) stats.innerHTML=[
      stat('👥','Total Students',n(counts.students),'Active '+n(counts.active_students)+' · Paid '+n(counts.paid_students)+' · Free '+n(counts.free_students)),
      stat('🧑‍🏫','Teachers / Admins',n(counts.admins_teachers),'Admin accounts'),
      stat('🎓','Batches',n(counts.batches),'Published '+n(counts.published_batches)),
      stat('📝','Mock Tests',n(counts.mock_tests),'Published '+n(counts.published_tests)),
      stat('❓','Questions',n(counts.questions),'Question bank'),
      stat('🎥','Classes / Videos',n(counts.videos),'Published '+n(counts.published_videos)),
      stat('📚','Notes',n(counts.notes),'Published '+n(counts.published_notes)),
      stat('🖼️','Posters',n(counts.posters),'Active '+n(counts.active_posters)),
      stat('🎁','Free Content',n(counts.free_content),'Free profiles '+n(free.free_profiles))
    ].join('');
    if(engagementBox) engagementBox.innerHTML=[
      engagement('Test enrolments', (data.mock_tests||[]).reduce((a,x)=>a+n(x.enrolled_students),0), 'Across all mock tests'),
      engagement('Students attempted', n(eng.quiz_submitters), 'Tracked test submissions'),
      engagement('Video viewers', n(eng.video_viewers), n(eng.video_views)+' video views'),
      engagement('Note readers', n(eng.note_openers), n(eng.note_opens)+' note opens'),
      engagement('Quiz starts', n(eng.quiz_students), n(eng.quiz_attempt_starts)+' starts'),
      engagement('Website visitors', n(site.last30_unique_visitors), n(site.last30_page_views)+' page views · 30 days'),
      engagement('Suggestions', (data.feedback||[]).length, 'Latest feedback records')
    ].join('');

    const batchRows=(data.batchwise_students||[]).map(x=>`<tr><td><b>${esc(x.name||'—')}</b></td><td>${esc(x.batch_code||'—')}</td><td>${n(x.student_count)}</td><td>${x.is_published?chip('Published','green'):chip('Draft','gold')}</td></tr>`);
    const testRows=(data.mock_tests||[]).map(x=>`<tr><td><b>${esc(x.title||'—')}</b></td><td>${esc(x.test_type||'—')}</td><td>${n(x.enrolled_students)}</td><td>${n(x.attempted_students)}</td><td>${n(x.completed_attempts)}</td><td>${x.is_published?chip('Published','green'):chip('Draft','gold')}</td></tr>`);
    const teacherRows=(data.teachers||[]).map(x=>`<tr><td><b>${esc(x.email||'Admin')}</b></td><td>${esc(String(x.role||'admin').toUpperCase())}</td><td>${n(x.notes_uploaded)}</td><td>${n(x.videos_uploaded)}</td><td>${n(x.notes_uploaded)+n(x.videos_uploaded)}</td></tr>`);
    const noteRows=(data.notes_activity||[]).map(x=>`<tr><td><b>${esc(x.title||'—')}</b><div class="hoa-master-muted">${esc(x.subject||'General')}</div></td><td>${esc(x.uploader||'—')}</td><td>${n(x.unique_openers)}</td><td>${n(x.total_opens)}</td><td>${x.is_published?chip('Published','green'):chip('Draft','gold')}</td></tr>`);
    const videoRows=(data.video_activity||[]).map(x=>`<tr><td><b>${esc(x.title||'—')}</b><div class="hoa-master-muted">${esc(x.batch_name||'Batch')} · Class ${esc(x.lecture_no??'—')}</div></td><td>${esc(x.uploader||'Legacy / not recorded')}</td><td>${n(x.unique_viewers)}</td><td>${n(x.total_views)}</td><td>${x.is_published?chip('Published','green'):chip('Draft','gold')}</td></tr>`);
    const feedback=(data.feedback||[]).map(x=>`<article class="hoa-master-feedback-item"><div class="hoa-master-feedback-top"><div>${chip(String(x.category||'suggestion').toUpperCase())}${x.rating?` ${chip('★'.repeat(n(x.rating)),'gold')}`:''}</div><span class="hoa-master-muted">${esc(fmtDate(x.created_at))}</span></div><div class="hoa-master-feedback-message">${esc(x.message||'')}</div><div class="hoa-master-feedback-meta">${x.contact_email?'Contact: '+esc(x.contact_email)+' · ':''}Status: ${esc(x.status||'new')}</div></article>`).join('');
    const siteHtml=`<div class="hoa-master-grid-2"><div><div class="hoa-master-muted">All-time page views</div><h3 style="margin:4px 0 8px">${n(site.page_views)}</h3><div class="hoa-master-muted">All-time unique visitors: <b>${n(site.unique_visitors)}</b></div></div><div><div class="hoa-master-muted">Today</div><h3 style="margin:4px 0 8px">${n(site.today_unique_visitors)} unique</h3><div class="hoa-master-muted">${n(site.today_page_views)} page views</div></div><div><div class="hoa-master-muted">Last 7 days</div><h3 style="margin:4px 0 8px">${n(site.last7_unique_visitors)} unique</h3><div class="hoa-master-muted">${n(site.last7_page_views)} page views</div></div><div><div class="hoa-master-muted">Last 30 days</div><h3 style="margin:4px 0 8px">${n(site.last30_unique_visitors)} unique</h3><div class="hoa-master-muted">${n(site.last30_page_views)} page views</div></div></div>`;
    const freeHtml=`<div class="hoa-master-grid-2"><div><b>${n(free.free_profiles)}</b><div class="hoa-master-muted">Free-content profiles</div></div><div><b>${n(free.free_test_attempts)}</b><div class="hoa-master-muted">Completed free-test attempts</div></div><div><b>${n(free.free_test_students)}</b><div class="hoa-master-muted">Students attempting free tests</div></div><div><b>${n(free.free_views)}</b><div class="hoa-master-muted">Tracked free-content views</div></div></div>`;
    if(sections) sections.innerHTML=
      section('Batch-wise Students','Students enrolled in each coaching batch',table(['Batch','Code','Students','Status'],batchRows),false)+
      section('Mock Test Participation','Enrollment, attempted students and completed attempts per test',table(['Mock Test','Type','Enrolled','Attempted Students','Completed Attempts','Status'],testRows),true)+
      section('Teacher / Admin Accountability','Who uploaded notes and classes',table(['Teacher / Admin','Role','Notes','Videos','Total Content'],teacherRows),false)+
      section('Notes — Teacher & Student Usage','Uploader + number of unique student readers and total opens',table(['Note','Uploaded By','Unique Readers','Opens','Status'],noteRows),false)+
      section('Classes & Videos — Teacher & Student Usage','Uploader + unique student viewers and total video views',table(['Class / Batch','Uploaded By','Unique Viewers','Views','Status'],videoRows),false)+
      section('Website Analytics','Visits collected from the website visitor tracker',siteHtml,true)+
      section('Free Content Analytics','Free-content participation and activity',freeHtml,false)+
      section('Suggestions / Feedback','Latest suggestions submitted by website visitors or students',feedback?`<div class="hoa-master-feedback-list">${feedback}</div>`:'<div class="hoa-master-empty">No suggestions received yet.</div>',true);
    decorateMasterTables();
  }

  async function load(){
    if(!isAdmin())return false;
    const c=client(); if(!c?.rpc){status('Supabase is not connected.',true);return false;}
    status('Loading complete coaching operations overview…');
    try{
      const r=await c.rpc('hoa_admin_master_overview');
      if(r.error)throw r.error;
      const data=typeof r.data==='string'?JSON.parse(r.data):r.data;
      render(data||{});
      status(`Master updated · ${fmtDate(new Date())}`);
      const pill=$('hoaMasterLivePill');if(pill)pill.textContent='LIVE DATA';
      return true;
    }catch(e){
      console.error('HOA Master Operations:',e);
      const stats=$('hoaMasterStats'),engagementBox=$('hoaMasterEngagement'),sections=$('hoaMasterSections');
      if(stats)stats.innerHTML='';if(engagementBox)engagementBox.innerHTML='';if(sections)sections.innerHTML='<section class="hoa-master-section"><div class="hoa-master-empty error">Master analytics could not be loaded. The existing Admin workspaces remain available.</div></section>';
      const pill=$('hoaMasterLivePill');if(pill)pill.textContent='DATA ERROR';
      status(String(e?.message||e),true);return false;
    }
  }
  function activateMaster(){
    if(!isAdmin())return false;
    if(window.hoaAdminRole!=="owner"){
      return false;
    }
    document.querySelectorAll('#adminOnlyDashboard .adminSectionPanel').forEach(function(p){const on=p.id==='adminSectionMasterPanel';p.classList.toggle('active',on);p.style.setProperty('display',on?'block':'none','important');if(on){p.style.setProperty('visibility','visible','important');p.style.setProperty('opacity','1','important');p.style.setProperty('pointer-events','auto','important');}});
    document.querySelectorAll('#adminReferenceSidebar .adminSectionNav button,#adminOnlyDashboard .adminSectionNav button').forEach(b=>b.classList.toggle('active',b.id==='adminNavMaster'));
    const t=$('adminReferencePageTitle'),s=$('adminReferencePageSub');if(t)t.textContent='Master Dashboard';if(s)s.textContent='Complete coaching operations, engagement and website overview';
    return load();
  }
  const previous=window.showAdminSection;
  if(typeof previous==='function'&&!previous.__hoaMasterWrapper){
    const wrapped=async function(section){if(String(section).toLowerCase()==='master')return activateMaster();return previous.apply(this,arguments);};
    wrapped.__hoaMasterWrapper=true;wrapped.__hoaMasterPrevious=previous;window.showAdminSection=wrapped;
  }
  function bind(){const b=$('hoaMasterRefresh');if(b&&!b.dataset.hoaMasterBound){b.dataset.hoaMasterBound='1';b.addEventListener('click',load);} }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){bind();setTimeout(function(){if(isAdmin()&&$('adminSectionMasterPanel')?.classList.contains('active'))load();},250);},{once:true});else{bind();setTimeout(function(){if(isAdmin()&&$('adminSectionMasterPanel')?.classList.contains('active'))load();},250);}
  setInterval(function(){if(isAdmin()&&$('adminSectionMasterPanel')?.classList.contains('active'))load();},60000);
})();
