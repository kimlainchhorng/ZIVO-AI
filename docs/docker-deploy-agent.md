# Docker Deploy Agent — Server Requirements

This document describes what is required on the Docker-hosted server side to support:
1. **Custom domains + TLS** (Let's Encrypt via ACME)
2. **Deploy rollbacks** (webhook endpoint)
3. **Team-aware deploys** (no extra requirements; permissions are enforced in the app layer)

---

## 1. Custom Domains + TLS

### Overview

ZIVO-AI stores domain configuration (`project_domains` table) and guides users through DNS setup. TLS
provisioning and HTTPS termination happen on the **Docker server** using a reverse proxy with automatic
ACME certificate management.

### Recommended Stack

| Component | Recommended | Notes |
|-----------|-------------|-------|
| Reverse proxy | **Caddy 2** | Native automatic HTTPS (Let's Encrypt + ZeroSSL) |
| Alternative | Nginx + Certbot | Manual cert renewal via cron |
| Container runtime | Docker 24+ / Docker Compose v2 | Required |

### DNS Records (User Must Configure)

Before the app can mark a domain as `active`, the user must add **both** DNS records at their registrar:

| Type | Name | Value |
|------|------|-------|
| CNAME | `<subdomain>` | `proxy.zivo-ai.app` |
| TXT | `_zivo-verify.<subdomain>` | `<verification_token>` (shown in the Domains tab) |

The app performs TXT-record verification via Cloudflare DNS-over-HTTPS at the point the user clicks **Verify**.

### Caddy Configuration

```caddyfile
# /etc/caddy/Caddyfile  (or Caddy JSON config)

# Wildcard catch-all — proxies to the ZIVO-AI app container
{
  email tls@your-org.com
}

# Per-project domain block (generated dynamically or added manually)
app.customer.com {
  reverse_proxy zivo-app:3000
  # Caddy automatically provisions a TLS cert for this domain
}
```

For **fully automated** domain onboarding (on-demand TLS), use [Caddy's `on_demand` TLS](https://caddyserver.com/docs/automatic-https#on-demand-tls):

```caddyfile
{
  on_demand_tls {
    ask http://zivo-app:3000/api/domains/check-allowed
    interval 2m
    burst 5
  }
}

:443 {
  tls {
    on_demand
  }
  reverse_proxy zivo-app:3000
}
```

`/api/domains/check-allowed` should return `200` only if the requested domain is in `project_domains`
with `status = 'active'`.

---

## 2. Deploy Rollbacks — Webhook Endpoint

When a user triggers a rollback in the UI, ZIVO-AI calls `DOCKER_DEPLOY_WEBHOOK_URL` (set in your
environment) with a JSON payload. Your Docker server must expose this endpoint.

### Environment Variable

```
DOCKER_DEPLOY_WEBHOOK_URL=https://deploy-agent.your-server.com/webhook
```

### Webhook Payload (POST JSON)

```json
{
  "project_id": "uuid",
  "commit_sha": "abc1234def5678...",
  "deploy_url": "https://app.customer.com",
  "rollback": true
}
```

### Expected Response

| Status | Meaning |
|--------|---------|
| `2xx` | Rollback accepted / queued |
| `4xx` / `5xx` | Rollback failed (recorded as `error` in ZIVO-AI) |

### Minimal Webhook Server (Node.js example)

```js
import express from 'express';
import { execSync } from 'child_process';

const app = express();
app.use(express.json());

app.post('/webhook', (req, res) => {
  const { project_id, commit_sha, rollback } = req.body;
  if (!project_id) return res.status(400).json({ error: 'Missing project_id' });

  try {
    if (rollback && commit_sha) {
      // Checkout the specific SHA and rebuild the container
      execSync(`docker-compose -p ${project_id} pull && docker-compose -p ${project_id} up -d`);
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(4000, () => console.log('Deploy agent listening on :4000'));
```

> **Security:** Protect the webhook with a shared secret header (e.g. `X-Webhook-Secret`).
> Validate it on both the app side (set `DOCKER_WEBHOOK_SECRET`) and the agent side.

---

## 3. Status Flow

```
pending_dns  →  (user adds DNS records)
             →  pending_tls   (DNS TXT verified)
             →  active        (TLS cert issued by Caddy/Certbot)
             →  error         (verification or TLS failed)
```

The app currently advances `pending_dns → pending_tls` automatically on verify.
Advancing from `pending_tls → active` can be triggered by:
- A webhook callback from your Caddy/Nginx automation, or
- Manual update via `PATCH /api/projects/:id/domains/:domainId` with `{ "status": "active" }`.

---

## 4. Environment Variables Summary

| Variable | Required | Description |
|----------|----------|-------------|
| `DOCKER_DEPLOY_WEBHOOK_URL` | No | URL of your deploy agent webhook |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
# Docker Deploy Agent

A lightweight reference webhook server that runs on your Docker host and
receives deploy triggers from the ZIVO-AI **Publish → Deploy to Docker** flow.

---

## How it works

```
ZIVO-AI (POST /api/projects/[id]/publish/docker)
   │
   │  POST { repoUrl, branch, zipUrl, projectId }
   │  Authorization: Bearer <your-deploy-token>
   ▼
Docker Deploy Agent (your server)
   │
   ├── Verifies token
   ├── Clones / pulls the GitHub repo  OR  downloads the export ZIP
   ├── Runs docker compose up --build -d
   └── Returns { status, message, commitSha }
```

---

## Quick start (Node.js / Express)

### 1. Prerequisites

- Node.js ≥ 18
- Docker + Docker Compose installed on the host
- A GitHub repo URL **or** network access back to your ZIVO-AI instance
  (for the ZIP download URL)

### 2. Create the agent

```bash
mkdir zivo-docker-agent && cd zivo-docker-agent
npm init -y
npm install express
```

Create `agent.js`:

```js
// zivo-docker-agent/agent.js
import express from 'express';
import { execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

const PORT = process.env.PORT ?? 4242;
const DEPLOY_TOKEN = process.env.DEPLOY_TOKEN;   // Required
const WORKDIR = process.env.WORKDIR ?? '/opt/zivo-deploys';

if (!DEPLOY_TOKEN) {
  console.error('ERROR: DEPLOY_TOKEN env var is required');
  process.exit(1);
}

const app = express();
app.use(express.json());

app.post('/deploy', (req, res) => {
  // ── 1. Auth ──────────────────────────────────────────────────────────────
  const auth = req.headers.authorization ?? '';
  if (auth !== `Bearer ${DEPLOY_TOKEN}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { repoUrl, branch = 'main', zipUrl, projectId } = req.body;

  if (!repoUrl && !zipUrl) {
    return res.status(400).json({ error: 'repoUrl or zipUrl is required' });
  }

  const projectDir = path.join(WORKDIR, projectId ?? 'default');
  let commitSha = '';
  const logs = [];

  try {
    // ── 2. Pull code ────────────────────────────────────────────────────────
    if (repoUrl) {
      if (fs.existsSync(path.join(projectDir, '.git'))) {
        run(`git -C ${projectDir} fetch origin`);
        run(`git -C ${projectDir} checkout ${branch}`);
        run(`git -C ${projectDir} reset --hard origin/${branch}`);
      } else {
        fs.mkdirSync(projectDir, { recursive: true });
        run(`git clone --branch ${branch} --depth 1 ${repoUrl} ${projectDir}`);
      }
      commitSha = run(`git -C ${projectDir} rev-parse HEAD`).trim();
      logs.push(`Pulled ${repoUrl}@${branch} (${commitSha.slice(0, 7)})`);
    } else {
      // Download ZIP export using fetch (avoids shell injection with user-supplied URLs)
      fs.mkdirSync(projectDir, { recursive: true });
      const zipRes = await fetch(zipUrl, { headers: { Authorization: `Bearer ${DEPLOY_TOKEN}` } });
      if (!zipRes.ok) throw new Error(`ZIP download failed: ${zipRes.status}`);
      const zipBuf = Buffer.from(await zipRes.arrayBuffer());
      const tmpZip = `/tmp/zivo-export-${Date.now()}.zip`;
      fs.writeFileSync(tmpZip, zipBuf);
      run(`unzip -o ${tmpZip} -d ${projectDir}`);
      fs.unlinkSync(tmpZip);
      logs.push(`Extracted ZIP from ZIVO-AI`);
    }

    // ── 3. Build & start ────────────────────────────────────────────────────
    const composeFile = path.join(projectDir, 'docker-compose.yml');
    if (fs.existsSync(composeFile)) {
      run(`docker compose -f ${composeFile} up --build -d`);
      logs.push('docker compose up --build -d: OK');
    } else {
      logs.push('No docker-compose.yml found; skipping container start');
    }

    return res.json({ status: 'ok', message: 'Deploy succeeded', commitSha, logs });
  } catch (err) {
    return res.status(500).json({ error: err.message, logs });
  }
});

function run(cmd) {
  return execSync(cmd, { stdio: ['ignore', 'pipe', 'pipe'] }).toString();
}

app.listen(PORT, () => console.log(`ZIVO Docker Agent listening on :${PORT}`));
```

`package.json`:

```json
{
  "type": "module",
  "scripts": { "start": "node agent.js" }
}
```

### 3. Environment variables

| Variable       | Description                                      | Required |
|----------------|--------------------------------------------------|----------|
| `DEPLOY_TOKEN` | Shared secret; must match what you enter in ZIVO | ✅        |
| `PORT`         | Port the agent listens on (default 4242)         |          |
| `WORKDIR`      | Directory where projects are checked out         |          |

### 4. Run

```bash
DEPLOY_TOKEN=supersecret node agent.js
```

Or with Docker Compose on the host itself:

```yaml
# docker-compose.agent.yml
services:
  zivo-agent:
    image: node:20-alpine
    working_dir: /app
    volumes:
      - ./zivo-docker-agent:/app
      - /var/run/docker.sock:/var/run/docker.sock
      - /opt/zivo-deploys:/opt/zivo-deploys
    command: node agent.js
    ports:
      - "4242:4242"
    environment:
      DEPLOY_TOKEN: supersecret
      WORKDIR: /opt/zivo-deploys
    restart: unless-stopped
```

```bash
docker compose -f docker-compose.agent.yml up -d
```

---

## ZIVO-AI side configuration

In your project's **Publish** tab:

| Field                        | Value                                   |
|------------------------------|-----------------------------------------|
| Docker deploy endpoint URL   | `https://<your-server>:4242/deploy`     |
| Deploy token                 | The same value as `DEPLOY_TOKEN` above  |

Click **Deploy** — ZIVO-AI will POST the payload to your agent and show the
status response.

---

## Security notes

- Use HTTPS (or a reverse proxy with TLS) to protect the token in transit.
- Scope `DEPLOY_TOKEN` to a hard-to-guess random string (`openssl rand -hex 32`).
- The GitHub PAT you enter in the Push-to-GitHub panel is **never** sent to
  the Docker agent; the agent only receives the public `repoUrl`.
- If your agent server is not publicly reachable, the ZIP URL option will not
  work unless ZIVO-AI is also on the same private network.

---

## Expected response shape

```json
{
  "status": "ok",
  "message": "Deploy succeeded",
  "commitSha": "abc1234...",
  "logs": ["Pulled https://github.com/...", "docker compose up --build -d: OK"]
}
```

Any `4xx` / `5xx` response or a body containing `{ "error": "..." }` will be
treated as a failed deploy by ZIVO-AI.
