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
3. `supabase/migrations/20260306000003_project_messages.sql` — project_messages table + RLS

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

### `project_messages`

| Column           | Type          | Notes                                            |
|------------------|---------------|--------------------------------------------------|
| `id`             | `uuid`        | Primary key                                      |
| `project_id`     | `uuid`        | FK → `projects.id`                               |
| `owner_user_id`  | `uuid`        | Supabase `auth.uid()` of the author              |
| `role`           | `text`        | `user` \| `assistant` \| `system`               |
| `content`        | `text`        | Message body                                     |
| `created_at`     | `timestamptz` |                                                  |

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

### `GET /api/projects/{id}/builds`
Returns build history for a project (ordered newest-first).  
**Auth**: Required.

### `GET /api/projects/{id}/messages`
Returns the conversation thread for a project (ordered chronologically).  
**Auth**: Required.

### `POST /api/projects/{id}/messages`
Appends a message to the project conversation thread.  
**Auth**: Required.  
**Body**: `{ role: "user"|"assistant"|"system"; content: string }`

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

---

## Plan Tier Abstraction

See `lib/billing/plan-provider.ts`.

```ts
import { getPlanTierForUser } from "@/lib/billing/plan-provider";

const tier = await getPlanTierForUser(userId); // returns "free" for all users currently
```

When Stripe is wired, replace the stub in `getPlanTierForUser` with a real subscription lookup.  
Default project visibility (`defaultVisibilityForPlan`) will return `"private"` for `pro`/`team` tiers once implemented.
