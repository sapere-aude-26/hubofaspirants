/* HOA Paid Student / Application Compatibility Adapter V7
   DEVELOPMENT ONLY.
   Delegates to existing production contracts.
*/
(function(global){
  /* V4 student-auth integration: delegates to AUTH-V3. */
  const studentAuth = global.HOA_STUDENT_AUTH_V4 || null;
  'use strict';

  const adapters = global.HOA_COMPONENT_ADAPTERS ||
                   (global.HOA_COMPONENT_ADAPTERS = {});

  function authentication(){ return studentAuth || global.HOA_AUTH_V3 || null; }

  function navigation(){
    return global.HOA_NAVIGATION_V3 || adapters.navigation;
  }

  function auth(){
    return global.HOA_AUTH_V3 || adapters.auth;
  }

  const application = {
    version:'V7',
    mode:'compatibility',

    open(type){
      const nav = navigation();
      if(nav && typeof nav.openPortal === 'function'){
        return nav.openPortal(type || 'paid');
      }
      if(typeof global.hoaOpenPortal === 'function'){
        return global.hoaOpenPortal(type || 'paid');
      }
      throw new Error('HOA Paid Application navigation contract unavailable');
    },

    openLogin(mode){
      const auth = authentication();
      if(auth && typeof auth.openLogin === 'function') return auth.openLogin(mode || 'student');
      const a = auth();
      if(a && typeof a.openLogin === 'function'){
        return a.openLogin(mode || 'student');
      }
      if(typeof global.hoaOpenLogin === 'function'){
        return global.hoaOpenLogin(mode || 'student');
      }
      throw new Error('HOA Paid Application authentication contract unavailable');
    },

    element(id){
      return document.getElementById(id);
    },

    root(selector){
      return document.querySelector(selector);
    }
  };

  adapters.paidStudent = application;
  global.HOA_PAID_STUDENT_V7 = application;
})(window);
