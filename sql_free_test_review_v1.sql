create or replace function public.hoa_free_test_review(p_token uuid, p_attempt_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_profile_id uuid;
  v_status text;
  v_snapshot jsonb;
  v_answers jsonb;
  v_result jsonb;
begin
  select p.id into v_profile_id
  from public.free_content_profiles p
  where p.access_token=p_token
    and (p.access_expires_at is null or p.access_expires_at>now());
  if v_profile_id is null then raise exception 'INVALID_FREE_ACCESS'; end if;
  select a.status,a.question_snapshot,a.answers into v_status,v_snapshot,v_answers
  from public.free_test_attempts a
  where a.id=p_attempt_id and a.profile_id=v_profile_id;
  if v_status is null then raise exception 'ATTEMPT_NOT_FOUND'; end if;
  if v_status<>'completed' then raise exception 'ATTEMPT_NOT_COMPLETED'; end if;
  if v_snapshot is null or jsonb_typeof(v_snapshot)<>'array' then raise exception 'HISTORICAL_SNAPSHOT_MISSING'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'question_id',(q->>'id')::uuid,
    'question_order',coalesce((q->>'question_order')::integer,0),
    'question_text',coalesce(q->>'question_text',''),
    'option_1',coalesce(q->>'option_1',''),
    'option_2',coalesce(q->>'option_2',''),
    'option_3',coalesce(q->>'option_3',''),
    'option_4',coalesce(q->>'option_4',''),
    'correct_option',coalesce((q->>'correct_option')::integer,0),
    'explanation',coalesce(q->>'explanation',''),
    'selected_option',case
      when v_answers is null or jsonb_typeof(v_answers)<>'array' then null
      when coalesce(v_answers->((i-1)::integer),'null'::jsonb) in ('null'::jsonb,'""'::jsonb) then null
      else case when (v_answers->>((i-1)::integer)) ~ '^[1-4]$' then (v_answers->>((i-1)::integer))::integer else null end
    end
  ) order by coalesce((q->>'question_order')::integer,0)),'[]'::jsonb)
  into v_result
  from jsonb_array_elements(v_snapshot) with ordinality as e(q,i);
  return v_result;
end;
$$;
revoke execute on function public.hoa_free_test_review(uuid,uuid) from public;
grant execute on function public.hoa_free_test_review(uuid,uuid) to anon,authenticated;