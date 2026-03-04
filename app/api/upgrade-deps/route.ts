import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

function getClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export interface UpgradeDepsRequest {
  packageJson: string;
  targetVersions?: Record<string, string>;
}

export interface UpgradeDepsResponse {
  updatedPackageJson: string;
  migrationNotes: string[];
  codemods: Array<{ package: string; script: string; description: string }>;
  breakingChanges: Array<{ package: string; from: string; to: string; description: string }>;
  summary: string;
}

const UPGRADE_DEPS_SYSTEM_PROMPT = `You are a Node.js upgrade expert specializing in migration guides.

Given a package.json (and optional target versions), generate an upgrade plan.

Respond ONLY with a valid JSON object:
{
  "updatedPackageJson": "<full updated package.json string>",
  "migrationNotes": ["Note 1", "Note 2"],
  "codemods": [
    { "package": "react", "script": "npx react-codemod ...", "description": "Migrate class components" }
  ],
  "breakingChanges": [
    { "package": "next", "from": "14.0.0", "to": "15.0.0", "description": "App Router changes" }
  ],
  "summary": "Upgrade summary"
}

Rules:
- Bump all dependencies to their latest stable versions
- Identify breaking changes for major version bumps
- Provide codemod scripts where available (react-codemod, next-codemod, etc.)
- Keep devDependencies separate
- Preserve all existing scripts and fields in package.json
- Return ONLY valid JSON, no markdown fences.`;

export async function POST(req: Request): Promise<Response> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing in environment" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { packageJson, targetVersions = {} }: UpgradeDepsRequest = body;

    if (!packageJson || typeof packageJson !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid packageJson string" },
        { status: 400 }
      );
    }

    try {
      JSON.parse(packageJson);
    } catch {
      return NextResponse.json(
        { error: "packageJson is not valid JSON" },
        { status: 400 }
      );
    }

    const targetContext =
      Object.keys(targetVersions).length > 0
        ? `\n\nTarget versions to use:\n${JSON.stringify(targetVersions, null, 2)}`
        : "";

    const response = await getClient().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.1,
      max_tokens: 4096,
      messages: [
        { role: "system", content: UPGRADE_DEPS_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Generate upgrade plan for:\n${packageJson}${targetContext}`,
        },
      ],
    });

    const text = response.choices?.[0]?.message?.content ?? "";

    let parsed: UpgradeDepsResponse;
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

    return NextResponse.json(parsed);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error)?.message || "Server error" },
      { status: 500 }
    );
  }
}
