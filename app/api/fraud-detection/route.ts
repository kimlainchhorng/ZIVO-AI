import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    description:
      "Fraud detection API using pattern analysis. POST { event: string, metadata: Record<string, unknown> }",
  });
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const event = typeof body.event === "string" ? body.event : "";
    const metadata =
      body.metadata !== null && typeof body.metadata === "object" && !Array.isArray(body.metadata)
        ? (body.metadata as Record<string, unknown>)
        : {};

    if (!event) {
      return NextResponse.json({ error: "event is required" }, { status: 400 });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `You are a fraud detection system. Analyze the following event and metadata for fraud patterns. Event: "${event}". Metadata: ${JSON.stringify(metadata)}. Return a JSON object with: "isFraud" (boolean), "riskScore" (number 0-100), "riskLevel" ("low" | "medium" | "high" | "critical"), "patterns" (array of detected fraud pattern strings), and "recommendation" (string). Return only valid JSON.`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const analysis = JSON.parse(raw) as Record<string, unknown>;

    return NextResponse.json({ event, analysis });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
