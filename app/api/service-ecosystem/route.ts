import OpenAI from "openai";
import { NextResponse } from "next/server";
import {
  SERVICE_CATEGORIES,
  ADVANCED_FEATURE_GROUPS,
  buildServiceSystemPrompt,
} from "@/lib/services";

export const runtime = "nodejs";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/** GET /api/service-ecosystem — return the full service catalog */
export async function GET() {
  return NextResponse.json({
    categories: SERVICE_CATEGORIES.map((c) => ({
      id: c.id,
      number: c.number,
      title: c.title,
      description: c.description,
      icon: c.icon,
      featureCount: c.features.length,
      integrationCount: c.integrations.length,
    })),
    advancedFeatureGroups: ADVANCED_FEATURE_GROUPS,
  });
}

/** POST /api/service-ecosystem — generate a site for a given service category */
export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY in .env.local" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { categoryId, userPrompt } = body ?? {};

    if (!categoryId || typeof categoryId !== "string") {
      return NextResponse.json(
        { error: "categoryId is required" },
        { status: 400 }
      );
    }

    const systemPrompt = buildServiceSystemPrompt(categoryId);
    if (!systemPrompt) {
      return NextResponse.json(
        { error: `Unknown service category: ${categoryId}` },
        { status: 400 }
      );
    }

    const userContent =
      typeof userPrompt === "string" && userPrompt.trim()
        ? userPrompt
        : `Generate the complete ${categoryId} service platform as described.`;

    const r = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
    });

    const text = (r as { output_text?: string }).output_text ?? "";
    return NextResponse.json({ result: text, categoryId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
