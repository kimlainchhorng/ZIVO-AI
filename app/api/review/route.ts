import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? "placeholder" });

interface FileEntry {
  path: string;
  content: string;
}

interface ReviewResult {
  bugs: string[];
  security: string[];
  performance: string[];
  typescript: string[];
  summary: string;
}

const REVIEW_PROMPT = `You are a senior software engineer performing a code review.
Analyze the provided code files and return a JSON object with this exact structure:
{
  "bugs": ["description of bug 1", ...],
  "security": ["security issue 1", ...],
  "performance": ["performance suggestion 1", ...],
  "typescript": ["TypeScript error or improvement 1", ...],
  "summary": "Overall assessment in 1-2 sentences"
}
Return ONLY valid JSON, no markdown fences, no extra text.`;

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY in .env.local" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const files: FileEntry[] = body?.files;

    if (!Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { error: "files array is required" },
        { status: 400 }
      );
    }

    for (const f of files) {
      if (!f.path || typeof f.path !== "string" || typeof f.content !== "string") {
        return NextResponse.json(
          { error: "Each file must have path (string) and content (string)" },
          { status: 400 }
        );
      }
    }

    const codeContext = files
      .map((f) => `// File: ${f.path}\n${f.content}`)
      .join("\n\n---\n\n");

    const response = await client.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      max_tokens: 2000,
      messages: [
        { role: "system", content: REVIEW_PROMPT },
        { role: "user", content: codeContext },
      ],
    });

    const text = response.choices?.[0]?.message?.content ?? "{}";

    let review: ReviewResult;
    try {
      review = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        review = JSON.parse(match[0]);
      } else {
        return NextResponse.json(
          { error: "AI returned invalid JSON" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ ok: true, review });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error)?.message || "Server error" },
      { status: 500 }
    );
  }
}
