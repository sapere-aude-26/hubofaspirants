
(function(){
  'use strict';

  var originalParent=null;
  var originalNextSibling=null;

  function getModal(){
    return document.getElementById('hoaV648FreeContentModal');
  }

  function moveModalToBody(){
    var m=getModal();
    if(!m || m.parentElement===document.body) return;
    originalParent=m.parentElement;
    originalNextSibling=m.nextSibling;
    document.body.appendChild(m);
  }

  function restoreModal(){
    var m=getModal();
    if(!m || !originalParent) return;
    if(originalNextSibling && originalNextSibling.parentNode===originalParent){
      originalParent.insertBefore(m,originalNextSibling);
    }else{
      originalParent.appendChild(m);
    }
  }

  window.hoaOpenFreeContent=function(){
    var m=getModal();
    if(!m) return;
    moveModalToBody();
    m.classList.remove('hidden');
    document.documentElement.classList.add('hoa-free-modal-open');
    document.body.classList.add('hoa-free-modal-open');
    document.body.dataset.hoaFreeScroll=String(window.scrollY||window.pageYOffset||0);

    requestAnimationFrame(function(){
      var close=m.querySelector('.hoa-v648-modal-close');
      if(close) close.focus({preventScroll:true});
    });
  };

  window.hoaCloseFreeContent=function(){
    var m=getModal();
    if(!m) return;
    m.classList.add('hidden');
    document.documentElement.classList.remove('hoa-free-modal-open');
    document.body.classList.remove('hoa-free-modal-open');

    var y=parseInt(document.body.dataset.hoaFreeScroll||'0',10);
    delete document.body.dataset.hoaFreeScroll;

    /* Restore original DOM position after hiding, without moving the page. */
    restoreModal();
    requestAnimationFrame(function(){
      window.scrollTo(0,y);
    });
  };

  document.addEventListener('keydown',function(e){
    if(e.key==='Escape'){
      var m=getModal();
      if(m && !m.classList.contains('hidden')){
        window.hoaCloseFreeContent();
      }
    }
  });
})();
