import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    description:
      "SOC2 readiness checklist API. POST { companyName: string, services: string[] } — uses OpenAI to generate a SOC2 readiness checklist.",
  });
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const companyName = typeof body.companyName === "string" ? body.companyName : "Unknown Company";
    const services = Array.isArray(body.services)
      ? (body.services as unknown[]).filter((s): s is string => typeof s === "string")
      : [];

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `You are a SOC2 compliance expert. Generate a detailed SOC2 readiness checklist for "${companyName}" which uses the following services: ${services.length > 0 ? services.join(", ") : "general cloud services"}. Return a JSON object with: "trustServiceCriteria" (object with keys: security, availability, processingIntegrity, confidentiality, privacy — each containing an array of checklist items with "item", "status" ("complete"|"partial"|"missing"), and "priority" ("high"|"medium"|"low")), "overallReadiness" (number 0-100), and "recommendedActions" (array of strings). Return only valid JSON.`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const checklist = JSON.parse(raw) as Record<string, unknown>;

    return NextResponse.json({ companyName, services, checklist });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
