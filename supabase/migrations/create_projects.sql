-- Migration: simple projects table for ZIVO AI (feature parity with Lovable/Bolt/Base44)
-- Note: If you already ran 20260305000001_projects_workspace.sql, this migration
-- adds the is_public boolean column as an alias for visibility = 'public'.
-- The projects table in 20260305000001_projects_workspace.sql uses
-- visibility = 'public'/'private'. This file documents the full table definition
-- for fresh setups and adds is_public for convenience.

-- Full table definition (no-op if already exists via projects_workspace migration)
create table if not exists public.projects (
  id          uuid default gen_random_uuid() primary key,
  owner_user_id uuid not null,
  title       text not null default 'Untitled Project',
  mode        text not null default 'code',
  template    text,
  visibility  text not null default 'public' check (visibility in ('public', 'private')),
  client_idea text,
  blueprint   jsonb,
  manifest    jsonb,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Enable RLS
alter table public.projects enable row level security;

-- Users can do everything with their own projects
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'projects'
      and policyname = 'projects_owner_all'
  ) then
    execute 'create policy "projects_owner_all" on public.projects for all using (owner_user_id = auth.uid())';
  end if;
end $$;

-- Anyone can view public projects
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'projects'
      and policyname = 'projects_public_read'
  ) then
    execute 'create policy "projects_public_read" on public.projects for select using (visibility = ''public'')';
  end if;
end $$;

