import { NextResponse } from "next/server";
import OpenAI from "openai";
import { stripMarkdownFences } from "../../../lib/code-parser";
import { APIClientRequestSchema } from "@/lib/schemas";

export const runtime = "nodejs";

interface GeneratedFile {
  path: string;
  content: string;
}

interface APIClientResult {
  files: GeneratedFile[];
  usage: string;
  dependencies: string[];
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

    const parsed = APIClientRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    }

    const { openApiSpec, language, clientName } = parsed.data;

    const prompt = `Generate a typed ${language} API client from this OpenAPI 3.x spec.
Client class name: ${clientName}

OpenAPI spec:
${openApiSpec.slice(0, 4000)}

Return a JSON object:
{
  "files": [{"path":"...","content":"..."}],
  "usage": "// Example usage code",
  "dependencies": ["dependency1", ...]
}

For TypeScript: generate a fully typed client with methods for each endpoint.
For Python: generate a dataclass-based client with requests.
For curl: generate curl command examples for each endpoint.

Respond ONLY with the JSON object.`;

    const completion = await getClient().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      max_tokens: 4096,
      messages: [
        { role: "system", content: "You are an API client generator. Generate clean, typed, production-ready API clients." },
        { role: "user", content: prompt },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    let result: APIClientResult = { files: [], usage: "", dependencies: [] };
    try {
      result = JSON.parse(stripMarkdownFences(raw)) as APIClientResult;
    } catch {
      result.files = [{ path: `${clientName}.${language === "typescript" ? "ts" : language === "python" ? "py" : "sh"}`, content: raw }];
    }

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
