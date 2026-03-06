-- Migration: widen deploy_target check constraint on project_deploy_settings
alter table project_deploy_settings
  drop constraint if exists project_deploy_settings_deploy_target_check;

alter table project_deploy_settings
  add constraint project_deploy_settings_deploy_target_check
    check (deploy_target in ('docker', 'vercel', 'github'));
