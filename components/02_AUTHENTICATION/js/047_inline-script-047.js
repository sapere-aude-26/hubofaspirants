
(function(){
'use strict';
const esc=window.escapeHTML||function(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));};
const css=`
.hoa-v70-free-modal{position:fixed;inset:0;z-index:999999;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(15,23,42,.62)}
.hoa-v70-free-modal.show{display:flex}.hoa-v70-free-card{width:min(980px,100%);max-height:92vh;overflow:auto;background:#fff;border-radius:18px;box-shadow:0 25px 80px rgba(15,23,42,.25);padding:22px}.hoa-v70-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.hoa-v70-head h2{margin:0;color:#173f6b}.hoa-v70-close{border:0;background:#eef4fb;border-radius:10px;width:38px;height:38px;font-size:22px;cursor:pointer}.hoa-v70-form{display:grid;grid-template-columns:1fr 1fr;gap:12px}.hoa-v70-form label{font-weight:700;font-size:13px;color:#334155}.hoa-v70-form input,.hoa-v70-form select,.hoa-v70-form textarea{width:100%;box-sizing:border-box;margin-top:5px;padding:10px;border:1px solid #cbd5e1;border-radius:9px}.hoa-v70-wide{grid-column:1/-1}.hoa-v70-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}.hoa-v70-content-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-top:15px}.hoa-v70-content-item{border:1px solid #dbe5f0;border-radius:13px;padding:14px;background:#fbfdff}.hoa-v70-content-item h4{margin:5px 0}.hoa-v70-type{font-size:11px;font-weight:800;color:#2563eb;text-transform:uppercase}.hoa-v70-admin-panel{margin-top:14px}.hoa-v70-table{width:100%;border-collapse:collapse}.hoa-v70-table th,.hoa-v70-table td{padding:9px;border-bottom:1px solid #e2e8f0;text-align:left;font-size:12px}.hoa-v70-table th{background:#f5f9fd}.hoa-v70-exam-question{padding:16px;border:1px solid #dbe5f0;border-radius:12px;margin-top:12px}.hoa-v70-exam-options{display:grid;gap:8px;margin-top:12px}.hoa-v70-exam-options button{text-align:left;padding:11px;border:1px solid #cbd5e1;background:#fff;border-radius:9px;cursor:pointer}.hoa-v70-exam-options button.selected{border-color:#2563eb;background:#eff6ff}.hoa-v70-result-box{padding:18px;border-radius:14px;background:#f7fbff;border:1px solid #dbeafe;margin-top:15px}.hoa-v70-stat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:9px;margin:12px 0}.hoa-v70-stat{padding:12px;border:1px solid #dbe5f0;border-radius:10px;background:#fff}.hoa-v70-stat b{display:block;font-size:20px;color:#173f6b}.hoa-v70-mini{font-size:11px;color:#64748b}.hoa-v70-progress{height:8px;border-radius:99px;background:#e2e8f0;overflow:hidden}.hoa-v70-progress span{display:block;height:100%;background:#2563eb}.hoa-v70-pdf{font-family:Arial,sans-serif;padding:28px;color:#172033}.hoa-v70-pdf h1{color:#173f6b}.hoa-v70-pdf table{width:100%;border-collapse:collapse;margin-top:18px}.hoa-v70-pdf th,.hoa-v70-pdf td{border:1px solid #cbd5e1;padding:7px;font-size:12px}.hoa-v70-pdf th{background:#eef4fb}@media(max-width:700px){.hoa-v70-form{grid-template-columns:1fr}.hoa-v70-card{padding:15px}}
`;
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);

function ensureFreeModal(){
 let m=document.getElementById('hoaV70FreeModal'); if(m)return m;
 m=document.createElement('div');m.id='hoaV70FreeModal';m.className='hoa-v70-free-modal';
 m.innerHTML=`<div class="hoa-v70-free-card"><div class="hoa-v70-head"><div><div class="hoa-v648-kicker">FREE CONTENT</div><h2 id="hoaV70Title">Free Content</h2></div><button class="hoa-v70-close" onclick="hoaV70Close()">×</button></div><div id="hoaV70Body"></div></div>`;
 document.body.appendChild(m);return m;
}
function close(){document.getElementById('hoaV70FreeModal')?.classList.remove('show')}
window.hoaV70Close=close;window.hoaCloseFreeContent=close;
async function rpc(name,args){if(typeof supabaseClient==='undefined'||!supabaseClient)throw new Error('Supabase is not ready.');const {data,error}=await supabaseClient.rpc(name,args);if(error)throw error;return data;}
function getToken(){return localStorage.getItem('hoa_free_access_token')||''}
function setToken(t){localStorage.setItem('hoa_free_access_token',t)}

