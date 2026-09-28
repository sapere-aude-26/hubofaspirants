
(function(){
  "use strict";
  /* V6.0.3: single authoritative Admin navigation controller.
     Uses only public module APIs. Do not call private functions from other IIFEs. */
  const panels={
    student:"adminSectionStudentPanel", test:"adminSectionTestPanel",
    course:"adminSectionCoursePanel", video:"adminSectionVideoPanel",
    notes:"adminSectionNotesPanel", poster:"adminSectionPosterPanel", access:"adminSectionAccessPanel",
    result:"adminSectionResultPanel", admin:"adminSectionAdminPanel"
  };
  const nav={
    student:"adminNavStudent", test:"adminNavTest",
    course:"adminNavCourse", video:"adminNavVideo", notes:"adminNavNotes",
    poster:"adminNavPoster", access:"adminNavAccess", result:"adminNavResult", admin:"adminNavAdmin"
  };
  function show(el,on){
    if(!el)return;
    el.classList.toggle("active",on);
    if(on){
      el.classList.add("v13-active");
      el.style.setProperty("display","block","important");
      el.style.setProperty("visibility","visible","important");
      el.style.setProperty("opacity","1","important");
      el.style.setProperty("pointer-events","auto","important");
    }else{
      el.classList.remove("v13-active");
      el.style.setProperty("display","none","important");
      el.style.removeProperty("visibility");
      el.style.removeProperty("opacity");
      el.style.removeProperty("pointer-events");
    }
  }
  async function controller(section){
    if(!panels[section]) section="student";
    if(typeof adminLoggedIn!=="undefined" && adminLoggedIn!==true){
      alert("Please login as Admin first."); return;
    }
    if(section==="admin" && window.hoaAdminRole!=="owner"){
      alert("Admin Access is available only to the Super Admin / Owner.");
      section="student";
    }
    if(section==="poster" && window.hoaAdminRole!=="owner" &&
       !(window.hoaAdminPermissions||[]).some(function(p){return p==="posters.view"||p==="posters.manage";})){
      alert("You do not have permission to access Poster Management.");
      section="student";
    }
    Object.entries(panels).forEach(([k,id])=>show(document.getElementById(id),k===section));
    Object.entries(nav).forEach(([k,id])=>document.getElementById(id)?.classList.toggle("active",k===section));
    try{
      if(section==="student"){
        if(typeof window.loadStudentsFromSupabase==="function") await window.loadStudentsFromSupabase();
        if(typeof window.renderAdminStudents==="function") window.renderAdminStudents();
        return;
      }
      if(section==="test"){
        if(typeof window.loadTestsFromSupabase==="function") await window.loadTestsFromSupabase();
        if(typeof window.renderLibrary==="function") window.renderLibrary();
        return;
      }
      if(section==="course"){
        if(typeof window.hoaLoadCourses==="function") await window.hoaLoadCourses();
        return;
      }
      if(section==="video"){
        if(typeof window.hoaLoadVideos==="function") await window.hoaLoadVideos();
        return;
      }
      if(section==="notes"){
        if(typeof window.hoaLoadNotes==="function") await window.hoaLoadNotes();
        return;
      }
      if(section==="poster"){
        if(typeof window.hoaV59RefreshAdmin==="function") await window.hoaV59RefreshAdmin();
        return;
      }
      if(section==="access"){
        if(typeof window.hoaLoadAccess==="function") await window.hoaLoadAccess();
        return;
      }
      if(section==="result"){
        if(typeof window.loadAdminResultsFromSupabase==="function") await window.loadAdminResultsFromSupabase();
        if(typeof window.renderAdminResultSummary==="function") window.renderAdminResultSummary();
        if(typeof window.populateTestWiseSelector==="function") window.populateTestWiseSelector();
        if(typeof window.renderTestWiseResults==="function") window.renderTestWiseResults();
        return;
      }
      if(section==="admin"){
        if(window.hoaV643RenderOwnerAdminManager) await window.hoaV643RenderOwnerAdminManager();
        return;
      }
    }catch(e){
      console.error("HOA Admin section load failed:",section,e);
      const msg=e?.message||String(e);
      alert((section.charAt(0).toUpperCase()+section.slice(1))+" section could not be loaded: "+msg);
    }
  }
  window.showAdminSection=controller;
  window.__HOA_V603_ADMIN_CONTROLLER__=controller;
})();
