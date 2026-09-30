/* HOA V6.1.1 — Result and attempt-history data service. */
(function(global){
  'use strict';
  const B=global.HOA_DB_BASE;
  const S=global.HOA_SERVICES.result||{};
  S.studentHistory=async function(studentId){return B.rpc('get_student_result_history_v4_5');};
  S.adminAttempts=async function(){const c=B.requireClient();const r=await c.from('attempts').select('*').order('submitted_at',{ascending:false});if(r.error)throw r.error;return r.data||[];};
  S.adminStudents=async function(){return global.HOA_SERVICES.student.list();};
  S.adminTests=async function(){const c=B.requireClient();const r=await c.from('tests').select('id,title,description,access_type').order('created_at',{ascending:false});if(r.error)throw r.error;return r.data||[];};
  S.deleteAttempt=async function(id){return B.invoke('admin-delete-attempt-v2',{attempt_id:id});};
  S.getReview=async function(attemptId){return B.rpc('get_attempt_review_v4',{p_attempt_id:attemptId});};
  global.HOA_SERVICES.result=S;
})(window);
