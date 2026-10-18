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
      '<button type="button" class="hoa-player-close" data-act="close" aria-label="Close video player" title="Close video">×</button>'+
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
      '<button type="button" class="hoa-player-quality-button" data-quality-button aria-label="Current video quality: automatic" title="Streaming quality is selected automatically">AUTO</button>'+
      '<div class="hoa-player-quality-menu" data-quality-menu role="status" aria-live="polite">'+
      '<p class="hoa-player-quality-info">Streaming quality adjusts automatically. Maximum detail depends on the source video and your connection.</p>'+
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
    const closeBtn=root.querySelector('[data-act="close"]');
    let yt=null, ready=false, timer=null, hideTimer=null, duration=0, volumeValue=100, disposed=false;

    function updateQualityStatus(level){
      const labels={small:'240p',medium:'360p',large:'480p',hd720:'720p',hd1080:'1080p',highres:'High'};
      const label=labels[String(level||'').toLowerCase()]||'AUTO';
      qualityBtn.textContent=label;
      qualityBtn.setAttribute('aria-label',label==='AUTO'?'Current video quality: automatic':'Current video quality: '+label+' (selected automatically)');
      qualityBtn.title='YouTube selects streaming quality automatically based on the source and viewing conditions.';
      root.dataset.actualQuality=label;
    }

    function updateVolumeVisual(){
      const level=Math.max(0,Math.min(100,Math.round(Number(volume.value)||0)));
      volume.style.setProperty('--hoa-volume-level',level+'%');
      volume.setAttribute('aria-valuemin','0');
      volume.setAttribute('aria-valuemax','100');
      volume.setAttribute('aria-valuenow',String(level));
      volume.setAttribute('aria-valuetext',level+'% volume');
      volume.title=level+'% volume';
      const muted=level===0||Boolean(yt&&typeof yt.isMuted==='function'&&yt.isMuted());
      muteBtn.textContent=muted?'🔇':'🔊';
      muteBtn.setAttribute('aria-label',muted?'Unmute audio':'Mute audio');
      muteBtn.title=muted?'Unmute audio':'Mute audio';
      root.dataset.volumeLevel=String(level);
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
      if(disposed||!ready||!yt)return;
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
    function destroyPlayer(){
      if(disposed)return;
      disposed=true;
      clearInterval(timer);clearTimeout(hideTimer);
      speedMenu.classList.remove('open');qualityMenu.classList.remove('open');
      try{if(yt&&yt.destroy)yt.destroy()}catch(_){}
      yt=null;ready=false;
      root.replaceChildren();
    }
    function closePlayer(e){
      if(e){e.preventDefault();e.stopPropagation();}
      const parent=root.parentNode;
      destroyPlayer();
      if(root.parentNode)root.parentNode.removeChild(root);
      try{if(typeof opts.onClose==='function')opts.onClose()}catch(err){console.error('[HOA video player] close callback failed',err)}
    }
    closeBtn.addEventListener('click',closePlayer);
    root.addEventListener('keydown',function(e){
      if(e.key==='Escape'){
        if(speedMenu.classList.contains('open')){speedMenu.classList.remove('open');e.preventDefault();}
        else if(qualityMenu.classList.contains('open')){qualityMenu.classList.remove('open');e.preventDefault();}
        else closePlayer(e);
      }
    });
    center.onclick=togglePlay;
    playBtn.onclick=togglePlay;
    root.querySelector('[data-act="back"]').onclick=function(){seekBy(-10)};
    root.querySelector('[data-act="forward"]').onclick=function(){seekBy(10)};
    muteBtn.onclick=function(){
      if(!yt||!ready)return;
      const muted=Boolean(yt.isMuted&&yt.isMuted())||Number(volume.value)===0;
      if(muted){
        const restore=Math.max(1,Math.min(100,Number(volumeValue)||70));
        volume.value=String(restore);yt.unMute();yt.setVolume(restore);
      }else{
        volumeValue=Math.max(1,Number(volume.value)||volumeValue||70);yt.mute();
      }
      updateVolumeVisual();showUI();
    };
    function applyVolumeFromControl(){
      const next=Math.max(0,Math.min(100,Number(volume.value)||0));
      if(next>0)volumeValue=next;
      updateVolumeVisual();
      if(yt&&ready){if(next===0)yt.mute();else{if(typeof yt.unMute==='function')yt.unMute();yt.setVolume(next);}}
      showUI();
    }
    /* Listen to both input and change: the first updates continuously while dragging;
       the second commits the final value on touch devices and keyboard operation. */
    volume.addEventListener('input',applyVolumeFromControl);
    volume.addEventListener('change',applyVolumeFromControl);
    volume.addEventListener('pointerdown',showUI,{passive:true});
    volume.addEventListener('touchstart',showUI,{passive:true});
    volume.addEventListener('focus',showUI);
    updateVolumeVisual();
    updateQualityStatus('');
    progress.oninput=function(){
      if(!yt||!duration)return;
      yt.seekTo((Number(progress.value)/100)*duration,true);
      showUI();
    };
    speedBtn.onclick=function(e){e.stopPropagation();speedMenu.classList.toggle('open');showUI()};
    qualityBtn.onclick=function(e){e.stopPropagation();speedMenu.classList.remove('open');qualityMenu.classList.toggle('open');showUI()};

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
      if(disposed)return;
      const playerRect=root.getBoundingClientRect();
      const playerWidth=Math.max(200,Math.round(playerRect.width||640));
      const playerHeight=Math.max(200,Math.round(playerRect.height||playerWidth*9/16));
      yt=new YT.Player(host,{
        width:playerWidth,height:playerHeight,videoId:id,
        playerVars:{
          autoplay:0,controls:0,disablekb:1,fs:0,iv_load_policy:3,
          modestbranding:1,rel:0,playsinline:1,cc_load_policy:0,
          origin:window.location.origin,
          widget_referrer:window.location.href
        },
        events:{
          onReady:function(){
            if(disposed){try{yt&&yt.destroy&&yt.destroy()}catch(_){};return;}
            ready=true;
            duration=Number(yt.getDuration())||0;
            yt.setVolume(volumeValue);
            updateVolumeVisual();
            sync();
          },
          onStateChange:function(){if(disposed)return;sync();showPlayState()},
          onPlaybackQualityChange:function(event){if(!disposed)updateQualityStatus(event&&event.data)},
          onError:function(){if(disposed)return;center.style.display='flex';playBtn.textContent='▶'}
        }
      });
    }).catch(function(){
      center.style.display='flex';
      timeEl.textContent='Unable to initialize video player';
    });

    timer=setInterval(sync,250);
    root._hoaDestroy=destroyPlayer;
    return root;
  };
})();
