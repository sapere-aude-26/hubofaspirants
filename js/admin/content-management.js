/* HOA V6.1.0 — Feature-separated JavaScript module.
   Original inline script #41 (id: hoa-v6108-admin-content-js).
   Execution position intentionally preserved from V6.0.9. */


(function(){
  'use strict';

  const $ = id => document.getElementById(id);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmtDate = v => v ? new Date(v).toLocaleString() : '—';
  const val = id => ($(id)?.value || '').trim();
  const boolVal = id => String($(id)?.value) === 'true';

  function client(){ return window.supabaseClient || window.supabase || null; }
  async function adminUserId(){
    const c=client();
    if(!c?.auth?.getUser) return null;
    const r=await c.auth.getUser();
    if(r.error) throw r.error;
    return r.data?.user?.id || null;
  }
  function msg(id,text,error=false){
    const e=$(id); if(!e)return;
    e.textContent=text||'';
    e.style.color=error?'#b42318':'#52708f';
  }
  function adminGuard(){
    if(typeof isAdminMode==='function' && !isAdminMode()) throw new Error('Admin session required.');
  }
  function renderEmpty(id,text){
    const e=$(id); if(e)e.innerHTML='<div class="hoa-admin-empty">'+esc(text)+'</div>';
  }

  async function loadCourses(){
    const c=client(); if(!c?.from) throw new Error('Supabase is not ready.');
    const r=await c.from('batches').select('*').order('sort_order',{ascending:true}).order('created_at',{ascending:false});
    if(r.error) throw r.error;
    const rows=r.data||[];
    $('hoaCourseCount').textContent=rows.length;
    const select=$('hoaVideoBatch');
    if(select) select.innerHTML='<option value="">Select course / batch</option>'+rows.map(x=>`<option value="${esc(x.id)}">${esc(x.name)}${x.batch_code?' · '+esc(x.batch_code):''}</option>`).join('');
    const list=$('hoaCourseList');
    if(!list)return;
    if(!rows.length){renderEmpty('hoaCourseList','No courses/batches created yet.');return;}
    list.innerHTML=`<table><thead><tr><th>Course</th><th>Code</th><th>Status</th><th>Published</th><th>Sort</th><th>Actions</th></tr></thead><tbody>${rows.map(x=>`
      <tr><td><b>${esc(x.name)}</b><br><span style="color:#7b8a9b">${esc(x.description||'')}</span></td>
      <td>${esc(x.batch_code||'—')}</td><td>${esc(x.status||'draft')}</td><td>${x.is_published?'Yes':'No'}</td><td>${esc(x.sort_order)}</td>
      <td><div class="hoa-admin-row-actions">
        <button onclick="hoaToggleCoursePublish('${x.id}',${!x.is_published})">${x.is_published?'Unpublish':'Publish'}</button>
        <button class="danger" onclick="hoaDeleteCourse('${x.id}')">Delete</button>
      </div></td></tr>`).join('')}</tbody></table>`;
  }

  window.hoaLoadCourses=async function(){
    adminGuard(); msg('hoaCourseStatusMsg','Loading…');
    try{await loadCourses();msg('hoaCourseStatusMsg','Updated.');}catch(e){console.error(e);msg('hoaCourseStatusMsg',e.message||'Could not load courses.',true);}
  };

  window.hoaCreateCourse=async function(){
    adminGuard();
    const name=val('hoaCourseName'); if(!name){msg('hoaCourseStatusMsg','Course name is required.',true);return;}
    try{
      const uid=await adminUserId(); const c=client();
      const status=val('hoaCourseStatus')||'draft';
      const isPublished=status==='published';
      const r=await c.from('batches').insert({name,batch_code:val('hoaCourseCode')||null,description:val('hoaCourseDescription')||null,status,is_published:isPublished,sort_order:Number(val('hoaCourseSort')||0),created_by:uid}).select().single();
      if(r.error)throw r.error;
      ['hoaCourseName','hoaCourseCode','hoaCourseDescription'].forEach(id=>$(id).value='');
      msg('hoaCourseStatusMsg','Course created.');
      await loadCourses();
    }catch(e){console.error(e);msg('hoaCourseStatusMsg',e.message||'Could not create course.',true);}
  };

  window.hoaToggleCoursePublish=async function(id,publish){
    adminGuard();
    try{
      const c=client();
      const r=await c.from('batches').update({is_published:publish,status:publish?'published':'draft',updated_at:new Date().toISOString()}).eq('id',id);
      if(r.error)throw r.error;
      await loadCourses();
    }catch(e){alert(e.message||'Could not update course.');}
  };

  window.hoaDeleteCourse=async function(id){
    adminGuard();
    if(!confirm('Delete this course/batch? Its lecture/access records may prevent deletion.'))return;
    try{
      const c=client(); const r=await c.from('batches').delete().eq('id',id);
      if(r.error)throw r.error; await loadCourses(); await loadVideos();
    }catch(e){alert(e.message||'Could not delete course.');}
  };

  async function loadVideos(){
    const c=client(); if(!c?.from) throw new Error('Supabase is not ready.');
    const r=await c.from('batch_lectures').select('*, batches(name,batch_code)').order('sort_order',{ascending:true}).order('lecture_no',{ascending:true});
    if(r.error)throw r.error;
    const rows=r.data||[]; $('hoaVideoCount').textContent=rows.length;
    const list=$('hoaVideoList'); if(!list)return;
    if(!rows.length){renderEmpty('hoaVideoList','No classes/videos created yet.');return;}
    list.innerHTML=`<table><thead><tr><th>Course</th><th>#</th><th>Class</th><th>Video</th><th>Status</th><th>Scheduled</th><th>Actions</th></tr></thead><tbody>${rows.map(x=>`
      <tr><td>${esc(x.batches?.name||'—')}</td><td>${esc(x.lecture_no)}</td><td><b>${esc(x.title)}</b><br><span style="color:#7b8a9b">${esc(x.description||'')}</span></td>
      <td>${esc(x.youtube_video_id)}</td><td>${x.is_published?'Published':'Draft'}</td><td>${esc(fmtDate(x.scheduled_at))}</td>
      <td><div class="hoa-admin-row-actions"><button type="button" class="hoa-video-preview-btn" data-video-preview-id="${esc(x.youtube_video_id)}" data-video-preview-title="${esc(x.title||'Video Preview')}" data-video-preview-batch="${esc(x.batches?.name||'')}">▶ Preview</button><button onclick="hoaToggleVideoPublish('${x.id}',${!x.is_published})">${x.is_published?'Unpublish':'Publish'}</button><button class="danger" onclick="hoaDeleteVideo('${x.id}')">Delete</button></div></td></tr>`).join('')}</tbody></table>`;
      list.querySelectorAll('[data-video-preview-id]').forEach(function(btn){
        btn.addEventListener('click',function(){
          window.hoaPreviewVideo(
            btn.getAttribute('data-video-preview-id') || '',
            btn.getAttribute('data-video-preview-title') || 'Video Preview',
            btn.getAttribute('data-video-preview-batch') || ''
          );
        });
      });
  }
  window.hoaLoadVideos=async function(){
    adminGuard(); msg('hoaVideoStatusMsg','Loading…');
    try{await loadCourses();await loadVideos();msg('hoaVideoStatusMsg','Updated.');}catch(e){console.error(e);msg('hoaVideoStatusMsg',e.message||'Could not load videos.',true);}
  };
  window.hoaCreateVideo=async function(){
    adminGuard();
    const batch=val('hoaVideoBatch'), title=val('hoaVideoTitle'), yt=val('hoaVideoYoutubeId');
    if(!batch||!title||!yt){msg('hoaVideoStatusMsg','Course, class title and YouTube video ID are required.',true);return;}
    if(!/^[A-Za-z0-9_-]{6,20}$/.test(yt)){msg('hoaVideoStatusMsg','Enter a valid YouTube video ID.',true);return;}
    try{
      const c=client();
      const r=await c.from('batch_lectures').insert({
        batch_id:batch,lecture_no:Number(val('hoaVideoLectureNo')||1),title,
        description:val('hoaVideoDescription')||null,youtube_video_id:yt,
        scheduled_at:val('hoaVideoScheduled')?new Date(val('hoaVideoScheduled')).toISOString():null,
        duration_seconds:val('hoaVideoDuration')?Number(val('hoaVideoDuration')):null,
        is_published:boolVal('hoaVideoPublished'),sort_order:Number(val('hoaVideoSort')||0)
      });
      if(r.error)throw r.error;
      ['hoaVideoTitle','hoaVideoYoutubeId','hoaVideoDescription','hoaVideoScheduled','hoaVideoDuration'].forEach(id=>$(id).value='');
      msg('hoaVideoStatusMsg','Class/video added.'); await loadVideos();
    }catch(e){console.error(e);msg('hoaVideoStatusMsg',e.message||'Could not add video.',true);}
  };

  window.hoaYTApiReadyPromise=window.hoaYTApiReadyPromise||new Promise(function(resolve,reject){
    if(window.YT&&window.YT.Player){resolve(window.YT);return}
    var timeout=setTimeout(function(){reject(new Error('YouTube player API timed out.'))},12000);
    var previous=window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady=function(){
      clearTimeout(timeout);
      if(typeof previous==='function')try{previous()}catch(_){}
      if(window.YT&&window.YT.Player)resolve(window.YT);else reject(new Error('YouTube player API unavailable.'));
    };
    var existing=document.querySelector('script[data-hoa-youtube-api]');
    if(existing)return;
    var sc=document.createElement('script');
    sc.src='https://www.youtube.com/iframe_api';
    sc.async=true;
    sc.dataset.hoaYoutubeApi='1';
    sc.onerror=function(){clearTimeout(timeout);reject(new Error('Unable to load YouTube player API.'))};
    document.head.appendChild(sc);
  });

  window.hoaCreateCustomPlayer=function(opts){
    opts=opts||{};
    const id=String(opts.videoId||'').trim();
    if(!/^[A-Za-z0-9_-]{11}$/.test(id)) return null;

    const root=document.createElement('div');
    root.className='hoa-custom-player hoa-ui-visible hoa-show-center-play';
    root.tabIndex=0;
    root.innerHTML=
      '<div class="hoa-youtube-host"></div>'+
      '<div class="hoa-player-shield" aria-label="Video surface"></div>'+
      '<div class="hoa-player-overlay"><div class="hoa-player-brand">'+
      (opts.logo?'<img src="'+hoaPreviewEsc(opts.logo)+'" alt="HOA">':'')+
      '<div><div class="hoa-player-title">'+hoaPreviewEsc(opts.title||'Lecture')+'</div>'+
      '<div class="hoa-player-subtitle">'+hoaPreviewEsc(opts.subtitle||'HUB OF ASPIRANTS')+'</div></div></div></div>'+
      '<button type="button" class="hoa-player-center-play" aria-label="Play">▶</button>'+
      '<div class="hoa-player-note">HUB OF ASPIRANTS</div>'+
      '<div class="hoa-player-controls">'+
      '<button type="button" class="hoa-player-btn" data-act="back" aria-label="Back 10 seconds">↶</button>'+
      '<button type="button" class="hoa-player-btn" data-act="play" aria-label="Play">▶</button>'+
      '<button type="button" class="hoa-player-btn" data-act="forward" aria-label="Forward 10 seconds">↷</button>'+
      '<span class="hoa-player-time" data-time>0:00 / 0:00</span>'+
      '<input class="hoa-player-progress" data-progress type="range" min="0" max="100" value="0" step="0.1" aria-label="Video progress">'+
      '<button type="button" class="hoa-player-btn" data-act="mute" aria-label="Mute">🔊</button>'+
      '<input class="hoa-player-volume" data-volume type="range" min="0" max="100" value="100" step="1" aria-label="Volume">'+
      '<div class="hoa-player-speed-wrap">'+
      '<button type="button" class="hoa-player-speed-button" data-speed-button aria-label="Playback speed">1×</button>'+
      '<div class="hoa-player-speed-menu" data-speed-menu>'+
      ['0.75','1','1.25','1.5','1.75','2'].map(function(v){return '<button type="button" class="hoa-player-speed-option'+(v==='1'?' active':'')+'" data-speed="'+v+'">'+v+'×</button>'}).join('')+
      '</div></div>'+
      '<button type="button" class="hoa-player-btn hoa-player-fullscreen" data-act="fullscreen" aria-label="Fullscreen">⛶</button>'+
      '</div>';

    const host=root.querySelector('.hoa-youtube-host');
    const shield=root.querySelector('.hoa-player-shield');
    const playBtn=root.querySelector('[data-act="play"]');
    const center=root.querySelector('.hoa-player-center-play');
    const progress=root.querySelector('[data-progress]');
    const timeEl=root.querySelector('[data-time]');
    const volume=root.querySelector('[data-volume]');
    const muteBtn=root.querySelector('[data-act="mute"]');
    const speedBtn=root.querySelector('[data-speed-button]');
    const speedMenu=root.querySelector('[data-speed-menu]');
    let yt=null, ready=false, timer=null, hideTimer=null, duration=0, volumeValue=100;

    function showUI(){
      root.classList.add('hoa-ui-visible');
      clearTimeout(hideTimer);
      hideTimer=setTimeout(function(){speedMenu.classList.remove('open');root.classList.remove('hoa-ui-visible')},4000);
    }
    function fmt(t){
      t=Math.max(0,Math.floor(Number(t)||0));
      const h=Math.floor(t/3600),m=Math.floor((t%3600)/60),sec=String(t%60).padStart(2,'0');
      return (h?h+':'+String(m).padStart(2,'0'):m)+':'+sec;
    }
    function sync(){
      if(!ready||!yt)return;
      const cur=Number(yt.getCurrentTime&&yt.getCurrentTime())||0;
      duration=Number(yt.getDuration&&yt.getDuration())||duration;
      progress.value=duration?Math.min(100,(cur/duration)*100):0;
      timeEl.textContent=fmt(cur)+' / '+fmt(duration);
      const st=yt.getPlayerState?yt.getPlayerState():-1;
      if(st===1){
        playBtn.textContent='Ⅱ';playBtn.setAttribute('aria-label','Pause');center.style.display='none';
      }else if(st===2||st===0){
        playBtn.textContent='▶';playBtn.setAttribute('aria-label','Play');center.style.display='flex';
      }
    }
    function showPlayState(){
      if(!yt)return;
      const st=yt.getPlayerState();
      if(st===1){playBtn.textContent='Ⅱ';center.style.display='none'}
      else{playBtn.textContent='▶';center.style.display='flex'}
    }
    function togglePlay(){
      if(!ready||!yt)return;
      if(yt.getPlayerState()===1)yt.pauseVideo();else yt.playVideo();
      showUI();
    }
    function seekBy(seconds){
      if(!ready||!yt)return;
      const cur=Number(yt.getCurrentTime())||0;
      const dur=Number(yt.getDuration())||0;
      yt.seekTo(Math.max(0,Math.min(dur,cur+seconds)),true);
      showUI();
    }

    shield.addEventListener('click',function(){showUI()});
    shield.addEventListener('touchstart',showUI,{passive:true});
    shield.addEventListener('mousemove',showUI);
    center.onclick=togglePlay;
    playBtn.onclick=togglePlay;
    root.querySelector('[data-act="back"]').onclick=function(){seekBy(-10)};
    root.querySelector('[data-act="forward"]').onclick=function(){seekBy(10)};
    muteBtn.onclick=function(){
      if(!yt)return;
      if(yt.isMuted&&yt.isMuted()){yt.unMute();volume.value=volumeValue;muteBtn.textContent='🔊'}
      else{yt.mute();muteBtn.textContent='🔇'}
      showUI();
    };
    volume.oninput=function(){
      volumeValue=Number(volume.value);
      if(!yt)return;
      yt.unMute();yt.setVolume(volumeValue);
      muteBtn.textContent=volumeValue===0?'🔇':'🔊';
      showUI();
    };
    progress.oninput=function(){
      if(!yt||!duration)return;
      yt.seekTo((Number(progress.value)/100)*duration,true);
      showUI();
    };
    speedBtn.onclick=function(e){e.stopPropagation();speedMenu.classList.toggle('open');showUI()};
    speedMenu.querySelectorAll('[data-speed]').forEach(function(b){
      b.onclick=function(e){
        e.stopPropagation();
        const rate=Number(b.dataset.speed);
        if(yt&&ready)yt.setPlaybackRate(rate);
        speedBtn.textContent=rate+'×';
        speedMenu.querySelectorAll('[data-speed]').forEach(function(x){x.classList.toggle('active',x===b)});
        speedMenu.classList.remove('open');showUI();
      };
    });
    root.querySelector('[data-act="fullscreen"]').onclick=function(){
      showUI();
      if(document.fullscreenElement){document.exitFullscreen&&document.exitFullscreen()}
      else if(root.requestFullscreen)root.requestFullscreen();
    };

    window.hoaYTApiReadyPromise.then(function(YT){
      yt=new YT.Player(host,{
        width:'100%',height:'100%',videoId:id,
        playerVars:{
          autoplay:0,controls:0,disablekb:1,fs:0,iv_load_policy:3,
          modestbranding:1,rel:0,playsinline:1,
          origin:window.location.origin,
          widget_referrer:window.location.href
        },
        events:{
          onReady:function(){
            ready=true;
            duration=Number(yt.getDuration())||0;
            yt.setVolume(volumeValue);
            sync();
          },
          onStateChange:function(){sync();showPlayState()},
          onError:function(){center.style.display='flex';playBtn.textContent='▶'}
        }
      });
    }).catch(function(){
      center.style.display='flex';
      timeEl.textContent='Unable to initialize video player';
    });

    timer=setInterval(sync,250);
    root._hoaDestroy=function(){
      clearInterval(timer);clearTimeout(hideTimer);
      speedMenu.classList.remove('open');
      try{if(yt&&yt.destroy)yt.destroy()}catch(_){}
      root.innerHTML='';
    };
    return root;
  };

  window.hoaPreviewVideo=function(videoId,title,batchName){
    const player=document.getElementById('hoaAdminInlineVideoPlayer');
    const frame=document.getElementById('hoaAdminInlineVideoFrame');
    if(!player||!frame)return;
    frame.innerHTML='';
    const logo=(document.querySelector('img[src*="logo"], img[alt*="HOA" i]')||{}).src||'';
    const p=window.hoaCreateCustomPlayer({
      videoId:videoId,
      title:title||'Video Preview',
      subtitle:batchName||'HUB OF ASPIRANTS • Admin Preview',
      logo:logo
    });
    if(!p)return;
    frame.appendChild(p);
    player.style.display='block';
    player.scrollIntoView({behavior:'smooth',block:'nearest'});
  };

  function hoaPreviewEsc(v){
    return String(v||'').replace(/[&<>"']/g,function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  document.addEventListener('DOMContentLoaded',function(){
    const close=document.getElementById('hoaAdminInlineVideoClose');
    if(close)close.addEventListener('click',function(){
      const frame=document.getElementById('hoaAdminInlineVideoFrame');
      const player=document.getElementById('hoaAdminInlineVideoPlayer');
      if(frame){
        const p=frame.firstElementChild;
        if(p&&p._hoaDestroy)p._hoaDestroy();
        frame.innerHTML='';
      }
      if(player)player.style.display='none';
    });
  });

  window.hoaToggleVideoPublish=async function(id,publish){
    adminGuard(); try{const r=await client().from('batch_lectures').update({is_published:publish,updated_at:new Date().toISOString()}).eq('id',id);if(r.error)throw r.error;await loadVideos();}catch(e){alert(e.message||'Could not update video.');}
  };
  window.hoaDeleteVideo=async function(id){
    adminGuard(); if(!confirm('Delete this class/video entry?'))return;
    try{const r=await client().from('batch_lectures').delete().eq('id',id);if(r.error)throw r.error;await loadVideos();}catch(e){alert(e.message||'Could not delete video.');}
  };

  async function loadNotes(){
    const c=client(); const r=await c.from('exam_notes').select('*').order('sort_order',{ascending:true}).order('created_at',{ascending:false});
    if(r.error)throw r.error;
    const rows=r.data||[]; $('hoaNotesCount').textContent=rows.length;
    const list=$('hoaNoteList'); if(!list)return;
    if(!rows.length){renderEmpty('hoaNoteList','No notes/study materials created yet.');return;}
    list.innerHTML=`<table><thead><tr><th>Title</th><th>Subject</th><th>Exam</th><th>File</th><th>Status</th><th>Actions</th></tr></thead><tbody>${rows.map(x=>`
      <tr><td><b>${esc(x.title)}</b><br><span style="color:#7b8a9b">${esc(x.description||'')}</span></td><td>${esc(x.subject||'—')}</td><td>${esc(x.exam||'—')}</td><td>${esc(x.file_name||x.storage_path||'—')}</td><td>${x.is_published?'Published':'Draft'}</td>
      <td><div class="hoa-admin-row-actions"><button onclick="hoaToggleNotePublish('${x.id}',${!x.is_published})">${x.is_published?'Unpublish':'Publish'}</button><button class="danger" onclick="hoaDeleteNote('${x.id}')">Delete</button></div></td></tr>`).join('')}</tbody></table>`;
  }
  window.hoaLoadNotes=async function(){
    adminGuard(); msg('hoaNoteStatusMsg','Loading…');
    try{await loadNotes();msg('hoaNoteStatusMsg','Updated.');}catch(e){console.error(e);msg('hoaNoteStatusMsg',e.message||'Could not load notes.',true);}
  };
  window.hoaCreateNote=async function(){
    adminGuard(); const title=val('hoaNoteTitle'); if(!title){msg('hoaNoteStatusMsg','Note title is required.',true);return;}
    try{
      const uid=await adminUserId(), c=client();
      const r=await c.from('exam_notes').insert({
        title,subject:val('hoaNoteSubject')||null,exam:val('hoaNoteExam')||null,description:val('hoaNoteDescription')||null,
        storage_path:val('hoaNoteStoragePath'),file_name:val('hoaNoteFileName')||null,mime_type:'application/pdf',
        is_published:boolVal('hoaNotePublished'),sort_order:Number(val('hoaNoteSort')||0),created_by:uid
      });
      if(r.error)throw r.error;
      ['hoaNoteTitle','hoaNoteSubject','hoaNoteExam','hoaNoteFileName','hoaNoteDescription','hoaNoteStoragePath'].forEach(id=>$(id).value='');
      msg('hoaNoteStatusMsg','Note record created.'); await loadNotes();
    }catch(e){console.error(e);msg('hoaNoteStatusMsg',e.message||'Could not create note.',true);}
  };
  window.hoaToggleNotePublish=async function(id,publish){
    adminGuard();try{const r=await client().from('exam_notes').update({is_published:publish,updated_at:new Date().toISOString()}).eq('id',id);if(r.error)throw r.error;await loadNotes();}catch(e){alert(e.message||'Could not update note.');}
  };
  window.hoaDeleteNote=async function(id){
    adminGuard();if(!confirm('Delete this note record?'))return;
    try{const r=await client().from('exam_notes').delete().eq('id',id);if(r.error)throw r.error;await loadNotes();}catch(e){alert(e.message||'Could not delete note.');}
  };

  async function loadAccessResources(){
    const c=client();
    const [s,b,t,n]=await Promise.all([
      c.from('students').select('id,full_name,email,access_type').order('full_name'),
      c.from('batches').select('id,name,batch_code,is_published').order('sort_order'),
      c.from('tests').select('id,title,is_published,access_type').order('created_at',{ascending:false}),
      c.from('exam_notes').select('id,title,is_published').order('sort_order')
    ]);
    for(const r of [s,b,t,n])if(r.error)throw r.error;
    $('hoaAccessStudent').innerHTML='<option value="">Select student</option>'+(s.data||[]).map(x=>`<option value="${esc(x.id)}">${esc(x.full_name)} · ${esc(x.email)}</option>`).join('');
    window.__hoaAccessCache={batches:b.data||[],tests:t.data||[],notes:n.data||[]};
    hoaAccessTypeChanged();
  }
  window.hoaAccessTypeChanged=function(){
    const type=val('hoaAccessType'), c=window.__hoaAccessCache||{};
    const rows=type==='batch'?c.batches||[]:type==='test'?c.tests||[]:c.notes||[];
    $('hoaAccessResource').innerHTML='<option value="">Select resource</option>'+rows.map(x=>`<option value="${esc(x.id)}">${esc(x.name||x.title)}${x.batch_code?' · '+esc(x.batch_code):''}</option>`).join('');
  };
  window.hoaLoadAccess=async function(){
    adminGuard(); msg('hoaAccessStatusMsg','Loading…');
    try{await loadAccessResources();await loadAccessList();msg('hoaAccessStatusMsg','Updated.');}catch(e){console.error(e);msg('hoaAccessStatusMsg',e.message||'Could not load access data.',true);}
  };
  async function loadAccessList(){
    const c=client(), [ba,te,no]=await Promise.all([
      c.from('student_batch_access').select('id,starts_at,expires_at,students(full_name,email),batches(name,batch_code)').order('created_at',{ascending:false}).limit(100),
      c.from('student_test_access').select('id,starts_at,expires_at,students(full_name,email),tests(title)').order('created_at',{ascending:false}).limit(100),
      c.from('student_note_access').select('id,starts_at,expires_at,students(full_name,email),exam_notes(title)').order('created_at',{ascending:false}).limit(100)
    ]);
    for(const r of [ba,te,no])if(r.error)throw r.error;
    const rows=[
      ...(ba.data||[]).map(x=>({id:x.id,type:'Course',student:x.students?.full_name,resource:x.batches?.name||'—',starts:x.starts_at,expires:x.expires_at,table:'student_batch_access'})),
      ...(te.data||[]).map(x=>({id:x.id,type:'Mock Test',student:x.students?.full_name,resource:x.tests?.title||'—',starts:x.starts_at,expires:x.expires_at,table:'student_test_access'})),
      ...(no.data||[]).map(x=>({id:x.id,type:'Note',student:x.students?.full_name,resource:x.exam_notes?.title||'—',starts:x.starts_at,expires:x.expires_at,table:'student_note_access'}))
    ];
    const list=$('hoaAccessList');
    if(!rows.length){renderEmpty('hoaAccessList','No access grants found.');return;}
    list.innerHTML=`<table><thead><tr><th>Type</th><th>Student</th><th>Resource</th><th>Starts</th><th>Expires</th><th>Action</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${esc(x.type)}</td><td>${esc(x.student||'—')}</td><td>${esc(x.resource)}</td><td>${esc(fmtDate(x.starts))}</td><td>${esc(fmtDate(x.expires))}</td><td><div class="hoa-admin-row-actions"><button class="danger" onclick="hoaRevokeAccess('${x.table}','${x.id}')">Revoke</button></div></td></tr>`).join('')}</tbody></table>`;
  }
  window.hoaGrantAccess=async function(){
    adminGuard();
    const student=val('hoaAccessStudent'), type=val('hoaAccessType'), resource=val('hoaAccessResource');
    if(!student||!resource){msg('hoaAccessStatusMsg','Student and resource are required.',true);return;}
    try{
      const uid=await adminUserId(), c=client();
      const base={student_id:student,granted_by:uid,starts_at:val('hoaAccessStarts')?new Date(val('hoaAccessStarts')).toISOString():null,expires_at:val('hoaAccessExpires')?new Date(val('hoaAccessExpires')).toISOString():null};
      const table=type==='batch'?'student_batch_access':type==='test'?'student_test_access':'student_note_access';
      const payload={...base,[type==='batch'?'batch_id':type==='test'?'test_id':'note_id']:resource};
      const r=await c.from(table).insert(payload);
      if(r.error)throw r.error;
      msg('hoaAccessStatusMsg','Access granted.'); await loadAccessResources(); await loadAccessList();
    }catch(e){console.error(e);msg('hoaAccessStatusMsg',e.message||'Could not grant access.',true);}
  };
  window.hoaRevokeAccess=async function(table,id){
    adminGuard();if(!confirm('Revoke this access?'))return;
    try{const r=await client().from(table).delete().eq('id',id);if(r.error)throw r.error;await loadAccessList();}catch(e){alert(e.message||'Could not revoke access.');}
  };

  const original = window.showAdminSection;
  window.showAdminSection = async function(section){
    const r = original ? original(section) : undefined;
    if(section==='course') await loadCourses().catch(e=>console.error(e));
    if(section==='video'){await loadCourses().catch(e=>console.error(e));await loadVideos().catch(e=>console.error(e));}
    if(section==='notes') await loadNotes().catch(e=>console.error(e));
    if(section==='access') await loadAccessResources().then(loadAccessList).catch(e=>console.error(e));
    return r;
  };

  // Make the new panels visible using the same activation mechanism as existing sections.
  const originalActivate = window.showAdminSection;
  window.showAdminSection = async function(section){
    const ids={student:'adminSectionStudentPanel',test:'adminSectionTestPanel',course:'adminSectionCoursePanel',video:'adminSectionVideoPanel',notes:'adminSectionNotesPanel',access:'adminSectionAccessPanel',result:'adminSectionResultPanel',admin:'adminSectionAdminPanel'};
    const nav={student:'adminNavStudent',test:'adminNavTest',course:'adminNavCourse',video:'adminNavVideo',notes:'adminNavNotes',access:'adminNavAccess',result:'adminNavResult',admin:'adminNavAdmin'};
    if(!adminLoggedIn){return;}
    Object.entries(ids).forEach(([k,id])=>{const e=$(id);if(e)e.classList.toggle('active',k===section);});
    Object.entries(nav).forEach(([k,id])=>$(id)?.classList.toggle('active',k===section));
    if(section==='student' && typeof renderAdminStudents==='function') return renderAdminStudents();
    if(section==='test' && typeof renderLibrary==='function') return renderLibrary();
    if(section==='result' && typeof activateAdminPanel==='function') return activateAdminPanel('result');
    if(section==='admin' && typeof renderAdminAccount==='function') { var rr=await renderAdminAccount(); if(window.hoaV643RenderOwnerAdminManager)window.hoaV643RenderOwnerAdminManager(); return rr; } if(section==='admin'){if(window.hoaV643RenderOwnerAdminManager) window.hoaV643RenderOwnerAdminManager();}
    if(section==='course') return loadCourses();
    if(section==='video'){await loadCourses();return loadVideos();}
    if(section==='notes') return loadNotes();
    if(section==='access'){await loadAccessResources();return loadAccessList();}
  };

  window.hoaAdminContentReady=true;
})();
