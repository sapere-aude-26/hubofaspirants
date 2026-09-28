
(function(){
  function initEverythingAnimation(){
    const section=document.getElementById('hoaFrontFeatures');
    if(!section || section.dataset.v6083Animation==='ready') return;
    section.dataset.v6083Animation='ready';
    section.classList.add('hoa-v6083-features-animate');
    if(!('IntersectionObserver' in window)){
      section.classList.add('is-visible');
      return;
    }
    const observer=new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          section.classList.add('is-visible');
          observer.unobserve(section);
        }
      });
    },{threshold:.16,rootMargin:'0px 0px -60px 0px'});
    observer.observe(section);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',initEverythingAnimation);
  else initEverythingAnimation();
})();
