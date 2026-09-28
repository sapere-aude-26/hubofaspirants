
/* HUB OF ASPIRANTS V5.1
   Answer-key exposure safety layer.
   Database RLS/functions remain the authoritative security boundary. */
(function(){
  const ANSWER_KEY_FIELDS = [
    'correct_option','correct_answer','correctAnswer','answer',
    'answer_key','answerKey','explanation'
  ];

  function sanitizeQuestionObject(obj){
    if(!obj || typeof obj !== 'object') return obj;
    const clean = Array.isArray(obj) ? obj.slice() : Object.assign({}, obj);
    ANSWER_KEY_FIELDS.forEach(function(k){
      if(Object.prototype.hasOwnProperty.call(clean,k)){
        delete clean[k];
      }
    });
    return clean;
  }

  window.HOA_sanitizeQuestion = sanitizeQuestionObject;
  window.HOA_sanitizeQuestions = function(list){
    return Array.isArray(list) ? list.map(sanitizeQuestionObject) : list;
  };
})();
