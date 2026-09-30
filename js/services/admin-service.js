/* HOA V6.1.1 — Admin/auth management service. */
(function(global){
  'use strict';
  const B=global.HOA_DB_BASE;
  const S=global.HOA_SERVICES.admin||{};
  S.isAdmin=async function(){return B.rpc('is_app_admin');};
  S.signIn=async function(email,password){const c=B.requireClient();const r=await c.auth.signInWithPassword({email,password});if(r.error)throw r.error;return r.data;};
  S.verifyAndSignIn=async function(email,password){const data=await S.signIn(email,password);const ok=await S.isAdmin();if(ok!==true){try{await B.requireClient().auth.signOut()}catch(_){}throw new Error('This account is not registered as an Admin.');}return data;};
  S.signOut=async function(){const c=B.requireClient();const r=await c.auth.signOut();if(r.error)throw r.error;return true;};
  S.updatePassword=async function(currentPassword,newPassword){const c=B.requireClient();const user=await B.requireAuth();const sign=await c.auth.signInWithPassword({email:user.email,password:currentPassword});if(sign.error)throw sign.error;const r=await c.auth.updateUser({password:newPassword});if(r.error)throw r.error;return true;};
  S.manageCandidate=async function(body){return B.invoke('admin-manage-candidate',body);};
  S.getSession=async function(){const c=B.requireClient();const r=await c.auth.getSession();if(r.error)throw r.error;return r.data?.session||null;};
  global.HOA_SERVICES.admin=S;
})(window);
