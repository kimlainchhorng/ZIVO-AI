import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    description:
      "WAF/Bot protection rules API. POST { rules: object[], action: string } — uses OpenAI to generate WAF rule config.",
  });
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const rules = Array.isArray(body.rules) ? body.rules : [];
    const action = typeof body.action === "string" ? body.action : "generate";

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `You are a WAF (Web Application Firewall) configuration expert. Given the action "${action}" and the following rules input: ${JSON.stringify(rules)}, generate a comprehensive WAF configuration as a JSON object with keys: "rules" (array of rule objects with id, name, description, pattern, action, priority), "botProtection" (object with enabled, challenge, block settings), and "summary" (string). Return only valid JSON.`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const config = JSON.parse(raw) as Record<string, unknown>;

    return NextResponse.json({ action, config });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
