
(function(){
  'use strict';
  function closeFreeGate(){
    var m=document.getElementById('hoaV648FreeContentModal');
    if(m){
      m.classList.add('hidden');
      m.classList.remove('hoa-v619-visible');
      m.classList.add('hoa-v639-closing');
      m.style.removeProperty('display');
      m.style.removeProperty('visibility');
      m.style.removeProperty('opacity');
      m.style.removeProperty('pointer-events');
      m.style.removeProperty('z-index');
      requestAnimationFrame(function(){m.classList.remove('hoa-v639-closing');});
    }
    document.documentElement.classList.remove('hoa-free-modal-open');
    document.body.classList.remove('hoa-free-modal-open');
    try{ delete document.body.dataset.hoaFreeScroll; }catch(e){}

    /* Also close the older legacy Free Content modal if it exists. */
    var legacy=document.getElementById('hoaV70FreeModal');
    if(legacy) legacy.classList.remove('show');
    var preview=document.getElementById('hoaV70PreviewModal');
    if(preview) preview.classList.remove('show');
  }

  /* Make this the final authority; earlier V6/V7/V70 scripts are allowed to
     exist for backward compatibility but cannot replace this close behavior. */
  window.hoaCloseFreeContent=closeFreeGate;
  window.hoaV619CloseFreeContent=closeFreeGate;

  function bind(){
    var m=document.getElementById('hoaV648FreeContentModal');
    if(!m)return;
    var close=m.querySelector('.hoa-v648-modal-close');
    if(close && close.dataset.hoaV639Bound!=='1'){
      close.dataset.hoaV639Bound='1';
      close.onclick=function(e){
        if(e){e.preventDefault();e.stopImmediatePropagation();}
        closeFreeGate();
        return false;
      };
    }
    var backdrop=m.querySelector('.hoa-v648-modal-backdrop');
    if(backdrop && backdrop.dataset.hoaV639Bound!=='1'){
      backdrop.dataset.hoaV639Bound='1';
      backdrop.onclick=function(e){
        if(e){e.preventDefault();e.stopImmediatePropagation();}
        closeFreeGate();
        return false;
      };
    }
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',bind,{once:true});
  else bind();
  window.addEventListener('load',bind,{once:true});
  document.addEventListener('click',function(e){
    var b=e.target && e.target.closest ? e.target.closest('#hoaV648FreeContentModal .hoa-v648-modal-close') : null;
    if(b) bind();
  },true);
})();
