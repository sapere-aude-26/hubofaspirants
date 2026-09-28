
(function(){
  function mount(){
    if(window.hoaAdminRole==="owner" && typeof window.hoaV643RenderOwnerAdminManager==="function"){
      window.hoaV643RenderOwnerAdminManager();
    }
  }
  function wrap(){
    if(typeof window.showAdminSection!=="function" || window.showAdminSection.__hoaV622Mounted) return;
    const original=window.showAdminSection;
    const wrapped=async function(section){
      const r=await original.apply(this,arguments);
      if(section==="admin") mount();
      return r;
    };
    wrapped.__hoaV622Mounted=true;
    wrapped.__hoaV622Original=original;
    window.showAdminSection=wrapped;
  }
  function boot(){wrap();mount();}
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot);
  else boot();
  setTimeout(boot,300);
  setTimeout(boot,1000);
})();
