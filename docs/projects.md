# Project Workspace & Continue Build

This document describes how ZIVO-AI persists project files using Supabase and how to use the **Continue Build** feature.

---

## Supabase Setup

### Required Environment Variables

Add these to your `.env.local` (or Vercel / hosting provider):

```
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>   # (optional; not used yet)
```

### Migrations

Run the following SQL files in the Supabase SQL Editor **in order**:

1. `supabase/migrations/20260305000000_plugin_installs.sql` — plugin_installs table
2. `supabase/migrations/20260305000001_projects_workspace.sql` — projects, project_files, project_builds tables + RLS
3. `supabase/migrations/20260307000002_quality_runs.sql` — project_quality_runs table + RLS

You can paste each file into the [Supabase SQL Editor](https://app.supabase.com/project/_/sql) and click **Run**.

---

## Schema Overview

### `projects`

| Column          | Type        | Notes                                          |
|-----------------|-------------|------------------------------------------------|
| `id`            | `uuid`      | Primary key                                    |
| `owner_user_id` | `uuid`      | Supabase `auth.uid()` of the creator           |
| `title`         | `text`      | Short title (auto-derived from prompt)         |
| `mode`          | `text`      | `code` \| `website_v2` \| `mobile_v2`         |
| `template`      | `text`      | Optional template name                         |
| `visibility`    | `text`      | `public` (default) \| `private`                |
| `client_idea`   | `text`      | The original user prompt                       |
| `blueprint`     | `jsonb`     | AI-generated architecture blueprint            |
| `manifest`      | `jsonb`     | File manifest used for generation              |
| `created_at`    | `timestamptz` |                                              |
| `updated_at`    | `timestamptz` |                                              |

### `project_files`

| Column        | Type        | Notes                                           |
|---------------|-------------|-------------------------------------------------|
| `id`          | `uuid`      | Primary key                                     |
| `project_id`  | `uuid`      | FK → `projects.id`                              |
| `path`        | `text`      | File path (e.g. `app/page.tsx`)                 |
| `content`     | `text`      | Full file content                               |
| `sha`         | `text`      | SHA-256 of content                              |
| `generated_by`| `text`      | Model name used to generate (e.g. `gpt-4o`)     |
| `updated_at`  | `timestamptz` |                                               |

### `project_builds`

| Column         | Type        | Notes                                          |
|----------------|-------------|------------------------------------------------|
| `id`           | `uuid`      | Primary key                                    |
| `project_id`   | `uuid`      | FK → `projects.id`                             |
| `build_number` | `integer`   | Increments per project                         |
| `summary`      | `text`      | Human-readable build summary                   |
| `issues`       | `jsonb`     | Optional list of build issues                  |
| `created_at`   | `timestamptz` |                                              |

---

## RLS Policies

Row Level Security is enabled on all three tables.

| Table            | Policy                    | Condition                                  |
|------------------|---------------------------|--------------------------------------------|
| `projects`       | `projects_owner_all`      | Owner can read/write/delete own projects   |
| `projects`       | `projects_public_read`    | Public projects readable by everyone       |
| `project_files`  | `project_files_owner_all` | Owner can read/write own project's files   |
| `project_files`  | `project_files_public_read` | Files of public projects readable by all |
| `project_builds` | `project_builds_owner_all`| Owner can read/write own project's builds  |
| `project_builds` | `project_builds_public_read` | Builds of public projects readable by all|

> **Default visibility**: All new projects default to `public` until Stripe billing is wired.
> See `lib/billing/plan-provider.ts` to change this.

---

## How `projectId` Works

1. A user builds a project via `/api/build` while authenticated (sends `Authorization: Bearer <token>`).
2. The server creates a `projects` row, upserts all generated files into `project_files`, and appends a `project_builds` record.
3. The `DONE` SSE event includes `data.projectId` — the UI captures and displays this.
4. On the next build, the user can:
   - Use the **Continue Building** text input in the UI — this re-runs `/api/build` with the existing files loaded from Supabase as `existingFiles`.
   - Or call `POST /api/projects/{id}/continue` directly with `{ instruction, model }`.

---

## API Routes

### `GET /api/projects`
Returns the current user's project list.  
**Auth**: `Authorization: Bearer <token>` required.

### `POST /api/projects`
Creates a new project.  
**Auth**: Required.  
**Body**: `{ title?, mode?, template?, client_idea? }`

### `GET /api/projects/{id}`
Returns project metadata + file list (paths only, no content).  
**Auth**: Required.

### `PATCH /api/projects/{id}`
Updates project metadata.  
**Auth**: Required.

### `GET /api/projects/{id}/files`
Returns full file contents for the project.  
**Auth**: Required.

### `POST /api/projects/{id}/continue`
Continues building an existing project with an instruction.  
Loads existing files → runs a patch build → saves updated files → appends build record.  
**Auth**: Required.  
**Body**: `{ instruction: string; model?: string }`  
**Response**: `text/event-stream` (same SSE format as `/api/build`)

### `POST /api/build`
The main build endpoint. Now supports optional persistence:
- Pass `Authorization: Bearer <token>` to enable persistence.
- If `projectId` is provided AND user is authenticated: loads existing files from Supabase.
- After a successful build: upserts files, appends build record, and returns `data.projectId` in the `DONE` SSE event.
- Without auth: behaves exactly as before (no persistence).

### `POST /api/projects/{id}/quality/start`
Starts a Quality Pass (build + lint + typecheck) against the project's current files.  
**Auth**: Required (owner only).  
**Body** (optional): `{ maxRetries?: number }` — auto-fix retries 0–3 (default 3).  
**Response**: `{ runId: string }` (HTTP 202 Accepted).  
The run executes asynchronously; poll `.../quality/status` for results.

> ⚠️ **Security**: This endpoint executes project files as child processes inside the
> app container. See `lib/quality-runner.ts` for the full security note.

### `GET /api/projects/{id}/quality/status?runId=<uuid>`
Polls a specific Quality Pass run.  
**Auth**: Required (owner only).  
**Response**: `{ run: DbQualityRun }` — includes `status`, `checks`, `logs`, `fix_attempts`.

Omit `runId` to list the last 10 runs:  
`GET /api/projects/{id}/quality/status` → `{ runs: DbQualityRun[] }`

---

## Quality Pass

The Quality Pass pipeline runs three checks against the current `project_files` workspace:

| Check        | Command                    |
|--------------|----------------------------|
| `build`      | `npm run build --if-present` |
| `lint`       | `npm run lint --if-present`  |
| `typecheck`  | `npx tsc --noEmit --skipLibCheck` |

All three must pass for the gate to be green (`status: "passed"`).

### Auto-fix loop

When checks fail, the runner asks GPT-4o to patch the failing files and retries — up to
**3 times** (configurable via `maxRetries` in the request body).

1. Capture error output from failing checks.
2. Send relevant source files + errors to the AI model.
3. Apply minimal patches back into `project_files`.
4. Re-run all three checks.
5. Stop after 3 retries regardless of outcome.

### `project_quality_runs` table

| Column          | Type        | Notes                                        |
|-----------------|-------------|----------------------------------------------|
| `id`            | `uuid`      | Primary key                                  |
| `project_id`    | `uuid`      | FK → `projects.id`                           |
| `build_id`      | `uuid`      | Optional FK → `project_builds.id`            |
| `status`        | `text`      | `queued \| running \| passed \| failed`      |
| `logs`          | `text`      | Combined build/lint/typecheck output         |
| `checks`        | `jsonb`     | Per-check results (check, passed, output, durationMs) |
| `fix_attempts`  | `integer`   | Number of auto-fix iterations used           |
| `max_retries`   | `integer`   | Max retries configured at run start          |
| `patches`       | `jsonb`     | File paths patched by auto-fix               |
| `started_at`    | `timestamptz` |                                            |
| `finished_at`   | `timestamptz` |                                            |
| `created_at`    | `timestamptz` |                                            |

Migration: `supabase/migrations/20260307000002_quality_runs.sql`

### UI

Navigate to `/projects/<id>` to see the **Quality Pass** panel:

- **Run checks** — triggers a single-pass Quality Check (no auto-fix).
- **Auto-fix & re-run** — re-triggers checks with up to 3 AI-fix retries (shown after a failure).
- Per-check status badges with collapsible output.
- Full log viewer.

---

## Plan Tier Abstraction

See `lib/billing/plan-provider.ts`.

```ts
import { getPlanTierForUser } from "@/lib/billing/plan-provider";

const tier = await getPlanTierForUser(userId); // returns "free" for all users currently
```

When Stripe is wired, replace the stub in `getPlanTierForUser` with a real subscription lookup.  
Default project visibility (`defaultVisibilityForPlan`) will return `"private"` for `pro`/`team` tiers once implemented.
