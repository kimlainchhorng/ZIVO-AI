# ZIVO-AI Docker Deploy Agent

This document describes how to run a lightweight HTTP server on your Docker host that
ZIVO-AI can call to trigger a **repo-pull** deployment (Option A).

---

## Overview

```
ZIVO-AI workspace
      │
      │  POST /deploy  (Authorization: Bearer <token>)
      │  { projectId, repoUrl, branch, commitSha, requestedAt }
      ▼
Docker host agent (this server)
      │
      ├─ git fetch origin
      ├─ git checkout <commitSha>
      ├─ docker compose build
      └─ docker compose up -d
```

ZIVO-AI:
1. Pushes code to GitHub (`POST /api/projects/[id]/publish/github`).
2. Sends a webhook to your Docker host (`POST /api/projects/[id]/publish/docker`).
3. The agent on the Docker host clones/fetches the repo, checks out the exact commit,
   builds the images, and brings the containers up.

---

## Webhook contract

### Request

```http
POST /deploy
Authorization: Bearer <DEPLOY_TOKEN>
Content-Type: application/json

{
  "projectId":   "abc123",
  "repoUrl":     "https://github.com/owner/repo",
  "branch":      "main",
  "commitSha":   "a1b2c3d4e5f6...",
  "requestedAt": "2026-03-06T10:00:00Z"
}
```

### Response (success)

```json
{
  "status": "success",
  "log": "...(tail of docker compose output)...",
  "deployedAt": "2026-03-06T10:00:45Z"
}
```

### Response (failure)

Non-2xx HTTP status + `{ "status": "failed", "log": "..." }`.

---

## Quick-start with the sample agent

A ready-to-run Node.js agent lives in [`scripts/docker-deploy-agent/`](../../scripts/docker-deploy-agent/).

```bash
# 1. Copy to your server
scp -r scripts/docker-deploy-agent/ user@my-server:~/deploy-agent/

# 2. Set environment variables
export DEPLOY_TOKEN="$(openssl rand -hex 32)"
export REPO_WORK_DIR="/srv/app"      # where the repo is cloned/updated
export COMPOSE_FILE="docker-compose.yml"  # optional, defaults to docker-compose.yml
export PORT=3001                     # optional, defaults to 3001

# 3. Install dependencies and start
cd ~/deploy-agent
npm install
node server.js
```

Then in the ZIVO-AI workspace **Publish → Deploy to Docker**:

- **Webhook Endpoint:** `https://my-server.example.com:3001/deploy`
- **Deploy Token:** the value you set as `DEPLOY_TOKEN`

---

## Running behind nginx (HTTPS)

```nginx
server {
    listen 443 ssl;
    server_name deploy.example.com;

    ssl_certificate     /etc/letsencrypt/live/deploy.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/deploy.example.com/privkey.pem;

    location /deploy {
        proxy_pass         http://127.0.0.1:3001;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_read_timeout 120s;
    }
}
```

---

## Running as a systemd service

Create `/etc/systemd/system/zivo-deploy-agent.service`:

```ini
[Unit]
Description=ZIVO-AI Docker Deploy Agent
After=network.target docker.service

[Service]
Type=simple
User=deploy
WorkingDirectory=/home/deploy/deploy-agent
Environment=DEPLOY_TOKEN=<your-secret>
Environment=REPO_WORK_DIR=/srv/app
Environment=PORT=3001
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now zivo-deploy-agent
```

---

## Security checklist

| Concern | Mitigation |
|---------|------------|
| Token exposure | Use a strong random token (`openssl rand -hex 32`). Rotate after compromise. |
| Arbitrary repo injection | Optionally whitelist allowed `repoUrl` values via `ALLOWED_REPO_URLS` env var. |
| Command injection | The sample agent uses `execFile`/`spawnSync` with argument arrays, never `exec(string)`. |
| Privilege escalation | Run the agent as a dedicated low-privilege user that belongs to the `docker` group. |
| TLS | Always terminate TLS at nginx/Caddy. Never expose the agent directly on port 80/3001 without TLS in production. |
| Log leakage | Build logs are returned to ZIVO-AI and stored in `last_deploy_status`. Do **not** include secrets in docker compose output. |

---

## Environment variables reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DEPLOY_TOKEN` | ✅ | — | Bearer token ZIVO-AI must send |
| `REPO_WORK_DIR` | ✅ | — | Directory where the repo is cloned/fetched |
| `PORT` | ❌ | `3001` | TCP port the agent listens on |
| `COMPOSE_FILE` | ❌ | `docker-compose.yml` | Compose file name |
| `ALLOWED_REPO_URLS` | ❌ | (any) | Comma-separated list of allowed repo URLs |
| `LOG_TAIL_LINES` | ❌ | `80` | Lines of compose output included in the response |
