import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

interface GenerateDocsBody {
  code: string;
  projectName?: string;
  docType?: "readme" | "architecture" | "api" | "changelog" | "all";
}

interface DocsResult {
  readme: string;
  architecture: string;
  api: string;
  changelog: string;
  summary: string;
}

function _buildDocsPrompt(
  code: string,
  docType: GenerateDocsBody["docType"],
  projectName: string | undefined,
): string {
  const name = projectName ? ` "${projectName}"` : "";
  if (docType === "all" || docType === undefined) {
    return `Generate all documentation types for the following${name} code:\n\n${code}`;
  }
  return (
    `Generate only the "${docType}" documentation for the following${name} code.` +
    ` Return the result in the "${docType}" field and leave all other fields as empty strings.\n\n${code}`
  );
}

export async function POST(req: Request): Promise<NextResponse> {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured." }, { status: 500 });
  }

  const body = await req.json().catch(() => ({})) as Partial<GenerateDocsBody>;
  const { code, projectName, docType = "all" } = body;

  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "Missing required field: code (string)." }, { status: 400 });
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const userContent = _buildDocsPrompt(code, docType, projectName);

  const completion = await client.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          'You are a technical documentation expert. Generate comprehensive documentation from code. Return JSON with: readme (string), architecture (string with Mermaid diagrams), api (string in OpenAPI format), changelog (string), summary (string).',
      },
      { role: "user", content: userContent },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";

  let parsed: Partial<DocsResult>;
  try {
    parsed = JSON.parse(raw) as Partial<DocsResult>;
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response as JSON." }, { status: 500 });
  }

  const result: DocsResult = {
    readme: typeof parsed.readme === "string" ? parsed.readme : "",
    architecture: typeof parsed.architecture === "string" ? parsed.architecture : "",
    api: typeof parsed.api === "string" ? parsed.api : "",
    changelog: typeof parsed.changelog === "string" ? parsed.changelog : "",
    summary: typeof parsed.summary === "string" ? parsed.summary : "",
  };

  return NextResponse.json(result);
}
