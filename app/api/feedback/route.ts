import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface FeedbackEntry {
  id: string;
  type: "nps" | "feature-request" | "bug-report" | "general";
  sentiment: "positive" | "neutral" | "negative";
  message: string;
  submittedAt: string;
}

export async function GET() {
  return NextResponse.json({
    nps: {
      score: 58,
      promoters: 42,
      passives: 31,
      detractors: 27,
      responsesThisMonth: 340,
    },
    featureRequests: [
      { id: "FR-01", title: "CSV export", votes: 128, status: "planned" },
      { id: "FR-02", title: "Slack integration", votes: 95, status: "in-review" },
      { id: "FR-03", title: "Custom dashboards", votes: 76, status: "backlog" },
    ],
    bugReports: {
      total: 18,
      critical: 1,
      resolved: 12,
      open: 6,
    },
    sentiment: {
      positive: 55,
      neutral: 28,
      negative: 17,
    },
    recentFeedback: [
      {
        id: "F-001",
        type: "nps",
        sentiment: "positive",
        message: "Love the new interface!",
        submittedAt: "2025-07-10T10:00:00.000Z",
      },
      {
        id: "F-002",
        type: "bug-report",
        sentiment: "negative",
        message: "Export button unresponsive on Safari",
        submittedAt: "2025-07-10T09:30:00.000Z",
      },
    ] satisfies FeedbackEntry[],
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, message, sentiment } = body as {
      type?: FeedbackEntry["type"];
      message?: string;
      sentiment?: FeedbackEntry["sentiment"];
    };
    if (!type || !message) {
      return NextResponse.json(
        { error: "Missing required fields: type, message" },
        { status: 400 }
      );
    }
    const entry: FeedbackEntry = {
      id: `F-${Date.now()}`,
      type,
      message,
      sentiment: sentiment ?? "neutral",
      submittedAt: new Date().toISOString(),
    };
    return NextResponse.json(entry, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
