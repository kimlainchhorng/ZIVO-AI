import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

type CloudProvider = "aws" | "gcp" | "azure";
type IacType = "terraform" | "pulumi" | "kubernetes" | "helm" | "cdk" | "serverless";

interface GenerateIacBody {
  description: string;
  provider?: CloudProvider;
  iacType?: IacType;
}

interface IacFile {
  path: string;
  content: string;
}

interface GenerateIacResult {
  files: IacFile[];
  summary: string;
  deploymentSteps: string[];
  provider: string;
  iacType: string;
}

function isIacFile(value: unknown): value is IacFile {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  return typeof obj.path === "string" && typeof obj.content === "string";
}

export async function POST(req: Request): Promise<NextResponse> {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured." }, { status: 500 });
  }

  const body = await req.json().catch(() => ({})) as Partial<GenerateIacBody>;
  const { description, provider = "aws", iacType = "terraform" } = body;

  if (!description || typeof description !== "string") {
    return NextResponse.json({ error: "Missing required field: description (string)." }, { status: 400 });
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const completion = await client.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a DevOps and cloud infrastructure expert. Generate Infrastructure as Code configurations. Return JSON with: files (array of {path: string, content: string}), summary (string), deploymentSteps (string[]).",
      },
      {
        role: "user",
        content: `Generate ${iacType} configuration for ${provider}.\n\nInfrastructure description: ${description}`,
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

  const rawFiles = Array.isArray(parsed.files) ? parsed.files : [];
  const rawSteps = Array.isArray(parsed.deploymentSteps) ? parsed.deploymentSteps : [];
  const result: GenerateIacResult = {
    files: rawFiles.filter(isIacFile),
    summary: typeof parsed.summary === "string" ? parsed.summary : "",
    deploymentSteps: rawSteps.filter((s): s is string => typeof s === "string"),
    provider,
    iacType,
  };

  return NextResponse.json(result);
}
