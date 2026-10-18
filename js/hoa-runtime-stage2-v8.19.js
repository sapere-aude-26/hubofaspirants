/* HUB OF ASPIRANTS V8.19 CLEAN — consolidated inline runtime. Original execution order preserved: scripts 30–44. */

/* ===== Original inline script 30 ===== */
(function(){
  function mount(){
    if(window.hoaAdminRole==="owner" && typeof window.hoaV643RenderOwnerAdminManager==="function"){
      window.hoaV643RenderOwnerAdminManager();
    }
  }
  function wrap(){
    if(typeof window.showAdminSection!=="function" || window.showAdminSection.__hoaV622Mounted) return;
    const original=window.showAdminSection;
    const wrapped=async function(section){
      const r=await original.apply(this,arguments);
      if(section==="admin") mount();
      return r;
    };
    wrapped.__hoaV622Mounted=true;
    wrapped.__hoaV622Original=original;
    window.showAdminSection=wrapped;
  }
  function boot(){wrap();mount();}
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot);
  else boot();
  setTimeout(boot,300);
  setTimeout(boot,1000);
})();

/* ===== Original inline script 31 ===== */
(function(){
  "use strict";
  /* V6.0.3: single authoritative Admin navigation controller.
     Uses only public module APIs. Do not call private functions from other IIFEs. */
  const panels={
    master:"adminSectionMasterPanel", student:"adminSectionStudentPanel", test:"adminSectionTestPanel",
    course:"adminSectionCoursePanel", video:"adminSectionVideoPanel", notes:"adminSectionNotesPanel",
    poster:"adminSectionPosterPanel", result:"adminSectionResultPanel",
    admin:"adminSectionAdminPanel"
  };
  const nav={
    master:"adminNavMaster", student:"adminNavStudent", test:"adminNavTest",
    course:"adminNavCourse", video:"adminNavVideo", notes:"adminNavNotes",
    poster:"adminNavPoster", result:"adminNavResult", admin:"adminNavAdmin"
  };
  function show(el,on){
    if(!el)return;
    el.classList.toggle("active",on);
    if(on){
      el.classList.add("v13-active");
      el.style.setProperty("display","block","important");
      el.style.setProperty("visibility","visible","important");
      el.style.setProperty("opacity","1","important");
      el.style.setProperty("pointer-events","auto","important");
    }else{
      el.classList.remove("v13-active");
      el.style.setProperty("display","none","important");
      el.style.removeProperty("visibility");
      el.style.removeProperty("opacity");
      el.style.removeProperty("pointer-events");
    }
  }
  async function controller(section){
    if(section==="access"){window.__hoaStudentWorkspaceTab="access";section="student";}
    if(!panels[section]) section="student";
    if((typeof adminLoggedIn!=="undefined" && adminLoggedIn!==true) && window.adminLoggedIn!==true){
      return;
    }
    if(section==="admin" && window.hoaAdminRole!=="owner"){
      alert("Admin Access is available only to the Super Admin / Owner.");
      section="student";
    }
    if(section==="poster" && window.hoaAdminRole!=="owner" &&
       !(window.hoaAdminPermissions||[]).some(function(p){return p==="posters.view"||p==="posters.manage";})){
      alert("You do not have permission to access Poster Management.");
      section="student";
    }

    /* Result/section isolation: every Admin workspace must start from one clean state.
       This also hides dynamically-created panels such as Free Content before showing
       the requested workspace. */
    document.querySelectorAll("#adminOnlyDashboard .adminSectionPanel").forEach(function(panel){
      show(panel, false);
      panel.classList.remove("v16-result-open","v16-root-result-active");
    });
    Object.entries(panels).forEach(([k,id])=>show(document.getElementById(id),k===section));
    Object.entries(nav).forEach(([k,id])=>document.getElementById(id)?.classList.toggle("active",k===section));

    if(section==="result"){
      const resultPanel=document.getElementById("adminSectionResultPanel");
      if(resultPanel){
        resultPanel.classList.add("v13-active","v16-result-open");
        resultPanel.style.setProperty("width","100%","important");
        resultPanel.style.setProperty("max-width","100%","important");
        resultPanel.style.setProperty("min-width","0","important");
      }
    }
    try{
      if(section==="student"){
        const canStudents=window.hoaAdminRole==="owner"||(window.hoaAdminPermissions||[]).some(p=>p==="students.view"||p==="students.manage");
        if(canStudents){if(typeof window.loadStudentsFromSupabase==="function") await window.loadStudentsFromSupabase();if(typeof window.renderAdminStudents==="function") window.renderAdminStudents();}
        if(typeof window.hoaSetStudentWorkspaceTab==="function") await window.hoaSetStudentWorkspaceTab(window.__hoaStudentWorkspaceTab||(canStudents?"paid":"access"),{load:window.__hoaStudentWorkspaceTab==="access"});
        return;
      }
      if(section==="test"){
        if(typeof window.loadTestsFromSupabase==="function") await window.loadTestsFromSupabase();
        if(typeof window.renderLibrary==="function") window.renderLibrary();
        return;
      }
      if(section==="course"){
        if(typeof window.hoaLoadCourses==="function") await window.hoaLoadCourses();
        return;
      }
      if(section==="video"){
        if(typeof window.hoaLoadVideos==="function") await window.hoaLoadVideos();
        return;
      }
      if(section==="notes"){
        if(typeof window.hoaLoadNotes==="function") await window.hoaLoadNotes();
        return;
      }
      if(section==="poster"){
        if(typeof window.hoaV59RefreshAdmin==="function") await window.hoaV59RefreshAdmin();
        return;
      }
      if(section==="result"){
        if(typeof window.loadAdminResultsFromSupabase==="function") await window.loadAdminResultsFromSupabase();
        if(typeof window.renderAdminResultSummary==="function") window.renderAdminResultSummary();
        if(typeof window.populateTestWiseSelector==="function") window.populateTestWiseSelector();
        if(typeof window.renderTestWiseResults==="function") window.renderTestWiseResults();
        return;
      }
      if(section==="admin"){
        if(window.hoaV643RenderOwnerAdminManager) await window.hoaV643RenderOwnerAdminManager();
        return;
      }
    }catch(e){
      console.error("HOA Admin section load failed:",section,e);
      const msg=e?.message||String(e);
      alert((section.charAt(0).toUpperCase()+section.slice(1))+" section could not be loaded: "+msg);
    }
  }
  window.showAdminSection=controller;
  window.__HOA_V603_ADMIN_CONTROLLER__=controller;
})();

