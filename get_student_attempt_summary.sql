create or replace function public.get_student_attempt_summary(p_attempt_id uuid)
returns table(
  id uuid,
  student_id uuid,
  test_id uuid,
  test_title text,
  started_at timestamptz,
  submitted_at timestamptz,
  status text,
  total_questions integer,
  correct_answers integer,
  wrong_answers integer,
  unanswered integer,
  score numeric,
  marks_per_question numeric,
  negative_marking numeric,
  duration_minutes integer
)
language plpgsql security definer set search_path to '' as $$
declare v_uid uuid:=auth.uid(); v_student_id uuid;
begin
  if v_uid is null then raise exception 'Unauthorized'; end if;
  select s.id into v_student_id from public.students s where s.auth_user_id=v_uid and s.status='active';
  if v_student_id is null then raise exception 'Student profile not found'; end if;
  return query
  select a.id,a.student_id,a.test_id,t.title,a.started_at,a.submitted_at,a.status,
         a.total_questions,a.correct_answers,a.wrong_answers,a.unanswered,a.score,
         t.marks_per_question,t.negative_marking,t.duration_minutes
  from public.attempts a join public.tests t on t.id=a.test_id
  where a.id=p_attempt_id and a.student_id=v_student_id and a.status='completed';
end; $$;
revoke execute on function public.get_student_attempt_summary(uuid) from anon;
grant execute on function public.get_student_attempt_summary(uuid) to authenticated;