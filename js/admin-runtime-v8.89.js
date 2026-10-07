/* HOA V8.89 — Admin Runtime / Question Pipeline Consolidation
 * Source of truth: V8.57 admin architecture. Later features are lazy-loaded
 * behind one authoritative router. No feature module owns Admin navigation.
 */
(function(){
  'use strict';
  if(window.__HOA_ADMIN_RUNTIME_V89__) return;
  window.__HOA_ADMIN_RUNTIME_V89__=true;

  const panels={
    master:'adminSectionMasterPanel',student:'adminSectionStudentPanel',test:'adminSectionTestPanel',
    course:'adminSectionCoursePanel',video:'adminSectionVideoPanel',notes:'adminSectionNotesPanel',
    poster:'adminSectionPosterPanel',access:'adminSectionAccessPanel',result:'adminSectionResultPanel',
    admin:'adminSectionAdminPanel',freecontent:'adminSectionFreeContentPanel'
  };
  const nav={master:'adminNavMaster',student:'adminNavStudent',test:'adminNavTest',course:'adminNavCourse',video:'adminNavVideo',notes:'adminNavNotes',poster:'adminNavPoster',access:'adminNavAccess',result:'adminNavResult',admin:'adminNavAdmin',freecontent:'adminNavFreeContent'};
  let current='master', navToken=0;
  const loaded=new Map();
  const $=id=>document.getElementById(id);

  function adminReady(){return window.adminLoggedIn===true || (typeof adminLoggedIn!=='undefined'&&adminLoggedIn===true);}
  function owner(){return window.hoaAdminRole==='owner';}
  function has(p){return owner()||Array.isArray(window.hoaAdminPermissions)&&window.hoaAdminPermissions.includes(p);}
  const requiredPermission={student:'students.view',test:'tests.view',course:'courses.view',video:'classes.view',notes:'notes.view',poster:'posters.view',access:'student_access.view',result:'results.view'};
  const anyPermission={freecontent:['tests.view','students.view','results.view']};
  function setPanel(el,on){if(!el)return;el.classList.toggle('active',on);el.classList.toggle('v13-active',on);if(on){el.style.setProperty('display','block','important');el.style.setProperty('visibility','visible','important');el.style.setProperty('opacity','1','important');el.style.setProperty('pointer-events','auto','important');}else{el.style.setProperty('display','none','important');el.classList.remove('v16-result-open','v16-root-result-active');el.style.removeProperty('visibility');el.style.removeProperty('opacity');el.style.removeProperty('pointer-events');}}
  function syncNav(section){Object.entries(nav).forEach(([k,id])=>{const b=$(id);if(!b)return;b.classList.remove('active','v13-active');b.removeAttribute('aria-current');if(k===section && k!=='freecontent'){b.classList.add('active');b.setAttribute('aria-current','page');}});const free=$('adminNavFreeContent');if(free){free.classList.remove('active','v13-active');free.removeAttribute('aria-current');free.style.setProperty('border-left','0','important');free.style.setProperty('border-left-color','transparent','important');free.style.setProperty('box-shadow','none','important');}}
  function showPanels(section){Object.values(panels).forEach(id=>setPanel($(id),false));setPanel($(panels[section]),true);syncNav(section);}
  function title(section){const names={master:['Dashboard','Manage coaching operations and website controls'],student:['Students','Manage student records and candidates'],test:['Mock Tests','Manage batches, folders, tests, question feeding and question bank'],course:['Courses','Manage preparation batches and courses'],video:['Classes & Videos','Manage class/video resources'],notes:['Notes','Manage study notes and PDFs'],poster:['Poster','Manage published poster slides'],access:['Student Access','Manage resource access for students'],result:['Results','Manage candidate results and analytics'],admin:['Admin Access','Manage admin accounts and permissions'],freecontent:['Free Content','Manage Free Student resources']};const a=names[section]||names.master; if($('adminReferencePageTitle'))$('adminReferencePageTitle').textContent=a[0];if($('adminReferencePageSub'))$('adminReferencePageSub').textContent=a[1];}

  function loadCss(href,id){if(document.getElementById(id))return Promise.resolve();return new Promise((resolve,reject)=>{const l=document.createElement('link');l.id=id;l.rel='stylesheet';l.href=href;l.onload=()=>resolve();l.onerror=()=>reject(new Error('Unable to load '+href));document.head.appendChild(l);});}
  function loadJs(src,id){if(document.getElementById(id))return Promise.resolve();return new Promise((resolve,reject)=>{const s=document.createElement('script');s.id=id;s.src=src;s.async=false;s.onload=()=>resolve();s.onerror=()=>reject(new Error('Unable to load '+src));document.body.appendChild(s);});}
  async function ensureTestModules(){
    if(loaded.get('test')) return;
    await loadCss('css/mock-tests-v8.89.css?v=20261005-v889','hoaV89MockCss');
    await loadJs('js/admin-mock-tests-v8.89.js?v=20261005-v889','hoaV89MockJs');
    if(typeof window.hoaV89MountMockWorkspace==='function')window.hoaV89MountMockWorkspace();
    loaded.set('test',true);
  }
  async function ensureQuestionFeedingModule(){
    if(loaded.get('qf')) return;
    await loadJs('js/hoa-question-parser-v8.89.js?v=20261005-v889','hoaV89QfParser');
    if(typeof window.HOAPureQuestionParser?.parse!=='function') throw new Error('Pure question parser failed to initialize.');
    loaded.set('qf',true);
  }

  async function ensureFreeModules(){
    if(loaded.get('free'))return;
    await loadCss('css/free-content-admin-v8.89.css?v=20261005-v889','hoaV89FreeCss');
    await loadJs('js/free-content-admin-v8.89.js?v=20261005-v889','hoaV89FreeJs');
    await loadJs('js/free-content-mock-bridge-v8.89.js?v=20261005-v889','hoaV89FreeMockBridge');
    loaded.set('free',true);
  }

  async function loadSectionData(section,token){
    if(token!==navToken)return;
    if(section==='master')return;
    if(section==='student'){if(window.loadStudentsFromSupabase)await window.loadStudentsFromSupabase();if(window.renderAdminStudents)window.renderAdminStudents();return;}
    if(section==='test'){cleanupLegacy();await ensureTestModules();if(window.hoaV89RefreshMockTests)await window.hoaV89RefreshMockTests();return;}
    if(section==='course'){if(window.hoaLoadCourses)await window.hoaLoadCourses();return;}
    if(section==='video'){if(window.hoaLoadVideos)await window.hoaLoadVideos();return;}
    if(section==='notes'){if(window.hoaLoadNotes)await window.hoaLoadNotes();return;}
    if(section==='poster'){if(window.hoaV59RefreshAdmin)await window.hoaV59RefreshAdmin();return;}
    if(section==='access'){if(window.hoaLoadAccess)await window.hoaLoadAccess();return;}
    if(section==='result'){if(window.loadAdminResultsFromSupabase)await window.loadAdminResultsFromSupabase();if(window.renderAdminResultSummary)window.renderAdminResultSummary();if(window.populateTestWiseSelector)window.populateTestWiseSelector();if(window.renderTestWiseResults)window.renderTestWiseResults();if(window.addAdminProgress)window.addAdminProgress();if(window.renderAdminProgress)window.renderAdminProgress();return;}
    if(section==='admin'){if(window.hoaV643RenderOwnerAdminManager)await window.hoaV643RenderOwnerAdminManager();return;}
    if(section==='freecontent'){await ensureFreeModules();if(window.hoaV89OpenFreeContent)await window.hoaV89OpenFreeContent();if(window.hoaV89InstallFreeMockBridge)window.hoaV89InstallFreeMockBridge();return;}
  }

  const inflight=new Map();
  async function router(section){
    if(!adminReady())return;
    section=panels[section]?section:'master';
    if(section==='admin'&&!owner()){alert('Admin Access is available only to the Super Admin / Owner.');section='student';}
    if(section==='freecontent'&&!(owner()||anyPermission.freecontent.some(has))){alert('You do not have permission to access Free Content.');section='master';}
    if(section!=='master'&&section!=='admin'&&section!=='freecontent'&&requiredPermission[section]&&!has(requiredPermission[section])){alert('You do not have permission to access this section.');section='student';}
    if(section==='student'&&!has('students.view')){section='master';}
    if(inflight.has(section)) return inflight.get(section);
    const token=++navToken;current=section;
    showPanels(section);title(section);
    const work=(async()=>{
      try{
        await loadSectionData(section,token);
      }catch(e){
        if(token!==navToken)return;
        console.error('[HOA V8.89 Admin]',section,e);
        const msg=$('hoaV70AdminMsg');
        if(msg)msg.textContent=(section==='freecontent'?'Free Content':titleName(section))+' could not be loaded: '+(e.message||e);
      }
      if(token===navToken){showPanels(section);title(section);try{window.dispatchEvent(new CustomEvent('hoa:admin-section-ready',{detail:{section}}));}catch(_){} }
    })();
    inflight.set(section,work);
    try{return await work;}finally{if(inflight.get(section)===work)inflight.delete(section);}
  }
  function titleName(s){return s==='freecontent'?'Free Content':s.charAt(0).toUpperCase()+s.slice(1);}

  router.__hoaAdminRouterV89=true;
  try{
    const previous=window.showAdminSection;
    Object.defineProperty(window,'showAdminSection',{configurable:true,enumerable:true,get:()=>router,set:fn=>{
      if(fn!==router){ window.__HOA_ADMIN_REJECTED_NAV_WRAPPERS__=(Number(window.__HOA_ADMIN_REJECTED_NAV_WRAPPERS__)||0)+1; }
    }});
    window.__HOA_ADMIN_PREVIOUS_NAV__=previous;
  }catch(_){ window.showAdminSection=router; }
  window.hoaV81AdminRouter=router;
  const runtimeApi={router,ensureTestModules,ensureQuestionFeedingModule,ensureFreeModules,get current(){return current;}};
  window.__HOA_ADMIN_RUNTIME_V89_API__=runtimeApi;

  // One refresh control for the currently active Admin section.
  document.addEventListener('click',e=>{const b=e.target?.closest?.('.adminReferenceRefreshBtn');if(!b)return;e.preventDefault();router(current);},true);
  document.addEventListener('click',e=>{
    const b=e.target?.closest?.('.adminSectionNav button');
    if(!b || !b.closest('#adminOnlyDashboard')) return;
    const section=b.dataset?.section || ({adminNavMaster:'master',adminNavStudent:'student',adminNavTest:'test',adminNavCourse:'course',adminNavVideo:'video',adminNavNotes:'notes',adminNavPoster:'poster',adminNavAccess:'access',adminNavResult:'result',adminNavAdmin:'admin',adminNavFreeContent:'freecontent'})[b.id];
    if(!section) return;
    e.preventDefault(); e.stopImmediatePropagation();
    router(section);
  },true);

  // Cross-section invalidation from the consolidated Mock Test workspace.
  window.addEventListener('hoa:mock-data-changed',()=>{if(current==='test'&&typeof window.hoaV89RefreshMockTests==='function')window.hoaV89RefreshMockTests({bank:false});});

  // Remove legacy Mock Test workspace when the consolidated module mounts.
  const cleanupLegacy=()=>{document.querySelectorAll('#adminOnlyDashboard #hoa606MockWorkspace,#adminOnlyDashboard #hoaV610MockWorkspace').forEach(x=>x.remove());};
  cleanupLegacy();
  // If legacy boot code changes navigation state asynchronously, correct it on a frame, not through another wrapper.
  function enforceFreeNav(){syncNav(current);}
  document.addEventListener('visibilitychange',enforceFreeNav);
  setTimeout(enforceFreeNav,0);

  window.HOA_ADMIN_V89={
    version:'V8.90',
    router,
    getCurrent:()=>current,
    getLoadedModules:()=>[...loaded.keys()],
    hasPermission:has
  };

  window.hoaAdminV89RegressionCheck=function(){
    const panelNodes=Object.entries(panels).map(([k,id])=>({section:k,id,el:$(id),display:$(id)?getComputedStyle($(id)).display:'missing'}));
    const visible=panelNodes.filter(x=>x.el&&x.el.classList.contains('active')&&x.display!=='none').map(x=>x.section);
    const free=$('adminNavFreeContent');
    const freeMarker=free?(()=>{const cs=getComputedStyle(free);return {active:free.classList.contains('active'),borderLeftWidth:cs.borderLeftWidth,borderLeftColor:cs.borderLeftColor};})():null;
    return {version:'V8.90',routerOwned:window.showAdminSection===router,current,visiblePanels:visible,activePanelInvariant:visible.length<=1,freeContentMarker:freeMarker,loadedModules:[...loaded.keys()],rejectedNavAssignments:Number(window.__HOA_ADMIN_REJECTED_NAV_WRAPPERS__)||0};
  };

  window.hoaAdminRegressionCheck=function(){
    const activePanels=[...document.querySelectorAll('#adminOnlyDashboard .adminSectionPanel')].filter(p=>{const s=getComputedStyle(p);return p.classList.contains('active')&&s.display!=='none'&&s.visibility!=='hidden';}).map(p=>p.id);
    const activeNav=[...document.querySelectorAll('.adminSectionNav button.active')].map(b=>b.id);
    const free=$('adminNavFreeContent');
    const okRouter=window.showAdminSection===router;
    const visiblePanels=[...document.querySelectorAll('#adminOnlyDashboard .adminSectionPanel')].filter(p=>getComputedStyle(p).display!=='none').map(p=>p.id);
    return {version:'V8.90',routerOwned:okRouter,current,activePanels,visiblePanels,activeNav,activePanelInvariant:activePanels.length===1||activePanels.length===0,freeContentMarkerCleared:!!free&&(getComputedStyle(free).borderLeftWidth==='0px'||getComputedStyle(free).borderLeftStyle==='none'),loadedModules:[...loaded.keys()],rejectedNavAssignments:Number(window.__HOA_ADMIN_REJECTED_NAV_WRAPPERS__)||0};
  };
})();
