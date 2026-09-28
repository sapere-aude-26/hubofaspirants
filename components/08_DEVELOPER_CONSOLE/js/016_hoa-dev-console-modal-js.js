
(function(){
  function initHoaDeveloperConsoleLauncher(){
    var openBtn=document.getElementById("openHoaDevConsole");
    var modal=document.getElementById("hoaDevConsoleModal");
    var closeBtn=document.getElementById("closeHoaDevConsole");
    if(!openBtn||!modal||!closeBtn)return;

    function openConsole(){
      modal.classList.add("open");
      modal.setAttribute("aria-hidden","false");
      document.body.style.overflow="hidden";
    }
    function closeConsole(){
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden","true");
      document.body.style.overflow="";
      // Stay on the current index.html page; this only hides the iframe overlay.
    }

    openBtn.addEventListener("click",openConsole);
    closeBtn.addEventListener("click",closeConsole);
    modal.addEventListener("click",function(e){
      if(e.target===modal)closeConsole();
    });
    document.addEventListener("keydown",function(e){
      if(e.key==="Escape" && modal.classList.contains("open"))closeConsole();
    });
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",initHoaDeveloperConsoleLauncher);
  }else{
    initHoaDeveloperConsoleLauncher();
  }
})();
