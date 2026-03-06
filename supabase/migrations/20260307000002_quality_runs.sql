-- Migration: project_quality_runs table
-- Persists the result of each Quality Pass (build + lint + typecheck)
-- and the auto-fix loop iterations.

create table if not exists project_quality_runs (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references projects(id) on delete cascade,
  build_id      uuid references project_builds(id) on delete set null,
  -- lifecycle status
  status        text not null default 'queued'
                  check (status in ('queued', 'running', 'passed', 'failed')),
  -- captured output from npm run build / lint / tsc
  logs          text not null default '',
  -- structured check results (array of { check, passed, output })
  checks        jsonb,
  -- auto-fix iteration metadata
  fix_attempts  integer not null default 0,
  max_retries   integer not null default 3,
  -- fixed file patches applied across iterations
  patches       jsonb,
  started_at    timestamptz,
  finished_at   timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists project_quality_runs_project_id_idx
  on project_quality_runs(project_id);

create index if not exists project_quality_runs_status_idx
  on project_quality_runs(status);

-- ─────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────
alter table project_quality_runs enable row level security;

-- Owner can do everything
create policy "quality_runs_owner_all" on project_quality_runs
  for all using (
    project_id in (
      select id from projects where owner_user_id = auth.uid()
    )
  );

-- Runs of public projects are readable by everyone
create policy "quality_runs_public_read" on project_quality_runs
  for select using (
    project_id in (
      select id from projects where visibility = 'public'
    )
  );
