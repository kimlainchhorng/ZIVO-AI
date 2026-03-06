import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export interface GamificationFile {
  path: string;
  content: string;
  action: "create" | "update" | "delete";
}

export interface GenerateGamificationRequest {
  appName?: string;
  features?: Array<
    | "points"
    | "badges"
    | "leaderboard"
    | "streaks"
    | "levels"
    | "rewards"
    | "all"
  >;
  realtimeLeaderboard?: boolean;
}

export interface GenerateGamificationResponse {
  files: GamificationFile[];
  summary: string;
  setupInstructions: string;
  requiredEnvVars: string[];
  schemaSQL: string;
}

const GAMIFICATION_SYSTEM_PROMPT = `You are ZIVO AI — an expert in gamification mechanics and engagement systems for Next.js applications.

Generate a complete gamification system for a Next.js App Router project.

Respond ONLY with a valid JSON object:
{
  "files": [
    { "path": "relative/path", "content": "...", "action": "create" }
  ],
  "summary": "Brief description",
  "setupInstructions": "Step-by-step setup instructions",
  "requiredEnvVars": ["VAR_NAME=description"],
  "schemaSQL": "SQL schema for gamification tables"
}

Always include:
- components/AchievementToast.tsx — Achievement unlocked toast notification
- components/Leaderboard.tsx — Top users leaderboard with avatars
- components/UserLevel.tsx — Level progress bar with XP display
- components/BadgeGrid.tsx — User achievement badges grid
- components/StreakCounter.tsx — Daily/weekly activity streak counter
- app/profile/achievements/page.tsx — User achievements profile page
- app/api/gamification/points/route.ts — Award points API
- app/api/gamification/badges/route.ts — Badge unlock API
- app/api/gamification/leaderboard/route.ts — Leaderboard data API
- lib/gamification/engine.ts — Core gamification logic (award, unlock, calculate)
- lib/gamification/rules.ts — Points rules and badge unlock conditions

Include level progression, XP system, daily streaks, and badge unlocking.

Return ONLY valid JSON, no markdown fences, no extra text.`;

export async function POST(req: Request): Promise<NextResponse> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing in environment" },
        { status: 500 }
      );
    }

    let body: GenerateGamificationRequest;
    try {
      body = await req.json() as GenerateGamificationRequest;
    } catch {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }
    const {
      appName = "My App",
      features = ["all"],
      realtimeLeaderboard = true,
    } = body;

    const selectedFeatures = features.includes("all")
      ? ["points", "badges", "leaderboard", "streaks", "levels", "rewards"]
      : features;

    const userPrompt = `Generate a complete gamification system for "${appName}".
Features: ${selectedFeatures.join(", ")}
Real-time leaderboard: ${realtimeLeaderboard}

Generate:
1. Achievement toast notification (components/AchievementToast.tsx)
2. Leaderboard component (components/Leaderboard.tsx)
3. User level/XP progress bar (components/UserLevel.tsx)
4. Badge grid display (components/BadgeGrid.tsx)
5. Streak counter (components/StreakCounter.tsx)
6. User achievements page (app/profile/achievements/page.tsx)
7. Points award API (app/api/gamification/points/route.ts)
8. Badge unlock API (app/api/gamification/badges/route.ts)
9. Leaderboard API (app/api/gamification/leaderboard/route.ts)
10. Gamification engine (lib/gamification/engine.ts)
11. Points rules and badge conditions (lib/gamification/rules.ts)
12. Database schema for points, badges, streaks (SQL)`;

    const response = await getClient().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      max_tokens: 8192,
      messages: [
        { role: "system", content: GAMIFICATION_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const text = response.choices?.[0]?.message?.content ?? "";

    let parsed: GenerateGamificationResponse;
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
