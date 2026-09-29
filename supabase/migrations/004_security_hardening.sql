-- CoverGrail security hardening and idempotent quota consumption.
-- Safe to apply after 001_initial_schema.sql, 002_stripe_billing.sql, and
-- 003_stripe_profile_indexes.sql.

begin;

alter table public.comic_scans
  add column if not exists quota_consumed_at timestamptz;

-- ---------------------------------------------------------------------------
-- Explicit Data API grants.
-- Billing/plan/quota fields are server-managed and are intentionally NOT
-- writable by authenticated browser clients.
-- ---------------------------------------------------------------------------
revoke all on table public.profiles from anon, authenticated;
revoke all on table public.comic_scans from anon, authenticated;
revoke all on table public.scan_images from anon, authenticated;
revoke all on table public.scan_results from anon, authenticated;
revoke all on table public.confirmed_grades from anon, authenticated;

grant select on table public.profiles to authenticated;
grant insert (id, email, full_name) on table public.profiles to authenticated;
grant update (email, full_name) on table public.profiles to authenticated;

grant select, insert, update, delete on table public.comic_scans to authenticated;
grant select, insert, delete on table public.scan_images to authenticated;
grant select, insert on table public.scan_results to authenticated;
grant select, insert, update, delete on table public.confirmed_grades to authenticated;

-- ---------------------------------------------------------------------------
-- Owner-scoped RLS.
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.comic_scans enable row level security;
alter table public.scan_images enable row level security;
alter table public.scan_results enable row level security;
alter table public.confirmed_grades enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "comic_scans_select_own" on public.comic_scans;
create policy "comic_scans_select_own"
  on public.comic_scans for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "comic_scans_insert_own" on public.comic_scans;
create policy "comic_scans_insert_own"
  on public.comic_scans for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "comic_scans_update_own" on public.comic_scans;
create policy "comic_scans_update_own"
  on public.comic_scans for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "comic_scans_delete_own" on public.comic_scans;
create policy "comic_scans_delete_own"
  on public.comic_scans for delete
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "scan_images_select_own" on public.scan_images;
create policy "scan_images_select_own"
  on public.scan_images for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "scan_images_insert_own" on public.scan_images;
create policy "scan_images_insert_own"
  on public.scan_images for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.comic_scans s
      where s.id = scan_id
        and s.user_id = (select auth.uid())
    )
  );

drop policy if exists "scan_images_delete_own" on public.scan_images;
create policy "scan_images_delete_own"
  on public.scan_images for delete
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "scan_results_select_own" on public.scan_results;
create policy "scan_results_select_own"
  on public.scan_results for select
  to authenticated
  using (
    exists (
      select 1
      from public.comic_scans s
      where s.id = scan_id
        and s.user_id = (select auth.uid())
    )
  );

drop policy if exists "scan_results_insert_own" on public.scan_results;
create policy "scan_results_insert_own"
  on public.scan_results for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.comic_scans s
      where s.id = scan_id
        and s.user_id = (select auth.uid())
    )
  );

drop policy if exists "confirmed_grades_select_own" on public.confirmed_grades;
create policy "confirmed_grades_select_own"
  on public.confirmed_grades for select
  to authenticated
  using (
    exists (
      select 1
      from public.comic_scans s
      where s.id = scan_id
        and s.user_id = (select auth.uid())
    )
  );

drop policy if exists "confirmed_grades_insert_own" on public.confirmed_grades;
create policy "confirmed_grades_insert_own"
  on public.confirmed_grades for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.comic_scans s
      where s.id = scan_id
        and s.user_id = (select auth.uid())
    )
  );

drop policy if exists "confirmed_grades_update_own" on public.confirmed_grades;
create policy "confirmed_grades_update_own"
  on public.confirmed_grades for update
  to authenticated
  using (
    exists (
      select 1
      from public.comic_scans s
      where s.id = scan_id
        and s.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.comic_scans s
      where s.id = scan_id
        and s.user_id = (select auth.uid())
    )
  );

drop policy if exists "confirmed_grades_delete_own" on public.confirmed_grades;
create policy "confirmed_grades_delete_own"
  on public.confirmed_grades for delete
  to authenticated
  using (
    exists (
      select 1
      from public.comic_scans s
      where s.id = scan_id
        and s.user_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- Harden auth bootstrap function: fixed search_path + no direct API execution.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
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

revoke all on function public.handle_new_user() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Atomic, idempotent quota consumption.
-- The privileged implementation lives in a non-exposed schema. The public
-- wrapper is SECURITY INVOKER and only authenticated users may call it.
-- ---------------------------------------------------------------------------
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.consume_scan_quota(p_scan_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_consumed_at timestamptz;
  v_free integer;
  v_credits integer;
  v_status text;
  v_limit integer;
  v_used integer;
begin
  if v_user is null then
    return false;
  end if;

  select s.quota_consumed_at
    into v_consumed_at
  from public.comic_scans s
  where s.id = p_scan_id
    and s.user_id = v_user
    and s.status = 'complete'
  for update;

  if not found then
    return false;
  end if;

  if v_consumed_at is not null then
    return true;
  end if;

  select
    p.free_scans_remaining,
    p.paid_scan_credits,
    p.subscription_status,
    p.monthly_scan_limit,
    p.scans_used_this_period
  into
    v_free,
    v_credits,
    v_status,
    v_limit,
    v_used
  from public.profiles p
  where p.id = v_user
  for update;

  if not found then
    return false;
  end if;

  if coalesce(v_free, 0) > 0 then
    update public.profiles
    set free_scans_remaining = v_free - 1
    where id = v_user;
  elsif coalesce(v_credits, 0) > 0 then
    update public.profiles
    set paid_scan_credits = v_credits - 1
    where id = v_user;
  elsif v_status = 'active'
    and coalesce(v_limit, 0) > 0
    and coalesce(v_used, 0) < v_limit then
    update public.profiles
    set scans_used_this_period = coalesce(v_used, 0) + 1
    where id = v_user;
  else
    return false;
  end if;

  update public.comic_scans
  set quota_consumed_at = now()
  where id = p_scan_id
    and user_id = v_user;

  return true;
end;
$$;

revoke all on function private.consume_scan_quota(uuid) from public, anon, authenticated;
grant execute on function private.consume_scan_quota(uuid) to authenticated;

create or replace function public.consume_scan_quota(p_scan_id uuid)
returns boolean
language sql
security invoker
set search_path = ''
as $$
  select private.consume_scan_quota(p_scan_id);
$$;

revoke all on function public.consume_scan_quota(uuid) from public, anon;
grant execute on function public.consume_scan_quota(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Private scan image Storage.
-- ---------------------------------------------------------------------------
update storage.buckets
set public = false
where id = 'scan-images';

drop policy if exists "scan_images_storage_insert" on storage.objects;
create policy "scan_images_storage_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'scan-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "scan_images_storage_select" on storage.objects;
create policy "scan_images_storage_select"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'scan-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "scan_images_storage_update" on storage.objects;
create policy "scan_images_storage_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'scan-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'scan-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "scan_images_storage_delete" on storage.objects;
create policy "scan_images_storage_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'scan-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

commit;
