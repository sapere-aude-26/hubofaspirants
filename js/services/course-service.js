/* HOA V6.1.1 — Course/video/note data service. */
(function(global){
  'use strict';
  const B=global.HOA_DB_BASE;
  const S=global.HOA_SERVICES.course||{};
  S.listBatches=async function(select='*'){const c=B.requireClient();const r=await c.from('batches').select(select).order('sort_order',{ascending:true}).order('created_at',{ascending:false});if(r.error)throw r.error;return r.data||[];};
  S.getBatch=async function(id){const c=B.requireClient();const r=await c.from('batches').select('id,name,batch_code,description,status,is_published,sort_order,created_at').eq('id',id).maybeSingle();if(r.error)throw r.error;return r.data||null;};
  S.createBatch=async function(row){const c=B.requireClient();const r=await c.from('batches').insert(row).select().single();if(r.error)throw r.error;return r.data;};
  S.updateBatch=async function(id,row){const c=B.requireClient();const r=await c.from('batches').update(row).eq('id',id);if(r.error)throw r.error;return true;};
  S.deleteBatch=async function(id){const c=B.requireClient();const r=await c.from('batches').delete().eq('id',id);if(r.error)throw r.error;return true;};
  S.listFolders=async function(batchId,type){const c=B.requireClient();let q=c.from('content_folders').select('id,name,folder_type,parent_id,sort_order,is_active').eq('batch_id',batchId).eq('is_active',true);if(type)q=q.eq('folder_type',type);const r=await q.order('folder_type').order('sort_order').order('name');if(r.error)throw r.error;return r.data||[];};
  S.createFolder=async function(row){const c=B.requireClient();const r=await c.from('content_folders').insert(row).select().single();if(r.error)throw r.error;return r.data;};
  S.archiveFolder=async function(id){const c=B.requireClient();const r=await c.from('content_folders').update({is_active:false,updated_at:new Date().toISOString()}).eq('id',id);if(r.error)throw r.error;return true;};
  S.listLectures=async function(batchId,folderId,published){const c=B.requireClient();let q=c.from('batch_lectures').select('id,lecture_no,title,description,youtube_video_id,scheduled_at,duration_seconds,sort_order,batch_id,folder_id,is_published').eq('batch_id',batchId);if(folderId)q=q.eq('folder_id',folderId);if(published)q=q.eq('is_published',true);const r=await q.order('sort_order',{ascending:true}).order('lecture_no',{ascending:true});if(r.error)throw r.error;return r.data||[];};
  S.createLecture=async function(row){const c=B.requireClient();const r=await c.from('batch_lectures').insert(row).select().single();if(r.error)throw r.error;return r.data;};
  S.updateLecture=async function(id,row){const c=B.requireClient();const r=await c.from('batch_lectures').update(row).eq('id',id);if(r.error)throw r.error;return true;};
  S.deleteLecture=async function(id){const c=B.requireClient();const r=await c.from('batch_lectures').delete().eq('id',id);if(r.error)throw r.error;return true;};
  S.listNotes=async function(batchId,folderId,published){const c=B.requireClient();let q=c.from('exam_notes').select('id,title,subject,exam,description,storage_path,file_name,mime_type,sort_order,created_at,batch_id,folder_id,is_published').eq('batch_id',batchId);if(folderId)q=q.eq('folder_id',folderId);if(published)q=q.eq('is_published',true);const r=await q.order('sort_order',{ascending:true}).order('created_at',{ascending:false});if(r.error)throw r.error;return r.data||[];};
  S.createNote=async function(row){const c=B.requireClient();const r=await c.from('exam_notes').insert(row).select().single();if(r.error)throw r.error;return r.data;};
  S.updateNote=async function(id,row){const c=B.requireClient();const r=await c.from('exam_notes').update(row).eq('id',id);if(r.error)throw r.error;return true;};
  S.deleteNote=async function(id){const c=B.requireClient();const r=await c.from('exam_notes').delete().eq('id',id);if(r.error)throw r.error;return true;};
  S.assignLecture=async function(row){const c=B.requireClient();const r=await c.from('batch_lecture_assignments').upsert(row,{onConflict:'lecture_id,batch_id'});if(r.error)throw r.error;return true;};
  S.assignNote=async function(row){const c=B.requireClient();const r=await c.from('exam_note_assignments').upsert(row,{onConflict:'note_id,batch_id'});if(r.error)throw r.error;return true;};
  global.HOA_SERVICES.course=S;
})(window);
