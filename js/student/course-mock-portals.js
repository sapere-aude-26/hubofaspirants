/* HOA V6.1.0 — Feature-separated JavaScript module.
   Original inline script #63 (id: hoa-v650-paid-course-mock-portals).
   Execution position intentionally preserved from V6.0.9. */


(function(){
  'use strict';

  var state={
    courseId:null,
    mockBatchId:null,
    mockTests:[],
    mockFolderRows:[],
    portal:''
  };

  function escP(v){
    if(typeof window.escapeHTML==='function')return window.escapeHTML(v==null?'':String(v));
    return String(v==null?'':v).replace(/[&<>"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]});
  }
  function client(){return window.supabaseClient||window.supabase||null}
  function el(id){return document.getElementById(id)}
  function logo(){
    var x=document.querySelector('img[src*="hoa-logo"],img[alt*="HUB OF ASPIRANTS" i],img[alt="HOA"]');
    return x?x.src:'assets/hoa-logo.png';
  }
  function portal(){
    var p=el('hoaV650PaidLearningPortal');
    if(p)return p;
    p=document.createElement('div');
    p.id='hoaV650PaidLearningPortal';
    p.className='hoa-v650-portal';
    p.hidden=true;
    document.body.appendChild(p);
    return p;
  }
  function closePortal(){
    var p=el('hoaV650PaidLearningPortal');
    if(p)p.hidden=true;
    state.portal='';
    state.courseId=null;
    state.mockBatchId=null;
    state.mockTests=[];
    state.mockFolderRows=[];
    document.body.classList.remove('hoa-v650-learning-open');
  }
  window.hoaV650CloseLearningPortal=closePortal;

  function top(title,subtitle){
    return '<header class="hoa-v650-top"><div class="hoa-v650-top-inner">'+
      '<div class="hoa-v650-brand"><img src="'+escP(logo())+'" alt="HUB OF ASPIRANTS"><div><b>HUB OF ASPIRANTS</b><span>'+escP(subtitle||'PAID STUDENT • LEARNING PORTAL')+'</span></div></div>'+
      '<div class="hoa-v650-actions"><button class="hoa-v650-btn" type="button" data-v650-close>← Back</button><button class="hoa-v650-btn home" type="button" data-v650-home>⌂ Home</button></div>'+
      '</div></header>';
  }
  function bindTop(){
    var p=portal();
    p.querySelectorAll('[data-v650-close]').forEach(function(b){b.onclick=closePortal});
    p.querySelectorAll('[data-v650-home]').forEach(function(b){b.onclick=function(){
      closePortal();
      if(typeof window.returnToStudentDashboard==='function')window.returnToStudentDashboard();
    }});
  }

  function courseFolderSections(data,type){
    var folders=Array.isArray(data.folders)?data.folders.filter(function(f){return f.folder_type===type}):[];
    var items=type==='video'?(data.videos||[]):(data.notes||[]);
    var used={};
    var out='';
    folders.forEach(function(f){
      var rows=items.filter(function(x){return String(x.folder_id||'')===String(f.id)});
      used[f.id]=true;
      out+='<section class="hoa-v650-folder"><div class="hoa-v650-folder-head"><b>📁 '+escP(f.name)+'</b><span class="hoa-v650-chip">'+rows.length+' '+(type==='video'?'CLASSES':'FILES')+'</span></div><div class="hoa-v650-folder-body">';
      out+=rows.length?rows.map(function(x){return contentRow(x,type)}).join(''):'<div class="hoa-v650-empty">No published content in this folder.</div>';
      out+='</div></section>';
    });
    var unfiled=items.filter(function(x){return !x.folder_id});
    if(unfiled.length){
      out+='<section class="hoa-v650-folder"><div class="hoa-v650-folder-head"><b>📂 General / Unfiled</b><span class="hoa-v650-chip">'+unfiled.length+'</span></div><div class="hoa-v650-folder-body">'+unfiled.map(function(x){return contentRow(x,type)}).join('')+'</div></section>';
    }
    return out||'<div class="hoa-v650-empty">No published '+(type==='video'?'classes':'study material')+' available yet.</div>';
  }

  function contentRow(x,type){
    if(type==='video'){
      return '<article class="hoa-v650-item"><div class="hoa-v650-item-main"><b>🎥 '+escP(x.title)+'</b><small>Class '+escP(x.lecture_no||'')+(x.description?' · '+escP(x.description):'')+'</small></div><button class="hoa-v650-btn primary" type="button" data-v650-play="'+escP(x.id)+'">▶ PLAY</button></article>';
    }
    return '<article class="hoa-v650-item"><div class="hoa-v650-item-main"><b>📄 '+escP(x.title)+'</b><small>'+escP(x.subject||'General')+(x.exam?' · '+escP(x.exam):'')+(x.description?' · '+escP(x.description):'')+'</small></div><button class="hoa-v650-btn primary" type="button" data-v650-note="'+escP(x.id)+'">OPEN PDF</button></article>';
  }

  async function loadCourseData(id){
    var c=client();if(!c)throw new Error('Supabase is not ready. Please refresh.');
    var r=await c.rpc('hoa_student_course_content',{p_batch_id:id});
    if(r.error)throw r.error;
    return r.data||{};
  }

  function bindCourseContent(data,course){
    var p=portal();
    p.querySelectorAll('[data-v650-course-tab]').forEach(function(b){
      b.onclick=function(){
        p.querySelectorAll('[data-v650-course-tab]').forEach(function(x){x.classList.toggle('active',x===b)});
        var tab=b.dataset.v650CourseTab;
        var body=el('hoaV650CoursePortalBody');
        if(tab==='overview'){
          body.innerHTML='<div class="hoa-v650-grid"><article class="hoa-v650-card"><div class="hoa-v650-card-icon">🎥</div><div class="hoa-v650-card-body"><h3>Recorded Classes</h3><p>Published video classes are organised by subject folder, with unfiled classes shown separately.</p></div></article><article class="hoa-v650-card"><div class="hoa-v650-card-icon">🔴</div><div class="hoa-v650-card-body"><h3>Live Classes</h3><p>Scheduled classes from the course records appear here when a schedule is configured.</p></div></article><article class="hoa-v650-card"><div class="hoa-v650-card-icon">📚</div><div class="hoa-v650-card-body"><h3>Study Material</h3><p>Published PDFs and notes assigned to this course are available here.</p></div></article></div>';
        }else if(tab==='videos'){
          body.innerHTML=courseFolderSections(data,'video');
          bindVideos(data.videos||[],course);
        }else if(tab==='materials'){
          body.innerHTML=courseFolderSections(data,'note');
          bindNotes(data.notes||[]);
        }else{
          var scheduled=(data.videos||[]).filter(function(x){return x.scheduled_at});
          if(!scheduled.length){
            body.innerHTML='<div class="hoa-v650-empty"><b>No Live Class Scheduled</b><br>Live/scheduled class information will appear here when the Admin course record has a scheduled time.</div>';
          }else{
            scheduled.sort(function(a,b){return String(a.scheduled_at).localeCompare(String(b.scheduled_at))});
            body.innerHTML='<div class="hoa-v650-folder"><div class="hoa-v650-folder-head"><b>🔴 Scheduled Classes</b><span class="hoa-v650-chip">'+scheduled.length+'</span></div><div class="hoa-v650-folder-body">'+scheduled.map(function(x){
              return '<article class="hoa-v650-item hoa-v650-live"><div class="hoa-v650-item-main"><b>'+escP(x.title)+'</b><small>'+escP(new Date(x.scheduled_at).toLocaleString())+(x.description?' · '+escP(x.description):'')+'</small></div><span class="hoa-v650-chip">SCHEDULED</span></article>';
            }).join('')+'</div></div><div class="hoa-v650-empty">The current Admin course schema stores the scheduled time, but it does not contain a separate live-stream URL. Therefore this page does not invent a Join Live link.</div>';
          }
        }
      };
    });
    var body=el('hoaV650CoursePortalBody');
    if(body){
      body.querySelectorAll('[data-v650-play]').forEach(function(b){
        b.onclick=function(){
          var x=(data.videos||[]).find(function(v){return String(v.id)===String(b.dataset.v650Play)});
          if(!x)return;
          var slot=document.createElement('div');slot.className='hoa-v650-player';
          var player=window.hoaCreateCustomPlayer&&window.hoaCreateCustomPlayer({
            videoId:x.youtube_video_id,title:x.title||'Class',subtitle:(course.name||'HUB OF ASPIRANTS')+' • Class '+(x.lecture_no||''),logo:logo()
          });
          if(!player){alert('Video player is not available.');return}
          slot.appendChild(player);
          b.parentElement.parentElement.appendChild(slot);
          b.disabled=true;
        };
      });
    }
  }
  function bindVideos(items,course){
    var body=el('hoaV650CoursePortalBody');
    if(!body)return;
    body.querySelectorAll('[data-v650-play]').forEach(function(b){
      b.onclick=function(){
        var x=items.find(function(v){return String(v.id)===String(b.dataset.v650Play)});
        if(!x)return;
        var slot=document.createElement('div');slot.className='hoa-v650-player';
        var player=window.hoaCreateCustomPlayer&&window.hoaCreateCustomPlayer({videoId:x.youtube_video_id,title:x.title,subtitle:(course.name||'HUB OF ASPIRANTS')+' • Class '+(x.lecture_no||''),logo:logo()});
        if(!player){alert('Video player is not available.');return}
        slot.appendChild(player);b.parentElement.parentElement.appendChild(slot);b.disabled=true;
      };
    });
  }
  function bindNotes(items){
    var body=el('hoaV650CoursePortalBody');if(!body)return;
    body.querySelectorAll('[data-v650-note]').forEach(function(b){
      b.onclick=async function(){
        var x=items.find(function(v){return String(v.id)===String(b.dataset.v650Note)});if(!x)return;
        try{
          var c=client();var z=await c.storage.from('exam-notes').createSignedUrl(x.storage_path,600);
          if(z.error)throw z.error;
          window.open(z.data.signedUrl,'_blank','noopener,noreferrer');
        }catch(e){alert('Could not open this PDF: '+(e.message||e))}
      };
    });
  }

  async function openCourse(id){
    var p=portal(),c=client();if(!c)return;
    var course=(window.studentBatchRows||[]).find(function(x){return String(x.id)===String(id)});
    if(!course){
      var q=await c.from('batches').select('id,name,batch_code,description').eq('id',id).maybeSingle();
      if(q.error||!q.data){alert('Course could not be loaded.');return}
      course=q.data;
    }
    state.portal='course';state.courseId=id;
    p.hidden=false;
    p.innerHTML=top(course.name,'PAID STUDENT • COURSE LIBRARY')+
      '<main class="hoa-v650-main"><section class="hoa-v650-hero"><div><div class="hoa-v650-kicker">HUB OF ASPIRANTS • PAID STUDENT</div><h1>'+escP(course.name)+'</h1><p>'+escP(course.description||'Access your recorded classes, scheduled live classes and study material.')+'</p></div><div class="hoa-v650-stat"><b>COURSE</b><span>'+escP(course.batch_code||'')+'</span></div></section>'+
      '<nav class="hoa-v650-tabs"><button class="hoa-v650-tab active" data-v650-course-tab="overview">Overview</button><button class="hoa-v650-tab" data-v650-course-tab="videos">Videos</button><button class="hoa-v650-tab" data-v650-course-tab="live">Live Class</button><button class="hoa-v650-tab" data-v650-course-tab="materials">Study Material</button></nav>'+
      '<section class="hoa-v650-section"><div id="hoaV650CoursePortalBody"><div class="hoa-v650-empty">Loading course content…</div></div></section></main>';
    bindTop();
    try{
      var data=await loadCourseData(id);
      bindCourseContent(data,course);
      el('hoaV650CoursePortalBody').innerHTML='<div class="hoa-v650-grid"><article class="hoa-v650-card"><div class="hoa-v650-card-icon">🎥</div><div class="hoa-v650-card-body"><h3>Recorded Classes</h3><p>Published video classes organised by subject folders.</p></div></article><article class="hoa-v650-card"><div class="hoa-v650-card-icon">🔴</div><div class="hoa-v650-card-body"><h3>Live Classes</h3><p>Scheduled course classes appear in the Live Class section.</p></div></article><article class="hoa-v650-card"><div class="hoa-v650-card-icon">📚</div><div class="hoa-v650-card-body"><h3>Study Material</h3><p>Published notes and PDFs assigned to this course.</p></div></article></div>';
    }catch(e){
      el('hoaV650CoursePortalBody').innerHTML='<div class="hoa-v650-empty"><b>Unable to load this course.</b><br>'+escP(e.message||'Please try again.')+'</div>';
    }
  }
  window.hoaStudentOpenCourse=openCourse;

  async function loadMockCatalog(){
    var c=client();var student=(typeof currentStudent!=='undefined'&&currentStudent)?currentStudent:null;
    if(!c||!student)return [];
    var a=await c.from('student_test_batch_access').select('test_batch_id,starts_at,expires_at').eq('student_id',student.id);
    if(a.error)throw a.error;
    var now=Date.now(),ids=(a.data||[]).filter(function(x){
      return (!x.starts_at||Date.parse(x.starts_at)<=now)&&(!x.expires_at||Date.parse(x.expires_at)>now);
    }).map(function(x){return x.test_batch_id});
    if(!ids.length)return [];
    var b=await c.from('test_batches').select('id,name,batch_code,description,sort_order').in('id',ids).eq('is_published',true).order('sort_order').order('name');
    if(b.error)throw b.error;
    return b.data||[];
  }

  async function loadMockBatch(id){
    var c=client();if(!c)throw new Error('Supabase is not ready.');
    var [b,f,a,t]=await Promise.all([
      c.from('test_batches').select('id,name,batch_code,description').eq('id',id).eq('is_published',true).maybeSingle(),
      c.from('test_batch_folders').select('id,name,folder_type,sort_order').eq('test_batch_id',id).eq('is_active',true).order('folder_type').order('sort_order').order('name'),
      c.from('test_batch_test_assignments').select('test_id,test_batch_id,test_batch_folder_id').eq('test_batch_id',id),
      c.from('tests').select('id,title,description,duration_minutes,marks_per_question,negative_marking,is_published,access_type,test_batch_id,test_batch_folder_id,test_type').eq('is_published',true)
    ]);
    if(b.error)throw b.error;if(!b.data)throw new Error('Mock Test course is unavailable.');
    if(f.error)throw f.error;if(a.error)throw a.error;if(t.error)throw t.error;
    var student=(typeof currentStudent!=='undefined'&&currentStudent)?currentStudent:null;
    if(!student)throw new Error('Student session is not ready.');
    var access=await c.from('student_test_batch_access').select('id,starts_at,expires_at').eq('student_id',student.id).eq('test_batch_id',id);
    if(access.error)throw access.error;
    var now=Date.now(),valid=(access.data||[]).some(function(x){return (!x.starts_at||Date.parse(x.starts_at)<=now)&&(!x.expires_at||Date.parse(x.expires_at)>now)});
    if(!valid)throw new Error('Mock Test course access denied.');
    var testsRows=t.data||[],assigned=a.data||[];
    var allowedIds=new Set(assigned.map(function(x){return x.test_id}));
    testsRows=testsRows.filter(function(x){return allowedIds.has(x.id)||(String(x.test_batch_id||'')===String(id))});
    var testIds=testsRows.map(function(x){return x.id}),questionsRows=[];
    if(testIds.length){
      var q=await c.from('student_questions').select('id,test_id,question_text,option_1,option_2,option_3,option_4,question_order').in('test_id',testIds).order('question_order');
      if(q.error)throw q.error;questionsRows=q.data||[];
    }
    var enriched=testsRows.map(function(t){
      var qs=questionsRows.filter(function(q){return String(q.test_id)===String(t.id)}).sort(function(x,y){return (x.question_order||0)-(y.question_order||0)}).map(function(q){
        var a=[q.question_text,q.option_1,q.option_2,q.option_3,q.option_4];
        Object.defineProperty(a,'__id',{value:q.id,enumerable:false});
        return a;
      });
      return Object.assign({},t,{questions:qs,duration:Number(t.duration_minutes)||10,marks:Number(t.marks_per_question)||1,negative:Number(t.negative_marking)||0,accessType:t.access_type||'paid'});
    });
    return {batch:b.data,folders:f.data||[],tests:enriched};
  }

  function mockFolderSections(data){
    var folders=data.folders||[],tests=data.tests||[],out='';
    folders.forEach(function(f){
      var rows=tests.filter(function(t){return String(t.test_batch_folder_id||'')===String(f.id)});
      out+='<section class="hoa-v650-folder"><div class="hoa-v650-folder-head"><b>📁 '+escP(f.name)+'</b><span class="hoa-v650-chip">'+(f.folder_type==='subject'?'SUBJECT-WISE':'FULL-LENGTH')+'</span></div><div class="hoa-v650-folder-body">';
      out+=rows.length?rows.map(mockTestRow).join(''):'<div class="hoa-v650-empty">No published tests are assigned to this folder.</div>';
      out+='</div></section>';
    });
    var unfiled=tests.filter(function(t){return !t.test_batch_folder_id});
    if(unfiled.length)out+='<section class="hoa-v650-folder"><div class="hoa-v650-folder-head"><b>📂 General / Unfiled</b><span class="hoa-v650-chip">'+unfiled.length+'</span></div><div class="hoa-v650-folder-body">'+unfiled.map(mockTestRow).join('')+'</div></section>';
    return out||'<div class="hoa-v650-empty">No published mock tests are available in this course.</div>';
  }
  function mockTestRow(t){
    return '<article class="hoa-v650-test-row"><div><b>📝 '+escP(t.title)+'</b><small>'+(t.questions.length)+' questions · '+escP(t.duration)+' min · '+escP(t.test_type==='full_length'?'Full-Length':'Subject-wise')+'</small></div><button class="hoa-v650-btn primary" type="button" data-v650-start-test="'+escP(t.id)+'">START TEST</button></article>';
  }

  async function loadMockTestsAndQuestions(data){
    tests=(Array.isArray(tests)?tests:[]).filter(function(t){return !data.tests.some(function(x){return String(x.id)===String(t.id)})}).concat(data.tests);
    try{localStorage.setItem('missionTES_tests_cache',JSON.stringify(tests))}catch(e){}
    state.mockTests=data.tests;
  }

  async function openMockPortal(){
    var p=portal();
    state.portal='mock';
    p.hidden=false;
    p.innerHTML=top('Mock Test Courses','PAID STUDENT • MOCK TEST PORTAL')+
      '<main class="hoa-v650-main"><section class="hoa-v650-hero"><div><div class="hoa-v650-kicker">HUB OF ASPIRANTS • PAID STUDENT</div><h1>Mock Test Courses</h1><p>Open an assigned mock test course, attempt tests and review your results.</p></div><div class="hoa-v650-stat"><b>MOCK</b><span>COURSES</span></div></section><section class="hoa-v650-section"><div class="hoa-v650-section-head"><div><h2>Your Mock Test Courses</h2><p>Select a course to open its separate test page.</p></div></div><div id="hoaV650MockCourseGrid" class="hoa-v650-grid"><div class="hoa-v650-empty">Loading…</div></div></section></main>';
    bindTop();
    try{
      var rows=await loadMockCatalog(),grid=el('hoaV650MockCourseGrid');
      grid.innerHTML=rows.length?rows.map(function(x){return '<article class="hoa-v650-card"><div class="hoa-v650-card-icon">📝</div><div class="hoa-v650-card-body"><span class="hoa-v650-chip">MOCK TEST COURSE</span><h3>'+escP(x.name)+'</h3><p>'+escP(x.description||'Attempt assigned mock tests and view your results.')+'</p><div class="hoa-v650-meta"><span class="hoa-v650-chip">'+escP(x.batch_code||'')+'</span></div></div><div class="hoa-v650-card-action"><button class="hoa-v650-btn primary" type="button" data-v650-mock-open="'+escP(x.id)+'">OPEN COURSE →</button></div></article>'}).join(''):'<div class="hoa-v650-empty" style="grid-column:1/-1">No Mock Test Course has been assigned to your account.</div>';
      grid.querySelectorAll('[data-v650-mock-open]').forEach(function(b){b.onclick=function(){openMockCourse(b.dataset.v650MockOpen)}});
    }catch(e){el('hoaV650MockCourseGrid').innerHTML='<div class="hoa-v650-empty">'+escP(e.message||'Unable to load Mock Test Courses.')+'</div>'}
  }

  async function openMockCourse(id){
    var p=portal();state.portal='mock-course';state.mockBatchId=id;p.hidden=false;
    p.innerHTML=top('Mock Test Course','PAID STUDENT • MOCK TEST COURSE')+
      '<main class="hoa-v650-main"><section class="hoa-v650-hero"><div><div class="hoa-v650-kicker">HUB OF ASPIRANTS • MOCK TEST COURSE</div><h1 id="hoaV650MockTitle">Mock Test Course</h1><p id="hoaV650MockDesc">Loading your assigned tests…</p></div><div class="hoa-v650-stat"><b id="hoaV650MockCount">0</b><span>TESTS</span></div></section>'+
      '<nav class="hoa-v650-tabs"><button class="hoa-v650-tab active" data-v650-mock-tab="tests">Tests</button><button class="hoa-v650-tab" data-v650-mock-tab="results">Results</button></nav>'+
      '<section class="hoa-v650-section"><div id="hoaV650MockBody"><div class="hoa-v650-empty">Loading…</div></div></section></main>';
    bindTop();
    try{
      var data=await loadMockBatch(id);
      await loadMockTestsAndQuestions(data);
      el('hoaV650MockTitle').textContent=data.batch.name;
      el('hoaV650MockDesc').textContent=data.batch.description||'Attempt your assigned mock tests and review your results.';
      el('hoaV650MockCount').textContent=data.tests.length;
      var body=el('hoaV650MockBody');
      body.innerHTML=mockFolderSections(data);
      p.querySelectorAll('[data-v650-mock-tab]').forEach(function(b){
        b.onclick=async function(){
          p.querySelectorAll('[data-v650-mock-tab]').forEach(function(x){x.classList.toggle('active',x===b)});
          if(b.dataset.v650MockTab==='tests'){
            body.innerHTML=mockFolderSections(data);
            bindMockStart(data.tests);
          }else{
            body.innerHTML='<div class="hoa-v650-result-host"><div id="candidateResultsList"><div class="hoa-v650-empty">Loading your results…</div></div></div>';
            var oldBadge=el('candidateResultsBadge');
            if(oldBadge)oldBadge.textContent='0 TESTS';
            if(typeof window.renderCandidateResults==='function')await window.renderCandidateResults();
          }
        };
      });
      bindMockStart(data.tests);
    }catch(e){el('hoaV650MockBody').innerHTML='<div class="hoa-v650-empty"><b>Unable to load this Mock Test Course.</b><br>'+escP(e.message||'Please try again.')+'</div>'}
  }
  function bindMockStart(items){
    var p=portal();
    p.querySelectorAll('[data-v650-start-test]').forEach(function(b){
      b.onclick=function(){
        var t=items.find(function(x){return String(x.id)===String(b.dataset.v650StartTest)});
        if(!t)return;
        /* startSavedTest uses the production test engine already in this HTML. */
        state.portal='mock-test-running';
        if(typeof window.startSavedTest==='function')window.startSavedTest(t.id);
        else alert('Mock Test engine is not available.');
      };
    });
  }

  /* Override the existing inline course-opening entry point. */
  var originalCourse=window.hoaStudentOpenCourse;
  window.hoaStudentOpenCourse=openCourse;
  window.hoaV650OriginalStudentOpenCourse=originalCourse;

  /* Mock Tests becomes a dedicated portal page rather than an inline dashboard panel. */
  var originalShowStudent=window.showStudent;
  window.showStudent=function(which){
    if(which==='mock'){
      openMockPortal();
      return;
    }
    if(typeof originalShowStudent==='function')return originalShowStudent.apply(this,arguments);
  };

  /* Return button after a paid-student test should return to the Mock Test Course portal. */
  var originalReturn=window.returnToStudentDashboard;
  window.returnToStudentDashboard=function(){
    if(state.portal==='mock-test-running'||state.portal==='mock-course'){
      try{
        el('exam')?.classList.add('hidden');
        el('result')?.classList.add('hidden');
        el('headerTimer')?.classList.add('hidden');
        el('home')?.classList.remove('hidden');
      }catch(e){}
      if(state.mockBatchId)return openMockCourse(state.mockBatchId);
      return openMockPortal();
    }
    if(typeof originalReturn==='function')return originalReturn.apply(this,arguments);
  };

  /* When the existing result page is reached after a portal-launched test,
     make the Back-to-Dashboard action return to the portal. */
  document.addEventListener('click',function(e){
    var b=e.target.closest&&e.target.closest('#resultBackBtn');
    if(b&&(state.portal==='mock-test-running'||state.portal==='mock-course')){
      e.preventDefault();e.stopPropagation();
      if(state.mockBatchId)openMockCourse(state.mockBatchId);else openMockPortal();
    }
  },true);

  /* Restore the portal after the production result screen has been displayed. */
  var observer=new MutationObserver(function(){
    if(state.portal==='mock-test-running'){
      var result=el('result'),exam=el('exam');
      if(result&&!result.classList.contains('hidden')&&exam&&exam.classList.contains('hidden')){
        /* The result screen remains authoritative; the user can use its Back button. */
      }
    }
  });
  observer.observe(document.body,{subtree:true,attributes:true,attributeFilter:['class']});

  /* Expose explicit entry points for future UI buttons. */
  window.hoaV650OpenMockPortal=openMockPortal;
  window.hoaV650OpenMockCourse=openMockCourse;
})();
