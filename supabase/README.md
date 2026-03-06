# ZIVO-AI Supabase Database

## Setup

Run migrations in the Supabase SQL Editor **in order** as listed below.

## Schema (base)

Run `supabase/schema.sql` first if setting up the legacy `ai_*` tables (used by the Streamlit/Python app).

## Migrations (run in order)

| # | File | Description |
|---|------|-------------|
| 1 | `20260304000001_create_projects.sql` | Base `projects` table (fresh setup) |
| 2 | `20260305000000_plugin_installs.sql` | `plugin_installs` table |
| 3 | `20260305000001_projects_workspace.sql` | `projects`, `project_files`, `project_builds` + RLS |
| 4 | `20260305000002_project_builds_updated_at.sql` | Add `updated_at` to `project_builds` |
| 5 | `20260306000001_builder_upgrade.sql` | `project_versions`, `project_deployments`, `image_gallery` |
| 6 | `20260306000002_ui_builder_projects.sql` | Add UI builder columns to `projects`, `image_history` |
| 7 | `20260307000001_preview_sessions.sql` | `preview_sessions` + RLS |
| 8 | `20260307000002_quality_runs.sql` | `project_quality_runs` + RLS |
| 9 | `20260307000003_quality_runs_updated_at.sql` | Add `updated_at` to `project_quality_runs` |
| 10 | `20260308000001_project_publish.sql` | Extend `project_deployments` for Docker, `project_deploy_settings` |
| 11 | `20260308000003_domains_rollbacks_teams.sql` | `project_domains`, `project_members` + RLS |
| 12 | `20260308000004_project_change_plans.sql` | `project_change_plans` + RLS |
| 13 | `20260308000005_fix_deploy_target_check.sql` | Fix `deploy_target` check constraint |
| 14 | `20260308000006_fix_project_members_rls.sql` | Fix `project_members` RLS policies |
| 15 | `20260308000007_project_change_plans_index.sql` | Add index on `project_change_plans(created_by_user_id)` |
| 16 | `20260309000001_project_design_tokens.sql` | `project_design_tokens` + RLS |

## Deprecated Files

The following files exist in the repo but should NOT be run (they have been superseded):

- `supabase/migrations/create_projects.sql` → use `20260304000001_create_projects.sql`
- `supabase/migrations/20260308000001_domains_rollbacks_teams.sql` → use `20260308000003_domains_rollbacks_teams.sql`
- `supabase/migrations/20260308000002_project_change_plans.sql` → use `20260308000004_project_change_plans.sql`

## Tables

### Legacy (ai_* prefix — used by Streamlit/Python app)
- `ai_users`
- `ai_projects`
- `ai_files`
- `ai_messages`
- `ai_versions`

### Main (used by Next.js app)
- `plugin_installs`
- `projects`
- `project_files`
- `project_builds`
- `project_versions`
- `project_deployments`
- `project_deploy_settings`
- `image_gallery`
- `image_history`
- `preview_sessions`
- `project_quality_runs`
- `project_domains`
- `project_members`
- `project_change_plans`
- `project_design_tokens`
