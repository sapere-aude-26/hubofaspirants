-- HOA production hardening applied to the live Supabase project on 2026-10-02.
-- Safe student-question RPC/view path + reduced anonymous RPC exposure.

create or replace function public.hoa_student_questions()
returns table(
  id uuid,
  test_id uuid,
  question_text text,
  option_1 text,
  option_2 text,
  option_3 text,
  option_4 text,
  question_order integer
)
language sql
stable
security definer
set search_path to ''
as $$
  select
    q.id,
    q.test_id,
    q.question_text,
    q.option_1,
    q.option_2,
    q.option_3,
    q.option_4,
    q.question_order
  from public.questions q
  join public.tests t on t.id = q.test_id
  where t.is_published = true
    and (
      t.access_type = 'free'
      or exists (
        select 1
        from public.student_test_access a
        join public.students s on s.id = a.student_id
        where a.test_id = t.id
          and s.auth_user_id = auth.uid()
          and s.status = 'active'
          and (a.starts_at is null or a.starts_at <= now())
          and (a.expires_at is null or a.expires_at > now())
      )
      or exists (
        select 1
        from public.student_test_batch_access ba
        join public.students s on s.id = ba.student_id
        join public.test_batches tb on tb.id = ba.test_batch_id
        where ba.test_batch_id = t.test_batch_id
          and s.auth_user_id = auth.uid()
          and s.status = 'active'
          and tb.is_published = true
          and (ba.starts_at is null or ba.starts_at <= now())
          and (ba.expires_at is null or ba.expires_at > now())
      )
      or exists (
        select 1
        from public.app_admins a
        where a.auth_user_id = auth.uid()
      )
    );
$$;

revoke all on function public.hoa_student_questions() from public;
revoke all on function public.hoa_student_questions() from anon;
grant execute on function public.hoa_student_questions() to authenticated;

create or replace view public.student_questions
with (security_invoker = true)
as
select * from public.hoa_student_questions();

revoke all on public.student_questions from public;
revoke all on public.student_questions from anon;
grant select on public.student_questions to authenticated;

revoke all on function public.get_student_attempt_summary(uuid) from public;
revoke all on function public.get_student_attempt_summary(uuid) from anon;
grant execute on function public.get_student_attempt_summary(uuid) to authenticated;

revoke all on function public.hoa_admin_free_profiles() from public;
revoke all on function public.hoa_admin_free_profiles() from anon;
grant execute on function public.hoa_admin_free_profiles() to authenticated;

revoke all on function public.hoa_admin_master_overview() from public;
revoke all on function public.hoa_admin_master_overview() from anon;
grant execute on function public.hoa_admin_master_overview() to authenticated;

revoke all on function public.hoa_protect_test_history() from public;
revoke all on function public.hoa_protect_test_history() from anon;
grant execute on function public.hoa_protect_test_history() to authenticated;

revoke all on function public.hoa_snapshot_attempt() from public;
revoke all on function public.hoa_snapshot_attempt() from anon;
grant execute on function public.hoa_snapshot_attempt() to authenticated;

revoke all on function public.save_test_bundle_v2(uuid,text,text,integer,numeric,numeric,boolean,text,uuid,jsonb) from public;
revoke all on function public.save_test_bundle_v2(uuid,text,text,integer,numeric,numeric,boolean,text,uuid,jsonb) from anon;
grant execute on function public.save_test_bundle_v2(uuid,text,text,integer,numeric,numeric,boolean,text,uuid,jsonb) to authenticated;

revoke all on function public.save_test_bundle_v3(uuid,text,text,integer,numeric,numeric,boolean,text,uuid,uuid,text,jsonb) from public;
revoke all on function public.save_test_bundle_v3(uuid,text,text,integer,numeric,numeric,boolean,text,uuid,uuid,text,jsonb) from anon;
grant execute on function public.save_test_bundle_v3(uuid,text,text,integer,numeric,numeric,boolean,text,uuid,uuid,text,jsonb) to authenticated;