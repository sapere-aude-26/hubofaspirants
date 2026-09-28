
(function(){
  'use strict';

  function fitHOANaturalPosters(){
    var wrap=document.getElementById('hoaV643PosterWrap');
    if(!wrap) return;

    var slides=Array.prototype.slice.call(
      wrap.querySelectorAll('.hoa643-poster-slide')
    );
    if(!slides.length) return;

    var wr=wrap.getBoundingClientRect();
    var gap=window.innerWidth<=700 ? 8 : 11; /* ≈3mm */
    var stageW=Math.max(180,wr.width - gap*2);
    var stageH=Math.max(180,wr.height - gap*2);

    slides.forEach(function(slide){
      var img=slide.querySelector('img');
      if(!img) return;

      function apply(){
        var nw=img.naturalWidth;
        var nh=img.naturalHeight;
        if(!nw || !nh) return;

        var ratio=nw/nh;

        /* Dimensions below are for the ACTUAL IMAGE, not the white frame. */
        var imageW=stageW;
        var imageH=imageW/ratio;

        if(imageH>stageH){
          imageH=stageH;
          imageW=imageH*ratio;
        }

        imageW=Math.max(120,Math.floor(imageW));
        imageH=Math.max(90,Math.floor(imageH));

        /* The slide is image size + exactly the small white surround. */
        var slideW=Math.floor(imageW + gap*2);
        var slideH=Math.floor(imageH + gap*2);

        slide.style.width=slideW+'px';
        slide.style.height=slideH+'px';
        slide.style.maxWidth='none';
        slide.style.maxHeight='none';
        slide.style.aspectRatio='auto';
        slide.style.padding=gap+'px';

        /* Content box = imageW x imageH, so there is no distortion. */
        slide.style.setProperty('--hoa-natural-image-w',imageW+'px');
        slide.style.setProperty('--hoa-natural-image-h',imageH+'px');
      }

      if(img.complete && img.naturalWidth) apply();
      else img.addEventListener('load',apply,{once:true});
    });
  }

  var timer=0;
  function schedule(){
    clearTimeout(timer);
    timer=setTimeout(fitHOANaturalPosters,50);
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',schedule,{once:true});
  }else{
    schedule();
  }

  window.addEventListener('resize',schedule,{passive:true});

  var target=document.getElementById('hoaV643PosterWrap');
  if(target){
    var observer=new MutationObserver(schedule);
    observer.observe(target,{childList:true,subtree:true});
  }
})();
