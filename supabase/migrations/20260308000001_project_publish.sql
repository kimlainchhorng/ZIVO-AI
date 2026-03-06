-- Migration: Publish/Deploy flow — extend project_deployments for Docker, add project_deploy_settings
-- Adds docker support to existing project_deployments table and a new project_deploy_settings config table.

-- ─────────────────────────────────────────────
-- Extend project_deployments: new provider + docker columns
-- ─────────────────────────────────────────────

-- Drop existing provider check so we can widen it
alter table project_deployments
  drop constraint if exists project_deployments_provider_check;

alter table project_deployments
  add constraint project_deployments_provider_check
    check (provider in ('vercel', 'github', 'docker'));

-- Docker-specific columns
alter table project_deployments
  add column if not exists docker_endpoint text,
  add column if not exists commit_sha      text;

-- ─────────────────────────────────────────────
-- project_deploy_settings — per-project publish config
-- ─────────────────────────────────────────────
create table if not exists project_deploy_settings (
  id                    uuid primary key default gen_random_uuid(),
  project_id            uuid not null references projects(id) on delete cascade,
  deploy_target         text not null default 'docker'
                          check (deploy_target in ('docker')),
  deploy_repo_url       text,
  deploy_branch         text not null default 'main',
  docker_deploy_endpoint text,
  -- token stored in plaintext; secure at the infrastructure level (e.g. column-level encryption, Vault, or
  -- prompt the user on every deploy rather than persisting). Never log this value.
  docker_deploy_token   text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (project_id)
);

create index if not exists project_deploy_settings_project_id_idx
  on project_deploy_settings(project_id);

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

alter table project_deploy_settings enable row level security;

create policy "project_deploy_settings_owner_all" on project_deploy_settings
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

-- ─────────────────────────────────────────────
-- Add github_repo column to projects table (if not present)
-- ─────────────────────────────────────────────
alter table projects
  add column if not exists github_repo text;
