/* HOA V6.1.1 — Shared data/service foundation. */
(function(global){
  'use strict';
  const BASE=global.HOA_DB_BASE||{};
  BASE.client=function(){return global.supabaseClient||global.supabase||null;};
  BASE.requireClient=function(){const c=BASE.client();if(!c||!c.from)throw new Error('Supabase is not ready.');return c;};
  BASE.requireAuth=async function(){const c=BASE.requireClient();const s=await c.auth.getSession();if(s.error)throw s.error;if(!s.data?.session?.user)throw new Error('Authenticated session required.');return s.data.session.user;};
  BASE.userId=async function(){return (await BASE.requireAuth()).id;};
  BASE.rpc=async function(name,args){const c=BASE.requireClient();const r=await c.rpc(name,args);if(r.error)throw r.error;return r.data;};
  BASE.invoke=async function(name,body){const c=BASE.requireClient();const r=await c.functions.invoke(name,{body});if(r.error)throw r.error;if(r.data?.error)throw new Error(r.data.error);return r.data;};
  BASE.storage=function(bucket){const c=BASE.requireClient();return c.storage.from(bucket);};
  global.HOA_DB_BASE=BASE;
  global.HOA_SERVICES=global.HOA_SERVICES||{};
})(window);
