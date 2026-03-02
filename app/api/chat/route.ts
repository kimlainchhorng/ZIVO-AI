import OpenAI from "openai";
import { NextResponse } from "next/server";
import { FEATURES } from "@/lib/features";
import { INTEGRATIONS } from "@/lib/integrations";

export const runtime = "nodejs";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const featureSummary = FEATURES.map(
  (f) => `Feature ${f.id} – ${f.name}: ${f.description}`
).join("\n");

const integrationCategories = [...new Set(INTEGRATIONS.map((i) => i.category))].join(", ");

const SYSTEM_PROMPT = `You are ZIVO AI, an expert AI assistant for building web and mobile applications.
You help users understand and implement platform features and integrations.

ZIVO AI supports 20 platform features (IDs 21-40):
${featureSummary}

ZIVO AI integrates with 100+ services across these categories: ${integrationCategories}.

Answer questions concisely and guide users on how to use these features and integrations effectively.`;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const prompt = body?.prompt;

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY in .env.local" }, { status: 500 });
    }
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const r = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
    });

    const text = (r as any).output_text ?? "";
    return NextResponse.json({ result: text });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}