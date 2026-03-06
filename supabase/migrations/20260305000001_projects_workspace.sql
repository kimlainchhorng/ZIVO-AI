-- Migration: persistent project workspace (projects + files + builds)
-- Tables: projects, project_files, project_builds
-- RLS: owner can write; public projects readable by everyone; private by owner only.
-- Default visibility: public (Stripe wiring comes later).

-- ─────────────────────────────────────────────
-- projects
-- ─────────────────────────────────────────────
create table if not exists projects (
  id             uuid primary key default gen_random_uuid(),
  owner_user_id  uuid not null,
  title          text not null default 'Untitled Project',
  mode           text not null default 'code'
                   check (mode in ('code', 'website_v2', 'mobile_v2')),
  template       text,
  visibility     text not null default 'public'
                   check (visibility in ('public', 'private')),
  client_idea    text,
  blueprint      jsonb,
  manifest       jsonb,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists projects_owner_user_id_idx on projects(owner_user_id);

-- ─────────────────────────────────────────────
-- project_files
-- ─────────────────────────────────────────────
create table if not exists project_files (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references projects(id) on delete cascade,
  path         text not null,
  content      text not null default '',
  sha          text,
  generated_by text,
  updated_at   timestamptz not null default now(),
  unique (project_id, path)
);

create index if not exists project_files_project_id_idx on project_files(project_id);

-- ─────────────────────────────────────────────
-- project_builds
-- ─────────────────────────────────────────────
create table if not exists project_builds (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references projects(id) on delete cascade,
  build_number integer not null default 1,
  summary      text,
  issues       jsonb,
  created_at   timestamptz not null default now()
);

create index if not exists project_builds_project_id_idx on project_builds(project_id);

-- ─────────────────────────────────────────────
-- Triggers: auto-update updated_at
-- ─────────────────────────────────────────────
create or replace function update_projects_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace trigger projects_updated_at
  before update on projects
  for each row execute function update_projects_updated_at();

create or replace function update_project_files_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace trigger project_files_updated_at
  before update on project_files
  for each row execute function update_project_files_updated_at();

-- ─────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────
alter table projects       enable row level security;
alter table project_files  enable row level security;
alter table project_builds enable row level security;

-- projects: owner can do everything
create policy "projects_owner_all" on projects
  for all using (owner_user_id = auth.uid());

-- projects: public projects are readable by everyone
create policy "projects_public_read" on projects
  for select using (visibility = 'public');

-- project_files: owner can do everything
create policy "project_files_owner_all" on project_files
  for all using (
    project_id in (
      select id from projects where owner_user_id = auth.uid()
    )
  );

-- project_files: files of public projects are readable by everyone
create policy "project_files_public_read" on project_files
  for select using (
    project_id in (
      select id from projects where visibility = 'public'
    )
  );

-- project_builds: owner can do everything
create policy "project_builds_owner_all" on project_builds
  for all using (
    project_id in (
      select id from projects where owner_user_id = auth.uid()
    )
  );

-- project_builds: builds of public projects are readable by everyone
create policy "project_builds_public_read" on project_builds
  for select using (
    project_id in (
      select id from projects where visibility = 'public'
    )
  );
