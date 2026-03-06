# Live Preview Runner — Deployment Guide

ZIVO-AI's **Live Preview** feature lets users see their generated Next.js website running in a real server environment.  Two preview modes are supported:

| Mode | How it works | Requirements |
|---|---|---|
| **Browser (WebContainer)** | Runs Node.js/npm entirely in the browser via WebContainers API | Chrome/Edge with COOP+COEP headers |
| **Remote (Docker)** | Runs the site in an isolated Docker container on the server | Docker ≥ 20 on the app host |

This document covers the **Remote preview runner** (Docker mode).

---

## Architecture overview

```
Browser → POST /api/preview/start { projectId }
              ↓ (async)
        preview-runner.ts ──► Docker daemon
                               └─ container: zivo-preview-<id>
                                   ├─ npm install
                                   └─ next dev --port 3000
              ↓ poll
Browser → GET  /api/preview/status?previewId=<id>
              ← { status, url, logs }
Browser ← iframe src="<url>"

Browser → POST /api/preview/stop { previewId }
              ↓
        docker stop zivo-preview-<id>
```

Preview sessions are stored in an **in-memory Map** (survives hot-reloads in dev via globalThis; restarts clear them) and optionally in the `preview_sessions` Supabase table.

---

## Prerequisites

- Docker Engine ≥ 20 installed on the host running the Next.js app
- The `docker` CLI available on `PATH` for the Node.js process
- Network connectivity for `npm install` inside containers (unless you use a local npm cache/mirror)

---

## Deployment on a Docker server

### 1. Build and start ZIVO-AI

```bash
docker build -t zivo-ai .
docker run -d \
  --name zivo-ai \
  -p 3000:3000 \
  # Mount the host Docker socket so the app can launch preview containers:
  -v /var/run/docker.sock:/var/run/docker.sock \
  -e PREVIEW_BASE_URL=https://preview.example.com \
  -e PREVIEW_PORT_RANGE_START=4000 \
  -e PREVIEW_PORT_RANGE_END=4999 \
  --env-file .env \
  zivo-ai
```

