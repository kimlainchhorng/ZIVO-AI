-- ZIVO-AI Supabase Database Schema
-- Run this in the Supabase SQL editor to set up the builder project memory.

-- ─────────────────────────────────────────────
-- Extensions
-- ─────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────
-- Users
-- ─────────────────────────────────────────────
create table if not exists ai_users (
  id          uuid primary key default gen_random_uuid(),
  auth_id     text unique not null,
  email       text unique not null,
  name        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- Projects
-- ─────────────────────────────────────────────
create table if not exists ai_projects (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  owner_id    uuid not null references ai_users(id) on delete cascade,
  files_count integer not null default 0,
  version     integer not null default 1,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists ai_projects_owner_id_idx on ai_projects(owner_id);

-- ─────────────────────────────────────────────
-- Files
-- ─────────────────────────────────────────────
create table if not exists ai_files (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references ai_projects(id) on delete cascade,
  path        text not null,
  content     text not null default '',
  action      text not null check (action in ('create', 'update', 'delete')),
  language    text,
  file_size   integer generated always as (octet_length(content)) stored,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (project_id, path)
);

create index if not exists ai_files_project_id_idx on ai_files(project_id);

-- ─────────────────────────────────────────────
-- Messages
-- ─────────────────────────────────────────────
create table if not exists ai_messages (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references ai_projects(id) on delete cascade,
  user_id     uuid references ai_users(id) on delete set null,
  role        text not null check (role in ('user', 'assistant', 'system')),
  content     text not null,
  tokens_used integer,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists ai_messages_project_id_idx on ai_messages(project_id);

-- ─────────────────────────────────────────────
-- Versions
-- ─────────────────────────────────────────────
create table if not exists ai_versions (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references ai_projects(id) on delete cascade,
  version_number  integer not null,
  files_snapshot  jsonb not null default '[]',
  created_at      timestamptz not null default now(),
  deployed_at     timestamptz,
  unique (project_id, version_number)
);

create index if not exists ai_versions_project_id_idx on ai_versions(project_id);

-- ─────────────────────────────────────────────
-- Triggers: auto-update updated_at
-- ─────────────────────────────────────────────
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace trigger ai_users_updated_at
  before update on ai_users
  for each row execute function update_updated_at();

create or replace trigger ai_projects_updated_at
  before update on ai_projects
  for each row execute function update_updated_at();

create or replace trigger ai_files_updated_at
  before update on ai_files
  for each row execute function update_updated_at();

create or replace trigger ai_messages_updated_at
  before update on ai_messages
  for each row execute function update_updated_at();

create or replace trigger ai_versions_updated_at
  before update on ai_versions
  for each row execute function update_updated_at();

-- ─────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────
alter table ai_users    enable row level security;
alter table ai_projects enable row level security;
alter table ai_files    enable row level security;
alter table ai_messages enable row level security;
alter table ai_versions enable row level security;

-- Users: can read/update own row
create policy "users_select_own" on ai_users
  for select using (auth.uid()::text = auth_id);
create policy "users_update_own" on ai_users
  for update using (auth.uid()::text = auth_id);
create policy "users_insert_own" on ai_users
  for insert with check (auth.uid()::text = auth_id);

-- Projects: owner can do everything
create policy "projects_owner_all" on ai_projects
  for all using (
    owner_id = (select id from ai_users where auth_id = auth.uid()::text limit 1)
  );

-- Files: project owner can do everything
create policy "files_owner_all" on ai_files
  for all using (
    project_id in (
      select id from ai_projects
      where owner_id = (select id from ai_users where auth_id = auth.uid()::text limit 1)
    )
  );

-- Messages: project owner can do everything
create policy "messages_owner_all" on ai_messages
  for all using (
    project_id in (
      select id from ai_projects
      where owner_id = (select id from ai_users where auth_id = auth.uid()::text limit 1)
    )
  );

-- Versions: project owner can do everything
create policy "versions_owner_all" on ai_versions
  for all using (
    project_id in (
      select id from ai_projects
      where owner_id = (select id from ai_users where auth_id = auth.uid()::text limit 1)
    )
  );
