-- Migration: Builder upgrade — project_versions, project_deployments, image_gallery
-- RLS: owner_user_id / owner_id = auth.uid()

-- ─────────────────────────────────────────────
-- project_versions
-- ─────────────────────────────────────────────
create table if not exists project_versions (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references projects(id) on delete cascade,
  version_number  integer not null,
  label           text,
  snapshot        jsonb not null default '{}',
  style_preset    text,
  pages           jsonb not null default '[]',
  sections        jsonb not null default '[]',
  created_at      timestamptz not null default now(),
  created_by      uuid,
  unique (project_id, version_number)
);

create index if not exists project_versions_project_id_idx on project_versions(project_id);

alter table project_versions enable row level security;

create policy "project_versions_owner_select" on project_versions
  for select using (
    project_id in (
      select id from projects where owner_user_id = auth.uid()
    )
  );

create policy "project_versions_owner_insert" on project_versions
  for insert with check (
    project_id in (
      select id from projects where owner_user_id = auth.uid()
    )
  );

create policy "project_versions_owner_update" on project_versions
  for update using (
    project_id in (
      select id from projects where owner_user_id = auth.uid()
    )
  );

create policy "project_versions_owner_delete" on project_versions
  for delete using (
    project_id in (
      select id from projects where owner_user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────
-- project_deployments
-- ─────────────────────────────────────────────
create table if not exists project_deployments (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references projects(id) on delete cascade,
  provider      text not null check (provider in ('vercel', 'github')),
  deploy_url    text,
  github_repo   text,
  github_branch text,
  status        text not null default 'pending' check (status in ('pending','building','success','error')),
  error_message text,
  deployed_at   timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists project_deployments_project_id_idx on project_deployments(project_id);

alter table project_deployments enable row level security;

create policy "project_deployments_owner_select" on project_deployments
  for select using (
    project_id in (
      select id from projects where owner_user_id = auth.uid()
    )
  );

create policy "project_deployments_owner_insert" on project_deployments
  for insert with check (
    project_id in (
      select id from projects where owner_user_id = auth.uid()
    )
  );

create policy "project_deployments_owner_update" on project_deployments
  for update using (
    project_id in (
      select id from projects where owner_user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────
-- image_gallery
-- ─────────────────────────────────────────────
create table if not exists image_gallery (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid references projects(id) on delete set null,
  owner_id     uuid not null,
  url          text not null,
  prompt       text,
  image_type   text,
  size         text,
  style_preset text,
  created_at   timestamptz not null default now()
);

create index if not exists image_gallery_owner_id_idx on image_gallery(owner_id);
create index if not exists image_gallery_project_id_idx on image_gallery(project_id);

alter table image_gallery enable row level security;

create policy "image_gallery_owner_select" on image_gallery
  for select using (owner_id = auth.uid());

create policy "image_gallery_owner_insert" on image_gallery
  for insert with check (owner_id = auth.uid());

create policy "image_gallery_owner_delete" on image_gallery
  for delete using (owner_id = auth.uid());
