-- Migration: project_knowledge table
-- Persists structured metadata extracted from a project's codebase
-- (framework, routes, API endpoints, env vars, component map, etc.)

create table if not exists project_knowledge (
  id             uuid primary key default gen_random_uuid(),
  project_id     uuid not null references projects(id) on delete cascade,
  source_run_id  uuid references project_quality_runs(id) on delete set null,
  -- lifecycle status
  status         text not null default 'queued'
                   check (status in ('queued', 'running', 'succeeded', 'failed')),
  -- extracted metadata
  knowledge_json jsonb,
  -- error message if status = 'failed'
  error          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists project_knowledge_project_id_idx
  on project_knowledge(project_id);

create index if not exists project_knowledge_project_id_created_at_idx
  on project_knowledge(project_id, created_at desc);

-- Auto-update updated_at
create or replace function update_project_knowledge_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_project_knowledge_updated_at
  before update on project_knowledge
  for each row execute function update_project_knowledge_updated_at();

-- ─────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────
alter table project_knowledge enable row level security;

-- Owner can do everything (read + write), with INSERT restricted to own projects
create policy "project_knowledge_owner_all" on project_knowledge
  for all using (
    project_id in (
      select id from projects where owner_user_id = auth.uid()
    )
  )
  with check (
    project_id in (
      select id from projects where owner_user_id = auth.uid()
    )
  );

-- Note: knowledge records are owner-only.  No public-read policy is added because
-- knowledge_json may contain server-side env-var names (non-NEXT_PUBLIC_ vars).
-- Public consumers should use the dedicated public project API instead.
