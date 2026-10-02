-- HOA Master analytics RPC privacy fix
-- The complete master overview must never be callable by anonymous users.
revoke execute on function public.hoa_admin_master_overview() from anon;
revoke execute on function public.hoa_track_student_activity(text,text,uuid,jsonb) from anon;