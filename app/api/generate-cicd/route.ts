import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

function getClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export interface CiCdFile {
  path: string;
  content: string;
  action: "create" | "update" | "delete";
}

export interface GenerateCiCdRequest {
  platform?: "github-actions" | "gitlab-ci" | "circleci" | "docker" | "all";
  appName?: string;
  nodeVersion?: string;
  hasTests?: boolean;
  deployTarget?: string;
}

export interface GenerateCiCdResponse {
  files: CiCdFile[];
  summary: string;
  guide: string;
}

const CICD_SYSTEM_PROMPT = `You are ZIVO AI — a DevOps and CI/CD expert.

Generate production-ready CI/CD pipeline configuration files for a Next.js App Router project.

Respond ONLY with a valid JSON object:
{
  "files": [
    { "path": "relative/path", "content": "...", "action": "create" }
  ],
  "summary": "Brief description",
  "guide": "Step-by-step setup guide"
}

Include all requested pipelines:
- GitHub Actions: ci.yml (lint+typecheck+test on PR), deploy-preview.yml, deploy-prod.yml, security.yml, release.yml
- GitLab CI: .gitlab-ci.yml with stages: test, build, deploy
- CircleCI: .circleci/config.yml
- Docker: multi-stage Dockerfile + docker-compose.yml + docker-compose.prod.yml

Return ONLY valid JSON, no markdown fences, no extra text.`;

export async function POST(req: Request): Promise<Response> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing in environment" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const {
      platform = "all",
      appName = "my-app",
      nodeVersion = "20",
      hasTests = true,
      deployTarget = "vercel",
    }: GenerateCiCdRequest = body;

    const userPrompt = `Generate CI/CD pipeline configuration for a Next.js App Router project.
App name: ${appName}
Node.js version: ${nodeVersion}
Platform(s): ${platform}
Has tests: ${hasTests}
Deploy target: ${deployTarget}

Include semantic versioning and changelog generation in the release pipeline.`;

    const response = await getClient().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      max_tokens: 6000,
      messages: [
        { role: "system", content: CICD_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const text = response.choices?.[0]?.message?.content ?? "";

    let parsed: GenerateCiCdResponse;
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
