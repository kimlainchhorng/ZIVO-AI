import { NextResponse } from "next/server";
import OpenAI from "openai";
import { stripMarkdownFences } from "../../../lib/code-parser";

export const runtime = "nodejs";

interface GeneratedFile {
  path: string;
  content: string;
}

function getClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { files } = body as { files?: unknown };

    if (!Array.isArray(files)) {
      return NextResponse.json({ error: "files must be an array" }, { status: 400 });
    }
    for (const f of files) {
      if (!f || typeof (f as GeneratedFile).path !== "string" || typeof (f as GeneratedFile).content !== "string") {
        return NextResponse.json(
          { error: "Each file must have path (string) and content (string)" },
          { status: 400 }
        );
      }
    }

    const fileArray = files as GeneratedFile[];

    // Return existing preview_html if present
    const previewFile = fileArray.find((f) => f.path === "preview_html" || f.path.endsWith("preview.html"));
    if (previewFile) {
      return NextResponse.json({ previewHtml: previewFile.content });
    }

    // Generate a preview using GPT-4o
    const filesSummary = fileArray
      .slice(0, 5)
      .map((f) => `// ${f.path}\n${f.content.slice(0, 600)}`)
      .join("\n\n---\n\n");

    const completion = await getClient().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.3,
      max_tokens: 2048,
      messages: [
        {
          role: "system",
          content: "You are a UI preview generator. Given project files, create a fully self-contained single HTML file that visually previews the application. Use inline CSS and minimal JavaScript. Return ONLY the HTML content.",
        },
        {
          role: "user",
          content: `Generate a static HTML preview for this project:\n\n${filesSummary}`,
        },
      ],
    });

    const previewHtml = stripMarkdownFences(completion.choices[0]?.message?.content ?? "<html><body><h1>Preview unavailable</h1></body></html>");
    return NextResponse.json({ previewHtml });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