> **Note:** Mounting `/var/run/docker.sock` gives the container (and therefore any code running inside it) the ability to create arbitrary Docker containers on the host.  See the [Security](#security) section before deploying to production.

### 2. Port forwarding / reverse proxy

Each preview is exposed on an ephemeral port in the range `[PREVIEW_PORT_RANGE_START, PREVIEW_PORT_RANGE_END]`.  The preview URL returned to the browser is:

```
${PREVIEW_BASE_URL}:${port}
```

If you want stable subdomain URLs (e.g. `preview-abc123.example.com`) you will need to configure a dynamic reverse proxy (nginx, Caddy, Traefik) and update the URL generation in `lib/preview-runner.ts`.

---

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `PREVIEW_DOCKER_IMAGE` | `node:20-alpine` | Node.js image used for preview containers |
| `PREVIEW_BASE_URL` | `http://localhost:3001` | Publicly reachable base URL of the preview host |
| `PREVIEW_PORT_RANGE_START` | `4000` | First ephemeral port |
| `PREVIEW_PORT_RANGE_END` | `4999` | Last ephemeral port (max 1000 concurrent previews) |
| `PREVIEW_NETWORK_RESTRICTED` | `false` | Set to `true` to pass `--network=none` to containers after install (breaks CDN fonts/images) |
| `PREVIEW_USE_DOCKER` | `true` | Set to `false` to use a local child-process fallback (dev/CI only) |

---

## Supabase table

Apply the migration to persist preview sessions:

```bash
supabase db push
# or run the SQL directly:
psql $DATABASE_URL < supabase/migrations/20260307000001_preview_sessions.sql
```

The `preview_sessions` table records status, URL, port, container ID, and logs.  Row Level Security ensures users can only read/write their own sessions.

---

## API reference

### `POST /api/preview/start`

**Auth:** `Authorization: Bearer <token>` required.

**Body:**
```json
{ "projectId": "<uuid>" }
```

**Response `202`:**
```json
{ "previewId": "<uuid>" }
```

Kicks off an asynchronous build.  Poll `/api/preview/status` for progress.

---

### `GET /api/preview/status?previewId=<uuid>`

**Auth:** required.

**Response `200`:**
```json
{
  "previewId": "...",
  "projectId": "...",
  "status": "queued|building|running|failed|stopped",
  "url": "http://preview.example.com:4001",
  "logs": ["[runner] Allocated port 4001", "..."],
  "error": null,
  "startedAt": "2026-03-07T10:00:00.000Z",
  "createdAt": "2026-03-07T09:59:50.000Z"
}
```

---

### `POST /api/preview/stop`

**Auth:** required.

**Body:**
```json
{ "previewId": "<uuid>" }
```

**Response `200`:**
```json
{ "message": "Preview stopped", "previewId": "..." }
```

---

## Security

> **⚠️ WARNING:** The preview runner executes arbitrary user-generated code inside Docker containers.  This carries significant risks.  Read this section carefully before deploying to a shared or production environment.

### Risks

1. **Docker socket access** — Mounting `/var/run/docker.sock` into the ZIVO-AI container effectively grants root-equivalent access to the host.  A compromised container could escape isolation.
2. **Arbitrary code execution** — LLM-generated files may contain malicious code that attempts to exfiltrate secrets, mine cryptocurrency, or attack other systems.
3. **Network egress** — By default, preview containers can make outbound network requests.

### Mitigations applied

- Containers run with `--cap-drop=ALL` (no Linux capabilities).
- `--security-opt=no-new-privileges` prevents privilege escalation.
- Memory limited to 512 MB, CPU to 0.5 cores, PID limit 100.
- `--read-only` with tmpfs mounts for `/tmp`, `node_modules`, `.next`.
- Optional `--network=none` via `PREVIEW_NETWORK_RESTRICTED=true`.
- Previews auto-expire after 30 minutes idle (in-memory reaper).

### Recommended additional hardening

- Run ZIVO-AI on a **dedicated VM or machine** that does not host other sensitive services.
- Use **Docker rootless** mode to reduce blast radius.
- Deploy a **firewall** that blocks containers from accessing your internal network.
- Use a **Docker socket proxy** (e.g. [Tecnativa/docker-socket-proxy](https://github.com/Tecnativa/docker-socket-proxy)) instead of mounting the raw socket.
- Consider **gVisor** (`--runtime=runsc`) for stronger kernel isolation.
- Regularly prune dangling containers: `docker container prune -f`.

---

## TTL and cleanup

- In-memory sessions expire after **30 minutes** of inactivity (no status/log updates).
- The background reaper runs every 5 minutes.
- On server restart, in-memory state is lost; orphaned containers must be cleaned up manually: `docker ps -a --filter name=zivo-preview`.
- Maximum **3 concurrent previews per user** (configurable in `app/api/preview/start/route.ts`).

---

## Operational notes

### Checking running previews

```bash
docker ps --filter name=zivo-preview
```

### Force-stop all previews

```bash
docker stop $(docker ps -q --filter name=zivo-preview)
```

### Viewing container logs

```bash
docker logs zivo-preview-<first-12-chars-of-previewId>
```

### npm cache

To speed up installs, mount a shared npm cache into containers:

```bash
# In preview-runner.ts startDockerContainer(), add:
`-v /tmp/zivo-npm-cache:/root/.npm`
```

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `No free preview ports available` | Port range exhausted | Increase `PREVIEW_PORT_RANGE_END` or stop idle previews |
| `Docker unavailable — using local process fallback` | `docker` CLI not found | Install Docker or add it to PATH |
| Preview stuck at `building` for > 3 min | npm install timeout in container | Check container logs; ensure outbound network access |
| `Container reported an error during startup` | Build error in generated code | Open the Code Builder and fix the error; rebuild |
| iframe shows blank / connection refused | Port not forwarded to host | Check firewall rules and `PREVIEW_BASE_URL` |
