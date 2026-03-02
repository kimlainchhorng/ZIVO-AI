import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { prompt, appName, replicas } = body;

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY in .env.local" }, { status: 500 });
    }
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }
    if (!appName || typeof appName !== "string") {
      return NextResponse.json({ error: "Missing appName" }, { status: 400 });
    }

    const replicaCount = typeof replicas === "number" ? replicas : 2;

    const r = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "You generate Kubernetes YAML manifests (Deployment, Service, Ingress). Return ONLY the YAML output separated by '---', no explanations.",
        },
        {
          role: "user",
          content: `App name: ${appName}\nReplicas: ${replicaCount}\n\n${prompt}`,
        },
      ],
    });

    const text = (r as any).output_text ?? "";
    return NextResponse.json({ result: text });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
