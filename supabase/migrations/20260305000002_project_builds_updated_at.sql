-- Migration: add updated_at to project_builds
alter table project_builds
  add column if not exists updated_at timestamptz not null default now();

create or replace function update_project_builds_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace trigger project_builds_updated_at
  before update on project_builds
  for each row execute function update_project_builds_updated_at();
