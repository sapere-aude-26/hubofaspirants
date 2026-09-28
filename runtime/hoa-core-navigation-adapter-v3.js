/* HOA Core + Navigation Compatibility Adapter V3
   DEVELOPMENT ONLY.
   This adapter deliberately delegates to existing production functions.
   It does not replace or duplicate production navigation logic.
*/
(function(global){
  'use strict';

  const existing = global.HOA_COMPONENT_ADAPTERS ||
                   (global.HOA_COMPONENT_ADAPTERS = {});

  const core = {
    version: 'V3',
    mode: 'compatibility',
    getElement(id) { return document.getElementById(id); },
    hasClass(selector) { return !!document.querySelector(selector); }
  };

  const navigation = {
    version: 'V3',
    mode: 'compatibility',

    openPortal(type) {
      if (typeof global.hoaOpenPortal === 'function') {
        return global.hoaOpenPortal(type);
      }
      throw new Error('HOA navigation contract missing: hoaOpenPortal');
    },

    openLogin(mode) {
      if (typeof global.hoaOpenLogin === 'function') {
        return global.hoaOpenLogin(mode);
      }
      throw new Error('HOA authentication/navigation contract missing: hoaOpenLogin');
    },

    showFrontPage() {
      if (typeof global.hoaShowFrontPage === 'function') {
        return global.hoaShowFrontPage();
      }
      throw new Error('HOA navigation contract missing: hoaShowFrontPage');
    }
  };

  existing.core = core;
  existing.navigation = navigation;
  global.HOA_CORE_V3 = core;
  global.HOA_NAVIGATION_V3 = navigation;
})(window);
