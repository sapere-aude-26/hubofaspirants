
(function(){
  var timer=null;
  var paused=false;

  function start(){
    stop();
    timer=setInterval(function(){
      if(paused)return;
      var box=document.getElementById('hoaV643PosterWrap');
      if(!box || !box.querySelector('.hoa643-poster-center'))return;
      if(typeof window.renderPoster==='function'){
        /* The renderer is a function declaration in the existing page scope. */
        try{
          if(typeof posterRows!=='undefined' && posterRows.length>1){
            posterIndex=(posterIndex+1)%posterRows.length;
            renderPoster();
          }
        }catch(e){}
      }
    },4500);
  }
  function stop(){
    if(timer){clearInterval(timer);timer=null;}
  }
  function bind(){
    var box=document.getElementById('hoaV643PosterWrap');
    if(!box)return;
    box.addEventListener('mouseenter',function(){paused=true});
    box.addEventListener('mouseleave',function(){paused=false});
    box.addEventListener('focusin',function(){paused=true});
    box.addEventListener('focusout',function(){paused=false});
    start();
  }
  window.setTimeout(bind,1800);
})();
