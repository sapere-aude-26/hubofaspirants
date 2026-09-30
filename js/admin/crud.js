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
    c.innerHTML='<div class="hoa-v57-toolbar"><input id="hoaV57Search__dup2" placeholder="Search candidates" value="'+esc(q)+'"><button id="hoaV57Reload__dup2">↻ Refresh</button></div>'+
      (rows.length?'<table class="hoa-v57-table"><thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Status</th></tr></thead><tbody>'+
      rows.map(function(x){return '<tr><td>'+esc(x.full_name)+'</td><td>'+esc(x.email)+'</td><td>'+esc(x.phone)+'</td><td>'+esc(x.status)+'</td></tr>';}).join("")+
      '</tbody></table>':'<div class="hoa-v57-empty">No candidates found.</div>');
    document.getElementById("hoaV57Search").oninput=renderCandidates;
    document.getElementById("hoaV57Reload").onclick=async function(){state.students=await loadTable("students");renderCandidates();};
  }

  function renderResults(){
    var c=document.getElementById("hoaV57CrudContent"); if(!c)return;
    var rows=state.attempts;
    c.innerHTML='<div class="hoa-v57-toolbar"><bid="hoaV57Reload__dup3"eload">↻ Refresh Results</button></div>'+
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
  setInterval(sync,1500);
})();
