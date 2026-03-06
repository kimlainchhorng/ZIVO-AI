-- Migration: add updated_at to project_quality_runs
alter table project_quality_runs
  add column if not exists updated_at timestamptz not null default now();

create or replace function update_project_quality_runs_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace trigger project_quality_runs_updated_at
  before update on project_quality_runs
  for each row execute function update_project_quality_runs_updated_at();