async function loadFreeContent(){
 const token=getToken(); if(!token)return showFreeLogin();
 try{const items=await rpc('hoa_free_content_list',{p_token:token});renderFreeItems(Array.isArray(items)?items:[])}catch(e){localStorage.removeItem('hoa_free_access_token');showFreeLogin();}
}
function showFreeLogin(msg){
 const m=ensureFreeModal();m.classList.add('show');
 document.getElementById('hoaV70Title').textContent='Free Content Access';
 document.getElementById('hoaV70Body').innerHTML=`<p style="color:#64748b">Register once. On future visits, your mobile number will identify your Free Content profile. OTP is not used at this stage.</p>${msg?`<div style="color:#b42318;margin-bottom:10px">${esc(msg)}</div>`:''}<div class="hoa-v70-form"><label class="hoa-v70-wide">Mobile Number *<input id="hoaV70Mobile" inputmode="numeric" maxlength="10" placeholder="10-digit mobile number"></label><div id="hoaV70NewFields" class="hoa-v70-wide" style="display:none"><div class="hoa-v70-form"><label>Name *<input id="hoaV70Name"></label><label>Email *<input id="hoaV70Email" type="email"></label><label>Preparing For *<input id="hoaV70Preparing"></label><label>College Name *<input id="hoaV70College"></label><label>Pass Out Year *<input id="hoaV70Year" inputmode="numeric" maxlength="4"></label></div></div></div><div class="hoa-v70-actions"><button class="primary" id="hoaV70Continue">CONTINUE</button></div><div id="hoaV70Msg" class="hoa-v70-mini"></div>`;
 const msgEl=()=>document.getElementById('hoaV70Msg');
 const continueBtn=document.getElementById('hoaV70Continue');
 continueBtn.onclick=async()=>{
   const mobile=document.getElementById('hoaV70Mobile').value.replace(/\D/g,'');
   if(mobile.length!==10){msgEl().textContent='Enter a valid 10-digit mobile number.';return;}
   try{
     const data=await rpc('hoa_free_profile_enter',{p_mobile:mobile});
     setToken(data.access_token);await loadFreeContent();return;
   }catch(e){
     if(!String(e.message||e).includes('REGISTRATION_REQUIRED')){msgEl().textContent=String(e.message||e);return;}
   }
   document.getElementById('hoaV70NewFields').style.display='block';
   msgEl().textContent='New user: complete the registration fields.';
   continueBtn.onclick=async()=>{
     const req={p_mobile:mobile,p_full_name:document.getElementById('hoaV70Name').value.trim(),p_email:document.getElementById('hoaV70Email').value.trim(),p_preparing_for:document.getElementById('hoaV70Preparing').value.trim(),p_college_name:document.getElementById('hoaV70College').value.trim(),p_passout_year:Number(document.getElementById('hoaV70Year').value)};
     if(!req.p_full_name||!req.p_email||!req.p_preparing_for||!req.p_college_name||!Number.isInteger(req.p_passout_year)){msgEl().textContent='Please complete every required field.';return;}
     try{const d=await rpc('hoa_free_profile_enter',req);setToken(d.access_token);await loadFreeContent();}
     catch(err){msgEl().textContent=String(err.message||err);}
   };
 };
}
function renderFreeItems(items){const m=ensureFreeModal();m.classList.add('show');document.getElementById('hoaV70Title').textContent='Free Content';document.getElementById('hoaV70Body').innerHTML=`<div class="hoa-v70-actions"><button class="secondary" onclick="localStorage.removeItem('hoa_free_access_token');hoaV70Open()">Switch Mobile</button></div>${items.length?`<div class="hoa-v70-content-grid">${items.map(x=>`<article class="hoa-v70-content-item"><span class="hoa-v70-type">${esc(x.content_type)}</span><h4>${esc(x.title)}</h4><p class="hoa-v70-mini">${esc(x.description||'')}</p><button class="primary" onclick="hoaV70OpenItem('${x.id}')">OPEN</button></article>`).join('')}</div>`:'<div class="emptyState">No free content is published yet.</div>'}`}
window.hoaV70Open=loadFreeContent;
window.hoaOpenFreeContent=loadFreeContent;
async function openItem(id){const token=getToken();const items=await rpc('hoa_free_content_list',{p_token:token});const x=(items||[]).find(i=>String(i.id)===String(id));if(!x)return;if(x.content_type==='test'){return startFreeTest(x.test_id,x.id)}await rpc('hoa_free_content_activity',{p_token:token,p_content_id:id,p_activity_type:'open'}).catch(()=>{});const url=x.url||x.file_url;if(url){window.open(url,'_blank','noopener,noreferrer')}else{alert(x.description||'Content link is not available.')}}
window.hoaV70OpenItem=openItem;

