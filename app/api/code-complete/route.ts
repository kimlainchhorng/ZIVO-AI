import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

function getClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export interface CodeCompleteRequest {
  fileContent: string;
  cursorLine: number;
  cursorColumn: number;
  language?: string;
  filePath?: string;
}

export interface CodeCompleteResponse {
  completion: string;
  insertText: string;
}

const CODE_COMPLETE_SYSTEM_PROMPT = `You are an AI code completion engine similar to GitHub Copilot.
Given the file content and cursor position, provide the most likely next code completion.

Rules:
- Return ONLY the completion text to insert at the cursor position
- Do NOT repeat code already present before the cursor
- Keep completions concise (1–5 lines typically)
- Match the existing code style and indentation
- For TypeScript, always include proper type annotations
- Never return markdown, explanations, or backticks
- If the cursor is mid-line, complete only to the end of that statement`;

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
      fileContent,
      cursorLine,
      cursorColumn,
      language = "typescript",
      filePath = "file.ts",
    }: CodeCompleteRequest = body;

    if (!fileContent || typeof fileContent !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid fileContent" },
        { status: 400 }
      );
    }

    // Extract context: lines before cursor
    const lines = fileContent.split("\n");
    const contextLines = lines.slice(0, cursorLine);
    const currentLine = lines[cursorLine - 1] ?? "";
    const prefix = currentLine.slice(0, cursorColumn);
    const suffix = currentLine.slice(cursorColumn);

    const contextBefore = [...contextLines.slice(-50), prefix].join("\n");
    const contextAfter = [suffix, ...lines.slice(cursorLine, cursorLine + 5)].join("\n");

    const prompt = `File: ${filePath} (${language})

Code before cursor:
\`\`\`
${contextBefore}
\`\`\`

Code after cursor:
\`\`\`
${contextAfter}
\`\`\`

Complete the code at the cursor position (▌ marks cursor):`;

    const response = await getClient().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.1,
      max_tokens: 256,
      messages: [
        { role: "system", content: CODE_COMPLETE_SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
    });

    const completion = response.choices?.[0]?.message?.content ?? "";
    const insertText = completion
      .replace(/^```(?:\w+)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trimEnd();

    return NextResponse.json({ completion, insertText } satisfies CodeCompleteResponse);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error)?.message || "Server error" },
      { status: 500 }
    );
  }
}
