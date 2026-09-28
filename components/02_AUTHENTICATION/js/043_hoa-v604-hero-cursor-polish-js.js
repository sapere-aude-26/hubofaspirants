
(function(){
  'use strict';

  function initHOAHeroCursor(){
    var visual=document.querySelector('#hoaFrontPage .hoa-front-visual');
    if(!visual || visual.dataset.hoaCursorReady==='1') return;

    var cards=Array.prototype.slice.call(
      visual.querySelectorAll('.hoa-front-card-stack .hoa-front-feature')
    );
    if(!cards.length) return;

    visual.dataset.hoaCursorReady='1';

    var raf=0;
    var active=false;
    var px=0, py=0;

    function reset(){
      active=false;
      visual.style.setProperty('--hoa-cursor-x','0px');
      visual.style.setProperty('--hoa-cursor-y','0px');
      visual.style.setProperty('--hoa-cursor-glow','0');

      cards.forEach(function(card){
        card.style.setProperty('--hoa-card-gold','0');
        card.style.setProperty('--hoa-light-x','50%');
        card.style.setProperty('--hoa-light-y','50%');
        card.style.setProperty('--hoa-card-dx','0px');
        card.style.setProperty('--hoa-card-dy','0px');
        card.style.setProperty('--hoa-card-tilt','0deg');
        card.style.translate='0 0';
      });
    }

    function render(){
      raf=0;
      if(!active) return;

      var vr=visual.getBoundingClientRect();
      var cx=vr.left+vr.width/2;
      var cy=vr.top+vr.height/2;

      var relX=(px-cx)/(vr.width/2 || 1);
      var relY=(py-cy)/(vr.height/2 || 1);

      relX=Math.max(-1,Math.min(1,relX));
      relY=Math.max(-1,Math.min(1,relY));

      visual.style.setProperty('--hoa-cursor-x',(relX*42).toFixed(1)+'px');
      visual.style.setProperty('--hoa-cursor-y',(relY*30).toFixed(1)+'px');
      visual.style.setProperty('--hoa-cursor-glow','.78');

      cards.forEach(function(card,index){
        var r=card.getBoundingClientRect();
        var insideX=Math.max(0,Math.min(r.width,px-r.left));
        var insideY=Math.max(0,Math.min(r.height,py-r.top));
        var nx=(insideX/(r.width||1)-.5)*2;
        var ny=(insideY/(r.height||1)-.5)*2;

        var nearX=Math.max(r.left,Math.min(px,r.right));
        var nearY=Math.max(r.top,Math.min(py,r.bottom));
        var dx=px-nearX;
        var dy=py-nearY;
        var distance=Math.sqrt(dx*dx+dy*dy);

        /* Glow reaches a little outside the card. */
        var proximity=Math.max(0,1-distance/190);
        var gold=Math.pow(proximity,.72);

        var depth=1+(index*.12);
        var moveX=relX*5.5*depth;
        var moveY=relY*4.5*depth;
        var tilt=nx*1.15+relX*.35;

        card.style.setProperty('--hoa-card-gold',gold.toFixed(3));
        card.style.setProperty('--hoa-light-x',(50+nx*28).toFixed(1)+'%');
        card.style.setProperty('--hoa-light-y',(50+ny*28).toFixed(1)+'%');
        card.style.setProperty('--hoa-card-dx',moveX.toFixed(1)+'px');
        card.style.setProperty('--hoa-card-dy',moveY.toFixed(1)+'px');
        card.style.setProperty('--hoa-card-tilt',tilt.toFixed(2)+'deg');

        /* CSS translate composes with the existing scroll transform. */
        card.style.translate=
          'calc(var(--hoa-card-dx) * var(--hoa-depth)) '+
          'calc(var(--hoa-card-dy) * var(--hoa-depth))';
      });
    }

    function pointerMove(e){
      px=e.clientX;
      py=e.clientY;
      active=true;
      if(!raf) raf=requestAnimationFrame(render);
    }

    function pointerLeave(){
      active=false;
      if(raf){cancelAnimationFrame(raf);raf=0;}
      reset();
    }

    visual.addEventListener('pointermove',pointerMove,{passive:true});
    visual.addEventListener('pointerleave',pointerLeave,{passive:true});
    visual.addEventListener('pointercancel',pointerLeave,{passive:true});

    /* Recalculate cleanly if the page layout changes. */
    window.addEventListener('resize',reset,{passive:true});
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',initHOAHeroCursor,{once:true});
  }else{
    initHOAHeroCursor();
  }

  /* Front page sections can be rendered/re-rendered after login state changes. */
  var observer=new MutationObserver(function(){
    initHOAHeroCursor();
  });
  observer.observe(document.body,{childList:true,subtree:true});
})();
