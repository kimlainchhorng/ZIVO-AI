import { NextRequest, NextResponse } from "next/server";

const MIN_CONFIDENCE = 0.85;
const CONFIDENCE_RANGE = 0.14;

const INTENTS: Record<string, { intent: string; response: string }> = {
  analytics: { intent: "navigate.analytics", response: "Opening the analytics dashboard for you." },
  search: { intent: "navigate.search", response: "Launching the search interface." },
  workflow: { intent: "navigate.workflow", response: "Taking you to workflow automation." },
  status: { intent: "query.status", response: "All systems are operational. CPU at 42%, Memory at 67%." },
  dashboard: { intent: "navigate.dashboard", response: "Navigating to the main dashboard." },
  help: { intent: "query.help", response: "I can help you navigate, search, check status, and manage workflows." },
};

function detectIntent(text: string): { intent: string; response: string; confidence: number } {
  const lower = text.toLowerCase();
  for (const [keyword, data] of Object.entries(INTENTS)) {
    if (lower.includes(keyword)) {
      return { ...data, confidence: MIN_CONFIDENCE + Math.random() * CONFIDENCE_RANGE };
    }
  }
  return {
    intent: "general.query",
    response: `I understood: "${text}". How can I assist you further?`,
    confidence: 0.62,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text: string = body.text ?? body.command ?? "";

    if (!text.trim()) {
      return NextResponse.json({ error: "text or command is required" }, { status: 400 });
    }

    const result = detectIntent(text);

    return NextResponse.json({
      transcript: text,
      intent: result.intent,
      response: result.response,
      confidence: parseFloat(result.confidence.toFixed(2)),
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
