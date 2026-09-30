/* HUB OF ASPIRANTS V6.0.9 — Common utility foundation. */
(function(global){
  'use strict';
  function escapeHTML(value){return String(value==null?'':value).replace(/[&<>"']/g,function(match){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[match];});}
  function safeJSONParse(value,fallback){try{return JSON.parse(value);}catch(_){return fallback;}}
  function isValidEmail(value){return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value||'').trim());}
  function clampNumber(value,min,max,fallback){const n=Number(value);if(!Number.isFinite(n))return fallback==null?min:fallback;return Math.min(max,Math.max(min,n));}
  global.HOA_UTILS=global.HOA_UTILS||{escapeHTML,safeJSONParse,isValidEmail,clampNumber};
  global.escapeHTML=escapeHTML;
})(window);
