/* HUB OF ASPIRANTS V6.0.9 — DOM foundation. */
(function(global){
  'use strict';
  const HOA_DOM = {
    get(id){return document.getElementById(id);},
    one(selector,root){return (root||document).querySelector(selector);},
    all(selector,root){return Array.from((root||document).querySelectorAll(selector));},
    show(target){const el=typeof target==='string'?document.getElementById(target):target;if(el)el.classList.remove('hidden');return el;},
    hide(target){const el=typeof target==='string'?document.getElementById(target):target;if(el)el.classList.add('hidden');return el;},
    toggle(target,visible){return visible?this.show(target):this.hide(target);},
    text(target,value){const el=typeof target==='string'?document.getElementById(target):target;if(el)el.textContent=value==null?'':String(value);return el;},
    html(target,value){const el=typeof target==='string'?document.getElementById(target):target;if(el)el.innerHTML=value==null?'':String(value);return el;}
  };
  global.HOA_DOM=global.HOA_DOM||HOA_DOM;

  // Moved unchanged from the monolith; retained as a global compatibility hook.
  function returnToStudentDashboardSafe(){
    try{
      if(typeof global.adminPreviewMode!=='undefined')global.adminPreviewMode=false;
      document.documentElement.classList.remove('admin-ui');
      if(document.body)document.body.classList.remove('admin-ui');
      ['adminDashboard','adminOnlyDashboard','adminSection','adminPanel'].forEach(function(id){const el=document.getElementById(id);if(el)el.classList.add('hidden');});
      if(typeof global.returnToStudentDashboard==='function')return global.returnToStudentDashboard();
      if(typeof global.showStudentDashboard==='function')return global.showStudentDashboard();
      if(typeof global.openStudentDashboard==='function')return global.openStudentDashboard();
      ['studentDashboard','studentHome','studentSection','home'].forEach(function(id){const el=document.getElementById(id);if(el)el.classList.remove('hidden');});
    }catch(error){console.warn('Student navigation error:',error);}
  }
  global.returnToStudentDashboardSafe=returnToStudentDashboardSafe;
})(window);