/* ===== Original inline script 32 ===== */
(function(){
  "use strict";
  function enforce(){
    var owner=window.hoaAdminRole==="owner";
    var b=document.getElementById("adminNavMaster");
    var p=document.getElementById("adminSectionMasterPanel");
    if(b)b.style.display=owner?"":"none";
    if(!owner && p){
      p.style.display="none";
      p.classList.remove("active","v13-active");
    }
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",enforce);
  else enforce();
  setTimeout(enforce,300);
  setTimeout(enforce,1000);
  setTimeout(enforce,2000);
})();

/* ===== Original inline script 33 ===== */
(function(){
  "use strict";
  function enforce(){
    var owner=window.hoaAdminRole==="owner";
    var b=document.getElementById("adminNavAdmin");
    var p=document.getElementById("adminSectionAdminPanel");
    if(b)b.style.display=owner?"":"none";
    if(!owner && p){p.style.display="none";p.classList.remove("active","v13-active");}
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",enforce);
  else enforce();
  setTimeout(enforce,300);
  setTimeout(enforce,1000);
  setTimeout(enforce,2000);
  setInterval(enforce,3000);
})();

/* Duplicate admin-navigation enforcement removed in V8.20 CLEAN; script 33 remains authoritative. */
/* ===== Original inline script 35 ===== */
(function(){
  "use strict";
  window.hoaNormalizeAdminRole = function(raw){
    var v=raw;
    if(Array.isArray(v)) v=v.length?v[0]:null;
    if(v && typeof v==="object"){
      v=v.role ?? v.admin_role ?? v.adminRole ?? v.user_role ?? v.get_admin_role ?? v.value;
      if(Array.isArray(v)) v=v[0];
    }
    v=String(v??"").trim().toLowerCase().replace(/[\s-]+/g,"_");
    if(v==="owner" || v==="super_admin" || v==="superadmin" ||
       v==="superadministrator" || v==="super_admin_owner") return "owner";
    if(v==="admin" || v==="administrator") return "admin";
    return "none";
  };
})();

/* ===== Original inline script 36 ===== */
(function(){
  "use strict";
  async function syncOwnerRole(){
    try{
      if(typeof window.applyAdminRole==="function") await window.applyAdminRole();
      else if(typeof window.hoaV645LoadPermissions==="function") await window.hoaV645LoadPermissions();
      var role=window.hoaAdminRole;
      document.body.classList.toggle("hoa-owner-mode",role==="owner");
      var nav=document.getElementById("adminNavAdmin");
      var panel=document.getElementById("adminSectionAdminPanel");
      if(nav) nav.style.display=role==="owner"?"":"none";
      if(panel) panel.style.display=role==="owner"?"":"none";
      if(role==="owner" && typeof window.hoaV643RenderOwnerAdminManager==="function"){
        window.hoaV643RenderOwnerAdminManager();
      }
    }catch(e){ console.warn("HOA owner role synchronization failed:",e); }
  }
  window.hoaSyncOwnerRole=syncOwnerRole;
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",function(){setTimeout(syncOwnerRole,250);});
  else setTimeout(syncOwnerRole,250);
  setTimeout(syncOwnerRole,1200);
  setTimeout(syncOwnerRole,2500);
})();

/* ===== Original inline script 37 ===== */
(function(){
  'use strict';

  var originalParent=null;
  var originalNextSibling=null;

  function getModal(){
    return document.getElementById('hoaV648FreeContentModal');
  }

  function moveModalToBody(){
    var m=getModal();
    if(!m || m.parentElement===document.body) return;
    originalParent=m.parentElement;
    originalNextSibling=m.nextSibling;
    document.body.appendChild(m);
  }

  function restoreModal(){
    var m=getModal();
    if(!m || !originalParent) return;
    if(originalNextSibling && originalNextSibling.parentNode===originalParent){
      originalParent.insertBefore(m,originalNextSibling);
    }else{
      originalParent.appendChild(m);
    }
  }

  window.hoaOpenFreeContent=function(){
    var m=getModal();
    if(!m) return;
    moveModalToBody();
    m.classList.remove('hidden');
    document.documentElement.classList.add('hoa-free-modal-open');
    document.body.classList.add('hoa-free-modal-open');
    document.body.dataset.hoaFreeScroll=String(window.scrollY||window.pageYOffset||0);

    requestAnimationFrame(function(){
      var close=m.querySelector('.hoa-v648-modal-close');
      if(close) close.focus({preventScroll:true});
    });
  };

  window.hoaCloseFreeContent=function(){
    var m=getModal();
    if(!m) return;
    /* P36: openCanonical applies important inline styles to defeat stale CSS.
       Clear those overrides when closing; otherwise .hidden cannot dismiss the
       modal and the Free Student layer can remain over the Paid Student screen. */
    m.classList.add('hidden');
    m.classList.remove('hoa-v619-visible');
    ['display','visibility','opacity','pointer-events','z-index'].forEach(function(k){m.style.removeProperty(k);});
    document.documentElement.classList.remove('hoa-free-modal-open');
    document.body.classList.remove('hoa-free-modal-open');

    var y=parseInt(document.body.dataset.hoaFreeScroll||'0',10);
    delete document.body.dataset.hoaFreeScroll;

    /* Restore original DOM position after hiding, without moving the page. */
    restoreModal();
    requestAnimationFrame(function(){
      window.scrollTo(0,y);
    });
  };

  document.addEventListener('keydown',function(e){
    if(e.key==='Escape'){
      var m=getModal();
      if(m && !m.classList.contains('hidden')){
        window.hoaCloseFreeContent();
      }
    }
  });
})();

/* ===== Original inline script 38 ===== */
(function(){
  'use strict';

  function initHOAHeroCursor(){
    var visual=document.querySelector('#hoaFrontPage .hoa-front-visual');
    if(!visual || visual.dataset.hoaCursorReady==='1') return;

    var cards=Array.prototype.slice.call(
      visual.querySelectorAll('.hoa-front-card-stack .hoa-front-feature')
    );
    if(!cards.length) return;

    visual.dataset.hoaCursorReady='1';

    var raf=0;
    var active=false;
    var px=0, py=0;

    function reset(){
      active=false;
      visual.style.setProperty('--hoa-cursor-x','0px');
      visual.style.setProperty('--hoa-cursor-y','0px');
      visual.style.setProperty('--hoa-cursor-glow','0');

      cards.forEach(function(card){
        card.style.setProperty('--hoa-card-gold','0');
        card.style.setProperty('--hoa-light-x','50%');
        card.style.setProperty('--hoa-light-y','50%');
        card.style.setProperty('--hoa-card-dx','0px');
        card.style.setProperty('--hoa-card-dy','0px');
        card.style.setProperty('--hoa-card-tilt','0deg');
        card.style.translate='0 0';
      });
    }

    function render(){
      raf=0;
      if(!active) return;

      var vr=visual.getBoundingClientRect();
      var cx=vr.left+vr.width/2;
      var cy=vr.top+vr.height/2;

      var relX=(px-cx)/(vr.width/2 || 1);
      var relY=(py-cy)/(vr.height/2 || 1);

      relX=Math.max(-1,Math.min(1,relX));
      relY=Math.max(-1,Math.min(1,relY));

      visual.style.setProperty('--hoa-cursor-x',(relX*42).toFixed(1)+'px');
      visual.style.setProperty('--hoa-cursor-y',(relY*30).toFixed(1)+'px');
      visual.style.setProperty('--hoa-cursor-glow','.78');

      cards.forEach(function(card,index){
        var r=card.getBoundingClientRect();
        var insideX=Math.max(0,Math.min(r.width,px-r.left));
        var insideY=Math.max(0,Math.min(r.height,py-r.top));
        var nx=(insideX/(r.width||1)-.5)*2;
        var ny=(insideY/(r.height||1)-.5)*2;

        var nearX=Math.max(r.left,Math.min(px,r.right));
        var nearY=Math.max(r.top,Math.min(py,r.bottom));
        var dx=px-nearX;
        var dy=py-nearY;
        var distance=Math.sqrt(dx*dx+dy*dy);

        /* Glow reaches a little outside the card. */
        var proximity=Math.max(0,1-distance/190);
        var gold=Math.pow(proximity,.72);

        var depth=1+(index*.12);
        var moveX=relX*5.5*depth;
        var moveY=relY*4.5*depth;
        var tilt=nx*1.15+relX*.35;

        card.style.setProperty('--hoa-card-gold',gold.toFixed(3));
        card.style.setProperty('--hoa-light-x',(50+nx*28).toFixed(1)+'%');
        card.style.setProperty('--hoa-light-y',(50+ny*28).toFixed(1)+'%');
        card.style.setProperty('--hoa-card-dx',moveX.toFixed(1)+'px');
        card.style.setProperty('--hoa-card-dy',moveY.toFixed(1)+'px');
        card.style.setProperty('--hoa-card-tilt',tilt.toFixed(2)+'deg');

        /* CSS translate composes with the existing scroll transform. */
        card.style.translate=
          'calc(var(--hoa-card-dx) * var(--hoa-depth)) '+
          'calc(var(--hoa-card-dy) * var(--hoa-depth))';
      });
    }

    function pointerMove(e){
      px=e.clientX;
      py=e.clientY;
      active=true;
      if(!raf) raf=requestAnimationFrame(render);
    }

    function pointerLeave(){
      active=false;
      if(raf){cancelAnimationFrame(raf);raf=0;}
      reset();
    }

    visual.addEventListener('pointermove',pointerMove,{passive:true});
    visual.addEventListener('pointerleave',pointerLeave,{passive:true});
    visual.addEventListener('pointercancel',pointerLeave,{passive:true});

    /* Recalculate cleanly if the page layout changes. */
    window.addEventListener('resize',reset,{passive:true});
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',initHOAHeroCursor,{once:true});
  }else{
    initHOAHeroCursor();
  }

  /* Front page sections can be rendered/re-rendered after login state changes. */
  var observer=new MutationObserver(function(){
    initHOAHeroCursor();
  });
  observer.observe(document.body,{childList:true,subtree:true});
})();

/* ===== Original inline script 39 ===== */
(function(){
'use strict';
const esc=window.escapeHTML||function(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));};
const css=`
.hoa-v70-admin-panel{margin-top:14px}.hoa-v70-table{width:100%;border-collapse:collapse}.hoa-v70-table th,.hoa-v70-table td{padding:9px;border-bottom:1px solid #D8E7F5;text-align:left;font-size:12px}.hoa-v70-table th{background:#F8FBFF}.hoa-v70-exam-question{padding:16px;border:1px solid #D8E7F5;border-radius:12px;margin-top:12px}.hoa-v70-exam-options{display:grid;gap:8px;margin-top:12px}.hoa-v70-exam-options button{text-align:left;padding:11px;border:1px solid #C8D8E8;background:#fff;border-radius:9px;cursor:pointer}.hoa-v70-exam-options button.selected{border-color:#1D6FB8;background:#eff6ff}.hoa-v70-result-box{padding:18px;border-radius:14px;background:#F8FBFF;border:1px solid #dbeafe;margin-top:15px}.hoa-v70-stat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:9px;margin:12px 0}.hoa-v70-stat{padding:12px;border:1px solid #D8E7F5;border-radius:10px;background:#fff}.hoa-v70-stat b{display:block;font-size:20px;color:#0B2E52}.hoa-v70-mini{font-size:11px;color:#5E7188}.hoa-v70-progress{height:8px;border-radius:99px;background:#D8E7F5;overflow:hidden}.hoa-v70-progress span{display:block;height:100%;background:#1D6FB8}.hoa-v70-pdf{font-family:Arial,sans-serif;padding:28px;color:#082544}.hoa-v70-pdf h1{color:#0B2E52}.hoa-v70-pdf table{width:100%;border-collapse:collapse;margin-top:18px}.hoa-v70-pdf th,.hoa-v70-pdf td{border:1px solid #C8D8E8;padding:7px;font-size:12px}.hoa-v70-pdf th{background:#EEF5FC}@media(max-width:700px){.hoa-v70-form{grid-template-columns:1fr}.hoa-v70-card{padding:15px}}
`;
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);

async function rpc(name,args){if(typeof supabaseClient==='undefined'||!supabaseClient)throw new Error('Supabase is not ready.');const {data,error}=await supabaseClient.rpc(name,args);if(error)throw error;return data;}
function getToken(){
  try{const v=typeof window.hoaGetFreeAccessToken==='function'?String(window.hoaGetFreeAccessToken()||'').trim():'';if(v)return v;}catch(_){}
  try{const v=String(window.__HOA_FREE_ACCESS_TOKEN||'').trim();if(v)return v;}catch(_){}
  try{const v=String(localStorage.getItem('hoa_free_access_token')||'').trim();if(v)return v;}catch(_){}
  try{const v=String(sessionStorage.getItem('hoa_free_access_token_session_backup')||'').trim();if(v)return v;}catch(_){}
  return '';
}
function setToken(t){if(typeof window.hoaSetFreeAccessToken==='function')window.hoaSetFreeAccessToken(t);else localStorage.setItem('hoa_free_access_token',t)}

/* Legacy V7.0 student Free Content modal removed.
   The V6.1.6 / V6.4.8 Free Content experience is now the single
   authoritative student-facing implementation. The RPC helpers above
   remain available to the Admin Free Content workspace. */

let hoaV70EditId=null;
function ensureAdminPanel(){
 const nav=document.querySelector('.adminSectionNav');const dash=document.getElementById('adminOnlyDashboard');if(!nav||!dash)return null;
 if(!document.getElementById('adminNavFreeContent')){const b=document.createElement('button');b.id='adminNavFreeContent';b.setAttribute('data-section','freecontent');b.innerHTML='<span class="adminRefIcon" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M12 5v15M4 10h16M8 3.5h8M8 3.5c0 1.7 1.3 3 3 3M16 3.5c0 1.7-1.3 3-3 3"/></svg></span><span class="adminRefLabel">Free Content</span>';b.onclick=()=>window.showAdminSection('freecontent');nav.appendChild(b)}
 let p=document.getElementById('adminSectionFreeContentPanel');if(p)return p;
 p=document.createElement('div');p.id='adminSectionFreeContentPanel';p.className='adminSectionPanel';
 p.innerHTML=`<div class="dashPanel hoa-admin-content-panel hoa-v70-admin-panel">
 <div class="hoa-admin-section-head"><div><h3>🎁 Free Content Management</h3><p>Create and manage Free Tests, Mock Tests, Video Classes, Notes, PDFs, Current Affairs and other free resources.</p></div><span class="hoa-admin-count" id="hoaV70FreeCount">0</span></div>
 <div class="hoa-v70-content-editor">
  <div class="hoa-v70-editor-head"><div><strong id="hoaV70EditorTitle">Add Free Content</strong><span id="hoaV70EditorMode">Create a new resource for Free Students.</span></div><button type="button" class="secondary" onclick="hoaV70ResetContentForm()">CLEAR FORM</button></div>
  <div class="hoa-v70-form">
   <label>Title *<input id="hoaV70AdminTitle" maxlength="180" placeholder="e.g. Current Affairs — September 2026"></label>
   <label>Content Type *<select id="hoaV70AdminType"><option value="test">Free Test / Mock Test</option><option value="video">Video Class</option><option value="note">Study Note</option><option value="pdf">PDF / Document</option><option value="other">Current Affairs / Other</option></select></label>
   <label>Category / Exam<input id="hoaV70AdminCategory" maxlength="100" placeholder="e.g. TPSC, TES, SSC, Current Affairs"></label>
   <label id="hoaV70TestField">Test / Mock Test *<select id="hoaV70AdminTest"><option value="">Select an existing test</option></select><small>Choose the existing test that Free Students will actually attempt.</small></label>
   <label class="hoa-v70-wide">Description / Details<textarea id="hoaV70AdminDescription" rows="4" maxlength="2000" placeholder="Short student-facing description, topics covered, instructions, etc."></textarea></label>
   <label id="hoaV70UrlField">External URL<input id="hoaV70AdminUrl" type="url" placeholder="https://youtube.com/... or https://example.com/..."><small>Use for YouTube, webpage, Google Drive, etc.</small></label>
   <label id="hoaV70FileField">File URL<input id="hoaV70AdminFile" type="url" placeholder="https://.../file.pdf"><small>Use for PDF/document/file resources.</small></label>
   <label>Thumbnail URL<input id="hoaV70AdminThumb" type="url" placeholder="https://.../thumbnail.jpg"><small>Optional cover image.</small></label>
   <label>Display Order<input id="hoaV70AdminSort" type="number" min="0" max="9999" value="0"><small>Lower number appears first.</small></label>
   <label class="hoa-v70-publish"><span><input id="hoaV70AdminPublished" type="checkbox"> Published</span><small>Only published items are visible to Free Students.</small></label>
  </div>
  <div class="hoa-v70-actions"><button class="primary" id="hoaV70SaveBtn" onclick="hoaV70SaveContent()">SAVE CONTENT</button><button class="secondary" onclick="hoaV70PreviewDraft()">PREVIEW</button><button class="secondary" onclick="hoaV70LoadAdmin()">REFRESH</button></div>
  <div id="hoaV70AdminMsg" class="hoa-v70-mini"></div>
 </div>
 <div class="hoa-v70-subhead"><div><h3>Published / Saved Content</h3><p>Preview, edit, or delete resources without leaving this section.</p></div></div>
 <div id="hoaV70AdminList" class="hoa-admin-list"></div>
 <hr style="margin:20px 0;border:0;border-top:1px solid #D8E7F5">
 <div class="hoa-v70-subhead"><div><h3>Free Students</h3><p>Free Student records are completely separate from Paid Students and Admin data.</p></div></div>
 <div id="hoaV70Profiles"></div>
 </div>`;
 dash.appendChild(p);
 const type=document.getElementById('hoaV70AdminType');
 if(type)type.addEventListener('change',hoaV70UpdateContentFields);
 hoaV70UpdateContentFields();
 return p
}
async function hoaV70DeleteFreeStudent(id){
  if(!id)return;
  const ok=window.confirm('Delete this Free Student registration?\n\nThis removes only the Free Student record. It does NOT delete any Paid Student or Admin data.');
  if(!ok)return;
  const msg=document.getElementById('hoaV70AdminMsg');
  try{
    if(typeof window.hoaRequireAdminPermission!=="function")throw new Error('Admin permission service is not available.');
    await window.hoaRequireAdminPermission('students.manage');
    await rpc('hoa_admin_free_student_delete',{p_id:id});
    if(msg)msg.textContent='Free Student deleted successfully.';
    await loadAdmin();
  }catch(e){
    if(msg)msg.textContent='Unable to delete Free Student: '+String(e?.message||e);
  }
}
function hoaV70BindStaticControls(){
 const type=document.getElementById('hoaV70AdminType');
 if(type&&!type.dataset.hoaV70Bound){type.addEventListener('change',hoaV70UpdateContentFields);type.dataset.hoaV70Bound='1';}
 const other=document.getElementById('hoaV70OtherResourceType');
 if(other&&!other.dataset.hoaV70Bound){other.addEventListener('change',hoaV70UpdateContentFields);other.dataset.hoaV70Bound='1';}
 const testSelect=document.getElementById('hoaV70AdminTest');
 if(testSelect&&!testSelect.dataset.hoaV70Bound){testSelect.addEventListener('change',async()=>{const opt=testSelect.selectedOptions?.[0];const result=document.getElementById('hoaFreeResultDetails');const state=document.getElementById('hoaFreeResultDetailsState');const label=document.querySelector('#hoaFreeResultVisibilityField .hoa-free-result-visibility-copy small');if(!opt?.value||!result)return;result.disabled=false;if(label)label.textContent='This setting applies only to free students. It does not change the original Mock Test result/review settings for paid candidates.';let released=opt.dataset.showResultDetails!=='false';try{const c=window.supabaseClient||window.supabase;if(c){const list=await c.rpc('hoa_admin_free_content_list');if(testSelect.value!==opt.value)return;const existing=(list.data||[]).find(x=>x.content_type==='test'&&String(x.test_id)===String(opt.value));if(existing&&existing.show_result_details!==undefined){released=existing.show_result_details!==false&&existing.allow_review!==false;}else{const r=await c.from('tests').select('show_result_details,allow_review').eq('id',opt.value).maybeSingle();if(testSelect.value!==opt.value)return;if(!r.error&&r.data)released=r.data.show_result_details!==false&&r.data.allow_review!==false;}opt.dataset.showResultDetails=released?'true':'false';}}catch(_){}if(testSelect.value!==opt.value)return;result.checked=released;if(state)state.textContent=released?'ON':'OFF';});testSelect.dataset.hoaV70Bound='1';}
 const result=document.getElementById('hoaFreeResultDetails');
 if(result&&!result.dataset.hoaV70Bound){result.addEventListener('change',()=>{const state=document.getElementById('hoaFreeResultDetailsState');if(state)state.textContent=result.checked?'ON':'OFF'});result.dataset.hoaV70Bound='1';}
 const upload=document.getElementById('hoaV70AdminFileUpload');
 if(upload&&!upload.dataset.hoaV70Bound){upload.addEventListener('change',()=>{const msg=document.getElementById('hoaV70AdminMsg');if(msg)msg.textContent=upload.files?.[0]?`Selected: ${upload.files[0].name} (upload will happen on SAVE CONTENT)`:' ';});upload.dataset.hoaV70Bound='1';}
 hoaV70UpdateContentFields();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',hoaV70BindStaticControls,{once:true});else hoaV70BindStaticControls();
async function loadAdmin(){
 const staticPanel=document.querySelector('#adminSectionFreeContentPanel[data-hoa-free-static="1"]');
 if(staticPanel&&typeof window.hoaV70LoadAdmin==='function'&&window.hoaV70LoadAdmin!==loadAdmin && !window.__HOA_FREE_CONTENT_V89__) return window.hoaV70LoadAdmin();
 const p=ensureAdminPanel();
 if(!p||(typeof adminLoggedIn==='undefined'||adminLoggedIn!==true))return;
 const getArea=()=>{const active=document.querySelector('#adminSectionFreeContentPanel .hoa-v611-free-area[data-free-area].active, #adminSectionFreeContentPanel .hoa-v75-free-area.active');return active?.dataset?.freeArea||active?.dataset?.hoaV75Area||'content';};
 const msg=document.getElementById('hoaV70AdminMsg');
 const setArea=(id,html)=>{const el=document.getElementById(id);if(el)el.innerHTML=html;};
 const setMsg=(text,kind='')=>{if(msg){msg.textContent=text||'';msg.style.color=kind==='error'?'#b42318':'';}};
 const renderRestricted=(id,label)=>setArea(id,`<div class="emptyState">You do not have permission to view ${esc(label)}.</div>`);
 const active=getArea();
 try{
   if(active==='content'){
     let items=[];
     try{items=await rpc('hoa_admin_free_content_list');}
     catch(e){renderRestricted('hoaV70AdminList','Free Content');throw e;}
     const sel=document.getElementById('hoaV70AdminTest');
     if(sel){
       try{
         const ts=await rpc('hoa_admin_free_tests');
         sel.innerHTML='<option value="">Select a Free Content test</option>'+(ts||[]).map(t=>`<option value="${esc(t.id)}" data-access-type="${esc(t.access_type||'free')}" data-show-result-details="${t.show_result_details!==false&&t.allow_review!==false?'true':'false'}">${esc(t.title)}${t.access_type==='paid'?' · Shared Paid Test':''}</option>`).join('');
       }catch(e){sel.innerHTML='<option value="">Free Test list unavailable</option>';}
     }
     const count=document.getElementById('hoaV70FreeCount');if(count)count.textContent=(items||[]).length;
     const content=(items||[]);
     setArea('hoaV70AdminList',content.length?`<table class="hoa-v70-table"><thead><tr><th>Title</th><th>Type</th><th>Resource</th><th>Published</th><th>Action</th></tr></thead><tbody>${content.map((x,i)=>`<tr data-hoaV75Index="${i}"><td>${esc(x.title)}</td><td>${esc(x.content_type)}</td><td>${esc(x.resource_type||'')}</td><td>${x.is_published?'YES':'NO'}</td><td><div class="hoa-v70-row-actions"><button type="button" class="secondary" onclick="hoaV70PreviewContent('${esc(x.id)}')">Preview</button><button type="button" class="secondary" onclick="hoaV70EditContent('${esc(x.id)}')">Edit</button>${x.content_type==='test'&&x.test_id?(x.is_published?`<button type="button" class="primary" data-hoa-free-student-link="${esc(x.id)}" data-hoa-free-test-id="${esc(x.test_id)}" data-hoa-free-test-title="${esc(x.title)}">Generate / Manage Link</button>`:`<span class="hoa-v70-link-hint">Publish to generate a link</span>`):''}<button type="button" class="secondary hoa-v70-danger" onclick="hoaV70DeleteContent('${esc(x.id)}')">Delete</button></div></td></tr>`).join('')}</tbody></table>`:'<div class="emptyState">No Free Content created.</div>');
     const statsContent=document.getElementById('hoaV611ContentStat');if(statsContent)statsContent.textContent=content.length;
     const published=(content||[]).filter(x=>x.is_published).length;const ps=document.getElementById('hoaV611PublishedStat');if(ps)ps.textContent=published;
     const tests=(content||[]).filter(x=>x.content_type==='test').length;const tsCount=document.getElementById('hoaV611TestStat');if(tsCount)tsCount.textContent=tests;
     setMsg('');
     return;
   }
   if(active==='students'){
     try{
       const ps=await rpc('hoa_admin_free_student_list');
       const rows=Array.isArray(ps)?ps:[];
       const html=rows.length ? '<table class="hoa-v70-table"><thead><tr><th>Name</th><th>Mobile</th><th>Email</th><th>Preparing For</th><th>College</th><th>Year</th><th>Address</th><th>Action</th></tr></thead><tbody>' + rows.map((x,i)=>'<tr data-hoaV75Index="'+i+'"><td>'+esc(x.full_name)+'</td><td>'+esc(x.mobile)+'</td><td>'+esc(x.email||'')+'</td><td>'+esc(x.preparing_for||'')+'</td><td>'+esc(x.college_name||'')+'</td><td>'+(x.passout_year||'')+'</td><td>'+esc(x.address||'')+'</td><td><button type="button" class="secondary hoa-v70-delete-student" data-free-student-id="'+esc(x.id)+'">Delete</button></td></tr>').join('') + '</tbody></table>' : '<div class="emptyState">No Free Content participants.</div>';
       setArea('hoaV70Profiles',html);
       document.querySelectorAll('#hoaV70Profiles [data-free-student-id]').forEach(btn=>btn.addEventListener('click',()=>window.hoaV70DeleteFreeStudent(btn.dataset.freeStudentId)));
       setMsg('');
     }catch(e){renderRestricted('hoaV70Profiles','Free Students');setMsg('Free Students: '+String(e?.message||e));}
     return;
   }
   if(active==='results'){
     if(typeof window.hoaV89InstallFreeResults==='function'){await window.hoaV89InstallFreeResults();}
     else {renderRestricted('hoaV70FreeResults','Free Test Results');}
     return;
   }
 }catch(e){
   const text=String(e?.message||e);
   const message='Free Content could not be loaded: '+text;
   if(msg){msg.textContent=message;msg.style.color='#b42318';}
   const errorHost=active==='students'?document.getElementById('hoaV70Profiles'):active==='results'?document.getElementById('hoaV70FreeResults'):document.getElementById('hoaV70AdminList');
   if(errorHost){errorHost.innerHTML='';const box=document.createElement('div');box.className='emptyState';box.setAttribute('role','alert');box.style.color='#b42318';box.textContent=message;errorHost.appendChild(box);}
   console.error('[HOA Free Content Admin]',e);
 }
}
window.hoaV70LoadAdmin=loadAdmin;
document.addEventListener('change',e=>{if(e.target&&e.target.id==='hoaV70ProgressStudent')renderAdminProgress()});
function hoaV70GetContentForm(){
 const contentType=document.getElementById('hoaV70AdminType')?.value||'other';
 const otherKind=document.getElementById('hoaV70OtherResourceType')?.value||'pdf';
 const resourceType=contentType==='test'?'test':contentType==='video'?'youtube':contentType==='note'?'pdf':otherKind;
 return {
  id:hoaV70EditId||null,
  title:document.getElementById('hoaV70AdminTitle')?.value.trim()||'',
  description:document.getElementById('hoaV70AdminDescription')?.value.trim()||'',
  content_type:contentType,
  resource_type:resourceType,
  test_id:document.getElementById('hoaV70AdminTest')?.value||null,
  url:document.getElementById('hoaV70AdminUrl')?.value.trim()||'',
  file_url:document.getElementById('hoaV70AdminFile')?.value.trim()||'',
  thumbnail_url:document.getElementById('hoaV70AdminThumb')?.value.trim()||'',
  category:document.getElementById('hoaV70AdminCategory')?.value.trim()||'',
  is_published:!!document.getElementById('hoaV70AdminPublished')?.checked,
  show_result_details:document.getElementById('hoaFreeResultDetails')?.checked!==false,
  sort_order:Number(document.getElementById('hoaV70AdminSort')?.value)||0
 };
}
function hoaV70UpdateContentFields(){
 const type=document.getElementById('hoaV70AdminType')?.value||'other';
 const otherKind=document.getElementById('hoaV70OtherResourceType')?.value||'pdf';
 const test=document.getElementById('hoaV70TestField'),other=document.getElementById('hoaV70OtherResourceField'),url=document.getElementById('hoaV70UrlField'),file=document.getElementById('hoaV70FileField'),visibility=document.getElementById('hoaFreeResultVisibilityField');
 if(test)test.classList.toggle('hidden',type!=='test');
 if(other)other.classList.toggle('hidden',type!=='other');
 if(visibility)visibility.classList.toggle('hidden',type!=='test');
 if(url)url.classList.toggle('hidden',!(type==='video'||(type==='other'&&otherKind==='webpage')));
 if(file)file.classList.toggle('hidden',!(type==='note'||(type==='other'&&(otherKind==='pdf'||otherKind==='photo'||otherKind==='any_file'))));
 const up=document.getElementById('hoaV70AdminFileUpload');
 if(up){
   if(type==='note'||(type==='other'&&otherKind==='pdf'))up.accept='application/pdf,.pdf';
   else if(type==='other'&&otherKind==='photo')up.accept='image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp';
   else if(type==='other'&&otherKind==='any_file')up.accept='*/*';
   else up.accept='';
   up.disabled=!(type==='note'||(type==='other'&&(otherKind==='pdf'||otherKind==='photo'||otherKind==='any_file')));
 }
}
function hoaV70ResetContentForm(){
 hoaV70EditId=null;
 ['hoaV70AdminTitle','hoaV70AdminDescription','hoaV70AdminCategory','hoaV70AdminUrl','hoaV70AdminFile','hoaV70AdminThumb'].forEach(id=>{const e=document.getElementById(id);if(e)e.value=''});
 const type=document.getElementById('hoaV70AdminType');if(type)type.value='test';
 const test=document.getElementById('hoaV70AdminTest');if(test)test.value='';
 const sort=document.getElementById('hoaV70AdminSort');if(sort)sort.value='0';
 const pub=document.getElementById('hoaV70AdminPublished');if(pub)pub.checked=false;
 const upload=document.getElementById('hoaV70AdminFileUpload');if(upload)upload.value='';
 const results=document.getElementById('hoaFreeResultDetails');if(results)results.checked=true;
 const resultState=document.getElementById('hoaFreeResultDetailsState');if(resultState)resultState.textContent='ON';
 const title=document.getElementById('hoaV70EditorTitle');if(title)title.textContent='Add Free Content';
 const mode=document.getElementById('hoaV70EditorMode');if(mode)mode.textContent='Create a new resource for Free Students.';
 const btn=document.getElementById('hoaV70SaveBtn');if(btn)btn.textContent='SAVE CONTENT';
 const msg=document.getElementById('hoaV70AdminMsg');if(msg)msg.textContent='';
 hoaV70UpdateContentFields();
}
function hoaV70ValidUrl(v){if(!v)return true;try{const u=new URL(v);return u.protocol==='https:'||u.protocol==='http:'}catch(e){return false}}
function hoaV70ValidateContent(item){
 if(!item.title)return 'Title is required.';
 if(item.title.length>180)return 'Title is too long.';
 if(!item.category)return 'Category / Exam is required.';
 if(item.content_type==='test'&&!item.test_id)return 'Select an existing Test / Mock Test.';
 if(item.content_type!=='test'&&!item.url&&!item.file_url&&!item.description)return 'Add a URL, file URL, or description for this resource.';
 if(item.url&&!hoaV70ValidUrl(item.url))return 'External URL is not valid.';
 if(item.file_url&&!hoaV70ValidUrl(item.file_url))return 'File URL is not valid.';
 if(item.thumbnail_url&&!hoaV70ValidUrl(item.thumbnail_url))return 'Thumbnail URL is not valid.';
 return '';
}
window.hoaV70SaveContent=async()=>{
 const msg=document.getElementById('hoaV70AdminMsg');
 let uploadedPath=null;
 let savedToDb=false;
 try{
   const uploadInput=document.getElementById('hoaV70AdminFileUpload');
   const selectedFile=uploadInput?.files?.[0]||null;
   const item=hoaV70GetContentForm();
   if(typeof window.hoaRequireAdminPermission!=="function")throw new Error('Admin permission service is not available.');
   if(item.content_type==='test') await window.hoaRequireAdminPermission('tests.manage');
   else if(item.content_type==='video') await window.hoaRequireAdminPermission('classes.manage');
   else if(item.content_type==='note') await window.hoaRequireAdminPermission('notes.manage');
   else await window.hoaRequireAdminPermission('tests.manage','classes.manage','notes.manage');
   const problem=hoaV70ValidateContent(item);
   if(problem){throw new Error(problem)}
   if(selectedFile){
     const type=document.getElementById('hoaV70AdminType')?.value||'other';
     const otherKind=document.getElementById('hoaV70OtherResourceType')?.value||'pdf';
     const allowed=type==='note'||(type==='other'&&['pdf','photo','any_file'].includes(otherKind));
     if(!allowed)throw new Error('File upload is not enabled for the selected content type.');
     const max=25*1024*1024;
     if(selectedFile.size>max)throw new Error('Selected file is larger than 25 MB.');
     const ext=(selectedFile.name.split('.').pop()||'bin').toLowerCase().replace(/[^a-z0-9]/g,'')||'bin';
     const safeName=selectedFile.name.replace(/[^A-Za-z0-9._-]/g,'_').slice(-120);
     uploadedPath=`admin/${crypto.randomUUID?.()||Date.now()}-${safeName}`;
     if(msg)msg.textContent='Uploading file…';
     const c=window.supabaseClient||window.supabase||null;
     if(!c?.storage)throw new Error('Supabase storage is not ready.');
     const up=await c.storage.from('free-content').upload(uploadedPath,selectedFile,{contentType:selectedFile.type||'application/octet-stream',upsert:false,cacheControl:'3600'});
     if(up.error)throw up.error;
     const pub=c.storage.from('free-content').getPublicUrl(uploadedPath);
     item.file_url=pub.data?.publicUrl||'';
   }
   if(msg)msg.textContent='Saving content…';
   const saved=await rpc('hoa_admin_free_content_upsert',{p_item:item});
   savedToDb=true;
   let contentId=item.id||saved?.id||saved?.data?.id||(typeof saved?.data==='string'?saved.data:null);
   if(!contentId){
     const items=await rpc('hoa_admin_free_content_list');
     const matches=(items||[]).filter(x=>String(x.title||'')===String(item.title||'')&&String(x.content_type||'')===String(item.content_type||''));
     contentId=matches[0]?.id||null;
   }
   if(!contentId)throw new Error('Free Content record could not be resolved after saving.');
   /* Result visibility is written atomically by hoa_admin_free_content_upsert. */
   if(msg)msg.textContent=hoaV70EditId?'Content updated successfully.':'Content saved successfully.';
   hoaV70ResetContentForm();
   await loadAdmin();
 }catch(e){
   if(uploadedPath&&!savedToDb){try{await (window.supabaseClient||window.supabase)?.storage.from('free-content').remove([uploadedPath])}catch(_){}}
   if(msg)msg.textContent='Save failed: '+String(e?.message||e);
 }
};
window.hoaV70EditContent=async id=>{
 try{
  const items=await rpc('hoa_admin_free_content_list'),x=(items||[]).find(i=>String(i.id)===String(id));if(!x)return;
  hoaV70EditId=id;
  document.getElementById('hoaV70AdminTitle').value=x.title||'';
  document.getElementById('hoaV70AdminDescription').value=x.description||'';
  document.getElementById('hoaV70AdminType').value=x.content_type||'other';
  const resourceType=document.getElementById('hoaV70OtherResourceType');
  if(resourceType){
    const fallback=x.content_type==='video'?'youtube':x.content_type==='note'?'pdf':x.content_type==='test'?'test':(x.resource_type||'pdf');
    resourceType.value=fallback;
  }
  document.getElementById('hoaV70AdminTest').value=x.test_id||'';
  document.getElementById('hoaV70AdminUrl').value=x.url||'';
  document.getElementById('hoaV70AdminFile').value=x.file_url||'';
  document.getElementById('hoaV70AdminThumb').value=x.thumbnail_url||'';
  document.getElementById('hoaV70AdminCategory').value=x.category||'';
  document.getElementById('hoaV70AdminPublished').checked=!!x.is_published;
  const resultDetails=document.getElementById('hoaFreeResultDetails');if(resultDetails){resultDetails.checked=x.show_result_details!==false&&x.allow_review!==false;const testOption=document.getElementById('hoaV70AdminTest')?.selectedOptions?.[0];if(x.show_result_details===undefined&&x.test_id){try{const c=window.supabaseClient||window.supabase;const tr=await c.from('tests').select('show_result_details,allow_review,access_type').eq('id',x.test_id).maybeSingle();if(!tr.error&&tr.data){resultDetails.checked=tr.data.show_result_details!==false&&tr.data.allow_review!==false;if(testOption)testOption.dataset.accessType=tr.data.access_type||'free';}}catch(_){}}if(testOption)testOption.dataset.showResultDetails=resultDetails.checked?'true':'false';resultDetails.disabled=false;const label=document.querySelector('#hoaFreeResultVisibilityField .hoa-free-result-visibility-copy small');if(label)label.textContent='This setting applies only to free students. It does not change the original Mock Test result/review settings for paid candidates.';}
  const resultState=document.getElementById('hoaFreeResultDetailsState');if(resultState)resultState.textContent=resultDetails?.checked?'ON':'OFF';
  document.getElementById('hoaV70AdminSort').value=x.sort_order||0;
  document.getElementById('hoaV70EditorTitle').textContent='Edit Free Content';
  document.getElementById('hoaV70EditorMode').textContent='Update this resource and preview it before saving.';
  document.getElementById('hoaV70SaveBtn').textContent='UPDATE CONTENT';
  document.getElementById('hoaV70AdminMsg').textContent='Editing selected content.';
  hoaV70UpdateContentFields();
  document.getElementById('hoaV70AdminTitle')?.scrollIntoView({behavior:'smooth',block:'center'});
 }catch(e){document.getElementById('hoaV70AdminMsg').textContent='Could not load content: '+String(e?.message||e)}
};
function hoaV70SafePreviewUrl(v){if(!v)return '';try{const u=new URL(v);return (u.protocol==='https:'||u.protocol==='http:')?u.href:''}catch(e){return ''}}
function hoaV70FreeContentStoragePath(v){
 const raw=String(v||'').trim();if(!raw)return '';
 const origin=(()=>{try{return new URL(window.SUPABASE_URL||window.HOA_CONFIG?.supabaseUrl||'').origin}catch(_){return ''}})();let path='';
 try{
  if(/^https?:\/\//i.test(raw)){const u=new URL(raw);if(!origin||u.origin!==origin)return '';const m=u.pathname.match(/^\/storage\/v1\/object\/(?:public|sign|authenticated)\/free-content\/(.+)$/);if(!m)return '';path=m[1];}
  else if(/^(?:free|admin)\//.test(raw))path=raw;
  else return '';
  path=path.split('/').map(part=>decodeURIComponent(part)).join('/');
 }catch(_){return ''}
 if(!path||path.startsWith('/')||path.includes('\\')||/[\x00-\x1f\x7f]/.test(path)||path.split('/').some(part=>!part||part==='.'||part==='..')||!/^(?:free|admin)\//.test(path))return '';
 return path;
}
async function hoaV70ResolveFreeContentUrl(v){
 const raw=hoaV70SafePreviewUrl(v);if(!raw)return '';
 const path=hoaV70FreeContentStoragePath(raw);if(!path)return raw;
 const c=window.supabaseClient||window.supabase||null;if(!c?.storage)throw new Error('Supabase Storage is not ready.');
 const result=await c.storage.from('free-content').createSignedUrl(path,600);if(result.error||!result.data?.signedUrl)throw new Error('The private Free Content file could not be signed for Admin preview.');
 return result.data.signedUrl;
}
async function hoaV70PreparePreviewItem(item){
 const preview={...item};
 for(const key of ['file_url','url','thumbnail_url']){
  const value=preview[key];if(hoaV70FreeContentStoragePath(value))preview[key]=await hoaV70ResolveFreeContentUrl(value);
 }
 return preview;
}
function hoaV70YouTubeEmbed(v){
 const u=hoaV70SafePreviewUrl(v);if(!u)return '';
 try{const x=new URL(u);let id=x.searchParams.get('v');if(!id&&x.hostname.includes('youtu.be'))id=x.pathname.slice(1).split('/')[0];if(!id&&x.pathname.includes('/embed/'))id=x.pathname.split('/embed/')[1].split('/')[0];return id?`https://www.youtube.com/embed/${encodeURIComponent(id)}`:''}catch(e){return ''}
}
function hoaV70PreviewMarkup(x){
 const type=String(x.content_type||'other').toLowerCase(),url=hoaV70SafePreviewUrl(x.url),file=hoaV70SafePreviewUrl(x.file_url),thumb=hoaV70SafePreviewUrl(x.thumbnail_url),yt=hoaV70YouTubeEmbed(x.url);
 let media='';
 if(type==='test') media=`<div class="hoa-v70-preview-test"><div class="hoa-v70-preview-icon">📝</div><strong>${esc(x.test_title||x.title||'Selected Free Test / Mock Test')}</strong><span>Admin-only preview: view saved questions, correct answers, and explanations. Student visibility still follows the Result Release &amp; Answer Review setting.</span><button type="button" class="secondary hoa-v70-preview-action" id="hoaV70LoadTestPreview">LOAD MOCK TEST PREVIEW</button></div><div id="hoaV70TestPreviewQuestions" class="hoa-v70-test-preview-questions" aria-live="polite"></div>`;
 else if(type==='video'&&yt) media=`<div class="hoa-v70-preview-video"><iframe src="${esc(yt)}?cc_load_policy=0&amp;playsinline=1" title="Video preview" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
 else if(type==='video'&&file) media=`<video class="hoa-v70-preview-video-file" controls src="${esc(file)}"></video>`;
 else if((type==='pdf'||type==='note')&&(file||url)) media=`<div class="hoa-v70-preview-test hoa-v70-pdf-preview"><div class="hoa-v70-preview-icon">📄</div><strong>${type==='note'?'Study Note Preview':'PDF Preview'}</strong><span>${esc(x.file_url||x.url||'')}</span><button type="button" class="secondary hoa-v70-preview-action" id="hoaV70OpenPdfPreview">OPEN ${type==='note'?'NOTE':'PDF'}</button></div>`;
 else if(file&&/\.(?:png|jpe?g|gif|webp)(?:$|[?#])/i.test(file)) media=`<img class="hoa-v70-preview-image" src="${esc(file)}" alt="${esc(x.title||'Content preview')}">`;
 else if(file) media=`<div class="hoa-v70-preview-test"><div class="hoa-v70-preview-icon">📎</div><strong>Attached Resource</strong><span>${esc(x.file_url||'')}</span><button type="button" class="secondary hoa-v70-preview-action" id="hoaV70OpenFilePreview">OPEN RESOURCE</button></div>`;
 else if(thumb) media=`<img class="hoa-v70-preview-image" src="${esc(thumb)}" alt="${esc(x.title||'Content preview')}">`;
 else if(url) media=`<div class="hoa-v70-preview-link">🔗 <a href="${esc(url)}" target="_blank" rel="noopener noreferrer">Open resource link</a></div>`;
 else media=`<div class="hoa-v70-preview-empty">No media supplied. The description will be shown below.</div>`;
 return `<div class="hoa-v70-preview-card"><div class="hoa-v70-preview-meta"><span>${esc(type==='test'?'Mock Test':type==='other'?'Current Affairs / Other':type==='note'?'Study Note':type)}</span>${x.category?`<span>${esc(x.category)}</span>`:''}${x.is_published?'<span>Published</span>':'<span>Draft</span>'}</div><h3>${esc(x.title||'Untitled')}</h3>${x.description?`<p>${esc(x.description)}</p>`:''}${media}</div>`;
}
function hoaV70PreviewSetStatus(host,text,isError=false){if(!host)return;host.textContent=text||'';host.classList.toggle('error',!!isError);}
async function hoaV70ResolveQuestionMedia(value){
 const raw=String(value||'').trim();if(!raw)return '';
 const direct=hoaV70SafePreviewUrl(raw);if(direct)return direct;
 const c=window.supabaseClient||window.supabase||null;
 if(!c?.storage)return '';
 try{const r=await c.storage.from('question-media').createSignedUrl(raw,3600);if(!r.error&&r.data?.signedUrl)return r.data.signedUrl;}catch(_){}
 return '';
}
function hoaV70PreviewOptionData(q){
 const existing=Array.isArray(q.options_json)?q.options_json.filter(v=>v!==null&&v!==undefined):[];
 if(existing.length)return existing.map(v=>typeof v==='object'&&v!==null?{text:String(v.text||v.label||''),image:v.image||v.image_path||v.image_url||''}:{text:String(v??''),image:''});
 return [q.option_1,q.option_2,q.option_3,q.option_4].filter(v=>v!==null&&v!==undefined&&String(v).trim()!=='').map(v=>({text:String(v),image:''}));
}
async function hoaV70RenderTestQuestionsPreview(item){
 const host=document.getElementById('hoaV70TestPreviewQuestions');if(!host)return;
 if(!item.test_id){hoaV70PreviewSetStatus(host,'This Free Content entry is not linked to a mock test. Edit it and select a test.',true);return;}
 const c=window.supabaseClient||window.supabase||null;
 if(!c)throw new Error('Supabase is not ready. Refresh the Admin page and try again.');
 host.innerHTML='<div class="hoa-v70-preview-loading" role="status">Loading the saved mock test and its questions…</div>';
 const [tr,qr]=await Promise.all([
   c.from('tests').select('id,title,description,duration_minutes,marks_per_question,negative_marking,test_type,access_type,is_published').eq('id',item.test_id).maybeSingle(),
   c.from('questions').select('id,test_id,question_text,option_1,option_2,option_3,option_4,correct_option,correct_value,tolerance,question_order,question_type,source,options_json,question_image_path,explanation,explanation_text,explanation_image_path').eq('test_id',item.test_id).order('question_order',{ascending:true})
 ]);
 if(tr.error)throw tr.error;if(qr.error)throw qr.error;
 if(!tr.data)throw new Error('The linked mock test could not be found or your Admin role cannot view it.');
 const test=tr.data,questions=Array.isArray(qr.data)?qr.data:[];
 if(!questions.length){host.innerHTML='<div class="hoa-v70-preview-empty" role="status">The mock test exists, but no saved questions were returned. Check the test question library and Admin permissions.</div>';return;}
 const rendered=await Promise.all(questions.map(async(q,index)=>{
   const [qImage, explanationImage]=await Promise.all([
     hoaV70ResolveQuestionMedia(q.question_image_path),
     hoaV70ResolveQuestionMedia(q.explanation_image_path)
   ]);
   const questionMedia=qImage?`<img class="hoa-v70-test-question-image" src="${esc(qImage)}" alt="Question ${index+1} image" loading="lazy">`:'';
   const explanationText=String(q.explanation_text||q.explanation||'').trim();
   const explanationMarkup=(explanationText||explanationImage)
     ? `<section class="hoa-v70-test-explanation"><h4>Explanation</h4>${explanationText?`<div class="hoa-v70-test-explanation-text">${esc(explanationText)}</div>`:''}${explanationImage?`<img class="hoa-v70-test-explanation-image" src="${esc(explanationImage)}" alt="Explanation for question ${index+1}" loading="lazy">`:''}</section>`
     : `<section class="hoa-v70-test-explanation hoa-v70-test-explanation-empty"><h4>Explanation</h4><p>No explanation has been saved for this question.</p></section>`;
   const type=String(q.question_type||'mcq').toLowerCase();
   let options='', correctAnswerMarkup='';
   if(type==='numerical') {
     options='<div class="hoa-v70-test-numerical-answer"><span>Numerical response</span><div aria-hidden="true"></div></div>';
     const rawCorrect=q.correct_value;
     const hasCorrect=rawCorrect!==null&&rawCorrect!==undefined&&String(rawCorrect).trim()!==''&&Number.isFinite(Number(rawCorrect));
     const rawTolerance=q.tolerance;
     const hasTolerance=rawTolerance!==null&&rawTolerance!==undefined&&String(rawTolerance).trim()!==''&&Number.isFinite(Number(rawTolerance))&&Number(rawTolerance)>=0;
     correctAnswerMarkup=hasCorrect
       ? `<section class="hoa-v70-test-correct-answer"><h4>Correct Answer</h4><p>${esc(String(rawCorrect))}${hasTolerance&&Number(rawTolerance)>0?` <small>Acceptable tolerance: ±${esc(String(rawTolerance))}</small>`:''}</p></section>`
       : '<section class="hoa-v70-test-correct-answer hoa-v70-test-correct-answer-missing"><h4>Correct Answer</h4><p>No correct numerical answer has been saved.</p></section>';
   } else {
     const opts=hoaV70PreviewOptionData(q);
     const correctOption=Number(q.correct_option);
     const correctOptionValid=Number.isInteger(correctOption)&&correctOption>=1&&correctOption<=opts.length;
     const optMarkup=await Promise.all(opts.map(async(o,i)=>{
       const image=await hoaV70ResolveQuestionMedia(o.image);
       const letter=String.fromCharCode(65+i);
       const isCorrect=correctOptionValid&&(i+1===correctOption);
       return `<li class="${isCorrect?'hoa-v70-test-option-correct':''}"><span class="hoa-v70-test-option-letter">${letter}.</span><div class="hoa-v70-test-option-content">${o.text?`<span>${esc(o.text)}</span>`:''}${image?`<img class="hoa-v70-test-option-image" src="${esc(image)}" alt="Option ${letter} image" loading="lazy">`:''}</div>${isCorrect?'<strong class="hoa-v70-test-correct-option-label">✓ Correct answer</strong>':''}</li>`;
     }));
     options=optMarkup.length?`<ol class="hoa-v70-test-options">${optMarkup.join('')}</ol>`:'<div class="hoa-v70-test-no-options">No options are saved for this question.</div>';
     if(correctOptionValid){
       const correct=opts[correctOption-1];
       const label=String.fromCharCode(64+correctOption);
       const answerText=String(correct?.text||'').trim();
       correctAnswerMarkup=`<section class="hoa-v70-test-correct-answer"><h4>Correct Answer</h4><p><b>Option ${label}</b>${answerText?` — ${esc(answerText)}`:''}</p></section>`;
     }else{
       correctAnswerMarkup='<section class="hoa-v70-test-correct-answer hoa-v70-test-correct-answer-missing"><h4>Correct Answer</h4><p>No valid correct option has been saved for this question.</p></section>';
     }
   }
   return `<article class="hoa-v70-test-question"><header><b>Question ${index+1}</b><span>${esc(type==='numerical'?'Numerical':'Multiple Choice')}</span>${q.source?`<small>${esc(q.source)}</small>`:''}</header><div class="hoa-v70-test-question-text">${esc(q.question_text||(!qImage?'[Question text is empty]':''))}</div>${questionMedia}${options}${correctAnswerMarkup}${explanationMarkup}</article>`;
 }));
 host.innerHTML=`<div class="hoa-v70-test-preview-summary"><div><strong>${esc(test.title||item.title||'Mock Test')}</strong><span>${questions.length} questions · ${esc(test.duration_minutes||10)} minutes · ${esc(test.test_type||'subject').replaceAll('_',' ')}</span></div><div class="hoa-v70-test-preview-actions"><span class="hoa-v70-test-preview-badge">ADMIN PREVIEW</span><button type="button" class="hoa-v70-preview-action hoa-v70-preview-download" id="hoaV70DownloadMockTestPdf">⬇ DOWNLOAD QUESTION PDF</button></div></div><div class="hoa-v70-pdf-export-status" id="hoaV70PdfExportStatus" role="status" aria-live="polite"></div>${rendered.join('')}`;
 const pdfButton=host.querySelector('#hoaV70DownloadMockTestPdf');
 if(pdfButton)pdfButton.onclick=()=>hoaV70DownloadMockTestPdf(item,test,questions,pdfButton);
}
function hoaV70LoadHtml2Pdf(){
 if(window.html2pdf)return Promise.resolve();
 return new Promise((resolve,reject)=>{
  const fail=()=>reject(new Error('The PDF generator could not be loaded. Check your internet connection and retry.'));
  const src='https://unpkg.com/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js';
  let script=[...document.scripts].find(s=>s.src===src);
  if(script){
   if(window.html2pdf){resolve();return;}
   script.addEventListener('load',()=>window.html2pdf?resolve():fail(),{once:true});
   script.addEventListener('error',fail,{once:true});
   return;
  }
  script=document.createElement('script');script.src=src;script.async=true;
  script.onload=()=>window.html2pdf?resolve():fail();script.onerror=fail;
  document.head.appendChild(script);
 });
}
function hoaV70PdfNum(v,digits=2){
 if(v===null||v===undefined||String(v).trim()===''||!Number.isFinite(Number(v)))return '—';
 return Number(v).toLocaleString(undefined,{maximumFractionDigits:digits});
}
function hoaV70PdfSlug(v){
 const s=String(v||'Mock_Test').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/gi,'_').replace(/^_+|_+$/g,'').slice(0,72);
 return s||'Mock_Test';
}
async function hoaV70WaitForPdfImages(node){
 const images=[...node.querySelectorAll('img')];
 await Promise.all(images.map(img=>{
  if(img.complete)return Promise.resolve();
  return new Promise(resolve=>{
   let done=false;const finish=()=>{if(done)return;done=true;resolve();};
   img.addEventListener('load',finish,{once:true});img.addEventListener('error',finish,{once:true});
   setTimeout(finish,7000);
  });
 }));
}
/* HOA V8.90.19: replaced html2canvas cloning with a native PDF writer after confirming exported files were blank except for footer text. */
/* V8.90.19: Native PDF writer. Avoids html2canvas/hidden DOM capture, the root cause of blank question PDFs. */
function hoaV70PdfCleanText(value){
 const map={
  '\u00a0':' ','\u2018':"'",'\u2019':"'",'\u201c':'"','\u201d':'"','\u2013':'-','\u2014':'-','\u2212':'-',
  '\u00b1':'+/-','\u00d7':' x ','\u00f7':' / ','\u2264':'<=','\u2265':'>=','\u2260':'!=','\u2248':'~=',
  '\u03c0':'pi','\u03a0':'PI','\u221a':'sqrt','\u221e':'infinity','\u03b1':'alpha','\u03b2':'beta','\u03b3':'gamma',
  '\u03b8':'theta','\u03bc':'mu','\u03a3':'Sigma','\u03c3':'sigma','\u03bb':'lambda','\u03a9':'Ohm','\u00b0':' deg',
  '\u2022':'*','\u00b7':'*','\u2026':'...','\u2192':'->','\u21d2':'=>','\u2713':'[correct]','\u2714':'[correct]',
  '\u2717':'[incorrect]','\u00a9':'(c)','\u00ae':'(R)','\u20b9':'Rs.','\u20ac':'EUR'
 };
 let s=String(value??'').replace(/[\u00a0\u2018\u2019\u201c\u201d\u2013\u2014\u2212\u00b1\u00d7\u00f7\u2264\u2265\u2260\u2248\u03c0\u03a0\u221a\u221e\u03b1\u03b2\u03b3\u03b8\u03bc\u03a3\u03c3\u03bb\u03a9\u00b0\u2022\u00b7\u2026\u2192\u21d2\u2713\u2714\u2717\u00a9\u00ae\u20b9\u20ac]/g,ch=>map[ch]??ch);
 try{s=s.normalize('NFKD').replace(/[\u0300-\u036f]/g,'');}catch(_){}
 return s.replace(/\r\n?/g,'\n').replace(/[^\x09\x0A\x20-\x7E]/g,'?');
}
function hoaV70PdfLiteral(value){return '('+hoaV70PdfCleanText(value).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)').replace(/[\r\n]/g,' ')+')';}
function hoaV70PdfColor(rgb){return rgb.map(v=>(v/255).toFixed(3)).join(' ');}
function hoaV70PdfWrapLines(value,maxWidthPt,fontSize,bold=false){
 const clean=hoaV70PdfCleanText(value);const ctx=hoaV70PdfWrapLines.ctx||(hoaV70PdfWrapLines.ctx=document.createElement('canvas').getContext('2d'));
 const maxPx=maxWidthPt*96/72;ctx.font=`${bold?'700 ':''}${fontSize*96/72}px Arial, Helvetica, sans-serif`;
 const all=[];
 for(const para of clean.split('\n')){
  if(!para){all.push('');continue;}
  let line='';
  for(const word of para.split(/\s+/)){
   if(!word)continue;
   const candidate=line?line+' '+word:word;
   if(ctx.measureText(candidate).width<=maxPx||!line){
    if(ctx.measureText(candidate).width<=maxPx){line=candidate;continue;}
    let piece='';for(const ch of word){if(piece&&ctx.measureText(piece+ch).width>maxPx){all.push(piece);piece=ch;}else piece+=ch;}line=piece;
   }else{all.push(line);line=word;}
  }
  if(line)all.push(line);
 }
 return all.length?all:[''];
}
function hoaV70PdfImageSize(asset,maxW,maxH){if(!asset)return {w:0,h:0};const ratio=Math.min(maxW/asset.width,maxH/asset.height,1);return {w:asset.width*ratio,h:asset.height*ratio};}
async function hoaV70PdfLoadImageAsset(url,maxPixel=1200){
 if(!url)return null;
 return await new Promise(resolve=>{
  const img=new Image();let finished=false;const finish=v=>{if(finished)return;finished=true;resolve(v);};
  const timer=setTimeout(()=>finish(null),9000);
  img.crossOrigin='anonymous';
  img.onload=()=>{try{
   const factor=Math.min(1,maxPixel/Math.max(img.naturalWidth||img.width,1),1000/Math.max(img.naturalHeight||img.height,1));
   const w=Math.max(1,Math.round((img.naturalWidth||img.width)*factor)),h=Math.max(1,Math.round((img.naturalHeight||img.height)*factor));
   const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d',{alpha:false});
   ctx.fillStyle='#ffffff';ctx.fillRect(0,0,w,h);ctx.drawImage(img,0,0,w,h);
   const dataUrl=canvas.toDataURL('image/jpeg',0.88);const b64=dataUrl.split(',')[1]||'';const bin=atob(b64);const bytes=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
   clearTimeout(timer);finish({width:w,height:h,bytes,dataUrl});
  }catch(e){clearTimeout(timer);finish(null);}};
  img.onerror=()=>{clearTimeout(timer);finish(null);};
  try{img.src=url;}catch(_){clearTimeout(timer);finish(null);}
 });
}
function hoaV70BuildPdfBlob(pages,imageAssets,metadata){
 const enc=s=>new TextEncoder().encode(String(s));
 const objects=[null,{body:'<< /Type /Catalog /Pages 2 0 R >>'},{body:'PAGES_PLACEHOLDER'},{body:'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'},{body:'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'}];
 const addBody=body=>{objects.push({body});return objects.length-1;};
 const addStream=(dict,bytes)=>{objects.push({dict,stream:bytes});return objects.length-1;};
 for(const asset of imageAssets.values()){if(!asset)continue;asset.objectId=addStream(`<< /Type /XObject /Subtype /Image /Width ${asset.width} /Height ${asset.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${asset.bytes.length} >>`,asset.bytes);}
 const pageIds=[];
 const xObjectEntries=[...imageAssets.values()].filter(Boolean).map(a=>`/${a.name} ${a.objectId} 0 R`).join(' ');
 for(const page of pages){
  const content=enc(page.ops.join('\n')+'\n');const contentId=addStream(`<< /Length ${content.length} >>`,content);
  const resources=`<< /Font << /F1 3 0 R /F2 4 0 R >>${xObjectEntries?` /XObject << ${xObjectEntries} >>`:''} >>`;
  pageIds.push(addBody(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${page.width} ${page.height}] /Resources ${resources} /Contents ${contentId} 0 R >>`));
 }
 objects[2].body=`<< /Type /Pages /Kids [${pageIds.map(id=>`${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;
 const infoId=addBody(`<< /Title ${hoaV70PdfLiteral(metadata.title)} /Subject ${hoaV70PdfLiteral('Administrative mock-test questions, correct answers and explanations')} /Author ${hoaV70PdfLiteral('HUB OF ASPIRANTS')} /Creator ${hoaV70PdfLiteral('HUB OF ASPIRANTS Admin Portal')} >>`);
 const pieces=[];let total=0;const pushBytes=b=>{pieces.push(b);total+=b.length;};const pushText=s=>pushBytes(enc(s));
 pushText('%PDF-1.4\n% HOA Admin Question PDF\n');const offsets=new Array(objects.length).fill(0);
 for(let id=1;id<objects.length;id++){
  const obj=objects[id];offsets[id]=total;pushText(`${id} 0 obj\n`);
  if(obj.stream){pushText(`${obj.dict}\nstream\n`);pushBytes(obj.stream);pushText('\nendstream\nendobj\n');}
  else pushText(`${obj.body}\nendobj\n`);
 }
 const xrefOffset=total;pushText(`xref\n0 ${objects.length}\n0000000000 65535 f \n`);
 for(let id=1;id<objects.length;id++)pushText(`${String(offsets[id]).padStart(10,'0')} 00000 n \n`);
 pushText(`trailer\n<< /Size ${objects.length} /Root 1 0 R /Info ${infoId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);
 return new Blob(pieces,{type:'application/pdf'});
}
async function hoaV70DownloadMockTestPdf(item,test,questions,button){
 const status=document.getElementById('hoaV70PdfExportStatus');const oldLabel=button?.textContent||'DOWNLOAD QUESTION PDF';
 try{
  if(button){button.disabled=true;button.textContent='PREPARING PDF…';}
  if(status){status.textContent='Building a branded PDF directly (no hidden-page screenshot).';status.classList.remove('error');}
  if(!Array.isArray(questions)||!questions.length)throw new Error('No questions were provided to the PDF exporter. Load the mock test preview and try again.');
  const PAGE_W=595.28,PAGE_H=841.89,M=42,CONTENT_BOTTOM=PAGE_H-43,GAP=7;
  const assets=new Map();
  const imageFor=async rawUrl=>{
   if(!rawUrl)return null;const url=String(rawUrl);if(assets.has(url))return assets.get(url);
   const asset=await hoaV70PdfLoadImageAsset(url,1300);
   if(asset){asset.name='Im'+(assets.size+1);assets.set(url,asset);return asset;}
   assets.set(url,null);return null;
  };
  const origin=window.location?.origin||'';
  let logoUrl='';try{logoUrl=new URL('./assets/hoa-logo.webp',document.baseURI).href;}catch(_){logoUrl=origin+'/assets/hoa-logo.webp';}
  let logo=await imageFor(logoUrl);
  if(!logo){let png='';try{png=new URL('./assets/hoa-logo.png',document.baseURI).href;}catch(_){png=origin+'/assets/hoa-logo.png';}logo=await imageFor(png);}
  const title=String(test?.title||item?.test_title||item?.title||'Mock Test').trim()||'Mock Test';
  const prepared=[];let imageMissing=0;
  for(let index=0;index<questions.length;index++){
   const q=questions[index]||{};let qImageUrl='',expImageUrl='';
   try{qImageUrl=await hoaV70ResolveQuestionMedia(q.question_image_path);}catch(_){}
   try{expImageUrl=await hoaV70ResolveQuestionMedia(q.explanation_image_path);}catch(_){}
   const qImage=await imageFor(qImageUrl);if(qImageUrl&&!qImage)imageMissing++;
   const explanationImage=await imageFor(expImageUrl);if(expImageUrl&&!explanationImage)imageMissing++;
   const options=String(q.question_type||'mcq').toLowerCase()==='numerical'?[]:hoaV70PreviewOptionData(q);
   const optionRows=[];
   for(const option of options){let imageUrl='';try{imageUrl=await hoaV70ResolveQuestionMedia(option.image);}catch(_){}const image=await imageFor(imageUrl);if(imageUrl&&!image)imageMissing++;optionRows.push({text:String(option.text||''),image});}
   prepared.push({q,index,qImage,explanationImage,options:optionRows});
  }
  const pages=[];let page=null,cursor=0;
  const newPage=(continued=true)=>{
   page={width:PAGE_W,height:PAGE_H,ops:[]};pages.push(page);cursor=continued?47:34;
   if(continued){
    page.ops.push(`0.043 0.231 0.451 rg 42 ${(PAGE_H-23-5).toFixed(2)} 511 5 re f`);
    page.ops.push(`0.043 0.231 0.451 rg BT /F2 9 Tf 1 0 0 1 42 ${(PAGE_H-38).toFixed(2)} Tm ${hoaV70PdfLiteral('HUB OF ASPIRANTS')} Tj ET`);
    page.ops.push(`0.330 0.400 0.515 RG 0.5 w 42 ${(PAGE_H-43).toFixed(2)} m 553 ${(PAGE_H-43).toFixed(2)} l S`);
   }
  };
  const ensure=height=>{if(cursor+height>CONTENT_BOTTOM){newPage(true);}};
  const text=(str,x,top,size=10,bold=false,color=[24,47,72])=>{
   const baseline=PAGE_H-top-size;page.ops.push(`${hoaV70PdfColor(color)} rg BT /${bold?'F2':'F1'} ${size.toFixed(2)} Tf 1 0 0 1 ${x.toFixed(2)} ${baseline.toFixed(2)} Tm ${hoaV70PdfLiteral(str)} Tj ET`);
  };
  const line=(x1,top1,x2,top2,color=[216,228,239],width=.6)=>page.ops.push(`${hoaV70PdfColor(color)} RG ${width} w ${x1.toFixed(2)} ${(PAGE_H-top1).toFixed(2)} m ${x2.toFixed(2)} ${(PAGE_H-top2).toFixed(2)} l S`);
  const rect=(x,top,w,h,fill=[255,255,255],stroke=null)=>{
   const y=PAGE_H-top-h;page.ops.push(`q ${hoaV70PdfColor(fill)} rg ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f Q`);
   if(stroke)page.ops.push(`q ${hoaV70PdfColor(stroke)} RG 0.6 w ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re S Q`);
  };
  const drawImage=(asset,x,top,maxW,maxH)=>{
   if(!asset)return 0;const size=hoaV70PdfImageSize(asset,maxW,maxH);const y=PAGE_H-top-size.h;
   page.ops.push(`q ${size.w.toFixed(2)} 0 0 ${size.h.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm /${asset.name} Do Q`);return size.h;
  };
  const wrap=(str,width,size,bold=false)=>hoaV70PdfWrapLines(str,width,size,bold);
  const paragraph=(str,x,width,size=10,bold=false,color=[24,47,72],lineHeight=size*1.35)=>{
   let lines=wrap(str,width,size,bold);for(const ln of lines){ensure(lineHeight+1);text(ln,x,cursor,size,bold,color);cursor+=lineHeight;}return cursor;
  };
  const centered=(str,top,size,bold,color,maxWidth=PAGE_W-2*M)=>{
   const lines=wrap(str,maxWidth,size,bold);for(const ln of lines){ensure(size*1.5);const ctx=hoaV70PdfWrapLines.ctx;ctx.font=`${bold?'700 ':''}${size*96/72}px Arial, Helvetica, sans-serif`;const actualW=ctx.measureText(ln).width*72/96;const x=Math.max(M,(PAGE_W-actualW)/2);text(ln,x,cursor,size,bold,color);cursor+=size*1.4;}
  };
  newPage(false);
  rect(M,27,PAGE_W-2*M,6,[11,59,115]);
  if(logo)drawImage(logo,M,43,48,48);
  const brandX=logo?M+59:M;
  text('HUB OF ASPIRANTS',brandX,48,16,true,[11,59,115]);
  text('Dream. Prepare. Conquer.',brandX,69,8.5,false,[91,111,130]);
  text('QUESTION PAPER | ANSWER KEY | EXPLANATIONS',brandX,84,7.5,false,[91,111,130]);
  rect(PAGE_W-M-100,43,100,39,[241,247,252],[187,211,232]);
  text('ADMIN COPY',PAGE_W-M-84,51,9,true,[23,76,123]);
  text('CONFIDENTIAL',PAGE_W-M-91,65,8,true,[123,86,16]);
  cursor=101;
  centered(title,cursor,17,true,[14,49,85]);
  cursor+=4;centered('Complete question set with correct answers and explanations',cursor,8.5,false,[83,107,129]);cursor+=7;
  const marks=hoaV70PdfCleanText(hoaV70PdfNum(test?.marks_per_question));
  const negative=hoaV70PdfCleanText(hoaV70PdfNum(test?.negative_marking));
  const maxMarks=Number.isFinite(Number(test?.marks_per_question))?questions.length*Number(test?.marks_per_question):null;
  const meta=[['NUMBER OF QUESTIONS',String(questions.length)],['DURATION',`${test?.duration_minutes||10} minutes`],['TEST TYPE',String(test?.test_type||'subject').replaceAll('_',' ')],['MARKS / QUESTION',marks],['NEGATIVE MARKING',negative],['MAXIMUM MARKS',maxMarks===null?'Not set':hoaV70PdfNum(maxMarks)]];
  const cardGap=7,cardW=(PAGE_W-2*M-cardGap*2)/3,cardH=33,metaTop=cursor;
  meta.forEach((m,i)=>{const row=Math.floor(i/3),col=i%3,x=M+col*(cardW+cardGap),top=metaTop+row*(cardH+6);rect(x,top,cardW,cardH,[247,251,255],[217,228,239]);text(m[0],x+7,top+5,6.5,true,[100,121,141]);text(m[1],x+7,top+17,9.5,true,[23,62,98]);});
  cursor=metaTop+2*(cardH+6)+2;
  if(String(test?.description||'').trim()){
   const lines=wrap(String(test.description),PAGE_W-2*M-18,8.5,false);const h=15+lines.length*12;ensure(h+7);rect(M,cursor,PAGE_W-2*M,h,[255,250,240],[240,223,181]);text('TEST DESCRIPTION',M+8,cursor+4,7,true,[123,86,16]);cursor+=14;paragraph(test.description,M+8,PAGE_W-2*M-16,8.5,false,[70,92,112],12);cursor+=4;
  }
  const warning='Administrative material includes correct answers and explanations. Do not distribute to students unless authorized.';
  const warningLines=wrap(warning,PAGE_W-2*M-16,7.5,false);const warningH=10+warningLines.length*9;ensure(warningH+12);rect(M,cursor,PAGE_W-2*M,warningH,[255,248,232],[240,223,181]);cursor+=5;paragraph(warning,M+8,PAGE_W-2*M-16,7.5,false,[106,123,141],9);cursor+=7;
  for(const {q,index,qImage,explanationImage,options} of prepared){
   ensure(31);rect(M,cursor,PAGE_W-2*M,24,[237,245,252],[215,226,237]);text(`QUESTION ${index+1}`,M+8,cursor+6,9.5,true,[11,59,115]);const type=String(q.question_type||'mcq').toLowerCase()==='numerical'?'Numerical':'Multiple Choice';text(type,PAGE_W-M-110,cursor+7,7.5,true,[49,94,135]);cursor+=30;
   if(q.source)paragraph('Source: '+q.source,M,PAGE_W-2*M,7.5,false,[113,131,152],10);
   paragraph(String(q.question_text||'').trim()||'[Question text not saved]',M,PAGE_W-2*M,10.5,true,[24,47,72],14);
   if(qImage){const size=hoaV70PdfImageSize(qImage,PAGE_W-2*M-12,170);ensure(size.h+9);const h=drawImage(qImage,M+6,cursor,PAGE_W-2*M-12,170);cursor+=h+7;}
   if(String(q.question_type||'mcq').toLowerCase()==='numerical'){
    const hasVal=q.correct_value!==null&&q.correct_value!==undefined&&String(q.correct_value).trim()!==''&&Number.isFinite(Number(q.correct_value));
    const hasTol=q.tolerance!==null&&q.tolerance!==undefined&&String(q.tolerance).trim()!==''&&Number.isFinite(Number(q.tolerance))&&Number(q.tolerance)>=0;
    const ans='Correct answer: '+(hasVal?String(q.correct_value):'Not saved')+(hasTol&&Number(q.tolerance)>0?` (accepted tolerance: +/- ${q.tolerance})`:'');
    const ansLines=wrap(ans,PAGE_W-2*M-18,8.7,true),ansH=10+ansLines.length*12;ensure(ansH);rect(M,cursor,PAGE_W-2*M,ansH,[237,249,240],[41,146,84]);cursor+=5;paragraph(ans,M+8,PAGE_W-2*M-16,8.7,true,[22,77,46],12);cursor+=4;
   }else{
    const correct=Number(q.correct_option),correctValid=Number.isInteger(correct)&&correct>=1&&correct<=options.length;
    if(!options.length){paragraph('No options saved for this question.',M,PAGE_W-2*M,8.5,false,[121,135,151],11);}
    for(let oi=0;oi<options.length;oi++){
     const op=options[oi],isCorrect=correctValid&&oi+1===correct;const label=String.fromCharCode(65+oi)+'.';const textLines=wrap(op.text||'[Option text not saved]',PAGE_W-2*M-(isCorrect?105:38),8.8,isCorrect);const imgSize=op.image?hoaV70PdfImageSize(op.image,PAGE_W-2*M-45,65):{w:0,h:0};const boxH=10+textLines.length*11+imgSize.h+(op.image?5:0);ensure(Math.min(boxH,CONTENT_BOTTOM-47));
     if(cursor+boxH>CONTENT_BOTTOM){newPage(true);}
     rect(M,cursor,PAGE_W-2*M,boxH,isCorrect?[240,251,243]:[251,253,255],isCorrect?[46,139,87]:[224,232,240]);text(label,M+8,cursor+6,8.8,true,isCorrect?[23,107,57]:[22,75,122]);let ttop=cursor+5;
     for(const ln of textLines){text(ln,M+28,ttop,8.8,isCorrect,[24,47,72]);ttop+=11;}
     if(op.image){const h=drawImage(op.image,M+29,ttop+1,PAGE_W-2*M-45,65);ttop+=h+4;}
     if(isCorrect)text('CORRECT',PAGE_W-M-48,cursor+6,6.5,true,[23,107,57]);cursor+=boxH+4;
    }
    const correctOpt=correctValid?options[correct-1]:null;const label=String.fromCharCode(64+correct);const optText=String(correctOpt?.text||'').trim().replace(new RegExp('^Option\\s*'+label+'\\s*[-:.)]?\\s*','i'),'').trim();const ans='Correct answer: '+(correctValid?`Option ${label}${optText?' - '+optText:''}`:'Not saved or invalid');
    const ansLines=wrap(ans,PAGE_W-2*M-18,8.7,true),ansH=10+ansLines.length*12;ensure(ansH);rect(M,cursor,PAGE_W-2*M,ansH,[237,249,240],[41,146,84]);cursor+=5;paragraph(ans,M+8,PAGE_W-2*M-16,8.7,true,[22,77,46],12);cursor+=4;
   }
   ensure(18);line(M,cursor,PAGE_W-M,cursor,[230,236,243],.5);cursor+=5;text('EXPLANATION',M,cursor,8.5,true,[123,86,16]);cursor+=12;
   const explanation=String(q.explanation_text||q.explanation||'').trim();
   if(explanation)paragraph(explanation,M,PAGE_W-2*M,8.7,false,[79,68,43],12);
   else paragraph('No explanation has been saved for this question.',M,PAGE_W-2*M,8.2,false,[121,135,151],11);
   if(explanationImage){const size=hoaV70PdfImageSize(explanationImage,PAGE_W-2*M-12,150);ensure(size.h+8);const h=drawImage(explanationImage,M+6,cursor,PAGE_W-2*M-12,150);cursor+=h+7;}
   cursor+=9;line(M,cursor,PAGE_W-M,cursor,[217,228,239],.6);cursor+=13;
  }
  if(imageMissing){ensure(20);paragraph(`Note: ${imageMissing} question/option/explanation image(s) could not be embedded. Their accompanying text remains included.`,M,PAGE_W-2*M,7.5,false,[121,91,37],10);}
  for(let i=0;i<pages.length;i++){
   const p=pages[i];p.ops.push(`0.843 0.886 0.933 RG 0.5 w 42 29 m 553 29 l S`);
   p.ops.push(`0.357 0.435 0.510 rg BT /F1 7 Tf 1 0 0 1 42 16 Tm ${hoaV70PdfLiteral('HUB OF ASPIRANTS | ADMIN COPY - ANSWERS & EXPLANATIONS')} Tj ET`);
   const pageLabel=`Page ${i+1} of ${pages.length}`;p.ops.push(`0.357 0.435 0.510 rg BT /F1 7 Tf 1 0 0 1 ${(PAGE_W-M-45).toFixed(2)} 16 Tm ${hoaV70PdfLiteral(pageLabel)} Tj ET`);
  }
  const pdfBlob=hoaV70BuildPdfBlob(pages,assets,{title:title+' - Questions, Correct Answers and Explanations'});
  if(!pdfBlob||pdfBlob.size<1000)throw new Error('PDF generation produced an unexpectedly small file. No download was started.');
  const filename=`HOA_${hoaV70PdfSlug(title)}_Questions_Answers_Explanations_${new Date().toISOString().slice(0,10)}.pdf`;
  if(window.__hoaPdfBlobHook)window.__hoaPdfBlobHook(pdfBlob,filename);const url=URL.createObjectURL(pdfBlob);const anchor=document.createElement('a');anchor.href=url;anchor.download=filename;anchor.style.display='none';document.body.appendChild(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
  if(status){status.textContent=`PDF downloaded (${pages.length} page${pages.length===1?'':'s'}).${imageMissing?' Some images could not be embedded; see PDF note.':''}`;status.classList.remove('error');}
 }catch(e){
  console.error('[HOA PDF Export] Failed:',e);
  if(status){status.textContent='PDF download failed: '+String(e?.message||e);status.classList.add('error');}
  else alert('PDF download failed: '+String(e?.message||e));
 }finally{if(button){button.disabled=false;button.textContent=oldLabel;}}
}

function hoaV70BindPreviewActions(m,item){
 const pdfButton=m.querySelector('#hoaV70OpenPdfPreview');
 if(pdfButton)pdfButton.onclick=async()=>{
   const candidate=hoaV70SafePreviewUrl(item.file_url)||hoaV70SafePreviewUrl(item.url)||'';
   if(!candidate){hoaV70PreviewSetStatus(m.querySelector('.hoa-v70-pdf-preview'),'No valid PDF or note URL is attached.',true);return;}
   pdfButton.disabled=true;const old=pdfButton.textContent;pdfButton.textContent='OPENING…';
   try{
     const src=await hoaV70ResolveFreeContentUrl(candidate);
     const viewer=window.HOAPDFViewer;
     if(viewer&&typeof viewer.open==='function'&&(!viewer.isPdfUrl||viewer.isPdfUrl(src)))await viewer.open(src,item.title||'Study Note',{allowDownload:true});
     else {const w=window.open(src,'_blank','noopener');if(!w)throw new Error('The browser blocked the document window. Allow pop-ups for this site and try again.');}
   }catch(e){
     const status=m.querySelector('.hoa-v70-pdf-preview');
     if(status){let err=status.querySelector('[data-preview-error]');if(!err){err=document.createElement('p');err.dataset.previewError='1';status.appendChild(err);}err.textContent='Could not open the built-in PDF viewer: '+String(e?.message||e);}
   }finally{pdfButton.disabled=false;pdfButton.textContent=old;}
 };
 const fileButton=m.querySelector('#hoaV70OpenFilePreview');
 if(fileButton)fileButton.onclick=async()=>{
  const candidate=hoaV70SafePreviewUrl(item.file_url)||'';if(!candidate)return;
  fileButton.disabled=true;const old=fileButton.textContent;fileButton.textContent='OPENING…';
  try{const src=await hoaV70ResolveFreeContentUrl(candidate);const w=window.open(src,'_blank','noopener');if(!w)throw new Error('The browser blocked the document window. Allow pop-ups for this site and try again.');}
  catch(e){const host=m.querySelector('.hoa-v70-preview-test');hoaV70PreviewSetStatus(host,'Could not open the attached resource. Check the file and Admin permissions.',true);}
  finally{fileButton.disabled=false;fileButton.textContent=old;}
 };
 const testButton=m.querySelector('#hoaV70LoadTestPreview');
 if(testButton)testButton.onclick=async()=>{testButton.disabled=true;testButton.textContent='LOADING…';try{await hoaV70RenderTestQuestionsPreview(item);}catch(e){const host=m.querySelector('#hoaV70TestPreviewQuestions');hoaV70PreviewSetStatus(host,'Mock Test preview failed: '+String(e?.message||e),true);}finally{testButton.disabled=false;testButton.textContent='REFRESH MOCK TEST PREVIEW';}};
}
function hoaV70ShowPreview(x,title='Preview',contextLabel='FREE CONTENT PREVIEW'){
 let m=document.getElementById('hoaV70PreviewModal');
 if(!m){m=document.createElement('div');m.id='hoaV70PreviewModal';m.className='hoa-v70-preview-modal';m.setAttribute('role','presentation');document.body.appendChild(m)}
 m.innerHTML=`<div class="hoa-v70-preview-dialog" role="dialog" aria-modal="true" aria-labelledby="hoaV70PreviewTitle"><div class="hoa-v70-preview-head"><div><span>${esc(contextLabel)}</span><h2 id="hoaV70PreviewTitle">${esc(title)}</h2></div><button type="button" aria-label="Close preview" title="Close preview">×</button></div><div class="hoa-v70-preview-body">${hoaV70PreviewMarkup(x)}</div></div>`;
 m.classList.add('show');m.setAttribute('aria-hidden','false');
 m.querySelectorAll('video.hoa-v70-preview-video-file').forEach(function(video){
   const disable=function(){try{for(let i=0;i<video.textTracks.length;i++)video.textTracks[i].mode='disabled';}catch(_){}};
   disable();['loadedmetadata','loadeddata','play','playing'].forEach(function(ev){video.addEventListener(ev,disable)});
   try{if(video.textTracks&&video.textTracks.addEventListener)video.textTracks.addEventListener('addtrack',disable)}catch(_){}
 });
 m.querySelector('.hoa-v70-preview-head button').onclick=()=>window.hoaV70ClosePreview();
 hoaV70BindPreviewActions(m,x);
 m.onclick=e=>{if(e.target===m)window.hoaV70ClosePreview();};
 if(String(x.content_type||'').toLowerCase()==='test'){
   const b=m.querySelector('#hoaV70LoadTestPreview');if(b)b.click();
 }
}
window.hoaV70ClosePreview=()=>{const m=document.getElementById('hoaV70PreviewModal');if(m){m.querySelectorAll('iframe').forEach(function(frame){try{frame.src='about:blank'}catch(_){}});m.querySelectorAll('video').forEach(function(video){try{video.pause();for(let i=0;i<video.textTracks.length;i++)video.textTracks[i].mode='disabled';video.removeAttribute('src');video.querySelectorAll('source').forEach(function(source){source.removeAttribute('src')});video.load()}catch(_){}});m.classList.remove('show');m.setAttribute('aria-hidden','true');}};
window.hoaV70PreviewContent=async id=>{
 try{
   const items=await rpc('hoa_admin_free_content_list'),x=(items||[]).find(i=>String(i.id)===String(id));
   if(!x)throw new Error('This Free Content item was not returned by the Admin Content Library. Refresh the list and try again.');
   let preview={...x};
   if(preview.content_type==='test'&&preview.test_id){
     const c=window.supabaseClient||window.supabase;
     if(c){const tr=await c.from('tests').select('title,description,duration_minutes,test_type').eq('id',preview.test_id).maybeSingle();if(!tr.error&&tr.data){preview.test_title=tr.data.title;preview.test_description=tr.data.description;preview.test_duration_minutes=tr.data.duration_minutes;preview.test_type=tr.data.test_type;}}
   }
   preview=await hoaV70PreparePreviewItem(preview);
   hoaV70ShowPreview(preview,'Saved Content Preview');
 }catch(e){const msg=document.getElementById('hoaV70AdminMsg');if(msg){msg.textContent='Preview failed: '+String(e?.message||e);msg.style.color='#b42318';}else alert('Preview failed: '+String(e?.message||e));}
};
window.hoaV70PreviewPaidMockTest=async testId=>{
 try{
  const c=window.supabaseClient||window.supabase;
  if(!c?.from)throw new Error('Supabase is not ready. Refresh the Admin page and try again.');
  if(typeof window.hoaRequireAdminPermission==='function')await window.hoaRequireAdminPermission('tests.view','tests.manage','admin.manage');
  const r=await c.from('tests').select('id,title,description,duration_minutes,marks_per_question,negative_marking,test_type,access_type,is_published').eq('id',testId).maybeSingle();
  if(r.error)throw r.error;
  if(!r.data)throw new Error('The selected Mock Test could not be found or your Admin role cannot view it.');
  if(String(r.data.access_type||'').toLowerCase()!=='paid')throw new Error('This preview is only for Paid Mock Tests. Manage free distribution from Free Content.');
  const t=r.data;
  const preview={content_type:'test',test_id:t.id,title:t.title,description:t.description||'',is_published:!!t.is_published,category:'Paid Mock Tests',test_title:t.title,test_description:t.description||'',test_duration_minutes:t.duration_minutes,test_type:t.test_type};
  hoaV70ShowPreview(preview,'Paid Mock Test Preview','PAID MOCK TEST PREVIEW');
 }catch(e){console.error('[HOA paid mock preview]',e);const msg=document.getElementById('hoa85TestMsg');if(msg){msg.textContent='Preview failed: '+String(e?.message||e);msg.classList.add('error');}else alert('Preview failed: '+String(e?.message||e));}
};
window.hoaV70PreviewStudyNote=async noteId=>{
 try{
  const c=window.supabaseClient||window.supabase;
  if(!c?.from||!c?.storage)throw new Error('Supabase is not ready. Refresh the Admin page and try again.');
  if(typeof window.hoaRequireAdminPermission==='function')await window.hoaRequireAdminPermission('notes.view','notes.manage','admin.manage');
  const r=await c.from('exam_notes').select('id,title,subject,exam,description,storage_path,file_name,mime_type,is_published').eq('id',noteId).maybeSingle();
  if(r.error)throw r.error;
  if(!r.data)throw new Error('The selected Study Note could not be found or your Admin role cannot view it.');
  const n=r.data;
  if(!String(n.storage_path||'').trim())throw new Error('This note does not have a storage path. Edit the note record and attach its PDF before previewing.');
  const signed=await c.storage.from('exam-notes').createSignedUrl(n.storage_path,600);
  if(signed.error)throw signed.error;
  const meta=[n.subject,n.exam,n.file_name].filter(v=>String(v||'').trim()).join(' · ');
  const preview={content_type:'note',title:n.title||n.file_name||'Study Note',description:[n.description,meta].filter(v=>String(v||'').trim()).join('\n\n'),file_url:signed.data?.signedUrl||'',url:'',is_published:!!n.is_published,category:meta};
  if(!preview.file_url)throw new Error('Could not generate a secure preview URL for this note.');
  hoaV70ShowPreview(preview,'Study Note Preview','NOTES / STUDY MATERIAL PREVIEW');
 }catch(e){console.error('[HOA study note preview]',e);const msg=document.getElementById('hoaNoteStatusMsg');if(msg){msg.textContent='Preview failed: '+String(e?.message||e);msg.style.color='#b42318';}else alert('Preview failed: '+String(e?.message||e));}
};
window.hoaV70PreviewDraft=async()=>{const x=hoaV70GetContentForm();const problem=hoaV70ValidateContent(x);if(problem){document.getElementById('hoaV70AdminMsg').textContent=problem;return}const t=document.getElementById('hoaV70AdminTest');x.test_title=t?.selectedOptions?.[0]?.textContent||'';try{const preview=await hoaV70PreparePreviewItem(x);hoaV70ShowPreview(preview,'Draft Preview')}catch(e){document.getElementById('hoaV70AdminMsg').textContent='Preview failed: '+String(e?.message||e)}};
window.hoaV70DeleteContent=async id=>{if(!confirm('Delete this Free Content item?'))return;try{if(typeof window.hoaRequireAdminPermission!=="function")throw new Error('Admin permission service is not available.');const items=await rpc('hoa_admin_free_content_list');const x=(items||[]).find(i=>String(i.id)===String(id));if(!x)throw new Error('Free Content item not found or not visible to this Admin.');if(x.content_type==='test')await window.hoaRequireAdminPermission('tests.manage');else if(x.content_type==='video')await window.hoaRequireAdminPermission('classes.manage');else if(x.content_type==='note')await window.hoaRequireAdminPermission('notes.manage');else await window.hoaRequireAdminPermission('tests.manage','classes.manage','notes.manage');await rpc('hoa_admin_free_content_delete',{p_id:id});await loadAdmin()}catch(e){alert('Delete failed: '+(e.message||e))}};


function addResultButtons(){const panel=document.getElementById('testWiseResultPanel');if(!panel)return;if(!document.getElementById('hoaV70TopN')){const bar=panel.querySelector('.testWiseToolbar');if(bar){const n=document.createElement('select');n.id='hoaV70TopN';n.innerHTML='<option value="10">Top 10</option><option value="20">Top 20</option><option value="50">Top 50</option><option value="all">Complete</option>';bar.appendChild(n);const b=document.createElement('button');b.className='btn';b.textContent='⬇ Topper PDF';b.onclick=()=>hoaV70PrintTestWise(true);bar.appendChild(b);const c=document.createElement('button');c.className='btn';c.textContent='⬇ Complete PDF';c.onclick=()=>hoaV70PrintTestWise(false);bar.appendChild(c)}}}
function printWindow(title,body){const w=window.open('','_blank','width=1000,height=800');if(!w)return;w.document.write(`<html><head><title>${esc(title)}</title>


</head><body>${body}




<!-- HOA V6.1.6 — STUDENT MOCK TEST QUESTION VISIBILITY FIX
     Root cause: student_questions was a security_invoker view over the RLS-protected questions table,
     causing authenticated students to receive zero question rows. The existing view has been corrected
     in Supabase to enforce the same published-test/direct-test/batch-test access rules while exposing only
     student-safe question columns. No new table, RPC, or schema architecture was introduced.
     Frontend remains compatible with the existing student_questions contract.
-->

\n\n




<script id="hoa-phone-nav-progress-v6">
(function(){
  function sync(){
    var src=document.getElementById("questionNo");
    var out=document.getElementById("hoaPhoneNavCount");
    if(!src || !out) return;
    var m=(src.textContent||"").match(/(?:Question\s*)?(\d+)\s*(?:of|\/)\s*(\d+)/i);
    if(m) out.textContent=m[1]+" / "+m[2];
  }
  function boot(){
    sync();
    var src=document.getElementById("questionNo");
    if(src){
      new MutationObserver(sync).observe(src,{childList:true,subtree:true,characterData:true});
    }
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot,{once:true});
  else boot();
})();
<\/script>
</body></html>`);w.document.close();w.focus();setTimeout(()=>w.print(),300)}





window.hoaV70PrintFreeResults=async function(){try{const rows=await rpc('hoa_admin_free_test_results');if(!rows?.length){alert('No Free Test results available.');return}const body=`<h1>HUB OF ASPIRANTS</h1><h2>Free Test Results</h2><table><thead><tr><th>Rank</th><th>Name</th><th>Mobile</th><th>College</th><th>Test</th><th>Score</th><th>%</th><th>Pass Out</th></tr></thead><tbody>${rows.map((x,i)=>`<tr><td>${i+1}</td><td>${esc(x.full_name)}</td><td>${esc(x.mobile)}</td><td>${esc(x.college_name)}</td><td>${esc(x.test_title)}</td><td>${Number(x.score||0).toFixed(2)}</td><td>${Number(x.percentage||0).toFixed(2)}%</td><td>${x.passout_year}</td></tr>`).join('')}</tbody></table>`;printWindow('HOA Free Test Results',body)}catch(e){alert('Could not generate result PDF: '+(e.message||e))}};
window.hoaV70PrintTestWise=function(topOnly){const key=document.getElementById('testWiseTestSelect')?.value||'';if(!key){alert('Select a test first.');return}let rows=resultRows.filter(r=>String(r.testId||r.title||'')===key);rows.sort((a,b)=>pct(b)-pct(a));const n=document.getElementById('hoaV70TopN')?.value||'10';if(topOnly&&n!=='all')rows=rows.slice(0,Number(n));if(!rows.length){alert('No results for this test.');return}const title=rows[0].title||'Test Result';const body=`<h1>HUB OF ASPIRANTS</h1><h2>${esc(title)}</h2><p>Result / ${topOnly?'Topper List':'Complete Result'}</p><table><thead><tr><th>Rank</th><th>Candidate</th><th>Email</th><th>Score</th><th>Percentage</th></tr></thead><tbody>${rows.map((r,i)=>`<tr><td>${i+1}</td><td>${esc(r.userName||'Candidate')}</td><td>${esc(r.email||'')}</td><td>${score(r).toFixed(2)} / ${maxMarks(r).toFixed(2)}</td><td>${pct(r).toFixed(2)}%</td></tr>`).join('')}</tbody></table>`;printWindow(title,body)};

function enhanceTestWise(){addResultButtons();const old=window.renderTestWiseResults;window.renderTestWiseResults=function(){if(typeof old==='function')old();const box=document.getElementById('testWiseTable');const key=document.getElementById('testWiseTestSelect')?.value||'';if(!box||!key)return;let rows=resultRows.filter(r=>String(r.testId||r.title||'')===key);const date=document.getElementById('testWiseDate')?.value||'';if(date)rows=rows.filter(r=>String(r.date||'').slice(0,10)===date);rows.sort((a,b)=>pct(b)-pct(a));if(!rows.length)return;box.querySelector('tbody')?.replaceChildren(...rows.map((r,i)=>{const tr=document.createElement('tr');tr.innerHTML=`<td>${i+1}</td><td>${esc(r.userName||'Candidate')}</td><td>${esc(r.email||'')}</td><td><b>${score(r).toFixed(2)}</b> / ${maxMarks(r).toFixed(2)}</td><td>${pct(r).toFixed(2)}%</td>`;return tr}))};}

function addAdminProgress(){const panel=document.getElementById('adminSectionResultPanel');if(!panel||document.getElementById('hoaV70AdminProgress'))return;const d=document.createElement('div');d.id='hoaV70AdminProgress';d.className='testWisePanel';d.style.marginTop='14px';d.innerHTML='<h3 style="margin:0">📈 Student Progress</h3><p class="hoa-v70-mini">Select a student to view attempt history and performance.</p><div class="testWiseToolbar"><select id="hoaV70ProgressStudent"><option value="">Select Student</option></select></div><div id="hoaV70ProgressBody"></div>';panel.querySelector('.dashPanel')?.appendChild(d)}
function renderAdminProgress(){addAdminProgress();const sel=document.getElementById('hoaV70ProgressStudent'),body=document.getElementById('hoaV70ProgressBody');if(!sel||!body)return;const map=new Map();resultRows.forEach(r=>{const id=r.userId||r.student_id;if(id&&!map.has(id))map.set(id,r.userName||r.name||'Candidate')});const cur=sel.value;sel.innerHTML='<option value="">Select Student</option>'+[...map.entries()].sort((a,b)=>a[1].localeCompare(b[1])).map(([id,n])=>`<option value="${esc(id)}">${esc(n)}</option>`).join('');if(cur)sel.value=cur;const id=sel.value;if(!id){body.innerHTML='';return}const rows=resultRows.filter(r=>String(r.userId||r.student_id)===String(id)&&r.status==='completed').sort((a,b)=>new Date(a.date)-new Date(b.date));const ps=rows.map(pct);const avg=ps.length?ps.reduce((a,b)=>a+b,0)/ps.length:0;const best=ps.length?Math.max(...ps):0;body.innerHTML=`<div class="hoa-v70-stat-grid"><div class="hoa-v70-stat"><b>${rows.length}</b>Attempts</div><div class="hoa-v70-stat"><b>${best.toFixed(1)}%</b>Best</div><div class="hoa-v70-stat"><b>${avg.toFixed(1)}%</b>Average</div></div>${rows.length?`<table class="hoa-v70-table"><thead><tr><th>Date</th><th>Test</th><th>Score</th><th>Percentage</th><th>Time</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(formatAdminDate(r.date))}</td><td>${esc(r.title)}</td><td>${score(r).toFixed(2)} / ${maxMarks(r).toFixed(2)}</td><td>${pct(r).toFixed(2)}%</td><td>${esc(formatAdminTime(r.timeTaken))}</td></tr>`).join('')}</tbody></table>`:'<div class="emptyState">No completed attempts.</div>'}`}

const oldShow=window.showAdminSection;window.showAdminSection=async function(section){ensureAdminPanel();const p=document.getElementById('adminSectionFreeContentPanel');if(p){p.classList.toggle('active',section==='freecontent');p.style.display=section==='freecontent'?'block':'none'}if(section==='freecontent'){document.querySelectorAll('.adminSectionPanel').forEach(x=>{if(x.id!=='adminSectionFreeContentPanel')x.classList.remove('active')});document.querySelectorAll('.adminSectionNav button').forEach(x=>x.classList.remove('active'));document.getElementById('adminNavFreeContent')?.classList.add('active');return typeof window.hoaV70LoadAdmin==='function'?window.hoaV70LoadAdmin():loadAdmin()}const out=oldShow?await oldShow(section):undefined;if(section==='result'){addAdminProgress();setTimeout(renderAdminProgress,0)}return out};


const oldAdminAttempt=window.viewAdminAttempt;
window.viewAdminAttempt=async function(index){try{const r=(window.__adminFilteredResults||[])[index];if(r&&r.id&&typeof supabaseClient!=='undefined'&&supabaseClient){const a=await supabaseClient.from('attempts').select('question_snapshot,scoring_snapshot').eq('id',r.id).maybeSingle();if(a.data?.question_snapshot){r.questions=a.data.question_snapshot;r.scoring_snapshot=a.data.scoring_snapshot||null;saveHistoricalAttemptDetail(r.id,{questions:a.data.question_snapshot,answers:r.answers||[],testTitle:r.title,testId:r.testId,marksPerCorrect:r.marks,negativeMarks:r.negativeMarks,maxMarks:r.maxMarks});}}}catch(e){console.warn('Snapshot read fallback:',e)}return oldAdminAttempt?oldAdminAttempt(index):undefined};
// Improve authoritative Admin result loader with snapshot-aware data and explicit status.
const oldLoadAdminResults=window.loadAdminResultsFromSupabase;window.loadAdminResultsFromSupabase=async function(){const r=oldLoadAdminResults?await oldLoadAdminResults():[];try{(r||[]).forEach(x=>{if(x.question_snapshot&&!x.questions)x.questions=x.question_snapshot;});}catch(_){}return r};


window.hoaV70Boot=function(){ensureAdminPanel();enhanceTestWise();if(typeof window.hoaAddStudentProgress==='function')window.hoaAddStudentProgress()};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',window.hoaV70Boot);else setTimeout(window.hoaV70Boot,0);
setTimeout(()=>{try{ensureAdminPanel();enhanceTestWise()}catch(_){}},1500);
})();

/* ===== Original inline script 40 ===== */
window.__HOA_FREE_CONTENT_INIT?.();

/* ===== Original inline script 41 ===== */
window.__HOA_CONSOLIDATION_LEGACY_INIT?.();

/* ===== Original inline script 42 ===== */
(function(){
'use strict';
/* P39: Free Student credentials are independent of Paid Student/Admin auth. */
const FREE_TOKEN_KEY616='hoa_free_access_token';
const FREE_TOKEN_SESSION_KEY616='hoa_free_access_token_session_backup';
const FREE_TOKEN_RECORD_KEY616='hoa_free_access_session_v1';
function isFreeToken616(value){return typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.trim())}
function readFreeRecord616(store){try{const raw=store.getItem(FREE_TOKEN_RECORD_KEY616);if(!raw)return null;const v=JSON.parse(raw);if(v&&isFreeToken616(v.token)&&Number.isFinite(Number(v.updated_at)))return {token:String(v.token).trim(),updated_at:Number(v.updated_at)};}catch(_){}return null}
function savedFreeToken616(){
  const memory=String(window.__HOA_FREE_ACCESS_TOKEN||'').trim();
  if(isFreeToken616(memory))return memory;
  let localRecord=null,sessionRecord=null,localToken='',sessionToken='';
  try{localRecord=readFreeRecord616(localStorage);localToken=String(localStorage.getItem(FREE_TOKEN_KEY616)||'').trim()}catch(_){}
  try{sessionRecord=readFreeRecord616(sessionStorage);sessionToken=String(sessionStorage.getItem(FREE_TOKEN_SESSION_KEY616)||'').trim()}catch(_){}
  const records=[localRecord,sessionRecord].filter(Boolean).sort((a,b)=>b.updated_at-a.updated_at);
  let token='';
  if(records.length)token=records[0].token;
  else if(isFreeToken616(localToken))token=localToken;
  else if(isFreeToken616(sessionToken))token=sessionToken;
  if(token)window.__HOA_FREE_ACCESS_TOKEN=token;
  if(localToken&&sessionToken&&localToken!==sessionToken&&!records.length)console.warn('[HOA Free Student] Legacy token copies differ; the server will replace the stored token with the account matching the entered mobile number.');
  return token;
}
function ensureFreeTokenStorage616(){
  const probe='hoa_free_storage_probe_'+Date.now();
  try{localStorage.setItem(probe,'1');if(localStorage.getItem(probe)!=='1')throw new Error('Local storage verification failed');localStorage.removeItem(probe);return 'localStorage'}catch(_){}
  try{sessionStorage.setItem(probe,'1');if(sessionStorage.getItem(probe)!=='1')throw new Error('Session storage verification failed');sessionStorage.removeItem(probe);return 'sessionStorage'}catch(_){}
  throw new Error('This browser is blocking site storage. Enable storage for HUB OF ASPIRANTS before registering, otherwise the account could be created without a saved access session.');
}
function persistFreeTokenValue616(token){
  token=String(token||'').trim();
  if(!isFreeToken616(token))throw new Error('The server did not return a valid Free Student access token. Do not register again if the account may already have been created; contact HUB OF ASPIRANTS support.');
  const record=JSON.stringify({version:1,token,updated_at:Date.now()});
  window.__HOA_FREE_ACCESS_TOKEN=token;
  let stored=false;
  try{localStorage.setItem(FREE_TOKEN_KEY616,token);localStorage.setItem(FREE_TOKEN_RECORD_KEY616,record);if(localStorage.getItem(FREE_TOKEN_KEY616)===token)stored=true;}catch(_){}
  try{sessionStorage.setItem(FREE_TOKEN_SESSION_KEY616,token);sessionStorage.setItem(FREE_TOKEN_RECORD_KEY616,record);if(sessionStorage.getItem(FREE_TOKEN_SESSION_KEY616)===token)stored=true;}catch(_){}
  if(!stored)throw new Error('The registration request may already have created your Free Student account, but this browser could not save its access session. Keep this tab open and contact HUB OF ASPIRANTS support; do not register again.');
  return token;
}
function clearFreeToken616(){
  window.__HOA_FREE_ACCESS_TOKEN='';
  let failed=false;
  try{[FREE_TOKEN_KEY616,FREE_TOKEN_RECORD_KEY616].forEach(key=>localStorage.removeItem(key));[FREE_TOKEN_KEY616,FREE_TOKEN_RECORD_KEY616].forEach(key=>{if(localStorage.getItem(key)!==null)failed=true});}catch(_){failed=true}
  try{[FREE_TOKEN_SESSION_KEY616,FREE_TOKEN_RECORD_KEY616].forEach(key=>sessionStorage.removeItem(key));[FREE_TOKEN_SESSION_KEY616,FREE_TOKEN_RECORD_KEY616].forEach(key=>{if(sessionStorage.getItem(key)!==null)failed=true});}catch(_){failed=true}
  return !failed;
}
window.hoaGetFreeAccessToken=savedFreeToken616;
window.hoaEnsureFreeTokenStorage=ensureFreeTokenStorage616;
window.hoaSetFreeAccessToken=persistFreeTokenValue616;
window.hoaClearFreeAccessToken=clearFreeToken616;
window.addEventListener('storage',function(event){
  if(event&&event.storageArea===localStorage&&(event.key===FREE_TOKEN_KEY616||event.key===FREE_TOKEN_RECORD_KEY616)){
    if(event.key===FREE_TOKEN_KEY616&&isFreeToken616(String(event.newValue||'')))window.__HOA_FREE_ACCESS_TOKEN=String(event.newValue).trim();
    else if(event.key===FREE_TOKEN_KEY616&&event.newValue===null&&String(window.__HOA_FREE_ACCESS_TOKEN||'')===String(event.oldValue||''))window.__HOA_FREE_ACCESS_TOKEN='';
  }
});

const esc616=window.escapeHTML||function(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))};
function rpc616(name,args){
  if(!window.supabaseClient||!window.supabaseClient.rpc) return Promise.reject(new Error('Supabase is not ready. Please refresh the page.'));
  return window.supabaseClient.rpc(name,args).then(r=>{if(r.error)throw r.error;return r.data;});
}
function storeFreeAccessToken616(data){
  const row=Array.isArray(data)?data[0]:data;
  const token=typeof row?.access_token==='string'?row.access_token.trim():'';
  if(!token||token==='undefined'||token==='null'){
    throw new Error('The server did not return a valid Free Student access token. If registration may have succeeded, do not register again; contact HUB OF ASPIRANTS support.');
  }
  return persistFreeTokenValue616(token);
}
function portalUrl616(){
  const u=new URL(location.href);
  u.searchParams.delete('hoa_free_test');
  u.searchParams.delete('hoa_free_attempt');
  u.searchParams.delete('hoa_free_test_link');
  u.searchParams.delete('hoa_free_result_link');
  u.searchParams.delete('content');
  u.searchParams.set('hoa_free_page','library');
  return u.href;
}
function modal616(){return document.getElementById('hoaV648FreeContentModal');}
function openGate616(){
  const m=modal616();
  if(!m)return;
  m.classList.remove('hidden');
  document.documentElement.classList.add('hoa-free-modal-open');
  document.body.classList.add('hoa-free-modal-open');
  const title=document.getElementById('hoaV648FreeContentTitle');
  if(title)title.textContent='Free Content Access';
  const card=m.querySelector('.hoa-v648-modal-card');
  if(!card)return;
  let body=card.querySelector('#hoaV616GateBody');
  if(!body){
    body=document.createElement('div');
    body.id='hoaV616GateBody';
    const oldGrid=card.querySelector('.hoa-v648-free-grid');
    const oldP=card.querySelector('p');
    if(oldGrid)oldGrid.remove();
    if(oldP)oldP.remove();
    const close=card.querySelector('.hoa-v648-modal-close');
    if(close&&close.nextSibling)card.insertBefore(body,close.nextSibling);else card.appendChild(body);
  }
  body.innerHTML=`
    <p class="hoa-v616-intro">Enter your mobile number to access Free Content. Your number is checked only against the Free Student database.</p>
    <form id="hoaV616GateForm" novalidate>
      <div class="hoa-v616-field">
        <label for="hoaV616Mobile">Mobile Number <span>*</span></label>
        <input id="hoaV616Mobile" type="tel" inputmode="numeric" autocomplete="tel" maxlength="10" placeholder="Enter 10-digit mobile number" required>
      </div>
      <div id="hoaV616RegisterFields" hidden>
        <div class="hoa-v616-divider"></div>
        <p class="hoa-v616-note">This number is not registered. Complete the following details to create your Free Student profile.</p>
        <div class="hoa-v616-grid">
          <div class="hoa-v616-field"><label for="hoaV616Name">Full Name <span>*</span></label><input id="hoaV616Name" maxlength="100" autocomplete="name"></div>
          <div class="hoa-v616-field"><label for="hoaV616Email">Email <span>*</span></label><input id="hoaV616Email" type="email" maxlength="254" autocomplete="email"></div>
          <div class="hoa-v616-field"><label for="hoaV616Preparing">Preparing For <span>*</span></label><input id="hoaV616Preparing" maxlength="150"></div>
          <div class="hoa-v616-field"><label for="hoaV616College">College <span>*</span></label><input id="hoaV616College" maxlength="200" autocomplete="organization" placeholder="Enter your college name"></div>
          <div class="hoa-v616-field hoa-v616-wide"><label for="hoaV616PassoutYear">Year of Passing <span>*</span></label><input id="hoaV616PassoutYear" type="text" inputmode="numeric" maxlength="4" pattern="[0-9]{4}" placeholder="e.g. 2024" autocomplete="off"></div>
          <div class="hoa-v616-field hoa-v616-wide"><label for="hoaV616Address">Address <span>*</span></label><textarea id="hoaV616Address" rows="3" maxlength="500"></textarea></div>
        </div>
      </div>
      <div id="hoaV616GateMsg" class="hoa-v616-msg" role="alert"></div>
      <div class="hoa-v616-actions" style="gap:10px;flex-wrap:wrap;align-items:center">
        <button type="submit" class="hoa-v616-primary" id="hoaV616Continue">CONTINUE</button>
      </div>
    </form>`;
  const form=document.getElementById('hoaV616GateForm');
  const mobile=document.getElementById('hoaV616Mobile');
  const msg=document.getElementById('hoaV616GateMsg');
  const register=document.getElementById('hoaV616RegisterFields');
  const continueBtn=document.getElementById('hoaV616Continue');
  let registration=false;
  let accessTokenForRetry='';
  const showRetryMessage616=(text)=>{
    msg.textContent=text;
    continueBtn.disabled=false;
    continueBtn.textContent='CONTINUE';
  };
  /* One access gate serves both normal Free Content entry and time-limited
     test URLs. Once a number is accepted, resume the requested test directly;
     do not render the Library first and then ask the student to select it. */
  const resumeFreeTestIntent616=()=>{
    const u=new URL(location.href);
    const shareToken=String(u.searchParams.get('hoa_free_test_link')||'').trim();
    const testId=String(u.searchParams.get('hoa_free_test')||'').trim();
    const fromLibraryTest=!!testId && ['library','test'].includes(String(u.searchParams.get('hoa_free_page')||'library'));
    if(!shareToken&&!fromLibraryTest)return false;
    u.searchParams.set('hoa_free_page','test');
    if(shareToken){
      u.searchParams.set('hoa_free_test_link',shareToken);
      u.searchParams.delete('hoa_free_test');
      u.searchParams.delete('content');
    }
    msg.textContent='Access confirmed. Opening your test…';
    continueBtn.disabled=true;continueBtn.textContent='OPENING TEST…';
    try{localStorage.removeItem('hoa_pending_free_test_link');}catch(_){ }
    window.location.assign(u.href);
    return true;
  };
  /* Validate and use the exact token returned for this mobile number. */
  const openPortal616=async(accessToken)=>{
    const token=String(accessToken||savedFreeToken616()||'').trim();
    if(!isFreeToken616(token)){showRetryMessage616('Free Student access could not be saved in this browser. Please retry; do not register again if registration may have succeeded.');return false;}
    if(resumeFreeTestIntent616())return true;
    msg.textContent='Checking your Free Student session and opening the library…';
    continueBtn.disabled=true;continueBtn.textContent='OPENING LIBRARY…';
    window.__HOA_NAVIGATION_IN_PROGRESS=true;
    try{
      let initialItems;
      try{initialItems=await rpc616('hoa_free_content_list',{p_token:token});}
      catch(checkError){
        const checkText=String(checkError?.message||checkError||'');
        if(/INVALID_FREE_ACCESS|FREE_PROFILE_VERIFICATION_REQUIRED|FREE_PROFILE_TOKEN_MOBILE_MISMATCH/i.test(checkText)){
          showRetryMessage616('Free Student access could not be opened. Your details have not been deleted. Please retry with the mobile number entered, or contact HUB OF ASPIRANTS support if the issue continues.');
          console.error('[HOA Free Student] Exact token failed library preflight.',checkError);
          return false;
        }
        throw checkError;
      }
      if(typeof window.hoaV615ShowLibrary==='function'){
        const rendered=await window.hoaV615ShowLibrary(token,initialItems);
        const portal=document.getElementById('hoaV615Portal');
        const portalMode=!!(document.body&&document.body.classList.contains('hoa-v615-free-portal'));
        if((rendered===true&&portal&&portal.querySelector('#hoa615Grid'))||(portal&&portalMode))return true;
        console.warn('[HOA Free Student] Library renderer did not expose its expected root; attempting the canonical same-tab route.');
      }
      throw new Error('The Free Content Library did not mount after the session was validated.');
    }catch(err){
      console.error('[HOA Free Student] Library transition failed after token validation.',err);
      try{
        const destination=portalUrl616();
        if(window.location.href===destination){window.location.reload();return true;}
        window.location.replace(destination);return true;
      }catch(navErr){console.error('[HOA Free Student] Canonical same-tab route failed.',navErr);}
      showRetryMessage616('Your Free Student session was validated, but the library could not be displayed. Your token has been preserved. Click CONTINUE to retry; do not register again.');
      return false;
    }finally{setTimeout(()=>{window.__HOA_NAVIGATION_IN_PROGRESS=false;},350);}
  };
  form.onsubmit=async function(e){
    e.preventDefault();
    msg.textContent='';
    const mob=(mobile.value||'').replace(/\D/g,'');
    if(!/^[6-9]\d{9}$/.test(mob)){msg.textContent='Enter a valid 10-digit Indian mobile number.';mobile.focus();return;}
    try{ensureFreeTokenStorage616();}catch(storageErr){msg.textContent=String(storageErr?.message||storageErr);continueBtn.disabled=false;continueBtn.textContent=accessTokenForRetry?'CONTINUE':(registration?'REGISTER & CONTINUE':'CONTINUE');return;}
    continueBtn.disabled=true;continueBtn.textContent=accessTokenForRetry?'CHECKING SESSION…':(registration?'REGISTERING…':'CHECKING…');
    try{
      if(accessTokenForRetry){await openPortal616(accessTokenForRetry);return;}
      if(!registration){
        const d=await rpc616('hoa_free_profile_enter',{p_mobile:mob,p_access_token:savedFreeToken616()||null});
        accessTokenForRetry=storeFreeAccessToken616(d);
        registration=false;
        await openPortal616(accessTokenForRetry);
        return;
      }
      const college=document.getElementById('hoaV616College').value.trim();
      const yearText=document.getElementById('hoaV616PassoutYear').value.trim();
      const passoutYear=Number(yearText);
      const validPassoutYear=/^\d{4}$/.test(yearText)&&passoutYear>=1950&&passoutYear<=new Date().getFullYear();
      const req={
        p_mobile:mob,
        p_full_name:document.getElementById('hoaV616Name').value.trim(),
        p_email:document.getElementById('hoaV616Email').value.trim(),
        p_preparing_for:document.getElementById('hoaV616Preparing').value.trim(),
        p_college_name:college,
        p_passout_year:validPassoutYear?passoutYear:null,
        p_address:document.getElementById('hoaV616Address').value.trim()
      };
      if(!req.p_full_name||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.p_email)||!req.p_preparing_for||college.length<2||college.length>200||!validPassoutYear||!req.p_address){
        throw new Error('Complete all required fields. Enter a valid College name and a four-digit Year of Passing between 1950 and '+new Date().getFullYear()+'.');
      }
      accessTokenForRetry=storeFreeAccessToken616(await rpc616('hoa_free_profile_enter',req));
      registration=false;
      register.hidden=true;
      await openPortal616(accessTokenForRetry);
    }catch(err){
      const text=String(err?.message||err);
      if(!registration && text.includes('REGISTRATION_REQUIRED')){
        registration=true;register.hidden=false;continueBtn.textContent='REGISTER & CONTINUE';msg.textContent='Mobile number not found. Please complete the registration details.';continueBtn.disabled=false;return;
      }
      if(/FREE_PROFILE_TOKEN_MOBILE_MISMATCH/i.test(text)){
        registration=false;register.hidden=true;
        msg.textContent='Free Student access could not be opened for this number. Please try again; no profile or test history has been deleted.';
        continueBtn.disabled=false;continueBtn.textContent='CONTINUE';return;
      }
      if(/FREE_PROFILE_VERIFICATION_REQUIRED/i.test(text)){
        registration=false;register.hidden=true;
        msg.textContent='This number already has a Free Student account, but the library could not be opened. Please retry with the same mobile number or contact HUB OF ASPIRANTS support.';
        continueBtn.disabled=false;continueBtn.textContent='CONTINUE';return;
      }
      if(/INVALID_FREE_ACCESS/i.test(text)){
        msg.textContent='The Free Student session could not be validated. Please retry with the same mobile number. Do not register again unless the page says the number is not registered.';
        continueBtn.disabled=false;continueBtn.textContent='CONTINUE';return;
      }
      if(registration&&/FREE_PROFILE_TOKEN_MOBILE_MISMATCH|FREE_PROFILE_VERIFICATION_REQUIRED/i.test(text)){
        msg.textContent='The mobile number could not be processed. Please retry, and contact HUB OF ASPIRANTS support if the problem continues. Do not register again unless the page says the number is not registered.';
        continueBtn.disabled=false;continueBtn.textContent='CONTINUE';return;
      }
      msg.textContent=text;
      continueBtn.disabled=false;
      continueBtn.textContent=accessTokenForRetry?'CONTINUE':(registration?'REGISTER & CONTINUE':'CONTINUE');
    }
  };
  mobile.addEventListener('input',()=>{mobile.value=mobile.value.replace(/\D/g,'').slice(0,10)});
  requestAnimationFrame(()=>mobile.focus({preventScroll:true}));
}
window.hoaOpenFreeContent=openGate616;
})();

