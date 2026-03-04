import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export interface CommentsFile {
  path: string;
  content: string;
  action: "create" | "update" | "delete";
}

export interface GenerateCommentsRequest {
  appName?: string;
  features?: Array<
    | "threading"
    | "reactions"
    | "mentions"
    | "moderation"
    | "spam-detection"
    | "markdown"
    | "voting"
    | "reporting"
    | "all"
  >;
  realtime?: boolean;
  realtimeProvider?: "supabase" | "pusher" | "socket.io";
}

export interface GenerateCommentsResponse {
  files: CommentsFile[];
  summary: string;
  setupInstructions: string;
  requiredEnvVars: string[];
}

const COMMENTS_SYSTEM_PROMPT = `You are ZIVO AI — an expert in building community and comment systems for Next.js applications.

Generate a complete comment and review system for a Next.js App Router project.

Respond ONLY with a valid JSON object:
{
  "files": [
    { "path": "relative/path", "content": "...", "action": "create" }
  ],
  "summary": "Brief description",
  "setupInstructions": "Step-by-step setup instructions",
  "requiredEnvVars": ["VAR_NAME=description"]
}

Always include:
- components/CommentSystem.tsx — Main comment system with nested thread display
- components/CommentThread.tsx — Threaded comment tree component
- components/CommentComposer.tsx — Comment input with markdown support
- components/ReactionPicker.tsx — Emoji reaction picker component
- app/api/comments/route.ts — Comment CRUD API
- app/api/comments/[id]/reactions/route.ts — Reaction toggle API
- app/api/comments/[id]/report/route.ts — Comment reporting API
- app/api/moderation/route.ts — Moderation queue API
- lib/comments/spam-detector.ts — AI-powered spam detection
- hooks/useComments.ts — Comment data fetching hook with optimistic updates

Support threaded comments, emoji reactions, @mentions, and moderation queue.
Use optimistic UI updates for instant feedback.

Return ONLY valid JSON, no markdown fences, no extra text.`;

export async function POST(req: Request): Promise<NextResponse> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing in environment" },
        { status: 500 }
      );
    }

    let body: GenerateCommentsRequest;
    try {
      body = await req.json() as GenerateCommentsRequest;
    } catch {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }
    const {
      appName = "My App",
      features = ["all"],
      realtime = true,
      realtimeProvider = "supabase",
    } = body;

    const selectedFeatures = features.includes("all")
      ? ["threading", "reactions", "mentions", "moderation", "spam-detection", "markdown", "voting", "reporting"]
      : features;

    const userPrompt = `Generate a complete comment and review system for "${appName}".
Features: ${selectedFeatures.join(", ")}
Real-time updates: ${realtime}
Real-time provider: ${realtimeProvider}

Generate:
1. Main CommentSystem component with nested threads (components/CommentSystem.tsx)
2. Threaded comment tree display (components/CommentThread.tsx)
3. Comment composer with Markdown preview (components/CommentComposer.tsx)
4. Emoji reaction picker (components/ReactionPicker.tsx)
5. Comment CRUD API (app/api/comments/route.ts)
6. Reaction toggle API (app/api/comments/[id]/reactions/route.ts)
7. Report API (app/api/comments/[id]/report/route.ts)
8. Moderation queue API (app/api/moderation/route.ts)
9. AI spam detection (lib/comments/spam-detector.ts)
10. useComments hook with optimistic updates (hooks/useComments.ts)
${realtime ? `11. Real-time updates via ${realtimeProvider}` : ""}`;

    const response = await getClient().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      max_tokens: 8192,
      messages: [
        { role: "system", content: COMMENTS_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const text = response.choices?.[0]?.message?.content ?? "";

    let parsed: GenerateCommentsResponse;
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) {
        return NextResponse.json(
          { error: "AI did not return valid JSON" },
          { status: 502 }
        );
      }
      parsed = JSON.parse(match[0]);
    }

    if (!Array.isArray(parsed.files)) {
      return NextResponse.json(
        { error: "Invalid response structure: missing files array" },
        { status: 502 }
      );
    }

    return NextResponse.json(parsed);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error)?.message || "Server error" },
      { status: 500 }
    );
  }
}
