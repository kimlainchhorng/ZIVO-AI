import OpenAI from "openai";
import { NextResponse } from "next/server";
import {
  ENTERPRISE_PLATFORMS,
  ENTERPRISE_AI_FEATURES,
  ENTERPRISE_INTEGRATIONS,
} from "@/lib/enterprise-platforms";

export const runtime = "nodejs";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? "placeholder" });

export async function GET() {
  return NextResponse.json({
    platforms: ENTERPRISE_PLATFORMS,
    features: ENTERPRISE_AI_FEATURES,
    integrations: ENTERPRISE_INTEGRATIONS,
  });
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY in .env.local" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const platformId = body?.platformId as string | undefined;
    const customPrompt = body?.prompt as string | undefined;
    const selectedFeatures = body?.features as string[] | undefined;

    if (!platformId && !customPrompt) {
      return NextResponse.json(
        { error: "platformId or prompt is required" },
        { status: 400 }
      );
    }

    const platform = ENTERPRISE_PLATFORMS.find((p) => p.id === platformId);

    const systemPrompt =
      "You are an expert enterprise software architect and full-stack developer. " +
      "Generate a complete, production-ready HTML/CSS/JS application dashboard. " +
      "Return ONLY the complete HTML code, no explanations. " +
      "The output must be a single self-contained HTML file with embedded CSS and JavaScript.";

    let userPrompt: string;

    if (platform) {
      const features =
        selectedFeatures && selectedFeatures.length > 0
          ? selectedFeatures
          : platform.features.slice(0, 20);

      userPrompt =
        `Build a complete enterprise ${platform.name} dashboard application.\n\n` +
        `Platform: ${platform.name} (#${platform.number})\n` +
        `Description: ${platform.description}\n\n` +
        `Include these key features:\n` +
        features.map((f) => `- ${f}`).join("\n") +
        `\n\nAlso include these enterprise capabilities:\n` +
        `- Multi-factor authentication\n` +
        `- Role-based access control\n` +
        `- Real-time dashboards with KPI widgets\n` +
        `- Responsive design for desktop and mobile\n` +
        `- Dark/light mode toggle\n\n` +
        `Design requirements:\n` +
        `- Use color: ${platform.color} as the primary brand color\n` +
        `- Modern, professional enterprise UI with sidebar navigation\n` +
        `- Show realistic sample data in tables and charts\n` +
        `- Include a top navigation bar, sidebar, and main content area\n`;
    } else {
      userPrompt = customPrompt!;
    }

    const r = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const text = (r as { output_text?: string }).output_text ?? "";
    return NextResponse.json({
      result: text,
      platform: platform ?? null,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
