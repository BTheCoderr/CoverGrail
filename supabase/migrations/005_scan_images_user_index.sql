-- CoverGrail performance follow-up.
-- Add a covering index for the scan_images -> profiles foreign key.

create index if not exists scan_images_user_id_idx
  on public.scan_images (user_id);
