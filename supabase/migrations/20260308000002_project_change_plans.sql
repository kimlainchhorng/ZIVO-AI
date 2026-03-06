-- Migration: project_change_plans table
-- Persists AI-proposed change plans that require explicit user approval
-- before any file modifications are applied (Plan + Checklist Guardrail).

create table if not exists project_change_plans (
  id                   uuid primary key default gen_random_uuid(),
  project_id           uuid not null references projects(id) on delete cascade,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  created_by_user_id   uuid not null,
  -- lifecycle
  status               text not null default 'draft'
                         check (status in (
                           'draft', 'awaiting_approval', 'approved', 'rejected',
                           'applied', 'verified', 'failed'
                         )),
  -- AI-generated plan content
  plan_json            jsonb not null default '{}',
  -- approval metadata
  approved_at          timestamptz,
  approved_by_user_id  uuid,
  -- apply metadata
  apply_attempts       integer not null default 0,
  max_apply_attempts   integer not null default 3,
  -- link to verification quality run
  verification_run_id  uuid,
  -- summary of apply + verify outcome
  result_json          jsonb
);

create index if not exists project_change_plans_project_id_idx
  on project_change_plans(project_id);

create index if not exists project_change_plans_status_idx
  on project_change_plans(status);

-- Keep updated_at current automatically
create or replace function update_project_change_plans_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger project_change_plans_updated_at
  before update on project_change_plans
  for each row execute function update_project_change_plans_updated_at();

-- ─────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────
alter table project_change_plans enable row level security;

-- Project owner can do everything
create policy "change_plans_owner_all" on project_change_plans
  for all using (
    project_id in (
      select id from projects where owner_user_id = auth.uid()
    )
  );

-- Plans of public projects are readable by everyone
create policy "change_plans_public_read" on project_change_plans
  for select using (
    project_id in (
      select id from projects where visibility = 'public'
    )
  );
