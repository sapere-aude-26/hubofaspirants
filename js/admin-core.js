/* ============================================================
   HOA SAFE CONSOLIDATION PHASE 6D — ADMIN CORE GROUP 1/3
   Original source: js/admin/management.js
   Source preserved verbatim; contiguous execution order preserved.
   ============================================================ */

/* HOA V6.1.0 — Feature-separated JavaScript module.
   Original inline script #18 (id: hoa-v54-admin-management).
   Execution position intentionally preserved from V6.0.9. */


(function(){
  "use strict";

  function isAdminVisible(){
    var a=document.getElementById("adminOnlyDashboard") ||
          document.getElementById("adminDashboard") ||
          document.getElementById("adminPanel");
    return !!(a && !a.classList.contains("hidden"));
  }

  function firstFunction(names){
    for(var i=0;i<names.length;i++){
      if(typeof window[names[i]]==="function") return window[names[i]];
    }
    return null;
  }

  function esc(v){
    return String(v==null?"":v).replace(/[&<>"']/g,function(c){
      return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c];
    });
  }

  function ensureWorkspace(){
    if(document.getElementById("hoaV54Management")) return;
    var admin = document.getElementById("adminOnlyDashboard") ||
                document.getElementById("adminDashboard") ||
                document.getElementById("adminPanel");
    if(!admin || !admin.parentNode) return;

    var box=document.createElement("section");
    box.id="hoaV54Management";
    box.className="card hoa-v54-management hidden";
    box.innerHTML =
      '<div class="hoa-v54-head">'+
        '<div><h2>Admin Management</h2>'+
        '<p>Manage tests, questions, candidates and results.</p></div>'+
        '<button type="button" id="hoaV54Refresh">↻ Refresh</button>'+
      '</div>'+
      '<div class="hoa-v54-tabs">'+
        '<button type="button" data-v54-tab="tests" class="active">Tests</button>'+
        '<button type="button" data-v54-tab="questions">Questions</button>'+
        '<button type="button" data-v54-tab="candidates">Candidates</button>'+
        '<button type="button" data-v54-tab="results">Results</button>'+
      '</div>'+
      '<div id="hoaV54Content"></div>';

    admin.parentNode.insertBefore(box,admin.nextSibling);

    box.querySelectorAll("[data-v54-tab]").forEach(function(b){
      b.addEventListener("click",function(){
        box.querySelectorAll("[data-v54-tab]").forEach(function(x){x.classList.remove("active");});
        b.classList.add("active");
        renderTab(b.getAttribute("data-v54-tab"));
      });
    });
    document.getElementById("hoaV54Refresh").onclick=function(){
      renderTab((box.querySelector("[data-v54-tab].active")||{}).getAttribute ?
        box.querySelector("[data-v54-tab].active").getAttribute("data-v54-tab") : "tests");
    };

    function renderTab(tab){
      var c=document.getElementById("hoaV54Content");
      if(!c) return;

      if(tab==="tests"){
        c.innerHTML='<div class="hoa-v54-empty"><b>Test Management</b><p>Use the existing Test Making workspace for creating and editing tests. This management panel is a safe navigation/overview layer.</p></div>';
        return;
      }
      if(tab==="questions"){
        c.innerHTML='<div class="hoa-v54-empty"><b>Question Management</b><p>Questions remain protected by the existing Admin workflow and database permissions. Use Test Making to add or edit questions.</p></div>';
        return;
      }
      if(tab==="candidates"){
        c.innerHTML='<div class="hoa-v54-empty"><b>Candidate Management</b><p>Candidate records are protected by Supabase permissions. The existing Student/Admin areas remain unchanged.</p></div>';
        return;
      }
      if(tab==="results"){
        c.innerHTML='<div class="hoa-v54-empty"><b>Result Management</b><p>Use the existing Result Management workspace for View Result and View Attempt. No Publish step is added.</p></div>';
      }
    }

    window.HOA_v54_show=function(){
      if(!isAdminVisible()) return;
      box.classList.remove("hidden");
      renderTab("tests");
    };
  }

  function bindAdminNav(){
    ensureWorkspace();
    var buttons=document.querySelectorAll('[id^="adminNav"]');
    buttons.forEach(function(b){
      if(b.dataset.hoaV54Bound) return;
      b.dataset.hoaV54Bound="1";
      b.addEventListener("click",function(){
        setTimeout(function(){
          if(isAdminVisible()) ensureWorkspace();
        },50);
      },true);
    });
  }

  function sync(){
    ensureWorkspace();
    var box=document.getElementById("hoaV54Management");
    if(!box) return;
    /* Keep the additive panel hidden by default; it is only exposed through
       an explicit Admin-management hook, never by Student navigation. */
    if(!isAdminVisible()) box.classList.add("hidden");
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",function(){bindAdminNav();sync();});
  else {bindAdminNav();sync();}
})();


