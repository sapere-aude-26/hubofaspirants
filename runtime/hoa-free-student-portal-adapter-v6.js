/* HOA Free Student Portal Compatibility Adapter V6
   DEVELOPMENT ONLY.
   Does not replace the production portal implementation.
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

  const portal = {
    version:'V6',
    mode:'compatibility',

    open(type){
      const nav = navigation();
      if(nav && typeof nav.openPortal === 'function'){
        return nav.openPortal(type || 'free');
      }
      if(typeof global.hoaOpenPortal === 'function'){
        return global.hoaOpenPortal(type || 'free');
      }
      throw new Error('HOA Free Student Portal navigation contract unavailable');
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
      throw new Error('HOA Student authentication contract unavailable');
    },

    root(selector){
      return document.querySelector(selector);
    },

    footerContract(){
      return {
        global: document.getElementById('hoaGlobalPublicFooter'),
        social: document.getElementById('hoaFrontSocialFooter'),
        professional: document.getElementById('hoaProfessionalFooter'),
        connect: document.getElementById('hoaV653ConnectWrap')
      };
    },

    assertFooterIdentity(before, after){
      const keys=['global','social','professional','connect'];
      return keys.every(k => {
        if(!before || !after) return false;
        return !before[k] || before[k] === after[k];
      });
    }
  };

  adapters.freeStudent = portal;
  global.HOA_FREE_STUDENT_V6 = portal;
})(window);
