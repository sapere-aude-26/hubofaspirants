/* HUB OF ASPIRANTS V6.0.9 — Application foundation bootstrap. */
(function(global){
  'use strict';
  const HOA_APP=global.HOA_APP||{version:'6.0.9',foundationReady:false,initFoundation(){if(this.foundationReady)return this;this.foundationReady=true;global.HOA_STATE?.legacy?.sync?.();return this;}};
  global.HOA_APP=HOA_APP;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>HOA_APP.initFoundation(),{once:true});
  else HOA_APP.initFoundation();
})(window);