/* ============================================================
   HOA SAFE CONSOLIDATION PHASE 6D — ADMIN CORE GROUP 2/3
   Original source: js/admin/crud.js
   Source preserved verbatim; contiguous execution order preserved.
   ============================================================ */

/* HOA V6.1.0 — Feature-separated JavaScript module.
   Original inline script #19 (id: hoa-v57-admin-crud).
   Execution position intentionally preserved from V6.0.9. */


(function(){
  "use strict";
  var state={tests:[],questions:[],students:[],attempts:[]};

  function adminOK(){
    return typeof adminLoggedIn!=="undefined" && adminLoggedIn===true;
  }
  function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){
    return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c];
  });}

  async function loadTable(name){
    if(!window.supabase || !supabase.from) return [];
    try{
      var r=await supabase.from(name).select("*").limit(500);
      if(r.error) throw r.error;
      return r.data||[];
    }catch(e){
      console.warn("V5.7 "+name+" load:",e);
      return [];
    }
  }

  function renderTests(){
    var c=document.getElementById("hoaV57CrudContent"); if(!c)return;
    var q=(document.getElementById("hoaV57Search")||{}).value||"";
    var rows=state.tests.filter(function(x){
      return !q || String(x.title||"").toLowerCase().includes(q.toLowerCase());
    });
    c.innerHTML='<div class="hoa-v57-toolbar"><input id="hoaV57Search" placeholder="Search tests" value="'+esc(q)+'"><button class="hoa-v57-primary" id="hoaV57Reload">↻ Refresh</button></div>'+
      (rows.length?'<table class="hoa-v57-table"><thead><tr><th>Test</th><th>Duration</th><th>Marks</th><th>Status</th></tr></thead><tbody>'+
      rows.map(function(x){return '<tr><td><b>'+esc(x.title)+'</b><br><span class="hoa-v57-note">'+esc(x.description||"")+'</span></td><td>'+esc(x.duration_minutes)+'</td><td>'+esc(x.marks_per_question)+'</td><td>'+ (x.is_published?'Published':'Unpublished')+'</td></tr>';}).join("")+
      '</tbody></table>':'<div class="hoa-v57-empty">No tests found.</div>')+
      '<div class="hoa-v57-note">Existing Test Making remains the authoritative create/edit workflow. This panel is read/management oriented to protect the working V5.4 flow.</div>';
    document.getElementById("hoaV57Search").oninput=renderTests;
    document.getElementById("hoaV57Reload").onclick=async function(){state.tests=await loadTable("tests");renderTests();};
  }

  function renderQuestions(){
    var c=document.getElementById("hoaV57CrudContent"); if(!c)return;
    c.innerHTML='<div class="hoa-v57-toolbar"><button class="hoa-v57-primary" id="hoaV57ReloadQ">↻ Refresh Questions</button></div>'+
      '<div class="hoa-v57-empty">Question Management is connected to the existing protected question structure. Correct-answer fields are intentionally not displayed in this Admin overview.</div>'+
      '<div class="hoa-v57-note">Use the existing Test Making workflow for adding/editing questions.</div>';
    document.getElementById("hoaV57ReloadQ").onclick=async function(){state.questions=await loadTable("student_questions");};
  }

  function renderCandidates(){
    var c=document.getElementById("hoaV57CrudContent"); if(!c)return;
    var q=(document.getElementById("hoaV57Search")||{}).value||"";
    var rows=state.students.filter(function(x){
      var s=(x.full_name||"")+" "+(x.email||"")+" "+(x.phone||"");
      return !q || s.toLowerCase().includes(q.toLowerCase());
    });
    c.innerHTML='<div class="hoa-v57-toolbar"><input id="hoaV57Search" placeholder="Search candidates" value="'+esc(q)+'"><button id="hoaV57Reload">↻ Refresh</button></div>'+
      (rows.length?'<table class="hoa-v57-table"><thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Status</th></tr></thead><tbody>'+
      rows.map(function(x){return '<tr><td>'+esc(x.full_name)+'</td><td>'+esc(x.email)+'</td><td>'+esc(x.phone)+'</td><td>'+esc(x.status)+'</td></tr>';}).join("")+
      '</tbody></table>':'<div class="hoa-v57-empty">No candidates found.</div>');
    document.getElementById("hoaV57Search").oninput=renderCandidates;
    document.getElementById("hoaV57Reload").onclick=async function(){state.students=await loadTable("students");renderCandidates();};
  }

  function renderResults(){
    var c=document.getElementById("hoaV57CrudContent"); if(!c)return;
    var rows=state.attempts;
    c.innerHTML='<div class="hoa-v57-toolbar"><button id="hoaV57Reload" type="button">↻ Refresh Results</button></div>'+
      (rows.length?'<table class="hoa-v57-table"><thead><tr><th>Status</th><th>Score</th><th>Correct</th><th>Wrong</th><th>Skipped</th><th>Submitted</th></tr></thead><tbody>'+
      rows.map(function(x){return '<tr><td>'+esc(x.status)+'</td><td>'+esc(x.score)+'</td><td>'+esc(x.correct_answers)+'</td><td>'+esc(x.wrong_answers)+'</td><td>'+esc(x.unanswered)+'</td><td>'+esc(x.submitted_at||"")+'</td></tr>';}).join("")+
      '</tbody></table>':'<div class="hoa-v57-empty">No attempts found.</div>');
    document.getElementById("hoaV57Reload").onclick=async function(){state.attempts=await loadTable("attempts");renderResults();};
  }

  async function show(tab){
    if(!adminOK()) return;
    var box=document.getElementById("hoaV57Crud"); if(!box)return;
    box.classList.remove("hidden");
    if(tab==="tests"){state.tests=await loadTable("tests");renderTests();}
    if(tab==="questions"){renderQuestions();}
    if(tab==="candidates"){state.students=await loadTable("students");renderCandidates();}
    if(tab==="results"){state.attempts=await loadTable("attempts");renderResults();}
  }

  function install(){
    var anchor=document.getElementById("hoaV54Management");
    if(!anchor || document.getElementById("hoaV57Crud")) return;
    var box=document.createElement("section");
    box.id="hoaV57Crud"; box.className="hoa-v57-crud hidden";
    box.innerHTML='<h3>Admin Management — V5.5–V5.7</h3>'+
      '<div class="hoa-v57-toolbar">'+
      '<button data-v57="tests">Test Management</button>'+
      '<button data-v57="questions">Question Management</button>'+
      '<button data-v57="candidates">Candidate Management</button>'+
      '<button data-v57="results">Result Management</button></div>'+
      '<div id="hoaV57CrudContent"></div>';
    anchor.appendChild(box);
    box.querySelectorAll("[data-v57]").forEach(function(b){b.onclick=function(){show(b.dataset.v57);};});
  }

  function sync(){install();var b=document.getElementById("hoaV57Crud");if(b&&!adminOK())b.classList.add("hidden");}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",sync);else sync();
  setInterval(function(){if(document.visibilityState==="visible" && window.adminLoggedIn===true)sync();},10000);
})();


