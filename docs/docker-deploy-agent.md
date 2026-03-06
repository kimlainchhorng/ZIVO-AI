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
