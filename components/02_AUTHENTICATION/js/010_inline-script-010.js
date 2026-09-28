
/* V5.0.3 stability guard: UI safety only; Supabase authentication/RLS remain
   the actual security boundary. */
(function(){
  function enforceAdminUiGuard(){
    try{
      var adminLogged =
        (typeof window.adminLoggedIn !== "undefined" && window.adminLoggedIn === true) ||
        (typeof adminLoggedIn !== "undefined" && adminLoggedIn === true);

      if(!adminLogged){
        document.querySelectorAll(
          "#adminOnlyDashboard, #adminSectionResultPanel, #adminDashboard, #adminPanel"
        ).forEach(function(el){
          el.classList.add("hidden");
        });
        document.documentElement.classList.remove("admin-ui");
        if(document.body) document.body.classList.remove("admin-ui");
      }
    }catch(e){
      console.warn("V5.0.3 admin UI guard:", e);
    }
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", enforceAdminUiGuard);
  }else{
    enforceAdminUiGuard();
  }
})();
