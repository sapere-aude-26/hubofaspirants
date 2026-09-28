
(function(){
  'use strict';
  var GAP_DESKTOP=11, GAP_MOBILE=8, timer=0;

  function clamp(v,min,max){return Math.max(min,Math.min(max,v));}
  function setVar(el,name,value){el.style.setProperty(name,Math.round(value)+'px');}

  function sizePosters(){
    var wrap=document.getElementById('hoaV643PosterWrap');
    if(!wrap) return;
    var center=wrap.querySelector('.hoa643-poster-center');
    if(!center) return;
    var img=center.querySelector('img');
    if(!img || !img.naturalWidth || !img.naturalHeight){
      if(img && !img.dataset.hoaV9Bound){
        img.dataset.hoaV9Bound='1';
        img.addEventListener('load',schedule,{once:true});
      }
      return;
    }

    var mobile=window.innerWidth<=700;
    var gap=mobile?GAP_MOBILE:GAP_DESKTOP;
    var wr=wrap.getBoundingClientRect();
    var ratio=img.naturalWidth/img.naturalHeight;

    /* Choose the image size first. The ratio is NEVER changed. */
    var maxImageW=mobile?Math.min(wr.width-70,360):Math.min(wr.width-150,760);
    var maxImageH=mobile?Math.min(window.innerHeight*.62,520):Math.min(window.innerHeight*.70,620);
    maxImageW=Math.max(150,maxImageW);
    maxImageH=Math.max(150,maxImageH);

    var imageW=maxImageW;
    var imageH=imageW/ratio;
    if(imageH>maxImageH){imageH=maxImageH;imageW=imageH*ratio;}

    var centerW=imageW+gap*2, centerH=imageH+gap*2;
    var stageH=Math.ceil(centerH+28);
    setVar(wrap,'--hoa-v9-stage-h',stageH);
    setVar(wrap,'--hoa-v9-gap',gap);
    setVar(wrap,'--hoa-v9-slide-w',centerW);
    setVar(wrap,'--hoa-v9-slide-h',centerH);

    /* Side posters preserve THEIR OWN ratios too. They are scaled down only. */
    var sideOffset=Math.max(105,Math.min(mobile?150:Math.min(330,wr.width*.25),wr.width*.25));
    setVar(wrap,'--hoa-v9-side-offset',sideOffset);

    wrap.querySelectorAll('.hoa643-poster-slide').forEach(function(slide){
      var si=slide.querySelector('img');
      if(!si || !si.naturalWidth || !si.naturalHeight) return;
      if(slide===center) return;
      var sr=si.naturalWidth/si.naturalHeight;
      var sideMaxW=imageW*.72, sideMaxH=imageH*.72;
      var sw=sideMaxW, sh=sw/sr;
      if(sh>sideMaxH){sh=sideMaxH;sw=sh*sr;}
      setVar(slide,'--hoa-v9-slide-w',sw+gap*2);
      setVar(slide,'--hoa-v9-slide-h',sh+gap*2);
      slide.style.setProperty('--hoa-v9-gap',gap+'px');
    });
  }

  function schedule(){clearTimeout(timer);timer=setTimeout(sizePosters,40);}

  function init(){
    schedule();
    window.addEventListener('resize',schedule,{passive:true});
    var wrap=document.getElementById('hoaV643PosterWrap');
    if(wrap){
      new MutationObserver(schedule).observe(wrap,{childList:true,subtree:true});
      if(window.ResizeObserver)new ResizeObserver(schedule).observe(wrap);
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
