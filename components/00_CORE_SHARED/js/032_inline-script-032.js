
/* V6.0.123 — slow, refined scroll-linked hero animation */
(function(){
  function initHOAHeroScroll(){
    const hero = document.querySelector('#hoaFrontPage .hoa-front-hero');
    if(!hero || hero.dataset.scrollAnimationReady === '1') return;
    hero.dataset.scrollAnimationReady = '1';

    const reduceMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if(reduceMotion) return;

    let ticking = false;

    function update(){
      ticking = false;
      const rect = hero.getBoundingClientRect();
      const vh = Math.max(window.innerHeight || 1, 1);

      /* 0 while entering the viewport, 1 as it leaves the upper viewport. */
      const progress = Math.max(0, Math.min(1,
        (vh * 0.78 - rect.top) / Math.max(rect.height + vh * 0.35, 1)
      ));

      /* Small movement only — keeps the hero stable and polished. */
      const shift = (progress - 0.18) * 24;

      hero.style.setProperty('--hoa-scroll-progress', progress.toFixed(4));
      hero.style.setProperty('--hoa-scroll-shift', shift.toFixed(2) + 'px');

      const visible = rect.bottom > 0 && rect.top < vh;
      hero.classList.toggle('hoa-scroll-visible', visible);
    }

    function onScroll(){
      if(!ticking){
        ticking = true;
        requestAnimationFrame(update);
      }
    }

    if('IntersectionObserver' in window){
      const observer = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          if(entry.isIntersecting){
            hero.classList.add('hoa-scroll-ready');
          }
        });
      }, {threshold:0.08});
      observer.observe(hero);
    }else{
      hero.classList.add('hoa-scroll-ready');
    }

    window.addEventListener('scroll', onScroll, {passive:true});
    window.addEventListener('resize', onScroll, {passive:true});
    update();
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', initHOAHeroScroll);
  }else{
    initHOAHeroScroll();
  }
})();
