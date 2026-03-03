import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export type FileAction = "create" | "update" | "delete";

export interface AgentFile {
  path: string;
  content: string;
  action: FileAction;
}

export interface AgentRequest {
  prompt: string;
  files?: AgentFile[];
  agentMode?: boolean;
}

export interface AgentResponse {
  files: AgentFile[];
  steps: string[];
  summary: string;
}

const AGENT_SYSTEM_PROMPT = `You are ZIVO AI Agent — an autonomous full-stack developer.

You receive a prompt and optional existing files. Your task is to:
1. Analyze the existing codebase (if provided).
2. Plan the changes needed to fulfil the prompt.
3. Generate or update all necessary files.

Respond with a valid JSON object:
{
  "files": [
    { "path": "relative/path.ts", "content": "...", "action": "create" | "update" | "delete" }
  ],
  "steps": ["Step 1: ...", "Step 2: ...", "Step 3: ..."],
  "summary": "Brief summary of what was done"
}

Rules:
- Return ONLY valid JSON, no markdown fences, no extra text.
- Use strict TypeScript — no implicit any.
- Document reasoning in the \`steps\` array.`;

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing in environment" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => {
      return NextResponse.json({ error: "Invalid or malformed JSON in request body" }, { status: 400 });
    });
    const { prompt, files = [], agentMode = false }: AgentRequest = body;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json({ error: "Missing or invalid prompt" }, { status: 400 });
    }

    if (!agentMode) {
      return NextResponse.json(
        { error: "agentMode must be true to use this endpoint" },
        { status: 400 }
      );
    }

    const existingFilesContext =
      files.length > 0
        ? `\n\nExisting files:\n${files
            .map((f) => `// ${f.path}\n${f.content}`)
            .join("\n\n")}`
        : "";

    const userMessage = `${prompt.trim()}${existingFilesContext}`;

    const response = await client.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      max_tokens: 4096,
      messages: [
        { role: "system", content: AGENT_SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
    });

    const text = response.choices?.[0]?.message?.content ?? "";

    let parsed: AgentResponse;
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
