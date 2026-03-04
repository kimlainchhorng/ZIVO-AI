import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export interface ChangelogEntry {
  version: string;
  date: string;
  changes: {
    feat?: string[];
    fix?: string[];
    chore?: string[];
    docs?: string[];
    refactor?: string[];
  };
}

export interface GenerateChangelogRequest {
  commits?: string;
  repoName?: string;
  currentVersion?: string;
}

export interface GenerateChangelogResponse {
  changelog: string;
  entries: ChangelogEntry[];
  suggestedVersion: string;
  releaseNotes: string;
}

const CHANGELOG_SYSTEM_PROMPT = `You are ZIVO AI — an expert in semantic versioning and changelog generation.

Generate a structured changelog from git commit messages.

Respond ONLY with a valid JSON object:
{
  "changelog": "Full CHANGELOG.md content",
  "entries": [
    {
      "version": "1.1.0",
      "date": "2024-01-15",
      "changes": {
        "feat": ["Add voice input feature"],
        "fix": ["Fix auth redirect loop"]
      }
    }
  ],
  "suggestedVersion": "1.1.0",
  "releaseNotes": "Short GitHub release notes"
}

Follow Keep a Changelog format. Group by: feat, fix, chore, docs, refactor.
Return ONLY valid JSON, no markdown fences, no extra text.`;

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing in environment" },
        { status: 500 }
      );
    }

    const body = await req.json() as GenerateChangelogRequest;
    const {
      commits = "",
      repoName = "my-app",
      currentVersion = "1.0.0",
    } = body;

    if (!commits.trim()) {
      return NextResponse.json(
        { error: "Missing commits" },
        { status: 400 }
      );
    }

    const userPrompt = `Generate a changelog for "${repoName}" (current version: ${currentVersion}).

Git commits:
${commits}

Parse commits using conventional commit format and generate a structured changelog.`;

    const response = await getClient().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      max_tokens: 4096,
      messages: [
        { role: "system", content: CHANGELOG_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const text = response.choices?.[0]?.message?.content ?? "";

    let parsed: GenerateChangelogResponse;
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
