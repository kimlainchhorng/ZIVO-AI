import OpenAI from "openai";
import { NextResponse } from "next/server";
import { FEATURES } from "@/lib/features";
import { INTEGRATIONS } from "@/lib/integrations";

export const runtime = "nodejs";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const featureSummary = FEATURES.map(
  (f) => `Feature ${f.id} – ${f.name} (${f.category}): ${f.capabilities.slice(0, 3).join(", ")}, and more.`
).join("\n");

const integrationSummary = INTEGRATIONS.map((i) => `${i.name} (${i.category})`).join(", ");

const SYSTEM_PROMPT = `You are ZIVO AI, an expert website and application code generator.
You generate clean, production-ready code.
Return ONLY the code output, no explanations.

You support the following platform features:
${featureSummary}

You can integrate with 100+ services including:
${integrationSummary}

When generating code, leverage the most appropriate features and integrations for the user's request.`;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const prompt = body?.prompt;
    const featureIds: number[] = body?.featureIds ?? [];
    const integrationNames: string[] = body?.integrations ?? [];

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY in .env.local" }, { status: 500 });
    }
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    // Build context for selected features and integrations
    const selectedFeatures = featureIds.length
      ? FEATURES.filter((f) => featureIds.includes(f.id))
      : [];
    const selectedIntegrations = integrationNames.length
      ? INTEGRATIONS.filter((i) => integrationNames.includes(i.name))
      : [];

    let contextNote = "";
    if (selectedFeatures.length > 0) {
      contextNote += `\nRequested features: ${selectedFeatures.map((f) => f.name).join(", ")}.`;
    }
    if (selectedIntegrations.length > 0) {
      contextNote += `\nRequested integrations: ${selectedIntegrations.map((i) => i.name).join(", ")}.`;
    }

    const r = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt + contextNote },
      ],
    });

    const text = (r as any).output_text ?? "";
    return NextResponse.json({ result: text });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