let freeExam=null;
async function startFreeTest(testId,contentId){try{const d=await rpc('hoa_free_test_start',{p_token:getToken(),p_test_id:testId});freeExam={...d,contentId,answers:Array(d.questions.length).fill(null),current:0,startedAt:Date.now(),timer:Number(d.test.duration_minutes||10)*60};renderFreeExam()}catch(e){alert('Unable to start this free test: '+(e.message||e))}}
function renderFreeExam(){const m=ensureFreeModal();m.classList.add('show');const q=freeExam.questions[freeExam.current];document.getElementById('hoaV70Title').textContent=freeExam.test.title;document.getElementById('hoaV70Body').innerHTML=`<div class="hoa-v70-mini">Question ${freeExam.current+1} of ${freeExam.questions.length} • Time left: <b id="hoaV70Timer"></b></div><div class="hoa-v70-exam-question"><b>${esc(q.question_text)}</b><div class="hoa-v70-exam-options">${[1,2,3,4].map(i=>`<button class="${freeExam.answers[freeExam.current]===i?'selected':''}" onclick="hoaV70Answer(${i})">${String.fromCharCode(64+i)}. ${esc(q['option_'+i])}</button>`).join('')}</div></div><div class="hoa-v70-actions"><button class="secondary" onclick="hoaV70Prev()" ${freeExam.current?'':'disabled'}>Previous</button><button class="primary" onclick="hoaV70Next()">${freeExam.current===freeExam.questions.length-1?'Submit':'Next'}</button></div>`;updateFreeTimer()}
function updateFreeTimer(){if(!freeExam)return;const left=Math.max(0,freeExam.timer-Math.floor((Date.now()-freeExam.startedAt)/1000));const el=document.getElementById('hoaV70Timer');if(el)el.textContent=Math.floor(left/60)+':'+String(left%60).padStart(2,'0');if(left<=0){submitFreeTest();return}clearTimeout(freeExam.timerHandle);freeExam.timerHandle=setTimeout(updateFreeTimer,500)}
window.hoaV70Answer=i=>{if(freeExam)freeExam.answers[freeExam.current]=i;renderFreeExam()};window.hoaV70Prev=()=>{if(freeExam&&freeExam.current>0){freeExam.current--;renderFreeExam()}};window.hoaV70Next=()=>{if(!freeExam)return;if(freeExam.current<freeExam.questions.length-1){freeExam.current++;renderFreeExam()}else submitFreeTest()};
async function submitFreeTest(){if(!freeExam)return;clearTimeout(freeExam.timerHandle);const elapsed=Math.round((Date.now()-freeExam.startedAt)/1000);try{const r=await rpc('hoa_free_test_submit',{p_token:getToken(),p_attempt_id:freeExam.attempt_id,p_answers:freeExam.answers,p_elapsed_seconds:elapsed});document.getElementById('hoaV70Title').textContent='Free Test Result';document.getElementById('hoaV70Body').innerHTML=`<div class="hoa-v70-result-box"><h3 style="margin-top:0">${esc(freeExam.test.title)}</h3><div class="hoa-v70-stat-grid"><div class="hoa-v70-stat"><b>${Number(r.score||0).toFixed(2)}</b>Score</div><div class="hoa-v70-stat"><b>${Number(r.percentage||0).toFixed(2)}%</b>Percentage</div><div class="hoa-v70-stat"><b>${r.correct||0}</b>Correct</div><div class="hoa-v70-stat"><b>${r.wrong||0}</b>Wrong</div><div class="hoa-v70-stat"><b>${r.skipped||0}</b>Skipped</div></div></div><div class="hoa-v70-actions"><button class="primary" onclick="hoaV70Open()">BACK TO FREE CONTENT</button></div>`;freeExam=null}catch(e){alert('Result could not be saved: '+(e.message||e))}}

