import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export interface DeploymentFile {
  path: string;
  content: string;
  action: "create" | "update" | "delete";
}

export interface GenerateDeploymentRequest {
  platform?: "vercel" | "docker" | "railway" | "fly" | "aws-amplify";
  features?: string[];
  appName?: string;
  framework?: string;
}

export interface GenerateDeploymentResponse {
  files: DeploymentFile[];
  summary: string;
  deploymentSteps: string[];
  envVars: string[];
}

const DEPLOYMENT_SYSTEM_PROMPT = `You are ZIVO AI — an expert in DevOps, deployment, and CI/CD pipelines.

Generate complete deployment configuration for a Next.js App Router project.

Respond ONLY with a valid JSON object:
{
  "files": [
    { "path": "relative/path", "content": "...", "action": "create" }
  ],
  "summary": "Brief description",
  "deploymentSteps": ["Step 1: ...", "Step 2: ..."],
  "envVars": ["VARIABLE_NAME=description"]
}

Always include:
- Platform-specific config file
- .github/workflows/ci.yml — CI pipeline (lint, typecheck, test, build)
- .github/workflows/deploy.yml — Deploy on push to main
- .env.example — Required environment variables template

Return ONLY valid JSON, no markdown fences, no extra text.`;

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing in environment" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const {
      platform = "vercel",
      features = ["preview-deployments", "env-management"],
      appName = "My App",
      framework = "nextjs",
    }: GenerateDeploymentRequest = body;

    const featureList = Array.isArray(features) ? features : [];
    const hasDocker = platform === "docker" || featureList.includes("docker");
    const hasPreviewDeployments = featureList.includes("preview-deployments");
    const hasCDN = featureList.includes("cdn");
    const hasCustomDomain = featureList.includes("custom-domain");

    const platformInstructions: Record<string, string> = {
      vercel: "Generate vercel.json with rewrites/headers config, build settings, and environment variable references. Include GitHub Actions that run `vercel --prod` on main branch.",
      docker: "Generate a multi-stage Dockerfile (node:20-alpine builder + runner), docker-compose.yml for local dev with hot reload, and .dockerignore. Include GitHub Actions that build and push to Docker Hub or GitHub Container Registry.",
      railway: "Generate railway.toml with build and deploy config. Include GitHub Actions that deploy to Railway using RAILWAY_TOKEN on push to main.",
      fly: "Generate fly.toml with app config, regions, and scaling rules. Include Dockerfile for Fly.io. Include GitHub Actions with flyctl deploy on push to main.",
      "aws-amplify": "Generate amplify.yml build spec with pre-build, build, and post-build phases. Include amplifyignore file. Include GitHub Actions that trigger Amplify webhook on push to main.",
    };

    const userPrompt = `Generate deployment configuration for "${appName}" (${framework}).
Platform: ${platform}
Platform instructions: ${platformInstructions[platform] ?? platformInstructions["vercel"]}
Features: ${featureList.join(", ")}

${hasDocker ? "Include multi-stage Dockerfile and docker-compose.yml." : ""}
${hasPreviewDeployments ? "Configure preview deployments for pull requests." : ""}
${hasCDN ? "Configure CDN caching headers and static asset optimization." : ""}
${hasCustomDomain ? "Include custom domain configuration and SSL setup instructions." : ""}

Generate:
1. Platform configuration file (vercel.json / fly.toml / railway.toml / amplify.yml)
2. .github/workflows/ci.yml — CI: lint (eslint), typecheck (tsc), build (next build), cache node_modules
3. .github/workflows/deploy.yml — Deploy on push to main branch
4. ${hasDocker ? "Dockerfile (multi-stage: builder + runner) and docker-compose.yml\n5. " : ""}.env.example with all required environment variables
${hasDocker ? "6. .dockerignore" : "5. README section explaining deployment steps"}`;

    const response = await getClient().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      max_tokens: 8192,
      messages: [
        { role: "system", content: DEPLOYMENT_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const text = response.choices?.[0]?.message?.content ?? "";

    let parsed: GenerateDeploymentResponse;
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) {
        return NextResponse.json(
          { error: "AI did not return valid JSON" },
          { status: 502 }
        );
      }
      parsed = JSON.parse(match[0]);
    }

    if (!Array.isArray(parsed.files)) {
      return NextResponse.json(
        { error: "Invalid response structure: missing files array" },
        { status: 502 }
      );
    }

    return NextResponse.json(parsed);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error)?.message || "Server error" },
      { status: 500 }
    );
  }
}
