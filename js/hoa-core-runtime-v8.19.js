/* HUB OF ASPIRANTS V8.19 CLEAN — consolidated inline runtime. Original execution order preserved: scripts 10–11. */

/* ===== Original inline script 10 ===== */
/* HUB OF ASPIRANTS V5.0 — JavaScript extracted from V4.8. */
/* Inline script blocks are preserved in their original order. */


/* ===== Original inline script 1 ===== */

/* ===== HUB OF ASPIRANTS — SUPABASE CONNECTION ===== */
async function saveTestToSupabase(t){
  if(!supabaseClient) return t.id;
  const testId=(t.id && /^[0-9a-f-]{36}$/i.test(t.id))?t.id:null;
  const qRows=(Array.isArray(t.questions)?t.questions:[]).map((q,i)=>({question_text:q[0]||"",option_1:q[1]||"",option_2:q[2]||"",option_3:q[3]||"",option_4:q[4]||"",correct_option:Number(q[5]),explanation:q[6]||"",question_order:i+1}));
  const data=await window.HOA_SERVICES.test.saveBundle({p_test_id:testId,p_title:String(t.title||"").trim(),p_description:null,p_duration_minutes:Number(t.duration),p_marks_per_question:Number(t.marks),p_negative_marking:Number(t.negative),p_is_published:Boolean(t.is_published),p_access_type:t.accessType === "free" ? "free" : "paid",p_questions:qRows});
  if(!data) throw new Error("Test save returned no test id.");
  t.id=data; t.created=t.created||new Date().toISOString(); return data;
}

async function deleteTestFromSupabase(id){
  if(!supabaseClient) return;
  return window.HOA_SERVICES.test.delete(id);
}

async function showSupabaseStatus(){
  const el=document.getElementById("fileStatus");
  if(!el || !supabaseConnected) return;
  const result=await supabaseHealthCheck();
  el.innerHTML=result.ok
    ? '<span style="color:#087443;font-weight:700">✓ Supabase connected</span>'
    : '<span style="color:#b42318;font-weight:700">✗ Supabase: '+escapeHTML(result.message)+'</span>';
}


/* ===== Original inline script 2 ===== */


async function deleteStudent(id){
  if(!requireAdmin("student deletion")) return;
  const users=getUsers();
  const user=users.find(u=>u.id===id);
  if(!user)return;

  const confirmed=confirm(
    "Confirm Delete"+
    "Student: "+user.name+""+
    "Email: "+user.email+""+
    "Mobile: "+user.mobile+""+
    "Are you sure you want to permanently delete this student?"
  );
  if(!confirmed)return;

  try{
    if(supabaseClient){
      await window.HOA_SERVICES.student.delete(id);
    }
    saveUsers(users.filter(u=>u.id!==id));
    const results=getResults().filter(r=>r.userId!==id);
    localStorage.setItem("missionTES_results_cache",JSON.stringify(results));
    renderAdminStudents();
    renderStudentDashboard();
    alert("✓ Student deleted successfully.");
  }catch(e){
    alert("Delete failed: "+supaError("student delete",e));
  }
}
function renderAdminStudents(){
  if(!adminLoggedIn || currentStudent) return;

  const paidBox=document.getElementById("paidStudentAdminList");
  const freeBox=document.getElementById("freeStudentAdminList");
  const paidCount=document.getElementById("paidCandidateCount");
  const freeCount=document.getElementById("freeCandidateCount");
  if(!paidBox || !freeBox) return;

  const users=getUsers();
  const paidUsers=users.filter(u=>u.accessType!=="free");
  const freeUsers=users.filter(u=>u.accessType==="free");

  if(paidCount) paidCount.textContent=paidUsers.length;
  if(freeCount) freeCount.textContent=freeUsers.length;

  const renderRow=(u)=>`<div class="studentAdminRow">
    <div><b>${escapeHTML(u.name)}</b><div style="font-size:11px;color:#5E7188">${escapeHTML(u.email)}${u.mobile?" · "+escapeHTML(u.mobile):""}</div><div style="font-size:11px;color:#5E7188">${escapeHTML(u.qualification||"")} · ${escapeHTML(String(u.passoutYear||""))} · ${escapeHTML(u.college||"")}</div></div>
    <div><span class="resultBadge">${escapeHTML(u.status||"Password not set")}</span><span class="statusBadge ${u.accessType==="free"?"freeBadge":"paidBadge"}">${u.accessType==="free"?"FREE":"PAID"}</span></div>
    <div>
      <input id="pw_${u.id}" type="text" placeholder="${u.passwordAssigned?"Update password":"Set password"}" value="">
      ${u.passwordAssigned?'<div style="font-size:11px;color:#087443;margin-top:4px">✓ Password is set · hidden for security</div>':""}
    </div>
    <div style="display:flex;gap:6px;flex-wrap:wrap">
      <button class="adminAction primarySmall" onclick="assignStudentPassword('${u.id}')">${u.passwordAssigned?"Update Password":"Set Password"}</button>
      <button class="adminAction" onclick="resetStudentPassword('${u.id}')">Reset Password</button>
      <button class="adminAction" onclick="toggleStudentAccess('${u.id}')">${u.accessType==="free"?"MAKE PAID":"MAKE FREE"}</button>
      <button class="adminAction" style="border-color:#efb0aa;color:#b42318" onclick="deleteStudent('${u.id}')">Delete</button>
    </div>
  </div>`;

  paidBox.innerHTML=paidUsers.length ? paidUsers.map(renderRow).join("") : '<div class="emptyState">No Paid Candidates registered yet.</div>';
  freeBox.innerHTML=freeUsers.length ? freeUsers.map(renderRow).join("") : '<div class="emptyState">No Free Test Candidates registered yet.</div>';
}
async function assignStudentPassword(id){
  if(!requireAdmin("password management")) return;
  const input=document.getElementById("pw_"+id);
  const password=(input?input.value:"").trim();
  if(password.length<6){alert("Password must be at least 6 characters.");return}
  try{
    await window.HOA_SERVICES.admin.manageCandidate({action:"set_password",student_id:id,password});
    await loadStudentsFromSupabase();
    renderAdminStudents();
    alert("Password assigned successfully. Give this password to the student.The candidate's Supabase Auth account is now active.");
  }catch(e){
    alert("Password update failed: "+supaError("password update",e));
  }
}
async function toggleStudentAccess(id){
  if(!requireAdmin("candidate access management")) return;
  const u=getUsers().find(x=>x.id===id);
  if(!u) return;
  const next=u.accessType==="free" ? "paid" : "free";
  if(next==="paid" && !u.mobile){ alert("A mobile number is required before making this candidate Paid."); return; }
  try{
    await window.HOA_SERVICES.admin.manageCandidate({action:"set_access_type",student_id:id,access_type:next});
    await loadStudentsFromSupabase();
    renderAdminStudents();
    renderStudentDashboard();
  }catch(e){ alert("Candidate access update failed: "+supaError("candidate access update",e)); }
}
async function resetStudentPassword(id){
  if(!requireAdmin("password reset")) return;
  try{
    const data=await window.HOA_SERVICES.admin.manageCandidate({action:"reset_password",student_id:id});
    await loadStudentsFromSupabase();
    renderAdminStudents();
    alert("Password reset successfully.New password: "+(data?.password||""));
  }catch(e){
    alert("Reset failed: "+supaError("password reset",e));
  }
}
async function openAdminTab(){
  if(!adminLoggedIn){
    document.getElementById("home").classList.add("hidden");
    setAuthScreenVisible(true);
    showAuth("admin");
    return;
  }
  showDashboardTab("admin");
  try{
    if(typeof window.hoaSyncAdminRole==="function") await window.hoaSyncAdminRole();
  }catch(e){}
  showAdminSection(window.hoaAdminRole==="owner"?"master":"student");
  setTimeout(function(){ if(window.hoaV643EnsureAdminModules) window.hoaV643EnsureAdminModules(); },0);
}

function showAdminSection(section){
  if(typeof window.showAdminSection === "function" && window.showAdminSection !== showAdminSection){
    return window.showAdminSection(section);
  }
  if(!adminLoggedIn){
    return;
  }
  const ids={master:"adminSectionMasterPanel",student:"adminSectionStudentPanel",test:"adminSectionTestPanel",result:"adminSectionResultPanel",admin:"adminSectionAdminPanel"};
  Object.entries(ids).forEach(([key,id])=>document.getElementById(id)?.classList.toggle("active",key===section));
  const nav={master:"adminNavMaster",student:"adminNavStudent",test:"adminNavTest",result:"adminNavResult",admin:"adminNavAdmin"};
  Object.entries(nav).forEach(([key,id])=>document.getElementById(id)?.classList.toggle("active",key===section));
}

async function loadAdminData(){
  try{
    await loadStudentsFromSupabase();
    await loadTestsFromSupabase();
    await normalizeDuplicateTestTitles();
    renderAdminStudents();
    renderLibrary();
  }catch(e){
    console.error(e);
    alert("Could not load Supabase data: "+supaError("admin data",e));
  }
}
function seedTests(){
  // Local fallback only. Supabase is the source of truth after bootstrap.
  // Storage may be unavailable in restricted/local browser contexts, so this
  // function must never throw during application boot.
  let saved=null;
  try{ saved=localStorage.getItem("missionTES_tests_cache"); }
  catch(e){ saved=null; }
  if(saved){
    try{tests=JSON.parse(saved); if(!Array.isArray(tests)||!tests.length)throw 0; return}catch(e){}
  }
  tests=[
    makeTest("Transportation Engineering — Mock Test 01", questions.slice(), 10, 1, .25),
    makeTest("Transportation Engineering — Practice Test 02", questions.slice(0,5), 5, 1, .25)
  ];
}
function saveTests(){
  try{localStorage.setItem("missionTES_tests_cache",JSON.stringify(tests));}
  catch(e){ console.warn("Local test cache unavailable; continuing with live Supabase data.",e); }
}

