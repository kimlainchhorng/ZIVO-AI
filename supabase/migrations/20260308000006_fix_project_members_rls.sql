-- Migration: fix project_members RLS — allow members to read their own rows
-- Members should be able to see their own membership record (to check their own role/status)

create policy "project_members_self_select" on project_members
  for select using (user_id = auth.uid());

-- Editors can read all members of projects they belong to
create policy "project_members_active_member_select" on project_members
  for select using (
    project_id in (
      select project_id from project_members
      where user_id = auth.uid()
        and status = 'active'
    )
  );
