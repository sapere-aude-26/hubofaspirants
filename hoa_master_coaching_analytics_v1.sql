-- HOA Master Coaching Operations Analytics v1
-- Applied to Supabase project: HUB OF ASPIRANTS
-- Project ref: pnzhtiwwqiqnnkecogcc

alter table public.batch_lectures
  add column if not exists created_by uuid;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'batch_lectures_created_by_fkey'
  ) then
    alter table public.batch_lectures
      add constraint batch_lectures_created_by_fkey
      foreign key (created_by) references auth.users(id);
  end if;
end $$;

create index if not exists idx_batch_lectures_created_by
  on public.batch_lectures(created_by);

create table if not exists public.hoa_student_activity (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid,
  student_id uuid,
  activity_type text not null check (
    activity_type in ('video_view','note_open','test_open','test_attempt_start','test_attempt_submit','dashboard_view')
  ),
  resource_type text,
  resource_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint hoa_student_activity_auth_user_fkey foreign key (auth_user_id) references auth.users(id),
  constraint hoa_student_activity_student_fkey foreign key (student_id) references public.students(id)
);

create index if not exists idx_hoa_student_activity_student_time
  on public.hoa_student_activity(student_id, created_at desc);
create index if not exists idx_hoa_student_activity_resource_time
  on public.hoa_student_activity(resource_type, resource_id, created_at desc);
create index if not exists idx_hoa_student_activity_type_time
  on public.hoa_student_activity(activity_type, created_at desc);

create table if not exists public.hoa_site_visits (
  id uuid primary key default gen_random_uuid(),
  visitor_key text not null,
  session_id text,
  path text not null,
  referrer text,
  auth_user_id uuid,
  created_at timestamptz not null default now(),
  constraint hoa_site_visits_auth_user_fkey foreign key (auth_user_id) references auth.users(id)
);

create index if not exists idx_hoa_site_visits_visitor_time
  on public.hoa_site_visits(visitor_key, created_at desc);
create index if not exists idx_hoa_site_visits_time
  on public.hoa_site_visits(created_at desc);

create table if not exists public.hoa_site_feedback (
  id uuid primary key default gen_random_uuid(),
  visitor_key text,
  auth_user_id uuid,
  category text not null default 'suggestion',
  rating integer,
  message text not null check (char_length(message) between 3 and 3000),
  contact_email text,
  status text not null default 'new' check (status in ('new','reviewed','resolved','archived')),
  created_at timestamptz not null default now(),
  reviewed_by uuid,
  reviewed_at timestamptz,
  constraint hoa_site_feedback_auth_user_fkey foreign key (auth_user_id) references auth.users(id),
  constraint hoa_site_feedback_reviewer_fkey foreign key (reviewed_by) references auth.users(id),
  constraint hoa_site_feedback_rating_check check (rating is null or (rating between 1 and 5))
);

create index if not exists idx_hoa_site_feedback_time
  on public.hoa_site_feedback(created_at desc);

alter table public.hoa_student_activity enable row level security;
alter table public.hoa_site_visits enable row level security;
alter table public.hoa_site_feedback enable row level security;

revoke all on table public.hoa_student_activity from anon, authenticated;
revoke all on table public.hoa_site_visits from anon, authenticated;
revoke all on table public.hoa_site_feedback from anon, authenticated;

create or replace function public.hoa_track_student_activity(
  p_activity_type text,
  p_resource_type text default null,
  p_resource_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_auth uuid := auth.uid();
  v_student uuid;
  v_id uuid;
begin
  if v_auth is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_activity_type not in ('video_view','note_open','test_open','test_attempt_start','test_attempt_submit','dashboard_view') then
    raise exception 'INVALID_ACTIVITY_TYPE';
  end if;
  select s.id into v_student from public.students s where s.auth_user_id = v_auth limit 1;
  if v_student is null then raise exception 'STUDENT_PROFILE_NOT_FOUND'; end if;
  insert into public.hoa_student_activity(auth_user_id, student_id, activity_type, resource_type, resource_id, metadata)
  values (v_auth, v_student, p_activity_type, left(p_resource_type,80), p_resource_id, coalesce(p_metadata,'{}'::jsonb))
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.hoa_track_site_visit(
  p_visitor_key text,
  p_path text,
  p_referrer text default null,
  p_session_id text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_id uuid;
  v_auth uuid := auth.uid();
begin
  if p_visitor_key is null or char_length(p_visitor_key) < 8 then raise exception 'INVALID_VISITOR_KEY'; end if;
  if p_path is null or char_length(p_path) < 1 then raise exception 'INVALID_PATH'; end if;
  insert into public.hoa_site_visits(visitor_key, session_id, path, referrer, auth_user_id)
  values (left(p_visitor_key,128), left(p_session_id,128), left(p_path,512), left(p_referrer,1000), v_auth)
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.hoa_submit_site_feedback(
  p_visitor_key text,
  p_category text,
  p_rating integer,
  p_message text,
  p_contact_email text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_id uuid;
  v_auth uuid := auth.uid();
  v_message text := trim(coalesce(p_message,''));
begin
  if char_length(v_message) < 3 or char_length(v_message) > 3000 then raise exception 'INVALID_FEEDBACK_MESSAGE'; end if;
  if p_rating is not null and (p_rating < 1 or p_rating > 5) then raise exception 'INVALID_RATING'; end if;
  insert into public.hoa_site_feedback(visitor_key, auth_user_id, category, rating, message, contact_email)
  values (left(p_visitor_key,128), v_auth, left(coalesce(nullif(trim(p_category),''),'suggestion'),80), p_rating, v_message, left(nullif(trim(p_contact_email),''),320))
  returning id into v_id;
  return v_id;
end;
$$;

-- The master overview RPC returns the complete coaching operations snapshot.
-- See the project migration history / deployed function body for the full query.