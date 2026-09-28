
(function(){
  'use strict';

  function fitPosterSlides(){
    var wrap=document.getElementById('hoaV643PosterWrap');
    if(!wrap) return;

    var slides=Array.prototype.slice.call(
      wrap.querySelectorAll('.hoa643-poster-slide')
    );
    if(!slides.length) return;

    var wr=wrap.getBoundingClientRect();
    var gap=window.innerWidth<=700 ? 8 : 11;

    /* Keep a tiny breathing space from the carousel stage only. */
    var maxW=Math.max(180,wr.width-gap*2);
    var maxH=Math.max(180,wr.height-gap*2);

    slides.forEach(function(slide){
      var img=slide.querySelector('img');
      if(!img) return;

      function apply(){
        var nw=img.naturalWidth;
        var nh=img.naturalHeight;
        if(!nw || !nh) return;

        var ratio=nw/nh;
        var w=maxW;
        var h=w/ratio;

        if(h>maxH){
          h=maxH;
          w=h*ratio;
        }

        /* Never exceed the stage. Round to stable CSS pixels. */
        w=Math.max(160,Math.floor(w));
        h=Math.max(120,Math.floor(h));

        slide.style.width=w+'px';
        slide.style.height=h+'px';
        slide.style.maxWidth='none';
        slide.style.maxHeight='none';
        slide.style.aspectRatio=nw+' / '+nh;
      }

      if(img.complete) apply();
      else img.addEventListener('load',apply,{once:true});
    });
  }

  var timer=0;
  function schedule(){
    clearTimeout(timer);
    timer=setTimeout(fitPosterSlides,40);
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',schedule,{once:true});
  }else{
    schedule();
  }

  window.addEventListener('resize',schedule,{passive:true});

  /* Supabase poster refreshes can replace the slides dynamically. */
  var observer=new MutationObserver(schedule);
  var target=document.getElementById('hoaV643PosterWrap');
  if(target) observer.observe(target,{childList:true,subtree:true});
})();
