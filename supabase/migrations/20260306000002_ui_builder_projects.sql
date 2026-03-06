-- Migration: Add UI builder columns to projects table and create image_history table
-- This extends supabase/migrations/20260306000001_builder_upgrade.sql

-- ─────────────────────────────────────────────
-- projects: add UI builder columns
-- ─────────────────────────────────────────────
alter table projects add column if not exists style_preset text default 'premium';
alter table projects add column if not exists pages jsonb default '[]';
alter table projects add column if not exists deploy_url text;
alter table projects add column if not exists github_repo text;
alter table projects add column if not exists vercel_deployment_id text;

-- ─────────────────────────────────────────────
-- image_history (mirrors image_gallery from builder_upgrade with owner_user_id alias)
-- ─────────────────────────────────────────────
create table if not exists image_history (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid references projects(id) on delete set null,
  owner_user_id   uuid not null,
  url             text not null,
  prompt          text,
  image_type      text,
  width           integer,
  height          integer,
  created_at      timestamptz not null default now()
);

create index if not exists image_history_owner_idx    on image_history(owner_user_id);
create index if not exists image_history_project_idx  on image_history(project_id);

alter table image_history enable row level security;

create policy "image_history_owner_select" on image_history
  for select using (owner_user_id = auth.uid());

create policy "image_history_owner_insert" on image_history
  for insert with check (owner_user_id = auth.uid());

create policy "image_history_owner_delete" on image_history
  for delete using (owner_user_id = auth.uid());
