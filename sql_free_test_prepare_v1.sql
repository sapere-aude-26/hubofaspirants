create or replace function public.hoa_free_test_prepare(p_token uuid, p_test_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_profile_id uuid;
  v_test public.tests;
  v_questions jsonb;
begin
  select id into v_profile_id
  from public.free_content_profiles
  where access_token=p_token
    and (access_expires_at is null or access_expires_at>now());
  if v_profile_id is null then raise exception 'INVALID_FREE_ACCESS'; end if;
  if not exists (
    select 1 from public.free_content_items i
    where i.test_id=p_test_id and i.content_type='test' and i.is_published=true
  ) then raise exception 'TEST_NOT_PUBLISHED_AS_FREE_CONTENT'; end if;
  select * into v_test from public.tests
  where id=p_test_id and is_published=true and access_type='free';
  if v_test.id is null then raise exception 'TEST_NOT_AVAILABLE'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',q.id,
    'question_text',q.question_text,
    'option_1',q.option_1,'option_2',q.option_2,'option_3',q.option_3,'option_4',q.option_4,
    'question_order',q.question_order
  ) order by q.question_order),'[]'::jsonb)
  into v_questions
  from public.questions q where q.test_id=p_test_id;
  if jsonb_array_length(v_questions)=0 then raise exception 'TEST_HAS_NO_QUESTIONS'; end if;
  return jsonb_build_object(
    'test',jsonb_build_object(
      'id',v_test.id,'title',v_test.title,'description',v_test.description,
      'duration_minutes',v_test.duration_minutes,'marks_per_question',v_test.marks_per_question,
      'negative_marking',v_test.negative_marking,'test_type',v_test.test_type
    ),
    'questions',v_questions
  );
end;
$$;
revoke execute on function public.hoa_free_test_prepare(uuid,uuid) from public;
grant execute on function public.hoa_free_test_prepare(uuid,uuid) to anon, authenticated;