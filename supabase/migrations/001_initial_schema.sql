-- CoverGrail initial schema (direction spec)
-- Apply via Supabase SQL editor or Supabase CLI.

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- -----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  plan text not null default 'free',
  free_scans_remaining integer not null default 3,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

-- -----------------------------------------------------------------------------
-- Comic scans
-- -----------------------------------------------------------------------------
create table public.comic_scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  issue_number text,
  publisher text,
  publication_year integer,
  estimated_raw_value numeric,
  notes text,
  status text not null default 'pending'
    check (status in ('pending', 'grading', 'complete', 'failed')),
  error_message text,
  user_saved_at timestamptz,
  created_at timestamptz not null default now()
);

create index comic_scans_user_id_idx on public.comic_scans (user_id);
create index comic_scans_created_at_idx on public.comic_scans (created_at desc);

alter table public.comic_scans enable row level security;

create policy "comic_scans_select_own"
  on public.comic_scans for select
  using (auth.uid() = user_id);

create policy "comic_scans_insert_own"
  on public.comic_scans for insert
  with check (auth.uid() = user_id);

create policy "comic_scans_update_own"
  on public.comic_scans for update
  using (auth.uid() = user_id);

create policy "comic_scans_delete_own"
  on public.comic_scans for delete
  using (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- Scan images (private bucket paths)
-- -----------------------------------------------------------------------------
create table public.scan_images (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.comic_scans (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  image_type text not null
    check (image_type in ('front_cover', 'back_cover', 'spine', 'corner')),
  storage_path text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index scan_images_scan_id_idx on public.scan_images (scan_id);

alter table public.scan_images enable row level security;

create policy "scan_images_select_own"
  on public.scan_images for select
  using (auth.uid() = user_id);

create policy "scan_images_insert_own"
  on public.scan_images for insert
  with check (auth.uid() = user_id);

create policy "scan_images_delete_own"
  on public.scan_images for delete
  using (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- Scan results (one row per scan)
-- -----------------------------------------------------------------------------
create table public.scan_results (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null unique references public.comic_scans (id) on delete cascade,
  predicted_grade_low numeric(4, 1) not null,
  predicted_grade_high numeric(4, 1) not null,
  confidence text not null check (confidence in ('low', 'medium', 'high')),
  recommendation text not null
    check (recommendation in ('submit', 'press_first', 'maybe', 'sell_raw', 'rescan_photos')),
  photo_quality_score integer not null
    check (photo_quality_score >= 1 and photo_quality_score <= 10),
  detected_defects jsonb not null default '[]'::jsonb,
  reasoning_summary text not null,
  estimated_grading_cost numeric(10, 2),
  estimated_upside numeric(12, 2),
  next_steps text[] not null default '{}',
  raw_ai_response jsonb,
  created_at timestamptz not null default now(),
  constraint grade_range_ok check (predicted_grade_low <= predicted_grade_high)
);

alter table public.scan_results enable row level security;

create policy "scan_results_select_own"
  on public.scan_results for select
  using (
    exists (
      select 1 from public.comic_scans s
      where s.id = scan_id and s.user_id = auth.uid()
    )
  );

create policy "scan_results_insert_own"
  on public.scan_results for insert
  with check (
    exists (
      select 1 from public.comic_scans s
      where s.id = scan_id and s.user_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- Confirmed grades (user-recorded slab outcomes)
-- -----------------------------------------------------------------------------
create table public.confirmed_grades (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.comic_scans (id) on delete cascade,
  grading_company text not null,
  confirmed_grade numeric(4, 1) not null,
  certification_number text,
  submitted_at date,
  returned_at date,
  notes text,
  created_at timestamptz not null default now(),
  unique (scan_id)
);

alter table public.confirmed_grades enable row level security;

create policy "confirmed_grades_select_own"
  on public.confirmed_grades for select
  using (
    exists (
      select 1 from public.comic_scans s
      where s.id = scan_id and s.user_id = auth.uid()
    )
  );

create policy "confirmed_grades_insert_own"
  on public.confirmed_grades for insert
  with check (
    exists (
      select 1 from public.comic_scans s
      where s.id = scan_id and s.user_id = auth.uid()
    )
  );

create policy "confirmed_grades_update_own"
  on public.confirmed_grades for update
  using (
    exists (
      select 1 from public.comic_scans s
      where s.id = scan_id and s.user_id = auth.uid()
    )
  );

create policy "confirmed_grades_delete_own"
  on public.confirmed_grades for delete
  using (
    exists (
      select 1 from public.comic_scans s
      where s.id = scan_id and s.user_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- Auth → profile bootstrap
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(coalesce(new.email, ''), '@', 1)
    )
  )
  on conflict (id) do update
    set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Storage bucket (private comic photos)
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('scan-images', 'scan-images', false)
on conflict (id) do nothing;

drop policy if exists "scan_images_storage_insert" on storage.objects;
drop policy if exists "scan_images_storage_select" on storage.objects;
drop policy if exists "scan_images_storage_update" on storage.objects;
drop policy if exists "scan_images_storage_delete" on storage.objects;

create policy "scan_images_storage_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'scan-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "scan_images_storage_select"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'scan-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "scan_images_storage_update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'scan-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "scan_images_storage_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'scan-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
