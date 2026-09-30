/* HUB OF ASPIRANTS V6.0.9 — Authentication compatibility facade. */
(function(global){
  'use strict';
  const HOA_AUTH=global.HOA_AUTH||{};
  HOA_AUTH.getSession=async function(){
    if(!global.supabaseClient?.auth)return null;
    const r=await global.supabaseClient.auth.getSession();
    if(r.error)throw r.error;return r.data?.session||null;
  };
  HOA_AUTH.loginStudent=function(){if(typeof global.loginStudent!=='function')return Promise.reject(new Error('Student login module is not ready.'));return global.loginStudent.apply(global,arguments);};
  HOA_AUTH.loginAdmin=function(){if(typeof global.loginAdmin!=='function')return Promise.reject(new Error('Admin login module is not ready.'));return global.loginAdmin.apply(global,arguments);};
  HOA_AUTH.logoutStudent=function(){return typeof global.logoutStudent==='function'?global.logoutStudent.apply(global,arguments):Promise.resolve();};
  HOA_AUTH.logoutAdmin=function(){return typeof global.logoutAdmin==='function'?global.logoutAdmin.apply(global,arguments):Promise.resolve();};
  global.HOA_AUTH=HOA_AUTH;
})(window);