// Fix any duplicate test titles already present in Supabase. The first test
// keeps its original title; later duplicates receive (2), (3), etc.
async function normalizeDuplicateTestTitles(){
  if(!adminLoggedIn || !supabaseClient || !Array.isArray(tests)) return;

  const seen=new Map();
  let changed=false;

  for(const t of tests){
    const base=String(t.title||"Mock Test").trim().replace(/\s+/g," ") || "Mock Test";
    const key=base.toLowerCase();
    const count=(seen.get(key)||0)+1;
    seen.set(key,count);

    if(count===1){
      if(t.title!==base){
        t.title=base;
        try{
          await window.HOA_SERVICES.test.update(t.id,{title:base});
        }catch(e){
          console.warn("Could not normalize test title",e);
        }
        changed=true;
      }
      continue;
    }

    let suffix=count;
    let newTitle=`${base} (${suffix})`;
    while([...seen.keys()].includes(newTitle.toLowerCase())){
      suffix++;
      newTitle=`${base} (${suffix})`;
    }
    seen.set(newTitle.toLowerCase(),1);

    try{
      await window.HOA_SERVICES.test.update(t.id,{title:newTitle});
      t.title=newTitle;
      changed=true;
    }catch(e){
      console.warn("Could not rename duplicate test title",e);
    }
  }

  if(changed) saveTests();
}

function renderLibrary(){
  if(!adminLoggedIn || currentStudent) return;
  const box=document.getElementById("testLibrary");
  if(!box)return;
  if(!tests.length){box.innerHTML='<div style="color:#5E7188;font-size:13px">No tests saved yet.</div>';return}
  box.innerHTML=tests.map(t=>{
    const published=Boolean(t.is_published);
    const free=t.accessType==="free";
    return `<div class="testItem">
      <div style="min-width:0"><b>${escapeHTML(t.title)}</b><span class="statusBadge ${published?"publishedBadge":"draftBadge"}">${published?"PUBLISHED":"DRAFT"}</span><span class="statusBadge ${free?"freeBadge":"paidBadge"}">${free?"FREE":"PAID"}</span><div class="testMeta">${t.questions.length} questions · ${t.duration} min · +${t.marks} / −${t.negative}</div></div>
      <div class="actions" style="display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end">
        <button class="startSmall" onclick="startSavedTest('${t.id}')">START</button>
        <button class="secondary" onclick="toggleTestPublish('${t.id}')">${published?"UNPUBLISH":"PUBLISH"}</button>
        <button class="secondary" onclick="toggleTestAccess('${t.id}')">${free?"MAKE PAID":"MAKE FREE"}</button>
        <button class="danger" onclick="deleteTest('${t.id}')">Delete</button>
      </div>
    </div>`;
  }).join("");
}
async function updateTestSettings(id, patch){
  if(!requireAdmin("changing test settings")) return;
  const t=tests.find(x=>x.id===id); if(!t) return;
  try{
    if(supabaseClient){
      await window.HOA_SERVICES.test.update(id,patch);
    }
    Object.assign(t, patch.is_published!==undefined?{is_published:Boolean(patch.is_published)}:{}, patch.access_type!==undefined?{accessType:patch.access_type}:{}) ;
    saveTests();
    renderLibrary();
    renderStudentDashboard();
  }catch(e){
    alert("Test update failed: "+supaError("test settings",e));
  }
}
async function toggleTestPublish(id){
  const t=tests.find(x=>x.id===id); if(!t)return;
  const next=!Boolean(t.is_published);
  if(next && !t.questions.length){alert("A test must contain at least one question before it can be published.");return;}
  await updateTestSettings(id,{is_published:next});
}
async function toggleTestAccess(id){
  const t=tests.find(x=>x.id===id); if(!t)return;
  const next=t.accessType==="free"?"paid":"free";
  await updateTestSettings(id,{access_type:next});
}

function showCreator(){
  if(!requireAdmin("the CSV/Test Creator")) return;
  document.getElementById("creatorPanel").scrollIntoView({behavior:"smooth"})
}
async function deleteTest(id){
  if(!requireAdmin("test deletion")) return;
  if(!confirm("Delete this mock test?"))return;
  try{
    if(supabaseClient) await deleteTestFromSupabase(id);
    tests=tests.filter(t=>t.id!==id);saveTests();renderLibrary();renderStudentDashboard();
  }catch(e){alert("Delete failed: "+supaError("test delete",e))}
}
function resetTests(){
  if(!requireAdmin("resetting tests")) return;
  if(!confirm("Reset the test library to the sample tests?"))return;
  tests=[
    makeTest("Transportation Engineering — Mock Test 01", questions.slice(), 10, 1, .25),
    makeTest("Transportation Engineering — Practice Test 02", questions.slice(0,5), 5, 1, .25)
  ];
  saveTests();renderLibrary();
}
async function saveCurrentAsTest(){
  if(!requireAdmin("saving a test")) return;
  applySettings();
  if(!questions.length){alert("No valid questions to save.");return}

  // Test titles must be unique so students/admins never see two tests
  // with the same name. Comparison is case-insensitive and ignores spaces.
  const cleanTitle=testTitle.trim().replace(/\s+/g," ");
  if(cleanTitle.length<3){alert("Test Title must contain at least 3 characters.");document.getElementById("titleInput")?.focus();return;}
  if(cleanTitle.length>120){alert("Test Title must not exceed 120 characters.");document.getElementById("titleInput")?.focus();return;}
  testTitle=cleanTitle;
  const normalizedTitle=testTitle.toLowerCase();
  const duplicate=tests.some(t=>String(t.title||"").trim().replace(/\s+/g," ").toLowerCase()===normalizedTitle);
  if(duplicate){
    alert(`A mock test named "${testTitle}" already exists.Please enter a different Test Title.`);
    const titleBox=document.getElementById("titleInput");
    if(titleBox){titleBox.focus();titleBox.select();}
    return;
  }

  const accessType=document.getElementById("accessTypeInput")?.value === "free" ? "free" : "paid";
  const t=makeTest(testTitle.trim().replace(/\s+/g," "), questions.slice(), durationMinutes, marksPerCorrect, negativeMarks, accessType);
  t.is_published=false;
  try{
    if(supabaseClient){
      await saveTestToSupabase(t);
    }
    tests.push(t);saveTests();activeTestId=t.id;renderLibrary();renderStudentDashboard();
    document.getElementById("fileStatus").innerHTML='<span style="color:#087443;font-weight:700">✓ Test saved to Supabase.</span>';
  }catch(e){
    alert("Test could not be saved to Supabase: "+supaError("test save",e));
  }
}

/* V1.5: CSV parsing/validation is owned by the single shared loader in
   mission-tes-v13-clean-controller below. */
function updateHome(){
  const sub=document.getElementById("testSubtitle");
  if(sub) sub.textContent="Mock Test Platform";
}
const __hoaCsvFile = document.getElementById("csvFile");
if(__hoaCsvFile) __hoaCsvFile.addEventListener("change", function(){
  if(!requireAdmin("CSV import")){ this.value=""; return; }
  const file=this.files[0]; if(!file)return;
  const status=document.getElementById("fileStatus");
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const result=window.loadCSV(reader.result);
      questions.length=0; result.parsed.forEach(q=>questions.push(q));
      csvLoaded=true;
      status.innerHTML=`<span style="color:#087443;font-weight:700">✓ ${questions.length} questions loaded. Click SAVE AS MOCK TEST to add it to the library.</span>`+
        (result.skipped?` <span style="color:#b45309">${result.skipped} invalid row(s) skipped.</span>`:"");
      renderCSVPreview();
      updateHome();
    }catch(e){
      document.getElementById("csvPreviewPanel")?.classList.add("hidden");
      status.innerHTML=`<span style="color:#b42318">✗ ${e.message}</span>`;
    }
  };
  reader.onerror=()=>status.innerHTML='<span style="color:#b42318">✗ Could not read the file.</span>';
  reader.readAsText(file);
});

function loadPastedCSV(){
  if(!requireAdmin("CSV import")) return;
  const text=document.getElementById("csvPaste").value.trim();
  const status=document.getElementById("pasteStatus");
  if(!text){status.innerHTML='<span style="color:#b42318">✗ Paste CSV data first.</span>';return}
  try{
    const result=window.loadCSV(text);
    questions.length=0;
    result.parsed.forEach(q=>questions.push(q));
    csvLoaded=true;
    status.innerHTML=`<span style="color:#087443;font-weight:700">✓ ${questions.length} questions loaded. Click SAVE AS MOCK TEST to add it to the library.</span>`+
      (result.skipped?` <span style="color:#b45309">${result.skipped} invalid row(s) skipped.</span>`:"");
    document.getElementById("fileStatus").textContent="Pasted CSV is active.";
    renderCSVPreview();
    updateHome();
  }catch(e){
    status.innerHTML=`<span style="color:#b42318">✗ ${e.message}</span>`;
  }
}
function clearPastedCSV(){
  if(!requireAdmin("CSV management")) return;
  document.getElementById("csvPaste").value="";
  document.getElementById("pasteStatus").textContent="";
  document.getElementById("csvPreviewPanel")?.classList.add("hidden");
  document.getElementById("csvPreviewList").textContent="";
}

function renderCSVPreview(){
  const panel=document.getElementById("csvPreviewPanel");
  const list=document.getElementById("csvPreviewList");
  const count=document.getElementById("csvPreviewCount");
  if(!panel||!list||!count)return;
  list.textContent="";
  count.textContent=`${questions.length} question${questions.length===1?"":"s"}`;
  if(!questions.length){panel.classList.add("hidden");return;}
  questions.forEach((q,index)=>{
    const card=document.createElement("div");
    card.style.cssText="background:#fff;border:1px solid #D8E7F5;border-radius:9px;padding:12px;margin-top:9px";
    const head=document.createElement("div");
    head.style.cssText="font-weight:800;color:#0B2E52;margin-bottom:8px";
    head.textContent=`Q${index+1}. ${q[0]}`;
    card.appendChild(head);
    for(let i=1;i<=4;i++){
      const opt=document.createElement("div");
      opt.style.cssText=`padding:6px 8px;margin:4px 0;border-radius:6px;${i===q[5]?"background:#e9f8ef;color:#087443;font-weight:700;border:1px solid #9ad7b0":"background:#F8FBFF"}`;
      opt.textContent=`${String.fromCharCode(64+i)}. ${q[i]}${i===q[5]?"  ✓ CORRECT":""}`;
      card.appendChild(opt);
    }
    const exp=document.createElement("div");
    exp.style.cssText="margin-top:9px;padding:9px;background:#EEF5FC;border-left:3px solid #0B2E52;border-radius:5px;font-size:12px;line-height:1.5";
    exp.textContent=q[6]?`Explanation: ${q[6]}`:"Explanation: No explanation provided.";
    card.appendChild(exp);
    list.appendChild(card);
  });
  panel.classList.remove("hidden");
}

