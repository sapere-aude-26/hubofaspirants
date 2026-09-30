/* HOA V6.1.1 — Public/free-content service. */
(function(global){
  'use strict';
  const B=global.HOA_DB_BASE;
  const S=global.HOA_SERVICES.content||{};
  S.activePosters=async function(){return B.rpc('hoa_public_active_posters');};
  S.freeList=async function(token){return B.rpc('hoa_free_content_list',{p_token:token});};
  S.freeActivity=async function(token,contentId,type){return B.rpc('hoa_free_content_activity',{p_token:token,p_content_id:contentId,p_activity_type:type});};
  S.freeProfileEnter=async function(payload){return B.rpc('hoa_free_profile_enter',payload);};
  S.freeAdminList=async function(){return B.rpc('hoa_admin_free_content_list');};
  S.freeAdminDelete=async function(id){return B.rpc('hoa_admin_free_content_delete',{p_id:id});};
  S.freeAdminSave=async function(payload){return B.rpc('hoa_admin_free_content_upsert',payload);};
  global.HOA_SERVICES.content=S;
})(window);
