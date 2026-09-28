
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
