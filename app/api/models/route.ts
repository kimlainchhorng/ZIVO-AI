import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * AI Model Management Hub
 * GET  /api/models  – list registered models
 * POST /api/models  – register a new model version
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  return NextResponse.json({
    ok: true,
    models: [
      {
        id: "gpt-4.1-mini",
        name: "GPT-4.1 Mini",
        provider: "openai",
        status: "active",
        version: "1.0.0",
        deployedAt: new Date().toISOString(),
      },
    ],
    total: 1,
    filter: { status },
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { name, provider, modelId, version, description } = body as {
    name?: string;
    provider?: string;
    modelId?: string;
    version?: string;
    description?: string;
  };

  if (!name || !provider || !modelId) {
    return NextResponse.json({ error: "name, provider and modelId required" }, { status: 400 });
  }

  // TODO: validate model endpoint, run benchmark, store in model registry
  return NextResponse.json({
    ok: true,
    model: {
      id: crypto.randomUUID(),
      name,
      provider,
      modelId,
      version: version ?? "1.0.0",
      description,
      status: "registered",
      createdAt: new Date().toISOString(),
    },
  });
}
