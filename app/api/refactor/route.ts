import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

interface RefactorBody {
  code: string;
  refactorType?: "extract-component" | "add-types" | "react-query" | "performance" | "all";
}

interface RefactorChange {
  type: string;
  description: string;
  before: string;
  after: string;
}

interface RefactorResult {
  refactoredCode: string;
  changes: RefactorChange[];
  summary: string;
}

function isRefactorChange(value: unknown): value is RefactorChange {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.type === "string" &&
    typeof obj.description === "string" &&
    typeof obj.before === "string" &&
    typeof obj.after === "string"
  );
}

export async function POST(req: Request): Promise<NextResponse> {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured." }, { status: 500 });
  }

  const body = await req.json().catch(() => ({})) as Partial<RefactorBody>;
  const { code, refactorType = "all" } = body;

  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "Missing required field: code (string)." }, { status: 400 });
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const completion = await client.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are an expert TypeScript/React developer. Provide refactoring suggestions. Return JSON with: refactoredCode (string), changes (array of {type: string, description: string, before: string, after: string}), summary (string).",
      },
      {
        role: "user",
        content: `Refactor the following code${refactorType !== "all" ? ` focusing on: ${refactorType}` : ""}:\n\n${code}`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response as JSON." }, { status: 500 });
  }

  const rawChanges = Array.isArray(parsed.changes) ? parsed.changes : [];
  const result: RefactorResult = {
    refactoredCode: typeof parsed.refactoredCode === "string" ? parsed.refactoredCode : "",
    changes: rawChanges.filter(isRefactorChange),
    summary: typeof parsed.summary === "string" ? parsed.summary : "",
  };

  return NextResponse.json(result);
}
