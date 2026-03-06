-- Migration: custom domains, deploy rollbacks, team collaboration

-- ─── Extend project_deployments ──────────────────────────────────────────────
alter table project_deployments
  add column if not exists commit_sha    text,
  add column if not exists rollback_of   uuid references project_deployments(id) on delete set null,
  add column if not exists finished_at   timestamptz,
  add column if not exists logs_path     text;

-- Allow 'docker' as a provider
alter table project_deployments
  drop constraint if exists project_deployments_provider_check;
alter table project_deployments
  add constraint project_deployments_provider_check
    check (provider in ('vercel', 'github', 'docker'));

-- ─── project_domains ─────────────────────────────────────────────────────────
create table if not exists project_domains (
  id                  uuid primary key default gen_random_uuid(),
  project_id          uuid not null references projects(id) on delete cascade,
  domain              text not null,
  status              text not null default 'pending_dns'
                        check (status in ('pending_dns','pending_tls','active','error')),
  verification_token  text not null default encode(gen_random_bytes(16), 'hex'),
  cname_target        text not null default 'proxy.zivo-ai.app',
  error_message       text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (project_id, domain)
);

create index if not exists project_domains_project_id_idx on project_domains(project_id);

create or replace function update_project_domains_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end; $$;

create or replace trigger project_domains_updated_at
  before update on project_domains
  for each row execute function update_project_domains_updated_at();

alter table project_domains enable row level security;

create policy "project_domains_owner_all" on project_domains
  for all using (
    project_id in (select id from projects where owner_user_id = auth.uid())
  );

create policy "project_domains_member_select" on project_domains
  for select using (
    project_id in (
      select project_id from project_members
      where user_id = auth.uid() and status = 'active'
    )
  );

-- ─── project_members ─────────────────────────────────────────────────────────
create table if not exists project_members (
  id             uuid primary key default gen_random_uuid(),
  project_id     uuid not null references projects(id) on delete cascade,
  user_id        uuid,
  role           text not null default 'viewer'
                   check (role in ('owner','editor','viewer')),
  invited_by     uuid not null,
  invited_email  text not null,
  status         text not null default 'pending'
                   check (status in ('pending','active','declined')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (project_id, invited_email)
);

create index if not exists project_members_project_id_idx on project_members(project_id);
create index if not exists project_members_user_id_idx    on project_members(user_id);

create or replace function update_project_members_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end; $$;

create or replace trigger project_members_updated_at
  before update on project_members
  for each row execute function update_project_members_updated_at();

alter table project_members enable row level security;

-- Owner can manage all members of their projects
create policy "project_members_owner_all" on project_members
  for all using (
    project_id in (select id from projects where owner_user_id = auth.uid())
  );

-- Members can see other members in the same project
create policy "project_members_member_select" on project_members
  for select using (
    project_id in (
      select project_id from project_members pm2
      where pm2.user_id = auth.uid() and pm2.status = 'active'
    )
  );

-- Invited user can update their own row (accept/decline)
create policy "project_members_invitee_update" on project_members
  for update using (user_id = auth.uid());
