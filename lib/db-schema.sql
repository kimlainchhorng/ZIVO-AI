-- ZIVO AI Developer Platform – Supabase Database Schema
-- Run this SQL in the Supabase SQL Editor to set up all tables.

-- ─── Enable UUID extension ────────────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ─── ai_projects ──────────────────────────────────────────────────────────────
create table if not exists ai_projects (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  description   text,
  goals         text[]            default '{}',
  tech_stack    text[]            default '{}',
  active_pages  text[]            default '{}',
  db_schema     jsonb             default '{}',
  recent_changes jsonb            default '[]',
  version       text              default '1.0.0',
  team_members  jsonb             default '[]',
  phase         text              default 'planning'
                  check (phase in ('planning','development','testing','staging','production')),
  deployment_status text          default 'idle'
                  check (deployment_status in ('idle','building','deploying','deployed','failed','rolled-back')),
  user_id       uuid              references auth.users(id) on delete cascade,
  created_at    timestamptz       default now(),
  updated_at    timestamptz       default now()
);

-- ─── ai_messages ──────────────────────────────────────────────────────────────
create table if not exists ai_messages (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid references ai_projects(id) on delete cascade,
  role        text not null
                check (role in ('user','assistant','system','agent')),
  content     text not null,
  agent       text,
  files       jsonb  default '[]',
  created_at  timestamptz default now()
);

-- ─── ai_files ─────────────────────────────────────────────────────────────────
create table if not exists ai_files (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid references ai_projects(id) on delete cascade,
  path         text not null,
  content      text,
  language     text,
  action       text default 'create'
                 check (action in ('create','update','delete','rename')),
  dependencies text[] default '{}',
  imports      text[] default '{}',
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  unique(project_id, path)
);

-- ─── ai_versions ──────────────────────────────────────────────────────────────
create table if not exists ai_versions (
  id             uuid primary key default gen_random_uuid(),
  project_id     uuid references ai_projects(id) on delete cascade,
  version_number text not null,
  changelog      text,
  release_notes  text,
  snapshot       jsonb default '{}',
  created_at     timestamptz default now(),
  deployed_at    timestamptz,
  rolled_back_at timestamptz
);

-- ─── ai_workflows ─────────────────────────────────────────────────────────────
create table if not exists ai_workflows (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid references ai_projects(id) on delete cascade,
  name        text not null,
  description text,
  states      jsonb default '[]',
  transitions jsonb default '[]',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ─── ai_deployments ───────────────────────────────────────────────────────────
create table if not exists ai_deployments (
  id             uuid primary key default gen_random_uuid(),
  project_id     uuid references ai_projects(id) on delete cascade,
  version_id     uuid references ai_versions(id) on delete set null,
  status         text default 'idle'
                   check (status in ('idle','building','deploying','deployed','failed','rolled-back')),
  url            text,
  logs           text[] default '{}',
  env_vars       jsonb  default '{}',
  checks_passed  boolean default false,
  created_at     timestamptz default now(),
  completed_at   timestamptz
);

-- ─── ai_errors ────────────────────────────────────────────────────────────────
create table if not exists ai_errors (
  id             uuid primary key default gen_random_uuid(),
  project_id     uuid references ai_projects(id) on delete cascade,
  message        text not null,
  stack_trace    text,
  file_path      text,
  line_number    int,
  category       text default 'runtime'
                   check (category in ('build','runtime','lint','type','test','deploy')),
  root_cause     text,
  fix_proposals  jsonb default '[]',
  resolved       boolean default false,
  created_at     timestamptz default now()
);

-- ─── ai_tests ─────────────────────────────────────────────────────────────────
create table if not exists ai_tests (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid references ai_projects(id) on delete cascade,
  name        text not null,
  type        text default 'unit'
                check (type in ('unit','integration','e2e','snapshot')),
  status      text default 'pending'
                check (status in ('passed','failed','skipped','pending')),
  coverage    numeric(5,2),
  error       text,
  created_at  timestamptz default now()
);

-- ─── ai_dependencies ──────────────────────────────────────────────────────────
create table if not exists ai_dependencies (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid references ai_projects(id) on delete cascade,
  name        text not null,
  version     text,
  dev_dep     boolean default false,
  created_at  timestamptz default now(),
  unique(project_id, name)
);

-- ─── ai_team_members ──────────────────────────────────────────────────────────
create table if not exists ai_team_members (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid references ai_projects(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete cascade,
  name        text not null,
  role        text not null,
  email       text,
  created_at  timestamptz default now(),
  unique(project_id, user_id)
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
create index if not exists idx_ai_messages_project_id   on ai_messages(project_id);
create index if not exists idx_ai_files_project_id      on ai_files(project_id);
create index if not exists idx_ai_versions_project_id   on ai_versions(project_id);
create index if not exists idx_ai_deployments_project_id on ai_deployments(project_id);
create index if not exists idx_ai_errors_project_id     on ai_errors(project_id);
create index if not exists idx_ai_tests_project_id      on ai_tests(project_id);

-- ─── Row Level Security ───────────────────────────────────────────────────────
alter table ai_projects      enable row level security;
alter table ai_messages      enable row level security;
alter table ai_files         enable row level security;
alter table ai_versions      enable row level security;
alter table ai_workflows     enable row level security;
alter table ai_deployments   enable row level security;
alter table ai_errors        enable row level security;
alter table ai_tests         enable row level security;
alter table ai_dependencies  enable row level security;
alter table ai_team_members  enable row level security;

-- Projects: owners can manage, team members can view
create policy "projects_owner_all"
  on ai_projects for all
  using (auth.uid() = user_id);

create policy "projects_team_select"
  on ai_projects for select
  using (
    exists (
      select 1 from ai_team_members
      where project_id = ai_projects.id
        and user_id = auth.uid()
    )
  );

-- Messages: project members can read/write
create policy "messages_project_access"
  on ai_messages for all
  using (
    exists (
      select 1 from ai_projects p
      where p.id = ai_messages.project_id
        and (p.user_id = auth.uid() or exists (
          select 1 from ai_team_members t
          where t.project_id = p.id and t.user_id = auth.uid()
        ))
    )
  );

-- Files: same as messages
create policy "files_project_access"
  on ai_files for all
  using (
    exists (
      select 1 from ai_projects p
      where p.id = ai_files.project_id
        and (p.user_id = auth.uid() or exists (
          select 1 from ai_team_members t
          where t.project_id = p.id and t.user_id = auth.uid()
        ))
    )
  );

-- ─── updated_at trigger ───────────────────────────────────────────────────────
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger ai_projects_updated_at
  before update on ai_projects
  for each row execute procedure update_updated_at();

create trigger ai_files_updated_at
  before update on ai_files
  for each row execute procedure update_updated_at();

create trigger ai_workflows_updated_at
  before update on ai_workflows
  for each row execute procedure update_updated_at();
