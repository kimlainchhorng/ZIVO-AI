-- Migration: project conversation messages per project
-- Table: project_messages
-- RLS: owner can write; same visibility rules as other project tables.

create table if not exists project_messages (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references projects(id) on delete cascade,
  owner_user_id   uuid not null,
  role            text not null check (role in ('user', 'assistant', 'system')),
  content         text not null default '',
  created_at      timestamptz not null default now()
);

create index if not exists project_messages_project_id_idx on project_messages(project_id);
create index if not exists project_messages_created_at_idx on project_messages(project_id, created_at);

alter table project_messages enable row level security;

-- owner can read/write their project's messages
create policy "project_messages_owner_all" on project_messages
  for all using (
    project_id in (
      select id from projects where owner_user_id = auth.uid()
    )
  );

-- messages of public projects are readable by everyone
create policy "project_messages_public_read" on project_messages
  for select using (
    project_id in (
      select id from projects where visibility = 'public'
    )
  );
