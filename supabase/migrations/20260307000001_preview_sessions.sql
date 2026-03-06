-- Migration: preview_sessions — tracks live preview container sessions
-- RLS: owner_user_id = auth.uid()

create table if not exists preview_sessions (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references projects(id) on delete cascade,
  owner_user_id uuid not null,
  status        text not null default 'queued'
                  check (status in ('queued', 'building', 'running', 'failed', 'stopped')),
  preview_url   text,
  container_id  text,
  port          integer,
  error_message text,
  logs          text[] not null default '{}',
  started_at    timestamptz,
  stopped_at    timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists preview_sessions_project_id_idx  on preview_sessions(project_id);
create index if not exists preview_sessions_owner_id_idx    on preview_sessions(owner_user_id);
create index if not exists preview_sessions_status_idx      on preview_sessions(status);

-- Auto-update updated_at on every write
create or replace function update_preview_sessions_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger preview_sessions_updated_at
  before update on preview_sessions
  for each row execute function update_preview_sessions_updated_at();

-- Row Level Security
alter table preview_sessions enable row level security;

create policy "preview_sessions_owner_select" on preview_sessions
  for select using (owner_user_id = auth.uid());

create policy "preview_sessions_owner_insert" on preview_sessions
  for insert with check (owner_user_id = auth.uid());

create policy "preview_sessions_owner_update" on preview_sessions
  for update using (owner_user_id = auth.uid());

create policy "preview_sessions_owner_delete" on preview_sessions
  for delete using (owner_user_id = auth.uid());
