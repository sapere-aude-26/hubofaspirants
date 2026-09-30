/* HOA V6.1.1 — Student data service. */
(function(global){
  'use strict';
  const B=global.HOA_DB_BASE;
  const S=global.HOA_SERVICES.student||{};
  S.list=async function(){const c=B.requireClient();const r=await c.from('students').select('id,full_name,email,phone,qualification,passout_year,college_name,status,created_at,auth_user_id,access_type').order('created_at',{ascending:false});if(r.error)throw r.error;return r.data||[];};
  S.getById=async function(id){const c=B.requireClient();const r=await c.from('students').select('id,full_name,email,phone,qualification,passout_year,college_name,status,created_at,auth_user_id,access_type').eq('id',id).maybeSingle();if(r.error)throw r.error;return r.data||null;};
  S.getByAuthUserId=async function(authUserId){const c=B.requireClient();const r=await c.from('students').select('id,full_name,email,phone,qualification,passout_year,college_name,status,created_at,auth_user_id,access_type').eq('auth_user_id',authUserId).maybeSingle();if(r.error)throw r.error;return r.data||null;};
  S.createPending=async function(row){const c=B.requireClient();const r=await c.from('students').insert(row);if(r.error)throw r.error;return row;};
  S.delete=async function(id){const c=B.requireClient();const r=await c.from('students').delete().eq('id',id);if(r.error)throw r.error;return true;};
  S.getBatchAccess=async function(studentId){const c=B.requireClient();const r=await c.from('student_batch_access').select('batch_id,starts_at,expires_at').eq('student_id',studentId);if(r.error)throw r.error;return r.data||[];};
  S.getNoteAccess=async function(studentId){const c=B.requireClient();const r=await c.from('student_note_access').select('note_id,starts_at,expires_at').eq('student_id',studentId);if(r.error)throw r.error;return r.data||[];};
  S.getTestAccess=async function(studentId){const c=B.requireClient();const r=await c.from('student_test_access').select('test_id').eq('student_id',studentId);if(r.error)throw r.error;return r.data||[];};
  S.getGranularTestAccess=async function(studentId){const c=B.requireClient();const r=await c.from('students').select('granular_test_access').eq('id',studentId).maybeSingle();if(r.error)throw r.error;return Boolean(r.data?.granular_test_access);};
  S.loginByMobile=async function(payload){return B.invoke('login-by-mobile',payload);};
  S.loginWithPassword=async function(email,password){const c=B.requireClient();const r=await c.auth.signInWithPassword({email,password});if(r.error)throw r.error;return r.data;};
  S.signOut=async function(){const c=B.requireClient();const r=await c.auth.signOut();if(r.error)throw r.error;return true;};
  S.getProfileForCurrentSession=async function(){const c=B.requireClient();const u=await B.requireAuth();return S.getByAuthUserId(u.id);};
  global.HOA_SERVICES.student=S;
})(window);
