import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    description:
      "Compliance reports generator. Accepts { standard: 'gdpr'|'soc2'|'hipaa', companyName: string } and returns an AI-generated compliance report summary for the specified standard.",
  });
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      standard?: "gdpr" | "soc2" | "hipaa";
      companyName?: string;
    };

    const { standard, companyName } = body;

    if (!standard || !["gdpr", "soc2", "hipaa"].includes(standard)) {
      return NextResponse.json(
        { error: "Missing or invalid standard. Must be 'gdpr', 'soc2', or 'hipaa'" },
        { status: 400 }
      );
    }

    if (!companyName) {
      return NextResponse.json(
        { error: "Missing required field: companyName" },
        { status: 400 }
      );
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a compliance and security expert. Generate a structured compliance report summary for the specified standard. Include: executive summary, key requirements checklist, current readiness assessment template, gap analysis framework, remediation priorities, and evidence collection guidance. Format as a professional report with sections and subsections.",
        },
        {
          role: "user",
          content: JSON.stringify({ standard: standard.toUpperCase(), companyName }),
        },
      ],
    });

    const result = completion.choices[0]?.message?.content ?? "";
    return NextResponse.json({ result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