function downloadSampleCSV(){
  if(!requireAdmin("CSV tools")) return;
  const rows=[["Question","Option 1","Option 2","Option 3","Option 4","Correct Option","Explanation"],...questions];
  const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\r");
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="TES_Mock_Test_Sample.csv";a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),500);
}
function applySettings(){
  testTitle=document.getElementById("titleInput").value.trim()||"TES Mock Test";
  durationMinutes=Math.max(1,Number(document.getElementById("durationInput").value)||10);
  marksPerCorrect=Math.max(0,Number(document.getElementById("marksInput").value)||1);
  negativeMarks=Math.max(0,Number(document.getElementById("negativeInput").value)||0);
  timer=Math.round(durationMinutes*60);
  updateHome();
}




seedTests();
initSupabase();
updateRegistrationTypeUI();

function hoaFinishInitialUIBoot(){
  try{ document.documentElement.classList.remove('hoa-ui-booting'); }catch(e){}
}
window.hoaFinishInitialUIBoot = hoaFinishInitialUIBoot;

(async function bootstrapMissionTES(){
  const _hoaRouteParams=new URL(location.href).searchParams;
  const adminPortal= document.documentElement.classList.contains('hoa-admin-portal') || document.body?.dataset?.hoaPortal==='admin';
  const freeTestRoute=_hoaRouteParams.get('hoa_free_page')==='test' || _hoaRouteParams.has('hoa_free_test_link');
  currentStudent=null;
  adminLoggedIn=false;
  adminPreviewMode=false;

  if(adminPortal){
    try{
      document.getElementById('hoaLoginPage')?.classList.remove('hidden');
      document.getElementById('hoaAdminPortalPanel')?.classList.add('active');
      document.getElementById('home')?.classList.add('hidden');
      document.getElementById('adminOnlyDashboard')?.classList.add('hidden');
      document.body?.classList.remove('hoa-public-front');
      document.body?.classList.add('hoa-public-auth','hoa-admin-auth');
    }catch(e){}
    try{
      if(window.HOA_AUTH && await window.HOA_AUTH.restoreSession()) return;
    }catch(e){ console.warn('Admin portal session restoration failed:',e); }
    document.getElementById('hoaLoginPage')?.classList.remove('hidden');
    document.getElementById('hoaAdminPortalPanel')?.classList.add('active');
    document.documentElement.classList.remove('hoa-ui-booting');
    return;
  }

  // Establish a hidden/neutral state before network work. A Free Test route
  // must never enter the normal auth/front/dashboard bootstrap at all.
  try{
    document.getElementById("authScreen")?.classList.remove("hidden");
    document.getElementById("authScreen")?.style.removeProperty("display");
    document.getElementById("home")?.classList.add("hidden");
    document.getElementById("studentOnlyDashboard")?.classList.add("hidden");
    document.getElementById("adminOnlyDashboard")?.classList.add("hidden");
    document.getElementById("exam")?.classList.add("hidden");
    document.getElementById("result")?.classList.add("hidden");
  }catch(e){ console.warn("Initial UI state:",e); }

  // Phase 3: Authentication owns Admin/Student Supabase session restoration.
  // A Free Test is token-based and deliberately bypasses this normal shell.
  if(!freeTestRoute){
    try{
      if(window.HOA_AUTH && await window.HOA_AUTH.restoreSession()) return;
    }catch(e){
      console.warn("Authentication session restoration failed; continuing as signed-out user.",e);
    }
  }

  // Normal dashboard test loading is NOT part of first paint. The public Home
  // UI does not need the full test/question payload to become visible. Start
  // this work in the background so network/database latency cannot block Home.
  if(!freeTestRoute){
    const loadPublicTests = function(){
      loadTestsFromSupabase().catch(function(e){
        console.warn("Background Supabase test load failed; local cache/fallback remains available.",e);
      });
    };
    if(typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(loadPublicTests,{timeout:1500});
    } else {
      setTimeout(loadPublicTests,0);
    }
  }

  if(freeTestRoute){ hoaFinishInitialUIBoot(); return; }

  // No authenticated session: remain signed out and show the public/front flow.
  document.getElementById("studentHeaderLogout")?.classList.add("hidden");
  document.getElementById("adminHeaderLogout")?.classList.add("hidden");
  document.getElementById("home")?.classList.add("hidden");
  document.getElementById("studentOnlyDashboard")?.classList.add("hidden");
  document.getElementById("adminOnlyDashboard")?.classList.add("hidden");
  document.getElementById("exam")?.classList.add("hidden");
  document.getElementById("result")?.classList.add("hidden");
  setAuthScreenVisible(true);
  document.getElementById("authScreen")?.classList.remove("hidden");

  updateHome();
  showSupabaseStatus();
  if(typeof window.hoaExitToFrontPage === 'function') window.hoaExitToFrontPage();
  hoaFinishInitialUIBoot();
})();

/* ===== Static Admin shell enhancer — V8.33 ===== */
(function(){
  'use strict';

  function setupAdminReferenceUI(){
    const home=document.getElementById('home');
    const shell=document.getElementById('adminReferenceShell');
    const sidebar=document.getElementById('adminReferenceSidebar');
    const main=document.getElementById('adminReferenceMain');
    const admin=document.getElementById('adminOnlyDashboard');
    const nav=sidebar?.querySelector('.adminSectionNav') || admin?.querySelector('.adminSectionNav');
    if(nav) nav.classList.add('adminReferenceNav');
    if(!home || !shell || !sidebar || !main || !admin || !nav) return false;

    /* The shell and dashboard are now static HTML. This function only wires
       behavior and presentation; it never creates or reparents Admin DOM. */
    const refresh=main.querySelector('.adminReferenceRefreshBtn');
    if(refresh && !refresh.dataset.hoaBound){
      refresh.dataset.hoaBound='1';
      refresh.addEventListener('click',function(){
        const active=nav.querySelector('button.active');
        if(active) active.click();
      });
    }

    const mobileSections=document.getElementById('hoaMobileAdminSectionsBtn');
    if(mobileSections && !mobileSections.dataset.hoaBound){
      mobileSections.dataset.hoaBound='1';
      mobileSections.addEventListener('click',function(e){
        e.preventDefault(); e.stopPropagation();
        if(typeof window.hoaToggleMobileSidebar==='function') window.hoaToggleMobileSidebar();
        else document.body.classList.toggle('hoa-sidebar-open');
        this.setAttribute('aria-expanded',document.body.classList.contains('hoa-sidebar-open')?'true':'false');
      });
    }

    const drawerClose=sidebar.querySelector('.hoaMobileAdminDrawerClose');
    if(drawerClose && !drawerClose.dataset.hoaBound){
      drawerClose.dataset.hoaBound='1';
      drawerClose.addEventListener('click',function(e){
        e.preventDefault(); e.stopPropagation();
        if(typeof window.hoaCloseMobileSidebar==='function') window.hoaCloseMobileSidebar();
        else document.body.classList.remove('hoa-sidebar-open');
      });
    }

    const sectionMeta={
      master:['Master Dashboard','Complete overview of courses, videos, students, mock tests, posters and Free Content'],
      student:['Dashboard','Manage students and candidate access'],
      test:['Test Making','Create, import and publish mock tests'],
      result:['Result Management','Search, filter, inspect and manage candidate test results'],
      admin:['Admin Section','Manage administrator account and application settings']
    };

    function updatePageHeading(){
      const active=nav.querySelector('button.active');
      const id=active ? active.id : '';
      const key=id==='adminNavMaster'?'master':id==='adminNavTest'?'test':id==='adminNavResult'?'result':id==='adminNavAdmin'?'admin':'student';
      const meta=sectionMeta[key];
      const t=document.getElementById('adminReferencePageTitle');
      const sub=document.getElementById('adminReferencePageSub');
      if(t) t.textContent=meta[0];
      if(sub) sub.textContent=meta[1];
    }

    if(!nav.dataset.hoaHeadingBound){
      nav.dataset.hoaHeadingBound='1';
      nav.addEventListener('click',function(){
        setTimeout(updatePageHeading,0);
        if(window.matchMedia && window.matchMedia('(max-width:700px)').matches){
          document.body.classList.remove('hoa-sidebar-open');
          if(mobileSections) mobileSections.setAttribute('aria-expanded','false');
        }
      });
    }
    updatePageHeading();

    function syncMode(){
      const inFinalShell=admin.parentElement===main && sidebar.parentElement===shell;
      const visible=inFinalShell && !admin.classList.contains('hidden');
      admin.dataset.hoaAdminReady=inFinalShell?'true':'false';
      document.body.classList.toggle('admin-ui',visible);
      if(visible) updatePageHeading();
    }
    if(!admin.dataset.hoaStaticShellObserver){
      const observer=new MutationObserver(syncMode);
      observer.observe(admin,{attributes:true,attributeFilter:['class']});
      admin.dataset.hoaStaticShellObserver='1';
    }
    syncMode();
    return true;
  }

  window.hoaEnsureAdminReferenceUI=setupAdminReferenceUI;
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',setupAdminReferenceUI,{once:true});
  else setupAdminReferenceUI();
})();


/* ===== Original inline script 4 — id: mission-tes-v13-clean-controller ===== */

