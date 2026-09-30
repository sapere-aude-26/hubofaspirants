/* HOA V6.1.0 — Feature-separated JavaScript module.
   Original inline script #34 (id: hoa-v644-content-access-js).
   Execution position intentionally preserved from V6.0.9. */


(function(){
'use strict';
var V='V6.0.123';
var posterIndex=0, posterRows=[];
var adminRole='none';
var studentNoteRows=[], studentBatchRows=[];
function S(){try{return window.supabaseClient||window.supabase||null}catch(e){return null}}
function esc(v){if(typeof window.escapeHTML==='function')return window.escapeHTML(String(v??''));return String(v??'').replace(/[&<>"']/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])})}
function addFrontPoster(){
 var fp=document.getElementById('hoaFrontPage'); if(!fp)return;
 var sec=document.getElementById('hoaV643PosterSection');
 if(!sec){
  var main=fp.querySelector('main'); if(!main)return;
  sec=document.createElement('section');sec.id='hoaV643PosterSectionRuntime';sec.className='hoa643-panel';
  sec.innerHTML='<div class="hoa643-section-head"><div><h3>Featured Updates</h3><p>Courses, study materials, mock tests and important HUB OF ASPIRANTS announcements.</p></div><span class="hoa643-role">Live Posters</span></div><div id="hoaV643PosterWrapRuntime" class="hoa643-poster-wrap"><div class="hoa643-poster-empty">Connecting to live posters…</div></div><div id="hoaV643PosterNavRuntime" class="hoa643-poster-nav"></div>';
  var hero=main.querySelector('.hoa-front-hero'); hero?hero.insertAdjacentElement('beforebegin',sec):main.insertBefore(sec,main.firstChild);
 }
 waitForFrontPosterClient();
}

function waitForFrontPosterClient(attempt){
 attempt=attempt||0; var c=S();
 if(c&&typeof c.from==='function'){loadFrontPosters();return;}
 var box=document.getElementById('hoaV643PosterWrap');
 if(box&&attempt<30)box.innerHTML='<div class="hoa643-poster-empty">Loading live posters…</div>';
 if(attempt<30)setTimeout(function(){waitForFrontPosterClient(attempt+1)},500);
 else if(box)box.innerHTML='<div class="hoa643-poster-empty">Posters are temporarily unavailable. Please refresh the page.</div>';
}
async function loadFrontPosters(){
 var c=S(),box=document.getElementById('hoaV643PosterWrap'),nav=document.getElementById('hoaV643PosterNav');if(!box)return;
 if(!c||!c.from){box.innerHTML='<div class="hoa643-poster-empty">Posters will appear here when the platform is connected.</div>';return}
 try{var r=await c.rpc('hoa_public_active_posters');if(r.error)throw r.error;posterRows=r.data||[];
  if(!posterRows.length){box.innerHTML='<div class="hoa643-poster-empty">Your latest HUB OF ASPIRANTS posters will appear here.</div>';nav.innerHTML='';return}
  ensureFrontPosterVisibility(); renderPoster();
 }catch(e){console.warn(V+' poster load failed',e);box.innerHTML='<div class="hoa643-poster-empty">Unable to load posters right now.</div>';nav.innerHTML=''}
}
function ensureFrontPosterVisibility(){
 var sec=document.getElementById('hoaV643PosterSection'); if(!sec)return;
 sec.style.display='block';sec.style.visibility='visible';sec.style.opacity='1';
 var wrap=document.getElementById('hoaV643PosterWrap'); if(wrap){wrap.style.display='grid';wrap.style.visibility='visible';}
}
function renderPoster(){
 var box=document.getElementById('hoaV643PosterWrap'),nav=document.getElementById('hoaV643PosterNav');
 if(!box)return;
 var total=posterRows.length;
 if(!total)return;

 posterIndex=(posterIndex+total)%total;
 var c=S();

 function posterUrl(x){
   try{
     var base=(window.SUPABASE_URL||SUPABASE_URL||'').replace(/\/$/,'');
     var path=String(x.storage_path||'').replace(/^\/+/, '').split('/').map(encodeURIComponent).join('/');
     /* Use the canonical public Storage URL directly. This avoids the poster
        disappearing when the Storage SDK client is replaced/rebound by another
        module while the poster database query is still working. */
     return base && path ? base+'/storage/v1/object/public/posters/'+path : '';
   }catch(e){
     return '';
   }
 }
 function idx(n){return (n+total)%total}
 function slide(x,position){
   var u=posterUrl(x);
   var title=esc(x.title||'HUB OF ASPIRANTS poster');
   return '<div class="hoa643-poster-slide hoa643-poster-'+position+'" data-poster-index="'+idx(x._i)+'">'+
     '<img src="'+esc(u)+'" alt="'+title+'" loading="'+(position==='center'?'eager':'lazy')+
     '" onload="this.closest(\'.hoa643-poster-slide\').style.aspectRatio=(this.naturalWidth+\'/\'+this.naturalHeight)" onerror="this.closest(\'.hoa643-poster-slide\').classList.add(\'hoa643-poster-broken\')">'+
     '<div class="hoa643-poster-shade" aria-hidden="true"></div>'+
   '</div>';
 }

 if(total===1){
   var only=Object.assign({},posterRows[0],{_i:0});
   box.innerHTML=slide(only,'center');
 }else{
   var left=Object.assign({},posterRows[idx(posterIndex-1)],{_i:idx(posterIndex-1)});
   var center=Object.assign({},posterRows[posterIndex],{_i:posterIndex});
   var right=Object.assign({},posterRows[idx(posterIndex+1)],{_i:idx(posterIndex+1)});
   box.innerHTML=slide(left,'left')+slide(center,'center')+slide(right,'right');
 }

 nav.innerHTML=
   posterRows.map(function(_,i){
     return '<span class="hoa643-dot '+(i===posterIndex?'active':'')+'" data-i="'+i+'" role="button" tabindex="0" aria-label="Poster '+(i+1)+'"></span>';
   }).join('');

 var oldPrev=document.getElementById('hoaV643Prev'),oldNext=document.getElementById('hoaV643Next');
 if(oldPrev)oldPrev.remove();
 if(oldNext)oldNext.remove();

 var prevBtn=document.createElement('button');
 prevBtn.type='button';
 prevBtn.id='hoaV643Prev';
 prevBtn.className='hoa643-carousel-arrow hoa643-carousel-prev';
 prevBtn.setAttribute('aria-label','Previous poster');
 prevBtn.innerHTML='&#8249;';
 var nextBtn=document.createElement('button');
 nextBtn.type='button';
 nextBtn.id='hoaV643Next';
 nextBtn.className='hoa643-carousel-arrow hoa643-carousel-next';
 nextBtn.setAttribute('aria-label','Next poster');
 nextBtn.innerHTML='&#8250;';
 box.appendChild(prevBtn);
 box.appendChild(nextBtn);

 var prev=document.getElementById('hoaV643Prev'),next=document.getElementById('hoaV643Next');
 if(prev)prev.onclick=function(){posterIndex=(posterIndex-1+total)%total;renderPoster()};
 if(next)next.onclick=function(){posterIndex=(posterIndex+1)%total;renderPoster()};

 nav.querySelectorAll('.hoa643-dot').forEach(function(d){
   d.onclick=function(){posterIndex=Number(d.dataset.i)||0;renderPoster()};
   d.onkeydown=function(e){
     if(e.key==='Enter'||e.key===' '){e.preventDefault();posterIndex=Number(d.dataset.i)||0;renderPoster();}
   };
 });

 /* Clicking a visible side poster brings it to the center. */
 box.querySelectorAll('.hoa643-poster-slide').forEach(function(el){
   el.addEventListener('click',function(){
     var i=Number(el.dataset.posterIndex);
     if(Number.isFinite(i)){posterIndex=i;renderPoster();}
   });
 });
}
function addStudentPanels(){
  var root=document.getElementById('studentOnlyDashboard');
  var nav=root&&root.querySelector('.candidateSectionNav');
  if(!root||!nav)return;

  /* V6.0.4 Student Dashboard authoritative structure:
     🎓 My Courses | 📝 Mock Tests
     Results stays INSIDE Mock Tests.
     Course contents stay INSIDE the selected course/batch. */
  nav.innerHTML='<button class="active" id="candidateNavCourses" type="button" onclick="showStudent(\'courses\')">🎓 My Courses</button>'+
                '<button id="candidateNavMock" type="button" onclick="showStudent(\'mock\')">📝 Mock Tests</button>';

  var oldTest=document.getElementById('candidateSectionTestPanel');
  var oldResult=document.getElementById('candidateSectionResultPanel');
  if(!oldTest||!oldResult)return;

  var coursePanel=document.getElementById('hoaV650StudentCoursesPanel');
  if(!coursePanel){
    coursePanel=document.createElement('div');
    coursePanel.id='hoaV650StudentCoursesPanel';
    coursePanel.className='hoa-student-main-panel active';
    coursePanel.innerHTML='<div class="hoa-student-panel-head"><div><h3>🎓 My Courses</h3><p>Access your enrolled batches, classes, live sessions and study material.</p></div><span class="hoa-student-count" id="hoaV650CourseCount">0 COURSES</span></div>'+
      '<div id="hoaV650CourseList" class="hoa-student-course-list"></div>'+
      '<div id="hoaV650CourseDetail" class="hoa-student-course-detail hidden"></div>';
    oldTest.parentNode.insertBefore(coursePanel,oldTest);
  }

  var mockPanel=document.getElementById('hoaV650MockTestsPanel');
  if(!mockPanel){
    mockPanel=document.createElement('div');
    mockPanel.id='hoaV650MockTestsPanel';
    mockPanel.className='hoa-student-main-panel';
    var sub=document.createElement('div');
    sub.className='hoa-student-subnav';
    sub.innerHTML='<button id="candidateNavTestRuntime" class="active" type="button" onclick="hoaStudentShowMockTab(\'test\')">📝 Tests</button>'+
                  '<button id="candidateNavResultRuntime" type="button" onclick="hoaStudentShowMockTab(\'result\')">📊 Results</button>';
    mockPanel.appendChild(sub);
    mockPanel.appendChild(oldTest);
    mockPanel.appendChild(oldResult);
    coursePanel.parentNode.insertBefore(mockPanel,coursePanel.nextSibling);
  }

  /* Retire the previous standalone Notes/Batches panels from the primary navigation.
     Their data functions remain available to the new course tabs. */
  ['hoaV643StudentContent','hoaV643NotesPanel','hoaV643BatchesPanel','hoaV643StudentNotesBtn','hoaV643StudentBatchBtn'].forEach(function(id){
    var e=document.getElementById(id);
    if(e && e.id==='hoaV643StudentContent') e.remove();
    else if(e) e.style.display='none';
  });

  hoaStudentLoadCourses();
}

function allStudentPanels(){
  return Array.from(document.querySelectorAll('#studentOnlyDashboard .candidateSectionPanel'));
}

function showStudent(which){
  var courses=document.getElementById('hoaV650StudentCoursesPanel');
  var mock=document.getElementById('hoaV650MockTestsPanel');
  var courseBtn=document.getElementById('candidateNavCourses');
  var mockBtn=document.getElementById('candidateNavMock');
  if(courses)courses.classList.toggle('active',which==='courses');
  if(mock)mock.classList.toggle('active',which==='mock');
  if(courseBtn)courseBtn.classList.toggle('active',which==='courses');
  if(mockBtn)mockBtn.classList.toggle('active',which==='mock');
  if(which==='courses')hoaStudentLoadCourses();
  if(which==='mock')hoaStudentShowMockTab('test');
}

function hoaStudentShowMockTab(which){
  var test=document.getElementById('candidateSectionTestPanel');
  var result=document.getElementById('candidateSectionResultPanel');
  var tb=document.getElementById('candidateNavTest');
  var rb=document.getElementById('candidateNavResult');
  if(test)test.classList.toggle('active',which==='test');
  if(result)result.classList.toggle('active',which==='result');
  if(tb)tb.classList.toggle('active',which==='test');
  if(rb)rb.classList.toggle('active',which==='result');
  if(which==='result' && typeof renderCandidateResults==='function')renderCandidateResults();
}

async function hoaStudentLoadCourses(){
  var c=S(),box=document.getElementById('hoaV650CourseList'),count=document.getElementById('hoaV650CourseCount');
  if(!box)return;
  if(!c||!currentStudent?.id){box.innerHTML='<div class="hoa643-empty">Student session is not ready.</div>';return}
  box.innerHTML='<div class="hoa643-empty">Loading your courses…</div>';
  try{
    var a=await c.from('student_batch_access').select('batch_id,starts_at,expires_at').eq('student_id',currentStudent.id);
    if(a.error)throw a.error;
    var now=Date.now();
    var ids=(a.data||[]).filter(function(x){var s=x.starts_at?Date.parse(x.starts_at):-Infinity,e=x.expires_at?Date.parse(x.expires_at):Infinity;return s<=now&&now<e}).map(function(x){return x.batch_id});
    if(!ids.length){
      if(count)count.textContent='0 COURSES';
      box.innerHTML='<div class="hoa-student-empty"><div class="hoa-student-empty-icon">🎓</div><h3>No Courses Yet</h3><p>No course or batch has been assigned to your account yet.</p></div>';
      return;
    }
    var r=await c.from('batches').select('id,name,batch_code,description,status,sort_order,created_at').in('id',ids).eq('is_published',true).order('sort_order',{ascending:true}).order('created_at',{ascending:false});
    if(r.error)throw r.error;
    studentBatchRows=r.data||[];
    if(count)count.textContent=studentBatchRows.length+' '+(studentBatchRows.length===1?'COURSE':'COURSES');
    box.innerHTML=studentBatchRows.map(function(x){
      return '<article class="hoa-student-course-card">'+
        '<div class="hoa-student-course-icon">🎓</div>'+
        '<div class="hoa-student-course-body"><span class="hoa-student-eyebrow">COURSE</span><h3>'+esc(x.name)+'</h3><div class="hoa-student-code">'+esc(x.batch_code||'')+'</div><p>'+esc(x.description||'Access recorded classes, live sessions and study material.')+'</p>'+
        '<div class="hoa-student-course-meta"><span>🎥 Classes</span><span>🔴 Live</span><span>📚 Study Material</span></div></div>'+
        '<button class="primary hoa-student-open-course" type="button" data-course-id="'+esc(x.id)+'">OPEN COURSE →</button>'+
      '</article>';
    }).join('');
    box.querySelectorAll('[data-course-id]').forEach(function(btn){btn.onclick=function(){hoaStudentOpenCourse(btn.dataset.courseId)}});
  }catch(e){
    console.error('HOA student courses',e);
    box.innerHTML='<div class="hoa643-empty">Unable to load your courses. Please refresh and try again.</div>';
  }
}

async function hoaStudentOpenCourse(id){
  var course=studentBatchRows.find(function(x){return x.id===id});
  var list=document.getElementById('hoaV650CourseList'),detail=document.getElementById('hoaV650CourseDetail');
  if(!course||!detail)return;
  list.classList.add('hidden');detail.classList.remove('hidden');
  detail.innerHTML='<div class="hoa-student-course-hero"><button type="button" class="hoa-student-back" id="hoaStudentBackCourses">← My Courses</button><div><span class="hoa-student-eyebrow">COURSE</span><h2>'+esc(course.name)+'</h2><small>'+esc(course.batch_code||'')+'</small><p>'+esc(course.description||'')+'</p></div><div class="hoa-student-course-pills"><span>🎥 Videos</span><span>🔴 Live</span><span>📚 Study Material</span></div></div>'+
    '<div class="hoa-student-course-tabs" role="tablist"><button class="active" data-course-tab="overview">Overview</button><button data-course-tab="videos">Videos</button><button data-course-tab="live">Live</button><button data-course-tab="materials">Study Material</button></div>'+
    '<div id="hoaStudentCourseTabContent"></div>';
  document.getElementById('hoaStudentBackCourses').onclick=function(){detail.classList.add('hidden');list.classList.remove('hidden');};
  detail.querySelectorAll('[data-course-tab]').forEach(function(btn){btn.onclick=function(){hoaStudentCourseTab(id,btn.dataset.courseTab)}});
  hoaStudentCourseTab(id,'overview');
}

async function hoaStudentCourseTab(id,tab){
  var content=document.getElementById('hoaStudentCourseTabContent');
  var detail=document.getElementById('hoaV650CourseDetail');
  if(!content||!detail)return;
  detail.querySelectorAll('[data-course-tab]').forEach(function(b){b.classList.toggle('active',b.dataset.courseTab===tab)});
  var course=studentBatchRows.find(function(x){return x.id===id});
  if(tab==='overview'){
    content.innerHTML='<div class="hoa-student-overview-grid"><div class="hoa-student-info-card"><span>🎥</span><b>Recorded Classes</b><small>Watch your published course lectures.</small></div><div class="hoa-student-info-card"><span>🔴</span><b>Live Classes</b><small>Live sessions will appear here when scheduled.</small></div><div class="hoa-student-info-card"><span>📚</span><b>Study Material</b><small>Access notes and documents assigned to you.</small></div></div>';
    return;
  }
  if(tab==='live'){
    content.innerHTML='<div class="hoa-student-empty"><div class="hoa-student-empty-icon">🔴</div><h3>No Live Class Scheduled</h3><p>Live classes for <b>'+esc(course?.name||'this course')+'</b> will appear here when available.</p></div>';
    return;
  }
  if(tab==='videos'){
    content.innerHTML='<div class="hoa643-empty">Loading classes…</div>';
    var c=S();
    try{
      var r=await c.from('batch_lectures').select('id,lecture_no,title,description,youtube_video_id,scheduled_at,duration_seconds,sort_order').eq('batch_id',id).eq('is_published',true).order('sort_order',{ascending:true}).order('lecture_no',{ascending:true});
      if(r.error)throw r.error;
      var rows=r.data||[];
      content.innerHTML=rows.length?'<div class="hoa-student-video-list">'+rows.map(function(x,i){return '<article class="hoa-student-video-card"><div class="hoa-student-video-thumb">▶</div><div class="hoa-student-video-main"><span class="hoa-student-eyebrow">CLASS '+esc(x.lecture_no||i+1)+'</span><h3>'+esc(x.title)+'</h3><p>'+esc(x.description||'Recorded lecture')+'</p></div><button class="secondary" type="button" data-student-play="'+esc(x.id)+'">▶ PLAY</button><div class="hoa-student-player-slot" id="hoaStudentPlayer_'+esc(x.id)+'"></div></article>'}).join('')+'</div>':'<div class="hoa-student-empty"><div class="hoa-student-empty-icon">🎥</div><h3>No Videos Yet</h3><p>No published recorded classes are available in this course.</p></div>';
      content.querySelectorAll('[data-student-play]').forEach(function(btn){btn.onclick=function(){var x=rows.find(function(v){return v.id===btn.dataset.studentPlay});var h=document.getElementById('hoaStudentPlayer_'+btn.dataset.studentPlay);if(!x||!h)return;h.innerHTML='';var logo=(document.querySelector('img[src*="logo"], img[alt*="HOA" i]')||{}).src||'';var cp=window.hoaCreateCustomPlayer&&window.hoaCreateCustomPlayer({videoId:x.youtube_video_id,title:x.title||'Lecture '+x.lecture_no,subtitle:(course?.name||'HUB OF ASPIRANTS')+' • Class '+(x.lecture_no||''),logo:logo});if(cp)h.appendChild(cp);}});
    }catch(e){content.innerHTML='<div class="hoa643-empty">Unable to load videos. Please try again.</div>'}
    return;
  }
  if(tab==='materials'){
    content.innerHTML='<div class="hoa643-empty">Loading study material…</div>';
    var c2=S();
    try{
      var a=await c2.from('student_note_access').select('note_id,starts_at,expires_at').eq('student_id',currentStudent.id);
      if(a.error)throw a.error;
      var now2=Date.now(),ids=(a.data||[]).filter(function(x){var s=x.starts_at?Date.parse(x.starts_at):-Infinity,e=x.expires_at?Date.parse(x.expires_at):Infinity;return s<=now2&&now2<e}).map(function(x){return x.note_id});
      if(!ids.length){content.innerHTML='<div class="hoa-student-empty"><div class="hoa-student-empty-icon">📚</div><h3>No Study Material Yet</h3><p>Study material assigned to this account will appear here.</p></div>';return}
      var n=await c2.from('exam_notes').select('id,title,subject,exam,description,storage_path,file_name,mime_type,sort_order,created_at').in('id',ids).eq('is_published',true).order('sort_order',{ascending:true}).order('created_at',{ascending:false});
      if(n.error)throw n.error;
      var notes=n.data||[];
      content.innerHTML=notes.length?'<div class="hoa-student-material-list">'+notes.map(function(x){return '<article class="hoa-student-material-card"><div class="hoa-student-material-icon">📄</div><div><span class="hoa-student-eyebrow">STUDY MATERIAL</span><h3>'+esc(x.title)+'</h3><p>'+esc(x.subject||'General')+(x.exam?' · '+esc(x.exam):'')+'</p></div><button class="secondary" type="button" data-student-note="'+esc(x.id)+'">OPEN</button></article>'}).join('')+'</div>':'<div class="hoa-student-empty"><div class="hoa-student-empty-icon">📚</div><h3>No Study Material Yet</h3><p>No published study material is available.</p></div>';
      content.querySelectorAll('[data-student-note]').forEach(function(btn){btn.onclick=async function(){var x=notes.find(function(v){return v.id===btn.dataset.studentNote});if(!x)return;try{var z=await c2.storage.from('exam-notes').createSignedUrl(x.storage_path,600);if(z.error)throw z.error;window.open(z.data.signedUrl,'_blank','noopener,noreferrer')}catch(e){alert('Could not open this note: '+(e.message||e))}}});
    }catch(e){content.innerHTML='<div class="hoa643-empty">Unable to load study material. Please try again.</div>'}
  }
}
async function loadStudentTestAccess(){
 var c=S(); if(!c||!currentStudent?.id)return;
 try{var sr=await c.from('students').select('granular_test_access').eq('id',currentStudent.id).maybeSingle(); if(sr.error)throw sr.error; window.hoaV643GranularTestAccess=Boolean(sr.data?.granular_test_access); var r=await c.from('student_test_access').select('test_id').eq('student_id',currentStudent.id); if(r.error)throw r.error; window.hoaV643TestGrantIds=new Set((r.data||[]).map(function(x){return x.test_id})); if(typeof window.renderStudentDashboard==='function')window.renderStudentDashboard();}catch(e){console.warn(V+' test access load failed',e)}
}
async function loadStudentNotes(){
 var c=S(),box=document.getElementById('hoaV643NotesList');if(!box)return;if(!c){box.innerHTML='<div class="hoa643-empty">Supabase is not connected.</div>';return}box.innerHTML='<div class="hoa643-empty">Loading assigned notes…</div>';
 try{
  var a=await c.from('student_note_access').select('note_id,starts_at,expires_at').eq('student_id',currentStudent.id);if(a.error)throw a.error;
  var ids=(a.data||[]).filter(function(x){var now=Date.now(),s=x.starts_at?Date.parse(x.starts_at):-Infinity,e=x.expires_at?Date.parse(x.expires_at):Infinity;return s<=now&&now<e}).map(function(x){return x.note_id});
  if(!ids.length){studentNoteRows=[];document.getElementById('hoaV643NotesCount').textContent='0 NOTES';box.innerHTML='<div class="hoa643-empty">No study notes are assigned to your account yet.</div>';return}
  var r=await c.from('exam_notes').select('id,title,subject,exam,description,storage_path,file_name,mime_type,sort_order,created_at').in('id',ids).eq('is_published',true).order('sort_order',{ascending:true}).order('created_at',{ascending:false});if(r.error)throw r.error;studentNoteRows=r.data||[];document.getElementById('hoaV643NotesCount').textContent=studentNoteRows.length+' '+(studentNoteRows.length===1?'NOTE':'NOTES');
  box.innerHTML=studentNoteRows.length?studentNoteRows.map(function(x){return '<article class="hoa643-card"><h4>'+esc(x.title)+'</h4><div class="hoa643-meta">'+esc(x.subject||'General')+(x.exam?' · '+esc(x.exam):'')+'</div><p>'+esc(x.description||'Study material provided by HUB OF ASPIRANTS.')+'</p><div class="hoa643-actions"><button class="primary" type="button" data-note="'+esc(x.id)+'">OPEN NOTE</button></div></article>'}).join(''):'<div class="hoa643-empty">No published notes are available for your account.</div>';
  box.querySelectorAll('[data-note]').forEach(function(btn){btn.onclick=function(){openNote(btn.dataset.note)}});
 }catch(e){console.error(V+' notes',e);box.innerHTML='<div class="hoa643-empty">Unable to load your assigned notes. Please refresh and try again.</div>'}
}

async function openNote(id){var c=S(),x=studentNoteRows.find(function(n){return n.id===id});if(!c||!x)return;try{var r=await c.storage.from('exam-notes').createSignedUrl(x.storage_path,600);if(r.error)throw r.error;window.open(r.data.signedUrl,'_blank','noopener,noreferrer')}catch(e){alert('Could not open this note: '+(e.message||e))}}
async function loadStudentBatches(){
 var c=S(),box=document.getElementById('hoaV643BatchList');if(!box)return;if(!c){box.innerHTML='<div class="hoa643-empty">Supabase is not connected.</div>';return}box.innerHTML='<div class="hoa643-empty">Loading assigned batches…</div>';
 try{
  var a=await c.from('student_batch_access').select('batch_id,starts_at,expires_at').eq('student_id',currentStudent.id);if(a.error)throw a.error;
  var ids=(a.data||[]).filter(function(x){var now=Date.now(),s=x.starts_at?Date.parse(x.starts_at):-Infinity,e=x.expires_at?Date.parse(x.expires_at):Infinity;return s<=now&&now<e}).map(function(x){return x.batch_id});
  if(!ids.length){studentBatchRows=[];document.getElementById('hoaV643BatchCount').textContent='0 BATCHES';box.innerHTML='<div class="hoa643-empty">No batches are assigned to your account yet.</div>';return}
  var r=await c.from('batches').select('id,name,batch_code,description,status,sort_order,created_at').in('id',ids).eq('is_published',true).order('sort_order',{ascending:true}).order('created_at',{ascending:false});if(r.error)throw r.error;studentBatchRows=r.data||[];document.getElementById('hoaV643BatchCount').textContent=studentBatchRows.length+' '+(studentBatchRows.length===1?'BATCH':'BATCHES');
  box.innerHTML=studentBatchRows.length?studentBatchRows.map(function(x){return '<article class="hoa643-card"><h4>'+esc(x.name)+'</h4><div class="hoa643-meta">'+esc(x.batch_code||'Batch')+'</div><p>'+esc(x.description||'Live classes and recorded lessons from HUB OF ASPIRANTS.')+'</p><div class="hoa643-actions"><button class="primary" type="button" data-batch="'+esc(x.id)+'">OPEN BATCH</button></div></article>'}).join(''):'<div class="hoa643-empty">No published batches are available for your account.</div>';
  box.querySelectorAll('[data-batch]').forEach(function(btn){btn.onclick=function(){openBatch(btn.dataset.batch)}});
 }catch(e){console.error(V+' batches',e);box.innerHTML='<div class="hoa643-empty">Unable to load your assigned batches. Please refresh and try again.</div>'}
}

async function openBatch(id){var c=S(),player=document.getElementById('hoaV643BatchPlayer');if(!c||!player)return;player.innerHTML='<div class="hoa643-panel">Loading classes…</div>';try{var allowed=studentBatchRows.some(function(x){return x.id===id});if(!allowed){player.innerHTML='<div class="hoa643-panel"><div class="hoa643-empty">This batch is not assigned to your account.</div></div>';return}var r=await c.from('batch_lectures').select('id,lecture_no,title,description,youtube_video_id,scheduled_at,duration_seconds,sort_order').eq('batch_id',id).eq('is_published',true).order('sort_order',{ascending:true}).order('lecture_no',{ascending:true});if(r.error)throw r.error;var batch=studentBatchRows.find(function(x){return x.id===id});var rows=r.data||[];player.innerHTML='<div class="hoa643-panel"><div class="hoa643-section-head"><div><h3>'+esc(batch?.name||'Batch')+'</h3><p>'+rows.length+' published classes</p></div><div class="hoa644-toolbar"><button class="secondary" type="button" id="hoa644CloseBatch">CLOSE</button></div></div>'+ (rows.length?rows.map(function(x,i){return '<div class="hoa643-lecture"><b>Class '+esc(x.lecture_no||i+1)+': '+esc(x.title)+'</b><div class="hoa643-meta">'+esc(x.description||'')+(x.scheduled_at?' · '+esc(new Date(x.scheduled_at).toLocaleString()):'')+'</div><div class="hoa643-actions"><button class="secondary" type="button" data-play="'+esc(x.id)+'">▶ PLAY CLASS</button></div><div id="hoa643Player_'+esc(x.id)+'"></div></div>'}).join(''):'<div class="hoa643-empty">No classes have been published yet.</div>')+'</div>';
 var close=document.getElementById('hoa644CloseBatch');if(close)close.onclick=function(){player.innerHTML=''};
 rows.forEach(function(x){var btn=player.querySelector('[data-play="'+x.id+'"]');if(btn)btn.onclick=function(){var h=document.getElementById('hoa643Player_'+x.id);h.innerHTML='';var logo=(document.querySelector('img[src*="logo"], img[alt*="HOA" i]')||{}).src||'';var cp=window.hoaCreateCustomPlayer({videoId:x.youtube_video_id,title:x.title||'Lecture '+x.lecture_no,subtitle:(batch?.name||'HUB OF ASPIRANTS')+' • Class '+(x.lecture_no||''),logo:logo});if(cp)h.appendChild(cp)}})
 }catch(e){console.error(V+' batch lectures',e);player.innerHTML='<div class="hoa643-panel"><div class="hoa643-empty">Unable to load classes.</div></div>'}}

function addAdminModules(){
 var root=document.getElementById('adminOnlyDashboard'),nav=root&&root.querySelector('.adminSectionNav');if(!root||!nav||document.getElementById('hoaV643AdminModules'))return;
 function navBtn(id,text,sec){var b=document.createElement('button');b.id=id;b.type='button';b.textContent=text;b.onclick=function(){showAdmin(sec)};return b}
 var extra=document.getElementById('hoaV643AdminNavExtra');
 if(!extra){extra=document.createElement('div');extra.id='hoaV643AdminNavExtra';extra.className='hoaV643AdminNavExtra';nav.parentElement.insertBefore(extra,nav.nextSibling)}
 if(!document.getElementById('hoaV643AdminNotesBtn'))extra.appendChild(navBtn('hoaV643AdminNotesBtn','📚 Exam Notes','notes'));
 if(!document.getElementById('hoaV643AdminBatchesBtn'))extra.appendChild(navBtn('hoaV643AdminBatchesBtn','🎥 Batches','batches'));
 if(!document.getElementById('hoaV643AdminAccessBtn'))extra.appendChild(navBtn('hoaV643AdminAccessBtn','🎟 Access','access'));
 var holder=document.createElement('div');holder.id='hoaV643AdminModules';holder.innerHTML='<div class="adminSectionPanel" id="hoaV643AdminNotes"><div class="hoa643-panel"><div class="hoa643-section-head"><div><h3>📚 Exam Notes Management</h3><p>Upload and publish study materials. Students only see notes assigned to their account.</p></div></div><div class="hoa643-admin-form"><label>Title<input id="hoa643NoteTitle" placeholder="e.g. SOM Complete Notes"></label><label>Subject<input id="hoa643NoteSubject" placeholder="e.g. Strength of Materials"></label><label>Exam<input id="hoa643NoteExam" placeholder="e.g. TES JE 2026"></label><label>Order<input id="hoa643NoteOrder" type="number" value="0"></label><label class="full">Description<textarea id="hoa643NoteDesc" placeholder="Short description"></textarea></label><label>PDF / Document<input id="hoa643NoteFile" type="file" accept="application/pdf,.pdf"></label><label>Publish<select id="hoa643NotePublish"><option value="false">Draft</option><option value="true">Published</option></select></label></div><div class="hoa643-actions" style="margin-top:12px"><button class="primary" type="button" id="hoa643SaveNote">UPLOAD NOTE</button><span id="hoa643NoteMsg" class="hoa643-meta"></span></div><div id="hoa643NotesAdminList" class="hoa643-admin-list"></div></div></div><div class="adminSectionPanel" id="hoaV643AdminBatches"><div class="hoa643-panel"><div class="hoa643-section-head"><div><h3>🎥 Batch Management</h3><p>Create multiple batches and add YouTube lectures to each batch.</p></div></div><div class="hoa643-admin-form"><label>Batch Name<input id="hoa643BatchName" placeholder="TES JE 2026"></label><label>Batch Code<input id="hoa643BatchCode" placeholder="TESJE26"></label><label class="full">Description<textarea id="hoa643BatchDesc" placeholder="Batch description"></textarea></label><label>Publish<select id="hoa643BatchPublish"><option value="false">Draft</option><option value="true">Published</option></select></label></div><div class="hoa643-actions" style="margin-top:12px"><button class="primary" type="button" id="hoa643SaveBatch">CREATE BATCH</button><span id="hoa643BatchMsg" class="hoa643-meta"></span></div><div id="hoa643BatchAdminList" class="hoa643-admin-list"></div></div></div><div class="adminSectionPanel" id="hoaV643AdminAccess"><div class="hoa643-panel"><div class="hoa643-section-head"><div><h3>🎟 Student Access Management</h3><p>Assign individual mock tests, study notes or complete batches to each student.</p></div></div><div class="hoa643-admin-form"><label>Student<select id="hoa643AccessStudent"></select></label><label>Resource Type<select id="hoa643AccessType"><option value="test">Mock Test</option><option value="note">Exam Note</option><option value="batch">Batch</option></select></label><label class="full">Resource<select id="hoa643AccessResource"></select></label></div><div class="hoa643-actions" style="margin-top:12px"><button class="primary" type="button" id="hoa643GrantAccess">GRANT ACCESS</button><button class="secondary" type="button" id="hoa643RefreshAccess">REFRESH</button></div><div id="hoa643AccessMsg" class="hoa643-meta" style="margin-top:8px"></div><div id="hoa643AccessList" class="hoa643-admin-list"></div></div></div>';
 root.appendChild(holder);
 var af=document.getElementById('hoa643AccessResource')?.parentElement; if(af && !document.getElementById('hoa644AccessStarts')){var dates=document.createElement('div');dates.className='hoa644-access-dates';dates.innerHTML='<label>Access Starts (optional)<input id="hoa644AccessStarts" type="datetime-local"></label><label>Access Expires (optional)<input id="hoa644AccessExpires" type="datetime-local"></label>';af.parentElement.appendChild(dates)}
 document.getElementById('hoa643SaveNote').onclick=saveNote;document.getElementById('hoa643SaveBatch').onclick=saveBatch;document.getElementById('hoa643GrantAccess').onclick=grantAccess;document.getElementById('hoa643RefreshAccess').onclick=loadAccessModule;document.getElementById('hoa643AccessType').onchange=loadAccessResources;
 loadAdminNotes();loadAdminBatches();loadAccessModule();
}
function showAdmin(sec){
 var ids={student:'adminSectionStudentPanel',test:'adminSectionTestPanel',result:'adminSectionResultPanel',admin:'adminSectionAdminPanel',notes:'hoaV643AdminNotes',batches:'hoaV643AdminBatches',access:'hoaV643AdminAccess'};
 document.querySelectorAll('#adminOnlyDashboard .adminSectionPanel').forEach(function(p){p.classList.toggle('active',p.id===ids[sec])});
 document.querySelectorAll('#adminOnlyDashboard .adminSectionNav button,#adminOnlyDashboard .hoaV643AdminNavExtra button').forEach(function(b){b.classList.remove('active')});
 var map={student:'adminNavStudent',test:'adminNavTest',result:'adminNavResult',admin:'adminNavAdmin',notes:'hoaV643AdminNotesBtn',batches:'hoaV643AdminBatchesBtn',access:'hoaV643AdminAccessBtn'};var btn=document.getElementById(map[sec]);if(btn)btn.classList.add('active');
 if(sec==='notes')loadAdminNotes();if(sec==='batches')loadAdminBatches();if(sec==='access')loadAccessModule();
}
async function loadAdminNotes(){var c=S(),box=document.getElementById('hoa643NotesAdminList');if(!c||!box)return;try{var r=await c.from('exam_notes').select('*').order('sort_order',{ascending:true}).order('created_at',{ascending:false});if(r.error)throw r.error;box.innerHTML=(r.data||[]).map(function(x){return '<div class="hoa643-admin-row"><div class="hoa643-admin-row-main"><b>'+esc(x.title)+'</b><small>'+esc(x.subject||'General')+' · '+(x.is_published?'PUBLISHED':'DRAFT')+'</small></div><div class="hoa643-actions"><button class="secondary" data-note-pub="'+x.id+'">'+(x.is_published?'UNPUBLISH':'PUBLISH')+'</button><button class="danger" data-note-del="'+x.id+'">DELETE</button></div></div>'}).join('')||'<div class="hoa643-empty">No notes created yet.</div>';box.querySelectorAll('[data-note-pub]').forEach(function(b){b.onclick=async function(){var id=b.dataset.notePub;var row=(r.data||[]).find(function(x){return x.id===id});await c.from('exam_notes').update({is_published:!row.is_published,updated_at:new Date().toISOString()}).eq('id',id);loadAdminNotes()}});box.querySelectorAll('[data-note-del]').forEach(function(b){b.onclick=async function(){if(!confirm('Delete this note?'))return;var id=b.dataset.noteDel;var row=(r.data||[]).find(function(x){return x.id===id});await c.from('exam_notes').delete().eq('id',id);if(row?.storage_path)await c.storage.from('exam-notes').remove([row.storage_path]);loadAdminNotes()}})}catch(e){box.innerHTML='<div class="hoa643-empty">Unable to load notes.</div>'}}
async function saveNote(){var c=S(),f=document.getElementById('hoa643NoteFile')?.files?.[0],msg=document.getElementById('hoa643NoteMsg');if(!c||!f){if(msg)msg.textContent='Select a PDF first.';return}var title=document.getElementById('hoa643NoteTitle').value.trim();if(!title){if(msg)msg.textContent='Title is required.';return}var safe=f.name.replace(/[^A-Za-z0-9._-]/g,'_');var path='notes/'+crypto.randomUUID()+'-'+safe;if(msg)msg.textContent='Uploading…';try{var u=await c.storage.from('exam-notes').upload(path,f,{contentType:f.type||'application/pdf',upsert:false});if(u.error)throw u.error;var ins=await c.from('exam_notes').insert({title:title,subject:document.getElementById('hoa643NoteSubject').value.trim()||null,exam:document.getElementById('hoa643NoteExam').value.trim()||null,description:document.getElementById('hoa643NoteDesc').value.trim()||null,storage_path:path,file_name:f.name,mime_type:f.type||'application/pdf',is_published:document.getElementById('hoa643NotePublish').value==='true',sort_order:Number(document.getElementById('hoa643NoteOrder').value||0),created_by:(await c.auth.getUser()).data.user?.id||null});if(ins.error){await c.storage.from('exam-notes').remove([path]);throw ins.error}if(msg)msg.textContent='Saved.';['hoa643NoteTitle','hoa643NoteSubject','hoa643NoteExam','hoa643NoteDesc','hoa643NoteFile'].forEach(function(id){var e=document.getElementById(id);if(e)e.value=''});loadAdminNotes()}catch(e){if(msg)msg.textContent='Failed: '+(e.message||e)}}
async function loadAdminBatches(){var c=S(),box=document.getElementById('hoa643BatchAdminList');if(!c||!box)return;try{var r=await c.from('batches').select('*').order('sort_order',{ascending:true}).order('created_at',{ascending:false});if(r.error)throw r.error;var rows=r.data||[];if(!rows.length){box.innerHTML='<div class="hoa643-empty">No batches created yet.</div>';return}var html=await Promise.all(rows.map(async function(x){var lr=await c.from('batch_lectures').select('id,lecture_no,title,is_published,sort_order,scheduled_at').eq('batch_id',x.id).order('sort_order',{ascending:true}).order('lecture_no',{ascending:true});var lectures=lr.error?[]:(lr.data||[]);return '<div class="hoa643-admin-row"><div class="hoa643-admin-row-main" style="flex:1"><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><b>'+esc(x.name)+'</b><span class="hoa644-status '+(x.is_published?'live':'draft')+'">'+(x.is_published?'PUBLISHED':'DRAFT')+'</span></div><small>'+esc(x.batch_code||'')+' · '+lectures.length+' class'+(lectures.length===1?'':'es')+'</small><div id="hoa643LectureForm_'+x.id+'" style="margin-top:10px;display:none"><div class="hoa643-admin-form"><label>Lecture No<input id="hoa643Ln_'+x.id+'" type="number" min="1" value="'+(lectures.length+1)+'"></label><label>Title<input id="hoa643Lt_'+x.id+'" placeholder="Lecture title"></label><label class="full">YouTube URL / Video ID<input id="hoa643Lu_'+x.id+'" placeholder="https://www.youtube.com/watch?v=..."></label><label class="full">Description<textarea id="hoa643Ld_'+x.id+'" placeholder="Short description"></textarea></label></div><div class="hoa643-actions" style="margin-top:8px"><button class="primary" data-save-lecture="'+x.id+'">ADD LECTURE</button></div></div><div id="hoa644Lectures_'+x.id+'" style="margin-top:10px">'+(lectures.length?lectures.map(function(l){return '<div class="hoa644-lecture-admin"><div class="hoa644-lecture-admin-head"><div><b>Class '+esc(l.lecture_no)+': '+esc(l.title)+'</b><small>'+ (l.scheduled_at?esc(new Date(l.scheduled_at).toLocaleString()):'No schedule')+'</small></div><div class="hoa643-actions"><span class="hoa644-status '+(l.is_published?'live':'draft')+'">'+(l.is_published?'PUBLISHED':'DRAFT')+'</span><button class="secondary" data-lecture-pub="'+l.id+'">'+(l.is_published?'UNPUBLISH':'PUBLISH')+'</button><button class="danger" data-lecture-del="'+l.id+'">DELETE</button></div></div></div>'}).join(''):'<div class="hoa643-empty" style="margin-top:8px">No lectures added yet.</div>')+'</div></div><div class="hoa643-actions"><button class="secondary" data-add-lecture="'+x.id+'">ADD CLASS</button><button class="secondary" data-batch-pub="'+x.id+'">'+(x.is_published?'UNPUBLISH':'PUBLISH')+'</button><button class="danger" data-batch-del="'+x.id+'">DELETE</button></div></div>'}));box.innerHTML=html.join('');box.querySelectorAll('[data-add-lecture]').forEach(function(b){b.onclick=function(){var f=document.getElementById('hoa643LectureForm_'+b.dataset.addLecture);if(f)f.style.display=f.style.display==='none'?'block':'none'}});box.querySelectorAll('[data-save-lecture]').forEach(function(b){b.onclick=function(){saveLecture(b.dataset.saveLecture)}});box.querySelectorAll('[data-batch-pub]').forEach(function(b){b.onclick=async function(){var row=rows.find(function(x){return x.id===b.dataset.batchPub});if(!row)return;var z=await c.from('batches').update({is_published:!row.is_published,status:!row.is_published?'published':'draft',updated_at:new Date().toISOString()}).eq('id',row.id);if(z.error){alert(z.error.message);return}loadAdminBatches()}});box.querySelectorAll('[data-batch-del]').forEach(function(b){b.onclick=async function(){if(!confirm('Delete this batch and all of its lectures?'))return;var z=await c.from('batches').delete().eq('id',b.dataset.batchDel);if(z.error){alert(z.error.message);return}loadAdminBatches()}});box.querySelectorAll('[data-lecture-pub]').forEach(function(b){b.onclick=async function(){var z=await c.from('batch_lectures').update({is_published:b.textContent==='PUBLISH',updated_at:new Date().toISOString()}).eq('id',b.dataset.lecturePub);if(z.error){alert(z.error.message);return}loadAdminBatches()}});box.querySelectorAll('[data-lecture-del]').forEach(function(b){b.onclick=async function(){if(!confirm('Delete this lecture?'))return;var z=await c.from('batch_lectures').delete().eq('id',b.dataset.lectureDel);if(z.error){alert(z.error.message);return}loadAdminBatches()}})}catch(e){console.error(V+' admin batches',e);box.innerHTML='<div class="hoa643-empty">Unable to load batches.</div>'}}

async function saveBatch(){var c=S(),msg=document.getElementById('hoa643BatchMsg');var name=document.getElementById('hoa643BatchName').value.trim();if(!name){msg.textContent='Batch name is required.';return}try{var u=(await c.auth.getUser()).data.user;var r=await c.from('batches').insert({name:name,batch_code:document.getElementById('hoa643BatchCode').value.trim()||null,description:document.getElementById('hoa643BatchDesc').value.trim()||null,is_published:document.getElementById('hoa643BatchPublish').value==='true',status:document.getElementById('hoa643BatchPublish').value==='true'?'published':'draft',created_by:u?.id||null});if(r.error)throw r.error;msg.textContent='Batch created.';document.getElementById('hoa643BatchName').value='';document.getElementById('hoa643BatchCode').value='';document.getElementById('hoa643BatchDesc').value='';loadAdminBatches()}catch(e){msg.textContent='Failed: '+(e.message||e)}}
function extractYouTubeId(v){v=String(v||'').trim();var m=v.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,20})/);return m?m[1]:(/^[A-Za-z0-9_-]{6,20}$/.test(v)?v:'')}
async function saveLecture(batchId){var c=S(),id=extractYouTubeId(document.getElementById('hoa643Lu_'+batchId).value);if(!id){alert('Enter a valid YouTube URL or video ID.');return}var title=document.getElementById('hoa643Lt_'+batchId).value.trim();if(!title){alert('Lecture title is required.');return}var no=Math.max(1,Number(document.getElementById('hoa643Ln_'+batchId).value||1));var r=await c.from('batch_lectures').insert({batch_id:batchId,lecture_no:no,title:title,description:document.getElementById('hoa643Ld_'+batchId).value.trim()||null,youtube_video_id:id,is_published:false,sort_order:no});if(r.error){alert('Lecture save failed: '+r.error.message);return}loadAdminBatches()}

async function loadAccessModule(){var c=S(),sel=document.getElementById('hoa643AccessStudent');if(!c||!sel)return;try{var r=await c.from('students').select('id,full_name,email,status').order('full_name',{ascending:true});if(r.error)throw r.error;accessStudents=r.data||[];sel.innerHTML=accessStudents.map(function(x){return '<option value="'+x.id+'">'+esc(x.full_name)+' — '+esc(x.email||'')+' ('+esc(x.status)+')</option>'}).join('')||'<option value="">No students</option>';await loadAccessResources();await loadAccessList()}catch(e){document.getElementById('hoa643AccessMsg').textContent='Unable to load access data.'}}
async function loadAccessResources(){var c=S(),type=document.getElementById('hoa643AccessType')?.value,sel=document.getElementById('hoa643AccessResource');if(!c||!sel)return;var table=type==='test'?'tests':type==='note'?'exam_notes':'batches';var r=type==='test'?await c.from(table).select('id,title,is_published').order('created_at',{ascending:false}):type==='note'?await c.from(table).select('id,title,is_published').order('created_at',{ascending:false}):await c.from(table).select('id,name,is_published').order('created_at',{ascending:false});if(r.error){sel.innerHTML='<option value="">Unable to load</option>';return}accessResources=r.data||[];sel.innerHTML=accessResources.map(function(x){return '<option value="'+x.id+'">'+esc(type==='batch'?x.name:x.title)+' '+(x.is_published?'':'[DRAFT]')+'</option>'}).join('')||'<option value="">No resources</option>'}
async function grantAccess(){var c=S(),student=document.getElementById('hoa643AccessStudent').value,type=document.getElementById('hoa643AccessType').value,res=document.getElementById('hoa643AccessResource').value,msg=document.getElementById('hoa643AccessMsg');if(!student||!res){msg.textContent='Select a student and resource.';return}var table=type==='test'?'student_test_access':type==='note'?'student_note_access':'student_batch_access';var key=type==='test'?'test_id':type==='note'?'note_id':'batch_id';try{var u=(await c.auth.getUser()).data.user;var payload={student_id:student,granted_by:u?.id||null};payload[key]=res;var st=document.getElementById('hoa644AccessStarts').value;var ex=document.getElementById('hoa644AccessExpires').value;if(st)payload.starts_at=new Date(st).toISOString();if(ex)payload.expires_at=new Date(ex).toISOString();if(payload.starts_at&&payload.expires_at&&new Date(payload.expires_at)<=new Date(payload.starts_at)){msg.textContent='Expiry must be after the start time.';return}var r=await c.from(table).upsert(payload,{onConflict:'student_id,'+key});if(r.error)throw r.error;msg.textContent='Access granted successfully.';loadAccessList()}catch(e){msg.textContent='Grant failed: '+(e.message||e)}}

async function loadAccessList(){var c=S(),box=document.getElementById('hoa643AccessList'),student=document.getElementById('hoa643AccessStudent')?.value;if(!c||!box||!student)return;box.innerHTML='<div class="hoa643-empty">Loading access…</div>';var out=[];var specs=[['test','student_test_access','test_id','tests','title'],['note','student_note_access','note_id','exam_notes','title'],['batch','student_batch_access','batch_id','batches','name']];try{for(const spec of specs){var r=await c.from(spec[1]).select('id,'+spec[2]+',starts_at,expires_at').eq('student_id',student);if(r.error)throw r.error;var ids=(r.data||[]).map(function(x){return x[spec[2]]});if(!ids.length)continue;var rr=await c.from(spec[3]).select('id,'+spec[4]).in('id',ids);if(rr.error)throw rr.error;var map={};(rr.data||[]).forEach(function(x){map[x.id]=x[spec[4]]});(r.data||[]).forEach(function(x){var name=map[x[spec[2]]]||'Assigned resource';var when=(x.starts_at||x.expires_at)?'<small>'+esc(x.starts_at?'From '+new Date(x.starts_at).toLocaleString():'')+(x.expires_at?' · Until '+new Date(x.expires_at).toLocaleString():'')+'</small>':'';out.push('<div class="hoa643-admin-row"><div class="hoa643-admin-row-main"><b>'+esc(name)+'</b><small>'+spec[0].toUpperCase()+'</small>'+when+'</div><button class="danger" data-revoke="'+spec[1]+'|'+spec[2]+'|'+esc(x[spec[2]])+'">REVOKE</button></div>')})}box.innerHTML=out.join('')||'<div class="hoa643-empty">No individual access grants for this student.</div>';box.querySelectorAll('[data-revoke]').forEach(function(b){b.onclick=async function(){var a=b.dataset.revoke.split('|');if(!confirm('Revoke this access?'))return;var z=await c.from(a[0]).delete().eq('student_id',student).eq(a[1],a[2]);if(z.error){alert(z.error.message);return}loadAccessList()}})}catch(e){box.innerHTML='<div class="hoa643-empty">Unable to load access: '+esc(e.message||e)+'</div>'}}

async function applyAdminRole(){var c=S();if(!c)return;try{var r=await c.rpc('get_admin_role');if(r.error)throw r.error;adminRole=window.hoaNormalizeAdminRole?window.hoaNormalizeAdminRole(r.data):(r.data||'none');window.hoaAdminRole=adminRole;document.body.classList.toggle("hoa-owner-mode",adminRole==="owner");if(window.hoaV645LoadPermissions) await window.hoaV645LoadPermissions();var btn=document.getElementById('openHoaDevConsole');if(btn)btn.classList.toggle('hoa-admin-console-hidden',adminRole!=='owner');var root=document.getElementById('adminOnlyDashboard');if(root&&!document.getElementById('hoaV643RoleBadge')){var head=root.querySelector('.dashPanel');if(head){var badge=document.createElement('span');badge.id='hoaV643RoleBadge';badge.className='hoa643-role';badge.textContent=adminRole==='owner'?'Super Admin / Owner':'Administrator';head.appendChild(badge)}}var adminSection=document.getElementById('adminSectionAdminPanel');if(adminSection&&adminRole!=='owner'){var note=adminSection.querySelector('p');if(note)note.textContent='Administrator account controls are restricted to the Super Admin / Owner.';var controls=adminSection.querySelectorAll('input,button');controls.forEach(function(e){e.disabled=true})}}
catch(e){console.warn(V+' admin role load failed',e)}}
function wrapAuth(){
 if(typeof window.loginAdmin==='function'&&!window.loginAdmin.__v643){var oldA=window.loginAdmin;var f=async function(){var r=await oldA.apply(this,arguments);await applyAdminRole();if(window.hoaAdminRole==="owner"){setTimeout(function(){if(window.showAdminSection)window.showAdminSection("admin");if(window.hoaV643RenderOwnerAdminManager)window.hoaV643RenderOwnerAdminManager();},150)}return r};f.__v643=true;window.loginAdmin=f}
 if(typeof window.loginStudent==='function'&&!window.loginStudent.__v643){var oldS=window.loginStudent;var f2=async function(){var r=await oldS.apply(this,arguments);addStudentPanels();await loadStudentTestAccess();return r};f2.__v643=true;window.loginStudent=f2}
 if(typeof window.logoutAdmin==='function'&&!window.logoutAdmin.__v643){var oldL=window.logoutAdmin;var f3=async function(){adminRole='none';window.hoaAdminRole='none';document.body.classList.remove('admin-ui','hoa-owner-mode','hoa-public-auth','hoa-admin-auth','hoa-student-auth');var b=document.getElementById('openHoaDevConsole');if(b)b.classList.remove('hoa-admin-console-hidden');return oldL.apply(this,arguments)};f3.__v643=true;window.logoutAdmin=f3}
}
function ensureAdminModules(){
  /* V6.0.3: legacy dynamic Admin modules are retired.
     The static Admin Dashboard panels and hoa-v6108 controller are authoritative.
     Keep this compatibility hook so older callers do not break, but never inject
     another Notes/Batches/Student Access dashboard. */
  try{
    if(window.hoaAdminRole && typeof applyAdminRole==='function') applyAdminRole();
  }catch(e){ console.warn(V+' admin role sync failed',e); }
}
function boot(){addFrontPoster();addStudentPanels();wrapAuth();if(document.body.classList.contains('admin-ui'))applyAdminRole();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
setTimeout(wrapAuth,300);setTimeout(ensureAdminModules,500);setTimeout(wrapAuth,900);setTimeout(ensureAdminModules,1200);setTimeout(ensureAdminModules,2000);
setInterval(function(){try{addFrontPoster();if(document.getElementById('hoaV643PosterSection')&&posterRows.length===0&&S())loadFrontPosters();}catch(e){console.warn(V+' poster maintenance pass failed',e)}},3000);
window.hoaV643ShowStudentSection=showStudent;window.hoaV643ShowAdminSection=showAdmin;window.hoaV643EnsureAdminModules=ensureAdminModules;
})();
