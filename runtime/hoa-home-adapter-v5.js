/* HOA Public Home Compatibility Adapter V5
   DEVELOPMENT ONLY.
   Delegates cross-component actions to Core/Navigation/Auth contracts.
*/
(function(global){
  'use strict';

  const adapters = global.HOA_COMPONENT_ADAPTERS ||
                   (global.HOA_COMPONENT_ADAPTERS = {});

  function nav(){
    return global.HOA_NAVIGATION_V3 || adapters.navigation;
  }

  function auth(){
    return global.HOA_AUTH_V3 || adapters.auth;
  }

  const home = {
    version:'V5',
    mode:'compatibility',

    show() {
      if (nav() && typeof nav().showFrontPage === 'function') {
        return nav().showFrontPage();
      }
      if (typeof global.hoaShowFrontPage === 'function') {
        return global.hoaShowFrontPage();
      }
      throw new Error('HOA Home navigation contract unavailable');
    },

    openStudentPortal(type) {
      if (nav() && typeof nav().openPortal === 'function') {
        return nav().openPortal(type);
      }
      if (typeof global.hoaOpenPortal === 'function') {
        return global.hoaOpenPortal(type);
      }
      throw new Error('HOA Student Portal navigation contract unavailable');
    },

    openLogin(mode) {
      if (auth() && typeof auth().openLogin === 'function') {
        return auth().openLogin(mode);
      }
      if (typeof global.hoaOpenLogin === 'function') {
        return global.hoaOpenLogin(mode);
      }
      throw new Error('HOA authentication contract unavailable');
    },

    element(id) {
      return document.getElementById(id);
    }
  };

  adapters.home = home;
  global.HOA_HOME_V5 = home;
})(window);