/* ===== Original inline script 43 ===== */
(function(){
'use strict';
var originalGate=window.hoaOpenFreeContent;
function getModal(){return document.getElementById('hoaV648FreeContentModal');}
function forceVisible(m){
  if(!m)return false;
  if(m.parentElement!==document.body)document.body.appendChild(m);
  m.classList.remove('hidden');
  m.classList.add('hoa-v619-visible');
  m.style.setProperty('display','flex','important');
  m.style.setProperty('visibility','visible','important');
  m.style.setProperty('opacity','1','important');
  m.style.setProperty('pointer-events','auto','important');
  m.style.setProperty('z-index','2147483000','important');
  document.documentElement.classList.add('hoa-free-modal-open');
  document.body.classList.add('hoa-free-modal-open');
  return true;
}
function openCanonical(){
  var m=getModal();
  if(!m){console.error('HOA Free Content popup element not found');return false;}
  /* P36: the current site contains both the newer Free Student modal and a
     legacy student-auth screen with Student Login / Paid Register / Free Test
     tabs. Always place the homepage in its exclusive FRONT state before
     showing the Free Student gate, so the Paid Student auth shell cannot
     remain visible behind or alongside it. The gate itself stays in this tab. */
  try{
    var body=document.body;
    body.classList.remove('hoa-public-auth','hoa-student-auth','hoa-admin-auth','hoa-public-portal');
    body.classList.add('hoa-public-front');
    var currentUrl=location.pathname+location.search+location.hash;
    history.replaceState({hoaPublicPage:'front'},'',currentUrl);
  }catch(e){console.warn('[HOA Free Student] Could not normalize public view:',e);}
  try{
    if(typeof originalGate==='function'){
      originalGate();
    }
  }catch(e){console.error('Existing Free Content gate failed:',e);}
  if(!forceVisible(m))return false;
  var title=document.getElementById('hoaV648FreeContentTitle');
  if(title)title.textContent='Free Content Access';
  var mobile=document.getElementById('hoaV616Mobile');
  if(mobile)setTimeout(function(){try{mobile.focus({preventScroll:true});}catch(_){mobile.focus();}},40);
  return true;
}
window.hoaOpenFreeContent=openCanonical;
window.hoaV619OpenFreeContent=openCanonical;
function bind(){
  document.querySelectorAll('button[aria-label="Free Content"], [onclick*="hoaOpenFreeContent"]').forEach(function(el){
    if(el.dataset.hoaV619Bound==='1')return;
    el.dataset.hoaV619Bound='1';
    el.onclick=function(e){
      if(e){e.preventDefault();e.stopImmediatePropagation();}
      openCanonical();
      return false;
    };
  });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
window.addEventListener('load',bind);
})();

/* ===== Original inline script 44 ===== */
(function(){
  'use strict';
  function closeFreeGate(){
    var m=document.getElementById('hoaV648FreeContentModal');
    if(m){
      m.classList.add('hidden');
      m.classList.remove('hoa-v619-visible');
      m.classList.add('hoa-v639-closing');
      m.style.removeProperty('display');
      m.style.removeProperty('visibility');
      m.style.removeProperty('opacity');
      m.style.removeProperty('pointer-events');
      m.style.removeProperty('z-index');
      requestAnimationFrame(function(){m.classList.remove('hoa-v639-closing');});
    }
    document.documentElement.classList.remove('hoa-free-modal-open');
    document.body.classList.remove('hoa-free-modal-open');
    try{ delete document.body.dataset.hoaFreeScroll; }catch(e){}

  }

  /* Make this the final authority; earlier V6/V7/V70 scripts are allowed to
     exist for backward compatibility but cannot replace this close behavior. */
  window.hoaCloseFreeContent=closeFreeGate;
  window.hoaV619CloseFreeContent=closeFreeGate;

  function bind(){
    var m=document.getElementById('hoaV648FreeContentModal');
    if(!m)return;
    var close=m.querySelector('.hoa-v648-modal-close');
    if(close && close.dataset.hoaV639Bound!=='1'){
      close.dataset.hoaV639Bound='1';
      close.onclick=function(e){
        if(e){e.preventDefault();e.stopImmediatePropagation();}
        closeFreeGate();
        return false;
      };
    }
    var backdrop=m.querySelector('.hoa-v648-modal-backdrop');
    if(backdrop && backdrop.dataset.hoaV639Bound!=='1'){
      backdrop.dataset.hoaV639Bound='1';
      backdrop.onclick=function(e){
        if(e){e.preventDefault();e.stopImmediatePropagation();}
        closeFreeGate();
        return false;
      };
    }
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',bind,{once:true});
  else bind();
  window.addEventListener('load',bind,{once:true});
  document.addEventListener('click',function(e){
    var b=e.target && e.target.closest ? e.target.closest('#hoaV648FreeContentModal .hoa-v648-modal-close') : null;
    if(b) bind();
  },true);
})();
