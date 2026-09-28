
(function(){
  "use strict";
  window.hoaNormalizeAdminRole = function(raw){
    var v=raw;
    if(Array.isArray(v)) v=v.length?v[0]:null;
    if(v && typeof v==="object"){
      v=v.role ?? v.admin_role ?? v.adminRole ?? v.user_role ?? v.get_admin_role ?? v.value;
      if(Array.isArray(v)) v=v[0];
    }
    v=String(v??"").trim().toLowerCase().replace(/[\s-]+/g,"_");
    if(v==="owner" || v==="super_admin" || v==="superadmin" ||
       v==="superadministrator" || v==="super_admin_owner") return "owner";
    if(v==="admin" || v==="administrator") return "admin";
    return "none";
  };
})();
