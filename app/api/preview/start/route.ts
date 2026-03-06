import { NextResponse } from "next/server";
import { extractBearerToken, getUserFromToken, getProjectFiles } from "@/lib/db/projects-db";
import OpenAI from "openai";
import { stripMarkdownFences } from "@/lib/code-parser";

export const runtime = "nodejs";

const MAX_FILES_FOR_PREVIEW = 5;
const MAX_FILE_CONTENT_LENGTH = 600;

interface ProjectFile {
  path: string;
  content: string;
}

function getClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

/**
 * POST /api/preview/start
 * Body: { projectId: string } | { files: ProjectFile[] }
 *
 * Generates a self-contained HTML preview for the given project and returns it.
 * Requires Authorization: Bearer <token> when using projectId.
 */
export async function POST(req: Request) {
  let body: { projectId?: unknown; files?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  let files: ProjectFile[] = [];

  if (body.projectId && typeof body.projectId === "string") {
    const token = extractBearerToken(req.headers.get("Authorization"));
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getUserFromToken(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
      const dbFiles = await getProjectFiles(token, body.projectId);
      files = dbFiles.map((f) => ({ path: f.path, content: f.content }));
    } catch (err: unknown) {
      return NextResponse.json(
        { error: (err as Error).message ?? "Failed to load project files" },
        { status: 500 }
      );
    }
  } else if (Array.isArray(body.files)) {
    files = (body.files as ProjectFile[]).filter(
      (f) => typeof f.path === "string" && typeof f.content === "string"
    );
  } else {
    return NextResponse.json({ error: "Provide projectId or files array" }, { status: 400 });
  }

  if (files.length === 0) {
    return NextResponse.json({ error: "No files to preview" }, { status: 400 });
  }

  // If there is already a standalone HTML file, use it directly
  const htmlFile = files.find(
    (f) =>
      f.path === "index.html" ||
      f.path === "public/index.html" ||
      f.path === "preview.html" ||
      f.path === "preview_html"
  );
  if (htmlFile) {
    return NextResponse.json({ status: "running", previewHtml: htmlFile.content });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY not configured" }, { status: 503 });
  }

  // Generate a preview via AI
  const filesSummary = files
    .slice(0, MAX_FILES_FOR_PREVIEW)
    .map((f) => `// ${f.path}\n${f.content.slice(0, MAX_FILE_CONTENT_LENGTH)}`)
    .join("\n\n---\n\n");

  try {
    const completion = await getClient().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.3,
      max_tokens: 2048,
      messages: [
        {
          role: "system",
          content:
            "You are a UI preview generator. Given project files, create a fully self-contained single HTML file that visually previews the application. Use inline CSS and minimal JavaScript. Return ONLY the HTML content.",
        },
        {
          role: "user",
          content: `Generate a static HTML preview for this project:\n\n${filesSummary}`,
        },
      ],
    });
    const previewHtml = stripMarkdownFences(
      completion.choices[0]?.message?.content ??
        "<html><body><h1>Preview unavailable</h1></body></html>"
    );
    return NextResponse.json({ status: "running", previewHtml });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message ?? "Failed to generate preview" },
      { status: 500 }
    );
  }
}
