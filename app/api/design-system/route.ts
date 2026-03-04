// POST { description: string; mood: string }
// Returns DesignSystem JSON
import { NextResponse } from "next/server";
import { generateDesignSystem } from "@/lib/design/design-system";

export const runtime = "nodejs";

type Mood = "modern" | "playful" | "minimal" | "bold" | "elegant";
const VALID_MOODS: Mood[] = ["modern", "playful", "minimal", "bold", "elegant"];

export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json().catch(() => ({})) as { description?: string; mood?: string };
    const { description, mood } = body;
    if (!description) {
      return NextResponse.json({ error: "Missing description" }, { status: 400 });
    }
    const validMood: Mood = VALID_MOODS.includes(mood as Mood) ? (mood as Mood) : "modern";
    const system = await generateDesignSystem(description, validMood);
    return NextResponse.json(system);
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error)?.message ?? "Server error" }, { status: 500 });
  }
}
