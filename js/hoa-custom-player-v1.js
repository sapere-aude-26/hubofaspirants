/* HOA V8.90 — Shared branded video player for the Free Student portal.
 * Lazy-loads the YouTube IFrame API only when a video is opened.
 * Keeps playback inside the HOA custom player; never redirects students to youtube.com.
 */
(function(){
  'use strict';
  function hoaPreviewEsc(v){
    return String(v||'').replace(/[&<>"']/g,function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }
  function ensureHoaYTApi615(){
    if(window.YT&&window.YT.Player) return Promise.resolve(window.YT);
    if(window.__hoaSharedYTApiPromise615) return window.__hoaSharedYTApiPromise615;
    window.__hoaSharedYTApiPromise615 = new Promise(function(resolve,reject){
      var settled=false;
      var timeout=setTimeout(function(){finish(new Error('YouTube player API timed out.'))},12000);
      function finish(err){
        if(settled)return;settled=true;clearTimeout(timeout);
        if(err){window.__hoaSharedYTApiPromise615=null;reject(err)}
        else resolve(window.YT);
      }
      var previous=window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady=function(){
        try{if(typeof previous==='function')previous()}catch(_){}
        if(window.YT&&window.YT.Player)finish();else finish(new Error('YouTube player API unavailable.'));
      };
      var existing=document.querySelector('script[data-hoa-youtube-api]');
      if(!existing){
        var sc=document.createElement('script');
        sc.src='https://www.youtube.com/iframe_api';
        sc.async=true;sc.dataset.hoaYoutubeApi='1';
        sc.onerror=function(){finish(new Error('Unable to load the video player.'))};
        document.head.appendChild(sc);
      } else if(window.YT&&window.YT.Player){finish()}
    });
    return window.__hoaSharedYTApiPromise615;
  }

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
      '<div class="hoa-player-quality-wrap">'+
      '<button type="button" class="hoa-player-quality-button" data-quality-button aria-label="Video quality">HD</button>'+
      '<div class="hoa-player-quality-menu" data-quality-menu>'+
      '<button type="button" class="hoa-player-quality-option active" data-quality="hd">HD</button>'+
      '<button type="button" class="hoa-player-quality-option" data-quality="data-saver">Data Saver</button>'+
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
    const qualityBtn=root.querySelector('[data-quality-button]');
    const qualityMenu=root.querySelector('[data-quality-menu]');
    const qualityOptions=qualityMenu.querySelectorAll('[data-quality]');
    const qualityStorageKey='hoa.video.qualityMode';
    let qualityMode='hd';
    try{qualityMode=localStorage.getItem(qualityStorageKey)||'hd'}catch(_){}
    let yt=null, ready=false, timer=null, hideTimer=null, duration=0, volumeValue=100;

    function applyQualityMode(mode){
      qualityMode=mode==='data-saver'?'data-saver':'hd';
      qualityBtn.textContent=qualityMode==='data-saver'?'Data Saver':'HD';
      qualityBtn.setAttribute('aria-label','Video quality: '+(qualityMode==='data-saver'?'Data Saver':'HD'));
      qualityOptions.forEach(function(b){b.classList.toggle('active',b.dataset.quality===qualityMode)});
      try{localStorage.setItem(qualityStorageKey,qualityMode)}catch(_){}
      // YouTube's supported IFrame API intentionally leaves stream-quality selection
      // to its adaptive player. Data Saver therefore selects adaptive/Auto behavior
      // without attempting the deprecated setPlaybackQuality() API.
      root.dataset.qualityMode=qualityMode;
      showUI();
    }

    function showUI(){
      root.classList.add('hoa-ui-visible');
      clearTimeout(hideTimer);
      hideTimer=setTimeout(function(){speedMenu.classList.remove('open');qualityMenu.classList.remove('open');root.classList.remove('hoa-ui-visible')},4000);
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
    qualityBtn.onclick=function(e){e.stopPropagation();speedMenu.classList.remove('open');qualityMenu.classList.toggle('open');showUI()};
    qualityOptions.forEach(function(b){
      b.onclick=function(e){e.stopPropagation();applyQualityMode(b.dataset.quality);qualityMenu.classList.remove('open')};
    });
    applyQualityMode(qualityMode);

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

    ensureHoaYTApi615().then(function(YT){
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
      speedMenu.classList.remove('open');qualityMenu.classList.remove('open');
      try{if(yt&&yt.destroy)yt.destroy()}catch(_){}
      root.innerHTML='';
    };
    return root;
  };
})();
