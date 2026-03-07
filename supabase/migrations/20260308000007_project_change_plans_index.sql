-- Migration: add missing index on project_change_plans(created_by_user_id)
create index if not exists project_change_plans_created_by_user_id_idx
  on project_change_plans(created_by_user_id);
