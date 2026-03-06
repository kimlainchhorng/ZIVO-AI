'use client';

import { useState } from "react";

export interface DeployConfig {
  appName: string;
  nodeVersion?: string;
}

interface DeployTarget {
  id: string;
  name: string;
  logo: string;
  color: string;
  description: string;
  configFile: string;
  deployUrl: string;
}

const DEPLOY_TARGETS: DeployTarget[] = [
  {
    id: "vercel",
    name: "Vercel",
    logo: "▲",
    color: "#000000",
    description: "Zero-config Next.js deployment",
    configFile: "vercel.json",
    deployUrl: "https://vercel.com/new",
  },
  {
    id: "netlify",
    name: "Netlify",
    logo: "◆",
    color: "#00ad9f",
    description: "CDN-first web platform",
    configFile: "netlify.toml",
    deployUrl: "https://app.netlify.com/start",
  },
  {
    id: "railway",
    name: "Railway",
    logo: "🚂",
    color: "#7c3aed",
    description: "Deploy from GitHub in seconds",
    configFile: "railway.json",
    deployUrl: "https://railway.app/new",
  },
  {
    id: "render",
    name: "Render",
    logo: "■",
    color: "#46e3b7",
    description: "Cloud for fast-growing teams",
    configFile: "render.yaml",
    deployUrl: "https://dashboard.render.com/select-repo",
  },
  {
    id: "flyio",
    name: "Fly.io",
    logo: "✈",
    color: "#7c3aed",
    description: "Run apps close to users worldwide",
    configFile: "fly.toml",
    deployUrl: "https://fly.io/app/new",
  },
  {
    id: "aws",
    name: "AWS Amplify",
    logo: "☁",
    color: "#ff9900",
    description: "Full-stack hosting on AWS",
    configFile: "amplify.yml",
    deployUrl: "https://console.aws.amazon.com/amplify/home",
  },
];

const CONFIG_TEMPLATES: Record<string, (cfg: DeployConfig) => string> = {
  vercel: (cfg) => JSON.stringify({
    name: cfg.appName,
    framework: "nextjs",
    buildCommand: "npm run build",
    outputDirectory: ".next",
    devCommand: "npm run dev",
    installCommand: "npm ci",
    env: { NODE_VERSION: cfg.nodeVersion ?? "20" },
  }, null, 2),

  netlify: (cfg) => `[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "${cfg.nodeVersion ?? "20"}"

[[plugins]]
  package = "@netlify/plugin-nextjs"
`,

  railway: (_cfg) => JSON.stringify({
    "$schema": "https://railway.app/railway.schema.json",
    build: { builder: "NIXPACKS" },
    deploy: {
      startCommand: "npm start",
      healthcheckPath: "/",
    },
  }, null, 2),

  render: (cfg) => `services:
  - type: web
    name: ${cfg.appName}
    env: node
    buildCommand: npm ci && npm run build
    startCommand: npm start
    healthCheckPath: /
    envVars:
      - key: NODE_VERSION
        value: "${cfg.nodeVersion ?? "20"}"
`,

  flyio: (cfg) => `app = "${cfg.appName}"
primary_region = "iad"

[build]
  dockerfile = "Dockerfile"

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 512
`,

  aws: () => `version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
`,
};

function downloadConfig(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function DeployButtons({ config = { appName: "my-app" } }: { config?: DeployConfig }): React.ReactElement {
  const [generating, setGenerating] = useState<string | null>(null);
  const [generated, setGenerated] = useState<Set<string>>(new Set());

  const handleDeploy = async (target: DeployTarget) => {
    setGenerating(target.id);
    try {
      const template = CONFIG_TEMPLATES[target.id];
      const content = template ? template(config) : `# ${target.name} config for ${config.appName}\n`;
      downloadConfig(target.configFile, content);
      setGenerated((prev) => new Set([...prev, target.id]));
      // Open deploy URL after short delay
      setTimeout(() => {
        window.open(target.deployUrl, "_blank", "noopener,noreferrer");
      }, 500);
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: "0.75rem",
        fontFamily: "'Inter',system-ui,sans-serif",
      }}
    >
      {DEPLOY_TARGETS.map((target) => {
        const isGenerating = generating === target.id;
        const isDone = generated.has(target.id);

        return (
          <button
            key={target.id}
            onClick={() => handleDeploy(target)}
            disabled={isGenerating}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              padding: "1rem",
              background: isDone ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${isDone ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.08)"}`,
              borderRadius: 10,
              cursor: isGenerating ? "not-allowed" : "pointer",
              textAlign: "left",
              transition: "border-color 0.15s, background 0.15s",
              opacity: isGenerating ? 0.7 : 1,
              color: "#f1f5f9",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "1.25rem" }}>{target.logo}</span>
              <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{target.name}</span>
              {isDone && <span style={{ marginLeft: "auto", color: "#10b981", fontSize: "0.8rem" }}>✓</span>}
            </div>
            <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{target.description}</span>
            <span style={{ fontSize: "0.7rem", color: "#475569", fontFamily: "monospace" }}>
              {isGenerating ? "Generating…" : isDone ? `↓ ${target.configFile}` : `Generate ${target.configFile}`}
            </span>
          </button>
        );
      })}
    </div>
  );
}
