/* HOA V4.7 / V8.90 — Paid/Free Mock Workflow Consolidation
 * Source of truth: V8.57 architecture.
 * Owns only the Admin > Mock Tests section.
 * Uses the existing Supabase schema and existing production test engine.
 */
(function(){
  'use strict';
  const VERSION='V8.90.41';
  const BUCKET='question-media';
  const IMG_TYPES=['image/png','image/jpeg','image/webp','image/gif'];
  const MAX_IMG=10*1024*1024;
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const db=()=>window.supabaseClient||window.supabase||null;
  const isAdmin=()=>{
    try{return !!((typeof window.isAdminMode==='function'&&window.isAdminMode()) || window.adminLoggedIn===true || (typeof adminLoggedIn!=='undefined'&&adminLoggedIn===true));}catch(_){return false}
  };
  const state={mounted:false,tab:'dashboard',batches:[],folders:[],tests:[],testPage:1,testPageSize:25,testTotal:0,bank:[],bankPage:1,bankPageSize:50,bankTotal:0,bankSelected:new Set(),bankSelectedData:new Map(),currentQuestions:[],editingTestId:null,feed:[],feedPage:1,feedPageSize:10,signed:new Map(),objectUrls:new Set(),previewUrlByFile:new WeakMap(),feedPasteImages:new Map(),pasteImageCounter:0,pasteImagesParsed:false,previewEditing:new Set(),acceptedPreviewRenderId:0,previewPreviousBodyOverflow:null,batchEditId:null,folderEditId:null,selectedBatchFolders:[],savingFeed:false,savingTest:false,creationContext:null,builderDefaults:null,pendingMediaUploads:[],pendingMediaChanges:[]};

  function status(id,msg,type){const e=$(id);if(!e)return;e.textContent=msg||'';e.className='hoa85-status'+(type?' '+type:'');}
  function notify(msg,type){const box=$('hoa85Toast');if(!box)return;box.textContent=msg;box.className='hoa85-toast show '+(type||'');clearTimeout(box._t);box._t=setTimeout(()=>box.className='hoa85-toast',3200);}
  async function requireAdmin(...permissions){if(!isAdmin())throw new Error('Admin authorization required.');const c=db();if(!c)throw new Error('Supabase is not ready.');const s=await c.auth.getSession();if(s.error||!s.data?.session?.user)throw new Error('Admin session required.');if(permissions.length){if(typeof window.hoaRequireAdminPermission!=='function')throw new Error('Admin permission service is not available.');await window.hoaRequireAdminPermission(...permissions);}return s.data.session.user;}
  function cleanupUrls(){state.objectUrls.forEach(u=>{try{URL.revokeObjectURL(u)}catch(_){}});state.objectUrls.clear();state.previewUrlByFile=new WeakMap();}

  async function fetchBatches(){const c=db();const r=await c.from('test_batches').select('id,name,batch_code,description,status,is_published,sort_order,created_at,updated_at').order('sort_order').order('created_at',{ascending:false});if(r.error)throw r.error;state.batches=r.data||[];return state.batches;}
  async function fetchFolders(batchId){if(!batchId){state.selectedBatchFolders=[];return []}const c=db();const r=await c.from('test_batch_folders').select('id,test_batch_id,name,folder_type,sort_order,is_active,created_at,updated_at').eq('test_batch_id',batchId).order('folder_type').order('sort_order').order('name');if(r.error)throw r.error;state.selectedBatchFolders=r.data||[];return state.selectedBatchFolders;}
  async function fetchTests(opts={}){const c=db();if(!c)throw new Error('Supabase is not ready.');if(opts.resetPage)state.testPage=1;const search=($('hoa85TestSearch')?.value||'').trim()||null;const batchId=$('hoa85TestBatch')?.value||null;const folderId=$('hoa85TestFolder')?.value||null;const statusFilter=$('hoa85TestStatus')?.value||null;const access='paid';const sort=$('hoa85TestSort')?.value||'newest';const r=await c.rpc('hoa_admin_mock_test_library_v1',{p_search:search,p_batch_id:batchId,p_folder_id:folderId,p_status:statusFilter,p_access_type:access,p_sort:sort,p_limit:state.testPageSize,p_offset:(state.testPage-1)*state.testPageSize});if(r.error)throw r.error;state.tests=r.data||[];state.testTotal=state.tests.length?Number(state.tests[0].total_count||0):0;return state.tests;}
  async function fetchQuestionBank(opts={}){const c=db();if(!c)throw new Error('Supabase is not ready.');if(opts.resetPage)state.bankPage=1;const search=(document.getElementById('hoa85BankSearch')?.value||'').trim()||null;const testId=document.getElementById('hoa85BankTestFilter')?.value||null;const type=document.getElementById('hoa85BankType')?.value||null;const sort=document.getElementById('hoa85BankSort')?.value||'newest';const r=await c.rpc('hoa_admin_question_bank_list_v2',{p_search:search,p_test_id:testId,p_question_type:type,p_sort:sort,p_limit:state.bankPageSize,p_offset:(state.bankPage-1)*state.bankPageSize});if(r.error)throw r.error;state.bank=r.data||[];state.bankTotal=state.bank.length?Number(state.bank[0].total_count||0):0;state.bank.forEach(q=>state.bankSelectedData.set(String(q.question_bank_id||q.id),q));return state.bank;}

  function testBatchName(id){return state.batches.find(x=>String(x.id)===String(id))?.name||'Unassigned';}
  function folderName(id){return state.folders.find(x=>String(x.id)===String(id))?.name||'Unassigned';}
  function testLabel(id){return state.tests.find(x=>String(x.id)===String(id))?.title||'Unknown Test';}

  function cleanupLegacyWorkspaces(){
    // Older scripts can recreate these after initial page boot. Keep the current
    // tabbed workspace authoritative and prevent legacy architecture panels from
    // appearing above/below every tab.
    document.querySelectorAll('#adminSectionTestPanel #hoaV610MockWorkspace, #adminSectionTestPanel #hoa606MockWorkspace').forEach(x=>x.remove());
  }

  function renderShell(){
    const host=$('adminSectionTestPanel');if(!host)return;
    cleanupLegacyWorkspaces();
    let root=$('hoaV89MockWorkspace');
    if(root)return root;
    // The legacy workspace is removed before the root early-return, so it cannot
    // remain visible if a previous script injects it after this workspace mounts.
    host.querySelectorAll('.adminGrid').forEach(x=>x.style.display='none');
    root=document.createElement('section');root.id='hoaV89MockWorkspace';root.className='hoa85-shell';
    root.innerHTML=`
      <div class="hoa85-head"><div><div class="hoa85-eyebrow">HUB OF ASPIRANTS · ${VERSION}</div><h2>Mock Test Management</h2><p>One workflow for organizing access, adding questions, building tests, and releasing them to students.</p></div><span class="hoa85-chip">${VERSION} • CONNECTED MOCK WORKSPACE</span></div>
      <div class="hoa85-tabs" role="tablist" aria-label="Mock Test workspace sections">
        <button class="hoa85-tab active" type="button" role="tab" aria-selected="true" data-tab="dashboard"><span class="hoa85-tab-icon" aria-hidden="true">📊</span><span class="hoa85-tab-label">Mock Test Overview</span></button>
        <button class="hoa85-tab" type="button" role="tab" aria-selected="false" data-tab="batches"><span class="hoa85-tab-icon" aria-hidden="true">📦</span><span class="hoa85-tab-label">Batches &amp; Folders</span></button>
        <button class="hoa85-tab" type="button" role="tab" aria-selected="false" data-tab="tests"><span class="hoa85-tab-icon" aria-hidden="true">📝</span><span class="hoa85-tab-label">Mock Tests</span></button>
        <button class="hoa85-tab" type="button" role="tab" aria-selected="false" data-tab="feed"><span class="hoa85-tab-icon" aria-hidden="true">⬆️</span><span class="hoa85-tab-label">Question Feeding</span></button>
        <button class="hoa85-tab" type="button" role="tab" aria-selected="false" data-tab="bank"><span class="hoa85-tab-icon" aria-hidden="true">❓</span><span class="hoa85-tab-label">Question Bank</span></button>
      </div>
      <div id="hoa85Pages">
        <section class="hoa85-page active" data-page="dashboard" id="hoa85DashboardPage"></section>
        <section class="hoa85-page" data-page="batches" id="hoa85BatchesPage"></section>
        <section class="hoa85-page" data-page="tests" id="hoa85TestsPage"></section>
        <section class="hoa85-page" data-page="feed" id="hoa85FeedPage"></section>
        <section class="hoa85-page" data-page="bank" id="hoa85BankPage"></section>
      </div>
      <div id="hoa85Toast" class="hoa85-toast" role="status" aria-live="polite"></div>
    `;
    host.insertBefore(root,host.firstChild);
    root.querySelectorAll('.hoa85-tab').forEach(b=>b.addEventListener('click',()=>openTab(b.dataset.tab)));
    buildDashboard();buildBatches();buildTests();buildFeed();buildBank();
    state.mounted=true;loadAll({bank:true}).catch(e=>notify(e.message,'error'));
    return root;
  }

  async function openTab(tab){
    const validTabs=new Set(['dashboard','batches','tests','feed','bank']);
    if(!validTabs.has(tab))tab='dashboard';
    if(state.creationContext==='freecontent'&&!['tests','feed'].includes(tab))tab='tests';
    cleanupLegacyWorkspaces();
    state.tab=tab;
    document.querySelectorAll('#hoaV89MockWorkspace .hoa85-tab').forEach(b=>{const active=b.dataset.tab===tab;b.classList.toggle('active',active);b.setAttribute('aria-selected',String(active));});
    document.querySelectorAll('#hoaV89MockWorkspace .hoa85-page').forEach(p=>p.classList.toggle('active',p.dataset.page===tab));
    if(tab==='batches')renderBatchData();
    if(tab==='tests')renderTestData();
    if(tab==='bank')renderBank();
    if(tab==='feed'){
      try{
        const ensureQf=window.__HOA_ADMIN_RUNTIME_V89_API__?.ensureQuestionFeedingModule;
        if(typeof ensureQf==='function') await ensureQf();
      }catch(e){notify('Question Feeding module could not be loaded: '+(e.message||e),'error');return;}
      updateFeedTargets();syncFeedFromCurrentQuestions();renderFeedTarget();
    }
  }
  window.hoaV89OpenMockTab=openTab;
  

  function buildDashboard(){
    // Overview is the single home for the mock-test architecture, health summary,
    // and latest tests. Other tabs contain only their own workspace panels.
    $('hoa85DashboardPage').innerHTML=`
      <div class="hoa85-stats"><div><b id="hoa85StatBatches">0</b><span>Batches</span></div><div><b id="hoa85StatFolders">0</b><span>Folders</span></div><div><b id="hoa85StatTests">0</b><span>Mock Tests</span></div><div><b id="hoa85StatQuestions">0</b><span>Questions</span></div></div>
      <div class="hoa85-card hoa85-architecture-card">
        <div class="hoa85-card-head"><div><h3>Mock Test Architecture</h3><p>The test structure and workflow overview. Use the tabs above to manage each component independently.</p></div><span class="hoa85-chip">BATCH-FIRST STRUCTURE</span></div>
        <div class="hoa85-architecture-flow" aria-label="Mock test architecture">
          <div class="hoa85-architecture-node"><span>01</span><b>Mock Test Batch</b><small>Top-level test series</small></div>
          <span class="hoa85-architecture-arrow" aria-hidden="true">›</span>
          <div class="hoa85-architecture-node"><span>02</span><b>Mock Type</b><small>Subject-wise or full-length</small></div>
          <span class="hoa85-architecture-arrow" aria-hidden="true">›</span>
          <div class="hoa85-architecture-node"><span>03</span><b>Folder</b><small>Group related tests</small></div>
          <span class="hoa85-architecture-arrow" aria-hidden="true">›</span>
          <div class="hoa85-architecture-node"><span>04</span><b>Mock Tests</b><small>Questions, timing and marks</small></div>
          <span class="hoa85-architecture-arrow" aria-hidden="true">›</span>
          <div class="hoa85-architecture-node"><span>05</span><b>Student Access</b><small>Control who can attempt</small></div>
        </div>
        <div class="hoa85-architecture-actions"><button class="hoa85-btn primary" type="button" id="hoa85OpenBatchesFromOverview">Manage Batches &amp; Folders</button><button class="hoa85-btn" type="button" id="hoa85OpenTestsFromOverview">Manage Mock Tests</button></div>
      </div>
      <div class="hoa85-card"><div class="hoa85-card-head"><div><h3>Latest Mock Tests</h3><p>Live summary from the existing mock-test library.</p></div><button class="hoa85-btn" id="hoa85DashRefresh">↻ Refresh</button></div><div id="hoa85DashLatest" class="hoa85-list"></div></div>`;
    $('hoa85DashRefresh').onclick=()=>loadAll();
    $('hoa85OpenBatchesFromOverview').onclick=()=>openTab('batches');
    $('hoa85OpenTestsFromOverview').onclick=()=>openTab('tests');
  }

  function buildBatches(){
    $('hoa85BatchesPage').innerHTML=`<div class="hoa85-layout two"><div class="hoa85-card"><div class="hoa85-card-head"><div><h3>Organize Batches &amp; Folders</h3><p>Use this before assigning paid tests. Create the series structure students will access.</p></div><button class="hoa85-btn" id="hoa85BatchRefresh">↻ Refresh</button></div><div class="hoa85-toolbar"><input id="hoa85BatchSearch" placeholder="Search batch name / code"><select id="hoa85BatchSort"><option value="order">Custom order</option><option value="name">Name</option><option value="newest">Newest</option><option value="oldest">Oldest</option></select><button class="hoa85-btn primary" id="hoa85NewBatch">＋ New Batch</button></div><div id="hoa85BatchList" class="hoa85-list scrollable"></div></div><div class="hoa85-card"><div class="hoa85-card-head"><div><h3 id="hoa85BatchEditorTitle">Create Mock Test Batch</h3><p>Create, edit, publish and delete. Deletion is safely blocked when the batch contains historical attempts.</p></div><span id="hoa85BatchChip" class="hoa85-chip">NEW</span></div><div class="hoa85-form-grid"><label>Batch Name<input id="hoa85BatchName" maxlength="150"></label><label>Batch Code<input id="hoa85BatchCode" maxlength="60"></label><label>Status<select id="hoa85BatchStatus"><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label><label class="wide">Description<textarea id="hoa85BatchDesc" rows="3" maxlength="500"></textarea></label><label>Sort Order<input id="hoa85BatchOrder" type="number" min="0" step="1" value="0"></label></div><div class="hoa85-actions"><button class="hoa85-btn primary" id="hoa85SaveBatch">SAVE BATCH</button><button class="hoa85-btn" id="hoa85ClearBatch">CLEAR</button></div><div id="hoa85BatchMsg" class="hoa85-status"></div></div></div><div class="hoa85-card"><div class="hoa85-card-head"><div><h3>Folders inside selected batch</h3><p>Folders can be renamed, reordered, archived/restored, or permanently deleted when safe.</p></div><span id="hoa85FolderChip" class="hoa85-chip">SELECT BATCH</span></div><div class="hoa85-toolbar"><select id="hoa85FolderType"><option value="subject">Subject-wise Mock</option><option value="full_length">Full-Length Mock</option></select><input id="hoa85FolderName" placeholder="Folder name"><input id="hoa85FolderOrder" type="number" min="0" step="1" value="0"><button class="hoa85-btn primary" id="hoa85SaveFolder">CREATE FOLDER</button><button class="hoa85-btn" id="hoa85ClearFolder">CLEAR</button></div><div id="hoa85FolderList" class="hoa85-list scrollable"></div><div id="hoa85FolderMsg" class="hoa85-status"></div></div>`;
    $('hoa85BatchSearch').oninput=renderBatchData;$('hoa85BatchSort').onchange=renderBatchData;$('hoa85BatchRefresh').onclick=()=>loadAll();$('hoa85NewBatch').onclick=clearBatchEditor;$('hoa85SaveBatch').onclick=saveBatch;$('hoa85ClearBatch').onclick=clearBatchEditor;$('hoa85SaveFolder').onclick=saveFolder;$('hoa85ClearFolder').onclick=clearFolderEditor;
  }

  function buildTests(){
    $('hoa85TestsPage').innerHTML=`<div class="hoa85-card"><div class="hoa85-card-head"><div><h3>Build &amp; Manage Mock Tests</h3><p>Manage mock tests intended for paid students: create, edit, preview, assign and publish.</p></div><div class="hoa85-actions"><button class="hoa85-btn" id="hoa85TestRefresh">↻ Refresh</button><button class="hoa85-btn primary" id="hoa85NewTest">＋ New Mock Test</button></div></div><div class="hoa85-toolbar multi"><input id="hoa85TestSearch" placeholder="Search title / batch / folder"><select id="hoa85TestBatch"><option value="">All batches</option></select><select id="hoa85TestFolder"><option value="">All folders</option></select><select id="hoa85TestStatus"><option value="">All status</option><option value="published">Published</option><option value="draft">Draft</option></select><select id="hoa85TestAccess" aria-label="Mock Test access" hidden><option value="paid" selected>Paid</option></select><select id="hoa85TestSort"><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="name">Name</option><option value="questions">Question count</option></select></div><div class="hoa85-bank-summary"><span id="hoa85TestCount">0 tests</span><span>Page <b id="hoa85TestPageNo">1</b></span></div><div id="hoa85TestList" class="hoa85-list scrollable"></div><div class="hoa85-pagination"><button class="hoa85-btn" id="hoa85TestPrev">← Previous</button><button class="hoa85-btn" id="hoa85TestNext">Next →</button></div><div id="hoa85TestMsg" class="hoa85-status"></div></div><div class="hoa85-card" id="hoa85TestEditorCard"><div class="hoa85-card-head"><div><h3 id="hoa85TestEditorTitle">New Mock Test</h3><p>Build a test from the Question Bank or feed/import a new question set. Drafts may remain unassigned and can be placed into a paid Batch/Folder when ready.</p></div><span id="hoa85EditingChip" class="hoa85-chip">NEW</span></div><div class="hoa85-form-grid"><label class="wide">Test Title<input id="hoa85TestTitle"></label><label>Description<textarea id="hoa85TestDesc" rows="2"></textarea></label><label>Duration (minutes)<input id="hoa85TestDuration" type="number" min="1" value="10"></label><label>Marks per Question<input id="hoa85TestMarks" type="number" min="0" step="0.25" value="1"></label><label>Negative Marking<input id="hoa85TestNegative" type="number" min="0" step="0.05" value="0.25"></label><label>Access Type<select id="hoa85TestAccessType"><option value="paid" selected>Paid — Mock Tests</option><option value="free" hidden>Free — Free Content only</option></select></label><label>Test Type<select id="hoa85TestType"><option value="subject">Subject-wise Mock</option><option value="full_length">Full-Length Mock</option></select></label><label>Batch<select id="hoa85TestBatchSelect"><option value="">No Batch</option></select></label><label>Folder<select id="hoa85TestFolderSelect"><option value="">No Folder</option></select></label><label class="checkbox"><input type="checkbox" id="hoa85TestPublished"> Published</label><label class="checkbox wide"><input type="checkbox" id="hoa85TestShowResults" checked> Release score, correct answers &amp; explanations (can be changed later)</label></div><div class="hoa85-actions"><button class="hoa85-btn primary" id="hoa85SaveTest">SAVE MOCK TEST</button><button class="hoa85-btn" id="hoa85TestOpenBank">OPEN QUESTION BANK</button><button class="hoa85-btn" id="hoa85TestOpenFeed">OPEN QUESTION FEEDER</button><button class="hoa85-btn" id="hoa85TestLoadQuestions">LOAD CURRENT QUESTIONS</button><button class="hoa85-btn" id="hoa85TestCloseEditor">CLOSE EDITOR</button></div><div id="hoa85TestQuestionSummary" class="hoa85-summary"></div></div>`;
    ['hoa85TestSearch','hoa85TestBatch','hoa85TestFolder','hoa85TestStatus','hoa85TestAccess','hoa85TestSort'].forEach(id=>$(id).addEventListener('input',queueTestLibraryReload));['hoa85TestBatch','hoa85TestFolder','hoa85TestStatus','hoa85TestAccess','hoa85TestSort'].forEach(id=>$(id).addEventListener('change',queueTestLibraryReload));$('hoa85TestRefresh').onclick=()=>loadAll();$('hoa85TestPrev').onclick=()=>pageTests(-1);$('hoa85TestNext').onclick=()=>pageTests(1);$('hoa85NewTest').onclick=()=>startNewTest([],{access:'paid'});$('hoa85SaveTest').onclick=saveEditorTest;$('hoa85TestOpenBank').onclick=()=>openTab('bank');$('hoa85TestOpenFeed').onclick=()=>{if(state.editingTestId){if($('hoa85FeedTarget'))$('hoa85FeedTarget').value=state.editingTestId;loadSelectedFeedTest();}openTab('feed');};$('hoa85TestAccessType')?.addEventListener('change',syncEditorAccessFields);applyAccessPolicy();syncEditorAccessFields();$('hoa85TestLoadQuestions').onclick=()=>{openTab('feed');renderFeedEditor();};$('hoa85TestCloseEditor').onclick=()=>{$('hoa85TestEditorCard').classList.add('hidden')};$('hoa85TestBatchSelect').onchange=()=>loadEditorFolders($('hoa85TestBatchSelect').value);$('hoa85TestType').onchange=()=>loadEditorFolders($('hoa85TestBatchSelect').value);
    $('hoa85TestEditorCard').classList.add('hidden');
  }

  let testReloadTimer=null;const queueTestLibraryReload=()=>{clearTimeout(testReloadTimer);state.testPage=1;testReloadTimer=setTimeout(()=>fetchTests().then(()=>{renderTestData();updateFeedTargets();renderDashboardData();}).catch(e=>notify(e.message||'Mock Test Library could not be loaded.','error')),180)};
  async function pageTests(delta){const pages=Math.max(1,Math.ceil((state.testTotal||0)/state.testPageSize));const next=Math.max(1,Math.min(pages,state.testPage+delta));if(next===state.testPage)return;state.testPage=next;try{await fetchTests();renderTestData();updateFeedTargets();renderDashboardData();}catch(e){notify(e.message||'Mock Test Library could not be loaded.','error');}}

  function syncFeedAccessFields(){const access=$('hoa85FeedAccess')?.value;const free=access==='free';['hoa85FeedBatch','hoa85FeedFolder'].forEach(id=>{const e=$(id);if(!e)return;e.disabled=free||!!$('hoa85FeedTarget')?.value;if(free)e.value='';});}
  function buildFeed(){
    $('hoa85FeedPage').innerHTML=`<div class="hoa85-feed-hero"><div><h3>Question Feeding / Import</h3><p>Paste the exact HOA Telegram format or upload TXT/CSV. You can also paste an image with Ctrl+V into the Paste Questions box; after parsing, paste directly into a question, option or explanation field. Parse first, review and edit, attach images, then save.</p></div><span class="hoa85-chip">Q: • I: • An: • Ex:</span></div><div class="hoa85-example-grid"><article><b>MCQ — Numbered</b><pre>Q: What is the SI unit of force?\n\nI: SSC JE 2024\n1. Joule\n2. Newton\n3. Pascal\n4. Watt\n\nAn: 2\n\nEx: Newton is the SI unit.</pre></article><article><b>MCQ — Lettered / 2–10 options</b><pre>Q: Select the correct option.\n\nI: GATE 2025\nA. First\nB. Second\nC. Third\nD. Fourth\n\nAn: C</pre></article><article><b>Numerical</b><pre>Q: Calculate the value.\n\nI: SSC JE 2022\nQuestion Type: Numerical\nCorrect Answer: 3.14\nTolerance: 0.01\n\nEx: Approximately 3.14.</pre></article><article><b>Image Question / Option / Explanation</b><pre>Q:\n\nI: JE PYQ\n[QUESTION IMAGE]\n1. [OPTION IMAGE]\n2. Text option\n3. [OPTION IMAGE]\n4. Text option\n\nAn: 3\n\nEx: Solution below.\n[EXPLANATION IMAGE]</pre></article></div><div class="hoa85-card"><div class="hoa85-card-head"><div><h3>Feed Input</h3><p>I: / source and Ex: / explanation are optional. A question is valid when text OR image is present.</p></div><div class="hoa85-actions"><input id="hoa85TxtFile" type="file" accept=".txt,text/plain" class="hidden"><input id="hoa85CsvFile" type="file" accept=".csv,text/csv" class="hidden"><input id="hoa85DocFile" type="file" accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" class="hidden"><button class="hoa85-btn" id="hoa85UploadTxt">Upload TXT</button><button class="hoa85-btn" id="hoa85UploadCsv">Upload CSV</button><button class="hoa85-btn" id="hoa85UploadDoc">Upload DOC/DOCX</button></div></div><div class="hoa85-feed-config"><label>Target Test<select id="hoa85FeedTarget"><option value="">New Test</option></select></label><label>Parser Mode<select id="hoa85FeedMode"><option value="auto">Auto Detect</option><option value="mcq">MCQ</option><option value="numerical">Numerical</option></select></label><label>Test Title<input id="hoa85FeedTitle" value="TES Mock Test 01" maxlength="180"></label><label>Description<input id="hoa85FeedDesc" value="" maxlength="500"></label><label>Total Time (min)<input id="hoa85FeedDuration" type="number" min="1" value="10"></label><label>Marks per Question<input id="hoa85FeedMarks" type="number" min="0.01" step="0.25" value="1"></label><label>Negative Marks<input id="hoa85FeedNegative" type="number" min="0" step="0.05" value="0.25"></label><label>Access<select id="hoa85FeedAccess"><option value="paid" selected>Paid — Mock Tests</option><option value="free" hidden>Free — Free Content only</option></select></label><label>Test Type<select id="hoa85FeedTestType"><option value="subject">Subject-wise Mock</option><option value="full_length">Full-Length Mock</option></select></label><label>Batch<select id="hoa85FeedBatch"><option value="">No batch (draft library test)</option></select></label><label>Folder<select id="hoa85FeedFolder"><option value="">No folder (draft library test)</option></select></label><label>Save Mode<select id="hoa85FeedSaveMode"><option value="append">Append to Existing</option><option value="replace">Replace Existing</option></select></label><label class="hoa85-inline-check"><input id="hoa85FeedPublished" type="checkbox"> Publish after save</label><label class="hoa85-inline-check wide"><input id="hoa85FeedShowResults" type="checkbox" checked> Release score, correct answers &amp; explanations (can be changed later)</label><div class="hoa85-feed-paste-workspace wide" id="hoa85FeedPasteWorkspace"><div class="hoa85-feed-paste-toolbar"><label for="hoa85FeedInput">Paste Questions</label><div class="hoa85-actions"><button type="button" class="hoa85-btn" id="hoa85FeedFullscreen" aria-pressed="false">⛶ FULL SCREEN</button><button type="button" class="hoa85-btn danger" id="hoa85ClearPasteInput">CLEAR PASTE BOX</button></div></div><div id="hoa85FeedInput" class="hoa85-feed-input-editor" contenteditable="true" role="textbox" aria-multiline="true" spellcheck="false" data-placeholder="Q: ..."></div><small class="hoa85-feed-help">Paste text normally, or press Ctrl+V to place the actual clipboard image directly inside this box at the cursor. Images remain visible here and in the question preview. Use the × on an image to remove it. After parsing, use PREVIEW QUESTIONS (ACCEPTED + REJECTED) to review and edit accepted and rejected questions. PNG, JPG, WEBP and GIF are supported up to 10 MB.</small><div id="hoa85FeedPasteStatus" class="hoa85-feed-paste-status" aria-live="polite">No pasted images staged.</div></div></div><div class="hoa85-actions hoa85-feed-actions"><button class="hoa85-btn primary" id="hoa85ParseFeed">PARSE QUESTIONS</button><button class="hoa85-btn gold" id="hoa85SaveFeed">SAVE FEED TO TEST</button><button type="button" class="hoa85-btn hoa85-preview-launch" id="hoa85PreviewAccepted" disabled aria-haspopup="dialog" aria-controls="hoa85AcceptedPreviewModal" title="Preview all accepted, warning and rejected questions">◉ PREVIEW QUESTIONS (ACCEPTED + REJECTED)</button></div><p class="hoa85-feed-actions-help">Review every parsed question in a scrollable popup. You can edit accepted and rejected questions, options, answers, explanations and images before saving.</p><div id="hoa85FeedMsg" class="hoa85-status"></div><div class="hoa85-feed-stats"><span>Total <b id="hoa85FeedTotal">0</b></span><span>Valid <b id="hoa85FeedValid">0</b></span><span>Warnings <b id="hoa85FeedWarn">0</b></span><span>Invalid <b id="hoa85FeedInvalid">0</b></span></div></div><section id="hoa85AcceptedPreviewModal" class="hoa85-accepted-preview-section" hidden role="dialog" aria-modal="true" aria-labelledby="hoa85AcceptedPreviewTitle"><div class="hoa85-accepted-preview-dialog"><header class="hoa85-accepted-preview-head"><div class="hoa85-preview-head-copy"><div class="hoa85-preview-kicker"><span class="hoa85-preview-kicker-dot"></span> QUESTION FEEDING <span class="hoa85-preview-kicker-sep">/</span> REVIEW</div><h2 id="hoa85AcceptedPreviewTitle">Preview Questions</h2><p id="hoa85AcceptedPreviewSummary">Review accepted, warning and rejected questions. Edit any question inside this popup.</p><div class="hoa85-preview-counts" role="group" aria-label="Question validation counts"><div class="hoa85-preview-count total"><span>Total</span><b id="hoa85PreviewTotalCount">0</b></div><div class="hoa85-preview-count accepted"><span>Accepted</span><b id="hoa85PreviewAcceptedCount">0</b></div><div class="hoa85-preview-count warning"><span>Warnings</span><b id="hoa85PreviewWarningsCount">0</b></div><div class="hoa85-preview-count rejected"><span>Rejected</span><b id="hoa85PreviewRejectedCount">0</b></div></div></div><button type="button" class="hoa85-btn hoa85-preview-close-top" id="hoa85CloseAcceptedPreviewTop" aria-label="Close questions preview"><span aria-hidden="true">×</span> CLOSE</button></header><div id="hoa85AcceptedPreviewStatus" class="hoa85-status hoa85-preview-live-status" aria-live="polite">Preparing preview…</div><div id="hoa85AcceptedPreviewBody" class="hoa85-accepted-preview-body"></div><footer class="hoa85-accepted-preview-footer"><span><b>Changes are not saved yet.</b> Edits stay in this feed until you choose <strong>SAVE FEED TO TEST</strong>.</span><button type="button" class="hoa85-btn primary" id="hoa85CloseAcceptedPreview">DONE REVIEWING</button></footer></div></section>`;
    // Portal the preview to <body> so transformed/scrollable Admin panels cannot clip or offset the modal.
    const previewPortal=$('hoa85AcceptedPreviewModal');if(previewPortal&&previewPortal.parentElement!==document.body)document.body.appendChild(previewPortal);
    $('hoa85ParseFeed').onclick=parseFeed;$('hoa85SaveFeed').onclick=saveFeedToTest;$('hoa85PreviewAccepted').onclick=openAcceptedQuestionsPreview;$('hoa85CloseAcceptedPreviewTop').onclick=closeAcceptedQuestionsPreview;$('hoa85CloseAcceptedPreview').onclick=closeAcceptedQuestionsPreview;$('hoa85AcceptedPreviewModal').addEventListener('click',e=>{if(e.target===$('hoa85AcceptedPreviewModal'))closeAcceptedQuestionsPreview();});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('hoa85AcceptedPreviewModal')?.hidden)closeAcceptedQuestionsPreview();});$('hoa85ClearPasteInput').onclick=clearPasteInput;$('hoa85FeedFullscreen').onclick=toggleFeedFullscreen;document.addEventListener('fullscreenchange',syncFeedFullscreenButton);setupFeedInputEditor();$('hoa85FeedInput').addEventListener('paste',handleFeedInputPaste);$('hoa85FeedInput').addEventListener('keydown',handleFeedInputKeydown);$('hoa85FeedInput').addEventListener('input',handleFeedEditorInput);$('hoa85FeedInput').addEventListener('click',handleFeedInlineImageClick);$('hoa85UploadTxt').onclick=()=>$('hoa85TxtFile').click();$('hoa85UploadCsv').onclick=()=>$('hoa85CsvFile').click();$('hoa85UploadDoc').onclick=()=>$('hoa85DocFile').click();$('hoa85TxtFile').onchange=async e=>loadFeedFile(e.target.files?.[0],false);$('hoa85CsvFile').onchange=async e=>loadFeedFile(e.target.files?.[0],true);$('hoa85DocFile').onchange=async e=>loadDocumentFile(e.target.files?.[0]);$('hoa85FeedTarget').onchange=loadSelectedFeedTest;setFeedExistingConfigLocked(false);loadFeedBatches().catch(e=>notify(e.message,'error'));syncFeedAccessFields();
    setFeedExistingConfigLocked(!!$('hoa85FeedTarget').value);['hoa85FeedBatch','hoa85FeedTestType'].forEach(id=>$(id)?.addEventListener('change',loadFeedFolders));$('hoa85FeedAccess')?.addEventListener('change',syncFeedAccessFields);$('hoa85FeedTarget')?.addEventListener('change',syncFeedAccessFields);updatePastedImageStatus();
  }

  function buildBank(){
    $('hoa85BankPage').innerHTML=`<div class="hoa85-card"><div class="hoa85-card-head"><div><h3>Reuse Question Bank</h3><p>Central reusable question pool: search, sort, edit, delete, select questions from existing tests, and build a new test from any combination.</p></div><div class="hoa85-actions"><button class="hoa85-btn" id="hoa85BankRefresh">↻ Refresh</button><button class="hoa85-btn primary" id="hoa85BankNewTest">CREATE MOCK TEST FROM SELECTED</button></div></div><div class="hoa85-toolbar multi"><input id="hoa85BankSearch" placeholder="Search question / option / source / explanation"><select id="hoa85BankType"><option value="">All types</option><option value="mcq">MCQ</option><option value="numerical">Numerical</option></select><select id="hoa85BankTestFilter"><option value="">All source tests</option></select><select id="hoa85BankSort"><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="question">Question A–Z</option><option value="order">Question Order</option></select><button class="hoa85-btn" id="hoa85BankSelectAll">Select Page</button><button class="hoa85-btn" id="hoa85BankClear">Clear Selection</button></div><div class="hoa85-bank-summary"><span id="hoa85BankCount">0 questions</span><span id="hoa85BankSelected">0 selected</span><span>Page <b id="hoa85BankPageNo">1</b></span></div><div id="hoa85BankList" class="hoa85-list scrollable"></div><div class="hoa85-pagination"><button class="hoa85-btn" id="hoa85BankPrev">← Previous</button><button class="hoa85-btn" id="hoa85BankNext">Next →</button></div><div id="hoa85BankMsg" class="hoa85-status"></div></div><div class="hoa85-card"><div class="hoa85-card-head"><div><h3>Question Editor</h3><p>Edit the selected bank question with its full rich structure. Changes are persisted to the existing question record.</p></div><span id="hoa85QEditChip" class="hoa85-chip">NO QUESTION</span></div><div id="hoa85QuestionEditor" class="hoa85-question-editor hidden"></div></div>`;
    let bankReloadTimer=null;const queueBankReload=()=>{clearTimeout(bankReloadTimer);state.bankPage=1;bankReloadTimer=setTimeout(()=>fetchQuestionBank().then(renderBank).catch(e=>notify(e.message||'Question Bank could not be loaded.','error')),250)};['hoa85BankSearch','hoa85BankType','hoa85BankTestFilter','hoa85BankSort'].forEach(id=>{$(id).addEventListener('input',queueBankReload);$(id).addEventListener('change',queueBankReload)});$('hoa85BankRefresh').onclick=()=>loadAll();$('hoa85BankSelectAll').onclick=selectPageBank;$('hoa85BankClear').onclick=()=>{state.bankSelected.clear();state.bankSelectedData.clear();renderBank();};$('hoa85BankPrev').onclick=()=>{if(state.bankPage>1){state.bankPage--;fetchQuestionBank().then(renderBank).catch(e=>notify(e.message||'Question Bank could not be loaded.','error'))}};$('hoa85BankNext').onclick=()=>{const pages=Math.max(1,Math.ceil((state.bankTotal||0)/state.bankPageSize));if(state.bankPage<pages){state.bankPage++;fetchQuestionBank().then(renderBank).catch(e=>notify(e.message||'Question Bank could not be loaded.','error'))}};$('hoa85BankNewTest').onclick=()=>{const qs=[...state.bankSelected].map(k=>state.bankSelectedData.get(k)).filter(Boolean).map(bankToMeta);if(!qs.length){notify('Select one or more questions first.','error');return;}startNewTest(qs,{...(state.builderDefaults||{}),access:state.builderDefaults?.access||'paid'});openTab('tests');renderEditorQuestionSummary();};
  }

  let loadSeq=0,loadPromise=null;
  async function loadAll(opts={bank:true}){
    if(!state.mounted||!isAdmin())return;
    if(loadPromise)return loadPromise;
    const seq=++loadSeq;
    loadPromise=(async()=>{
      try{
        const c=db();if(!c)throw new Error('Supabase is not ready.');
        const [batches,tests,folders]=await Promise.all([fetchBatches(),fetchTests(),(async()=>{const r=await c.from('test_batch_folders').select('id,test_batch_id,name,folder_type,sort_order,is_active,created_at,updated_at').order('folder_type').order('sort_order').order('name');if(r.error)throw r.error;return r.data||[];})()]);
        if(seq!==loadSeq)return;
        state.batches=batches;state.tests=tests;state.folders=folders;
        if(opts.bank!==false)await fetchQuestionBank();
        if(seq!==loadSeq)return;
        updateBatchSelectors();renderDashboardData();renderBatchData();renderTestData();renderFeedTarget();if(opts.bank!==false)renderBank();
      }catch(e){if(seq===loadSeq){console.error('[HOA V8.73 Mock]',e);notify(e.message||'Could not load Mock Test data.','error')}}
      finally{loadPromise=null;}
    })();
    return loadPromise;
  }
  function updateBatchSelectors(){const ids=['hoa85TestBatch','hoa85TestBatchSelect'];ids.forEach(id=>{const s=$(id);if(!s)return;const cur=s.value;s.innerHTML='<option value="">'+(id==='hoa85TestBatch'?'All batches':'No Batch')+'</option>'+state.batches.map(b=>`<option value="${esc(b.id)}">${esc(b.name)}</option>`).join('');if(cur)s.value=cur;});updateFeedTargets();}
  function updateFeedTargets(){const s=$('hoa85FeedTarget');if(!s)return;const cur=s.value;const rows=state.creationContext==='freecontent'?[]:state.tests.filter(t=>t.access_type==='paid');s.innerHTML='<option value="">New Test</option>'+rows.map(t=>`<option value="${esc(t.id)}">${esc(t.title)}${t.is_published?' · PUBLISHED':' · DRAFT'}</option>`).join('');if(cur&&rows.some(t=>String(t.id)===String(cur)))s.value=cur;else s.value='';}
  function setFeedExistingConfigLocked(locked){['hoa85FeedAccess','hoa85FeedTestType','hoa85FeedBatch','hoa85FeedFolder','hoa85FeedPublished'].forEach(id=>{if($(id))$(id).disabled=!!locked;});if($('hoa85FeedSaveMode'))$('hoa85FeedSaveMode').disabled=!locked;}
  async function loadFeedBatches(){const s=$('hoa85FeedBatch');if(!s)return;const c=db();if(!c)return;const r=await c.from('test_batches').select('id,name,batch_code,is_published').order('name');if(r.error)throw r.error;const cur=s.value;s.innerHTML='<option value="">Select Batch</option>'+(r.data||[]).map(b=>`<option value="${esc(b.id)}">${esc(b.name)}${b.batch_code?' · '+esc(b.batch_code):''}${b.is_published?'':' [DRAFT]'}</option>`).join('');if(cur)s.value=cur;await loadFeedFolders();}
  async function loadFeedFolders(){const s=$('hoa85FeedFolder');const b=$('hoa85FeedBatch')?.value;const type=$('hoa85FeedTestType')?.value||'subject';if(!s)return;if(!b){s.innerHTML='<option value="">Select Folder</option>';return;}const c=db();if(!c)return;const r=await c.from('test_batch_folders').select('id,name,folder_type,is_active').eq('test_batch_id',b).eq('folder_type',type).eq('is_active',true).order('name');if(r.error)throw r.error;const cur=s.value;s.innerHTML='<option value="">Select Folder</option>'+(r.data||[]).map(f=>`<option value="${esc(f.id)}">${esc(f.name)}</option>`).join('');if(cur)s.value=cur;}
  function loadFeedTestConfig(t){if(!t)return;const set=(id,v)=>{if($(id)!=null)$(id).value=v??''};set('hoa85FeedTitle',t.title);set('hoa85FeedDesc',t.description||'');set('hoa85FeedDuration',t.duration_minutes||10);set('hoa85FeedMarks',t.marks_per_question||1);set('hoa85FeedNegative',t.negative_marking||0);set('hoa85FeedAccess',t.access_type||'paid');set('hoa85FeedTestType',t.test_type||'subject');if($('hoa85FeedPublished'))$('hoa85FeedPublished').checked=!!t.is_published;if($('hoa85FeedShowResults'))$('hoa85FeedShowResults').checked=t.show_result_details!==false&&t.allow_review!==false;set('hoa85FeedBatch',t.test_batch_id||'');loadFeedFolders().then(()=>set('hoa85FeedFolder',t.test_batch_folder_id||''));}
  function renderDashboardData(){if(!$('hoa85StatBatches'))return;$('hoa85StatBatches').textContent=state.batches.length;$('hoa85StatFolders').textContent=state.batches.reduce((n,b)=>n+(state.folders.filter(f=>String(f.test_batch_id)===String(b.id)).length||0),0);$('hoa85StatTests').textContent=state.tests.length;$('hoa85StatQuestions').textContent=state.bank.length;const latest=[...state.tests].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).slice(0,8);$('hoa85DashLatest').innerHTML=latest.length?latest.map(t=>`<article class="hoa85-row"><div><b>${esc(t.title)}</b><small>${esc(testBatchName(t.test_batch_id))} · ${esc(t.question_count)} questions · ${esc(t.duration_minutes)} min</small></div><div class="hoa85-actions"><span class="hoa85-badge ${t.is_published?'ok':'draft'}">${t.is_published?'PUBLISHED':'DRAFT'}</span><button class="hoa85-btn small" data-dash-edit="${esc(t.id)}">EDIT</button></div></article>`).join(''):'<div class="hoa85-empty">No mock tests found.</div>';document.querySelectorAll('[data-dash-edit]').forEach(b=>b.onclick=()=>editTest(b.dataset.dashEdit));}

  function renderBatchData(){if(!$('hoa85BatchList'))return;let rows=[...state.batches];const s=($('hoa85BatchSearch')?.value||'').trim().toLowerCase();if(s)rows=rows.filter(x=>(x.name+' '+(x.batch_code||'')).toLowerCase().includes(s));const sort=$('hoa85BatchSort')?.value||'order';if(sort==='name')rows.sort((a,b)=>String(a.name).localeCompare(String(b.name)));if(sort==='newest')rows.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));if(sort==='oldest')rows.sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));$('hoa85BatchList').innerHTML=rows.length?rows.map(b=>`<article class="hoa85-row"><div><div><b>${esc(b.name)}</b> <span class="hoa85-badge ${b.status==='published'?'ok':b.status==='archived'?'arch':'draft'}">${esc(String(b.status||'draft').toUpperCase())}</span></div><small>${b.batch_code?esc(b.batch_code)+' · ':''}${esc(b.description||'No description')} · Order ${esc(b.sort_order??0)}</small></div><div class="hoa85-actions"><button class="hoa85-btn small" data-bedit="${esc(b.id)}">EDIT</button><button class="hoa85-btn small" data-bfolders="${esc(b.id)}">FOLDERS</button>${b.status==='archived'?`<button class="hoa85-btn small" data-brestore="${esc(b.id)}">RESTORE</button>`:`<button class="hoa85-btn small" data-barchive="${esc(b.id)}">ARCHIVE</button>`}<button class="hoa85-btn small danger" data-bdelete="${esc(b.id)}">DELETE</button></div></article>`).join(''):'<div class="hoa85-empty">No Mock Test batches found.</div>';document.querySelectorAll('[data-bedit]').forEach(b=>b.onclick=()=>selectBatch(b.dataset.bedit));document.querySelectorAll('[data-bfolders]').forEach(b=>b.onclick=()=>{selectBatch(b.dataset.bfolders);setTimeout(()=>{document.getElementById('hoa85FolderList')?.scrollIntoView({behavior:'smooth',block:'nearest'});},50)});document.querySelectorAll('[data-barchive]').forEach(b=>b.onclick=()=>setBatchStatus(b.dataset.barchive,'archived'));document.querySelectorAll('[data-brestore]').forEach(b=>b.onclick=()=>setBatchStatus(b.dataset.brestore,'draft'));document.querySelectorAll('[data-bdelete]').forEach(b=>b.onclick=()=>deleteBatch(b.dataset.bdelete));}
  async function selectBatch(id){const b=state.batches.find(x=>String(x.id)===String(id));if(!b)return;state.batchEditId=b.id;$('hoa85BatchEditorTitle').textContent='Edit Mock Test Batch';$('hoa85BatchChip').textContent='EDITING';$('hoa85BatchName').value=b.name||'';$('hoa85BatchCode').value=b.batch_code||'';$('hoa85BatchDesc').value=b.description||'';$('hoa85BatchStatus').value=b.status||'draft';$('hoa85BatchOrder').value=String(b.sort_order??0);await fetchFolders(id);renderFolders();renderTestData();updateFeedTargets();loadEditorFolders($('hoa85TestBatchSelect')?.value||'');}
  function clearBatchEditor(){state.batchEditId=null;$('hoa85BatchEditorTitle').textContent='Create Mock Test Batch';$('hoa85BatchChip').textContent='NEW';$('hoa85BatchName').value='';$('hoa85BatchCode').value='';$('hoa85BatchDesc').value='';$('hoa85BatchStatus').value='draft';$('hoa85BatchOrder').value='0';state.selectedBatchFolders=[];$('hoa85FolderChip').textContent='SELECT BATCH';$('hoa85FolderList').innerHTML='<div class="hoa85-empty">Select a batch to manage folders.</div>';clearFolderEditor();renderTestData();updateFeedTargets();loadEditorFolders('');}
  async function saveBatch(){try{const user=await requireAdmin('tests.manage');const name=String($('hoa85BatchName').value||'').trim();if(!name){status('hoa85BatchMsg','Batch name is required.','error');return;}const c=db();const payload={name,batch_code:String($('hoa85BatchCode').value||'').trim()||null,description:String($('hoa85BatchDesc').value||'').trim()||null,status:$('hoa85BatchStatus').value,is_published:$('hoa85BatchStatus').value==='published',sort_order:Math.max(0,Number($('hoa85BatchOrder').value)||0),updated_at:new Date().toISOString()};let r;if(state.batchEditId)r=await c.from('test_batches').update(payload).eq('id',state.batchEditId);else r=await c.from('test_batches').insert({...payload,created_by:user.id}).select().single();if(r.error)throw r.error;state.batchEditId=r.data?.id||state.batchEditId;status('hoa85BatchMsg',state.batchEditId?'Batch saved successfully.':'Batch created successfully.','ok');await loadAll({bank:false});if(state.batchEditId)await selectBatch(state.batchEditId);}catch(e){status('hoa85BatchMsg',e.message,'error')}}
  async function setBatchStatus(id,s){try{await requireAdmin('tests.manage');if(s==='archived'&&!confirm('Archive this batch? It will no longer be published.'))return;const r=await db().from('test_batches').update({status:s,is_published:s==='published',updated_at:new Date().toISOString()}).eq('id',id);if(r.error)throw r.error;await loadAll({bank:false});}catch(e){notify(e.message,'error')}}
  async function deleteBatch(id){try{await requireAdmin('tests.manage');const b=state.batches.find(x=>String(x.id)===String(id));if(!b)return;if(!confirm(`Permanently delete batch “${b.name}”? Tests without historical attempts will be removed; shared tests are preserved. This cannot be undone.`))return;const r=await db().rpc('hoa_admin_delete_mock_batch',{p_batch_id:id});if(r.error)throw r.error;notify('Batch deleted successfully.','ok');if(String(state.batchEditId)===String(id))clearBatchEditor();await loadAll({bank:true});renderBank();window.dispatchEvent(new CustomEvent('hoa:mock-data-changed',{detail:{deletedTestId:id}}));}catch(e){notify(formatLifecycleError(e),'error')}}
  function formatLifecycleError(e){const m=e?.message||String(e);if(m.includes('BATCH_HAS_HISTORY:'))return 'This batch contains historical attempts and cannot be permanently deleted. Archive it instead.';if(m.includes('FOLDER_HAS_HISTORY:'))return 'This folder contains historical attempts and cannot be permanently deleted. Archive it instead.';if(m.includes('TEST_HAS_HISTORY:'))return 'This test has historical attempts and cannot be permanently deleted by a delegated Admin.';if(m.includes('TEST_HAS_BATCH_ASSIGNMENTS:'))return 'This test is assigned to one or more batches and cannot be permanently deleted by a delegated Admin.';if(m.includes('OWNER_REQUIRED'))return 'Owner authorization is required for force deletion.';return m;}

  function renderFolders(){const list=$('hoa85FolderList');if(!list)return;if(!state.batchEditId){$('hoa85FolderChip').textContent='SELECT BATCH';list.innerHTML='<div class="hoa85-empty">Select a batch to manage folders.</div>';return}$('hoa85FolderChip').textContent=testBatchName(state.batchEditId);list.innerHTML=state.selectedBatchFolders.length?state.selectedBatchFolders.map(f=>`<article class="hoa85-row"><div><b>📁 ${esc(f.name)}</b> <span class="hoa85-badge">${f.folder_type==='full_length'?'FULL-LENGTH':'SUBJECT-WISE'}</span> ${!f.is_active?'<span class="hoa85-badge arch">ARCHIVED</span>':''}<small>Order ${esc(f.sort_order??0)}</small></div><div class="hoa85-actions">${f.is_active?`<button class="hoa85-btn small primary" data-fnewtest="${esc(f.id)}">＋ CREATE TEST HERE</button><button class="hoa85-btn small" data-fbank="${esc(f.id)}">❓ BUILD FROM BANK</button><button class="hoa85-btn small" data-ffeed="${esc(f.id)}">⬆ FEED QUESTIONS HERE</button><button class="hoa85-btn small" data-fedit="${esc(f.id)}">EDIT</button><button class="hoa85-btn small" data-farchive="${esc(f.id)}">ARCHIVE</button>`:`<button class="hoa85-btn small" data-frestore="${esc(f.id)}">RESTORE</button>`}<button class="hoa85-btn small danger" data-fdelete="${esc(f.id)}">DELETE</button></div></article>`).join(''):'<div class="hoa85-empty">No folders in this batch.</div>';document.querySelectorAll('[data-fedit]').forEach(b=>b.onclick=()=>editFolder(b.dataset.fedit));document.querySelectorAll('[data-fnewtest]').forEach(b=>b.onclick=()=>{const f=state.selectedBatchFolders.find(x=>String(x.id)===String(b.dataset.fnewtest));if(f){startNewTest([],{access:'paid',batchId:f.test_batch_id,folderId:f.id,type:f.folder_type,returnTo:'batchfolder'});openTab('tests');}});document.querySelectorAll('[data-fbank]').forEach(b=>b.onclick=()=>{const f=state.selectedBatchFolders.find(x=>String(x.id)===String(b.dataset.fbank));if(f){state.builderDefaults={access:'paid',batchId:f.test_batch_id,folderId:f.id,type:f.folder_type,returnTo:'batchfolder'};openTab('bank');}});document.querySelectorAll('[data-ffeed]').forEach(b=>b.onclick=()=>{const f=state.selectedBatchFolders.find(x=>String(x.id)===String(b.dataset.ffeed));if(f){openFeedBuilder({access:'paid',batchId:f.test_batch_id,folderId:f.id,type:f.folder_type});}});document.querySelectorAll('[data-farchive]').forEach(b=>b.onclick=()=>archiveFolder(b.dataset.farchive));document.querySelectorAll('[data-frestore]').forEach(b=>b.onclick=()=>restoreFolder(b.dataset.frestore));document.querySelectorAll('[data-fdelete]').forEach(b=>b.onclick=()=>deleteFolder(b.dataset.fdelete));}
  function clearFolderEditor(){state.folderEditId=null;if($('hoa85FolderName'))$('hoa85FolderName').value='';if($('hoa85FolderOrder'))$('hoa85FolderOrder').value='0';if($('hoa85FolderType'))$('hoa85FolderType').value='subject';if($('hoa85SaveFolder'))$('hoa85SaveFolder').textContent='CREATE FOLDER';}
  function editFolder(id){const f=state.selectedBatchFolders.find(x=>String(x.id)===String(id));if(!f)return;state.folderEditId=f.id;$('hoa85FolderName').value=f.name;$('hoa85FolderType').value=f.folder_type;$('hoa85FolderOrder').value=String(f.sort_order??0);$('hoa85SaveFolder').textContent='SAVE FOLDER CHANGES';$('hoa85FolderName').focus();}
  async function saveFolder(){try{const user=await requireAdmin('tests.manage');if(!state.batchEditId){status('hoa85FolderMsg','Select a batch first.','error');return}const name=String($('hoa85FolderName').value||'').trim();if(!name){status('hoa85FolderMsg','Folder name is required.','error');return}const payload={name,folder_type:$('hoa85FolderType').value,sort_order:Math.max(0,Number($('hoa85FolderOrder').value)||0),updated_at:new Date().toISOString()};let r;if(state.folderEditId)r=await db().from('test_batch_folders').update(payload).eq('id',state.folderEditId);else r=await db().from('test_batch_folders').insert({...payload,test_batch_id:state.batchEditId,is_active:true,created_by:user.id}).select().single();if(r.error)throw r.error;status('hoa85FolderMsg',state.folderEditId?'Folder updated successfully.':'Folder created successfully.','ok');clearFolderEditor();await fetchFolders(state.batchEditId);renderFolders();renderTestData();updateFeedTargets();}catch(e){status('hoa85FolderMsg',e.message,'error')}}
  async function archiveFolder(id){try{await requireAdmin('tests.manage');if(!confirm('Archive this folder? Existing tests remain stored.'))return;const r=await db().from('test_batch_folders').update({is_active:false,updated_at:new Date().toISOString()}).eq('id',id);if(r.error)throw r.error;await fetchFolders(state.batchEditId);renderFolders();}catch(e){notify(e.message,'error')}}
  async function restoreFolder(id){try{await requireAdmin('tests.manage');const r=await db().from('test_batch_folders').update({is_active:true,updated_at:new Date().toISOString()}).eq('id',id);if(r.error)throw r.error;await fetchFolders(state.batchEditId);renderFolders();}catch(e){notify(e.message,'error')}}
  async function deleteFolder(id){try{await requireAdmin('tests.manage');const f=state.folders.find(x=>String(x.id)===String(id));if(!f)return;if(!confirm(`Permanently delete folder “${f.name}”? Tests inside it without historical attempts will also be deleted.`))return;const r=await db().rpc('hoa_admin_delete_mock_folder',{p_folder_id:id});if(r.error)throw r.error;notify('Folder deleted successfully.','ok');clearFolderEditor();await fetchFolders(state.batchEditId);await fetchTests();renderFolders();renderTestData();updateFeedTargets();}catch(e){notify(formatLifecycleError(e),'error')}}

  function renderTestData(){const list=$('hoa85TestList');if(!list)return;const rows=[...state.tests];populateFolderFilter($('hoa85TestBatch')?.value||'');if($('hoa85TestCount'))$('hoa85TestCount').textContent=`${state.testTotal} test${state.testTotal===1?'':'s'}`;if($('hoa85TestPageNo'))$('hoa85TestPageNo').textContent=String(state.testPage);const pages=Math.max(1,Math.ceil((state.testTotal||0)/state.testPageSize));if($('hoa85TestPrev'))$('hoa85TestPrev').disabled=state.testPage<=1;if($('hoa85TestNext'))$('hoa85TestNext').disabled=state.testPage>=pages;list.innerHTML=rows.length?rows.map(t=>`<article class="hoa85-row"><div><div><b>📝 ${esc(t.title)}</b> <span class="hoa85-badge ${t.is_published?'ok':'draft'}">${t.is_published?'PUBLISHED':'DRAFT'}</span> <span class="hoa85-badge">PAID</span></div><small>${esc(t.question_count)} questions · ${esc(t.duration_minutes)} min · ${esc(testBatchName(t.test_batch_id))}${t.test_batch_folder_id?' · '+esc(folderName(t.test_batch_folder_id)):''} · ${esc(t.test_type||'subject')}</small></div><div class="hoa85-actions"><button class="hoa85-btn small" data-tedit="${esc(t.id)}">EDIT</button><button class="hoa85-btn small" data-tassign="${esc(t.id)}">ASSIGN TO BATCH/FOLDER</button><button class="hoa85-btn small" data-tpreview="${esc(t.id)}">PREVIEW</button>${t.is_published?`<button class="hoa85-btn small" data-tshare="${esc(t.id)}">GENERATE STUDENT URL</button>`:'<span class="hoa85-muted" title="Publish this test before generating a student URL">PUBLISH TO SHARE</span>'}<button class="hoa85-btn small" data-tpub="${esc(t.id)}">${t.is_published?'UNPUBLISH':'PUBLISH'}</button><button class="hoa85-btn small danger" data-tdelete="${esc(t.id)}">DELETE</button></div></article>`).join(''):'<div class="hoa85-empty">No Paid Mock Tests match the current filters.</div>';list.querySelectorAll('[data-tedit]').forEach(b=>b.onclick=()=>editTest(b.dataset.tedit));list.querySelectorAll('[data-tassign]').forEach(b=>b.onclick=async()=>{await editTest(b.dataset.tassign);const el=$('hoa85TestBatchSelect');if(el){el.focus();el.scrollIntoView({behavior:'smooth',block:'center'});}});list.querySelectorAll('[data-tpreview]').forEach(b=>b.onclick=()=>previewTest(b.dataset.tpreview));list.querySelectorAll('[data-tshare]').forEach(b=>b.onclick=()=>{const t=state.tests.find(x=>String(x.id)===String(b.dataset.tshare));const open=window.HOA_SHARE_LINKS?.openStudentLinkModal;if(!t||typeof open!=='function'){notify('Student URL generator is not ready. Refresh the Admin page and try again.','error');return;}Promise.resolve(open(t.id,{id:t.id,title:t.title,is_published:!!t.is_published})).catch(e=>notify(e?.message||'Could not open the Student URL generator.','error'));});list.querySelectorAll('[data-tpub]').forEach(b=>b.onclick=()=>toggleTestPublish(b.dataset.tpub));list.querySelectorAll('[data-tdelete]').forEach(b=>b.onclick=()=>deleteTest(b.dataset.tdelete));}
  function populateFolderFilter(batch){const s=$('hoa85TestFolder');if(!s)return;const cur=s.value;const fs=batch?state.folders.filter(f=>String(f.test_batch_id)===String(batch)):state.folders;s.innerHTML='<option value="">All folders</option>'+fs.map(f=>`<option value="${esc(f.id)}">${esc(f.name)}</option>`).join('');if(cur&&fs.some(f=>String(f.id)===String(cur)))s.value=cur;}
  function applyAccessPolicy(){const free=state.creationContext==='freecontent';[['hoa85TestAccessType','paid','free'],['hoa85FeedAccess','paid','free']].forEach(([id,paid,freeValue])=>{const sel=$(id);if(!sel)return;Array.from(sel.options).forEach(o=>{o.hidden=o.value!==(free?freeValue:paid);});sel.value=free?freeValue:paid;sel.disabled=true;});const filter=$('hoa85TestAccess');if(filter)filter.value='paid';const title=$('hoa85TestEditorTitle');if(title&&!state.editingTestId&&$('hoa85TestTitle'))title.textContent=free?'New Free Content Mock Test':'New Paid Mock Test';const root=$('hoaV89MockWorkspace');if(root){root.querySelectorAll('.hoa85-tab').forEach(tab=>{tab.hidden=free&&!['tests','feed'].includes(tab.dataset.tab);});['dashboard','batches','bank'].forEach(name=>{const page=root.querySelector(`[data-page="${name}"]`);if(page)page.hidden=free;});const lib=$('hoa85TestList')?.closest('.hoa85-card');if(lib)lib.hidden=free;if(free&&state.tab&&!['tests','feed'].includes(state.tab))state.tab='tests';}}function syncEditorAccessFields(){const access=state.creationContext==='freecontent'?'free':'paid';const free=access==='free';const b=$('hoa85TestBatchSelect'),f=$('hoa85TestFolderSelect');if($('hoa85TestAccessType'))$('hoa85TestAccessType').value=access;if(b){b.disabled=free;if(free)b.value='';}if(f){f.disabled=free;if(free)f.value='';}}
  function startNewTest(qs,opts={}){state.editingTestId=null;state.creationContext=opts.returnTo==='freecontent'||state.creationContext==='freecontent'?'freecontent':null;const intendedAccess=state.creationContext==='freecontent'?'free':'paid';state.builderDefaults={...opts,access:intendedAccess,returnTo:state.creationContext};state.currentQuestions=(qs||[]).map(normaliseQuestion);clearFeed();state.feedPage=1;$('hoa85TestEditorCard').classList.remove('hidden');$('hoa85TestEditorTitle').textContent=state.creationContext==='freecontent'?'New Free Content Mock Test':'New Paid Mock Test';$('hoa85EditingChip').textContent='NEW';$('hoa85TestTitle').value='';$('hoa85TestDesc').value='';$('hoa85TestDuration').value='10';$('hoa85TestMarks').value='1';$('hoa85TestNegative').value='.25';$('hoa85TestAccessType').value=intendedAccess;$('hoa85TestType').value=opts.type||'subject';$('hoa85TestPublished').checked=false;$('hoa85TestShowResults').checked=opts.showResultDetails!==false&&opts.allowReview!==false;$('hoa85TestBatchSelect').value=state.creationContext==='freecontent'?'':(opts.batchId||'');loadEditorFolders(state.creationContext==='freecontent'?'':(opts.batchId||''));$('hoa85TestFolderSelect').value=state.creationContext==='freecontent'?'':(opts.folderId||'');applyAccessPolicy();syncEditorAccessFields();renderEditorQuestionSummary();}
  async function editTest(id){if(state.creationContext==='freecontent'){notify('Paid Mock Tests cannot be edited from the Free Content workflow. Use Add Existing Mock Test to share one.','error');return;}const t=state.tests.find(x=>String(x.id)===String(id));if(!t)return;try{const qs=await fetchTestQuestions(id);state.editingTestId=id;state.builderDefaults=null;state.currentQuestions=qs;$('hoa85TestEditorCard').classList.remove('hidden');$('hoa85TestEditorTitle').textContent='Edit Paid Mock Test';$('hoa85EditingChip').textContent='EDITING';$('hoa85TestTitle').value=t.title||'';$('hoa85TestDesc').value=t.description||'';$('hoa85TestDuration').value=t.duration_minutes||10;$('hoa85TestMarks').value=t.marks_per_question||1;$('hoa85TestNegative').value=t.negative_marking||0;$('hoa85TestAccessType').value='paid';$('hoa85TestType').value=t.test_type||'subject';$('hoa85TestPublished').checked=!!t.is_published;$('hoa85TestShowResults').checked=t.show_result_details!==false&&t.allow_review!==false;$('hoa85TestBatchSelect').value=t.test_batch_id||'';await loadEditorFolders(t.test_batch_id);$('hoa85TestFolderSelect').value=t.test_batch_folder_id||'';applyAccessPolicy();syncEditorAccessFields();renderEditorQuestionSummary();openTab('tests');$('hoa85TestEditorCard').scrollIntoView({behavior:'smooth',block:'start'});}catch(e){notify(e.message,'error')}}
  async function fetchTestQuestions(id){const c=db();const [r,l]=await Promise.all([c.from('questions').select('id,test_id,question_text,option_1,option_2,option_3,option_4,correct_option,explanation,question_order,question_type,source,options_json,question_image_path,explanation_text,explanation_image_path,correct_value,tolerance').eq('test_id',id).order('question_order'),c.from('test_question_bank_links').select('question_id,question_bank_id,question_order').eq('test_id',id).order('question_order')]);if(r.error)throw r.error;if(l.error)throw l.error;const byQ=new Map((l.data||[]).map(x=>[String(x.question_id),x.question_bank_id]));return (r.data||[]).map(q=>bankToMeta({...q,question_bank_id:byQ.get(String(q.id))||null}));}
  function bankToMeta(r){return {id:r.id||null,question_bank_id:r.question_bank_id||null,question_type:r.question_type||'mcq',question_text:r.question_text||'',source:r.source||'',source_test_title:r.source_test_title||'',question_image_path:r.question_image_path||null,options:Array.isArray(r.options_json)&&r.options_json.length?r.options_json.map(o=>({text:o?.text||'',image:o?.image||null})):r.question_type==='numerical'?[]:[r.option_1,r.option_2,r.option_3,r.option_4].map(x=>({text:x||'',image:null})),correct_answer:r.correct_option||0,correct_value:r.correct_value??null,tolerance:r.tolerance??null,explanation_text:r.explanation_text??r.explanation??'',explanation_image_path:r.explanation_image_path||null};}
  function loadEditorFolders(batch){const s=$('hoa85TestFolderSelect');if(!s)return;const fs=state.batches.length&&batch?state.folders.filter(f=>String(f.test_batch_id)===String(batch)):[];s.innerHTML='<option value="">No Folder</option>'+fs.map(f=>`<option value="${esc(f.id)}">${esc(f.name)}</option>`).join('');}
  function renderEditorQuestionSummary(){const e=$('hoa85TestQuestionSummary');if(!e)return;e.innerHTML=state.currentQuestions.length?`<b>${state.currentQuestions.length} questions loaded.</b> Manage them in <button type="button" class="hoa85-link" id="hoa85EditQuestionsLink">Question Feeding</button> or select more from the Question Bank.`:'No questions loaded. Use Question Feeding or Question Bank.';const b=$('hoa85EditQuestionsLink');if(b)b.onclick=()=>{openTab('feed');renderFeedEditor();}}
  function normaliseQuestion(q){const out={id:q.id||null,question_bank_id:q.question_bank_id||q.bank_id||null,question_type:q.question_type==='numerical'?'numerical':'mcq',question_text:String(q.question_text||''),source:String(q.source||''),question_image_path:q.question_image_path||null,options:Array.isArray(q.options)?q.options.map(o=>({text:String(o?.text||''),image:o?.image||null,_file:o?._file||null})):[],correct_answer:Number(q.correct_answer)||0,correct_value:q.correct_value===null||q.correct_value===''||q.correct_value===undefined?null:Number(q.correct_value),tolerance:q.tolerance===null||q.tolerance===''||q.tolerance===undefined?null:Number(q.tolerance),explanation_text:String(q.explanation_text||''),explanation_image_path:q.explanation_image_path||null};return out;}
  async function saveEditorTest(){
    if(state.savingTest)return;
    state.savingTest=true;
    const btn=$('hoa85SaveTest'); if(btn)btn.disabled=true;
    try{await requireAdmin('tests.manage');const title=String($('hoa85TestTitle').value||'').trim();if(!title){notify('Test title is required.','error');return}if(!state.currentQuestions.length){notify('Add at least one question before saving the test.','error');return}const access=state.creationContext==='freecontent'?'free':'paid';const batch=access==='free'?null:($('hoa85TestBatchSelect').value||null);const folder=access==='free'?null:($('hoa85TestFolderSelect').value||null);const type=$('hoa85TestType').value||'subject';const published=$('hoa85TestPublished').checked; if(published&&access==='paid'&&(!batch||!folder)){notify('A published Paid Mock Test requires a Batch and Folder. Save it as Draft first if you want to assign it later.','error');return}syncCurrentQuestionsFromFeed();const payload=state.currentQuestions.map((q,i)=>normaliseQuestion(q));const res=await db().rpc('save_test_bundle_v5',{p_test_id:state.editingTestId||null,p_title:title,p_description:String($('hoa85TestDesc').value||'').trim()||null,p_duration_minutes:Math.max(1,Number($('hoa85TestDuration').value)||10),p_marks_per_question:Number($('hoa85TestMarks').value)||1,p_negative_marking:Number($('hoa85TestNegative').value)||0,p_is_published:$('hoa85TestPublished').checked,p_access_type:access,p_test_batch_id:batch,p_test_batch_folder_id:folder,p_test_type:type,p_allow_review:$('hoa85TestShowResults')?.checked!==false,p_questions:payload});if(res.error)throw res.error;const tid=res.data;const returnToFree=state.creationContext==='freecontent'&&access==='free';const vr=await db().rpc('hoa_admin_update_test_result_visibility',{p_test_id:tid,p_show_result_details:$('hoa85TestShowResults').checked});if(vr.error)throw vr.error;if(returnToFree){const fr=await db().rpc('hoa_admin_publish_test_to_free_content',{p_test_id:tid});if(fr.error)throw fr.error;}state.editingTestId=tid;notify(returnToFree?'Free Content Mock Test saved. Return to Free Content to publish it or create a sharing link.':'Paid Mock Test saved successfully.','ok');await loadAll();if(returnToFree){if(window.__HOA_ADMIN_RUNTIME_V89_API__?.router)await window.__HOA_ADMIN_RUNTIME_V89_API__.router('freecontent');}else await editTest(tid);window.dispatchEvent(new CustomEvent('hoa:mock-data-changed',{detail:{testId:tid,freeContent:returnToFree}}));}catch(e){notify(e.message||'Could not save test.','error')}}
  async function toggleTestPublish(id){try{await requireAdmin('tests.manage');const t=state.tests.find(x=>String(x.id)===String(id));if(!t)return;const next=!t.is_published;if(next&&t.access_type==='paid'&&(!t.test_batch_id||!t.test_batch_folder_id))throw new Error('A Paid Mock Test must be assigned to a Batch and Folder before it can be published.');const r=await db().from('tests').update({is_published:next,updated_at:new Date().toISOString()}).eq('id',id);if(r.error)throw r.error;await loadAll({bank:false});window.dispatchEvent(new CustomEvent('hoa:mock-data-changed',{detail:{testId:id}}));}catch(e){notify(e.message,'error')}}
  async function deleteTest(id){try{await requireAdmin('tests.manage');const t=state.tests.find(x=>String(x.id)===String(id));if(!t)return;const owner=window.hoaAdminRole==='owner';if(!confirm(owner?`Permanently delete “${t.title}”? If history or assignments exist, you may be offered an Owner force-delete that removes the test, attempts, answers, assignments, Free Content links and related question records. This cannot be undone.`:`Permanently delete “${t.title}”? Historical attempts or batch assignments may block permanent deletion.`))return;let r=await db().rpc('hoa_admin_delete_mock_test',{p_test_id:id});if(r.error){const m=r.error?.message||'';const blocked=m.includes('TEST_HAS_HISTORY:')||m.includes('TEST_HAS_BATCH_ASSIGNMENTS:');if(owner&&blocked){if(!confirm(`OWNER FORCE DELETE\n\n“${t.title}” has linked history/assignments. This will permanently remove those records and associated test data. This cannot be undone.\n\nContinue?`))return;r=await db().rpc('hoa_admin_force_delete_mock_test',{p_test_id:id});if(r.error)throw r.error;const paths=Array.isArray(r.data?.storage_paths)?r.data.storage_paths.filter(Boolean):[];if(paths.length&&db()?.storage){const sr=await db().storage.from(BUCKET).remove(paths);if(sr.error)notify('Test deleted, but some question-media files could not be removed from Storage.','warn');}notify('Mock Test force-deleted successfully.','ok');}else{throw r.error;}}else{notify('Mock Test deleted successfully.','ok');}if(String(state.editingTestId)===String(id)){$('hoa85TestEditorCard').classList.add('hidden');state.editingTestId=null;state.currentQuestions=[];}await loadAll({bank:true});renderBank();window.dispatchEvent(new CustomEvent('hoa:mock-data-changed',{detail:{deletedTestId:id}}));}catch(e){notify(formatLifecycleError(e),'error')}}
  function previewTest(id){if(typeof window.hoaV70PreviewPaidMockTest==='function'){window.hoaV70PreviewPaidMockTest(id);return;}notify('Admin Mock Test preview module is unavailable. Refresh the Admin page and try again.','error')}

  async function parseFeed(){
    try{
      const input=$('hoa85FeedInput').value||'';
      if(!String(input).trim()){status('hoa85FeedMsg','Paste or upload question data first.','error');return;}
      if(typeof window.HOAPureQuestionParser?.parse!=='function')throw new Error('Question parser is not ready.');
      const mode=$('hoa85FeedMode').value||'auto';
      const parsed=window.HOAPureQuestionParser.parse(input,mode);
      const unmatched=applyPastedImagesToFeed(parsed,input)||[];
      state.feed=parsed.map((q,i)=>window.HOAPureQuestionParser.validate(q,i));
      state.feed.forEach((q,i)=>{if(q._missingPastedImageMarker){q.warnings=q.warnings||[];q.warnings.push(`Question ${i+1}: An image placeholder was present but no clipboard image file was attached. Use EDIT QUESTION to upload or paste the actual image.`);q.status=q.errors?.length?'invalid':'warning';}});
      state.feedPage=1;
      state.pasteImagesParsed=state.feedPasteImages.size>0&&unmatched.length===0;
      closeAcceptedQuestionsPreview();
      syncCurrentQuestionsFromFeed();
      try{renderFeedPreview();}catch(renderErr){console.error('[HOA V8.90 Preview]',renderErr);status('hoa85FeedMsg',`Parsed ${state.feed.length} question(s), but editor rendering failed: ${renderErr.message||renderErr}`,'error');return;}
      if(unmatched.length){
        status('hoa85FeedMsg',`${state.feed.length} question(s) parsed, but ${unmatched.length} pasted image(s) could not be matched. Keep their preview visible, correct each marker position and parse again.`,'warn');
      }else{
        status('hoa85FeedMsg',`Parsed ${state.feed.length} question(s). Use PREVIEW QUESTIONS (ACCEPTED + REJECTED) to review every parsed question, correct issues, and edit question text, options, answers, explanations and images in the same preview.`,'ok');
      }
      updatePastedImageStatus();
    }catch(e){state.feed=[];closeAcceptedQuestionsPreview();if($('hoa85AcceptedPreviewBody'))$('hoa85AcceptedPreviewBody').innerHTML='';renderFeedPreview();status('hoa85FeedMsg',e.message||'Could not parse questions.','error');}
  }
  async function loadFeedFile(file,isCsv){if(!file)return;try{state.feedPasteImages.clear();state.pasteImageCounter=0;state.pasteImagesParsed=false;$('hoa85FeedInput').value=await file.text();updatePastedImageStatus();$('hoa85FeedMsg').textContent=(isCsv?'CSV':'TXT')+' loaded. Click PARSE QUESTIONS.';}catch(e){status('hoa85FeedMsg',e.message,'error')}finally{const f=isCsv?$('hoa85CsvFile'):$('hoa85TxtFile');if(f)f.value='';}}
  let hoaWordReaderPromises={};
  async function loadWordMarkdown(file){const key=String(file.name||'').toLowerCase().endsWith('.docx')?'docx':'doc';if(!hoaWordReaderPromises[key])hoaWordReaderPromises[key]=import(key==='docx'?'https://esm.sh/@mdgate/docx@0.6.25?bundle':'https://esm.sh/@mdgate/doc@0.6.25?bundle');const mod=await hoaWordReaderPromises[key];if(typeof mod.toMarkdown!=='function')throw new Error('The Word document parser did not load correctly.');return String(await mod.toMarkdown(new Uint8Array(await file.arrayBuffer()))||'');}
  async function loadDocumentFile(file){if(!file)return;try{const name=String(file.name||'');if(!/\.(?:doc|docx)$/i.test(name))throw new Error('Please select a .doc or .docx file.');status('hoa85FeedMsg','Reading '+name+' locally…','ok');state.feedPasteImages.clear();state.pasteImageCounter=0;state.pasteImagesParsed=false;$('hoa85FeedInput').value=await loadWordMarkdown(file);updatePastedImageStatus();status('hoa85FeedMsg',name+' loaded. Click PARSE QUESTIONS.','ok');}catch(e){status('hoa85FeedMsg',e.message||'Could not read the Word document.','error')}finally{const f=$('hoa85DocFile');if(f)f.value='';}}
  function syncFeedPreviewActions(){
    const btn=$('hoa85PreviewAccepted');
    if(btn)btn.disabled=state.feed.length===0;
  }
  function closeAcceptedQuestionsPreview(){
    const modal=$('hoa85AcceptedPreviewModal');
    if(modal){modal.hidden=true;modal.style.display='';}
    if(state.previewPreviousBodyOverflow!==null){
      document.body.style.overflow=state.previewPreviousBodyOverflow;
      state.previewPreviousBodyOverflow=null;
    }
    state.previewEditing.clear();
    state.acceptedPreviewRenderId++;
    $('hoa85PreviewAccepted')?.focus({preventScroll:true});
  }
  async function acceptedPreviewImageSrc(file,path){
    if(file)return feedFilePreviewUrl(file);
    if(!path)return null;
    const raw=String(path);
    if(/^(?:https?:|data:|blob:)/i.test(raw))return raw;
    // Never let a slow storage request block the whole preview from rendering.
    return await Promise.race([
      signedMediaUrl(raw),
      new Promise(resolve=>setTimeout(()=>resolve(null),3000))
    ]);
  }
  async function acceptedPreviewImage(file,path,label){
    if(!file&&!path)return '';
    const src=await acceptedPreviewImageSrc(file,path,label);
    if(!src)return `<div class="hoa85-accepted-image-unavailable">${esc(label)} is attached, but its preview URL could not be loaded. You can replace the image while editing.</div>`;
    return `<figure class="hoa85-accepted-image"><img src="${esc(src)}" alt="${esc(label)}" loading="eager"><figcaption>${esc(label)}</figcaption></figure>`;
  }
  function acceptedPreviewIssues(q){
    const errors=(q.errors||[]).map(e=>`<div>✕ ${esc(e)}</div>`).join('');
    const warnings=(q.warnings||[]).map(e=>`<div>⚠ ${esc(e)}</div>`).join('');
    return `<div class="hoa85-errors" data-review-errors ${errors?'':'hidden'}>${errors}</div><div class="hoa85-warnings" data-review-warnings ${warnings?'':'hidden'}>${warnings}</div>`;
  }
  function acceptedPreviewStatus(q){const st=q.status||'valid';return `<span class="hoa85-badge ${st==='valid'?'ok':st==='warning'?'warn':'err'}" data-review-badge>${esc(st.toUpperCase())}</span>`;}
  async function acceptedPreviewCard(q,i){
    if(state.previewEditing.has(i))return acceptedPreviewEditCard(q,i);
    const st=q.status||'valid';
    const questionImage=await acceptedPreviewImage(q._media?.question,q.question_image_path,'Question image');
    const explanationImage=await acceptedPreviewImage(q._media?.explanation,q.explanation_image_path,'Explanation image');
    const options=q.question_type==='numerical'
      ?`<div class="hoa85-accepted-numerical"><span><b>Correct value</b>${esc(q.correct_value??'—')}</span><span><b>Tolerance</b>${esc(q.tolerance??'—')}</span></div>`
      :(await Promise.all((q.options||[]).map(async(o,n)=>{
        const img=await acceptedPreviewImage(o?._file,o?.image,`Option ${n+1} image`);
        return `<div class="hoa85-accepted-option"><span class="hoa85-accepted-option-number">${n+1}.</span><div class="hoa85-accepted-option-content"><div class="hoa85-accepted-option-text">${esc(o?.text||'—').replace(/\n/g,'<br>')}</div>${img}</div></div>`;
      }))).join('');
    const correct=q.question_type==='numerical'?`<div class="hoa85-accepted-answer"><b>Correct value:</b> ${esc(q.correct_value??'—')} <span class="hoa85-accepted-muted">· Tolerance: ${esc(q.tolerance??'—')}</span></div>`:`<div class="hoa85-accepted-answer"><b>Correct answer:</b> ${esc(q.correct_answer??'—')}</div>`;
    const source=q.source?`<div class="hoa85-accepted-source"><b>Source:</b> ${esc(q.source)}</div>`:'';
    return `<article class="hoa85-accepted-question" data-accepted-index="${i}"><header class="hoa85-accepted-question-head"><b>Question ${i+1}</b>${acceptedPreviewStatus(q)}<span class="hoa85-accepted-type">${esc(String(q.question_type||'mcq').toUpperCase())}</span><button type="button" class="hoa85-btn small primary" data-review-edit="${i}">EDIT QUESTION</button></header><div class="hoa85-accepted-question-body">${source}<div class="hoa85-accepted-question-text">${q.question_text?esc(q.question_text).replace(/\n/g,'<br>'):'<em>[Image-based question / no question text]</em>'}</div>${questionImage}<div class="hoa85-accepted-options-heading">${q.question_type==='numerical'?'Numerical answer':'Options'}</div><div class="hoa85-accepted-options">${options||'<div class="hoa85-accepted-muted">No options</div>'}</div>${correct}<section class="hoa85-accepted-explanation"><h4>Explanation</h4><div>${q.explanation_text?esc(q.explanation_text).replace(/\n/g,'<br>'):'<em>No explanation text provided.</em>'}</div>${explanationImage}</section></div>${acceptedPreviewIssues(q)}</article>`;
  }
  async function acceptedPreviewEditCard(q,i){
    const questionImage=await acceptedPreviewImage(q._media?.question,q.question_image_path,'Question image');
    const explanationImage=await acceptedPreviewImage(q._media?.explanation,q.explanation_image_path,'Explanation image');
    const opts=q.question_type==='numerical'?'':(await Promise.all((q.options||[]).map(async(o,n)=>{
      const image=await acceptedPreviewImage(o?._file,o?.image,`Option ${n+1} image`);
      return `<div class="hoa85-review-option-edit" data-review-option="${n}"><label class="hoa85-review-field">Option ${n+1}<input data-review-field="option_text" data-review-opt-index="${n}" value="${esc(o?.text||'')}" placeholder="Option ${n+1}"></label><div class="hoa85-review-media"><div class="hoa85-media-line"><b>Option ${n+1} Image</b><button type="button" class="hoa85-btn small" data-review-option-upload="${n}">UPLOAD / REPLACE</button><input type="file" accept="image/png,image/jpeg,image/webp,image/gif" class="hidden" data-review-option-file="${n}"><button type="button" class="hoa85-btn small danger" data-review-option-remove="${n}">REMOVE IMAGE</button></div>${image}</div><div class="hoa85-review-option-actions">${(q.options||[]).length>2?`<button type="button" class="hoa85-btn small danger" data-review-option-delete="${n}">REMOVE OPTION</button>`:''}</div></div>`;
    }))).join('');
    const sourceAndQuestion=`<label class="hoa85-review-field">Source / I:<input data-review-field="source" value="${esc(q.source||'')}" placeholder="Question source (optional)"></label><label class="hoa85-review-field">Question Text<textarea data-review-field="question_text" rows="4" placeholder="Question text (or attach a question image)">${esc(q.question_text||'')}</textarea></label>`;
    const questionMedia=`<div class="hoa85-review-media"><div class="hoa85-media-line"><b>Question Image</b><button type="button" class="hoa85-btn small" data-review-question-upload>UPLOAD / REPLACE</button><input type="file" accept="image/png,image/jpeg,image/webp,image/gif" class="hidden" data-review-question-file><button type="button" class="hoa85-btn small danger" data-review-question-remove>REMOVE IMAGE</button></div>${questionImage}</div>`;
    const answerFields=q.question_type==='numerical'
      ?`<div class="hoa85-num-grid"><label>Correct Value<input data-review-field="correct_value" type="number" step="any" value="${esc(q.correct_value??'')}"></label><label>Tolerance<input data-review-field="tolerance" type="number" min="0" step="any" value="${esc(q.tolerance??'')}"></label></div>`
      :`<label class="hoa85-review-field">Correct Answer<input data-review-field="correct_answer" value="${esc(q.correct_answer??'')}" placeholder="Option number or letter (e.g. 2 or B)"></label><div class="hoa85-review-options-heading">Answer Options</div><div class="hoa85-review-options">${opts||'<div class="hoa85-accepted-muted">No options yet. Add options below.</div>'}</div><button type="button" class="hoa85-btn small" data-review-option-add>＋ ADD OPTION</button>`;
    return `<article class="hoa85-accepted-question is-editing" data-accepted-index="${i}"><header class="hoa85-accepted-question-head"><b>Editing Question ${i+1}</b>${acceptedPreviewStatus(q)}<span class="hoa85-accepted-type">${esc(String(q.question_type||'mcq').toUpperCase())}</span><button type="button" class="hoa85-btn small primary" data-review-done="${i}">DONE EDITING</button></header><div class="hoa85-accepted-question-body"><div class="hoa85-review-edit-grid"><label class="hoa85-review-field">Question Type<select data-review-field="question_type"><option value="mcq" ${q.question_type!=='numerical'?'selected':''}>MCQ</option><option value="numerical" ${q.question_type==='numerical'?'selected':''}>Numerical</option></select></label>${sourceAndQuestion}${questionMedia}<div class="hoa85-review-full">${answerFields}</div><label class="hoa85-review-field hoa85-review-full">Explanation<textarea data-review-field="explanation_text" rows="4" placeholder="Explanation (optional)">${esc(q.explanation_text||'')}</textarea></label><div class="hoa85-review-media hoa85-review-full"><div class="hoa85-media-line"><b>Explanation Image</b><button type="button" class="hoa85-btn small" data-review-explanation-upload>UPLOAD / REPLACE</button><input type="file" accept="image/png,image/jpeg,image/webp,image/gif" class="hidden" data-review-explanation-file><button type="button" class="hoa85-btn small danger" data-review-explanation-remove>REMOVE IMAGE</button></div>${explanationImage}</div></div><p class="hoa85-review-hint">Changes are applied to this question locally as you edit. Finish editing to return to the preview. Use SAVE FEED TO TEST to persist the feed.</p></div>${acceptedPreviewIssues(q)}</article>`;
  }
  function updateAcceptedPreviewSummary(){
    const total=state.feed.length,valid=state.feed.filter(q=>q.status==='valid').length,warn=state.feed.filter(q=>q.status==='warning').length,invalid=state.feed.filter(q=>q.status==='invalid').length;
    const summary=$('hoa85AcceptedPreviewSummary');
    if(summary)summary.textContent=`${total} parsed question${total===1?'':'s'} · Review all statuses below. Use EDIT QUESTION on any card to fix text, options, answers or images.`;
    const counts={hoa85PreviewTotalCount:total,hoa85PreviewAcceptedCount:valid,hoa85PreviewWarningsCount:warn,hoa85PreviewRejectedCount:invalid};
    for(const [id,value] of Object.entries(counts)){const el=$(id);if(el)el.textContent=String(value);}
  }
  function renderAcceptedPreviewStatsInCard(card,q){
    if(!card)return;
    const badge=card.querySelector('[data-review-badge]');if(badge){const st=q.status||'valid';badge.className=`hoa85-badge ${st==='valid'?'ok':st==='warning'?'warn':'err'}`;badge.textContent=st.toUpperCase();}
    const errors=card.querySelector('[data-review-errors]');if(errors){errors.innerHTML=(q.errors||[]).map(e=>`<div>✕ ${esc(e)}</div>`).join('');errors.hidden=!(q.errors||[]).length;}
    const warnings=card.querySelector('[data-review-warnings]');if(warnings){warnings.innerHTML=(q.warnings||[]).map(e=>`<div>⚠ ${esc(e)}</div>`).join('');warnings.hidden=!(q.warnings||[]).length;}
    updateAcceptedPreviewSummary();
  }
  async function renderAcceptedQuestionCard(i){
    const modal=$('hoa85AcceptedPreviewModal'),body=$('hoa85AcceptedPreviewBody');const q=state.feed[i];if(!modal||!body||!q)return;
    const token=state.acceptedPreviewRenderId;
    const html=await acceptedPreviewCard(q,i);
    if(modal.hidden||token!==state.acceptedPreviewRenderId)return;
    const old=body.querySelector(`[data-accepted-index="${i}"]`);if(!old)return;
    old.outerHTML=html;
    const card=body.querySelector(`[data-accepted-index="${i}"]`);if(card)bindAcceptedPreviewCard(card,i);
  }
  function applyAcceptedPreviewImage(q,kind,file,i,optIndex){
    if(!file)return;
    if(!validImage(file)){notify('Invalid image. Use PNG/JPG/WEBP/GIF up to 10 MB.','error');return;}
    if(kind==='option'){
      if(!q.options[optIndex])q.options[optIndex]={text:'',image:null,_file:null};
      q.options[optIndex]._file=file;q.options[optIndex].image=null;
    }else{
      q._media=q._media||{};q._media[kind]=file;
      if(kind==='question')q.question_image_path=null;else q.explanation_image_path=null;
    }
    validateFeedQuestion(q,i);syncCurrentQuestionsFromFeed();renderFeedPreview();renderAcceptedQuestionCard(i).catch(e=>console.error('[HOA preview image update]',e));
  }
  function bindAcceptedPreviewCard(card,i){
    const q=state.feed[i];if(!q||!card)return;
    card.querySelector('[data-review-edit]')?.addEventListener('click',()=>{state.previewEditing.add(i);renderAcceptedQuestionCard(i).catch(e=>console.error('[HOA preview edit]',e));});
    card.querySelector('[data-review-done]')?.addEventListener('click',()=>{validateFeedQuestion(q,i);state.previewEditing.delete(i);syncCurrentQuestionsFromFeed();renderFeedPreview();renderAcceptedQuestionCard(i).catch(e=>console.error('[HOA preview close edit]',e));});
    card.querySelectorAll('[data-review-field]').forEach(el=>{
      const apply=()=>{
        const f=el.dataset.reviewField;
        if(f==='option_text'){const n=Number(el.dataset.reviewOptIndex);if(q.options[n])q.options[n].text=el.value;}
        else if(f==='correct_value')q.correct_value=el.value===''?'':Number(el.value);
        else if(f==='tolerance')q.tolerance=el.value===''?null:Number(el.value);
        else q[f]=el.value;
        validateFeedQuestion(q,i);syncCurrentQuestionsFromFeed();renderFeedPreview();renderAcceptedPreviewStatsInCard(card,q);
      };
      if(el.dataset.reviewField==='question_type')el.addEventListener('change',()=>{const next=el.value;if(next==='numerical'&&q.question_type!=='numerical'){q._reviewSavedMcqOptions=(q.options||[]).map(o=>({...o}));q._reviewSavedCorrectAnswer=q.correct_answer;}else if(next==='mcq'&&q.question_type==='numerical'){q.options=(q._reviewSavedMcqOptions&&q._reviewSavedMcqOptions.length?q._reviewSavedMcqOptions.map(o=>({...o})): [{text:'',image:null,_file:null},{text:'',image:null,_file:null}]);q.correct_answer=q._reviewSavedCorrectAnswer||0;delete q._reviewSavedMcqOptions;delete q._reviewSavedCorrectAnswer;}q.question_type=next;validateFeedQuestion(q,i);syncCurrentQuestionsFromFeed();renderFeedPreview();renderAcceptedQuestionCard(i).catch(e=>console.error('[HOA preview type change]',e));});
      else {el.addEventListener('input',apply);if(el.tagName==='SELECT')el.addEventListener('change',apply);}
      if(['question_text','explanation_text','option_text'].includes(el.dataset.reviewField))el.addEventListener('paste',e=>{
        const f=clipboardImageFile(e,`question-${i+1}`);if(!f)return;e.preventDefault();
        if(!validImage(f)){notify('Clipboard image is unsupported. Use PNG/JPG/WEBP/GIF up to 10 MB.','error');return;}
        if(el.dataset.reviewField==='question_text')applyAcceptedPreviewImage(q,'question',f,i);
        else if(el.dataset.reviewField==='explanation_text')applyAcceptedPreviewImage(q,'explanation',f,i);
        else applyAcceptedPreviewImage(q,'option',f,i,Number(el.dataset.reviewOptIndex));
      });
    });
    const wireFile=(buttonSelector,inputSelector,kind,optIndex=null)=>{
      const input=card.querySelector(inputSelector);card.querySelector(buttonSelector)?.addEventListener('click',()=>input?.click());
      input?.addEventListener('change',e=>{const f=e.target.files?.[0];if(f)applyAcceptedPreviewImage(q,kind,f,i,optIndex);});
    };
    wireFile('[data-review-question-upload]','[data-review-question-file]','question');
    wireFile('[data-review-explanation-upload]','[data-review-explanation-file]','explanation');
    card.querySelector('[data-review-question-remove]')?.addEventListener('click',()=>{q.question_image_path=null;q._media=q._media||{};q._media.question=null;validateFeedQuestion(q,i);syncCurrentQuestionsFromFeed();renderFeedPreview();renderAcceptedQuestionCard(i).catch(e=>console.error('[HOA remove question image]',e));});
    card.querySelector('[data-review-explanation-remove]')?.addEventListener('click',()=>{q.explanation_image_path=null;q._media=q._media||{};q._media.explanation=null;validateFeedQuestion(q,i);syncCurrentQuestionsFromFeed();renderFeedPreview();renderAcceptedQuestionCard(i).catch(e=>console.error('[HOA remove explanation image]',e));});
    card.querySelectorAll('[data-review-option-upload]').forEach(btn=>{const n=Number(btn.dataset.reviewOptionUpload),inp=card.querySelector(`[data-review-option-file="${n}"]`);btn.addEventListener('click',()=>inp?.click());inp?.addEventListener('change',e=>{const f=e.target.files?.[0];if(f)applyAcceptedPreviewImage(q,'option',f,i,n);});});
    card.querySelectorAll('[data-review-option-remove]').forEach(btn=>btn.addEventListener('click',()=>{const n=Number(btn.dataset.reviewOptionRemove);if(q.options[n]){q.options[n].image=null;q.options[n]._file=null;validateFeedQuestion(q,i);syncCurrentQuestionsFromFeed();renderFeedPreview();renderAcceptedQuestionCard(i).catch(e=>console.error('[HOA remove option image]',e));}}));
    card.querySelectorAll('[data-review-option-delete]').forEach(btn=>btn.addEventListener('click',()=>{const n=Number(btn.dataset.reviewOptionDelete);if((q.options||[]).length<=2){notify('At least two options are required.','warn');return;}q.options.splice(n,1);validateFeedQuestion(q,i);syncCurrentQuestionsFromFeed();renderFeedPreview();renderAcceptedQuestionCard(i).catch(e=>console.error('[HOA remove option]',e));}));
    card.querySelector('[data-review-option-add]')?.addEventListener('click',()=>{if((q.options||[]).length>=10){notify('Maximum 10 options are allowed.','warn');return;}q.options=q.options||[];q.options.push({text:'',image:null,_file:null});validateFeedQuestion(q,i);syncCurrentQuestionsFromFeed();renderFeedPreview();renderAcceptedQuestionCard(i).catch(e=>console.error('[HOA add option]',e));});
  }
  async function openAcceptedQuestionsPreview(){
    if(!state.feed.length){notify('Parse questions first to preview questions.','info');return;}
    const modal=$('hoa85AcceptedPreviewModal'),body=$('hoa85AcceptedPreviewBody'),summary=$('hoa85AcceptedPreviewSummary'),msg=$('hoa85AcceptedPreviewStatus');
    if(!modal||!body||!summary||!msg){notify('Question preview interface failed to initialise. Reload the Admin page and try again.','error');return;}
    state.previewEditing.clear();state.acceptedPreviewRenderId++;
    // Clear any selection left behind from copying/pasting text before opening the review.
    try{window.getSelection()?.removeAllRanges();}catch(_){}
    const token=state.acceptedPreviewRenderId;
    if(state.previewPreviousBodyOverflow===null)state.previewPreviousBodyOverflow=document.body.style.overflow||'';
    document.body.style.overflow='hidden';
    modal.hidden=false;modal.style.display='';
    const title=$('hoa85AcceptedPreviewTitle');if(title)title.textContent='Preview Questions';
    updateAcceptedPreviewSummary();msg.textContent='Rendering questions and loading any attached images…';
    // Render a visible placeholder per parsed question immediately so the preview
    // opens even if the storage service is slow. Each question replaces its own placeholder.
    body.innerHTML=state.feed.map((q,i)=>`<article class="hoa85-accepted-question" data-accepted-index="${i}"><header class="hoa85-accepted-question-head"><b>Question ${i+1}</b>${acceptedPreviewStatus(q)}<span class="hoa85-accepted-type">${esc(String(q.question_type||'mcq').toUpperCase())}</span></header><div class="hoa85-accepted-question-body">${q.question_text?esc(q.question_text).replace(/\n/g,'<br>'):'<em>[Image-based question / no question text]</em>'}<div class="hoa85-accepted-muted">Loading options and images…</div></div></article>`).join('');
    $('hoa85CloseAcceptedPreviewTop')?.focus({preventScroll:true});
    await Promise.all(state.feed.map(async(q,i)=>{
      try{
        const html=await acceptedPreviewCard(q,i);
        if(modal.hidden||token!==state.acceptedPreviewRenderId)return;
        const old=body.querySelector(`[data-accepted-index="${i}"]`);if(!old)return;
        old.outerHTML=html;
        const card=body.querySelector(`[data-accepted-index="${i}"]`);if(card)bindAcceptedPreviewCard(card,i);
      }catch(e){console.error('[HOA accepted-question preview card]',i,e);const old=body.querySelector(`[data-accepted-index="${i}"]`);if(old)old.insertAdjacentHTML('beforeend',`<div class="hoa85-errors">Question preview rendering failed: ${esc(e?.message||e)}</div>`);}
    }));
    if(!modal.hidden&&token===state.acceptedPreviewRenderId){msg.textContent='All parsed questions are shown in this scrollable popup, including accepted, warning and rejected questions. Select EDIT QUESTION on any card to edit it here. Changes remain local until SAVE FEED TO TEST.';updateAcceptedPreviewSummary();$('hoa85CloseAcceptedPreviewTop')?.focus({preventScroll:true});}
  }

  function clearPasteInput(){
    if(state.savingFeed){notify('Wait for the current save operation to finish before clearing the paste box.','warn');return;}
    const input=$('hoa85FeedInput');
    const hasText=!!(input&&input.value.trim());
    const hasStagedImages=state.feedPasteImages.size>0;
    if(!hasText&&!hasStagedImages){notify('The Paste Questions box is already empty.','info');return;}
    if(!confirm('Clear only the Paste Questions text and staged clipboard images? Accepted questions, images already attached to them, and test settings will remain unchanged.'))return;
    if(input)input.value='';
    state.pasteImagesParsed=false;
    state.feedPasteImages.clear();
    state.pasteImageCounter=0;
    updatePastedImageStatus();
    status('hoa85FeedMsg','Paste Questions box cleared. Accepted questions and test settings were not changed.','ok');
  }
  function clearFeed(opts={}){if(state.savingFeed){notify('Wait for the current save operation to finish before clearing questions.','warn');return;}const hasContent=!!(($('hoa85FeedInput')?.value||'').trim()||state.feed.length||state.feedPasteImages.size);if(opts.confirmUser&&hasContent&&!confirm('Clear all pasted question text, parsed questions and staged images? Test settings (title, timing, marks, access and batch/folder) will be preserved.'))return;state.feed=[];state.feedPasteImages.clear();state.pasteImageCounter=0;state.pasteImagesParsed=false;state.previewEditing.clear();closeAcceptedQuestionsPreview();if($('hoa85AcceptedPreviewBody'))$('hoa85AcceptedPreviewBody').innerHTML='';cleanupUrls();if($('hoa85FeedInput'))$('hoa85FeedInput').value='';['hoa85TxtFile','hoa85CsvFile','hoa85DocFile'].forEach(id=>{if($(id))$(id).value=''});renderFeedPreview();updatePastedImageStatus();if($('hoa85FeedMsg'))status('hoa85FeedMsg','Question text, parsed preview and staged images cleared. Test settings were preserved.');}
  function renderFeedTarget(){updateFeedTargets();if(state.currentQuestions.length&&state.editingTestId===($('hoa85FeedTarget')?.value||'')){state.feed=state.currentQuestions.map(normaliseQuestion);state.feedPage=1;renderFeedPreview();}else loadSelectedFeedTest();}
  async function loadSelectedFeedTest(){const id=$('hoa85FeedTarget')?.value||'';if(!id){state.editingTestId=null;setFeedExistingConfigLocked(false);if($('hoa85FeedTitle'))$('hoa85FeedTitle').value='TES Mock Test 01';if($('hoa85FeedDesc'))$('hoa85FeedDesc').value='';if($('hoa85FeedPublished'))$('hoa85FeedPublished').checked=false;if($('hoa85FeedShowResults'))$('hoa85FeedShowResults').checked=true;return;}if(state.editingTestId===id&&state.currentQuestions.length){state.feed=state.currentQuestions.map(q=>normaliseQuestion(q));renderFeedPreview();return;}try{const t=state.tests.find(x=>String(x.id)===String(id));if(t){loadFeedTestConfig(t);setFeedExistingConfigLocked(true);}else setFeedExistingConfigLocked(false);state.feed=await fetchTestQuestions(id);state.feed.forEach((q,i)=>q.status='valid');state.feedPage=1;state.currentQuestions=state.feed.map(normaliseQuestion);state.editingTestId=id;renderFeedPreview();}catch(e){status('hoa85FeedMsg',e.message,'error')}}
  function renderFeedPreview(){
    const total=state.feed.length,valid=state.feed.filter(q=>q.status==='valid').length,warn=state.feed.filter(q=>q.status==='warning').length,inv=state.feed.filter(q=>q.status==='invalid').length;
    if($('hoa85FeedTotal'))$('hoa85FeedTotal').textContent=total;
    if($('hoa85FeedValid'))$('hoa85FeedValid').textContent=valid;
    if($('hoa85FeedWarn'))$('hoa85FeedWarn').textContent=warn;
    if($('hoa85FeedInvalid'))$('hoa85FeedInvalid').textContent=inv;
    syncFeedPreviewActions();
  }
  function feedCard(q,i){
    const st=q.status||'valid';
    const opts=q.question_type==='numerical'?`<div class="hoa85-num-summary">Correct value: <b>${esc(q.correct_value??'')}</b> · Tolerance: <b>${esc(q.tolerance??'')}</b></div>`:(q.options||[]).map((o,n)=>`<div class="hoa85-option-row"><span>${n+1}.</span><input data-f-field="opt" data-opt-index="${n}" value="${esc(o.text||'')}" placeholder="Option ${n+1}"><button type="button" class="hoa85-btn small" data-img-opt="${n}">${o.image||o._file?'✓ Image':'Image'}</button><input type="file" accept="image/png,image/jpeg,image/webp,image/gif" class="hidden" data-opt-file="${n}">${o._file?imagePreviewHtml(o._file,`Option ${n+1} image`):o.image?'<div class="hoa85-media-hint">Saved option image attached</div>':''}</div>`).join('');
    const qPreview=q._media?.question?imagePreviewHtml(q._media.question,'Question image'):'';
    const ePreview=q._media?.explanation?imagePreviewHtml(q._media.explanation,'Explanation image'):'';
    return `<article class="hoa85-feed-card" data-feed-index="${i}"><div class="hoa85-feed-card-head"><b>Question ${i+1}</b><span class="hoa85-badge ${st==='valid'?'ok':st==='warning'?'warn':'err'}">${st.toUpperCase()}</span><div class="hoa85-actions"><button class="hoa85-btn small" data-feed-delete="${i}">DELETE</button></div></div><div class="hoa85-feed-grid"><label>Type<select data-feed-type><option value="mcq" ${q.question_type==='mcq'?'selected':''}>MCQ</option><option value="numerical" ${q.question_type==='numerical'?'selected':''}>Numerical</option></select></label><label>Source (I:) <input data-f-field="source" value="${esc(q.source||'')}"></label><label class="wide">Question<textarea data-f-field="question_text" rows="3" placeholder="Question text (optional when image is attached)">${esc(q.question_text||'')}</textarea></label><div class="wide"><div class="hoa85-media-line"><b>Question Image</b><button type="button" class="hoa85-btn small" data-img-question>Upload / Replace</button><input type="file" accept="image/png,image/jpeg,image/webp,image/gif" class="hidden" data-question-file><button type="button" class="hoa85-btn small danger" data-img-remove-question>Remove</button></div>${qPreview}${q.question_image_path?`<div class="hoa85-media-path">${esc(q.question_image_path)}</div>`:''}</div><div class="wide"><div class="hoa85-option-label">${q.question_type==='numerical'?'Numerical Answer':'Options'}</div>${q.question_type==='numerical'?`<div class="hoa85-num-grid"><label>Correct Value<input data-f-field="correct_value" value="${esc(q.correct_value??'')}"></label><label>Tolerance<input data-f-field="tolerance" value="${esc(q.tolerance??'')}"></label></div>`:opts}</div>${q.question_type==='mcq'?`<label class="wide">Correct Answer<input data-f-field="correct_answer" value="${esc(q.correct_answer||'')}" placeholder="1 / A"></label>`:''}<label class="wide">Explanation<textarea data-f-field="explanation_text" rows="3">${esc(q.explanation_text||'')}</textarea></label><div class="wide"><div class="hoa85-media-line"><b>Explanation Image</b><button type="button" class="hoa85-btn small" data-img-explanation>Upload / Replace</button><input type="file" accept="image/png,image/jpeg,image/webp,image/gif" class="hidden" data-explanation-file><button type="button" class="hoa85-btn small danger" data-img-remove-explanation>Remove</button></div>${ePreview}${q.explanation_image_path?`<div class="hoa85-media-path">${esc(q.explanation_image_path)}</div>`:''}</div></div>${(q.errors||[]).length?`<div class="hoa85-errors">${q.errors.map(e=>`<div>✕ ${esc(e)}</div>`).join('')}</div>`:''}${(q.warnings||[]).length?`<div class="hoa85-warnings">${q.warnings.map(e=>`<div>⚠ ${esc(e)}</div>`).join('')}</div>`:''}</article>`;
  }
  function bindFeedCards(){
    document.querySelectorAll('#hoa85FeedPreview .hoa85-feed-card').forEach(card=>{
      const i=Number(card.dataset.feedIndex),q=state.feed[i];if(!q)return;
      card.querySelectorAll('[data-f-field]').forEach(el=>{
        el.oninput=()=>{const f=el.dataset.fField;if(f==='opt'){const n=Number(el.dataset.optIndex);q.options[n].text=el.value;}else q[f]=el.value;validateFeedQuestion(q,i);syncCurrentQuestionsFromFeed();refreshFeedCardStatus(card,q);};
        el.addEventListener('paste',e=>{
          const f=clipboardImageFile(e,`question-${i+1}`);if(!f)return;e.preventDefault();
          if(!validImage(f)){notify('Clipboard image is unsupported. Use PNG/JPG/WEBP/GIF up to 10 MB.','error');return;}
          if(el.dataset.fField==='question_text'){attachFile(q,'question',f,i);return;}
          if(el.dataset.fField==='explanation_text'){attachFile(q,'explanation',f,i);return;}
          if(el.dataset.fField==='opt'){const n=Number(el.dataset.optIndex);attachOptionFile(q,n,f,i);return;}
        });
      });
      card.querySelector('[data-feed-type]')?.addEventListener('change',e=>{q.question_type=e.target.value;if(q.question_type==='numerical')q.options=[];else if(!q.options.length)q.options=[{text:'',image:null,_file:null},{text:'',image:null,_file:null}];validateFeedQuestion(q,i);syncCurrentQuestionsFromFeed();renderFeedPreview();});
      card.querySelector('[data-feed-delete]')?.addEventListener('click',()=>{state.feed.splice(i,1);syncCurrentQuestionsFromFeed();state.feedPage=Math.min(state.feedPage,Math.max(1,Math.ceil(state.feed.length/state.feedPageSize)));renderFeedPreview();});
      card.querySelector('[data-img-question]')?.addEventListener('click',()=>card.querySelector('[data-question-file]')?.click());
      card.querySelector('[data-question-file]')?.addEventListener('change',e=>attachFile(q,'question',e.target.files?.[0],i));
      card.querySelector('[data-img-explanation]')?.addEventListener('click',()=>card.querySelector('[data-explanation-file]')?.click());
      card.querySelector('[data-explanation-file]')?.addEventListener('change',e=>attachFile(q,'explanation',e.target.files?.[0],i));
      card.querySelector('[data-img-remove-question]')?.addEventListener('click',()=>{q.question_image_path=null;q._media=q._media||{};q._media.question=null;validateFeedQuestion(q,i);syncCurrentQuestionsFromFeed();renderFeedPreview();});
      card.querySelector('[data-img-remove-explanation]')?.addEventListener('click',()=>{q.explanation_image_path=null;q._media=q._media||{};q._media.explanation=null;validateFeedQuestion(q,i);syncCurrentQuestionsFromFeed();renderFeedPreview();});
      card.querySelectorAll('[data-img-opt]').forEach(btn=>btn.addEventListener('click',()=>card.querySelector(`[data-opt-file="${btn.dataset.imgOpt}"]`)?.click()));
      card.querySelectorAll('[data-opt-file]').forEach(inp=>inp.addEventListener('change',e=>{const n=Number(inp.dataset.optFile);const f=e.target.files?.[0];if(f)attachOptionFile(q,n,f,i);}));
    });
  }
  function validateFeedQuestion(q,i){const p=window.HOAPureQuestionParser;if(typeof p?.validate==='function')p.validate(q,i);if(q?._missingPastedImageMarker){const hasImage=!!(q.question_image_path||q._media?.question||(q.options||[]).some(o=>o.image||o._file)||q.explanation_image_path||q._media?.explanation);if(hasImage){q._missingPastedImageMarker=false;}else{q.warnings=q.warnings||[];const msg=`Question ${i+1}: An image placeholder was present but no clipboard image file was attached. Use EDIT QUESTION to upload or paste the actual image.`;if(!q.warnings.includes(msg))q.warnings.push(msg);q.status=q.errors?.length?'invalid':'warning';}}}
  function refreshFeedCardStatus(card,q){const badge=card?.querySelector('.hoa85-badge');if(badge){const st=q.status||'valid';badge.className=`hoa85-badge ${st==='valid'?'ok':st==='warning'?'warn':'err'}`;badge.textContent=st.toUpperCase();}const box=card?.querySelector('.hoa85-errors');if(box){if(q.errors?.length)box.innerHTML=q.errors.map(e=>`<div>✕ ${esc(e)}</div>`).join('');else box.remove();}else if(q.errors?.length){const div=document.createElement('div');div.className='hoa85-errors';div.innerHTML=q.errors.map(e=>`<div>✕ ${esc(e)}</div>`).join('');card.appendChild(div);}const warn=card?.querySelector('.hoa85-warnings');if(warn){if(q.warnings?.length)warn.innerHTML=q.warnings.map(e=>`<div>⚠ ${esc(e)}</div>`).join('');else warn.remove();}else if(q.warnings?.length){const div=document.createElement('div');div.className='hoa85-warnings';div.innerHTML=q.warnings.map(e=>`<div>⚠ ${esc(e)}</div>`).join('');card.appendChild(div);}const total=$('hoa85FeedTotal');if(total){$('hoa85FeedTotal').textContent=state.feed.length;$('hoa85FeedValid').textContent=state.feed.filter(x=>x.status==='valid').length;$('hoa85FeedWarn').textContent=state.feed.filter(x=>x.status==='warning').length;$('hoa85FeedInvalid').textContent=state.feed.filter(x=>x.status==='invalid').length;}}
  function clipboardImageFile(e,prefix='pasted-image'){
    const cd=e?.clipboardData;if(!cd)return null;let raw=null;
    try{const item=Array.from(cd.items||[]).find(x=>/^image\//i.test(x.type||''));if(item)raw=item.getAsFile();}catch(_){raw=null;}
    if(!raw){try{raw=Array.from(cd.files||[]).find(f=>/^image\//i.test(f.type||''))||null;}catch(_){raw=null;}}
    if(!raw)return null;const type=raw.type||'image/png';const ext=type==='image/jpeg'?'jpg':type==='image/webp'?'webp':type==='image/gif'?'gif':'png';
    try{return new File([raw],`${prefix}-${Date.now()}.${ext}`,{type,lastModified:Date.now()});}catch(_){return raw;}
  }
  // Question Feeding uses a contenteditable surface instead of a native textarea:
  // a native textarea cannot display an image inline. A .value compatibility adapter
  // keeps the parser and existing TXT/DOC/clear code working with this visible editor.
  function setupFeedInputEditor(){
    const editor=$('hoa85FeedInput');if(!editor||editor.dataset.hoaValueAdapter==='1')return;
    Object.defineProperty(editor,'value',{
      configurable:true,
      get(){return feedEditorToParserText(editor);},
      set(value){editor.textContent=String(value??'');}
    });
    editor.dataset.hoaValueAdapter='1';
  }
  function feedEditorToParserText(editor){
    if(!editor)return '';
    function serialise(node){
      if(node.nodeType===Node.TEXT_NODE)return node.nodeValue||'';
      if(node.nodeType!==Node.ELEMENT_NODE)return '';
      if(node.hasAttribute('data-hoa-paste-marker'))return `\n${node.getAttribute('data-hoa-paste-marker')}\n`;
      if(node.tagName==='BR')return '\n';
      const tag=node.tagName;
      let inner=Array.from(node.childNodes).map(serialise).join('');
      if(['DIV','P','LI'].includes(tag))inner=`\n${inner}\n`;
      return inner;
    }
    return Array.from(editor.childNodes).map(serialise).join('').replace(/\r\n?/g,'\n');
  }
  function editorSelectionRange(editor){
    const selection=window.getSelection();
    if(selection&&selection.rangeCount){
      const current=selection.getRangeAt(0);
      if(editor.contains(current.startContainer)||current.startContainer===editor)return current;
    }
    const range=document.createRange();range.selectNodeContents(editor);range.collapse(false);return range;
  }
  function insertFeedEditorNode(editor,node){
    const selection=window.getSelection();const range=editorSelectionRange(editor);
    range.deleteContents();range.insertNode(node);range.setStartAfter(node);range.collapse(true);
    if(selection){selection.removeAllRanges();selection.addRange(range);}editor.focus();editor.dispatchEvent(new Event('input',{bubbles:true}));
  }
  function insertFeedEditorText(editor,text){
    if(!editor||!text)return;
    insertFeedEditorNode(editor,document.createTextNode(String(text).replace(/\r\n?/g,'\n')));
  }
  function handleFeedInputPaste(e){
    const editor=$('hoa85FeedInput');if(!editor||!e.clipboardData)return;
    const file=clipboardImageFile(e,'feed-image');
    if(file){
      e.preventDefault();
      if(!validImage(file)){notify('Clipboard image is unsupported. Use PNG/JPG/WEBP/GIF up to 10 MB.','error');return;}
      state.pasteImagesParsed=false;
      const marker=`[[HOA_PASTED_IMAGE_${++state.pasteImageCounter}]]`;
      state.feedPasteImages.set(marker,file);
      const wrapper=document.createElement('span');wrapper.className='hoa85-inline-pasted-image';wrapper.setAttribute('data-hoa-paste-marker',marker);wrapper.setAttribute('contenteditable','false');wrapper.setAttribute('role','group');wrapper.setAttribute('aria-label','Pasted question image');
      const img=document.createElement('img');img.src=feedFilePreviewUrl(file);img.alt='Pasted clipboard image';img.draggable=false;
      const remove=document.createElement('button');remove.type='button';remove.className='hoa85-inline-pasted-image-remove';remove.setAttribute('data-paste-inline-remove',marker);remove.setAttribute('aria-label','Remove pasted image');remove.title='Remove this pasted image';remove.textContent='×';
      wrapper.append(img,remove);insertFeedEditorNode(editor,wrapper);updatePastedImageStatus();
      status('hoa85FeedMsg','The actual clipboard image is now displayed inside the Paste Questions box at the cursor. Parse questions to attach it.','ok');
      return;
    }
    // Insert plain text only so Office/web copy formatting cannot create unwanted editor blocks.
    const text=e.clipboardData.getData('text/plain');
    if(text!==undefined&&text!==''){e.preventDefault();insertFeedEditorText(editor,text);}
  }
  function handleFeedInputKeydown(e){
    if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();insertFeedEditorText($('hoa85FeedInput'),'\n');}
  }
  function handleFeedInlineImageClick(e){
    const button=e.target?.closest?.('[data-paste-inline-remove]');if(!button)return;
    e.preventDefault();e.stopPropagation();const marker=button.getAttribute('data-paste-inline-remove');
    const wrapper=button.closest('[data-hoa-paste-marker]');if(wrapper)wrapper.remove();if(marker)state.feedPasteImages.delete(marker);
    state.pasteImagesParsed=false;updatePastedImageStatus();status('hoa85FeedMsg','Pasted image removed from inside the Paste Questions box.','ok');
  }
  function handleFeedEditorInput(){
    const editor=$('hoa85FeedInput');if(!editor)return;
    // Keep the image-file map aligned if an image is removed with Backspace/Delete.
    const visible=new Set(Array.from(editor.querySelectorAll('[data-hoa-paste-marker]')).map(x=>x.getAttribute('data-hoa-paste-marker')));
    for(const marker of state.feedPasteImages.keys())if(!visible.has(marker))state.feedPasteImages.delete(marker);
    state.pasteImagesParsed=false;updatePastedImageStatus();
  }
  function stripPastedMarker(text,marker){return String(text??'').split(marker).join('').replace(/[ \t]+\n/g,'\n').replace(/\n[ \t]+/g,'\n').replace(/\n{3,}/g,'\n\n').trim();}
  function stripAllPastedMarkers(text){return String(text??'').replace(/\[\[HOA_PASTED_IMAGE_\d+\]\]/g,'').replace(/[ \t]+\n/g,'\n').replace(/\n[ \t]+/g,'\n').replace(/\n{3,}/g,'\n\n').trim();}
  function rawMarkerTarget(raw,marker,list){
    raw=String(raw||'');const pos=raw.indexOf(marker);if(pos<0||!list.length)return null;
    const before=raw.slice(0,pos);const questionStarts=[...before.matchAll(/^[ \t]*(?:Q|Question)[ \t]*:/gim)];
    const starts=questionStarts.length;const qIndex=Math.max(0,Math.min(list.length-1,starts-1));
    const lastStart=questionStarts.length?questionStarts[questionStarts.length-1].index:0;
    const block=before.slice(lastStart);let kind='question',optIndex=-1;
    for(const lineRaw of block.split(/\r?\n/)){
      const line=lineRaw.trim();if(!line)continue;
      if(/^\s*(?:Q|Question)\s*:/i.test(line)){kind='question';optIndex=-1;continue;}
      if(/^\s*I\s*:/i.test(line)){kind='source';optIndex=-1;continue;}
      if(/^\s*(?:An|Answer|Correct\s*Answer)\s*:/i.test(line)){kind='answer';optIndex=-1;continue;}
      if(/^\s*(?:Ex|Explanation)\s*:/i.test(line)){kind='explanation';optIndex=-1;continue;}
      const opt=line.match(/^\s*(\d{1,2}|[A-J])[.)]\s*/i);
      if(opt){const x=opt[1].toUpperCase();kind='option';optIndex=/^[A-J]$/.test(x)?x.charCodeAt(0)-65:Number(x)-1;}
    }
    return {qIndex,kind,optIndex};
  }
  function attachImageToQuestion(q,kind,file,optIndex){
    if(kind==='option'){
      const n=Math.max(0,Number(optIndex)||0);while(q.options.length<=n)q.options.push({text:'',image:null,_file:null,_placeholder:false});
      q.options[n]._file=file;q.options[n].image=null;q.options[n]._placeholder=false;
    }else if(kind==='explanation'){
      q._media=q._media||{};q._media.explanation=file;q.explanation_image_path=null;q._media._explanationPlaceholder=false;
    }else{
      q._media=q._media||{};q._media.question=file;q.question_image_path=null;q._media._questionPlaceholder=false;
    }
  }
  function applyPastedImagesToFeed(list,rawInput=''){
    const unmatched=[];
    for(const [marker,file] of state.feedPasteImages.entries()){
      let found=false;
      for(const q of list){
        if(String(q.question_text||'').includes(marker)){q.question_text=stripPastedMarker(q.question_text,marker);attachImageToQuestion(q,'question',file);found=true;break;}
        const oi=(q.options||[]).findIndex(o=>String(o.text||'').includes(marker));
        if(oi>=0){q.options[oi].text=stripPastedMarker(q.options[oi].text,marker);attachImageToQuestion(q,'option',file,oi);found=true;break;}
        if(String(q.explanation_text||'').includes(marker)){q.explanation_text=stripPastedMarker(q.explanation_text,marker);attachImageToQuestion(q,'explanation',file);found=true;break;}
        if(String(q.source||'').includes(marker)){q.source=stripPastedMarker(q.source,marker);attachImageToQuestion(q,'question',file);found=true;break;}
      }
      if(!found){
        const target=rawMarkerTarget(rawInput,marker,list);
        if(target&&list[target.qIndex]){attachImageToQuestion(list[target.qIndex],target.kind==='explanation'?'explanation':target.kind==='option'?'option':'question',file,target.optIndex);found=true;}
      }
      if(!found)unmatched.push(marker);
    }
    list.forEach((q,i)=>{
      const texts=[q.question_text,q.source,q.explanation_text,...(q.options||[]).map(o=>o.text)];
      const unresolved=texts.some(t=>/\[\[HOA_PASTED_IMAGE_\d+\]\]/.test(String(t||'')));
      q.question_text=stripAllPastedMarkers(q.question_text);q.source=stripAllPastedMarkers(q.source);q.explanation_text=stripAllPastedMarkers(q.explanation_text);
      (q.options||[]).forEach(o=>{o.text=stripAllPastedMarkers(o.text);});
      if(unresolved)q._missingPastedImageMarker=true;
    });
    if(unmatched.length)status('hoa85FeedMsg',`${unmatched.length} pasted image(s) could not be matched automatically. Their images remain visible in the Paste Questions box; adjust their placement and parse again.`,'warn');
    return unmatched;
  }
  function updatePastedImageStatus(){
    const box=$('hoa85FeedPasteStatus');const editor=$('hoa85FeedInput');const count=state.feedPasteImages.size;
    if(box){box.textContent=count?(state.pasteImagesParsed?`${count} pasted image(s) shown inside Paste Questions and attached to parsed questions. The same images appear in Questions Preview.`:`${count} pasted image(s) shown inline inside Paste Questions. Parse questions to assign them.`):'No pasted images staged. Images will appear inside this box when pasted.';box.classList.toggle('has-images',count>0);}
    if(editor)editor.setAttribute('aria-label',count?`Paste Questions editor, ${count} inline image(s)`:'Paste Questions editor');
  }
  function toggleFeedFullscreen(){const panel=$('hoa85FeedPasteWorkspace');if(!panel)return;if(document.fullscreenElement===panel){if(document.exitFullscreen)document.exitFullscreen().catch(()=>{});return;}if(panel.classList.contains('hoa85-feed-paste-fullscreen-fallback')){panel.classList.remove('hoa85-feed-paste-fullscreen-fallback');syncFeedFullscreenButton();return;}if(panel.requestFullscreen){panel.requestFullscreen().then(syncFeedFullscreenButton).catch(()=>{panel.classList.add('hoa85-feed-paste-fullscreen-fallback');syncFeedFullscreenButton();});}else{panel.classList.add('hoa85-feed-paste-fullscreen-fallback');syncFeedFullscreenButton();}}
  function syncFeedFullscreenButton(){const panel=$('hoa85FeedPasteWorkspace'),btn=$('hoa85FeedFullscreen');if(!panel||!btn)return;const active=document.fullscreenElement===panel||panel.classList.contains('hoa85-feed-paste-fullscreen-fallback');btn.textContent=active?'↙ EXIT FULL SCREEN':'⛶ FULL SCREEN';btn.setAttribute('aria-pressed',String(active));btn.title=active?'Exit Paste Questions fullscreen':'Expand only the Paste Questions box';}
  function feedFilePreviewUrl(file){if(!file||!URL?.createObjectURL)return '';if(state.previewUrlByFile.has(file))return state.previewUrlByFile.get(file);const url=URL.createObjectURL(file);state.previewUrlByFile.set(file,url);state.objectUrls.add(url);return url;}
  function imagePreviewHtml(file,label){const url=feedFilePreviewUrl(file);return url?`<div class="hoa85-feed-image-preview"><img src="${esc(url)}" alt="${esc(label)}"><span>${esc(label)} attached</span></div>`:'';}
  function attachOptionFile(q,n,file,i){if(!file)return;if(!validImage(file)){notify('Invalid image. Use PNG/JPG/WEBP/GIF up to 10 MB.','error');return;}if(!q.options[n])q.options[n]={text:'',image:null,_file:null};q.options[n]._file=file;q.options[n].image=null;validateFeedQuestion(q,i);syncCurrentQuestionsFromFeed();renderFeedPreview();}


  function syncCurrentQuestionsFromFeed(){
    if(!state.feed.length && !state.currentQuestions.length)return;
    state.currentQuestions=state.feed.map(normaliseQuestion);
    if(state.editingTestId){const sel=$('hoa85FeedTarget');if(sel)sel.value=String(state.editingTestId);}
    renderEditorQuestionSummary();
  }
  function syncFeedFromCurrentQuestions(){
    if(state.currentQuestions.length){state.feed=state.currentQuestions.map(normaliseQuestion);state.feedPage=1;renderFeedPreview();}
  }

  function validImage(f){return !!f&&IMG_TYPES.includes(f.type)&&f.size<=MAX_IMG;}
  function attachFile(q,kind,f,i){if(!f)return;if(!validImage(f)){notify('Invalid image. Use PNG/JPG/WEBP/GIF up to 10 MB.','error');return}q._media=q._media||{};q._media[kind]=f;if(kind==='question')q.question_image_path=null;else q.explanation_image_path=null;validateFeedQuestion(q,i);syncCurrentQuestionsFromFeed();renderFeedPreview();}
  async function uploadImage(f){await requireAdmin('tests.manage');const c=db();if(!validImage(f))throw new Error('Invalid image.');const ext=(f.name.split('.').pop()||'png').toLowerCase().replace(/[^a-z0-9]/g,'')||'png';const path=`feed/${crypto.randomUUID?.()||Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;const r=await c.storage.from(BUCKET).upload(path,f,{contentType:f.type,upsert:false,cacheControl:'3600'});if(r.error)throw r.error;state.pendingMediaUploads.push(path);return path;}
  function restorePendingMediaChanges(){for(const change of state.pendingMediaChanges.splice(0).reverse()){if(change.kind==='question')change.q.question_image_path=change.previous;else if(change.kind==='explanation')change.q.explanation_image_path=change.previous;else if(change.kind==='option')change.option.image=change.previous;}}
  async function rollbackPendingMediaUploads(){const paths=[...new Set(state.pendingMediaUploads)];state.pendingMediaUploads=[];if(paths.length){try{const r=await db().storage.from(BUCKET).remove(paths);if(r.error)console.warn('[HOA V8.90 media rollback]',r.error)}catch(e){console.warn('[HOA V8.90 media rollback]',e)}}restorePendingMediaChanges();}
  function commitPendingMediaChanges(){for(const change of state.pendingMediaChanges.splice(0)){if(change.kind==='question'||change.kind==='explanation')change.q._media=change.q._media||{};if(change.kind==='question')change.q._media.question=null;if(change.kind==='explanation')change.q._media.explanation=null;if(change.kind==='option')change.option._file=null;}state.pendingMediaUploads=[];}
  async function materialiseFeed(list=state.feed){for(const q of list){if(q._media?.question){const previous=q.question_image_path||null;const path=await uploadImage(q._media.question);q.question_image_path=path;state.pendingMediaChanges.push({kind:'question',q,previous});}if(q._media?.explanation){const previous=q.explanation_image_path||null;const path=await uploadImage(q._media.explanation);q.explanation_image_path=path;state.pendingMediaChanges.push({kind:'explanation',q,previous});}for(const o of q.options||[]){if(o._file){const previous=o.image||null;const path=await uploadImage(o._file);o.image=path;state.pendingMediaChanges.push({kind:'option',option:o,previous});}}}return state.feed;}
  function qPayload(q,i){return {id:q.id||null,question_bank_id:q.question_bank_id||null,question_type:q.question_type==='numerical'?'numerical':'mcq',question_text:q.question_text||'',source:q.source||null,options:(q.options||[]).map(o=>({text:o.text||'',image:o.image||null})),question_image_path:q.question_image_path||null,correct_option:q.question_type==='mcq'?normaliseAnswer(q.correct_answer):null,correct_value:q.question_type==='numerical'?Number(q.correct_value):null,tolerance:q.question_type==='numerical'&&q.tolerance!==null&&q.tolerance!==''?Number(q.tolerance):null,explanation_text:q.explanation_text||'',explanation_image_path:q.explanation_image_path||null,question_order:i+1};}
  function normaliseAnswer(v){const s=String(v??'').trim().toUpperCase();if(/^[A-J]$/.test(s))return s.charCodeAt(0)-64;const n=Number(s);return Number.isInteger(n)?n:0;}
  async function saveFeedToTest(){
    if(state.savingFeed)return;
    state.savingFeed=true;
    const btn=$('hoa85SaveFeed'); if(btn)btn.disabled=true;
    try{
      await requireAdmin('tests.manage');
      if(!state.feed.length){notify('No questions to save.','error');return;}
      const parser=window.HOAPureQuestionParser;
      if(!parser?.validate)throw new Error('Pure question parser is not ready.');
      const valid=state.feed.map((q,i)=>parser.validate(q,i)).filter(q=>q.status!=='invalid');
      if(!valid.length){notify('There are no valid questions to save.','error');return;}
      const target=$('hoa85FeedTarget')?.value||null;
      const existing=target?state.tests.find(x=>String(x.id)===String(target)):null;
      if(target&&!existing)throw new Error('Target test not found. Refresh Mock Tests and try again.');
      const title=String($('hoa85FeedTitle')?.value||existing?.title||'').trim();
      if(!title)throw new Error('Test title is required.');
      const access=state.creationContext==='freecontent'?'free':'paid';if(existing&&existing.access_type!==access)throw new Error('This workspace cannot edit a test from the other access area. Open that test through its own section.');
      const batch=access==='free'?null:(existing?.test_batch_id||$('hoa85FeedBatch')?.value||null);
      const folder=access==='free'?null:(existing?.test_batch_folder_id||$('hoa85FeedFolder')?.value||null);
      const type=existing?.test_type||$('hoa85FeedTestType')?.value||'subject';
      const published=existing?Boolean(existing.is_published):Boolean($('hoa85FeedPublished')?.checked);
      if(published&&access==='paid'&&(!batch||!folder))throw new Error('A published Paid Mock Test requires a Batch and Folder. Save it as Draft first if you want to assign it later.');

      await materialiseFeed(valid);
      let payloadQuestions=valid.map(q=>normaliseQuestion(q));
      const mode=existing?($('hoa85FeedSaveMode')?.value||'append'):'new';
      if(existing){
        const base=await fetchTestQuestions(existing.id);
        if(mode==='replace'){
          const attempts=await db().from('attempts').select('id',{count:'exact',head:true}).eq('test_id',existing.id);
          if(attempts.error)throw attempts.error;
          const freeAttempts=await db().from('free_test_attempts').select('id',{count:'exact',head:true}).eq('test_id',existing.id);
          if(freeAttempts.error)throw freeAttempts.error;
          if((attempts.count||0)+(freeAttempts.count||0)>0)throw new Error('Replace is unavailable because this test has historical attempts. Use Append to preserve history.');
        }else{
          payloadQuestions=[...base,...payloadQuestions];
        }
      }
      const payload=payloadQuestions.map((q,i)=>qPayload(q,i));
      const c=db();
      const res=await c.rpc('save_test_bundle_v5',{p_test_id:target,p_title:title,p_description:String($('hoa85FeedDesc')?.value||existing?.description||'').trim()||null,p_duration_minutes:Math.max(1,Number($('hoa85FeedDuration')?.value)||existing?.duration_minutes||10),p_marks_per_question:Math.max(.01,Number($('hoa85FeedMarks')?.value)===''?(Number(existing?.marks_per_question)||1):Number($('hoa85FeedMarks')?.value)),p_negative_marking:Math.max(0,Number($('hoa85FeedNegative')?.value)===''?(Number(existing?.negative_marking)||.25):Number($('hoa85FeedNegative')?.value)),p_is_published:published,p_access_type:access,p_test_batch_id:batch,p_test_batch_folder_id:folder,p_test_type:type,p_allow_review:$('hoa85FeedShowResults')?.checked!==false,p_questions:payload});
      if(res.error)throw res.error;
      const tid=res.data;
      commitPendingMediaChanges();
      const vr=await c.rpc('hoa_admin_update_test_result_visibility',{p_test_id:tid,p_show_result_details:$('hoa85FeedShowResults')?.checked!==false});
      if(vr.error)throw vr.error;
      if(!target && state.creationContext==='freecontent' && access==='free'){const fr=await c.rpc('hoa_admin_publish_test_to_free_content',{p_test_id:tid});if(fr.error)throw fr.error;}
      const savedNew=payloadQuestions.length;
      notify(`${valid.length} question(s) ${target?(mode==='append'?'appended to':'replaced in'):'saved to new'} test “${title}”.`,'ok');
      state.editingTestId=tid;state.currentQuestions=payloadQuestions.map(normaliseQuestion);state.feed=payloadQuestions.map(normaliseQuestion);state.dirty=false;
      await loadAll({bank:true});updateFeedTargets();
      const nt=state.tests.find(x=>String(x.id)===String(tid));if(nt)loadFeedTestConfig(nt);setFeedExistingConfigLocked(true);
      renderFeedPreview();if(state.creationContext==='freecontent'&&access==='free'){if(window.__HOA_ADMIN_RUNTIME_V89_API__?.router)await window.__HOA_ADMIN_RUNTIME_V89_API__.router('freecontent');}else{openTab('tests');await editTest(tid);}window.dispatchEvent(new CustomEvent('hoa:mock-data-changed',{detail:{testId:tid,freeContent:state.creationContext==='freecontent'}}));
    }catch(e){await rollbackPendingMediaUploads();console.error('[HOA V8.90 Save Feed]',e);notify(e.message||'Could not save feed.','error');status('hoa85FeedMsg',e.message||'Could not save feed.','error');}
    finally { state.savingFeed=false; if(btn)btn.disabled=false; }
  }

  function renderBank(){const list=$('hoa85BankList');if(!list)return;const rows=state.bank;const pages=Math.max(1,Math.ceil((state.bankTotal||0)/state.bankPageSize));state.bankPage=Math.min(state.bankPage,pages);$('hoa85BankCount').textContent=`${state.bankTotal||0} questions`;$('hoa85BankSelected').textContent=`${state.bankSelected.size} selected`;$('hoa85BankPageNo').textContent=String(state.bankPage);populateBankFilter();list.innerHTML=rows.length?rows.map(q=>{const key=String(q.question_bank_id||q.id);const sel=state.bankSelected.has(key);const meta=bankToMeta(q);return `<article class="hoa85-bank-row"><div class="hoa85-bank-main"><label class="hoa85-check"><input type="checkbox" data-bank-check="${esc(key)}" ${sel?'checked':''}><span>Select</span></label><div class="hoa85-bank-title"><b>${esc(q.question_text||'[Image Question]')}</b><small>From: ${esc(q.source_test_title||'Unknown Mock Test')} · ${esc(q.source||'No source')} · ${esc(q.question_type||'mcq')}</small></div><div class="hoa85-bank-actions"><button class="hoa85-btn small" data-qedit="${esc(key)}">EDIT</button><button class="hoa85-btn small danger" data-qdelete="${esc(key)}">DELETE</button><button class="hoa85-btn small" data-qadd="${esc(key)}">ADD TO NEW TEST</button></div></div><div class="hoa85-bank-options">${q.question_type==='numerical'?`<span>Correct: ${esc(q.correct_value??'—')} ± ${esc(q.tolerance??'—')}</span>`:(Array.isArray(q.options_json)&&q.options_json.length?q.options_json:[{text:q.option_1},{text:q.option_2},{text:q.option_3},{text:q.option_4}]).map((o,i)=>`<span class="${Number(q.correct_option)===i+1?'correct':''}">${i+1}. ${esc(o.text||'[image]')}</span>`).join('')}</div></article>`}).join(''):'<div class="hoa85-empty">No questions match the current search/filter.</div>';document.querySelectorAll('[data-bank-check]').forEach(c=>c.onchange=()=>{const key=String(c.dataset.bankCheck);if(c.checked){state.bankSelected.add(key);const row=state.bank.find(x=>String(x.question_bank_id||x.id)===key);if(row)state.bankSelectedData.set(key,row);}else state.bankSelected.delete(key);$('hoa85BankSelected').textContent=`${state.bankSelected.size} selected`;});document.querySelectorAll('[data-qedit]').forEach(b=>b.onclick=()=>openQuestionEditor(b.dataset.qedit));document.querySelectorAll('[data-qdelete]').forEach(b=>b.onclick=()=>deleteBankQuestion(b.dataset.qdelete));document.querySelectorAll('[data-qadd]').forEach(b=>b.onclick=()=>{const key=String(b.dataset.qadd);const q=state.bank.find(x=>String(x.question_bank_id||x.id)===key)||state.bankSelectedData.get(key);if(q){state.bankSelected.add(key);state.bankSelectedData.set(key,q);startNewTest([...state.bankSelected].map(k=>bankToMeta(state.bankSelectedData.get(k))).filter(Boolean));openTab('tests');renderEditorQuestionSummary();}});}
  function populateBankFilter(){const s=$('hoa85BankTestFilter');if(!s)return;const cur=s.value;s.innerHTML='<option value="">All source tests</option>'+state.tests.map(t=>`<option value="${esc(t.id)}">${esc(t.title)}</option>`).join('');if(cur&&state.tests.some(t=>String(t.id)===String(cur)))s.value=cur;}
  function selectPageBank(){document.querySelectorAll('#hoa85BankList [data-bank-check]').forEach(c=>{c.checked=true;const key=String(c.dataset.bankCheck);state.bankSelected.add(key);const row=state.bank.find(x=>String(x.question_bank_id||x.id)===key);if(row)state.bankSelectedData.set(key,row);});$('hoa85BankSelected').textContent=`${state.bankSelected.size} selected`;}

  async function signedMediaUrl(path){if(!path)return null;const c=db();if(!c?.storage)return null;try{const r=await c.storage.from(BUCKET).createSignedUrl(path,3600);return r.data?.signedUrl||null}catch(_){return null}}
  async function wireMediaControl(prefix,path,ids,onChange){
    const input=$(ids.path),file=$(ids.file),preview=$(ids.preview),remove=$(ids.remove),upload=$(ids.upload);if(!input)return;
    const paint=async()=>{if(!preview)return;const p=input.value||'';if(!p){preview.innerHTML='<span class="hoa85-media-empty">No image selected.</span>';return}const url=await signedMediaUrl(p);preview.innerHTML=url?`<img src="${esc(url)}" alt="Question media preview" loading="lazy">`:`<span class="hoa85-media-empty">Preview unavailable</span>`;};
    if(file&&!file.dataset.bound){file.dataset.bound='1';file.onchange=async()=>{const f=file.files?.[0];if(!f)return;try{const newPath=await uploadImage(f);input.value=newPath;onChange?.(newPath);await paint();notify('Image uploaded. Save the question to commit the new reference.','ok');}catch(e){notify(e.message||'Image upload failed.','error')}finally{file.value='';}}}
    if(upload&&!upload.dataset.bound){upload.dataset.bound='1';upload.onclick=()=>file?.click();}
    if(remove&&!remove.dataset.bound){remove.dataset.bound='1';remove.onclick=()=>{input.value='';onChange?.(null);paint();notify('Image reference removed. Save the question to commit.','ok');};}
    await paint();
  }
  function openQuestionEditor(id){const q=state.bank.find(x=>String(x.question_bank_id||x.id)===String(id))||state.bankSelectedData.get(String(id));if(!q)return;const meta=bankToMeta(q);$('hoa85QEditChip').textContent='EDITING';const root=$('hoa85QuestionEditor');root.classList.remove('hidden');root.innerHTML=`<div class="hoa85-edit-grid"><label>Question Type<select id="qeditType"><option value="mcq" ${meta.question_type==='mcq'?'selected':''}>MCQ</option><option value="numerical" ${meta.question_type==='numerical'?'selected':''}>Numerical</option></select></label><label>Source (I:)<input id="qeditSource" value="${esc(meta.source)}"></label><label class="wide">Question<textarea id="qeditText" rows="4">${esc(meta.question_text)}</textarea></label><label class="wide">Question Image<input id="qeditQImage" type="hidden" value="${esc(meta.question_image_path||'')}"><div class="hoa85-media-actions"><button type="button" class="hoa85-btn small" id="qeditQImageUpload">UPLOAD / REPLACE</button><button type="button" class="hoa85-btn small danger" id="qeditQImageRemove">REMOVE</button><input id="qeditQImageFile" class="hidden" type="file" accept="image/png,image/jpeg,image/webp,image/gif"></div><div id="qeditQImagePreview" class="hoa85-media-preview"></div></label><div class="wide" id="qeditOptions"></div><label class="wide">Explanation<textarea id="qeditExp" rows="4">${esc(meta.explanation_text)}</textarea></label><label class="wide">Explanation Image<input id="qeditExpImage" type="hidden" value="${esc(meta.explanation_image_path||'')}"><div class="hoa85-media-actions"><button type="button" class="hoa85-btn small" id="qeditExpImageUpload">UPLOAD / REPLACE</button><button type="button" class="hoa85-btn small danger" id="qeditExpImageRemove">REMOVE</button><input id="qeditExpImageFile" class="hidden" type="file" accept="image/png,image/jpeg,image/webp,image/gif"></div><div id="qeditExpImagePreview" class="hoa85-media-preview"></div></label></div><div class="hoa85-actions"><button class="hoa85-btn primary" id="qeditSave">SAVE QUESTION</button><button class="hoa85-btn" id="qeditClose">CLOSE</button></div><div id="qeditMsg" class="hoa85-status"></div>`;renderQuestionEditorFields(meta);$('qeditType').onchange=()=>renderQuestionEditorFields(meta);$('qeditSave').onclick=()=>saveQuestionEditor(q,meta);$('qeditClose').onclick=()=>{$('hoa85QuestionEditor').classList.add('hidden');$('hoa85QEditChip').textContent='NO QUESTION';};wireMediaControl('qimg',meta.question_image_path,{path:'qeditQImage',file:'qeditQImageFile',preview:'qeditQImagePreview',upload:'qeditQImageUpload',remove:'qeditQImageRemove'},p=>{meta.question_image_path=p;});wireMediaControl('eimg',meta.explanation_image_path,{path:'qeditExpImage',file:'qeditExpImageFile',preview:'qeditExpImagePreview',upload:'qeditExpImageUpload',remove:'qeditExpImageRemove'},p=>{meta.explanation_image_path=p;});}
  function renderQuestionEditorFields(meta){const box=$('qeditOptions');if(!box)return;if(meta.question_type==='numerical'){box.innerHTML=`<div class="hoa85-num-grid"><label>Correct Value<input id="qeditCorrectValue" value="${esc(meta.correct_value??'')}" type="number" step="any"></label><label>Tolerance<input id="qeditTolerance" value="${esc(meta.tolerance??'')}" type="number" min="0" step="any"></label></div>`;return}const opts=Array.from({length:Math.max(2,Math.min(10,meta.options.length||4))},(_,i)=>meta.options[i]||{text:'',image:null});box.innerHTML='<div class="hoa85-option-label">Options (2–10)</div>'+opts.map((o,i)=>`<div class="hoa85-option-row"><span>${i+1}.</span><input data-qopt="${i}" value="${esc(o.text||'')}" placeholder="Option ${i+1}"><input id="qeditOptImg_${i}" data-qoptimg="${i}" type="hidden" value="${esc(o.image||'')}"><button type="button" class="hoa85-btn small" id="qeditOptUpload_${i}">UPLOAD / REPLACE</button><button type="button" class="hoa85-btn small danger" id="qeditOptRemove_${i}">REMOVE</button><input id="qeditOptFile_${i}" class="hidden" type="file" accept="image/png,image/jpeg,image/webp,image/gif"><div id="qeditOptPreview_${i}" class="hoa85-media-preview compact"></div></div>`).join('')+`<label>Correct Answer<input id="qeditCorrect" value="${esc(meta.correct_answer||'')}" placeholder="1–10 or A–J"></label><button type="button" class="hoa85-btn small" id="qeditAddOpt">＋ Add Option</button>`;$('qeditAddOpt').onclick=()=>{if(meta.options.length>=10){notify('Maximum 10 options are allowed.','error');return;}meta.options.push({text:'',image:null});renderQuestionEditorFields(meta)};opts.forEach((o,i)=>wireMediaControl('o'+i,o.image,{path:`qeditOptImg_${i}`,file:`qeditOptFile_${i}`,preview:`qeditOptPreview_${i}`,upload:`qeditOptUpload_${i}`,remove:`qeditOptRemove_${i}`}));}
  async function saveQuestionEditor(row,meta){try{await requireAdmin('tests.manage');meta.question_type=$('qeditType').value;meta.source=$('qeditSource').value;meta.question_text=$('qeditText').value;meta.question_image_path=$('qeditQImage').value||null;meta.explanation_text=$('qeditExp').value;meta.explanation_image_path=$('qeditExpImage').value||null;if(meta.question_type==='numerical'){meta.correct_value=Number($('qeditCorrectValue').value);meta.tolerance=$('qeditTolerance').value===''?null:Number($('qeditTolerance').value);meta.correct_answer=0;meta.options=[];}else{meta.options=[...document.querySelectorAll('[data-qopt]')].map((e,i)=>({text:e.value,image:document.getElementById(`qeditOptImg_${i}`)?.value||null}));meta.correct_answer=normaliseAnswer($('qeditCorrect').value);meta.correct_value=null;meta.tolerance=null;}const item={question_type:meta.question_type,source:meta.source||null,question_text:meta.question_text||'',options_json:meta.options,question_image_path:meta.question_image_path,correct_option:meta.question_type==='mcq'?meta.correct_answer:null,correct_value:meta.question_type==='numerical'?meta.correct_value:null,tolerance:meta.question_type==='numerical'?meta.tolerance:null,explanation_text:meta.explanation_text||'',explanation_image_path:meta.explanation_image_path};const r=await db().rpc('hoa_admin_question_bank_update',{p_id:meta.question_bank_id||row.question_bank_id,p_item:item});if(r.error)throw r.error;notify('Question Bank question updated.','ok');if(state.editingTestId){state.currentQuestions=await fetchTestQuestions(state.editingTestId);renderEditorQuestionSummary();}await fetchQuestionBank();renderBank();const info=r.data||{};if(info.skipped_historical_tests)notify(`Question updated in bank. ${info.skipped_historical_tests} historical test copy/copies were preserved unchanged.`,'warn');window.dispatchEvent(new CustomEvent('hoa:question-bank-changed',{detail:{questionBankId:meta.question_bank_id||row.question_bank_id}}));}catch(e){status('qeditMsg',e.message,'error')}}
  async function deleteBankQuestion(id){try{await requireAdmin('tests.manage');const q=state.bank.find(x=>String(x.question_bank_id||x.id)===String(id))||state.bankSelectedData.get(String(id));if(!q)return;if(!confirm('Remove this question from the Master Question Bank? Existing Mock Tests will keep their own compatible question copy.'))return;const bankId=q.question_bank_id||q.id;if(!bankId)throw new Error('Question Bank identity is missing.');const r=await db().rpc('hoa_admin_question_bank_delete',{p_id:bankId});if(r.error)throw r.error;state.bankSelected.delete(String(id));state.bankSelectedData.delete(String(id));notify('Question removed from Question Bank; existing tests were preserved.','ok');await fetchQuestionBank();await fetchTests();renderBank();renderTestData();window.dispatchEvent(new CustomEvent('hoa:question-bank-changed',{detail:{deletedQuestionBankId:bankId}}));}catch(e){notify(e.message||'Could not delete Question Bank item.','error')}}



  function renderFeedEditor(){if(!state.currentQuestions.length&&state.editingTestId)return loadSelectedFeedTest();state.feed=state.currentQuestions.map(normaliseQuestion);renderFeedPreview();}
  window.hoaV89OpenMockBuilder=function(opts={}){startNewTest([],opts);openTab('tests');renderEditorQuestionSummary();};
  function openFeedBuilder(opts={}){state.editingTestId=null;state.creationContext=opts.returnTo==='freecontent'||state.creationContext==='freecontent'?'freecontent':null;const intendedAccess=state.creationContext==='freecontent'?'free':'paid';state.builderDefaults={...opts,access:intendedAccess,returnTo:state.creationContext};state.currentQuestions=[];state.feed=[];state.feedPage=1;state.pasteImagesParsed=false;closeAcceptedQuestionsPreview();openTab('feed');setFeedExistingConfigLocked(false);if($('hoa85FeedTarget'))$('hoa85FeedTarget').value='';if($('hoa85FeedTitle'))$('hoa85FeedTitle').value='';if($('hoa85FeedDesc'))$('hoa85FeedDesc').value='';if($('hoa85FeedDuration'))$('hoa85FeedDuration').value='10';if($('hoa85FeedMarks'))$('hoa85FeedMarks').value='1';if($('hoa85FeedNegative'))$('hoa85FeedNegative').value='0.25';if($('hoa85FeedAccess'))$('hoa85FeedAccess').value=intendedAccess;if($('hoa85FeedTestType'))$('hoa85FeedTestType').value=opts.type||'subject';if($('hoa85FeedPublished'))$('hoa85FeedPublished').checked=false;if($('hoa85FeedShowResults'))$('hoa85FeedShowResults').checked=true;if($('hoa85FeedBatch'))$('hoa85FeedBatch').value=state.creationContext==='freecontent'?'':(opts.batchId||'');if($('hoa85FeedFolder'))$('hoa85FeedFolder').value=state.creationContext==='freecontent'?'':(opts.folderId||'');applyAccessPolicy();syncFeedAccessFields();updateFeedTargets();loadFeedFolders();renderFeedPreview();}
  window.hoaV89OpenQuestionFeeder=function(opts={}){openFeedBuilder(opts);};

  function replaceLegacyHandlers(){
    window.showCreator=function(){openTab('feed');};
    window.ensureMockWorkspace=function(){return $('hoaV89MockWorkspace')||renderShell();};
    window.hoaV89EditTest=function(id){editTest(id);};
  }
  function resetToPaidWorkspace(){const wasFree=state.creationContext==='freecontent';state.creationContext=null;state.builderDefaults=null;if(wasFree){state.editingTestId=null;state.currentQuestions=[];state.feed=[];state.feedPage=1;state.dirty=false;clearFeed({confirmUser:false});$('hoa85TestEditorCard')?.classList.add('hidden');if($('hoa85TestTitle'))$('hoa85TestTitle').value='';if($('hoa85FeedTarget'))$('hoa85FeedTarget').value='';if($('hoa85FeedTitle'))$('hoa85FeedTitle').value='';}applyAccessPolicy();syncEditorAccessFields();updateFeedTargets();}
  window.addEventListener('hoa:admin-section-ready',event=>{if(event?.detail?.section==='test'){resetToPaidWorkspace();loadAll({bank:false}).catch(e=>notify(e.message||'Paid Mock Tests could not be refreshed.','error'));}});

  window.HOA_ADMIN_MOCK_V89={
    openTab,
    openBuilder:window.hoaV89OpenMockBuilder,
    openQuestionFeeder:window.hoaV89OpenQuestionFeeder,
    resetToPaidWorkspace,
    refresh:loadAll
  };

  function start(){
    replaceLegacyHandlers();
    // Do not observe document.body. The Admin Runtime mounts this workspace explicitly
    // when Mock Tests is selected, avoiding global mutation churn and duplicate boot.
    window.hoaV89MountMockWorkspace=()=>{
      if(!isAdmin())return null;
      const root=renderShell();
      try{window.dispatchEvent(new CustomEvent('hoa:mock-workspace-ready',{detail:{version:'V8.90'}}));}catch(_){}
      return root;
    };
    window.hoaV89RefreshMockTests=loadAll;
    window.addEventListener('hoa:question-bank-changed',()=>{if(state.mounted)loadAll({bank:true});});
  }
  start();
})();
