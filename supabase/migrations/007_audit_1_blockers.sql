-- CoverGrail audit #1 blockers: protect grading state/results and constrain uploads.

begin;

alter table public.comic_scans
  add column if not exists grading_started_at timestamptz;

update public.comic_scans
set grading_started_at = coalesce(grading_started_at, created_at)
where status = 'grading'
  and grading_started_at is null;

-- Browser clients may create a scan only with collector-entered metadata.
-- Status, errors, quota markers, and grading timestamps are server-managed.
revoke insert, update on table public.comic_scans from authenticated;

grant insert (
  user_id,
  title,
  issue_number,
  publisher,
  publication_year,
  estimated_raw_value,
  notes
) on table public.comic_scans to authenticated;

grant update (
  title,
  issue_number,
  publisher,
  publication_year,
  estimated_raw_value,
  notes,
  user_saved_at
) on table public.comic_scans to authenticated;

-- AI results are trusted server output. Browser users can read their result but
-- cannot create a forged result row.
revoke insert on table public.scan_results from authenticated;
drop policy if exists "scan_results_insert_own" on public.scan_results;

-- Enforce the same upload constraints at the bucket boundary so direct Storage
-- API calls cannot bypass the application checks.
update storage.buckets
set
  public = false,
  file_size_limit = 12582912,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']::text[]
where id = 'scan-images';

drop policy if exists "scan_images_storage_insert" on storage.objects;
create policy "scan_images_storage_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'scan-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1
      from public.comic_scans s
      where s.user_id = (select auth.uid())
        and s.id::text = (storage.foldername(name))[2]
    )
  );

-- The app never replaces uploaded evidence in place. Removing UPDATE prevents
-- a validated object from being swapped after its scan-image row is created.
drop policy if exists "scan_images_storage_update" on storage.objects;

commit;
