-- HOA YouTube upload automation v1
-- Server-only state. RLS denies browser roles; only the Edge Function service role can read/write these tables.
create table if not exists public.youtube_connections (
  id integer primary key default 1 check (id = 1),
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  channel_id text not null,
  channel_title text,
  encrypted_refresh_token text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.youtube_uploads (
  token uuid primary key,
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  batch_id uuid not null references public.batches(id) on delete cascade,
  folder_id uuid not null references public.content_folders(id) on delete cascade,
  lecture_no integer not null default 1,
  title text not null,
  description text,
  sort_order integer not null default 0,
  duration_seconds integer,
  scheduled_at timestamptz,
  upload_url text not null,
  file_size bigint not null,
  mime_type text not null,
  status text not null default 'uploading' check (status in ('uploading','completed','failed')),
  youtube_video_id text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.youtube_connections enable row level security;
alter table public.youtube_uploads enable row level security;
revoke all on public.youtube_connections from anon, authenticated;
revoke all on public.youtube_uploads from anon, authenticated;

create index if not exists youtube_uploads_user_status_idx on public.youtube_uploads(auth_user_id, status, created_at desc);