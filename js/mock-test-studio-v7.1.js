/* HOA V7.1 — Unified Mock Test Studio
 * One authoritative admin workspace for:
 *   - Mock Test Batches + Folders
 *   - Test Library + Test Builder
 *   - Universal Question Feeding
 *   - Reusable Question Bank
 *
 * Storage/schema contracts remain on the existing production tables/RPCs.
 */
(function(global){
  'use strict';

  if(global.__HOA_MOCK_STUDIO_V71__) return;
  global.__HOA_MOCK_STUDIO_V71__=true;

  var $=function(id){return document.getElementById(id);};
  var esc=function(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
  });};
  var client=function(){return global.supabaseClient||global.supabase||null;};
  var state={batches:[],folders:[],tests:[],bank:[],batchId:'',tab:'batches',installed:false};
  var styleId='hoaV71Style';

  function adminOK(){
    return !!global.adminLoggedIn && !global.currentStudent;
  }
  function guard(label){
    if(typeof global.requireAdmin==='function') return global.requireAdmin(label||'Mock Test management');
    return adminOK();
  }
  function db(){
    var c=client();
    if(!c) throw new Error('Supabase is not ready. Please refresh the page.');
    return c;
  }
  async function uid(){
    var c=db(),s=await c.auth.getSession();
    if(s.error) throw s.error;
    if(!s.data||!s.data.session||!s.data.session.user) throw new Error('Authenticated Admin session required.');
    return s.data.session.user.id;
  }
  function toast(message,error){
    var old=$('hoaV71Toast'); if(old) old.remove();
    var d=document.createElement('div'); d.id='hoaV71Toast';
    d.textContent=String(message||'');
    d.style.cssText='position:fixed;right:18px;bottom:18px;z-index:100000;padding:12px 15px;border-radius:10px;background:'+(error?'#9b1c1c':'#0b4e86')+';color:#fff;box-shadow:0 10px 28px rgba(0,0,0,.2);font:700 13px system-ui;max-width:min(520px,calc(100vw - 36px));';
    document.body.appendChild(d);
    setTimeout(function(){if(d&&d.parentNode)d.remove();},3600);
  }
  function fail(e){
    console.error('HOA V7.1',e);
    toast(e&&e.message?e.message:String(e||'Operation failed.'),true);
  }
  function clone(v){
    return JSON.parse(JSON.stringify(v==null?null:v));
  }
  function qtype(q){
    return String(q&&q.question_type||'mcq').toLowerCase()==='numerical'?'numerical':'mcq';
  }
  function normalizedTestType(v){
    return String(v||'subject').toLowerCase()==='full'?'full_length':(String(v||'subject').toLowerCase()==='full_length'?'full_length':'subject');
  }
  function folderTypeForTestType(v){return normalizedTestType(v);}

  function injectCSS(){
    if($(styleId)) return;
    var s=document.createElement('style'); s.id=styleId;
    s.textContent=''
      +'#adminSectionTestPanel.hoaV71-root{display:block!important;visibility:visible!important;opacity:1!important;width:100%!important;}'
      +'.hoaV71{font:inherit;color:#0b2e52}.hoaV71-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap;margin-bottom:12px}.hoaV71-title{font-size:22px;font-weight:850;margin:0}.hoaV71-sub{font-size:12px;color:#6a7e91;margin-top:4px;line-height:1.45}.hoaV71-tabs{display:flex;gap:7px;overflow:auto;padding-bottom:3px;margin-bottom:12px}.hoaV71-tab{border:1px solid #cbdcea;background:#fff;border-radius:10px;padding:10px 13px;color:#35536c;font-weight:850;cursor:pointer;white-space:nowrap}.hoaV71-tab.active{background:#0b4e86;color:#fff;border-color:#0b4e86}.hoaV71-pane{display:none}.hoaV71-pane.active{display:block}.hoaV71-card{background:#fff;border:1px solid #d8e7f5;border-radius:14px;padding:15px;margin-bottom:12px;box-shadow:0 7px 22px rgba(9,49,83,.05)}.hoaV71-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.hoaV71-grid.three{grid-template-columns:repeat(3,minmax(0,1fr))}.hoaV71-field{display:block;font-size:12px;font-weight:800;color:#35536c}.hoaV71-field input,.hoaV71-field select,.hoaV71-field textarea{display:block;box-sizing:border-box;width:100%;margin-top:5px;padding:10px;border:1px solid #c8d8e8;border-radius:9px;background:#fff;color:#153a5b;font:inherit}.hoaV71-field textarea{min-height:92px;resize:vertical}.hoaV71-actions{display:flex;gap:7px;flex-wrap:wrap;align-items:center}.hoaV71-btn{border:1px solid #c8d8e8;background:#fff;color:#173e60;border-radius:9px;padding:9px 11px;font-weight:850;font-size:12px;cursor:pointer}.hoaV71-btn:hover{filter:brightness(.98)}.hoaV71-btn.primary{background:#0b4e86;color:#fff;border-color:#0b4e86}.hoaV71-btn.danger{color:#a42b20;border-color:#efbbb5}.hoaV71-btn.gold{background:#8b6515;color:#fff;border-color:#8b6515}.hoaV71-btn.small{padding:7px 9px;font-size:11px}.hoaV71-btn:disabled{opacity:.5;cursor:not-allowed}.hoaV71-bar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:10px 0}.hoaV71-bar input,.hoaV71-bar select{padding:9px;border:1px solid #c8d8e8;border-radius:8px;background:#fff;color:#153a5b}.hoaV71-list{display:grid;gap:8px}.hoaV71-item{border:1px solid #d8e7f5;border-radius:11px;padding:11px;background:#fff}.hoaV71-row{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}.hoaV71-name{font-weight:850}.hoaV71-meta{font-size:11px;color:#6a7e91;margin-top:4px;line-height:1.45}.hoaV71-badge{display:inline-block;border-radius:999px;padding:4px 7px;font-size:10px;font-weight:850;background:#eef4f9;color:#4c6478;margin-left:3px}.hoaV71-badge.ok{background:#e8f7ee;color:#167044}.hoaV71-badge.warn{background:#fff5df;color:#8a5a08}.hoaV71-badge.bad{background:#ffeded;color:#a42b20}.hoaV71-code{background:#071d31;color:#eef7ff;border-radius:10px;padding:12px;white-space:pre-wrap;font:12px/1.55 ui-monospace,SFMono-Regular,Consolas,monospace;overflow:auto}.hoaV71-help{font-size:11px;color:#6a7e91;line-height:1.5}.hoaV71-section-title{font-size:17px;font-weight:850}.hoaV71-stats{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:12px}.hoaV71-stat{border:1px solid #d8e7f5;border-radius:11px;padding:10px;background:#f9fcff}.hoaV71-stat b{display:block;font-size:18px}.hoaV71-stat span{font-size:10px;color:#688096}.hoaV71-empty,.hoaV71-note{background:#f7fbff;border:1px solid #d8e7f5;border-radius:10px;padding:11px;font-size:12px;color:#526b81}.hoaV71-preview-q{border:1px solid #d8e7f5;border-radius:11px;padding:11px;margin-top:8px}.hoaV71-qtext{white-space:pre-wrap;line-height:1.5;font-weight:700}.hoaV71-option{display:flex;gap:7px;align-items:flex-start;border:1px solid #e0eaf2;border-radius:8px;padding:8px;margin-top:5px}.hoaV71-option.correct{background:#effaf3;border-color:#9bd1ae}.hoaV71-media{max-width:100%;max-height:260px;border:1px solid #d8e7f5;border-radius:8px;margin-top:7px;background:#fff;display:block}.hoaV71-modal{position:fixed;inset:0;background:rgba(0,17,34,.5);z-index:99990;display:flex;align-items:center;justify-content:center;padding:16px}.hoaV71-modalbox{width:min(1120px,100%);max-height:94vh;overflow:auto;background:#fff;border-radius:15px;padding:17px;box-shadow:0 20px 70px rgba(0,0,0,.28)}.hoaV71-modalhead{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:10px}.hoaV71-modalhead h3{margin:0;color:#0b2e52}.hoaV71-close{border:0;background:#edf3f7;border-radius:8px;padding:7px 9px;font-weight:850;cursor:pointer}.hoaV71-check{display:flex;gap:8px;align-items:center;font-size:12px;font-weight:750}.hoaV71-pick{border:1px solid #d8e7f5;border-radius:10px;padding:9px;margin-top:7px}.hoaV71-pick.active{background:#eff7ff;border-color:#9ec3e4}.hoaV71-scroll{max-height:55vh;overflow:auto}@media(max-width:900px){.hoaV71-grid.three{grid-template-columns:1fr}.hoaV71-grid{grid-template-columns:1fr}.hoaV71-stats{grid-template-columns:repeat(2,1fr)}.hoaV71-row{flex-direction:column}.hoaV71-actions{width:100%}}';
    document.head.appendChild(s);
  }

  function closeModal(){
    var d=$('hoaV71Modal'); if(d)d.remove();
  }
  function modal(title,body){
    closeModal();
    var d=document.createElement('div'); d.id='hoaV71Modal'; d.className='hoaV71-modal';
    d.innerHTML='<div class="hoaV71-modalbox"><div class="hoaV71-modalhead"><h3>'+esc(title)+'</h3><button type="button" class="hoaV71-close" id="hoaV71Close">✕ CLOSE</button></div><div id="hoaV71ModalBody">'+(body||'')+'</div></div>';
    document.body.appendChild(d);
    $('hoaV71Close').onclick=closeModal;
    d.onclick=function(e){if(e.target===d)closeModal();};
    return $('hoaV71ModalBody');
  }

  async function mediaURL(path){
    var p=String(path||'').trim(); if(!p)return '';
    if(/^https?:\/\//i.test(p)||/^data:/i.test(p))return p;
    try{
      var s=await db().storage.from('question-media').createSignedUrl(p,900);
      if(!s.error&&s.data&&s.data.signedUrl)return s.data.signedUrl;
    }catch(_){}
    try{
      var u=db().storage.from('question-media').getPublicUrl(p);
      if(u&&u.data&&u.data.publicUrl)return u.data.publicUrl;
    }catch(_){}
    return '';
  }
  async function imageTag(path,alt){
    var u=await mediaURL(path); if(!u)return '<div class="hoaV71-help">Image path: '+esc(path)+'</div>';
    return '<img class="hoaV71-media" src="'+esc(u)+'" alt="'+esc(alt||'Question image')+'" loading="lazy">';
  }

  function dbQuestion(q){
    var opts=[];
    if(Array.isArray(q.options_json)&&q.options_json.length){
      opts=q.options_json.map(function(o){return {text:String(o&&o.text||''),image:o&&o.image?String(o.image):null};});
    }
    if(!opts.length){
      for(var i=1;i<=4;i++){
        var v=String(q['option_'+i]||''); if(v)opts.push({text:v,image:null});
      }
    }
    return {
      id:q.id||null,
      test_id:q.test_id||null,
      question_type:qtype(q),
      question_text:q.question_text||'',
      question_image_path:q.question_image_path||null,
      source:q.source||'',
      options:opts,
      correct_answer:q.correct_option==null?null:Number(q.correct_option),
      correct_value:q.correct_value==null?null:Number(q.correct_value),
      tolerance:q.tolerance==null?null:Number(q.tolerance),
      explanation_text:q.explanation_text!=null?q.explanation_text:(q.explanation||''),
      explanation_image_path:q.explanation_image_path||null,
      question_order:Number(q.question_order)||1,
      created_at:q.created_at||''
    };
  }

  async function loadBatches(){
    var c=db(),r=await c.from('test_batches').select('id,name,batch_code,description,status,is_published,sort_order,created_at,updated_at').order('updated_at',{ascending:false});
    if(r.error)throw r.error;
    state.batches=r.data||[];
    if(state.batchId&&!state.batches.some(function(x){return String(x.id)===String(state.batchId)}))state.batchId='';
    if(!state.batchId&&state.batches[0])state.batchId=state.batches[0].id;
    var f=await c.from('test_batch_folders').select('id,test_batch_id,name,folder_type,sort_order,is_active,created_at,updated_at').order('sort_order').order('name');
    if(f.error)throw f.error;
    state.folders=f.data||[];
  }

  async function loadTests(){
    var c=db(),r=await c.from('tests').select('id,title,description,duration_minutes,marks_per_question,negative_marking,is_published,access_type,created_at,updated_at,test_batch_id,test_batch_folder_id,test_type,show_result_details').order('updated_at',{ascending:false});
    if(r.error)throw r.error;
    var rows=r.data||[],ids=rows.map(function(x){return x.id}),qs=[];
    if(ids.length){
      var q=await c.from('questions').select('id,test_id,question_text,option_1,option_2,option_3,option_4,correct_option,explanation,question_order,question_type,source,options_json,question_image_path,explanation_text,explanation_image_path,correct_value,tolerance,created_at').in('test_id',ids).order('question_order',{ascending:true});
      if(q.error)throw q.error; qs=q.data||[];
    }
    state.tests=rows.map(function(t){
      return Object.assign({},t,{
        duration:Number(t.duration_minutes)||10,
        marks:Number(t.marks_per_question)||1,
        negative:Number(t.negative_marking)||0,
        questions:qs.filter(function(q){return String(q.test_id)===String(t.id)}).map(dbQuestion)
      });
    });
  }

  async function loadBank(){
    var c=db(),r=await c.from('questions').select('id,test_id,question_text,option_1,option_2,option_3,option_4,correct_option,explanation,question_order,question_type,source,options_json,question_image_path,explanation_text,explanation_image_path,correct_value,tolerance,created_at').order('created_at',{ascending:false}).limit(5000);
    if(r.error)throw r.error;
    state.bank=(r.data||[]).map(dbQuestion);
  }

  function batchName(id){
    var b=state.batches.find(function(x){return String(x.id)===String(id)});return b?b.name:'Unassigned';
  }
  function folderName(id){
    var f=state.folders.find(function(x){return String(x.id)===String(id)});return f?f.name:'Unfiled';
  }
  function testName(id){
    var t=state.tests.find(function(x){return String(x.id)===String(id)});return t?t.title:'Unknown Test';
  }

  async function refresh(){
    if(!adminOK())return;
    try{
      await Promise.all([loadBatches(),loadTests(),loadBank()]);
      renderAll();
    }catch(e){fail(e);}
  }

  function renderAll(){
    if(!$('hoaV71Root'))return;
    renderBatchPane();
    renderTestPane();
    renderFeedPane();
    renderBankPane();
    renderBatchCounts();
  }
  function renderBatchCounts(){
    var a=$('hoaV71BatchCount'),f=$('hoaV71FolderCount'),t=$('hoaV71TestCount'),p=$('hoaV71PublishedBatchCount'),tp=$('hoaV71PublishedTestCount');
    if(a)a.textContent=state.batches.length;
    if(f)f.textContent=state.folders.length;
    if(t)t.textContent=state.tests.length;
    if(p)p.textContent=state.batches.filter(function(x){return !!x.is_published}).length;
    if(tp)tp.textContent=state.tests.filter(function(x){return !!x.is_published}).length;
  }

  function setTab(tab){
    state.tab=tab;
    document.querySelectorAll('#hoaV71Root [data-hoa-v71-tab]').forEach(function(b){b.classList.toggle('active',b.dataset.hoaV71Tab===tab);});
    document.querySelectorAll('#hoaV71Root .hoaV71-pane').forEach(function(p){p.classList.toggle('active',p.dataset.hoaV71Pane===tab);});
  }

  function install(){
    if(!adminOK())return false;
    var p=$('adminSectionTestPanel'); if(!p)return false;
    injectCSS();
    closeModal();
    p.classList.add('hoaV71-root');
    p.innerHTML=''
      +'<div id="hoaV71Root" class="hoaV71">'
      +'<div class="hoaV71-head"><div><h2 class="hoaV71-title">Mock Test Studio</h2><div class="hoaV71-sub">One authoritative workspace for batches, folders, tests, question feeding and the reusable question bank.</div></div>'
      +'<div class="hoaV71-actions"><button type="button" class="hoaV71-btn" id="hoaV71Refresh">↻ REFRESH</button><button type="button" class="hoaV71-btn primary" id="hoaV71NewTest">＋ NEW MOCK TEST</button></div></div>'
      +'<div class="hoaV71-tabs">'
      +'<button type="button" class="hoaV71-tab active" data-hoa-v71-tab="batches">📦 BATCHES & FOLDERS</button>'
      +'<button type="button" class="hoaV71-tab" data-hoa-v71-tab="tests">📝 TEST LIBRARY</button>'
      +'<button type="button" class="hoaV71-tab" data-hoa-v71-tab="feed">📥 QUESTION FEEDING</button>'
      +'<button type="button" class="hoaV71-tab" data-hoa-v71-tab="bank">🗂 QUESTION BANK</button>'
      +'</div>'
      +'<section class="hoaV71-pane active" data-hoa-v71-pane="batches" id="hoaV71BatchPane"></section>'
      +'<section class="hoaV71-pane" data-hoa-v71-pane="tests" id="hoaV71TestPane"></section>'
      +'<section class="hoaV71-pane" data-hoa-v71-pane="feed" id="hoaV71FeedPane"></section>'
      +'<section class="hoaV71-pane" data-hoa-v71-pane="bank" id="hoaV71BankPane"></section>'
      +'</div>';
    $('hoaV71Refresh').onclick=refresh;
    $('hoaV71NewTest').onclick=function(){openTestEditor(null,[]);};
    document.querySelectorAll('#hoaV71Root [data-hoa-v71-tab]').forEach(function(b){b.onclick=function(){setTab(b.dataset.hoaV71Tab);};});
    state.installed=true;
    setTab(state.tab||'batches');
    refresh();
    return true;
  }

  function renderBatchPane(){
    var p=$('hoaV71BatchPane'); if(!p)return;
    p.innerHTML=''
      +'<div class="hoaV71-stats">'
      +'<div class="hoaV71-stat"><b id="hoaV71BatchCount">0</b><span>Mock Batches</span></div>'
      +'<div class="hoaV71-stat"><b id="hoaV71FolderCount">0</b><span>Folders</span></div>'
      +'<div class="hoaV71-stat"><b id="hoaV71TestCount">0</b><span>Tests</span></div>'
      +'<div class="hoaV71-stat"><b id="hoaV71PublishedBatchCount">0</b><span>Published Batches</span></div>'
      +'<div class="hoaV71-stat"><b id="hoaV71PublishedTestCount">0</b><span>Published Tests</span></div>'
      +'</div>'
      +'<div class="hoaV71-card"><div class="hoaV71-head"><div><div class="hoaV71-section-title">Mock Test Batches</div><div class="hoaV71-sub">All batches are read directly from Supabase. Draft and published batches are shown.</div></div><button type="button" class="hoaV71-btn primary" id="hoaV71NewBatch">＋ NEW BATCH</button></div>'
      +'<div class="hoaV71-bar"><input id="hoaV71BatchSearch" placeholder="Search batch name / code"><select id="hoaV71BatchSort"><option value="updated">Recently updated</option><option value="az">Name A–Z</option><option value="za">Name Z–A</option></select></div>'
      +'<div id="hoaV71BatchList" class="hoaV71-list"></div></div>'
      +'<div class="hoaV71-card"><div class="hoaV71-head"><div><div class="hoaV71-section-title">Folders inside Selected Batch</div><div class="hoaV71-sub" id="hoaV71BatchSelectedLabel">Select a batch.</div></div><button type="button" class="hoaV71-btn primary" id="hoaV71NewFolder">＋ NEW FOLDER</button></div>'
      +'<div class="hoaV71-bar"><select id="hoaV71FolderSort"><option value="order">Sort by folder order</option><option value="az">Name A–Z</option><option value="za">Name Z–A</option></select></div>'
      +'<div id="hoaV71FolderList" class="hoaV71-list"></div></div>';

    $('hoaV71NewBatch').onclick=function(){openBatchEditor(null);};
    $('hoaV71NewFolder').onclick=function(){openFolderEditor(null);};
    $('hoaV71BatchSearch').oninput=renderBatchList;
    $('hoaV71BatchSort').onchange=renderBatchList;
    $('hoaV71FolderSort').onchange=renderFolderList;
    renderBatchList(); renderFolderList(); renderBatchCounts();
  }

  function renderBatchList(){
    var box=$('hoaV71BatchList'); if(!box)return;
    var q=String($('hoaV71BatchSearch')&&$('hoaV71BatchSearch').value||'').toLowerCase(),s=$('hoaV71BatchSort')&&$('hoaV71BatchSort').value||'updated';
    var rows=state.batches.filter(function(b){return !q||((b.name||'')+' '+(b.batch_code||'')).toLowerCase().indexOf(q)>=0;});
    rows.sort(function(a,b){
      if(s==='az')return String(a.name||'').localeCompare(String(b.name||''));
      if(s==='za')return String(b.name||'').localeCompare(String(a.name||''));
      return String(b.updated_at||b.created_at||'').localeCompare(String(a.updated_at||a.created_at||''));
    });
    box.innerHTML=rows.length?rows.map(function(b){
      var fc=state.folders.filter(function(f){return String(f.test_batch_id)===String(b.id)}).length;
      var tc=state.tests.filter(function(t){return String(t.test_batch_id)===String(b.id)}).length;
      return '<div class="hoaV71-item"><div class="hoaV71-row"><div>'
        +'<div class="hoaV71-name">📦 '+esc(b.name)+' '+(b.is_published?'<span class="hoaV71-badge ok">PUBLISHED</span>':'<span class="hoaV71-badge warn">DRAFT</span>')+'</div>'
        +'<div class="hoaV71-meta">'+esc(b.batch_code||'No batch code')+' · '+fc+' folders · '+tc+' tests · '+esc(b.status||'draft')+'</div>'
        +'</div><div class="hoaV71-actions">'
        +'<button type="button" class="hoaV71-btn small" data-v71-openbatch="'+esc(b.id)+'">SELECT</button>'
        +'<button type="button" class="hoaV71-btn small" data-v71-editbatch="'+esc(b.id)+'">EDIT</button>'
        +'<button type="button" class="hoaV71-btn small" data-v71-archivebatch="'+esc(b.id)+'">'+(b.status==='archived'?'RESTORE':'ARCHIVE')+'</button>'
        +'<button type="button" class="hoaV71-btn small danger" data-v71-delbatch="'+esc(b.id)+'">DELETE</button>'
        +'</div></div></div>';
    }).join(''):'<div class="hoaV71-empty">No Mock Test Batches found.</div>';

    document.querySelectorAll('[data-v71-openbatch]').forEach(function(b){b.onclick=function(){state.batchId=b.dataset.v71Openbatch;renderBatchList();renderFolderList();};});
    document.querySelectorAll('[data-v71-editbatch]').forEach(function(b){b.onclick=function(){openBatchEditor(b.dataset.v71Editbatch);};});
    document.querySelectorAll('[data-v71-archivebatch]').forEach(function(b){b.onclick=function(){toggleBatch(b.dataset.v71Archivebatch);};});
    document.querySelectorAll('[data-v71-delbatch]').forEach(function(b){b.onclick=function(){deleteBatch(b.dataset.v71Delbatch);};});
  }

  function renderFolderList(){
    var box=$('hoaV71FolderList'); if(!box)return;
    var b=state.batches.find(function(x){return String(x.id)===String(state.batchId)});
    $('hoaV71BatchSelectedLabel').textContent=b?b.name:'Select a batch.';
    $('hoaV71NewFolder').disabled=!b;
    var s=$('hoaV71FolderSort')&&$('hoaV71FolderSort').value||'order';
    var rows=state.folders.filter(function(f){return b&&String(f.test_batch_id)===String(b.id)});
    rows.sort(function(a,b){
      if(s==='az')return String(a.name||'').localeCompare(String(b.name||''));
      if(s==='za')return String(b.name||'').localeCompare(String(a.name||''));
      return (Number(a.sort_order)||0)-(Number(b.sort_order)||0)||String(a.name||'').localeCompare(String(b.name||''));
    });
    box.innerHTML=rows.length?rows.map(function(f){
      var tc=state.tests.filter(function(t){return String(t.test_batch_folder_id)===String(f.id)}).length;
      return '<div class="hoaV71-item"><div class="hoaV71-row"><div>'
        +'<div class="hoaV71-name">📁 '+esc(f.name)+' <span class="hoaV71-badge">'+esc(f.folder_type)+'</span> '+(f.is_active?'<span class="hoaV71-badge ok">ACTIVE</span>':'<span class="hoaV71-badge warn">ARCHIVED</span>')+'</div>'
        +'<div class="hoaV71-meta">Sort order '+(Number(f.sort_order)||0)+' · '+tc+' tests</div>'
        +'</div><div class="hoaV71-actions">'
        +'<button type="button" class="hoaV71-btn small" data-v71-editfolder="'+esc(f.id)+'">EDIT</button>'
        +'<button type="button" class="hoaV71-btn small" data-v71-archivefolder="'+esc(f.id)+'">'+(f.is_active?'ARCHIVE':'RESTORE')+'</button>'
        +'<button type="button" class="hoaV71-btn small danger" data-v71-delfolder="'+esc(f.id)+'">DELETE</button>'
        +'</div></div></div>';
    }).join(''):'<div class="hoaV71-empty">'+(b?'No folders inside this batch.':'Select a batch to manage its folders.')+'</div>';

    document.querySelectorAll('[data-v71-editfolder]').forEach(function(b){b.onclick=function(){openFolderEditor(b.dataset.v71Editfolder);};});
    document.querySelectorAll('[data-v71-archivefolder]').forEach(function(b){b.onclick=function(){toggleFolder(b.dataset.v71Archivefolder);};});
    document.querySelectorAll('[data-v71-delfolder]').forEach(function(b){b.onclick=function(){deleteFolder(b.dataset.v71Delfolder);};});
  }

  function batchEditorHTML(x){
    return '<div class="hoaV71-grid">'
      +'<label class="hoaV71-field">Batch Name *<input id="v71beName" maxlength="150" value="'+esc(x.name||'')+'"></label>'
      +'<label class="hoaV71-field">Batch Code<input id="v71beCode" maxlength="60" value="'+esc(x.batch_code||'')+'"></label>'
      +'<label class="hoaV71-field">Status<select id="v71beStatus"><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label>'
      +'<label class="hoaV71-field">Sort Order<input id="v71beSort" type="number" min="0" max="9999" value="'+esc(x.sort_order||0)+'"></label>'
      +'<label class="hoaV71-field" style="grid-column:1/-1">Description<textarea id="v71beDesc" maxlength="1000">'+esc(x.description||'')+'</textarea></label>'
      +'</div><div class="hoaV71-actions" style="margin-top:10px"><button type="button" class="hoaV71-btn primary" id="v71beSave">SAVE BATCH</button></div>';
  }
  function openBatchEditor(id){
    if(!guard('Mock Test batch management'))return;
    var x=state.batches.find(function(b){return String(b.id)===String(id)})||{name:'',batch_code:'',description:'',status:'draft',sort_order:0};
    var body=modal(id?'Edit Mock Test Batch':'Create Mock Test Batch',batchEditorHTML(x));
    $('v71beStatus').value=x.status||'draft';
    $('v71beSave').onclick=async function(){
      try{
        var name=$('v71beName').value.trim(); if(!name)throw new Error('Batch name is required.');
        var c=db(),p={name:name,batch_code:$('v71beCode').value.trim()||null,description:$('v71beDesc').value.trim()||null,status:$('v71beStatus').value,is_published:$('v71beStatus').value==='published',sort_order:Number($('v71beSort').value)||0,updated_at:new Date().toISOString()};
        var r=id?await c.from('test_batches').update(p).eq('id',id):await c.from('test_batches').insert(Object.assign({},p,{created_by:await uid()}));
        if(r.error)throw r.error; closeModal(); if(!id&&r.data&&r.data[0])state.batchId=r.data[0].id; await refresh(); toast(id?'Batch updated.':'Batch created.');
      }catch(e){fail(e);}
    };
  }

  async function toggleBatch(id){
    if(!guard('Mock Test batch management'))return;
    var b=state.batches.find(function(x){return String(x.id)===String(id)}); if(!b)return;
    try{
      var r=await db().from('test_batches').update({status:b.status==='archived'?'draft':'archived',is_published:b.status==='archived',updated_at:new Date().toISOString()}).eq('id',id);
      if(r.error)throw r.error; await refresh(); toast(b.status==='archived'?'Batch restored.':'Batch archived.');
    }catch(e){fail(e);}
  }

  async function deleteBatch(id){
    if(!guard('Mock Test batch deletion'))return;
    var b=state.batches.find(function(x){return String(x.id)===String(id)}); if(!b)return;
    var tests=state.tests.filter(function(t){return String(t.test_batch_id)===String(id)});
    if(!confirm('Delete batch "'+b.name+'"?\\n\\nIts folders, batch assignments and batch access records will be removed. Tests themselves will be preserved and become unassigned. Continue?'))return;
    try{
      var c=db();
      var r=await c.from('test_batches').delete().eq('id',id).select('id').maybeSingle();
      if(r.error)throw r.error;
      if(!r.data)throw new Error('Batch was not deleted. Check your Admin permission for tests.manage.');
      if(String(state.batchId)===String(id))state.batchId='';
      await refresh(); toast('Batch deleted. '+tests.length+' existing test(s) were preserved.');
    }catch(e){fail(e);}
  }

  function folderEditorHTML(x){
    return '<div class="hoaV71-grid">'
      +'<label class="hoaV71-field">Folder Name *<input id="v71feName" maxlength="150" value="'+esc(x.name||'')+'"></label>'
      +'<label class="hoaV71-field">Folder Type<select id="v71feType"><option value="subject">Subject-wise Mock</option><option value="full_length">Full-Length Mock</option></select></label>'
      +'<label class="hoaV71-field">Sort Order<input id="v71feSort" type="number" min="0" max="9999" value="'+esc(x.sort_order||0)+'"></label>'
      +'</div><div class="hoaV71-help" style="margin-top:8px">Folder type must match the Test Type used by tests assigned to this folder.</div>'
      +'<div class="hoaV71-actions" style="margin-top:10px"><button type="button" class="hoaV71-btn primary" id="v71feSave">SAVE FOLDER</button></div>';
  }
  function openFolderEditor(id){
    if(!guard('Mock Test folder management'))return;
    if(!state.batchId) {toast('Select a batch first.',true);return;}
    var x=state.folders.find(function(f){return String(f.id)===String(id)})||{name:'',folder_type:'subject',sort_order:0};
    var body=modal(id?'Edit Mock Test Folder':'Create Mock Test Folder',folderEditorHTML(x));
    $('v71feType').value=x.folder_type||'subject';
    $('v71feSave').onclick=async function(){
      try{
        var name=$('v71feName').value.trim();if(!name)throw new Error('Folder name is required.');
        var c=db(),p={name:name,folder_type:$('v71feType').value,sort_order:Number($('v71feSort').value)||0,is_active:true,updated_at:new Date().toISOString()};
        var r=id?await c.from('test_batch_folders').update(p).eq('id',id):await c.from('test_batch_folders').insert(Object.assign({},p,{test_batch_id:state.batchId,created_by:await uid()}));
        if(r.error)throw r.error;closeModal();await refresh();toast(id?'Folder updated.':'Folder created.');
      }catch(e){fail(e);}
    };
  }
  async function toggleFolder(id){
    if(!guard('Mock Test folder management'))return;
    var f=state.folders.find(function(x){return String(x.id)===String(id)});if(!f)return;
    try{
      var r=await db().from('test_batch_folders').update({is_active:!f.is_active,updated_at:new Date().toISOString()}).eq('id',id);
      if(r.error)throw r.error;await refresh();toast(f.is_active?'Folder archived.':'Folder restored.');
    }catch(e){fail(e);}
  }
  async function deleteFolder(id){
    if(!guard('Mock Test folder deletion'))return;
    var f=state.folders.find(function(x){return String(x.id)===String(id)});if(!f)return;
    var tc=state.tests.filter(function(t){return String(t.test_batch_folder_id)===String(id)}).length;
    if(!confirm('Delete folder "'+f.name+'"?\\n\\nTests will be preserved and automatically detached from the folder. Continue?'))return;
    try{
      var r=await db().from('test_batch_folders').delete().eq('id',id).select('id').maybeSingle();
      if(r.error)throw r.error;if(!r.data)throw new Error('Folder was not deleted. Check your Admin permission for tests.manage.');
      await refresh();toast('Folder deleted. '+tc+' test(s) were preserved.');
    }catch(e){fail(e);}
  }

  function renderTestPane(){
    var p=$('hoaV71TestPane');if(!p)return;
    p.innerHTML='<div class="hoaV71-card"><div class="hoaV71-head"><div><div class="hoaV71-section-title">Test Library</div><div class="hoaV71-sub">Every production test is shown here, including drafts, empty tests and unassigned tests.</div></div><div class="hoaV71-actions"><button type="button" class="hoaV71-btn primary" id="hoaV71NewTest2">＋ NEW MOCK TEST</button></div></div>'
      +'<div class="hoaV71-bar"><input id="hoaV71TestSearch" placeholder="Search title / source / batch / folder"><select id="hoaV71TestBatch"><option value="">All batches</option></select><select id="hoaV71TestStatus"><option value="all">All status</option><option value="published">Published</option><option value="draft">Draft</option></select><select id="hoaV71TestType"><option value="">All types</option><option value="subject">Subject-wise</option><option value="full_length">Full-Length</option></select><select id="hoaV71TestSort"><option value="updated">Recently updated</option><option value="az">Title A–Z</option><option value="questions">Most questions</option></select></div>'
      +'<div id="hoaV71TestList" class="hoaV71-list"></div></div>';
    $('hoaV71NewTest2').onclick=function(){openTestEditor(null,[]);};
    $('hoaV71TestSearch').oninput=renderTestList;$('hoaV71TestBatch').onchange=renderTestList;$('hoaV71TestStatus').onchange=renderTestList;$('hoaV71TestType').onchange=renderTestList;$('hoaV71TestSort').onchange=renderTestList;
    populateTestFilters();renderTestList();
  }
  function populateTestFilters(){
    var s=$('hoaV71TestBatch');if(!s)return;var cur=s.value;
    s.innerHTML='<option value="">All batches</option>'+state.batches.slice().sort(function(a,b){return String(a.name).localeCompare(String(b.name));}).map(function(b){return '<option value="'+esc(b.id)+'">'+esc(b.name)+'</option>';}).join('');
    if(cur)s.value=cur;
  }
  function renderTestList(){
    var box=$('hoaV71TestList');if(!box)return;
    var q=String($('hoaV71TestSearch').value||'').toLowerCase(),batch=$('hoaV71TestBatch').value,status=$('hoaV71TestStatus').value,type=$('hoaV71TestType').value,sort=$('hoaV71TestSort').value;
    var rows=state.tests.filter(function(t){
      var hay=[t.title,t.description,batchName(t.test_batch_id),folderName(t.test_batch_folder_id)].concat(t.questions.map(function(x){return x.question_text+' '+x.source+' '+x.explanation_text;})).join(' ').toLowerCase();
      return (!q||hay.indexOf(q)>=0)&&(!batch||String(t.test_batch_id)===String(batch))&&(status==='all'||(status==='published'?!!t.is_published:!t.is_published))&&(!type||normalizedTestType(t.test_type)===type);
    });
    rows.sort(function(a,b){
      if(sort==='az')return String(a.title).localeCompare(String(b.title));
      if(sort==='questions')return b.questions.length-a.questions.length;
      return String(b.updated_at||b.created_at||'').localeCompare(String(a.updated_at||a.created_at||''));
    });
    box.innerHTML=rows.length?rows.map(function(t){
      return '<div class="hoaV71-item"><div class="hoaV71-row"><div>'
        +'<div class="hoaV71-name">📝 '+esc(t.title)+' '+(t.is_published?'<span class="hoaV71-badge ok">PUBLISHED</span>':'<span class="hoaV71-badge warn">DRAFT</span>')+' <span class="hoaV71-badge">'+esc(t.access_type||'paid')+'</span> <span class="hoaV71-badge">'+esc(normalizedTestType(t.test_type))+'</span></div>'
        +'<div class="hoaV71-meta">'+t.questions.length+' questions · '+esc(batchName(t.test_batch_id))+' · '+esc(folderName(t.test_batch_folder_id))+' · '+(Number(t.duration_minutes)||10)+' min</div>'
        +'</div><div class="hoaV71-actions">'
        +'<button type="button" class="hoaV71-btn small primary" data-v71-edittest="'+esc(t.id)+'">EDIT</button>'
        +'<button type="button" class="hoaV71-btn small" data-v71-previewtest="'+esc(t.id)+'">PREVIEW</button>'
        +'<button type="button" class="hoaV71-btn small" data-v71-publishtest="'+esc(t.id)+'">'+(t.is_published?'UNPUBLISH':'PUBLISH')+'</button>'
        +'<button type="button" class="hoaV71-btn small danger" data-v71-deltest="'+esc(t.id)+'">DELETE</button>'
        +'</div></div></div>';
    }).join(''):'<div class="hoaV71-empty">No tests match the selected filters.</div>';
    document.querySelectorAll('[data-v71-edittest]').forEach(function(b){b.onclick=function(){var t=state.tests.find(function(x){return String(x.id)===String(b.dataset.v71Edittest)});openTestEditor(t,t?t.questions:[]);};});
    document.querySelectorAll('[data-v71-previewtest]').forEach(function(b){b.onclick=function(){previewTest(state.tests.find(function(x){return String(x.id)===String(b.dataset.v71Previewtest)}));};});
    document.querySelectorAll('[data-v71-publishtest]').forEach(function(b){b.onclick=function(){toggleTestPublish(b.dataset.v71Publishtest);};});
    document.querySelectorAll('[data-v71-deltest]').forEach(function(b){b.onclick=function(){deleteTest(b.dataset.v71Deltest);};});
  }

  async function toggleTestPublish(id){
    if(!guard('Mock Test publishing'))return;
    var t=state.tests.find(function(x){return String(x.id)===String(id)});if(!t)return;
    if(!t.is_published&&(!t.questions.length)){toast('A test must contain at least one question before publishing.',true);return;}
    try{
      var r=await db().from('tests').update({is_published:!t.is_published,updated_at:new Date().toISOString()}).eq('id',id);
      if(r.error)throw r.error;await refresh();toast(t.is_published?'Test unpublished.':'Test published.');
    }catch(e){fail(e);}
  }
  async function deleteTest(id){
    if(!guard('Mock Test deletion'))return;
    var t=state.tests.find(function(x){return String(x.id)===String(id)});if(!t)return;
    try{
      var c=db(),a=await c.from('attempts').select('id',{count:'exact',head:true}).eq('test_id',id),fa=await c.from('free_test_attempts').select('id',{count:'exact',head:true}).eq('test_id',id);
      if(a.error)throw a.error;if(fa.error)throw fa.error;
      var used=(a.count||0)+(fa.count||0);
      if(used){
        if(confirm('This test has '+used+' historical attempt(s). Hard delete would destroy result history. Archive it instead?')){
          var ar=await c.from('tests').update({is_published:false,updated_at:new Date().toISOString()}).eq('id',id);
          if(ar.error)throw ar.error;await refresh();toast('Test archived; historical attempts preserved.');
        }
        return;
      }
      if(!confirm('Permanently delete test "'+t.title+'"? All its questions will also be removed. Continue?'))return;
      var r=await c.from('tests').delete().eq('id',id).select('id').maybeSingle();
      if(r.error)throw r.error;if(!r.data)throw new Error('Test was not deleted. Check your Admin permission for tests.manage.');
      await refresh();toast('Test deleted.');
    }catch(e){fail(e);}
  }

  function feedGuide(){
    return '<div class="hoaV71-card"><div class="hoaV71-section-title">Question Feeding Guide — exact supported format</div>'
      +'<div class="hoaV71-help" style="margin-top:6px">Use one <b>Q:</b> block per question. <b>I:</b> stores the source/information label. MCQ supports 2–10 options. Numerical questions use a numeric correct value and optional tolerance. A question may be text-only, image-only, or text + image. Options and explanations may also contain images.</div>'
      +'<div class="hoaV71-grid" style="margin-top:10px">'
      +'<div><div class="hoaV71-help"><b>1. Text MCQ</b></div><pre class="hoaV71-code">Q: Select the correct statement.

I: JE PYQ
1. Option A
2. Option B
3. Option C
4. Option D

An: 3

Ex: Explanation text.</pre></div>'
      +'<div><div class="hoaV71-help"><b>2. Picture MCQ</b></div><pre class="hoaV71-code">Q: Identify the correct figure.

[[IMG:question/figure.png]]

I: JE PYQ
1. Figure A
2. Figure B
3. Figure C
4. Figure D

An: 3</pre></div>'
      +'<div><div class="hoaV71-help"><b>3. Numerical</b></div><pre class="hoaV71-code">Q: Calculate the discharge.

I: JE PYQ

Question Type: Numerical
Correct Answer: 42.5
Tolerance: 0.1

Ex: Substitution gives 42.5.</pre></div>'
      +'<div><div class="hoaV71-help"><b>4. Picture + Numerical</b></div><pre class="hoaV71-code">Q: Calculate the value shown in the figure.

I: JE PYQ
[[IMG:question/diagram.png]]

Question Type: Numerical
Correct Answer: 18.75
Tolerance: 0.01</pre></div>'
      +'<div><div class="hoaV71-help"><b>5. Option image</b></div><pre class="hoaV71-code">Q: Choose the correct figure.

I: JE PYQ
1. [[IMG:options/a.png]]
2. [[IMG:options/b.png]]
3. Figure C
4. Figure D

An: 2</pre></div>'
      +'<div><div class="hoaV71-help"><b>6. CSV header</b></div><pre class="hoaV71-code">Question,Source,Question Type,Option 1,Option 2,Option 3,Option 4,Correct Answer,Correct Value,Tolerance,Explanation,Question Image,Explanation Image</pre></div>'
      +'</div>'
      +'<div class="hoaV71-note" style="margin-top:10px"><b>Image marker:</b> <code>[[IMG:storage/path.png]]</code>. For local image files, use the <b>EDIT</b> action after parsing to upload the question image, option image or explanation image directly to Supabase.</div>'
      +'</div>';
  }

  function renderFeedPane(){
    var p=$('hoaV71FeedPane');if(!p)return;
    p.innerHTML=feedGuide()
      +'<div class="hoaV71-grid">'
      +'<div class="hoaV71-card"><div class="hoaV71-section-title">Paste / Upload Questions</div><div class="hoaV71-help" style="margin-top:5px">The parser accepts Q:/Question:, I:/Information:, 1–10 or A–J options, An:/Answer:, Ex:/Explanation:, Question Type, Correct Answer, Tolerance and [[IMG:...]].</div>'
      +'<textarea id="hoaV71FeedText" style="width:100%;box-sizing:border-box;margin-top:10px;min-height:390px;padding:11px;border:1px solid #c8d8e8;border-radius:10px;font:13px/1.5 ui-monospace,SFMono-Regular,Consolas,monospace" placeholder="Paste your Telegram-style questions here..."></textarea>'
      +'<div class="hoaV71-actions" style="margin-top:8px"><button type="button" class="hoaV71-btn primary" id="hoaV71Parse">PARSE QUESTIONS</button><button type="button" class="hoaV71-btn" id="hoaV71FeedUpload">UPLOAD TXT / CSV</button><button type="button" class="hoaV71-btn" id="hoaV71ClearFeed">CLEAR</button></div><input id="hoaV71FeedFile" type="file" accept=".txt,.csv,text/plain,text/csv" hidden></div>'
      +'<div class="hoaV71-card"><div class="hoaV71-head"><div><div class="hoaV71-section-title">Parsed Preview</div><div class="hoaV71-help">Edit, attach media or delete individual questions before saving.</div></div><span class="hoaV71-badge" id="hoaV71FeedStat">0 items</span></div><div id="hoaV71FeedPreview"></div><div class="hoaV71-actions" style="margin-top:9px"><button type="button" class="hoaV71-btn primary" id="hoaV71SaveFeed">SAVE VALID QUESTIONS</button></div></div>'
      +'</div>';
    $('hoaV71Parse').onclick=function(){try{state._feed=parseText($('hoaV71FeedText').value);renderFeedPreview();}catch(e){fail(e);}};
    $('hoaV71FeedUpload').onclick=function(){$('hoaV71FeedFile').click();};
    $('hoaV71FeedFile').onchange=async function(){var f=this.files&&this.files[0];if(!f)return;try{var txt=await f.text();$('hoaV71FeedText').value=txt;state._feed=/\.csv$/i.test(f.name)?parseCSV(txt):parseText(txt);renderFeedPreview();}catch(e){fail(e);}this.value='';};
    $('hoaV71ClearFeed').onclick=function(){$('hoaV71FeedText').value='';state._feed=[];renderFeedPreview();};
    $('hoaV71SaveFeed').onclick=function(){saveFeed(state._feed||[]);};
    state._feed=state._feed||[];
    renderFeedPreview();
  }

  function parseText(src){
    src=String(src||'').replace(/\r/g,'').replace(/^\uFEFF/,'').trim();
    if(!src)throw new Error('No question feed supplied.');
    var ss=[].concat(Array.from(src.matchAll(/^\s*(?:Q|Question)\s*[:#.)-]\s*/gim)));
    if(!ss.length)throw new Error('No Q: / Question: blocks found.');
    return ss.map(function(m,i){return parseBlock(src.slice(m.index,i+1<ss.length?ss[i+1].index:src.length),i+1);});
  }
  function parseBlock(block,no){
    var lines=block.split('\n').map(function(x){return x.trim();}).filter(Boolean);
    var q={id:null,question_type:'mcq',question_text:'',question_image_path:null,source:'',options:[],correct_answer:null,correct_value:null,tolerance:null,explanation_text:'',explanation_image_path:null,errors:[],_feedNo:no};
    var first=lines.shift()||'',mode='question',oi=-1;
    q.question_text=first.replace(/^(?:Q|Question)\s*[:#.)-]\s*/i,'').trim();
    lines.forEach(function(line){
      var m=line.match(/^(?:I|Information)\s*[:=]\s*(.*)$/i);if(m){q.source=m[1].trim();mode='source';return;}
      m=line.match(/^(?:Question Type|Type)\s*[:=]\s*(.*)$/i);if(m){q.question_type=/numerical/i.test(m[1])?'numerical':'mcq';mode='type';return;}
      m=line.match(/^(?:Question Image|Image)\s*[:=]\s*(.*)$/i);if(m){q.question_image_path=extractImagePath(m[1])||String(m[1]||'').trim()||null;mode='question';return;}
      m=line.match(/^(?:Explanation Image|Ex Image)\s*[:=]\s*(.*)$/i);if(m){q.explanation_image_path=extractImagePath(m[1])||String(m[1]||'').trim()||null;mode='explanation';return;}
      m=line.match(/^(?:Option\s*)(10|[1-9]|[A-Ja-j])\s*Image\s*[:=]\s*(.*)$/i);if(m){oi=optionIndex(m[1]);if(oi>=1){q.options[oi-1]=q.options[oi-1]||{text:'',image:null};q.options[oi-1].image=extractImagePath(m[2])||String(m[2]||'').trim();mode='option';}return;}
      m=line.match(/^(?:Answer|An|Correct Answer|Correct)\s*[:=]\s*(.*)$/i);
      if(m){
        var a=m[1].trim();
        if(q.question_type==='numerical'||(!q.options.length&&/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(a))){q.question_type='numerical';q.correct_value=Number(a);}
        else q.correct_answer=answerIndex(a);
        mode='answer';return;
      }
      m=line.match(/^Tolerance\s*[:=]\s*(.*)$/i);if(m){q.tolerance=Number(m[1]);mode='tolerance';return;}
      m=line.match(/^(?:Explanation|Ex|Solution|Reason)\s*[:=]?\s*(.*)$/i);if(m){if(m[1])q.explanation_text=m[1];mode='explanation';return;}
      m=line.match(/^(10|[1-9]|[A-Ja-j])\s*[.)\-:]\s*(.*)$/);if(m){
        oi=optionIndex(m[1]);if(oi>=1&&oi<=10){var mt=mediaValue(m[2]);q.options[oi-1]=mt;mode='option';}return;
      }
      if(/^\[\[IMG:[^\]]+\]\]$/.test(line)){
        var p=line.replace(/^\[\[IMG:/,'').replace(/\]\]$/,'').trim();
        if(mode==='question')q.question_image_path=p;
        else if(mode==='explanation')q.explanation_image_path=p;
        else if(mode==='option'&&q.options[oi-1])q.options[oi-1].image=p;
        return;
      }
      if(mode==='question')q.question_text+=(q.question_text?'\n':'')+line;
      else if(mode==='option'&&q.options[oi-1])q.options[oi-1].text+=(q.options[oi-1].text?'\n':'')+line;
      else if(mode==='explanation')q.explanation_text+=(q.explanation_text?'\n':'')+line;
    });
    q.options=q.options.filter(Boolean);
    q.errors=validateQuestion(q);q._valid=!q.errors.length;return q;
  }
  function extractImagePath(s){
    var m=String(s||'').match(/\[\[IMG:([^\]]+)\]\]/);return m?m[1].trim():'';
  }
  function mediaValue(v){
    var s=String(v||'').trim(),m=s.match(/^\[\[IMG:([^\]]+)\]\]$/);
    return m?{text:'',image:m[1].trim()}:{text:s,image:null};
  }
  function optionIndex(v){
    var s=String(v||'').trim().toUpperCase();if(/^[A-J]$/.test(s))return s.charCodeAt(0)-64;var n=Number(s);return Number.isInteger(n)?n:-1;
  }
  function answerIndex(v){return optionIndex(v);}
  function validateQuestion(q){
    var e=[];
    if(!String(q.question_text||'').trim()&&!q.question_image_path)e.push('Question text or question image is required.');
    if(qtype(q)==='numerical'){
      if(!Number.isFinite(Number(q.correct_value)))e.push('Numerical correct answer must be numeric.');
      if(q.tolerance!==null&&q.tolerance!==''&&!Number.isFinite(Number(q.tolerance)))e.push('Tolerance must be numeric.');
      if(q.tolerance!==null&&Number(q.tolerance)<0)e.push('Tolerance cannot be negative.');
    }else{
      if(q.options.length<2||q.options.length>10)e.push('MCQ must contain 2 to 10 options.');
      q.options.forEach(function(o,i){if(!String(o&&o.text||'').trim()&&!o.image)e.push('Option '+(i+1)+' is empty.');});
      if(!Number.isInteger(Number(q.correct_answer))||Number(q.correct_answer)<1||Number(q.correct_answer)>q.options.length)e.push('Correct answer does not match the options.');
    }
    return e;
  }
  function parseCSV(src){
    src=String(src||'').replace(/^\uFEFF/,'');
    var delim=',',first=(src.split(/\r?\n/)[0]||'');
    if(first.indexOf('\t')>=0&&first.indexOf(',')<0)delim='\t';
    else if(first.indexOf(';')>=0&&first.split(';').length>=5&&first.split(',').length<5)delim=';';
    var rows=[],row=[],cell='',quoted=false;
    for(var i=0;i<src.length;i++){
      var c=src[i],n=src[i+1];
      if(c==='"'){if(quoted&&n==='"'){cell+='"';i++;}else quoted=!quoted;}
      else if(c===delim&&!quoted){row.push(cell);cell='';}
      else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&n==='\n')i++;row.push(cell);cell='';if(row.some(function(v){return String(v).trim();}))rows.push(row);row=[];}
      else cell+=c;
    }
    if(cell!==''||row.length){row.push(cell);if(row.some(function(v){return String(v).trim();}))rows.push(row);}
    if(!rows.length)throw new Error('CSV has no rows.');
    var h=rows[0].map(function(v){return String(v).trim().toLowerCase();});
    var header=h.indexOf('question')>=0||h.indexOf('question text')>=0;
    function idx(names,def){for(var j=0;j<names.length;j++){var k=h.indexOf(names[j]);if(k>=0)return k;}return def;}
    var qi=idx(['question','question text'],0),si=idx(['source','information','i'],1),ti=idx(['question type','type'],-1),ai=idx(['correct answer','correct option','answer','an'],-1),vi=idx(['correct value','correct numerical value'],-1),to=idx(['tolerance'],-1),ei=idx(['explanation','ex'],-1),qii=idx(['question image','question image path'],-1),eii=idx(['explanation image','explanation image path'],-1);
    var ops=[];for(i=1;i<=10;i++)ops.push(idx(['option '+i,'option'+i,'opt '+i],header?-1:i));
    var out=[];
    for(var r=header?1:0;r<rows.length;r++){
      var a=rows[r],q={id:null,question_type:'mcq',question_text:String(a[qi]||'').trim(),question_image_path:qii>=0?String(a[qii]||'').trim()||null:null,source:si>=0?String(a[si]||'').trim():'',options:[],correct_answer:null,correct_value:null,tolerance:null,explanation_text:ei>=0?String(a[ei]||''):'',explanation_image_path:eii>=0?String(a[eii]||'').trim()||null:null,errors:[],_feedNo:r+1};
      if(ti>=0&&/numerical/i.test(String(a[ti]||'')))q.question_type='numerical';
      ops.forEach(function(p){if(p>=0){var mt=mediaValue(a[p]||'');if(mt.text||mt.image)q.options.push(mt);}});
      var av=ai>=0?String(a[ai]||'').trim():'';
      if(qtype(q)==='numerical'){q.correct_value=Number(vi>=0?String(a[vi]||''):av);q.tolerance=to>=0&&String(a[to]||'')!==''?Number(a[to]):null;}
      else q.correct_answer=answerIndex(av);
      q.errors=validateQuestion(q);q._valid=!q.errors.length;out.push(q);
    }
    return out;
  }

  function feedCard(q,i){
    var mediaBadge=q.question_image_path?'<span class="hoaV71-badge">QUESTION IMAGE</span>':'';
    return '<div class="hoaV71-preview-q"><div class="hoaV71-row"><div><div class="hoaV71-name">Question '+(i+1)+' '+(q._valid?'<span class="hoaV71-badge ok">VALID</span>':'<span class="hoaV71-badge bad">INVALID</span>')+' <span class="hoaV71-badge">'+esc(qtype(q).toUpperCase())+'</span> '+mediaBadge+'</div><div class="hoaV71-meta">I: '+esc(q.source||'—')+'</div></div><div class="hoaV71-actions"><button type="button" class="hoaV71-btn small" data-v71-feededit="'+i+'">EDIT</button><button type="button" class="hoaV71-btn small danger" data-v71-feeddel="'+i+'">DELETE</button></div></div>'
      +'<div class="hoaV71-qtext" style="margin-top:7px">'+esc(q.question_text||'[Image question]')+'</div>'
      +(qtype(q)==='numerical'?'<div class="hoaV71-meta">Correct value: <b>'+esc(q.correct_value)+'</b>'+(q.tolerance!=null?' · Tolerance: '+esc(q.tolerance):'')+'</div>':q.options.map(function(o,k){return '<div class="hoaV71-option '+(Number(q.correct_answer)===k+1?'correct':'')+'"><b>'+(k+1)+'.</b><span>'+esc(o.text||'[Image option]')+(o.image?' <span class="hoaV71-badge">IMAGE</span>':'')+'</span></div>';}).join(''))
      +(q.explanation_text||q.explanation_image_path?'<div class="hoaV71-note" style="margin-top:7px"><b>Explanation</b><br>'+esc(q.explanation_text||'')+(q.explanation_image_path?' <span class="hoaV71-badge">IMAGE</span>':'')+'</div>':'')
      +(q.errors.length?'<div style="color:#a42b20;font-size:11px;margin-top:7px">'+q.errors.map(function(e){return esc(e);}).join('<br>')+'</div>':'')
      +'</div>';
  }
  function renderFeedPreview(){
    var p=$('hoaV71FeedPreview');if(!p)return;var arr=state._feed||[];
    var valid=arr.filter(function(q){return q._valid;}).length;
    $('hoaV71FeedStat').textContent=arr.length+' items · '+valid+' valid';
    p.innerHTML=arr.length?arr.map(feedCard).join(''):'<div class="hoaV71-empty">Parse questions to see the preview.</div>';
    document.querySelectorAll('[data-v71-feededit]').forEach(function(b){b.onclick=function(){openQuestionEditor((state._feed||[])[Number(b.dataset.v71Feededit)],function(){renderFeedPreview();});};});
    document.querySelectorAll('[data-v71-feeddel]').forEach(function(b){b.onclick=function(){state._feed.splice(Number(b.dataset.v71Feeddel),1);renderFeedPreview();};});
  }

  async function saveFeed(feed){
    if(!guard('Question feeding'))return;
    var valid=(feed||[]).filter(function(q){return q&&q._valid;}).map(function(q){var x=clone(q);delete x._feedNo;delete x.errors;delete x._valid;return x;});
    if(!valid.length){toast('No valid questions are ready to save.',true);return;}
    var opts='<option value="">Create a new draft test</option>'+state.tests.map(function(t){return '<option value="'+esc(t.id)+'">'+esc(t.title)+' ('+t.questions.length+')</option>';}).join('');
    var body=modal('Save Parsed Questions','<div class="hoaV71-help">Choose an existing test to append to, or create a new draft. You can also assign the new test to a Mock Test Batch and Folder.</div>'
      +'<label class="hoaV71-field" style="margin-top:9px">Destination<select id="v71sfDest">'+opts+'</select></label>'
      +'<div class="hoaV71-grid" style="margin-top:9px"><label class="hoaV71-field">New Test Title<input id="v71sfTitle" value="Imported Question Set"></label><label class="hoaV71-field">Duration<input id="v71sfDur" type="number" value="20"></label><label class="hoaV71-field">Access<select id="v71sfAccess"><option value="paid">Paid</option><option value="free">Free</option></select></label><label class="hoaV71-field">Test Type<select id="v71sfType"><option value="subject">Subject-wise</option><option value="full_length">Full-Length</option></select></label><label class="hoaV71-field">Batch<select id="v71sfBatch"><option value="">No batch</option>'+state.batches.map(function(b){return '<option value="'+esc(b.id)+'">'+esc(b.name)+'</option>';}).join('')+'</select></label><label class="hoaV71-field">Folder<select id="v71sfFolder"><option value="">Select folder</option></select></label></div>'
      +'<div class="hoaV71-actions" style="margin-top:10px"><button type="button" class="hoaV71-btn primary" id="v71sfGo">SAVE</button></div>');
    function folders(){var bs=$('v71sfBatch').value,ty=$('v71sfType').value,s=$('v71sfFolder');s.innerHTML='<option value="">Select folder</option>'+state.folders.filter(function(f){return f.is_active&&String(f.test_batch_id)===String(bs)&&f.folder_type===folderTypeForTestType(ty);}).map(function(f){return '<option value="'+esc(f.id)+'">'+esc(f.name)+'</option>';}).join('');}
    $('v71sfDest').onchange=function(){$('v71sfTitle').disabled=!!this.value;};
    $('v71sfBatch').onchange=folders;$('v71sfType').onchange=folders;folders();
    $('v71sfGo').onclick=async function(){
      try{
        var dest=$('v71sfDest').value,c=db(),t=dest?state.tests.find(function(x){return String(x.id)===String(dest)}):null;
        if(dest&&t){
          var qs=t.questions.concat(valid.map(clone));
          await saveTestBundle(t,qs,{});
        }else{
          var title=$('v71sfTitle').value.trim();if(title.length<3)throw new Error('New Test Title must contain at least 3 characters.');
          var b=$('v71sfBatch').value||null,f=$('v71sfFolder').value||null,a=$('v71sfAccess').value,ty=$('v71sfType').value;
          if(a==='paid'&&(!b||!f))throw new Error('Paid tests require a Mock Test Batch and Folder.');
          if(b&&!f)throw new Error('Select a Folder when a Batch is selected.');
          await saveTestBundle(null,valid,{title:title,duration:Number($('v71sfDur').value)||20,access_type:a,test_batch_id:b,test_batch_folder_id:f,test_type:ty,is_published:false});
        }
        closeModal();await refresh();toast('Question feed saved successfully.');
      }catch(e){fail(e);}
    };
  }

  function bankFilters(){
    var src='<option value="">All source tests</option>'+state.tests.map(function(t){return '<option value="'+esc(t.id)+'">'+esc(t.title)+'</option>';}).join('');
    return '<div class="hoaV71-bar"><input id="hoaV71BankSearch" placeholder="Search question / option / source / explanation"><select id="hoaV71BankTest">'+src+'</select><select id="hoaV71BankType"><option value="">All types</option><option value="mcq">MCQ</option><option value="numerical">Numerical</option></select><select id="hoaV71BankSort"><option value="new">Newest</option><option value="old">Oldest</option><option value="source">Source A–Z</option><option value="title">Question A–Z</option><option value="order">Question order</option></select></div>';
  }
  function renderBankPane(){
    var p=$('hoaV71BankPane');if(!p)return;
    p.innerHTML='<div class="hoaV71-card"><div class="hoaV71-head"><div><div class="hoaV71-section-title">Reusable Question Bank</div><div class="hoaV71-sub">Search, sort, edit, delete and reuse questions already stored in Supabase.</div></div><div class="hoaV71-actions"><button type="button" class="hoaV71-btn primary" id="hoaV71CreateSelected">＋ CREATE NEW MOCK TEST</button><button type="button" class="hoaV71-btn" id="hoaV71AddSelected">＋ ADD TO EXISTING TEST</button></div></div>'
      +bankFilters()+'<label class="hoaV71-check"><input type="checkbox" id="hoaV71BankAll"> Select all visible</label><span class="hoaV71-badge" id="hoaV71BankStat">0</span><div id="hoaV71BankList" class="hoaV71-scroll" style="margin-top:8px"></div></div>';
    $('hoaV71BankSearch').oninput=renderBankList;$('hoaV71BankTest').onchange=renderBankList;$('hoaV71BankType').onchange=renderBankList;$('hoaV71BankSort').onchange=renderBankList;
    $('hoaV71BankAll').onchange=function(){document.querySelectorAll('[data-v71-bank]').forEach(function(x){x.checked=$('hoaV71BankAll').checked;});};
    $('hoaV71CreateSelected').onclick=function(){var qs=selectedBankQuestions();if(!qs.length){toast('Select at least one question.',true);return;}openTestEditor(null,qs);};
    $('hoaV71AddSelected').onclick=function(){var qs=selectedBankQuestions();if(!qs.length){toast('Select at least one question.',true);return;}pickDestinationTest(qs);};
    populateBankTestFilter();renderBankList();
  }
  function populateBankTestFilter(){
    var s=$('hoaV71BankTest');if(!s)return;var cur=s.value;
    s.innerHTML='<option value="">All source tests</option>'+state.tests.slice().sort(function(a,b){return String(a.title).localeCompare(String(b.title));}).map(function(t){return '<option value="'+esc(t.id)+'">'+esc(t.title)+'</option>';}).join('');
    if(cur)s.value=cur;
  }
  function filteredBank(){
    var q=String($('hoaV71BankSearch').value||'').toLowerCase(),tid=$('hoaV71BankTest').value,typ=$('hoaV71BankType').value,sort=$('hoaV71BankSort').value;
    var rows=state.bank.filter(function(x){
      var hay=[x.question_text,x.source,x.explanation_text,testName(x.test_id)].concat(x.options.map(function(o){return o.text;})).join(' ').toLowerCase();
      return (!q||hay.indexOf(q)>=0)&&(!tid||String(x.test_id)===String(tid))&&(!typ||x.question_type===typ);
    });
    rows.sort(function(a,b){
      if(sort==='old')return String(a.created_at).localeCompare(String(b.created_at));
      if(sort==='source')return String(a.source||'').localeCompare(String(b.source||''));
      if(sort==='title')return String(a.question_text||'').localeCompare(String(b.question_text||''));
      if(sort==='order')return Number(a.question_order)-Number(b.question_order);
      return String(b.created_at).localeCompare(String(a.created_at));
    });
    return rows;
  }
  function renderBankList(){
    var box=$('hoaV71BankList');if(!box)return;
    var rows=filteredBank();$('hoaV71BankStat').textContent=rows.length+' questions shown';
    box.innerHTML=rows.length?rows.map(function(x){
      return '<div class="hoaV71-item"><div class="hoaV71-row"><div><label class="hoaV71-name"><input type="checkbox" data-v71-bank="'+esc(x.id)+'"> Q'+esc(x.question_order)+' · '+esc(qtype(x).toUpperCase())+'</label><div class="hoaV71-meta">'+esc(x.source||'No source')+' · '+esc(testName(x.test_id))+(x.question_image_path?' · QUESTION IMAGE':'')+(x.explanation_image_path?' · EXPLANATION IMAGE':'')+'</div></div><div class="hoaV71-actions"><button type="button" class="hoaV71-btn small" data-v71-bankedit="'+esc(x.id)+'">EDIT</button><button type="button" class="hoaV71-btn small danger" data-v71-bankdel="'+esc(x.id)+'">DELETE</button></div></div>'
        +'<div class="hoaV71-qtext" style="margin-top:6px">'+esc(x.question_text||'[Image question]')+'</div>'
        +(x.question_type==='numerical'?'<div class="hoaV71-meta">Correct value: <b>'+esc(x.correct_value)+'</b>'+(x.tolerance!=null?' · Tolerance: '+esc(x.tolerance):'')+'</div>':x.options.slice(0,10).map(function(o,i){return '<div class="hoaV71-option '+(Number(x.correct_answer)===i+1?'correct':'')+'"><b>'+(i+1)+'.</b> '+esc(o.text||'[Image option]')+(o.image?' <span class="hoaV71-badge">IMAGE</span>':'')+'</div>';}).join(''))
        +'</div>';
    }).join(''):'<div class="hoaV71-empty">No questions match the selected filters.</div>';
    document.querySelectorAll('[data-v71-bankedit]').forEach(function(b){b.onclick=function(){var q=state.bank.find(function(x){return String(x.id)===String(b.dataset.v71Bankedit)});openQuestionEditor(q,async function(updated){await persistQuestion(updated);await refresh();});};});
    document.querySelectorAll('[data-v71-bankdel]').forEach(function(b){b.onclick=function(){deleteQuestion(b.dataset.v71Bankdel);};});
  }
  function selectedBankQuestions(){
    var ids=Array.from(document.querySelectorAll('[data-v71-bank]:checked')).map(function(x){return String(x.dataset.v71Bank);});
    return state.bank.filter(function(x){return ids.indexOf(String(x.id))>=0;}).map(clone);
  }
  function pickDestinationTest(qs){
    var body=modal('Add Selected Questions to Existing Test','<div class="hoaV71-help">Select the destination test. Existing test questions will be preserved and these questions will be appended.</div><label class="hoaV71-field" style="margin-top:9px">Destination<select id="v71dt">'+state.tests.map(function(t){return '<option value="'+esc(t.id)+'">'+esc(t.title)+' ('+t.questions.length+')</option>';}).join('')+'</select></label><button type="button" class="hoaV71-btn primary" id="v71dtGo" style="margin-top:10px">ADD QUESTIONS</button>');
    $('v71dtGo').onclick=async function(){
      try{
        var id=$('v71dt').value,t=state.tests.find(function(x){return String(x.id)===String(id)});if(!t)throw new Error('Select a destination test.');
        await saveTestBundle(t,t.questions.concat(qs),{});closeModal();await refresh();toast(qs.length+' question(s) added to '+t.title+'.');
      }catch(e){fail(e);}
    };
  }

  function openQuestionEditor(original,done){
    if(!original) {toast('Question data was not found.',true);return;}
    var q=clone(original);
    if(!Array.isArray(q.options))q.options=[];
    if(q.options.length<2&&qtype(q)==='mcq')q.options=[{text:'',image:null},{text:'',image:null}];
    var body=modal('Question Editor','<div id="hoaV71QuestionEditorBody"></div>');
    var host=$('hoaV71QuestionEditorBody');
    function render(){
      var numerical=qtype(q)==='numerical';
      host.innerHTML=''
        +'<div class="hoaV71-actions"><b>Question Format:</b><button type="button" class="hoaV71-btn small '+(!numerical?'primary':'')+'" id="v71qMcq">MCQ</button><button type="button" class="hoaV71-btn small '+(numerical?'primary':'')+'" id="v71qNum">NUMERICAL</button></div>'
        +'<div class="hoaV71-grid" style="margin-top:10px"><label class="hoaV71-field">Question Text<textarea id="v71qText">'+esc(q.question_text||'')+'</textarea></label><label class="hoaV71-field">I: Source / Information<input id="v71qSource" value="'+esc(q.source||'')+'" placeholder="JE PYQ"></label></div>'
        +'<div class="hoaV71-card" style="margin-top:10px"><div class="hoaV71-section-title" style="font-size:14px">Question Image</div><div class="hoaV71-help">For picture questions, upload an image here. Text-only, image-only and text + image are supported.</div><div class="hoaV71-actions" style="margin-top:7px"><button type="button" class="hoaV71-btn small" id="v71qImg">'+(q.question_image_path?'REPLACE IMAGE':'UPLOAD IMAGE')+'</button><button type="button" class="hoaV71-btn small danger" id="v71qImgRemove" '+(q.question_image_path?'':'disabled')+'>REMOVE</button></div><div class="hoaV71-help" id="v71qImgPath">'+esc(q.question_image_path||'No image attached')+'</div></div>'
        +(numerical
          ?'<div class="hoaV71-grid" style="margin-top:10px"><label class="hoaV71-field">Correct Numerical Value *<input id="v71qValue" type="number" step="any" value="'+esc(q.correct_value==null?'':q.correct_value)+'"></label><label class="hoaV71-field">Tolerance<input id="v71qTol" type="number" min="0" step="any" value="'+esc(q.tolerance==null?'':q.tolerance)+'"></label></div>'
          :'<div class="hoaV71-card" style="margin-top:10px"><div class="hoaV71-head"><div><div class="hoaV71-section-title" style="font-size:14px">Options</div><div class="hoaV71-help">2–10 options. Each option can contain text, an image, or both.</div></div><button type="button" class="hoaV71-btn small" id="v71qAddOption">＋ ADD OPTION</button></div><div id="v71qOptions"></div><label class="hoaV71-field" style="margin-top:9px">Correct Option<select id="v71qCorrect"></select></label></div>')
        +'<div class="hoaV71-card" style="margin-top:10px"><div class="hoaV71-section-title" style="font-size:14px">Explanation</div><textarea id="v71qExp" style="width:100%;box-sizing:border-box;margin-top:7px;min-height:100px;padding:10px;border:1px solid #c8d8e8;border-radius:9px">'+esc(q.explanation_text||'')+'</textarea><div class="hoaV71-actions" style="margin-top:7px"><button type="button" class="hoaV71-btn small" id="v71qExpImg">'+(q.explanation_image_path?'REPLACE IMAGE':'UPLOAD IMAGE')+'</button><button type="button" class="hoaV71-btn small danger" id="v71qExpImgRemove" '+(q.explanation_image_path?'':'disabled')+'>REMOVE</button></div><div class="hoaV71-help">'+esc(q.explanation_image_path||'No explanation image attached')+'</div></div>'
        +'<div class="hoaV71-actions" style="margin-top:10px"><button type="button" class="hoaV71-btn primary" id="v71qSave">SAVE QUESTION</button></div>';

      $('v71qText').oninput=function(){q.question_text=this.value;};
      $('v71qSource').oninput=function(){q.source=this.value;};
      $('v71qImg').onclick=function(){pickImage(function(path){q.question_image_path=path;render();});};
      $('v71qImgRemove').onclick=function(){q.question_image_path=null;render();};
      $('v71qExp').oninput=function(){q.explanation_text=this.value;};
      $('v71qExpImg').onclick=function(){pickImage(function(path){q.explanation_image_path=path;render();});};
      $('v71qExpImgRemove').onclick=function(){q.explanation_image_path=null;render();};
      $('v71qMcq').onclick=function(){q.question_type='mcq';if(q.options.length<2)q.options=[{text:'',image:null},{text:'',image:null}];render();};
      $('v71qNum').onclick=function(){q.question_type='numerical';q.options=[];q.correct_answer=null;render();};

      if(!numerical){
        var optBox=$('v71qOptions');
        optBox.innerHTML=q.options.map(function(o,i){
          return '<div class="hoaV71-pick"><div class="hoaV71-grid"><label class="hoaV71-field">Option '+(i+1)+'<input data-v71-ot="'+i+'" value="'+esc(o.text||'')+'"></label><div><div class="hoaV71-actions" style="margin-top:22px"><button type="button" class="hoaV71-btn small" data-v71-oi="'+i+'">'+(o.image?'REPLACE':'UPLOAD')+' IMAGE</button><button type="button" class="hoaV71-btn small danger" data-v71-od="'+i+'" '+(q.options.length<=2?'disabled':'')+'>REMOVE</button></div><div class="hoaV71-help">'+esc(o.image||'No image attached')+'</div></div></div></div>';
        }).join('');
        optBox.querySelectorAll('[data-v71-ot]').forEach(function(i){i.oninput=function(){q.options[Number(i.dataset.v71Ot)].text=i.value;};});
        optBox.querySelectorAll('[data-v71-oi]').forEach(function(b){b.onclick=function(){pickImage(function(path){q.options[Number(b.dataset.v71Oi)].image=path;render();});};});
        optBox.querySelectorAll('[data-v71-od]').forEach(function(b){b.onclick=function(){var i=Number(b.dataset.v71Od);q.options.splice(i,1);if(Number(q.correct_answer)>q.options.length)q.correct_answer=q.options.length;render();};});
        var cs=$('v71qCorrect');cs.innerHTML=q.options.map(function(o,i){return '<option value="'+(i+1)+'">Option '+(i+1)+'</option>';}).join('');cs.value=String(q.correct_answer||1);cs.onchange=function(){q.correct_answer=Number(this.value);};
        $('v71qAddOption').onclick=function(){if(q.options.length>=10){toast('Maximum 10 MCQ options.',true);return;}q.options.push({text:'',image:null});render();};
      }
      $('v71qSave').onclick=function(){
        q.question_text=$('v71qText').value;
        q.source=$('v71qSource').value.trim();
        q.explanation_text=$('v71qExp').value;
        if(qtype(q)==='numerical'){q.correct_value=Number($('v71qValue').value);q.tolerance=$('v71qTol').value===''?null:Number($('v71qTol').value);q.options=[];q.correct_answer=null;}
        var errors=validateQuestion(q);if(errors.length){alert(errors.join('\n'));return;}
        closeModal();if(done)done(q);
      };
    }
    async function pickImage(after){
      var fileInput=document.createElement('input');fileInput.type='file';fileInput.accept='image/*';
      fileInput.onchange=async function(){var f=fileInput.files&&fileInput.files[0];if(!f)return;try{var path=await uploadImage(f);after(path);}catch(e){fail(e);}};
      fileInput.click();
    }
    render();
  }

  async function uploadImage(file){
    if(!file||!/^image\\//i.test(file.type))throw new Error('Only image files are supported.');
    if(file.size>15*1024*1024)throw new Error('Image exceeds 15 MB.');
    var ext=(String(file.name||'png').split('.').pop()||'png').toLowerCase().replace(/[^a-z0-9]/g,'')||'png';
    var path='admin/'+await uid()+'/'+crypto.randomUUID()+'.'+ext;
    var r=await db().storage.from('question-media').upload(path,file,{contentType:file.type,upsert:false});
    if(r.error)throw r.error;return path;
  }

  async function persistQuestion(q){
    if(!guard('Question bank editing'))return;
    var p=clone(q),c=db(),opts=qtype(p)==='numerical'?[]:(p.options||[]).map(function(o){return {text:o.text||'',image:o.image||null};});
    var row={question_text:String(p.question_text||''),option_1:opts[0]?opts[0].text||'':'',option_2:opts[1]?opts[1].text||'':'',option_3:opts[2]?opts[2].text||'':'',option_4:opts[3]?opts[3].text||'':'',correct_option:qtype(p)==='numerical'?null:Number(p.correct_answer)||null,explanation:String(p.explanation_text||''),question_order:Number(p.question_order)||1,question_type:qtype(p),source:String(p.source||'').trim()||null,options_json:opts,question_image_path:p.question_image_path||null,explanation_text:String(p.explanation_text||''),explanation_image_path:p.explanation_image_path||null,correct_value:qtype(p)==='numerical'?Number(p.correct_value):null,tolerance:qtype(p)==='numerical'&&(p.tolerance!==null&&p.tolerance!==''?Number(p.tolerance):null)};
    var r=await c.from('questions').update(row).eq('id',p.id);if(r.error)throw r.error;
    var k=await c.from('question_answer_keys').upsert({question_id:p.id,correct_option:row.correct_option,explanation:row.explanation,question_type:row.question_type,correct_value:row.correct_value,tolerance:row.tolerance,explanation_text:row.explanation_text,explanation_image_path:row.explanation_image_path});
    if(k.error)throw k.error;
  }
  async function deleteQuestion(id){
    if(!guard('Question bank deletion'))return;
    try{
      var c=db(),a=await c.from('answers').select('id',{count:'exact',head:true}).eq('question_id',id);if(a.error)throw a.error;
      if((a.count||0)>0){toast('This question is referenced by historical answers, so it cannot be hard-deleted. Edit it instead.',true);return;}
      var q=state.bank.find(function(x){return String(x.id)===String(id)});if(!q)return;
      if(!confirm('Delete this question permanently? Continue?'))return;
      var r=await c.from('questions').delete().eq('id',id).select('id').maybeSingle();
      if(r.error)throw r.error;if(!r.data)throw new Error('Question was not deleted. Check your Admin permission for tests.manage.');
      await refresh();toast('Question deleted.');
    }catch(e){fail(e);}
  }

  function rpcQuestion(q,order){
    return {id:q.id||null,question_type:qtype(q),question_text:q.question_text||'',question_image_path:q.question_image_path||null,source:q.source||null,options:qtype(q)==='numerical'?[]:(q.options||[]).map(function(o){return {text:o.text||'',image:o.image||null};}),correct_option:qtype(q)==='numerical'?null:Number(q.correct_answer)||null,correct_value:qtype(q)==='numerical'?Number(q.correct_value):null,tolerance:qtype(q)==='numerical'&&(q.tolerance!==null&&q.tolerance!==''?Number(q.tolerance):null),explanation_text:q.explanation_text||'',explanation_image_path:q.explanation_image_path||null,question_order:order};
  }

  async function saveTestBundle(t,qs,overrides){
    if(!guard('Mock Test creation/editing'))return;
    overrides=overrides||{};
    var c=db(),type=normalizedTestType(overrides.test_type||(t&&t.test_type)||'subject'),access=overrides.access_type||(t&&t.access_type)||'paid',batch=overrides.test_batch_id!==undefined?overrides.test_batch_id:(t?t.test_batch_id:null),folder=overrides.test_batch_folder_id!==undefined?overrides.test_batch_folder_id:(t?t.test_batch_folder_id:null);
    if(!qs||!qs.length)throw new Error('At least one question is required.');
    var clean=(qs||[]).map(function(q,i){
      var x=clone(q);delete x.errors;delete x._feedNo;delete x._valid;
      var e=validateQuestion(x);if(e.length)throw new Error('Question '+(i+1)+': '+e.join(' '));
      return rpcQuestion(x,i+1);
    });
    if(access==='paid'&&(!batch||!folder))throw new Error('Paid tests require a Mock Test Batch and Folder.');
    if(batch&&!folder)throw new Error('Select a Folder when a Batch is selected.');
    var title=String(overrides.title!==undefined?overrides.title:(t&&t.title)||'New Mock Test').trim();if(title.length<3)throw new Error('Test title must contain at least 3 characters.');
    var payload={p_test_id:t?t.id:null,p_title:title,p_description:overrides.description!==undefined?overrides.description:(t&&t.description)||null,p_duration_minutes:Number(overrides.duration!==undefined?overrides.duration:(t&&t.duration_minutes)||20)||20,p_marks_per_question:Number(overrides.marks!==undefined?overrides.marks:(t&&t.marks_per_question)||1)||1,p_negative_marking:Number(overrides.negative!==undefined?overrides.negative:(t&&t.negative_marking)||0.25)||0,p_is_published:overrides.is_published!==undefined?!!overrides.is_published:!!(t&&t.is_published),p_access_type:access,p_test_batch_id:batch||null,p_test_batch_folder_id:folder||null,p_test_type:type,p_questions:clean};
    var r=await c.rpc('save_test_bundle_v3',payload);if(r.error)throw r.error;return r.data;
  }

  function testEditorQuestion(q,i){
    return '<div class="hoaV71-item"><div class="hoaV71-row"><div><div class="hoaV71-name">Q'+(i+1)+' · '+esc(qtype(q).toUpperCase())+'</div><div class="hoaV71-meta">'+esc(q.source||'No source')+' · '+(qtype(q)==='numerical'?'Correct: '+esc(q.correct_value):(q.options.length+' options · Correct: '+esc(q.correct_answer)))+(q.question_image_path?' · QUESTION IMAGE':'')+'</div></div><div class="hoaV71-actions"><button type="button" class="hoaV71-btn small" data-v71-testqedit="'+i+'">EDIT</button><button type="button" class="hoaV71-btn small" data-v71-testqup="'+i+'">↑</button><button type="button" class="hoaV71-btn small" data-v71-testqdown="'+i+'">↓</button><button type="button" class="hoaV71-btn small danger" data-v71-testqdel="'+i+'">REMOVE</button></div></div><div class="hoaV71-qtext" style="margin-top:6px">'+esc(q.question_text||'[Image question]')+'</div></div>';
  }
  function openTestEditor(test,seed){
    if(!guard('Mock Test creation/editing'))return;
    var qs=(seed||[]).map(clone),type=normalizedTestType(test&&test.test_type||'subject'),batch=test&&test.test_batch_id||'',folder=test&&test.test_batch_folder_id||'';
    var body=modal(test?'Edit Mock Test':'Create Mock Test','<div id="hoaV71TestEditor"></div>'),host=$('hoaV71TestEditor');
    function folders(){
      var s=type,b=batch,sel=folder;
      return state.folders.filter(function(f){return f.is_active&&String(f.test_batch_id)===String(b)&&f.folder_type===folderTypeForTestType(s);}).map(function(f){return '<option value="'+esc(f.id)+'"'+(String(f.id)===String(sel)?' selected':'')+'>'+esc(f.name)+'</option>';}).join('');
    }
    function render(){
      host.innerHTML='<div class="hoaV71-grid">'
        +'<label class="hoaV71-field">Test Title *<input id="v71teTitle" value="'+esc(test&&test.title||'New Mock Test')+'"></label>'
        +'<label class="hoaV71-field">Duration (minutes)<input id="v71teDuration" type="number" min="1" value="'+esc(test&&test.duration_minutes||20)+'"></label>'
        +'<label class="hoaV71-field">Marks / Correct<input id="v71teMarks" type="number" min="0" step="0.25" value="'+esc(test&&test.marks_per_question||1)+'"></label>'
        +'<label class="hoaV71-field">Negative Marks<input id="v71teNegative" type="number" min="0" step="0.05" value="'+esc(test&&test.negative_marking==null?.25:test.negative_marking)+'"></label>'
        +'<label class="hoaV71-field">Access<select id="v71teAccess"><option value="paid">Paid</option><option value="free">Free</option></select></label>'
        +'<label class="hoaV71-field">Test Type<select id="v71teType"><option value="subject">Subject-wise</option><option value="full_length">Full-Length</option></select></label>'
        +'<label class="hoaV71-field">Mock Test Batch<select id="v71teBatch"><option value="">No batch</option>'+state.batches.map(function(b){return '<option value="'+esc(b.id)+'">'+esc(b.name)+'</option>';}).join('')+'</select></label>'
        +'<label class="hoaV71-field">Folder<select id="v71teFolder"><option value="">Select folder</option>'+folders()+'</select></label>'
        +'<label class="hoaV71-field" style="grid-column:1/-1">Description<textarea id="v71teDesc">'+esc(test&&test.description||'')+'</textarea></label>'
        +'</div>'
        +'<div class="hoaV71-card" style="margin-top:10px"><div class="hoaV71-head"><div><div class="hoaV71-section-title">Test Questions</div><div class="hoaV71-help">Add blank questions, attach images, add numerical questions, reorder, remove or import from the bank.</div></div><div class="hoaV71-actions"><button type="button" class="hoaV71-btn small" id="v71teBlank">＋ BLANK QUESTION</button><button type="button" class="hoaV71-btn small gold" id="v71teBank">＋ FROM QUESTION BANK</button></div></div><div id="v71teQuestionList"></div></div>'
        +'<div class="hoaV71-actions"><button type="button" class="hoaV71-btn primary" id="v71teSave">SAVE MOCK TEST</button></div>';
      $('v71teAccess').value=(test&&test.access_type)||'paid';$('v71teType').value=type;$('v71teBatch').value=batch;
      $('v71teBatch').onchange=function(){batch=this.value;folder='';render();};
      $('v71teType').onchange=function(){type=this.value;folder='';render();};
      $('v71teBlank').onclick=function(){qs.push({id:null,question_type:'mcq',question_text:'',question_image_path:null,source:'',options:[{text:'',image:null},{text:'',image:null}],correct_answer:1,correct_value:null,tolerance:null,explanation_text:'',explanation_image_path:null,question_order:qs.length+1});render();};
      $('v71teBank').onclick=function(){openBankPicker(function(arr){arr.forEach(function(x){qs.push(clone(x));});render();});};
      $('v71teQuestionList').innerHTML=qs.length?qs.map(testEditorQuestion).join(''):'<div class="hoaV71-empty">No questions. Add a blank question or select questions from the bank.</div>';
      document.querySelectorAll('[data-v71-testqedit]').forEach(function(b){b.onclick=function(){openQuestionEditor(qs[Number(b.dataset.v71Testqedit)],function(updated){qs[Number(b.dataset.v71Testqedit)]=updated;render();});};});
      document.querySelectorAll('[data-v71-testqup]').forEach(function(b){b.onclick=function(){var i=Number(b.dataset.v71Testqup);if(i>0){var z=qs[i-1];qs[i-1]=qs[i];qs[i]=z;render();}};});
      document.querySelectorAll('[data-v71-testqdown]').forEach(function(b){b.onclick=function(){var i=Number(b.dataset.v71Testqdown);if(i<qs.length-1){var z=qs[i+1];qs[i+1]=qs[i];qs[i]=z;render();}};});
      document.querySelectorAll('[data-v71-testqdel]').forEach(function(b){b.onclick=function(){qs.splice(Number(b.dataset.v71Testqdel),1);render();};});
      $('v71teSave').onclick=async function(){
        try{
          var access=$('v71teAccess').value;
          var overrides={title:$('v71teTitle').value.trim(),duration:Number($('v71teDuration').value)||20,marks:Number($('v71teMarks').value)||1,negative:Number($('v71teNegative').value)||0,access_type:access,test_type:type,test_batch_id:$('v71teBatch').value||null,test_batch_folder_id:$('v71teFolder').value||null,description:$('v71teDesc').value.trim()||null,is_published:test?!!test.is_published:false};
          await saveTestBundle(test,qs,overrides);closeModal();await refresh();toast(test?'Mock test updated.':'Mock test created.');
        }catch(e){fail(e);}
      };
    }
    render();
  }

  function openBankPicker(done){
    var body=modal('Select Questions from Question Bank','<div class="hoaV71-bar"><input id="v71bpSearch" placeholder="Search question"><select id="v71bpType"><option value="">All types</option><option value="mcq">MCQ</option><option value="numerical">Numerical</option></select></div><label class="hoaV71-check"><input id="v71bpAll" type="checkbox"> Select all visible</label><div id="v71bpList" class="hoaV71-scroll"></div><div class="hoaV71-actions" style="margin-top:10px"><button type="button" class="hoaV71-btn primary" id="v71bpAdd">ADD SELECTED</button></div>');
    function rows(){
      var q=String($('v71bpSearch').value||'').toLowerCase(),typ=$('v71bpType').value;
      return state.bank.filter(function(x){return (!q||[x.question_text,x.source,x.explanation_text].join(' ').toLowerCase().indexOf(q)>=0)&&(!typ||x.question_type===typ);});
    }
    function render(){
      var a=rows(),box=$('v71bpList');
      box.innerHTML=a.map(function(x){return '<label class="hoaV71-pick"><input type="checkbox" data-v71-bpick="'+esc(x.id)+'"> <b>'+esc(qtype(x).toUpperCase())+'</b> · '+esc(x.question_text||'[Image question]')+' <span class="hoaV71-badge">'+esc(testName(x.test_id))+'</span></label>';}).join('')||'<div class="hoaV71-empty">No questions found.</div>';
    }
    $('v71bpSearch').oninput=render;$('v71bpType').onchange=render;$('v71bpAll').onchange=function(){document.querySelectorAll('[data-v71-bpick]').forEach(function(x){x.checked=$('v71bpAll').checked;});};
    $('v71bpAdd').onclick=function(){var ids=Array.from(document.querySelectorAll('[data-v71-bpick]:checked')).map(function(x){return String(x.dataset.v71Bpick);}),arr=state.bank.filter(function(x){return ids.indexOf(String(x.id))>=0;});if(!arr.length){toast('Select at least one question.',true);return;}closeModal();done(arr.map(clone));};
    render();
  }

  function previewTest(t){
    if(!t)return;
    var parts='<div class="hoaV71-help">'+esc(t.title)+' · '+t.questions.length+' questions · '+(t.is_published?'Published':'Draft')+'</div>';
    parts+=t.questions.map(function(q,i){
      var opts=qtype(q)==='numerical'
        ?'<div class="hoaV71-note">Correct value: '+esc(q.correct_value)+(q.tolerance!=null?' · Tolerance: '+esc(q.tolerance):'')+'</div>'
        :q.options.map(function(o,k){return '<div class="hoaV71-option '+(Number(q.correct_answer)===k+1?'correct':'')+'"><b>'+(k+1)+'.</b> '+esc(o.text||'[Image option]')+(o.image?' <span class="hoaV71-badge">IMAGE</span>':'')+'</div>';}).join('');
      return '<div class="hoaV71-preview-q"><div class="hoaV71-name">Question '+(i+1)+' · '+esc(qtype(q).toUpperCase())+'</div><div class="hoaV71-meta">I: '+esc(q.source||'—')+'</div><div class="hoaV71-qtext" style="margin-top:6px">'+esc(q.question_text||'[Image question]')+'</div>'+opts+(q.explanation_text?'<div class="hoaV71-note" style="margin-top:6px"><b>Explanation:</b><br>'+esc(q.explanation_text)+'</div>':'')+'</div>';
    }).join('');
    var body=modal('Test Preview',parts+'<div id="hoaV71PreviewImages"></div>');
    hydratePreviewImages(t);
  }
  async function hydratePreviewImages(t){
    var root=$('hoaV71ModalBody');if(!root)return;
    var imgs=[];
    for(var i=0;i<t.questions.length;i++){
      var q=t.questions[i];
      if(q.question_image_path)imgs.push({path:q.question_image_path,selector:'[data-v71-preview-img="q'+i+'"]'});
      for(var j=0;j<q.options.length;j++)if(q.options[j].image)imgs.push({path:q.options[j].image,selector:'[data-v71-preview-img="q'+i+'o'+j+'"]'});
    }
    // Replace the preview with media-aware HTML in one pass.
    var html='<div class="hoaV71-help">'+esc(t.title)+' · '+t.questions.length+' questions</div>';
    for(var k=0;k<t.questions.length;k++){
      var q=t.questions[k];
      html+='<div class="hoaV71-preview-q"><div class="hoaV71-name">Question '+(k+1)+' · '+esc(qtype(q).toUpperCase())+'</div><div class="hoaV71-meta">I: '+esc(q.source||'—')+'</div><div class="hoaV71-qtext" style="margin-top:6px">'+esc(q.question_text||'[Image question]')+'</div>';
      if(q.question_image_path)html+=await imageTag(q.question_image_path,'Question '+(k+1)+' image');
      if(qtype(q)==='numerical'){html+='<div class="hoaV71-note">Correct value: '+esc(q.correct_value)+(q.tolerance!=null?' · Tolerance: '+esc(q.tolerance):'')+'</div>';}
      else for(var j=0;j<q.options.length;j++){html+='<div class="hoaV71-option '+(Number(q.correct_answer)===j+1?'correct':'')+'"><b>'+(j+1)+'.</b> '+esc(q.options[j].text||'');if(q.options[j].image)html+=await imageTag(q.options[j].image,'Option '+(j+1));html+='</div>';};
      if(q.explanation_text||q.explanation_image_path){html+='<div class="hoaV71-note" style="margin-top:6px"><b>Explanation</b><br>'+esc(q.explanation_text||'')+(q.explanation_image_path?await imageTag(q.explanation_image_path,'Explanation image'):'')+'</div>';};
      html+='</div>';
    }
    if($('hoaV71ModalBody'))$('hoaV71ModalBody').innerHTML=html;
  }

  async function pickDestinationQuestionTest(qs){
    pickDestinationTest(qs);
  }

  function hookNavigation(){
    var old=global.showAdminSection;
    if(typeof old==='function'&&!old.__hoaV71Wrapped){
      var wrapped=function(section){
        var r=old.apply(this,arguments);
        if(String(section||'').toLowerCase()==='test'){
          setTimeout(function(){if(!state.installed)install();else refresh();},0);
        }
        return r;
      };
      wrapped.__hoaV71Wrapped=true;wrapped.__hoaV71Original=old;global.showAdminSection=wrapped;
    }
  }

  function boot(){
    hookNavigation();
    if(adminOK()&&$('adminSectionTestPanel'))install();
  }

  global.hoaMockTestStudioV71={
    install:install,
    refresh:refresh,
    openTestEditor:openTestEditor,
    openQuestionEditor:openQuestionEditor
  };
  global.hoaV71RefreshMockTests=refresh;

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();

})(window);
