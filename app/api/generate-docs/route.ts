import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

interface GenerateDocsBody {
  code: string;
  projectName?: string;
  docType?: "readme" | "architecture" | "api" | "changelog" | "all";
  storybook?: boolean;
  openApiSpec?: boolean;
  mermaidDiagrams?: boolean;
  interactiveReadme?: boolean;
}

interface DocsResult {
  readme: string;
  architecture: string;
  api: string;
  changelog: string;
  summary: string;
  storybook?: string;
  openApiSpec?: string;
  mermaidDiagrams?: string;
}

function _buildDocsPrompt(
  code: string,
  docType: GenerateDocsBody["docType"],
  projectName: string | undefined,
  extras: {
    storybook?: boolean;
    openApiSpec?: boolean;
    mermaidDiagrams?: boolean;
    interactiveReadme?: boolean;
  }
): string {
  const name = projectName ? ` "${projectName}"` : "";
  const extraInstructions: string[] = [];

  if (extras.storybook) {
    extraInstructions.push(
      'Also generate a "storybook" field containing Storybook stories (.stories.tsx) for each React component found in the code. Use CSF3 format with play() interactions where appropriate.'
    );
  }
  if (extras.openApiSpec) {
    extraInstructions.push(
      'Also generate an "openApiSpec" field containing a full OpenAPI 3.1 YAML spec derived from the API route files in the code.'
    );
  }
  if (extras.mermaidDiagrams) {
    extraInstructions.push(
      'Also generate a "mermaidDiagrams" field containing Mermaid ER diagrams, flowcharts, and sequence diagrams for the architecture.'
    );
  }
  if (extras.interactiveReadme) {
    extraInstructions.push(
      'Make the "readme" field a rich interactive README with: shields.io badges for build/coverage/version, a "Deploy to Vercel" button ([![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)), GIF placeholders using placeholder.it, and a detailed Getting Started section.'
    );
  }

  const extraText = extraInstructions.length > 0
    ? `\n\nAdditional instructions:\n${extraInstructions.join("\n")}`
    : "";

  if (docType === "all" || docType === undefined) {
    return `Generate all documentation types for the following${name} code:\n\n${code}${extraText}`;
  }
  return (
    `Generate only the "${docType}" documentation for the following${name} code.` +
    ` Return the result in the "${docType}" field and leave all other standard fields as empty strings.\n\n${code}${extraText}`
  );
}

export async function POST(req: Request): Promise<NextResponse> {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured." }, { status: 500 });
  }

  const body = await req.json().catch(() => ({})) as Partial<GenerateDocsBody>;
  const {
    code,
    projectName,
    docType = "all",
    storybook = false,
    openApiSpec = false,
    mermaidDiagrams = false,
    interactiveReadme = false,
  } = body;

  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "Missing required field: code (string)." }, { status: 400 });
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const userContent = _buildDocsPrompt(code, docType, projectName, {
    storybook,
    openApiSpec,
    mermaidDiagrams,
    interactiveReadme,
  });

  const completion = await client.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          'You are a technical documentation expert. Generate comprehensive documentation from code. Return JSON with: readme (string), architecture (string with Mermaid diagrams), api (string in OpenAPI format), changelog (string), summary (string). Optionally include: storybook (string), openApiSpec (string), mermaidDiagrams (string) when requested.',
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
    ...(storybook && typeof parsed.storybook === "string" ? { storybook: parsed.storybook } : {}),
    ...(openApiSpec && typeof parsed.openApiSpec === "string" ? { openApiSpec: parsed.openApiSpec } : {}),
    ...(mermaidDiagrams && typeof parsed.mermaidDiagrams === "string" ? { mermaidDiagrams: parsed.mermaidDiagrams } : {}),
  };

  return NextResponse.json(result);
}
