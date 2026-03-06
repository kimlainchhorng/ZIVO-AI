-- Migration: project_deploy_settings table
-- Persists per-project GitHub push and Docker deploy configuration.
-- The docker_deploy_token is intentionally NOT stored here; users supply it
-- per-deploy to avoid storing secrets in plaintext.

create table if not exists project_deploy_settings (
  id                       uuid primary key default gen_random_uuid(),
  project_id               uuid not null unique references projects(id) on delete cascade,
  -- GitHub push settings
  deploy_repo_url          text,
  deploy_branch            text not null default 'main',
  -- Docker webhook settings
  docker_deploy_endpoint   text,
  -- Push tracking
  last_pushed_commit_sha   text,
  last_pushed_at           timestamptz,
  -- Deploy tracking
  last_deployed_commit_sha text,
  last_deployed_at         timestamptz,
  last_deploy_status       text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index if not exists project_deploy_settings_project_id_idx
  on project_deploy_settings(project_id);

-- Auto-update updated_at
create or replace function update_project_deploy_settings_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace trigger project_deploy_settings_updated_at
  before update on project_deploy_settings
  for each row execute function update_project_deploy_settings_updated_at();

-- ─────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────
alter table project_deploy_settings enable row level security;

-- Only the project owner can read or write deploy settings
create policy "deploy_settings_owner_all" on project_deploy_settings
  for all using (
    project_id in (
      select id from projects where owner_user_id = auth.uid()
    )
  );
