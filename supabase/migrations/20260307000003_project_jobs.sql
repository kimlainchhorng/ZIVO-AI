-- Migration: project_jobs — DB-backed job queue for quality/preview/build runs
-- Replaces the in-process quality pass with a runner-executed job queue.
-- Logs are stored in Supabase Storage at job-logs/<projectId>/<jobId>.log

-- ─── Job queue table ──────────────────────────────────────────────────────────

create table if not exists project_jobs (
  id                uuid primary key default gen_random_uuid(),
  project_id        uuid not null references projects(id) on delete cascade,
  owner_user_id     uuid not null,
  -- job type
  type              text not null default 'quality'
                      check (type in ('preview', 'quality', 'build')),
  -- lifecycle status
  status            text not null default 'queued'
                      check (status in ('queued', 'running', 'passed', 'failed', 'stopped')),
  -- retry tracking
  attempt           integer not null default 1,
  max_attempts      integer not null default 1,
  -- timestamps
  created_at        timestamptz not null default now(),
  started_at        timestamptz,
  finished_at       timestamptz,
  -- structured output (check results, error info)
  result_json       jsonb,
  -- path to log file in Supabase Storage bucket "job-logs"
  logs_storage_path text
);

create index if not exists project_jobs_project_id_idx
  on project_jobs(project_id);

create index if not exists project_jobs_status_type_idx
  on project_jobs(status, type);

create index if not exists project_jobs_owner_idx
  on project_jobs(owner_user_id);

-- ─── Storage bucket for logs ──────────────────────────────────────────────────
-- Bucket created via Supabase management API / dashboard.
-- Path convention: job-logs/<projectId>/<jobId>.log

-- ─── Row Level Security ───────────────────────────────────────────────────────

alter table project_jobs enable row level security;

-- Owner can do everything on their jobs
create policy "project_jobs_owner_all" on project_jobs
  for all using (
    project_id in (
      select id from projects where owner_user_id = auth.uid()
    )
  );

-- Jobs for public projects are readable by everyone
create policy "project_jobs_public_read" on project_jobs
  for select using (
    project_id in (
      select id from projects where visibility = 'public'
    )
  );
