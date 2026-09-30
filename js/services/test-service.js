/* HOA V6.1.1 — Mock-test and attempt data service. */
(function(global){
  'use strict';
  const B=global.HOA_DB_BASE;
  const S=global.HOA_SERVICES.test||{};
  S.startAttempt=async function(testId){return B.rpc('start_test_attempt_v1',{p_test_id:testId});};
  S.submitAttempt=async function(payload){return B.rpc('submit_test_v4',payload);};
  S.saveBundle=async function(payload){return B.rpc('save_test_bundle_v1',payload);};
  S.saveBundleV3=async function(payload){return B.rpc('save_test_bundle_v3',payload);};
  S.delete=async function(id){const c=B.requireClient();const r=await c.from('tests').delete().eq('id',id);if(r.error)throw r.error;return true;};
  S.update=async function(id,patch){const c=B.requireClient();const r=await c.from('tests').update(patch).eq('id',id);if(r.error)throw r.error;return true;};
  S.loadQuestions=async function(testId,admin){const c=B.requireClient();const table=admin?'questions':'student_questions';const select=admin?'id,test_id,question_text,option_1,option_2,option_3,option_4,correct_option,explanation,question_order':'id,test_id,question_text,option_1,option_2,option_3,option_4,question_order';const r=await c.from(table).select(select).eq('test_id',testId).order('question_order',{ascending:true});if(r.error)throw r.error;return r.data||[];};
  S.getAttemptReview=async function(attemptId){return B.rpc('get_attempt_review_v4',{p_attempt_id:attemptId});};
  S.getQuestionAnswers=async function(testId,attemptId,admin){const c=B.requireClient();const questions=await c.from(admin?'questions':'student_questions').select(admin?'id,question_text,option_1,option_2,option_3,option_4,correct_option,explanation,question_order':'id,question_text,option_1,option_2,option_3,option_4,question_order').eq('test_id',testId).order('question_order',{ascending:true});if(questions.error)throw questions.error;const answers=await c.from('answers').select('question_id,selected_option,is_correct,marks_awarded').eq('attempt_id',attemptId);if(answers.error)throw answers.error;return {questions:questions.data||[],answers:answers.data||[]};};
  global.HOA_SERVICES.test=S;
})(window);