let hoaV70EditId=null;
function ensureAdminPanel(){
 const nav=document.querySelector('.adminSectionNav');const dash=document.getElementById('adminOnlyDashboard');if(!nav||!dash)return null;
 if(!document.getElementById('adminNavFreeContent')){const b=document.createElement('button');b.id='adminNavFreeContent';b.textContent='🎁 Free Content';b.onclick=()=>window.showAdminSection('freecontent');nav.appendChild(b)}
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
 <hr style="margin:20px 0;border:0;border-top:1px solid #e2e8f0">
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
async function loadAdmin(){const p=ensureAdminPanel();if(!p||(typeof adminLoggedIn==='undefined'||adminLoggedIn!==true))return;try{const items=await rpc('hoa_admin_free_content_list');const sel=document.getElementById('hoaV70AdminTest');const ts=await supabaseClient.from('tests').select('id,title').order('created_at',{ascending:false});sel.innerHTML='<option value="">None</option>'+(ts.data||[]).map(t=>`<option value="${t.id}">${esc(t.title)}</option>`).join('');document.getElementById('hoaV70FreeCount').textContent=(items||[]).length;document.getElementById('hoaV70AdminList').innerHTML=(items||[]).length?`<table class="hoa-v70-table"><thead><tr><th>Title</th><th>Type</th><th>Published</th><th>Action</th></tr></thead><tbody>${items.map(x=>`<tr><td>${esc(x.title)}</td><td>${esc(x.content_type)}</td><td>${x.is_published?'YES':'NO'}</td><td><div class="hoa-v70-row-actions"><button class="secondary" onclick="hoaV70PreviewContent('${x.id}')">Preview</button><button class="secondary" onclick="hoaV70EditContent('${x.id}')">Edit</button><button class="secondary hoa-v70-danger" onclick="hoaV70DeleteContent('${x.id}')">Delete</button></div></td></tr>`).join('')}</tbody></table>`:'<div class="emptyState">No Free Content created.</div>';const ps=await rpc('hoa_admin_free_student_list');document.getElementById('hoaV70Profiles').innerHTML=Array.isArray(ps)&&ps.length?`<table class="hoa-v70-table"><thead><tr><th>Name</th><th>Mobile</th><th>Email</th><th>Preparing For</th><th>College</th><th>Year</th><th>Address</th><th>Action</th></tr></thead><tbody>${ps.map(x=>`<tr><td>${esc(x.full_name)}</td><td>${esc(x.mobile)}</td><td>${esc(x.email||'')}</td><td>${esc(x.preparing_for||'')}</td><td>${esc(x.college_name||'')}</td><td>${x.passout_year||''}</td><td>${esc(x.address||'')}</td><td><button class="secondary hoa-v70-delete-student" onclick="hoaV70DeleteFreeStudent('${x.id}')">Delete</button></td></tr>`).join('')}</tbody></table>`:'<div class="emptyState">No Free Content participants.</div>';const fr=await rpc('hoa_admin_free_test_results');let frbox=document.getElementById('hoaV70FreeResults');if(!frbox){frbox=document.createElement('div');frbox.id='hoaV70FreeResults';frbox.style.marginTop='18px';document.getElementById('hoaV70Profiles').parentElement.appendChild(frbox)}frbox.innerHTML='<h3>Free Test Results</h3>'+(fr?.length?`<div class="hoa-v70-actions"><button class="secondary" onclick="hoaV70PrintFreeResults()">⬇ Download Result PDF</button></div><table class="hoa-v70-table"><thead><tr><th>Name</th><th>Mobile</th><th>Test</th><th>Score</th><th>%</th><th>Date</th></tr></thead><tbody>${fr.map(x=>`<tr><td>${esc(x.full_name)}</td><td>${esc(x.mobile)}</td><td>${esc(x.test_title)}</td><td>${Number(x.score||0).toFixed(2)}</td><td>${Number(x.percentage||0).toFixed(2)}%</td><td>${esc(formatAdminDate(x.submitted_at))}</td></tr>`).join('')}</tbody></table>`:'<div class="emptyState">No completed Free Test results.</div>')}catch(e){document.getElementById('hoaV70AdminMsg').textContent=String(e.message||e)}}
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
 const test=document.getElementById('hoaV70TestField'),url=document.getElementById('hoaV70UrlField'),file=document.getElementById('hoaV70FileField');
 if(test)test.style.display=type==='test'?'flex':'none';
 if(url)url.style.display=type==='test'?'none':'flex';
 if(file)file.style.display=(type==='pdf'||type==='note'||type==='video')?'flex':'flex';
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
 else if((type==='pdf'||type==='note')&&file) media=`<iframe class="hoa-v70-preview-document" src="${esc(file)}" title="Document preview"></iframe>`;
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
function printWindow(title,body){const w=window.open('','_blank','width=1000,height=800');if(!w)return;w.document.write(`<html><head><title>${esc(title)}</title><style>body{font-family:Arial;padding:28px;color:#172033}h1{color:#173f6b}table{width:100%;border-collapse:collapse}th,td{border:1px solid #cbd5e1;padding:7px;font-size:12px}th{background:#eef4fb}</style>
</head><body>${body}
</body></html>`);w.document.close();w.focus();setTimeout(()=>w.print(),300)}





window.hoaV70PrintFreeResults=async function(){try{const rows=await rpc('hoa_admin_free_test_results');if(!rows?.length){alert('No Free Test results available.');return}const body=`<h1>HUB OF ASPIRANTS</h1><h2>Free Test Results</h2><table><thead><tr><th>Rank</th><th>Name</th><th>Mobile</th><th>College</th><th>Test</th><th>Score</th><th>%</th><th>Pass Out</th></tr></thead><tbody>${rows.map((x,i)=>`<tr><td>${i+1}</td><td>${esc(x.full_name)}</td><td>${esc(x.mobile)}</td><td>${esc(x.college_name)}</td><td>${esc(x.test_title)}</td><td>${Number(x.score||0).toFixed(2)}</td><td>${Number(x.percentage||0).toFixed(2)}%</td><td>${x.passout_year}</td></tr>`).join('')}</tbody></table>`;printWindow('HOA Free Test Results',body)}catch(e){alert('Could not generate result PDF: '+(e.message||e))}};
window.hoaV70PrintTestWise=function(topOnly){const key=document.getElementById('testWiseTestSelect')?.value||'';if(!key){alert('Select a test first.');return}let rows=resultRows.filter(r=>String(r.testId||r.title||'')===key);rows.sort((a,b)=>pct(b)-pct(a));const n=document.getElementById('hoaV70TopN')?.value||'10';if(topOnly&&n!=='all')rows=rows.slice(0,Number(n));if(!rows.length){alert('No results for this test.');return}const title=rows[0].title||'Test Result';const body=`<h1>HUB OF ASPIRANTS</h1><h2>${esc(title)}</h2><p>Result / ${topOnly?'Topper List':'Complete Result'}</p><table><thead><tr><th>Rank</th><th>Candidate</th><th>Email</th><th>Score</th><th>Percentage</th></tr></thead><tbody>${rows.map((r,i)=>`<tr><td>${i+1}</td><td>${esc(r.userName||'Candidate')}</td><td>${esc(r.email||'')}</td><td>${score(r).toFixed(2)} / ${maxMarks(r).toFixed(2)}</td><td>${pct(r).toFixed(2)}%</td></tr>`).join('')}</tbody></table>`;printWindow(title,body)};

function enhanceTestWise(){addResultButtons();const old=window.renderTestWiseResults;window.renderTestWiseResults=function(){if(typeof old==='function')old();const box=document.getElementById('testWiseTable');const key=document.getElementById('testWiseTestSelect')?.value||'';if(!box||!key)return;let rows=resultRows.filter(r=>String(r.testId||r.title||'')===key);const date=document.getElementById('testWiseDate')?.value||'';if(date)rows=rows.filter(r=>String(r.date||'').slice(0,10)===date);rows.sort((a,b)=>pct(b)-pct(a));if(!rows.length)return;box.querySelector('tbody')?.replaceChildren(...rows.map((r,i)=>{const tr=document.createElement('tr');tr.innerHTML=`<td>${i+1}</td><td>${esc(r.userName||'Candidate')}</td><td>${esc(r.email||'')}</td><td><b>${score(r).toFixed(2)}</b> / ${maxMarks(r).toFixed(2)}</td><td>${pct(r).toFixed(2)}%</td>`;return tr}))};}

function addStudentProgress(){const p=document.getElementById('candidateSectionResultPanel');if(!p||document.getElementById('hoaV70StudentProgress'))return;const d=document.createElement('div');d.id='hoaV70StudentProgress';d.className='dashPanel';d.style.marginTop='12px';d.innerHTML='<h3>📈 My Progress</h3><div id="hoaV70StudentProgressBody" class="hoa-v70-stat-grid"></div>';p.appendChild(d)}
function renderStudentProgress(){addStudentProgress();const body=document.getElementById('hoaV70StudentProgressBody');if(!body)return;const active=(typeof currentStudent!=='undefined'&&currentStudent)?currentStudent:null;const email=String(active?.email||'').toLowerCase();const rows=(window.__hoaStudentResultRows||[]);const mine=rows.filter(r=>!email||String(r.email||'').toLowerCase()===email);const ps=mine.map(r=>pct(r));const avg=ps.length?ps.reduce((a,b)=>a+b,0)/ps.length:0;const best=ps.length?Math.max(...ps):0;body.innerHTML=`<div class="hoa-v70-stat"><b>${mine.length}</b>Tests Attempted</div><div class="hoa-v70-stat"><b>${best.toFixed(1)}%</b>Best Score</div><div class="hoa-v70-stat"><b>${avg.toFixed(1)}%</b>Average</div><div class="hoa-v70-stat"><b>${ps.length>1?(ps[ps.length-1]-ps[0]).toFixed(1):'0.0'}%</b>Change</div>`}


function addAdminProgress(){const panel=document.getElementById('adminSectionResultPanel');if(!panel||document.getElementById('hoaV70AdminProgress'))return;const d=document.createElement('div');d.id='hoaV70AdminProgress';d.className='testWisePanel';d.style.marginTop='14px';d.innerHTML='<h3 style="margin:0">📈 Student Progress</h3><p class="hoa-v70-mini">Select a student to view attempt history and performance.</p><div class="testWiseToolbar"><select id="hoaV70ProgressStudent"><option value="">Select Student</option></select></div><div id="hoaV70ProgressBody"></div>';panel.querySelector('.dashPanel')?.appendChild(d)}
function renderAdminProgress(){addAdminProgress();const sel=document.getElementById('hoaV70ProgressStudent'),body=document.getElementById('hoaV70ProgressBody');if(!sel||!body)return;const map=new Map();resultRows.forEach(r=>{const id=r.userId||r.student_id;if(id&&!map.has(id))map.set(id,r.userName||r.name||'Candidate')});const cur=sel.value;sel.innerHTML='<option value="">Select Student</option>'+[...map.entries()].sort((a,b)=>a[1].localeCompare(b[1])).map(([id,n])=>`<option value="${esc(id)}">${esc(n)}</option>`).join('');if(cur)sel.value=cur;const id=sel.value;if(!id){body.innerHTML='';return}const rows=resultRows.filter(r=>String(r.userId||r.student_id)===String(id)&&r.status==='completed').sort((a,b)=>new Date(a.date)-new Date(b.date));const ps=rows.map(pct);const avg=ps.length?ps.reduce((a,b)=>a+b,0)/ps.length:0;const best=ps.length?Math.max(...ps):0;body.innerHTML=`<div class="hoa-v70-stat-grid"><div class="hoa-v70-stat"><b>${rows.length}</b>Attempts</div><div class="hoa-v70-stat"><b>${best.toFixed(1)}%</b>Best</div><div class="hoa-v70-stat"><b>${avg.toFixed(1)}%</b>Average</div></div>${rows.length?`<table class="hoa-v70-table"><thead><tr><th>Date</th><th>Test</th><th>Score</th><th>Percentage</th><th>Time</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(formatAdminDate(r.date))}</td><td>${esc(r.title)}</td><td>${score(r).toFixed(2)} / ${maxMarks(r).toFixed(2)}</td><td>${pct(r).toFixed(2)}%</td><td>${esc(formatAdminTime(r.timeTaken))}</td></tr>`).join('')}</tbody></table>`:'<div class="emptyState">No completed attempts.</div>'}`}

const oldShow=window.showAdminSection;window.showAdminSection=async function(section){ensureAdminPanel();const p=document.getElementById('adminSectionFreeContentPanel');if(p){p.classList.toggle('active',section==='freecontent');p.style.display=section==='freecontent'?'block':'none'}if(section==='freecontent'){document.querySelectorAll('.adminSectionPanel').forEach(x=>{if(x.id!=='adminSectionFreeContentPanel')x.classList.remove('active')});document.querySelectorAll('.adminSectionNav button').forEach(x=>x.classList.remove('active'));document.getElementById('adminNavFreeContent')?.classList.add('active');return loadAdmin()}const out=oldShow?await oldShow(section):undefined;if(section==='result'){addAdminProgress();setTimeout(renderAdminProgress,0)}return out};


const oldAdminAttempt=window.viewAdminAttempt;
window.viewAdminAttempt=async function(index){try{const r=(window.__adminFilteredResults||[])[index];if(r&&r.id&&typeof supabaseClient!=='undefined'&&supabaseClient){const a=await supabaseClient.from('attempts').select('question_snapshot,scoring_snapshot').eq('id',r.id).maybeSingle();if(a.data?.question_snapshot){r.questions=a.data.question_snapshot;r.scoring_snapshot=a.data.scoring_snapshot||null;saveHistoricalAttemptDetail(r.id,{questions:a.data.question_snapshot,answers:r.answers||[],testTitle:r.title,testId:r.testId,marksPerCorrect:r.marks,negativeMarks:r.negativeMarks,maxMarks:r.maxMarks});}}}catch(e){console.warn('Snapshot read fallback:',e)}return oldAdminAttempt?oldAdminAttempt(index):undefined};
const oldStudentAttempt=window.viewStudentAttempt;
window.viewStudentAttempt=async function(attemptId){try{if(typeof supabaseClient!=='undefined'&&supabaseClient&&attemptId){const a=await supabaseClient.from('attempts').select('question_snapshot,scoring_snapshot').eq('id',attemptId).maybeSingle();if(a.data?.question_snapshot){const rows=typeof getResults==='function'?getResults()||[]:[];const r=rows.find(x=>String(x.id)===String(attemptId));saveHistoricalAttemptDetail(attemptId,{questions:a.data.question_snapshot,answers:r?.answers||[],testTitle:r?.title,testId:r?.testId,marksPerCorrect:r?.marks,negativeMarks:r?.negativeMarks,maxMarks:r?.maxMarks});}}}catch(e){console.warn('Student snapshot read fallback:',e)}return oldStudentAttempt?oldStudentAttempt(attemptId):undefined};
// Improve authoritative Admin result loader with snapshot-aware data and explicit status.
const oldLoadAdminResults=window.loadAdminResultsFromSupabase;window.loadAdminResultsFromSupabase=async function(){const r=oldLoadAdminResults?await oldLoadAdminResults():[];try{(r||[]).forEach(x=>{if(x.question_snapshot&&!x.questions)x.questions=x.question_snapshot;});}catch(_){}return r};

// Wrap candidate result renderer to calculate progress from the actual rows it loads.

const oldCandidateSection=window.showCandidateSection;
window.showCandidateSection=async function(section){const out=oldCandidateSection?await oldCandidateSection(section):undefined;if(section==='result'){try{window.__hoaStudentResultRows=typeof getResults==='function'?getResults()||[]:[];renderStudentProgress()}catch(_){} }return out};
const oldRenderCandidate=window.renderCandidateResults; if(oldRenderCandidate){window.renderCandidateResults=async function(){const out=await oldRenderCandidate.apply(this,arguments);try{window.__hoaStudentResultRows=typeof getResults==='function'?getResults()||[]:[];renderStudentProgress()}catch(_){}return out}}

window.hoaV70Boot=function(){ensureAdminPanel();enhanceTestWise();addStudentProgress()};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',window.hoaV70Boot);else setTimeout(window.hoaV70Boot,0);
setTimeout(()=>{try{ensureAdminPanel();enhanceTestWise()}catch(_){}},1500);
})();

