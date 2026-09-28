/* HOA Authentication Compatibility Adapter V4
   DEVELOPMENT ONLY.
   Delegates to existing production authentication contracts.
*/
(function(global){
  'use strict';

  const adapters = global.HOA_COMPONENT_ADAPTERS ||
                   (global.HOA_COMPONENT_ADAPTERS = {});

  function requireFn(name){
    if(typeof global[name] !== 'function'){
      throw new Error('HOA authentication contract missing: '+name);
    }
    return global[name];
  }

  const auth = {
    version:'V4',
    mode:'compatibility',

    openLogin(mode){
      return requireFn('hoaOpenLogin')(mode);
    },

    openPortal(type){
      return requireFn('hoaOpenPortal')(type);
    },

    getSession(){
      // Deliberately use the existing Supabase client/session contract.
      if(global.supabase && global.supabase.auth &&
         typeof global.supabase.auth.getSession === 'function'){
        return global.supabase.auth.getSession();
      }
      if(typeof global.getSession === 'function'){
        return global.getSession();
      }
      throw new Error('HOA authentication session contract unavailable');
    },

    onAuthStateChange(callback){
      if(global.supabase && global.supabase.auth &&
         typeof global.supabase.auth.onAuthStateChange === 'function'){
        return global.supabase.auth.onAuthStateChange(callback);
      }
      throw new Error('HOA Supabase auth state contract unavailable');
    },

    signOut(){
      if(global.supabase && global.supabase.auth &&
         typeof global.supabase.auth.signOut === 'function'){
        return global.supabase.auth.signOut();
      }
      if(typeof global.hoaSignOut === 'function'){
        return global.hoaSignOut();
      }
      throw new Error('HOA sign-out contract unavailable');
    }
  };

  adapters.auth = auth;
  global.HOA_AUTH_V4 = auth;
})(window);
