/* HUB OF ASPIRANTS V6.0.9 — Application state foundation.
 * Non-invasive bridge; the current legacy state remains authoritative in this release.
 */
(function(global){
  'use strict';
  const HOA_STATE=global.HOA_STATE||{
    app:{version:'6.0.9',initialized:false},
    auth:{session:null,user:null,role:null},
    student:{profile:null},
    admin:{section:null},
    exam:{currentTest:null,currentAttempt:null},
    legacy:{sync(){
      try{
        if(typeof currentStudent!=='undefined')this.student.profile=currentStudent||null;
        if(typeof adminLoggedIn!=='undefined')this.auth.role=adminLoggedIn?'admin':(currentStudent?'student':null);
        if(typeof activeTestId!=='undefined')this.exam.currentTest=activeTestId||null;
        if(typeof currentAttemptId!=='undefined')this.exam.currentAttempt=currentAttemptId||null;
      }catch(_){}
      return this;
    }}
  };
  global.HOA_STATE=HOA_STATE;
})(window);
