
(function(){
  "use strict";

  window.hoaScrollToStudentArea = function(){
    var target = document.getElementById("hoaV648StudentOptions");
    if(!target){
      /* Fallback to the section's title if the wrapper id changes later. */
      target = document.querySelector(".hoa-v648-student-options");
    }

    if(!target) return;

    target.scrollIntoView({
      behavior:"smooth",
      block:"start"
    });

    /* Give keyboard users a meaningful focus target without changing the UI. */
    setTimeout(function(){
      try{
        target.setAttribute("tabindex","-1");
        target.focus({preventScroll:true});
      }catch(e){}
    },450);
  };
})();
