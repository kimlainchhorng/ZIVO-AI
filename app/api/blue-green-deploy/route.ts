import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface BlueGreenRequest {
  appName?: string;
  image?: string;
  port?: number;
  replicas?: number;
}

interface BlueGreenFile {
  path: string;
  content: string;
}

interface BlueGreenResponse {
  files: BlueGreenFile[];
  summary: string;
  switchoverCommand: string;
  rollbackCommand: string;
}

function generateDockerCompose(appName: string, image: string, port: number): string {
  const blueHostPort = port + 1;
  const greenHostPort = port + 2;
  return `version: "3.9"

# Blue/Green deployment for ${appName}
# Active slot is controlled by the nginx upstream configuration.
# To switch traffic: update nginx/nginx.conf upstream and run: docker-compose exec nginx nginx -s reload

services:
  # ── Blue slot ──────────────────────────────────────────────────────────────
  app-blue:
    image: ${image}
    container_name: ${appName}-blue
    restart: unless-stopped
    ports:
      - "${blueHostPort}:${port}"
    environment:
      - NODE_ENV=production
      - SLOT=blue
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:${port}/api/health"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 30s
    networks:
      - app-network

  # ── Green slot ─────────────────────────────────────────────────────────────
  app-green:
    image: ${image}
    container_name: ${appName}-green
    restart: unless-stopped
    ports:
      - "${greenHostPort}:${port}"
    environment:
      - NODE_ENV=production
      - SLOT=green
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:${port}/api/health"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 30s
    networks:
      - app-network

  # ── Nginx load balancer ────────────────────────────────────────────────────
  nginx:
    image: nginx:alpine
    container_name: ${appName}-nginx
    restart: unless-stopped
    ports:
      - "${port}:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      app-blue:
        condition: service_healthy
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
`;
}

function generateNginxConfig(appName: string, activeSlot: "blue" | "green"): string {
  const inactiveSlot = activeSlot === "blue" ? "green" : "blue";
  return `# Nginx load balancer configuration for ${appName} blue/green deployment
# Active slot: ${activeSlot}
# To switch to ${inactiveSlot}: change upstream to app-${inactiveSlot} and reload nginx

events {
  worker_connections 1024;
}

http {
  upstream active_app {
    # Switch between app-blue and app-green to control active slot
    server app-${activeSlot}:3000;
    keepalive 32;
  }

  upstream app-blue {
    server app-blue:3000;
    keepalive 16;
  }

  upstream app-green {
    server app-green:3000;
    keepalive 16;
  }

  server {
    listen 80;
    server_name _;

    # Health check endpoint for the load balancer itself
    location /nginx-health {
      access_log off;
      return 200 "healthy\\n";
      add_header Content-Type text/plain;
    }

    # Proxy all traffic to the active slot
    location / {
      proxy_pass http://active_app;
      proxy_http_version 1.1;
      proxy_set_header Upgrade \\$http_upgrade;
      proxy_set_header Connection "upgrade";
      proxy_set_header Host \\$host;
      proxy_set_header X-Real-IP \\$remote_addr;
      proxy_set_header X-Forwarded-For \\$proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto \\$scheme;
      proxy_set_header X-Active-Slot ${activeSlot};
      proxy_cache_bypass \\$http_upgrade;
      proxy_read_timeout 60s;
      proxy_connect_timeout 10s;
    }
  }
}
`;
}

function generateSwitchoverScript(appName: string): string {
  return `#!/usr/bin/env bash
# Blue/Green switchover script for ${appName}
# Usage: ./scripts/switchover.sh [blue|green]

set -euo pipefail

TARGET_SLOT="\${1:-}"

if [[ -z "\$TARGET_SLOT" ]]; then
  echo "Usage: \$0 [blue|green]"
  exit 1
fi

if [[ "\$TARGET_SLOT" != "blue" && "\$TARGET_SLOT" != "green" ]]; then
  echo "Error: slot must be 'blue' or 'green'"
  exit 1
fi

echo "→ Switching active slot to: \$TARGET_SLOT"

# 1. Verify target slot is healthy before switching
echo "→ Checking health of \$TARGET_SLOT slot..."
CONTAINER_NAME="${appName}-\${TARGET_SLOT}"
if ! docker exec "\$CONTAINER_NAME" curl -sf http://localhost:3000/api/health > /dev/null 2>&1; then
  echo "✗ Health check failed for \$TARGET_SLOT slot. Aborting switchover."
  exit 1
fi
echo "✓ \$TARGET_SLOT slot is healthy"

# 2. Update nginx config to point to the target slot
echo "→ Updating nginx upstream to \$TARGET_SLOT..."
sed -i "s/server app-[a-z]*:3000/server app-\${TARGET_SLOT}:3000/" nginx/nginx.conf

# 3. Reload nginx without downtime
echo "→ Reloading nginx..."
docker-compose exec nginx nginx -s reload

echo "✓ Traffic switched to \$TARGET_SLOT slot"
echo "→ Previous slot can now be safely updated or stopped"
`;
}

function generateRollbackScript(appName: string): string {
  return `#!/usr/bin/env bash
# Blue/Green rollback script for ${appName}
# Usage: ./scripts/rollback.sh

set -euo pipefail

echo "→ Detecting current active slot..."
CURRENT_SLOT=\$(grep -oP "server app-\\K[a-z]+" nginx/nginx.conf | head -1)
ROLLBACK_SLOT=\$([[ "\$CURRENT_SLOT" == "blue" ]] && echo "green" || echo "blue")

echo "→ Current slot: \$CURRENT_SLOT"
echo "→ Rolling back to: \$ROLLBACK_SLOT"

# Check rollback slot is healthy
if ! docker exec "${appName}-\${ROLLBACK_SLOT}" curl -sf http://localhost:3000/api/health > /dev/null 2>&1; then
  echo "✗ Rollback slot \$ROLLBACK_SLOT is not healthy. Manual intervention required."
  exit 1
fi

# Switch to rollback slot
sed -i "s/server app-[a-z]*:3000/server app-\${ROLLBACK_SLOT}:3000/" nginx/nginx.conf
docker-compose exec nginx nginx -s reload

echo "✓ Rolled back to \$ROLLBACK_SLOT slot"
`;
}

export async function GET() {
  return NextResponse.json({
    description:
      "Blue/Green deployment config generator. POST { appName, image, port, replicas } to generate docker-compose, nginx config, and switchover scripts.",
  });
}

export async function POST(req: Request): Promise<Response> {
  try {
    const body = (await req.json().catch(() => ({}))) as BlueGreenRequest;
    const {
      appName = "my-app",
      image = "my-app:latest",
      port = 3000,
    } = body;

    const dockerCompose = generateDockerCompose(appName, image, port);
    const nginxConfig = generateNginxConfig(appName, "blue");
    const switchoverScript = generateSwitchoverScript(appName);
    const rollbackScript = generateRollbackScript(appName);

    const result: BlueGreenResponse = {
      files: [
        { path: "docker-compose.blue-green.yml", content: dockerCompose },
        { path: "nginx/nginx.conf", content: nginxConfig },
        { path: "scripts/switchover.sh", content: switchoverScript },
        { path: "scripts/rollback.sh", content: rollbackScript },
      ],
      summary: `Generated blue/green deployment for "${appName}" with Docker Compose + Nginx load balancer. Blue slot is active by default.`,
      switchoverCommand: "bash scripts/switchover.sh green",
      rollbackCommand: "bash scripts/rollback.sh",
    };

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