/* ============================================================
   HOA SAFE CONSOLIDATION PHASE 6D — ADMIN CORE GROUP 3/3
   Original source: js/admin/direct-crud.js
   Source preserved verbatim; contiguous execution order preserved.
   ============================================================ */

/* HOA V6.1.0 — Feature-separated JavaScript module.
   Original inline script #20 (id: hoa-v58-direct-crud).
   Execution position intentionally preserved from V6.0.9. */


(function(){
  "use strict";
  var state={tests:[],questions:[],students:[],attempts:[]};

  function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){
    return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c];
  });}
  function adminFlag(){
    try{return typeof adminLoggedIn!=="undefined" && adminLoggedIn===true;}catch(e){return false;}
  }
  async function verifyAdmin(){
    if(!adminFlag()) throw new Error("Admin login required.");
    if(window.supabase && supabase.rpc){
      try{
        var r=await supabase.rpc("is_app_admin");
        if(r.error) throw r.error;
        if(r.data!==true) throw new Error("Admin verification failed.");
      }catch(e){
        throw new Error("Admin verification failed. Please sign in again.");
      }
    }
  }
  async function load(name){
    if(!window.supabase || !supabase.from) return [];
    var r=await supabase.from(name).select("*").limit(500);
    if(r.error) throw r.error;
    return r.data||[];
  }
  function modal(title,body){
    var old=document.getElementById("hoaV58Modal"); if(old) old.remove();
    var d=document.createElement("div"); d.id="hoaV58Modal"; d.className="hoa-v58-modal-backdrop";
    d.innerHTML='<div class="hoa-v58-modal"><h3>'+esc(title)+'</h3>'+body+'</div>';
    d.addEventListener("click",function(e){if(e.target===d)d.remove();});
    document.body.appendChild(d);
    return d;
  }
  function input(label,name,value,type){
    return '<label>'+esc(label)+'</label><input name="'+esc(name)+'" type="'+(type||"text")+'" value="'+esc(value==null?"":value)+'">';
  }
  function textarea(label,name,value){
    return '<label>'+esc(label)+'</label><textarea name="'+esc(name)+'">'+esc(value==null?"":value)+'</textarea>';
  }

  async function editTest(row){
    var d=modal("Edit Test",
      '<form class="hoa-v58-form" id="hoaV58Form">'+
      input("Title","title",row.title)+textarea("Description","description",row.description)+
      input("Duration (minutes)","duration_minutes",row.duration_minutes,"number")+
      input("Marks per question","marks_per_question",row.marks_per_question,"number")+
      input("Negative marking","negative_marking",row.negative_marking,"number")+
      '<label>Access Type</label><select name="access_type"><option value="FREE">FREE</option><option value="PAID">PAID</option></select>'+
      '<label>Published</label><select name="is_published"><option value="false">Unpublished</option><option value="true">Published</option></select>'+
      '<div class="hoa-v58-actions"><button type="submit" class="save">Save Changes</button><button type="button" id="hoaV58Cancel">Cancel</button></div>'+
      '<div id="hoaV58Msg"></div></form>');
    d.querySelector('[name="access_type"]').value=row.access_type||"FREE";
    d.querySelector('[name="is_published"]').value=String(!!row.is_published);
    d.querySelector("#hoaV58Cancel").onclick=function(){d.remove();};
    d.querySelector("form").onsubmit=async function(e){
      e.preventDefault();
      var f=new FormData(e.target), payload={
        title:f.get("title"),description:f.get("description"),
        duration_minutes:Number(f.get("duration_minutes")||0),
        marks_per_question:Number(f.get("marks_per_question")||0),
        negative_marking:Number(f.get("negative_marking")||0),
        access_type:f.get("access_type"),
        is_published:f.get("is_published")==="true"
      };
      try{await verifyAdmin();await window.hoaRequireAdminPermission("tests.manage");var r=await supabase.from("tests").update(payload).eq("id",row.id);
        if(r.error)throw r.error;d.remove();await refresh("tests");alert("Test updated successfully.");
      }catch(err){d.querySelector("#hoaV58Msg").innerHTML='<div class="hoa-v58-msg">Update failed: '+esc(err.message)+'</div>';}
    };
  }

  async function editQuestion(row){
    var d=modal("Edit Question",
      '<form class="hoa-v58-form" id="hoaV58Form">'+
      textarea("Question","question_text",row.question_text)+
      input("Option 1","option_1",row.option_1)+input("Option 2","option_2",row.option_2)+
      input("Option 3","option_3",row.option_3)+input("Option 4","option_4",row.option_4)+
      input("Correct option (1–4)","correct_option",row.correct_option,"number")+
      input("Question order","question_order",row.question_order,"number")+
      textarea("Explanation","explanation",row.explanation)+
      '<div class="hoa-v58-actions"><button type="submit" class="save">Save Changes</button><button type="button" id="hoaV58Cancel">Cancel</button></div>'+
      '<div id="hoaV58Msg"></div></form>');
    d.querySelector("#hoaV58Cancel").onclick=function(){d.remove();};
    d.querySelector("form").onsubmit=async function(e){
      e.preventDefault();var f=new FormData(e.target), co=Number(f.get("correct_option"));
      if(co<1||co>4){d.querySelector("#hoaV58Msg").innerHTML='<div class="hoa-v58-msg">Correct option must be 1–4.</div>';return;}
      var payload={question_text:f.get("question_text"),option_1:f.get("option_1"),option_2:f.get("option_2"),option_3:f.get("option_3"),option_4:f.get("option_4"),correct_option:co,question_order:Number(f.get("question_order")||0),explanation:f.get("explanation")};
      try{await verifyAdmin();await window.hoaRequireAdminPermission("tests.manage");var r=await supabase.from("questions").update(payload).eq("id",row.id);
        if(r.error)throw r.error;d.remove();await refresh("questions");alert("Question updated successfully.");
      }catch(err){d.querySelector("#hoaV58Msg").innerHTML='<div class="hoa-v58-msg">Update failed: '+esc(err.message)+'</div>';}
    };
  }

  async function editStudent(row){
    var d=modal("Edit Candidate",
      '<form class="hoa-v58-form" id="hoaV58Form">'+
      input("Full name","full_name",row.full_name)+input("Email","email",row.email,"email")+
      input("Phone","phone",row.phone)+input("Qualification","qualification",row.qualification)+
      input("Passout year","passout_year",row.passout_year,"number")+input("College name","college_name",row.college_name)+
      '<label>Status</label><select name="status"><option>active</option><option>inactive</option></select>'+
      '<label>Access type</label><select name="access_type"><option value="FREE">FREE</option><option value="PAID">PAID</option></select>'+
      '<div class="hoa-v58-actions"><button type="submit" class="save">Save Changes</button><button type="button" id="hoaV58Cancel">Cancel</button></div><div id="hoaV58Msg"></div></form>');
    d.querySelector('[name="status"]').value=row.status||"active";
    d.querySelector('[name="access_type"]').value=row.access_type||"FREE";
    d.querySelector("#hoaV58Cancel").onclick=function(){d.remove();};
    d.querySelector("form").onsubmit=async function(e){
      e.preventDefault();var f=new FormData(e.target);
      var payload={full_name:f.get("full_name"),email:f.get("email"),phone:f.get("phone"),qualification:f.get("qualification"),passout_year:Number(f.get("passout_year")||0),college_name:f.get("college_name"),status:f.get("status"),access_type:f.get("access_type")};
      try{await verifyAdmin();await window.hoaRequireAdminPermission("students.manage");var r=await supabase.from("students").update(payload).eq("id",row.id);
        if(r.error)throw r.error;d.remove();await refresh("candidates");alert("Candidate updated successfully.");
      }catch(err){d.querySelector("#hoaV58Msg").innerHTML='<div class="hoa-v58-msg">Update failed: '+esc(err.message)+'</div>';}
    };
  }

  async function deleteRow(table,id,label){
    var warning=table==="students" ?
      "Deleting this candidate will also delete their attempts and answers because of database CASCADE rules." :
      table==="tests" ? "Deleting this test will also delete its questions and related attempts/answers because of database CASCADE rules." :
      table==="questions" ? "Deleting this question will also delete its stored answers from existing attempts." :
      "This will permanently delete the selected record.";
    if(!confirm("Delete "+label+"?\\"+warning+"\\This cannot be undone."))return;
    try{
      await verifyAdmin();
      const permission=table==="students"?"students.manage":table==="tests"?"tests.manage":table==="questions"?"tests.manage":table==="attempts"?"results.manage":null;
      if(permission)await window.hoaRequireAdminPermission(permission);
      if(table==="attempts"){
        var session = window.supabaseClient && supabaseClient.auth ? await supabaseClient.auth.getSession() : null;
        var token = session && session.data && session.data.session ? session.data.session.access_token : null;
        if(!token) throw new Error("A valid Admin session is required.");
        var fn = await supabaseClient.functions.invoke("admin-delete-attempt-v2", {body:{attempt_id:id}});
        if(fn.error) throw fn.error;
        if(fn.data && fn.data.error) throw new Error(fn.data.error);
        alert(label+" deleted successfully.");
      } else {
        var r = await supabaseClient.from(table).delete().eq("id",id);
        if(r.error) throw r.error;
        alert(label+" deleted successfully.");
      }
      await refresh(table==="students"?"candidates":table==="tests"?"tests":table==="questions"?"questions":"results");
    }catch(err){alert("Delete failed: "+err.message);}
  }

  function actionButtons(row,kind){
    var id=esc(row.id);
    if(kind==="tests")return '<div class="hoa-v58-row-actions"><button data-edit="'+id+'">Edit</button><button class="delete" data-delete="'+id+'">Delete</button></div>';
    if(kind==="questions")return '<div class="hoa-v58-row-actions"><button data-edit="'+id+'">Edit</button><button class="delete" data-delete="'+id+'">Delete</button></div>';
    if(kind==="candidates")return '<div class="hoa-v58-row-actions"><button data-edit="'+id+'">Edit</button><button class="delete" data-delete="'+id+'">Delete</button></div>';
    if(kind==="results")return '<div class="hoa-v58-row-actions"><button class="delete" data-delete="'+id+'">Delete Result / Attempt</button></div>';
    return "";
  }

  async function render(kind){
    var c=document.getElementById("hoaV57CrudContent");if(!c)return;
    var rows=state[kind]||[];
    if(kind==="tests"){
      c.innerHTML='<div class="hoa-v57-toolbar"><input id="hoaV58Search" placeholder="Search tests"><button id="hoaV58Refresh">↻ Refresh</button></div>'+
      (rows.length?'<table class="hoa-v57-table"><thead><tr><th>Test</th><th>Duration</th><th>Marks</th><th>Status</th><th>Actions</th></tr></thead><tbody>'+
      rows.map(function(x){return '<tr><td><b>'+esc(x.title)+'</b><br><span class="hoa-v57-note">'+esc(x.description||"")+'</span></td><td>'+esc(x.duration_minutes)+'</td><td>'+esc(x.marks_per_question)+'</td><td>'+ (x.is_published?'Published':'Unpublished')+'</td><td>'+actionButtons(x,"tests")+'</td></tr>';}).join("")+
      '</tbody></table>':'<div class="hoa-v57-empty">No tests found.</div>');
    } else if(kind==="questions"){
      c.innerHTML='<div class="hoa-v57-toolbar"><button id="hoaV58Refresh">↻ Refresh Questions</button></div>'+
      (rows.length?'<table class="hoa-v57-table"><thead><tr><th>Question</th><th>Test</th><th>Order</th><th>Actions</th></tr></thead><tbody>'+
      rows.map(function(x){return '<tr><td>'+esc(x.question_text)+'</td><td>'+esc(x.test_id)+'</td><td>'+esc(x.question_order)+'</td><td>'+actionButtons(x,"questions")+'</td></tr>';}).join("")+
      '</tbody></table>':'<div class="hoa-v57-empty">No questions found.</div>');
    } else if(kind==="candidates"){
      c.innerHTML='<div class="hoa-v57-toolbar"><input id="hoaV58Search" placeholder="Search candidates"><button id="hoaV58Refresh" type="button">↻ Refresh</button></div>'+
      (rows.length?'<table class="hoa-v57-table"><thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Status</th><th>Actions</th></tr></thead><tbody>'+
      rows.map(function(x){return '<tr><td>'+esc(x.full_name)+'</td><td>'+esc(x.email)+'</td><td>'+esc(x.phone)+'</td><td>'+esc(x.status)+'</td><td>'+actionButtons(x,"candidates")+'</td></tr>';}).join("")+
      '</tbody></table>':'<div class="hoa-v57-empty">No candidates found.</div>');
    } else {
      c.innerHTML='<div class="hoa-v57-toolbar"><button id="hoaV58Refresh" type="button">↻ Refresh Results</button></div><div class="hoa-v58-note" style="margin:8px 0;font-weight:600">Result Management — Delete Result / Attempt</div>'+
      (rows.length?'<table class="hoa-v57-table"><thead><tr><th>Candidate ID</th><th>Test ID</th><th>Status</th><th>Score</th><th>Correct</th><th>Wrong</th><th>Skipped</th><th>Submitted</th><th>Actions</th></tr></thead><tbody>'+
      rows.map(function(x){return '<tr><td>'+esc(x.student_id)+'</td><td>'+esc(x.test_id)+'</td><td>'+esc(x.status)+'</td><td>'+esc(x.score)+'</td><td>'+esc(x.correct_answers)+'</td><td>'+esc(x.wrong_answers)+'</td><td>'+esc(x.unanswered)+'</td><td>'+esc(x.submitted_at||"")+'</td><td>'+actionButtons(x,"results")+'</td></tr>';}).join("")+
      '</tbody></table>':'<div class="hoa-v57-empty">No attempts found.</div>');
    }
    var rf=document.getElementById("hoaV58Refresh");if(rf)rf.onclick=function(){refresh(kind);};
    var s=document.getElementById("hoaV58Search");if(s)s.oninput=function(){var q=s.value.toLowerCase();document.querySelectorAll("#hoaV57CrudContent tbody tr").forEach(function(tr){tr.style.display=tr.textContent.toLowerCase().includes(q)?"":"none";});};
    c.querySelectorAll("[data-edit]").forEach(function(b){b.onclick=function(){var row=rows.find(function(x){return x.id===b.dataset.edit;});if(!row)return;kind==="tests"?editTest(row):kind==="questions"?editQuestion(row):editStudent(row);};});
    c.querySelectorAll("[data-delete]").forEach(function(b){b.onclick=function(){deleteRow(kind==="candidates"?"students":kind==="tests"?"tests":kind==="questions"?"questions":"attempts",b.dataset.delete,kind==="results"?"attempt":kind.slice(0,-1));};});
  }

  async function refresh(kind){
    if(!adminFlag())return;
    try{
      var table=kind==="candidates"?"students":kind==="results"?"attempts":kind;
      state[kind]=await load(table);await render(kind);
    }catch(e){alert("Could not load "+kind+": "+e.message);}
  }

  function install(){
    var anchor=document.getElementById("hoaV54Management");
    if(!anchor||document.getElementById("hoaV58Crud"))return;
    var box=document.createElement("section");box.id="hoaV58Crud";box.className="hoa-v57-crud hidden";
    box.innerHTML='<h3>Direct Database Management</h3>'+
      '<p class="hoa-v57-note">Edit and Delete write directly to Supabase. Admin authentication and database RLS remain required.</p>'+
      '<div class="hoa-v57-toolbar">'+
      '<button data-v58="tests">Edit/Delete Tests</button>'+
      '<button data-v58="questions">Edit/Delete Questions</button>'+
      '<button data-v58="candidates">Edit/Delete Candidates</button>'+
      '<button data-v58="results">Delete Attempts</button></div>'+
      '<div id="hoaV58CrudContent"></div>';
    anchor.appendChild(box);
    box.querySelectorAll("[data-v58]").forEach(function(b){b.onclick=function(){box.classList.remove("hidden");refresh(b.dataset.v58);};});
  }

  function sync(){install();var b=document.getElementById("hoaV58Crud");if(b&&!adminFlag())b.classList.add("hidden");}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",sync);else sync();
  setInterval(function(){if(document.visibilityState==="visible" && window.adminLoggedIn===true)sync();},30000);
})();

