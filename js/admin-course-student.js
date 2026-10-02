/* HOA V6.1.0 — Feature-separated JavaScript module.
   Original inline script #64 (id: hoa-v614-course-video-workspaces).
   Execution position intentionally preserved from V6.0.9. */


(function(){
'use strict';
const $=id=>document.getElementById(id), db=()=>window.supabaseClient||window.supabase||null;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const adminOK=()=>typeof window.isAdminMode==='function'?window.isAdminMode():Boolean(window.adminLoggedIn===true&&window.currentStudent==null);
const msg=(id,t,e=false)=>{const x=$(id);if(x){x.textContent=t||'';x.classList.toggle('error',!!e)}};
const fmt=d=>d?new Date(d).toLocaleString():'';
async function uid(){const c=db();const s=await c.auth.getSession();if(s.error||!s.data?.session?.user)throw new Error('Admin session required.');return s.data.session.user.id}
function modal(title,body){const old=$('hoa614Modal');if(old)old.remove();const d=document.createElement('div');d.id='hoa614Modal';d.className='hoa606-modal';d.innerHTML='<div class="hoa606-modal-card"><h3>'+esc(title)+'</h3>'+body+'</div>';d.addEventListener('click',e=>{if(e.target===d)d.remove()});document.body.appendChild(d);return d}
function hideLegacy(host){if(!host)return;Array.from(host.children).forEach(x=>{if(!x.dataset.hoa614Keep)x.style.display='none'})}
function courseShell(){const host=$('adminSectionCoursePanel');if(!host)return null;let s=$('hoa614CourseShell');if(s)return s;hideLegacy(host);s=document.createElement('section');s.id='hoa614CourseShell';s.className='hoa614-shell';s.dataset.hoa614Keep='1';s.innerHTML=`
<div class="hoa614-head"><div><h3>🎓 Course & Subject Management</h3><p>Manage preparation batches, edit details, publish/archive courses, and organise subject folders for learning content.</p></div><span class="hoa614-badge">COURSES</span></div>
<div class="hoa614-body">
 <div class="hoa614-grid three">
  <label class="hoa614-field">Course / Batch Name<input id="hoa614CourseName" placeholder="e.g. TES Degree 2026"></label>
  <label class="hoa614-field">Batch Code<input id="hoa614CourseCode" placeholder="e.g. TES-D-26"></label>
  <label class="hoa614-field">Status<select id="hoa614CourseStatus"><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label>
  <label class="hoa614-field hoa614-wide">Description<textarea id="hoa614CourseDesc" rows="2" placeholder="Short description for students"></textarea></label>
  <label class="hoa614-field">Sort Order<input id="hoa614CourseSort" type="number" value="0"></label>
 </div>
 <div class="hoa614-actions"><button class="hoa614-btn primary" id="hoa614CreateCourse">＋ CREATE COURSE</button><button class="hoa614-btn" id="hoa614RefreshCourses">↻ REFRESH</button><span class="hoa614-status" id="hoa614CourseMsg"></span></div>
 <div class="hoa614-divider"></div>
 <div class="hoa614-section-title"><h4>Course / Batch Library</h4><span class="hoa614-count" id="hoa614CourseCount"></span></div>
 <div id="hoa614CourseList"></div>
 <div class="hoa614-divider"></div>
 <div class="hoa614-section-title"><h4>📁 Subject Folders</h4><span class="hoa614-count">Video folders are used by Classes & Videos</span></div>
 <div class="hoa614-grid three">
  <label class="hoa614-field">Course / Batch<select id="hoa614FolderCourse"></select></label>
  <label class="hoa614-field">Subject / Folder Name<input id="hoa614FolderName" placeholder="e.g. Highway Engineering"></label>
  <label class="hoa614-field">Folder Type<select id="hoa614FolderType"><option value="video">Video Subject</option><option value="note">Notes Subject</option></select></label>
 </div>
 <div class="hoa614-actions"><button class="hoa614-btn primary" id="hoa614CreateFolder">＋ CREATE SUBJECT FOLDER</button><span class="hoa614-status" id="hoa614FolderMsg"></span></div>
 <div id="hoa614FolderList" class="hoa614-list" style="margin-top:12px"></div>
</div>`;host.appendChild(s);
$('hoa614CreateCourse').onclick=createCourse;$('hoa614RefreshCourses').onclick=loadCourses;$('hoa614CreateFolder').onclick=createFolder;$('hoa614FolderCourse').onchange=loadFolders;loadCourses();return s}
async function loadCourses(){if(!adminOK())return;const c=db();if(!c)return;try{const r=await c.from('batches').select('id,name,batch_code,description,status,is_published,sort_order,created_at').order('sort_order').order('created_at',{ascending:false});if(r.error)throw r.error;const rows=r.data||[];$('hoa614CourseCount').textContent=rows.length+' course'+(rows.length===1?'':'s');const opts='<option value="">Select course / batch</option>'+rows.map(x=>`<option value="${esc(x.id)}">${esc(x.name)}${x.batch_code?' · '+esc(x.batch_code):''}</option>`).join('');$('hoa614FolderCourse').innerHTML=opts;const list=$('hoa614CourseList');list.innerHTML=rows.length?`<table class="hoa614-table"><thead><tr><th>Course</th><th>Code</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead><tbody>${rows.map(x=>`<tr><td><b>${esc(x.name)}</b><br><small>${esc(x.description||'')}</small></td><td>${esc(x.batch_code||'—')}</td><td><span class="hoa614-chip ${esc(x.status||'draft')}">${esc(x.status||'draft')}</span></td><td>${esc(fmt(x.created_at))}</td><td><div class="hoa614-row-actions"><button class="hoa614-btn small" data-edit-course="${x.id}">EDIT</button><button class="hoa614-btn small" data-course-pub="${x.id}">${x.is_published?'UNPUBLISH':'PUBLISH'}</button><button class="hoa614-btn small" data-course-archive="${x.id}">${x.status==='archived'?'RESTORE':'ARCHIVE'}</button></div></td></tr>`).join('')}</tbody></table>`:'<div class="hoa614-empty">No courses / batches created yet.</div>';
list.querySelectorAll('[data-edit-course]').forEach(b=>b.onclick=()=>editCourse(rows.find(x=>String(x.id)===String(b.dataset.editCourse))));list.querySelectorAll('[data-course-pub]').forEach(b=>b.onclick=()=>togglePublish(b.dataset.coursePub));list.querySelectorAll('[data-course-archive]').forEach(b=>b.onclick=()=>toggleArchive(b.dataset.courseArchive));
const old=$('hoa614FolderCourse').value;if(old&&rows.some(x=>String(x.id)===String(old)))$('hoa614FolderCourse').value=old;else if(rows[0])$('hoa614FolderCourse').value=rows[0].id;if($('hoa614FolderCourse').value)loadFolders();else $('hoa614FolderList').innerHTML='<div class="hoa614-empty">Select a course to manage subject folders.</div>';
}catch(e){msg('hoa614CourseMsg',e.message||'Could not load courses.',true)}}
async function createCourse(){if(!adminOK())return;const name=$('hoa614CourseName').value.trim();if(!name){msg('hoa614CourseMsg','Course / batch name is required.',true);return}try{const status=$('hoa614CourseStatus').value;const r=await db().from('batches').insert({name,batch_code:$('hoa614CourseCode').value.trim()||null,description:$('hoa614CourseDesc').value.trim()||null,status,is_published:status==='published',sort_order:Number($('hoa614CourseSort').value)||0,created_by:await uid()}).select().single();if(r.error)throw r.error;$('hoa614CourseName').value='';$('hoa614CourseCode').value='';$('hoa614CourseDesc').value='';msg('hoa614CourseMsg','Course created.');await loadCourses()}catch(e){msg('hoa614CourseMsg',e.message||'Could not create course.',true)}}
function editCourse(x){if(!x)return;const d=modal('Edit Course / Batch',`<div class="hoa614-grid"><label class="hoa614-field">Name<input id="hoa614EditName" value="${esc(x.name)}"></label><label class="hoa614-field">Code<input id="hoa614EditCode" value="${esc(x.batch_code||'')}"></label><label class="hoa614-field hoa614-wide">Description<textarea id="hoa614EditDesc" rows="3">${esc(x.description||'')}</textarea></label><label class="hoa614-field">Status<select id="hoa614EditStatus"><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label><label class="hoa614-field">Sort Order<input id="hoa614EditSort" type="number" value="${Number(x.sort_order)||0}"></label></div><div class="hoa614-actions"><button class="hoa614-btn primary" id="hoa614SaveCourse">SAVE CHANGES</button><button class="hoa614-btn" id="hoa614CancelCourse">CANCEL</button><span class="hoa614-status" id="hoa614EditMsg"></span></div>`);$('hoa614EditStatus').value=x.status||'draft';$('hoa614CancelCourse').onclick=()=>d.remove();$('hoa614SaveCourse').onclick=async()=>{try{const st=$('hoa614EditStatus').value;const r=await db().from('batches').update({name:$('hoa614EditName').value.trim(),batch_code:$('hoa614EditCode').value.trim()||null,description:$('hoa614EditDesc').value.trim()||null,status:st,is_published:st==='published',sort_order:Number($('hoa614EditSort').value)||0,updated_at:new Date().toISOString()}).eq('id',x.id);if(r.error)throw r.error;d.remove();await loadCourses()}catch(e){msg('hoa614EditMsg',e.message||'Update failed.',true)}}}
async function togglePublish(id){try{const r=await db().from('batches').select('is_published,status').eq('id',id).single();if(r.error)throw r.error;const pub=!r.data.is_published;const z=await db().from('batches').update({is_published:pub,status:pub?'published':'draft',updated_at:new Date().toISOString()}).eq('id',id);if(z.error)throw z.error;await loadCourses()}catch(e){alert(e.message||'Could not change publication state.')}}
async function toggleArchive(id){try{const r=await db().from('batches').select('status').eq('id',id).single();if(r.error)throw r.error;const archive=r.data.status!=='archived';if(!confirm(archive?'Archive this course? Students will no longer see it as published.':'Restore this course to Draft?'))return;const z=await db().from('batches').update({status:archive?'archived':'draft',is_published:false,updated_at:new Date().toISOString()}).eq('id',id);if(z.error)throw z.error;await loadCourses()}catch(e){alert(e.message||'Could not change archive state.')}}
async function loadFolders(){if(!adminOK())return;const batch=$('hoa614FolderCourse').value;const list=$('hoa614FolderList');if(!batch){list.innerHTML='<div class="hoa614-empty">Select a course to manage subject folders.</div>';return}try{const r=await db().from('content_folders').select('id,name,folder_type,sort_order,is_active').eq('batch_id',batch).order('folder_type').order('sort_order').order('name');if(r.error)throw r.error;const rows=r.data||[];list.innerHTML=rows.length?rows.map(x=>`<div class="hoa614-row ${x.is_active?'':'archived'}"><div class="hoa614-row-main"><b>${esc(x.name)} <span class="hoa614-chip">${x.folder_type==='video'?'VIDEO':'NOTE'}</span></b><small>${x.is_active?'Active subject folder':'Archived subject folder'}</small></div><div class="hoa614-row-actions"><button class="hoa614-btn small" data-edit-folder="${x.id}">EDIT</button><button class="hoa614-btn small" data-folder-state="${x.id}" data-active="${x.is_active?'true':'false'}">${x.is_active?'ARCHIVE':'RESTORE'}</button></div></div>`).join(''):'<div class="hoa614-empty">No subject folders in this course.</div>';list.querySelectorAll('[data-edit-folder]').forEach(b=>b.onclick=()=>editFolder(rows.find(x=>String(x.id)===String(b.dataset.editFolder))));list.querySelectorAll('[data-folder-state]').forEach(b=>b.onclick=()=>toggleFolder(b.dataset.folderState,b.dataset.active==='true'))}catch(e){msg('hoa614FolderMsg',e.message||'Could not load folders.',true)}}
async function createFolder(){if(!adminOK())return;const batch=$('hoa614FolderCourse').value,name=$('hoa614FolderName').value.trim(),type=$('hoa614FolderType').value;if(!batch||!name){msg('hoa614FolderMsg','Select a course and enter a subject folder name.',true);return}try{const r=await db().from('content_folders').insert({batch_id:batch,name,folder_type:type,sort_order:0,is_active:true,created_by:await uid()}).select().single();if(r.error)throw r.error;$('hoa614FolderName').value='';msg('hoa614FolderMsg','Subject folder created.');await loadFolders()}catch(e){msg('hoa614FolderMsg',e.message||'Could not create folder.',true)}}
function editFolder(x){if(!x)return;const d=modal('Edit Subject Folder',`<div class="hoa614-grid"><label class="hoa614-field">Folder Name<input id="hoa614EditFolderName" value="${esc(x.name)}"></label><label class="hoa614-field">Type<select id="hoa614EditFolderType"><option value="video">Video Subject</option><option value="note">Notes Subject</option></select></label><label class="hoa614-field">Sort Order<input id="hoa614EditFolderSort" type="number" value="${Number(x.sort_order)||0}"></label></div><div class="hoa614-actions"><button class="hoa614-btn primary" id="hoa614SaveFolder">SAVE CHANGES</button><button class="hoa614-btn" id="hoa614CancelFolder">CANCEL</button><span class="hoa614-status" id="hoa614EditFolderMsg"></span></div>`);$('hoa614EditFolderType').value=x.folder_type||'video';$('hoa614CancelFolder').onclick=()=>d.remove();$('hoa614SaveFolder').onclick=async()=>{try{const r=await db().from('content_folders').update({name:$('hoa614EditFolderName').value.trim(),folder_type:$('hoa614EditFolderType').value,sort_order:Number($('hoa614EditFolderSort').value)||0,updated_at:new Date().toISOString()}).eq('id',x.id);if(r.error)throw r.error;d.remove();await loadFolders()}catch(e){msg('hoa614EditFolderMsg',e.message||'Update failed.',true)}}}
async function toggleFolder(id,active){try{const r=await db().from('content_folders').update({is_active:!active,updated_at:new Date().toISOString()}).eq('id',id);if(r.error)throw r.error;await loadFolders()}catch(e){alert(e.message||'Could not update folder.')}}
async function youtubeCall(action,body){
 const c=db(); if(!c) throw new Error('Supabase is not ready.');
 const ss=await c.auth.getSession(); if(ss.error||!ss.data?.session?.access_token) throw new Error('Admin session required.');
 const base=(window.SUPABASE_URL||window.HOA_CONFIG?.supabaseUrl||'').replace(/\/$/,'');
 const r=await fetch(base+'/functions/v1/youtube-upload?action='+encodeURIComponent(action),{method:'POST',headers:{Authorization:'Bearer '+ss.data.session.access_token,apikey:window.SUPABASE_PUBLISHABLE_KEY||'', 'Content-Type':'application/json'},body:JSON.stringify(body||{})});
 const d=await r.json().catch(()=>({})); if(!r.ok)throw new Error(d.error||'YouTube service request failed.'); return d;
}
async function youtubeStatus(){try{return await youtubeCall('status',{})}catch(e){return {connected:false,error:e.message}}}
async function connectYouTube(){
 const d=await youtubeCall('auth',{}); if(!d.auth_url)throw new Error('YouTube authorization URL was not returned.');
 window.location.href=d.auth_url;
}
function isYouTubeOwner(){return String(window.hoaAdminRole||'').toLowerCase()==='owner'}
function renderYouTubeConnection(status){
 const box=$('hoa614YoutubeStatus');if(!box)return;
 const owner=isYouTubeOwner();
 if(status?.connected){
   box.innerHTML='<span class="hoa614-chip published">CONNECTED</span><span style="margin-left:8px">'+esc(status.channel_title||'YouTube channel')+'</span>'+(owner?'<button type="button" class="hoa614-btn small" id="hoa614ReconnectYouTube" style="margin-left:8px">RECONNECT</button>':'');
   const b=$('hoa614ReconnectYouTube');if(b)b.onclick=()=>connectYouTube().catch(e=>msg('hoa614VideoMsg',e.message,true));
 }else if(owner){
   box.innerHTML='<span class="hoa614-chip">NOT CONNECTED</span><button type="button" class="hoa614-btn small" id="hoa614ConnectYouTube" style="margin-left:8px">CONNECT YOUTUBE CHANNEL</button>';
   $('hoa614ConnectYouTube')?.addEventListener('click',()=>connectYouTube().catch(e=>msg('hoa614VideoMsg',e.message,true)));
 }else{
   box.innerHTML='<span class="hoa614-chip">NOT CONNECTED</span><span style="margin-left:8px;color:#64748b">Only Super Admin / Owner can connect the channel.</span>';
 }
}
async function uploadVideoFile(file,meta,onProgress){
 if(!file||!/^video\//i.test(file.type))throw new Error('Please select a valid video file.');
 const start=await youtubeCall('start',{...meta,size:file.size,mime_type:file.type});
 let url=start.upload_url, token=start.upload_token, access=start.access_token;
 const chunkSize=8*1024*1024; let offset=0;
 while(offset<file.size){
  const end=Math.min(offset+chunkSize,file.size)-1; const chunk=file.slice(offset,end+1);
  let r=await fetch(url,{method:'PUT',headers:{Authorization:'Bearer '+access,'Content-Type':file.type,'Content-Length':String(chunk.size),'Content-Range':`bytes ${offset}-${end}/${file.size}`},body:chunk});
  if(r.status===401){const refreshed=await youtubeCall('refresh',{upload_token:token});access=refreshed.access_token;r=await fetch(url,{method:'PUT',headers:{Authorization:'Bearer '+access,'Content-Type':file.type,'Content-Length':String(chunk.size),'Content-Range':`bytes ${offset}-${end}/${file.size}`},body:chunk});}
  if(r.status===308){const range=r.headers.get('Range')||'';const m=range.match(/-(\d+)$/);offset=m?Number(m[1])+1:end+1;onProgress?.(offset/file.size);continue;}
  if(!r.ok)throw new Error('YouTube upload failed at '+Math.round(offset/file.size*100)+'%.');
  const d=await r.json(); const videoId=d.id; if(!videoId)throw new Error('YouTube completed the upload without returning a video ID.');
  onProgress?.(1); return await youtubeCall('finalize',{upload_token:token,youtube_video_id:videoId});
 }
 throw new Error('Upload did not complete.');
}
function videoShell(){const host=$('adminSectionVideoPanel');if(!host)return null;let s=$('hoa614VideoShell');if(s)return s;hideLegacy(host);s=document.createElement('section');s.id='hoa614VideoShell';s.className='hoa614-shell';s.dataset.hoa614Keep='1';s.innerHTML=`
<div class="hoa614-head"><div><h3>🎥 Classes & Video Management</h3><p>Upload a video directly to the connected HOA YouTube channel as <b>Unlisted</b>, then automatically create the class record in HOA.</p></div><span class="hoa614-badge">YOUTUBE AUTO-UPLOAD</span></div>
<div class="hoa614-body">
 <div class="hoa614-row" style="align-items:center;justify-content:space-between;gap:10px"><div><b>YouTube Channel</b><div style="font-size:12px;color:#64748b;margin-top:3px">Your OAuth connection is kept server-side. Students never receive these credentials.</div></div><div id="hoa614YoutubeStatus"><span class="hoa614-chip">Checking…</span></div></div>
 <div class="hoa614-divider"></div>
 <div class="hoa614-grid three">
  <label class="hoa614-field">Course / Batch<select id="hoa614VideoCourse"></select></label>
  <label class="hoa614-field">Subject Folder<select id="hoa614VideoFolder"></select></label>
  <label class="hoa614-field">Status<select id="hoa614VideoFilter"><option value="">All Status</option><option value="published">Published</option><option value="draft">Draft</option></select></label>
  <label class="hoa614-field">Lecture No.<input id="hoa614VideoNo" type="number" min="1" value="1"></label>
  <label class="hoa614-field">Class Title<input id="hoa614VideoTitle" placeholder="Highway Development — Lecture 01"></label>
  <label class="hoa614-field hoa614-wide">Video Source<div class="hoa614-source-toggle" role="tablist" aria-label="Video source"><button type="button" class="hoa614-source-btn active" id="hoa614SourceUpload">UPLOAD VIDEO</button><button type="button" class="hoa614-source-btn" id="hoa614SourceLink">YOUTUBE LINK</button></div><input id="hoa614VideoFile" type="file" accept="video/*"><input id="hoa614VideoLink" type="url" placeholder="Paste YouTube video URL, Shorts URL, or 11-character Video ID" style="display:none"></label>
  <label class="hoa614-field hoa614-wide">Description<textarea id="hoa614VideoDesc" rows="2" placeholder="What students will learn"></textarea></label>
  <label class="hoa614-field">Scheduled At<input id="hoa614VideoScheduled" type="datetime-local"></label>
  <label class="hoa614-field">Duration (seconds)<input id="hoa614VideoDuration" type="number" min="0"></label>
  <label class="hoa614-field">Sort Order<input id="hoa614VideoSort" type="number" value="0"></label>
 </div>
 <div class="hoa614-actions"><button class="hoa614-btn primary" id="hoa614CreateVideo">⬆ ADD CLASS</button><button class="hoa614-btn" id="hoa614RefreshVideos">↻ REFRESH</button><span class="hoa614-status" id="hoa614VideoMsg"></span></div>
 <div id="hoa614UploadProgress" style="display:none;margin:10px 0"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:5px"><span id="hoa614UploadLabel">Uploading…</span><b id="hoa614UploadPct">0%</b></div><div style="height:8px;border-radius:99px;background:#e5e7eb;overflow:hidden"><div id="hoa614UploadBar" style="height:100%;width:0%;background:currentColor;transition:width .2s"></div></div></div>
 <div id="hoa614ManualYoutubeBox" style="display:none;margin:10px 0;padding:12px;border:1px solid rgba(100,116,139,.2);border-radius:12px"><label class="hoa614-field">Existing YouTube Video ID<input id="hoa614VideoId" maxlength="11" placeholder="11-character YouTube ID"></label></div>
 <div id="hoa614VideoPreview"></div>
 <div class="hoa614-divider"></div>
 <div class="hoa614-section-title"><h4>Video Library</h4><input id="hoa614VideoSearch" class="hoa614-field hoa614-search" placeholder="Search class title / YouTube ID"></div>
 <div id="hoa614VideoList"></div>
</div>`;host.appendChild(s);
 $('hoa614VideoCourse').onchange=async()=>{await loadVideoFolders();await loadVideos()};$('hoa614VideoFolder').onchange=loadVideos;$('hoa614VideoFilter').onchange=loadVideos;$('hoa614VideoSearch').oninput=()=>renderVideos(videoState.rows||[]);$('hoa614CreateVideo').onclick=createVideo;$('hoa614RefreshVideos').onclick=loadVideos;
 const setSource=mode=>{const upload=mode==='upload';$('hoa614SourceUpload').classList.toggle('active',upload);$('hoa614SourceLink').classList.toggle('active',!upload);$('hoa614VideoFile').style.display=upload?'block':'none';$('hoa614VideoLink').style.display=upload?'none':'block';$('hoa614VideoFile').required=upload;$('hoa614VideoLink').required=!upload};
 $('hoa614SourceUpload').onclick=()=>setSource('upload');$('hoa614SourceLink').onclick=()=>setSource('link');setSource('upload');
 youtubeStatus().then(renderYouTubeConnection);loadVideoCourses();return s}
let videoState={rows:[]};
async function loadVideoCourses(){if(!adminOK())return;try{const r=await db().from('batches').select('id,name,batch_code').order('sort_order').order('created_at',{ascending:false});if(r.error)throw r.error;const opts='<option value="">All courses</option>'+(r.data||[]).map(x=>`<option value="${esc(x.id)}">${esc(x.name)}${x.batch_code?' · '+esc(x.batch_code):''}</option>`).join('');$('hoa614VideoCourse').innerHTML=opts;await loadVideoFolders();await loadVideos()}catch(e){msg('hoa614VideoMsg',e.message||'Could not load courses.',true)}}
async function loadVideoFolders(){const batch=$('hoa614VideoCourse').value;let q=db().from('content_folders').select('id,name,batch_id').eq('folder_type','video').eq('is_active',true).order('name');if(batch)q=q.eq('batch_id',batch);const r=await q;if(r.error){msg('hoa614VideoMsg',r.error.message,true);return}const rows=(r.data||[]).filter(x=>!batch||true);$('hoa614VideoFolder').innerHTML='<option value="">All subject folders</option>'+rows.map(x=>`<option value="${esc(x.id)}">${esc(x.name)}</option>`).join('')}
async function loadVideos(){if(!adminOK())return;try{const batch=$('hoa614VideoCourse')?.value||'',folder=$('hoa614VideoFolder')?.value||'',filter=$('hoa614VideoFilter')?.value||'';let q=db().from('batch_lectures').select('id,batch_id,folder_id,lecture_no,title,description,youtube_video_id,scheduled_at,duration_seconds,sort_order,is_published,created_at,batches(name,batch_code),content_folders(name)').order('sort_order').order('lecture_no');if(batch)q=q.eq('batch_id',batch);if(folder)q=q.eq('folder_id',folder);if(filter==='published')q=q.eq('is_published',true);if(filter==='draft')q=q.eq('is_published',false);const r=await q;if(r.error)throw r.error;videoState.rows=r.data||[];renderVideos(videoState.rows)}catch(e){msg('hoa614VideoMsg',e.message||'Could not load videos.',true)}}
function renderVideos(rows){const q=($('hoa614VideoSearch')?.value||'').trim().toLowerCase();const data=rows.filter(x=>!q||[x.title,x.youtube_video_id,x.description,x.batches?.name,x.content_folders?.name].join(' ').toLowerCase().includes(q));const list=$('hoa614VideoList');if(!list)return;list.innerHTML=data.length?`<table class="hoa614-table"><thead><tr><th>#</th><th>Class</th><th>Course / Subject</th><th>Status</th><th>Scheduled</th><th>Actions</th></tr></thead><tbody>${data.map(x=>`<tr><td>${esc(x.lecture_no||'')}</td><td><b>${esc(x.title)}</b><br><small>${esc(x.youtube_video_id)}</small></td><td>${esc(x.batches?.name||'—')}<br><small>${esc(x.content_folders?.name||'Unfiled')}</small></td><td><span class="hoa614-chip ${x.is_published?'published':'draft'}">${x.is_published?'Published':'Draft'}</span></td><td>${esc(fmt(x.scheduled_at))}</td><td><div class="hoa614-row-actions"><button class="hoa614-btn small" data-preview-video="${x.id}">PREVIEW</button><button class="hoa614-btn small" data-edit-video="${x.id}">EDIT</button><button class="hoa614-btn small" data-publish-video="${x.id}">${x.is_published?'UNPUBLISH':'PUBLISH'}</button><button class="hoa614-btn small danger" data-delete-video="${x.id}">DELETE</button></div></td></tr>`).join('')}</tbody></table>`:'<div class="hoa614-empty">No classes/videos match the current filters.</div>';list.querySelectorAll('[data-preview-video]').forEach(b=>b.onclick=()=>previewVideo(videoState.rows.find(x=>String(x.id)===String(b.dataset.previewVideo))));list.querySelectorAll('[data-edit-video]').forEach(b=>b.onclick=()=>editVideo(videoState.rows.find(x=>String(x.id)===String(b.dataset.editVideo))));list.querySelectorAll('[data-publish-video]').forEach(b=>b.onclick=()=>toggleVideoPublish(videoState.rows.find(x=>String(x.id)===String(b.dataset.publishVideo))));list.querySelectorAll('[data-delete-video]').forEach(b=>b.onclick=()=>deleteVideo(videoState.rows.find(x=>String(x.id)===String(b.dataset.deleteVideo))))}
function parseYouTubeId(value){
 const v=String(value||'').trim();
 if(/^[A-Za-z0-9_-]{11}$/.test(v))return v;
 try{
  const u=new URL(v);
  const host=u.hostname.replace(/^www\./,'').toLowerCase();
  if(host==='youtu.be'){const id=u.pathname.split('/').filter(Boolean)[0]||'';return /^[A-Za-z0-9_-]{11}$/.test(id)?id:''}
  if(host==='youtube.com'||host==='m.youtube.com'||host==='music.youtube.com'){
   const q=u.searchParams.get('v');
   if(q&&/^[A-Za-z0-9_-]{11}$/.test(q))return q;
   const parts=u.pathname.split('/').filter(Boolean);
   const idx=parts.findIndex(x=>['embed','shorts','live','v'].includes(x));
   const id=idx>=0?parts[idx+1]:'';
   return /^[A-Za-z0-9_-]{11}$/.test(id||'')?id:'';
  }
 }catch(_){ }
 return '';
}
async function createVideo(){
 if(!adminOK())return;
 const batch=$('hoa614VideoCourse').value,folder=$('hoa614VideoFolder').value,title=$('hoa614VideoTitle').value.trim(),file=$('hoa614VideoFile').files?.[0],link=$('hoa614VideoLink').value.trim();
 const uploadMode=$('hoa614SourceUpload')?.classList.contains('active')!==false;
 if(!batch||!folder||!title){msg('hoa614VideoMsg','Course, subject folder and class title are required.',true);return}
 const meta={batch_id:batch,folder_id:folder,title,description:$('hoa614VideoDesc').value.trim()||'',lecture_no:Number($('hoa614VideoNo').value)||1,sort_order:Number($('hoa614VideoSort').value)||0,duration_seconds:Number($('hoa614VideoDuration').value)||null,scheduled_at:$('hoa614VideoScheduled').value?new Date($('hoa614VideoScheduled').value).toISOString():null};
 try{
  if(uploadMode){
   if(!file){msg('hoa614VideoMsg','Select a video file to upload to YouTube.',true);return}
   const progress=$('hoa614UploadProgress');
   progress.style.display='block';$('hoa614UploadLabel').textContent='Uploading to YouTube as Unlisted…';$('hoa614UploadPct').textContent='0%';$('hoa614UploadBar').style.width='0%';
   await uploadVideoFile(file,meta,p=>{$('hoa614UploadPct').textContent=Math.round(p*100)+'%';$('hoa614UploadBar').style.width=Math.round(p*100)+'%'});
   progress.style.display='none';
   ['hoa614VideoTitle','hoa614VideoDesc','hoa614VideoScheduled','hoa614VideoDuration','hoa614VideoLink'].forEach(id=>$(id)&&($(id).value=''));$('hoa614VideoFile').value='';
   msg('hoa614VideoMsg','Video uploaded to YouTube as Unlisted and added to HOA.');await loadVideos();return;
  }
  const manual=parseYouTubeId(link);
  if(!manual){msg('hoa614VideoMsg','Enter a valid YouTube video link or 11-character Video ID.',true);return}
  const r=await db().from('batch_lectures').insert({...meta,youtube_video_id:manual,is_published:false,created_by:await uid()}).select().single();if(r.error)throw r.error;
  $('hoa614VideoLink').value='';msg('hoa614VideoMsg','Existing YouTube video added as Draft.');await loadVideos();
 }catch(e){if($('hoa614UploadProgress'))$('hoa614UploadProgress').style.display='none';msg('hoa614VideoMsg',e.message||'Could not upload/add video.',true)}
}
function previewVideo(x){if(!x)return;const host=$('hoa614VideoPreview');host.innerHTML=`<div class="hoa614-preview"><div style="padding:10px 12px;color:#fff;display:flex;justify-content:space-between;gap:10px;align-items:center"><b>${esc(x.title||'Video Preview')}</b><button class="hoa614-btn small" id="hoa614ClosePreview">CLOSE</button></div><iframe src="https://www.youtube.com/embed/${encodeURIComponent(x.youtube_video_id)}?rel=0" title="${esc(x.title||'Video Preview')}" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture;web-share" allowfullscreen></iframe></div>`;$('hoa614ClosePreview').onclick=()=>host.innerHTML='';host.scrollIntoView({behavior:'smooth',block:'nearest'})}
function editVideo(x){if(!x)return;const d=modal('Edit Class / Video',`<div class="hoa614-grid"><label class="hoa614-field">Lecture No.<input id="hoa614EditNo" type="number" value="${Number(x.lecture_no)||1}"></label><label class="hoa614-field">YouTube Video ID<input id="hoa614EditId" maxlength="11" value="${esc(x.youtube_video_id||'')}"></label><label class="hoa614-field hoa614-wide">Title<input id="hoa614EditTitle" value="${esc(x.title||'')}"></label><label class="hoa614-field hoa614-wide">Description<textarea id="hoa614EditDesc" rows="3">${esc(x.description||'')}</textarea></label><label class="hoa614-field">Scheduled At<input id="hoa614EditScheduled" type="datetime-local"></label><label class="hoa614-field">Duration (seconds)<input id="hoa614EditDuration" type="number" value="${Number(x.duration_seconds)||''}"></label><label class="hoa614-field">Sort Order<input id="hoa614EditSort" type="number" value="${Number(x.sort_order)||0}"></label></div><div class="hoa614-actions"><button class="hoa614-btn primary" id="hoa614SaveVideo">SAVE CHANGES</button><button class="hoa614-btn" id="hoa614CancelVideo">CANCEL</button><span class="hoa614-status" id="hoa614EditVideoMsg"></span></div>`);if(x.scheduled_at){const dt=new Date(x.scheduled_at);$('hoa614EditScheduled').value=new Date(dt.getTime()-dt.getTimezoneOffset()*60000).toISOString().slice(0,16)}$('hoa614CancelVideo').onclick=()=>d.remove();$('hoa614SaveVideo').onclick=async()=>{try{const yt=$('hoa614EditId').value.trim();if(!/^[A-Za-z0-9_-]{11}$/.test(yt))throw new Error('Enter a valid 11-character YouTube video ID.');const r=await db().from('batch_lectures').update({lecture_no:Number($('hoa614EditNo').value)||1,youtube_video_id:yt,title:$('hoa614EditTitle').value.trim(),description:$('hoa614EditDesc').value.trim()||null,scheduled_at:$('hoa614EditScheduled').value?new Date($('hoa614EditScheduled').value).toISOString():null,duration_seconds:Number($('hoa614EditDuration').value)||null,sort_order:Number($('hoa614EditSort').value)||0,updated_at:new Date().toISOString()}).eq('id',x.id);if(r.error)throw r.error;d.remove();await loadVideos()}catch(e){msg('hoa614EditVideoMsg',e.message||'Update failed.',true)}}}
async function toggleVideoPublish(x){if(!x)return;try{const r=await db().from('batch_lectures').update({is_published:!x.is_published,updated_at:new Date().toISOString()}).eq('id',x.id);if(r.error)throw r.error;await loadVideos()}catch(e){alert(e.message||'Could not change publication state.')}}
async function deleteVideo(x){if(!x)return;if(!confirm('Delete this class/video? This removes the lecture record and cannot be undone from this screen.'))return;try{const r=await db().from('batch_lectures').delete().eq('id',x.id);if(r.error)throw r.error;await loadVideos()}catch(e){alert(e.message||'Could not delete video.')}}
function install(){courseShell();videoShell()}
const oldShow=window.showAdminSection;if(typeof oldShow==='function'&&!oldShow.__hoa614){const w=function(section){const r=oldShow.apply(this,arguments);if(section==='course')setTimeout(()=>{courseShell();loadCourses()},0);if(section==='video')setTimeout(()=>{videoShell();loadVideoCourses()},0);return r};w.__hoa614=true;window.showAdminSection=w}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
window.hoaV614={loadCourses,loadVideos};
})();

/* HOA V6.1.0 — Feature-separated JavaScript module.
   Original inline script #65 (id: hoa-v615-batch360-script).
   Execution position intentionally preserved from V6.0.9. */


(function(){
'use strict';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const db=()=>window.supabaseClient||window.supabase||null;
const fmt=v=>v?new Date(v).toLocaleString():'—';
function adminOK(){try{return typeof isAdminMode==='function'?isAdminMode():document.body.classList.contains('admin-ui')}catch(_){return false}}
function ensureUI(){if($('hoaBatch360Overlay'))return;const d=document.createElement('div');d.id='hoaBatch360Overlay';d.innerHTML='<div class="hoa360-shell"><div class="hoa360-head"><div><h2 id="hoa360Title">Batch Overview</h2><p id="hoa360Subtitle">Complete batch content and access map</p></div><button class="hoa360-close" type="button" id="hoa360Close">CLOSE</button></div><div class="hoa360-body" id="hoa360Body"><div class="hoa360-empty">Select a batch to view its complete overview.</div></div></div>';document.body.appendChild(d);$('hoa360Close').onclick=close;d.addEventListener('click',e=>{if(e.target===d)close()})}
function open(){ensureUI();$('hoaBatch360Overlay').classList.add('open');document.body.style.overflow='hidden'}
function close(){const d=$('hoaBatch360Overlay');if(d)d.classList.remove('open');document.body.style.overflow=''}
function stat(n,l){return '<div class="hoa360-stat"><b>'+esc(n)+'</b><span>'+esc(l)+'</span></div>'}
function row(title,meta,badge){return '<div class="hoa360-row"><div class="hoa360-row-main"><div><b>'+esc(title)+'</b><small>'+esc(meta||'')+'</small></div>'+(badge?'<span class="hoa360-badge '+(badge==='PUBLISHED'||badge==='ACTIVE'?'ok':badge==='ARCHIVED'?'arch':'warn')+'">'+esc(badge)+'</span>':'')+'</div></div>'}
function empty(t){return '<div class="hoa360-empty">'+esc(t)+'</div>'}
function setBody(title,subtitle,body){ensureUI();$('hoa360Title').textContent=title;$('hoa360Subtitle').textContent=subtitle||'';$('hoa360Body').innerHTML=body}
async function courseData(id){const c=db();if(!c)throw new Error('Supabase is not ready.');const b=await c.from('batches').select('*').eq('id',id).single();if(b.error)throw b.error;const [folders,lectures,notes,la,na,access]=await Promise.all([
 c.from('content_folders').select('id,name,folder_type,parent_id,sort_order,is_active,created_at').eq('batch_id',id).order('folder_type').order('sort_order').order('name'),
 c.from('batch_lectures').select('id,title,lecture_no,folder_id,batch_id,is_published,scheduled_at,youtube_video_id,sort_order').eq('batch_id',id).order('sort_order').order('lecture_no'),
 c.from('exam_notes').select('id,title,subject,exam,folder_id,batch_id,is_published,file_name,created_at,sort_order').eq('batch_id',id).order('sort_order').order('created_at',{ascending:false}),
 c.from('batch_lecture_assignments').select('lecture_id,batch_id,folder_id').eq('batch_id',id),
 c.from('exam_note_assignments').select('note_id,batch_id,folder_id').eq('batch_id',id),
 c.from('student_batch_access').select('student_id,starts_at,expires_at').eq('batch_id',id)
]);
 for(const r of [folders,lectures,notes,la,na,access])if(r.error)throw r.error;
 const accessRows=access.data||[];let students=[];const ids=[...new Set(accessRows.map(x=>x.student_id).filter(Boolean))];if(ids.length){const sr=await c.from('students').select('id,full_name,email,mobile,status').in('id',ids).order('full_name');if(sr.error)throw sr.error;students=sr.data||[]}
 return {batch:b.data,folders:folders.data||[],lectures:lectures.data||[],notes:notes.data||[],lectureAssignments:la.data||[],noteAssignments:na.data||[],access:accessRows,students};}
function assignedFor(rows,id,key){return rows.filter(x=>x[key]===id)}
function courseView(d){const b=d.batch,fs=d.folders,ls=d.lectures,ns=d.notes;const videoFs=fs.filter(x=>x.folder_type==='video'),noteFs=fs.filter(x=>x.folder_type==='note'),otherFs=fs.filter(x=>!['video','note'].includes(x.folder_type));const unfiledV=ls.filter(x=>!x.folder_id),unfiledN=ns.filter(x=>!x.folder_id);const assignedL=d.lectureAssignments;const assignedN=d.noteAssignments;
 const studentHtml=d.students.length?d.students.map(x=>row(x.full_name,(x.email||x.mobile||'')+' · '+(x.status||'') ,(x.status||'').toUpperCase()||'ACTIVE')).join(''):empty('No students are assigned to this batch.');
 const folderTree=(folders,type,items,assignments,key)=>folders.length?folders.map(f=>{let direct=items.filter(x=>x.folder_id===f.id);let reused=assignments.filter(x=>x.folder_id===f.id).map(a=>a[key]);let all=[...direct];const seen=new Set(all.map(x=>x.id));items.filter(x=>reused.includes(x.id)).forEach(x=>{if(!seen.has(x.id))all.push(x)});return '<details><summary>'+esc(f.name)+' <span class="hoa360-badge '+(f.is_active?'ok':'arch')+'">'+(f.is_active?'ACTIVE':'ARCHIVED')+'</span></summary><div class="inside">'+(all.length?all.map(x=>row(x.title||x.file_name,(type==='video'?'Class '+(x.lecture_no||'')+' · '+(x.is_published?'Published':'Draft'):(x.subject||'General')+' · '+(x.exam||'')+' · '+(x.is_published?'Published':'Draft')),x.is_published?'PUBLISHED':'DRAFT')).join(''):empty('Nothing uploaded/assigned to this folder yet.'))+'</div></details>'}).join(''):empty('No '+type+' folders created.');
 const other=(otherFs.length?otherFs.map(f=>row(f.name,'Folder type: '+(f.folder_type||'Other'),f.is_active?'ACTIVE':'ARCHIVED')).join(''):'')+(unfiledV.length?'<h4>Unfiled videos</h4>'+unfiledV.map(x=>row(x.title,'No subject folder · '+(x.is_published?'Published':'Draft'),x.is_published?'PUBLISHED':'DRAFT')).join(''):'')+(unfiledN.length?'<h4>Unfiled notes</h4>'+unfiledN.map(x=>row(x.title,(x.subject||'General')+' · No folder · '+(x.is_published?'Published':'Draft'),x.is_published?'PUBLISHED':'DRAFT')).join(''):'');
 const summary=stat(d.students.length,'STUDENTS')+stat(videoFs.length,'VIDEO FOLDERS')+stat(ls.length,'VIDEOS')+stat(noteFs.length,'NOTE FOLDERS')+stat(ns.length,'NOTES')+stat(otherFs.length+unfiledV.length+unfiledN.length,'OTHER / UNFILED');
 const tabs='<div class="hoa360-tabs"><button class="hoa360-tab active" data-360-tab="overview">Overview</button><button class="hoa360-tab" data-360-tab="students">Students</button><button class="hoa360-tab" data-360-tab="videos">Videos</button><button class="hoa360-tab" data-360-tab="notes">Notes</button><button class="hoa360-tab" data-360-tab="other">Other / Unfiled</button></div>';
 const panels={overview:'<div class="hoa360-grid"><div class="hoa360-card"><h3>Batch Information</h3>'+row(b.name,(b.batch_code||'No batch code')+' · '+(b.status||'draft'),b.is_published?'PUBLISHED':'DRAFT')+'<p class="hoa360-muted">Created: '+esc(fmt(b.created_at))+'<br>Updated: '+esc(fmt(b.updated_at))+'</p></div><div class="hoa360-card"><h3>Content Health</h3>'+row('Video folders',videoFs.length+' folders · '+ls.length+' videos',videoFs.length?'':'EMPTY')+row('Note folders',noteFs.length+' folders · '+ns.length+' notes',noteFs.length?'':'EMPTY')+row('Students',d.students.length+' assigned students',d.students.length?'ACTIVE':'EMPTY')+'</div></div>',students:'<div class="hoa360-card"><h3>Students ('+d.students.length+')</h3><div class="hoa360-list">'+studentHtml+'</div></div>',videos:'<div class="hoa360-card"><h3>Video Structure</h3><div class="hoa360-tree">'+folderTree(videoFs,'video',ls,assignedL,'lecture_id')+'</div></div>',notes:'<div class="hoa360-card"><h3>Notes Structure</h3><div class="hoa360-tree">'+folderTree(noteFs,'note',ns,assignedN,'note_id')+'</div></div>',other:'<div class="hoa360-card"><h3>Other / Unfiled Content</h3>'+((other||'')||empty('No other or unfiled content detected.'))+'</div>'};
 setBody('Course Batch — '+b.name,(b.batch_code||'')+' · Complete batch view',summary+tabs+'<div id="hoa360Panel">'+panels.overview+'</div>');document.querySelectorAll('[data-360-tab]').forEach(btn=>btn.onclick=()=>{document.querySelectorAll('[data-360-tab]').forEach(x=>x.classList.toggle('active',x===btn));$('hoa360Panel').innerHTML=panels[btn.dataset['360Tab']]||panels.overview});open()}
async function openCourse(id){if(!adminOK())return;open();setBody('Loading Course Batch…','Reading existing batch relationships',empty('Loading…'));try{courseView(await courseData(id))}catch(e){setBody('Batch Overview Error','',empty(e.message||'Could not load batch overview.'))}}
async function mockData(id){const c=db();if(!c)throw new Error('Supabase is not ready.');const b=await c.from('test_batches').select('*').eq('id',id).single();if(b.error)throw b.error;const [f,a,t,access]=await Promise.all([
 c.from('test_batch_folders').select('id,name,folder_type,sort_order,is_active,created_at').eq('test_batch_id',id).order('folder_type').order('sort_order').order('name'),
 c.from('test_batch_test_assignments').select('test_id,test_batch_id,test_batch_folder_id').eq('test_batch_id',id),
 c.from('tests').select('id,title,description,duration_minutes,marks_per_question,negative_marking,is_published,test_batch_id,test_batch_folder_id,test_type,created_at').eq('test_batch_id',id).order('created_at',{ascending:false}),
 c.from('student_test_batch_access').select('student_id,starts_at,expires_at').eq('test_batch_id',id)
]);for(const r of [f,a,t,access])if(r.error)throw r.error;const ids=[...new Set((access.data||[]).map(x=>x.student_id).filter(Boolean))];let students=[];if(ids.length){const sr=await c.from('students').select('id,full_name,email,mobile,status').in('id',ids).order('full_name');if(sr.error)throw sr.error;students=sr.data||[]}return {batch:b.data,folders:f.data||[],assignments:a.data||[],tests:t.data||[],access:access.data||[],students}}
function mockView(d){const b=d.batch,fs=d.folders,tests=d.tests;const assigned=d.assignments;const folderHtml=fs.length?fs.map(f=>{const direct=tests.filter(x=>x.test_batch_folder_id===f.id);const ids=assigned.filter(x=>x.test_batch_folder_id===f.id).map(x=>x.test_id);const all=[...direct],seen=new Set(all.map(x=>x.id));tests.filter(x=>ids.includes(x.id)).forEach(x=>{if(!seen.has(x.id))all.push(x)});return '<details><summary>'+esc(f.name)+' <span class="hoa360-badge '+(f.is_active?'ok':'arch')+'">'+(f.folder_type==='full_length'?'FULL-LENGTH':'SUBJECT-WISE')+' · '+(f.is_active?'ACTIVE':'ARCHIVED')+'</span></summary><div class="inside">'+(all.length?all.map(x=>row(x.title,(x.duration_minutes||0)+' min · '+(x.is_published?'Published':'Draft')+' · '+(x.test_type||'test'),x.is_published?'PUBLISHED':'DRAFT')).join(''):empty('No tests are assigned to this folder.'))+'</div></details>'}).join(''):empty('No mock-test folders created.');const assignedIds=new Set(assigned.map(x=>x.test_id));const unfiled=tests.filter(x=>!x.test_batch_folder_id&&!assignedIds.has(x.id));const students=d.students.length?d.students.map(x=>row(x.full_name,(x.email||x.mobile||'')+' · '+(x.status||''),(x.status||'').toUpperCase()||'ACTIVE')).join(''):empty('No students have batch access.');const summary=stat(d.students.length,'STUDENTS')+stat(fs.length,'FOLDERS')+stat(tests.length,'TESTS')+stat(tests.filter(x=>x.is_published).length,'PUBLISHED')+stat(tests.filter(x=>!x.is_published).length,'DRAFT')+stat(unfiled.length,'UNFILED TESTS');const tabs='<div class="hoa360-tabs"><button class="hoa360-tab active" data-mock-tab="overview">Overview</button><button class="hoa360-tab" data-mock-tab="folders">Folders & Tests</button><button class="hoa360-tab" data-mock-tab="students">Students</button><button class="hoa360-tab" data-mock-tab="unfiled">Unfiled</button></div>';const panels={overview:'<div class="hoa360-grid"><div class="hoa360-card"><h3>Batch Information</h3>'+row(b.name,(b.batch_code||'No batch code')+' · '+(b.status||'draft'),b.is_published?'PUBLISHED':'DRAFT')+'<p class="hoa360-muted">Created: '+esc(fmt(b.created_at))+'<br>Updated: '+esc(fmt(b.updated_at))+'</p></div><div class="hoa360-card"><h3>Content Health</h3>'+row('Folders',fs.length+' active/archived folders',fs.length?'READY':'EMPTY')+row('Tests',tests.length+' tests · '+tests.filter(x=>x.is_published).length+' published',tests.length?'READY':'EMPTY')+row('Students',d.students.length+' students with batch access',d.students.length?'ACTIVE':'EMPTY')+'</div></div>',folders:'<div class="hoa360-card"><h3>Folders & Tests</h3><div class="hoa360-tree">'+folderHtml+'</div></div>',students:'<div class="hoa360-card"><h3>Students ('+d.students.length+')</h3><div class="hoa360-list">'+students+'</div></div>',unfiled:'<div class="hoa360-card"><h3>Unfiled Tests</h3>'+(unfiled.length?unfiled.map(x=>row(x.title,'No folder assignment · '+(x.is_published?'Published':'Draft'),x.is_published?'PUBLISHED':'DRAFT')).join(''):empty('No unfiled tests detected.'))+'</div>'};setBody('Mock Test Batch — '+b.name,(b.batch_code||'')+' · Complete batch view',summary+tabs+'<div id="hoa360Panel">'+panels.overview+'</div>');document.querySelectorAll('[data-mock-tab]').forEach(btn=>btn.onclick=()=>{document.querySelectorAll('[data-mock-tab]').forEach(x=>x.classList.toggle('active',x===btn));$('hoa360Panel').innerHTML=panels[btn.dataset['mockTab']]||panels.overview});open()}
async function openMock(id){if(!adminOK())return;open();setBody('Loading Mock Test Batch…','Reading existing folders, tests and access',empty('Loading…'));try{mockView(await mockData(id))}catch(e){setBody('Batch Overview Error','',empty(e.message||'Could not load mock batch overview.'))}}
function enhanceCourseRows(){const list=$('hoaCourseList');if(!list)return;list.querySelectorAll('tbody tr').forEach(tr=>{if(tr.querySelector('[data-hoa360-course]'))return;const pub=tr.querySelector('[onclick*="hoaToggleCoursePublish"]');if(!pub)return;const m=String(pub.getAttribute('onclick')).match(/hoaToggleCoursePublish\(['"]([^'"]+)/);if(!m)return;const id=m[1];const cell=tr.lastElementChild;if(cell){const b=document.createElement('button');b.type='button';b.className='secondary hoa360-view-btn';b.textContent='VIEW BATCH';b.dataset.hoa360Course=id;b.onclick=()=>openCourse(id);cell.appendChild(b)}})}
function ensureMockViewButton(){const sel=$('hoa606MockBatch');if(!sel||$('hoa360MockView'))return;const wrap=sel.parentElement;const b=document.createElement('button');b.type='button';b.id='hoa360MockView';b.className='hoa606-btn gold';b.style.marginTop='8px';b.textContent='📋 VIEW BATCH OVERVIEW';b.onclick=()=>{const id=sel.value;if(id)openMock(id);else alert('Select a Mock Test Batch first.')};wrap?.appendChild(b)}
function boot(){ensureUI();const oldCourse=window.hoaLoadCourses;if(typeof oldCourse==='function'&&!oldCourse.__hoa615){const w=async function(){const r=await oldCourse.apply(this,arguments);setTimeout(enhanceCourseRows,0);return r};w.__hoa615=true;window.hoaLoadCourses=w}ensureMockViewButton();new MutationObserver(()=>{enhanceCourseRows();ensureMockViewButton()}).observe(document.body,{childList:true,subtree:true});}
window.hoaOpenCourseBatchOverview=openCourse;window.hoaOpenMockBatchOverview=openMock;if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();

/* ===== HOA SAFE TWO-FILE CONSOLIDATION: mock-test-workspace.js ===== */
window.__HOA_ADMIN_MOCK_WORKSPACE_INIT = function(){
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
};
/* ============================================================ */
/* HUB OF ASPIRANTS — Student Controller (Phase 5)             */
/* Consolidated from the existing Student feature modules.     */
/* No feature logic has been rewritten in this phase.          */
/* Original execution order inside this file:                  */
/*   1) student/content-access.js                               */
/*   2) free-content/student-portal.js                          */
/*   3) student/course-mock-portals.js                          */
/* ============================================================ */

/* HOA V6.1.0 — Feature-separated JavaScript module.
   Original inline script #34 (id: hoa-v644-content-access-js).
   Execution position intentionally preserved from V6.0.9. */


/* ============================================================
   HUB OF ASPIRANTS — Student Core Controller (Phase 5)
   Extracted from the legacy application block without changing
   the existing Student test/result behavior.

   Owner of: dashboard, test launch, exam state, timer, submission,
   result rendering, historical attempt review and student result cache.
   ============================================================ */

async function resetPreviousAttemptsForStudent(studentId){
  /* Production hardening: login must never delete examination history. */
  return {ok:true,count:0,skipped:true,studentId:studentId||null};
}

async function loadResultsFromSupabase(studentId){
  if(!supabaseClient || !studentId || !window.HOA_SERVICES?.result) return [];
  const data=await window.HOA_SERVICES.result.studentHistory(studentId);
  const active=(typeof currentStudent!=="undefined"&&currentStudent)?currentStudent:null;
  return (Array.isArray(data)?data:[]).map(r=>{
    const startMs=Date.parse(r.started_at||""); const endMs=Date.parse(r.submitted_at||"");
    const timeTaken=(Number.isFinite(startMs)&&Number.isFinite(endMs))?Math.max(0,Math.round((endMs-startMs)/1000)):null;
    const total=Number(r.total_questions)||0; const marksPer=Number(r.marks_per_question)||1; const maxMarks=total*marksPer; const score=Number(r.score)||0;
    return {id:r.id,testId:r.test_id||null,userId:r.student_id||studentId,student_id:r.student_id||studentId,auth_user_id:active?.auth_user_id||null,email:active?.email||"",userName:active?.name||"Student",title:r.test_title||"Mock Test",date:r.submitted_at||r.started_at,submittedAt:r.submitted_at||"",startedAt:r.started_at||"",correct:Number(r.correct_answers)||0,wrong:Number(r.wrong_answers)||0,skipped:Number(r.unanswered)||0,marks:score,score,maxMarks,max_marks:maxMarks,marksPerCorrect:marksPer,negativeMarks:Number(r.negative_marking)||0,totalQuestions:total,percentage:maxMarks>0?(score/maxMarks)*100:0,timeTaken,elapsedSeconds:timeTaken};
  });
}
async function createAttemptInSupabase(testId,totalQuestions){
  const source=window.__HOA_EXAM_SOURCE||{};
  const isFree=source.mode==='free';
  if(!supabaseClient || !testId || (!isFree && !currentStudent)) return null;
  if(isFree){
    const token=String(source.token||'');
    if(!token) throw new Error('Free Test access session is missing.');
    const data=await window.HOA_SERVICES.free.startAttempt(token,String(source.testId||testId));
    if(!data?.attempt_id) throw new Error('Could not start the Free Test attempt.');
    return data.attempt_id;
  }
  const data=await window.HOA_SERVICES.test.startAttempt(testId);
  if(!data?.ok || !data?.attempt_id) throw new Error(data?.error||"Could not start the test attempt.");
  try{ if(window.HOA_TRACKING) window.HOA_TRACKING.trackStudentActivity('test_attempt_start','test',testId,{attempt_id:data.attempt_id,total_questions:totalQuestions}); }catch(_){ }
  return data.attempt_id;
}

async function saveAttemptToSupabase(attemptId,testId,correct,wrong,skipped,score,answersSnapshot){
  // V4.2: final submission is handled by the secure submit_test_v4 RPC.
  // Kept as a compatibility shim for older code paths.
  if(!supabaseClient || !currentStudent || !attemptId) return;
  return;
  const {error:updateError}=await supabaseClient.from("attempts").update({
    submitted_at:new Date().toISOString(),
    status:"completed",
    total_questions:questions.length,
    correct_answers:correct,
    wrong_answers:wrong,
    unanswered:skipped,
    score:score,
  }).eq("id",attemptId);
  if(updateError) throw updateError;

  const rows=questions.map((q,i)=>({
    attempt_id:attemptId,
    question_id:q.__id || null,
    selected_option:answersSnapshot[i],
    is_correct:answersSnapshot[i]!==null && answersSnapshot[i]===q[5],
    marks_awarded:answersSnapshot[i]===null ? 0 : (answersSnapshot[i]===q[5] ? marksPerCorrect : -negativeMarks)
  })).filter(r=>r.question_id);

  if(rows.length){
    const {error:ansError}=await supabaseClient.from("answers").insert(rows);
    if(ansError) throw ansError;
  }
}

function enterPlatform(){
  document.getElementById("studentHeaderLogout").classList.remove("hidden");
  document.getElementById("adminHeaderLogout").classList.add("hidden");
  
  document.getElementById("home").classList.remove("hidden");
  document.getElementById("profileName").textContent=currentStudent.name;
  document.getElementById("profileEmail").textContent=currentStudent.email+" · "+currentStudent.mobile;
  document.getElementById("profileAcademic").textContent=(currentStudent.qualification||"")+" · "+(currentStudent.passoutYear||"")+" · "+(currentStudent.college||"");
  document.getElementById("avatar").textContent=(currentStudent.name||"S").trim().charAt(0).toUpperCase();
  showDashboardTab("student");
  showCandidateSection("test");
  renderStudentDashboard();
  if(typeof window.hoaInstallStudentNativeBottom === 'function') window.hoaInstallStudentNativeBottom();
  if(typeof window.hoaEnterAuthenticated === 'function') window.hoaEnterAuthenticated('student');
}
function getResults(){
  try{return JSON.parse(localStorage.getItem("missionTES_results_cache")||"[]")}catch(e){return []}
}
function saveResults(results){localStorage.setItem("missionTES_results_cache",JSON.stringify(results))}
function hideStudentExamScreens(){
  setHOAExamShellMode("normal");
  const exam=document.getElementById("exam");
  const result=document.getElementById("result");
  const overlay=document.getElementById("testCountdownOverlay");
  if(exam) exam.classList.add("hidden");
  if(result) result.classList.add("hidden");
  if(overlay) overlay.classList.add("hidden");
  clearInterval(interval);
  interval=null;
  document.getElementById("headerTimer")?.classList.add("hidden");
  adminPreviewMode=false;
}

/* V1.5 compatibility shim. The V1.3 clean controller below is the sole
   owner of Admin navigation and Result Management. Older internal callers
   can continue using the original function name without maintaining a
   second Result implementation. */
async function showCandidateSection(section){
  section = section === "result" ? "result" : "test";
  const testPanel = document.getElementById("candidateSectionTestPanel");
  const resultPanel = document.getElementById("candidateSectionResultPanel");

  if(testPanel) {
    testPanel.classList.remove("active");
    if(section === "test") testPanel.classList.add("active");
  }
  if(resultPanel) {
    resultPanel.classList.remove("active");
    if(section === "result") resultPanel.classList.add("active");
  }

  const testBtn = document.getElementById("candidateNavTest");
  const resultBtn = document.getElementById("candidateNavResult");
  if(testBtn) testBtn.classList.toggle("active", section === "test");
  if(resultBtn) resultBtn.classList.toggle("active", section === "result");

  if(section === "result") await renderCandidateResults();
}

async function renderCandidateResults(targetBox, allowedTestIds){
  /* Render into an explicitly supplied surface when one exists. This prevents
     the Student Dashboard Results list from colliding with the separate
     Mock Test Course Results surface. */
  const box=targetBox || document.getElementById("candidateResultsList");
  if(!box)return;
  /* V4.6: Result Section must be backed by Supabase, not localStorage.
     The dashboard counter is already reading the real attempts table, while
     the old renderer could read an empty/stale browser cache. */
  box.innerHTML='<div class="emptyState">Loading your results…</div>';
  let rows=[];
  try{
    const sid=(typeof currentStudent!=="undefined" && currentStudent?.id) || currentStudent?.id || null;
    if(supabaseClient && sid){
      rows=await loadResultsFromSupabase(sid);
      /* Keep a fresh cache only as a fallback for the review UI. */
      if(Array.isArray(rows)) saveResults(rows);
    }else if(typeof getResults==="function") {
      rows=getResults()||[];
    }
  }catch(e){
    console.error("Candidate results load failed:",e);
    box.innerHTML='<div class="emptyState">Unable to load your results right now. Please refresh and try again.</div>';
    const badge=document.getElementById("candidateResultsBadge"); if(badge)badge.textContent="0 TESTS";
    return;
  }
  /* V4.2: use the public.students ID as the primary ownership key.
     window.currentUser.id is the Supabase Auth UUID and is intentionally
     different from students.id.  Mixing them made valid result rows vanish. */
  /* V4.6: currentStudent is a top-level let in this page, so it is not
     guaranteed to exist on window. Use the real lexical value first. */
  const activeStudent=(typeof currentStudent!=="undefined" && currentStudent) ? currentStudent : (currentStudent||null);
  const activeUser=(typeof currentUser!=="undefined" && currentUser) ? currentUser : (window.currentUser||null);
  const currentStudentId=String(activeStudent?.id||"");
  const currentAuthId=String(activeStudent?.auth_user_id||activeUser?.id||"");
  const currentEmail=String(activeStudent?.email||activeUser?.email||"").toLowerCase();
  if(!currentStudentId && !currentAuthId && !currentEmail){
    rows=[];
  }else{
    rows=rows.filter(r=>{
      const email=String(r.email||"").toLowerCase();
      const id=String(r.userId||r.student_id||r.user_id||"");
      const authId=String(r.auth_user_id||r.authUserId||"");
      return (currentStudentId && id===currentStudentId) ||
             (currentAuthId && authId===currentAuthId) ||
             (currentEmail && email===currentEmail);
    });
  }
  if(Array.isArray(allowedTestIds) && allowedTestIds.length){
    const allow=new Set(allowedTestIds.map(String));
    rows=rows.filter(r=>allow.has(String(r.testId||r.test_id||"")));
  }
  window.__hoaStudentResultRows=rows.slice();
  const badge=document.getElementById("candidateResultsBadge");
  if(badge)badge.textContent=rows.length+" "+(rows.length===1?"TEST":"TESTS");
  if(!rows.length){
    box.innerHTML='<div class="emptyState">No tests attempted yet. Start a mock test from the Test Section.</div>';
    return;
  }
  const formatDate=(value)=>{
    if(!value)return "—";
    const d=new Date(value);
    if(Number.isNaN(d.getTime()))return escapeHTML(String(value));
    return d.toLocaleString([], {day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});
  };
  const num=v=>Number.isFinite(Number(v))?Number(v):null;
  const marks=r=>{const v=num(r.marks??r.score);return v===null?"—":v.toFixed(2)};
  const maxMarks=r=>{const v=num(r.maxMarks??r.max_marks??r.totalMarks??r.total_marks);if(v!==null)return v.toFixed(2);const q=num(r.totalQuestions??r.total_questions);const m=num(r.marksPerCorrect??r.marks_per_correct);return q!==null&&m!==null?(q*m).toFixed(2):"—"};
  const pct=r=>{const v=num(r.percentage??r.percent);return v===null?"—":v.toFixed(1)+"%"};
  const count=(r,keys)=>{for(const k of keys){const v=num(r[k]);if(v!==null)return String(Math.max(0,v))}return "—"};
  const time=r=>{
    let seconds=num(r.timeTaken??r.time_taken??r.elapsedSeconds??r.elapsed_seconds);
    if(seconds===null){const a=Date.parse(r.startedAt??r.started_at??"");const b=Date.parse(r.submittedAt??r.submitted_at??"");if(Number.isFinite(a)&&Number.isFinite(b))seconds=Math.max(0,Math.round((b-a)/1000));}
    if(seconds===null)return "—";
    seconds=Math.max(0,Math.round(seconds)); const m=Math.floor(seconds/60), sec=seconds%60; const h=Math.floor(m/60), mm=m%60;
    return h?`${h}h ${String(mm).padStart(2,"0")}m ${String(sec).padStart(2,"0")}s`:`${mm}m ${String(sec).padStart(2,"0")}s`;
  };
  box.innerHTML=`<div class="studentAttemptHistory">${rows.slice().reverse().map((r,index)=>{
    const scorePct=num(r.percentage??r.percent)??0;
    const pctClass=scorePct>=60?"good":scorePct>0?"mid":"low";
    return `<article class="studentAttemptCard">
      <div class="studentAttemptCardTop">
        <div><div class="attemptEyebrow">ATTEMPT ${rows.length-index}</div><h4>${escapeHTML(r.title||r.testTitle||"Mock Test")}</h4><div class="attemptDate">${formatDate(r.date||r.submittedAt||r.submitted_at||r.started_at)}</div></div>
        <div class="attemptScore ${pctClass}"><b>${pct(r)}</b><span>${marks(r)} / ${maxMarks(r)}</span></div>
      </div>
      <div class="attemptMetrics">
        <span><b>${count(r,["correct","correctAnswers","correct_answers"])}</b> Correct</span>
        <span><b>${count(r,["wrong","wrongAnswers","wrong_answers"])}</b> Wrong</span>
        <span><b>${count(r,["skipped","unanswered","unansweredQuestions","unanswered_questions"])}</b> Skipped</span>
        <span><b>${time(r)}</b> Time</span>
      </div>
      <div class="attemptActionRow"><button type="button" class="viewAttemptBtn" onclick="viewStudentAttempt('${String(r.id||'').replace(/'/g,"\\'")}')">VIEW ATTEMPT</button></div>
    </article>`;
  }).join("")}</div>`;
}

function saveHistoricalAttemptDetail(attemptId, detail){
  if(!attemptId || !detail) return;
  try{
    const key="missionTES_attempt_details_v21";
    const all=JSON.parse(localStorage.getItem(key)||"{}");
    const clean={
      questions:Array.isArray(detail.questions)?detail.questions.map(q=>Array.isArray(q)?q.slice():q):[],
      answers:Array.isArray(detail.answers)?detail.answers.slice():[],
      testTitle:detail.testTitle||"Mock Test",
      testId:detail.testId||null,
      marksPerCorrect:Number.isFinite(Number(detail.marksPerCorrect)) ? Number(detail.marksPerCorrect) : null,
      negativeMarks:Number.isFinite(Number(detail.negativeMarks)) ? Number(detail.negativeMarks) : null,
      maxMarks:Number.isFinite(Number(detail.maxMarks)) ? Number(detail.maxMarks) : null,
      savedAt:new Date().toISOString()
    };
    all[String(attemptId)]=clean;

    // Secondary key makes historical review resilient if the dashboard cache
    // is rebuilt from Supabase and the attempt row loses its embedded detail.
    if(detail.testId){
      all["test:"+String(detail.testId)+":attempt:"+String(attemptId)]=clean;
    }
    localStorage.setItem(key,JSON.stringify(all));

    // Also keep the same detail directly inside the local result row when possible.
    try{
      const rows=JSON.parse(localStorage.getItem("missionTES_results_cache")||"[]");
      if(Array.isArray(rows)){
        const row=rows.find(x=>String(x.id||"")===String(attemptId));
        if(row){
          row.questions=clean.questions.map(q=>Array.isArray(q)?q.slice():q);
          row.answers=clean.answers.slice();
          localStorage.setItem("missionTES_results_cache",JSON.stringify(rows));
        }
      }
    }catch(ignore){}
  }catch(e){ console.warn("Could not cache attempt detail",e); }
}
function loadHistoricalAttemptDetail(attemptId, testId, title){
  try{
    const all=JSON.parse(localStorage.getItem("missionTES_attempt_details_v21")||"{}");
    if(!all || typeof all!=="object") return null;

    const direct=all[String(attemptId)];
    if(direct && Array.isArray(direct.questions) && direct.questions.length) return direct;

    if(testId){
      const byPair=all["test:"+String(testId)+":attempt:"+String(attemptId)];
      if(byPair && Array.isArray(byPair.questions) && byPair.questions.length) return byPair;
    }

    // V4.2: never select an attempt by test title alone.
    // The authoritative identity is the student's attempt ID.
  }catch(e){}
  return null;
}

async function viewStudentAttempt(attemptId){
  try{
    if(!attemptId) throw new Error("Attempt ID is missing.");
    if(!currentStudent) throw new Error("Student session is no longer active.");

    let summary=null;
    try{
      if(supabaseClient && window.HOA_SERVICES?.result?.getAttemptSummary){
        summary=await window.HOA_SERVICES.result.getAttemptSummary(attemptId);
      }
    }catch(e){
      console.warn("HOA attempt summary lookup failed:",e);
    }

    let rows=Array.isArray(window.__hoaStudentResultRows)?window.__hoaStudentResultRows:[];
    let row=rows.find(x=>String(x.id||"")===String(attemptId));

    if(summary){
      row=Object.assign({},row||{},{
        id:summary.id,
        student_id:summary.student_id,
        userId:summary.student_id,
        testId:summary.test_id,
        title:summary.test_title||row?.title||"Mock Test",
        startedAt:summary.started_at,
        submittedAt:summary.submitted_at,
        status:summary.status,
        totalQuestions:Number(summary.total_questions)||0,
        correct:Number(summary.correct_answers)||0,
        wrong:Number(summary.wrong_answers)||0,
        skipped:Number(summary.unanswered)||0,
        marks:Number(summary.score)||0,
        score:Number(summary.score)||0,
        marksPerCorrect:Number(summary.marks_per_question)||1,
        negativeMarks:Number(summary.negative_marking)||0,
        durationMinutes:Number(summary.duration_minutes)||0
      });
      const st=Date.parse(summary.started_at||"");
      const en=Date.parse(summary.submitted_at||"");
      row.timeTaken=Number.isFinite(st)&&Number.isFinite(en)&&en>=st?Math.round((en-st)/1000):0;
      row.maxMarks=row.totalQuestions*row.marksPerCorrect;
      row.percentage=row.maxMarks?Math.max(0,row.marks)/row.maxMarks*100:0;
    }

    if(!row){
      const fresh=await loadResultsFromSupabase(currentStudent.id);
      if(Array.isArray(fresh)){
        window.__hoaStudentResultRows=fresh.slice();
        row=fresh.find(x=>String(x.id||"")===String(attemptId));
      }
    }
    if(!row) throw new Error("This attempt could not be found.");

    let detail=null;
    try{
      if(supabaseClient && window.HOA_SERVICES?.result?.getReview){
        const d=await window.HOA_SERVICES.result.getReview(attemptId);
        if(Array.isArray(d) && d.length) detail=d;
      }
    }catch(e){
      console.warn("HOA secure review lookup failed:",e);
    }

    let rawQs=[], savedAnswers=[];
    if(Array.isArray(detail) && detail.length){
      rawQs=detail.map(q=>[
        q.question_text??"",
        q.option_1??"",
        q.option_2??"",
        q.option_3??"",
        q.option_4??"",
        Number(q.correct_option)||0,
        q.explanation??""
      ]);
      savedAnswers=detail.map(q=>q.selected_option==null?null:Number(q.selected_option));
    }

    if(!rawQs.length){
      const local=loadHistoricalAttemptDetail(attemptId,row.testId,row.title);
      if(local?.questions?.length){
        rawQs=local.questions.map(q=>Array.isArray(q)?q.slice():q);
        savedAnswers=Array.isArray(local.answers)?local.answers.slice():Array(rawQs.length).fill(null);
      }
    }

    if(!rawQs.length){
      const t=(tests||[]).find(x=>String(x.id)===String(row.testId));
      if(t?.questions?.length) rawQs=t.questions.map(q=>Array.isArray(q)?q.slice():q);
    }

    if(!rawQs.length) throw new Error("Historical question review is not available for this attempt.");

    window.__missionTESReviewSnapshot={
      questions:rawQs.map(q=>Array.isArray(q)?q.slice():q),
      answers:savedAnswers.slice(),
      testTitle:row.title||"Mock Test",
      testId:row.testId||null,
      historical:true,
      attemptId:String(attemptId),
      resultRow:row
    };
    window.__missionTESHistoricalAttempt=row;
    reviewCurrent=0;

    try{ await window.MISSION_TES_ExamIntegrity?.stop?.(); }catch(_){}
    try{ await exitHOAExamFullscreen(); }catch(_){}

    const main=document.querySelector("main.container");
    if(main) Array.from(main.children).forEach(node=>{
      if(node.id!=="result") hoaHideNode(node);
    });

    setHOAExamShellMode("result");
    const result=document.getElementById("result");
    if(result){
      showNode(result);
      result.style.setProperty("display","block","important");
    }
    const learningPortal=document.getElementById("hoaV650PaidLearningPortal");
    if(learningPortal){
      learningPortal.hidden=true;
      learningPortal.setAttribute("aria-hidden","true");
      learningPortal.style.setProperty("display","none","important");
    }
    document.getElementById("home")?.classList.add("hidden");
    document.getElementById("exam")?.classList.add("hidden");

    const score=Number(row.marks??row.score)||0;
    const max=Number(row.maxMarks??row.max_marks)||rawQs.length*(Number(row.marksPerCorrect)||1);
    const pct=max?Math.max(0,score)/max*100:0;
    const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v;};
    set("resultTitle",(row.title||"Mock Test")+" — Attempt Review");
    set("score",score.toFixed(2)+" / "+max.toFixed(2));
    set("percentage","Percentage: "+pct.toFixed(2)+"%");
    set("correct",Number(row.correct)||0);
    set("wrong",Number(row.wrong)||0);
    set("skipped",Number(row.skipped)||0);
    set("finalMarks",score.toFixed(2));
    set("resultMarksInfo",score.toFixed(2)+" / "+max.toFixed(2));
    set("resultCorrectInfo",Number(row.correct)||0);
    set("resultWrongInfo",Number(row.wrong)||0);
    set("resultSkippedInfo",Number(row.skipped)||0);
    if(typeof formatElapsedTime==="function") set("resultTimeInfo",formatElapsedTime(Number(row.timeTaken)||0));
    set("reviewSummary",`${Number(row.correct)||0} Correct • ${Number(row.wrong)||0} Wrong • ${Number(row.skipped)||0} Skipped`);

    forceRenderSubmittedQuestionReview();

    const back=document.getElementById("resultBackBtn");
    if(back){
      back.textContent="← BACK TO RESULTS";
      back.onclick=async function(){
        try{
          window.__missionTESReviewSnapshot=null;
          window.__missionTESHistoricalAttempt=null;
          const resultNode=document.getElementById("result");
          if(resultNode){
            resultNode.classList.add("hidden");
            resultNode.setAttribute("aria-hidden","true");
            resultNode.style.setProperty("display","none","important");
            resultNode.style.setProperty("pointer-events","none","important");
          }
          const ctx=window.__hoaExamReturnContext||{};
          if(ctx.origin==='mock-course' && ctx.batchId && typeof window.hoaRestorePreviousMockCourse==='function'){
            await window.hoaRestorePreviousMockCourse(ctx.batchId,'results');
            return;
          }
          restoreHOAStudentSurface();
          showDashboardTab("student");
          await showCandidateSection("result");
          await renderCandidateResults();
        }catch(err){
          console.error("HOA return from attempt review failed:",err);
        }
      };
    }
    return true;
  }catch(e){
    console.error("HOA View Attempt failed:",e);
    alert("Unable to open this attempt review. "+(e?.message||""));
    return false;
  }
}


function showDashboardTab(tab){
  const studentOnly=document.getElementById("studentOnlyDashboard");
  const adminOnly=document.getElementById("adminOnlyDashboard");

  // V5.0.1 security/navigation guard: a logged-in student can only enter the
  // student dashboard. Admin UI is shown only when the Admin session is live.
  if(tab==="student"){
    if(!currentStudent || adminLoggedIn===true){
      if(!currentStudent){
        if(studentOnly) studentOnly.classList.add("hidden");
        if(adminOnly) adminOnly.classList.add("hidden");
        return;
      }
      adminLoggedIn=false;
      adminPreviewMode=false;
      document.body.classList.remove("admin-ui");
    }
    setAuthScreenVisible(false);
    hideStudentExamScreens();
    if(studentOnly) studentOnly.classList.remove("hidden");
    if(adminOnly) adminOnly.classList.add("hidden");
    updateHeaderLogout();
    renderStudentDashboard();
    if(currentStudent && supabaseClient) loadResultsFromSupabase(currentStudent.id).then(fresh=>{
      if(Array.isArray(fresh)){ saveResults(fresh); renderStudentDashboard(); }
    }).catch(e=>console.warn("Result refresh:",e));
    return;
  }

  if(tab==="admin"){
    if(!requireAdmin("the Admin Dashboard")){
      if(studentOnly) studentOnly.classList.add("hidden");
      if(adminOnly) adminOnly.classList.add("hidden");
      return;
    }
    setAuthScreenVisible(false);
    hideStudentExamScreens();
    if(studentOnly) studentOnly.classList.add("hidden");
    if(adminOnly) adminOnly.classList.remove("hidden");
    updateHeaderLogout();
    renderLibrary();renderAdminStudents();renderAdminAccount();
  }
}
function ensureStudentModernUI(){
  const root=document.getElementById('studentOnlyDashboard');
  if(!root) return null;

  let hero=document.getElementById('hoaStudentModernHeader');
  if(!hero){
    hero=document.createElement('section');
    hero.id='hoaStudentModernHeader';
    hero.className='hoa-student-modern-hero';
    hero.innerHTML=`
      <div class="hoa-student-modern-hero-main">
        <div class="hoa-student-modern-avatar" id="hoaStudentModernAvatar">S</div>
        <div class="hoa-student-modern-copy">
          <div class="hoa-student-modern-kicker">HUB OF ASPIRANTS • STUDENT PORTAL</div>
          <h1 id="hoaStudentModernGreeting">Welcome back</h1>
          <p id="hoaStudentModernName">Student</p>
          <div class="hoa-student-modern-meta" id="hoaStudentModernMeta"></div>
        </div>
      </div>
      </div>`;
    const nav=root.querySelector('.candidateSectionNav');
    if(nav) root.insertBefore(hero,nav);
    else root.prepend(hero);
  }

  /* Keep Today's Focus as a useful shortcut strip. It is presentation-only
     and routes through the same existing student workflows. */
  let focus=document.getElementById('hoaStudentFocusStrip');
  if(!focus){
    focus=document.createElement('section');
    focus.id='hoaStudentFocusStrip';
    focus.className='hoa-student-focus-strip';
    focus.innerHTML=`
      <div class="hoa-student-focus-item">
        <span class="hoa-student-focus-icon">🎯</span>
        <div><b>Today's Focus</b><span>Practice consistently and review your results.</span></div>
      </div>
      <div class="hoa-student-focus-actions">
        <button type="button" onclick="showStudent('courses')">OPEN COURSES →</button>
        <button type="button" onclick="showStudent('mock')">PRACTICE NOW →</button>
      </div>`;
    const firstPanel=root.querySelector('.hoa-student-main-panel');
    if(firstPanel) root.insertBefore(focus,firstPanel);
    else {
      const nav=root.querySelector('.candidateSectionNav');
      if(nav && nav.parentNode) nav.parentNode.insertBefore(focus,nav.nextSibling);
    }
  }
  document.getElementById('hoaStudentPreparationTip')?.remove();
  document.querySelector('#studentOnlyDashboard .profileCard')?.setAttribute('data-hoa-legacy-profile','1');

  return hero;
}

function updateStudentModernUI(){
  const hero=ensureStudentModernUI();
  if(!hero) return;
  const s=currentStudent||{};
  const name=String(s.full_name||s.name||'Student').trim()||'Student';
  const first=name.split(/\s+/)[0]||'Student';
  const avatar=name.charAt(0).toUpperCase()||'S';
  const hour=new Date().getHours();
  // Student greeting follows the viewer's local device time.
  // Morning: 00:00–11:59, Afternoon: 12:00–16:59, Evening: 17:00–23:59.
  const greeting=hour<12?'Good morning':hour<17?'Good afternoon':'Good evening';
  const greetingEl=document.getElementById('hoaStudentModernGreeting');
  const nameEl=document.getElementById('hoaStudentModernName');
  const metaEl=document.getElementById('hoaStudentModernMeta');
  const avatarEl=document.getElementById('hoaStudentModernAvatar');
  if(greetingEl) greetingEl.textContent=greeting+', '+first;
  if(nameEl) nameEl.textContent=name;
  if(avatarEl) avatarEl.textContent=avatar;
  if(metaEl){
    const parts=[];
    if(s.email) parts.push(s.email);
    if(s.mobile) parts.push(s.mobile);
    const academic=[s.qualification,s.passout_year,s.college_name].filter(Boolean).join(' · ');
    if(academic) parts.push(academic);
    metaEl.innerHTML=parts.map(x=>`<span>${escapeHTML(String(x))}</span>`).join('');
  }
}

function renderStudentDashboard(){
  ensureStudentModernUI();
  updateStudentModernUI();
  if(typeof window.hoaInstallStudentNativeBottom === 'function') window.hoaInstallStudentNativeBottom();
  const dashboardLogo=document.getElementById("studentDashboardLogo");
  const sourceLogo=document.querySelector("#authScreen .mission-logo");
  if(dashboardLogo && sourceLogo && !dashboardLogo.getAttribute("src")) dashboardLogo.src=sourceLogo.src;
  const allResults=getResults();
  const results=currentStudent?allResults.filter(r=>r.userId===currentStudent.id):[];
  const granular=Boolean(window.hoaV643GranularTestAccess); const granted=window.hoaV643TestGrantIds instanceof Set?window.hoaV643TestGrantIds:new Set(); const availableTests=tests.filter(t=>t.is_published && (t.accessType==="free" || (granular ? granted.has(t.id) : currentStudent?.accessType==="paid")));
  document.getElementById("dashTests").textContent=availableTests.length;
  document.getElementById("dashAttempts").textContent=results.length;
  const scores=results.map(r=>Number(r.percentage)||0);
  document.getElementById("dashBest").textContent=scores.length?Math.max(...scores).toFixed(1)+"%":"0";
  document.getElementById("dashAvg").textContent=scores.length?(scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(1)+"%":"0%";
  const st=document.getElementById("studentTests");
  const studentTests=availableTests;
  if(!studentTests.length){st.innerHTML='<div class="emptyState">No mock tests are currently available for your account.</div>';return}
  st.innerHTML=studentTests.map(t=>`<article class="testItem">
    <div class="testItemInfo">
      <div class="testTitleRow"><b>${escapeHTML(t.title)}</b><span class="statusBadge ${t.accessType==="free"?"freeBadge":"paidBadge"}">${t.accessType==="free"?"FREE":"PAID"}</span></div>
      <div class="testMeta"><span>${t.questions.length} ${t.questions.length===1?"question":"questions"}</span><span>${t.duration} min</span><span>+${t.marks} correct</span><span>−${t.negative} wrong</span></div>
    </div>
    <div class="actions"><button class="startSmall" onclick="startSavedTest('${t.id}')">START TEST</button></div>
  </article>`).join("");
  const badge=document.getElementById("availableTestsBadge");
  if(badge) badge.textContent=`${studentTests.length} ${studentTests.length===1?"TEST":"TESTS"}`;
}
function showTestCountdown(title, onComplete){
 const overlay=document.getElementById("testCountdownOverlay");
 const titleEl=document.getElementById("countdownTestTitle");
 const numberEl=document.getElementById("countdownNumber");
 const messageEl=document.getElementById("countdownMessage");

 if(!overlay){
   if(typeof onComplete==="function") onComplete();
   return;
 }

 titleEl.textContent=title||"Mock Test";
 overlay.classList.remove("hidden");
 overlay.style.display="flex";

 const sequence=[5,4,3,2,1];
 let i=0;

 const step=()=>{
   if(i<sequence.length){
     numberEl.textContent=sequence[i++];
     messageEl.textContent="Starting in...";
     setTimeout(step,1000);
     return;
   }

   numberEl.textContent="✓";
   messageEl.textContent="LET'S BEGIN";

   setTimeout(()=>{
     /* Force-hide the overlay so CSS/UI changes cannot trap the user here. */
     overlay.classList.add("hidden");
     overlay.style.display="none";

     if(typeof onComplete==="function"){
       try{ onComplete(); }
       catch(e){
         console.error("Test launch error:",e);
         alert("The test could not be opened. Please refresh the page and try again.");
       }
     }
   },700);
 };

 step();
}

function openTestInstructions(){
  /* Legacy/manual entry point retained for compatibility. */
  applySettings();
  if(!questions.length){
    alert("No valid questions available.");
    return;
  }
  var modal=document.getElementById("testInstructionsModal");
  if(!modal)return;
  populateTestInstructions({
    title:(window.currentTestTitle||window.selectedTestTitle||testTitle||document.title||"Mock Test"),
    questionCount:questions.length,
    duration:durationMinutes,
    marks:marksPerCorrect,
    negative:negativeMarks
  });
  window.pendingInstructionLaunch=null;
  resetInstructionReadyState();
  document.body.classList.add("test-instructions-active");
  modal.classList.remove("hidden");
}

function populateTestInstructions(info){
  var qCount=Math.max(0,Number(info.questionCount)||0);
  var mins=Math.max(0,Number(info.duration)||0);
  var positive=Math.max(0,Number(info.marks)||0);
  var negative=Math.max(0,Number(info.negative)||0);
  var total=qCount*positive;
  var set=(id,value)=>{var el=document.getElementById(id);if(el)el.textContent=value;};
  set("instructionTestName",info.title||"Mock Test");
  set("instructionQuestions",qCount);
  set("instructionTotalMarks",Number(total).toFixed(2));
  set("instructionDuration",mins+" min");
  set("instructionPositiveMarks","+"+Number(positive).toFixed(2));
  set("instructionNegativeMarks",negative>0?"-"+Number(negative).toFixed(2):"0");
}
function resetInstructionReadyState(){
  var cb=document.getElementById("testReadyCheckbox");
  var btn=document.getElementById("beginTestButton");
  if(cb)cb.checked=false;
  if(btn)btn.disabled=true;
}
function toggleTestReady(){
  var cb=document.getElementById("testReadyCheckbox");
  var btn=document.getElementById("beginTestButton");
  if(cb&&btn)btn.disabled=!cb.checked;
}
function requestHOAExamFullscreenFromGesture(){
  try{
    if(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement) return true;
    var root=document.documentElement;
    var fn=root && (root.requestFullscreen||root.webkitRequestFullscreen||root.msRequestFullscreen);
    if(typeof fn!=="function"){
      document.body.classList.add("hoa-local-exam-immersive");
      return false;
    }
    try{
      var promise=fn.call(root,{navigationUI:"hide"});
      if(promise && typeof promise.catch==="function") promise.catch(function(){
        try{
          var fallback=fn.call(root);
          if(fallback && typeof fallback.catch==="function") fallback.catch(function(){document.body.classList.add("hoa-local-exam-immersive");});
        }catch(_){ document.body.classList.add("hoa-local-exam-immersive"); }
      });
    }catch(_){
      try{
        var fallback=fn.call(root);
        if(fallback && typeof fallback.catch==="function") fallback.catch(function(){document.body.classList.add("hoa-local-exam-immersive");});
      }catch(__){ document.body.classList.add("hoa-local-exam-immersive"); }
    }
    return true;
  }catch(_){
    document.body.classList.add("hoa-local-exam-immersive");
    return false;
  }
}
function closeTestInstructions(keepLaunch){
  const modal=document.getElementById("testInstructionsModal");
  if(modal) modal.classList.add("hidden");
  document.body.classList.remove("test-instructions-active");
  resetInstructionReadyState();

  if(!keepLaunch){
    const source=window.__HOA_EXAM_SOURCE||{};
    document.body.classList.remove("test-launching-active");
    window.pendingInstructionLaunch=null;
    try{ window.MISSION_TES_ExamIntegrity?.cancelLaunch?.(); }catch(_){ }
    try{ setHOAExamShellMode("normal"); }catch(_){ }
    if(source.mode==='free' && source.returnUrl){
      try{ window.__HOA_EXAM_SOURCE=null; window.__hoaExamReturnContext=null; }catch(_){ }
      window.location.href=source.returnUrl;
      return;
    }
    try{ restoreHOAStudentSurface(); }catch(_){ }
    showSuggestionOnNormalStudentSurface();
  }
}
async function confirmAndStartTest(){
  const cb=document.getElementById("testReadyCheckbox");
  if(!cb || !cb.checked){
    if(cb) cb.focus();
    return false;
  }

  const pending=window.pendingInstructionLaunch;
  if(!pending || typeof pending.start!=="function"){
    console.error("HOA: pending Start Exam continuation is missing.");
    alert("The examination could not be started. Please click START TEST again.");
    return false;
  }

  window.selectedTestLanguage=document.getElementById("testLanguageSelect")?.value||"english";

  // Hide the normal dashboard immediately, before fullscreen/countdown work,
  // so the old Home section can never appear behind the launch UI.
  hideNormalSurfacesForExamLaunch();

  // MUST remain synchronous with the Start Exam click.
  requestHOAExamFullscreenFromGesture();

  document.body.classList.add("test-launching-active");
  document.body.classList.remove("test-instructions-active");
  hideSuggestionDuringExamLaunch?.();

  const modal=document.getElementById("testInstructionsModal");
  if(modal){
    modal.classList.add("hidden");
    modal.style.setProperty("display","none","important");
    modal.style.setProperty("visibility","hidden","important");
    modal.style.setProperty("pointer-events","none","important");
  }

  /* The paid Mock Test Course portal is a fixed body-level surface. Hide it
     before the countdown starts so the student never sees the course page
     underneath the exam launch state or integrity overlay. */
  const learningPortal=document.getElementById("hoaV650PaidLearningPortal");
  if(learningPortal){
    learningPortal.hidden=true;
    learningPortal.setAttribute("aria-hidden","true");
    learningPortal.style.setProperty("display","none","important");
    learningPortal.style.setProperty("visibility","hidden","important");
    learningPortal.style.setProperty("pointer-events","none","important");
  }

  // Launch the exact continuation created by startSavedTest().
  try{
    const result=pending.start();
    if(result && typeof result.then==="function") await result;
    return true;
  }catch(e){
    console.error("HOA: Start Exam launch failed:",e);
    try{ window.MISSION_TES_ExamIntegrity?.cancelLaunch?.(); }catch(_){}
    try{ await exitHOAExamFullscreen(); }catch(_){}
    try{ restoreHOAStudentSurface(); }catch(_){}
    alert("The examination could not be started. Please try again.");
    return false;
  }
}
function startSavedTest(id){
  try{ setHOAExamShellMode("launch"); }catch(_){}

  const t=(Array.isArray(tests)?tests:[]).find(x=>String(x.id)===String(id));
  if(!t){
    alert("This test could not be found. Please refresh the Test Section.");
    return;
  }

  const qs=Array.isArray(t.questions)?t.questions.map(q=>Array.isArray(q)?q.slice():q):[];
  if(!qs.length){
    alert("This test has no valid questions available.");
    return;
  }

  // Move out of the normal dashboard as soon as a valid test is selected.
  // The instructions/countdown are body-level surfaces and remain visible.
  hideNormalSurfacesForExamLaunch();

  ++testLaunchToken;
  const launchToken=testLaunchToken;

  clearInterval(interval);
  interval=null;

  const examSource=window.__HOA_EXAM_SOURCE||{};
  adminPreviewMode=(adminLoggedIn===true && currentStudent===null && examSource.mode!=="free");
  activeTestId=t.id;

  questions.length=0;
  qs.forEach(q=>questions.push(q));

  testTitle=String(t.title||"Mock Test");
  durationMinutes=Math.max(1,Number(t.duration)||10);
  marksPerCorrect=Math.max(0,Number(t.marks)||1);
  negativeMarks=Math.max(0,Number(t.negative)||0);
  timer=Math.round(durationMinutes*60);

  current=0;
  answers=Array(questions.length).fill(null);
  pendingAnswers=Array(questions.length).fill(null);
  marked=Array(questions.length).fill(false);
  visited=Array(questions.length).fill(false);
  submitted=false;

  currentAttemptId=null;
  currentAttemptCreatePromise=null;
  currentAttemptLaunchToken=launchToken;

  window.__missionTESLastStartedQuestions=questions.map(q=>Array.isArray(q)?q.slice():q);

  populateTestInstructions({
    title:testTitle,
    questionCount:questions.length,
    duration:durationMinutes,
    marks:marksPerCorrect,
    negative:negativeMarks
  });

  const modal=document.getElementById("testInstructionsModal");
  if(!modal){
    beginSavedTestAfterInstructions(launchToken);
    return;
  }

  window.pendingInstructionLaunch={
    id:t.id,
    token:launchToken,
    start:function(){
      return beginSavedTestAfterInstructions(launchToken);
    }
  };

  resetInstructionReadyState();
  document.body.classList.remove("hoa-phase21-exam-active");
  document.body.classList.add("test-instructions-active");
  document.body.dataset.hoaPhase21Exam="launch";

  modal.classList.remove("hidden");
  modal.style.setProperty("display","flex","important");
  modal.style.setProperty("visibility","visible","important");
  modal.style.setProperty("pointer-events","auto","important");

  hideSuggestionDuringExamLaunch();
}
function setHOAExamShellMode(mode){
  const body=document.body;
  body.classList.remove("hoa-exam-live","hoa-result-live","hoa-launch-live");
  if(mode==="exam") body.classList.add("hoa-exam-live");
  else if(mode==="result") body.classList.add("hoa-result-live");
  else if(mode==="launch") body.classList.add("hoa-launch-live");
  body.dataset.hoaExamMode=mode||"normal";
}

function hoaHideNode(node){
  if(!node)return;
  node.classList.add("hidden");
  node.setAttribute("aria-hidden","true");
  node.style.setProperty("display","none","important");
  node.style.setProperty("visibility","hidden","important");
  node.style.setProperty("pointer-events","none","important");
}

function hideNormalSurfacesForExamLaunch(){
  [
    'home','authScreen','adminOnlyDashboard','studentOnlyDashboard',
    'hoaGlobalPublicFooter','hoaPublicFeedbackStrip','hoaPublicFeedbackModal',
    'hoaFeedbackModal','hoaV650PaidLearningPortal'
  ].forEach(function(id){
    const e=document.getElementById(id);
    if(!e)return;
    e.classList.add('hidden');
    e.setAttribute('aria-hidden','true');
    e.style.setProperty('display','none','important');
    e.style.setProperty('visibility','hidden','important');
    e.style.setProperty('pointer-events','none','important');
  });
}

function hideSuggestionDuringExamLaunch(){
  ['hoaPublicFeedbackStrip','hoaPublicFeedbackModal','hoaFeedbackModal'].forEach(function(id){
    const e=document.getElementById(id);
    if(e){
      e.classList.add('hidden');
      e.setAttribute('aria-hidden','true');
      e.style.setProperty('display','none','important');
      e.style.setProperty('pointer-events','none','important');
    }
  });
  document.querySelectorAll('.hoa-public-feedback-strip,.hoa-public-feedback-btn').forEach(function(e){
    e.classList.add('hidden');
    e.style.setProperty('display','none','important');
    e.style.setProperty('pointer-events','none','important');
  });
}
function showSuggestionOnNormalStudentSurface(){
  if(document.body.classList.contains('hoa-phase21-exam-active') ||
     document.body.classList.contains('test-launching-active') ||
     document.body.classList.contains('test-instructions-active')) return;
  ['hoaPublicFeedbackStrip'].forEach(function(id){
    const e=document.getElementById(id);
    if(e){
      e.classList.remove('hidden');
      e.removeAttribute('aria-hidden');
      e.style.removeProperty('display');
      e.style.removeProperty('pointer-events');
    }
  });
  document.querySelectorAll('.hoa-public-feedback-strip,.hoa-public-feedback-btn').forEach(function(e){
    e.classList.remove('hidden');
    e.style.removeProperty('display');
    e.style.removeProperty('pointer-events');
  });
}
async function exitHOAExamFullscreen(){
  try{
    if(document.fullscreenElement && document.exitFullscreen) return await document.exitFullscreen();
    if(document.webkitFullscreenElement && document.webkitExitFullscreen) return await document.webkitExitFullscreen();
  }catch(_){ }
}

function enterHOAExclusiveExamSurface(){
  const hideIds=[
    "home","authScreen","adminOnlyDashboard","studentOnlyDashboard",
    "hoaGlobalPublicFooter","hoaPublicFeedbackStrip","hoaPublicFeedbackModal",
    "hoaFeedbackModal","testInstructionsModal","hoaV650PaidLearningPortal"
  ];
  hideIds.forEach(function(id){
    const node=document.getElementById(id);
    if(!node)return;
    node.classList.add("hidden");
    node.setAttribute("aria-hidden","true");
    node.style.setProperty("display","none","important");
  });
  const exam=document.getElementById("exam");
  if(exam){
    exam.classList.remove("hidden");
    exam.setAttribute("aria-hidden","false");
    exam.style.setProperty("display","block","important");
    exam.style.setProperty("visibility","visible","important");
    exam.style.setProperty("opacity","1","important");
  }
}

function restoreHOAStudentSurface(){
  ["authScreen","adminOnlyDashboard","studentOnlyDashboard","hoaGlobalPublicFooter",
   "hoaPublicFeedbackStrip"].forEach(function(id){
    const node=document.getElementById(id);
    if(!node)return;
    node.classList.remove("hidden");
    node.removeAttribute("aria-hidden");
    node.style.removeProperty("display");
    node.style.removeProperty("visibility");
    node.style.removeProperty("opacity");
  });

  // Feedback is a normal-dashboard affordance, but its dialog must NEVER be
  // restored open merely because the student returned from an exam/result.
  ["hoaPublicFeedbackModal","hoaFeedbackModal"].forEach(function(id){
    const node=document.getElementById(id);
    if(!node)return;
    node.classList.add("hidden");
    node.setAttribute("aria-hidden","true");
    node.style.setProperty("display","none","important");
    node.style.setProperty("visibility","hidden","important");
    node.style.setProperty("pointer-events","none","important");
  });
  document.body.classList.remove("hoa-feedback-open");
  document.body.setAttribute("data-hoa-feedback-state","closed");
  const feedbackStrip=document.getElementById("hoaPublicFeedbackStrip");
  if(feedbackStrip)feedbackStrip.setAttribute("data-hoa-feedback-state","closed");
  const exam=document.getElementById("exam");
  if(exam){
    exam.classList.add("hidden");
    exam.setAttribute("aria-hidden","true");
    exam.style.removeProperty("display");
    exam.style.removeProperty("visibility");
    exam.style.removeProperty("opacity");
  }
  const learningPortal=document.getElementById("hoaV650PaidLearningPortal");
  if(learningPortal){
    learningPortal.hidden=true;
    learningPortal.setAttribute("aria-hidden","true");
    learningPortal.style.setProperty("display","none","important");
    learningPortal.style.removeProperty("visibility");
    learningPortal.style.removeProperty("pointer-events");
  }
}

function beginSavedTestAfterInstructions(launchToken){
  if(launchToken!==testLaunchToken || !questions.length) return false;

  document.body.classList.add("test-launching-active");
  document.body.classList.remove("test-instructions-active");
  hideSuggestionDuringExamLaunch();

  const actualExam=()=>{
    if(launchToken!==testLaunchToken || submitted) return;

    clearInterval(interval);
    interval=null;

    const overlay=document.getElementById("testCountdownOverlay");
    if(overlay){
      overlay.classList.add("hidden");
      overlay.style.setProperty("display","none","important");
      overlay.style.setProperty("visibility","hidden","important");
      overlay.style.setProperty("pointer-events","none","important");
    }

    setHOAExamShellMode("exam");
    enterHOAExclusiveExamSurface();

    document.body.classList.remove("test-launching-active","test-instructions-active");
    document.body.classList.add("hoa-phase21-exam-active","v13-exam-active","exam-active");
    document.body.dataset.hoaPhase21Exam="active";

    const exam=document.getElementById("exam");
    const headerTimer=document.getElementById("headerTimer");
    const previewExit=document.getElementById("adminPreviewExit");

    if(exam){
      exam.classList.remove("hidden");
      exam.removeAttribute("aria-hidden");
      exam.style.setProperty("display","block","important");
      exam.style.setProperty("visibility","visible","important");
      exam.style.setProperty("opacity","1","important");
      exam.style.setProperty("pointer-events","auto","important");
    }
    if(headerTimer) headerTimer.classList.remove("hidden");
    if(previewExit) previewExit.classList.toggle("hidden",!adminPreviewMode);

    examStartedAt=Date.now();
    examStartedPerf=typeof performance!=="undefined"?performance.now():null;
    timer=Math.max(1,Math.round((Number(durationMinutes)||10)*60));
    current=0;
    answers=Array(questions.length).fill(null);
    pendingAnswers=Array(questions.length).fill(null);
    marked=Array(questions.length).fill(false);
    visited=Array(questions.length).fill(false);
    submitted=false;

    try{
      render();
    }catch(e){
      console.error("HOA actual exam render failed:",e);
      alert("The examination screen could not be loaded. Please refresh and try again.");
      return;
    }

    // Integrity starts ONLY after the actual question screen is rendered.
    if(window.MISSION_TES_ExamIntegrity && !adminPreviewMode){
      try{ window.MISSION_TES_ExamIntegrity.activate(); }
      catch(e){ console.warn("HOA integrity activation failed:",e); }
    }

    updateTimer();

    interval=setInterval(function(){
      if(submitted || document.body.dataset.hoaPhase21Exam!=="active") return;
      if(timer<=0){
        clearInterval(interval);
        interval=null;
        submitTest(true);
        return;
      }
      timer--;
      updateTimer();
    },1000);

    const examSource=window.__HOA_EXAM_SOURCE||{};
    if(!adminPreviewMode && supabaseClient && (currentStudent || examSource.mode==='free')){
      const thisLaunch=launchToken;
      try{
        currentAttemptCreatePromise=createAttemptInSupabase(activeTestId,questions.length).then(function(id){
          /* The Free Test has no currentStudent profile.  Its attempt ID is still
             the authoritative submission key and must be retained exactly like a
             paid attempt.  submitTest() also awaits this promise as a race-safe
             fallback, but keeping the ID here removes the free-only null window. */
          if(thisLaunch===testLaunchToken && !submitted && id){
            currentAttemptId=id;
          }
          return id;
        });
        currentAttemptCreatePromise.catch(function(e){
          console.error("HOA attempt creation failed:",e);
        });
      }catch(e){
        console.error("HOA attempt creation could not start:",e);
      }
    }
  };

  try{
    if(typeof showTestCountdown==="function"){
      showTestCountdown(testTitle,actualExam);
    }else{
      actualExam();
    }
  }catch(e){
    console.error("HOA countdown failed:",e);
    actualExam();
  }
  return true;
}
function startTest(){
  examStartedAt=Date.now();
  examStartedPerf=(typeof performance!="undefined"?performance.now():null);


 applySettings();
 if(!questions.length){alert("No valid questions available.");return}
 clearInterval(interval);
 interval=null;
 current=0; answers=Array(questions.length).fill(null); pendingAnswers=Array(questions.length).fill(null); marked=Array(questions.length).fill(false); visited=Array(questions.length).fill(false); submitted=false; timer=Math.round(durationMinutes*60);
 document.getElementById("home").classList.add("hidden");
 document.getElementById("exam").classList.remove("hidden");
 document.getElementById("headerTimer").classList.remove("hidden");
 render();
 interval=setInterval(tick,1000);
}
function tick(){
 if(timer<=0){clearInterval(interval);submitTest(true);return}
 timer--;
 updateTimer();
}
function updateTimer(){
 let m=Math.floor(timer/60),s=timer%60;
 let t=String(m).padStart(2,"0")+":"+String(s).padStart(2,"0");
 document.getElementById("examTimer").textContent=t;
 document.getElementById("headerTimer").textContent=t;
}
function render(){
 const q=questions[current];
 if(!q)return;
 if(!Array.isArray(marked) || marked.length!==questions.length) marked=Array(questions.length).fill(false);
 if(!Array.isArray(visited) || visited.length!==questions.length) visited=Array(questions.length).fill(false);
 if(!Array.isArray(pendingAnswers) || pendingAnswers.length!==questions.length) pendingAnswers=Array(questions.length).fill(null);
 visited[current]=true;

 const qno=document.getElementById("questionNo");
 const meta=document.getElementById("examMeta");
 const text=document.getElementById("questionText");
 const box=document.getElementById("options");
 if(qno)qno.textContent=`Question ${current+1} of ${questions.length}`;
 if(meta)meta.textContent=`Question ${current+1} / ${questions.length}`;
 if(text)text.textContent=q[0];

 /* A selected option is only a draft until Save & Next / Mark for Review. */
 const draft=pendingAnswers[current] ?? answers[current] ?? null;
 if(box){
   box.innerHTML="";
   for(let i=1;i<=4;i++){
     const b=document.createElement("button");
     b.type="button";
     b.className="option"+(draft===i?" selected":"");
     b.textContent=`${String.fromCharCode(64+i)}. ${q[i]}`;
     b.onclick=()=>{
       if(window.MISSION_TES_ExamIntegrity)window.MISSION_TES_ExamIntegrity.markInternalInteraction(1000);
       pendingAnswers[current]=i;
       answers[current]=i;
       visited[current]=true;
       render();
     };
     box.appendChild(b);
   }
 }
 const bar=document.getElementById("bar");
 if(bar)bar.style.width=((current+1)/questions.length*100)+"%";

 const pal=document.getElementById("palette");
 if(pal){
   pal.innerHTML="";
   questions.forEach((_,i)=>{
     const b=document.createElement("button");
     b.type="button";
     const hasAnswer=answers[i]!==null&&answers[i]!==undefined&&answers[i]!=="";
     const isMarked=!!marked[i];
     const wasVisited=!!visited[i];
     b.className="ui21-palette-btn";
     if(i===current)b.classList.add("current");
     let paletteStatus;
     if(hasAnswer&&isMarked){b.classList.add("marked-answered");paletteStatus="marked-answered";}
     else if(isMarked){b.classList.add("marked");paletteStatus="marked";}
     else if(hasAnswer){b.classList.add("answered");paletteStatus="answered";}
     else if(wasVisited){b.classList.add("not-answered");paletteStatus="not-answered";}
     else {b.classList.add("not-visited");paletteStatus="not-visited";}
     b.dataset.status=paletteStatus;
     b.textContent=String(i+1)+(hasAnswer&&isMarked?" ✓":"");
     b.setAttribute("aria-label",`Question ${i+1}: ${hasAnswer&&isMarked?"Answered and marked for review":isMarked?"Marked for review":hasAnswer?"Answered":wasVisited?"Not answered":"Not visited"}`);
     b.onclick=()=>{
       if(window.MISSION_TES_ExamIntegrity)window.MISSION_TES_ExamIntegrity.markInternalInteraction(1000);
       /* Palette navigation must never discard the currently selected answer. */
       answers[current]=pendingAnswers[current] ?? answers[current] ?? null;
       current=i;
       pendingAnswers[i]=answers[i] ?? pendingAnswers[i] ?? null;
       render();
     };
     pal.appendChild(b);
   });
 }
 const review=document.getElementById("ui21MarkReview");
 if(review)review.classList.toggle("active",!!marked[current]);
}

function renderResultReview(){
  const snap=window.__missionTESReviewSnapshot||{};
  let rawQs=Array.isArray(snap.questions)&&snap.questions.length?snap.questions:null;

  if(!rawQs && Array.isArray(window.__missionTESLastStartedQuestions)&&window.__missionTESLastStartedQuestions.length){
    rawQs=window.__missionTESLastStartedQuestions;
  }
  if(!rawQs && Array.isArray(tests)){
    const active=tests.find(t=>String(t.id)===String(activeTestId));
    if(active && Array.isArray(active.questions)&&active.questions.length) rawQs=active.questions;
  }
  if(!rawQs && Array.isArray(questions)&&questions.length) rawQs=questions;
  if(!rawQs) rawQs=[];

  const normalize=(q)=>{
    if(Array.isArray(q)){
      const a=q.slice(0,7);
      while(a.length<7)a.push("");
      let c=String(a[5]??"").trim().toUpperCase();
      const map={A:1,B:2,C:3,D:4};
      if(map[c])a[5]=map[c];
      else if(Number.isFinite(Number(c)))a[5]=Number(c);
      return a;
    }
    if(q && typeof q==="object"){
      let c=String(q.correct_option??q.correct??q.answer??"").trim().toUpperCase();
      const map={A:1,B:2,C:3,D:4};
      return [
        q.question_text??q.question??q.text??"",
        q.option_1??q.option1??"",
        q.option_2??q.option2??"",
        q.option_3??q.option3??"",
        q.option_4??q.option4??"",
        map[c]??(Number.isFinite(Number(c))?Number(c):0),
        q.explanation??""
      ];
    }
    return null;
  };

  const qs=rawQs.map(normalize).filter(q=>q);
  if(!qs.length)return;

  let reviewAnswers=Array.isArray(snap.answers)?snap.answers:
                     (Array.isArray(answers)?answers:[]);
  reviewCurrent=Math.max(0,Math.min(Number(reviewCurrent)||0,qs.length-1));

  const q=qs[reviewCurrent];
  const rawAnswer=reviewCurrent<reviewAnswers.length?reviewAnswers[reviewCurrent]:null;
  const answer=(rawAnswer===null||rawAnswer===undefined||rawAnswer==="")?null:Number(rawAnswer);
  const correct=Number(q[5])||0;

  const no=document.getElementById("reviewQuestionNo");
  const text=document.getElementById("reviewQuestionText");
  const box=document.getElementById("reviewOptions");

  if(no){
    no.textContent="Question "+(reviewCurrent+1)+" of "+qs.length;
    no.hidden=false;
    no.style.cssText+=";display:block!important;visibility:visible!important;opacity:1!important;";
  }
  if(text){
    text.textContent=String(q[0]??"");
    text.hidden=false;
    text.style.cssText+=";display:block!important;visibility:visible!important;opacity:1!important;";
  }

  if(box){
    box.innerHTML="";
    box.hidden=false;
    box.style.cssText+=";display:block!important;visibility:visible!important;opacity:1!important;";
    for(let i=1;i<=4;i++){
      const row=document.createElement("div");
      row.className="reviewOption";
      if(i===correct)row.classList.add("reviewCorrect");
      if(answer===i && answer!==correct)row.classList.add("reviewWrong");
      if(answer===i && answer===correct)row.classList.add("reviewYourCorrect");

      const label=document.createElement("span");
      label.textContent=String.fromCharCode(64+i)+". "+String(q[i]??"");
      row.appendChild(label);

      if(i===correct || answer===i){
        const tag=document.createElement("span");
        tag.className="reviewTag";
        tag.textContent=i===correct?(answer===i?"✓ CORRECT":"✓ CORRECT ANSWER"):"✕ WRONG";
        row.appendChild(tag);
      }
      box.appendChild(row);
    }
  }

  const status=document.getElementById("reviewStatus");
  if(status){
    status.hidden=false;
    if(answer===null){
      status.textContent="⚪ NOT ANSWERED • Correct answer: "+(correct?String.fromCharCode(64+correct):"—")+". "+String(correct?q[correct]??"":"");
      status.style.color="#64748b";
    }else if(answer===correct){
      status.textContent="✓ CORRECT — Your answer is correct.";
      status.style.color="#087443";
    }else{
      status.textContent="✕ WRONG — Your answer was incorrect. Correct answer: "+(correct?String.fromCharCode(64+correct):"—")+". "+String(correct?q[correct]??"":"");
      status.style.color="#b42318";
    }
    status.style.cssText+=";display:block!important;visibility:visible!important;";
  }

  const explanation=document.getElementById("reviewExplanation");
  if(explanation){
    explanation.hidden=false;
    explanation.innerHTML=q[6]?("<b>Explanation:</b> "+escapeHTML(String(q[6]))):"";
    explanation.style.cssText+=";display:block!important;visibility:visible!important;";
  }

  const pal=document.getElementById("reviewPalette");
  if(pal){
    pal.innerHTML="";
    qs.forEach((q2,i)=>{
      const b=document.createElement("button");
      b.type="button";
      b.className="reviewPbtn";
      const aa=i<reviewAnswers.length?reviewAnswers[i]:null;
      if(i===reviewCurrent)b.classList.add("current");
      if(aa===null||aa===undefined||aa==="")b.classList.add("skippedQ");
      else if(Number(aa)===Number(q2[5]))b.classList.add("correctQ");
      else b.classList.add("wrongQ");
      b.textContent=i+1;
      b.onclick=()=>{reviewCurrent=i;renderResultReview();};
      pal.appendChild(b);
    });
  }
}


function forceRenderSubmittedQuestionReview(){
  try{
    // V2.0.1 robust renderer: the review must render from the submitted snapshot,
    // even when the dashboard/test arrays have been replaced or the page was reloaded.
    let snap=window.__missionTESReviewSnapshot||{};
    const parseArray=(v)=>{
      if(Array.isArray(v)) return v;
      if(typeof v==='string'){
        try{ const x=JSON.parse(v); return Array.isArray(x)?x:[]; }catch(e){ return []; }
      }
      return [];
    };
    let qs=parseArray(snap.questions);
    let ans=parseArray(snap.answers);

    // Historical attempt cache fallback.
    if(!qs.length && window.__missionTESHistoricalAttempt){
      qs=parseArray(window.__missionTESHistoricalAttempt.questions);
      if(!ans.length) ans=parseArray(window.__missionTESHistoricalAttempt.answers);
    }

    // Current submission fallback.
    if(!qs.length) qs=parseArray(window.__missionTESLastStartedQuestions);
    if(!ans.length) ans=parseArray(window.answers);

    // Test cache fallback — important after refresh / navigation.
    if(!qs.length){
      try{
        const cached=JSON.parse(localStorage.getItem('missionTES_tests_cache')||'[]');
        const list=Array.isArray(cached)?cached:[];
        const t=list.find(x=>String(x.id)===String(snap.testId||activeTestId)) ||
                  list.find(x=>String(x.title||'')===String(snap.testTitle||testTitle||''));
        if(t && Array.isArray(t.questions)) qs=t.questions;
      }catch(e){}
    }
    if(!qs.length && Array.isArray(tests)){
      const t=tests.find(x=>String(x.id)===String(snap.testId||activeTestId)) ||
              tests.find(x=>String(x.title||'')===String(snap.testTitle||testTitle||''));
      if(t && Array.isArray(t.questions)) qs=t.questions;
    }
    if(!qs.length && Array.isArray(questions)) qs=questions;

    const normalizeOption=(v)=>{
      if(v===null||v===undefined||v==='') return 0;
      const x=String(v).trim().toUpperCase();
      if(x==='A')return 1;if(x==='B')return 2;if(x==='C')return 3;if(x==='D')return 4;
      const n=Number(v);return Number.isFinite(n)&&n>=1&&n<=4?n:0;
    };
    const normalizeQuestion=(q)=>{
      if(Array.isArray(q)){
        const a=q.slice(0,7); while(a.length<7)a.push('');
        a[5]=normalizeOption(a[5]); return a;
      }
      if(q && typeof q==='object'){
        return [
          q.question_text??q.question??q.text??'',
          q.option_1??q.option1??'', q.option_2??q.option2??'',
          q.option_3??q.option3??'', q.option_4??q.option4??'',
          normalizeOption(q.correct_option??q.correct??q.answer),
          q.explanation??''
        ];
      }
      return null;
    };
    qs=qs.map(normalizeQuestion).filter(q=>q && String(q[0]||'').trim());
    if(!qs.length){
      console.warn('MISSION TES: Answer Review has no question data', {snapshot:snap, historical:window.__missionTESHistoricalAttempt});
      return false;
    }

    window.__missionTESReviewSnapshot={...snap,questions:qs,answers:ans.slice(),testId:snap.testId||activeTestId,testTitle:snap.testTitle||testTitle||'Mock Test'};

    const idx=Math.max(0,Math.min(Number(window.reviewCurrent ?? reviewCurrent)||0,qs.length-1));
    reviewCurrent=idx;
    window.reviewCurrent=idx;
    const q=qs[idx], correct=normalizeOption(q[5]);
    const rawAns=idx<ans.length?ans[idx]:null;
    const student=normalizeOption(rawAns)||null;

    const no=document.getElementById('reviewQuestionNo');
    const qt=document.getElementById('reviewQuestionText');
    const opts=document.getElementById('reviewOptions');
    const status=document.getElementById('reviewStatus');
    const expl=document.getElementById('reviewExplanation');
    const pal=document.getElementById('reviewPalette');

    if(no){no.textContent=`Question ${idx+1} of ${qs.length}`;no.hidden=false;no.style.setProperty('display','block','important');}
    if(qt){qt.textContent=String(q[0]||'');qt.hidden=false;qt.style.setProperty('display','block','important');}

    if(opts){
      opts.innerHTML=''; opts.hidden=false; opts.style.setProperty('display','block','important');
      for(let i=1;i<=4;i++){
        const row=document.createElement('div'); row.className='reviewOption';
        const isCorrect=i===correct, isStudent=student===i;
        if(isCorrect&&isStudent)row.classList.add('reviewYourCorrect');
        else if(isCorrect)row.classList.add('reviewCorrect');
        else if(isStudent)row.classList.add('reviewWrong');
        const label=document.createElement('span'); label.textContent=String.fromCharCode(64+i)+'. '+String(q[i]??''); row.appendChild(label);
        if(isCorrect||isStudent){const tag=document.createElement('span');tag.className='reviewTag';tag.textContent=(isCorrect&&isStudent)?'✓ CORRECT':(isCorrect?'✓ CORRECT ANSWER':'✕ WRONG');row.appendChild(tag);}
        opts.appendChild(row);
      }
    }
    if(status){
      status.hidden=false; status.style.setProperty('display','block','important');
      if(!student){status.textContent=`⚪ NOT ANSWERED • Correct answer: ${correct?String.fromCharCode(64+correct):'—'}`;status.style.color='#64748b';}
      else if(student===correct){status.textContent='✓ CORRECT — Your answer is correct.';status.style.color='#087443';}
      else{status.textContent=`✕ WRONG — Your answer was incorrect. Correct answer: ${correct?String.fromCharCode(64+correct):'—'}`;status.style.color='#b42318';}
    }
    if(expl){const e=String(q[6]||'');expl.textContent=e?'Explanation: '+e:'';expl.style.setProperty('display',e?'block':'none','important');}
    if(pal){
      pal.innerHTML='';pal.style.setProperty('display','grid','important');
      qs.forEach((q2,i)=>{const b=document.createElement('button');b.type='button';b.className='reviewPbtn';const a=normalizeOption(ans[i])||null,c=normalizeOption(q2[5]);if(i===idx)b.classList.add('current');if(!a)b.classList.add('skippedQ');else if(a===c)b.classList.add('correctQ');else b.classList.add('wrongQ');b.textContent=String(i+1);b.onclick=()=>{reviewCurrent=i;window.reviewCurrent=i;forceRenderSubmittedQuestionReview();};pal.appendChild(b);});
    }
    return true;
  }catch(err){console.error('MISSION TES result review render failed:',err);return false;}
}
function previousReviewQuestion(){
  // Historical review navigation must keep the shared/window index in sync.
  // The renderer reads window.reviewCurrent, so changing only the local
  // variable causes navigation to jump back to Question 1.
  const snap=window.__missionTESReviewSnapshot||{};
  const total=(snap&&Array.isArray(snap.questions))
    ? snap.questions.length
    : (Array.isArray(questions)?questions.length:0);
  reviewCurrent=Math.max(0, Math.min(Number(reviewCurrent)||0, Math.max(0,total-1)));
  if(reviewCurrent>0){
    reviewCurrent--;
    window.reviewCurrent=reviewCurrent;
    forceRenderSubmittedQuestionReview();
  }
}
function nextReviewQuestion(){
  // Keep both references synchronized before rendering the new question.
  const snap=window.__missionTESReviewSnapshot||{};
  const total=(snap&&Array.isArray(snap.questions))
    ? snap.questions.length
    : (Array.isArray(questions)?questions.length:0);
  reviewCurrent=Math.max(0, Math.min(Number(reviewCurrent)||0, Math.max(0,total-1)));
  if(reviewCurrent<total-1){
    reviewCurrent++;
    window.reviewCurrent=reviewCurrent;
    forceRenderSubmittedQuestionReview();
  }
}
function returnToStudentDashboard(){
  setHOAExamShellMode("normal");
  if(window.MISSION_TES_ExamIntegrity && typeof window.MISSION_TES_ExamIntegrity.stop==='function'){
    try{ window.MISSION_TES_ExamIntegrity.stop(); }catch(e){}
  }
  document.body.classList.remove("test-instructions-active","test-launching-active","v13-exam-active","exam-active");
  if(typeof closeMissionSubmitConfirmation==="function") closeMissionSubmitConfirmation();
  if(!currentStudent){
    setAuthScreenVisible(true);
    document.getElementById("adminOnlyDashboard")?.classList.add("hidden");
    document.getElementById("studentOnlyDashboard")?.classList.add("hidden");
    return;
  }
  adminLoggedIn=false;
  adminPreviewMode=false;
  document.body.classList.remove("admin-ui");
  document.getElementById("adminOnlyDashboard")?.classList.add("hidden");
  clearInterval(interval);
  interval=null;
  currentAttemptId=null;
  currentAttemptCreatePromise=null;
  currentAttemptLaunchToken=0;
  activeTestId=null;
  window.__missionTESReviewSnapshot=null;
  adminPreviewMode=false;
  document.getElementById("result").classList.add("hidden");
  document.getElementById("headerTimer").classList.add("hidden");
  restoreHOAStudentSurface();
  document.getElementById("home").classList.remove("hidden");
  showDashboardTab("student");
  renderStudentDashboard();
}
function formatElapsedTime(totalSeconds){
  var s=Math.max(0,Number(totalSeconds)||0);
  var h=Math.floor(s/3600);
  var m=Math.floor((s%3600)/60);
  var sec=s%60;
  if(h>0) return h+"h "+String(m).padStart(2,"0")+"m "+String(sec).padStart(2,"0")+"s";
  return m+"m "+String(sec).padStart(2,"0")+"s";
}

function populateResultMetrics(marks, maxMarksValue, correctValue, wrongValue, skippedValue, timeSeconds){
  var marksEl=document.getElementById("resultMarksInfo");
  var correctEl=document.getElementById("resultCorrectInfo");
  var wrongEl=document.getElementById("resultWrongInfo");
  var skippedEl=document.getElementById("resultSkippedInfo");
  var timeEl=document.getElementById("resultTimeInfo");
  if(marksEl)marksEl.textContent=(Number.isFinite(Number(marks))?Number(marks).toFixed(2):"0.00")+" / "+(Number.isFinite(Number(maxMarksValue))?Number(maxMarksValue).toFixed(2):"0.00");
  if(correctEl)correctEl.textContent=String(Number.isFinite(Number(correctValue))?Number(correctValue):0);
  if(wrongEl)wrongEl.textContent=String(Number.isFinite(Number(wrongValue))?Number(wrongValue):0);
  if(skippedEl)skippedEl.textContent=String(Number.isFinite(Number(skippedValue))?Number(skippedValue):0);
  if(timeEl)timeEl.textContent=formatElapsedTime(Number.isFinite(Number(timeSeconds))?Number(timeSeconds):0);
}


function openMissionSubmitConfirmation(){
  const overlay=document.getElementById("missionSubmitConfirm");
  if(!overlay)return;
  let answered=0, review=0, visited=0;
  if(Array.isArray(answers)){
    answered=answers.filter(a=>a!==null&&a!==undefined).length;
  }
  if(typeof questionStatus!=="undefined" && Array.isArray(questionStatus)){
    review=questionStatus.filter(s=>s==="review"||s==="marked"||s==="marked_review").length;
    visited=questionStatus.filter(s=>s==="visited"||s==="answered"||s==="review"||s==="marked"||s==="marked_review").length;
  }else if(typeof visitedQuestions!=="undefined" && Array.isArray(visitedQuestions)){
    visited=visitedQuestions.filter(Boolean).length;
  }else{
    // A question with a selected answer is necessarily visited.
    visited=answered;
  }
  const total=Array.isArray(questions)?questions.length:0;
  const notAnswered=Math.max(0,total-answered);
  const notVisited=Math.max(0,total-visited);

  const set=(id,value)=>{const e=document.getElementById(id);if(e)e.textContent=String(value)};
  set("submitSummaryTotal",total);
  set("submitSummaryAnswered",answered);
  set("submitSummaryNotAnswered",notAnswered);
  set("submitSummaryReview",review);
  set("submitSummaryNotVisited",notVisited);

  if(overlay.parentElement!==document.body) document.body.appendChild(overlay);
  overlay.classList.add("show");
  overlay.style.setProperty("display","flex","important");
  overlay.style.setProperty("visibility","visible","important");
  overlay.style.setProperty("opacity","1","important");
  overlay.style.setProperty("pointer-events","auto","important");
  overlay.setAttribute("aria-hidden","false");
  document.body.classList.add("mission-submit-open");
}

function closeMissionSubmitConfirmation(){
  const overlay=document.getElementById("missionSubmitConfirm");
  if(!overlay)return;
  overlay.classList.remove("show");
  overlay.style.setProperty("display","none","important");
  overlay.setAttribute("aria-hidden","true");
  document.body.classList.remove("mission-submit-open");
}

function confirmMissionSubmit(){
  closeMissionSubmitConfirmation();
  submitTest(true);
}

(function bindMissionSubmitConfirmation(){
  const ready=()=>{
    const close=document.getElementById("missionSubmitClose");
    const closeX=document.getElementById("missionSubmitCloseX");
    const confirm=document.getElementById("missionSubmitConfirmBtn");
    const overlay=document.getElementById("missionSubmitConfirm");
    if(!close||!confirm||!overlay){
      setTimeout(ready,50);
      return;
    }
    close.onclick=closeMissionSubmitConfirmation;
    if(closeX)closeX.onclick=closeMissionSubmitConfirmation;
    confirm.onclick=confirmMissionSubmit;
    overlay.addEventListener("click",function(e){
      if(e.target===overlay) closeMissionSubmitConfirmation();
    });
    document.addEventListener("keydown",function(e){
      if(e.key==="Escape" && overlay.classList.contains("show")){
        closeMissionSubmitConfirmation();
      }
    });
  };
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",ready);
  else ready();
})();
async function submitTest(forceSubmit=false){
  if(submitted)return;
  if(!forceSubmit){
    openMissionSubmitConfirmation();
    return;
  }

  submitted=true;
  try{ if(window.MISSION_TES_ExamIntegrity?.beginSubmission) window.MISSION_TES_ExamIntegrity.beginSubmission(); }catch(_){ }
  clearInterval(interval); interval=null;
  const source=window.__HOA_EXAM_SOURCE||{mode:'paid'};
  const isFree=source.mode==='free';

  const liveQuestions=Array.isArray(questions)?questions.map(q=>Array.isArray(q)?q.slice():q):[];
  const liveAnswers=Array.isArray(answers)?answers.slice():[];
  window.__missionTESReviewSnapshot={
    questions:liveQuestions,
    answers:liveAnswers,
    testTitle:testTitle,
    testId:activeTestId||source.testId||null
  };

  let correct=0,wrong=0,skipped=0;
  liveQuestions.forEach((q,i)=>{
    const a=liveAnswers[i];
    if(a===null||a===undefined||a==='') skipped++;
    else if(Number(q?.[5])>0 && Number(a)===Number(q[5])) correct++;
    else wrong++;
  });
  let marks=(correct*Number(marksPerCorrect||0))-(wrong*Number(negativeMarks||0));
  let maxMarks=liveQuestions.length*Number(marksPerCorrect||0);
  let elapsedSeconds=(typeof durationMinutes==='number'&&Number.isFinite(durationMinutes))
    ?Math.max(0,Math.round((durationMinutes*60)-Number(timer||0)))
    :(examStartedAt?Math.max(0,Math.round((Date.now()-examStartedAt)/1000)):0);
  let pct=maxMarks>0?(Math.max(0,marks)/maxMarks*100).toFixed(2):'0.00';
  window.__missionTESCurrentElapsedSeconds=elapsedSeconds;

  let authoritativeReviewRows=null;
  let secureSubmitted=false;

  try{
    // Ensure the attempt exists before submitting. For Free tests there is no
    // authenticated student profile; the Free adapter owns this path.
    if(!adminPreviewMode && !currentAttemptId && currentAttemptCreatePromise){
      try{ currentAttemptId=await currentAttemptCreatePromise; }
      catch(e){ throw new Error('The examination attempt could not be initialized. '+(e?.message||e)); }
    }

    if(adminPreviewMode){
      // Admin preview intentionally does not persist an attempt.
    }else if(isFree){
      if(!supabaseClient) throw new Error('Supabase is not ready.');
      if(!source.token) throw new Error('Free Test access session is missing.');
      if(!currentAttemptId) throw new Error('The Free Test attempt was not created.');
      const secureResult=await window.HOA_SERVICES.free.submitAttempt(
        String(source.token), String(currentAttemptId),
        liveAnswers.map(v=>v==null?null:Number(v)), elapsedSeconds
      );
      if(!secureResult || secureResult.attempt_id==null) throw new Error('Secure Free Test submission failed.');
      secureSubmitted=true;
      correct=Number(secureResult.correct||0);
      wrong=Number(secureResult.wrong||0);
      skipped=Number(secureResult.skipped||0);
      marks=Number(secureResult.score||0);
      maxMarks=Number(secureResult.max_score||maxMarks);
      if(Number.isFinite(Number(secureResult.time_taken))) elapsedSeconds=Number(secureResult.time_taken);
      pct=maxMarks>0?(Math.max(0,marks)/maxMarks*100).toFixed(2):'0.00';

      try{
        const rows=await window.HOA_SERVICES.free.getReview(String(source.token),String(currentAttemptId));
        authoritativeReviewRows=Array.isArray(rows)&&rows.length?rows:null;
      }catch(e){
        console.warn('Free Test review fetch after submit failed; retaining secure result.',e);
      }
      if(authoritativeReviewRows){
        window.__missionTESReviewSnapshot={
          questions:authoritativeReviewRows.map(q=>[
            q.question_text??'',q.option_1??'',q.option_2??'',q.option_3??'',q.option_4??'',Number(q.correct_option)||0,q.explanation??'',q.question_id||null
          ]),
          answers:authoritativeReviewRows.map(q=>q.selected_option==null?null:Number(q.selected_option)),
          testTitle,
          testId:activeTestId||source.testId||null,
          historical:true,
          attemptId:String(currentAttemptId)
        };
        try{
          saveHistoricalAttemptDetail(String(currentAttemptId),{
            questions:window.__missionTESReviewSnapshot.questions,
            answers:window.__missionTESReviewSnapshot.answers,
            testTitle,
            testId:activeTestId||source.testId||null,
            marksPerCorrect:Number(marksPerCorrect||0),
            negativeMarks:Number(negativeMarks||0),
            maxMarks
          });
        }catch(_){ }
      }
    }else if(supabaseClient && currentStudent && currentAttemptId){
      const secureResult=await window.HOA_SERVICES.test.submitAttempt({
        p_attempt_id:currentAttemptId,
        p_answers:liveAnswers.map(v=>v==null?null:Number(v)),
        p_elapsed_seconds:elapsedSeconds
      });
      if(!secureResult || secureResult.ok!==true) throw new Error(secureResult?.error||'Secure submission failed.');
      secureSubmitted=true;
      try{if(window.HOA_TRACKING)window.HOA_TRACKING.trackStudentActivity('test_attempt_submit','test',activeTestId,{attempt_id:currentAttemptId,total_questions:liveQuestions.length,elapsed_seconds:elapsedSeconds});}catch(_){ }
      correct=Number(secureResult.correct||0);
      wrong=Number(secureResult.wrong||0);
      skipped=Number(secureResult.skipped||0);
      marks=Number(secureResult.score||0);
      maxMarks=Number(secureResult.max_score||maxMarks);
      if(Number.isFinite(Number(secureResult.time_taken)))elapsedSeconds=Number(secureResult.time_taken);
      pct=maxMarks>0?(Math.max(0,marks)/maxMarks*100).toFixed(2):'0.00';

      try{
        const rows=await window.HOA_SERVICES.result.getReview(currentAttemptId);
        authoritativeReviewRows=Array.isArray(rows)&&rows.length?rows:null;
      }catch(e){
        console.warn('Completed-attempt review lookup after submit failed; secure result retained.',e);
      }
      if(authoritativeReviewRows){
        const reviewQuestions=authoritativeReviewRows.map(q=>[
          q.question_text??'',q.option_1??'',q.option_2??'',q.option_3??'',q.option_4??'',Number(q.correct_option)||0,q.explanation??'',q.question_id||null
        ]);
        const reviewAnswers=authoritativeReviewRows.map(q=>q.selected_option==null?null:Number(q.selected_option));
        window.__missionTESReviewSnapshot={questions:reviewQuestions,answers:reviewAnswers,testTitle,testId:activeTestId||null,historical:true,attemptId:String(currentAttemptId)};
        try{saveHistoricalAttemptDetail(String(currentAttemptId),{questions:reviewQuestions,answers:reviewAnswers,testTitle,testId:activeTestId||null,marksPerCorrect,negativeMarks,maxMarks});}catch(_){ }
      }else{
        try{saveHistoricalAttemptDetail(String(currentAttemptId),{questions:liveQuestions,answers:liveAnswers,testTitle,testId:activeTestId||null,marksPerCorrect,negativeMarks,maxMarks});}catch(_){ }
      }
      try{
        const fresh=await loadResultsFromSupabase(currentStudent.id);
        if(Array.isArray(fresh)){
          const row=fresh.find(x=>String(x.id||'')===String(currentAttemptId));
          if(row){row.timeTaken=elapsedSeconds;row.submittedAt=new Date().toISOString();row.date=row.submittedAt;}
          saveResults(fresh);
        }
      }catch(e){console.warn('Result history refresh failed after secure submission.',e);}
      window.__hoaLastSubmittedAttemptId=currentAttemptId;
    }else{
      // Local/admin preview only.
      const results=getResults();
      const fallback={
        id:currentAttemptId||('local_'+Date.now()),
        userId:currentStudent?currentStudent.id:null,
        userName:currentStudent?currentStudent.name:'Student',
        testId:activeTestId||null,
        title:testTitle,
        date:new Date().toISOString(),
        submittedAt:new Date().toISOString(),
        correct,wrong,skipped,marks,percentage:Number(pct),timeTaken:elapsedSeconds,maxMarks,
        questions:liveQuestions,answers:liveAnswers
      };
      results.push(fallback); saveResults(results);
      saveHistoricalAttemptDetail(fallback.id,{questions:liveQuestions,answers:liveAnswers,testTitle,testId:activeTestId||null,marksPerCorrect,negativeMarks,maxMarks});
    }
  }catch(e){
    console.error('HOA exam submission error:',e);
    // Once the server marks a Free/Paid attempt as completed we must never
    // create a duplicate local fallback or let the user retry the same attempt.
    if(isFree || (supabaseClient && currentStudent && !adminPreviewMode)){
      submitted=false;
      try{ if(window.MISSION_TES_ExamIntegrity?.resumeAfterFailedSubmission) window.MISSION_TES_ExamIntegrity.resumeAfterFailedSubmission(); }catch(_){ }
      alert('Your result could not be securely saved. Please try submitting again.'+supaError('secure submission',e));
      return;
    }
  }

  try{if(window.MISSION_TES_ExamIntegrity?.stop)await window.MISSION_TES_ExamIntegrity.stop();}catch(_){ }
  try{await exitHOAExamFullscreen();}catch(_){ }
  document.body.classList.remove('hoa-phase21-exam-active','test-launching-active','test-instructions-active','v13-exam-active','exam-active');
  setHOAExamShellMode('result');

  const main=document.querySelector('main.container');
  if(main)Array.from(main.children).forEach(node=>{if(node.id!=='result')hoaHideNode(node);});
  document.getElementById('home')?.classList.add('hidden');
  document.getElementById('exam')?.classList.add('hidden');
  const learningPortal=document.getElementById('hoaV650PaidLearningPortal');
  if(learningPortal){learningPortal.hidden=true;learningPortal.setAttribute('aria-hidden','true');learningPortal.style.setProperty('display','none','important');learningPortal.style.setProperty('pointer-events','none','important');}
  const result=document.getElementById('result');
  if(result){
    result.classList.remove('hidden');
    result.setAttribute('aria-hidden','false');
    result.style.setProperty('display','block','important');
    result.style.setProperty('pointer-events','auto','important');
  }
  const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v;};
  set('headerTimer','');
  const ht=document.getElementById('headerTimer');if(ht)ht.classList.add('hidden');
  set('resultTitle',testTitle+' — Result');
  set('score',`${marks.toFixed(2)} / ${maxMarks.toFixed(2)}`);
  set('percentage',`Percentage: ${pct}%`);
  set('correct',correct);set('wrong',wrong);set('skipped',skipped);set('finalMarks',marks.toFixed(2));
  set('resultMarksInfo',marks.toFixed(2)+' / '+maxMarks.toFixed(2));
  set('resultCorrectInfo',correct);set('resultWrongInfo',wrong);set('resultSkippedInfo',skipped);set('resultTimeInfo',formatElapsedTime(elapsedSeconds));
  set('reviewSummary',`${correct} Correct • ${wrong} Wrong • ${skipped} Skipped`);
  reviewCurrent=0;window.reviewCurrent=0;
  forceRenderSubmittedQuestionReview();
  requestAnimationFrame(()=>forceRenderSubmittedQuestionReview());
  setTimeout(()=>forceRenderSubmittedQuestionReview(),50);
  setTimeout(()=>forceRenderSubmittedQuestionReview(),250);
  setTimeout(()=>forceRenderSubmittedQuestionReview(),750);

  const resultBack=document.getElementById('resultBackBtn');
  if(resultBack){
    resultBack.textContent=adminPreviewMode?'← RETURN TO ADMIN DASHBOARD':(isFree?'← BACK TO FREE CONTENT':'← BACK TO DASHBOARD');
    resultBack.onclick=adminPreviewMode?exitAdminPreview:(window.hoaReturnStudentFromResult||returnToStudentDashboard);
  }
  if(!isFree)showSuggestionOnNormalStudentSurface();
  currentAttemptId=null;
  currentAttemptCreatePromise=null;
  currentAttemptLaunchToken=0;
  window.__missionTESCurrentElapsedSeconds=null;
}


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
function normalizeStudentDashboardLogo(){
  var img=document.getElementById('studentDashboardLogo');
  if(!img)return;
  img.setAttribute('width','48');
  img.setAttribute('height','48');
  img.setAttribute('decoding','async');
}
function addStudentPanels(){
  normalizeStudentDashboardLogo();
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
    sub.innerHTML='<button id="candidateNavTest" class="active" type="button" onclick="hoaStudentShowMockTab(\'test\')">📝 Tests</button>'+
                  '<button id="candidateNavResult" type="button" onclick="hoaStudentShowMockTab(\'result\')">📊 Results</button>';
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

async function openNote(id){var c=S(),x=studentNoteRows.find(function(n){return n.id===id});if(!c||!x)return;try{if(window.HOA_TRACKING)window.HOA_TRACKING.trackStudentActivity('note_open','note',id,{title:x.title||''});var r=await c.storage.from('exam-notes').createSignedUrl(x.storage_path,600);if(r.error)throw r.error;window.open(r.data.signedUrl,'_blank','noopener,noreferrer')}catch(e){alert('Could not open this note: '+(e.message||e))}}
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
 rows.forEach(function(x){var btn=player.querySelector('[data-play="'+x.id+'"]');if(btn)btn.onclick=function(){if(window.HOA_TRACKING)window.HOA_TRACKING.trackStudentActivity('video_view','video',x.id,{title:x.title||'',batch_id:batch?.id||id});var h=document.getElementById('hoa643Player_'+x.id);h.innerHTML='';var logo=(document.querySelector('img[src*="logo"], img[alt*="HOA" i]')||{}).src||'';var cp=window.hoaCreateCustomPlayer({videoId:x.youtube_video_id,title:x.title||'Lecture '+x.lecture_no,subtitle:(batch?.name||'HUB OF ASPIRANTS')+' • Class '+(x.lecture_no||''),logo:logo});if(cp)h.appendChild(cp)}})
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
async function saveLecture(batchId){var c=S(),id=extractYouTubeId(document.getElementById('hoa643Lu_'+batchId).value);if(!id){alert('Enter a valid YouTube URL or video ID.');return}var title=document.getElementById('hoa643Lt_'+batchId).value.trim();if(!title){alert('Lecture title is required.');return}var no=Math.max(1,Number(document.getElementById('hoa643Ln_'+batchId).value||1));var r=await c.from('batch_lectures').insert({batch_id:batchId,lecture_no:no,title:title,description:document.getElementById('hoa643Ld_'+batchId).value.trim()||null,youtube_video_id:id,is_published:false,sort_order:no,created_by:await uid()});if(r.error){alert('Lecture save failed: '+r.error.message);return}loadAdminBatches()}

async function loadAccessModule(){var c=S(),sel=document.getElementById('hoa643AccessStudent');if(!c||!sel)return;try{var r=await c.from('students').select('id,full_name,email,status').order('full_name',{ascending:true});if(r.error)throw r.error;accessStudents=r.data||[];sel.innerHTML=accessStudents.map(function(x){return '<option value="'+x.id+'">'+esc(x.full_name)+' — '+esc(x.email||'')+' ('+esc(x.status)+')</option>'}).join('')||'<option value="">No students</option>';await loadAccessResources();await loadAccessList()}catch(e){document.getElementById('hoa643AccessMsg').textContent='Unable to load access data.'}}
async function loadAccessResources(){var c=S(),type=document.getElementById('hoa643AccessType')?.value,sel=document.getElementById('hoa643AccessResource');if(!c||!sel)return;var table=type==='test'?'tests':type==='note'?'exam_notes':'batches';var r=type==='test'?await c.from(table).select('id,title,is_published').order('created_at',{ascending:false}):type==='note'?await c.from(table).select('id,title,is_published').order('created_at',{ascending:false}):await c.from(table).select('id,name,is_published').order('created_at',{ascending:false});if(r.error){sel.innerHTML='<option value="">Unable to load</option>';return}accessResources=r.data||[];sel.innerHTML=accessResources.map(function(x){return '<option value="'+x.id+'">'+esc(type==='batch'?x.name:x.title)+' '+(x.is_published?'':'[DRAFT]')+'</option>'}).join('')||'<option value="">No resources</option>'}
async function grantAccess(){var c=S(),student=document.getElementById('hoa643AccessStudent').value,type=document.getElementById('hoa643AccessType').value,res=document.getElementById('hoa643AccessResource').value,msg=document.getElementById('hoa643AccessMsg');if(!student||!res){msg.textContent='Select a student and resource.';return}var table=type==='test'?'student_test_access':type==='note'?'student_note_access':'student_batch_access';var key=type==='test'?'test_id':type==='note'?'note_id':'batch_id';try{var u=(await c.auth.getUser()).data.user;var payload={student_id:student,granted_by:u?.id||null};payload[key]=res;var st=document.getElementById('hoa644AccessStarts').value;var ex=document.getElementById('hoa644AccessExpires').value;if(st)payload.starts_at=new Date(st).toISOString();if(ex)payload.expires_at=new Date(ex).toISOString();if(payload.starts_at&&payload.expires_at&&new Date(payload.expires_at)<=new Date(payload.starts_at)){msg.textContent='Expiry must be after the start time.';return}var r=await c.from(table).upsert(payload,{onConflict:'student_id,'+key});if(r.error)throw r.error;msg.textContent='Access granted successfully.';loadAccessList()}catch(e){msg.textContent='Grant failed: '+(e.message||e)}}

async function loadAccessList(){var c=S(),box=document.getElementById('hoa643AccessList'),student=document.getElementById('hoa643AccessStudent')?.value;if(!c||!box||!student)return;box.innerHTML='<div class="hoa643-empty">Loading access…</div>';var out=[];var specs=[['test','student_test_access','test_id','tests','title'],['note','student_note_access','note_id','exam_notes','title'],['batch','student_batch_access','batch_id','batches','name']];try{for(const spec of specs){var r=await c.from(spec[1]).select('id,'+spec[2]+',starts_at,expires_at').eq('student_id',student);if(r.error)throw r.error;var ids=(r.data||[]).map(function(x){return x[spec[2]]});if(!ids.length)continue;var rr=await c.from(spec[3]).select('id,'+spec[4]).in('id',ids);if(rr.error)throw rr.error;var map={};(rr.data||[]).forEach(function(x){map[x.id]=x[spec[4]]});(r.data||[]).forEach(function(x){var name=map[x[spec[2]]]||'Assigned resource';var when=(x.starts_at||x.expires_at)?'<small>'+esc(x.starts_at?'From '+new Date(x.starts_at).toLocaleString():'')+(x.expires_at?' · Until '+new Date(x.expires_at).toLocaleString():'')+'</small>':'';out.push('<div class="hoa643-admin-row"><div class="hoa643-admin-row-main"><b>'+esc(name)+'</b><small>'+spec[0].toUpperCase()+'</small>'+when+'</div><button class="danger" data-revoke="'+spec[1]+'|'+spec[2]+'|'+esc(x[spec[2]])+'">REVOKE</button></div>')})}box.innerHTML=out.join('')||'<div class="hoa643-empty">No individual access grants for this student.</div>';box.querySelectorAll('[data-revoke]').forEach(function(b){b.onclick=async function(){var a=b.dataset.revoke.split('|');if(!confirm('Revoke this access?'))return;var z=await c.from(a[0]).delete().eq('student_id',student).eq(a[1],a[2]);if(z.error){alert(z.error.message);return}loadAccessList()}})}catch(e){box.innerHTML='<div class="hoa643-empty">Unable to load access: '+esc(e.message||e)+'</div>'}}

function ensureAdminModules(){
  /* V6.0.3: legacy dynamic Admin modules are retired.
     Authentication/role ownership now lives in js/auth.js. Keep this
     compatibility hook so older callers do not break, but never inject
     another Notes/Batches/Student Access dashboard. */
  try{
    if(window.HOA_AUTH && typeof window.HOA_AUTH.syncAdminRole === 'function' && window.hoaAdminRole){
      window.HOA_AUTH.syncAdminRole();
    }
  }catch(e){ console.warn(V+' admin role sync failed',e); }
}

function boot(){addFrontPoster();addStudentPanels();if(document.body.classList.contains('admin-ui') && window.HOA_AUTH)window.HOA_AUTH.syncAdminRole();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
setTimeout(ensureAdminModules,500);setTimeout(ensureAdminModules,1200);setTimeout(ensureAdminModules,2000);
setInterval(function(){try{addFrontPoster();if(document.getElementById('hoaV643PosterSection')&&posterRows.length===0&&S())loadFrontPosters();}catch(e){console.warn(V+' poster maintenance pass failed',e)}},3000);
window.showStudent=showStudent;
window.hoaStudentShowMockTab=hoaStudentShowMockTab;
window.hoaV643ShowStudentSection=showStudent;window.hoaV643ShowAdminSection=showAdmin;window.hoaV643EnsureAdminModules=ensureAdminModules;
})();

/* ============================================================ */
/* END MERGED MODULE: student/content-access.js                */
/* ============================================================ */

/* HOA V6.1.0 — Feature-separated JavaScript module.
   Original inline script #59 (id: hoa-v615-free-student-portal-js).
   Execution position intentionally preserved from V6.0.9. */



(function(){
'use strict';
const esc615=window.escapeHTML||function(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]) )};
const hoa615LogoSrc=(document.querySelector('img[src*="logo"],img[alt*="HOA" i]')||{}).src||'';
function c615(){return window.supabaseClient||window.supabase||null}
async function rpc615(name,args){const c=c615();if(!c||!c.rpc)throw new Error('Supabase is not ready. Please refresh the page.');const r=await c.rpc(name,args);if(r.error)throw r.error;return r.data}
function token615(){return localStorage.getItem('hoa_free_access_token')||''}
function base615(){const u=new URL(location.href);u.searchParams.delete('hoa_free_test');u.searchParams.delete('content');u.searchParams.set('hoa_free_page','library');return u.href}
function home615(){const u=new URL(location.href);u.searchParams.delete('hoa_free_page');u.searchParams.delete('hoa_free_test');u.searchParams.delete('content');return u.href}
function testUrl615(testId,contentId){const u=new URL(location.href);u.searchParams.set('hoa_free_page','test');u.searchParams.set('hoa_free_test',testId);if(contentId)u.searchParams.set('content',contentId);return u.href}
function logo615(){return hoa615LogoSrc}
function escAttr615(v){return esc615(v).replace(/`/g,'&#96;')}
function typeLabel615(t){return t==='video'?'Videos':t==='note'?'Notes':t==='pdf'?'PDFs':t==='test'?'Free Tests':'Current Affairs / Other'}
function icon615(t){return t==='video'?'🎥':t==='note'?'📚':t==='pdf'?'📄':t==='test'?'📝':'📰'}
function safe615(v){if(!v)return '';try{const u=new URL(v,location.href);return /^https?:$/.test(u.protocol)?u.href:''}catch(e){return ''}}
function ytId615(v){const u=safe615(v);if(!u)return '';try{const x=new URL(u);if(x.hostname.includes('youtu.be'))return x.pathname.split('/').filter(Boolean)[0]||'';if(x.searchParams.get('v'))return x.searchParams.get('v');const m=x.pathname.match(/\/(?:embed|shorts)\/([^/?]+)/);return m?m[1]:''}catch(e){return ''}}
function waitSup615(cb,n){n=n||0;if(c615())return cb();if(n<60)return setTimeout(()=>waitSup615(cb,n+1),250);document.body.innerHTML='<div class="hoa615-login"><h1>Connection unavailable</h1><p>Supabase could not be initialized. Please refresh the page.</p></div>'}
/* Keep the ACTUAL Home-page chrome nodes, not HTML clones. This preserves the exact
   Home-page layout, computed styling, native button behavior and event handlers. */
const nativeSocialFooterNode615=document.getElementById('hoaFrontSocialFooter')||null;
const nativeProfessionalFooterNode615=document.getElementById('hoaProfessionalFooter')||null;
const nativeConnectNode615=document.getElementById('hoaV653ConnectWrap')||null;
function bindNativeConnect615(){
  const wrap=document.getElementById('hoaV653ConnectWrap');
  const toggle=document.getElementById('hoaV653ConnectToggle');
  if(!wrap||!toggle||wrap.dataset.bound==='1')return;
  wrap.dataset.bound='1';
  const setOpen=open=>{wrap.classList.toggle('is-open',open);toggle.setAttribute('aria-expanded',String(open));};
  toggle.addEventListener('click',e=>{e.stopPropagation();setOpen(!wrap.classList.contains('is-open'));});
  document.addEventListener('click',e=>{if(!wrap.contains(e.target))setOpen(false);});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')setOpen(false);});
}
function portalShell615(){
  document.body.className='hoa-v615-free-portal';
  document.body.innerHTML='<div id="hoaV615Portal"></div>';
  const root=document.getElementById('hoaV615Portal');
  /* Re-attach the original Home-page nodes. Do not clone/rebuild them. */
  if(nativeSocialFooterNode615) document.body.appendChild(nativeSocialFooterNode615);
  if(nativeProfessionalFooterNode615) document.body.appendChild(nativeProfessionalFooterNode615);
  if(nativeConnectNode615) document.body.appendChild(nativeConnectNode615);
  bindNativeConnect615();
  const home=home615();
  document.querySelectorAll('#hoaProfessionalFooter .hoa-footer-links a[href="#hoaFrontPage"]').forEach(a=>a.href=home);
  document.querySelectorAll('#hoaProfessionalFooter .hoa-footer-links a[href="#hoaFrontFeatures"]').forEach(a=>{a.href=home+'#hoaFrontFeatures';});
  document.querySelectorAll('#hoaProfessionalFooter .hoa-footer-links a[href="#hoaCareerComingSoon"]').forEach(a=>{a.href=home+'#hoaCareerComingSoon';});
  document.querySelectorAll('#hoaProfessionalFooter .hoa-footer-links a[href="#hoaV648StudentOptions"]').forEach(a=>{a.href=home+'#hoaV648StudentOptions';});
  return root;
}
function header615(title,sub,back){const lg=logo615();return `<header class="hoa615-top"><div class="hoa615-top-inner"><div class="hoa615-brand">${lg?`<img src="${escAttr615(lg)}" alt="HOA">`:`<span class="hoa615-logo-fallback">HOA</span>`}<div><strong>HUB OF ASPIRANTS</strong><span>FREE STUDENT • CONTENT LIBRARY</span></div></div><div class="hoa615-top-actions"><button class="hoa615-btn home" onclick="location.href='${escAttr615(home615())}'" aria-label="Home">⌂ Home</button>${back?`<button class="hoa615-btn" onclick="location.href='${escAttr615(base615())}'">← Back to Library</button>`:''}</div></div></header>`}
function showLogin615(msg){const root=portalShell615();root.innerHTML=header615('','',false)+`<main class="hoa615-main"><section class="hoa615-login"><div class="hoa615-kicker">FREE STUDENT ACCESS</div><h1>Access Free Content</h1><p>Enter your 10-digit mobile number. If it is already registered in the Free Student database, access will open. Otherwise complete the registration form.</p>${msg?`<div class="hoa615-error">${esc615(msg)}</div>`:''}<form id="hoa615Gate"><div class="hoa615-form"><label class="wide">Mobile Number *<input id="hoa615Mobile" inputmode="numeric" maxlength="10" autocomplete="tel" required></label></div><div id="hoa615Register" style="display:none;margin-top:12px"><div class="hoa615-form"><label>Full Name *<input id="hoa615Name" maxlength="100"></label><label>Email *<input id="hoa615Email" type="email" maxlength="254"></label><label>Preparing For *<input id="hoa615Preparing" maxlength="150"></label><label class="wide">Address *<textarea id="hoa615Address" rows="3" maxlength="500"></textarea></label></div></div><div class="hoa615-card-actions"><button class="hoa615-btn primary" type="submit" id="hoa615Continue">CONTINUE</button></div><div id="hoa615GateMsg" class="hoa615-error" style="display:none"></div></form></section></main>`;bindGate615()}
function bindGate615(){const f=document.getElementById('hoa615Gate');if(!f)return;let registration=false;f.addEventListener('submit',async e=>{e.preventDefault();const msg=document.getElementById('hoa615GateMsg');const mobile=(document.getElementById('hoa615Mobile').value||'').replace(/\D/g,'');msg.style.display='none';if(!/^[6-9]\d{9}$/.test(mobile)){msg.textContent='Enter a valid 10-digit Indian mobile number.';msg.style.display='block';return}
try{if(!registration){const d=await rpc615('hoa_free_profile_enter',{p_mobile:mobile});localStorage.setItem('hoa_free_access_token',d.access_token);location.href=base615();return}
const req={p_mobile:mobile,p_full_name:document.getElementById('hoa615Name').value.trim(),p_email:document.getElementById('hoa615Email').value.trim(),p_preparing_for:document.getElementById('hoa615Preparing').value.trim(),p_address:document.getElementById('hoa615Address').value.trim()};if(!req.p_full_name||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.p_email)||!req.p_preparing_for||!req.p_address){msg.textContent='Please enter valid information in every required field.';msg.style.display='block';return}const d=await rpc615('hoa_free_profile_enter',req);localStorage.setItem('hoa_free_access_token',d.access_token);location.href=base615();
}catch(err){const s=String(err.message||err);if(!registration&&s.includes('REGISTRATION_REQUIRED')){registration=true;document.getElementById('hoa615Register').style.display='block';document.getElementById('hoa615Continue').textContent='REGISTER & CONTINUE';msg.textContent='This mobile number is not registered. Complete the required fields.';msg.style.display='block'}else{msg.textContent=s;msg.style.display='block'}}})}
function card615(x){const t=x.content_type||'other',thumb=safe615(x.thumbnail_url);return `<article class="hoa615-card"><div class="hoa615-thumb">${thumb?`<img src="${escAttr615(thumb)}" alt="">`:icon615(t)}<span class="hoa615-type">${esc615(typeLabel615(t))}</span></div><div class="hoa615-card-body"><div class="hoa615-meta">${x.category?`<span class="hoa615-chip">${esc615(x.category)}</span>`:''}</div><h3>${esc615(x.title||'Untitled')}</h3><p>${esc615(x.description||'No description available.')}</p><div class="hoa615-card-actions"><button class="hoa615-btn primary" onclick="hoa615OpenItem('${escAttr615(x.id)}')">${t==='test'?'ATTEMPT TEST':'VIEW CONTENT'}</button></div></div></article>`}
let portalItems615=[],portalFilter615='test';
async function renderLibrary615(){const root=portalShell615();root.innerHTML=header615('','',false)+`<main class="hoa615-main"><section class="hoa615-hero"><div><div class="hoa615-kicker">HUB OF ASPIRANTS • FREE STUDENT</div><h1>Free Content Library</h1><p>Access mock tests, video classes, study notes and current affairs from one dedicated student page.</p></div><div class="hoa615-stat"><b id="hoa615Count">0</b><span>Resources</span></div></section><nav class="hoa615-tabs" id="hoa615Tabs"></nav><section><div class="hoa615-section-head"><div><h2 id="hoa615SectionTitle">Mock Tests</h2><p id="hoa615SectionSub">Select a resource to view its full content.</p></div></div><div id="hoa615Grid" class="hoa615-grid"></div></section></main>`;try{portalItems615=await rpc615('hoa_free_content_list',{p_token:token615()});portalItems615=Array.isArray(portalItems615)?portalItems615.filter(x=>(x.content_type||'other')!=='pdf'):[];renderTabs615();renderGrid615()}catch(e){showLogin615('Your Free Content session has expired. Please enter your mobile number again.')}}
function renderTabs615(){const types=[['test','Mock Tests'],['video','Videos'],['note','Notes'],['other','Current Affairs / Other']];document.getElementById('hoa615Tabs').innerHTML=types.map(([k,l])=>`<button class="hoa615-tab ${portalFilter615===k?'active':''}" onclick="hoa615Filter('${k}')">${l}</button>`).join('');}
window.hoa615Filter=k=>{portalFilter615=k;renderTabs615();renderGrid615()}
function renderGrid615(){const rows=portalItems615.filter(x=>(x.content_type||'other')===portalFilter615);document.getElementById('hoa615Count').textContent=rows.length;document.getElementById('hoa615SectionTitle').textContent=typeLabel615(portalFilter615);document.getElementById('hoa615SectionSub').textContent=rows.length?`${rows.length} resource${rows.length===1?'':'s'} available for Free Students.`:'No published content in this section yet.';document.getElementById('hoa615Grid').innerHTML=rows.length?rows.map(card615).join(''):`<div class="hoa615-empty" style="grid-column:1/-1"><b>No content available</b><span>Published resources will appear here when they are added.</span></div>`}
window.hoa615OpenItem=async id=>{const x=portalItems615.find(v=>String(v.id)===String(id));if(!x)return;try{await rpc615('hoa_free_content_activity',{p_token:token615(),p_content_id:id,p_activity_type:'open'})}catch(e){}if(x.content_type==='test'){const u=new URL(testUrl615(x.test_id,x.id));u.searchParams.set('hoa_exam_engine','shared');const w=window.open(u.href,'_blank');if(!w)alert('Please allow pop-ups to attempt the Free Test.');return}showDetail615(x)}
function showDetail615(x){const root=portalShell615();root.innerHTML=header615(x.title,x.description,true)+`<main class="hoa615-main"><article class="hoa615-detail"><div class="hoa615-detail-head"><div class="hoa615-kicker">${esc615(typeLabel615(x.content_type))}${x.category?' • '+esc615(x.category):''}</div><h2>${esc615(x.title)}</h2><p>${esc615(x.description||'')}</p></div><div class="hoa615-detail-media" id="hoa615Media"></div><div class="hoa615-detail-desc">${esc615(x.description||'No additional description was provided.')}</div></article></main>`;renderDetailMedia615(x)}
function renderDetailMedia615(x){const box=document.getElementById('hoa615Media');if(!box)return;const t=x.content_type,url=safe615(x.url),file=safe615(x.file_url),id=ytId615(x.url);if(t==='video'){if(window.hoaCreateCustomPlayer&&id){const host=document.createElement('div');host.className='hoa615-player-wrap';box.appendChild(host);const p=window.hoaCreateCustomPlayer({videoId:id,title:x.title||'Free Video',subtitle:'HUB OF ASPIRANTS • Free Content',logo:logo615()});if(p)host.appendChild(p);else box.innerHTML='<div class="hoa615-empty"><b>Video unavailable</b></div>'}else if(file){box.innerHTML=`<video class="hoa615-resource-frame" controls src="${escAttr615(file)}"></video>`}else if(url){box.innerHTML=`<div class="hoa615-note-box"><b>Video resource</b><p>The video link is available below.</p><a class="hoa615-btn primary" href="${escAttr615(url)}" target="_blank" rel="noopener noreferrer">OPEN VIDEO</a></div>`}else box.innerHTML='<div class="hoa615-empty"><b>Video unavailable</b></div>';return}if(t==='pdf'){const src=file||url;box.innerHTML=src?`<iframe class="hoa615-resource-frame" src="${escAttr615(src)}" title="${escAttr615(x.title)}"></iframe><div class="hoa615-card-actions"><a class="hoa615-btn primary" href="${escAttr615(src)}" target="_blank" rel="noopener noreferrer">OPEN PDF</a></div>`:'<div class="hoa615-empty"><b>PDF unavailable</b></div>';return}if(t==='note'){if(file||url){const src=file||url;box.innerHTML=`<iframe class="hoa615-resource-frame" src="${escAttr615(src)}" title="${escAttr615(x.title)}"></iframe><div class="hoa615-card-actions"><a class="hoa615-btn primary" href="${escAttr615(src)}" target="_blank" rel="noopener noreferrer">OPEN NOTE</a></div>`}else box.innerHTML=`<div class="hoa615-note-box">${esc615(x.description||'No note content supplied.')}</div>`;return}if(t==='other'){if(file||url){const src=file||url;box.innerHTML=`<div class="hoa615-note-box"><h3 style="margin-top:0;color:#123f70">${esc615(x.title)}</h3><p>${esc615(x.description||'')}</p><a class="hoa615-btn primary" href="${escAttr615(src)}" target="_blank" rel="noopener noreferrer">OPEN CURRENT AFFAIRS / RESOURCE</a></div>`}else box.innerHTML='<div class="hoa615-note-box">No external resource is attached. Please read the description above.</div>';return}}
/* Unified exam engine ownership: free tests are now routed through the same
   main student examination engine as paid tests. The free-content library
   remains on this page; only its legacy standalone test runner is removed. */
function boot615(){
  const q=new URL(location.href).searchParams.get('hoa_free_page');
  if(q==='test') return; // handled by js/exam-result-controller-v3.js
  if(q==='library'){
    waitSup615(()=>{if(token615())renderLibrary615();else showLogin615()});
    return;
  }
}
window.hoaV615OpenLibrary=window.hoaOpenFreeContent;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot615);else setTimeout(boot615,0);
})();
/* ============================================================ */
/* END MERGED MODULE: free-content/student-portal.js           */
/* ============================================================ */

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
    lastMockBatchId:null,
    resultOrigin:'',
    resultMockBatchId:null,
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
    var p=portal();
    state.portal='mock-course';
    state.mockBatchId=id;
    window.__hoaCurrentMockCourseId=id;
    state.lastMockBatchId=id;
    if(!window.__hoaExamReturnContext || window.__hoaExamReturnContext.origin!=='mock-course'){
      window.__hoaExamReturnContext={origin:'mock-course',batchId:id,tab:'tests'};
    }
    /* Result/exam teardown may have hard-hidden this shared portal.
       Re-open it with a clean interactive style state. */
    p.hidden=false;
    p.removeAttribute('aria-hidden');
    p.classList.remove('hidden');
    p.style.removeProperty('display');
    p.style.removeProperty('visibility');
    p.style.removeProperty('opacity');
    p.style.removeProperty('pointer-events');
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
            body.innerHTML='<div class="hoa-v650-result-host"><div class="hoa-v650-result-head"><div><h3>📊 Your Results</h3><p>Completed attempts from this Mock Test Course.</p></div><span class="hoa-v650-chip" id="hoaV650MockResultsBadge">0 TESTS</span></div><div id="hoaV650MockCandidateResultsList"><div class="hoa-v650-empty">Loading your results…</div></div></div>';
            var mockResultsBox=el('hoaV650MockCandidateResultsList');
            var allowedMockTestIds=(data.tests||[]).map(function(t){return t.id;});
            if(typeof window.renderCandidateResults==='function')await window.renderCandidateResults(mockResultsBox,allowedMockTestIds);
            var mockRows=Array.isArray(window.__hoaStudentResultRows)?window.__hoaStudentResultRows:[];
            var mockBadge=el('hoaV650MockResultsBadge');
            if(mockBadge)mockBadge.textContent=mockRows.length+' '+(mockRows.length===1?'TEST':'TESTS');
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
        state.resultOrigin='mock-course';
        state.resultMockBatchId=state.mockBatchId || state.lastMockBatchId || null;
        window.__hoaExamReturnContext={origin:'mock-course',batchId:state.resultMockBatchId,tab:'tests'};
        window.__hoaLastMockTestContext={batchId:state.resultMockBatchId};
        if(typeof window.startSavedTest==='function')window.startSavedTest(t.id);
        else alert('Mock Test engine is not available.');
      };
    });
  }

  /* Override the existing inline course-opening entry point. */
  var originalCourse=window.hoaStudentOpenCourse;
  window.hoaStudentOpenCourse=openCourse;
  window.hoaV650OriginalStudentOpenCourse=originalCourse;

  /* ------------------------------------------------------------
     STUDENT MOCK TEST ENTRY — BATCH FIRST
     First level stays inside the Student Dashboard, like My Courses:
       Dashboard -> Mock Test Batches -> Mock Test Course page
     The existing openMockCourse() page remains authoritative for the
     second level (folders, tests and results). No test-engine changes.
  ------------------------------------------------------------ */
  async function renderMockBatchBrowser(){
    var panel=el('hoaV650MockTestsPanel');
    if(!panel)return;

    try{ if(typeof closePortal==='function') closePortal(); }catch(e){}

    panel.classList.add('active');
    var oldTest=el('candidateSectionTestPanel');
    var oldResult=el('candidateSectionResultPanel');
    if(oldTest)oldTest.classList.remove('active');
    if(oldResult)oldResult.classList.remove('active');

    panel.innerHTML=
      '<div class="hoa-student-panel-head">'+
        '<div><h3>📝 Mock Tests</h3><p>Select your assigned Mock Test Batch first. Tests open inside the selected batch page.</p></div>'+
        '<span class="hoa-student-count" id="hoaV650MockBatchCount">0 BATCHES</span>'+
      '</div>'+
      '<div id="hoaV650MockBatchList" class="hoa-student-course-list hoa-student-mock-batch-list">'+
        '<div class="hoa643-empty">Loading your Mock Test Batches…</div>'+
      '</div>';

    var box=el('hoaV650MockBatchList');
    var count=el('hoaV650MockBatchCount');
    try{
      var rows=await loadMockCatalog();
      if(count)count.textContent=rows.length+' '+(rows.length===1?'BATCH':'BATCHES');
      if(!rows.length){
        box.innerHTML='<div class="hoa-student-empty"><div class="hoa-student-empty-icon">📝</div><h3>No Mock Test Batches Yet</h3><p>No Mock Test Batch has been assigned to your account.</p></div>';
        return;
      }
      box.innerHTML=rows.map(function(x){
        return '<article class="hoa-student-course-card hoa-student-mock-batch-card">'+
          '<div class="hoa-student-course-icon hoa-student-mock-batch-icon">📝</div>'+
          '<div class="hoa-student-course-body"><span class="hoa-student-eyebrow">MOCK TEST BATCH</span><h3>'+escP(x.name)+'</h3>'+
          '<div class="hoa-student-code">'+escP(x.batch_code||'')+'</div>'+
          '<p>'+escP(x.description||'Attempt the mock tests assigned to this preparation batch and review your results.')+'</p>'+
          '<div class="hoa-student-course-meta"><span>📝 Mock Tests</span><span>📊 Results</span><span>🎯 Practice</span></div></div>'+
          '<button class="primary hoa-student-open-course hoa-student-open-mock-batch" type="button" data-mock-batch-id="'+escP(x.id)+'">OPEN MOCK COURSE →</button>'+
        '</article>';
      }).join('');
      box.querySelectorAll('[data-mock-batch-id]').forEach(function(btn){
        btn.onclick=function(){openMockCourse(btn.dataset.mockBatchId)};
      });
    }catch(e){
      console.error('HOA mock batch browser',e);
      box.innerHTML='<div class="hoa643-empty">Unable to load your Mock Test Batches. Please refresh and try again.</div>';
    }
  }

  /* Top-level Mock Tests now behaves like My Courses: batch list first. */
  var originalShowStudent=window.showStudent;
  window.showStudent=function(which){
    if(which==='mock'){
      var courses=el('hoaV650StudentCoursesPanel');
      var mock=el('hoaV650MockTestsPanel');
      var courseBtn=el('candidateNavCourses');
      var mockBtn=el('candidateNavMock');
      if(courses)courses.classList.remove('active');
      if(mock)mock.classList.add('active');
      if(courseBtn)courseBtn.classList.remove('active');
      if(mockBtn)mockBtn.classList.add('active');
      renderMockBatchBrowser();
      return;
    }
    if(which==='courses'){
      var list=el('hoaV650CourseList');
      var detail=el('hoaV650CourseDetail');
      if(detail)detail.classList.add('hidden');
      if(list)list.classList.remove('hidden');
      if(typeof originalShowStudent==='function')return originalShowStudent.apply(this,arguments);
      return;
    }
    if(typeof originalShowStudent==='function')return originalShowStudent.apply(this,arguments);
  };

  /* Result -> Dashboard must close the portal layer first. The previous
     implementation reopened the Mock Test Course without hiding #result, so
     the button appeared to do nothing. */
  var originalReturn=window.returnToStudentDashboard;
  async function hoaRestorePreviousMockCourse(batchId,tab){
    if(!batchId || typeof openMockCourse!=='function') return false;
    try{
      var p=portal();
      p.hidden=false;
      p.removeAttribute('aria-hidden');
      p.classList.remove('hidden');
      p.style.removeProperty('display');
      p.style.removeProperty('visibility');
      p.style.removeProperty('opacity');
      p.style.removeProperty('pointer-events');
      state.resultOrigin='mock-course';
      state.resultMockBatchId=batchId;
      state.mockBatchId=batchId;
      state.lastMockBatchId=batchId;
      await openMockCourse(batchId);
      if(tab==='results'){
        var rt=p.querySelector('[data-v650-mock-tab="results"]');
        if(rt)rt.click();
      }
      return true;
    }catch(e){
      console.error('HOA mock course restoration failed:',e);
      return false;
    }
  }
  window.hoaRestorePreviousMockCourse=hoaRestorePreviousMockCourse;

  async function hoaForceStudentDashboardAfterResult(){
    try{
      /* Preserve the exact Mock Test Course from which the exam was started. */
      var ctx=window.__hoaExamReturnContext||{};
      var returnBatchId=ctx.batchId || state.resultMockBatchId || state.mockBatchId || state.lastMockBatchId || null;
      var wasMockCourse=ctx.origin==='mock-course' || state.resultOrigin==='mock-course' || state.portal==='mock-test-running' || state.portal==='mock-course';

      state.mockBatchId=null;
      state.mockTests=[];
      state.mockFolderRows=[];
      state.portal='';
      document.body.classList.remove('hoa-v650-learning-open','hoa-phase21-exam-active','test-launching-active','test-instructions-active','v13-exam-active','exam-active','hoa-feedback-open');
      document.body.dataset.hoaPhase21Exam='normal';
      document.body.dataset.hoaExamMode='normal';

      var resultEl=el('result');
      if(resultEl){
        resultEl.classList.add('hidden');
        resultEl.setAttribute('aria-hidden','true');
        resultEl.style.setProperty('display','none','important');
        resultEl.style.setProperty('visibility','hidden','important');
        resultEl.style.setProperty('opacity','0','important');
        resultEl.style.setProperty('pointer-events','none','important');
      }
      var examEl=el('exam');
      if(examEl){
        examEl.classList.add('hidden');
        examEl.setAttribute('aria-hidden','true');
        examEl.style.setProperty('display','none','important');
        examEl.style.setProperty('visibility','hidden','important');
        examEl.style.setProperty('opacity','0','important');
        examEl.style.setProperty('pointer-events','none','important');
      }
      var countdown=el('testCountdownOverlay');
      if(countdown){
        countdown.classList.add('hidden');
        countdown.style.setProperty('display','none','important');
        countdown.style.setProperty('visibility','hidden','important');
        countdown.style.setProperty('pointer-events','none','important');
      }
      var feedback=el('hoaFeedbackModal')||el('hoaPublicFeedbackModal');
      if(feedback){
        feedback.classList.add('hidden');
        feedback.setAttribute('aria-hidden','true');
        feedback.style.setProperty('display','none','important');
        feedback.style.setProperty('pointer-events','none','important');
      }
      document.body.classList.remove('hoa-feedback-open');
      document.body.setAttribute('data-hoa-feedback-state','closed');
      var hs=el('headerTimer');
      if(hs)hs.classList.add('hidden');
      if(typeof closeMissionSubmitConfirmation==='function'){
        try{closeMissionSubmitConfirmation();}catch(_){ }
      }

      /* This is a portal return, not a generic dashboard return. */
      if(wasMockCourse && returnBatchId){
        /* Keep the authenticated Student shell alive but let the course portal
           take over the foreground again. */
        var home=el('home');
        if(home){
          home.classList.remove('hidden');
          home.style.removeProperty('display');
          home.style.removeProperty('visibility');
          home.style.removeProperty('opacity');
        }
        var studentOnly=el('studentOnlyDashboard');
        if(studentOnly){
          studentOnly.classList.add('hidden');
          studentOnly.setAttribute('aria-hidden','true');
        }
        var adminOnly=el('adminOnlyDashboard');
        if(adminOnly){
          adminOnly.classList.add('hidden');
          adminOnly.setAttribute('aria-hidden','true');
          adminOnly.style.setProperty('display','none','important');
        }
        var auth=el('authScreen');
        if(auth){
          auth.classList.add('hidden');
          auth.setAttribute('aria-hidden','true');
          auth.style.setProperty('display','none','important');
        }
        showSuggestionOnNormalStudentSurface();
        return await hoaRestorePreviousMockCourse(returnBatchId,'tests');
      }

      /* Generic tests still return to the Student Dashboard. */
      var home2=el('home');
      if(home2){
        home2.classList.remove('hidden');
        home2.style.removeProperty('display');
        home2.style.removeProperty('visibility');
        home2.style.removeProperty('opacity');
        home2.style.removeProperty('pointer-events');
      }
      var studentOnly2=el('studentOnlyDashboard');
      if(studentOnly2){
        studentOnly2.classList.remove('hidden');
        studentOnly2.removeAttribute('aria-hidden');
        studentOnly2.style.removeProperty('display');
        studentOnly2.style.removeProperty('visibility');
        studentOnly2.style.removeProperty('opacity');
        studentOnly2.style.removeProperty('pointer-events');
      }
      if(typeof showDashboardTab==='function') showDashboardTab('student');
      if(typeof showCandidateSection==='function') await showCandidateSection('test');
      if(typeof renderStudentDashboard==='function') await renderStudentDashboard();
      showSuggestionOnNormalStudentSurface();
      return true;
    }catch(e){
      console.error('HOA deterministic student return failed:',e);
      return false;
    }
  }

  window.hoaReturnStudentFromResult=async function(){
    try{ if(window.MISSION_TES_ExamIntegrity && typeof window.MISSION_TES_ExamIntegrity.stop==='function') window.MISSION_TES_ExamIntegrity.stop(); }catch(e){}
    try{ if(typeof exitHOAExamFullscreen==='function') await exitHOAExamFullscreen(); }catch(e){}
    return await hoaForceStudentDashboardAfterResult();
  };
  window.returnToStudentDashboard=function(){
    if(state.portal==='mock-test-running'||state.portal==='mock-course' || el('result') && !el('result').classList.contains('hidden')){
      return window.hoaReturnStudentFromResult();
    }
    return hoaForceStudentDashboardAfterResult();
  };

  /* Legacy result-back capture listener retired; V3 authoritative controller owns it. */

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


/* ============================================================ */
/* END MERGED MODULE: student/course-mock-portals.js           */
/* ============================================================ */


/* Phase 5: student progress/review compatibility helpers. */
(function(){
  'use strict';
  function studentPct(r){
    var n=Number(r?.percentage);
    if(Number.isFinite(n)) return n;
    var s=Number(r?.score ?? r?.marks);
    var m=Number(r?.maxMarks ?? r?.max_marks);
    return Number.isFinite(s)&&Number.isFinite(m)&&m>0 ? s/m*100 : 0;
  }
  function addStudentProgress(){
    var p=document.getElementById('candidateSectionResultPanel');
    if(!p || document.getElementById('hoaV70StudentProgress')) return;
    var d=document.createElement('div');
    d.id='hoaV70StudentProgress';
    d.className='dashPanel';
    d.style.marginTop='12px';
    d.innerHTML='<h3>📈 My Progress</h3><div id="hoaV70StudentProgressBody" class="hoa-v70-stat-grid"></div>';
    p.appendChild(d);
  }
  function renderStudentProgress(){
    addStudentProgress();
    var body=document.getElementById('hoaV70StudentProgressBody');
    if(!body) return;
    var active=(typeof currentStudent!=='undefined'&&currentStudent)?currentStudent:null;
    var email=String(active?.email||'').toLowerCase();
    var rows=Array.isArray(window.__hoaStudentResultRows)?window.__hoaStudentResultRows:[];
    var mine=rows.filter(function(r){return !email||String(r.email||'').toLowerCase()===email});
    var ps=mine.map(studentPct);
    var avg=ps.length?ps.reduce(function(a,b){return a+b},0)/ps.length:0;
    var best=ps.length?Math.max.apply(null,ps):0;
    var change=ps.length>1?(ps[ps.length-1]-ps[0]):0;
    body.innerHTML='<div class="hoa-v70-stat"><b>'+mine.length+'</b>Tests Attempted</div><div class="hoa-v70-stat"><b>'+best.toFixed(1)+'%</b>Best Score</div><div class="hoa-v70-stat"><b>'+avg.toFixed(1)+'%</b>Average</div><div class="hoa-v70-stat"><b>'+change.toFixed(1)+'%</b>Change</div>';
  }
  window.hoaAddStudentProgress=addStudentProgress;
  window.hoaRenderStudentProgress=renderStudentProgress;


  function install(){
    addStudentProgress();
    if(typeof window.viewStudentAttempt==='function' && !window.viewStudentAttempt.__hoaPhase5Wrapped){
      var oldStudentAttempt=window.viewStudentAttempt;
      var wrappedStudentAttempt=async function(attemptId){
        try{
          if(window.supabaseClient && attemptId){
            var a=await window.supabaseClient.from('attempts').select('question_snapshot,scoring_snapshot').eq('id',attemptId).maybeSingle();
            if(a.data?.question_snapshot){
              var rows=typeof window.getResults==='function'?window.getResults()||[]:[];
              var r=rows.find(function(x){return String(x.id)===String(attemptId)});
              if(typeof window.saveHistoricalAttemptDetail==='function'){
                window.saveHistoricalAttemptDetail(attemptId,{questions:a.data.question_snapshot,answers:r?.answers||[],testTitle:r?.title,testId:r?.testId,marksPerCorrect:r?.marks,negativeMarks:r?.negativeMarks,maxMarks:r?.maxMarks});
              }
            }
          }
        }catch(e){console.warn('Student snapshot read fallback:',e)}
        return oldStudentAttempt.apply(this,arguments);
      };
      wrappedStudentAttempt.__hoaPhase5Wrapped=true;
      wrappedStudentAttempt.__hoaPhase5Original=oldStudentAttempt;
      window.viewStudentAttempt=wrappedStudentAttempt;
    }

    if(typeof window.showCandidateSection==='function' && !window.showCandidateSection.__hoaPhase5Wrapped){
      var oldSection=window.showCandidateSection;
      var wrappedSection=async function(section){
        var out=await oldSection.apply(this,arguments);
        if(section==='result'){
          try{ window.__hoaStudentResultRows=typeof window.getResults==='function'?window.getResults()||[]:[]; renderStudentProgress(); }catch(_){}
        }
        return out;
      };
      wrappedSection.__hoaPhase5Wrapped=true;
      wrappedSection.__hoaPhase5Original=oldSection;
      window.showCandidateSection=wrappedSection;
    }

    if(typeof window.renderCandidateResults==='function' && !window.renderCandidateResults.__hoaPhase5Wrapped){
      var oldRender=window.renderCandidateResults;
      var wrappedRender=async function(){
        var out=await oldRender.apply(this,arguments);
        try{ window.__hoaStudentResultRows=typeof window.getResults==='function'?window.getResults()||[]:[]; renderStudentProgress(); }catch(_){}
        return out;
      };
      wrappedRender.__hoaPhase5Wrapped=true;
      wrappedRender.__hoaPhase5Original=oldRender;
      window.renderCandidateResults=wrappedRender;
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install,{once:true}); else install();
})();
