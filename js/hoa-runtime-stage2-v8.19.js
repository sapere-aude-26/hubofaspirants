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
    poster:"adminSectionPosterPanel", access:"adminSectionAccessPanel", result:"adminSectionResultPanel",
    admin:"adminSectionAdminPanel"
  };
  const nav={
    master:"adminNavMaster", student:"adminNavStudent", test:"adminNavTest",
    course:"adminNavCourse", video:"adminNavVideo", notes:"adminNavNotes",
    poster:"adminNavPoster", access:"adminNavAccess", result:"adminNavResult", admin:"adminNavAdmin"
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
        if(typeof window.loadStudentsFromSupabase==="function") await window.loadStudentsFromSupabase();
        if(typeof window.renderAdminStudents==="function") window.renderAdminStudents();
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
      if(section==="access"){
        if(typeof window.hoaLoadAccess==="function") await window.hoaLoadAccess();
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
    m.classList.add('hidden');
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
function getToken(){return localStorage.getItem('hoa_free_access_token')||''}
function setToken(t){localStorage.setItem('hoa_free_access_token',t)}

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
    await rpc('hoa_admin_free_student_delete',{p_id:id});
    if(msg)msg.textContent='Free Student deleted successfully.';
    await loadAdmin();
  }catch(e){
    if(msg)msg.textContent='Unable to delete Free Student: '+String(e?.message||e);
  }
}
async function loadAdmin(){const staticPanel=document.querySelector('#adminSectionFreeContentPanel[data-hoa-free-static="1"]');if(staticPanel&&typeof window.hoaV70LoadAdmin==='function'&&window.hoaV70LoadAdmin!==loadAdmin){return window.hoaV70LoadAdmin()}const p=ensureAdminPanel();if(!p||(typeof adminLoggedIn==='undefined'||adminLoggedIn!==true))return;try{const items=await rpc('hoa_admin_free_content_list');const sel=document.getElementById('hoaV70AdminTest');const ts=await supabaseClient.from('tests').select('id,title').order('created_at',{ascending:false});sel.innerHTML='<option value="">None</option>'+(ts.data||[]).map(t=>`<option value="${t.id}">${esc(t.title)}</option>`).join('');document.getElementById('hoaV70FreeCount').textContent=(items||[]).length;document.getElementById('hoaV70AdminList').innerHTML=(items||[]).length?`<table class="hoa-v70-table"><thead><tr><th>Title</th><th>Type</th><th>Published</th><th>Action</th></tr></thead><tbody>${items.map(x=>`<tr><td>${esc(x.title)}</td><td>${esc(x.content_type)}</td><td>${x.is_published?'YES':'NO'}</td><td><div class="hoa-v70-row-actions"><button class="secondary" onclick="hoaV70PreviewContent('${x.id}')">Preview</button><button class="secondary" onclick="hoaV70EditContent('${x.id}')">Edit</button><button class="secondary hoa-v70-danger" onclick="hoaV70DeleteContent('${x.id}')">Delete</button></div></td></tr>`).join('')}</tbody></table>`:'<div class="emptyState">No Free Content created.</div>';const ps=await rpc('hoa_admin_free_student_list');document.getElementById('hoaV70Profiles').innerHTML=Array.isArray(ps)&&ps.length?`<table class="hoa-v70-table"><thead><tr><th>Name</th><th>Mobile</th><th>Email</th><th>Preparing For</th><th>College</th><th>Year</th><th>Address</th><th>Action</th></tr></thead><tbody>${ps.map(x=>`<tr><td>${esc(x.full_name)}</td><td>${esc(x.mobile)}</td><td>${esc(x.email||'')}</td><td>${esc(x.preparing_for||'')}</td><td>${esc(x.college_name||'')}</td><td>${x.passout_year||''}</td><td>${esc(x.address||'')}</td><td><button class="secondary hoa-v70-delete-student" onclick="hoaV70DeleteFreeStudent('${x.id}')">Delete</button></td></tr>`).join('')}</tbody></table>`:'<div class="emptyState">No Free Content participants.</div>';const fr=await rpc('hoa_admin_free_test_results');let frbox=document.getElementById('hoaV70FreeResults');if(!frbox){frbox=document.createElement('div');frbox.id='hoaV70FreeResults';frbox.style.marginTop='18px';document.getElementById('hoaV70Profiles').parentElement.appendChild(frbox)}frbox.innerHTML='<h3>Free Test Results</h3>'+(fr?.length?`<div class="hoa-v70-actions"><button class="secondary" onclick="hoaV70PrintFreeResults()">⬇ Download Result PDF</button></div><table class="hoa-v70-table"><thead><tr><th>Name</th><th>Mobile</th><th>Test</th><th>Score</th><th>%</th><th>Date</th></tr></thead><tbody>${fr.map(x=>`<tr><td>${esc(x.full_name)}</td><td>${esc(x.mobile)}</td><td>${esc(x.test_title)}</td><td>${Number(x.score||0).toFixed(2)}</td><td>${Number(x.percentage||0).toFixed(2)}%</td><td>${esc(formatAdminDate(x.submitted_at))}</td></tr>`).join('')}</tbody></table>`:'<div class="emptyState">No completed Free Test results.</div>')}catch(e){document.getElementById('hoaV70AdminMsg').textContent=String(e.message||e)}}
window.hoaV70LoadAdmin=loadAdmin;
document.addEventListener('change',e=>{if(e.target&&e.target.id==='hoaV70ProgressStudent')renderAdminProgress()});
function hoaV70GetContentForm(){
 return {
  id:hoaV70EditId||null,
  title:document.getElementById('hoaV70AdminTitle')?.value.trim()||'',
  description:document.getElementById('hoaV70AdminDescription')?.value.trim()||'',
  content_type:document.getElementById('hoaV70AdminType')?.value||'other',
  test_id:document.getElementById('hoaV70AdminTest')?.value||null,
  url:document.getElementById('hoaV70AdminUrl')?.value.trim()||'',
  file_url:document.getElementById('hoaV70AdminFile')?.value.trim()||'',
  thumbnail_url:document.getElementById('hoaV70AdminThumb')?.value.trim()||'',
  category:document.getElementById('hoaV70AdminCategory')?.value.trim()||'',
  is_published:!!document.getElementById('hoaV70AdminPublished')?.checked,
  sort_order:Number(document.getElementById('hoaV70AdminSort')?.value)||0
 };
}
function hoaV70UpdateContentFields(){
 const type=document.getElementById('hoaV70AdminType')?.value||'other';
 const otherKind=document.getElementById('hoaV70OtherResourceType')?.value||'pdf';
 const test=document.getElementById('hoaV70TestField'),other=document.getElementById('hoaV70OtherResourceField'),url=document.getElementById('hoaV70UrlField'),file=document.getElementById('hoaV70FileField');
 if(test)test.classList.toggle('hidden',type!=='test');
 if(other)other.classList.toggle('hidden',type!=='other');
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
 const item=hoaV70GetContentForm(),problem=hoaV70ValidateContent(item);
 if(problem){document.getElementById('hoaV70AdminMsg').textContent=problem;return}
 try{await rpc('hoa_admin_free_content_upsert',{p_item:item});document.getElementById('hoaV70AdminMsg').textContent=hoaV70EditId?'Content updated successfully.':'Content saved successfully.';hoaV70ResetContentForm();await loadAdmin()}catch(e){document.getElementById('hoaV70AdminMsg').textContent='Save failed: '+String(e?.message||e)}
};
window.hoaV70EditContent=async id=>{
 try{
  const items=await rpc('hoa_admin_free_content_list'),x=(items||[]).find(i=>String(i.id)===String(id));if(!x)return;
  hoaV70EditId=id;
  document.getElementById('hoaV70AdminTitle').value=x.title||'';
  document.getElementById('hoaV70AdminDescription').value=x.description||'';
  document.getElementById('hoaV70AdminType').value=x.content_type||'other';
  document.getElementById('hoaV70AdminTest').value=x.test_id||'';
  document.getElementById('hoaV70AdminUrl').value=x.url||'';
  document.getElementById('hoaV70AdminFile').value=x.file_url||'';
  document.getElementById('hoaV70AdminThumb').value=x.thumbnail_url||'';
  document.getElementById('hoaV70AdminCategory').value=x.category||'';
  document.getElementById('hoaV70AdminPublished').checked=!!x.is_published;
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
function hoaV70YouTubeEmbed(v){
 const u=hoaV70SafePreviewUrl(v);if(!u)return '';
 try{const x=new URL(u);let id=x.searchParams.get('v');if(!id&&x.hostname.includes('youtu.be'))id=x.pathname.slice(1).split('/')[0];if(!id&&x.pathname.includes('/embed/'))id=x.pathname.split('/embed/')[1].split('/')[0];return id?`https://www.youtube.com/embed/${encodeURIComponent(id)}`:''}catch(e){return ''}
}
function hoaV70PreviewMarkup(x){
 const type=x.content_type||'other',url=hoaV70SafePreviewUrl(x.url),file=hoaV70SafePreviewUrl(x.file_url),thumb=hoaV70SafePreviewUrl(x.thumbnail_url),yt=hoaV70YouTubeEmbed(x.url);
 let media='';
 if(type==='test') media=`<div class="hoa-v70-preview-test"><div class="hoa-v70-preview-icon">📝</div><strong>${esc(x.test_title||'Selected Free Test / Mock Test')}</strong><span>This preview shows the resource card. Students will open the linked test when they use it.</span></div>`;
 else if(type==='video'&&yt) media=`<div class="hoa-v70-preview-video"><iframe src="${esc(yt)}" title="Video preview" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
 else if(type==='video'&&file) media=`<video class="hoa-v70-preview-video-file" controls src="${esc(file)}"></video>`;
 else if((type==='pdf'||type==='note')&&file) media=`<div class="hoa-v70-preview-test hoa-v70-pdf-preview"><strong>PDF preview</strong><button class="secondary" type="button" id="hoaV70OpenPdfPreview">OPEN PDF VIEWER</button></div>`;
 else if(thumb) media=`<img class="hoa-v70-preview-image" src="${esc(thumb)}" alt="">`;
 else if(url) media=`<div class="hoa-v70-preview-link">🔗 <a href="${esc(url)}" target="_blank" rel="noopener noreferrer">Open resource link</a></div>`;
 else media=`<div class="hoa-v70-preview-empty">No media supplied. The description will be shown below.</div>`;
 return `<div class="hoa-v70-preview-card">${media}<div class="hoa-v70-preview-meta"><span>${esc(type==='test'?'Free Test / Mock Test':type==='other'?'Current Affairs / Other':type)}</span>${x.category?`<span>${esc(x.category)}</span>`:''}</div><h3>${esc(x.title||'Untitled')}</h3>${x.description?`<p>${esc(x.description)}</p>`:''}</div>`;
}
function hoaV70ShowPreview(x,title='Preview'){
 let m=document.getElementById('hoaV70PreviewModal');
 if(!m){m=document.createElement('div');m.id='hoaV70PreviewModal';m.className='hoa-v70-preview-modal';document.body.appendChild(m)}
 m.innerHTML=`<div class="hoa-v70-preview-dialog"><div class="hoa-v70-preview-head"><div><span>FREE CONTENT PREVIEW</span><h2>${esc(title)}</h2></div><button onclick="hoaV70ClosePreview()">×</button></div><div class="hoa-v70-preview-body">${hoaV70PreviewMarkup(x)}</div></div>`;
 m.classList.add('show');
}
window.hoaV70ClosePreview=()=>document.getElementById('hoaV70PreviewModal')?.classList.remove('show');
window.hoaV70PreviewContent=async id=>{try{const items=await rpc('hoa_admin_free_content_list'),x=(items||[]).find(i=>String(i.id)===String(id));if(x)hoaV70ShowPreview(x,'Saved Content Preview')}catch(e){alert('Preview failed: '+(e.message||e))}};
window.hoaV70PreviewDraft=()=>{const x=hoaV70GetContentForm();const problem=hoaV70ValidateContent(x);if(problem){document.getElementById('hoaV70AdminMsg').textContent=problem;return}const t=document.getElementById('hoaV70AdminTest');x.test_title=t?.selectedOptions?.[0]?.textContent||'';hoaV70ShowPreview(x,'Draft Preview')};
window.hoaV70DeleteContent=async id=>{if(!confirm('Delete this Free Content item?'))return;try{await rpc('hoa_admin_free_content_delete',{p_id:id});await loadAdmin()}catch(e){alert('Delete failed: '+(e.message||e))}};


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
const esc616=window.escapeHTML||function(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))};
function rpc616(name,args){
  if(!window.supabaseClient||!window.supabaseClient.rpc) return Promise.reject(new Error('Supabase is not ready. Please refresh the page.'));
  return window.supabaseClient.rpc(name,args).then(r=>{if(r.error)throw r.error;return r.data;});
}
function portalUrl616(){
  const u=new URL(location.href);
  u.searchParams.delete('hoa_free_test');
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
          <div class="hoa-v616-field hoa-v616-wide"><label for="hoaV616Address">Address <span>*</span></label><textarea id="hoaV616Address" rows="3" maxlength="500"></textarea></div>
        </div>
      </div>
      <div id="hoaV616GateMsg" class="hoa-v616-msg" role="alert"></div>
      <div class="hoa-v616-actions">
        <button type="submit" class="hoa-v616-primary" id="hoaV616Continue">CONTINUE</button>
      </div>
    </form>`;
  const form=document.getElementById('hoaV616GateForm');
  const mobile=document.getElementById('hoaV616Mobile');
  const msg=document.getElementById('hoaV616GateMsg');
  const register=document.getElementById('hoaV616RegisterFields');
  const continueBtn=document.getElementById('hoaV616Continue');
  let registration=false;
  let portalWindow=null;
  const openPortal616=()=>{ portalWindow=window.open(portalUrl616(),'_blank','noopener,noreferrer'); if(!portalWindow){msg.textContent='Please allow pop-ups for HUB OF ASPIRANTS, then click Continue again.';return false;} window.hoaCloseFreeContent?.(); return true; };
  form.onsubmit=async function(e){
    e.preventDefault();
    msg.textContent='';
    const mob=(mobile.value||'').replace(/\D/g,'');
    if(!/^[6-9]\d{9}$/.test(mob)){msg.textContent='Enter a valid 10-digit Indian mobile number.';mobile.focus();return;}
    continueBtn.disabled=true;continueBtn.textContent=registration?'REGISTERING…':'CHECKING…';
    try{
      if(!registration){
        const d=await rpc616('hoa_free_profile_enter',{p_mobile:mob});
        localStorage.setItem('hoa_free_access_token',d.access_token);
        if(!openPortal616()){continueBtn.disabled=false;continueBtn.textContent='CONTINUE';return;}
        return;
      }
      const req={
        p_mobile:mob,
        p_full_name:document.getElementById('hoaV616Name').value.trim(),
        p_email:document.getElementById('hoaV616Email').value.trim(),
        p_preparing_for:document.getElementById('hoaV616Preparing').value.trim(),
        p_address:document.getElementById('hoaV616Address').value.trim()
      };
      if(!req.p_full_name||!/^\S+@\S+\.\S+$/.test(req.p_email)||!req.p_preparing_for||!req.p_address){
        throw new Error('Please enter valid information in every required field.');
      }
      const d=await rpc616('hoa_free_profile_enter',req);
      localStorage.setItem('hoa_free_access_token',d.access_token);
      if(!openPortal616()){continueBtn.disabled=false;continueBtn.textContent='REGISTER & CONTINUE';return;}
    }catch(err){
      const text=String(err?.message||err);
      if(!registration && text.includes('REGISTRATION_REQUIRED')){
        registration=true;register.hidden=false;continueBtn.textContent='REGISTER & CONTINUE';msg.textContent='Mobile number not found. Please complete the registration details.';
        continueBtn.disabled=false;
        return;
      }
      msg.textContent=text;
      continueBtn.disabled=false;
      continueBtn.textContent=registration?'REGISTER & CONTINUE':'CONTINUE';
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
