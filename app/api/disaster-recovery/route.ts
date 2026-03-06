import { NextResponse } from "next/server";
import OpenAI from "openai";
import { DISASTER_RECOVERY_SYSTEM_PROMPT } from "@/prompts/devops-ai-routes";

export const runtime = "nodejs";

interface DisasterRecoveryBody {
  services: string[];
  rto: string;
  rpo: string;
}

export async function GET() {
  return NextResponse.json({
    description:
      "Disaster recovery plan generator. Accepts a list of services, RTO (Recovery Time Objective), and RPO (Recovery Point Objective), then uses AI to generate a comprehensive DR plan.",
  });
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY" },
        { status: 500 }
      );
    }

    const body = (await req.json().catch(() => ({}))) as DisasterRecoveryBody;
    const { services, rto, rpo } = body;

    if (!Array.isArray(services) || services.length === 0) {
      return NextResponse.json(
        { error: "Missing required field: services (must be a non-empty array of strings)" },
        { status: 400 }
      );
    }

    if (!rto || typeof rto !== "string") {
      return NextResponse.json(
        { error: "Missing required field: rto (Recovery Time Objective)" },
        { status: 400 }
      );
    }

    if (!rpo || typeof rpo !== "string") {
      return NextResponse.json(
        { error: "Missing required field: rpo (Recovery Point Objective)" },
        { status: 400 }
      );
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const systemPrompt = DISASTER_RECOVERY_SYSTEM_PROMPT;

    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Generate a disaster recovery plan for the following:\n\nServices: ${services.join(", ")}\nRTO (Recovery Time Objective): ${rto}\nRPO (Recovery Point Objective): ${rpo}`,
        },
      ],
      temperature: 0.4,
    });

    const plan = completion.choices[0]?.message?.content ?? "";

    return NextResponse.json({ services, rto, rpo, plan });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
