import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export interface DeployFile {
  path: string;
  content: string;
  action: "create" | "update" | "delete";
}

export interface GenerateDeployRequest {
  platforms?: Array<"vercel" | "docker" | "github-actions" | "aws" | "railway" | "cloudflare" | "netlify">;
  appName?: string;
  nodeVersion?: string;
}

export interface GenerateDeployResponse {
  files: DeployFile[];
  summary: string;
  deploymentGuide: string;
}

const DEPLOY_SYSTEM_PROMPT = `You are ZIVO AI — an expert in cloud deployment and DevOps.

Generate production-ready deployment configuration files for a Next.js App Router project.

Respond ONLY with a valid JSON object:
{
  "files": [
    { "path": "relative/path", "content": "...", "action": "create" }
  ],
  "summary": "Brief description",
  "deploymentGuide": "Step-by-step deployment guide"
}

Generate configs for all requested platforms:
- Vercel: vercel.json with environment variable setup
- Docker: Dockerfile (multi-stage, production-optimized) + docker-compose.yml
- GitHub Actions: .github/workflows/deploy.yml (CI/CD pipeline)
- AWS: Elastic Beanstalk / Lambda / ECS config files
- Railway/Render: railway.json or render.yaml
- Cloudflare Pages: wrangler.toml + .github/workflows/cloudflare.yml
- Netlify: netlify.toml (with build settings, redirects, headers) + _redirects file

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
      platforms = ["vercel", "docker", "github-actions"],
      appName = "my-app",
      nodeVersion = "20",
    }: GenerateDeployRequest = body;

    const userPrompt = `Generate deployment configuration files for a Next.js App Router project.
App name: ${appName}
Node.js version: ${nodeVersion}
Target platforms: ${platforms.join(", ")}

Include:
${platforms.includes("vercel") ? "- vercel.json with environment variable configuration\n" : ""}${platforms.includes("docker") ? "- Dockerfile (multi-stage, production-optimized for Next.js)\n- docker-compose.yml with Redis and PostgreSQL services\n" : ""}${platforms.includes("github-actions") ? "- .github/workflows/deploy.yml (test, build, deploy pipeline)\n" : ""}${platforms.includes("aws") ? "- .ebextensions/ for Elastic Beanstalk\n- aws/task-definition.json for ECS\n" : ""}${platforms.includes("railway") ? "- railway.json for Railway deployment\n- render.yaml for Render deployment\n" : ""}${platforms.includes("cloudflare") ? "- wrangler.toml for Cloudflare Pages configuration\n- .github/workflows/cloudflare.yml for Cloudflare Pages CI/CD\n" : ""}${platforms.includes("netlify") ? "- netlify.toml with build settings, redirects, and headers\n- _redirects file for SPA routing\n" : ""}`;

    const response = await getClient().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      max_tokens: 8192,
      messages: [
        { role: "system", content: DEPLOY_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const text = response.choices?.[0]?.message?.content ?? "";

    let parsed: GenerateDeployResponse;
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
