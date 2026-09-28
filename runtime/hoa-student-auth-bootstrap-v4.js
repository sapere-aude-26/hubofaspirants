/* HOA Student Auth Integration Bootstrap V4
   Load after Core V2, Navigation V2, and Authentication V3.
*/
(function(window){
'use strict';
const adapters=window.HOA_COMPONENT_ADAPTERS=window.HOA_COMPONENT_ADAPTERS||{};
if(!window.HOA_STUDENT_AUTH_V4){
  window.HOA_STUDENT_AUTH_V4 = adapters.studentAuth || null;
}
adapters.studentAuth = window.HOA_STUDENT_AUTH_V4 || null;
})(window);
