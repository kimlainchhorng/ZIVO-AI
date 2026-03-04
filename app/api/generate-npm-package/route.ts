import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export interface NpmPackageFile {
  path: string;
  content: string;
  action: "create" | "update" | "delete";
}

export interface GenerateNpmPackageRequest {
  packageName: string;
  description?: string;
  packageType?: "component" | "utility" | "hook" | "full-library";
  outputFormats?: Array<"esm" | "cjs" | "umd">;
  storybook?: boolean;
  autoPublish?: boolean;
}

export interface GenerateNpmPackageResponse {
  files: NpmPackageFile[];
  summary: string;
  setupInstructions: string;
  publishInstructions: string;
}

const NPM_PACKAGE_SYSTEM_PROMPT = `You are ZIVO AI — an expert in creating and publishing NPM packages from React components and utilities.

Generate a complete, publishable NPM package setup for a React/TypeScript library.

Respond ONLY with a valid JSON object:
{
  "files": [
    { "path": "relative/path", "content": "...", "action": "create" }
  ],
  "summary": "Brief description",
  "setupInstructions": "Step-by-step setup instructions",
  "publishInstructions": "How to publish the package"
}

Always include:
- src/index.ts — Main entry point with all exports
- tsconfig.build.json — TypeScript build configuration
- rollup.config.ts — Rollup bundler (ESM + CJS output)
- package.json — Complete with exports map, peer deps, files field
- README.md — Full documentation with usage examples
- CONTRIBUTING.md — Contribution guidelines
- .github/workflows/publish.yml — Auto-publish on GitHub release
- .changeset/config.json — Changesets versioning configuration
- .storybook/main.ts — Storybook for component packages

Use tsup or rollup for bundling. Include proper exports map for ESM/CJS.
Add peer dependencies for React and TypeScript.

Return ONLY valid JSON, no markdown fences, no extra text.`;

export async function POST(req: Request): Promise<NextResponse> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing in environment" },
        { status: 500 }
      );
    }

    let body: GenerateNpmPackageRequest;
    try {
      body = await req.json() as GenerateNpmPackageRequest;
    } catch {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }

    if (!body.packageName) {
      return NextResponse.json({ error: "packageName is required" }, { status: 400 });
    }

    const {
      packageName,
      description = "",
      packageType = "utility",
      outputFormats = ["esm", "cjs"],
      storybook = true,
      autoPublish = true,
    } = body;

    const userPrompt = `Generate a publishable NPM package named "${packageName}".
Description: ${description || "A reusable React library"}
Package type: ${packageType}
Output formats: ${outputFormats.join(", ")}
Storybook: ${storybook}
Auto-publish on release: ${autoPublish}

Generate:
1. Package source (src/index.ts) with exported components/utilities
2. TypeScript build config (tsconfig.build.json)
3. Rollup/tsup bundler config for ${outputFormats.join(" + ")} output
4. Complete package.json with exports map and peer dependencies
5. README.md with installation, usage examples, and API reference
6. CONTRIBUTING.md with development setup
7. GitHub Actions publish workflow (.github/workflows/publish.yml)
8. Changesets configuration for versioning
${storybook ? "9. Storybook setup for visual documentation" : ""}`;

    const response = await getClient().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      max_tokens: 8192,
      messages: [
        { role: "system", content: NPM_PACKAGE_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const text = response.choices?.[0]?.message?.content ?? "";

    let parsed: GenerateNpmPackageResponse;
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
