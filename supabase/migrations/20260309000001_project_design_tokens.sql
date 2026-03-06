-- Migration: project_design_tokens table
-- Stores per-project design token configuration (colors, typography,
-- spacing, radius, shadows) used to enforce consistent styling in
-- AI-generated pages and to power the in-product Design editor.

create table if not exists project_design_tokens (
  id          uuid        primary key default gen_random_uuid(),
  project_id  uuid        not null unique references projects(id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  tokens_json jsonb       not null default '{}'
);

create index if not exists project_design_tokens_project_id_idx
  on project_design_tokens(project_id);

-- Keep updated_at current automatically
create or replace function update_project_design_tokens_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger project_design_tokens_updated_at
  before update on project_design_tokens
  for each row execute function update_project_design_tokens_updated_at();

-- ─────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────
alter table project_design_tokens enable row level security;

-- Project owner can do everything
create policy "design_tokens_owner_all" on project_design_tokens
  for all using (
    project_id in (
      select id from projects where owner_user_id = auth.uid()
    )
  );

-- Tokens of public projects are readable by everyone
create policy "design_tokens_public_read" on project_design_tokens
  for select using (
    project_id in (
      select id from projects where visibility = 'public'
    )
  );

-- Project members (editors/viewers) can read tokens
create policy "design_tokens_member_read" on project_design_tokens
  for select using (
    project_id in (
      select project_id from project_members where user_id = auth.uid()
    )
  );

-- Project editors can update tokens
create policy "design_tokens_editor_write" on project_design_tokens
  for all using (
    project_id in (
      select project_id from project_members
       where user_id = auth.uid()
         and role in ('editor', 'owner')
    )
  );
