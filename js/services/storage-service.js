/* HOA V6.1.1 — Storage service. */
(function(global){
  'use strict';
  const B=global.HOA_DB_BASE;
  const S=global.HOA_SERVICES.storage||{};
  S.publicUrl=function(bucket,path){const s=B.storage(bucket);const r=s.getPublicUrl(path);return r?.data?.publicUrl||'';};
  S.signedUrl=async function(bucket,path,seconds=600){const r=await B.storage(bucket).createSignedUrl(path,seconds);if(r.error)throw r.error;return r.data?.signedUrl||'';};
  S.upload=async function(bucket,path,file,options){const r=await B.storage(bucket).upload(path,file,options);if(r.error)throw r.error;return r.data;};
  S.remove=async function(bucket,paths){const r=await B.storage(bucket).remove(paths);if(r.error)throw r.error;return r.data;};
  global.HOA_SERVICES.storage=S;
})(window);
