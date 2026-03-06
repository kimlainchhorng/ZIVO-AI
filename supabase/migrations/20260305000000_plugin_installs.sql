-- Supabase migration: plugin installs table

create table if not exists plugin_installs (
  id uuid primary key default gen_random_uuid(),
  plugin_id text not null,
  config jsonb,
  installed_at timestamptz default now()
);
