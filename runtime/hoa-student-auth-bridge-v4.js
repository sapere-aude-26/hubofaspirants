/* HOA Student Authentication Bridge V4
   Connects Free Student and Paid Student/Application callers to AUTH-V3.
   No authentication implementation is duplicated here.
*/
(function(window){
'use strict';

const adapters=window.HOA_COMPONENT_ADAPTERS=
  window.HOA_COMPONENT_ADAPTERS||{};

function getAuth(){
  return window.HOA_AUTH_V3 || adapters.auth || null;
}

function getNav(){
  return window.HOA_NAVIGATION_V2 ||
         window.HOA_NAVIGATION_V3 ||
         adapters.navigation || null;
}

const bridge={
 version:'STUDENT-AUTH-V4',
 mode:'delegating',

 login(mode){
   const auth=getAuth();
   if(auth && typeof auth.openLogin==='function'){
     return auth.openLogin(mode || 'student');
   }
   if(typeof window.hoaOpenLogin==='function'){
     return window.hoaOpenLogin(mode || 'student');
   }
   return undefined;
 },

 logout(){
   const auth=getAuth();
   if(auth && typeof auth.signOut==='function'){
     return auth.signOut();
   }
   return undefined;
 },

 session(){
   const auth=getAuth();
   if(auth && typeof auth.getSession==='function'){
     return auth.getSession();
   }
   return null;
 },

 isAuthenticated(){
   const auth=getAuth();
   return !!(auth &&
             typeof auth.isAuthenticated==='function' &&
             auth.isAuthenticated());
 },

 onChange(callback){
   const auth=getAuth();
   if(auth && typeof auth.onAuthStateChange==='function'){
     return auth.onAuthStateChange(callback);
   }
   return ()=>{};
 },

 openStudentLogin(){
   return this.login('student');
 },

 openPaidLogin(){
   return this.login('student');
 },

 navigation(){
   return getNav();
 }
};

adapters.studentAuth=bridge;
window.HOA_STUDENT_AUTH_V4=bridge;
})(window);
