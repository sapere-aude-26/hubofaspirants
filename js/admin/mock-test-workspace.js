/* HOA V6.1.0 — Feature-separated JavaScript module.
   Original inline script #72 (id: hoa-v610-mock-admin-workspace).
   Execution position intentionally preserved from V6.0.9. */


(function(){
  'use strict';
  const V='V6.1.0';
  const $=id=>document.getElementById(id);
  const db=()=>window.supabaseClient||window.supabase||null;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const isAdmin=()=>typeof window.isAdminMode==='function'?window.isAdminMode():Boolean(typeof adminLoggedIn!=='undefined'&&adminLoggedIn===true&&typeof currentStudent!=='undefined'&&!currentStudent);
  const state={tab:'batches',batchId:'',batches:[],folders:[],bank:[],bankLoaded:false,targetTestId:'',editingQuestion:-1};
  let installed=false;

  function msg(id,text,type){const e=$(id);if(!e)return;e.textContent=text||'';e.className='hoa610-status '+(type||'')}
  function ensureAdmin(){return isAdmin();}
  async function uid(){const c=db();if(!c)throw Error('Supabase is not connected.');const s=await c.auth.getSession();if(s.error||!s.data?.session?.user)throw Error('Admin session required.');return s.data.session.user.id}
  function activePage(){return state.tab==='batches'?$('hoaV610BatchPage'):state.tab==='questions'?$('hoaV610QuestionPage'):null}

  function install(){
    if(installed)return;
    const host=$('adminSectionTestPanel');if(!host)return;
    installed=true;
    const legacy=host.querySelector('.adminGrid');
    const oldTestLibrary=$('testLibrary');
    const oldCreator=$('creatorPanel');
    const w=document.createElement('section');w.id='hoaV610MockWorkspace';w.className='hoa610-shell';
    w.innerHTML=`
      <div class="hoa610-head"><div><h2>Mock Test Management</h2><p>Manage Mock Test batches and folders separately from question feeding, test building and the question bank.</p></div><span class="hoa610-chip">V6.1.0 • BATCH + QUESTION WORKSPACE</span></div>
      <div class="hoa610-tabs" role="tablist">
        <button type="button" class="hoa610-tab active" data-hoa610-tab="batches">📦 Batch Management</button>
        <button type="button" class="hoa610-tab" data-hoa610-tab="questions">📝 Questions &amp; Tests</button>
      </div>
      <section id="hoaV610BatchPage" class="hoa610-page active"></section>
      <section id="hoaV610QuestionPage" class="hoa610-page"></section>`;
    host.insertBefore(w,host.firstChild);
    if(legacy)legacy.style.display='none';
    buildBatchPage();
    buildQuestionPage(oldTestLibrary,oldCreator);
    w.querySelectorAll('[data-hoa610-tab]').forEach(b=>b.addEventListener('click',()=>openTab(b.dataset.hoa610Tab)));
    refreshAll();
  }

  function openTab(tab){
    state.tab=tab==='questions'?'questions':'batches';
    document.querySelectorAll('#hoaV610MockWorkspace .hoa610-tab').forEach(b=>b.classList.toggle('active',b.dataset.hoa610Tab===state.tab));
    document.querySelectorAll('#hoaV610MockWorkspace .hoa610-page').forEach(p=>p.classList.toggle('active',p.id===(state.tab==='batches'?'hoaV610BatchPage':'hoaV610QuestionPage')));
    if(state.tab==='batches')loadBatches();else{loadBank();refreshTests();}
  }
  window.hoaV610OpenMockTab=openTab;

  function buildBatchPage(){
    $('hoaV610BatchPage').innerHTML=`
      <div class="hoa610-statbar">
        <div class="hoa610-stat"><b id="hoaV610BatchCount">0</b><span>Mock Batches</span></div>
        <div class="hoa610-stat"><b id="hoaV610FolderCount">0</b><span>Active Folders</span></div>
        <div class="hoa610-stat"><b id="hoaV610TestCount">0</b><span>Assigned Tests</span></div>
        <div class="hoa610-stat"><b id="hoaV610ArchivedCount">0</b><span>Archived Batches</span></div>
      </div>
      <div class="hoa610-section">
        <div class="hoa610-section-head"><div><h3>Mock Test Batches</h3><p>Create, edit, publish, archive and safely delete Mock Test batches. Archive is the normal retirement action.</p></div><div class="hoa610-actions" style="margin-top:0"><button type="button" class="hoa610-btn" id="hoaV610RefreshBatches">↻ Refresh</button><button type="button" class="hoa610-btn primary" id="hoaV610NewBatch">＋ New Batch</button></div></div>
        <div id="hoaV610BatchList" class="hoa610-list"></div>
      </div>
      <div class="hoa610-section" id="hoaV610BatchEditorSection">
        <div class="hoa610-section-head"><div><h3 id="hoaV610BatchEditorTitle">Create Mock Test Batch</h3><p>Batch is the top-level container for Subject-wise and Full-Length mock folders.</p></div><span class="hoa610-chip" id="hoaV610SelectedBatchLabel">NEW BATCH</span></div>
        <div class="hoa610-grid three">
          <label class="hoa610-field">Batch Name<input id="hoaV610BatchName" maxlength="150" placeholder="Civil Engineering Mock Tests"></label>
          <label class="hoa610-field">Batch Code<input id="hoaV610BatchCode" maxlength="60" placeholder="CIV-MOCK-26"></label>
          <label class="hoa610-field">Status<select id="hoaV610BatchStatus"><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label>
          <label class="hoa610-field hoa610-wide">Description<textarea id="hoaV610BatchDescription" rows="2" maxlength="500" placeholder="Short description shown to students"></textarea></label>
        </div>
        <div class="hoa610-actions"><button type="button" class="hoa610-btn primary" id="hoaV610SaveBatch">SAVE BATCH</button><button type="button" class="hoa610-btn" id="hoaV610ClearBatch">CLEAR</button><span id="hoaV610BatchMsg" class="hoa610-status"></span></div>
      </div>
      <div class="hoa610-section" id="hoaV610FolderSection">
        <div class="hoa610-section-head"><div><h3>Folders inside selected batch</h3><p>Create Subject-wise Mock or Full-Length Mock folders. Rename or archive folders without changing the database structure.</p></div><span class="hoa610-chip" id="hoaV610FolderBatchLabel">SELECT A BATCH</span></div>
        <div class="hoa610-grid three">
          <label class="hoa610-field">Folder Type<select id="hoaV610FolderType"><option value="subject">Subject-wise Mock</option><option value="full_length">Full-Length Mock</option></select></label>
          <label class="hoa610-field">Folder Name<input id="hoaV610FolderName" maxlength="150" placeholder="Highway Engineering"></label>
          <div class="hoa610-actions" style="align-items:end"><button type="button" class="hoa610-btn primary" id="hoaV610SaveFolder">＋ CREATE FOLDER</button><button type="button" class="hoa610-btn" id="hoaV610ClearFolder">CLEAR</button></div>
        </div>
        <div class="hoa610-actions"><span id="hoaV610FolderMsg" class="hoa610-status"></span></div>
        <div id="hoaV610FolderList" class="hoa610-list"></div>
      </div>`;
    $('hoaV610RefreshBatches').onclick=loadBatches;$('hoaV610NewBatch').onclick=()=>clearBatchEditor();$('hoaV610SaveBatch').onclick=saveBatch;$('hoaV610ClearBatch').onclick=clearBatchEditor;$('hoaV610SaveFolder').onclick=saveFolder;$('hoaV610ClearFolder').onclick=clearFolderEditor;
  }

  function buildQuestionPage(oldLibrary,oldCreator){
    $('hoaV610QuestionPage').innerHTML=`
      <div class="hoa610-section"><div class="hoa610-section-head"><div><h3>Question Feeding &amp; Test Management</h3><p>Use the existing CSV/paste importer, preview questions, edit an existing mock test, build a test from the question bank, and save through the existing production test bundle workflow.</p></div><span class="hoa610-chip">QUESTIONS • TESTS • BANK</span></div>
        <div class="hoa610-actions"><button type="button" class="hoa610-btn primary" id="hoaV610OpenCreator">＋ New / Import Test</button><button type="button" class="hoa610-btn" id="hoaV610RefreshTests">↻ Refresh Test Library</button><span id="hoaV610TestMsg" class="hoa610-status"></span></div>
      </div>
      <div class="hoa610-section"><div class="hoa610-section-head"><div><h3>Test Library</h3><p>Edit test metadata/questions, preview a test, publish/unpublish or change its access type.</p></div></div><div id="hoaV610TestLibraryHost"></div></div>
      <div class="hoa610-section"><div class="hoa610-section-head"><div><h3>Question Bank</h3><p>This bank is derived from the existing protected <code>questions</code> table. It does not introduce a new table. Select questions from existing tests and add them to the current test.</p></div></div>
        <div class="hoa610-searchbar"><input id="hoaV610BankSearch" placeholder="Search question text / option / explanation"><select id="hoaV610BankTest"><option value="">All source tests</option></select><button type="button" class="hoa610-btn" id="hoaV610LoadBank">LOAD</button><button type="button" class="hoa610-btn gold" id="hoaV610AddSelected">＋ ADD SELECTED TO CURRENT TEST</button></div>
        <div id="hoaV610BankStatus" class="hoa610-note"></div><div id="hoaV610BankList" class="hoa610-list"></div>
      </div>
      <div class="hoa610-section"><div class="hoa610-section-head"><div><h3>Current Test Question Editor</h3><p>Edit, remove, reorder and preview questions currently loaded in the existing Test Creator.</p></div><span id="hoaV610CurrentTestLabel" class="hoa610-chip">NO TEST SELECTED</span></div>
        <div id="hoaV610BuilderSummary" class="hoa610-builder-summary"><span><b>0</b> questions loaded</span><span>Open a test from the library or create/import a new one.</span></div>
        <div class="hoa610-actions" style="margin-top:0;margin-bottom:10px"><button type="button" class="hoa610-btn" id="hoaV610AddBlankQuestion">＋ ADD BLANK QUESTION</button></div><div id="hoaV610BuilderList" class="hoa610-builder-list"></div>
      </div>
      <div class="hoa610-section" id="hoaV610LegacyCreatorHost"><div class="hoa610-section-head"><div><h3>Test Creator / CSV Import</h3><p>The existing production creator remains authoritative; this workspace only reorganizes access to it.</p></div></div></div>`;
    const host=$('hoaV610TestLibraryHost');if(oldLibrary)host.appendChild(oldLibrary);
    const creatorHost=$('hoaV610LegacyCreatorHost');if(oldCreator)creatorHost.appendChild(oldCreator);
    if(oldCreator)oldCreator.style.display='block';
    $('hoaV610OpenCreator').onclick=()=>{$('hoaV610LegacyCreatorHost')?.scrollIntoView({behavior:'smooth',block:'start'});if(typeof window.showCreator==='function')window.showCreator()};
    $('hoaV610RefreshTests').onclick=refreshTests;
    $('hoaV610LoadBank').onclick=loadBank;
    $('hoaV610BankSearch').oninput=renderBank;
    $('hoaV610BankTest').onchange=renderBank;
    $('hoaV610AddSelected').onclick=addSelectedToCurrentTest;$('hoaV610AddBlankQuestion').onclick=addBlankQuestion;
  }

  function clearBatchEditor(){state.batchId='';$('hoaV610BatchEditorTitle').textContent='Create Mock Test Batch';$('hoaV610SelectedBatchLabel').textContent='NEW BATCH';$('hoaV610BatchName').value='';$('hoaV610BatchCode').value='';$('hoaV610BatchDescription').value='';$('hoaV610BatchStatus').value='draft';$('hoaV610FolderBatchLabel').textContent='SELECT A BATCH';$('hoaV610FolderList').innerHTML='<div class="hoa610-empty">Select or create a batch to manage its folders.</div>';clearFolderEditor();msg('hoaV610BatchMsg','')}
  function clearFolderEditor(){state.folderId='';$('hoaV610FolderName').value='';$('hoaV610FolderType').value='subject';$('hoaV610SaveFolder').textContent='＋ CREATE FOLDER';msg('hoaV610FolderMsg','')}

  async function loadBatches(){if(!ensureAdmin())return;const c=db();if(!c)return;try{const r=await c.from('test_batches').select('*').order('sort_order').order('created_at',{ascending:false});if(r.error)throw r.error;state.batches=r.data||[];renderBatches();const active=state.batches.find(x=>String(x.id)===String(state.batchId));if(active)await selectBatch(active.id);else if(state.batches[0])await selectBatch(state.batches[0].id);else clearBatchEditor();}catch(e){msg('hoaV610BatchMsg',e.message||'Could not load batches.','error')}}
  function renderBatches(){const list=$('hoaV610BatchList');if(!list)return;const rows=state.batches;const archived=rows.filter(x=>x.status==='archived').length;$('hoaV610BatchCount').textContent=rows.length;$('hoaV610ArchivedCount').textContent=archived;list.innerHTML=rows.length?rows.map(x=>`<article class="hoa610-card"><div class="hoa610-card-head"><div><div class="hoa610-card-title">${esc(x.name)} <span class="hoa610-badge ${x.status==='published'?'published':x.status==='archived'?'archived':'draft'}">${esc(String(x.status||'draft').toUpperCase())}</span></div><div class="hoa610-card-meta">${x.batch_code?esc(x.batch_code)+' · ':''}${esc(x.description||'No description')}</div></div><div class="hoa610-card-actions"><button type="button" class="hoa610-btn small" data-batch-edit="${esc(x.id)}">EDIT</button><button type="button" class="hoa610-btn small" data-batch-select="${esc(x.id)}">MANAGE FOLDERS</button>${x.status==='archived'?'<button type="button" class="hoa610-btn small" data-batch-restore="'+esc(x.id)+'">RESTORE</button>':'<button type="button" class="hoa610-btn small" data-batch-archive="'+esc(x.id)+'">ARCHIVE</button>'}<button type="button" class="hoa610-btn small danger" data-batch-delete="${esc(x.id)}">DELETE</button></div></div></article>`).join(''):'<div class="hoa610-empty">No Mock Test batches exist yet.</div>';
    list.querySelectorAll('[data-batch-edit]').forEach(b=>b.onclick=()=>selectBatch(b.dataset.batchEdit));list.querySelectorAll('[data-batch-select]').forEach(b=>b.onclick=()=>selectBatch(b.dataset.batchSelect));list.querySelectorAll('[data-batch-archive]').forEach(b=>b.onclick=()=>setBatchStatus(b.dataset.batchArchive,'archived'));list.querySelectorAll('[data-batch-restore]').forEach(b=>b.onclick=()=>setBatchStatus(b.dataset.batchRestore,'draft'));list.querySelectorAll('[data-batch-delete]').forEach(b=>b.onclick=()=>deleteBatch(b.dataset.batchDelete));}

  async function selectBatch(id){const row=state.batches.find(x=>String(x.id)===String(id));if(!row)return;state.batchId=row.id;$('hoaV610BatchEditorTitle').textContent='Edit Mock Test Batch';$('hoaV610SelectedBatchLabel').textContent=row.name;$('hoaV610FolderBatchLabel').textContent=row.name;$('hoaV610BatchName').value=row.name||'';$('hoaV610BatchCode').value=row.batch_code||'';$('hoaV610BatchDescription').value=row.description||'';$('hoaV610BatchStatus').value=row.status||'draft';await loadFolders();}
  async function saveBatch(){if(!ensureAdmin())return;const name=$('hoaV610BatchName').value.trim();if(!name){msg('hoaV610BatchMsg','Batch name is required.','error');return}try{const c=db(),id=state.batchId||null,payload={name,batch_code:$('hoaV610BatchCode').value.trim()||null,description:$('hoaV610BatchDescription').value.trim()||null,status:$('hoaV610BatchStatus').value,is_published:$('hoaV610BatchStatus').value==='published',updated_at:new Date().toISOString()};let r;if(id)r=await c.from('test_batches').update(payload).eq('id',id);else r=await c.from('test_batches').insert({...payload,sort_order:0,created_by:await uid()}).select().single();if(r.error)throw r.error;if(r.data?.id)state.batchId=r.data.id;msg('hoaV610BatchMsg',id?'Batch updated successfully.':'Mock Test batch created successfully.','ok');await loadBatches();}catch(e){msg('hoaV610BatchMsg',e.message||'Could not save batch.','error')}}
  async function setBatchStatus(id,statusValue){if(!ensureAdmin())return;if(statusValue==='archived'&&!confirm('Archive this Mock Test Batch? Students will no longer see it as published. Existing tests and folders remain stored.'))return;try{const r=await db().from('test_batches').update({status:statusValue,is_published:statusValue==='published',updated_at:new Date().toISOString()}).eq('id',id);if(r.error)throw r.error;await loadBatches();}catch(e){alert(e.message||'Could not update batch status.')}}
  async function deleteBatch(id){if(!ensureAdmin())return;const row=state.batches.find(x=>String(x.id)===String(id));if(!row)return;if(!confirm('Delete this Mock Test Batch permanently? This is allowed only when it has no folders, test assignments or student access records. Otherwise the batch will need to be archived.'))return;try{const c=db();const [f,a,sa]=await Promise.all([c.from('test_batch_folders').select('id',{count:'exact',head:true}).eq('test_batch_id',id),c.from('test_batch_test_assignments').select('test_id',{count:'exact',head:true}).eq('test_batch_id',id),c.from('student_test_batch_access').select('id',{count:'exact',head:true}).eq('test_batch_id',id)]);for(const r of [f,a,sa])if(r.error)throw r.error;const deps=(f.count||0)+(a.count||0)+(sa.count||0);if(deps){alert('This batch still has '+deps+' dependent record(s). Use ARCHIVE instead of DELETE. No data was removed.');return}const r=await c.from('test_batches').delete().eq('id',id);if(r.error)throw r.error;state.batchId='';await loadBatches();msg('hoaV610BatchMsg','Batch deleted.','ok');}catch(e){alert(e.message||'Could not delete batch.')}}

  async function loadFolders(){if(!state.batchId){$('hoaV610FolderList').innerHTML='<div class="hoa610-empty">Select a batch to manage folders.</div>';return}try{const r=await db().from('test_batch_folders').select('*').eq('test_batch_id',state.batchId).order('folder_type').order('sort_order').order('name');if(r.error)throw r.error;state.folders=r.data||[];$('hoaV610FolderCount').textContent=state.folders.filter(x=>x.is_active).length;renderFolders();}catch(e){msg('hoaV610FolderMsg',e.message||'Could not load folders.','error')}}
  function renderFolders(){const list=$('hoaV610FolderList');const rows=state.folders;if(!rows.length){list.innerHTML='<div class="hoa610-empty">No folders in this batch yet. Create a Subject-wise or Full-Length folder.</div>';return}list.innerHTML=rows.map(x=>`<article class="hoa610-card"><div class="hoa610-card-head"><div><div class="hoa610-card-title">📁 ${esc(x.name)} <span class="hoa610-badge ${x.folder_type==='full_length'?'full':'subject'}">${x.folder_type==='full_length'?'FULL-LENGTH':'SUBJECT-WISE'}</span> ${x.is_active?'':'<span class="hoa610-badge archived">ARCHIVED</span>'}</div><div class="hoa610-card-meta">Sort order: ${esc(x.sort_order??0)}</div></div><div class="hoa610-card-actions">${x.is_active?'<button type="button" class="hoa610-btn small" data-folder-edit="'+esc(x.id)+'">EDIT</button><button type="button" class="hoa610-btn small" data-folder-archive="'+esc(x.id)+'">ARCHIVE</button>':'<button type="button" class="hoa610-btn small" data-folder-restore="'+esc(x.id)+'">RESTORE</button>'}<button type="button" class="hoa610-btn small danger" data-folder-delete="${esc(x.id)}">DELETE</button></div></div></article>`).join('');list.querySelectorAll('[data-folder-edit]').forEach(b=>b.onclick=()=>editFolder(b.dataset.folderEdit));list.querySelectorAll('[data-folder-archive]').forEach(b=>b.onclick=()=>archiveFolder(b.dataset.folderArchive));list.querySelectorAll('[data-folder-restore]').forEach(b=>b.onclick=()=>restoreFolder(b.dataset.folderRestore));list.querySelectorAll('[data-folder-delete]').forEach(b=>b.onclick=()=>deleteFolder(b.dataset.folderDelete));}
  function editFolder(id){const row=state.folders.find(x=>String(x.id)===String(id));if(!row)return;state.folderId=row.id;$('hoaV610FolderName').value=row.name||'';$('hoaV610FolderType').value=row.folder_type||'subject';$('hoaV610SaveFolder').textContent='SAVE FOLDER CHANGES';$('hoaV610FolderName').focus()}
  async function saveFolder(){if(!ensureAdmin())return;if(!state.batchId){msg('hoaV610FolderMsg','Select a batch first.','error');return}const name=$('hoaV610FolderName').value.trim();if(!name){msg('hoaV610FolderMsg','Folder name is required.','error');return}try{const payload={name,folder_type:$('hoaV610FolderType').value,updated_at:new Date().toISOString()};let r;if(state.folderId)r=await db().from('test_batch_folders').update(payload).eq('id',state.folderId);else r=await db().from('test_batch_folders').insert({...payload,test_batch_id:state.batchId,sort_order:0,is_active:true,created_by:await uid()}).select().single();if(r.error)throw r.error;msg('hoaV610FolderMsg',state.folderId?'Folder updated successfully.':'Folder created successfully.','ok');clearFolderEditor();await loadFolders();}catch(e){msg('hoaV610FolderMsg',e.message||'Could not save folder.','error')}}
  async function archiveFolder(id){if(!confirm('Archive this folder? Existing tests remain stored.'))return;try{const r=await db().from('test_batch_folders').update({is_active:false,updated_at:new Date().toISOString()}).eq('id',id);if(r.error)throw r.error;await loadFolders()}catch(e){alert(e.message||'Could not archive folder.')}}
  async function restoreFolder(id){try{const r=await db().from('test_batch_folders').update({is_active:true,updated_at:new Date().toISOString()}).eq('id',id);if(r.error)throw r.error;await loadFolders()}catch(e){alert(e.message||'Could not restore folder.')}}
  async function deleteFolder(id){if(!confirm('Delete this folder permanently? This is allowed only when no tests or assignment records reference it.'))return;try{const c=db();const [t,a]=await Promise.all([c.from('tests').select('id',{count:'exact',head:true}).eq('test_batch_folder_id',id),c.from('test_batch_test_assignments').select('test_id',{count:'exact',head:true}).eq('test_batch_folder_id',id)]);for(const r of [t,a])if(r.error)throw r.error;const deps=(t.count||0)+(a.count||0);if(deps){alert('This folder still has '+deps+' dependent test record(s). Archive it instead. No data was removed.');return}const r=await c.from('test_batch_folders').delete().eq('id',id);if(r.error)throw r.error;await loadFolders();}catch(e){alert(e.message||'Could not delete folder.')}}

  async function refreshTests(){if(!isAdmin())return;try{if(typeof window.loadTestsFromSupabase==='function')await window.loadTestsFromSupabase();if(typeof window.renderLibrary==='function')window.renderLibrary();renderCurrentBuilder();populateBankTestFilter();renderBank();}catch(e){console.warn(V+' test refresh',e)}}
  function decorateTestLibrary(){const old=$('testLibrary');if(!old)return;const rows=Array.isArray(tests)?tests:[];if(!rows.length){old.innerHTML='<div class="hoa610-empty">No mock tests saved yet.</div>';return}old.className='hoa610-list';old.innerHTML=rows.map(t=>`<article class="hoa610-card"><div class="hoa610-card-head"><div><div class="hoa610-card-title">📝 ${esc(t.title)} <span class="hoa610-badge ${t.is_published?'published':'draft'}">${t.is_published?'PUBLISHED':'DRAFT'}</span><span class="hoa610-badge ${t.accessType==='free'?'subject':'full'}">${t.accessType==='free'?'FREE':'PAID'}</span></div><div class="hoa610-card-meta">${t.questions?.length||0} questions · ${esc(t.duration||10)} min · ${t.test_batch_id?'Batch assigned':'No batch'}${t.test_batch_folder_id?' · Folder assigned':''}</div></div><div class="hoa610-card-actions"><button type="button" class="hoa610-btn small" data-test-edit="${esc(t.id)}">EDIT</button><button type="button" class="hoa610-btn small" data-test-preview="${esc(t.id)}">PREVIEW</button><button type="button" class="hoa610-btn small" data-test-publish="${esc(t.id)}">${t.is_published?'UNPUBLISH':'PUBLISH'}</button><button type="button" class="hoa610-btn small danger" data-test-delete="${esc(t.id)}">DELETE</button></div></div></article>`).join('');old.querySelectorAll('[data-test-edit]').forEach(b=>b.onclick=()=>editTest(b.dataset.testEdit));old.querySelectorAll('[data-test-preview]').forEach(b=>b.onclick=()=>previewTest(b.dataset.testPreview));old.querySelectorAll('[data-test-publish]').forEach(b=>b.onclick=()=>toggleTestPublish(b.dataset.testPublish));old.querySelectorAll('[data-test-delete]').forEach(b=>b.onclick=()=>deleteTestSafe(b.dataset.testDelete));}
  function editTest(id){if(typeof window.hoaV606EditTest==='function'){window.hoaV606EditTest(id);state.targetTestId=id;setTimeout(renderCurrentBuilder,80);$('hoaV610CurrentTestLabel').textContent='EDITING TEST';$('hoaV610LegacyCreatorHost')?.scrollIntoView({behavior:'smooth',block:'start'});}}
  async function previewTest(id){if(typeof window.startSavedTest==='function')window.startSavedTest(id);}
  async function toggleTestPublish(id){if(!ensureAdmin())return;const t=(tests||[]).find(x=>String(x.id)===String(id));if(!t)return;try{const r=await db().from('tests').update({is_published:!t.is_published,updated_at:new Date().toISOString()}).eq('id',id);if(r.error)throw r.error;await refreshTests();}catch(e){alert(e.message||'Could not update test.')}}
  async function deleteTestSafe(id){if(typeof window.deleteTest==='function'){await window.deleteTest(id);await refreshTests();}else{alert('Existing test deletion function is unavailable.')}}

  function populateBankTestFilter(){const sel=$('hoaV610BankTest');if(!sel)return;const cur=sel.value;sel.innerHTML='<option value="">All source tests</option>'+(Array.isArray(tests)?tests.map(t=>`<option value="${esc(t.id)}">${esc(t.title)}</option>`).join(''):'');if(cur&&Array.from(sel.options).some(o=>o.value===cur))sel.value=cur}
  async function loadBank(){if(!ensureAdmin())return;const c=db();if(!c)return;msg('hoaV610BankStatus','Loading question bank…');try{const r=await c.from('questions').select('id,test_id,question_text,option_1,option_2,option_3,option_4,correct_option,explanation,question_order').order('created_at',{ascending:false}).limit(1000);if(r.error)throw r.error;state.bank=r.data||[];state.bankLoaded=true;msg('hoaV610BankStatus',state.bank.length+' questions loaded.');populateBankTestFilter();renderBank();}catch(e){msg('hoaV610BankStatus',e.message||'Could not load question bank.','error')}}
  function renderBank(){const list=$('hoaV610BankList');if(!list)return;const q=(($('hoaV610BankSearch')?.value||'').trim().toLowerCase());const tid=$('hoaV610BankTest')?.value||'';const rows=state.bank.filter(x=>!tid||String(x.test_id)===String(tid)).filter(x=>{if(!q)return true;return [x.question_text,x.option_1,x.option_2,x.option_3,x.option_4,x.explanation].join(' ').toLowerCase().includes(q)});if(!rows.length){list.innerHTML='<div class="hoa610-empty">No questions match the current filter.</div>';return}list.innerHTML=rows.map(x=>`<article class="hoa610-qcard"><div class="hoa610-qtop"><label><input type="checkbox" data-bank-q="${esc(x.id)}"> <span class="hoa610-note">Select</span></label><span class="hoa610-chip">Q${esc(x.question_order||'')}</span></div><div class="hoa610-qtext">${esc(x.question_text)}</div><div class="hoa610-qopts">${[1,2,3,4].map(i=>`<div class="hoa610-qopt ${Number(x.correct_option)===i?'correct':''}">${String.fromCharCode(64+i)}. ${esc(x['option_'+i])}${Number(x.correct_option)===i?' ✓':''}</div>`).join('')}</div>${x.explanation?`<div class="hoa610-qexp">${esc(x.explanation)}</div>`:''}<div class="hoa610-note" style="margin-top:7px">Source test: ${esc((tests||[]).find(t=>String(t.id)===String(x.test_id))?.title||x.test_id)}</div></article>`).join('')}
  function addSelectedToCurrentTest(){if(!ensureAdmin())return;const ids=[...document.querySelectorAll('#hoaV610BankList [data-bank-q]:checked')].map(x=>x.dataset.bankQ);if(!ids.length){msg('hoaV610BankStatus','Select at least one question.','error');return}if(!Array.isArray(questions)){msg('hoaV610BankStatus','Current Test Creator question state is unavailable.','error');return}const existing=new Set(questions.map(q=>q.__id).filter(Boolean).map(String));let added=0;ids.forEach(id=>{if(existing.has(String(id)))return;const x=state.bank.find(q=>String(q.id)===String(id));if(!x)return;const a=[x.question_text,x.option_1,x.option_2,x.option_3,x.option_4,Number(x.correct_option),x.explanation||''];Object.defineProperty(a,'__id',{value:x.id,enumerable:false,writable:true});questions.push(a);added++});renderCurrentBuilder();if(typeof window.renderCSVPreview==='function')window.renderCSVPreview();msg('hoaV610BankStatus',added+' question(s) added to the current Test Creator. Click SAVE AS DRAFT / SAVE CHANGES to persist them.','ok')}

  function renderCurrentBuilder(){const list=$('hoaV610BuilderList'),sum=$('hoaV610BuilderSummary');if(!list||!sum)return;const qs=Array.isArray(questions)?questions:[];$('hoaV610CurrentTestLabel').textContent=state.targetTestId?'EDITING EXISTING TEST':'CURRENT TEST / NEW TEST';sum.innerHTML='<span><b>'+qs.length+'</b> question'+(qs.length===1?'':'s')+' loaded</span><span>Changes are held in the existing Test Creator until saved.</span>';if(!qs.length){list.innerHTML='<div class="hoa610-empty">No questions loaded. Import CSV, open an existing test, or add questions from the bank.</div>';return}list.innerHTML=qs.map((q,i)=>`<article class="hoa610-builder-row"><div class="hoa610-builder-no">${i+1}</div><div><div class="hoa610-builder-q">${esc(q[0])}</div><div class="hoa610-note">A. ${esc(q[1])} · B. ${esc(q[2])} · C. ${esc(q[3])} · D. ${esc(q[4])} · Correct: ${esc(q[5])}</div><div id="hoaV610EditBox_${i}"></div></div><div class="hoa610-builder-actions"><button type="button" class="hoa610-btn small" data-q-edit="${i}">EDIT</button><button type="button" class="hoa610-btn small danger" data-q-delete="${i}">REMOVE</button></div></article>`).join('');list.querySelectorAll('[data-q-edit]').forEach(b=>b.onclick=()=>toggleQuestionEditor(Number(b.dataset.qEdit)));list.querySelectorAll('[data-q-delete]').forEach(b=>b.onclick=()=>removeQuestion(Number(b.dataset.qDelete)));}
  function toggleQuestionEditor(index){const host=$('hoaV610EditBox_'+index);if(!host)return;if(host.innerHTML){host.innerHTML='';return}const q=questions[index]||[];host.innerHTML=`<div class="hoa610-edit"><div class="hoa610-edit-grid"><textarea class="wide" data-e="q" rows="3">${esc(q[0]||'')}</textarea><input data-e="a" value="${esc(q[1]||'')}" placeholder="Option A"><input data-e="b" value="${esc(q[2]||'')}" placeholder="Option B"><input data-e="c" value="${esc(q[3]||'')}" placeholder="Option C"><input data-e="d" value="${esc(q[4]||'')}" placeholder="Option D"><input data-e="correct" type="number" min="1" max="4" value="${esc(q[5]||1)}" placeholder="Correct option"><textarea class="wide" data-e="exp" rows="2" placeholder="Explanation">${esc(q[6]||'')}</textarea></div><div class="hoa610-actions"><button type="button" class="hoa610-btn primary" data-save-q>UPDATE QUESTION</button><button type="button" class="hoa610-btn" data-cancel-q>CANCEL</button></div></div>`;host.querySelector('[data-cancel-q]').onclick=()=>host.innerHTML='';host.querySelector('[data-save-q]').onclick=()=>{const v=k=>host.querySelector('[data-e="'+k+'"]')?.value||'';const correct=Math.max(1,Math.min(4,Number(v('correct'))||1));q[0]=v('q').trim();q[1]=v('a').trim();q[2]=v('b').trim();q[3]=v('c').trim();q[4]=v('d').trim();q[5]=correct;q[6]=v('exp').trim();renderCurrentBuilder();if(typeof window.renderCSVPreview==='function')window.renderCSVPreview()};}
  function removeQuestion(index){if(!confirm('Remove this question from the current test? The database is not changed until you save the test.'))return;questions.splice(index,1);renderCurrentBuilder();if(typeof window.renderCSVPreview==='function')window.renderCSVPreview()}
  function addBlankQuestion(){if(!ensureAdmin())return;if(!Array.isArray(questions))return;questions.push(['New question','','','','',1,'']);renderCurrentBuilder();const i=questions.length-1;setTimeout(()=>toggleQuestionEditor(i),0);if(typeof window.renderCSVPreview==='function')window.renderCSVPreview()}

  function decorateAfterRender(){decorateTestLibrary();renderCurrentBuilder();populateBankTestFilter();}
  function refreshAll(){loadBatches();refreshTests();}
  window.hoaV610RefreshMockWorkspace=refreshAll;

  const oldRenderLibrary=window.renderLibrary;
  if(typeof oldRenderLibrary==='function'){
    window.renderLibrary=function(){const r=oldRenderLibrary.apply(this,arguments);setTimeout(decorateAfterRender,0);return r};
  }
  const oldShow=window.showAdminSection;
  if(typeof oldShow==='function'&&!oldShow.__hoaV610){
    const wrapped=async function(section){const r=await oldShow.apply(this,arguments);if(section==='test'){install();setTimeout(()=>{loadBatches();refreshTests()},0)}return r};
    wrapped.__hoaV610=true;window.showAdminSection=wrapped;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{install()}, {once:true});else install();
})();
