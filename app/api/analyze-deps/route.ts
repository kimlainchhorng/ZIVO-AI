import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

function getClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export interface DependencyInfo {
  name: string;
  currentVersion: string;
  latestVersion?: string;
  isOutdated: boolean;
  isUnused: boolean;
  bundleSize?: string;
  vulnerabilities: number;
  alternatives?: string[];
  description?: string;
}

export interface AnalyzeDepsRequest {
  packageJson: string;
}

export interface AnalyzeDepsResponse {
  dependencies: DependencyInfo[];
  devDependencies: DependencyInfo[];
  summary: string;
  recommendations: string[];
  totalVulnerabilities: number;
  estimatedBundleSize: string;
}

const ANALYZE_DEPS_SYSTEM_PROMPT = `You are a Node.js dependency expert.

Analyze the given package.json and respond ONLY with a valid JSON object:
{
  "dependencies": [
    {
      "name": "package-name",
      "currentVersion": "1.0.0",
      "latestVersion": "2.0.0",
      "isOutdated": true,
      "isUnused": false,
      "bundleSize": "45 kB",
      "vulnerabilities": 0,
      "alternatives": ["lighter-alternative"],
      "description": "What this package does"
    }
  ],
  "devDependencies": [...],
  "summary": "Overall analysis",
  "recommendations": ["Update X to Y", "Replace A with B for smaller bundle"],
  "totalVulnerabilities": 0,
  "estimatedBundleSize": "450 kB"
}

For each dependency provide:
- Latest stable version
- Whether it appears outdated (current version < latest)
- Approximate gzipped bundle size contribution
- Known vulnerability count (estimate based on known CVEs)
- Lighter alternatives if bundle size is large
- Whether it might be unused (based on common usage patterns)

Return ONLY valid JSON, no markdown fences.`;

export async function POST(req: Request): Promise<Response> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing in environment" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { packageJson }: AnalyzeDepsRequest = body;

    if (!packageJson || typeof packageJson !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid packageJson string" },
        { status: 400 }
      );
    }

    // Validate it's valid JSON
    try {
      JSON.parse(packageJson);
    } catch {
      return NextResponse.json(
        { error: "packageJson is not valid JSON" },
        { status: 400 }
      );
    }

    const response = await getClient().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.1,
      max_tokens: 4096,
      messages: [
        { role: "system", content: ANALYZE_DEPS_SYSTEM_PROMPT },
        { role: "user", content: `Analyze this package.json:\n${packageJson}` },
      ],
    });

    const text = response.choices?.[0]?.message?.content ?? "";

    let parsed: AnalyzeDepsResponse;
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