(function(){
  'use strict';

  /* ---------------------------------------------------------
     Protected helpers/state access
     --------------------------------------------------------- */
  const originalStudentStart = (typeof window.startSavedTest === 'function') ? window.startSavedTest : null;

  function isAdminMode(){
    return (typeof adminLoggedIn !== 'undefined' && adminLoggedIn === true) &&
           (typeof currentStudent !== 'undefined' && currentStudent == null);
  }

  function normalizeQuestion(q){
    if(Array.isArray(q)){
      const a=[q[0]??'',q[1]??'',q[2]??'',q[3]??'',q[4]??'',q[5]??'',q[6]??''];
      const c=String(a[5]).trim().toUpperCase();
      const map={A:1,B:2,C:3,D:4,'1':1,'2':2,'3':3,'4':4};
      a[5]=map[c] ?? Number(a[5]);
      if(q.__id){try{Object.defineProperty(a,'__id',{value:q.__id,enumerable:false,writable:true});}catch(e){}}
      return a;
    }
    if(q && typeof q==='object'){
      const a=[
        q.question_text ?? q.question ?? q.text ?? '',
        q.option_1 ?? q.option1 ?? '', q.option_2 ?? q.option2 ?? '',
        q.option_3 ?? q.option3 ?? '', q.option_4 ?? q.option4 ?? '',
        q.correct_option ?? q.correct ?? q.answer ?? '', q.explanation ?? ''
      ];
      const c=String(a[5]).trim().toUpperCase();
      const map={A:1,B:2,C:3,D:4,'1':1,'2':2,'3':3,'4':4};
      a[5]=map[c] ?? Number(a[5]);
      if(q.id){try{Object.defineProperty(a,'__id',{value:q.id,enumerable:false,writable:true});}catch(e){}}
      return a;
    }
    return null;
  }
  function normalizeQuestions(list){
    let raw=list;
    if(typeof raw==='string'){try{raw=JSON.parse(raw);}catch(e){raw=[];}}
    return (Array.isArray(raw)?raw:[]).map(normalizeQuestion).filter(q=>q && q[0] && q[1] && q[2] && q[3] && q[4] && [1,2,3,4].includes(Number(q[5])));
  }

  function setExamState(active){
    const body=document.body;
    if(active) body.classList.add('v13-exam-active');
    else body.classList.remove('v13-exam-active');
  }
  function hideExam(){
    const exam=document.getElementById('exam');
    const result=document.getElementById('result');
    const overlay=document.getElementById('testCountdownOverlay');
    if(exam) exam.classList.add('hidden');
    if(result) result.classList.add('hidden');
    if(overlay) overlay.classList.add('hidden');
    document.getElementById('headerTimer')?.classList.add('hidden');
    setExamState(false);
  }

  /* ---------------------------------------------------------
     ONE Admin Test Preview controller
     --------------------------------------------------------- */
  function renderAdminExam(){
    const exam=document.getElementById('exam');
    if(!exam || !Array.isArray(questions) || !questions.length) return false;
    setExamState(true);
    document.getElementById('home')?.classList.add('hidden');
    document.getElementById('authScreen')?.classList.add('hidden');
    document.getElementById('adminOnlyDashboard')?.classList.add('hidden');
    document.getElementById('studentOnlyDashboard')?.classList.add('hidden');
    document.getElementById('testCountdownOverlay')?.classList.add('hidden');
    exam.classList.remove('hidden');
    exam.style.display='block';
    exam.style.visibility='visible';
    exam.style.opacity='1';

    current=Math.max(0,Math.min(Number(current)||0,questions.length-1));
    const q=questions[current];
    if(!q) return false;

    const no=document.getElementById('questionNo');
    const noText=document.getElementById('questionNoText');
    const markBadge=document.getElementById('examMarkBadge');
    const examTitle=document.getElementById('examTestTitle');
    const meta=document.getElementById('examMeta');
    const text=document.getElementById('questionText');
    const box=document.getElementById('options');
    const bar=document.getElementById('bar');
    const palette=document.getElementById('palette');
    const back=document.getElementById('adminPreviewExit');
    if(noText) noText.textContent=`Question ${current+1} of ${questions.length}`;
    else if(no) no.textContent=`Question ${current+1} of ${questions.length}`;
    if(examTitle) examTitle.textContent=String(testTitle||'Mock Test');
    if(markBadge){ const marks=Number.isFinite(Number(marksPerCorrect))?Number(marksPerCorrect):1; markBadge.textContent=`▣ ${marks} Mark${marks===1?'':'s'}`; }
    if(meta) meta.textContent=`Question ${current+1} / ${questions.length}`;
    if(text) text.textContent=String(q[0]??'');
    if(box){
      box.innerHTML='';
      for(let i=1;i<=4;i++){
        const b=document.createElement('button');
        b.type='button'; b.className='option'+(answers[current]===i?' selected':'');
        b.textContent=`${String.fromCharCode(64+i)}. ${String(q[i]??'')}`;
        b.onclick=()=>{answers[current]=i;renderAdminExam();};
        box.appendChild(b);
      }
    }
    if(bar) bar.style.width=((current+1)/questions.length*100)+'%';
    if(palette){
      palette.innerHTML='';
      questions.forEach((_,i)=>{
        const b=document.createElement('button');
        b.type='button'; b.className='pbtn'+(i===current?' current':'')+(answers[i]!==null?' answered':'');
        b.textContent=String(i+1); b.onclick=()=>{current=i;renderAdminExam();};
        palette.appendChild(b);
      });
    }
    if(back){back.classList.remove('hidden');back.classList.add('v13-visible');back.textContent='← BACK TO ADMIN DASHBOARD';}
    return true;
  }

  window.startSavedTest=function(id){
    if(!isAdminMode()) return originalStudentStart ? originalStudentStart(id) : undefined;
    const t=Array.isArray(tests) ? tests.find(x=>String(x.id)===String(id)) : null;
    if(!t){alert('This test could not be found. Please refresh the Test Library.');return;}
    const qs=normalizeQuestions(t.questions);
    if(!qs.length){alert('This test has no valid questions loaded. Please refresh the Test Library or re-import the questions.');return;}

    ++testLaunchToken;
    const token=testLaunchToken;
    clearInterval(interval); interval=null;
    adminPreviewMode=true; activeTestId=t.id;
    questions.length=0; qs.forEach(q=>questions.push(q));
    testTitle=t.title||'Mock Test'; durationMinutes=Number(t.duration)||10;
    marksPerCorrect=Number(t.marks)||1; negativeMarks=Number(t.negative)||0;
    timer=Math.max(1,Math.round(durationMinutes*60)); current=0;
    answers=Array(questions.length).fill(null);
    pendingAnswers=Array(questions.length).fill(null);
    marked=Array(questions.length).fill(false);
    visited=Array(questions.length).fill(false);
    submitted=false; currentAttemptId=null;

    showTestCountdown(testTitle,function(){
      if(token!==testLaunchToken) return;
      renderAdminExam();
      updateTimer();
      clearInterval(interval);
      interval=setInterval(tick,1000);
    });
  };

  window.exitAdminPreview=function(){
    ++testLaunchToken;
    clearInterval(interval); interval=null;
    adminPreviewMode=false; activeTestId=null; currentAttemptId=null; submitted=true;
    hideExam();
    const home=document.getElementById('home');
    if(home){home.classList.remove('hidden');home.style.removeProperty('display');}
    document.getElementById('adminOnlyDashboard')?.classList.remove('hidden');
    document.getElementById('adminPreviewExit')?.classList.add('hidden');
    document.getElementById('adminPreviewExit')?.classList.remove('v13-visible');
    if(typeof window.showAdminSection==='function') window.showAdminSection('test');
  };

  /* ---------------------------------------------------------
     ONE CSV importer. Existing file/paste UI calls window.loadCSV.
     --------------------------------------------------------- */
  function parseCSV(text){
    text=String(text??'').replace(/^\uFEFF/,'');
    if(!/[\r]/.test(text) && /\\r/.test(text)) text=text.replace(/\\r/g,'');
    const first=(text.split(/\r?/)[0]||'');
    let delimiter=',';
    if(first.includes('\t') && !first.includes(',')) delimiter='\t';
    else if(first.includes(';') && first.split(';').length>=5 && first.split(',').length<5) delimiter=';';
    const rows=[]; let row=[], cell='', quoted=false;
    for(let i=0;i<text.length;i++){
      const c=text[i], n=text[i+1];
      if(c==='"'){
        if(quoted && n==='"'){cell+='"';i++;} else quoted=!quoted;
      }else if(c===delimiter && !quoted){row.push(cell);cell='';}
      else if((c===''||c==='\r')&&!quoted){if(c==='\r'&&n==='')i++;row.push(cell);cell='';if(row.some(x=>String(x).trim()!==''))rows.push(row);row=[];}
      else cell+=c;
    }
    if(cell!==''||row.length){row.push(cell);if(row.some(x=>String(x).trim()!==''))rows.push(row);}
    if(!rows.length) throw new Error('CSV has no question rows.');
    const clean=v=>String(v??'').replace(/^\uFEFF/,'').trim();
    let header=rows[0].map(clean).map(x=>x.toLowerCase().replace(/\s+/g,' '));
    const hasHeader=header.includes('question')&&header.includes('option 1')&&header.includes('option 2')&&header.includes('option 3')&&header.includes('option 4')&&header.includes('correct option');
    const idx={q:hasHeader?header.indexOf('question'):0,o1:hasHeader?header.indexOf('option 1'):1,o2:hasHeader?header.indexOf('option 2'):2,o3:hasHeader?header.indexOf('option 3'):3,o4:hasHeader?header.indexOf('option 4'):4,correct:hasHeader?header.indexOf('correct option'):5,explanation:hasHeader?header.indexOf('explanation'):(rows[0].length>6?6:-1)};
    const parsed=[]; let skipped=0;
    for(let r=hasHeader?1:0;r<rows.length;r++){
      const row=rows[r]; const q=clean(row[idx.q]),o1=clean(row[idx.o1]),o2=clean(row[idx.o2]),o3=clean(row[idx.o3]),o4=clean(row[idx.o4]);
      const cv=clean(row[idx.correct]).toUpperCase(); const correct={A:1,B:2,C:3,D:4,'1':1,'2':2,'3':3,'4':4}[cv];
      const exp=idx.explanation>=0?clean(row[idx.explanation]):'';
      if(!q&&!o1&&!o2&&!o3&&!o4&&!cv) continue;
      if(!q||!o1||!o2||!o3||!o4||![1,2,3,4].includes(correct)){skipped++;continue;}
      parsed.push([q,o1,o2,o3,o4,correct,exp]);
    }
    if(!parsed.length) throw new Error('No valid questions found. Use: Question, Option 1, Option 2, Option 3, Option 4, Correct Option, Explanation');
    return {parsed,skipped};
  }
  window.loadCSV=function(text){
    if(!requireAdmin('CSV import')) throw new Error('Admin login required for CSV import.');
    const result=parseCSV(text);
    questions.length=0; result.parsed.forEach(q=>questions.push(q));
    csvLoaded=true;
    const status=document.getElementById('pasteStatus')||document.getElementById('fileStatus');
    if(status) status.innerHTML=`<span style="color:#087443;font-weight:700">✓ ${questions.length} questions loaded.</span>`+(result.skipped?` <span style="color:#b45309"> ${result.skipped} invalid row(s) skipped.</span>`:'');
    if(typeof renderCSVPreview==='function') renderCSVPreview();
    if(typeof updateHome==='function') updateHome();
    return result;
  };

  /* ---------------------------------------------------------
     ONE Result Management data pipeline
     V4.2 — automatic results: no publish/approval workflow.
     --------------------------------------------------------- */
  let resultRows=[];
  let resultLoadState='idle';
  let resultLoadError='';

  async function loadAdminResults(){
    if(!supabaseClient || !adminLoggedIn){
      resultLoadState='error';
      resultLoadError='Supabase is not ready or the Admin session is not active.';
      resultRows=[];
      return resultRows;
    }
    resultLoadState='loading';
    resultLoadError='';

    // The removed time-taken column is not part of the production schema; elapsed time is derived from started_at/submitted_at.
    const {data:attemptRows,error:attemptError}=await supabaseClient.from('attempts')
      .select('id,student_id,test_id,started_at,submitted_at,status,total_questions,correct_answers,wrong_answers,unanswered,score,question_snapshot,scoring_snapshot')
      .order('started_at',{ascending:false});
    if(attemptError){
      resultLoadState='error';
      resultLoadError='Attempts query failed: '+(attemptError.message||String(attemptError));
      throw new Error(resultLoadError);
    }

    const rows=Array.isArray(attemptRows)?attemptRows:[];
    const studentIds=[...new Set(rows.map(r=>r.student_id).filter(Boolean))];
    const testIds=[...new Set(rows.map(r=>r.test_id).filter(Boolean))];
    const studentMap=new Map(), testMap=new Map();

    if(studentIds.length){
      const {data,error}=await supabaseClient.from('students')
        .select('id,full_name,email,access_type').in('id',studentIds);
      if(error){
        resultLoadState='error';
        resultLoadError='Student mapping query failed: '+(error.message||String(error));
        throw new Error(resultLoadError);
      }
      (Array.isArray(data)?data:[]).forEach(x=>studentMap.set(x.id,x));
    }
    if(testIds.length){
      const {data,error}=await supabaseClient.from('tests')
        .select('id,title,marks_per_question,negative_marking').in('id',testIds);
      if(error){
        resultLoadState='error';
        resultLoadError='Test mapping query failed: '+(error.message||String(error));
        throw new Error(resultLoadError);
      }
      (Array.isArray(data)?data:[]).forEach(x=>testMap.set(x.id,x));
    }

    resultRows=rows.map(r=>{
      const st=studentMap.get(r.student_id)||{};
      const te=testMap.get(r.test_id)||{};
      const total=Number(r.total_questions)||0;
      const marks=Number(te.marks_per_question)||1;
      const negative=Number(te.negative_marking)||0;
      const score=Number(r.score)||0;
      const maxMarks=total*marks;
      return {
        id:r.id, userId:r.student_id, student_id:r.student_id,
        userName:st.full_name||'Candidate', name:st.full_name||'Candidate', email:st.email||'',
        access_type:st.access_type||'paid', candidate_type:st.access_type||'paid',
        title:te.title||'Mock Test', testTitle:te.title||'Mock Test', testId:r.test_id,
        date:r.submitted_at||r.started_at||'', submittedAt:r.submitted_at||'', startedAt:r.started_at||'',
        status:r.status||'', submitted:!!r.submitted_at,
        correct:Number(r.correct_answers)||0, wrong:Number(r.wrong_answers)||0, skipped:Number(r.unanswered)||0,
        score, marks, negativeMarks:negative, maxMarks, question_snapshot:r.question_snapshot||null, scoring_snapshot:r.scoring_snapshot||null,
        percentage:maxMarks?(score/maxMarks)*100:0,
        timeTaken:(()=>{
          const raw=r.time_taken??r.timeTaken??r.elapsed_seconds??r.elapsedSeconds??r.duration_seconds??r.durationSeconds;
          const n=Number(raw);
          if(Number.isFinite(n)&&n>=0)return Math.round(n);
          const a=Date.parse(r.started_at||''); const b=Date.parse(r.submitted_at||'');
          return Number.isFinite(a)&&Number.isFinite(b)&&b>=a?Math.round((b-a)/1000):0;
        })()
      };
    });
    resultLoadState='ready'; resultLoadError='';
    localStorage.setItem('missionTES_results_cache',JSON.stringify(resultRows));
    return resultRows;
  }
  window.loadAdminResultsFromSupabase=loadAdminResults;
  window.getAdminResultDiagnostics=function(){
    return {state:resultLoadState,error:resultLoadError,count:resultRows.length,completed:resultRows.filter(r=>r.submitted||r.status==='completed').length};
  };

  function resultAccess(r){return ['free','paid'].includes(String(r.access_type||r.candidate_type||'').toLowerCase())?String(r.access_type||r.candidate_type).toLowerCase():'paid';}
  function score(r){return Number.isFinite(Number(r.score??r.marks))?Number(r.score??r.marks):0;}
  function maxMarks(r){const n=Number(r.maxMarks);return n>0?n:0;}
  function pct(r){const n=Number(r.percentage);return Number.isFinite(n)?n:(maxMarks(r)?score(r)/maxMarks(r)*100:0);}
  function formatAdminDate(v){
    if(!v)return '—'; const d=new Date(v);
    return Number.isNaN(d.getTime())?escapeHTML(String(v)):d.toLocaleString([], {day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
  }
  function formatAdminTime(sec){
    const n=Math.max(0,Math.round(Number(sec)||0)), h=Math.floor(n/3600), m=Math.floor((n%3600)/60), s=n%60;
    return h?`${h}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`:`${m}m ${String(s).padStart(2,'0')}s`;
  }

  window.deleteAdminResultAttempt=async function(index){
    const r=(window.__adminFilteredResults||[])[index];
    if(!r || !r.id){ alert('The selected result could not be identified.'); return; }
    if(typeof adminLoggedIn==='undefined' || adminLoggedIn!==true){ alert('Admin login required to delete a result.'); return; }
    const candidate=r.userName||'Candidate';
    const test=r.title||'Mock Test';
    const id=String(r.id);
    const ok=confirm('DELETE RESULT / ATTEMPT?Candidate: '+candidate+'Test: '+test+'Attempt ID: '+id+'This permanently deletes the attempt and any related records covered by the database cascade rules.This action cannot be undone.');
    if(!ok)return;
    try{
      if(!supabaseClient || !supabaseClient.functions) throw new Error('Supabase is not ready.');
      if(!supabaseClient.auth) throw new Error('Authenticated Admin session is required.');
      const sess=await supabaseClient.auth.getSession();
      const token=sess && sess.data && sess.data.session ? sess.data.session.access_token : null;
      if(!token) throw new Error('Authenticated Admin session is required. Please log in again.');
      const fn=await supabaseClient.functions.invoke('admin-delete-attempt-v2',{body:{attempt_id:id}});
      if(fn.error){
        let detail = fn.error.message || String(fn.error);
        try{
          const ctx = fn.error.context;
          if(ctx && typeof ctx.json === 'function'){
            const body = await ctx.json();
            if(body && body.error) detail = body.error + (body.detail ? ' — '+body.detail : '');
          }
        }catch(_){}
        throw new Error(detail);
      }
      if(fn.data && fn.data.error) throw new Error(fn.data.error);
      if(document.getElementById('adminResultDetail')) document.getElementById('adminResultDetail').innerHTML='';
      await loadAdminResults();
      renderResultRows();
      alert('Result / attempt deleted successfully.');
    }catch(err){
      console.error('Protected result deletion failed:',err);
      alert('Delete failed: '+(err && err.message ? err.message : String(err)));
    }
  };

  function renderResultRows(){
    const list=document.getElementById('adminResultList'); if(!list)return;
    if(resultLoadState==='loading'){list.innerHTML='<div class="resultEmpty">Loading results from Supabase…</div>';return;}
    if(resultLoadState==='error'){
      list.innerHTML='<div class="resultEmpty" style="color:#b42318;text-align:left"><b>Result data could not be loaded.</b><br><span style="font-size:12px">'+escapeHTML(resultLoadError||'Unknown Supabase error.')+'</span></div>';
      window.__adminFilteredResults=[]; return;
    }
    const search=(document.getElementById('resultSearch')?.value||'').trim().toLowerCase();
    const access=document.getElementById('resultAccessFilter')?.value||'all';
    const filtered=resultRows.filter(r=>{
      const text=[r.userName,r.name,r.email,r.title,r.testTitle,r.userId,r.student_id].filter(Boolean).join(' ').toLowerCase();
      return (!search||text.includes(search))&&(access==='all'||resultAccess(r)===access);
    });
    document.getElementById('adminResultTotal')&&(document.getElementById('adminResultTotal').textContent=resultRows.length);
    document.getElementById('adminResultCompleted')&&(document.getElementById('adminResultCompleted').textContent=resultRows.filter(r=>r.status==='completed'||r.submitted).length);
    document.getElementById('adminResultCandidates')&&(document.getElementById('adminResultCandidates').textContent=new Set(resultRows.map(r=>r.userId||r.student_id||r.email).filter(Boolean)).size);
    window.__adminFilteredResults=filtered;
    if(!filtered.length){list.innerHTML='<div class="emptyState">No results match the selected filters.</div>';return;}
    list.innerHTML=`<table class="resultTable"><thead><tr><th>Candidate</th><th>Test</th><th>Type</th><th>Score</th><th>Correct</th><th>Wrong</th><th>Skipped</th><th>Percentage</th><th>Action</th></tr></thead><tbody>${filtered.map((r,i)=>`<tr><td><b>${escapeHTML(r.userName||'Candidate')}</b><div style="font-size:11px;color:#5E7188">${escapeHTML(r.email||'')}</div></td><td>${escapeHTML(r.title||'Mock Test')}</td><td><span class="resultBadge ${resultAccess(r)}">${resultAccess(r).toUpperCase()}</span></td><td><b>${score(r).toFixed(2)}</b>${maxMarks(r)?' / '+maxMarks(r).toFixed(2):''}</td><td>${Number(r.correct||0)}</td><td>${Number(r.wrong||0)}</td><td>${Number(r.skipped||0)}</td><td><b>${pct(r).toFixed(1)}%</b></td><td><div class="resultActions"><button onclick="viewAdminResult(${i})">VIEW RESULT</button><button onclick="viewAdminAttempt(${i})">VIEW ATTEMPT</button><button class="hoa-v58-main-delete" onclick="deleteAdminResultAttempt(${i})">DELETE RESULT</button></div></td></tr>`).join('')}</tbody></table>`;
  }
  window.renderAdminResultSummary=renderResultRows;

  window.viewAdminResult=function(index){
    const r=(window.__adminFilteredResults||[])[index], d=document.getElementById('adminResultDetail'); if(!r||!d)return;
    d.innerHTML=`<div class="resultDetail"><div style="display:flex;justify-content:space-between;gap:10px;align-items:center"><div><b style="font-size:18px">${escapeHTML(r.userName||'Candidate')}</b><div style="font-size:12px;color:#5E7188">${escapeHTML(r.email||'')}</div></div><button class="btn secondary" onclick="document.getElementById('adminResultDetail').innerHTML=''">Close</button></div><div class="resultDetailGrid" style="margin-top:12px"><div class="resultDetailItem"><small>Test</small><b>${escapeHTML(r.title||'Mock Test')}</b></div><div class="resultDetailItem"><small>Attempt ID</small><b style="word-break:break-all">${escapeHTML(String(r.id||'—'))}</b></div><div class="resultDetailItem"><small>Score</small><b>${score(r).toFixed(2)}${maxMarks(r)?' / '+maxMarks(r).toFixed(2):''}</b></div><div class="resultDetailItem"><small>Percentage</small><b>${pct(r).toFixed(1)}%</b></div><div class="resultDetailItem"><small>Candidate Type</small><b>${resultAccess(r).toUpperCase()}</b></div><div class="resultDetailItem"><small>Correct</small><b>${Number(r.correct||0)}</b></div><div class="resultDetailItem"><small>Wrong</small><b>${Number(r.wrong||0)}</b></div><div class="resultDetailItem"><small>Skipped</small><b>${Number(r.skipped||0)}</b></div><div class="resultDetailItem"><small>Marks / Correct</small><b>+${Number(r.marks||0).toFixed(2)}</b></div><div class="resultDetailItem"><small>Negative Marks</small><b>−${Number(r.negativeMarks||0).toFixed(2)}</b></div><div class="resultDetailItem"><small>Time Taken</small><b>${formatAdminTime(r.timeTaken)}</b></div><div class="resultDetailItem"><small>Submitted</small><b>${formatAdminDate(r.submittedAt||r.date)}</b></div></div></div>`;
    d.scrollIntoView({behavior:'smooth',block:'start'});
  };

  window.viewAdminAttempt=async function(index){
    const r=(window.__adminFilteredResults||[])[index]; if(!r)return;
    try{
      let rawQs=null, savedAnswers=null;
      // Reuse the immutable local historical snapshot when available.
      try{
        const all=JSON.parse(localStorage.getItem('missionTES_attempt_details_v21')||'{}');
        const direct=all[String(r.id)];
        if(direct && Array.isArray(direct.questions)&&direct.questions.length){rawQs=direct.questions;savedAnswers=Array.isArray(direct.answers)?direct.answers:null;}
      }catch(ignore){}

      // Admin is allowed to inspect any candidate attempt; fetch only what is needed.
      if(!rawQs && supabaseClient && r.id && r.testId){
        const [{data:qRows,error:qError},{data:aRows,error:aError}]=await Promise.all([
          supabaseClient.from('questions').select('id,question_text,option_1,option_2,option_3,option_4,correct_option,explanation,question_order').eq('test_id',r.testId).order('question_order',{ascending:true}),
          supabaseClient.from('answers').select('question_id,selected_option').eq('attempt_id',r.id)
        ]);
        if(qError||aError)throw new Error((qError||aError)?.message||'Could not load attempt details.');
        const answerMap=new Map((aRows||[]).map(a=>[String(a.question_id),a]));
        rawQs=(qRows||[]).map(q=>[q.question_text,q.option_1,q.option_2,q.option_3,q.option_4,q.correct_option,q.explanation||'']);
        savedAnswers=(qRows||[]).map(q=>{const a=answerMap.get(String(q.id));return a&&a.selected_option!==null&&a.selected_option!==undefined&&a.selected_option!==''?Number(a.selected_option):null;});
      }
      if(!rawQs){
        const t=(tests||[]).find(x=>String(x.id)===String(r.testId));
        if(t&&Array.isArray(t.questions))rawQs=t.questions;
      }
      if(!rawQs||!rawQs.length){alert('Question data for this attempt is not available.');return;}
      if(!Array.isArray(savedAnswers))savedAnswers=Array(rawQs.length).fill(null);

      window.__missionTESReviewSnapshot={questions:rawQs.map(q=>Array.isArray(q)?q.slice():q),answers:savedAnswers.slice(),testTitle:r.title||'Mock Test',testId:r.testId||null,historical:true,attemptId:r.id,resultRow:r};
      window.__missionTESHistoricalAttempt=r;
      reviewCurrent=0;
      document.getElementById('home')?.classList.add('hidden');
      document.getElementById('exam')?.classList.add('hidden');
      document.getElementById('headerTimer')?.classList.add('hidden');
      document.getElementById('adminOnlyDashboard')?.classList.add('hidden');
      document.getElementById('result')?.classList.remove('hidden');
      const correct=Number(r.correct||0),wrong=Number(r.wrong||0),skipped=Number(r.skipped||0),scoreValue=score(r),max=maxMarks(r)||rawQs.length*(Number(r.marks)||1);
      const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v};
      set('resultTitle',(r.title||'Mock Test')+' — Attempt Review');
      set('score',scoreValue.toFixed(2)+' / '+max.toFixed(2));
      set('percentage','Percentage: '+pct(r).toFixed(2)+'%');
      set('correct',correct);set('wrong',wrong);set('skipped',skipped);set('finalMarks',scoreValue.toFixed(2));
      set('resultMarksInfo',scoreValue.toFixed(2)+' / '+max.toFixed(2));set('resultCorrectInfo',correct);set('resultWrongInfo',wrong);set('resultSkippedInfo',skipped);set('resultTimeInfo',formatAdminTime(r.timeTaken));
      set('reviewSummary',`${correct} Correct • ${wrong} Wrong • ${skipped} Skipped`);
      const back=document.getElementById('resultBackBtn');
      if(back){back.textContent='← BACK TO RESULT MANAGEMENT';back.onclick=()=>{window.__missionTESReviewSnapshot=null;window.__missionTESHistoricalAttempt=null;document.getElementById('result')?.classList.add('hidden');document.getElementById('adminOnlyDashboard')?.classList.remove('hidden');showDashboardTab('admin');activateAdminPanel('result');renderResultRows();};}
      forceRenderSubmittedQuestionReview();
      requestAnimationFrame(()=>forceRenderSubmittedQuestionReview());
      setTimeout(()=>forceRenderSubmittedQuestionReview(),50);
    }catch(e){
      console.error('Admin attempt review failed:',e);
      alert('Unable to open this attempt review. Please try again.');
    }
  };

  function populateTestWise(){
    const select=document.getElementById('testWiseTestSelect'); if(!select)return;
    const current=select.value; const map=new Map();
    resultRows.forEach(r=>{const key=String(r.testId||r.title||''); if(key&&!map.has(key))map.set(key,{key,name:r.title||'Mock Test'});});
    select.innerHTML='<option value="">Select Test</option>'+[...map.values()].sort((a,b)=>a.name.localeCompare(b.name)).map(x=>`<option value="${escapeHTML(x.key)}">${escapeHTML(x.name)}</option>`).join('');
    if(map.has(current)) select.value=current;
  }
  window.populateTestWiseSelector=populateTestWise;
  window.renderTestWiseResults=function(){
    populateTestWise(); const key=document.getElementById('testWiseTestSelect')?.value||''; const date=document.getElementById('testWiseDate')?.value||'';
    let rows=resultRows.filter(r=>String(r.testId||r.title||'')===key); if(date) rows=rows.filter(r=>String(r.date||'').slice(0,10)===date); rows.sort((a,b)=>pct(b)-pct(a));
    document.getElementById('testWiseTemplateTestName')&&(document.getElementById('testWiseTemplateTestName').textContent=rows[0]?.title||'Test-Wise Result');
    document.getElementById('testWiseTemplateSubject')&&(document.getElementById('testWiseTemplateSubject').textContent='Subject: —');
    document.getElementById('testWiseTemplateDate')&&(document.getElementById('testWiseTemplateDate').textContent='Date: '+(date||String(rows[0]?.date||'').slice(0,10)||'—'));
    const box=document.getElementById('testWiseTable'); if(!box)return;
    if(!key){box.innerHTML='<div class="resultEmpty">Select a test to view its result.</div>';return;}
    if(!rows.length){box.innerHTML='<div class="resultEmpty">No candidates have results for this test.</div>';return;}
    box.innerHTML=`<div class="testWiseTableWrap"><table class="testWiseTable"><thead><tr><th>Sl. No.</th><th>Candidate Name</th><th>Email</th><th>Individual Score</th><th>Percentage</th></tr></thead><tbody>${rows.map((r,i)=>`<tr><td>${i+1}</td><td>${escapeHTML(r.userName||'Candidate')}</td><td>${escapeHTML(r.email||'')}</td><td><b>${score(r).toFixed(2)}</b>${maxMarks(r)?' / '+maxMarks(r).toFixed(2):''}</td><td>${pct(r).toFixed(2)}%</td></tr>`).join('')}</tbody></table></div>`;
  };
  window.exportAdminResultsCSV=function(){
    const rows=window.__adminFilteredResults||resultRows; if(!rows.length){alert('No results to export.');return;}
    const data=[['Candidate Name','Email','Candidate Type','Test','Score','Max Marks','Correct','Wrong','Skipped','Percentage'],...rows.map(r=>[r.userName||r.name||'',r.email||'',resultAccess(r).toUpperCase(),r.title||'',score(r).toFixed(2),maxMarks(r)?maxMarks(r).toFixed(2):'',Number(r.correct||0),Number(r.wrong||0),Number(r.skipped||0),pct(r).toFixed(2)])];
    const esc=v=>'"'+String(v??'').replace(/"/g,'""')+'"'; const blob=new Blob([data.map(row=>row.map(esc).join(',')).join('\r')],{type:'text/csv;charset=utf-8;'}); const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='MISSION_TES_Results.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);
  };
  window.exportTestWiseCSV=function(){
    const key=document.getElementById('testWiseTestSelect')?.value||''; const date=document.getElementById('testWiseDate')?.value||''; let rows=resultRows.filter(r=>String(r.testId||r.title||'')===key);if(date)rows=rows.filter(r=>String(r.date||'').slice(0,10)===date);rows.sort((a,b)=>pct(b)-pct(a)); if(!rows.length){alert('Select a test with results first.');return;}
    const data=[['Name of the Test',rows[0].title||'Mock Test'],['Subject','—'],['Date',date||String(rows[0].date||'').slice(0,10)],[],['Sl. No.','Candidate Name','Email','Individual Score','Percentage'],...rows.map((r,i)=>[i+1,r.userName||'',r.email||'',score(r).toFixed(2)+(maxMarks(r)?' / '+maxMarks(r).toFixed(2):''),pct(r).toFixed(2)+'%'])];
    const esc=v=>'"'+String(v??'').replace(/"/g,'""')+'"'; const blob=new Blob([data.map(row=>row.map(esc).join(',')).join('\r')],{type:'text/csv;charset=utf-8;'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='MISSION_TES_'+(rows[0].title||'Result').replace(/[^\w\-]+/g,'_').slice(0,80)+'_Result.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);
  };
  window.printTestWiseResult=function(){window.print();};

  async function activateAdminPanel(section){
    if(!adminLoggedIn || currentStudent) return;
    const ids={master:'adminSectionMasterPanel',student:'adminSectionStudentPanel',test:'adminSectionTestPanel',course:'adminSectionCoursePanel',video:'adminSectionVideoPanel',notes:'adminSectionNotesPanel',poster:'adminSectionPosterPanel',access:'adminSectionAccessPanel',freecontent:'adminSectionFreeContentPanel',result:'adminSectionResultPanel',admin:'adminSectionAdminPanel'};
    Object.entries(ids).forEach(([k,id])=>{
      const el=document.getElementById(id);
      if(!el) return;
      const active=k===section;
      el.classList.toggle('active',active);
      if(active){
        el.classList.add('v13-active');
        el.style.setProperty('display','block','important');
        el.style.setProperty('visibility','visible','important');
        el.style.setProperty('opacity','1','important');
      }else{
        el.classList.remove('v13-active');
        el.style.removeProperty('display');
        el.style.removeProperty('visibility');
        el.style.removeProperty('opacity');
      }
    });
    Object.entries({master:'adminNavMaster',student:'adminNavStudent',test:'adminNavTest',course:'adminNavCourse',video:'adminNavVideo',notes:'adminNavNotes',poster:'adminNavPoster',access:'adminNavAccess',freecontent:'adminNavFreeContent',result:'adminNavResult',admin:'adminNavAdmin'}).forEach(([k,id])=>document.getElementById(id)?.classList.toggle('active',k===section));
    if(section==='student') return renderAdminStudents();
    if(section==='test') return renderLibrary();
    if(section==='admin') return renderAdminAccount();
    if(section==='result'){
      const panel=document.getElementById('adminSectionResultPanel');
      const dash=panel?.querySelector(':scope > .dashPanel');
      [panel,dash].forEach(el=>{
        if(!el) return;
        el.classList.add('v13-active');
        el.style.setProperty('display','block','important');
        el.style.setProperty('visibility','visible','important');
        el.style.setProperty('opacity','1','important');
      });
      /* Render an explicit loading state, then replace it with live Supabase data. */
      resultLoadState='loading';
      resultLoadError='';
      renderResultRows();
      populateTestWise();
      window.renderTestWiseResults();
      try{
        await loadAdminResults();
        renderResultRows();
        populateTestWise();
        window.renderTestWiseResults();
      }catch(e){
        console.error('V1.5 result load failed:',e);
        renderResultRows();
        populateTestWise();
        window.renderTestWiseResults();
      }
    }
  }
  window.showAdminSection=activateAdminPanel;

  /* Admin logout: keep the single existing button inside the global header.
     The visual CSS positions that header cleanly; do not move/clone the node. */
  function placeLogout(){
    const b=document.getElementById('adminHeaderLogout'); if(!b)return;
    if(isAdminMode()){
      b.classList.remove('hidden');
      b.style.removeProperty('position');
      b.style.removeProperty('top');
      b.style.removeProperty('right');
      b.style.removeProperty('z-index');
      b.style.setProperty('writing-mode','horizontal-tb','important');
    }else{b.classList.add('hidden');}
  }
  window.v13PlaceAdminLogout=placeLogout;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',placeLogout);else placeLogout();

  /* Keep admin result state fresh after explicit refresh. */
  window.v13RefreshResults=async function(){
    if(!isAdminMode()) return;
    try{await loadAdminResults();}catch(e){console.error(e);} renderResultRows();populateTestWise();window.renderTestWiseResults();
  };
  window.addEventListener('scroll',()=>{ if(isAdminMode()) placeLogout(); },{passive:true});

})();


/* ===== Original inline script 5 — id: mission-tes-v16-result-rescue-clean ===== */

(function(){
  'use strict';
  const PANEL='adminSectionResultPanel';
  const OTHERS=['adminSectionStudentPanel','adminSectionTestPanel','adminSectionAdminPanel'];

  function visibleAdmin(){
    const admin=document.getElementById('adminOnlyDashboard');
    return !!(document.body.classList.contains('admin-ui') && admin && !admin.classList.contains('hidden'));
  }

  function activateResultDOM(){
    const panel=document.getElementById(PANEL);
    const admin=document.getElementById('adminOnlyDashboard');
    if(!panel || !admin || !visibleAdmin()) return false;
    OTHERS.forEach(id=>{
      const el=document.getElementById(id);
      if(!el) return;
      el.classList.remove('active','v13-active','v16-result-open');
    });
    panel.classList.add('active','v13-active','v16-result-open');
    panel.style.setProperty('display','block','important');
    panel.style.setProperty('visibility','visible','important');
    panel.style.setProperty('opacity','1','important');
    const dash=panel.querySelector(':scope > .dashPanel');
    if(dash){
      dash.style.setProperty('display','block','important');
      dash.style.setProperty('visibility','visible','important');
      dash.style.setProperty('opacity','1','important');
    }
    document.querySelectorAll('[id^="adminNav"]').forEach(b=>b.classList.toggle('active',b.id==='adminNavResult'));
    const title=document.getElementById('adminReferencePageTitle');
    const sub=document.getElementById('adminReferencePageSub');
    if(title) title.textContent='Result Management';
    if(sub) sub.textContent='Search, filter, inspect and manage candidate test results';
    return true;
  }

  async function openResult(){
    if(!activateResultDOM()) return;
    try{
      if(typeof window.loadAdminResults==='function') await window.loadAdminResults();
      else if(typeof window.loadAdminResultsFromSupabase==='function') await window.loadAdminResultsFromSupabase();
    }catch(e){ console.error('Result Management load:',e); }
    activateResultDOM();
    try{ if(typeof window.renderResultRows==='function') window.renderResultRows(); }catch(e){console.error('Result rows:',e);}
    try{ if(typeof window.renderAdminResultSummary==='function') window.renderAdminResultSummary(); }catch(e){console.error('Result summary:',e);}
    try{ if(typeof window.populateTestWiseSelector==='function') window.populateTestWiseSelector(); if(typeof window.renderTestWiseResults==='function') window.renderTestWiseResults(); }catch(e){console.error('Test-wise result:',e);}
    requestAnimationFrame(activateResultDOM);
  }

  function commitPendingAnswerForCurrentQuestion(){
  if(!Array.isArray(questions) || !questions.length) return;
  if(!Array.isArray(answers) || answers.length!==questions.length) answers=Array(questions.length).fill(null);
  if(!Array.isArray(pendingAnswers) || pendingAnswers.length!==questions.length) pendingAnswers=Array(questions.length).fill(null);
  if(!Array.isArray(marked) || marked.length!==questions.length) marked=Array(questions.length).fill(false);
  if(!Array.isArray(visited) || visited.length!==questions.length) visited=Array(questions.length).fill(false);
  const i=Math.max(0,Math.min(Number(current)||0,questions.length-1));
  // Selecting an option creates a draft; when the candidate submits, that
  // draft must not silently disappear.
  if(pendingAnswers[i]!==null && pendingAnswers[i]!==undefined){
    answers[i]=pendingAnswers[i];
    visited[i]=true;
  }
}

function bind(){
    const nav=document.getElementById('adminNavResult');
    if(!nav || nav.dataset.v16CleanBound) return;
    nav.dataset.v16CleanBound='1';
    // Capture phase guarantees the Result panel is activated before the inline onclick.
    nav.addEventListener('click',function(){
      if(!visibleAdmin()) return;
      activateResultDOM();
      setTimeout(openResult,0);
      setTimeout(activateResultDOM,50);
      setTimeout(activateResultDOM,250);
    },true);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',bind); else bind();
  window.v16OpenResultWorkspace=openResult;
})();


/* ===== Original inline script 6 — id: mission-tes-v16-result-rootfix ===== */

(function(){
  'use strict';
  const RESULT_ID='adminSectionResultPanel';
  const ADMIN_ID='adminOnlyDashboard';
  let originalShow=window.showAdminSection;

  function ensureAdminRoot(){
    const admin=document.getElementById(ADMIN_ID);
    const main=document.querySelector('.adminReferenceMain');
    if(!admin || !main) return false;
    if(admin.parentElement!==main) main.appendChild(admin);
    const panel=document.getElementById(RESULT_ID);
    /* The source HTML has the Result panel outside #adminOnlyDashboard because
       of an old unmatched wrapper. Move only this panel into the Admin root. */
    if(panel && panel.parentElement!==admin) admin.appendChild(panel);
    admin.classList.remove('hidden');
    admin.style.removeProperty('display');
    return true;
  }

  function activateResultRoot(){
    if(!ensureAdminRoot()) return false;
    const admin=document.getElementById(ADMIN_ID);
    const panel=document.getElementById(RESULT_ID);
    if(!panel) return false;

    admin.classList.remove('hidden');
    admin.style.setProperty('display','block','important');
    admin.style.setProperty('visibility','visible','important');
    admin.style.setProperty('opacity','1','important');

    ['adminSectionStudentPanel','adminSectionTestPanel','adminSectionAdminPanel'].forEach(id=>{
      const el=document.getElementById(id);
      if(el){el.classList.remove('active','v13-active','v16-result-open','v16-root-result-active');}
    });

    panel.classList.add('active','v13-active','v16-result-open','v16-root-result-active');
    panel.style.setProperty('display','block','important');
    panel.style.setProperty('visibility','visible','important');
    panel.style.setProperty('opacity','1','important');
    panel.style.setProperty('width','100%','important');
    panel.style.setProperty('height','auto','important');

    const dash=panel.querySelector(':scope > .dashPanel');
    if(dash){
      dash.style.setProperty('display','block','important');
      dash.style.setProperty('visibility','visible','important');
      dash.style.setProperty('opacity','1','important');
      dash.style.setProperty('width','100%','important');
    }

    ['adminNavStudent','adminNavTest','adminNavResult','adminNavAdmin'].forEach(id=>{
      const b=document.getElementById(id);
      if(b) b.classList.toggle('active',id==='adminNavResult');
    });
    const title=document.getElementById('adminReferencePageTitle');
    const sub=document.getElementById('adminReferencePageSub');
    if(title) title.textContent='Result Management';
    if(sub) sub.textContent='Search, filter, inspect and manage candidate test results';
    return true;
  }

  async function openResult(){
    activateResultRoot();
    try{
      if(typeof window.loadAdminResults==='function') await window.loadAdminResults();
      else if(typeof window.loadAdminResultsFromSupabase==='function') await window.loadAdminResultsFromSupabase();
    }catch(e){ console.error('Result Management rootfix load:',e); }
    activateResultRoot();
    try{ if(typeof window.renderResultRows==='function') window.renderResultRows(); }catch(e){console.error(e);}
    try{ if(typeof window.renderAdminResultSummary==='function') window.renderAdminResultSummary(); }catch(e){console.error(e);}
    try{ if(typeof window.populateTestWiseSelector==='function') window.populateTestWiseSelector(); }catch(e){console.error(e);}
    try{ if(typeof window.renderTestWiseResults==='function') window.renderTestWiseResults(); }catch(e){console.error(e);}
    requestAnimationFrame(activateResultRoot);
  }

  
window.freeGateLoginSubmit=async function(){ if(window.hoaOpenFreeContent){ window.hoaOpenFreeContent(); return; } };
function install(){
    const nav=document.getElementById('adminNavResult');
    if(nav && !nav.dataset.v16RootFixBound){
      nav.dataset.v16RootFixBound='1';
      nav.addEventListener('click',function(){
        activateResultRoot();
        setTimeout(openResult,0);
      },true);
    }

    if(window.showAdminSection && !window.showAdminSection.__v16RootWrapped){
      originalShow=window.showAdminSection;
      const wrapped=function(section){
        const r=originalShow.apply(this,arguments);
        if(section==='result'){
          activateResultRoot();
          Promise.resolve(r).then(openResult).catch(openResult);
        }
        return r;
      };
      wrapped.__v16RootWrapped=true;
      wrapped.__v16Original=originalShow;
      window.showAdminSection=wrapped;
    }
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install); else install();
  window.v16ResultRootFix=openResult;
})();


/* ===== Original inline script 7 — id: v17-home-admin-toggle ===== */

function toggleHomeAdminLogin(){
  const body = document.getElementById('homeAdminBody');
  const button = document.getElementById('homeAdminToggle');
  if(!body || !button) return;
  const open = body.hidden;
  body.hidden = !open;
  if(open) body.style.setProperty('display','block','important');
  else body.style.removeProperty('display');
  button.setAttribute('aria-expanded', String(open));
  button.textContent = open ? 'CLOSE' : 'ADMIN LOGIN';
  if(open){
    const input = document.getElementById('adminUsername');
    if(input) setTimeout(()=>input.focus(), 80);
  }
}


/* ===== Original inline script 8 — id: v19-ui03-instructions-guard ===== */

document.addEventListener("keydown",function(e){
  var modal=document.getElementById("testInstructionsModal");
  if(!modal || modal.classList.contains("hidden")) return;
  if(e.key==="Escape"){ e.preventDefault(); closeTestInstructions(); }
});


/* ===== Original inline script 15 — id: mission-v31-final-hardening-js ===== */

(function(){
  /* Keep the historical result cache scoped to the authenticated student. */
  window.MISSION_TES_FINAL_HARDENING=true;
})();


/* ===== Original inline script 16 — id: mission-v36-admin-workspace-isolation ===== */

(function(){
  function adminMode(){
    return document.body.classList.contains('admin-ui');
  }

  function selectedAdminSection(){
    const active = document.querySelector('#adminReferenceSidebar [data-section].active, #adminReferenceSidebar button.active, #adminSectionNav [data-section].active, #adminSectionNav button.active');
    if(active) return String(active.getAttribute('data-section')||'').toLowerCase();
    const result = document.getElementById('adminNavResult');
    if(result && result.classList.contains('active')) return 'result';
    const test = document.getElementById('adminNavTest');
    if(test && test.classList.contains('active')) return 'test-making';
    const main = document.getElementById('adminNavAdmin');
    if(main && main.classList.contains('active')) return 'admin-section';
    return '';
  }

  function hideResultHard(){
    ['resultManagement','resultSection'].forEach(id=>{
      const el=document.getElementById(id);
      if(el){
        el.style.setProperty('display','none','important');
        el.style.setProperty('visibility','hidden','important');
        el.style.setProperty('opacity','0','important');
        el.style.setProperty('pointer-events','none','important');
      }
    });
    document.querySelectorAll('.resultManagement,.result-section').forEach(el=>{
      el.style.setProperty('display','none','important');
      el.style.setProperty('visibility','hidden','important');
      el.style.setProperty('opacity','0','important');
      el.style.setProperty('pointer-events','none','important');
    });
  }

  function releaseResult(){
    ['resultManagement','resultSection'].forEach(id=>{
      const el=document.getElementById(id);
      if(el){
        el.style.removeProperty('display');
        el.style.removeProperty('visibility');
        el.style.removeProperty('opacity');
        el.style.removeProperty('pointer-events');
      }
    });
    document.querySelectorAll('.resultManagement,.result-section').forEach(el=>{
      el.style.removeProperty('display');
      el.style.removeProperty('visibility');
      el.style.removeProperty('opacity');
      el.style.removeProperty('pointer-events');
    });
  }

  function enforce(){
    if(!adminMode()) return;
    const sec=selectedAdminSection();
    if(sec!=='result' && sec!=='results' && sec!=='result-management'){
      hideResultHard();
    }else{
      releaseResult();
    }
  }

  function bind(){
    document.addEventListener('click',function(e){
      const b=e.target.closest('#adminReferenceSidebar [data-section], #adminReferenceSidebar button, #adminSectionNav [data-section], #adminSectionNav button');
      if(!b) return;
      setTimeout(enforce,0);
      setTimeout(enforce,80);
      setTimeout(enforce,300);
    },true);

    // Older result scripts can re-open the result root after navigation.
    const observer=new MutationObserver(function(){
      if(adminMode() && selectedAdminSection()!=='result' && selectedAdminSection()!=='results' && selectedAdminSection()!=='result-management'){
        hideResultHard();
      }
    });
    observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style']});
    setTimeout(enforce,0);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',bind);
  else bind();
})();


/* V6.0.3: legacy result-section MutationObserver retired; authoritative Admin controller owns navigation. */

/* ===== Original inline script 18 — id: mission-v38-admin-attempt-back-fix ===== */

(function(){
  'use strict';
  function isAdminHistoricalReview(){
    /* V5.0.3 final navigation fix:
       A historical attempt object can exist for BOTH student and admin
       reviews. It must never be used to infer Admin mode.
       Admin historical review is valid only with a real Admin session and
       no active student session. */
    return !!(
      window.__missionTESHistoricalAttempt &&
      typeof adminLoggedIn !== 'undefined' &&
      adminLoggedIn === true &&
      (!currentStudent) &&
      document.getElementById('adminOnlyDashboard')?.classList.contains('hidden') &&
      !document.getElementById('result')?.classList.contains('hidden')
    );
  }
  function returnToAdminResultManagement(){
    try{
      window.__missionTESReviewSnapshot=null;
      window.__missionTESHistoricalAttempt=null;
      document.getElementById('result')?.classList.add('hidden');
      document.getElementById('exam')?.classList.add('hidden');
      /* The attempt-review screen hides #home. The Admin dashboard is inside
         #home, so restore the parent before restoring the Admin dashboard. */
      document.getElementById('home')?.classList.remove('hidden');
      document.getElementById('adminOnlyDashboard')?.classList.remove('hidden');
      document.getElementById('studentOnlyDashboard')?.classList.add('hidden');
      if(typeof showDashboardTab==='function') showDashboardTab('admin');
      if(typeof activateAdminPanel==='function') activateAdminPanel('result');
      else if(typeof window.showAdminSection==='function') window.showAdminSection('result');
      if(typeof renderResultRows==='function') renderResultRows();
      const back=document.getElementById('resultBackBtn');
      if(back){
        back.textContent='← BACK TO RESULT MANAGEMENT';
        back.onclick=returnToAdminResultManagement;
      }
    }catch(e){
      console.error('V4.2 admin result return failed:',e);
      document.getElementById('result')?.classList.add('hidden');
      document.getElementById('home')?.classList.remove('hidden');
      document.getElementById('adminOnlyDashboard')?.classList.remove('hidden');
    }
  }
  window.returnToAdminResultManagement=returnToAdminResultManagement;

  document.addEventListener('click',function(e){
    const b=e.target.closest('#resultBackBtn');
    if(!b) return;
    /* Never intercept student navigation with the Admin return handler. */
    if(typeof adminLoggedIn === 'undefined' || adminLoggedIn !== true || currentStudent) return;
    if(!isAdminHistoricalReview()) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    returnToAdminResultManagement();
  },true);
})();

/* ===== Original inline script 11 ===== */
/* V5.0.3 stability guard: UI safety only; Supabase authentication/RLS remain
   the actual security boundary. */
(function(){
  function enforceAdminUiGuard(){
    try{
      var adminLogged =
        (typeof window.adminLoggedIn !== "undefined" && window.adminLoggedIn === true) ||
        (typeof adminLoggedIn !== "undefined" && adminLoggedIn === true);

      if(!adminLogged){
        document.querySelectorAll(
          "#adminOnlyDashboard, #adminSectionResultPanel, #adminDashboard, #adminPanel"
        ).forEach(function(el){
          el.classList.add("hidden");
        });
        document.documentElement.classList.remove("admin-ui");
        if(document.body) document.body.classList.remove("admin-ui");
      }
    }catch(e){
      console.warn("V5.0.3 admin UI guard:", e);
    }
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", enforceAdminUiGuard);
  }else{
    enforceAdminUiGuard();
  }
})();
