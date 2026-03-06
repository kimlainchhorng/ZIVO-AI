-- Migration: add snapshot_path to project_builds for Supabase Storage snapshots

alter table project_builds
  add column if not exists snapshot_path text;

-- Storage bucket for build snapshots (idempotent via insert-ignore pattern)
-- Note: bucket creation must be done via Supabase dashboard or CLI for production.
-- The bucket name used by the application is: project-build-snapshots
