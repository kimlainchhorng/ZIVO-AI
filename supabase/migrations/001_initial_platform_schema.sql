-- ZIVO AI Developer Platform – Database Schema
-- Migration: 001_initial_platform_schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── ai_projects ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_projects (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  description     TEXT,
  goals           TEXT[],
  tech_stack      TEXT[],
  active_pages    TEXT[],
  db_schema       JSONB,
  recent_changes  JSONB DEFAULT '[]'::JSONB,
  version         TEXT NOT NULL DEFAULT 'V1',
  phase           TEXT NOT NULL DEFAULT 'development'
                    CHECK (phase IN ('planning','development','testing','staging','production')),
  deployment_status TEXT NOT NULL DEFAULT 'pending'
                    CHECK (deployment_status IN ('pending','building','deployed','failed','rolled_back')),
  team_members    JSONB DEFAULT '[]'::JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_projects_phase ON ai_projects(phase);
CREATE INDEX IF NOT EXISTS idx_ai_projects_deployment_status ON ai_projects(deployment_status);

-- ─── ai_messages ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id  UUID REFERENCES ai_projects(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('user','assistant','system','architect','ui','backend','qa','devops','orchestrator')),
  content     TEXT NOT NULL,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_messages_project_id ON ai_messages(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_created_at ON ai_messages(created_at);

-- ─── ai_files ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_files (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id  UUID REFERENCES ai_projects(id) ON DELETE CASCADE,
  path        TEXT NOT NULL,
  content     TEXT NOT NULL,
  language    TEXT,
  dependencies TEXT[],
  imports     TEXT[],
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, path)
);

CREATE INDEX IF NOT EXISTS idx_ai_files_project_id ON ai_files(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_files_path ON ai_files(path);

-- ─── ai_versions ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_versions (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id     UUID REFERENCES ai_projects(id) ON DELETE CASCADE,
  version_number TEXT NOT NULL,
  changelog      TEXT,
  release_notes  TEXT,
  snapshot       JSONB,
  deployed       BOOLEAN NOT NULL DEFAULT FALSE,
  rollback_id    UUID REFERENCES ai_versions(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_versions_project_id ON ai_versions(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_versions_deployed ON ai_versions(deployed);

-- ─── ai_workflows ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_workflows (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id  UUID REFERENCES ai_projects(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  status      TEXT NOT NULL DEFAULT 'active'
                CHECK (status IN ('active','paused','completed','failed')),
  trigger     JSONB NOT NULL,
  steps       JSONB NOT NULL DEFAULT '[]'::JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_workflows_project_id ON ai_workflows(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_workflows_status ON ai_workflows(status);

-- ─── ai_deployments ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_deployments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id  UUID REFERENCES ai_projects(id) ON DELETE CASCADE,
  version_id  UUID REFERENCES ai_versions(id),
  status      TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','building','deployed','failed','rolled_back')),
  url         TEXT,
  environment TEXT NOT NULL DEFAULT 'preview'
                CHECK (environment IN ('preview','production')),
  env_vars    JSONB,
  build_log   TEXT,
  error_log   TEXT,
  pre_checks  JSONB DEFAULT '[]'::JSONB,
  post_checks JSONB DEFAULT '[]'::JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_deployments_project_id ON ai_deployments(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_deployments_status ON ai_deployments(status);

-- ─── ai_errors ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_errors (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id    UUID REFERENCES ai_projects(id) ON DELETE CASCADE,
  deployment_id UUID REFERENCES ai_deployments(id),
  error_type    TEXT NOT NULL,
  message       TEXT NOT NULL,
  stack_trace   TEXT,
  file_path     TEXT,
  line_number   INTEGER,
  root_cause    TEXT,
  fix_proposal  TEXT,
  patch         JSONB,
  resolved      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_errors_project_id ON ai_errors(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_errors_resolved ON ai_errors(resolved);

-- ─── ai_tests ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_tests (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id  UUID REFERENCES ai_projects(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('unit','integration','e2e','snapshot')),
  status      TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('passing','failing','skipped','pending')),
  coverage    NUMERIC(5,2),
  duration_ms INTEGER,
  error       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_tests_project_id ON ai_tests(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_tests_status ON ai_tests(status);

-- ─── ai_dependencies ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_dependencies (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id          UUID REFERENCES ai_projects(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  version             TEXT NOT NULL,
  type                TEXT NOT NULL DEFAULT 'production'
                        CHECK (type IN ('production','development','peer')),
  latest_version      TEXT,
  has_vulnerabilities BOOLEAN DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, name)
);

CREATE INDEX IF NOT EXISTS idx_ai_dependencies_project_id ON ai_dependencies(project_id);

-- ─── ai_team_members ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_team_members (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id  UUID REFERENCES ai_projects(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  role        TEXT NOT NULL,
  email       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_team_members_project_id ON ai_team_members(project_id);

-- ─── Row Level Security ───────────────────────────────────────────────────────
ALTER TABLE ai_projects     ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages     ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_files        ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_versions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_workflows    ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_deployments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_errors       ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_tests        ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_team_members ENABLE ROW LEVEL SECURITY;

-- Public read policies (adjust for auth in production)
-- These policies restrict access to authenticated users only.
-- For public/anon access, use the service role key server-side (never expose it to the browser).
CREATE POLICY "allow_all_ai_projects"     ON ai_projects     FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_ai_messages"     ON ai_messages     FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_ai_files"        ON ai_files        FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_ai_versions"     ON ai_versions     FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_ai_workflows"    ON ai_workflows    FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_ai_deployments"  ON ai_deployments  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_ai_errors"       ON ai_errors       FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_ai_tests"        ON ai_tests        FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_ai_dependencies" ON ai_dependencies FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_ai_team_members" ON ai_team_members FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ─── updated_at trigger ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_ai_projects_updated_at
  BEFORE UPDATE ON ai_projects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_ai_files_updated_at
  BEFORE UPDATE ON ai_files
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_ai_workflows_updated_at
  BEFORE UPDATE ON ai_workflows
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_ai_deployments_updated_at
  BEFORE UPDATE ON ai_deployments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
