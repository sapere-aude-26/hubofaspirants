/* HOA Authentication Runtime V3
   Compatibility bridge only.
   Existing production authentication remains authoritative.
*/
(function(window){
'use strict';

const adapters=window.HOA_COMPONENT_ADAPTERS=
  window.HOA_COMPONENT_ADAPTERS||{};
const core=window.HOA_CORE_V2||adapters.core;
const nav=window.HOA_NAVIGATION_V2||adapters.navigation;

function delegate(names,args){
  for(const name of names){
    const fn=window[name];
    if(typeof fn==='function') return fn.apply(window,args);
  }
  return undefined;
}

const auth={
 version:'AUTH-V3',
 mode:'delegating',

 openLogin(mode){
   const result=delegate(['hoaOpenLogin','openLogin'],[mode]);
   if(core) core.setActiveView('login');
   return result;
 },

 signOut(){
   const result=delegate(
     ['hoaSignOut','hoaLogout','signOut','logout'],
     []
   );
   return result;
 },

 getSession(){
   // Read-only bridge. It never creates a second auth client.
   try{
     if(window.HOA_AUTH_SESSION &&
        typeof window.HOA_AUTH_SESSION.getSession==='function'){
       return window.HOA_AUTH_SESSION.getSession();
     }
   }catch(_){}
   return null;
 },

 onAuthStateChange(callback){
   if(typeof callback!=='function') return ()=>{};

   // If the production implementation already exposes a listener bridge,
   // use it. Otherwise return a no-op unsubscribe rather than creating
   // another Supabase listener.
   if(typeof window.hoaOnAuthStateChange==='function'){
     const result=window.hoaOnAuthStateChange(callback);
     return typeof result==='function'?result:()=>{};
   }

   return ()=>{};
 },

 isAuthenticated(){
   const selectors=[
     '.hoa-app-authenticated',
     '.hoa-student-auth',
     '.hoa-admin-auth'
   ];
   return selectors.some(sel=>{
     const node=document.querySelector(sel);
     if(!node) return false;
     const style=getComputedStyle(node);
     return style.display!=='none' &&
            style.visibility!=='hidden' &&
            !node.hasAttribute('hidden');
   });
 },

 navigation(){
   return nav||null;
 }
};

adapters.auth=auth;
window.HOA_AUTH_V3=auth;
})(window);
